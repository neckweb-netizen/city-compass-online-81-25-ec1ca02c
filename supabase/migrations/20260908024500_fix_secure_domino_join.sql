-- Correct the atomic room state for the first and second player joins.
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

revoke all on function public.entrar_lobby_domino() from public, anon;
grant execute on function public.entrar_lobby_domino() to authenticated;

create or replace function private.validate_domino_first_move()
returns trigger
language plpgsql
set search_path = ''
as $$
declare v_piece jsonb;
begin
  if coalesce(jsonb_array_length(old.historico_jogadas),0)=0
     and coalesce(jsonb_array_length(new.historico_jogadas),0)=1 then
    v_piece := new.historico_jogadas->0;
    if new.mesa_ponta_esquerda is distinct from (v_piece->>'ladoEsquerdo')::integer
       or new.mesa_ponta_direita is distinct from (v_piece->>'ladoDireito')::integer then
      raise exception 'As pontas não correspondem à primeira peça' using errcode='22023';
    end if;
  end if;
  return new;
exception when invalid_text_representation then
  raise exception 'Formato da primeira peça inválido' using errcode='22023';
end;
$$;

drop trigger if exists validate_domino_first_move_trigger on public.domino_salas;
create trigger validate_domino_first_move_trigger
before update on public.domino_salas
for each row execute function private.validate_domino_first_move();
revoke all on function private.validate_domino_first_move() from public,anon,authenticated;
