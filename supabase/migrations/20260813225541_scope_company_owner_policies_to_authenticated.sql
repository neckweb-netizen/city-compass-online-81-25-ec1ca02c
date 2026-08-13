-- Políticas que consultam vínculos de proprietários só devem ser avaliadas para
-- usuários autenticados. Visitantes continuam vendo apenas empresas ativas e
-- aprovadas pela política pública de leitura.
ALTER POLICY "Usuários podem ver suas próprias empresas"
ON public.empresas
TO authenticated;

ALTER POLICY "Usuários podem atualizar suas próprias empresas"
ON public.empresas
TO authenticated;
