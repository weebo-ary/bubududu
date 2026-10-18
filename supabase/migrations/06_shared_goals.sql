begin;
create table if not exists public.shared_goals (
 id uuid primary key default gen_random_uuid(),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 title text not null check(length(title) between 1 and 200), completed boolean not null default false
);
alter table public.shared_goals enable row level security;
revoke all on public.shared_goals from anon, authenticated;
grant select,insert,delete on public.shared_goals to authenticated;
drop policy if exists couple_read on public.shared_goals;
create policy couple_read on public.shared_goals for select to authenticated using(public.is_couple());
drop policy if exists couple_insert on public.shared_goals;
create policy couple_insert on public.shared_goals for insert to authenticated with check(public.is_couple() and created_by=auth.uid());
drop policy if exists own_delete on public.shared_goals;
create policy own_delete on public.shared_goals for delete to authenticated using(public.is_couple() and created_by=auth.uid());
drop policy if exists couple_update on public.shared_goals;
grant update(completed) on public.shared_goals to authenticated;
create policy couple_update on public.shared_goals for update to authenticated using(public.is_couple()) with check(public.is_couple());
create index if not exists shared_goals_created_at_idx on public.shared_goals(created_at desc);
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='shared_goals') then
 alter publication supabase_realtime add table public.shared_goals;
 end if;
end $$;
commit;
