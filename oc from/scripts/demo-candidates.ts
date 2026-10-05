/**
 * DEMO candidates for local development only.
 *
 *   npm run demo:seed     # adds 40 candidates flagged isDemo = true (emails end in @demo.invalid)
 *   npm run demo:clear    # removes every isDemo candidate (and their assignments)
 *
 * Refuses to run against a Vercel production environment. Demo rows are visibly tagged DEMO
 * in the admin UI and excluded from nothing else — clear them before going live.
 */
import "dotenv/config";
import { randomInt } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { generateApplicationId } from "../src/lib/application-id";

const mode = process.argv[2];
if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
  console.error("✖ Refusing to touch demo data in a production environment.");
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const FIRST = ["Amine", "Yasmine", "Mehdi", "Salma", "Oussama", "Rania", "Khalil", "Nour", "Firas", "Ines", "Aziz", "Mariem", "Hamza", "Lina", "Skander", "Eya", "Youssef", "Malek", "Ghaith", "Sarra"];
const LAST = ["Ben Salah", "Trabelsi", "Gharbi", "Jaziri", "Mansouri", "Bouzid", "Hammami", "Chaabane", "Ayari", "Khelifi"];
const YEARS = ["1st year — Licence (L1)", "2nd year — Licence (L2)", "3rd year — Licence (L3)", "Master 1 (M1)", "Master 2 (M2)"];
const SPECS = ["Business Computing", "E-Business", "Business Intelligence", "Digital Marketing", "Data Science"];

const pick = <T,>(a: readonly T[]) => a[randomInt(a.length)]!;

async function seed() {
  const skills = await db.skill.findMany({ where: { isOther: false } });
  if (!skills.length) throw new Error("Run `npm run db:seed` first.");
  for (let i = 0; i < 40; i++) {
    const first = pick(FIRST);
    const last = pick(LAST);
    const chosen = [...skills].sort(() => Math.random() - 0.5).slice(0, 2 + randomInt(4));
    const event = Math.random() < 0.5;
    const amb = Math.random() < 0.35;
    await db.candidate.create({
      data: {
        applicationId: generateApplicationId(),
        fullName: `${first} ${last}`,
        email: `demo.${first}.${last.replace(/\s/g, "")}.${i}@demo.invalid`.toLowerCase(),
        phone: `+216 2${randomInt(10)} ${randomInt(100, 999)} ${randomInt(100, 999)}`,
        classYear: pick(YEARS),
        specialization: pick(SPECS),
        availabilityConfirmed: true,
        consentAt: new Date(),
        eventExperience: event,
        eventExperienceDetails: event ? "DEMO — helped organise a student club event." : null,
        ambassadorExperience: amb,
        ambassadorExperienceDetails: amb ? "DEMO — volunteered at ESENet 2025." : null,
        whatCanYouBring: "DEMO candidate generated for local development. Not a real application.",
        status: pick(["PENDING", "PENDING", "PENDING", "SHORTLISTED", "SELECTED", "SELECTED", "WAITLIST", "REJECTED"] as const),
        isDemo: true,
        createdAt: new Date(Date.now() - randomInt(0, 14 * 24 * 3600 * 1000)),
        skills: { create: chosen.map((s) => ({ skillId: s.id })) },
      },
    });
  }
  console.log("✔ Added 40 DEMO candidates (isDemo = true)");
}

async function clear() {
  const ids = (await db.candidate.findMany({ where: { isDemo: true }, select: { id: true } })).map((c) => c.id);
  await db.$transaction([
    db.assignment.updateMany({ where: { candidateId: { in: ids } }, data: { previousAssignmentId: null } }),
    db.assignment.deleteMany({ where: { candidateId: { in: ids } } }),
    db.candidate.deleteMany({ where: { id: { in: ids } } }),
  ]);
  console.log(`✔ Removed ${ids.length} DEMO candidates`);
}

(mode === "seed" ? seed() : mode === "clear" ? clear() : Promise.reject(new Error("Use: seed | clear")))
  .catch((e) => {
    console.error(`✖ ${e instanceof Error ? e.message : e}`);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
