-- Run first. Replace the two example addresses before executing.
begin;
create table if not exists public.couple_whitelist (
  slot smallint primary key check (slot in (1,2)),
  email text not null unique check(email = lower(email))
);
alter table public.couple_whitelist enable row level security;
revoke all on public.couple_whitelist from anon, authenticated;
-- Fail closed: replace both addresses with your real emails, then uncomment.
-- insert into public.couple_whitelist(slot,email) values
-- (1,'bubu@example.com'),(2,'dudu@example.com')
-- on conflict(slot) do update set email=excluded.email;
create or replace function public.is_couple() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.couple_whitelist w
 join auth.users u on lower(u.email)=w.email
 where u.id=auth.uid() and u.email_confirmed_at is not null);
$$;
revoke all on function public.is_couple() from public;
grant execute on function public.is_couple() to authenticated;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'My favorite person',
 created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists profile_read on public.profiles;
create policy profile_read on public.profiles for select to authenticated using(public.is_couple());
drop policy if exists profile_create on public.profiles;
create policy profile_create on public.profiles for insert to authenticated with check(public.is_couple() and id=auth.uid());
drop policy if exists profile_update on public.profiles;
create policy profile_update on public.profiles for update to authenticated using(public.is_couple() and id=auth.uid()) with check(public.is_couple() and id=auth.uid());
grant select,insert,update on public.profiles to authenticated;
commit;
