begin;
create table if not exists public.mood_logs (
 id uuid primary key default gen_random_uuid(),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 mood text not null check(mood in ('Happy','Calm','Tired','Anxious','Need a hug')), energy smallint not null check(energy between 1 and 5), notes text check(length(notes)<=5000)
);
alter table public.mood_logs enable row level security;
revoke all on public.mood_logs from anon, authenticated;
grant select,insert,delete on public.mood_logs to authenticated;
drop policy if exists couple_read on public.mood_logs;
create policy couple_read on public.mood_logs for select to authenticated using(public.is_couple());
drop policy if exists couple_insert on public.mood_logs;
create policy couple_insert on public.mood_logs for insert to authenticated with check(public.is_couple() and created_by=auth.uid());
drop policy if exists own_delete on public.mood_logs;
create policy own_delete on public.mood_logs for delete to authenticated using(public.is_couple() and created_by=auth.uid());
drop policy if exists couple_update on public.mood_logs;

create index if not exists mood_logs_created_at_idx on public.mood_logs(created_at desc);
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='mood_logs') then
 alter publication supabase_realtime add table public.mood_logs;
 end if;
end $$;
commit;
