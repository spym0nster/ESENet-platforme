import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/admin/reset-password-form";
import { AmbassadorsCrest, EsenetLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getStaffUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Set a new password", robots: { index: false, follow: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  if (await getStaffUser()) redirect("/admin");
  const { token } = await searchParams;

  return (
    <main className="relative grid min-h-dvh place-items-center px-4 py-12">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_65%)]" aria-hidden />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/"><EsenetLogo className="h-7" priority /></Link>
          <AmbassadorsCrest className="h-11 w-auto" />
        </div>
        <div className="frame-ticks border border-line bg-surface p-6 sm:p-8">
          <p className="eyebrow">ESEN Ambassadors · Staff only</p>
          <h1 className="mt-2 font-display text-2xl font-extrabold uppercase [font-stretch:112%]">Set a new password</h1>
          {token ? (
            <>
              <p className="mt-1 text-sm text-muted">Choose a new password for your account.</p>
              <div className="mt-6">
                <ResetPasswordForm token={token} />
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted">This link is missing its token — request a new one.</p>
              <Button asChild variant="outline" className="mt-6 w-full">
                <Link href="/admin/forgot-password">Request a new link</Link>
              </Button>
            </>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-dim">
          <Link href="/admin/login" className="text-azure hover:underline">Back to sign in</Link>
        </p>
      </div>
    </main>
  );
}
