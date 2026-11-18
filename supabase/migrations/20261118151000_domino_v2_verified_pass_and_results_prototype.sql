-- PROTOTYPE ONLY: Issue #94, phase 3. Do not deploy or merge before staging tests.
-- This migration assumes phases 1 and 2 are already installed in an isolated DB.
-- Legacy domino rooms retain their previous behavior; v2 rooms require server state.

CREATE OR REPLACE FUNCTION private.domino_v2_registrar_resultado(
  p_sala_id uuid,
  p_tipo text,
  p_vencedor uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_sala public.domino_salas%ROWTYPE;
  v_partida private.domino_v2_partidas%ROWTYPE;
  v_perdedor uuid;
BEGIN
  SELECT * INTO v_sala FROM public.domino_salas WHERE id=p_sala_id FOR UPDATE;
  SELECT * INTO v_partida FROM private.domino_v2_partidas WHERE sala_id=p_sala_id;

  IF NOT FOUND OR v_sala.status <> 'jogando' OR v_sala.resultado_registrado
     OR v_sala.jogador_1_id IS DISTINCT FROM v_partida.jogador_1_id
     OR v_sala.jogador_2_id IS DISTINCT FROM v_partida.jogador_2_id
  THEN
    RAISE EXCEPTION 'Partida v2 inválida ou encerrada' USING ERRCODE='42501';
  END IF;

  IF p_tipo = 'vitoria' THEN
    IF p_vencedor IS NULL
       OR p_vencedor NOT IN (v_partida.jogador_1_id,v_partida.jogador_2_id)
       OR v_sala.ultima_jogada_usuario_id IS DISTINCT FROM p_vencedor
       OR EXISTS (
         SELECT 1 FROM private.domino_v2_maos
         WHERE sala_id=p_sala_id AND jogador_id=p_vencedor
       )
    THEN
      RAISE EXCEPTION 'Vitória não comprovada pela mão do jogador'
        USING ERRCODE='42501';
    END IF;
    v_perdedor := CASE WHEN p_vencedor=v_partida.jogador_1_id
      THEN v_partida.jogador_2_id ELSE v_partida.jogador_1_id END;

    INSERT INTO public.domino_estatisticas
      (usuario_id,vitorias,empates,derrotas,partidas_jogadas,pontuacao,atualizado_em)
    VALUES (p_vencedor,1,0,0,1,3,now())
    ON CONFLICT(usuario_id) DO UPDATE SET
      vitorias=public.domino_estatisticas.vitorias+1,
      partidas_jogadas=public.domino_estatisticas.partidas_jogadas+1,
      pontuacao=public.domino_estatisticas.pontuacao+3,
      atualizado_em=now();

    INSERT INTO public.domino_estatisticas
      (usuario_id,vitorias,empates,derrotas,partidas_jogadas,pontuacao,atualizado_em)
    VALUES (v_perdedor,0,0,1,1,0,now())
    ON CONFLICT(usuario_id) DO UPDATE SET
      derrotas=public.domino_estatisticas.derrotas+1,
      partidas_jogadas=public.domino_estatisticas.partidas_jogadas+1,
      pontuacao=greatest(0,public.domino_estatisticas.pontuacao-2),
      atualizado_em=now();

    UPDATE public.domino_salas
    SET resultado_registrado=true, resultado_tipo='vitoria',
        vencedor_id=p_vencedor, status='finalizada', atualizado_em=now()
    WHERE id=p_sala_id;

  ELSIF p_tipo = 'empate' THEN
    IF p_vencedor IS NOT NULL OR coalesce(v_sala.passadas_count,0)<2
       OR v_sala.mesa_ponta_esquerda IS NULL OR v_sala.mesa_ponta_direita IS NULL
       OR EXISTS (
         SELECT 1 FROM private.domino_v2_maos m
         WHERE m.sala_id=p_sala_id
           AND (
             split_part(m.pedra,'-',1)::integer
               IN (v_sala.mesa_ponta_esquerda,v_sala.mesa_ponta_direita)
             OR split_part(m.pedra,'-',2)::integer
               IN (v_sala.mesa_ponta_esquerda,v_sala.mesa_ponta_direita)
           )
       )
    THEN
      RAISE EXCEPTION 'Empate não comprovado pelo servidor'
        USING ERRCODE='42501';
    END IF;

    INSERT INTO public.domino_estatisticas
      (usuario_id,vitorias,empates,derrotas,partidas_jogadas,pontuacao,atualizado_em)
    VALUES
      (v_partida.jogador_1_id,0,1,0,1,1,now()),
      (v_partida.jogador_2_id,0,1,0,1,1,now())
    ON CONFLICT(usuario_id) DO UPDATE SET
      empates=public.domino_estatisticas.empates+1,
      partidas_jogadas=public.domino_estatisticas.partidas_jogadas+1,
      pontuacao=public.domino_estatisticas.pontuacao+1,
      atualizado_em=now();

    UPDATE public.domino_salas
    SET resultado_registrado=true, resultado_tipo='empate',
        vencedor_id=NULL, status='finalizada', atualizado_em=now()
    WHERE id=p_sala_id;
  ELSE
    RAISE EXCEPTION 'Resultado v2 inválido' USING ERRCODE='22023';
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION private.domino_v2_registrar_resultado(uuid,text,uuid)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.domino_v2_passar(
  p_sala_id uuid,
  p_motivo text DEFAULT 'sem_peca'
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
  v_proximo uuid;
  v_passadas integer;
  v_passe_em timestamptz := clock_timestamp();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória' USING ERRCODE='42501';
  END IF;
  -- A client-supplied timeout is not authoritative. Server-side clock
  -- enforcement will be designed separately before enabling p_motivo='tempo'.
  IF p_motivo IS DISTINCT FROM 'sem_peca' THEN
    RAISE EXCEPTION 'Passe por tempo indisponível na versão segura'
      USING ERRCODE='22023';
  END IF;

  SELECT * INTO v_sala FROM public.domino_salas
  WHERE id=p_sala_id FOR UPDATE;
  IF NOT FOUND OR v_sala.status <> 'jogando' OR v_sala.resultado_registrado
     OR v_sala.vez_usuario_id IS DISTINCT FROM v_uid
     OR v_sala.mesa_ponta_esquerda IS NULL
     OR v_sala.mesa_ponta_direita IS NULL
     OR COALESCE(jsonb_array_length(v_sala.historico_jogadas),0)=0
  THEN
    RAISE EXCEPTION 'Partida não permite passar a vez' USING ERRCODE='42501';
  END IF;

  SELECT * INTO v_partida FROM private.domino_v2_partidas
  WHERE sala_id=p_sala_id;
  IF NOT FOUND OR v_uid NOT IN (v_partida.jogador_1_id,v_partida.jogador_2_id)
     OR v_partida.jogador_1_id IS DISTINCT FROM v_sala.jogador_1_id
     OR v_partida.jogador_2_id IS DISTINCT FROM v_sala.jogador_2_id
  THEN
    RAISE EXCEPTION 'Distribuição de peças inválida' USING ERRCODE='42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM private.domino_v2_maos
    WHERE sala_id=p_sala_id AND jogador_id=v_uid
  ) THEN
    RAISE EXCEPTION 'Mão vazia deve ser encerrada como vitória'
      USING ERRCODE='42501';
  END IF;
  IF EXISTS (
    SELECT 1 FROM private.domino_v2_maos m
    WHERE m.sala_id=p_sala_id AND m.jogador_id=v_uid
      AND (
        split_part(m.pedra,'-',1)::integer
          IN (v_sala.mesa_ponta_esquerda,v_sala.mesa_ponta_direita)
        OR split_part(m.pedra,'-',2)::integer
          IN (v_sala.mesa_ponta_esquerda,v_sala.mesa_ponta_direita)
      )
  ) THEN
    RAISE EXCEPTION 'Existe uma peça jogável na sua mão'
      USING ERRCODE='42501';
  END IF;

  v_proximo := CASE WHEN v_uid=v_sala.jogador_1_id
    THEN v_sala.jogador_2_id ELSE v_sala.jogador_1_id END;
  v_passadas := coalesce(v_sala.passadas_count,0)+1;
  IF v_passadas > 2 THEN
    RAISE EXCEPTION 'Contagem de passes inválida' USING ERRCODE='42501';
  END IF;

  UPDATE public.domino_salas
  SET vez_usuario_id=CASE WHEN v_passadas=2 THEN NULL ELSE v_proximo END,
      passadas_count=v_passadas,
      ultimo_passe_usuario_id=v_uid,
      ultimo_passe_em=v_passe_em,
      ultimo_passe_motivo=p_motivo,
      atualizado_em=v_passe_em
  WHERE id=p_sala_id;

  IF v_passadas=2 THEN
    PERFORM private.domino_v2_registrar_resultado(p_sala_id,'empate',NULL);
  END IF;
  RETURN jsonb_build_object(
    'proxima_vez_usuario_id',CASE WHEN v_passadas=2 THEN NULL ELSE v_proximo END,
    'nova_contagem_passadas',v_passadas,
    'jogo_trancado',v_passadas=2,
    'passe_em',v_passe_em
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.domino_v2_passar(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.domino_v2_passar(uuid,text) TO authenticated;

-- The legacy AFTER UPDATE trigger must not award statistics for v2 rooms.
-- V2 result recording happens in the validated RPC transaction instead.
CREATE OR REPLACE FUNCTION public.registrar_empate_domino_ao_trancar()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM private.domino_v2_partidas WHERE sala_id=NEW.id
  ) THEN
    RETURN NEW;
  END IF;
  IF NEW.passadas_count >= 2
     AND coalesce(OLD.passadas_count,0) < 2
     AND NOT NEW.resultado_registrado THEN
    PERFORM public.finalizar_partida_domino(NEW.id,'empate');
  END IF;
  RETURN NEW;
END;
$function$;

-- Reject use of legacy RPCs on v2 rooms. Existing legacy rooms still use them.
DO $migration$
DECLARE
  v_def text;
  v_anchor text;
  v_protection text;
BEGIN
  v_def := pg_get_functiondef('public.passar_vez_domino(uuid,text)'::regprocedure);
  v_anchor := '  if not found then raise exception ' || chr(39) || 'Sala não encontrada' || chr(39) || '; end if;';
  IF (length(v_def)-length(replace(v_def,v_anchor,'')))/length(v_anchor) <> 1 THEN
    RAISE EXCEPTION 'Unexpected legacy pass function; aborting v2 migration';
  END IF;
  v_protection := E'\n' ||
    '  if exists (select 1 from private.domino_v2_partidas where sala_id=p_sala_id) then' || E'\n' ||
    '    raise exception ' || chr(39) || 'Use o passe seguro do dominó v2' || chr(39) || ' using errcode=' || chr(39) || '42501' || chr(39) || ';' || E'\n' ||
    '  end if;';
  EXECUTE replace(v_def,v_anchor,v_anchor||v_protection);

  v_def := pg_get_functiondef('public.finalizar_partida_domino(uuid,text)'::regprocedure);
  v_anchor := '  if v_sala.resultado_registrado then return false; end if;';
  IF (length(v_def)-length(replace(v_def,v_anchor,'')))/length(v_anchor) <> 1 THEN
    RAISE EXCEPTION 'Unexpected legacy finalizer; aborting v2 migration';
  END IF;
  v_protection := E'\n' ||
    '  if exists (select 1 from private.domino_v2_partidas where sala_id=p_sala_id) then' || E'\n' ||
    '    raise exception ' || chr(39) || 'Resultados v2 são controlados pelo servidor' || chr(39) || ' using errcode=' || chr(39) || '42501' || chr(39) || ';' || E'\n' ||
    '  end if;';
  EXECUTE replace(v_def,v_anchor,v_anchor||v_protection);
END
$migration$;

-- Automatically conclude a v2 match when the mover empties their actual hand.
DO $migration$
DECLARE
  v_def text;
  v_anchor text := '  -- The caller cannot self-report victory.';
  v_insert text := $body$
  IF v_restantes = 0 THEN
    PERFORM private.domino_v2_registrar_resultado(p_sala_id,'vitoria',v_uid);
  END IF;

$body$;
BEGIN
  v_def := pg_get_functiondef('public.domino_v2_jogar(uuid,text,text)'::regprocedure);
  IF (length(v_def)-length(replace(v_def,v_anchor,'')))/length(v_anchor) <> 1 THEN
    RAISE EXCEPTION 'Unexpected v2 move RPC; aborting finalization patch';
  END IF;
  EXECUTE replace(v_def,v_anchor,v_insert||v_anchor);
END
$migration$;
