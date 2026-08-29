import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { Avatar, Badge, CompanyLogo, EmptyState, LinkButton } from "@/components/ui";
import { ShareButton } from "@/components/share-button";
import { OpportunityCard } from "@/components/opportunity-card";
import { PostCard } from "@/components/post-card";
import { fetchCompanyProfile } from "@/lib/companies";
import { fetchPosts } from "@/lib/posts";

const BANNER_GRADIENT =
  "linear-gradient(135deg, #0A0C33 0%, #171048 42%, #3C1560 72%, #641274 100%)";

const TABS = ["about", "roles", "team", "posts"] as const;
type Tab = (typeof TABS)[number];

export async function generateMetadata({
  params,
}: PageProps<"/companies/[id]">): Promise<Metadata> {
  if (!isSupabaseConfigured()) return {};
  const { id } = await params;
  const { data } = await createPublicClient()
    .from("companies")
    .select("company_name, description")
    .eq("profile_id", id)
    .maybeSingle();

  if (!data) return { title: "Company" };
  const description =
    (data.description as string | null)?.slice(0, 200) ??
    `${data.company_name} on ESENet — open roles and team.`;

  return {
    title: data.company_name as string,
    description,
    openGraph: { title: data.company_name as string, description },
  };
}

export default async function CompanyProfilePage({
  params,
  searchParams,
}: PageProps<"/companies/[id]">) {
  if (!isSupabaseConfigured()) notFound();

  const { id } = await params;
  const sp = await searchParams;
  const tabParam = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  const before = Array.isArray(sp.before) ? sp.before[0] : sp.before;
  const tab: Tab = (TABS as readonly string[]).includes(tabParam ?? "")
    ? (tabParam as Tab)
    : "about";

  const supabase = await createClient();
  const data = await fetchCompanyProfile(supabase, id);
  if (!data) notFound();

  const { company, opportunities, team, postCount } = data;

  // The Posts tab is the only one that needs the viewer's identity or the
  // (join-heavy) post bodies — fetch them only when it's the active tab.
  let posts: Awaited<ReturnType<typeof fetchPosts>>["posts"] = [];
  let postsCursor: string | null = null;
  let viewerId: string | null = null;
  let viewerName: string | null = null;
  if (tab === "posts") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    viewerId = user?.id ?? null;
    if (user) {
      const { data: viewer } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      viewerName = viewer?.full_name ?? null;
    }
    // company-voice only, soft-deleted rows dropped in-query — matches
    // `postCount` exactly, so a page of N and the "· N" tab agree and
    // "Older posts" pages the same set.
    const res = await fetchPosts(supabase, {
      currentUserId: viewerId,
      companyId: id,
      publishedAs: "company",
      excludeRemoved: true,
      before,
    });
    posts = res.posts;
    postsCursor = res.nextCursor;
  }

  const showRolesCta = opportunities.length > 0 && tab !== "roles";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/companies"
        className="inline-block py-2 font-mono text-xs text-accent-2 hover:text-text"
      >
        ← All companies
      </Link>

      {/* banner + overlapping logo */}
      <div
        className="mt-2 h-40 w-full overflow-hidden rounded-card [box-shadow:var(--lift)]"
        style={{ background: BANNER_GRADIENT }}
      >
        {company.banner_url && (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
          <img
            src={company.banner_url}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="-mt-10 px-1">
        <CompanyLogo
          name={company.company_name}
          src={company.logo_url}
          size="xl"
          className="ring-4 ring-[color:var(--bg)]"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-extrabold">
              {company.company_name}
            </h1>
            {company.verified ? (
              <Badge tone="cyan">Verified</Badge>
            ) : (
              <Badge tone="neutral">Not yet verified</Badge>
            )}
          </div>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block py-1 font-mono text-xs text-accent-2 hover:text-text"
            >
              {company.website.replace(/^https?:\/\//, "")} →
            </a>
          )}
        </div>

        {showRolesCta && (
          <LinkButton
            href={`/companies/${company.id}?tab=roles`}
            variant="primary"
          >
            See open roles
          </LinkButton>
        )}
      </div>

      {/* tabs — driven by ?tab= so a link to a company's roles is shareable */}
      <nav
        aria-label="Company sections"
        className="mt-8 flex flex-wrap gap-x-6 border-b border-border font-mono text-xs uppercase tracking-wider"
      >
        <TabLink id={company.id} tab="about" current={tab}>
          About
        </TabLink>
        <TabLink
          id={company.id}
          tab="roles"
          current={tab}
          count={opportunities.length}
        >
          Roles
        </TabLink>
        <TabLink id={company.id} tab="team" current={tab} count={team.length}>
          Team
        </TabLink>
        <TabLink id={company.id} tab="posts" current={tab} count={postCount}>
          Posts
        </TabLink>
      </nav>

      <div className="mt-8">
        {tab === "about" && (
          <section aria-label="About">
            {company.description ? (
              <p className="whitespace-pre-wrap leading-relaxed text-text">
                {company.description}
              </p>
            ) : (
              <EmptyState
                title="No description yet"
                body={`${company.company_name} hasn't written an "about" section.`}
              />
            )}
          </section>
        )}

        {tab === "roles" && (
          <section aria-label="Open roles">
            {opportunities.length === 0 ? (
              <EmptyState
                title={
                  company.verified
                    ? "No open roles right now"
                    : "Nothing published yet"
                }
                body={
                  company.verified
                    ? "Check back later, or browse roles from other companies."
                    : "This company's roles go live once ESENet verifies it."
                }
                action={
                  <Link
                    href="/opportunities"
                    className="font-mono text-xs uppercase tracking-widest text-accent-2 hover:text-text"
                  >
                    Browse all opportunities
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-4">
                {opportunities.map((o) => (
                  <li key={o.id}>
                    <OpportunityCard
                      opportunity={{
                        id: o.id,
                        type: o.type,
                        title: o.title,
                        skills: o.skills,
                        location: o.location,
                        remote: o.remote,
                        application_deadline: o.application_deadline,
                        company: {
                          name: company.company_name,
                          logo_url: company.logo_url,
                        },
                      }}
                      hideCompany
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === "team" && (
          <section aria-label="Team">
            {team.length === 0 ? (
              <EmptyState
                title="No team members listed"
                body={`Nobody from ${company.company_name} has joined ESENet yet.`}
              />
            ) : (
              <ul className="divide-y divide-border">
                {team.map((m) => {
                  const meta =
                    [m.title, m.role === "owner" ? "Owner" : null]
                      .filter(Boolean)
                      .join(" · ") || "Team member";
                  return (
                    <li
                      key={m.profile_id}
                      className="flex items-center gap-3 py-3"
                    >
                      <Avatar name={m.full_name} />
                      <div className="min-w-0">
                        <p className="font-display font-semibold text-text">
                          {m.full_name}
                        </p>
                        <p className="text-xs text-text-faint">{meta}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {tab === "posts" && (
          <section aria-label="Posts">
            {posts.length === 0 ? (
              <EmptyState
                title="No posts yet"
                body={`${company.company_name} hasn't posted in the community feed.`}
              />
            ) : (
              <>
                <div className="space-y-5">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      supabase={supabase}
                      post={post}
                      currentUserId={viewerId}
                      currentUserName={viewerName}
                      isAdmin={false}
                    />
                  ))}
                </div>
                {postsCursor && (
                  <div className="mt-8 text-center">
                    <Link
                      href={`/companies/${company.id}?tab=posts&before=${encodeURIComponent(
                        postsCursor
                      )}`}
                      className="font-mono text-xs uppercase tracking-widest text-accent-2 hover:text-text"
                    >
                      Older posts
                    </Link>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>

      <div className="mt-12 border-t border-border pt-6">
        <ShareButton path={`/companies/${company.id}`} label="Share profile" />
      </div>
    </div>
  );
}

function TabLink({
  id,
  tab,
  current,
  count,
  children,
}: {
  id: string;
  tab: Tab;
  current: Tab;
  count?: number;
  children: React.ReactNode;
}) {
  const active = tab === current;
  const href = tab === "about" ? `/companies/${id}` : `/companies/${id}?tab=${tab}`;

  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={`relative -mb-px py-3 transition ${
        active
          ? "text-text after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:rounded-full after:bg-accent"
          : "text-text-faint hover:text-text"
      }`}
    >
      {children}
      {count !== undefined && (
        <span className="ml-1.5 font-normal text-text-faint">· {count}</span>
      )}
    </Link>
  );
}
