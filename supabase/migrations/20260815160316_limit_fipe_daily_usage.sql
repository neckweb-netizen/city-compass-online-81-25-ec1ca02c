create table if not exists public.fipe_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  slot smallint not null check (slot between 1 and 2),
  created_at timestamptz not null default now(),
  primary key (user_id, usage_date, slot)
);

comment on table public.fipe_daily_usage is
  'Registra até duas consultas FIPE concluídas por usuário e dia.';

alter table public.fipe_daily_usage enable row level security;

revoke all on table public.fipe_daily_usage from anon, authenticated;
grant select, insert, delete on table public.fipe_daily_usage to service_role;
