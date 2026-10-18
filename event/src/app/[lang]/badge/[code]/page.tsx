import { notFound } from "next/navigation";
import { connection } from "next/server";
import { FormPage } from "@/components/form-page";
import { hasLocale } from "@/content/i18n";
import { db, qrSvg } from "@/lib/server";

export const metadata = { robots: { index: false } };

// Staff badge for an exhibitor's team member (QR = their STF- code).
export default async function Badge({ params }: PageProps<"/[lang]/badge/[code]">) {
  await connection();
  const { lang, code } = await params;
  if (!hasLocale(lang)) notFound();
  const supabase = db();
  const { data } = supabase
    ? await supabase.from("event_exhibitor_people").select("full_name, job_title, event_exhibitors(company_name, stand_number)").eq("code", code).maybeSingle()
    : { data: null };
  if (!data) notFound();
  const co = Array.isArray(data.event_exhibitors) ? data.event_exhibitors[0] : data.event_exhibitors;
  const svg = await qrSvg(code);
  return (
    <FormPage lang={lang} label={lang === "fr" ? "Badge exposant" : "Exhibitor badge"} title={data.full_name}>
      <div className="mx-auto max-w-sm overflow-hidden rounded-3xl border border-ink/10 bg-paper">
        <div className="bg-navy px-6 py-4 font-mono text-[11px] uppercase tracking-[0.26em] text-cyan-bright">ESENet 2026 · {co?.company_name}</div>
        <div className="p-6 text-center">
          <div role="img" aria-label={code} className="mx-auto w-56 rounded-2xl bg-white p-4 [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
          <p className="mt-5 font-display text-xl font-semibold text-ink">{data.job_title}</p>
          {co?.stand_number && <p className="mt-1 text-[14px] text-slate">Stand {co.stand_number}</p>}
          <p className="mt-3 font-mono text-[12px] tracking-[0.2em] text-slate">{code}</p>
        </div>
      </div>
    </FormPage>
  );
}
