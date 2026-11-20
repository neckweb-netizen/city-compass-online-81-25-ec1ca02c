-- Reviews: assign each editable field to its rightful role.
-- Admin moderation is city-scoped and requires MFA.
create or replace function private.guard_review_fields()
returns trigger language plpgsql security invoker set search_path = ''
as $$
declare
  v_owner uuid;
  v_city uuid;
begin
  if current_user <> 'authenticated' then return new; end if;
  select e.usuario_id, e.cidade_id into v_owner, v_city
    from public.empresas e where e.id = old.empresa_id;

  if private.admin_mfa_verified(v_city, false) then
    if new.empresa_id is distinct from old.empresa_id
       or new.usuario_id is distinct from old.usuario_id then
      raise exception 'Não é permitido transferir a autoria da avaliação' using errcode='42501';
    end if;
    return new;
  end if;

  if old.usuario_id = (select auth.uid()) then
    if (to_jsonb(new) - 'nota' - 'comentario' - 'imagens' - 'atualizado_em')
       is distinct from
       (to_jsonb(old) - 'nota' - 'comentario' - 'imagens' - 'atualizado_em') then
      raise exception 'Só é permitido editar nota, comentário e imagens próprios'
        using errcode='42501';
    end if;
    return new;
  end if;

  if v_owner = (select auth.uid()) then
    if (to_jsonb(new) - 'resposta_empresa' - 'respondido_em' - 'atualizado_em')
       is distinct from
       (to_jsonb(old) - 'resposta_empresa' - 'respondido_em' - 'atualizado_em') then
      raise exception 'Empresa só pode editar sua resposta' using errcode='42501';
    end if;
    if new.resposta_empresa is distinct from old.resposta_empresa then
      new.resposta_empresa := nullif(btrim(new.resposta_empresa), '');
      new.respondido_em := case when new.resposta_empresa is null then null else now() end;
    end if;
    return new;
  end if;

  raise exception 'Sem permissão para editar esta avaliação' using errcode='42501';
end;
$$;
drop trigger if exists guard_review_fields on public.avaliacoes;
create trigger guard_review_fields before update on public.avaliacoes
for each row execute function private.guard_review_fields();

alter table public.avaliacoes
  add constraint avaliacoes_comentario_tamanho
    check (comentario is null or char_length(comentario) <= 4000),
  add constraint avaliacoes_resposta_tamanho
    check (resposta_empresa is null or char_length(resposta_empresa) <= 2000),
  add constraint avaliacoes_imagens_maximas
    check (imagens is null or coalesce(array_length(imagens,1),0) <= 8);

-- Remove administrative deletion policy that trusted account type without MFA.
drop policy if exists "Admins podem excluir avaliações" on public.avaliacoes;
create policy "Administradores com MFA podem excluir avaliações da cidade"
on public.avaliacoes for delete to authenticated
using (exists (
  select 1 from public.empresas e
  where e.id = avaliacoes.empresa_id
    and private.admin_mfa_verified(e.cidade_id, false)
));
