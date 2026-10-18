begin;
-- Secret bodies are kept outside the exposed public API schema.
create schema if not exists couple_private;
revoke all on schema couple_private from public,anon,authenticated;
create table if not exists public.mystery_boxes (
 id uuid primary key default gen_random_uuid(),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 title text not null check(length(title) between 1 and 200),
 opens_at timestamptz not null,
 body text
);
create table if not exists couple_private.box_contents (
 box_id uuid primary key references public.mystery_boxes(id) on delete cascade deferrable initially deferred,
 body text not null check(length(body) between 1 and 5000)
);
create or replace function couple_private.hide_box_body() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.body is null or length(new.body)=0 then raise exception 'A surprise needs a message'; end if;
 insert into couple_private.box_contents(box_id,body) values(new.id,new.body);
 new.body := null;
 return new;
end;
$$;
drop trigger if exists hide_box_body on public.mystery_boxes;
create trigger hide_box_body before insert on public.mystery_boxes for each row execute function couple_private.hide_box_body();
alter table public.mystery_boxes enable row level security;
revoke all on public.mystery_boxes from anon,authenticated;
grant select,insert,delete on public.mystery_boxes to authenticated;
drop policy if exists couple_read on public.mystery_boxes;
create policy couple_read on public.mystery_boxes for select to authenticated using(public.is_couple());
drop policy if exists couple_insert on public.mystery_boxes;
create policy couple_insert on public.mystery_boxes for insert to authenticated with check(public.is_couple() and created_by=auth.uid());
drop policy if exists own_delete on public.mystery_boxes;
create policy own_delete on public.mystery_boxes for delete to authenticated using(public.is_couple() and created_by=auth.uid());
create or replace function public.open_mystery_box(box_id uuid) returns text
language plpgsql security definer set search_path='' as $$
declare message text;
begin
 if not public.is_couple() then raise exception 'Only for Bubu & Dudu'; end if;
 select c.body into message from couple_private.box_contents c
 join public.mystery_boxes b on b.id=c.box_id
 where b.id=$1 and b.opens_at<=now();
 if message is null then raise exception 'This little surprise is still sleeping. Come back on its opening date.'; end if;
 return message;
end;
$$;
revoke all on function public.open_mystery_box(uuid) from public;
grant execute on function public.open_mystery_box(uuid) to authenticated;
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='mystery_boxes') then
 alter publication supabase_realtime add table public.mystery_boxes;
 end if;
end $$;
commit;
