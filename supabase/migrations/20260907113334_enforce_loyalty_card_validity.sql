CREATE OR REPLACE FUNCTION public.loyalty_prevent_expired_card_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_validade_dias integer;
BEGIN
  SELECT validade_dias INTO v_validade_dias
  FROM public.loyalty_programs
  WHERE id = OLD.program_id;

  IF v_validade_dias IS NOT NULL
    AND OLD.created_at + make_interval(days => v_validade_dias) < now() THEN
    RAISE EXCEPTION 'Este cartão fidelidade está vencido';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER loyalty_prevent_expired_card_update_trigger
BEFORE UPDATE ON public.loyalty_cards
FOR EACH ROW EXECUTE FUNCTION public.loyalty_prevent_expired_card_update();

REVOKE ALL ON FUNCTION public.loyalty_prevent_expired_card_update() FROM PUBLIC, anon, authenticated;
