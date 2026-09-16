-- Model calls have a separate global cap; they must not consume a second
-- visitor/search allowance after the request was already admitted.
create or replace function public.ai_consume_model_quota(p_visitor_hash text)
returns boolean
language plpgsql volatile security invoker
set search_path = ''
as $$
declare
  cfg public.ai_settings%rowtype;
  current_day date := (now() at time zone 'UTC')::date;
  model_count integer;
begin
  if length(p_visitor_hash) <> 64 or p_visitor_hash !~ '^[0-9a-f]{64}$' then
    return false;
  end if;
  select * into cfg from public.ai_settings where id = true;
  if not found or not cfg.enabled or cfg.maintenance then
    return false;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(746731900);
  insert into public.ai_request_counters(day, scope, subject_hash, requests)
    values (current_day, 'global_model', 'global', 0) on conflict do nothing;
  select requests into model_count from public.ai_request_counters
    where day = current_day and scope = 'global_model' and subject_hash = 'global';
  if model_count >= cfg.daily_model_limit then
    return false;
  end if;
  update public.ai_request_counters set requests = requests + 1
    where day = current_day and scope = 'global_model' and subject_hash = 'global';
  return true;
end;
$$;
revoke all on function public.ai_consume_model_quota(text) from public, anon, authenticated;
grant execute on function public.ai_consume_model_quota(text) to service_role;
