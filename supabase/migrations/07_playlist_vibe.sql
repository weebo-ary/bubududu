begin;
create table if not exists public.playlist_tracks (
 id uuid primary key default gen_random_uuid(),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 title text not null check(length(title) between 1 and 200), url text not null check(url ~ '^https://')
);
alter table public.playlist_tracks enable row level security;
revoke all on public.playlist_tracks from anon, authenticated;
grant select,insert,delete on public.playlist_tracks to authenticated;
drop policy if exists couple_read on public.playlist_tracks;
create policy couple_read on public.playlist_tracks for select to authenticated using(public.is_couple());
drop policy if exists couple_insert on public.playlist_tracks;
create policy couple_insert on public.playlist_tracks for insert to authenticated with check(public.is_couple() and created_by=auth.uid());
drop policy if exists own_delete on public.playlist_tracks;
create policy own_delete on public.playlist_tracks for delete to authenticated using(public.is_couple() and created_by=auth.uid());
drop policy if exists couple_update on public.playlist_tracks;

create index if not exists playlist_tracks_created_at_idx on public.playlist_tracks(created_at desc);
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='playlist_tracks') then
 alter publication supabase_realtime add table public.playlist_tracks;
 end if;
end $$;
commit;
 