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
  | "accepted"
  | "rejected";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
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
