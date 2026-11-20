-- Prevent service owners from granting themselves approval or editing review metadata.
-- City/global administrators with verified MFA keep their existing review privileges.
create or replace function private.guard_autonomo_service_review_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user <> 'authenticated'
     or private.admin_mfa_verified(
       case when tg_op = 'UPDATE' then old.cidade_id else new.cidade_id end,
       false
     ) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status_aprovacao := 'pendente';
    new.observacoes_admin := null;
    new.aprovado_por := null;
    new.data_aprovacao := null;
    new.visualizacoes := 0;
  else
    if new.status_aprovacao is distinct from old.status_aprovacao
       or new.observacoes_admin is distinct from old.observacoes_admin
       or new.aprovado_por is distinct from old.aprovado_por
       or new.data_aprovacao is distinct from old.data_aprovacao
       or new.visualizacoes is distinct from old.visualizacoes
       or new.usuario_id is distinct from old.usuario_id
       or new.cidade_id is distinct from old.cidade_id then
      raise exception 'Campos de aprovação ou propriedade não podem ser alterados pelo anunciante'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_autonomo_service_review_fields on public.servicos_autonomos;
create trigger guard_autonomo_service_review_fields
  before insert or update on public.servicos_autonomos
  for each row execute function private.guard_autonomo_service_review_fields();
