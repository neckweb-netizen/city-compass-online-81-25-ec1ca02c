-- Preserve short links from the three former Saj Tem preview hosts as local paths.
update public.short_urls
set original_url = case
  when regexp_replace(original_url, '^https?://[^/?#]+', '', 'i') like '/%'
    then regexp_replace(original_url, '^https?://[^/?#]+', '', 'i')
  else '/' || regexp_replace(original_url, '^https?://[^/?#]+', '', 'i')
end
where lower(substring(original_url from '^https?://([^/?#]+)')) in (
  '73f45b0c-8729-4b92-93db-41af240af58d.lovableproject.com',
  '688fb07e-e614-4f21-b90f-821616d82110.lovableproject.com',
  'preview--city-compass-online-81-79.lovable.app'
);

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
    or position(chr(92) in p_original_url) > 0
    or p_original_url ~ '[[:cntrl:]]'
  then
    raise exception 'Destino inválido para link curto' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_original_url, 0));
  select s.short_code into v_existing_code
  from public.short_urls s
  where s.link_type = 'general'
    and s.original_url = p_original_url
    and (s.expires_at is null or s.expires_at > now())
  order by s.created_at limit 1;
  if v_existing_code is not null then return v_existing_code; end if;

  for v_attempt in 1..20 loop
    v_code := 'g' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
    begin
      insert into public.short_urls (short_code, original_url, created_by, link_type)
      values (v_code, p_original_url, auth.uid(), 'general');
      return v_code;
    exception when unique_violation then null;
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
declare v_destination text;
begin
  if p_short_code is null or p_short_code !~ '^[A-Za-z0-9_-]{3,32}$' then
    raise exception 'Link curto inválido' using errcode = '22023';
  end if;
  select original_url into v_destination from public.short_urls
  where short_code = p_short_code and (expires_at is null or expires_at > now());
  if v_destination is null then
    raise exception 'Link curto não encontrado ou expirado' using errcode = 'P0002';
  end if;
  if left(v_destination, 1) <> '/'
    or left(v_destination, 2) = '//'
    or position(chr(92) in v_destination) > 0
    or v_destination ~ '[[:cntrl:]]'
  then
    raise exception 'Destino inválido para link curto' using errcode = '22023';
  end if;
  update public.short_urls set clicks = clicks + 1, updated_at = now()
  where short_code = p_short_code;
  return v_destination;
end;
$$;

-- Shared, atomic counters for Edge Functions. Only service_role can consume them.
create table if not exists private.edge_rate_limit_counters (
  bucket_hash text not null,
  window_id bigint not null,
  hits integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (bucket_hash, window_id)
);
create index if not exists edge_rate_limit_counters_created_at_idx
  on private.edge_rate_limit_counters (created_at);
revoke all on private.edge_rate_limit_counters from public, anon, authenticated;
alter table private.edge_rate_limit_counters enable row level security;

create or replace function public.consume_edge_rate_limit(
  p_bucket text, p_limit integer, p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v_hits integer;
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then
    raise exception 'Sem permissão para consultar o limite' using errcode = '42501';
  end if;
  if p_bucket is null or length(p_bucket) not between 1 and 300
    or p_limit not between 1 and 100000
    or p_window_seconds not between 1 and 86400 then
    raise exception 'Parâmetros inválidos' using errcode = '22023';
  end if;

  insert into private.edge_rate_limit_counters (bucket_hash, window_id, hits)
  values (
    encode(extensions.digest(p_bucket, 'sha256'), 'hex'),
    floor(extract(epoch from clock_timestamp()) / p_window_seconds)::bigint,
    1
  )
  on conflict (bucket_hash, window_id) do update
  set hits = private.edge_rate_limit_counters.hits + 1
  returning hits into v_hits;

  if random() < 0.001 then
    delete from private.edge_rate_limit_counters
    where created_at < now() - interval '2 days';
  end if;
  return v_hits <= p_limit;
end;
$$;

revoke all on function public.consume_edge_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_edge_rate_limit(text, integer, integer) to service_role;
notify pgrst, 'reload schema';
