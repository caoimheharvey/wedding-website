import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { PLANNING_PHASES } from "@/lib/planning/phases";
import type { PlanningPhaseId } from "@/lib/planning/types";

const MODEL = "claude-sonnet-5";
const VALID_PHASE_IDS = new Set(PLANNING_PHASES.map((phase) => phase.id));

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable");
  }
  return new Anthropic({ apiKey });
}

function parsePhaseId(raw: string): PlanningPhaseId | null {
  const match = raw.match(/"phaseId"\s*:\s*"([^"]+)"/) ?? raw.match(/\b([a-z_]+)\b/);
  const candidate = (match?.[1] ?? raw).trim() as PlanningPhaseId;
  return VALID_PHASE_IDS.has(candidate) ? candidate : null;
}

/** Suggest which planning checklist phase a new task belongs in. */
export async function suggestChecklistPhase(
  title: string,
  description?: string | null,
): Promise<PlanningPhaseId> {
  const phaseList = PLANNING_PHASES.map(
    (phase) => `- ${phase.id}: ${phase.label} — ${phase.description}`,
  ).join("\n");

  const client = getClient();
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 128,
    messages: [
      {
        role: "user",
        content: `You help plan a wedding on a timeline from about 2 years out to the wedding day.

Pick the single best planning phase for this checklist task. Reply with JSON only, no markdown:
{"phaseId":"<one of the ids below>"}

Phases:
${phaseList}

Task title: ${title}
${description?.trim() ? `Task notes: ${description.trim()}` : ""}`,
      },
    ],
  });

  const block = message.content.find((entry) => entry.type === "text");
  const text = block?.type === "text" ? block.text.trim() : "";
  return parsePhaseId(text) ?? "details";
}
