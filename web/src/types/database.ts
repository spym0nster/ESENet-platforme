/**
 * Hand-written domain types matching supabase/schema.sql, for use in
 * component props etc. NOT wired up as the Supabase client's generic type —
 * see the note in src/lib/supabase/client.ts for why, and how to replace
 * this with real generated types once the project is linked.
 */

export type UserRole = "student" | "company" | "admin";

export type OpportunityType =
  | "internship"
  | "pfe"
  | "job"
  | "alternance"
  | "freelance";

export type OpportunityStatus = "pending" | "published" | "closed";

export type ApplicationStatus =
  | "applied"
  | "reviewed"
  | "shortlisted"
  | "interview"
  | "accepted"
  | "rejected"
  | "withdrawn";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  created_at: string;
  deactivated_at: string | null;
}

export interface StudentDetails {
  profile_id: string;
  headline: string | null;
  bio: string | null;
  skills: string[];
  looking_for: string | null;
  availability: string | null; // ISO date
  cv_url: string | null;
  linkedin_url: string | null;
}

export interface Company {
  profile_id: string;
  company_name: string;
  website: string | null;
  logo_url: string | null;
  banner_url: string | null;
  description: string | null;
  verified: boolean;
}

export interface Opportunity {
  id: string;
  company_id: string;
  type: OpportunityType;
  title: string;
  description: string;
  skills: string[];
  location: string | null;
  remote: boolean;
  start_date: string | null;
  end_date: string | null;
  status: OpportunityStatus;
  created_at: string;
}

export interface Application {
  id: string;
  opportunity_id: string;
  student_id: string;
  status: ApplicationStatus;
  message: string | null;
  created_at: string;
}

export interface ApplicationStatusEvent {
  id: string;
  application_id: string;
  status: ApplicationStatus;
  changed_by: string;
  created_at: string;
}

export interface Education {
  id: string;
  profile_id: string;
  school: string;
  degree: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface Experience {
  id: string;
  profile_id: string;
  title: string;
  organization: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  url: string | null;
  created_at: string;
}

export interface Certification {
  id: string;
  profile_id: string;
  name: string;
  issuer: string | null;
  issue_date: string | null;
  created_at: string;
}

export type CompanyMemberRole = "owner" | "member";

export interface CompanyMember {
  company_id: string;
  profile_id: string;
  role: CompanyMemberRole;
  title: string | null;
  created_at: string;
}

export interface CompanyInvite {
  id: string;
  company_id: string;
  email: string;
  invited_by: string;
  created_at: string;
  accepted_at: string | null;
}

export type PublishedAs = "self" | "company";

export interface Post {
  id: string;
  author_id: string;
  company_id: string | null;
  published_as: PublishedAs;
  body: string;
  media_url: string | null;
  link_url: string | null;
  opportunity_id: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
  removed_at: string | null;
  removed_by: string | null;
  removal_reason: string | null;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  removed_at: string | null;
  removed_by: string | null;
}

export interface PostLike {
  post_id: string;
  profile_id: string;
  created_at: string;
}

export type ReportReason =
  | "spam"
  | "harassment"
  | "inappropriate"
  | "fake_information"
  | "recruitment_abuse"
  | "other";

export type ReportStatus = "open" | "resolved" | "dismissed";

export interface ContentReport {
  id: string;
  reporter_id: string;
  post_id: string | null;
  comment_id: string | null;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export type NotificationKind =
  | "application_received"
  | "application_status_changed"
  | "application_withdrawn"
  | "join_request_received"
  | "join_request_approved"
  | "join_request_declined"
  | "ownership_transfer_proposed"
  | "post_comment";

export interface AppNotification {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  kind: NotificationKind;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

/** Denormalized shape used by feed/profile UI — a post plus what it needs to render. */
export interface PostWithAuthor extends Post {
  author: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    role: UserRole;
    headline: string | null;
  } | null;
  company: {
    profile_id: string;
    company_name: string;
    logo_url: string | null;
    verified: boolean;
  } | null;
  member_title: string | null;
  opportunity: { id: string; title: string; type: OpportunityType } | null;
  project: { id: string; title: string } | null;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
}
