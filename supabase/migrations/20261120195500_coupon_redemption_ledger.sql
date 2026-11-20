-- Record coupon redemption once per authenticated account to prevent repeated uses.
create table if not exists public.cupom_resgates (
  id uuid primary key default gen_random_uuid(),
  cupom_id uuid not null references public.cupons(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  constraint cupom_resgates_unique_account unique (cupom_id, usuario_id)
);
create index if not exists cupom_resgates_usuario_idx on public.cupom_resgates (usuario_id, criado_em desc);
alter table public.cupom_resgates enable row level security;
drop policy if exists "Usuários visualizam seus resgates" on public.cupom_resgates;
create policy "Usuários visualizam seus resgates" on public.cupom_resgates
for select to authenticated using (usuario_id = (select auth.uid()));
revoke all on public.cupom_resgates from anon, authenticated;
grant select on public.cupom_resgates to authenticated;

create or replace function public.usar_cupom(cupom_id_param uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare
  v_usuario uuid := (select auth.uid());
  v_cupom uuid;
  v_resgate uuid;
begin
  if v_usuario is null then return false; end if;

  -- Lock the selected coupon row to serialize redemptions and quota checks.
  select c.id into v_cupom from public.cupons c
  where c.id = cupom_id_param
    and c.ativo = true
    and c.data_inicio <= now() and c.data_fim >= now()
    and (c.quantidade_total is null or c.quantidade_usada < c.quantidade_total)
    and exists (select 1 from public.empresas e
      where e.id = c.empresa_id and e.ativo = true
        and e.status_aprovacao = 'aprovado')
  for update of c;

  if v_cupom is null then return false; end if;

  insert into public.cupom_resgates (cupom_id, usuario_id)
  values (v_cupom, v_usuario)
  on conflict (cupom_id, usuario_id) do nothing
  returning id into v_resgate;
  if v_resgate is null then return false; end if;

  update public.cupons c
  set quantidade_usada = c.quantidade_usada + 1
  where c.id = v_cupom;
  return true;
end;
$$;
revoke execute on function public.usar_cupom(uuid) from public, anon;
grant execute on function public.usar_cupom(uuid) to authenticated;
