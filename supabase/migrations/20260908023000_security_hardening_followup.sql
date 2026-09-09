-- Security hardening follow-up. Keeps existing data and does not alter Auth password settings.

-- 1. Only a general administrator with AAL2 may change privileged profile fields.
create or replace function private.protect_user_sensitive_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
begin
  if jwt_role = 'service_role' or private.admin_mfa_verified(null, true) then
    return new;
  end if;

  if (select auth.uid()) is distinct from old.id
     and not private.admin_mfa_verified(old.cidade_id, false) then
    raise exception 'Sem permissão para alterar este perfil' using errcode = '42501';
  end if;

  new.id := old.id;
  new.email := old.email;
  new.tipo_conta := old.tipo_conta;
  new.plano_id := old.plano_id;
  new.total_points := old.total_points;
  new.current_level := old.current_level;
  new.weekly_points := old.weekly_points;
  new.monthly_points := old.monthly_points;
  new.badges_count := old.badges_count;
  new.criado_em := old.criado_em;
  return new;
end;
$$;

revoke all on function private.protect_user_sensitive_profile_fields() from public, anon, authenticated;

-- 2. Support sessions and gamification writes are server-only.
drop policy if exists "Sistema pode gerenciar sessões" on public.suporte_sessoes_ativas;
revoke all on public.suporte_sessoes_ativas from anon, authenticated;

drop policy if exists "Sistema pode inserir pontos" on public.user_points;
drop policy if exists "Sistema pode conceder badges" on public.user_badges;
drop policy if exists "Sistema pode criar missões de usuário" on public.user_missions;
revoke insert on public.user_points, public.user_badges, public.user_missions from anon, authenticated;

-- 3. Domino lobby is atomic and outsiders can no longer mutate games.
drop policy if exists "Permitir exclusão pública da fila" on public.domino_fila;
drop policy if exists "Permitir inserção pública na fila" on public.domino_fila;
drop policy if exists "Permitir alteração pública da fila" on public.domino_fila;
drop policy if exists "Permitir leitura publica domino_fila" on public.domino_fila;
drop policy if exists "Permitir leitura pública da fila" on public.domino_fila;
drop policy if exists "Permitir alteração pública das salas" on public.domino_salas;
drop policy if exists "Permitir leitura publica domino_salas" on public.domino_salas;
drop policy if exists "Permitir leitura pública das salas" on public.domino_salas;

create policy "Jogadores autenticados podem ver a fila"
on public.domino_fila for select to authenticated using (true);
create policy "Jogador gerencia apenas sua entrada na fila"
on public.domino_fila for all to authenticated
using (usuario_id = (select auth.uid()))
with check (usuario_id = (select auth.uid()));

create policy "Jogadores autenticados podem ver as salas"
on public.domino_salas for select to authenticated using (true);
create policy "Participantes podem atualizar sua partida"
on public.domino_salas for update to authenticated
using ((select auth.uid()) in (jogador_1_id, jogador_2_id))
with check ((select auth.uid()) in (jogador_1_id, jogador_2_id));

revoke all on public.domino_fila, public.domino_salas from anon;
grant select, insert, update, delete on public.domino_fila to authenticated;
grant select, update on public.domino_salas to authenticated;

alter table public.domino_salas
  add column if not exists jogadas_jogador_1 smallint not null default 0,
  add column if not exists jogadas_jogador_2 smallint not null default 0,
  add column if not exists ultima_jogada_usuario_id uuid references public.usuarios(id) on delete set null;

create or replace function private.guard_domino_sala_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_old_len integer := coalesce(jsonb_array_length(old.historico_jogadas), 0);
  v_new_len integer := coalesce(jsonb_array_length(new.historico_jogadas), 0);
  v_added jsonb;
  v_left boolean := false;
  v_a integer;
  v_b integer;
  v_original text;
begin
  if current_user in ('postgres', 'service_role') then return new; end if;
  if v_uid is null or v_uid not in (old.jogador_1_id, old.jogador_2_id) then
    raise exception 'Jogador não pertence a esta partida' using errcode = '42501';
  end if;
  if new.jogador_1_id is distinct from old.jogador_1_id
     or new.jogador_2_id is distinct from old.jogador_2_id
     or new.numero_sala is distinct from old.numero_sala
     or new.status is distinct from old.status
     or new.resultado_registrado is distinct from old.resultado_registrado
     or new.resultado_tipo is distinct from old.resultado_tipo
     or new.vencedor_id is distinct from old.vencedor_id then
    raise exception 'Use a operação segura do servidor para alterar a sala' using errcode = '42501';
  end if;
  if new.historico_jogadas is not distinct from old.historico_jogadas then
    raise exception 'Atualização de partida inválida' using errcode = '42501';
  end if;
  if old.status <> 'jogando' or old.vez_usuario_id is distinct from v_uid or v_new_len <> v_old_len + 1 then
    raise exception 'Jogada fora da vez ou histórico inválido' using errcode = '42501';
  end if;

  if v_old_len = 0 then
    v_added := new.historico_jogadas -> 0;
  elsif (new.historico_jogadas - 0) = old.historico_jogadas then
    v_left := true;
    v_added := new.historico_jogadas -> 0;
  elsif (new.historico_jogadas - (v_new_len - 1)) = old.historico_jogadas then
    v_added := new.historico_jogadas -> (v_new_len - 1);
  else
    raise exception 'O histórico existente não pode ser reescrito' using errcode = '42501';
  end if;

  v_a := (v_added ->> 'ladoEsquerdo')::integer;
  v_b := (v_added ->> 'ladoDireito')::integer;
  v_original := v_added ->> 'valorOriginal';
  if v_a not between 0 and 6 or v_b not between 0 and 6
     or v_original !~ '^[0-6]-[0-6]$' then
    raise exception 'Peça de dominó inválida' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(old.historico_jogadas) item
    where least(split_part(item->>'valorOriginal','-',1)::integer, split_part(item->>'valorOriginal','-',2)::integer)
            = least(split_part(v_original,'-',1)::integer, split_part(v_original,'-',2)::integer)
      and greatest(split_part(item->>'valorOriginal','-',1)::integer, split_part(item->>'valorOriginal','-',2)::integer)
            = greatest(split_part(v_original,'-',1)::integer, split_part(v_original,'-',2)::integer)
  ) then
    raise exception 'Esta peça já foi jogada' using errcode = '23505';
  end if;
  if v_old_len > 0 and (
    (v_left and (v_b <> old.mesa_ponta_esquerda or new.mesa_ponta_esquerda <> v_a or new.mesa_ponta_direita <> old.mesa_ponta_direita))
    or (not v_left and (v_a <> old.mesa_ponta_direita or new.mesa_ponta_direita <> v_b or new.mesa_ponta_esquerda <> old.mesa_ponta_esquerda))
  ) then
    raise exception 'A peça não encaixa na ponta escolhida' using errcode = '22023';
  end if;

  new.vez_usuario_id := case when v_uid = old.jogador_1_id then old.jogador_2_id else old.jogador_1_id end;
  new.passadas_count := 0;
  new.ultima_jogada_usuario_id := v_uid;
  new.jogadas_jogador_1 := old.jogadas_jogador_1 + case when v_uid = old.jogador_1_id then 1 else 0 end;
  new.jogadas_jogador_2 := old.jogadas_jogador_2 + case when v_uid = old.jogador_2_id then 1 else 0 end;
  new.atualizado_em := now();
  return new;
exception when invalid_text_representation or null_value_not_allowed then
  raise exception 'Formato da peça inválido' using errcode = '22023';
end;
$$;

drop trigger if exists guard_domino_sala_update_trigger on public.domino_salas;
create trigger guard_domino_sala_update_trigger
before update on public.domino_salas
for each row execute function private.guard_domino_sala_update();
revoke all on function private.guard_domino_sala_update() from public, anon, authenticated;

create or replace function public.entrar_lobby_domino()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_uid uuid := (select auth.uid()); v_sala public.domino_salas%rowtype;
begin
  if v_uid is null then raise exception 'Autenticação obrigatória'; end if;
  select * into v_sala from public.domino_salas
    where v_uid in (jogador_1_id, jogador_2_id) limit 1;
  if found then return v_sala.id; end if;
  delete from public.domino_fila where usuario_id = v_uid;
  select * into v_sala from public.domino_salas
    where jogador_1_id is null or jogador_2_id is null
    order by numero_sala for update skip locked limit 1;
  if not found then
    insert into public.domino_fila(usuario_id) values (v_uid)
      on conflict (usuario_id) do update set entrou_em = excluded.entrou_em;
    return null;
  end if;
  update public.domino_salas set
    jogador_1_id = case when v_sala.jogador_1_id is null then v_uid else v_sala.jogador_1_id end,
    jogador_2_id = case when v_sala.jogador_1_id is not null and v_sala.jogador_2_id is null then v_uid else v_sala.jogador_2_id end,
    status = case when v_sala.jogador_1_id is not null or v_sala.jogador_2_id is not null then 'jogando' else 'aguardando' end,
    vez_usuario_id = case when v_sala.jogador_1_id is not null or v_sala.jogador_2_id is not null then coalesce(v_sala.jogador_1_id, v_sala.jogador_2_id) else null end,
    mesa_ponta_esquerda = null, mesa_ponta_direita = null, historico_jogadas = '[]'::jsonb,
    passadas_count = 0, jogadas_jogador_1 = 0, jogadas_jogador_2 = 0,
    ultima_jogada_usuario_id = null, resultado_registrado = false, resultado_tipo = null, vencedor_id = null,
    atualizado_em = now()
  where id = v_sala.id;
  return v_sala.id;
end;
$$;

create or replace function public.sair_lobby_domino()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v_uid uuid := (select auth.uid()); v_changed integer := 0; v_rows integer;
begin
  if v_uid is null then raise exception 'Autenticação obrigatória'; end if;
  delete from public.domino_fila where usuario_id = v_uid;
  get diagnostics v_changed = row_count;
  update public.domino_salas set
    jogador_1_id = case when jogador_1_id = v_uid then null else jogador_1_id end,
    jogador_2_id = case when jogador_2_id = v_uid then null else jogador_2_id end,
    status = 'aguardando', vez_usuario_id = null,
    mesa_ponta_esquerda = null, mesa_ponta_direita = null, historico_jogadas = '[]'::jsonb,
    passadas_count = 0, jogadas_jogador_1 = 0, jogadas_jogador_2 = 0,
    ultima_jogada_usuario_id = null, resultado_registrado = false, resultado_tipo = null, vencedor_id = null,
    atualizado_em = now()
  where v_uid in (jogador_1_id, jogador_2_id);
  get diagnostics v_rows = row_count;
  return v_changed + v_rows > 0;
end;
$$;

revoke all on function public.entrar_lobby_domino() from public, anon;
revoke all on function public.sair_lobby_domino() from public, anon;
grant execute on function public.entrar_lobby_domino(), public.sair_lobby_domino() to authenticated;

-- Victory can only be registered after the caller has made seven validated moves.
create or replace function public.finalizar_partida_domino(p_sala_id uuid, p_resultado text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_sala public.domino_salas%rowtype; v_uid uuid := (select auth.uid()); v_loser uuid;
begin
  if v_uid is null then raise exception 'Usuário não autenticado'; end if;
  select * into v_sala from public.domino_salas where id=p_sala_id for update;
  if not found or v_uid not in (v_sala.jogador_1_id,v_sala.jogador_2_id) or v_sala.status <> 'jogando' then
    raise exception 'Partida inválida';
  end if;
  if v_sala.resultado_registrado then return false; end if;
  if p_resultado = 'empate' then
    if v_sala.passadas_count < 2 then raise exception 'A partida ainda não está trancada'; end if;
    insert into public.domino_estatisticas(usuario_id,vitorias,empates,derrotas,partidas_jogadas,pontuacao,atualizado_em)
      values(v_sala.jogador_1_id,0,1,0,1,1,now()),(v_sala.jogador_2_id,0,1,0,1,1,now())
      on conflict(usuario_id) do update set empates=public.domino_estatisticas.empates+1, partidas_jogadas=public.domino_estatisticas.partidas_jogadas+1, pontuacao=public.domino_estatisticas.pontuacao+1, atualizado_em=now();
    update public.domino_salas set resultado_registrado=true,resultado_tipo='empate',vencedor_id=null,status='finalizada',atualizado_em=now() where id=p_sala_id;
  elsif p_resultado = 'vitoria' then
    if v_sala.ultima_jogada_usuario_id is distinct from v_uid
       or (case when v_uid=v_sala.jogador_1_id then v_sala.jogadas_jogador_1 else v_sala.jogadas_jogador_2 end) < 7 then
      raise exception 'Vitória ainda não comprovada pelo servidor' using errcode='42501';
    end if;
    v_loser := case when v_uid=v_sala.jogador_1_id then v_sala.jogador_2_id else v_sala.jogador_1_id end;
    insert into public.domino_estatisticas(usuario_id,vitorias,empates,derrotas,partidas_jogadas,pontuacao,atualizado_em)
      values(v_uid,1,0,0,1,3,now()) on conflict(usuario_id) do update set vitorias=public.domino_estatisticas.vitorias+1,partidas_jogadas=public.domino_estatisticas.partidas_jogadas+1,pontuacao=public.domino_estatisticas.pontuacao+3,atualizado_em=now();
    insert into public.domino_estatisticas(usuario_id,vitorias,empates,derrotas,partidas_jogadas,pontuacao,atualizado_em)
      values(v_loser,0,0,1,1,0,now()) on conflict(usuario_id) do update set derrotas=public.domino_estatisticas.derrotas+1,partidas_jogadas=public.domino_estatisticas.partidas_jogadas+1,pontuacao=greatest(0,public.domino_estatisticas.pontuacao-2),atualizado_em=now();
    update public.domino_salas set resultado_registrado=true,resultado_tipo='vitoria',vencedor_id=v_uid,status='finalizada',atualizado_em=now() where id=p_sala_id;
  else raise exception 'Resultado inválido';
  end if;
  return true;
end; $$;
revoke all on function public.finalizar_partida_domino(uuid,text) from public, anon;
grant execute on function public.finalizar_partida_domino(uuid,text) to authenticated;

-- 4. Anonymous raffles can be viewed/reserved, but only authenticated owners or MFA admins manage them.
drop policy if exists "Usuários podem criar suas próprias rifas" on public.rifas_usuarios;
drop policy if exists "Usuários podem atualizar suas próprias rifas" on public.rifas_usuarios;
drop policy if exists "Usuários podem deletar suas próprias rifas" on public.rifas_usuarios;
create policy "Usuários autenticados criam suas próprias rifas" on public.rifas_usuarios
for insert to authenticated with check (user_id=(select auth.uid()));
create policy "Criador ou administrador gerencia rifa" on public.rifas_usuarios
for update to authenticated
using (user_id=(select auth.uid()) or private.admin_mfa_verified(null,false))
with check (user_id=(select auth.uid()) or private.admin_mfa_verified(null,false));
create policy "Criador ou administrador exclui rifa" on public.rifas_usuarios
for delete to authenticated using (user_id=(select auth.uid()) or private.admin_mfa_verified(null,false));
revoke insert,update,delete on public.rifas_usuarios from anon;
grant insert,update,delete on public.rifas_usuarios to authenticated;

-- 5. Persisted abuse limit for public appointments (per company + phone).
create table if not exists private.appointment_request_limits(
  bucket text primary key,
  request_count integer not null default 1,
  window_started_at timestamptz not null default now()
);
revoke all on private.appointment_request_limits from public, anon, authenticated;

create or replace function public.criar_agendamento_publico(
  p_empresa_id uuid,p_nome_cliente text,p_telefone_cliente text,p_servico text,
  p_data_agendamento timestamptz,p_observacoes text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_phone text; v_bucket text; v_count integer;
begin
  v_phone := regexp_replace(coalesce(p_telefone_cliente,''),'\D','','g');
  if char_length(trim(coalesce(p_nome_cliente,''))) not between 2 and 120
     or char_length(v_phone) not between 8 and 15
     or char_length(trim(coalesce(p_servico,''))) not between 2 and 160
     or char_length(coalesce(p_observacoes,'')) > 1000 then
    raise exception 'Dados do agendamento inválidos' using errcode='22023';
  end if;
  v_bucket := encode(extensions.digest(p_empresa_id::text || ':' || v_phone || ':' || date_trunc('hour',now())::text,'sha256'),'hex');
  insert into private.appointment_request_limits(bucket,request_count,window_started_at)
    values(v_bucket,1,date_trunc('hour',now()))
    on conflict(bucket) do update set request_count=private.appointment_request_limits.request_count+1
    returning request_count into v_count;
  if v_count > 5 then raise exception 'Muitas tentativas de agendamento. Aguarde antes de tentar novamente' using errcode='P0001'; end if;
  insert into public.agendamentos(empresa_id,nome_cliente,telefone_cliente,servico,data_agendamento,observacoes,status,cliente_usuario_id)
    values(p_empresa_id,trim(p_nome_cliente),v_phone,trim(p_servico),p_data_agendamento,nullif(trim(p_observacoes),''),'pendente',(select auth.uid()))
    returning id into v_id;
  return v_id;
end; $$;
revoke all on function public.criar_agendamento_publico(uuid,text,text,text,timestamptz,text) from public;
grant execute on function public.criar_agendamento_publico(uuid,text,text,text,timestamptz,text) to anon,authenticated;

-- 6. Remove unnecessary discovery of private tables and secure future objects by default.
revoke select,update,delete on public.agendamentos from anon;
revoke select,update,delete on public.conversion_events from anon;
revoke select on public.usuarios from anon;

alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;
-- Supabase-managed objects owned by supabase_admin cannot have their defaults
-- changed from project migrations. Project-owned objects above are locked down.
