"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ApplyState = { error: string } | { success: true } | null;

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

  const { error } = await supabase.from("applications").insert({
    opportunity_id: opportunityId,
    student_id: user.id,
    message: message || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/opportunities/${opportunityId}`);
  return { success: true };
}
