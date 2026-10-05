import type { Metadata } from "next";
import Link from "next/link";
import { ApplicationForm } from "@/components/apply/application-form";
import { Button } from "@/components/ui/button";
import { EVENT } from "@/lib/constants";
import { db } from "@/lib/db";
import { features } from "@/lib/env";
import { getSettingsSafe } from "@/lib/services/settings";

export const metadata: Metadata = { title: "Apply — OC Operations Team" };
export const dynamic = "force-dynamic";

export default async function ApplyPage() {
  const settings = await getSettingsSafe();

  let skills: { id: string; name: string; isOther: boolean }[] = [];
  let unavailable = false;
  try {
    skills = await db.skill.findMany({
      where: { active: true },
      orderBy: [{ isOther: "asc" }, { sortOrder: "asc" }],
      select: { id: true, name: true, isOther: true },
    });
  } catch (err) {
    console.error("[apply] could not load skills", err);
    unavailable = true;
  }

  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-72 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
      <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
        <p className="eyebrow">
          <span className="text-azure">{EVENT.name}</span> · Operations team
        </p>
        <h1 className="display mt-4 text-4xl uppercase sm:text-6xl">Join the team</h1>
        <p className="mt-5 max-w-2xl leading-relaxed text-muted">
          Tell us who you are and what you can do. You don&apos;t choose a mission — the ESEN Ambassadors team assigns
          missions according to skills, experience and event needs. Takes about 5 minutes.
        </p>

        <div className="mt-12">
          {!settings.applicationsOpen ? (
            <Notice title="Applications are closed">
              Applications for the {EVENT.name} operations team are not open right now.
            </Notice>
          ) : unavailable || skills.length === 0 ? (
            <Notice title="Temporarily unavailable">
              The application form can&apos;t load right now. Please try again in a few minutes.
            </Notice>
          ) : (
            <ApplicationForm skills={skills} cvEnabled={features.cvUpload} />
          )}
        </div>
      </div>
    </div>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="frame-ticks border border-line bg-surface p-8">
      <h2 className="font-display text-2xl font-extrabold uppercase">{title}</h2>
      <p className="mt-3 text-muted">{children}</p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
