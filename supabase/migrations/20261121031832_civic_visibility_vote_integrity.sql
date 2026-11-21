alter policy "Todos podem ver problemas ativos" on public.problemas_cidade using ((ativo and status_aprovacao='aprovado') or usuario_id=(select auth.uid()));
alter policy "Admins podem moderar problemas" on public.problemas_cidade using ((select private.admin_mfa_verified(null,false))) with check ((select private.admin_mfa_verified(null,false)));
alter policy "Usuários podem ver todos os votos" on public.votos_problema using (usuario_id=(select auth.uid()));
alter policy "Usuários podem ver votos em comentários" on public.votos_comentario using (usuario_id=(select auth.uid()));
alter policy "Usuários podem votar" on public.votos_problema with check (usuario_id=(select auth.uid()) and exists(select 1 from public.problemas_cidade p where p.id=problema_id and p.ativo and p.status_aprovacao='aprovado'));
alter policy "Usuários podem votar em comentários" on public.votos_comentario with check (usuario_id=(select auth.uid()) and exists(select 1 from public.comentarios_problema c join public.problemas_cidade p on p.id=c.problema_id where c.id=comentario_id and c.ativo and c.moderado and p.ativo and p.status_aprovacao='aprovado'));
CREATE OR REPLACE FUNCTION private.guard_civic_problem_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if current_user <> 'authenticated' then return new; end if;
 if tg_op='INSERT' then
  if not private.admin_mfa_verified(null,false) then
   if new.usuario_id is distinct from (select auth.uid()) then raise exception 'Autoria inválida' using errcode='42501'; end if;
   new.status_aprovacao:='pendente'; new.status:='aberto'; new.ativo:=true; new.moderado:=false; new.moderado_por:=null; new.data_moderacao:=null; new.observacoes_moderacao:=null; new.aprovado_por:=null; new.data_aprovacao:=null; new.resolvido_em:=null; new.resolvido_por:=null;
  end if;
  new.votos_positivos:=0; new.votos_negativos:=0; new.visualizacoes:=0; new.criado_em:=now();
 else
  if new.votos_positivos is distinct from old.votos_positivos or new.votos_negativos is distinct from old.votos_negativos or new.visualizacoes is distinct from old.visualizacoes or new.usuario_id is distinct from old.usuario_id or new.id is distinct from old.id or new.criado_em is distinct from old.criado_em then raise exception 'Campos protegidos' using errcode='42501'; end if;
  if not private.admin_mfa_verified(null,false) then
   if (to_jsonb(new)-array['titulo','descricao','categoria_id','bairro','endereco','localizacao','imagens','prioridade','atualizado_em']) is distinct from (to_jsonb(old)-array['titulo','descricao','categoria_id','bairro','endereco','localizacao','imagens','prioridade','atualizado_em']) then raise exception 'Campos de moderação protegidos' using errcode='42501'; end if;
   if (to_jsonb(new)-'atualizado_em') is distinct from (to_jsonb(old)-'atualizado_em') then
    new.status_aprovacao:='pendente'; new.aprovado_por:=null; new.data_aprovacao:=null; new.moderado:=false; new.moderado_por:=null; new.data_moderacao:=null; new.observacoes_moderacao:=null;
   end if;
  end if;
 end if;
 return new;
end $function$;
create trigger guard_civic_problem_fields before insert or update on public.problemas_cidade for each row execute function private.guard_civic_problem_fields();
CREATE OR REPLACE FUNCTION private.guard_civic_vote_identity()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if current_user='authenticated' and (to_jsonb(new)-'tipo_voto') is distinct from (to_jsonb(old)-'tipo_voto') then raise exception 'Somente o tipo de voto pode ser alterado' using errcode='42501'; end if;
 return new;
end $function$;
create trigger guard_civic_vote_identity before update on public.votos_problema for each row execute function private.guard_civic_vote_identity();
create trigger guard_civic_vote_identity before update on public.votos_comentario for each row execute function private.guard_civic_vote_identity();
