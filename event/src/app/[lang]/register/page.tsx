import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormPage } from "@/components/form-page";
import { VisitorForm } from "@/components/forms";
import { FORMS } from "@/content/forms";
import { hasLocale } from "@/content/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/register">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: `${FORMS[lang].visitor.title} — ESENet 2026`, alternates: { canonical: `/${lang}/register` } };
}

export default async function Register({ params }: PageProps<"/[lang]/register">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = FORMS[lang].visitor;
  return (
    <FormPage lang={lang} label={t.label} title={t.title} body={t.body} photo="checkin" aside={{ title: t.asideTitle, steps: t.steps }}>
      <VisitorForm lang={lang} />
    </FormPage>
  );
}
