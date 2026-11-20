-- Protect administrative vacancy fields from direct company-side API writes.
-- Privileged administrative writes and the existing SECURITY DEFINER view counter remain unchanged.
create or replace function private.guard_company_vaga_reserved_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user <> 'authenticated' or public.user_has_permission() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.destaque or new.visualizacoes <> 0
       or not exists (
         select 1 from public.empresas e
         where e.id = new.criado_por and e.cidade_id = new.cidade_id
       ) then
      raise exception 'Campos administrativos da vaga não podem ser definidos pela empresa';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.destaque is distinct from old.destaque
       or new.criado_por is distinct from old.criado_por
       or new.cidade_id is distinct from old.cidade_id
       or new.visualizacoes is distinct from old.visualizacoes then
      raise exception 'Campos administrativos da vaga não podem ser alterados pela empresa';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_company_vaga_reserved_fields on public.vagas_emprego;
create trigger guard_company_vaga_reserved_fields
  before insert or update on public.vagas_emprego
  for each row execute function private.guard_company_vaga_reserved_fields();
