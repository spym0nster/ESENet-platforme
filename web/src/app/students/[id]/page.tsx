import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { Avatar, Chip, EmptyState } from "@/components/ui";
import { PostCard } from "@/components/post-card";
import { fetchPosts } from "@/lib/posts";
import { fetchStudentProfile, availabilityLabel } from "@/lib/students";
import type {
  Education,
  Experience,
  Project,
  Certification,
} from "@/types/database";

// Signed-in-only, and never indexed: this page holds more personal data
// (bio, availability, full history) than anything else in the app.
export const metadata: Metadata = { robots: { index: false, follow: false } };

function dateRange(start: string | null, end: string | null): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  if (!start && !end) return "";
  return `${start ? fmt(start) : "?"} – ${end ? fmt(end) : "Present"}`;
}

export default async function StudentProfilePage({
  params,
}: PageProps<"/students/[id]">) {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/students/${id}`);
  }

  const student = await fetchStudentProfile(supabase, id);
  if (!student) {
    notFound();
  }

  const [
    { data: education },
    { data: experiences },
    { data: projects },
    { data: certifications },
  ] = await Promise.all([
    supabase.from("education").select("*").eq("profile_id", id).order("start_date", { ascending: false }),
    supabase.from("experiences").select("*").eq("profile_id", id).order("start_date", { ascending: false }),
    supabase.from("projects").select("*").eq("profile_id", id).order("created_at", { ascending: false }),
    supabase.from("certifications").select("*").eq("profile_id", id).order("issue_date", { ascending: false }),
  ]);

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const { posts } = await fetchPosts(supabase, {
    currentUserId: user.id,
    authorId: id,
    excludeRemoved: true,
  });

  const edu = (education as Education[] | null) ?? [];
  const exp = (experiences as Experience[] | null) ?? [];
  const proj = (projects as Project[] | null) ?? [];
  const certs = (certifications as Certification[] | null) ?? [];
  const firstName = student.full_name.split(" ")[0];
  const isCompanyViewer = viewerProfile?.role === "company";

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/students"
        className="inline-block py-2 font-mono text-xs text-accent-2 hover:text-text"
      >
        ← All students
      </Link>

      {/* banner + overlapping avatar — the /companies/[id] header pattern.
          No brand gradient here: that's the company banner's signature
          (§8), not a treatment every profile page reuses. */}
      <div className="mt-2 h-40 w-full overflow-hidden rounded-card bg-surface-alt [box-shadow:var(--lift)]">
        {student.banner_url && (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
          <img
            src={student.banner_url}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="-mt-10 px-1">
        <Avatar
          name={student.full_name}
          src={student.avatar_url}
          size="xl"
          className="ring-4 ring-[color:var(--bg)]"
        />
      </div>

      <div className="mt-4">
        <h1 className="font-display text-3xl font-extrabold">
          {student.full_name}
        </h1>
        {student.headline && (
          <p className="mt-1 text-text-muted">{student.headline}</p>
        )}
        <p className="mt-2 font-mono text-xs uppercase tracking-wide text-accent-2">
          {availabilityLabel(student.availability)}
        </p>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 font-mono text-xs">
          {student.linkedin_url && (
            <a
              href={student.linkedin_url}
              target="_blank"
              rel="noreferrer"
              className="py-1 text-accent-2 hover:text-text"
            >
              LinkedIn →
            </a>
          )}
          {isCompanyViewer && (
            <Link
              href="/company/opportunities/new"
              className="py-1 text-accent-2 hover:text-text"
            >
              Post an opportunity →
            </Link>
          )}
        </div>

        {isCompanyViewer && (
          <p className="mt-3 font-mono text-xs text-text-faint">
            The CV isn&apos;t shown here — a student attaches it when they apply
            to one of your roles.
          </p>
        )}
      </div>

      {student.looking_for && (
        <Section title="Looking for">
          <p className="text-sm text-text">{student.looking_for}</p>
        </Section>
      )}

      {student.bio && (
        <Section title="About">
          <p className="whitespace-pre-wrap text-sm text-text">{student.bio}</p>
        </Section>
      )}

      {student.skills.length > 0 && (
        <Section title="Skills">
          <div className="flex flex-wrap gap-2">
            {student.skills.map((skill) => (
              <Chip key={skill}>{skill}</Chip>
            ))}
          </div>
        </Section>
      )}

      {edu.length > 0 && (
        <Section title="Education">
          <ItemList
            items={edu.map((e) => ({
              id: e.id,
              title: e.degree ? `${e.degree} — ${e.school}` : e.school,
              subtitle: [e.field_of_study, dateRange(e.start_date, e.end_date)]
                .filter(Boolean)
                .join(" · "),
            }))}
          />
        </Section>
      )}

      {exp.length > 0 && (
        <Section title="Experience">
          <ItemList
            items={exp.map((e) => ({
              id: e.id,
              title: e.title,
              subtitle: [e.organization, dateRange(e.start_date, e.end_date)]
                .filter(Boolean)
                .join(" · "),
              body: e.description,
            }))}
          />
        </Section>
      )}

      {proj.length > 0 && (
        <Section title="Projects">
          <ItemList
            items={proj.map((p) => ({
              id: p.id,
              title: p.title,
              subtitle: p.url ?? "",
              subtitleHref: p.url,
              body: p.description,
            }))}
          />
        </Section>
      )}

      {certs.length > 0 && (
        <Section title="Certifications">
          <ItemList
            items={certs.map((c) => ({
              id: c.id,
              title: c.name,
              subtitle: [
                c.issuer,
                c.issue_date
                  ? new Date(c.issue_date).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })
                  : "",
              ]
                .filter(Boolean)
                .join(" · "),
            }))}
          />
        </Section>
      )}

      <Section title="Posts">
        {posts.length === 0 ? (
          <EmptyState
            title="No posts yet"
            body={`${firstName} hasn't posted in the feed.`}
          />
        ) : (
          <div className="space-y-5">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                supabase={supabase}
                post={post}
                currentUserId={user.id}
                currentUserName={viewerProfile?.full_name ?? ""}
                isAdmin={false}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-10">
      <h2 className="font-display text-lg font-semibold text-text">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

type DisplayItem = {
  id: string;
  title: string;
  subtitle: string;
  subtitleHref?: string | null;
  body?: string | null;
};

function ItemList({ items }: { items: DisplayItem[] }) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="border-l-2 border-border pl-4">
          <p className="font-display font-semibold">{item.title}</p>
          {item.subtitle &&
            (item.subtitleHref ? (
              <a
                href={item.subtitleHref}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-accent-2 hover:text-text"
              >
                {item.subtitle}
              </a>
            ) : (
              <p className="text-xs text-text-faint">{item.subtitle}</p>
            ))}
          {item.body && (
            <p className="mt-1 whitespace-pre-wrap text-sm text-text-muted">
              {item.body}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
