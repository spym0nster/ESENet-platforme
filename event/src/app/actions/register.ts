"use server";

import { redirect } from "next/navigation";
import { FORMS, type FormState } from "@/content/forms";
import { hasLocale, type Locale } from "@/content/i18n";
import { db, esc, isEmail, newCode, sendMail, siteUrl } from "@/lib/server";

const text = (fd: FormData, k: string, max = 300) => String(fd.get(k) ?? "").trim().slice(0, max);
const fileOf = (fd: FormData, k: string) => {
  const f = fd.get(k);
  return f instanceof File && f.size > 0 ? f : null;
};
const fieldsOf = (fd: FormData, keys: string[]) => Object.fromEntries(keys.map((k) => [k, text(fd, k, 600)]));

function langOf(fd: FormData): Locale {
  const l = text(fd, "lang", 5);
  return hasLocale(l) ? l : "fr";
}

export async function registerVisitor(_prev: FormState, fd: FormData): Promise<FormState> {
  const lang = langOf(fd);
  const t = FORMS[lang].visitor;
  const keys = ["name", "email", "phone", "status", "school", "field"];
  const fields = fieldsOf(fd, keys);
  const fail = (error: string): FormState => ({ error, fields });

  // honeypot: real visitors never see this field
  if (text(fd, "website")) return redirect(`/${lang}`);

  const name = text(fd, "name", 120);
  const email = text(fd, "email", 200).toLowerCase();
  const status = text(fd, "status", 20);
  const cv = fileOf(fd, "cv");
  const consentCv = fd.get("consentCv") === "on";
  if (name.length < 2) return fail(t.errName);
  if (!isEmail(email)) return fail(t.errEmail);
  if (fd.get("consent") !== "on") return fail(t.errConsent);
  if (cv && (cv.type !== "application/pdf" || cv.size > 4 * 1024 * 1024)) return fail(t.errCv);
  if (cv && !consentCv) return fail(t.errCvConsent);

  const supabase = db();
  if (!supabase) return fail(t.errUnavailable);

  const ticketUrl = (code: string) => `${siteUrl()}/${lang}/ticket/${code}`;
  const mail = (nm: string, code: string) =>
    sendMail(
      email,
      t.mailSubject,
      `<p>${esc(nm)},</p><p>${t.mailBody}</p><p><a href="${ticketUrl(code)}">${ticketUrl(code)}</a></p><p>ESENet — 25.11.2026, ESEN Technopôle</p>`,
    );

  const code = newCode("ESN");
  let cvPath: string | null = null;
  if (cv) {
    cvPath = `${code}.pdf`;
    const up = await supabase.storage.from("event-cvs").upload(cvPath, cv, { contentType: "application/pdf" });
    if (up.error) {
      console.error("cv upload", up.error);
      cvPath = null;
    }
  }

  const { error } = await supabase.from("event_visitors").insert({
    code,
    full_name: name,
    email,
    phone: text(fd, "phone", 40) || null,
    status: ["student", "graduate", "professional", "other"].includes(status) ? status : "student",
    school: text(fd, "school", 160) || null,
    field: text(fd, "field", 160) || null,
    wants_cv: !!cvPath,
    cv_path: cvPath,
    consent_data: true,
    consent_cv: consentCv && !!cvPath,
    lang,
  });

  if (error) {
    if (error.code === "23505") {
      // already registered: resend the existing ticket to that inbox only
      const existing = await supabase.from("event_visitors").select("code, full_name").eq("email", email).maybeSingle();
      if (existing.data) await mail(existing.data.full_name, existing.data.code);
      return fail(lang === "fr" ? "Cet email est déjà inscrit — nous venons de renvoyer votre ticket à cette adresse." : "This email is already registered — we just resent your ticket to that address.");
    }
    console.error("visitor insert", error);
    return fail(t.errGeneric);
  }

  await mail(name, code);
  redirect(`/${lang}/ticket/${code}`);
}

const LOGO_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/svg+xml": "svg" };
const HIRING = ["internship", "pfe", "job", "alternance"];
const SPONSOR = ["bronze", "silver", "gold", "platinum"];

export async function applyExhibitor(_prev: FormState, fd: FormData): Promise<FormState> {
  const lang = langOf(fd);
  const t = FORMS[lang].exhibitor;
  const keys = ["company", "sector", "website", "description", "needs", "email", "phone", "p1name", "p1title", "p2name", "p2title", "sponsor"];
  const fields = fieldsOf(fd, keys);
  const fail = (error: string): FormState => ({ error, fields });

  if (text(fd, "url")) return redirect(`/${lang}`);

  const company = text(fd, "company", 160);
  const email = text(fd, "email", 200).toLowerCase();
  const description = text(fd, "description", 600);
  const logo = fileOf(fd, "logo");
  const people = [1, 2].map((n) => ({ name: text(fd, `p${n}name`, 120), title: text(fd, `p${n}title`, 120) }));
  if (company.length < 2) return fail(t.errCompany);
  if (!isEmail(email)) return fail(t.errEmail);
  if (description.length < 10) return fail(t.errDescription);
  if (!logo || !LOGO_TYPES[logo.type] || logo.size > 2 * 1024 * 1024) return fail(t.errLogo);
  if (people.some((p) => p.name.length < 2 || p.title.length < 2)) return fail(t.errPeople);
  if (fd.get("consent") !== "on") return fail(t.errConsent);

  const supabase = db();
  if (!supabase) return fail(t.errUnavailable);

  const code = newCode("EXH");
  const logoPath = `${code}.${LOGO_TYPES[logo.type]}`;
  const up = await supabase.storage.from("event-logos").upload(logoPath, logo, { contentType: logo.type });
  if (up.error) {
    console.error("logo upload", up.error);
    return fail(t.errGeneric);
  }
  const logoUrl = supabase.storage.from("event-logos").getPublicUrl(logoPath).data.publicUrl;

  const website = text(fd, "website", 200);
  const sponsor = text(fd, "sponsor", 20);
  const { data, error } = await supabase
    .from("event_exhibitors")
    .insert({
      code,
      company_name: company,
      sector: text(fd, "sector", 120) || null,
      website: website ? (/^https?:\/\//i.test(website) ? website : `https://${website}`) : null,
      description,
      logo_url: logoUrl,
      hiring_types: fd.getAll("hiring").map(String).filter((h) => HIRING.includes(h)),
      needs: text(fd, "needs", 400) || null,
      contact_email: email,
      contact_phone: text(fd, "phone", 40) || null,
      sponsor_interest: SPONSOR.includes(sponsor) ? sponsor : null,
      consent_data: true,
      lang,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("exhibitor insert", error);
    return fail(t.errGeneric);
  }

  const ppl = await supabase.from("event_exhibitor_people").insert(
    people.map((p) => ({ exhibitor_id: data.id, full_name: p.name, job_title: p.title, code: newCode("STF") })),
  );
  if (ppl.error) {
    console.error("exhibitor people insert", ppl.error);
    await supabase.from("event_exhibitors").delete().eq("id", data.id);
    return fail(t.errGeneric);
  }

  await sendMail(email, t.mailSubject, `<p>${esc(company)},</p><p>${t.mailBody}</p><p>ESENet — 25.11.2026, ESEN Technopôle</p>`);
  redirect(`/${lang}/exhibit/thanks`);
}
