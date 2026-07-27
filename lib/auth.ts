import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

function getAllowedAdminEmails(): string[] {
  return (process.env.ALLOWED_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/admin/sign-in",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      return getAllowedAdminEmails().includes(user.email.toLowerCase());
    },
  },
});
