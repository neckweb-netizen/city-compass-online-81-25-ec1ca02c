-- Applied to Supabase production as migration 20261118012608.
-- Authenticated users can still read the entire queue, but can only mutate own row.
DROP POLICY "Jogador gerencia apenas sua entrada na fila" ON public.domino_fila;
CREATE POLICY "Jogador insere apenas sua entrada na fila" ON public.domino_fila FOR INSERT TO authenticated WITH CHECK (usuario_id = (select auth.uid()));
CREATE POLICY "Jogador atualiza apenas sua entrada na fila" ON public.domino_fila FOR UPDATE TO authenticated USING (usuario_id = (select auth.uid())) WITH CHECK (usuario_id = (select auth.uid()));
CREATE POLICY "Jogador exclui apenas sua entrada na fila" ON public.domino_fila FOR DELETE TO authenticated USING (usuario_id = (select auth.uid()));
-- SELECT policy "Jogadores autenticados podem ver a fila" remains unchanged.
