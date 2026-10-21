-- Fidelidade: validade fixa por cartão, renovação segura e atendimento contínuo.

ALTER TABLE public.loyalty_cards
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

UPDATE public.loyalty_cards AS card
SET expires_at = card.created_at + make_interval(days => program.validade_dias)
FROM public.loyalty_programs AS program
WHERE program.id = card.program_id
  AND program.validade_dias IS NOT NULL
  AND card.expires_at IS NULL;

CREATE INDEX IF NOT EXISTS loyalty_cards_expiration_idx
ON public.loyalty_cards (expires_at)
WHERE expires_at IS NOT NULL;

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
  NEW.expires_at := CASE
    WHEN v_program.validade_dias IS NULL THEN NULL
    ELSE now() + make_interval(days => v_program.validade_dias)
  END;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.loyalty_prevent_expired_card_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.expires_at IS NOT NULL
    AND OLD.expires_at <= now()
    AND NEW.expires_at IS NOT DISTINCT FROM OLD.expires_at THEN
    RAISE EXCEPTION 'Este cartão fidelidade está vencido';
  END IF;

  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.loyalty_owner_cards_v2(uuid);

CREATE FUNCTION public.loyalty_owner_cards_v2(p_program_id uuid)
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
  adesao_em timestamptz,
  expires_at timestamptz
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
    lc.saldo, lc.total_carimbos, lc.total_resgates, lc.ultimo_movimento, lc.created_at, lc.expires_at
  FROM public.loyalty_cards lc
  LEFT JOIN public.usuarios u ON u.id = lc.usuario_id
  WHERE lc.program_id = p_program_id
  ORDER BY lc.ultimo_movimento DESC NULLS LAST, lc.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.loyalty_renew_card_v3(p_card_identifier text)
RETURNS TABLE (
  card_id uuid,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_card public.loyalty_cards%ROWTYPE;
  v_program public.loyalty_programs%ROWTYPE;
  v_empresa public.empresas%ROWTYPE;
  v_identifier text;
  v_new_expiration timestamptz;
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
    AND e.usuario_id = auth.uid()
  FOR UPDATE OF lc;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cartão não encontrado ou sem permissão';
  END IF;

  SELECT * INTO v_program
  FROM public.loyalty_programs
  WHERE id = v_card.program_id AND ativo;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ative o programa antes de renovar cartões';
  END IF;

  IF v_program.validade_dias IS NULL THEN
    RAISE EXCEPTION 'Este programa não possui prazo de validade';
  END IF;

  IF v_card.expires_at IS NULL OR v_card.expires_at > now() THEN
    RAISE EXCEPTION 'Este cartão ainda está válido';
  END IF;

  v_new_expiration := now() + make_interval(days => v_program.validade_dias);

  UPDATE public.loyalty_cards
  SET expires_at = v_new_expiration,
      ultimo_movimento = now()
  WHERE id = v_card.id;

  SELECT * INTO v_empresa
  FROM public.empresas
  WHERE id = v_program.empresa_id;

  IF v_card.usuario_id <> auth.uid() THEN
    INSERT INTO public.notifications
      (user_id, title, message, category, priority, action_url, action_label, metadata)
    VALUES (
      v_card.usuario_id,
      'Seu cartão fidelidade foi renovado!',
      v_empresa.nome || ' renovou seu cartão até ' || to_char(v_new_expiration AT TIME ZONE 'America/Bahia', 'DD/MM/YYYY') || '.',
      'account', 'normal', '/fidelidade', 'Ver cartão',
      jsonb_build_object('empresa_id', v_empresa.id, 'card_id', v_card.id, 'tipo', 'renovacao')
    );
  END IF;

  RETURN QUERY SELECT v_card.id, v_new_expiration;
END;
$$;

REVOKE ALL ON FUNCTION public.loyalty_prepare_card() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.loyalty_prevent_expired_card_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.loyalty_owner_cards_v2(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.loyalty_renew_card_v3(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.loyalty_owner_cards_v2(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.loyalty_renew_card_v3(text) TO authenticated;
