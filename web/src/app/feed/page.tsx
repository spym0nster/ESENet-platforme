import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { resolveCompanyId } from "@/lib/company";
import { fetchPosts } from "@/lib/posts";
import { PostComposer } from "@/components/post-composer";
import { PostCard } from "@/components/post-card";
import { EmptyState, LinkButton } from "@/components/ui";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ before?: string }>;
}) {
  const { before } = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <EmptyState
          title="Connect Supabase to see the feed"
          body="Set up your Supabase project and .env.local to enable the community feed."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let currentUserName: string | null = null;
  let companyName: string | null = null;
  let ownProjects: { id: string; title: string }[] = [];
  let ownOpportunities: { id: string; title: string }[] = [];

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin";
    currentUserName = profile?.full_name ?? null;

    if (profile?.role === "student") {
      const { data: projects } = await supabase
        .from("projects")
        .select("id, title")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false });
      ownProjects = projects ?? [];
    }

    if (profile?.role === "company") {
      const companyId = await resolveCompanyId(supabase, user.id);
      if (companyId) {
        const { data: company } = await supabase
          .from("companies")
          .select("company_name")
          .eq("profile_id", companyId)
          .single();
        companyName = company?.company_name ?? null;

        const { data: opportunities } = await supabase
          .from("opportunities")
          .select("id, title")
          .eq("company_id", companyId)
          .eq("status", "published")
          .order("created_at", { ascending: false });
        ownOpportunities = opportunities ?? [];
      }
    }
  }

  const { posts, nextCursor } = await fetchPosts(supabase, {
    currentUserId: user?.id ?? null,
    before,
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-widest text-accent-2">
          Community
        </p>
        <h1 className="mt-2 font-display text-[29px] font-semibold tracking-tight">
          Feed
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          What ESEN students, alumni and companies are building, sharing and
          hiring for.
        </p>
      </div>

      {user ? (
        <div className="mb-8">
          <PostComposer
            companyName={companyName}
            ownProjects={ownProjects}
            ownOpportunities={ownOpportunities}
          />
        </div>
      ) : (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface p-4 [box-shadow:var(--lift)]">
          <p className="text-sm text-text-muted">Log in to post, like and comment.</p>
          <LinkButton href="/login?next=/feed" variant="primary" size="compact">
            Log in
          </LinkButton>
        </div>
      )}

      {posts.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          body={
            user
              ? "Share a project, a milestone, or a role you're hiring for — your post starts the feed."
              : "Students and companies post what they're building and hiring for here."
          }
        />
      ) : (
        <div className="space-y-5">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              supabase={supabase}
              post={post}
              currentUserId={user?.id ?? null}
              currentUserName={currentUserName}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {nextCursor && (
        <div className="mt-8 text-center">
          <a
            href={`/feed?before=${encodeURIComponent(nextCursor)}`}
            className="font-mono text-[11px] uppercase tracking-widest text-accent-2 hover:text-text"
          >
            Older posts
          </a>
        </div>
      )}
    </div>
  );
}
