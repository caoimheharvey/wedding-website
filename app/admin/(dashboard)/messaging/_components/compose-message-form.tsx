"use client";

import { useActionState, useState, useTransition } from "react";
import type { Guest } from "@/lib/guests/types";
import type { EffectiveRsvpStatus } from "@/lib/rsvp/status";
import { createAndSendCampaign, type ComposeMessageState } from "@/lib/messaging/actions";
import { aiTranslateCampaign } from "@/lib/messaging/ai-actions";
import { RecipientPicker } from "./recipient-picker";

const initialState: ComposeMessageState = undefined;

type LanguageTab = "en" | "fr" | "zh";

const LANGUAGE_TAB_LABELS: Record<LanguageTab, string> = { en: "English", fr: "French", zh: "Mandarin" };

function toLocalDateTimeInputMin(): string {
  const now = new Date();
  now.setSeconds(0, 0);
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function ComposeMessageForm({
  guests,
  effectiveStatusById,
}: {
  guests: Guest[];
  effectiveStatusById: Record<string, EffectiveRsvpStatus>;
}) {
  const [state, formAction, isPending] = useActionState(createAndSendCampaign, initialState);
  const [subjectEn, setSubjectEn] = useState("");
  const [htmlEn, setHtmlEn] = useState("");
  const [subjectFr, setSubjectFr] = useState("");
  const [htmlFr, setHtmlFr] = useState("");
  const [subjectZh, setSubjectZh] = useState("");
  const [htmlZh, setHtmlZh] = useState("");
  const [activeTab, setActiveTab] = useState<LanguageTab>("en");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scheduledAtLocal, setScheduledAtLocal] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [isTranslating, startTranslating] = useTransition();
  const [translateMessage, setTranslateMessage] = useState<string | null>(null);

  // Adjust state during render (React's recommended alternative to an
  // effect here) rather than after commit, avoiding an extra render tick.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.message?.startsWith("Sent to") || state?.message?.startsWith("Scheduled to send")) {
      setSubjectEn("");
      setHtmlEn("");
      setSubjectFr("");
      setHtmlFr("");
      setSubjectZh("");
      setHtmlZh("");
      setSelected(new Set());
      setScheduledAtLocal("");
    }
  }

  const scheduledAtIso = scheduledAtLocal ? new Date(scheduledAtLocal).toISOString() : "";
  const canReview = subjectEn.trim().length > 0 && htmlEn.trim().length > 0 && selected.size > 0;

  const fieldsByTab: Record<LanguageTab, { subject: string; setSubject: (v: string) => void; html: string; setHtml: (v: string) => void }> = {
    en: { subject: subjectEn, setSubject: setSubjectEn, html: htmlEn, setHtml: setHtmlEn },
    fr: { subject: subjectFr, setSubject: setSubjectFr, html: htmlFr, setHtml: setHtmlFr },
    zh: { subject: subjectZh, setSubject: setSubjectZh, html: htmlZh, setHtml: setHtmlZh },
  };
  const active = fieldsByTab[activeTab];

  function handleTranslate() {
    if (!subjectEn.trim() || !htmlEn.trim()) {
      setTranslateMessage("Write the English subject and HTML first.");
      return;
    }
    startTranslating(async () => {
      const [frResult, zhResult] = await Promise.all([
        aiTranslateCampaign(subjectEn, htmlEn, "fr"),
        aiTranslateCampaign(subjectEn, htmlEn, "zh"),
      ]);
      if (frResult.subject) setSubjectFr(frResult.subject);
      if (frResult.html) setHtmlFr(frResult.html);
      if (zhResult.subject) setSubjectZh(zhResult.subject);
      if (zhResult.html) setHtmlZh(zhResult.html);
      const failures = [frResult.message, zhResult.message].filter(Boolean);
      setTranslateMessage(failures.length > 0 ? failures.join(" ") : null);
    });
  }

  return (
    <form
      action={formAction}
      className="glass-card flex flex-col gap-5 p-4"
      onSubmit={() => setConfirming(false)}
    >
      <div>
        <p className="text-sm font-medium text-ink">Email content</p>
        <p className="text-xs text-foreground/60">
          English is required. French and Mandarin are optional — a recipient without a translated
          version gets the English email instead.
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-border">
        {(Object.keys(LANGUAGE_TAB_LABELS) as LanguageTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              tab === activeTab
                ? "border-b-2 border-aegean px-3 py-2 text-sm font-medium text-aegean"
                : "px-3 py-2 text-sm text-foreground/50 hover:text-aegean"
            }
          >
            {LANGUAGE_TAB_LABELS[tab]}
            {tab !== "en" && (fieldsByTab[tab].subject || fieldsByTab[tab].html) ? " ✓" : ""}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="subject-active" className="text-sm font-medium text-ink">
          Subject — {LANGUAGE_TAB_LABELS[activeTab]}
        </label>
        <input
          id="subject-active"
          type="text"
          value={active.subject}
          onChange={(event) => active.setSubject(event.target.value)}
          className="input"
          placeholder="Subject line"
        />
      </div>
      <input type="hidden" name="subjectEn" value={subjectEn} />
      <input type="hidden" name="subjectFr" value={subjectFr} />
      <input type="hidden" name="subjectZh" value={subjectZh} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="html-active" className="text-sm font-medium text-ink">
            Email HTML — {LANGUAGE_TAB_LABELS[activeTab]}
          </label>
          <textarea
            id="html-active"
            value={active.html}
            onChange={(event) => active.setHtml(event.target.value)}
            className="input h-64 font-mono text-xs"
            placeholder="Paste the HTML exported from Canva here…"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-ink">Preview — {LANGUAGE_TAB_LABELS[activeTab]}</span>
          <div className="h-64 overflow-hidden rounded-md border border-border bg-whitewash">
            {active.html.trim() ? (
              <iframe
                title="Email preview"
                srcDoc={active.html}
                sandbox="allow-same-origin"
                className="h-full w-full"
              />
            ) : (
              <p className="p-3 text-sm text-foreground/50">Paste HTML to see a preview.</p>
            )}
          </div>
        </div>
      </div>
      <input type="hidden" name="htmlEn" value={htmlEn} />
      <input type="hidden" name="htmlFr" value={htmlFr} />
      <input type="hidden" name="htmlZh" value={htmlZh} />

      <div>
        <button
          type="button"
          onClick={handleTranslate}
          disabled={isTranslating}
          className="text-xs font-medium text-aegean hover:underline disabled:opacity-50"
        >
          {isTranslating ? "Asking AI…" : "AI: translate to French & Mandarin"}
        </button>
        {translateMessage && <p className="mt-1 text-xs text-terracotta">{translateMessage}</p>}
      </div>

      <RecipientPicker
        guests={guests}
        effectiveStatusById={effectiveStatusById}
        selected={selected}
        onChange={setSelected}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="scheduledAtLocal" className="text-sm font-medium text-ink">
          Send later (optional)
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="scheduledAtLocal"
            type="datetime-local"
            value={scheduledAtLocal}
            min={toLocalDateTimeInputMin()}
            onChange={(event) => setScheduledAtLocal(event.target.value)}
            className="input w-auto"
          />
          {scheduledAtLocal && (
            <button
              type="button"
              onClick={() => setScheduledAtLocal("")}
              className="text-xs font-medium text-foreground/40 hover:text-aegean"
            >
              Send now instead
            </button>
          )}
        </div>
        <p className="text-xs text-foreground/50">
          Leave blank to send as soon as you confirm.
        </p>
        <input type="hidden" name="scheduledAt" value={scheduledAtIso} />
      </div>

      {!confirming ? (
        <button
          type="button"
          disabled={!canReview}
          onClick={() => setConfirming(true)}
          className="self-start rounded-full bg-aegean px-5 py-2 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
        >
          Review &amp; {scheduledAtLocal ? "schedule" : "send"}
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-sand/40 px-4 py-3">
          <span className="text-sm font-medium text-ink">
            {scheduledAtLocal
              ? `Schedule "${subjectEn}" to send to ${selected.size} recipient${selected.size === 1 ? "" : "s"} at ${new Date(scheduledAtIso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}?`
              : `Send "${subjectEn}" to ${selected.size} recipient${selected.size === 1 ? "" : "s"}?`}
          </span>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light disabled:opacity-50"
          >
            {isPending ? "Sending…" : scheduledAtLocal ? "Schedule send" : "Confirm send"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-sm text-foreground/60 hover:underline"
          >
            Cancel
          </button>
        </div>
      )}

      {state?.message && <p className="text-sm text-foreground/70">{state.message}</p>}
      {state?.errors && (
        <ul className="text-sm text-terracotta">
          {Object.entries(state.errors).map(([field, messages]) =>
            messages?.map((message) => <li key={`${field}-${message}`}>{message}</li>),
          )}
        </ul>
      )}
    </form>
  );
}
