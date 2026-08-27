-- ESENet — Profile photos & banners (students and companies)
--
-- `profiles.avatar_url` and `companies.logo_url` already existed but had no
-- upload path. `banner_url` is new on both. Storage is a single PUBLIC
-- bucket (unlike the private `cvs` bucket) — these images are meant to be
-- seen by anyone who can already see the profile/company (both are already
-- public-read tables), so a public URL is simplest; no signed-URL dance
-- needed. ADDITIVE ONLY.

alter table profiles add column if not exists banner_url text;
alter table companies add column if not exists banner_url text;

insert into storage.buckets (id, name, public)
values ('profile-media', 'profile-media', true)
on conflict (id) do nothing;

-- Path convention: <owner_profile_id>/avatar.<ext> or <owner_profile_id>/banner.<ext>.
-- <owner_profile_id> is the uploader's own id for a student or a solo
-- company owner, but for a company TEAM MEMBER it's the company's id, not
-- their own — so "is this mine to write" has to accept either identity
-- match (self) or company-actor membership, same as everywhere else a
-- company-owned resource is written.
create policy "owners and company actors upload their own profile media" on storage.objects for insert
  with check (
    bucket_id = 'profile-media'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or is_company_actor((storage.foldername(name))[1]::uuid)
    )
  );

create policy "owners and company actors manage their own profile media" on storage.objects for all
  using (
    bucket_id = 'profile-media'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or is_company_actor((storage.foldername(name))[1]::uuid)
    )
  )
  with check (
    bucket_id = 'profile-media'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or is_company_actor((storage.foldername(name))[1]::uuid)
    )
  );

-- No SELECT policy needed: the bucket is public, so Supabase Storage serves
-- GET requests for its objects directly without going through RLS.
