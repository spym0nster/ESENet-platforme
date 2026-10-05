import { NextResponse, type NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { getStaffUser } from "@/lib/auth";
import { STATUS_LABEL } from "@/lib/constants";
import { db } from "@/lib/db";
import { candidateOrderBy, candidateWhere, parseCandidateFilters } from "@/lib/services/candidates";

export const runtime = "nodejs";

/**
 * CSV export of candidates (ADMIN only), honouring the same filters as /admin/candidates.
 * Cells are escaped and spreadsheet-formula prefixes are neutralised (CSV injection).
 */
function cell(v: unknown) {
  let s = v === null || v === undefined ? "" : String(v);
  // Neutralise formula triggers; a plain phone number like "+216 20 123 456" is left alone.
  const numberLike = /^[+-][\d\s().-]+$/.test(s);
  if (/^[=@\t\r]/.test(s) || (/^[+-]/.test(s) && !numberLike)) s = `'${s}`;
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  const user = await getStaffUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp: Record<string, string | string[]> = {};
  for (const key of new Set(req.nextUrl.searchParams.keys())) {
    const all = req.nextUrl.searchParams.getAll(key);
    sp[key] = all.length > 1 ? all : all[0]!;
  }
  const filters = parseCandidateFilters(sp);

  const rows = await db.candidate.findMany({
    where: candidateWhere(filters),
    orderBy: candidateOrderBy(filters.sort),
    take: 5000,
    select: {
      applicationId: true,
      fullName: true,
      email: true,
      phone: true,
      classYear: true,
      specialization: true,
      status: true,
      eventExperience: true,
      ambassadorExperience: true,
      otherSkill: true,
      isDemo: true,
      createdAt: true,
      skills: { select: { skill: { select: { name: true, isOther: true } } }, orderBy: { skill: { sortOrder: "asc" } } },
      assignments: { where: { active: true }, select: { subRole: true, isLead: true, mission: { select: { name: true } }, team: { select: { name: true } } } },
    },
  });

  const header = ["Application ID", "Full Name", "Email", "Phone", "Class", "Specialization", "Skills", "Experience", "Status", "Mission", "Role", "Team", "Team Lead", "Created At", "Demo"];
  const lines = [header.map(cell).join(",")];
  for (const r of rows) {
    const skills = r.skills.map((s) => (s.skill.isOther && r.otherSkill ? `Other: ${r.otherSkill}` : s.skill.name)).join("; ");
    const exp = [r.eventExperience && "Event organization", r.ambassadorExperience && "ESEN/Ambassadors/ESENet"].filter(Boolean).join("; ") || "None";
    const a = r.assignments;
    lines.push(
      [
        r.applicationId,
        r.fullName,
        r.email,
        r.phone,
        r.classYear,
        r.specialization,
        skills,
        exp,
        STATUS_LABEL[r.status],
        a.map((x) => x.mission.name).join("; "),
        a.map((x) => x.subRole ?? "").join("; "),
        a.map((x) => x.team.name).join("; "),
        a.some((x) => x.isLead) ? "Yes" : "",
        r.createdAt.toISOString(),
        r.isDemo ? "DEMO" : "",
      ]
        .map(cell)
        .join(","),
    );
  }

  await audit({
    userId: user.id,
    action: "export.candidates_csv",
    targetType: "export",
    summary: `${user.name} exported ${rows.length} candidate${rows.length === 1 ? "" : "s"} to CSV`,
    next: { filters: JSON.parse(JSON.stringify(filters)), count: rows.length },
  });

  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  // BOM so Excel opens UTF-8 (accents in names) correctly.
  return new NextResponse(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="esenet-oc-candidates-${stamp}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
