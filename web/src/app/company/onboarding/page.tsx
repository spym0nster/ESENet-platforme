import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { resolveCompanyId } from "@/lib/company";
import { searchCompanies } from "@/app/actions/company-onboarding";
import { CreateCompanyForm } from "@/components/create-company-form";
import { RequestToJoinButton } from "@/components/request-to-join-button";
import { PendingJoinRequest } from "@/components/pending-join-request";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { companyStepProgress } from "@/lib/onboarding";
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

  // Already attached to a company — nothing to onboard.
  const companyId = await resolveCompanyId(supabase, user.id);
  if (companyId) {
    redirect("/company/dashboard");
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
  const { current, total } = companyStepProgress("create");

  return (
    <OnboardingShell subtitle="Set up your company so students can find your roles.">
      <OnboardingProgress current={current} total={total} />
      <h1 className="font-display text-3xl font-extrabold">
        Create or join your company
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        If a colleague already set it up, ask to join instead of making a
        duplicate.
      </p>

      {pendingRequest ? (
        <div className="mt-8">
          <PendingJoinRequest
            requestId={pendingRequest.id}
            companyName={
              (pendingRequest.companies as unknown as { company_name: string } | null)
                ?.company_name ?? "this company"
            }
          />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <div>
            <h2 className="font-display text-lg font-semibold">New company</h2>
            <div className="mt-3">
              <CreateCompanyForm />
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-text-faint">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <div>
            <h2 className="font-display text-lg font-semibold">
              Join an existing company
            </h2>
            <form action="/company/onboarding" className="mt-3 flex flex-wrap gap-2">
              <Input
                name="q"
                type="text"
                defaultValue={q}
                placeholder="Search by company name…"
              />
              <Button type="submit" variant="secondary" className="shrink-0">
                Search
              </Button>
            </form>

            {q && (
              <div className="mt-4 space-y-3">
                {results.length === 0 ? (
                  <p className="text-sm text-text-muted">
                    No company matches &ldquo;{q}&rdquo;. Create it instead.
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
    </OnboardingShell>
  );
}
