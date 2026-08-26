-- Moderacao central de texto e notificacoes automaticas das interacoes.
-- Funcoes internas nao sao expostas pela Data API.
create schema if not exists private;

create or replace function private.censurar_xingamentos(valor text)
returns text
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  resultado text := valor;
  padrao text;
  padroes text[] := array[
    '\mfilh[oa]\s+d[ae]\s+put[ao]\M',
    '\mvai\s+tomar\s+n[oa]\s+cu\M',
    '\mvai\s+se\s+foder\M',
    '\md[ei]sgra[cç](?:a|ada|ado)\M',
    '\mput(?:a|o|aria|inha|inho)\M',
    '\mvagabund(?:a|o)\M',
    '\mcaralh(?:o|a)\M',
    '\mporr+a\M',
    '\mmerd+a\M',
    '\mfod(?:a|ase|er|ido|ida)\M',
    '\mbucet+a\M',
    '\marrombad(?:a|o)\M',
    '\mdesgra[cç]ad(?:a|o)\M',
    '\mpiranh+a\M',
    '\mvadi+a\M',
    '\mcorn(?:a|o)\M',
    '\motari(?:a|o)\M',
    '\mimbecil\M',
    '\midiot+a\M',
    '\mretardad(?:a|o)\M',
    '\mviad(?:a|o)\M',
    '\mcu\M'
  ];
begin
  if resultado is null then return null; end if;
  -- Primeiro remove acentos apenas para identificar as variacoes informadas.
  -- A substituicao acontece no texto original e preserva o restante do relato.
  foreach padrao in array padroes loop
    resultado := regexp_replace(resultado, padrao, '***', 'gi');
  end loop;
  return resultado;
end;
$$;

revoke all on function private.censurar_xingamentos(text) from public, anon, authenticated;

create or replace function private.moderar_texto_interacao()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if tg_table_name = 'entre_nos_postagens' then
    new.conteudo := private.censurar_xingamentos(new.conteudo);
  elsif tg_table_name = 'entre_nos_comentarios' then
    new.conteudo := private.censurar_xingamentos(new.conteudo);
  elsif tg_table_name = 'comentarios_problema' then
    new.conteudo := private.censurar_xingamentos(new.conteudo);
  elsif tg_table_name = 'problemas_cidade' then
    new.titulo := private.censurar_xingamentos(new.titulo);
    new.descricao := private.censurar_xingamentos(new.descricao);
  elsif tg_table_name = 'avaliacoes' then
    new.comentario := private.censurar_xingamentos(new.comentario);
  elsif tg_table_name = 'evento_avaliacoes' then
    new.comentario := private.censurar_xingamentos(new.comentario);
  end if;
  return new;
end;
$$;

revoke all on function private.moderar_texto_interacao() from public, anon, authenticated;

drop trigger if exists moderar_entre_nos_postagens on public.entre_nos_postagens;
create trigger moderar_entre_nos_postagens before insert or update of conteudo on public.entre_nos_postagens
for each row execute function private.moderar_texto_interacao();
drop trigger if exists moderar_entre_nos_comentarios on public.entre_nos_comentarios;
create trigger moderar_entre_nos_comentarios before insert or update of conteudo on public.entre_nos_comentarios
for each row execute function private.moderar_texto_interacao();
drop trigger if exists moderar_comentarios_problema on public.comentarios_problema;
create trigger moderar_comentarios_problema before insert or update of conteudo on public.comentarios_problema
for each row execute function private.moderar_texto_interacao();
drop trigger if exists moderar_problemas_cidade on public.problemas_cidade;
create trigger moderar_problemas_cidade before insert or update of titulo, descricao on public.problemas_cidade
for each row execute function private.moderar_texto_interacao();
drop trigger if exists moderar_avaliacoes on public.avaliacoes;
create trigger moderar_avaliacoes before insert or update of comentario on public.avaliacoes
for each row execute function private.moderar_texto_interacao();
drop trigger if exists moderar_evento_avaliacoes on public.evento_avaliacoes;
create trigger moderar_evento_avaliacoes before insert or update of comentario on public.evento_avaliacoes
for each row execute function private.moderar_texto_interacao();

-- Insere na caixa interna. O trigger queue_notification_deliveries existente
-- cria a fila push Firebase, respeitando preferencias e dispositivos ativos.
create or replace function private.notificar_interacao()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  destinatario uuid;
  destino_secundario uuid;
  titulo_item text;
begin
  if tg_table_name = 'entre_nos_reacoes' then
    if tg_op = 'UPDATE' and old.tipo is not distinct from new.tipo then return new; end if;
    select p.usuario_id into destinatario from public.entre_nos_postagens p where p.id = new.postagem_id;
    if destinatario is not null and destinatario <> new.usuario_id then
      insert into public.notifications (user_id,title,message,category,priority,action_url,action_label,metadata)
      values (destinatario,'Seu relato recebeu apoio','Alguém reagiu à sua publicação no Entre Nós.','community','normal','/entre-nos','Ver publicação',jsonb_build_object('event','anonymous_reaction','post_id',new.postagem_id,'reaction',new.tipo));
    end if;

  elsif tg_table_name = 'entre_nos_comentarios' then
    if tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'aprovado' then
      select p.usuario_id into destinatario from public.entre_nos_postagens p where p.id = new.postagem_id;
      if destinatario is not null and destinatario <> new.usuario_id then
        insert into public.notifications (user_id,title,message,category,priority,action_url,action_label,metadata)
        values (destinatario,'Novo comentário anônimo','Sua publicação recebeu um comentário no Entre Nós.','community','normal','/entre-nos','Ver comentário',jsonb_build_object('event','anonymous_comment','post_id',new.postagem_id,'comment_id',new.id));
      end if;
      insert into public.notifications (user_id,title,message,category,priority,action_url,action_label,metadata)
      values (new.usuario_id,'Comentário aprovado','Seu comentário já está visível no Entre Nós.','community','low','/entre-nos','Ver comentário',jsonb_build_object('event','anonymous_comment_approved','post_id',new.postagem_id,'comment_id',new.id));
    end if;

  elsif tg_table_name = 'entre_nos_postagens' then
    if tg_op = 'UPDATE' and old.status is distinct from new.status and new.status in ('aprovado','rejeitado') then
      insert into public.notifications (user_id,title,message,category,priority,action_url,action_label,metadata)
      values (new.usuario_id,case when new.status='aprovado' then 'Publicação aprovada' else 'Publicação não aprovada' end,case when new.status='aprovado' then 'Seu relato já está visível no Entre Nós.' else 'Seu relato não foi aprovado pela moderação.' end,'community',case when new.status='aprovado' then 'normal' else 'high' end,'/entre-nos','Abrir Entre Nós',jsonb_build_object('event','anonymous_post_moderated','post_id',new.id,'status',new.status));
    end if;

  elsif tg_table_name = 'comentarios_problema' then
    select p.usuario_id, p.titulo into destinatario, titulo_item from public.problemas_cidade p where p.id = new.problema_id;
    if destinatario is not null and destinatario <> new.usuario_id then
      insert into public.notifications (user_id,title,message,category,priority,action_url,action_label,metadata)
      values (destinatario,'Novo comentário','Seu relato "'||left(titulo_item,80)||'" recebeu um comentário.','community','normal','/reclamacoes/'||new.problema_id,'Ver comentário',jsonb_build_object('event','problem_comment','problem_id',new.problema_id,'comment_id',new.id));
    end if;
    if new.comentario_pai_id is not null then
      select c.usuario_id into destino_secundario from public.comentarios_problema c where c.id = new.comentario_pai_id;
      if destino_secundario is not null and destino_secundario <> new.usuario_id and destino_secundario is distinct from destinatario then
        insert into public.notifications (user_id,title,message,category,priority,action_url,action_label,metadata)
        values (destino_secundario,'Responderam seu comentário','Alguém respondeu ao seu comentário na Voz do Povo.','community','normal','/reclamacoes/'||new.problema_id,'Ver resposta',jsonb_build_object('event','problem_comment_reply','problem_id',new.problema_id,'comment_id',new.id));
      end if;
    end if;

  elsif tg_table_name = 'votos_problema' then
    select p.usuario_id into destinatario from public.problemas_cidade p where p.id = new.problema_id;
    if destinatario is not null and destinatario <> new.usuario_id then
      insert into public.notifications (user_id,title,message,category,priority,action_url,action_label,metadata)
      values (destinatario,'Nova reação no seu relato','Alguém reagiu ao seu relato na Voz do Povo.','community','low','/reclamacoes/'||new.problema_id,'Ver relato',jsonb_build_object('event','problem_vote','problem_id',new.problema_id));
    end if;

  elsif tg_table_name = 'votos_comentario' then
    select c.usuario_id, c.problema_id into destinatario, destino_secundario from public.comentarios_problema c where c.id = new.comentario_id;
    if destinatario is not null and destinatario <> new.usuario_id then
      insert into public.notifications (user_id,title,message,category,priority,action_url,action_label,metadata)
      values (destinatario,'Reagiram ao seu comentário','Seu comentário recebeu uma nova reação.','community','low','/reclamacoes/'||destino_secundario,'Ver comentário',jsonb_build_object('event','comment_vote','comment_id',new.comentario_id));
    end if;

  elsif tg_table_name = 'avaliacoes' then
    if tg_op = 'INSERT' then
      select e.usuario_id, e.nome into destinatario, titulo_item from public.empresas e where e.id = new.empresa_id;
      if destinatario is not null and destinatario <> new.usuario_id then
        insert into public.notifications (user_id,title,message,category,priority,action_url,action_label,metadata)
        values (destinatario,'Nova avaliação',coalesce(titulo_item,'Sua empresa')||' recebeu uma avaliação de '||new.nota||' estrelas.','community','normal','/empresa-dashboard','Ver avaliação',jsonb_build_object('event','company_review','company_id',new.empresa_id,'review_id',new.id));
      end if;
    elsif old.resposta_empresa is distinct from new.resposta_empresa and nullif(btrim(new.resposta_empresa),'') is not null then
      insert into public.notifications (user_id,title,message,category,priority,action_url,action_label,metadata)
      values (new.usuario_id,'Sua avaliação foi respondida','A empresa respondeu à sua avaliação.','community','normal','/locais/'||new.empresa_id,'Ver resposta',jsonb_build_object('event','review_response','company_id',new.empresa_id,'review_id',new.id));
    end if;

  elsif tg_table_name = 'evento_avaliacoes' then
    select e.titulo, emp.usuario_id into titulo_item, destinatario from public.eventos e left join public.empresas emp on emp.id=e.empresa_id where e.id=new.evento_id;
    if destinatario is not null and destinatario <> new.usuario_id then
      insert into public.notifications (user_id,title,message,category,priority,action_url,action_label,metadata)
      values (destinatario,'Nova avaliação no evento','O evento "'||left(coalesce(titulo_item,'Evento'),80)||'" recebeu '||new.nota||' estrelas.','events','normal','/eventos/'||new.evento_id,'Ver avaliação',jsonb_build_object('event','event_review','event_id',new.evento_id,'review_id',new.id));
    end if;

  elsif tg_table_name = 'favoritos' then
    select e.usuario_id, e.nome into destinatario, titulo_item from public.empresas e where e.id=new.empresa_id;
    if destinatario is not null and destinatario <> new.usuario_id then
      insert into public.notifications (user_id,title,message,category,priority,action_url,action_label,metadata)
      values (destinatario,'Sua empresa foi favoritada',coalesce(titulo_item,'Sua empresa')||' entrou na lista de favoritos de alguém.','community','low','/empresa-dashboard','Abrir painel',jsonb_build_object('event','company_favorite','company_id',new.empresa_id));
    end if;

  elsif tg_table_name = 'agendamentos' then
    select e.usuario_id, e.nome into destinatario, titulo_item from public.empresas e where e.id=new.empresa_id;
    if destinatario is not null then
      insert into public.notifications (user_id,title,message,category,priority,action_url,action_label,metadata)
      values (destinatario,'Novo agendamento',coalesce(titulo_item,'Sua empresa')||' recebeu uma nova solicitação de agendamento.','account','high','/empresa-dashboard','Ver agendamento',jsonb_build_object('event','new_appointment','company_id',new.empresa_id,'appointment_id',new.id));
    end if;

  elsif tg_table_name = 'problemas_cidade' then
    if tg_op='UPDATE' and old.status is distinct from new.status then
      insert into public.notifications (user_id,title,message,category,priority,action_url,action_label,metadata)
      values (new.usuario_id,'Status do relato atualizado','Seu relato agora está como '||replace(new.status::text,'_',' ')||'.','community','normal','/reclamacoes/'||new.id,'Ver atualização',jsonb_build_object('event','problem_status','problem_id',new.id,'status',new.status));
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.notificar_interacao() from public, anon, authenticated;

drop trigger if exists notificar_entre_nos_reacao on public.entre_nos_reacoes;
create trigger notificar_entre_nos_reacao after insert or update of tipo on public.entre_nos_reacoes for each row execute function private.notificar_interacao();
drop trigger if exists notificar_entre_nos_comentario on public.entre_nos_comentarios;
create trigger notificar_entre_nos_comentario after update of status on public.entre_nos_comentarios for each row execute function private.notificar_interacao();
drop trigger if exists notificar_entre_nos_postagem on public.entre_nos_postagens;
create trigger notificar_entre_nos_postagem after update of status on public.entre_nos_postagens for each row execute function private.notificar_interacao();
drop trigger if exists notificar_comentario_problema on public.comentarios_problema;
create trigger notificar_comentario_problema after insert on public.comentarios_problema for each row execute function private.notificar_interacao();
drop trigger if exists notificar_voto_problema on public.votos_problema;
create trigger notificar_voto_problema after insert on public.votos_problema for each row execute function private.notificar_interacao();
drop trigger if exists notificar_voto_comentario on public.votos_comentario;
create trigger notificar_voto_comentario after insert on public.votos_comentario for each row execute function private.notificar_interacao();
drop trigger if exists notificar_avaliacao_empresa on public.avaliacoes;
create trigger notificar_avaliacao_empresa after insert or update of resposta_empresa on public.avaliacoes for each row execute function private.notificar_interacao();
drop trigger if exists notificar_avaliacao_evento on public.evento_avaliacoes;
create trigger notificar_avaliacao_evento after insert on public.evento_avaliacoes for each row execute function private.notificar_interacao();
drop trigger if exists notificar_empresa_favoritada on public.favoritos;
create trigger notificar_empresa_favoritada after insert on public.favoritos for each row execute function private.notificar_interacao();
drop trigger if exists notificar_novo_agendamento on public.agendamentos;
create trigger notificar_novo_agendamento after insert on public.agendamentos for each row execute function private.notificar_interacao();
drop trigger if exists notificar_status_problema on public.problemas_cidade;
create trigger notificar_status_problema after update of status on public.problemas_cidade for each row execute function private.notificar_interacao();
