import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { isAdmin } from "@/app/actions/admin";
import { Scanner } from "@/components/admin-ui";
import { hasLocale } from "@/content/i18n";

export const metadata = { title: "Check-in — ESENet 2026", robots: { index: false, follow: false } };

export default async function Scan({ params }: PageProps<"/[lang]/admin/scan">) {
  await connection();
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  if (!(await isAdmin())) redirect(`/${lang}/admin`);
  return <Scanner />;
}
