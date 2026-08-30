import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

export const metadata = {
  title: "Set up your profile",
  robots: { index: false },
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingShell subtitle="Set up your profile so companies can find you.">
      {children}
    </OnboardingShell>
  );
}
