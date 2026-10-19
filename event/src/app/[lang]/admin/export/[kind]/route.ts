import { isAdmin } from "@/app/actions/admin";
import { db } from "@/lib/server";

const cell = (v: unknown) => {
  const s = v == null ? "" : Array.isArray(v) ? v.join(" | ") : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (rows: Record<string, unknown>[]) => {
  if (rows.length === 0) return "";
  const keys = Object.keys(rows[0]);
  return [keys.join(","), ...rows.map((r) => keys.map((k) => cell(r[k])).join(","))].join("\r\n");
};

// Organisers only: full CSV export (UTF-8 with BOM so Excel reads accents).
export async function GET(_req: Request, ctx: RouteContext<"/[lang]/admin/export/[kind]">) {
  if (!(await isAdmin())) return new Response("Forbidden", { status: 403 });
  const { kind: raw } = await ctx.params;
  const kind = raw.replace(/\.csv$/i, "");
  const supabase = db();
  if (!supabase) return new Response("Database unavailable", { status: 503 });

  let rows: Record<string, unknown>[] = [];
  if (kind === "visitors") {
    const { data } = await supabase.from("event_visitors").select("*").order("created_at", { ascending: false });
    rows = (data ?? []).map((v) => ({
      code: v.code, name: v.full_name, email: v.email, phone: v.phone, status: v.status, school: v.school, field: v.field,
      cv_shared: v.wants_cv && v.consent_cv ? "yes" : "no", cv_file: v.cv_path, checked_in_at: v.checked_in_at, registered_at: v.created_at, lang: v.lang,
    }));
  } else if (kind === "exhibitors") {
    const [e, p] = await Promise.all([
      supabase.from("event_exhibitors").select("*").order("created_at", { ascending: false }),
      supabase.from("event_exhibitor_people").select("exhibitor_id, full_name, job_title, code, checked_in_at"),
    ]);
    rows = (e.data ?? []).map((x) => ({
      code: x.code, company: x.company_name, sector: x.sector, website: x.website, description: x.description, logo: x.logo_url,
      hiring: x.hiring_types, needs: x.needs, contact_email: x.contact_email, contact_phone: x.contact_phone,
      sponsor_interest: x.sponsor_interest, status: x.status, stand: x.stand_number,
      team: (p.data ?? []).filter((q) => q.exhibitor_id === x.id).map((q) => `${q.full_name} (${q.job_title})`),
      registered_at: x.created_at, lang: x.lang,
    }));
  } else return new Response("Not found", { status: 404 });

  const date = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="esenet-2026-${kind}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
