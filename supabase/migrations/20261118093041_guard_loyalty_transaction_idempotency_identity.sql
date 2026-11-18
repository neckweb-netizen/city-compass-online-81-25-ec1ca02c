-- Already applied in Supabase production as migration 20261118093041.
-- Ensure idempotency keys cannot be reused across different cards or operations.
CREATE OR REPLACE FUNCTION public.loyalty_apply_transaction_v2(p_card_identifier text, p_tipo text, p_quantidade integer DEFAULT 1, p_reward_id uuid DEFAULT NULL::uuid, p_observacao text DEFAULT NULL::text, p_request_id uuid DEFAULT gen_random_uuid())
 RETURNS TABLE(card_id uuid, saldo integer, total_carimbos integer, total_resgates integer, reward_nome text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_card public.loyalty_cards%ROWTYPE;
  v_program public.loyalty_programs%ROWTYPE;
  v_empresa public.empresas%ROWTYPE;
  v_reward public.loyalty_rewards%ROWTYPE;
  v_delta integer;
  v_identifier text;
  v_existing public.loyalty_transactions%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sessão inválida';
  END IF;

  v_identifier := upper(trim(regexp_replace(coalesce(p_card_identifier, ''), '^sajtem-loyalty:', '', 'i')));

  SELECT lc.* INTO v_card
  FROM public.loyalty_cards lc
  JOIN public.loyalty_programs lp ON lp.id = lc.program_id
  JOIN public.empresas e ON e.id = lp.empresa_id
  WHERE (upper(lc.public_token::text) = v_identifier OR lc.display_code = v_identifier)
    AND lp.ativo
    AND e.usuario_id = auth.uid()
  FOR UPDATE OF lc;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cartão não encontrado ou sem permissão';
  END IF;

  SELECT lp.* INTO v_program FROM public.loyalty_programs lp WHERE lp.id = v_card.program_id;
  SELECT e.* INTO v_empresa FROM public.empresas e WHERE e.id = v_program.empresa_id;

  SELECT * INTO v_existing
  FROM public.loyalty_transactions
  WHERE idempotency_key = p_request_id;

  IF FOUND THEN
    -- An idempotency key must identify the same card and the same operation.
    -- Reject accidental or malicious reuse of a key across different requests.
    IF v_existing.card_id IS DISTINCT FROM v_card.id
       OR v_existing.tipo IS DISTINCT FROM p_tipo
       OR (p_tipo = 'credito' AND v_existing.quantidade IS DISTINCT FROM p_quantidade)
       OR (p_tipo = 'resgate' AND v_existing.reward_id IS DISTINCT FROM p_reward_id)
    THEN
      RAISE EXCEPTION 'Esta chave de solicitação já foi usada em outra operação'
        USING ERRCODE = '23505';
    END IF;
    RETURN QUERY SELECT v_card.id, v_card.saldo, v_card.total_carimbos,
      v_card.total_resgates, v_existing.reward_nome;
    RETURN;
  END IF;

  IF p_tipo = 'credito' THEN
    IF p_quantidade < 1 OR p_quantidade > 10 THEN
      RAISE EXCEPTION 'Informe de 1 a 10 carimbos';
    END IF;
    v_delta := p_quantidade;
    v_card.saldo := v_card.saldo + v_delta;
    v_card.total_carimbos := v_card.total_carimbos + v_delta;
  ELSIF p_tipo = 'resgate' THEN
    SELECT lr.* INTO v_reward
    FROM public.loyalty_rewards lr
    WHERE lr.id = p_reward_id AND lr.program_id = v_program.id AND lr.ativo;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Prêmio inválido ou indisponível';
    END IF;
    IF v_card.saldo < v_reward.carimbos_necessarios THEN
      RAISE EXCEPTION 'O cliente ainda não possui carimbos suficientes';
    END IF;
    v_delta := -v_reward.carimbos_necessarios;
    v_card.saldo := v_card.saldo + v_delta;
    v_card.total_resgates := v_card.total_resgates + 1;
  ELSE
    RAISE EXCEPTION 'Tipo de movimentação inválido';
  END IF;

  UPDATE public.loyalty_cards
  SET saldo = v_card.saldo,
      total_carimbos = v_card.total_carimbos,
      total_resgates = v_card.total_resgates,
      ultimo_movimento = now()
  WHERE id = v_card.id;

  INSERT INTO public.loyalty_transactions
    (card_id, empresa_id, operador_usuario_id, tipo, quantidade, observacao, saldo_apos,
     idempotency_key, reward_id, reward_nome)
  VALUES
    (v_card.id, v_empresa.id, auth.uid(), p_tipo, v_delta, nullif(trim(p_observacao), ''),
     v_card.saldo, p_request_id, v_reward.id, v_reward.nome);

  IF v_card.usuario_id <> auth.uid() THEN
    INSERT INTO public.notifications
      (user_id, title, message, category, priority, action_url, action_label, metadata)
    VALUES (
      v_card.usuario_id,
      CASE WHEN p_tipo = 'credito' THEN 'Você ganhou um novo carimbo!' ELSE 'Prêmio resgatado!' END,
      CASE WHEN p_tipo = 'credito'
        THEN v_empresa.nome || ' adicionou ' || p_quantidade || ' ' || v_program.rotulo_carimbo || '(s) ao seu cartão.'
        ELSE 'Seu prêmio “' || v_reward.nome || '” em ' || v_empresa.nome || ' foi resgatado com sucesso.' END,
      'account', 'normal', '/fidelidade', 'Ver cartão',
      jsonb_build_object('empresa_id', v_empresa.id, 'card_id', v_card.id, 'tipo', p_tipo, 'reward_id', v_reward.id)
    );
  END IF;

  RETURN QUERY SELECT v_card.id, v_card.saldo, v_card.total_carimbos,
    v_card.total_resgates, v_reward.nome;
END;
$function$

