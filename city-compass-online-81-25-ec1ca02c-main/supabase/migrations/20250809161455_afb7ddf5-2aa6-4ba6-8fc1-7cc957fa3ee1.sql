-- Adicionar política para permitir que administradores excluam avaliações
CREATE POLICY "Admins podem excluir avaliações" 
ON public.avaliacoes 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 
        FROM public.usuarios 
        WHERE usuarios.id = auth.uid() 
        AND usuarios.tipo_conta IN ('admin_geral', 'admin_cidade')
    )
);