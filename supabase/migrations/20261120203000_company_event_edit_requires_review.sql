-- When a company changes the public details of an approved event, it needs review again.
-- Privileged MFA-verified administrative reviews and internal counters remain unchanged.
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
    raise exception 'Campos administrativos do evento não podem ser alterados pelo organizador'
      using errcode = '42501';
  end if;

  if new.titulo is distinct from old.titulo
    or new.descricao is distinct from old.descricao
    or new.data_inicio is distinct from old.data_inicio
    or new.data_fim is distinct from old.data_fim
    or new.local is distinct from old.local
    or new.endereco is distinct from old.endereco
    or new.imagem_banner is distinct from old.imagem_banner
    or new.imagem_url is distinct from old.imagem_url
    or new.gratuito is distinct from old.gratuito
    or new.preco is distinct from old.preco
    or new.link_ingressos is distinct from old.link_ingressos
    or new.categoria_id is distinct from old.categoria_id
    or new.recorrencia is distinct from old.recorrencia
    or new.limite_participantes is distinct from old.limite_participantes
  then
    new.status_aprovacao := 'pendente';
    new.aprovado_por := null;
    new.data_aprovacao := null;
    new.destaque := false;
    new.ativo := false;
  end if;

  return new;
end;
$$;

alter table public.eventos
  add constraint eventos_periodo_coerente
  check (data_fim is null or data_fim > data_inicio);
