import "server-only";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { CandidateStatus } from "@/generated/prisma/enums";
import { PAGE_SIZE } from "@/lib/constants";
import { db } from "@/lib/db";

type SP = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const many = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

const filtersSchema = z.object({
  q: z.string().trim().max(100).catch(""),
  status: z.enum(CandidateStatus).optional().catch(undefined),
  classYear: z.string().max(80).optional().catch(undefined),
  specialization: z.string().max(120).optional().catch(undefined),
  skills: z.array(z.string().max(64)).max(20).catch([]),
  assigned: z.enum(["yes", "no"]).optional().catch(undefined),
  experience: z.enum(["event", "esen", "any", "none"]).optional().catch(undefined),
  demo: z.enum(["hide", "only"]).optional().catch(undefined),
  sort: z.enum(["newest", "oldest", "name", "status"]).catch("newest"),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});

export type CandidateFilters = z.infer<typeof filtersSchema>;

/** Parse URL search params into safe filters. Unknown / malformed values fall back silently. */
export function parseCandidateFilters(sp: SP): CandidateFilters {
  return filtersSchema.parse({
    q: one(sp.q) ?? "",
    status: one(sp.status) || undefined,
    classYear: one(sp.classYear) || undefined,
    specialization: one(sp.specialization) || undefined,
    skills: many(sp.skill).filter(Boolean),
    assigned: one(sp.assigned) || undefined,
    experience: one(sp.experience) || undefined,
    demo: one(sp.demo) || undefined,
    sort: one(sp.sort) ?? "newest",
    page: one(sp.page) ?? 1,
  });
}

export function candidateWhere(f: CandidateFilters): Prisma.CandidateWhereInput {
  const and: Prisma.CandidateWhereInput[] = [];
  if (f.q) {
    const q = f.q;
    and.push({
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q.toLowerCase() } },
        { phone: { contains: q.replace(/\s+/g, " ") } },
        { specialization: { contains: q, mode: "insensitive" } },
        { applicationId: { contains: q.toUpperCase() } },
      ],
    });
  }
  if (f.status) and.push({ status: f.status });
  if (f.classYear) and.push({ classYear: f.classYear });
  if (f.specialization) and.push({ specialization: { equals: f.specialization, mode: "insensitive" } });
  for (const skillId of f.skills) and.push({ skills: { some: { skillId } } });
  if (f.assigned === "yes") and.push({ assignments: { some: { active: true } } });
  if (f.assigned === "no") and.push({ assignments: { none: { active: true } } });
  if (f.experience === "event") and.push({ eventExperience: true });
  if (f.experience === "esen") and.push({ ambassadorExperience: true });
  if (f.experience === "any") and.push({ OR: [{ eventExperience: true }, { ambassadorExperience: true }] });
  if (f.experience === "none") and.push({ eventExperience: false, ambassadorExperience: false });
  if (f.demo === "hide") and.push({ isDemo: false });
  if (f.demo === "only") and.push({ isDemo: true });
  return and.length ? { AND: and } : {};
}

export function candidateOrderBy(sort: CandidateFilters["sort"]): Prisma.CandidateOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ createdAt: "asc" }];
    case "name":
      return [{ fullName: "asc" }];
    case "status":
      return [{ status: "asc" }, { createdAt: "desc" }];
    default:
      return [{ createdAt: "desc" }];
  }
}

export const candidateListSelect = {
  id: true,
  applicationId: true,
  fullName: true,
  email: true,
  phone: true,
  classYear: true,
  specialization: true,
  status: true,
  isDemo: true,
  createdAt: true,
  eventExperience: true,
  ambassadorExperience: true,
  otherSkill: true,
  skills: { select: { skill: { select: { id: true, name: true } } }, orderBy: { skill: { sortOrder: "asc" } } },
  assignments: {
    where: { active: true },
    select: { id: true, subRole: true, isLead: true, mission: { select: { name: true } }, team: { select: { name: true } } },
  },
} satisfies Prisma.CandidateSelect;

export type CandidateListRow = Prisma.CandidateGetPayload<{ select: typeof candidateListSelect }>;

export async function listCandidates(f: CandidateFilters) {
  const where = candidateWhere(f);
  const [total, rows] = await Promise.all([
    db.candidate.count({ where }),
    db.candidate.findMany({
      where,
      select: candidateListSelect,
      orderBy: candidateOrderBy(f.sort),
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  return { total, rows, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** Distinct values for the filter dropdowns. */
export async function candidateFilterOptions() {
  const [classYears, specs, skills] = await Promise.all([
    db.candidate.findMany({ distinct: ["classYear"], select: { classYear: true }, orderBy: { classYear: "asc" } }),
    db.candidate.findMany({ distinct: ["specialization"], select: { specialization: true }, orderBy: { specialization: "asc" } }),
    db.skill.findMany({ orderBy: [{ isOther: "asc" }, { sortOrder: "asc" }], select: { id: true, name: true } }),
  ]);
  return {
    classYears: classYears.map((c) => c.classYear),
    specializations: [...new Set(specs.map((s) => s.specialization))],
    skills,
  };
}
