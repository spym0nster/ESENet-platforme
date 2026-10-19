import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormPage } from "@/components/form-page";
import { ExhibitorForm } from "@/components/forms";
import { FORMS } from "@/content/forms";
import { hasLocale } from "@/content/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/exhibit">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: `${FORMS[lang].exhibitor.title} — ESENet 2026`, alternates: { canonical: `/${lang}/exhibit` } };
}

export default async function Exhibit({ params }: PageProps<"/[lang]/exhibit">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = FORMS[lang].exhibitor;
  const packs = ["Bronze", "Silver", "Gold", "Platinum"].map((name) => ({ key: name.toLowerCase(), name }));
  return (
    <FormPage lang={lang} label={t.label} title={t.title} body={t.body} photo="stands" aside={{ title: t.asideTitle, steps: t.steps }}>
      <ExhibitorForm lang={lang} packs={packs} />
    </FormPage>
  );
}
