"use server";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, esc, sendMail } from "@/lib/server";

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
    const fr = data.lang === "fr";
    const people = await supabase.from("event_exhibitor_people").select("full_name, code").eq("exhibitor_id", id);
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const badges = (people.data ?? []).map((p) => `<li>${esc(p.full_name)} — ${base}/${data.lang}/badge/${p.code}</li>`).join("");
    await sendMail(
      data.contact_email,
      fr ? "ESENet 2026 — votre stand est confirmé" : "ESENet 2026 — your stand is confirmed",
      `<p>${esc(data.company_name)},</p><p>${fr ? "Votre stand est confirmé" : "Your stand is confirmed"}${stand ? ` : <b>${esc(stand)}</b>` : ""}.</p><p>${fr ? "Badges de votre équipe (QR à présenter à l’entrée) :" : "Your team badges (show the QR at the entrance):"}</p><ul>${badges}</ul>`,
    );
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
