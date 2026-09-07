-- Premios multiplos e identificacao curta para atendimento por celular/leitor fisico.
ALTER TABLE public.loyalty_cards ADD COLUMN display_code text;

UPDATE public.loyalty_cards
SET display_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE display_code IS NULL;

ALTER TABLE public.loyalty_cards
  ALTER COLUMN display_code SET DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  ALTER COLUMN display_code SET NOT NULL,
  ADD CONSTRAINT loyalty_cards_display_code_format CHECK (display_code ~ '^[A-Z0-9]{8}$'),
  ADD CONSTRAINT loyalty_cards_display_code_key UNIQUE (display_code);

CREATE TABLE public.loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,
  nome text NOT NULL CHECK (char_length(nome) BETWEEN 2 AND 160),
  descricao text CHECK (descricao IS NULL OR char_length(descricao) <= 240),
  carimbos_necessarios smallint NOT NULL CHECK (carimbos_necessarios BETWEEN 2 AND 30),
  ativo boolean NOT NULL DEFAULT true,
  ordem smallint NOT NULL DEFAULT 0 CHECK (ordem BETWEEN 0 AND 50),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, carimbos_necessarios, nome)
);

CREATE INDEX loyalty_rewards_program_idx
ON public.loyalty_rewards (program_id, ativo, carimbos_necessarios, ordem);

INSERT INTO public.loyalty_rewards (program_id, nome, carimbos_necessarios, ordem)
SELECT id, recompensa_descricao, carimbos_necessarios, 0
FROM public.loyalty_programs;

ALTER TABLE public.loyalty_transactions
  ADD COLUMN reward_id uuid REFERENCES public.loyalty_rewards(id) ON DELETE SET NULL,
  ADD COLUMN reward_nome text;

ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Premios de programas ativos sao publicos"
ON public.loyalty_rewards FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.loyalty_programs lp
    WHERE lp.id = loyalty_rewards.program_id
      AND (
        lp.ativo OR EXISTS (
          SELECT 1 FROM public.empresas e
          WHERE e.id = lp.empresa_id AND e.usuario_id = (SELECT auth.uid())
        )
      )
  )
);

CREATE POLICY "Empresa gerencia premios proprios"
ON public.loyalty_rewards FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.loyalty_programs lp
    JOIN public.empresas e ON e.id = lp.empresa_id
    WHERE lp.id = loyalty_rewards.program_id AND e.usuario_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.loyalty_programs lp
    JOIN public.empresas e ON e.id = lp.empresa_id
    WHERE lp.id = loyalty_rewards.program_id AND e.usuario_id = (SELECT auth.uid())
  )
);

GRANT SELECT ON public.loyalty_rewards TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.loyalty_rewards TO authenticated;

CREATE TRIGGER loyalty_rewards_touch_updated_at
BEFORE UPDATE ON public.loyalty_rewards
FOR EACH ROW EXECUTE FUNCTION public.loyalty_touch_updated_at();

CREATE OR REPLACE FUNCTION public.loyalty_replace_rewards(p_program_id uuid, p_rewards jsonb)
RETURNS SETOF public.loyalty_rewards
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.loyalty_programs lp
    JOIN public.empresas e ON e.id = lp.empresa_id
    WHERE lp.id = p_program_id AND e.usuario_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Sem permissão para alterar estes prêmios';
  END IF;

  IF jsonb_typeof(p_rewards) <> 'array'
    OR jsonb_array_length(p_rewards) < 1
    OR jsonb_array_length(p_rewards) > 10 THEN
    RAISE EXCEPTION 'Cadastre entre 1 e 10 prêmios';
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_rewards) item
    WHERE char_length(trim(item->>'nome')) NOT BETWEEN 2 AND 160
      OR coalesce((item->>'carimbos_necessarios')::integer, 0) NOT BETWEEN 2 AND 30
  ) THEN
    RAISE EXCEPTION 'Revise o nome e a quantidade de carimbos dos prêmios';
  END IF;

  DELETE FROM public.loyalty_rewards WHERE program_id = p_program_id;

  RETURN QUERY
  INSERT INTO public.loyalty_rewards (program_id, nome, descricao, carimbos_necessarios, ativo, ordem)
  SELECT
    p_program_id,
    trim(item->>'nome'),
    nullif(trim(item->>'descricao'), ''),
    (item->>'carimbos_necessarios')::smallint,
    coalesce((item->>'ativo')::boolean, true),
    (ordinality - 1)::smallint
  FROM jsonb_array_elements(p_rewards) WITH ORDINALITY AS values_with_order(item, ordinality)
  ORDER BY ordinality
  RETURNING *;
END;
$$;

CREATE OR REPLACE FUNCTION public.loyalty_owner_cards_v2(p_program_id uuid)
RETURNS TABLE (
  card_id uuid,
  public_token uuid,
  display_code text,
  cliente_nome text,
  cliente_email text,
  saldo integer,
  total_carimbos integer,
  total_resgates integer,
  ultimo_movimento timestamptz,
  adesao_em timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.loyalty_programs lp
    JOIN public.empresas e ON e.id = lp.empresa_id
    WHERE lp.id = p_program_id AND e.usuario_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Sem permissão para consultar estes cartões';
  END IF;

  RETURN QUERY
  SELECT lc.id, lc.public_token, lc.display_code, coalesce(u.nome, 'Cliente'), coalesce(u.email, ''),
    lc.saldo, lc.total_carimbos, lc.total_resgates, lc.ultimo_movimento, lc.created_at
  FROM public.loyalty_cards lc
  LEFT JOIN public.usuarios u ON u.id = lc.usuario_id
  WHERE lc.program_id = p_program_id
  ORDER BY lc.ultimo_movimento DESC NULLS LAST, lc.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.loyalty_apply_transaction_v2(
  p_card_identifier text,
  p_tipo text,
  p_quantidade integer DEFAULT 1,
  p_reward_id uuid DEFAULT NULL,
  p_observacao text DEFAULT NULL,
  p_request_id uuid DEFAULT gen_random_uuid()
)
RETURNS TABLE (
  card_id uuid,
  saldo integer,
  total_carimbos integer,
  total_resgates integer,
  reward_nome text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.loyalty_replace_rewards(uuid, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.loyalty_owner_cards_v2(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.loyalty_apply_transaction_v2(text, text, integer, uuid, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.loyalty_replace_rewards(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.loyalty_owner_cards_v2(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.loyalty_apply_transaction_v2(text, text, integer, uuid, text, uuid) TO authenticated;
