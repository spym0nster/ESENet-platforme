-- ESENet — tighten every function's search_path to `public, pg_temp` (0020)
--
-- 0019 pinned search_path = public on is_admin + the seven protect_*
-- triggers, which cleared the linter (0011_function_search_path_mutable).
-- This goes one step further: naming `pg_temp` explicitly and LAST means
-- the temp schema is searched after `public` for relation names instead of
-- implicitly before it — closing the "shadow a table via a temp table"
-- vector for good. Also applies it to the two SECURITY DEFINER helpers
-- (is_company_actor, has_application_to), which 0004/0017 had set to plain
-- `public`.
--
-- Logic-free: only the search_path GUC changes on each function. Idempotent
-- ALTERs, no drops. ADDITIVE ONLY.

alter function public.is_admin() set search_path = public, pg_temp;

alter function public.protect_profile_role() set search_path = public, pg_temp;
alter function public.protect_company_verified() set search_path = public, pg_temp;
alter function public.protect_post_admin_fields() set search_path = public, pg_temp;
alter function public.protect_comment_admin_fields() set search_path = public, pg_temp;
alter function public.protect_company_member_identity() set search_path = public, pg_temp;
alter function public.protect_join_request_identity() set search_path = public, pg_temp;
alter function public.protect_ownership_transfer_identity() set search_path = public, pg_temp;

alter function public.is_company_actor(uuid) set search_path = public, pg_temp;
alter function public.has_application_to(uuid) set search_path = public, pg_temp;
