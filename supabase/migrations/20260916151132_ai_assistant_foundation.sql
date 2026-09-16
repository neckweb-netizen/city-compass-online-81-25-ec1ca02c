-- Foundation only: no public assistant endpoint or model call is enabled by this migration.
-- All commercial decisions stay server-side and fail closed until explicitly configured.

create table public.ai_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  maintenance boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.ai_settings (id) values (true);

create table public.ai_plan_entitlements (
  plan_id uuid not null references public.planos(id) on delete cascade,
  feature text not null check (feature in ('discovery', 'products', 'services', 'coupons', 'booking', 'analytics', 'leads')),
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (plan_id, feature)
);

create table public.ai_company_access (
  company_id uuid primary key references public.empresas(id) on delete cascade,
  blocked boolean not null default false,
  block_reason text,
  manual_grant_until timestamptz,
  manual_grant_reason text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  check (manual_grant_until is null or nullif(btrim(manual_grant_reason), '') is not null)
);

create table public.ai_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  context jsonb not null default '{}'::jsonb,
  check (jsonb_typeof(context) = 'object'),
  check (expires_at > created_at)
);
create index ai_sessions_user_created_idx on public.ai_sessions (user_id, created_at desc) where user_id is not null;
create index ai_sessions_expires_idx on public.ai_sessions (expires_at);

create table public.ai_messages (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.ai_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index ai_messages_session_created_idx on public.ai_messages (session_id, created_at desc);

create table public.ai_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.ai_sessions(id) on delete cascade,
  company_id uuid references public.empresas(id) on delete set null,
  event_type text not null check (event_type in ('search', 'impression', 'profile', 'whatsapp', 'call', 'route', 'coupon', 'booking', 'lead', 'conversion', 'no_result')),
  result_position smallint check (result_position between 1 and 20),
  dedupe_key text unique,
  created_at timestamptz not null default now()
);
create index ai_events_company_created_idx on public.ai_events (company_id, created_at desc) where company_id is not null;
create index ai_events_session_created_idx on public.ai_events (session_id, created_at desc);

create table public.ai_usage_daily (
  day date not null,
  provider text not null,
  model text not null,
  requests integer not null default 0 check (requests >= 0),
  input_tokens bigint not null default 0 check (input_tokens >= 0),
  output_tokens bigint not null default 0 check (output_tokens >= 0),
  estimated_cost_usd numeric(12, 6) not null default 0 check (estimated_cost_usd >= 0),
  primary key (day, provider, model)
);

-- Client roles get no direct access: the future Edge Function owns session tokens,
-- rate limiting, event validation, and per-company analytics responses.
alter table public.ai_settings enable row level security;
alter table public.ai_plan_entitlements enable row level security;
alter table public.ai_company_access enable row level security;
alter table public.ai_sessions enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_events enable row level security;
alter table public.ai_usage_daily enable row level security;

revoke all on table public.ai_settings, public.ai_plan_entitlements,
  public.ai_company_access, public.ai_sessions, public.ai_messages,
  public.ai_events, public.ai_usage_daily from public, anon, authenticated;
grant select, insert, update, delete on table public.ai_settings, public.ai_plan_entitlements,
  public.ai_company_access, public.ai_sessions, public.ai_messages,
  public.ai_events, public.ai_usage_daily to service_role;
grant usage, select on sequence public.ai_messages_id_seq, public.ai_events_id_seq to service_role;

-- Exposed as an RPC name, but executable only with the server-side service role.
create or replace function public.ai_eligible_companies(
  p_city_id uuid default null,
  p_category_id uuid default null,
  p_limit integer default 10
)
returns table (company_id uuid, plan_id uuid)
language sql stable security invoker
set search_path = ''
as $$
  select e.id, p.id
  from public.empresas e
  join public.planos p on p.id = e.plano_atual_id and p.ativo
  join public.ai_plan_entitlements f
    on f.plan_id = p.id and f.feature = 'discovery' and f.enabled
  join public.ai_settings s on s.id = true and s.enabled and not s.maintenance
  left join public.ai_company_access access on access.company_id = e.id
  where e.ativo
    and e.status_aprovacao = 'aprovado'::public.status_aprovacao
    and e.plano_data_vencimento > now()
    and not coalesce(access.blocked, false)
    and (p_city_id is null or e.cidade_id = p_city_id)
    and (p_category_id is null or e.categoria_id = p_category_id)
    and (
      access.manual_grant_until > now()
      or exists (
        select 1 from public.pagamentos_planos pay
        where pay.empresa_id = e.id
          and pay.plano_id = p.id
          and lower(pay.status) in ('aprovado', 'approved', 'pago', 'paid', 'concluido')
          and pay.data_vencimento > now()
      )
    )
  order by p.prioridade_busca desc, e.id
  limit least(greatest(coalesce(p_limit, 10), 1), 20);
$$;
revoke all on function public.ai_eligible_companies(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.ai_eligible_companies(uuid, uuid, integer) to service_role;
