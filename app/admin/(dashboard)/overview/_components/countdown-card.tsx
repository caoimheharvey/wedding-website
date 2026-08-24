import { getWeddingCountdown } from "@/lib/planning/countdown";

export function CountdownCard({ weddingDate }: { weddingDate: string | null }) {
  if (!weddingDate) {
    return (
      <section className="glass-card p-4">
        <p className="text-xs font-medium tracking-wide text-foreground/50 uppercase">
          Countdown
        </p>
        <p className="mt-2 text-sm text-foreground/60">
          Set your wedding date below to see the countdown.
        </p>
      </section>
    );
  }

  const countdown = getWeddingCountdown(weddingDate);

  return (
    <section className="glass-card p-4">
      <p className="text-xs font-medium tracking-wide text-foreground/50 uppercase">Countdown</p>
      {countdown.isPast ? (
        <p className="mt-2 font-display text-2xl text-ink">Your wedding was {countdown.label}</p>
      ) : countdown.totalDays === 0 ? (
        <p className="mt-2 font-display text-2xl text-terracotta">{countdown.label}</p>
      ) : (
        <>
          <p className="mt-2 font-display text-3xl text-ink">{countdown.label}</p>
          <p className="mt-1 text-sm text-foreground/60">{countdown.totalDays} days to go</p>
        </>
      )}
    </section>
  );
}
