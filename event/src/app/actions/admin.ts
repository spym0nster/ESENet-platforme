"use server";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { broadcastEmail, exhibitorApprovedEmail } from "@/lib/emails";
import { db, isEmail, sendBatch, sendMail } from "@/lib/server";

// One shared organiser password (ADMIN_PASSWORD). The cookie holds a hash of
// it, so changing the env var signs everyone out.
const token = () => createHash("sha256").update(`${process.env.ADMIN_PASSWORD ?? ""}:esenet-admin`).digest("hex");

export async function isAdmin() {
  if (!process.env.ADMIN_PASSWORD) return false;
  return (await cookies()).get("esn_admin")?.value === token();
}

export async function adminLogin(_prev: string | null, fd: FormData): Promise<string | null> {
  const pw = String(fd.get("password") ?? "");
  if (!process.env.ADMIN_PASSWORD || pw !== process.env.ADMIN_PASSWORD) return "Wrong password.";
  (await cookies()).set("esn_admin", token(), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 14 });
  redirect("/en/admin");
}

export async function reviewExhibitor(fd: FormData) {
  if (!(await isAdmin())) return;
  const id = String(fd.get("id") ?? "");
  const decision = String(fd.get("decision") ?? "");
  const stand = String(fd.get("stand") ?? "").trim().slice(0, 20) || null;
  if (!["approved", "rejected", "pending"].includes(decision)) return;
  const supabase = db();
  if (!supabase) return;
  const { data } = await supabase
    .from("event_exhibitors")
    .update({ status: decision, stand_number: decision === "approved" ? stand : null })
    .eq("id", id)
    .select("company_name, contact_email, lang, code")
    .single();
  if (data && decision === "approved") {
    const people = await supabase.from("event_exhibitor_people").select("full_name, code").eq("exhibitor_id", id);
    const m = exhibitorApprovedEmail(
      data.lang === "fr" ? "fr" : "en",
      data.company_name,
      stand,
      (people.data ?? []).map((p) => ({ name: p.full_name, code: p.code })),
    );
    await sendMail(data.contact_email, m.subject, m.html);
  }
  revalidatePath("/en/admin");
}

export type CheckInResult = { ok: boolean; name?: string; kind?: string; already?: boolean; msg?: string };

export async function checkIn(raw: string): Promise<CheckInResult> {
  if (!(await isAdmin())) return { ok: false, msg: "Not signed in." };
  const code = raw.trim().toUpperCase().slice(-12);
  const supabase = db();
  if (!supabase) return { ok: false, msg: "Database unavailable." };
  const table = code.startsWith("ESN-") ? "event_visitors" : code.startsWith("STF-") ? "event_exhibitor_people" : null;
  if (!table) return { ok: false, msg: "Unknown code." };
  const { data } = await supabase.from(table).select("id, full_name, checked_in_at").eq("code", code).maybeSingle();
  if (!data) return { ok: false, msg: "Ticket not found." };
  const kind = table === "event_visitors" ? "Visitor" : "Exhibitor team";
  if (data.checked_in_at) return { ok: true, already: true, name: data.full_name, kind };
  await supabase.from(table).update({ checked_in_at: new Date().toISOString() }).eq("id", data.id);
  return { ok: true, name: data.full_name, kind };
}

export type BroadcastAudience = "visitors_all" | "visitors_cv" | "exhibitors_all" | "exhibitors_approved" | "exhibitors_pending";

// Admin "send email": a free-text message to a chosen audience, one
// personalised email each ("Bonjour <name>"), or just one test to an address.
export async function sendBroadcast(_prev: string | null, fd: FormData): Promise<string> {
  if (!(await isAdmin())) return "Not signed in.";
  const audience = String(fd.get("audience") ?? "") as BroadcastAudience;
  const subject = String(fd.get("subject") ?? "").trim().slice(0, 200);
  const message = String(fd.get("message") ?? "").trim().slice(0, 8000);
  const testTo = String(fd.get("testTo") ?? "").trim();
  if (subject.length < 3 || message.length < 5) return "Add a subject and a message.";
  const supabase = db();
  if (!supabase) return "Database unavailable.";

  if (testTo) {
    if (!isEmail(testTo)) return "The test address is not valid.";
    const m = broadcastEmail("fr", "Test", subject, message);
    const r = await sendMail(testTo, `[TEST] ${m.subject}`, m.html);
    return r.ok ? `Test sent to ${testTo}.` : `Test failed: ${r.error}`;
  }

  type Row = { to: string; name: string; lang: "fr" | "en" };
  let rows: Row[] = [];
  if (audience.startsWith("visitors")) {
    let q = supabase.from("event_visitors").select("email, full_name, lang");
    if (audience === "visitors_cv") q = q.eq("wants_cv", true).eq("consent_cv", true);
    const { data } = await q;
    rows = (data ?? []).map((r) => ({ to: r.email, name: r.full_name, lang: r.lang === "en" ? "en" : "fr" }));
  } else if (audience.startsWith("exhibitors")) {
    let q = supabase.from("event_exhibitors").select("contact_email, company_name, lang");
    if (audience === "exhibitors_approved") q = q.eq("status", "approved");
    if (audience === "exhibitors_pending") q = q.eq("status", "pending");
    const { data } = await q;
    rows = (data ?? []).map((r) => ({ to: r.contact_email, name: r.company_name, lang: r.lang === "en" ? "en" : "fr" }));
  } else return "Choose an audience.";
  if (rows.length === 0) return "Nobody in this audience yet.";

  const res = await sendBatch(
    rows.map((r) => {
      const m = broadcastEmail(r.lang, r.name, subject, message);
      return { to: r.to, subject: m.subject, html: m.html };
    }),
  );
  return res.failed === 0 ? `Sent to ${res.sent} people.` : `Sent ${res.sent}, failed ${res.failed}${res.error ? `: ${res.error}` : ""}.`;
}
