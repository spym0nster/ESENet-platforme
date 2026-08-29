import { notFound } from "next/navigation";
import { requireCompanyUser } from "@/lib/auth/require-company";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { InviteTeamMemberForm } from "@/components/invite-team-member-form";
import { TeamMemberRow, PendingInviteRow } from "@/components/team-member-row";
import { JoinRequestRow } from "@/components/join-request-row";
import {
  PendingOwnershipTransferRow,
  IncomingOwnershipTransfer,
} from "@/components/ownership-transfer";

export const metadata = {
  title: "Team",
  robots: { index: false },
};

export default async function CompanyTeamPage() {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const { supabase, user, company, companyId, isOwner } = await requireCompanyUser("/company/team");

  const [{ data: members }, { data: invites }, { data: joinRequests }, { data: transfer }] = await Promise.all([
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
    supabase
      // company_join_requests has two FKs to profiles (profile_id and
      // decided_by) — a bare "profiles(full_name)" embed is ambiguous and
      // PostgREST rejects the whole query. Same fix as fetchPosts() in
      // lib/posts.ts: name the specific FK to embed through.
      .from("company_join_requests")
      .select("id, profile_id, message, profiles!company_join_requests_profile_id_fkey(full_name)")
      .eq("company_id", companyId)
      .eq("status", "pending")
      .order("requested_at", { ascending: false }),
    supabase
      // Same ambiguous-FK situation as company_join_requests above —
      // from_profile_id and to_profile_id both point at profiles.
      .from("company_ownership_transfers")
      .select(
        "id, from_profile_id, to_profile_id, to:profiles!company_ownership_transfers_to_profile_id_fkey(full_name)"
      )
      .eq("company_id", companyId)
      .eq("status", "pending")
      .maybeSingle(),
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
        <h2 className="font-mono text-xs uppercase tracking-widest text-text-muted">
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
                canTransferTo={isOwner && m.role === "member" && !transfer}
                memberId={m.profile_id}
              />
            </li>
          ))}
        </ul>
      </div>

      {transfer && transfer.to_profile_id === user.id && (
        <div className="mt-10">
          <IncomingOwnershipTransfer
            transferId={transfer.id}
            companyName={company?.company_name ?? "this company"}
          />
        </div>
      )}

      {transfer && transfer.from_profile_id === user.id && (
        <div className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-widest text-text-muted">
            Ownership transfer
          </h2>
          <div className="mt-3">
            <PendingOwnershipTransferRow
              transferId={transfer.id}
              toName={
                (transfer.to as unknown as { full_name: string } | null)?.full_name ??
                "that member"
              }
            />
          </div>
        </div>
      )}

      {joinRequests && joinRequests.length > 0 && (
        <div className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-widest text-text-muted">
            Requests to join
          </h2>
          <ul className="mt-3 space-y-2">
            {joinRequests.map((r) => (
              <li key={r.id}>
                <JoinRequestRow
                  requestId={r.id}
                  requesterId={r.profile_id}
                  requesterName={
                    (r.profiles as unknown as { full_name: string } | null)?.full_name ??
                    "Someone"
                  }
                  message={r.message}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {invites && invites.length > 0 && (
        <div className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-widest text-text-muted">
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
