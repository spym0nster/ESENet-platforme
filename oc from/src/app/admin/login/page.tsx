import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { AmbassadorsCrest, EsenetLogo } from "@/components/brand/logo";
import { getStaffUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Staff sign in", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getStaffUser()) redirect("/admin");
  const { next } = await searchParams;

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
          <h1 className="mt-2 font-display text-2xl font-extrabold uppercase [font-stretch:112%]">OC Operations</h1>
          <p className="mt-1 text-sm text-muted">Sign in to review applications and manage assignments.</p>
          <div className="mt-6">
            <LoginForm next={next} />
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-dim">
          Applying to the OC team? <Link href="/apply" className="text-azure hover:underline">Use the application form</Link>.
        </p>
      </div>
    </main>
  );
}
