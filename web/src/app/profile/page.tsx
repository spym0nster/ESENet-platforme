import { notFound } from "next/navigation";
import { requireStudentUser } from "@/lib/auth/require-student";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { StudentProfileForm } from "@/components/student-profile-form";
import { CvUploadForm } from "@/components/cv-upload-form";
import { ProfileMediaUpload } from "@/components/profile-media-upload";
import { ProfileItemSection } from "@/components/profile-item-section";
import { fetchPosts } from "@/lib/posts";
import { PostCard } from "@/components/post-card";
import { EmptyState } from "@/components/ui";
import type {
  StudentDetails,
  Education,
  Experience,
  Project,
  Certification,
} from "@/types/database";

function dateRange(start: string | null, end: string | null): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  if (!start && !end) return "";
  return `${start ? fmt(start) : "?"} – ${end ? fmt(end) : "Present"}`;
}

export default async function ProfilePage() {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const { supabase, user, profile } = await requireStudentUser("/profile");

  const [
    { data: details },
    { data: education },
    { data: experiences },
    { data: projects },
    { data: certifications },
  ] = await Promise.all([
    supabase.from("student_details").select("*").eq("profile_id", user.id).single(),
    supabase.from("education").select("*").eq("profile_id", user.id).order("start_date", { ascending: false }),
    supabase.from("experiences").select("*").eq("profile_id", user.id).order("start_date", { ascending: false }),
    supabase.from("projects").select("*").eq("profile_id", user.id).order("created_at", { ascending: false }),
    supabase.from("certifications").select("*").eq("profile_id", user.id).order("issue_date", { ascending: false }),
  ]);

  const studentDetails = details as StudentDetails | null;
  const { posts: myPosts } = await fetchPosts(supabase, {
    currentUserId: user.id,
    authorId: user.id,
  });

  let cvSignedUrl: string | null = null;
  if (studentDetails?.cv_url) {
    const { data } = await supabase.storage
      .from("cvs")
      .createSignedUrl(studentDetails.cv_url, 60 * 10); // 10 minutes
    cvSignedUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-accent-2">
        My profile
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">
        {profile.full_name}
      </h1>

      <div className="mt-10 space-y-6">
        <ProfileMediaUpload kind="avatar" currentUrl={profile.avatar_url} label="Photo" />
        <ProfileMediaUpload kind="banner" currentUrl={profile.banner_url} label="Banner" />
      </div>

      <div className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-widest text-text-faint">
          CV
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <CvUploadForm hasExistingCv={Boolean(studentDetails?.cv_url)} />
          {cvSignedUrl && (
            <a
              href={cvSignedUrl}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-accent-2 hover:text-text"
            >
              View current CV →
            </a>
          )}
        </div>
        <p className="mt-2 text-xs text-text-faint">PDF only, up to 5MB.</p>
      </div>

      {studentDetails && (
        <div className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-widest text-text-faint">
            About
          </h2>
          <div className="mt-3">
            <StudentProfileForm details={studentDetails} />
          </div>
        </div>
      )}

      <div className="mt-10">
        <ProfileItemSection
          table="education"
          sectionTitle="Education"
          emptyLabel="No education added yet."
          fields={[
            { name: "school", label: "School", required: true },
            { name: "degree", label: "Degree" },
            { name: "field_of_study", label: "Field of study" },
            { name: "start_date", label: "Start date", type: "date" },
            { name: "end_date", label: "End date", type: "date" },
          ]}
          items={(education as Education[] | null ?? []).map((e) => ({
            id: e.id,
            title: e.degree ? `${e.degree} — ${e.school}` : e.school,
            subtitle: [e.field_of_study, dateRange(e.start_date, e.end_date)]
              .filter(Boolean)
              .join(" · "),
          }))}
        />
      </div>

      <div className="mt-10">
        <ProfileItemSection
          table="experiences"
          sectionTitle="Experience"
          emptyLabel="No experience added yet."
          fields={[
            { name: "title", label: "Title", required: true },
            { name: "organization", label: "Organization" },
            { name: "description", label: "Description", type: "textarea" },
            { name: "start_date", label: "Start date", type: "date" },
            { name: "end_date", label: "End date", type: "date" },
          ]}
          items={(experiences as Experience[] | null ?? []).map((e) => ({
            id: e.id,
            title: e.title,
            subtitle: [e.organization, dateRange(e.start_date, e.end_date)]
              .filter(Boolean)
              .join(" · "),
          }))}
        />
      </div>

      <div className="mt-10">
        <ProfileItemSection
          table="projects"
          sectionTitle="Projects"
          emptyLabel="No projects added yet."
          fields={[
            { name: "title", label: "Title", required: true },
            { name: "description", label: "Description", type: "textarea" },
            { name: "url", label: "URL" },
          ]}
          items={(projects as Project[] | null ?? []).map((p) => ({
            id: p.id,
            title: p.title,
            subtitle: p.url ?? "",
          }))}
        />
      </div>

      <div className="mt-10">
        <ProfileItemSection
          table="certifications"
          sectionTitle="Certifications"
          emptyLabel="No certifications added yet."
          fields={[
            { name: "name", label: "Name", required: true },
            { name: "issuer", label: "Issuer" },
            { name: "issue_date", label: "Issue date", type: "date" },
          ]}
          items={(certifications as Certification[] | null ?? []).map((c) => ({
            id: c.id,
            title: c.name,
            subtitle: [c.issuer, c.issue_date ? new Date(c.issue_date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : ""]
              .filter(Boolean)
              .join(" · "),
          }))}
        />
      </div>

      <div className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-widest text-text-faint">Posts</h2>
        <div className="mt-4 space-y-5">
          {myPosts.length === 0 ? (
            <EmptyState title="No posts yet" body="Share a project, a milestone, or something you're working on in the feed." />
          ) : (
            myPosts.map((post) => (
              <PostCard
                key={post.id}
                supabase={supabase}
                post={post}
                currentUserId={user.id}
                currentUserName={profile.full_name}
                isAdmin={false}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
