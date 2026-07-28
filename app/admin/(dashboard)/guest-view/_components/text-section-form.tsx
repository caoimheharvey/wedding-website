"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { createTextSection, updateTextSection, type GuestViewSectionActionState } from "@/lib/guest-view/actions";
import { aiRewriteSection, aiTranslateSection } from "@/lib/guest-view/ai-actions";
import { initialColumnTexts, padColumnTexts } from "@/lib/guest-view/columns";
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

  const [columnCount, setColumnCount] = useState(section?.columnCount ?? 1);
  const [bodyEn, setBodyEn] = useState(section?.body.en ?? "");
  const [bodyFr, setBodyFr] = useState(section?.body.fr ?? "");
  const [bodyZh, setBodyZh] = useState(section?.body.zh ?? "");
  const [bodyEnCols, setBodyEnCols] = useState<string[]>(() =>
    initialColumnTexts(section, "en", section?.columnCount ?? 1),
  );
  const [bodyFrCols, setBodyFrCols] = useState<string[]>(() =>
    initialColumnTexts(section, "fr", section?.columnCount ?? 1),
  );
  const [bodyZhCols, setBodyZhCols] = useState<string[]>(() =>
    initialColumnTexts(section, "zh", section?.columnCount ?? 1),
  );
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

  function handleColumnCountChange(nextCount: number) {
    setColumnCount(nextCount);
    setBodyEnCols((prev) => padColumnTexts(prev.length > 0 ? prev : [bodyEn], nextCount));
    setBodyFrCols((prev) => padColumnTexts(prev.length > 0 ? prev : [bodyFr], nextCount));
    setBodyZhCols((prev) => padColumnTexts(prev.length > 0 ? prev : [bodyZh], nextCount));
  }

  function handleTranslateTitles() {
    if (!titleEn.trim()) {
      setAiMessage("Write the English title first.");
      return;
    }
    startAiTransition(async () => {
      const [frResult, zhResult] = await Promise.all([
        aiTranslateSection(titleEn, "fr"),
        aiTranslateSection(titleEn, "zh"),
      ]);
      if (frResult.text) setTitleFr(frResult.text);
      if (zhResult.text) setTitleZh(zhResult.text);
      if (frResult.text || zhResult.text) {
        setAiMessage(null);
      } else {
        setAiMessage(frResult.message ?? zhResult.message ?? "Translation failed.");
      }
    });
  }

  function handleTranslateBody() {
    if (columnCount === 1) {
      if (!bodyEn.trim()) {
        setAiMessage("Write the English text first.");
        return;
      }
      startAiTransition(async () => {
        const [frResult, zhResult] = await Promise.all([
          aiTranslateSection(bodyEn, "fr"),
          aiTranslateSection(bodyEn, "zh"),
        ]);
        if (frResult.text) setBodyFr(frResult.text);
        if (zhResult.text) setBodyZh(zhResult.text);
        if (frResult.text || zhResult.text) {
          setAiMessage(null);
        } else {
          setAiMessage(frResult.message ?? zhResult.message ?? "Translation failed.");
        }
      });
      return;
    }

    const englishColumns = bodyEnCols.map((value) => value.trim()).filter(Boolean);
    if (englishColumns.length === 0) {
      setAiMessage("Write English text in at least one column first.");
      return;
    }

    startAiTransition(async () => {
      const frColumns = [...bodyFrCols];
      const zhColumns = [...bodyZhCols];

      await Promise.all(
        bodyEnCols.map(async (english, index) => {
          if (!english.trim()) return;
          const [frResult, zhResult] = await Promise.all([
            aiTranslateSection(english, "fr"),
            aiTranslateSection(english, "zh"),
          ]);
          if (frResult.text) frColumns[index] = frResult.text;
          if (zhResult.text) zhColumns[index] = zhResult.text;
        }),
      );

      setBodyFrCols(padColumnTexts(frColumns, columnCount));
      setBodyZhCols(padColumnTexts(zhColumns, columnCount));
      setAiMessage(null);
    });
  }

  function handleRewrite() {
    const source = columnCount === 1 ? bodyEn : bodyEnCols[0] ?? "";
    if (!source.trim()) {
      setAiMessage("Write some English text first.");
      return;
    }
    startAiTransition(async () => {
      const result = await aiRewriteSection(
        source,
        "Make this warmer and more concise, keeping it roughly the same length.",
      );
      if (result.text) {
        if (columnCount === 1) {
          setBodyEn(result.text);
        } else {
          setBodyEnCols((prev) => {
            const next = [...prev];
            next[0] = result.text ?? next[0];
            return next;
          });
        }
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
        onClick={handleTranslateTitles}
        disabled={aiPending}
        className="self-start text-xs font-medium text-aegean hover:underline disabled:opacity-50"
      >
        {aiPending ? "Asking AI…" : "AI: translate title to French & Mandarin"}
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
        <select
          name="columnCount"
          value={columnCount}
          onChange={(event) => handleColumnCountChange(Number(event.target.value))}
          className="input w-auto"
        >
          {[1, 2, 3, 4].map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>
        <span className="text-xs font-normal text-foreground/50">
          {columnCount === 1
            ? "Single column of text."
            : "Each column has its own text fields below."}
        </span>
      </label>

      {columnCount === 1 ? (
        <>
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
        </>
      ) : (
        <div className="flex flex-col gap-4">
          {Array.from({ length: columnCount }, (_, columnIndex) => (
            <div
              key={columnIndex}
              className="flex flex-col gap-2 rounded-md border border-border p-3"
            >
              <p className="text-xs font-medium tracking-wide text-foreground/50 uppercase">
                Column {columnIndex + 1}
              </p>
              <label className="flex flex-col gap-1 text-sm text-ink">
                English
                <textarea
                  name="bodyEnColumn"
                  value={bodyEnCols[columnIndex] ?? ""}
                  onChange={(event) =>
                    setBodyEnCols((prev) => {
                      const next = [...prev];
                      next[columnIndex] = event.target.value;
                      return next;
                    })
                  }
                  rows={3}
                  required={columnIndex === 0}
                  className="input"
                />
              </label>
              {columnIndex === 0 && state?.errors?.bodyEn && (
                <span className="text-xs text-terracotta">{state.errors.bodyEn[0]}</span>
              )}
              {columnIndex === 0 && (
                <button
                  type="button"
                  onClick={handleRewrite}
                  disabled={aiPending}
                  className="self-start text-xs font-medium text-aegean hover:underline disabled:opacity-50"
                >
                  {aiPending ? "Asking AI…" : "AI: tighten column 1 wording"}
                </button>
              )}
              <label className="flex flex-col gap-1 text-sm text-ink">
                French
                <textarea
                  name="bodyFrColumn"
                  value={bodyFrCols[columnIndex] ?? ""}
                  onChange={(event) =>
                    setBodyFrCols((prev) => {
                      const next = [...prev];
                      next[columnIndex] = event.target.value;
                      return next;
                    })
                  }
                  rows={3}
                  className="input"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-ink">
                Mandarin
                <textarea
                  name="bodyZhColumn"
                  value={bodyZhCols[columnIndex] ?? ""}
                  onChange={(event) =>
                    setBodyZhCols((prev) => {
                      const next = [...prev];
                      next[columnIndex] = event.target.value;
                      return next;
                    })
                  }
                  rows={3}
                  className="input"
                />
              </label>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleTranslateBody}
        disabled={aiPending}
        className="self-start text-xs font-medium text-aegean hover:underline disabled:opacity-50"
      >
        {aiPending ? "Asking AI…" : "AI: translate body to French & Mandarin"}
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
