begin;
create table if not exists public.photo_diary (
 id uuid primary key default gen_random_uuid(),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 title text not null check(length(title) between 1 and 200), drive_url text not null check(drive_url ~ '^https://drive[.]google[.]com/')
);
alter table public.photo_diary enable row level security;
revoke all on public.photo_diary from anon, authenticated;
grant select,insert,delete on public.photo_diary to authenticated;
drop policy if exists couple_read on public.photo_diary;
create policy couple_read on public.photo_diary for select to authenticated using(public.is_couple());
drop policy if exists couple_insert on public.photo_diary;
create policy couple_insert on public.photo_diary for insert to authenticated with check(public.is_couple() and created_by=auth.uid());
drop policy if exists own_delete on public.photo_diary;
create policy own_delete on public.photo_diary for delete to authenticated using(public.is_couple() and created_by=auth.uid());
drop policy if exists couple_update on public.photo_diary;

create index if not exists photo_diary_created_at_idx on public.photo_diary(created_at desc);
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='photo_diary') then
 alter publication supabase_realtime add table public.photo_diary;
 end if;
end $$;
commit;
