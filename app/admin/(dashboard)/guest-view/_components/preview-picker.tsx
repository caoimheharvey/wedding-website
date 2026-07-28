"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PREFERRED_LANGUAGE_LABELS, type Guest, type PreferredLanguage } from "@/lib/guests/types";
import { PREVIEW_PERSONAS, type PreviewRole } from "@/lib/guest-site/preview-personas";
import { GuestSearchResults } from "../../_components/guest-search-results";

export function PreviewPicker({ guests }: { guests: Guest[] }) {
  const [mode, setMode] = useState<"role" | "guest">("role");
  const [role, setRole] = useState<PreviewRole>(PREVIEW_PERSONAS[0].role);
  const [lang, setLang] = useState<PreferredLanguage>("en");
  const [query, setQuery] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return guests
      .filter((guest) => `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [guests, query]);

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h2 className="mb-1 font-display text-lg text-ink">Preview</h2>
      <p className="mb-3 text-xs text-foreground/50">
        Role and language are what actually determine what a guest is served — preview by those,
        or preview a specific guest to see their exact view.
      </p>
      <div className="mb-3 flex gap-4 text-sm">
        <button
          type="button"
          onClick={() => setMode("role")}
          className={
            mode === "role"
              ? "font-semibold text-aegean underline underline-offset-4"
              : "text-foreground/50 hover:text-aegean"
          }
        >
          Preview as role
        </button>
        <button
          type="button"
          onClick={() => setMode("guest")}
          className={
            mode === "guest"
              ? "font-semibold text-aegean underline underline-offset-4"
              : "text-foreground/50 hover:text-aegean"
          }
        >
          Preview as specific guest
        </button>
      </div>

      {mode === "role" ? (
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm text-ink">
            Role
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as PreviewRole)}
              className="input w-auto"
            >
              {PREVIEW_PERSONAS.map((persona) => (
                <option key={persona.role} value={persona.role}>
                  {persona.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink">
            Language
            <select
              value={lang}
              onChange={(event) => setLang(event.target.value as PreferredLanguage)}
              className="input w-auto"
            >
              {Object.entries(PREFERRED_LANGUAGE_LABELS).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <Link
            href={`/?role=${role}&lang=${lang}`}
            target="_blank"
            className="rounded-full bg-aegean px-4 py-2 text-sm font-medium text-whitewash transition hover:bg-aegean-dark"
          >
            Preview
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1 text-sm text-ink">
            Guest
            {selectedGuest ? (
              <div className="flex items-center gap-2 rounded-md border border-border bg-sand/40 px-3 py-2 text-sm">
                <span>
                  {selectedGuest.firstName} {selectedGuest.lastName}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedGuest(null)}
                  className="text-xs font-medium text-terracotta hover:underline"
                >
                  Clear
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search guests by name…"
                  className="input w-64 max-w-full"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <GuestSearchResults
                  className="w-64 max-w-full"
                  matches={matches}
                  onSelect={(guest) => {
                    setSelectedGuest(guest);
                    setQuery("");
                  }}
                />
              </div>
            )}
          </div>
          {selectedGuest ? (
            <Link
              href={`/guest/${selectedGuest.id}`}
              target="_blank"
              className="rounded-full bg-aegean px-4 py-2 text-sm font-medium text-whitewash transition hover:bg-aegean-dark"
            >
              Preview
            </Link>
          ) : (
            <span className="rounded-full bg-sand px-4 py-2 text-sm font-medium text-foreground/40">
              Preview
            </span>
          )}
          <p className="w-full text-xs text-foreground/50">
            Shows exactly what this guest would see, in their own language.
          </p>
        </div>
      )}
    </div>
  );
}
