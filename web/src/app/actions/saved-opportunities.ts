"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SavedState = { error: string } | { success: true } | null;

export async function toggleSavedOpportunity(
  _prevState: SavedState,
  formData: FormData
): Promise<SavedState> {
  const opportunityId = String(formData.get("opportunity_id") ?? "");
  const isSaved = formData.get("is_saved") === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to save opportunities." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "student") {
    return { error: "Only student accounts can save opportunities." };
  }

  const { error } = isSaved
    ? await supabase
        .from("saved_opportunities")
        .delete()
        .eq("student_id", user.id)
        .eq("opportunity_id", opportunityId)
    : await supabase
        .from("saved_opportunities")
        .insert({ student_id: user.id, opportunity_id: opportunityId });

  if (error) {
    console.error("toggleSavedOpportunity failed:", error);
    return { error: "We couldn't update your saved opportunities." };
  }

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/saved");
  return { success: true };
}
