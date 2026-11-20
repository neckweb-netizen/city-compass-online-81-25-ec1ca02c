-- Civic comments: unmoderated comments stay visible only to their author and MFA admins.
drop policy if exists "Todos podem ver comentários ativos" on public.comentarios_problema;
create policy "Comentários aprovados, próprios e moderação" on public.comentarios_problema
for select to public using (
  (ativo = true and moderado = true)
  or (usuario_id = (select auth.uid()))
  or private.admin_mfa_verified(null, false)
);
-- Avoid a legacy permissive policy that bypasses MFA requirements.
drop policy if exists "Admins podem moderar comentários" on public.comentarios_problema;

alter table public.comentarios_problema
  add constraint comentarios_problema_conteudo_valido
  check (char_length(btrim(conteudo)) between 2 and 4000),
  add constraint comentarios_problema_votos_nao_negativos
  check (votos_positivos >= 0 and votos_negativos >= 0);

create or replace function private.guard_civic_comment_fields()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if current_user <> 'authenticated' then return new; end if;
  if private.admin_mfa_verified(null, false) then return new; end if;

  if tg_op = 'INSERT' then
    if new.usuario_id is distinct from (select auth.uid()) then
      raise exception 'Autoria inválida' using errcode = '42501';
    end if;
    new.ativo := true;
    new.moderado := false;
    new.moderado_por := null;
    new.data_moderacao := null;
    new.votos_positivos := 0;
    new.votos_negativos := 0;
    new.criado_em := now();
    new.atualizado_em := now();
    if not exists (
      select 1 from public.problemas_cidade p
      where p.id = new.problema_id and p.ativo = true
        and p.status_aprovacao = 'aprovado'
    ) then
      raise exception 'Esta reclamação não aceita comentários' using errcode = '42501';
    end if;
  elsif tg_op = 'UPDATE' then
    if old.usuario_id is distinct from (select auth.uid()) then
      raise exception 'Sem permissão para editar este comentário' using errcode = '42501';
    end if;
    if (to_jsonb(new) - 'conteudo' - 'atualizado_em') is distinct from
       (to_jsonb(old) - 'conteudo' - 'atualizado_em') then
      raise exception 'Somente o texto do comentário pode ser editado' using errcode = '42501';
    end if;
    if new.conteudo is distinct from old.conteudo then
      new.moderado := false;
      new.ativo := true;
      new.moderado_por := null;
      new.data_moderacao := null;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists guard_civic_comment_fields on public.comentarios_problema;
create trigger guard_civic_comment_fields
  before insert or update on public.comentarios_problema
  for each row execute function private.guard_civic_comment_fields();

-- Even MFA admins cannot reassign a community post to a different author.
create or replace function private.guard_entre_nos_moderation_fields()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if current_user <> 'authenticated' then return new; end if;
  if not private.admin_mfa_verified(null, false) then
    raise exception 'Somente a moderação pode editar esta publicação' using errcode = '42501';
  end if;
  if new.usuario_id is distinct from old.usuario_id or
     new.criado_em is distinct from old.criado_em then
    raise exception 'Não é permitido transferir autoria de publicações' using errcode='42501';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_entre_nos_moderation_fields on public.entre_nos_postagens;
create trigger guard_entre_nos_moderation_fields before update on public.entre_nos_postagens
for each row execute function private.guard_entre_nos_moderation_fields();
