import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-5";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable");
  }
  return new Anthropic({ apiKey });
}

export interface GeneratedDestination {
  name: string;
  location: string | null;
  description: string | null;
  estimatedCost: number | null;
  guestCapacityNotes: string | null;
  travelNotes: string | null;
  pros: string | null;
  cons: string | null;
}

export interface GenerateDestinationsResult {
  /** One entry per requested candidate, in the same order. */
  destinations: GeneratedDestination[];
  /** Additional destinations the AI suggests that weren't in the candidate list. */
  suggestions: GeneratedDestination[];
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function normalizeDestination(raw: unknown): GeneratedDestination | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const name = asNullableString(record.name);
  if (!name) return null;
  return {
    name,
    location: asNullableString(record.location),
    description: asNullableString(record.description),
    estimatedCost: asNullableNumber(record.estimatedCost),
    guestCapacityNotes: asNullableString(record.guestCapacityNotes),
    travelNotes: asNullableString(record.travelNotes),
    pros: asNullableString(record.pros),
    cons: asNullableString(record.cons),
  };
}

/**
 * Pulls out the {...} object from the response text, tolerating any
 * preamble/trailing commentary or markdown fencing the model adds despite
 * being asked not to.
 */
function extractJsonObject(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return text;
  return text.slice(start, end + 1);
}

function parseGenerateResult(text: string): GenerateDestinationsResult {
  const cleaned = extractJsonObject(text.trim());

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Could not understand the AI's response — try again.");
  }

  const record = (parsed ?? {}) as Record<string, unknown>;
  const destinations = Array.isArray(record.destinations)
    ? record.destinations.map(normalizeDestination).filter((d): d is GeneratedDestination => d !== null)
    : [];
  const suggestions = Array.isArray(record.suggestions)
    ? record.suggestions.map(normalizeDestination).filter((d): d is GeneratedDestination => d !== null)
    : [];

  return { destinations, suggestions };
}

/**
 * Researches wedding-destination candidates against the couple's requirements
 * checklist, and suggests a few additional places worth considering.
 */
export async function generateDestinationDetails(
  candidates: string[],
  requirements: string[],
): Promise<GenerateDestinationsResult> {
  const requirementsList =
    requirements.length > 0
      ? requirements.map((requirement) => `- ${requirement}`).join("\n")
      : "(none specified — use your best judgement for a Mediterranean-region destination wedding)";
  const candidateList = candidates.map((candidate) => `- ${candidate}`).join("\n");

  const client = getClient();
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `You are helping a couple research destinations for their wedding (roughly 80-120 guests). They've given you a checklist of what matters to them and a list of candidate destinations to evaluate.

Requirements:
${requirementsList}

Candidate destinations to research:
${candidateList}

For each candidate, give a realistic, specific assessment of hosting a wedding there, weighing it against the requirements above — including a rough estimated total cost in EUR. Then suggest up to 3 additional destinations, not already in the candidate list, that would satisfy the requirements well — skip this if nothing strongly fits.

Respond with the JSON object below and nothing else — no preamble, no explanation, no markdown code fences, no text after it. Your entire reply must be valid JSON starting with { and ending with }, in exactly this shape:
{
  "destinations": [
    {
      "name": "string, e.g. \\"Bodrum\\"",
      "location": "string or null, e.g. \\"Turkey\\"",
      "description": "1-2 sentence description of the vibe and venue style",
      "estimatedCost": number or null,
      "guestCapacityNotes": "string or null",
      "travelNotes": "string or null — flight access and transfer times",
      "pros": "string or null — 1-2 sentences, referencing how it meets the requirements",
      "cons": "string or null — 1-2 sentences, referencing any requirements it falls short on"
    }
  ],
  "suggestions": [ /* same shape, for additional destinations not in the candidate list */ ]
}`,
      },
    ],
  });

  const block = message.content.find((entry) => entry.type === "text");
  const text = block?.type === "text" ? block.text : "";
  return parseGenerateResult(text);
}
