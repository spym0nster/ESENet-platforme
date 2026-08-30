import type { SupabaseClient } from "@supabase/supabase-js";

const PAGE_SIZE = 20;

export type StudentListItem = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  headline: string | null;
  skills: string[];
  looking_for: string | null;
  availability: string | null; // ISO date, when the student becomes available
};

export type StudentFilters = {
  q?: string;
  skill?: string;
  looking?: string;
  availableNow?: boolean;
  page?: number;
};

type RawRow = {
  profile_id: string;
  headline: string | null;
  skills: string[] | null;
  looking_for: string | null;
  availability: string | null;
  profiles: {
    full_name: string;
    avatar_url: string | null;
    created_at: string;
  } | null;
};

/**
 * A page of student profiles for the /students directory. Base table is
 * student_details (one row per student, public-read "for company search"
 * per schema.sql) joined to profiles!inner so we can exclude deactivated
 * tombstones and non-student rows. Only profiles the student has actually
 * started filling in are listed — a bare row (no headline, no bio, no
 * skills) is signup boilerplate, not a directory entry.
 *
 * Fetches one row past the page size so the caller knows if a next page
 * exists without a second COUNT query — same trick as the opportunities
 * list.
 */
export async function fetchStudents(
  supabase: SupabaseClient,
  filters: StudentFilters
): Promise<{ students: StudentListItem[]; hasNextPage: boolean; error: string | null }> {
  const page = Math.max(1, filters.page ?? 1);

  let query = supabase
    .from("student_details")
    .select(
      "profile_id, headline, skills, looking_for, availability, profiles!inner(full_name, avatar_url, created_at, role, deactivated_at)"
    )
    .eq("profiles.role", "student")
    .is("profiles.deactivated_at", null)
    .or("headline.not.is.null,bio.not.is.null,skills.neq.{}");

  const q = filters.q?.replace(/[,()]/g, " ").trim();
  if (q) {
    query = query.or(`headline.ilike.%${q}%,bio.ilike.%${q}%`);
  }
  if (filters.skill) {
    query = query.contains("skills", [filters.skill]);
  }
  if (filters.looking) {
    query = query.ilike("looking_for", `%${filters.looking}%`);
  }
  if (filters.availableNow) {
    const today = new Date().toISOString().slice(0, 10);
    query = query.or(`availability.is.null,availability.lte.${today}`);
  }

  query = query.order("created_at", { referencedTable: "profiles", ascending: false });

  const offset = (page - 1) * PAGE_SIZE;
  query = query.range(offset, offset + PAGE_SIZE);

  const { data, error } = await query;
  if (error) {
    console.error("fetchStudents failed:", error);
    return { students: [], hasNextPage: false, error: "Couldn't load student profiles." };
  }

  const rows = ((data ?? []) as unknown as RawRow[]).filter((r) => r.profiles);
  const hasNextPage = rows.length > PAGE_SIZE;

  const students: StudentListItem[] = rows.slice(0, PAGE_SIZE).map((r) => ({
    id: r.profile_id,
    full_name: r.profiles!.full_name,
    avatar_url: r.profiles!.avatar_url,
    headline: r.headline,
    skills: r.skills ?? [],
    looking_for: r.looking_for,
    availability: r.availability,
  }));

  return { students, hasNextPage, error: null };
}

export type StudentProfile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  headline: string | null;
  bio: string | null;
  skills: string[];
  looking_for: string | null;
  availability: string | null;
  linkedin_url: string | null;
};

/**
 * One student's public profile for /students/[id]. Returns null when the id
 * isn't a live student (missing, wrong role, or a deactivated tombstone) —
 * the page turns that into notFound(). The CV is deliberately not exposed
 * here: it lives in a private bucket whose RLS only lets a company read it
 * once that student has applied to them.
 */
export async function fetchStudentProfile(
  supabase: SupabaseClient,
  id: string
): Promise<StudentProfile | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, banner_url, role, deactivated_at")
    .eq("id", id)
    .maybeSingle();

  if (!profile || profile.role !== "student" || profile.deactivated_at) {
    return null;
  }

  const { data: details } = await supabase
    .from("student_details")
    .select("headline, bio, skills, looking_for, availability, linkedin_url")
    .eq("profile_id", id)
    .maybeSingle();

  return {
    id: profile.id,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    banner_url: profile.banner_url,
    headline: details?.headline ?? null,
    bio: details?.bio ?? null,
    skills: details?.skills ?? [],
    looking_for: details?.looking_for ?? null,
    availability: details?.availability ?? null,
    linkedin_url: details?.linkedin_url ?? null,
  };
}

/**
 * The single write path for `student_details` — a partial update, so a
 * caller that only has one field (an onboarding step) doesn't blank the
 * rest. Both `updateStudentProfile` (the /profile form) and the onboarding
 * step actions go through here. Callers validate; this just writes.
 */
export async function patchStudentDetails(
  supabase: SupabaseClient,
  userId: string,
  patch: Record<string, unknown>
) {
  return supabase
    .from("student_details")
    .update(patch)
    .eq("profile_id", userId);
}

/** "Available now" vs "Available from <month year>", from an ISO date or null. */
export function availabilityLabel(availability: string | null): string {
  if (!availability) return "Available now";
  const date = new Date(availability);
  if (Number.isNaN(date.getTime())) return "Available now";
  if (date.getTime() <= Date.now()) return "Available now";
  return `Available from ${date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })}`;
}
