-- ESENet — company ownership transfer
--
-- Deferred deliberately when account deletion shipped (0012/0013): a sole
-- owner had no way to give up ownership, so deleteMyAccount() just blocks
-- them outright with a "contact ESEN" message. That block is still there
-- and still correct for a company with no other members — this migration
-- only covers the case where the owner has an existing team member to
-- hand the company to.
--
-- The reason this waited for its own migration rather than riding along
-- with account deletion: company_members.role is trigger-locked immutable
-- (protect_company_member_identity, 0007) specifically because it closed
-- two real privilege-escalation bugs earlier in this project. The
-- resolution here does NOT touch that trigger at all — it only fires on
-- UPDATE, and this whole feature is built on DELETE-then-INSERT instead
-- (the same shape company_join_requests already uses: a consent record
-- captures both parties agreeing, then whoever's session is doing the
-- write is authorized only because a matching accepted/approved row
-- exists — never a blanket "owners can reassign roles" policy).
--
-- Flow: the current owner names an existing member as the proposed new
-- owner (company_ownership_transfers row); that member must accept it
-- themselves (their own consent, not something an owner can force through
-- unilaterally); accepting atomically (well, sequentially — see
-- actions/company-team.ts's acceptOwnershipTransfer for the same
-- non-atomic multi-step caveat already accepted for join-request
-- approval) swaps the two company_members rows.
--
-- ADDITIVE ONLY.

create table if not exists company_ownership_transfers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (profile_id) on delete cascade,
  from_profile_id uuid not null references profiles (id) on delete cascade,
  to_profile_id uuid not null references profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz
);

-- Only one transfer in flight per company at a time — starting a second
-- while one's still pending would be confusing (which one wins?) and
-- there's no legitimate reason to need two simultaneous offers.
create unique index if not exists company_ownership_transfers_pending_unique_idx
  on company_ownership_transfers (company_id)
  where status = 'pending';

create index if not exists company_ownership_transfers_company_idx
  on company_ownership_transfers (company_id);
create index if not exists company_ownership_transfers_to_idx
  on company_ownership_transfers (to_profile_id);

-- Same "RLS restricts rows, a trigger restricts columns" shape as every
-- other consent-record table in this schema — company_id/from/to/
-- requested_at are the transfer's identity, never editable after
-- creation; only status/decided_at (the decision) can change.
create or replace function protect_ownership_transfer_identity()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    new.company_id := old.company_id;
    new.from_profile_id := old.from_profile_id;
    new.to_profile_id := old.to_profile_id;
    new.requested_at := old.requested_at;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_ownership_transfer_identity_trigger on company_ownership_transfers;
create trigger protect_ownership_transfer_identity_trigger
before update on company_ownership_transfers
for each row
execute function protect_ownership_transfer_identity();

alter table company_ownership_transfers enable row level security;

-- Only the company's actual current owner can initiate, and only
-- targeting someone who's actually already a member of that same
-- company — never an arbitrary profile, never a company they don't own.
create policy "the current owner proposes a transfer to an existing member" on company_ownership_transfers for insert
  with check (
    from_profile_id = auth.uid()
    and exists (
      select 1 from company_members
      where company_members.company_id = company_ownership_transfers.company_id
        and company_members.profile_id = auth.uid()
        and company_members.role = 'owner'
    )
    and exists (
      select 1 from company_members
      where company_members.company_id = company_ownership_transfers.company_id
        and company_members.profile_id = company_ownership_transfers.to_profile_id
        and company_members.role = 'member'
    )
  );

create policy "involved parties and company actors see the transfer" on company_ownership_transfers for select
  using (
    from_profile_id = auth.uid()
    or to_profile_id = auth.uid()
    or is_company_actor(company_id)
  );

-- Only the named recipient can accept or decline — never the initiating
-- owner (they can only cancel, below), and never a third team member.
create policy "the named recipient accepts or declines" on company_ownership_transfers for update
  using (to_profile_id = auth.uid() and status = 'pending')
  with check (to_profile_id = auth.uid());

-- The initiating owner can call it off while it's still undecided.
create policy "the initiating owner cancels their pending transfer" on company_ownership_transfers for delete
  using (from_profile_id = auth.uid() and status = 'pending');

-- The four company_members writes an accepted transfer authorizes, each
-- narrowly gated by that exact (company_id, from/to) pair having an
-- 'accepted' row — never a general "owner can reassign roles" grant.

create policy "an accepted transfer promotes the recipient to owner" on company_members for insert
  with check (
    role = 'owner'
    and profile_id = auth.uid()
    and exists (
      select 1 from company_ownership_transfers t
      where t.company_id = company_members.company_id
        and t.to_profile_id = auth.uid()
        and t.status = 'accepted'
    )
  );

create policy "an accepted transfer removes the outgoing owner's row" on company_members for delete
  using (
    role = 'owner'
    and exists (
      select 1 from company_ownership_transfers t
      where t.company_id = company_members.company_id
        and t.from_profile_id = company_members.profile_id
        and t.to_profile_id = auth.uid()
        and t.status = 'accepted'
    )
  );

create policy "an accepted transfer demotes the outgoing owner to member" on company_members for insert
  with check (
    role = 'member'
    and exists (
      select 1 from company_ownership_transfers t
      where t.company_id = company_members.company_id
        and t.from_profile_id = company_members.profile_id
        and t.to_profile_id = auth.uid()
        and t.status = 'accepted'
    )
  );
