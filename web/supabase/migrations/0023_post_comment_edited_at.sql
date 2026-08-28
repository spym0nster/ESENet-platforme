-- ESENet — track when a comment was edited (0023)
--
-- `post_comments` has no `updated_at` (unlike `posts`), and its
-- `protect_comment_admin_fields` trigger is a security mechanism we don't
-- want to touch just for a timestamp. Instead add a nullable `edited_at`
-- that the `editComment` server action sets explicitly on each edit — the
-- trigger only pins author_id / post_id / (for non-admins) the removal
-- columns, so a value written to `edited_at` passes straight through.
--
-- Drives the "edited" marker next to a comment, same as `posts.updated_at`
-- does for a post.
--
-- ADDITIVE ONLY. One nullable column. No RLS policy, trigger, or grant is
-- added or changed — NOT security-sensitive.

alter table post_comments
  add column if not exists edited_at timestamptz;
