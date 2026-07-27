export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-24 text-center">
      <h1 className="font-display text-2xl text-ink">{title}</h1>
      <p className="text-sm text-foreground/60">Coming soon.</p>
    </div>
  );
}
