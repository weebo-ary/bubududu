begin;
create table if not exists public.chat_notes (
 id uuid primary key default gen_random_uuid(),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 body text not null check(length(body) between 1 and 5000)
);
alter table public.chat_notes enable row level security;
revoke all on public.chat_notes from anon, authenticated;
grant select,insert,delete on public.chat_notes to authenticated;
drop policy if exists couple_read on public.chat_notes;
create policy couple_read on public.chat_notes for select to authenticated using(public.is_couple());
drop policy if exists couple_insert on public.chat_notes;
create policy couple_insert on public.chat_notes for insert to authenticated with check(public.is_couple() and created_by=auth.uid());
drop policy if exists own_delete on public.chat_notes;
create policy own_delete on public.chat_notes for delete to authenticated using(public.is_couple() and created_by=auth.uid());
drop policy if exists couple_update on public.chat_notes;

create index if not exists chat_notes_created_at_idx on public.chat_notes(created_at desc);
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='chat_notes') then
 alter publication supabase_realtime add table public.chat_notes;
 end if;
end $$;
commit;
