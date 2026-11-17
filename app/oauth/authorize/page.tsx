import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isLocalTestMode, LOCAL_TEST_USER } from "@/lib/local-test";
import { oauthConfigured, validateAuthorizeRequest } from "@/lib/mcp/oauth";
import { decideAuthorization } from "./actions";

type Params = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      {children}
    </main>
  );
}

export default async function AuthorizePage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;

  if (!oauthConfigured()) {
    return (
      <Shell>
        <p className="text-sm text-foreground/70">OAuth isn&apos;t configured on this site.</p>
      </Shell>
    );
  }

  const request = {
    clientId: first(params.client_id),
    redirectUri: first(params.redirect_uri),
    responseType: first(params.response_type),
    codeChallenge: first(params.code_challenge),
    codeChallengeMethod: first(params.code_challenge_method),
    state: first(params.state),
  };
  const checked = await validateAuthorizeRequest(request);
  if (!checked.ok) {
    return (
      <Shell>
        <h1 className="font-display text-2xl text-ink">Can&apos;t authorise this request</h1>
        <p className="text-sm text-foreground/70">{checked.error}</p>
      </Shell>
    );
  }

  const session = isLocalTestMode() ? { user: LOCAL_TEST_USER } : await auth();
  if (!session?.user) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      const single = first(value);
      if (single !== undefined) query.set(key, single);
    }
    const back = `/oauth/authorize?${query.toString()}`;
    redirect(`/admin/sign-in?callbackUrl=${encodeURIComponent(back)}`);
  }

  const redirectHost = new URL(checked.redirectUri).host;
  const hidden = {
    client_id: request.clientId,
    redirect_uri: request.redirectUri,
    response_type: request.responseType,
    code_challenge: request.codeChallenge,
    code_challenge_method: request.codeChallengeMethod,
    state: request.state,
  };

  return (
    <Shell>
      <p className="text-sm tracking-[0.3em] text-aegean uppercase">Admin access</p>
      <h1 className="font-display text-3xl text-ink">Connect {checked.client.name}?</h1>
      <p className="max-w-sm text-foreground/70">
        This lets <strong>{checked.client.name}</strong> (returning to {redirectHost}) view and change your
        vendors, venue details and to-do list as {session.user.email}.
      </p>
      <form action={decideAuthorization} className="flex gap-3">
        {Object.entries(hidden).map(([name, value]) =>
          value === undefined ? null : <input key={name} type="hidden" name={name} value={value} />,
        )}
        <button
          type="submit"
          name="decision"
          value="deny"
          className="rounded-full border border-aegean px-6 py-3 text-sm font-medium text-aegean transition hover:bg-aegean/5"
        >
          Cancel
        </button>
        <button
          type="submit"
          name="decision"
          value="approve"
          className="rounded-full bg-aegean px-6 py-3 text-sm font-medium text-whitewash transition hover:bg-aegean-dark"
        >
          Allow
        </button>
      </form>
    </Shell>
  );
}
