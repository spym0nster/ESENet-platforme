/**
 * Create (or reset the password of) a staff account.
 *
 *   npm run admin:create -- --email you@ambassadors.tn --name "Your Name"
 *   npm run admin:create -- --email someone@… --name "…" --role AMBASSADOR
 *   npm run admin:create -- --email you@… --reset            # new password for an existing account
 *
 * Password: taken from the ADMIN_PASSWORD env var if set (min 12 chars), otherwise a strong
 * random one is generated and printed ONCE. Nothing is ever hardcoded or written to disk.
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    name: { type: "string" },
    role: { type: "string", default: "ADMIN" },
    reset: { type: "boolean", default: false },
  },
});

async function main() {
  const email = values.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Pass a valid --email");
  const role = values.role === "AMBASSADOR" ? "AMBASSADOR" : "ADMIN";

  const password = process.env.ADMIN_PASSWORD ?? randomBytes(12).toString("base64url");
  if (password.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters");
  const passwordHash = await bcrypt.hash(password, 12);

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  try {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      if (!values.reset) throw new Error(`${email} already exists. Use --reset to set a new password.`);
      await db.user.update({ where: { email }, data: { passwordHash, active: true } });
      console.log(`✔ Password reset for ${email}`);
    } else {
      if (!values.name?.trim()) throw new Error("Pass --name for a new account");
      await db.user.create({ data: { email, name: values.name.trim(), role, passwordHash } });
      console.log(`✔ Created ${role} ${email}`);
    }
    if (!process.env.ADMIN_PASSWORD) {
      console.log(`\n  Temporary password (shown once): ${password}\n  Sign in at /admin/login and change it from Settings → My account.\n`);
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(`✖ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
