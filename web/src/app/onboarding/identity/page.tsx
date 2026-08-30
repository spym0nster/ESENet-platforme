import { guardStudentStep } from "@/lib/onboarding-guard";
import { studentStepProgress, nextQuery } from "@/lib/onboarding";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { IdentityForm } from "@/components/onboarding/identity-form";
import { ProfileMediaUpload } from "@/components/profile-media-upload";

export default async function IdentityStep({
  searchParams,
}: PageProps<"/onboarding/identity">) {
  const { supabase, user, snap, next } = await guardStudentStep(
    "identity",
    (await searchParams).next
  );
  const { current, total } = studentStepProgress("identity");

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <>
      <OnboardingProgress current={current} total={total} />
      <h1 className="font-display text-3xl font-extrabold">Who are you?</h1>
      <p className="mt-2 text-sm text-text-muted">
        A photo is optional — you can add one any time from your profile.
      </p>

      <div className="mt-8">
        <ProfileMediaUpload
          kind="avatar"
          currentUrl={profile?.avatar_url ?? null}
          label="Photo"
        />
      </div>

      <IdentityForm
        defaultName={snap.fullName}
        defaultHeadline={snap.headline}
        next={next}
        backHref={`/onboarding/goals${nextQuery(next)}`}
      />
    </>
  );
}
