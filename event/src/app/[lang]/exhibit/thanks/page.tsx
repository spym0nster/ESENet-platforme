import { notFound } from "next/navigation";
import { FormPage } from "@/components/form-page";
import { ButtonLink } from "@/components/ui";
import { FORMS } from "@/content/forms";
import { hasLocale } from "@/content/i18n";

export const metadata = { robots: { index: false } };

export default async function Thanks({ params }: PageProps<"/[lang]/exhibit/thanks">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = FORMS[lang].exhibitor;
  return (
    <FormPage lang={lang} label={t.label} title={t.doneTitle} body={t.doneBody}>
      <ButtonLink href={`/${lang}`}>{t.back}</ButtonLink>
    </FormPage>
  );
}
