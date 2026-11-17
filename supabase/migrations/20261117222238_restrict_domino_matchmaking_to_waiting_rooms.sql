-- Already applied to Supabase production as 20261117222238; do not reapply manually.
-- Prevent matchmaking from selecting active or finalized rooms.
CREATE OR REPLACE FUNCTION public.entrar_lobby_domino()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid := (select auth.uid()); v_sala public.domino_salas%rowtype;
begin
  if v_uid is null then raise exception 'Autenticação obrigatória'; end if;
  select * into v_sala from public.domino_salas
    where v_uid in (jogador_1_id, jogador_2_id) limit 1;
  if found then return v_sala.id; end if;
  delete from public.domino_fila where usuario_id = v_uid;
  select * into v_sala from public.domino_salas
    where status = 'aguardando'
      and (jogador_1_id is null or jogador_2_id is null)
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
$function$

