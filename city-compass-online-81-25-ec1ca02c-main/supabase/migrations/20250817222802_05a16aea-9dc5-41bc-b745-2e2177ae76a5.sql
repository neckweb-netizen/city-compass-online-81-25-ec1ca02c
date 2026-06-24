-- Criar apenas as políticas que não existem ainda

-- Política para empresas - usuários podem ver suas próprias empresas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'empresas' 
        AND policyname = 'Usuários podem ver suas próprias empresas'
    ) THEN
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
    END IF;
END $$;

-- Política para inserção de empresas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'empresas' 
        AND policyname = 'Usuários podem criar empresas'
    ) THEN
        CREATE POLICY "Usuários podem criar empresas" 
        ON public.empresas 
        FOR INSERT 
        WITH CHECK (auth.uid() = usuario_id);
    END IF;
END $$;

-- Política para atualização de empresas  
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'empresas' 
        AND policyname = 'Usuários podem atualizar suas próprias empresas'
    ) THEN
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
    END IF;
END $$;