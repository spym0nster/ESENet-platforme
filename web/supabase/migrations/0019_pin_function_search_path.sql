-- ESENet — pin search_path on the older SECURITY-relevant functions (0019)
--
-- Supabase's database linter (0011_function_search_path_mutable) flags every
-- function that doesn't SET search_path: a role-mutable search_path lets a
-- caller shadow an unqualified name the function resolves at run time. The
-- newer helpers (is_company_actor, has_application_to) already pin it;
-- is_admin and the seven protect_* trigger functions (0003–0014) predate
-- that habit.
--
-- Fix is `SET search_path = public` per function — non-mutable, and every
-- one of these bodies only ever touches public tables (or nothing but
-- NEW/OLD). No behaviour change.
--
-- ADDITIVE ONLY (ALTER on existing objects, no drops).

alter function public.is_admin() set search_path = public;
alter function public.protect_profile_role() set search_path = public;
alter function public.protect_company_verified() set search_path = public;
alter function public.protect_post_admin_fields() set search_path = public;
alter function public.protect_comment_admin_fields() set search_path = public;
alter function public.protect_company_member_identity() set search_path = public;
alter function public.protect_join_request_identity() set search_path = public;
alter function public.protect_ownership_transfer_identity() set search_path = public;
