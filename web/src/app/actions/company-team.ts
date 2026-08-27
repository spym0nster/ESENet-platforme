"use server";

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
