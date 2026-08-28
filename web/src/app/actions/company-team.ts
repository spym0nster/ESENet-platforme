"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/company";

export type TeamActionState = { error: string } | { success: true } | null;

async function requireCompanyActor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, companyId: null, error: "You must be signed in." } as const;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "company") {
    return { supabase, user: null, companyId: null, error: "Only company accounts can do this." } as const;
  }

  const companyId = await resolveCompanyId(supabase, user.id);
  if (!companyId) {
    return { supabase, user: null, companyId: null, error: "You're not attached to a company yet." } as const;
  }

  return { supabase, user, companyId, error: null } as const;
}

export async function inviteTeamMember(
  _prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  const { supabase, user, companyId, error: authError } = await requireCompanyActor();
  if (!user || !companyId) return { error: authError ?? "Unexpected error." };

  const { error } = await supabase.from("company_invites").insert({
    company_id: companyId,
    email,
    invited_by: user.id,
  });

  if (error) {
    console.error("inviteTeamMember failed:", error);
    return { error: "We couldn't send that invite. Please try again." };
  }

  revalidatePath("/company/team");
  return { success: true };
}

export async function cancelInvite(
  _prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const inviteId = String(formData.get("invite_id") ?? "");
  const { supabase, user, companyId, error: authError } = await requireCompanyActor();
  if (!user || !companyId) return { error: authError ?? "Unexpected error." };

  const { error } = await supabase
    .from("company_invites")
    .delete()
    .eq("id", inviteId)
    .eq("company_id", companyId);

  if (error) {
    return { error: "We couldn't cancel that invite." };
  }

  revalidatePath("/company/team");
  return { success: true };
}

export async function removeTeamMember(
  _prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const memberId = String(formData.get("member_id") ?? "");
  const { supabase, user, companyId, error: authError } = await requireCompanyActor();
  if (!user || !companyId) return { error: authError ?? "Unexpected error." };

  // RLS ("company owner can remove a member") independently restricts this
  // to the owner and to role='member' rows — non-owners simply get 0 rows
  // affected rather than an error, which is fine to surface generically.
  const { error } = await supabase
    .from("company_members")
    .delete()
    .eq("company_id", companyId)
    .eq("profile_id", memberId)
    .eq("role", "member");

  if (error) {
    return { error: "We couldn't remove that team member." };
  }

  revalidatePath("/company/team");
  return { success: true };
}

/**
 * A member detaches from their company without deleting their ESENet
 * account — e.g. to join a different company afterward via the
 * /company/onboarding request-to-join flow. RLS ("a member can remove
 * themselves", 0012) independently restricts this to the caller's own
 * row and to role = 'member' — an owner can't leave this way, same
 * reasoning as deleteMyAccount() in actions/account.ts.
 */
export async function leaveCompany(): Promise<TeamActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("company_members")
    .delete()
    .eq("profile_id", user.id)
    .eq("role", "member");

  if (error) {
    console.error("leaveCompany failed:", error);
    return { error: "We couldn't remove you from the company." };
  }

  revalidatePath("/", "layout");
  redirect("/company/onboarding");
}

export async function approveJoinRequest(
  _prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const requestId = String(formData.get("request_id") ?? "");
  const requesterId = String(formData.get("requester_id") ?? "");
  const { supabase, user, companyId, error: authError } = await requireCompanyActor();
  if (!user || !companyId) return { error: authError ?? "Unexpected error." };

  // Two-step, same non-atomic shape as invite-acceptance in provisionProfile
  // (update the decision, then insert the membership row) — the membership
  // insert's RLS check requires the request to already be 'approved', so
  // the order matters. If the second step fails, the request is left
  // 'approved' with no member row yet; re-running Approve is safe (the
  // membership insert is naturally idempotent — RLS just re-checks the
  // same already-approved row — and the unique PK on company_members stops
  // a duplicate if it had actually succeeded).
  const { error: decideError } = await supabase
    .from("company_join_requests")
    .update({ status: "approved", decided_at: new Date().toISOString(), decided_by: user.id })
    .eq("id", requestId)
    .eq("company_id", companyId);

  if (decideError) {
    console.error("approveJoinRequest decide failed:", decideError);
    return { error: "We couldn't approve that request." };
  }

  const { error: memberError } = await supabase
    .from("company_members")
    .insert({ company_id: companyId, profile_id: requesterId, role: "member" });

  if (memberError) {
    console.error("approveJoinRequest membership failed:", memberError);
    return { error: "Approved, but we couldn't add them as a member yet. Try again." };
  }

  revalidatePath("/company/team");
  return { success: true };
}

export async function declineJoinRequest(
  _prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const requestId = String(formData.get("request_id") ?? "");
  const { supabase, user, companyId, error: authError } = await requireCompanyActor();
  if (!user || !companyId) return { error: authError ?? "Unexpected error." };

  const { error } = await supabase
    .from("company_join_requests")
    .update({ status: "declined", decided_at: new Date().toISOString(), decided_by: user.id })
    .eq("id", requestId)
    .eq("company_id", companyId);

  if (error) {
    console.error("declineJoinRequest failed:", error);
    return { error: "We couldn't decline that request." };
  }

  revalidatePath("/company/team");
  return { success: true };
}

/**
 * A member sets their own professional title (e.g. "HR Manager") shown next
 * to their name in the feed. Deliberately self-service and scoped to their
 * own row only — always .eq("profile_id", user.id), so an owner can't set
 * another member's title through this action.
 */
export async function updateMyTitle(
  _prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const title = String(formData.get("title") ?? "").trim().slice(0, 100);

  const { supabase, user, companyId, error: authError } = await requireCompanyActor();
  if (!user || !companyId) return { error: authError ?? "Unexpected error." };

  const { error } = await supabase
    .from("company_members")
    .update({ title: title || null })
    .eq("company_id", companyId)
    .eq("profile_id", user.id);

  if (error) {
    console.error("updateMyTitle failed:", error);
    return { error: "We couldn't save your title." };
  }

  revalidatePath("/company/profile");
  revalidatePath("/feed");
  return { success: true };
}
