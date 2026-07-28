"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { createTextSection, updateTextSection, type GuestViewSectionActionState } from "@/lib/guest-view/actions";
import { aiRewriteSection, aiTranslateSection } from "@/lib/guest-view/ai-actions";
import { WEDDING_PARTY_ROLE_LABELS, WEDDING_PARTY_ROLES } from "@/lib/guests/types";
import type { GuestViewSection } from "@/lib/guest-view/types";

const initialState: GuestViewSectionActionState = undefined;

export function TextSectionForm({
  section,
  onDone,
}: {
  section?: GuestViewSection;
  onDone?: () => void;
}) {
  const action = section ? updateTextSection.bind(null, section.id) : createTextSection;
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [bodyEn, setBodyEn] = useState(section?.body.en ?? "");
  const [bodyFr, setBodyFr] = useState(section?.body.fr ?? "");
  const [bodyZh, setBodyZh] = useState(section?.body.zh ?? "");
  const [titleEn, setTitleEn] = useState(section?.titles.en ?? "");
  const [titleFr, setTitleFr] = useState(section?.titles.fr ?? "");
  const [titleZh, setTitleZh] = useState(section?.titles.zh ?? "");
  const [aiPending, startAiTransition] = useTransition();
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  useEffect(() => {
    if (state?.message === "Section added." || state?.message === "Section updated.") {
      onDone?.();
    }
  }, [state, onDone]);

  function handleTranslate(target: "fr" | "zh", source: "body" | "title") {
    const english = source === "body" ? bodyEn : titleEn;
    if (!english.trim()) {
      setAiMessage(`Write the English ${source === "body" ? "text" : "title"} first.`);
      return;
    }
    startAiTransition(async () => {
      const result = await aiTranslateSection(english, target);
      if (result.text) {
        if (source === "body") {
          if (target === "fr") setBodyFr(result.text);
          else setBodyZh(result.text);
        } else if (target === "fr") {
          setTitleFr(result.text);
        } else {
          setTitleZh(result.text);
        }
        setAiMessage(null);
      } else {
        setAiMessage(result.message ?? "Translation failed.");
      }
    });
  }

  function handleRewrite() {
    if (!bodyEn.trim()) {
      setAiMessage("Write some text first.");
      return;
    }
    startAiTransition(async () => {
      const result = await aiRewriteSection(
        bodyEn,
        "Make this warmer and more concise, keeping it roughly the same length.",
      );
      if (result.text) {
        setBodyEn(result.text);
        setAiMessage(null);
      } else {
        setAiMessage(result.message ?? "Rewrite failed.");
      }
    });
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <label className="flex flex-col gap-1 text-sm text-ink">
        Section title — English (optional)
        <input
          name="titleEn"
          value={titleEn}
          onChange={(event) => setTitleEn(event.target.value)}
          className="input"
          placeholder="e.g. Ceremony details"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-ink">
        Section title — French
        <input
          name="titleFr"
          value={titleFr}
          onChange={(event) => setTitleFr(event.target.value)}
          className="input"
        />
      </label>
      <button
        type="button"
        onClick={() => handleTranslate("fr", "title")}
        disabled={aiPending}
        className="self-start text-xs font-medium text-aegean hover:underline disabled:opacity-50"
      >
        {aiPending ? "Asking AI…" : "AI: translate title from English"}
      </button>

      <label className="flex flex-col gap-1 text-sm text-ink">
        Section title — Mandarin
        <input
          name="titleZh"
          value={titleZh}
          onChange={(event) => setTitleZh(event.target.value)}
          className="input"
        />
      </label>
      <button
        type="button"
        onClick={() => handleTranslate("zh", "title")}
        disabled={aiPending}
        className="self-start text-xs font-medium text-aegean hover:underline disabled:opacity-50"
      >
        {aiPending ? "Asking AI…" : "AI: translate title from English"}
      </button>

      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm text-ink">Visible to</legend>
        <div className="flex flex-wrap gap-3">
          {WEDDING_PARTY_ROLES.map((role) => (
            <label key={role} className="flex items-center gap-1 text-xs text-ink">
              <input
                type="checkbox"
                name="visibleToRoles"
                value={role}
                defaultChecked={section?.visibleToRoles.includes(role)}
                className="h-3.5 w-3.5 rounded border-border text-aegean focus:ring-aegean"
              />
              {WEDDING_PARTY_ROLE_LABELS[role]}
            </label>
          ))}
        </div>
        <span className="text-xs text-foreground/50">Leave all unchecked to show everyone.</span>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm text-ink">
        Columns
        <select name="columnCount" defaultValue={section?.columnCount ?? 1} className="input w-auto">
          {[1, 2, 3, 4].map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>
        <span className="text-xs font-normal text-foreground/50">
          More than 1 lays the text out newspaper-style once there&apos;s enough of it.
        </span>
      </label>

      <label className="flex flex-col gap-1 text-sm text-ink">
        English
        <textarea
          name="bodyEn"
          value={bodyEn}
          onChange={(event) => setBodyEn(event.target.value)}
          rows={4}
          required
          className="input"
        />
      </label>
      {state?.errors?.bodyEn && (
        <span className="text-xs text-terracotta">{state.errors.bodyEn[0]}</span>
      )}
      <button
        type="button"
        onClick={handleRewrite}
        disabled={aiPending}
        className="self-start text-xs font-medium text-aegean hover:underline disabled:opacity-50"
      >
        {aiPending ? "Asking AI…" : "AI: tighten wording"}
      </button>

      <label className="flex flex-col gap-1 text-sm text-ink">
        French
        <textarea
          name="bodyFr"
          value={bodyFr}
          onChange={(event) => setBodyFr(event.target.value)}
          rows={4}
          className="input"
        />
      </label>
      <button
        type="button"
        onClick={() => handleTranslate("fr", "body")}
        disabled={aiPending}
        className="self-start text-xs font-medium text-aegean hover:underline disabled:opacity-50"
      >
        {aiPending ? "Asking AI…" : "AI: translate from English"}
      </button>

      <label className="flex flex-col gap-1 text-sm text-ink">
        Mandarin
        <textarea
          name="bodyZh"
          value={bodyZh}
          onChange={(event) => setBodyZh(event.target.value)}
          rows={4}
          className="input"
        />
      </label>
      <button
        type="button"
        onClick={() => handleTranslate("zh", "body")}
        disabled={aiPending}
        className="self-start text-xs font-medium text-aegean hover:underline disabled:opacity-50"
      >
        {aiPending ? "Asking AI…" : "AI: translate from English"}
      </button>

      {aiMessage && <p className="text-xs text-terracotta">{aiMessage}</p>}
      {state?.message && <p className="text-sm text-foreground/60">{state.message}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-aegean px-5 py-2 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
        >
          {isPending ? "Saving…" : section ? "Save changes" : "Add section"}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="text-sm text-foreground/60 hover:underline"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
