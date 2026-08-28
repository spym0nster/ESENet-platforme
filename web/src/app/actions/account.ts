"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/company";

export type AccountActionState = { error: string } | null;

/**
 * Self-service account deletion. Anonymizes and deactivates rather than
 * hard-deleting — see 0012_account_deactivation.sql for why: profiles.id
 * IS auth.users.id, so a real delete would cascade into every comment,
 * application, and post that references this person, destroying OTHER
 * people's records as collateral. Instead:
 *  - the profiles row survives as a tombstone ("Deleted user", no images)
 *    so existing content still renders correctly for whoever holds it
 *  - everything purely personal (CV, education/experience/projects/
 *    certifications, saved opportunities) is actually removed
 *  - the account is marked deactivated_at (one-way, enforced by trigger)
 *    and signed out immediately
 *
 * A company OWNER is blocked here on purpose — deleting an owner's account
 * would leave their company ownerless. If they have another team member,
 * /company/team now offers a real ownership-transfer flow (0014); once
 * transferred, they're a plain member and can delete normally. A sole
 * owner with nobody to hand it to still has no self-service path and
 * needs to go through ESEN directly to transfer or close the company.
 */
export async function deleteMyAccount(): Promise<AccountActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "Profile not found." };

  if (profile.role === "company") {
    const companyId = await resolveCompanyId(supabase, user.id);
    if (companyId) {
      const { data: membership } = await supabase
        .from("company_members")
        .select("role")
        .eq("company_id", companyId)
        .eq("profile_id", user.id)
        .maybeSingle();

      if (membership?.role === "owner") {
        const { count: otherMembers } = await supabase
          .from("company_members")
          .select("profile_id", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("role", "member");

        return {
          error:
            otherMembers && otherMembers > 0
              ? "You're the owner of a company — transfer ownership to a team member on your company page before deleting your account."
              : "You're the owner of a company with nobody to hand it to — contact ESEN to transfer or close it before deleting your account.",
        };
      }

      // A plain member: leave as part of deletion (RLS: "a member can
      // remove themselves", 0012 — scoped to profile_id = auth.uid() and
      // role = 'member', so this can never touch anyone else's row).
      await supabase
        .from("company_members")
        .delete()
        .eq("company_id", companyId)
        .eq("profile_id", user.id)
        .eq("role", "member");
    }
  }

  if (profile.role === "student") {
    // CV path is always deterministic (<uid>/cv.pdf) — see
    // actions/student-profile.ts. Deleting student_details cascades
    // education/experiences/projects/certifications with it (all of them
    // reference student_details.profile_id on delete cascade) — nothing
    // else in the schema references those tables, so this is a clean,
    // collateral-free removal.
    await supabase.storage.from("cvs").remove([`${user.id}/cv.pdf`]);
    await supabase.from("student_details").delete().eq("profile_id", user.id);
    await supabase.from("saved_opportunities").delete().eq("student_id", user.id);
  }

  // Avatar/banner: the extension varies by what was uploaded, so list the
  // owner's folder rather than guessing a filename (same bucket/path
  // convention for both roles — profile-media/<id>/avatar.<ext> or
  // banner.<ext>).
  const { data: mediaFiles } = await supabase.storage.from("profile-media").list(user.id);
  if (mediaFiles && mediaFiles.length > 0) {
    await supabase.storage
      .from("profile-media")
      .remove(mediaFiles.map((f) => `${user.id}/${f.name}`));
  }

  const { error: anonymizeError } = await supabase
    .from("profiles")
    .update({
      full_name: "Deleted user",
      avatar_url: null,
      banner_url: null,
      deactivated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (anonymizeError) {
    console.error("deleteMyAccount failed:", anonymizeError);
    return { error: "We couldn't fully delete your account. Please try again." };
  }

  await supabase.auth.signOut();
  redirect("/account-deleted");
}
