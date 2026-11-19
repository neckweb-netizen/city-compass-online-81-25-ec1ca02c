-- PROTOTYPE ONLY. Issue #94 phase 2: server-authoritative moves.
-- Apply only to a staging Supabase project after the phase-1 migration.
-- Neither this RPC nor the private hands are called by the legacy frontend.
-- Existing domino_salas triggers continue enforcing additional move invariants.

CREATE OR REPLACE FUNCTION public.domino_v2_jogar(
  p_sala_id uuid,
  p_pedra text,
  p_lado text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_sala public.domino_salas%ROWTYPE;
  v_partida private.domino_v2_partidas%ROWTYPE;
  v_a integer;
  v_b integer;
  v_pedra text;
  v_esq integer;
  v_dir integer;
  v_nova_esq integer;
  v_nova_dir integer;
  v_orient_esq integer;
  v_orient_dir integer;
  v_novo_historico jsonb;
  v_peca jsonb;
  v_removidas integer;
  v_restantes integer;
  v_proxima_vez uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória' USING ERRCODE='42501';
  END IF;
  IF p_pedra IS NULL OR p_pedra !~ '^[0-6]-[0-6]$'
     OR p_lado NOT IN ('esquerda', 'direita') OR p_lado IS NULL
  THEN
    RAISE EXCEPTION 'Peça ou lado inválido' USING ERRCODE='22023';
  END IF;
  v_a := split_part(p_pedra, '-', 1)::integer;
  v_b := split_part(p_pedra, '-', 2)::integer;
  v_pedra := least(v_a,v_b)::text || '-' || greatest(v_a,v_b)::text;

  -- Lock the match BEFORE checking turn, hand and board. Each move is atomic.
  SELECT * INTO v_sala
  FROM public.domino_salas
  WHERE id = p_sala_id
  FOR UPDATE;
  IF NOT FOUND OR v_sala.status <> 'jogando' OR v_sala.resultado_registrado
     OR v_sala.jogador_1_id IS NULL OR v_sala.jogador_2_id IS NULL
     OR v_sala.jogador_1_id = v_sala.jogador_2_id
     OR v_sala.vez_usuario_id IS DISTINCT FROM v_uid
  THEN
    RAISE EXCEPTION 'Partida encerrada ou fora da vez' USING ERRCODE='42501';
  END IF;

  SELECT * INTO v_partida FROM private.domino_v2_partidas WHERE sala_id = p_sala_id;
  IF NOT FOUND OR v_uid NOT IN (v_partida.jogador_1_id, v_partida.jogador_2_id)
     OR v_partida.jogador_1_id IS DISTINCT FROM v_sala.jogador_1_id
     OR v_partida.jogador_2_id IS DISTINCT FROM v_sala.jogador_2_id
  THEN
    RAISE EXCEPTION 'Partida sem distribuição válida' USING ERRCODE='42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM private.domino_v2_maos
    WHERE sala_id = p_sala_id AND jogador_id = v_uid AND pedra = v_pedra
  ) THEN
    RAISE EXCEPTION 'Esta peça não pertence à sua mão' USING ERRCODE='42501';
  END IF;

  v_novo_historico := coalesce(v_sala.historico_jogadas, '[]'::jsonb);
  IF jsonb_typeof(v_novo_historico) <> 'array' THEN
    RAISE EXCEPTION 'Tabuleiro inválido' USING ERRCODE='22023';
  END IF;
  v_esq := v_sala.mesa_ponta_esquerda;
  v_dir := v_sala.mesa_ponta_direita;
  IF jsonb_array_length(v_novo_historico) = 0 THEN
    IF v_esq IS NOT NULL OR v_dir IS NOT NULL THEN
      RAISE EXCEPTION 'Tabuleiro inicial inconsistente' USING ERRCODE='22023';
    END IF;
    -- First move accepts either canonical orientation, without trusting client endpoints.
    v_orient_esq := v_a;
    v_orient_dir := v_b;
    v_nova_esq := v_a;
    v_nova_dir := v_b;
  ELSIF p_lado = 'esquerda' THEN
    IF v_esq IS NULL OR v_dir IS NULL THEN
      RAISE EXCEPTION 'Pontas ausentes no tabuleiro' USING ERRCODE='22023';
    END IF;
    IF v_a = v_esq THEN
      v_orient_esq := v_b; v_orient_dir := v_a;
    ELSIF v_b = v_esq THEN
      v_orient_esq := v_a; v_orient_dir := v_b;
    ELSE
      RAISE EXCEPTION 'Peça não encaixa à esquerda' USING ERRCODE='22023';
    END IF;
    v_nova_esq := v_orient_esq;
    v_nova_dir := v_dir;
  ELSE
    IF v_esq IS NULL OR v_dir IS NULL THEN
      RAISE EXCEPTION 'Pontas ausentes no tabuleiro' USING ERRCODE='22023';
    END IF;
    IF v_a = v_dir THEN
      v_orient_esq := v_a; v_orient_dir := v_b;
    ELSIF v_b = v_dir THEN
      v_orient_esq := v_b; v_orient_dir := v_a;
    ELSE
      RAISE EXCEPTION 'Peça não encaixa à direita' USING ERRCODE='22023';
    END IF;
    v_nova_esq := v_esq;
    v_nova_dir := v_orient_dir;
  END IF;

  v_peca := jsonb_build_object(
    'valorOriginal', v_orient_esq::text || '-' || v_orient_dir::text,
    'ladoEsquerdo', v_orient_esq,
    'ladoDireito', v_orient_dir
  );

  IF jsonb_array_length(v_novo_historico) = 0 THEN
    v_novo_historico := jsonb_build_array(v_peca);
  ELSIF p_lado = 'esquerda' THEN
    v_novo_historico := jsonb_build_array(v_peca) || v_novo_historico;
  ELSE
    v_novo_historico := v_novo_historico || jsonb_build_array(v_peca);
  END IF;

  -- Consume the tile in the same transaction as the board update.
  DELETE FROM private.domino_v2_maos
  WHERE sala_id = p_sala_id AND jogador_id = v_uid AND pedra = v_pedra;
  GET DIAGNOSTICS v_removidas = ROW_COUNT;
  IF v_removidas <> 1 THEN
    RAISE EXCEPTION 'Peça já utilizada ou indisponível' USING ERRCODE='23505';
  END IF;

  v_proxima_vez := CASE
    WHEN v_uid = v_sala.jogador_1_id THEN v_sala.jogador_2_id
    ELSE v_sala.jogador_1_id
  END;
  UPDATE public.domino_salas
  SET historico_jogadas = v_novo_historico,
      mesa_ponta_esquerda = v_nova_esq,
      mesa_ponta_direita = v_nova_dir,
      vez_usuario_id = v_proxima_vez,
      ultima_jogada_usuario_id = v_uid,
      passadas_count = 0,
      jogadas_jogador_1 = v_sala.jogadas_jogador_1
        + CASE WHEN v_uid = v_sala.jogador_1_id THEN 1 ELSE 0 END,
      jogadas_jogador_2 = v_sala.jogadas_jogador_2
        + CASE WHEN v_uid = v_sala.jogador_2_id THEN 1 ELSE 0 END,
      atualizado_em = now()
  WHERE id = p_sala_id;

  SELECT count(*) INTO v_restantes
  FROM private.domino_v2_maos
  WHERE sala_id = p_sala_id AND jogador_id = v_uid;

  -- The caller cannot self-report victory. A subsequent authoritative
  -- finalization RPC must verify v_restantes=0 before awarding points.
  RETURN jsonb_build_object(
    'pedra', v_peca,
    'ponta_esquerda', v_nova_esq,
    'ponta_direita', v_nova_dir,
    'proxima_vez_usuario_id', v_proxima_vez,
    'pecas_restantes', v_restantes
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.domino_v2_jogar(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.domino_v2_jogar(uuid,text,text) TO authenticated;

-- For a v2-initialized room, prevent a signed-in user from circumventing
-- private hand ownership with the legacy direct UPDATE API.
CREATE OR REPLACE FUNCTION private.guard_domino_sala_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_old_len integer := coalesce(jsonb_array_length(old.historico_jogadas),0);
  v_new_len integer := coalesce(jsonb_array_length(new.historico_jogadas),0);
  v_added jsonb;
  v_left boolean := false;
  v_a integer;
  v_b integer;
  v_original text;
BEGIN
  IF current_user IN ('postgres', 'service_role') THEN RETURN new; END IF;
  IF EXISTS (
    SELECT 1 FROM private.domino_v2_partidas
    WHERE sala_id=old.id
  ) THEN
    RAISE EXCEPTION 'Use a operação de jogada segura do servidor'
      USING ERRCODE='42501';
  END IF;
  IF v_uid IS NULL OR v_uid NOT IN (old.jogador_1_id, old.jogador_2_id) THEN
    RAISE EXCEPTION 'Jogador não pertence a esta partida' USING ERRCODE='42501';
  END IF;
  IF new.jogador_1_id IS DISTINCT FROM old.jogador_1_id
     OR new.jogador_2_id IS DISTINCT FROM old.jogador_2_id
     OR new.numero_sala IS DISTINCT FROM old.numero_sala
     OR new.status IS DISTINCT FROM old.status
     OR new.resultado_registrado IS DISTINCT FROM old.resultado_registrado
     OR new.resultado_tipo IS DISTINCT FROM old.resultado_tipo
     OR new.vencedor_id IS DISTINCT FROM old.vencedor_id THEN
    RAISE EXCEPTION 'Use a operação segura do servidor para alterar a sala'
      USING ERRCODE='42501';
  END IF;
  IF new.historico_jogadas IS NOT DISTINCT FROM old.historico_jogadas THEN
    RAISE EXCEPTION 'Atualização de partida inválida' USING ERRCODE='42501';
  END IF;
  IF old.status <> 'jogando'
     OR old.vez_usuario_id IS DISTINCT FROM v_uid
     OR v_new_len <> v_old_len + 1 THEN
    RAISE EXCEPTION 'Jogada fora da vez ou histórico inválido' USING ERRCODE='42501';
  END IF;

  IF v_old_len = 0 THEN
    v_added := new.historico_jogadas -> 0;
  ELSIF (new.historico_jogadas - 0) = old.historico_jogadas THEN
    v_left := true;
    v_added := new.historico_jogadas -> 0;
  ELSIF (new.historico_jogadas - (v_new_len - 1)) = old.historico_jogadas THEN
    v_added := new.historico_jogadas -> (v_new_len - 1);
  ELSE
    RAISE EXCEPTION 'O histórico existente não pode ser reescrito' USING ERRCODE='42501';
  END IF;

  v_a := (v_added ->> 'ladoEsquerdo')::integer;
  v_b := (v_added ->> 'ladoDireito')::integer;
  v_original := v_added ->> 'valorOriginal';
  IF v_a NOT BETWEEN 0 AND 6 OR v_b NOT BETWEEN 0 AND 6
     OR v_original !~ '^[0-6]-[0-6]$' THEN
    RAISE EXCEPTION 'Peça de dominó inválida' USING ERRCODE='22023';
  END IF;
  IF v_a IS NULL OR v_b IS NULL
     OR new.mesa_ponta_esquerda IS NULL OR new.mesa_ponta_direita IS NULL
     OR least(v_a,v_b) IS DISTINCT FROM
        least(split_part(v_original,'-',1)::integer,split_part(v_original,'-',2)::integer)
     OR greatest(v_a,v_b) IS DISTINCT FROM
        greatest(split_part(v_original,'-',1)::integer,split_part(v_original,'-',2)::integer)
  THEN
    RAISE EXCEPTION 'Os valores da peça não correspondem à jogada informada'
      USING ERRCODE='22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(old.historico_jogadas) item
    WHERE least(split_part(item->>'valorOriginal','-',1)::integer,
                split_part(item->>'valorOriginal','-',2)::integer)
          = least(split_part(v_original,'-',1)::integer,
                  split_part(v_original,'-',2)::integer)
      AND greatest(split_part(item->>'valorOriginal','-',1)::integer,
                   split_part(item->>'valorOriginal','-',2)::integer)
          = greatest(split_part(v_original,'-',1)::integer,
                     split_part(v_original,'-',2)::integer)
  ) THEN
    RAISE EXCEPTION 'Esta peça já foi jogada' USING ERRCODE='23505';
  END IF;
  IF v_old_len > 0 AND (
    (v_left AND (v_b <> old.mesa_ponta_esquerda
      OR new.mesa_ponta_esquerda <> v_a
      OR new.mesa_ponta_direita <> old.mesa_ponta_direita))
    OR (NOT v_left AND (v_a <> old.mesa_ponta_direita
      OR new.mesa_ponta_direita <> v_b
      OR new.mesa_ponta_esquerda <> old.mesa_ponta_esquerda))
  ) THEN
    RAISE EXCEPTION 'A peça não encaixa na ponta escolhida' USING ERRCODE='22023';
  END IF;

  new.vez_usuario_id := CASE
    WHEN v_uid = old.jogador_1_id THEN old.jogador_2_id
    ELSE old.jogador_1_id
  END;
  new.passadas_count := 0;
  new.ultima_jogada_usuario_id := v_uid;
  new.jogadas_jogador_1 := old.jogadas_jogador_1
    + CASE WHEN v_uid=old.jogador_1_id THEN 1 ELSE 0 END;
  new.jogadas_jogador_2 := old.jogadas_jogador_2
    + CASE WHEN v_uid=old.jogador_2_id THEN 1 ELSE 0 END;
  new.atualizado_em := now();
  RETURN new;
EXCEPTION WHEN invalid_text_representation OR null_value_not_allowed THEN
  RAISE EXCEPTION 'Formato da peça inválido' USING ERRCODE='22023';
END;
$function$;
