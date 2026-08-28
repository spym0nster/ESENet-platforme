"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveCompanyId } from "@/lib/company";
import { notify, companyActorIds } from "@/lib/notifications";
import type { ApplicationStatus } from "@/types/database";

export type ApplyState = { error: string } | { success: true } | null;
export type StatusUpdateState = { error: string } | { success: true } | null;

const COMPANY_SETTABLE_STATUSES: ApplicationStatus[] = [
  "applied",
  "reviewed",
  "shortlisted",
  "interview",
  "accepted",
  "rejected",
];

export async function applyToOpportunity(
  _prevState: ApplyState,
  formData: FormData
): Promise<ApplyState> {
  const opportunityId = String(formData.get("opportunity_id") ?? "");
  const message = String(formData.get("message") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/opportunities/${opportunityId}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "student") {
    return { error: "Only student accounts can apply to opportunities." };
  }

  // Server-side gate: the opportunity must still be open for applications.
  // The UI hides the form in these cases, so hitting this is a stale page or
  // a direct POST. RLS can't express "deadline hasn't passed", so this check
  // lives here.
  const { data: gate } = await supabase
    .from("opportunities")
    .select("status, application_deadline")
    .eq("id", opportunityId)
    .maybeSingle();
  if (!gate || gate.status !== "published") {
    return { error: "This opportunity isn't accepting applications." };
  }
  if (
    gate.application_deadline &&
    gate.application_deadline < new Date().toISOString().slice(0, 10)
  ) {
    return { error: "The application deadline for this opportunity has passed." };
  }

  const { error } = await supabase.from("applications").insert({
    opportunity_id: opportunityId,
    student_id: user.id,
    message: message || null,
  });

  if (error) {
    // The UI already hides this form once alreadyApplied is true, so a
    // duplicate-key violation here means a race (e.g. a double-submit)
    // rather than normal use — same friendly-message-plus-server-log
    // pattern as every other action in this codebase; never the raw
    // Postgres error (this one used to leak it directly to the client).
    console.error("applyToOpportunity failed:", error);
    return { error: "We couldn't submit your application. Please try again." };
  }

  const { data: opp } = await supabase
    .from("opportunities")
    .select("title, company_id")
    .eq("id", opportunityId)
    .maybeSingle();
  if (opp) {
    await notify(supabase, {
      recipientIds: await companyActorIds(supabase, opp.company_id),
      actorId: user.id,
      kind: "application_received",
      title: `New application: ${opp.title}`,
      body: `${profile.full_name} applied.`,
      link: `/company/opportunities/${opportunityId}/applicants`,
    });
  }

  revalidatePath(`/opportunities/${opportunityId}`);
  return { success: true };
}

/**
 * Company-side status update. Auth + ownership are checked server-side here
 * as defense in depth — RLS ("companies update status of applications to
 * their opportunities", with check status <> 'withdrawn') enforces the same
 * rule independently at the database layer.
 */
export async function updateApplicationStatus(
  _prevState: StatusUpdateState,
  formData: FormData
): Promise<StatusUpdateState> {
  const applicationId = String(formData.get("application_id") ?? "");
  const opportunityId = String(formData.get("opportunity_id") ?? "");
  const status = String(formData.get("status") ?? "") as ApplicationStatus;
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000) || null;

  if (!COMPANY_SETTABLE_STATUSES.includes(status)) {
    return { error: "Invalid status." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in as a company to do this." };
  }

  // Ownership check: this opportunity must belong to the company this user
  // acts for — either as owner or as an invited team member.
  const companyId = await resolveCompanyId(supabase, user.id);
  const { data: opportunity } = companyId
    ? await supabase
        .from("opportunities")
        .select("id")
        .eq("id", opportunityId)
        .eq("company_id", companyId)
        .maybeSingle()
    : { data: null };

  if (!opportunity) {
    return { error: "You don't have permission to update this application." };
  }

  const { error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", applicationId)
    .eq("opportunity_id", opportunityId);

  if (error) {
    console.error("updateApplicationStatus failed:", error);
    return { error: "We couldn't update this application. Please try again." };
  }

  await supabase.from("application_status_events").insert({
    application_id: applicationId,
    status,
    changed_by: user.id,
    note,
  });

  const { data: app } = await supabase
    .from("applications")
    .select("student_id, opportunities(title)")
    .eq("id", applicationId)
    .maybeSingle();
  if (app) {
    const oppTitle =
      (app.opportunities as unknown as { title: string } | null)?.title ??
      "an opportunity";
    await notify(supabase, {
      recipientId: app.student_id as string,
      actorId: user.id,
      kind: "application_status_changed",
      title: `Application update: ${oppTitle}`,
      body: note
        ? `Now "${status}" — "${note}"`
        : `Your application is now "${status}".`,
      link: `/applications/${applicationId}`,
    });
  }

  revalidatePath(`/company/opportunities/${opportunityId}/applicants`);
  return { success: true };
}

/**
 * Student-side withdrawal. A student may only ever move their own
 * application to 'withdrawn' — enforced here and independently by RLS.
 */
export async function withdrawApplication(
  _prevState: StatusUpdateState,
  formData: FormData
): Promise<StatusUpdateState> {
  const applicationId = String(formData.get("application_id") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to withdraw an application." };
  }

  const { data: appBefore } = await supabase
    .from("applications")
    .select("opportunity_id, opportunities(title, company_id)")
    .eq("id", applicationId)
    .eq("student_id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("applications")
    .update({ status: "withdrawn" })
    .eq("id", applicationId)
    .eq("student_id", user.id);

  if (error) {
    console.error("withdrawApplication failed:", error);
    return { error: "We couldn't withdraw this application. Please try again." };
  }

  await supabase.from("application_status_events").insert({
    application_id: applicationId,
    status: "withdrawn",
    changed_by: user.id,
  });

  const opp = appBefore?.opportunities as unknown as
    | { title: string; company_id: string }
    | null;
  if (opp) {
    await notify(supabase, {
      recipientIds: await companyActorIds(supabase, opp.company_id),
      actorId: user.id,
      kind: "application_withdrawn",
      title: `Application withdrawn: ${opp.title}`,
      body: "A candidate withdrew their application.",
      link: `/company/opportunities/${appBefore!.opportunity_id}/applicants`,
    });
  }

  revalidatePath("/applications");
  return { success: true };
}
