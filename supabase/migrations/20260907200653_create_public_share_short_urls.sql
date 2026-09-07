-- Create stable short links for public share buttons without exposing the
-- short_urls table. Only internal application paths are accepted.
create or replace function private.create_short_url_internal(p_original_url text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_existing_code text;
  v_attempt integer;
begin
  if p_original_url is null
    or length(p_original_url) < 2
    or length(p_original_url) > 2048
    or left(p_original_url, 1) <> '/'
    or left(p_original_url, 2) = '//'
    or p_original_url ~ '[[:cntrl:]]'
  then
    raise exception 'Destino inválido para link curto' using errcode = '22023';
  end if;

  -- Serialize creation for the same destination so concurrent shares reuse
  -- one stable code instead of generating duplicates.
  perform pg_advisory_xact_lock(hashtextextended(p_original_url, 0));

  select s.short_code
    into v_existing_code
  from public.short_urls s
  where s.link_type = 'general'
    and s.original_url = p_original_url
    and (s.expires_at is null or s.expires_at > now())
  order by s.created_at
  limit 1;

  if v_existing_code is not null then
    return v_existing_code;
  end if;

  for v_attempt in 1..20 loop
    v_code := 'g' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

    begin
      insert into public.short_urls (
        short_code,
        original_url,
        created_by,
        link_type
      ) values (
        v_code,
        p_original_url,
        auth.uid(),
        'general'
      );

      return v_code;
    exception
      when unique_violation then null;
    end;
  end loop;

  raise exception 'Não foi possível gerar o link curto' using errcode = 'P0001';
end;
$$;

revoke execute on function private.create_short_url_internal(text) from public;
grant usage on schema private to anon, authenticated, service_role;
grant execute on function private.create_short_url_internal(text) to anon, authenticated, service_role;
grant execute on function private.resolve_short_url_internal(text) to anon, authenticated, service_role;

create or replace function public.create_short_url(p_original_url text)
returns text
language sql
security invoker
set search_path = ''
as $$
  select private.create_short_url_internal(p_original_url)
$$;

revoke execute on function public.create_short_url(text) from public;
grant execute on function public.create_short_url(text) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
