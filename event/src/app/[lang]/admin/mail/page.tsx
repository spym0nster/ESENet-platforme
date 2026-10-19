import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { isAdmin } from "@/app/actions/admin";
import { MailForm } from "@/components/admin-ui";
import { hasLocale } from "@/content/i18n";
import { db } from "@/lib/server";

export const metadata = { title: "Send email — ESENet 2026", robots: { index: false, follow: false } };

export default async function Mail({ params }: PageProps<"/[lang]/admin/mail">) {
  await connection();
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  if (!(await isAdmin())) redirect(`/${lang}/admin`);

  const supabase = db();
  const [v, e] = supabase
    ? await Promise.all([
        supabase.from("event_visitors").select("wants_cv, consent_cv"),
        supabase.from("event_exhibitors").select("status"),
      ])
    : [{ data: [] }, { data: [] }];
  const vAll = v.data?.length ?? 0;
  const vCv = v.data?.filter((x) => x.wants_cv && x.consent_cv).length ?? 0;
  const eAll = e.data?.length ?? 0;
  const eOk = e.data?.filter((x) => x.status === "approved").length ?? 0;
  const ePending = e.data?.filter((x) => x.status === "pending").length ?? 0;
  const audiences = [
    { value: "visitors_all", label: `All visitors (${vAll})` },
    { value: "visitors_cv", label: `Visitors who shared their CV (${vCv})` },
    { value: "exhibitors_all", label: `All exhibitors (${eAll})` },
    { value: "exhibitors_approved", label: `Approved exhibitors (${eOk})` },
    { value: "exhibitors_pending", label: `Exhibitors awaiting approval (${ePending})` },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-ink sm:px-6">
      <Link href={`/${lang}/admin`} className="font-mono text-[12px] uppercase tracking-[0.2em] text-slate">
        ← Organisers
      </Link>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">Send an email</h1>
      <p className="mt-3 text-slate">
        Sent from <b>esenet.talentfair@esen.tn</b>, one personalised email each (“Bonjour name”), in the branded ESENet template.
        Blank lines make paragraphs. Send yourself a test first.
      </p>
      <MailForm audiences={audiences} />
    </main>
  );
}
