"use client";

import { useActionState, type ReactNode } from "react";
import { applyExhibitor, registerVisitor } from "@/app/actions/register";
import { FORMS } from "@/content/forms";
import type { Locale } from "@/content/i18n";
import { NodeRule } from "./alchemy";
import { Glyph } from "./ui";

const input =
  "mt-2 block w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-[16px] text-ink outline-none transition-colors placeholder:text-slate/50 focus:border-blue focus:ring-2 focus:ring-blue/20";
const label = "block font-mono text-[11px] uppercase tracking-[0.2em] text-slate";
const submit =
  "inline-flex h-12 w-full items-center justify-center rounded-full bg-ink px-7 text-[15px] font-semibold text-snow transition-colors hover:bg-blue disabled:opacity-60 sm:w-auto";

function Field({ children }: { name?: string; children: ReactNode }) {
  return <label className="block">{children}</label>;
}

function Check({ name, children }: { name: string; children: ReactNode }) {
  return (
    <label className="flex items-start gap-3 text-[14px] leading-snug text-slate">
      <input type="checkbox" name={name} className="check mt-0.5" />
      <span>{children}</span>
    </label>
  );
}

function Step({ n, title }: { n: string; title: string }) {
  return (
    <div>
      <div className="flex items-center gap-3 pb-3">
        <Glyph kind={(Number(n) % 3) as 0 | 1 | 2} />
        <span className="font-mono text-[12px] tracking-[0.2em] text-blue">{n}</span>
        <h2 className="font-display text-xl font-semibold tracking-tight text-ink">{title}</h2>
      </div>
      <NodeRule />
    </div>
  );
}

function Honeypot({ name }: { name: string }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <input type="text" name={name} tabIndex={-1} autoComplete="off" />
    </div>
  );
}

function ErrorLine({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[14px] text-red-800">
      {error}
    </p>
  );
}

export function VisitorForm({ lang }: { lang: Locale }) {
  const t = FORMS[lang].visitor;
  const [state, action, pending] = useActionState(registerVisitor, null);
  const v = state?.fields ?? {};
  return (
    <form action={action} className="relative space-y-6" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <Honeypot name="website" />
      <Step n="01" title={t.groups[0]} />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field name="name">
          <span className={label}>{t.name}</span>
          <input id="name" name="name" required autoComplete="name" defaultValue={v.name} className={input} />
        </Field>
        <Field name="email">
          <span className={label}>{t.email}</span>
          <input id="email" name="email" type="email" required autoComplete="email" defaultValue={v.email} className={input} />
        </Field>
        <Field name="phone">
          <span className={label}>{t.phone}</span>
          <input id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={v.phone} className={input} />
        </Field>
        <Field name="status">
          <span className={label}>{t.status}</span>
          <select id="status" name="status" defaultValue={v.status || "student"} className={input}>
            {Object.entries(t.statuses).map(([k, name]) => (
              <option key={k} value={k}>
                {name}
              </option>
            ))}
          </select>
        </Field>
        <Field name="school">
          <span className={label}>{t.school}</span>
          <input id="school" name="school" defaultValue={v.school} className={input} />
        </Field>
        <Field name="field">
          <span className={label}>{t.field}</span>
          <input id="field" name="field" defaultValue={v.field} className={input} />
        </Field>
      </div>

      <Step n="02" title={t.groups[1]} />
      <div className="rounded-2xl border border-ink/10 bg-paper p-5">
        <Field name="cv">
          <span className={label}>{t.cvFile}</span>
          <input id="cv" name="cv" type="file" accept="application/pdf" className={`${input} bg-white file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-1.5 file:text-sm file:text-snow`} />
        </Field>
        <div className="mt-4">
          <Check name="consentCv">{t.consentCv}</Check>
        </div>
      </div>

      <Check name="consent">{t.consent}</Check>
      <ErrorLine error={state?.error} />
      <button type="submit" disabled={pending} className={submit}>
        {t.submit}
      </button>
    </form>
  );
}

export function ExhibitorForm({ lang, packs }: { lang: Locale; packs: { key: string; name: string }[] }) {
  const t = FORMS[lang].exhibitor;
  const [state, action, pending] = useActionState(applyExhibitor, null);
  const v = state?.fields ?? {};
  return (
    <form action={action} className="relative space-y-8" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <Honeypot name="url" />
      <Step n="01" title={t.groups[0]} />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field name="company">
          <span className={label}>{t.company}</span>
          <input id="company" name="company" required defaultValue={v.company} className={input} />
        </Field>
        <Field name="sector">
          <span className={label}>{t.sector}</span>
          <input id="sector" name="sector" defaultValue={v.sector} className={input} />
        </Field>
        <Field name="website">
          <span className={label}>{t.website}</span>
          <input id="website_url" name="website" inputMode="url" defaultValue={v.website} className={input} />
        </Field>
        <Field name="logo">
          <span className={label}>{t.logo}</span>
          <input id="logo" name="logo" type="file" accept="image/png,image/jpeg,image/svg+xml" required className={`${input} file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-1.5 file:text-sm file:text-snow`} />
        </Field>
        <Field name="description">
          <span className={label}>{t.description}</span>
          <textarea id="description" name="description" rows={3} required defaultValue={v.description} className={input} />
        </Field>
        <Field name="needs">
          <span className={label}>{t.needs}</span>
          <textarea id="needs" name="needs" rows={3} defaultValue={v.needs} className={input} />
        </Field>
        <Field name="email">
          <span className={label}>{t.contact}</span>
          <input id="email" name="email" type="email" required defaultValue={v.email} className={input} />
        </Field>
        <Field name="phone">
          <span className={label}>{t.phone}</span>
          <input id="phone" name="phone" type="tel" defaultValue={v.phone} className={input} />
        </Field>
      </div>

      <Step n="02" title={t.groups[1]} />
      <fieldset>
        <legend className={label}>{t.hiring}</legend>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
          {Object.entries(t.hiringTypes).map(([k, name]) => (
            <label key={k} className="flex items-center gap-2 text-[15px] text-ink">
              <input type="checkbox" name="hiring" value={k} className="check" />
              {name}
            </label>
          ))}
        </div>
      </fieldset>

      <Step n="03" title={t.groups[2]} />
      <fieldset>
        <legend className="sr-only">{t.team}</legend>
        <div className="mt-3 grid gap-6 sm:grid-cols-2">
          {[1, 2].map((n) => (
            <div key={n} className="rounded-2xl border border-ink/10 bg-paper p-5">
              <p className="font-display text-lg font-semibold text-ink">
                {t.person} {n}
              </p>
              <Field name={`p${n}name`}>
                <span className={label}>{t.personName}</span>
                <input id={`p${n}name`} name={`p${n}name`} required defaultValue={v[`p${n}name`]} className={input} />
              </Field>
              <Field name={`p${n}title`}>
                <span className={`${label} mt-4`}>{t.personTitle}</span>
                <input id={`p${n}title`} name={`p${n}title`} required defaultValue={v[`p${n}title`]} className={input} />
              </Field>
            </div>
          ))}
        </div>
      </fieldset>

      <Step n="04" title={t.groups[3]} />
      <fieldset className="rounded-2xl bg-navy p-6 text-snow">
        <legend className="sr-only">{t.sponsorTitle}</legend>
        <p className="font-display text-2xl font-semibold tracking-tight">{t.sponsorTitle}</p>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-mist">{t.sponsorBody}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          {[{ key: "", name: t.sponsorNone }, ...packs].map((p) => (
            <label key={p.key} className="cursor-pointer">
              <input type="radio" name="sponsor" value={p.key} defaultChecked={(v.sponsor ?? "silver") === p.key} className="peer sr-only" />
              <span className="inline-flex rounded-full border border-white/25 px-4 py-2 text-[14px] font-medium transition-colors peer-checked:border-green peer-checked:bg-green peer-checked:text-night peer-focus-visible:ring-2 peer-focus-visible:ring-cyan">
                {p.name}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Check name="consent">{t.consent}</Check>
      <ErrorLine error={state?.error} />
      <button type="submit" disabled={pending} className={submit}>
        {t.submit}
      </button>
    </form>
  );
}
