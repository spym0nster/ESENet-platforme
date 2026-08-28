-- ESENet — optional note on an application status change (0021)
--
-- When a company moves an applicant to a new status (e.g. "interview" or
-- "rejected") it can now attach a short message that the student sees on
-- their application timeline and in the notification. Purely additive: one
-- nullable column, no policy change.
--
-- The existing RLS insert policies on application_status_events gate
-- `changed_by` / `status` / the application-ownership join; they don't
-- restrict other columns, so a nullable `note` needs no policy edit. The
-- length cap is a data-integrity guard, not a security boundary.
--
-- ADDITIVE ONLY.

alter table application_status_events
  add column if not exists note text;

alter table application_status_events
  drop constraint if exists application_status_events_note_len;
alter table application_status_events
  add constraint application_status_events_note_len
  check (note is null or char_length(note) <= 1000);
