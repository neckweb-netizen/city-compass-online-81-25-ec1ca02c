-- Adicionar política para permitir que usuários excluam suas próprias avaliações
CREATE POLICY "Usuários podem excluir suas próprias avaliações" 
ON public.avaliacoes 
FOR DELETE 
USING (usuario_id = auth.uid());