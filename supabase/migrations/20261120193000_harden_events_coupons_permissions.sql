-- Restrict event publishing to an approved company owner or MFA-verified city administrator.
drop policy if exists "Usuários autenticados podem criar eventos" on public.eventos;
create policy "Usuários autenticados podem criar eventos"
on public.eventos for insert to authenticated
with check (
  private.admin_mfa_verified(cidade_id, false)
  or (
    empresa_id is not null and
    exists (
      select 1 from public.empresas e
      where e.id = eventos.empresa_id
        and e.usuario_id = (select auth.uid())
        and e.ativo = true and e.status_aprovacao = 'aprovado'
        and e.cidade_id = eventos.cidade_id
    )
  )
);

-- Review workflow must not auto-approve an admin without city permission and MFA.
create or replace function public.auto_aprovar_evento_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.admin_mfa_verified(new.cidade_id, false) then
    new.status_aprovacao := 'aprovado';
    new.aprovado_por := (select auth.uid());
    new.data_aprovacao := now();
    new.ativo := true;
  else
    new.status_aprovacao := 'pendente';
    new.aprovado_por := null;
    new.data_aprovacao := null;
    new.ativo := false;
    new.destaque := false;
  end if;
  return new;
end;
$$;

-- Owner edits cannot grant approval, highlights, transfer event ownership or forge event counters.
create or replace function private.guard_company_event_review_fields()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if current_user <> 'authenticated' or private.admin_mfa_verified(old.cidade_id, false) then
    return new;
  end if;
  if new.status_aprovacao is distinct from old.status_aprovacao
    or new.aprovado_por is distinct from old.aprovado_por
    or new.data_aprovacao is distinct from old.data_aprovacao
    or new.destaque is distinct from old.destaque
    or new.empresa_id is distinct from old.empresa_id
    or new.cidade_id is distinct from old.cidade_id
    or new.participantes_confirmados is distinct from old.participantes_confirmados
    or new.visualizacoes is distinct from old.visualizacoes
    or new.compartilhamentos is distinct from old.compartilhamentos
  then
    raise exception 'Campos administrativos do evento não podem ser alterados pelo organizador' using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_company_event_review_fields on public.eventos;
create trigger guard_company_event_review_fields before update on public.eventos
for each row execute function private.guard_company_event_review_fields();

-- Coupon validity is evaluated by the database, including the company standing.
drop policy if exists "Todos podem ver cupons ativos" on public.cupons;
create policy "Todos podem ver cupons ativos" on public.cupons for select to public
using (
  ativo = true and data_inicio <= now() and data_fim >= now()
  and (quantidade_total is null or quantidade_usada < quantidade_total)
  and exists (
    select 1 from public.empresas e
    where e.id = cupons.empresa_id and e.ativo = true
      and e.status_aprovacao = 'aprovado'
  )
);

alter table public.cupons
  add constraint cupons_valor_positivo check (valor > 0),
  add constraint cupons_porcentagem_valida check (tipo <> 'porcentagem' or valor <= 100),
  add constraint cupons_periodo_valido check (data_fim > data_inicio),
  add constraint cupons_quantidade_total_valida check (quantidade_total is null or quantidade_total > 0),
  add constraint cupons_quantidade_usada_valida check (quantidade_usada >= 0 and (quantidade_total is null or quantidade_usada <= quantidade_total));

-- Preserve validation RPC while stopping anonymous use-counter abuse.
create or replace function public.usar_cupom(cupom_id_param uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return false;
  end if;

  update public.cupons c
  set quantidade_usada = c.quantidade_usada + 1
  where c.id = cupom_id_param
    and c.ativo = true
    and c.data_inicio <= now()
    and c.data_fim >= now()
    and (c.quantidade_total is null or c.quantidade_usada < c.quantidade_total)
    and exists (
      select 1 from public.empresas e
      where e.id = c.empresa_id and e.ativo = true
      and e.status_aprovacao = 'aprovado'
    );
  return found;
end;
$$;
revoke execute on function public.usar_cupom(uuid) from anon;
