import { signIn } from "@/lib/auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm tracking-[0.3em] text-aegean uppercase">Admin</p>
      <h1 className="font-display text-4xl text-ink">
        Caoimhe &amp; Alexandre
      </h1>
      <p className="max-w-sm text-foreground/70">
        Sign in with the Google account you use for wedding planning.
      </p>
      <form
        action={async () => {
          "use server";
          await signIn("google", {
            redirectTo: callbackUrl ?? "/admin/overview",
          });
        }}
      >
        <button
          type="submit"
          className="rounded-full bg-aegean px-6 py-3 text-sm font-medium text-whitewash transition hover:bg-aegean-dark"
        >
          Sign in with Google
        </button>
      </form>
    </main>
  );
}
