import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, hashKey } from "@/lib/request";
import { normalizeEmail } from "@/lib/utils";

const credentialsSchema = z.object({
  email: z.string().trim().max(254),
  password: z.string().min(1).max(200),
});

// Compared against when the email doesn't exist, so response time doesn't reveal valid accounts.
const DUMMY_HASH = "$2b$12$RV.I9hHx4hjXSmzt./jEC.uQvhtuXAfCbHfVdL55AJ2yOUJ06/b3.";

class RateLimited extends CredentialsSignin {
  code = "rate_limited";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  logger: {
    // A wrong password is an expected outcome, not a server error — keep logs for real failures.
    error(error) {
      if (error.name === "CredentialsSignin" || error.name === "RateLimited") return;
      console.error("[auth]", error);
    },
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const email = normalizeEmail(parsed.data.email);

        const ip = await clientIp();
        const allowedIp = await rateLimit(`login:ip:${hashKey(ip)}`, 30, 15 * 60);
        const allowedAccount = await rateLimit(`login:acct:${hashKey(email)}`, 8, 15 * 60);
        if (!allowedIp || !allowedAccount) throw new RateLimited();

        const user = await db.user.findUnique({ where: { email } });
        const ok = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !ok || !user.active) return null;

        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        await audit({ userId: user.id, action: "user.login", targetType: "user", targetId: user.id, summary: `${user.name} signed in` });

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
});
