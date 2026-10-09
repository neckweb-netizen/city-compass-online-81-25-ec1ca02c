-- Limites de cardápios configuráveis por plano, com aplicação no banco.
alter table public.planos
  add column if not exists limite_cardapios integer not null default 1;

alter table public.planos
  drop constraint if exists planos_limite_cardapios_valido;

alter table public.planos
  add constraint planos_limite_cardapios_valido
  check (limite_cardapios >= -1);

alter table public.usuarios
  add column if not exists plano_data_vencimento timestamptz;

update public.planos
set limite_cardapios = case
  when nome ilike '%empresarial%' then -1
  when nome ilike '%vip%' then 5
  when nome ilike '%básico%' or nome ilike '%basico%' then 2
  else 1
end;

alter table public.cardapios
  drop constraint if exists cardapios_user_id_key;

create index if not exists cardapios_user_id_idx
  on public.cardapios (user_id, criado_em desc);

create or replace function private.cardapio_plan_for_user(p_user_id uuid)
returns table (
  plano_id uuid,
  plano_nome text,
  limite_cardapios integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with direct_plan as (
    select p.id, p.nome, p.limite_cardapios
    from public.usuarios u
    join public.planos p on p.id = u.plano_id and p.ativo
    where u.id = p_user_id
      and (u.plano_data_vencimento is null or u.plano_data_vencimento > now())
    limit 1
  ),
  company_plan as (
    select p.id, p.nome, p.limite_cardapios
    from public.empresas e
    join public.planos p on p.id = e.plano_atual_id and p.ativo
    where e.usuario_id = p_user_id
      and (e.plano_data_vencimento is null or e.plano_data_vencimento > now())
    order by
      case when p.limite_cardapios = -1 then 2147483647 else p.limite_cardapios end desc,
      p.preco_mensal desc
    limit 1
  ),
  chosen_plan as (
    select * from direct_plan
    union all
    select * from company_plan where not exists (select 1 from direct_plan)
  ),
  free_plan as (
    select p.id, p.nome, p.limite_cardapios
    from public.planos p
    where p.ativo and p.nome ilike '%gratuito%'
    order by p.preco_mensal asc
    limit 1
  ),
  effective_plan as (
    select * from chosen_plan
    union all
    select * from free_plan where not exists (select 1 from chosen_plan)
  )
  select * from effective_plan
  union all
  select null::uuid, 'Plano Gratuito'::text, 1
  where not exists (select 1 from effective_plan)
  limit 1;
$$;

revoke all on function private.cardapio_plan_for_user(uuid) from public, anon, authenticated;

create or replace function private.enforce_cardapio_plan_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed integer;
  used_count bigint;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.user_id::text, 0));

  select plan.limite_cardapios
    into allowed
  from private.cardapio_plan_for_user(new.user_id) plan;

  if allowed = -1 then
    return new;
  end if;

  select count(*) into used_count
  from public.cardapios
  where user_id = new.user_id;

  if used_count >= coalesce(allowed, 1) then
    raise exception using
      errcode = 'P0001',
      message = 'cardapio_plan_limit_reached';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_cardapio_plan_limit() from public, anon, authenticated;

drop trigger if exists cardapios_enforce_plan_limit on public.cardapios;
create trigger cardapios_enforce_plan_limit
  before insert on public.cardapios
  for each row execute function private.enforce_cardapio_plan_limit();

create or replace function public.obter_meu_limite_cardapios()
returns table (
  plano_id uuid,
  plano_nome text,
  limite_cardapios integer,
  cardapios_usados bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Autenticação obrigatória' using errcode = '42501';
  end if;

  return query
  select
    plan.plano_id,
    plan.plano_nome,
    plan.limite_cardapios,
    (select count(*) from public.cardapios c where c.user_id = current_user_id)
  from private.cardapio_plan_for_user(current_user_id) plan;
end;
$$;

revoke all on function public.obter_meu_limite_cardapios() from public, anon;
grant execute on function public.obter_meu_limite_cardapios() to authenticated;

