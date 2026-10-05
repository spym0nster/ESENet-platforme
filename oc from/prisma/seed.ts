/**
 * Reference data seed — idempotent, safe to run on every environment (dev AND production).
 *
 * Creates only configuration: skills, default teams, default missions + recommended skills,
 * the three operational days, and the settings row. It NEVER creates candidates.
 * All of it is editable from /admin afterwards; re-running the seed does not overwrite edits
 * to existing rows (upserts only fill in missing rows).
 *
 * First admin: set SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD (+ optional SEED_ADMIN_NAME) when
 * running the seed, or use `npm run admin:create` (interactive-free, see README).
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const SKILLS = [
  "Communication",
  "Public Speaking",
  "Organization",
  "Leadership",
  "Teamwork",
  "Problem Solving",
  "Technical / IT",
  "Design",
  "Photography",
  "Videography",
  "Social Media",
  "Event Management",
  "Logistics",
  "Negotiation",
  "Languages",
  "Content Creation",
  "Coordination",
  "Other",
] as const;

type SkillName = (typeof SKILLS)[number];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Starting capacities are placeholders — set the real numbers in /admin/teams. */
const TEAMS = [
  { name: "Logistics Team", description: "Setup, equipment, rooms and on-site logistics.", capacity: 10 },
  { name: "Accueil Team", description: "Welcome desk, registration and visitor flow.", capacity: 8 },
  { name: "Media Team", description: "Photo, video, content and social coverage.", capacity: 8 },
  { name: "Technical Team", description: "AV, connectivity and technical support.", capacity: 6 },
  { name: "Communication Team", description: "Announcements, messaging and on-site communication.", capacity: 6 },
  { name: "Coordination Team", description: "Speakers, companies, stands and cross-team coordination.", capacity: 8 },
];

/** weight 2 = core skill for the mission, 1 = useful. Editable in /admin/missions. */
const MISSIONS: { name: string; team: string; description: string; capacity: number; skills: [SkillName, number][] }[] = [
  {
    name: "Logistics",
    team: "Logistics Team",
    description: "Material, setup and on-site logistics across the three days.",
    capacity: 6,
    skills: [["Logistics", 2], ["Organization", 2], ["Event Management", 2], ["Teamwork", 1], ["Problem Solving", 1], ["Coordination", 1]],
  },
  {
    name: "Accueil & Registration",
    team: "Accueil Team",
    description: "Welcome, registration desk and guiding visitors.",
    capacity: 6,
    skills: [["Communication", 2], ["Languages", 2], ["Teamwork", 1], ["Organization", 1]],
  },
  {
    name: "Speaker Management",
    team: "Coordination Team",
    description: "Speaker and panelist hospitality, timing and briefing.",
    capacity: 3,
    skills: [["Communication", 2], ["Organization", 2], ["Leadership", 1], ["Public Speaking", 1], ["Languages", 1]],
  },
  {
    name: "Companies & Stands",
    team: "Coordination Team",
    description: "Point of contact for exhibiting companies and their stands.",
    capacity: 4,
    skills: [["Communication", 2], ["Negotiation", 2], ["Organization", 1], ["Coordination", 1], ["Languages", 1]],
  },
  {
    name: "Room Management",
    team: "Logistics Team",
    description: "Room readiness, seating and transitions between sessions.",
    capacity: 4,
    skills: [["Organization", 2], ["Coordination", 2], ["Problem Solving", 1], ["Teamwork", 1]],
  },
  {
    name: "Technical Support",
    team: "Technical Team",
    description: "Sound, projection, connectivity and live technical issues.",
    capacity: 4,
    skills: [["Technical / IT", 2], ["Problem Solving", 2], ["Coordination", 1]],
  },
  {
    name: "Media & Content",
    team: "Media Team",
    description: "Live content, stories and social media coverage.",
    capacity: 3,
    skills: [["Social Media", 2], ["Content Creation", 2], ["Design", 1], ["Communication", 1]],
  },
  {
    name: "Photography / Video",
    team: "Media Team",
    description: "Photo and video coverage of the event.",
    capacity: 4,
    skills: [["Photography", 2], ["Videography", 2], ["Content Creation", 1]],
  },
  {
    name: "Communication",
    team: "Communication Team",
    description: "On-site announcements and participant communication.",
    capacity: 3,
    skills: [["Communication", 2], ["Public Speaking", 1], ["Social Media", 1], ["Content Creation", 1], ["Languages", 1]],
  },
  {
    name: "Coordination",
    team: "Coordination Team",
    description: "Cross-team coordination and escalation.",
    capacity: 3,
    skills: [["Coordination", 2], ["Leadership", 2], ["Organization", 1], ["Problem Solving", 1], ["Event Management", 1]],
  },
];

const DAYS = [
  { key: "J_MINUS_2", label: "J-2", title: "Setup & Preparation" },
  { key: "J_MINUS_1", label: "J-1", title: "Final Preparation & Coordination" },
  { key: "JOUR_J", label: "JOUR J", title: "Event Operations" },
] as const;

async function main() {
  // Skills
  for (const [i, name] of SKILLS.entries()) {
    await db.skill.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name), sortOrder: i, isOther: name === "Other" },
    });
  }
  const skills = new Map((await db.skill.findMany()).map((s) => [s.name, s.id]));

  // Teams
  for (const [i, t] of TEAMS.entries()) {
    await db.team.upsert({ where: { name: t.name }, update: {}, create: { ...t, sortOrder: i } });
  }
  const teams = new Map((await db.team.findMany()).map((t) => [t.name, t.id]));

  // Missions (+ recommended skills only when the mission is first created)
  for (const [i, m] of MISSIONS.entries()) {
    const existing = await db.mission.findUnique({ where: { name: m.name } });
    if (existing) continue;
    await db.mission.create({
      data: {
        name: m.name,
        description: m.description,
        capacity: m.capacity,
        sortOrder: i,
        teamId: teams.get(m.team) ?? null,
        skills: { create: m.skills.map(([skill, weight]) => ({ skillId: skills.get(skill)!, weight })) },
      },
    });
  }

  // Operational days — dates are left empty on purpose; set them in /admin/settings.
  for (const d of DAYS) {
    await db.scheduleDay.upsert({ where: { key: d.key }, update: {}, create: d });
  }

  await db.appSetting.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  // Optional first admin from env (never hardcoded).
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    if (password.length < 12) throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.");
    const exists = await db.user.findUnique({ where: { email } });
    if (!exists) {
      await db.user.create({
        data: {
          email,
          name: process.env.SEED_ADMIN_NAME?.trim() || "Admin",
          role: "ADMIN",
          passwordHash: await bcrypt.hash(password, 12),
        },
      });
      console.log(`✔ Created admin ${email}`);
    } else {
      console.log(`• Admin ${email} already exists — left unchanged`);
    }
  } else if ((await db.user.count({ where: { role: "ADMIN" } })) === 0) {
    console.log("• No admin yet. Create one with: npm run admin:create -- --email you@… --name \"Your Name\"");
  }

  console.log(`✔ Seeded ${SKILLS.length} skills, ${TEAMS.length} teams, ${MISSIONS.length} missions, ${DAYS.length} operational days`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
