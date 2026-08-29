import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { Card, Badge, EmptyState } from "@/components/ui";
import { VerifyCompanyButton } from "@/components/verify-company-button";

export const metadata = {
  title: "Company verification",
  robots: { index: false },
};

export default async function AdminCompaniesPage() {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const { supabase } = await requireAdminUser("/admin/companies");

  const { data: companies, error } = await supabase
    .from("companies")
    .select("profile_id, company_name, website, description, verified")
    .order("verified", { ascending: true });

  const pending = companies?.filter((c) => !c.verified) ?? [];
  const verified = companies?.filter((c) => c.verified) ?? [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/admin"
        className="inline-block py-2 font-mono text-xs text-accent-2 hover:text-text"
      >
        ← Admin overview
      </Link>
      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-accent-2">
        Admin
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">
        Company verification
      </h1>
      <p className="mt-2 text-text-muted">
        A company&apos;s opportunities are only visible to students once the
        company is verified here. Verify a company only after checking it&apos;s
        a real, legitimate organization.
      </p>

      {error && (
        <p className="mt-8 text-sm text-magenta">
          Couldn&apos;t load companies: {error.message}
        </p>
      )}

      <div className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-widest text-text-faint">
          Pending approval
        </h2>
        {pending.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Nothing pending."
              body="Every registered company is currently verified."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {pending.map((c) => (
              <li key={c.profile_id}>
                <Card className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display font-bold">{c.company_name}</p>
                    {c.website && (
                      <p className="text-sm text-text-muted">{c.website}</p>
                    )}
                  </div>
                  <VerifyCompanyButton companyProfileId={c.profile_id} />
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-widest text-text-faint">
          Verified companies
        </h2>
        {verified.length === 0 ? (
          <p className="mt-4 text-sm text-text-muted">None yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {verified.map((c) => (
              <li key={c.profile_id}>
                <Card className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-display font-bold">{c.company_name}</p>
                  <Badge variant="info">Verified</Badge>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
