CREATE INDEX IF NOT EXISTS loyalty_transactions_operator_idx
ON public.loyalty_transactions (operador_usuario_id)
WHERE operador_usuario_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS loyalty_transactions_reward_idx
ON public.loyalty_transactions (reward_id)
WHERE reward_id IS NOT NULL;

REVOKE SELECT ON public.loyalty_cards FROM anon;
REVOKE SELECT ON public.loyalty_transactions FROM anon;
REVOKE EXECUTE ON FUNCTION public.loyalty_apply_transaction(uuid, text, integer, text, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.loyalty_owner_cards(uuid) FROM authenticated;

DROP POLICY IF EXISTS "Programas ativos sao publicos" ON public.loyalty_programs;
DROP POLICY IF EXISTS "Empresa gerencia programa proprio" ON public.loyalty_programs;

CREATE POLICY "Programas ativos sao publicos"
ON public.loyalty_programs FOR SELECT
USING (
  ativo OR EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE e.id = loyalty_programs.empresa_id AND e.usuario_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Empresa cria programa proprio"
ON public.loyalty_programs FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.empresas e
  WHERE e.id = loyalty_programs.empresa_id AND e.usuario_id = (SELECT auth.uid())
));

CREATE POLICY "Empresa atualiza programa proprio"
ON public.loyalty_programs FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.empresas e
  WHERE e.id = loyalty_programs.empresa_id AND e.usuario_id = (SELECT auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.empresas e
  WHERE e.id = loyalty_programs.empresa_id AND e.usuario_id = (SELECT auth.uid())
));

CREATE POLICY "Empresa exclui programa proprio"
ON public.loyalty_programs FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.empresas e
  WHERE e.id = loyalty_programs.empresa_id AND e.usuario_id = (SELECT auth.uid())
));

DROP POLICY IF EXISTS "Cliente ou empresa consulta cartao" ON public.loyalty_cards;
DROP POLICY IF EXISTS "Cliente adere a programa ativo" ON public.loyalty_cards;

CREATE POLICY "Cliente ou empresa consulta cartao"
ON public.loyalty_cards FOR SELECT TO authenticated
USING (
  usuario_id = (SELECT auth.uid()) OR EXISTS (
    SELECT 1
    FROM public.loyalty_programs lp
    JOIN public.empresas e ON e.id = lp.empresa_id
    WHERE lp.id = loyalty_cards.program_id AND e.usuario_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Cliente adere a programa ativo"
ON public.loyalty_cards FOR INSERT TO authenticated
WITH CHECK (
  usuario_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.loyalty_programs lp
    WHERE lp.id = loyalty_cards.program_id AND lp.ativo
  )
);

DROP POLICY IF EXISTS "Cliente ou empresa consulta movimentos" ON public.loyalty_transactions;

CREATE POLICY "Cliente ou empresa consulta movimentos"
ON public.loyalty_transactions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.loyalty_cards lc
    WHERE lc.id = loyalty_transactions.card_id AND lc.usuario_id = (SELECT auth.uid())
  ) OR EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE e.id = loyalty_transactions.empresa_id AND e.usuario_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Premios de programas ativos sao publicos" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Empresa gerencia premios proprios" ON public.loyalty_rewards;

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

CREATE POLICY "Empresa cria premios proprios"
ON public.loyalty_rewards FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1
  FROM public.loyalty_programs lp
  JOIN public.empresas e ON e.id = lp.empresa_id
  WHERE lp.id = loyalty_rewards.program_id AND e.usuario_id = (SELECT auth.uid())
));

CREATE POLICY "Empresa atualiza premios proprios"
ON public.loyalty_rewards FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1
  FROM public.loyalty_programs lp
  JOIN public.empresas e ON e.id = lp.empresa_id
  WHERE lp.id = loyalty_rewards.program_id AND e.usuario_id = (SELECT auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1
  FROM public.loyalty_programs lp
  JOIN public.empresas e ON e.id = lp.empresa_id
  WHERE lp.id = loyalty_rewards.program_id AND e.usuario_id = (SELECT auth.uid())
));

CREATE POLICY "Empresa exclui premios proprios"
ON public.loyalty_rewards FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1
  FROM public.loyalty_programs lp
  JOIN public.empresas e ON e.id = lp.empresa_id
  WHERE lp.id = loyalty_rewards.program_id AND e.usuario_id = (SELECT auth.uid())
));
