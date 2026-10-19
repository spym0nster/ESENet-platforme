import { notFound } from "next/navigation";
import { connection } from "next/server";
import { FormPage } from "@/components/form-page";
import { NodeRule, TransmutationRow } from "@/components/alchemy";
import { ButtonLink } from "@/components/ui";
import { FORMS } from "@/content/forms";
import { hasLocale } from "@/content/i18n";
import { db, qrSvg } from "@/lib/server";

export const metadata = { robots: { index: false } };

// The code in the URL is unguessable (40 random bits); it is also what the
// QR encodes, so the scanner and the ticket page agree.
export default async function Ticket({ params }: PageProps<"/[lang]/ticket/[code]">) {
  await connection();
  const { lang, code } = await params;
  if (!hasLocale(lang)) notFound();
  const t = FORMS[lang].visitor;
  const supabase = db();
  const { data } = supabase
    ? await supabase.from("event_visitors").select("full_name, status").eq("code", code).maybeSingle()
    : { data: null };
  if (!data) notFound();
  const svg = await qrSvg(code);

  return (
    <FormPage lang={lang} label={t.label} title={t.ticketTitle} body={t.ticketSub}>
      <div className="mx-auto max-w-sm overflow-hidden rounded-3xl border border-ink/10 bg-paper shadow-sm">
        <div className="bg-navy px-6 py-4 font-mono text-[11px] uppercase tracking-[0.26em] text-cyan-bright">ESENet 2026 · Data Alchimie</div>
        <div className="p-6 text-center">
          <div
            role="img"
            aria-label={code}
            className="mx-auto w-56 rounded-2xl bg-[#fff] p-4 [&>svg]:h-auto [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <p className="mt-5 font-display text-2xl font-semibold tracking-tight text-ink">{data.full_name}</p>
          <p className="mt-1 font-mono text-[12px] tracking-[0.2em] text-slate">{code}</p>
          <NodeRule className="mt-6" />
          <p className="mt-5 text-[14px] text-slate">{t.ticketWhen}</p>
          <p className="text-[14px] text-slate">{t.ticketWhere}</p>
        </div>
        <div className="bg-navy px-6 py-4">
          <TransmutationRow className="text-[11px]" />
        </div>
      </div>
      <div className="mt-8 text-center">
        <ButtonLink href={`/${lang}`} variant="outline">
          {t.back}
        </ButtonLink>
      </div>
    </FormPage>
  );
}
