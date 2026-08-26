import Link from "next/link";

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#0A0C33_0%,#171048_42%,#3C1560_72%,#641274_100%)] px-6 py-28 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#A79FD6]">
            ESEN &middot; Talent Fair &middot; Est. all year round
          </p>
          <h1 className="mt-6 font-display text-5xl font-extrabold tracking-tight text-balance sm:text-6xl">
            From Talent Fair to{" "}
            <span className="bg-[linear-gradient(90deg,#7B53FD,#1AA6FC)] bg-clip-text text-transparent">
              Talent Network
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[#D8D4F0]">
            A digital platform connecting ESEN students, alumni, companies and
            startups — the whole year, not just one day a year.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/opportunities"
              className="rounded-md bg-accent px-6 py-3 font-semibold text-white"
            >
              Browse opportunities
            </Link>
            <Link
              href="/signup"
              className="rounded-md border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10"
            >
              Create your profile
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-8 sm:grid-cols-3">
          <Feature
            eyebrow="Students"
            title="A profile that works for you"
            body="Skills, projects and experience — discover PFE and internship opportunities that actually fit."
          />
          <Feature
            eyebrow="Companies"
            title="Reach ESEN talent directly"
            body="Publish internships, PFE topics and jobs, and search student profiles instead of waiting for applications."
          />
          <Feature
            eyebrow="Everyone"
            title="Built for the ESEN community"
            body="Not another generic job board — a trusted network tied to ESEN's own students, alumni and events."
          />
        </div>
      </section>
    </>
  );
}

function Feature({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <p className="font-mono text-xs uppercase tracking-widest text-accent-2">
        {eyebrow}
      </p>
      <h3 className="mt-3 font-display text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-text-muted">{body}</p>
    </div>
  );
}
