import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { resolveCompanyId } from "@/lib/company";
import { searchCompanies } from "@/app/actions/company-onboarding";
import { CreateCompanyForm } from "@/components/create-company-form";
import { RequestToJoinButton } from "@/components/request-to-join-button";
import { PendingJoinRequest } from "@/components/pending-join-request";
import { Card, Badge, Input, Button } from "@/components/ui";

function firstParam(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export const metadata = {
  title: "Set up your company",
  robots: { index: false },
};

export default async function CompanyOnboardingPage({
  searchParams,
}: PageProps<"/company/onboarding">) {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/company/onboarding");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "company") {
    redirect("/");
  }

  // Already attached to a company (owner or member) — nothing to onboard.
  const companyId = await resolveCompanyId(supabase, user.id);
  if (companyId) {
    redirect("/company/profile");
  }

  const { data: pendingRequest } = await supabase
    .from("company_join_requests")
    .select("id, companies(company_name)")
    .eq("profile_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  const sp = await searchParams;
  const q = firstParam(sp.q);
  const results = q ? await searchCompanies(q) : [];

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-accent-2">
        Set up your company
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">
        Create or join a company
      </h1>
      <p className="mt-2 text-text-muted">
        If your company is already on ESENet, join it instead of creating a
        duplicate — a teammate can approve your request.
      </p>

      {pendingRequest ? (
        <div className="mt-10">
          <PendingJoinRequest
            requestId={pendingRequest.id}
            companyName={
              (pendingRequest.companies as unknown as { company_name: string } | null)
                ?.company_name ?? "this company"
            }
          />
        </div>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="font-mono text-xs uppercase tracking-widest text-text-faint">
              New company
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              Nobody from your company has signed up yet.
            </p>
            <div className="mt-4">
              <CreateCompanyForm />
            </div>
          </div>

          <div>
            <h2 className="font-mono text-xs uppercase tracking-widest text-text-faint">
              Join an existing company
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              A colleague already set one up — find it and ask to join.
            </p>
            <form action="/company/onboarding" className="mt-4 flex gap-2">
              <Input
                name="q"
                type="text"
                defaultValue={q}
                placeholder="Search by company name…"
              />
              <Button type="submit" variant="secondary" className="shrink-0 px-4">
                Search
              </Button>
            </form>

            {q && (
              <div className="mt-4 space-y-3">
                {results.length === 0 ? (
                  <p className="text-sm text-text-faint">
                    No company matches &ldquo;{q}&rdquo;. You can create it instead.
                  </p>
                ) : (
                  results.map((r) => (
                    <Card key={r.profile_id} className="p-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{r.company_name}</p>
                        {r.verified && <Badge tone="cyan">Verified</Badge>}
                      </div>
                      <div className="mt-2">
                        <RequestToJoinButton
                          companyId={r.profile_id}
                          companyName={r.company_name}
                        />
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
