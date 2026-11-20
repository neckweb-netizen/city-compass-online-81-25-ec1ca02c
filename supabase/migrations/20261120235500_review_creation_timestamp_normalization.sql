-- Reviews must not accept forged creation timestamps or reply metadata.
-- Keep existing rows untouched; normalize new user-submitted reviews only.
create or replace function private.guard_review_insert()
returns trigger language plpgsql security invoker set search_path = ''
as $$
declare v_city uuid;
begin
  if current_user <> 'authenticated' then return new; end if;
  select e.cidade_id into v_city from public.empresas e where e.id = new.empresa_id;
  if private.admin_mfa_verified(v_city, false) then return new; end if;
  if new.usuario_id is distinct from (select auth.uid())
    or new.resposta_empresa is not null or new.respondido_em is not null then
    raise exception 'A autoria e a resposta não podem ser definidas no cadastro'
      using errcode = '42501';
  end if;
  if exists (
    select 1 from public.empresas e
    where e.id = new.empresa_id and e.usuario_id = (select auth.uid())
  ) then
    raise exception 'Não é permitido avaliar a própria empresa' using errcode='42501';
  end if;
  new.criado_em := now();
  new.atualizado_em := now();
  return new;
end;
$$;
