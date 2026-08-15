-- Add resource metadata so one stable short URL can be reused per raffle.
alter table public.short_urls
  add column if not exists link_type text not null default 'general',
  add column if not exists resource_id uuid;

do $$
begin
  alter table public.short_urls
    add constraint short_urls_link_type_check
    check (link_type in ('general', 'raffle'));
exception
  when duplicate_object then null;
end
$$;

create unique index if not exists short_urls_active_raffle_resource_uidx
  on public.short_urls (resource_id)
  where link_type = 'raffle'
    and resource_id is not null
    and expires_at is null;

-- Short destinations are resolved through a narrow RPC instead of exposing
-- every destination and creator UUID to anonymous clients.
drop policy if exists "Anyone can read short URLs" on public.short_urls;
drop policy if exists "Public can read short URLs for redirects" on public.short_urls;
drop policy if exists "Anyone can create short URLs" on public.short_urls;
drop policy if exists "Authenticated users can create short URLs" on public.short_urls;
drop policy if exists "Users can update their own short URLs" on public.short_urls;
drop policy if exists "Users can view their own short URLs" on public.short_urls;
drop policy if exists "Admins can manage all short URLs" on public.short_urls;
revoke all on table public.short_urls from anon, authenticated;
drop policy if exists "Short URLs are accessible only through controlled functions" on public.short_urls;
create policy "Short URLs are accessible only through controlled functions"
on public.short_urls
for all
to anon, authenticated
using (false)
with check (false);

create schema if not exists private;
revoke all on schema private from public;

-- The shared legacy timestamp trigger writes to `atualizado_em`, while this
-- table uses `updated_at`. Keep a dedicated trigger so click tracking works.
create or replace function private.set_short_url_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists update_short_urls_updated_at on public.short_urls;
create trigger update_short_urls_updated_at
before update on public.short_urls
for each row execute function private.set_short_url_updated_at();

revoke execute on function private.set_short_url_updated_at() from public, anon, authenticated;

create or replace function private.create_raffle_short_url_internal(p_raffle_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_existing_code text;
  v_owner_id uuid;
  v_attempt integer;
  v_destination text;
begin
  if p_raffle_id is null then
    raise exception 'Rifa inválida' using errcode = '22023';
  end if;

  select r.user_id
    into v_owner_id
  from public.rifas_usuarios r
  where r.id = p_raffle_id;

  if not found then
    raise exception 'Rifa não encontrada' using errcode = 'P0002';
  end if;

  select s.short_code
    into v_existing_code
  from public.short_urls s
  where s.link_type = 'raffle'
    and s.resource_id = p_raffle_id
    and (s.expires_at is null or s.expires_at > now())
  order by s.created_at
  limit 1;

  if v_existing_code is not null then
    return v_existing_code;
  end if;

  v_destination := '/ferramentas/gerador-rifa?id=' || p_raffle_id::text;

  for v_attempt in 1..20 loop
    v_code := 'r' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

    begin
      insert into public.short_urls (
        short_code,
        original_url,
        created_by,
        link_type,
        resource_id
      ) values (
        v_code,
        v_destination,
        v_owner_id,
        'raffle',
        p_raffle_id
      );

      return v_code;
    exception
      when unique_violation then
        select s.short_code
          into v_existing_code
        from public.short_urls s
        where s.link_type = 'raffle'
          and s.resource_id = p_raffle_id
          and (s.expires_at is null or s.expires_at > now())
        order by s.created_at
        limit 1;

        if v_existing_code is not null then
          return v_existing_code;
        end if;
    end;
  end loop;

  raise exception 'Não foi possível gerar o link curto' using errcode = 'P0001';
end;
$$;

create or replace function private.resolve_short_url_internal(p_short_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_destination text;
begin
  if p_short_code is null or p_short_code !~ '^[A-Za-z0-9_-]{3,32}$' then
    raise exception 'Link curto inválido' using errcode = '22023';
  end if;

  update public.short_urls
  set clicks = clicks + 1,
      updated_at = now()
  where short_code = p_short_code
    and (expires_at is null or expires_at > now())
  returning original_url into v_destination;

  if v_destination is null then
    raise exception 'Link curto não encontrado ou expirado' using errcode = 'P0002';
  end if;

  return v_destination;
end;
$$;

revoke execute on function private.create_raffle_short_url_internal(uuid) from public, anon, authenticated;
revoke execute on function private.resolve_short_url_internal(text) from public, anon, authenticated;
grant usage on schema private to anon, authenticated, service_role;
grant execute on function private.create_raffle_short_url_internal(uuid) to anon, authenticated, service_role;
grant execute on function private.resolve_short_url_internal(text) to anon, authenticated, service_role;

create or replace function public.create_raffle_short_url(p_raffle_id uuid)
returns text
language sql
security invoker
set search_path = ''
as $$
  select private.create_raffle_short_url_internal(p_raffle_id)
$$;

create or replace function public.resolve_short_url(p_short_code text)
returns text
language sql
security invoker
set search_path = ''
as $$
  select private.resolve_short_url_internal(p_short_code)
$$;

revoke execute on function public.create_raffle_short_url(uuid) from public;
revoke execute on function public.resolve_short_url(text) from public;
grant execute on function public.create_raffle_short_url(uuid) to anon, authenticated, service_role;
grant execute on function public.resolve_short_url(text) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
