import type { NextAuthConfig } from "next-auth";

/**
 * Auth.js base config (no DB access). Credentials + DB lookups live in src/auth.ts.
 * The authoritative check — user still exists, still active, has the right role — runs
 * server-side in requireStaff()/requireAdmin()/actor() on every request.
 */
export const authConfig = {
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 }, // 12h — one long operations day
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.uid) session.user.id = token.uid;
      if (token.role) session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
