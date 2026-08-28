-- ESENet — in-app notifications
--
-- Until now nothing on the platform tells anyone anything: a student never
-- learns their application moved, a company never learns someone applied or
-- asked to join, a member never learns they were offered ownership. This
-- adds a single per-user notification feed, written from the server actions
-- that already perform those mutations (same "app code inserts, RLS backs
-- it up" shape as application_status_events — not a trigger).
--
-- No email/push here — that's a separate piece. This is the in-app bell +
-- /notifications list only.
--
-- ADDITIVE ONLY.

create type notification_kind as enum (
  'application_received',        -- to company actors: a student applied
  'application_status_changed',  -- to student: company moved their application
  'application_withdrawn',       -- to company actors: a student withdrew
  'join_request_received',       -- to company actors: someone asked to join
  'join_request_approved',       -- to requester: you're in
  'join_request_declined',       -- to requester: declined
  'ownership_transfer_proposed', -- to named member: you've been offered ownership
  'post_comment'                 -- to post author: someone commented
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles (id) on delete cascade,
  -- who caused it (for the "X did Y" line + avatar); null for anything
  -- system-generated. on delete set null so a deleted actor's notifications
  -- survive as "Someone".
  actor_id uuid references profiles (id) on delete set null,
  kind notification_kind not null,
  title text not null,
  body text,
  link text, -- in-app relative path, e.g. /applications
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- The two access patterns: "my unread count" (the header bell) and "my
-- feed, newest first" (the /notifications page).
create index if not exists notifications_recipient_unread_idx
  on notifications (recipient_id)
  where read_at is null;
create index if not exists notifications_recipient_created_idx
  on notifications (recipient_id, created_at desc);

alter table notifications enable row level security;

-- Read + manage: strictly your own.
create policy "recipients read their own notifications" on notifications for select
  using (recipient_id = auth.uid());

create policy "recipients mark their own notifications read" on notifications for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

create policy "recipients delete their own notifications" on notifications for delete
  using (recipient_id = auth.uid());

-- Write: any signed-in user may create a notification FOR SOMEONE ELSE, and
-- only ever with a truthful actor_id (their own, or null). This is
-- deliberately permissive — every real call site is a server action that
-- has already done its own authorization. The residual abuse surface is
-- "an authenticated user hits /rest/v1/notifications directly and sends
-- another user a junk notification attributed to themselves"; they can't
-- read it back, can't impersonate a third party, and can't target
-- themselves. A future hardening pass could replace this with a
-- SECURITY DEFINER RPC that re-checks the actor/recipient relationship
-- per kind. Logged in web/docs/QA.md.
create policy "authenticated users create notifications for others" on notifications for insert
  with check (
    auth.uid() is not null
    and recipient_id <> auth.uid()
    and (actor_id is null or actor_id = auth.uid())
  );
