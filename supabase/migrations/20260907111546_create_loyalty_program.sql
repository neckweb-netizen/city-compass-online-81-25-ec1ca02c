-- Cartao fidelidade por empresa, com operacoes atomicas e trilha de auditoria.
CREATE TABLE public.loyalty_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL UNIQUE REFERENCES public.empresas(id) ON DELETE CASCADE,
  ativo boolean NOT NULL DEFAULT false,
  nome text NOT NULL DEFAULT 'Cartão Fidelidade' CHECK (char_length(nome) BETWEEN 3 AND 80),
  descricao text CHECK (descricao IS NULL OR char_length(descricao) <= 240),
  recompensa_descricao text NOT NULL DEFAULT 'Um benefício especial' CHECK (char_length(recompensa_descricao) BETWEEN 3 AND 160),
  carimbos_necessarios smallint NOT NULL DEFAULT 10 CHECK (carimbos_necessarios BETWEEN 2 AND 30),
  rotulo_carimbo text NOT NULL DEFAULT 'visita' CHECK (char_length(rotulo_carimbo) BETWEEN 2 AND 30),
  cor_principal text NOT NULL DEFAULT '#7c3aed' CHECK (cor_principal ~ '^#[0-9A-Fa-f]{6}$'),
  termos text CHECK (termos IS NULL OR char_length(termos) <= 1000),
  validade_dias smallint CHECK (validade_dias IS NULL OR validade_dias BETWEEN 30 AND 730),
  bonus_boas_vindas smallint NOT NULL DEFAULT 0 CHECK (bonus_boas_vindas BETWEEN 0 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT loyalty_bonus_below_reward CHECK (bonus_boas_vindas < carimbos_necessarios)
);

CREATE TABLE public.loyalty_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  public_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  saldo integer NOT NULL DEFAULT 0 CHECK (saldo >= 0),
  total_carimbos integer NOT NULL DEFAULT 0 CHECK (total_carimbos >= 0),
  total_resgates integer NOT NULL DEFAULT 0 CHECK (total_resgates >= 0),
  ultimo_movimento timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, usuario_id)
);

CREATE TABLE public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  operador_usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('bonus', 'credito', 'resgate', 'ajuste')),
  quantidade integer NOT NULL CHECK (quantidade <> 0),
  observacao text CHECK (observacao IS NULL OR char_length(observacao) <= 240),
  saldo_apos integer NOT NULL CHECK (saldo_apos >= 0),
  idempotency_key uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX loyalty_programs_active_idx ON public.loyalty_programs (empresa_id) WHERE ativo;
CREATE INDEX loyalty_cards_user_idx ON public.loyalty_cards (usuario_id, created_at DESC);
CREATE INDEX loyalty_cards_program_idx ON public.loyalty_cards (program_id, ultimo_movimento DESC);
CREATE INDEX loyalty_transactions_card_idx ON public.loyalty_transactions (card_id, created_at DESC);
CREATE INDEX loyalty_transactions_company_idx ON public.loyalty_transactions (empresa_id, created_at DESC);

ALTER TABLE public.loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Programas ativos sao publicos"
ON public.loyalty_programs FOR SELECT
USING (
  ativo OR EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE e.id = loyalty_programs.empresa_id AND e.usuario_id = auth.uid()
  )
);

CREATE POLICY "Empresa gerencia programa proprio"
ON public.loyalty_programs FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.empresas e
  WHERE e.id = loyalty_programs.empresa_id AND e.usuario_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.empresas e
  WHERE e.id = loyalty_programs.empresa_id AND e.usuario_id = auth.uid()
));

CREATE POLICY "Cliente ou empresa consulta cartao"
ON public.loyalty_cards FOR SELECT TO authenticated
USING (
  usuario_id = auth.uid() OR EXISTS (
    SELECT 1
    FROM public.loyalty_programs lp
    JOIN public.empresas e ON e.id = lp.empresa_id
    WHERE lp.id = loyalty_cards.program_id AND e.usuario_id = auth.uid()
  )
);

CREATE POLICY "Cliente adere a programa ativo"
ON public.loyalty_cards FOR INSERT TO authenticated
WITH CHECK (
  usuario_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.loyalty_programs lp
    WHERE lp.id = loyalty_cards.program_id AND lp.ativo
  )
);

CREATE POLICY "Cliente ou empresa consulta movimentos"
ON public.loyalty_transactions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.loyalty_cards lc
    WHERE lc.id = loyalty_transactions.card_id AND lc.usuario_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE e.id = loyalty_transactions.empresa_id AND e.usuario_id = auth.uid()
  )
);

GRANT SELECT ON public.loyalty_programs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.loyalty_programs TO authenticated;
GRANT SELECT, INSERT ON public.loyalty_cards TO authenticated;
GRANT SELECT ON public.loyalty_transactions TO authenticated;

CREATE OR REPLACE FUNCTION public.loyalty_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER loyalty_programs_touch_updated_at
BEFORE UPDATE ON public.loyalty_programs
FOR EACH ROW EXECUTE FUNCTION public.loyalty_touch_updated_at();

CREATE TRIGGER loyalty_cards_touch_updated_at
BEFORE UPDATE ON public.loyalty_cards
FOR EACH ROW EXECUTE FUNCTION public.loyalty_touch_updated_at();

CREATE OR REPLACE FUNCTION public.loyalty_prepare_card()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_program public.loyalty_programs%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NEW.usuario_id <> auth.uid() THEN
    RAISE EXCEPTION 'Não foi possível validar o titular do cartão';
  END IF;

  SELECT * INTO v_program
  FROM public.loyalty_programs
  WHERE id = NEW.program_id AND ativo;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Este programa de fidelidade não está ativo';
  END IF;

  NEW.saldo := v_program.bonus_boas_vindas;
  NEW.total_carimbos := v_program.bonus_boas_vindas;
  NEW.total_resgates := 0;
  NEW.ultimo_movimento := CASE WHEN v_program.bonus_boas_vindas > 0 THEN now() ELSE NULL END;
  RETURN NEW;
END;
$$;

CREATE TRIGGER loyalty_prepare_card_trigger
BEFORE INSERT ON public.loyalty_cards
FOR EACH ROW EXECUTE FUNCTION public.loyalty_prepare_card();

CREATE OR REPLACE FUNCTION public.loyalty_register_welcome_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_empresa_id uuid;
BEGIN
  IF NEW.saldo > 0 THEN
    SELECT empresa_id INTO v_empresa_id FROM public.loyalty_programs WHERE id = NEW.program_id;
    INSERT INTO public.loyalty_transactions
      (card_id, empresa_id, operador_usuario_id, tipo, quantidade, observacao, saldo_apos)
    VALUES
      (NEW.id, v_empresa_id, NULL, 'bonus', NEW.saldo, 'Bônus de boas-vindas', NEW.saldo);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER loyalty_register_welcome_bonus_trigger
AFTER INSERT ON public.loyalty_cards
FOR EACH ROW EXECUTE FUNCTION public.loyalty_register_welcome_bonus();

CREATE OR REPLACE FUNCTION public.loyalty_apply_transaction(
  p_public_token uuid,
  p_tipo text,
  p_quantidade integer DEFAULT 1,
  p_observacao text DEFAULT NULL,
  p_request_id uuid DEFAULT gen_random_uuid()
)
RETURNS TABLE (
  card_id uuid,
  saldo integer,
  total_carimbos integer,
  total_resgates integer,
  carimbos_necessarios integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_card public.loyalty_cards%ROWTYPE;
  v_program public.loyalty_programs%ROWTYPE;
  v_empresa public.empresas%ROWTYPE;
  v_delta integer;
  v_existing public.loyalty_transactions%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sessão inválida';
  END IF;

  SELECT lc.*
  INTO v_card
  FROM public.loyalty_cards lc
  JOIN public.loyalty_programs lp ON lp.id = lc.program_id
  JOIN public.empresas e ON e.id = lp.empresa_id
  WHERE lc.public_token = p_public_token
    AND lp.ativo
    AND e.usuario_id = auth.uid()
  FOR UPDATE OF lc;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cartão não encontrado ou sem permissão';
  END IF;

  SELECT lp.* INTO v_program
  FROM public.loyalty_programs lp
  WHERE lp.id = v_card.program_id;

  SELECT e.* INTO v_empresa
  FROM public.empresas e
  WHERE e.id = v_program.empresa_id;

  SELECT * INTO v_existing
  FROM public.loyalty_transactions
  WHERE idempotency_key = p_request_id;

  IF FOUND THEN
    RETURN QUERY SELECT v_card.id, v_card.saldo, v_card.total_carimbos,
      v_card.total_resgates, v_program.carimbos_necessarios::integer;
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
    IF v_card.saldo < v_program.carimbos_necessarios THEN
      RAISE EXCEPTION 'O cliente ainda não completou o cartão';
    END IF;
    v_delta := -v_program.carimbos_necessarios;
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
    (card_id, empresa_id, operador_usuario_id, tipo, quantidade, observacao, saldo_apos, idempotency_key)
  VALUES
    (v_card.id, v_empresa.id, auth.uid(), p_tipo, v_delta, nullif(trim(p_observacao), ''), v_card.saldo, p_request_id);

  IF v_card.usuario_id <> auth.uid() THEN
    INSERT INTO public.notifications
      (user_id, title, message, category, priority, action_url, action_label, metadata)
    VALUES (
      v_card.usuario_id,
      CASE WHEN p_tipo = 'credito' THEN 'Você ganhou um novo carimbo!' ELSE 'Recompensa resgatada!' END,
      CASE WHEN p_tipo = 'credito'
        THEN v_empresa.nome || ' adicionou ' || p_quantidade || ' ' || v_program.rotulo_carimbo || '(s) ao seu cartão.'
        ELSE 'Seu benefício em ' || v_empresa.nome || ' foi resgatado com sucesso.' END,
      'account', 'normal', '/fidelidade', 'Ver cartão',
      jsonb_build_object('empresa_id', v_empresa.id, 'card_id', v_card.id, 'tipo', p_tipo)
    );
  END IF;

  RETURN QUERY SELECT v_card.id, v_card.saldo, v_card.total_carimbos,
    v_card.total_resgates, v_program.carimbos_necessarios::integer;
END;
$$;

CREATE OR REPLACE FUNCTION public.loyalty_owner_cards(p_program_id uuid)
RETURNS TABLE (
  card_id uuid,
  public_token uuid,
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
  SELECT lc.id, lc.public_token, coalesce(u.nome, 'Cliente'), coalesce(u.email, ''),
    lc.saldo, lc.total_carimbos, lc.total_resgates, lc.ultimo_movimento, lc.created_at
  FROM public.loyalty_cards lc
  LEFT JOIN public.usuarios u ON u.id = lc.usuario_id
  WHERE lc.program_id = p_program_id
  ORDER BY lc.ultimo_movimento DESC NULLS LAST, lc.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.loyalty_touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.loyalty_prepare_card() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.loyalty_register_welcome_bonus() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.loyalty_apply_transaction(uuid, text, integer, text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.loyalty_owner_cards(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.loyalty_apply_transaction(uuid, text, integer, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.loyalty_owner_cards(uuid) TO authenticated;
