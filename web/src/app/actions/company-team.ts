"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/company";
import { notify } from "@/lib/notifications";

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

  await notify(supabase, {
    recipientId: requesterId,
    actorId: user.id,
    kind: "join_request_approved",
    title: "You've joined the company",
    body: "Your request to join was approved — you can post opportunities and manage applicants now.",
    link: "/company/profile",
  });

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

  const { data: request } = await supabase
    .from("company_join_requests")
    .select("profile_id")
    .eq("id", requestId)
    .eq("company_id", companyId)
    .maybeSingle();

  const { error } = await supabase
    .from("company_join_requests")
    .update({ status: "declined", decided_at: new Date().toISOString(), decided_by: user.id })
    .eq("id", requestId)
    .eq("company_id", companyId);

  if (error) {
    console.error("declineJoinRequest failed:", error);
    return { error: "We couldn't decline that request." };
  }

  if (request) {
    await notify(supabase, {
      recipientId: request.profile_id as string,
      actorId: user.id,
      kind: "join_request_declined",
      title: "Join request declined",
      body: "Your request to join wasn't approved. You can create your own company or request to join another.",
      link: "/company/onboarding",
    });
  }

  revalidatePath("/company/team");
  return { success: true };
}

/**
 * The current owner proposes handing the company to an existing member.
 * RLS ("the current owner proposes a transfer...", 0014) independently
 * requires the caller to actually be this company's owner and the target
 * to actually already be a member — never an arbitrary profile.
 */
export async function initiateOwnershipTransfer(
  _prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const toProfileId = String(formData.get("to_profile_id") ?? "");
  if (!toProfileId) return { error: "Missing member." };

  const { supabase, user, companyId, error: authError } = await requireCompanyActor();
  if (!user || !companyId) return { error: authError ?? "Unexpected error." };

  const { error } = await supabase.from("company_ownership_transfers").insert({
    company_id: companyId,
    from_profile_id: user.id,
    to_profile_id: toProfileId,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "There's already a pending transfer for this company." };
    }
    console.error("initiateOwnershipTransfer failed:", error);
    return { error: "We couldn't start that transfer. Please try again." };
  }

  await notify(supabase, {
    recipientId: toProfileId,
    actorId: user.id,
    kind: "ownership_transfer_proposed",
    title: "You've been offered company ownership",
    body: "The current owner wants to transfer ownership to you. Accept or decline on the team page.",
    link: "/company/team",
  });

  revalidatePath("/company/team");
  return { success: true };
}

export async function cancelOwnershipTransfer(
  _prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const transferId = String(formData.get("transfer_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // RLS ("the initiating owner cancels...") independently restricts this
  // to the transfer's own initiator and to a still-pending row.
  const { error } = await supabase
    .from("company_ownership_transfers")
    .delete()
    .eq("id", transferId)
    .eq("from_profile_id", user.id);

  if (error) {
    console.error("cancelOwnershipTransfer failed:", error);
    return { error: "We couldn't cancel that transfer." };
  }

  revalidatePath("/company/team");
  return { success: true };
}

export async function declineOwnershipTransfer(
  _prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const transferId = String(formData.get("transfer_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("company_ownership_transfers")
    .update({ status: "declined", decided_at: new Date().toISOString() })
    .eq("id", transferId)
    .eq("to_profile_id", user.id);

  if (error) {
    console.error("declineOwnershipTransfer failed:", error);
    return { error: "We couldn't decline that transfer." };
  }

  revalidatePath("/company/team");
  return { success: true };
}

/**
 * The named recipient accepts, becoming the new owner. Five sequential
 * writes, same non-atomic shape already accepted for join-request
 * approval (see approveJoinRequest above) — each step's RLS check depends
 * on the previous one having actually committed, so order matters:
 *   1. mark the transfer 'accepted' (unlocks the four company_members
 *      policies below, all gated on finding this exact accepted row)
 *   2. delete the recipient's own 'member' row — must happen before step 3
 *      inserts a row with the same (company_id, profile_id) primary key
 *   3. insert the recipient as 'owner'
 *   4. delete the outgoing owner's 'owner' row — before step 5 reinserts
 *      that same (company_id, profile_id) pair
 *   5. insert the outgoing owner as 'member'
 * If this fails partway through, re-running Accept is mostly safe to
 * retry (each step is idempotent against its own already-done state) — the
 * one real gap is between steps 4 and 5: if step 5 never runs, the
 * outgoing owner is left with no company_members row at all (removed, not
 * demoted) rather than silently duplicated or corrupted. Worth a manual
 * fix if it's ever actually hit, not a data-integrity risk either way.
 */
export async function acceptOwnershipTransfer(
  _prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const transferId = String(formData.get("transfer_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: transfer, error: fetchError } = await supabase
    .from("company_ownership_transfers")
    .select("company_id, from_profile_id, to_profile_id, status")
    .eq("id", transferId)
    .eq("to_profile_id", user.id)
    .single();

  if (fetchError || !transfer) {
    return { error: "We couldn't find that transfer." };
  }
  if (transfer.status !== "pending") {
    return { error: "This transfer has already been decided." };
  }

  const { error: decideError } = await supabase
    .from("company_ownership_transfers")
    .update({ status: "accepted", decided_at: new Date().toISOString() })
    .eq("id", transferId)
    .eq("to_profile_id", user.id);
  if (decideError) {
    console.error("acceptOwnershipTransfer decide failed:", decideError);
    return { error: "We couldn't accept that transfer. Please try again." };
  }

  const { company_id: companyId, from_profile_id: fromProfileId } = transfer;

  const { error: removeSelfError } = await supabase
    .from("company_members")
    .delete()
    .eq("company_id", companyId)
    .eq("profile_id", user.id)
    .eq("role", "member");
  if (removeSelfError) {
    console.error("acceptOwnershipTransfer remove-self failed:", removeSelfError);
    return { error: "Accepted, but we couldn't finish the transfer. Please try again." };
  }

  const { error: promoteError } = await supabase
    .from("company_members")
    .insert({ company_id: companyId, profile_id: user.id, role: "owner" });
  if (promoteError) {
    console.error("acceptOwnershipTransfer promote failed:", promoteError);
    return { error: "Accepted, but we couldn't finish the transfer. Please try again." };
  }

  const { error: removeOldOwnerError } = await supabase
    .from("company_members")
    .delete()
    .eq("company_id", companyId)
    .eq("profile_id", fromProfileId)
    .eq("role", "owner");
  if (removeOldOwnerError) {
    console.error("acceptOwnershipTransfer remove-old-owner failed:", removeOldOwnerError);
    return { error: "Accepted, but we couldn't finish the transfer. Please try again." };
  }

  const { error: demoteError } = await supabase
    .from("company_members")
    .insert({ company_id: companyId, profile_id: fromProfileId, role: "member" });
  if (demoteError) {
    console.error("acceptOwnershipTransfer demote failed:", demoteError);
    return { error: "Accepted, but we couldn't finish the transfer. Please try again." };
  }

  revalidatePath("/company/team");
  revalidatePath("/company/profile");
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
