-- ESENet — Professional community: posts, comments, likes, reports
--
-- Both students and company people (owners AND team members) can publish to
-- a single global feed. Reuses the existing multi-tenant model instead of
-- inventing a parallel one:
--   * is_company_actor()  (0004) — same "can this user act for this company"
--     check already used for opportunities/applications/profile media.
--   * profiles.role / student_details.headline — already there for identity.
--   * The public-bucket-with-folder-ownership pattern from profile-media
--     (0005) — reused for post images via a NEW bucket (post-media), because
--     the path shape is different: profile-media is one file per *kind* per
--     owner (avatar.ext/banner.ext), posts are many-per-author, so they need
--     their own bucket rather than colliding on that convention.
--
-- ADDITIVE ONLY — no table/column/data is dropped.

-- =========================================================
-- 0. company_members.title — the "professional title" the product spec
--    asks for (e.g. "HR Manager", "Project Manager"), so the feed can show
--    "Sarah Ben Ali · HR Manager · ABC Digital" instead of just a name.
--    Nullable, self-set by the member (see actions/company-team.ts).
-- =========================================================
alter table company_members add column if not exists title text;

-- =========================================================
-- 1. is_admin() — DRY helper for the many admin-moderation policies below.
--    Same query every other admin check in this codebase already inlines
--    (protect_profile_role, "admins verify companies"); pulled into one
--    function purely to avoid repeating it ~10 times in this file. No
--    SECURITY DEFINER needed — it only reads `profiles`, which already has
--    a public-read policy, so invoker rights are fine (no recursion risk
--    like is_company_actor had against company_members).
-- =========================================================
create or replace function is_admin()
returns boolean
language sql
stable
as $$
  select exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

-- =========================================================
-- 2. posts
-- =========================================================
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles (id) on delete cascade,
  -- Set iff the author is (at post time) an owner/member of a company —
  -- lets the feed show company context even on a "posted as myself" post.
  -- Resolved server-side via resolveCompanyId(); never trust a client-sent
  -- company_id (enforced by the insert policy below, which re-derives
  -- "is this really their company" via is_company_actor()).
  company_id uuid references companies (profile_id) on delete cascade,
  published_as text not null default 'self' check (published_as in ('self', 'company')),
  body text not null check (char_length(body) between 1 and 3000),
  media_url text,
  link_url text,
  opportunity_id uuid references opportunities (id) on delete set null,
  project_id uuid references projects (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  removed_at timestamptz,
  removed_by uuid references profiles (id),
  removal_reason text,
  check (published_as = 'self' or company_id is not null)
);

create index if not exists posts_created_at_idx on posts (created_at desc);
create index if not exists posts_author_idx on posts (author_id);
create index if not exists posts_company_idx on posts (company_id);

-- Author identity and moderation fields can't be restricted by RLS (RLS
-- filters rows, not columns — same lesson as protect_profile_role in
-- 0003). A plain "authors edit their own post" policy would otherwise let
-- an author silently reassign authorship or un-remove a moderated post via
-- direct REST. Lock those columns down in a trigger instead.
create or replace function protect_post_admin_fields()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    -- Authorship/attribution is immutable after creation, full stop —
    -- not even an admin should be able to reassign whose post this is.
    new.author_id := old.author_id;
    new.company_id := old.company_id;
    new.published_as := old.published_as;

    if not is_admin() then
      new.removed_at := old.removed_at;
      new.removed_by := old.removed_by;
      new.removal_reason := old.removal_reason;
    end if;

    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists protect_post_admin_fields_trigger on posts;
create trigger protect_post_admin_fields_trigger
before update on posts
for each row
execute function protect_post_admin_fields();

alter table posts enable row level security;

create policy "published posts are publicly readable" on posts for select
  using (removed_at is null);
create policy "authors see their own removed post" on posts for select
  using (author_id = auth.uid());
create policy "admins see all posts" on posts for select
  using (is_admin());

create policy "authenticated users create their own posts" on posts for insert
  with check (
    author_id = auth.uid()
    and (company_id is null or is_company_actor(company_id))
  );

create policy "authors edit their own post" on posts for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());
create policy "admins moderate posts" on posts for update
  using (is_admin())
  with check (is_admin());

create policy "authors delete their own post" on posts for delete
  using (author_id = auth.uid());
create policy "admins delete any post" on posts for delete
  using (is_admin());

-- =========================================================
-- 3. post_comments — one level deep, no threaded replies (per spec)
-- =========================================================
create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  removed_at timestamptz,
  removed_by uuid references profiles (id)
);

create index if not exists post_comments_post_idx on post_comments (post_id);

create or replace function protect_comment_admin_fields()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    new.author_id := old.author_id;
    new.post_id := old.post_id;

    if not is_admin() then
      new.removed_at := old.removed_at;
      new.removed_by := old.removed_by;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_comment_admin_fields_trigger on post_comments;
create trigger protect_comment_admin_fields_trigger
before update on post_comments
for each row
execute function protect_comment_admin_fields();

alter table post_comments enable row level security;

create policy "comments on visible posts are publicly readable" on post_comments for select
  using (removed_at is null);
create policy "authors see their own removed comment" on post_comments for select
  using (author_id = auth.uid());
create policy "admins see all comments" on post_comments for select
  using (is_admin());

create policy "authenticated users comment on non-removed posts" on post_comments for insert
  with check (
    author_id = auth.uid()
    and exists (select 1 from posts where posts.id = post_id and posts.removed_at is null)
  );

create policy "authors edit their own comment" on post_comments for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());
create policy "admins moderate comments" on post_comments for update
  using (is_admin())
  with check (is_admin());

create policy "authors delete their own comment" on post_comments for delete
  using (author_id = auth.uid());
create policy "admins delete any comment" on post_comments for delete
  using (is_admin());

-- =========================================================
-- 4. post_likes — single reaction type for V1; the primary key itself
--    enforces "one like per user per post" at the database level, not
--    just in the app.
-- =========================================================
create table if not exists post_likes (
  post_id uuid not null references posts (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);

create index if not exists post_likes_post_idx on post_likes (post_id);

alter table post_likes enable row level security;

create policy "likes are publicly readable" on post_likes for select using (true);
create policy "users like posts as themselves" on post_likes for insert
  with check (profile_id = auth.uid());
create policy "users remove their own like" on post_likes for delete
  using (profile_id = auth.uid());

-- =========================================================
-- 5. content_reports — basic moderation queue, not a full case-management
--    system. Reporters can only see their own reports; only admins can
--    triage/resolve.
-- =========================================================
create table if not exists content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles (id) on delete cascade,
  post_id uuid references posts (id) on delete cascade,
  comment_id uuid references post_comments (id) on delete cascade,
  reason text not null check (
    reason in ('spam', 'harassment', 'inappropriate', 'fake_information', 'recruitment_abuse', 'other')
  ),
  details text,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references profiles (id),
  check (
    (post_id is not null and comment_id is null)
    or (post_id is null and comment_id is not null)
  )
);

create index if not exists content_reports_status_idx on content_reports (status);

alter table content_reports enable row level security;

create policy "reporters see their own reports" on content_reports for select
  using (reporter_id = auth.uid());
create policy "admins see all reports" on content_reports for select
  using (is_admin());

create policy "authenticated users file reports" on content_reports for insert
  with check (reporter_id = auth.uid());

create policy "admins triage reports" on content_reports for update
  using (is_admin())
  with check (is_admin());

-- =========================================================
-- 6. post-media storage — public bucket, same folder-ownership pattern as
--    profile-media (0005), but keyed by author_id with one file per post
--    rather than one fixed filename per kind, since a user can have many
--    posts. Path convention: <author_id>/<random>.<ext>.
-- =========================================================
insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do nothing;

create policy "authors upload their own post media" on storage.objects for insert
  with check (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "authors manage their own post media" on storage.objects for all
  using (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- No SELECT policy needed: the bucket is public, served directly by Storage.
