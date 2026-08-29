import Link from "next/link";
import { Badge, Card, Chip, CompanyLogo, MatchArc } from "@/components/ui";
import { SaveOpportunityButton } from "@/components/save-opportunity-button";

/**
 * The opportunity card — one whole-card tap target for a posting. Live on:
 *   - /opportunities              the browse list
 *   - /companies/[id]?tab=roles   a company's open roles
 *   - /saved                      a student's bookmarks (arcs on — cross-company)
 *
 * One surface still renders its own inline variant:
 *   - / (home)          the "Latest opportunities" strip tiles — a smaller
 *                       2-up tile, deliberately not this card
 *
 * Viewer personalization (match arc, matched-skill highlight, save toggle)
 * is opt-in through props, so a caller that doesn't have the signed-in
 * student's context — e.g. the public company page — renders the card with
 * nothing extra to fetch.
 *
 * Match-arc rule (so the item-7 sweep doesn't have to guess): the arc
 * renders on CROSS-company lists where a student is triaging between
 * employers — browse (/opportunities), the recommended strip, /saved, and
 * the detail hero. Never on a SINGLE-company list: on /companies/[id]
 * every row is the same employer, so the comparison the arc exists for
 * isn't there. That's why `showArc` is per-call-site, not inferred.
 */

const TYPE_LABEL: Record<string, string> = {
  internship: "Internship",
  pfe: "PFE",
  job: "Job",
  alternance: "Alternance",
  freelance: "Freelance",
};

const TYPE_TONE: Record<string, "neutral" | "cyan" | "violet" | "magenta"> = {
  internship: "cyan",
  alternance: "cyan",
  pfe: "violet",
  job: "magenta",
  freelance: "neutral",
};

export type OpportunityCardData = {
  id: string;
  type: string;
  title: string;
  skills: string[] | null;
  location: string | null;
  remote: boolean;
  application_deadline: string | null;
  company: { name: string; logo_url: string | null };
};

/** case-insensitive overlap of two skill lists */
function overlap(a: string[], b: string[]): string[] {
  const set = new Set(b.map((s) => s.toLowerCase()));
  return a.filter((s) => set.has(s.toLowerCase()));
}

export function OpportunityCard({
  opportunity: o,
  viewerSkills,
  showArc = false,
  saved,
  hideCompany = false,
}: {
  opportunity: OpportunityCardData;
  /** the signed-in student's skills — drives the matched-skill highlight and the arc numerator */
  viewerSkills?: string[];
  /** draw the match arc (a student with ≥3 skills). The 46px slot is reserved either way so titles wrap alike. */
  showArc?: boolean;
  /** render the save toggle (student only); the boolean is its initial state */
  saved?: boolean;
  /** drop the logo + company name — for the company's own page, where they only repeat the header */
  hideCompany?: boolean;
}) {
  const skills = o.skills ?? [];
  const vs = viewerSkills ?? [];
  const matchedCount = overlap(skills, vs).length;
  const matchedSet = new Set(overlap(skills, vs).map((s) => s.toLowerCase()));

  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const soonIso = new Date(now.getTime() + 7 * 864e5).toISOString().slice(0, 10);
  const deadline = o.application_deadline;
  const place = o.location ?? (o.remote ? "Remote" : null);

  return (
    <Card interactive className="relative">
      <Link
        href={`/opportunities/${o.id}`}
        className="absolute inset-0 rounded-card"
        aria-label={`${o.title} at ${o.company.name}`}
      />

      <div className="flex gap-3">
        {!hideCompany && (
          <CompanyLogo name={o.company.name} src={o.company.logo_url} />
        )}

        <div className="min-w-0 flex-1">
          {hideCompany ? (
            place && (
              <p className="font-mono text-xs text-text-faint">{place}</p>
            )
          ) : (
            <p className="flex items-center gap-2 text-xs text-text-faint">
              <span className="truncate text-text-muted">{o.company.name}</span>
              {o.location && <span className="font-mono">· {o.location}</span>}
              {o.remote && <span className="font-mono">· Remote</span>}
            </p>
          )}
          <h3 className="mt-0.5 font-display text-lg font-semibold leading-snug">
            {o.title}
          </h3>
        </div>

        {showArc &&
          (skills.length > 0 ? (
            <MatchArc matched={matchedCount} required={skills.length} />
          ) : (
            <div className="size-[46px] shrink-0" aria-hidden />
          ))}
      </div>

      {skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skills.slice(0, 5).map((s) => (
            <Chip key={s} match={matchedSet.has(s.toLowerCase())}>
              {s}
            </Chip>
          ))}
          {skills.length > 5 && <Chip>+{skills.length - 5}</Chip>}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-3 text-xs text-text-faint">
        <Badge tone={TYPE_TONE[o.type] ?? "neutral"}>
          {TYPE_LABEL[o.type] ?? o.type}
        </Badge>
        {deadline && deadline < todayIso && (
          <span className="font-mono">Applications closed</span>
        )}
        {deadline && deadline >= todayIso && deadline <= soonIso && (
          <span className="font-mono text-magenta-on-soft">
            Closes{" "}
            {new Date(deadline).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
            })}
          </span>
        )}
        {saved !== undefined && (
          <span className="relative z-10 ml-auto">
            <SaveOpportunityButton opportunityId={o.id} initiallySaved={saved} />
          </span>
        )}
      </div>
    </Card>
  );
}
