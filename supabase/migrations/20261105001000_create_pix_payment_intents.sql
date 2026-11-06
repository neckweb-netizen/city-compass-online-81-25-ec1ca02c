-- Idempotência durável: impede que repetição de uma intenção de checkout
-- crie pagamentos Pix distintos, mesmo entre instâncias Edge.
CREATE TABLE IF NOT EXISTS public.pix_payment_intents (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plano_id uuid NOT NULL REFERENCES public.planos(id),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'creating' CHECK (status IN ('creating','created','failed')),
  provider_payment_id text UNIQUE,
  provider_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pix_payment_intents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pix_payment_intents FROM PUBLIC, anon, authenticated;
-- Somente service_role (Edge Function) acessa e altera intenções;
-- o navegador nunca consulta nem altera o status diretamente.
GRANT SELECT, INSERT, UPDATE ON public.pix_payment_intents TO service_role;
CREATE INDEX IF NOT EXISTS pix_payment_intents_user_created_idx
  ON public.pix_payment_intents(user_id, created_at DESC);
