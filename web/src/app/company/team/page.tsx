import { notFound } from "next/navigation";
import { requireCompanyUser } from "@/lib/auth/require-company";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { InviteTeamMemberForm } from "@/components/invite-team-member-form";
import { TeamMemberRow, PendingInviteRow } from "@/components/team-member-row";

export default async function CompanyTeamPage() {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const { supabase, company, companyId, isOwner } = await requireCompanyUser("/company/team");

  const [{ data: members }, { data: invites }] = await Promise.all([
    supabase
      .from("company_members")
      .select("profile_id, role, profiles(full_name)")
      .eq("company_id", companyId)
      .order("role", { ascending: true }),
    supabase
      .from("company_invites")
      .select("id, email")
      .eq("company_id", companyId)
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-accent-2">
        {company?.company_name}
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Team</h1>
      <p className="mt-2 text-text-muted">
        Anyone you invite can post opportunities and manage applicants for{" "}
        {company?.company_name}. Only the account owner can remove a team member.
      </p>

      <div className="mt-10">
        <InviteTeamMemberForm />
      </div>

      <div className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-widest text-text-faint">
          Members
        </h2>
        <ul className="mt-3 space-y-2">
          {members?.map((m) => (
            <li key={m.profile_id}>
              <TeamMemberRow
                name={
                  (m.profiles as unknown as { full_name: string } | null)?.full_name ??
                  "Team member"
                }
                role={m.role as "owner" | "member"}
                canRemove={isOwner && m.role === "member"}
                memberId={m.profile_id}
              />
            </li>
          ))}
        </ul>
      </div>

      {invites && invites.length > 0 && (
        <div className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-widest text-text-faint">
            Pending invites
          </h2>
          <ul className="mt-3 space-y-2">
            {invites.map((i) => (
              <li key={i.id}>
                <PendingInviteRow email={i.email} inviteId={i.id} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
