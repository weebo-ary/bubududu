begin;
create table if not exists public.calendar_events (
 id uuid primary key default gen_random_uuid(),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 title text not null check(length(title) between 1 and 200), event_at timestamptz not null, notes text check(length(notes)<=5000)
);
alter table public.calendar_events enable row level security;
revoke all on public.calendar_events from anon, authenticated;
grant select,insert,delete on public.calendar_events to authenticated;
drop policy if exists couple_read on public.calendar_events;
create policy couple_read on public.calendar_events for select to authenticated using(public.is_couple());
drop policy if exists couple_insert on public.calendar_events;
create policy couple_insert on public.calendar_events for insert to authenticated with check(public.is_couple() and created_by=auth.uid());
drop policy if exists own_delete on public.calendar_events;
create policy own_delete on public.calendar_events for delete to authenticated using(public.is_couple() and created_by=auth.uid());
drop policy if exists couple_update on public.calendar_events;

create index if not exists calendar_events_created_at_idx on public.calendar_events(created_at desc);
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='calendar_events') then
 alter publication supabase_realtime add table public.calendar_events;
 end if;
end $$;
commit;
