-- Passo 3: Corrigir problemas restantes de segurança

-- 3.1 Adicionar políticas RLS para tabela rate_limits
-- Esta tabela é usada para controle de rate limiting e deve ser acessível apenas pelo sistema

-- Política para permitir inserção pelo sistema (edge functions)
CREATE POLICY "Sistema pode inserir rate limits" ON public.rate_limits
FOR INSERT
TO service_role
WITH CHECK (true);

-- Política para permitir atualização pelo sistema
CREATE POLICY "Sistema pode atualizar rate limits" ON public.rate_limits  
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Política para permitir leitura pelo sistema
CREATE POLICY "Sistema pode ler rate limits" ON public.rate_limits
FOR SELECT  
TO service_role
USING (true);

-- Política para permitir exclusão pelo sistema (limpeza)
CREATE POLICY "Sistema pode excluir rate limits expirados" ON public.rate_limits
FOR DELETE
TO service_role  
USING (true);

-- 3.2 Adicionar políticas para usuários autenticados se necessário
-- Admins podem visualizar rate limits para monitoramento
CREATE POLICY "Admins podem visualizar rate limits" ON public.rate_limits
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = auth.uid() 
        AND tipo_conta IN ('admin_geral', 'admin_cidade')
    )
);