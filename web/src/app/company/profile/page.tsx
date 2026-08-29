import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCompanyUser } from "@/lib/auth/require-company";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { CompanyProfileForm } from "@/components/company-profile-form";
import { ProfileMediaUpload } from "@/components/profile-media-upload";
import { MyTitleForm } from "@/components/my-title-form";
import { LeaveCompanyButton } from "@/components/leave-company-button";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { Badge, EmptyState } from "@/components/ui";
import { fetchPosts } from "@/lib/posts";
import { PostCard } from "@/components/post-card";
import type { Company } from "@/types/database";

export const metadata = {
  title: "Company profile",
  robots: { index: false },
};

export default async function CompanyProfilePage() {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const { supabase, user, company, companyId, isOwner } = await requireCompanyUser("/company/profile");

  if (!company) {
    notFound();
  }

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: membership } = await supabase
    .from("company_members")
    .select("title")
    .eq("company_id", companyId)
    .eq("profile_id", user.id)
    .maybeSingle();

  const { posts: companyPosts } = await fetchPosts(supabase, {
    currentUserId: user.id,
    companyId,
  });

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent-2">
            Company profile
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold">
            {company.company_name}
          </h1>
        </div>
        <Badge tone={company.verified ? "cyan" : "neutral"}>
          {company.verified ? "Verified" : "Pending verification"}
        </Badge>
      </div>

      <div className="mt-10 space-y-6">
        <ProfileMediaUpload kind="avatar" currentUrl={company.logo_url} label="Logo" />
        <ProfileMediaUpload kind="banner" currentUrl={company.banner_url} label="Banner" />
      </div>

      <div className="mt-10">
        <CompanyProfileForm company={company as Company} />
      </div>

      <div className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-widest text-text-muted">
          Your title at this company
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          Shown next to your name in the feed, e.g. &ldquo;HR Manager&rdquo; or &ldquo;Project Manager&rdquo;.
        </p>
        <div className="mt-3">
          <MyTitleForm currentTitle={membership?.title ?? null} />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-widest text-text-muted">
          Company posts
        </h2>
        <div className="mt-4 space-y-5">
          {companyPosts.length === 0 ? (
            <EmptyState
              title="No posts yet"
              body="Posts published as this company (by any team member) will show up here."
            />
          ) : (
            companyPosts.map((post) => (
              <PostCard
                key={post.id}
                supabase={supabase}
                post={post}
                currentUserId={user.id}
                currentUserName={viewerProfile?.full_name ?? null}
                isAdmin={false}
              />
            ))
          )}
        </div>
      </div>

      <div className="mt-16 border-t border-border pt-8">
        <h2 className="font-mono text-xs uppercase tracking-widest text-magenta">
          Danger zone
        </h2>
        {isOwner ? (
          <p className="mt-2 text-sm text-text-muted">
            You own {company.company_name} — transfer ownership to a team
            member from the{" "}
            <Link href="/company/team" className="text-accent-2 hover:text-text">
              Team page
            </Link>{" "}
            before deleting your account. If you&rsquo;re the only person
            here, contact ESEN to transfer or close the company.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-text-muted">
              Leave {company.company_name} to detach from it and keep your
              ESENet account, or delete your account entirely — that
              removes your profile details and signs you out immediately.
              Neither can be undone.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <LeaveCompanyButton companyName={company.company_name} />
              <DeleteAccountButton />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
