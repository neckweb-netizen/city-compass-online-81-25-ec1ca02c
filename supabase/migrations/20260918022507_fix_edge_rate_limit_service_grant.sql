-- EXECUTE is granted only to service_role. Opaque API keys may not supply a
-- request.jwt.claim.role setting, so do not require that claim as well.
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
