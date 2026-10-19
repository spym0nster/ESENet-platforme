import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/admin/forgot-password-form";
import { AmbassadorsCrest, EsenetLogo } from "@/components/brand/logo";
import { getStaffUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false, follow: false } };

export default async function ForgotPasswordPage() {
  if (await getStaffUser()) redirect("/admin");

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
          <h1 className="mt-2 font-display text-2xl font-extrabold uppercase [font-stretch:112%]">Forgot password</h1>
          <p className="mt-1 text-sm text-muted">Enter your account email — we&apos;ll send a link to set a new password.</p>
          <div className="mt-6">
            <ForgotPasswordForm />
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-dim">
          <Link href="/admin/login" className="text-azure hover:underline">Back to sign in</Link>
        </p>
      </div>
    </main>
  );
}
