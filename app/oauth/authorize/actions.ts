"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { signToken, TTL, validateAuthorizeRequest } from "@/lib/mcp/oauth";

/**
 * The consent form's hidden fields are untrusted, so the whole request is
 * re-validated here before anything is signed.
 */
export async function decideAuthorization(formData: FormData) {
  const user = await requireAdmin();

  const field = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : undefined;
  };
  const checked = await validateAuthorizeRequest({
    clientId: field("client_id"),
    redirectUri: field("redirect_uri"),
    responseType: field("response_type"),
    codeChallenge: field("code_challenge"),
    codeChallengeMethod: field("code_challenge_method"),
  });
  if (!checked.ok) throw new Error(checked.error);

  const target = new URL(checked.redirectUri);
  const state = field("state");
  if (state) target.searchParams.set("state", state);

  if (field("decision") !== "approve") {
    target.searchParams.set("error", "access_denied");
    redirect(target.toString());
  }

  const code = await signToken(
    "code",
    {
      sub: user.email,
      client_id: checked.client.clientId,
      redirect_uri: checked.redirectUri,
      code_challenge: checked.codeChallenge,
    },
    TTL.code,
  );
  target.searchParams.set("code", code);
  redirect(target.toString());
}
