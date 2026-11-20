-- Keep historic reports untouched, but prevent new duplicate and self reports.
create or replace function private.guard_entre_nos_new_report()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_author uuid; v_target_status text;
begin
  if (select auth.uid()) is null then return new; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended((select auth.uid())::text || ':' || coalesce(new.postagem_id::text,new.comentario_id::text), 0));
  if new.denunciante_id is distinct from (select auth.uid()) then
    raise exception 'Identificação do denunciante inválida' using errcode='42501';
  end if;
  if new.postagem_id is not null then
    select p.usuario_id,p.status into v_author,v_target_status
    from public.entre_nos_postagens p where p.id=new.postagem_id;
  else
    select c.usuario_id,c.status into v_author,v_target_status
    from public.entre_nos_comentarios c where c.id=new.comentario_id;
  end if;
  if v_target_status is distinct from 'aprovado'
    or v_author is not distinct from (select auth.uid()) then
    raise exception 'Conteúdo indisponível para denúncia' using errcode='42501';
  end if;
  if exists (
    select 1 from public.entre_nos_denuncias d
    where d.denunciante_id=(select auth.uid())
      and (
        (new.postagem_id is not null and d.postagem_id=new.postagem_id)
        or (new.comentario_id is not null and d.comentario_id=new.comentario_id)
      )
  ) then
    raise exception 'Você já denunciou este conteúdo' using errcode='23505';
  end if;
  new.status := 'aberta';
  new.revisado_em := null;
  new.revisado_por := null;
  return new;
end;
$$;
