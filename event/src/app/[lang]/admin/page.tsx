import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { isAdmin, reviewExhibitor } from "@/app/actions/admin";
import { AdminLogin } from "@/components/admin-ui";
import { hasLocale } from "@/content/i18n";
import { db } from "@/lib/server";

export const metadata = { title: "Organisers — ESENet 2026", robots: { index: false, follow: false } };

const cell = "border-b border-ink/10 px-3 py-3 align-top text-[14px]";
const btn = "rounded-full px-4 py-1.5 text-[13px] font-semibold";

export default async function Admin({ params }: PageProps<"/[lang]/admin">) {
  await connection();
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  if (!(await isAdmin())) return <AdminLogin />;

  const supabase = db();
  const [v, e, p] = supabase
    ? await Promise.all([
        supabase.from("event_visitors").select("full_name, email, status, school, wants_cv, consent_cv, checked_in_at, created_at").order("created_at", { ascending: false }),
        supabase.from("event_exhibitors").select("*").order("created_at", { ascending: false }),
        supabase.from("event_exhibitor_people").select("exhibitor_id, full_name, job_title, checked_in_at"),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const visitors = v.data ?? [];
  const exhibitors = e.data ?? [];
  const people = p.data ?? [];
  const stats = [
    ["Visitors", visitors.length],
    ["Checked in", visitors.filter((x) => x.checked_in_at).length],
    ["With CV", visitors.filter((x) => x.wants_cv && x.consent_cv).length],
    ["Exhibitors", exhibitors.length],
    ["Approved", exhibitors.filter((x) => x.status === "approved").length],
    ["Sponsor leads", exhibitors.filter((x) => x.sponsor_interest).length],
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-ink sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Organisers</h1>
        <Link href={`/${lang}/admin/scan`} className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-snow">
          Open check-in scanner
        </Link>
      </div>
      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-6">
        {stats.map(([k, n]) => (
          <div key={k} className="rounded-2xl border border-ink/10 bg-paper p-4">
            <dd className="font-display text-3xl font-semibold text-blue">{n}</dd>
            <dt className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-slate">{k}</dt>
          </div>
        ))}
      </dl>

      <h2 className="mt-12 font-display text-2xl font-semibold">Stand applications</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[820px] text-left">
          <thead className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate">
            <tr>
              <th className={cell}>Company</th>
              <th className={cell}>Team</th>
              <th className={cell}>Wants</th>
              <th className={cell}>Status</th>
              <th className={cell}>Stand · decision</th>
            </tr>
          </thead>
          <tbody>
            {exhibitors.map((x) => (
              <tr key={x.id}>
                <td className={cell}>
                  <p className="font-semibold">{x.company_name}</p>
                  <p className="text-slate">{x.contact_email}</p>
                  {x.website && (
                    <a href={x.website} className="text-blue underline" target="_blank" rel="noopener">
                      site
                    </a>
                  )}
                  {x.logo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={x.logo_url} alt="" className="mt-2 h-8 w-auto max-w-24 object-contain" />
                  )}
                </td>
                <td className={cell}>
                  {people.filter((q) => q.exhibitor_id === x.id).map((q) => (
                    <p key={q.full_name}>
                      {q.full_name} <span className="text-slate">— {q.job_title}</span>
                    </p>
                  ))}
                </td>
                <td className={cell}>
                  {x.hiring_types.join(", ") || "—"}
                  {x.sponsor_interest && <p className="mt-1 font-semibold text-teal">Sponsor: {x.sponsor_interest}</p>}
                  {x.needs && <p className="text-slate">{x.needs}</p>}
                </td>
                <td className={cell}>{x.status}{x.stand_number ? ` · ${x.stand_number}` : ""}</td>
                <td className={cell}>
                  <form action={reviewExhibitor} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={x.id} />
                    <input name="stand" defaultValue={x.stand_number ?? ""} placeholder="Stand n°" aria-label="Stand number" className="w-24 rounded-lg border border-ink/15 px-2 py-1.5 text-[14px]" />
                    <button name="decision" value="approved" className={`${btn} bg-green text-night`}>Approve</button>
                    <button name="decision" value="rejected" className={`${btn} border border-ink/20`}>Reject</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {exhibitors.length === 0 && <p className="py-6 text-slate">No applications yet.</p>}
      </div>

      <h2 className="mt-12 font-display text-2xl font-semibold">Visitors</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate">
            <tr>
              <th className={cell}>Name</th>
              <th className={cell}>Email</th>
              <th className={cell}>Status</th>
              <th className={cell}>School</th>
              <th className={cell}>CV shared</th>
              <th className={cell}>Checked in</th>
            </tr>
          </thead>
          <tbody>
            {visitors.slice(0, 300).map((x) => (
              <tr key={x.email}>
                <td className={cell}>{x.full_name}</td>
                <td className={cell}>{x.email}</td>
                <td className={cell}>{x.status}</td>
                <td className={cell}>{x.school ?? "—"}</td>
                <td className={cell}>{x.wants_cv && x.consent_cv ? "yes" : "—"}</td>
                <td className={cell}>{x.checked_in_at ? "yes" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {visitors.length > 300 && <p className="py-4 text-slate">Showing the latest 300 of {visitors.length}. Full list: Supabase or the Google Sheet.</p>}
      </div>
    </main>
  );
}
