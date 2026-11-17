"use client";

import { useActionState, useState, useTransition } from "react";
import type { Guest } from "@/lib/guests/types";
import type { EffectiveRsvpStatus } from "@/lib/rsvp/status";
import { createAndSendCampaign, type ComposeMessageState } from "@/lib/messaging/actions";
import { aiTranslateCampaign, aiTranslateSms } from "@/lib/messaging/ai-actions";
import { CHANNEL_LABELS, type MessageChannel } from "@/lib/messaging/types";
import { smsLength } from "@/lib/sms/segments";
import { FIRST_NAME_PLACEHOLDER, hasLinkPlaceholder, LINK_PLACEHOLDER } from "@/lib/messaging/personalize";
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
  linkLength,
}: {
  /** How long a guest's personal link will be, so the text counter can allow for it. */
  linkLength: number;
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
  const [channel, setChannel] = useState<MessageChannel>("email");
  const [bodyEn, setBodyEn] = useState("");
  const [bodyFr, setBodyFr] = useState("");
  const [bodyZh, setBodyZh] = useState("");
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
      setBodyEn("");
      setBodyFr("");
      setBodyZh("");
      setSelected(new Set());
      setScheduledAtLocal("");
    }
  }

  const scheduledAtIso = scheduledAtLocal ? new Date(scheduledAtLocal).toISOString() : "";
  const isSms = channel === "sms";
  const canReview =
    selected.size > 0 && (isSms ? bodyEn.trim().length > 0 : subjectEn.trim().length > 0 && htmlEn.trim().length > 0);

  const bodyByTab: Record<LanguageTab, { body: string; setBody: (v: string) => void }> = {
    en: { body: bodyEn, setBody: setBodyEn },
    fr: { body: bodyFr, setBody: setBodyFr },
    zh: { body: bodyZh, setBody: setBodyZh },
  };
  const activeBody = bodyByTab[activeTab];
  const activeLength = smsLength(activeBody.body.replaceAll(LINK_PLACEHOLDER, "x".repeat(linkLength)).replaceAll(FIRST_NAME_PLACEHOLDER, "x".repeat(8)));
  const missingLink = isSms ? !hasLinkPlaceholder(bodyEn) : !hasLinkPlaceholder(htmlEn);

  function switchChannel(next: MessageChannel) {
    if (next === channel) return;
    setChannel(next);
    // Each channel can reach a different set of guests, so start the selection afresh.
    setSelected(new Set());
    setConfirming(false);
    setTranslateMessage(null);
  }

  const fieldsByTab: Record<LanguageTab, { subject: string; setSubject: (v: string) => void; html: string; setHtml: (v: string) => void }> = {
    en: { subject: subjectEn, setSubject: setSubjectEn, html: htmlEn, setHtml: setHtmlEn },
    fr: { subject: subjectFr, setSubject: setSubjectFr, html: htmlFr, setHtml: setHtmlFr },
    zh: { subject: subjectZh, setSubject: setSubjectZh, html: htmlZh, setHtml: setHtmlZh },
  };
  const active = fieldsByTab[activeTab];

  function handleTranslate() {
    if (isSms) {
      if (!bodyEn.trim()) {
        setTranslateMessage("Write the English text first.");
        return;
      }
      startTranslating(async () => {
        const [frResult, zhResult] = await Promise.all([
          aiTranslateSms(bodyEn, "fr"),
          aiTranslateSms(bodyEn, "zh"),
        ]);
        if (frResult.body) setBodyFr(frResult.body);
        if (zhResult.body) setBodyZh(zhResult.body);
        const failures = [frResult.message, zhResult.message].filter(Boolean);
        setTranslateMessage(failures.length > 0 ? failures.join(" ") : null);
      });
      return;
    }
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
      <input type="hidden" name="channel" value={channel} />
      <div className="flex gap-2">
        {(Object.keys(CHANNEL_LABELS) as MessageChannel[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => switchChannel(option)}
            aria-pressed={channel === option}
            className={
              channel === option
                ? "rounded-full bg-aegean px-4 py-1.5 text-sm font-medium text-whitewash"
                : "rounded-full border border-aegean px-4 py-1.5 text-sm font-medium text-aegean hover:bg-aegean/5"
            }
          >
            {CHANNEL_LABELS[option]}
          </button>
        ))}
      </div>

      <div>
        <p className="text-sm font-medium text-ink">{isSms ? "Text message" : "Email content"}</p>
        <p className="text-xs text-foreground/60">
          {isSms
            ? "English is required. French and Mandarin are optional — a recipient without a translated version gets the English text instead."
            : "English is required. French and Mandarin are optional — a recipient without a translated version gets the English email instead."}
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
            {tab !== "en" && (isSms ? bodyByTab[tab].body : fieldsByTab[tab].subject || fieldsByTab[tab].html) ? " ✓" : ""}
          </button>
        ))}
      </div>

      {isSms ? (
        <div className="flex flex-col gap-1">
          <label htmlFor="body-active" className="text-sm font-medium text-ink">
            Text — {LANGUAGE_TAB_LABELS[activeTab]}
          </label>
          <textarea
            id="body-active"
            value={activeBody.body}
            onChange={(event) => activeBody.setBody(event.target.value)}
            className="input h-40"
            placeholder="Write the text message…"
          />
          <p className="text-xs text-foreground/50">
            {activeLength.units} character{activeLength.units === 1 ? "" : "s"} ·{" "}
            {activeLength.segments} message{activeLength.segments === 1 ? "" : "s"} per recipient
            {activeLength.gsm ? "" : " (non-standard characters, so fewer fit in each)"}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {[FIRST_NAME_PLACEHOLDER, LINK_PLACEHOLDER].map((placeholder) => (
              <button
                key={placeholder}
                type="button"
                onClick={() =>
                  activeBody.setBody(
                    `${activeBody.body}${activeBody.body && !activeBody.body.endsWith(" ") ? " " : ""}${placeholder}`,
                  )
                }
                className="text-xs font-medium text-aegean hover:underline"
              >
                Add {placeholder === LINK_PLACEHOLDER ? "each guest's personal link" : "the guest's first name"} ({placeholder})
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
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
          <p className="text-xs text-foreground/50">
            Use <code>{LINK_PLACEHOLDER}</code> as a button&apos;s or link&apos;s address and each guest gets their own
            link, which signs them in when they open it. <code>{FIRST_NAME_PLACEHOLDER}</code> becomes the guest&apos;s
            first name.
          </p>
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
        </>
      )}
      {isSms && (
        <>
          <input type="hidden" name="bodyEn" value={bodyEn} />
          <input type="hidden" name="bodyFr" value={bodyFr} />
          <input type="hidden" name="bodyZh" value={bodyZh} />
        </>
      )}

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
        channel={channel}
        guests={guests}
        effectiveStatusById={effectiveStatusById}
        selected={selected}
        onChange={setSelected}
      />

      {missingLink && (
        <p className="rounded-md bg-terracotta/10 px-3 py-2 text-xs text-terracotta">
          There&apos;s no <code>{LINK_PLACEHOLDER}</code> in the English {isSms ? "text" : "email"}, so guests won&apos;t
          get a personal sign-in link and will have to sign in with their name.
        </p>
      )}

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
          {isSms && " Texts can be scheduled from 15 minutes to 35 days ahead."}
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
              ? `Schedule ${isSms ? "this text" : `"${subjectEn}"`} to send to ${selected.size} recipient${selected.size === 1 ? "" : "s"} at ${new Date(scheduledAtIso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}?`
              : `Send ${isSms ? "this text" : `"${subjectEn}"`} to ${selected.size} recipient${selected.size === 1 ? "" : "s"}?`}
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
