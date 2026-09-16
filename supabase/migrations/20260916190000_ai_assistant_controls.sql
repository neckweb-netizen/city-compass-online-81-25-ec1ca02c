-- Configurable fail-closed controls for the assistant. The admin UI can manage
-- these values only with a fresh AAL2 session; runtime mutations remain server-side.
alter table public.ai_settings
  add column daily_request_limit integer not null default 1000 check (daily_request_limit between 1 and 100000),
  add column daily_model_limit integer not null default 100 check (daily_model_limit between 0 and 10000),
  add column visitor_daily_limit integer not null default 20 check (visitor_daily_limit between 1 and 1000),
  add column max_message_length integer not null default 500 check (max_message_length between 50 and 2000),
  add column model text not null default 'gemini-3.1-flash-lite' check (model in ('gemini-3.1-flash-lite'));

create policy ai_settings_admin_read on public.ai_settings
  for select to authenticated using (private.admin_mfa_verified(null, true));
create policy ai_settings_admin_update on public.ai_settings
  for update to authenticated
  using (private.admin_mfa_verified(null, true))
  with check (private.admin_mfa_verified(null, true));
grant select, update (enabled, maintenance, daily_request_limit, daily_model_limit, visitor_daily_limit, max_message_length)
  on public.ai_settings to authenticated;

create policy ai_entitlements_admin_read on public.ai_plan_entitlements
  for select to authenticated using (private.admin_mfa_verified(null, true));
create policy ai_entitlements_admin_insert on public.ai_plan_entitlements
  for insert to authenticated with check (private.admin_mfa_verified(null, true));
create policy ai_entitlements_admin_update on public.ai_plan_entitlements
  for update to authenticated
  using (private.admin_mfa_verified(null, true))
  with check (private.admin_mfa_verified(null, true));
grant select, insert, update (enabled, updated_at) on public.ai_plan_entitlements to authenticated;

create table public.ai_request_counters (
  day date not null,
  scope text not null check (scope in ('global_requests', 'global_model', 'visitor')),
  subject_hash text not null,
  requests integer not null default 0 check (requests >= 0),
  primary key (day, scope, subject_hash)
);
alter table public.ai_request_counters enable row level security;
revoke all on table public.ai_request_counters from public, anon, authenticated;
grant select, insert, update, delete on public.ai_request_counters to service_role;

create or replace function public.ai_consume_quota(p_visitor_hash text, p_model_call boolean default false)
returns boolean
language plpgsql volatile security invoker
set search_path = ''
as $$
declare
  cfg public.ai_settings%rowtype;
  current_day date := (now() at time zone 'UTC')::date;
  visitor_count integer;
  global_count integer;
  model_count integer;
begin
  if length(p_visitor_hash) <> 64 or p_visitor_hash !~ '^[0-9a-f]{64}$' then
    return false;
  end if;
  select * into cfg from public.ai_settings where id = true;
  if not found or not cfg.enabled or cfg.maintenance then
    return false;
  end if;

  -- Serialize all quota reservations, including concurrent Edge Function instances.
  perform pg_catalog.pg_advisory_xact_lock(746731900);
  insert into public.ai_request_counters(day, scope, subject_hash, requests)
    values (current_day, 'visitor', p_visitor_hash, 0)
    on conflict do nothing;
  insert into public.ai_request_counters(day, scope, subject_hash, requests)
    values (current_day, 'global_requests', 'global', 0)
    on conflict do nothing;
  select requests into visitor_count from public.ai_request_counters
    where day = current_day and scope = 'visitor' and subject_hash = p_visitor_hash;
  select requests into global_count from public.ai_request_counters
    where day = current_day and scope = 'global_requests' and subject_hash = 'global';
  if visitor_count >= cfg.visitor_daily_limit or global_count >= cfg.daily_request_limit then
    return false;
  end if;
  if p_model_call then
    insert into public.ai_request_counters(day, scope, subject_hash, requests)
      values (current_day, 'global_model', 'global', 0)
      on conflict do nothing;
    select requests into model_count from public.ai_request_counters
      where day = current_day and scope = 'global_model' and subject_hash = 'global';
    if model_count >= cfg.daily_model_limit then
      return false;
    end if;
    update public.ai_request_counters set requests = requests + 1
      where day = current_day and scope = 'global_model' and subject_hash = 'global';
  end if;
  update public.ai_request_counters set requests = requests + 1
    where day = current_day and scope = 'visitor' and subject_hash = p_visitor_hash;
  update public.ai_request_counters set requests = requests + 1
    where day = current_day and scope = 'global_requests' and subject_hash = 'global';
  return true;
end;
$$;
revoke all on function public.ai_consume_quota(text, boolean) from public, anon, authenticated;
grant execute on function public.ai_consume_quota(text, boolean) to service_role;
