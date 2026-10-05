import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EVENT, SUCCESS_COOKIE } from "@/lib/constants";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Application received", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SuccessPage() {
  // The application ID comes from a short-lived httpOnly cookie set by the submit action —
  // never from the URL, so nobody can look up someone else's application from here.
  const applicationId = (await cookies()).get(SUCCESS_COOKIE)?.value;
  let fullName: string | null = null;
  if (applicationId && /^OC26-[A-Z0-9]{6}$/.test(applicationId)) {
    try {
      const c = await db.candidate.findUnique({ where: { applicationId }, select: { fullName: true } });
      fullName = c?.fullName ?? null;
    } catch (err) {
      console.error("[success] lookup failed", err);
    }
  }

  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" aria-hidden />
      <div className="relative mx-auto max-w-2xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="frame-ticks animate-fade-up border border-line bg-surface p-6 sm:p-10">
          <CheckCircle2 className="size-10 text-green" strokeWidth={1.5} />
          <p className="eyebrow mt-6">{EVENT.name} · Operations team</p>
          <h1 className="display mt-3 text-4xl uppercase sm:text-5xl">Application received</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            Your application to the {EVENT.name} operational team has been received.
          </p>

          {applicationId && fullName && (
            <dl className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-2">
              <div className="bg-bg p-4">
                <dt className="eyebrow">Application ID</dt>
                <dd className="mt-2 font-mono text-2xl tracking-[0.08em] text-green">{applicationId}</dd>
              </div>
              <div className="bg-bg p-4">
                <dt className="eyebrow">Name</dt>
                <dd className="mt-2 text-lg font-semibold">{fullName}</dd>
              </div>
            </dl>
          )}

          <p className="mt-8 leading-relaxed text-muted">
            Your profile will be reviewed by the {EVENT.org} team.
            {applicationId && " Keep your application ID — quote it if you need to contact us."}
          </p>
          <Button asChild variant="outline" className="mt-8">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
