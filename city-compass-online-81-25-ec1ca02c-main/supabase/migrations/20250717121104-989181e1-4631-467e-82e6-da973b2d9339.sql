
-- Criar função para verificar se o usuário tem permissão adequada
CREATE OR REPLACE FUNCTION public.user_has_permission(target_user_id uuid DEFAULT NULL, target_cidade_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
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

-- Função para atualizar estatísticas das empresas
CREATE OR REPLACE FUNCTION public.atualizar_estatisticas_empresa(empresa_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Trigger para atualizar estatísticas automaticamente
CREATE OR REPLACE FUNCTION public.trigger_atualizar_estatisticas()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM public.atualizar_estatisticas_empresa(COALESCE(NEW.empresa_id, OLD.empresa_id));
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Criar trigger nas avaliações
DROP TRIGGER IF EXISTS trigger_avaliacoes_estatisticas ON public.avaliacoes;
CREATE TRIGGER trigger_avaliacoes_estatisticas
    AFTER INSERT OR UPDATE OR DELETE ON public.avaliacoes
    FOR EACH ROW EXECUTE FUNCTION public.trigger_atualizar_estatisticas();

-- Função para buscar empresas próximas (por localização)
CREATE OR REPLACE FUNCTION public.buscar_empresas_proximas(
    lat double precision,
    lng double precision,
    raio_km double precision DEFAULT 10.0,
    cidade_id_param uuid DEFAULT NULL,
    categoria_id_param uuid DEFAULT NULL,
    limite integer DEFAULT 20
)
RETURNS TABLE(
    id uuid,
    nome text,
    categoria_nome text,
    endereco text,
    telefone text,
    imagem_capa_url text,
    verificado boolean,
    destaque boolean,
    distancia_km double precision,
    media_avaliacoes numeric,
    total_avaliacoes integer
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.nome,
        c.nome as categoria_nome,
        e.endereco,
        e.telefone,
        e.imagem_capa_url,
        e.verificado,
        e.destaque,
        (point(lng, lat) <@> e.localizacao) * 1.609344 as distancia_km,
        COALESCE(est.media_avaliacoes, 0) as media_avaliacoes,
        COALESCE(est.total_avaliacoes, 0) as total_avaliacoes
    FROM public.empresas e
    JOIN public.categorias c ON e.categoria_id = c.id
    LEFT JOIN public.estatisticas est ON e.id = est.empresa_id
    WHERE e.ativo = true
        AND e.localizacao IS NOT NULL
        AND (cidade_id_param IS NULL OR e.cidade_id = cidade_id_param)
        AND (categoria_id_param IS NULL OR e.categoria_id = categoria_id_param)
        AND (point(lng, lat) <@> e.localizacao) * 1.609344 <= raio_km
    ORDER BY 
        e.destaque DESC,
        distancia_km ASC
    LIMIT limite;
END;
$$;

-- Função para buscar empresas em destaque
CREATE OR REPLACE FUNCTION public.buscar_empresas_destaque(
    cidade_id_param uuid,
    limite integer DEFAULT 10
)
RETURNS TABLE(
    id uuid,
    nome text,
    categoria_nome text,
    endereco text,
    imagem_capa_url text,
    verificado boolean,
    media_avaliacoes numeric,
    total_avaliacoes integer,
    prioridade_destaque integer
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.nome,
        cat.nome as categoria_nome,
        e.endereco,
        e.imagem_capa_url,
        e.verificado,
        COALESCE(est.media_avaliacoes, 0) as media_avaliacoes,
        COALESCE(est.total_avaliacoes, 0) as total_avaliacoes,
        COALESCE(p.prioridade_destaque, 0) as prioridade_destaque
    FROM public.empresas e
    JOIN public.categorias cat ON e.categoria_id = cat.id
    LEFT JOIN public.estatisticas est ON e.id = est.empresa_id
    LEFT JOIN public.planos p ON e.plano_atual_id = p.id
    WHERE e.ativo = true
        AND e.destaque = true
        AND e.cidade_id = cidade_id_param
    ORDER BY 
        p.prioridade_destaque DESC,
        est.media_avaliacoes DESC,
        est.total_avaliacoes DESC
    LIMIT limite;
END;
$$;

-- Função para validar cupons
CREATE OR REPLACE FUNCTION public.validar_cupom(
    codigo_param text,
    empresa_id_param uuid
)
RETURNS TABLE(
    valido boolean,
    cupom_id uuid,
    titulo text,
    tipo text,
    valor numeric,
    mensagem text
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    cupom_data RECORD;
BEGIN
    -- Buscar cupom
    SELECT * INTO cupom_data
    FROM public.cupons c
    WHERE c.codigo = codigo_param
        AND c.empresa_id = empresa_id_param
        AND c.ativo = true
        AND c.data_inicio <= now()
        AND c.data_fim >= now();

    -- Se não encontrou o cupom
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            false as valido,
            NULL::UUID as cupom_id,
            NULL::TEXT as titulo,
            NULL::TEXT as tipo,
            NULL::DECIMAL as valor,
            'Cupom não encontrado ou expirado' as mensagem;
        RETURN;
    END IF;

    -- Verificar se ainda tem quantidade disponível
    IF cupom_data.quantidade_total IS NOT NULL 
        AND cupom_data.quantidade_usada >= cupom_data.quantidade_total THEN
        RETURN QUERY SELECT 
            false as valido,
            cupom_data.id as cupom_id,
            cupom_data.titulo,
            cupom_data.tipo::TEXT,
            cupom_data.valor,
            'Cupom esgotado' as mensagem;
        RETURN;
    END IF;

    -- Cupom válido
    RETURN QUERY SELECT 
        true as valido,
        cupom_data.id as cupom_id,
        cupom_data.titulo,
        cupom_data.tipo::TEXT,
        cupom_data.valor,
        'Cupom válido' as mensagem;
END;
$$;

-- Função para usar cupom
CREATE OR REPLACE FUNCTION public.usar_cupom(cupom_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.cupons 
    SET quantidade_usada = quantidade_usada + 1
    WHERE id = cupom_id_param
        AND ativo = true
        AND data_fim >= now()
        AND (quantidade_total IS NULL OR quantidade_usada < quantidade_total);

    RETURN FOUND;
END;
$$;

-- Função para buscar eventos em período
CREATE OR REPLACE FUNCTION public.buscar_eventos_periodo(
    cidade_id_param uuid,
    data_inicio_param timestamp with time zone DEFAULT now(),
    data_fim_param timestamp with time zone DEFAULT (now() + interval '30 days'),
    limite integer DEFAULT 20
)
RETURNS TABLE(
    id uuid,
    titulo text,
    descricao text,
    data_inicio timestamp with time zone,
    data_fim timestamp with time zone,
    local text,
    endereco text,
    imagem_banner text,
    empresa_nome text,
    empresa_id uuid,
    categoria_nome text
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ev.id,
        ev.titulo,
        ev.descricao,
        ev.data_inicio,
        ev.data_fim,
        ev.local,
        ev.endereco,
        ev.imagem_banner,
        emp.nome as empresa_nome,
        emp.id as empresa_id,
        cat.nome as categoria_nome
    FROM public.eventos ev
    LEFT JOIN public.empresas emp ON ev.empresa_id = emp.id
    LEFT JOIN public.categorias cat ON ev.categoria_id = cat.id
    WHERE ev.ativo = true
        AND ev.cidade_id = cidade_id_param
        AND ev.data_inicio >= data_inicio_param
        AND ev.data_inicio <= data_fim_param
    ORDER BY ev.data_inicio ASC
    LIMIT limite;
END;
$$;

-- Função para estatísticas da cidade
CREATE OR REPLACE FUNCTION public.estatisticas_cidade(cidade_id_param uuid)
RETURNS TABLE(
    total_empresas integer,
    total_eventos integer,
    total_avaliacoes integer,
    media_geral_avaliacoes numeric,
    total_visualizacoes bigint,
    empresas_verificadas integer,
    categorias_ativas integer
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM public.empresas WHERE cidade_id = cidade_id_param AND ativo = true) as total_empresas,
        (SELECT COUNT(*)::INTEGER FROM public.eventos WHERE cidade_id = cidade_id_param AND ativo = true) as total_eventos,
        (SELECT COUNT(*)::INTEGER FROM public.avaliacoes av 
         JOIN public.empresas emp ON av.empresa_id = emp.id 
         WHERE emp.cidade_id = cidade_id_param) as total_avaliacoes,
        (SELECT COALESCE(AVG(av.nota), 0) FROM public.avaliacoes av 
         JOIN public.empresas emp ON av.empresa_id = emp.id 
         WHERE emp.cidade_id = cidade_id_param) as media_geral_avaliacoes,
        (SELECT COALESCE(SUM(est.total_visualizacoes), 0) FROM public.estatisticas est 
         JOIN public.empresas emp ON est.empresa_id = emp.id 
         WHERE emp.cidade_id = cidade_id_param) as total_visualizacoes,
        (SELECT COUNT(*)::INTEGER FROM public.empresas WHERE cidade_id = cidade_id_param AND ativo = true AND verificado = true) as empresas_verificadas,
        (SELECT COUNT(DISTINCT emp.categoria_id)::INTEGER FROM public.empresas emp 
         WHERE emp.cidade_id = cidade_id_param AND emp.ativo = true) as categorias_ativas;
END;
$$;

-- Criar view materializada para empresas populares (otimização)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_empresas_populares AS
SELECT 
    e.id,
    e.nome,
    e.imagem_capa_url,
    e.cidade_id,
    c.nome as cidade_nome,
    cat.nome as categoria_nome,
    e.verificado,
    e.destaque,
    COALESCE(est.total_avaliacoes, 0) as total_avaliacoes,
    COALESCE(est.media_avaliacoes, 0) as media_avaliacoes,
    COALESCE(est.total_visualizacoes, 0) as visualizacoes,
    -- Score de popularidade: pontuação baseada em avaliações, visualizações e destaque
    (
        COALESCE(est.total_avaliacoes, 0) * 10 +
        COALESCE(est.media_avaliacoes, 0) * 20 +
        COALESCE(est.total_visualizacoes, 0) * 0.1 +
        CASE WHEN e.destaque THEN 100 ELSE 0 END +
        CASE WHEN e.verificado THEN 50 ELSE 0 END
    ) as score_popularidade
FROM public.empresas e
LEFT JOIN public.estatisticas est ON e.id = est.empresa_id
LEFT JOIN public.cidades c ON e.cidade_id = c.id
LEFT JOIN public.categorias cat ON e.categoria_id = cat.id
WHERE e.ativo = true;

-- Criar índice único para refresh concorrente
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_empresas_populares_id ON public.mv_empresas_populares (id);

-- Função para atualizar view materializada
CREATE OR REPLACE FUNCTION public.refresh_empresas_populares()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_empresas_populares;
END;
$$;

-- Trigger para atualizar view quando necessário
CREATE OR REPLACE FUNCTION public.trigger_refresh_populares()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Atualizar em background (não bloquear a operação)
    PERFORM pg_notify('refresh_populares', '');
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar triggers para refresh automático
DROP TRIGGER IF EXISTS trigger_empresas_refresh_populares ON public.empresas;
CREATE TRIGGER trigger_empresas_refresh_populares
    AFTER INSERT OR UPDATE OR DELETE ON public.empresas
    FOR EACH ROW EXECUTE FUNCTION public.trigger_refresh_populares();

DROP TRIGGER IF EXISTS trigger_estatisticas_refresh_populares ON public.estatisticas;
CREATE TRIGGER trigger_estatisticas_refresh_populares
    AFTER INSERT OR UPDATE OR DELETE ON public.estatisticas
    FOR EACH ROW EXECUTE FUNCTION public.trigger_refresh_populares();
