import {
  INVITED_BY_LABELS,
  PREFERRED_LANGUAGE_LABELS,
  RELATIONSHIP_PRIORITY_LABELS,
  type GuestWithPlusOnes,
} from "@/lib/guests/types";
import { EFFECTIVE_RSVP_STATUS_LABELS, type EffectiveRsvpStatus } from "@/lib/rsvp/status";

interface Segment {
  label: string;
  count: number;
  barClass: string;
  dotClass: string;
}

function CountCard({ title, value, hint }: { title: string; value: number; hint?: string }) {
  return (
    <div className="flex flex-col gap-2 glass-card p-3">
      <p className="text-xs font-medium tracking-wide text-foreground/50 uppercase">{title}</p>
      <p className="font-display text-2xl text-ink">{value}</p>
      {hint && <p className="text-xs text-foreground/50">{hint}</p>}
    </div>
  );
}

function StatCard({ title, segments }: { title: string; segments: Segment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);
  const nonEmpty = segments.filter((segment) => segment.count > 0);

  return (
    <div className="flex flex-col gap-2 glass-card p-3">
      <p className="text-xs font-medium tracking-wide text-foreground/50 uppercase">{title}</p>
      {total === 0 ? (
        <p className="text-xs text-foreground/40">No guests yet</p>
      ) : (
        <>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-sand">
            {nonEmpty.map((segment) => (
              <div
                key={segment.label}
                title={`${segment.label}: ${segment.count}`}
                className={segment.barClass}
                style={{ width: `${(segment.count / total) * 100}%` }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {nonEmpty.map((segment) => (
              <span key={segment.label} className="flex items-center gap-1 text-xs text-foreground/70">
                <span className={`h-2 w-2 rounded-full ${segment.dotClass}`} />
                {segment.label} {segment.count}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function GuestStats({
  guests,
  effectiveStatusById,
  childCount,
}: {
  guests: GuestWithPlusOnes[];
  effectiveStatusById: Record<string, EffectiveRsvpStatus>;
  /** Total children added across all guests — omit to hide the children stat card. */
  childCount?: number;
}) {
  const all = guests.flatMap((guest) => [guest, ...guest.plusOnes]);

  const rsvpCounts: Record<EffectiveRsvpStatus, number> = {
    invited: 0,
    yes: 0,
    no: 0,
    deadline_missed: 0,
  };
  const languageCounts: Record<string, number> = {};
  const priorityCounts: Record<number, number> = {};
  const invitedByCounts: Record<string, number> = {};
  let plusOneAllowedCount = 0;
  let childrenAllowedCount = 0;

  for (const guest of all) {
    const status = effectiveStatusById[guest.id] ?? "invited";
    rsvpCounts[status]++;
    languageCounts[guest.preferredLanguage] = (languageCounts[guest.preferredLanguage] ?? 0) + 1;
    priorityCounts[guest.relationshipPriority] = (priorityCounts[guest.relationshipPriority] ?? 0) + 1;
    invitedByCounts[guest.invitedBy] = (invitedByCounts[guest.invitedBy] ?? 0) + 1;
    if (guest.plusOneAllowed) plusOneAllowedCount++;
    if (guest.childrenAllowed) childrenAllowedCount++;
  }

  const rsvpBar: Record<EffectiveRsvpStatus, { bar: string; dot: string }> = {
    invited: { bar: "bg-ink/20", dot: "bg-ink/30" },
    yes: { bar: "bg-olive", dot: "bg-olive" },
    no: { bar: "bg-terracotta", dot: "bg-terracotta" },
    deadline_missed: { bar: "bg-gold", dot: "bg-gold" },
  };
  const priorityBar: Record<number, { bar: string; dot: string }> = {
    1: { bar: "bg-terracotta", dot: "bg-terracotta" },
    2: { bar: "bg-gold", dot: "bg-gold" },
    3: { bar: "bg-olive", dot: "bg-olive" },
    4: { bar: "bg-aegean", dot: "bg-aegean" },
    5: { bar: "bg-ink/30", dot: "bg-ink/30" },
  };
  const invitedByBar: Record<string, { bar: string; dot: string }> = {
    alexandre: { bar: "bg-aegean", dot: "bg-aegean" },
    caoimhe: { bar: "bg-terracotta", dot: "bg-terracotta" },
    joint: { bar: "bg-gold", dot: "bg-gold" },
  };
  const languageBar: Record<string, { bar: string; dot: string }> = {
    en: { bar: "bg-aegean", dot: "bg-aegean" },
    fr: { bar: "bg-terracotta", dot: "bg-terracotta" },
    zh: { bar: "bg-olive", dot: "bg-olive" },
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        title="RSVP status"
        segments={(Object.keys(rsvpCounts) as EffectiveRsvpStatus[]).map((status) => ({
          label: EFFECTIVE_RSVP_STATUS_LABELS[status],
          count: rsvpCounts[status],
          barClass: rsvpBar[status].bar,
          dotClass: rsvpBar[status].dot,
        }))}
      />
      <StatCard
        title="Language"
        segments={Object.entries(languageCounts).map(([code, count]) => ({
          label: PREFERRED_LANGUAGE_LABELS[code as keyof typeof PREFERRED_LANGUAGE_LABELS],
          count,
          barClass: (languageBar[code] ?? languageBar.en).bar,
          dotClass: (languageBar[code] ?? languageBar.en).dot,
        }))}
      />
      <StatCard
        title="Priority"
        segments={Object.entries(priorityCounts).map(([priority, count]) => ({
          label: RELATIONSHIP_PRIORITY_LABELS[Number(priority) as keyof typeof RELATIONSHIP_PRIORITY_LABELS],
          count,
          barClass: priorityBar[Number(priority)].bar,
          dotClass: priorityBar[Number(priority)].dot,
        }))}
      />
      <StatCard
        title="Invited by"
        segments={Object.entries(invitedByCounts).map(([invitedBy, count]) => ({
          label: INVITED_BY_LABELS[invitedBy as keyof typeof INVITED_BY_LABELS],
          count,
          barClass: invitedByBar[invitedBy].bar,
          dotClass: invitedByBar[invitedBy].dot,
        }))}
      />
      <StatCard
        title="Plus-one granted"
        segments={[
          { label: "Granted", count: plusOneAllowedCount, barClass: "bg-aegean", dotClass: "bg-aegean" },
          {
            label: "Not granted",
            count: all.length - plusOneAllowedCount,
            barClass: "bg-ink/20",
            dotClass: "bg-ink/30",
          },
        ]}
      />
      <StatCard
        title="Children allowed"
        segments={[
          { label: "Allowed", count: childrenAllowedCount, barClass: "bg-terracotta", dotClass: "bg-terracotta" },
          {
            label: "Not set",
            count: all.length - childrenAllowedCount,
            barClass: "bg-ink/20",
            dotClass: "bg-ink/30",
          },
        ]}
      />
      {childCount !== undefined && (
        <CountCard
          title="Children added"
          value={childCount}
          hint={`Across ${childrenAllowedCount} guest(s) allowed to bring children`}
        />
      )}
    </div>
  );
}
