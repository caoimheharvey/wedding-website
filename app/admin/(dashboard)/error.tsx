"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-24 text-center">
      <h1 className="font-display text-2xl text-ink">Something went wrong</h1>
      <p className="max-w-sm text-sm text-foreground/60">
        {error.message || "Check that Supabase is configured (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-aegean px-4 py-2 text-sm font-medium text-whitewash hover:bg-aegean-dark"
      >
        Try again
      </button>
    </div>
  );
}
