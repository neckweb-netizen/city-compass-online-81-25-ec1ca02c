-- Criar políticas RLS para tabelas que precisam
-- Política para tabla empresas - usuários podem ver suas próprias empresas
CREATE POLICY "Usuários podem ver suas próprias empresas" 
ON public.empresas 
FOR SELECT 
USING (
  auth.uid() = usuario_id 
  OR auth.uid() IN (
    SELECT usuario_id 
    FROM public.usuario_empresa_admin 
    WHERE empresa_id = empresas.id AND ativo = true
  )
);

-- Política para inserção de empresas
CREATE POLICY "Usuários podem criar empresas" 
ON public.empresas 
FOR INSERT 
WITH CHECK (auth.uid() = usuario_id);

-- Política para atualização de empresas  
CREATE POLICY "Usuários podem atualizar suas próprias empresas" 
ON public.empresas 
FOR UPDATE 
USING (
  auth.uid() = usuario_id 
  OR auth.uid() IN (
    SELECT usuario_id 
    FROM public.usuario_empresa_admin 
    WHERE empresa_id = empresas.id AND ativo = true
  )
);

-- Política básica para avisos_sistema - todos podem ver avisos ativos
CREATE POLICY "Todos podem ver avisos ativos" 
ON public.avisos_sistema 
FOR SELECT 
USING (ativo = true);

-- Política para estatisticas - todos podem ver
CREATE POLICY "Todos podem ver estatísticas" 
ON public.estatisticas 
FOR SELECT 
USING (true);

-- Política para avaliacoes - todos podem ver  
CREATE POLICY "Todos podem ver avaliações" 
ON public.avaliacoes 
FOR SELECT 
USING (true);

-- Política para cupons - todos podem ver cupons ativos
CREATE POLICY "Todos podem ver cupons ativos" 
ON public.cupons 
FOR SELECT 
USING (ativo = true AND data_fim >= now());

-- Política para usuario_empresa_admin - usuários podem ver suas atribuições
CREATE POLICY "Usuários podem ver suas atribuições de admin" 
ON public.usuario_empresa_admin 
FOR SELECT 
USING (auth.uid() = usuario_id);