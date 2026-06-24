-- Correção de Security Path para todas as funções SECURITY DEFINER
-- Corrigindo as 6 funções que não têm SET search_path explícito

-- 1. Corrigir user_has_permission (primeira versão)
CREATE OR REPLACE FUNCTION public.user_has_permission(target_user_id uuid DEFAULT NULL, target_cidade_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_type tipo_conta;
    current_user_cidade UUID;
BEGIN
    SELECT tipo_conta, cidade_id INTO current_user_type, current_user_cidade
    FROM public.usuarios WHERE id = auth.uid();
    
    -- Admin geral tem acesso a tudo
    IF current_user_type = 'admin_geral' THEN
        RETURN true;
    END IF;
    
    -- Admin cidade só acessa sua cidade
    IF current_user_type = 'admin_cidade' THEN
        RETURN target_cidade_id = current_user_cidade OR target_cidade_id IS NULL;
    END IF;
    
    -- Usuário comum e empresa só acessam próprios dados
    RETURN target_user_id = auth.uid() OR target_user_id IS NULL;
END;
$$;

-- 2. Corrigir atualizar_estatisticas_empresa (primeira versão)
CREATE OR REPLACE FUNCTION public.atualizar_estatisticas_empresa(empresa_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.estatisticas (empresa_id, total_avaliacoes, media_avaliacoes)
    VALUES (
        empresa_id_param,
        (SELECT COUNT(*) FROM public.avaliacoes WHERE empresa_id = empresa_id_param),
        (SELECT COALESCE(AVG(nota), 0) FROM public.avaliacoes WHERE empresa_id = empresa_id_param)
    )
    ON CONFLICT (empresa_id) DO UPDATE SET
        total_avaliacoes = EXCLUDED.total_avaliacoes,
        media_avaliacoes = EXCLUDED.media_avaliacoes,
        atualizado_em = now();
END;
$$;

-- 3. Corrigir empresa_esta_favoritada
CREATE OR REPLACE FUNCTION public.empresa_esta_favoritada(empresa_id_param uuid, usuario_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.favoritos 
    WHERE empresa_id = empresa_id_param 
    AND usuario_id = usuario_id_param
  );
$$;

-- 4. Corrigir buscar_empresas_destaque (versão sem search_path)
CREATE OR REPLACE FUNCTION public.buscar_empresas_destaque(
  cidade_id_param UUID DEFAULT NULL,
  limite INTEGER DEFAULT 6
)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  categoria_nome TEXT,
  endereco TEXT,
  imagem_capa_url TEXT,
  verificado BOOLEAN,
  media_avaliacoes NUMERIC,
  total_avaliacoes INTEGER,
  prioridade_destaque INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.nome,
    c.nome as categoria_nome,
    e.endereco,
    e.imagem_capa_url,
    e.verificado,
    COALESCE(est.media_avaliacoes, 0) as media_avaliacoes,
    COALESCE(est.total_avaliacoes, 0) as total_avaliacoes,
    CASE 
      WHEN e.destaque = true THEN 1
      ELSE 0
    END as prioridade_destaque
  FROM empresas e
  LEFT JOIN categorias c ON e.categoria_id = c.id
  LEFT JOIN estatisticas est ON e.id = est.empresa_id
  WHERE 
    e.ativo = true
    AND (cidade_id_param IS NULL OR e.cidade_id = cidade_id_param)
    AND e.destaque = true
  ORDER BY 
    e.destaque DESC,
    COALESCE(est.media_avaliacoes, 0) DESC,
    e.criado_em DESC
  LIMIT limite;
END;
$$;

-- 5. Corrigir cleanup_rate_limits
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete records older than 1 hour
    DELETE FROM public.rate_limits 
    WHERE window_start < now() - interval '1 hour';
END;
$$;

-- 6. Corrigir cleanup_expired_sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Mark expired sessions as inactive
    UPDATE public.user_sessions 
    SET is_active = false 
    WHERE expires_at < now() AND is_active = true;
    
    -- Delete very old inactive sessions (older than 30 days)
    DELETE FROM public.user_sessions 
    WHERE is_active = false 
    AND created_at < now() - interval '30 days';
END;
$$;