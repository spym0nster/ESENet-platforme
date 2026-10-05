import { ArrowDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { OpsDiagram } from "@/components/public/ops-diagram";
import { Button } from "@/components/ui/button";
import { EVENT } from "@/lib/constants";
import { getSettingsSafe } from "@/lib/services/settings";

export const dynamic = "force-dynamic";

const STEPS = [
  { n: "01", title: "Apply", body: "Tell us who you are and what you can do.", tag: "Input" },
  { n: "02", title: "Review", body: "The ESEN Ambassadors team reviews every profile.", tag: "Analysis" },
  { n: "03", title: "Assign", body: "Missions are assigned according to skills, experience and event needs.", tag: "Match" },
  { n: "04", title: "Operate", body: "Selected members work together across J-2, J-1 and Jour J.", tag: "Value" },
];

const DAYS = [
  { key: "J-2", title: "Setup & Preparation" },
  { key: "J-1", title: "Final Preparation & Coordination" },
  { key: "JOUR J", title: "Event Operations" },
];

export default async function LandingPage() {
  const { applicationsOpen } = await getSettingsSafe();

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_30%_20%,black,transparent_70%)]" aria-hidden />
        <div className="pointer-events-none absolute -top-40 right-0 h-[520px] w-[720px] rounded-full bg-navy-3/40 blur-[120px]" aria-hidden />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 pb-20 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:pb-28">
          <div className="min-w-0 animate-fade-up">
            <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-azure">{EVENT.name}</span>
              <span className="h-px w-6 bg-line-strong" aria-hidden />
              <span>{EVENT.theme}</span>
            </p>

            <h1 className="display mt-6 text-[clamp(2.25rem,10.5vw,7.5rem)] uppercase">
              Operations
              <br />
              <span className="text-gradient">Team</span>
            </h1>

            <p className="mt-8 font-display text-xl font-bold uppercase tracking-[0.04em] [font-stretch:112%] sm:text-2xl">
              Three days. One team. One mission.
            </p>

            <div className="mt-5 flex items-center gap-3 font-mono text-sm tracking-[0.2em] text-muted" aria-label="J-2, J-1, Jour J">
              <span className="text-text">J-2</span>
              <span className="h-px w-8 bg-gradient-brand" aria-hidden />
              <span className="text-text">J-1</span>
              <span className="h-px w-8 bg-gradient-brand" aria-hidden />
              <span className="text-green">JOUR J</span>
            </div>

            <p className="mt-8 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Join the operational team behind {EVENT.name}. Your skills, your energy and your commitment help build the
              experience behind the event.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              {applicationsOpen ? (
                <Button asChild size="xl">
                  <Link href="/apply">
                    Join the team <ArrowRight />
                  </Link>
                </Button>
              ) : (
                <Button size="xl" disabled>
                  Applications closed
                </Button>
              )}
              <Button asChild size="xl" variant="outline">
                <a href="#how-it-works">
                  How it works <ArrowDown />
                </a>
              </Button>
            </div>
          </div>

          <div className="min-w-0 animate-fade-up [animation-delay:120ms]">
            <OpsDiagram />
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Process</p>
              <h2 className="display mt-4 text-4xl uppercase sm:text-5xl">How it works</h2>
            </div>
            <p className="max-w-md text-muted">
              You don&apos;t pick your mission. You tell us what you&apos;re good at — we match you to where the event needs
              you most.
            </p>
          </div>

          <ol className="mt-14 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.n} className="group relative bg-bg p-6 transition-colors hover:bg-surface sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-azure">{s.n}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-dim">{s.tag}</span>
                </div>
                <div className="mt-10 flex items-center gap-2" aria-hidden>
                  <span className={`size-2 rounded-full ${i === STEPS.length - 1 ? "bg-green" : "bg-azure"}`} />
                  <span className="h-px flex-1 bg-line-strong" />
                </div>
                <h3 className="mt-6 font-display text-2xl font-extrabold uppercase [font-stretch:112%]">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── The three days ───────────────────────────────── */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Operational period</p>
              <h2 className="display mt-4 text-4xl uppercase sm:text-5xl">The three days</h2>
            </div>
            <p className="max-w-md text-muted">
              Every OC member is present for the complete operational period. Availability for all three days is a
              requirement, not a preference.
            </p>
          </div>

          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {DAYS.map((d, i) => (
              <article
                key={d.key}
                className={`frame-ticks relative flex min-h-64 flex-col justify-between border p-6 sm:p-8 ${
                  i === 2 ? "border-green/40 bg-linear-to-br from-surface to-navy-2" : "border-line bg-surface"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="eyebrow">Day {String(i + 1).padStart(2, "0")} / 03</span>
                  <span className={`size-2 rounded-full ${i === 2 ? "bg-green" : "bg-azure"}`} aria-hidden />
                </div>
                <div>
                  <p className={`display text-6xl uppercase sm:text-7xl ${i === 2 ? "text-gradient" : ""}`}>{d.key}</p>
                  <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-muted">{d.title}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,transparent,black_40%,transparent)]" aria-hidden />
        <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 py-24 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <p className="eyebrow">{EVENT.org}</p>
            <h2 className="display mt-4 max-w-3xl text-4xl uppercase sm:text-6xl">
              Build the experience <span className="text-gradient">behind the event.</span>
            </h2>
          </div>
          {applicationsOpen ? (
            <Button asChild size="xl" className="shrink-0">
              <Link href="/apply">
                Apply to join the OC team <ArrowRight />
              </Link>
            </Button>
          ) : (
            <p className="font-mono text-sm uppercase tracking-[0.16em] text-muted">Applications are currently closed.</p>
          )}
        </div>
      </section>
    </>
  );
}
