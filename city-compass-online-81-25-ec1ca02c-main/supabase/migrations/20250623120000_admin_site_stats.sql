-- Estatísticas consolidadas para o painel admin
CREATE OR REPLACE FUNCTION public.get_admin_site_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_cidade_id uuid;
  v_is_geral boolean;
BEGIN
  SELECT u.tipo_conta::text, u.cidade_id
  INTO v_role, v_cidade_id
  FROM public.usuarios u
  WHERE u.id = auth.uid();

  IF v_role IS NULL OR v_role NOT IN ('admin_geral', 'admin_cidade') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem consultar estatísticas';
  END IF;

  v_is_geral := v_role = 'admin_geral';

  RETURN jsonb_build_object(
    'totalEmpresas', (
      SELECT count(*)::int FROM public.empresas e
      WHERE e.ativo = true AND (v_is_geral OR e.cidade_id = v_cidade_id)
    ),
    'empresasVerificadas', (
      SELECT count(*)::int FROM public.empresas e
      WHERE e.ativo = true AND e.verificado = true AND (v_is_geral OR e.cidade_id = v_cidade_id)
    ),
    'empresasDestaque', (
      SELECT count(*)::int FROM public.empresas e
      WHERE e.ativo = true AND e.destaque = true AND (v_is_geral OR e.cidade_id = v_cidade_id)
    ),
    'empresasPendentes', (
      SELECT count(*)::int FROM public.empresas e
      WHERE e.status_aprovacao = 'pendente' AND (v_is_geral OR e.cidade_id = v_cidade_id)
    ),
    'totalUsuarios', (
      SELECT count(*)::int FROM public.usuarios u
      WHERE v_is_geral OR u.cidade_id = v_cidade_id
    ),
    'totalEventos', (
      SELECT count(*)::int FROM public.eventos ev
      WHERE ev.ativo = true AND (v_is_geral OR ev.cidade_id = v_cidade_id)
    ),
    'totalAvaliacoes', (
      SELECT count(*)::int FROM public.avaliacoes av
      JOIN public.empresas e ON e.id = av.empresa_id
      WHERE v_is_geral OR e.cidade_id = v_cidade_id
    ),
    'mediaAvaliacoes', (
      SELECT COALESCE(round(avg(av.nota)::numeric, 1), 0)
      FROM public.avaliacoes av
      JOIN public.empresas e ON e.id = av.empresa_id
      WHERE v_is_geral OR e.cidade_id = v_cidade_id
    ),
    'totalCupons', (
      SELECT count(*)::int FROM public.cupons c
      JOIN public.empresas e ON e.id = c.empresa_id
      WHERE c.ativo = true AND (v_is_geral OR e.cidade_id = v_cidade_id)
    ),
    'totalCategorias', (SELECT count(*)::int FROM public.categorias WHERE ativo = true),
    'totalCidades', (SELECT count(*)::int FROM public.cidades),
    'totalProdutos', (
      SELECT count(*)::int FROM public.produtos p
      JOIN public.empresas e ON e.id = p.empresa_id
      WHERE p.ativo = true AND (v_is_geral OR e.cidade_id = v_cidade_id)
    ),
    'totalVagas', (
      SELECT count(*)::int FROM public.vagas_emprego v
      WHERE v.ativo = true AND (v_is_geral OR v.cidade_id = v_cidade_id)
    ),
    'totalServicos', (
      SELECT count(*)::int FROM public.servicos_autonomos s
      WHERE v_is_geral OR s.cidade_id = v_cidade_id
    ),
    'totalProblemas', (
      SELECT count(*)::int FROM public.problemas_cidade p
      WHERE v_is_geral OR p.cidade_id = v_cidade_id
    ),
    'problemasResolvidos', (
      SELECT count(*)::int FROM public.problemas_cidade p
      WHERE p.status = 'resolvido' AND (v_is_geral OR p.cidade_id = v_cidade_id)
    ),
    'totalFavoritos', (
      SELECT count(*)::int FROM public.favoritos f
      JOIN public.empresas e ON e.id = f.empresa_id
      WHERE v_is_geral OR e.cidade_id = v_cidade_id
    ),
    'totalEnquetes', (SELECT count(*)::int FROM public.enquetes),
    'totalVisualizacoes', (
      SELECT COALESCE(sum(est.total_visualizacoes), 0)::bigint
      FROM public.estatisticas est
      JOIN public.empresas e ON e.id = est.empresa_id
      WHERE v_is_geral OR e.cidade_id = v_cidade_id
    ),
    'totalCurtidas', (
      SELECT COALESCE(sum(est.total_curtidas), 0)::bigint
      FROM public.estatisticas est
      JOIN public.empresas e ON e.id = est.empresa_id
      WHERE v_is_geral OR e.cidade_id = v_cidade_id
    ),
    'totalStories', (SELECT count(*)::int FROM public.empresa_stories WHERE ativo = true),
    'totalBanners', (SELECT count(*)::int FROM public.banners_publicitarios WHERE ativo = true),
    'totalCanalPosts', (SELECT count(*)::int FROM public.canal_informativo),
    'totalLugaresPublicos', (
      SELECT count(*)::int FROM public.lugares_publicos lp
      WHERE lp.ativo = true AND (v_is_geral OR lp.cidade_id = v_cidade_id)
    ),
    'totalAgendamentos', (
      SELECT count(*)::int FROM public.agendamentos a
      JOIN public.empresas e ON e.id = a.empresa_id
      WHERE v_is_geral OR e.cidade_id = v_cidade_id
    ),
    'totalTrackingEvents', (
      SELECT count(*)::int FROM public.user_tracking_events t
      WHERE v_is_geral OR t.cidade_id = v_cidade_id
    ),
    'totalPageViews', (
      SELECT count(*)::int FROM public.user_tracking_events t
      WHERE t.event_type = 'page_view' AND (v_is_geral OR t.cidade_id = v_cidade_id)
    ),
    'totalClicks', (
      SELECT count(*)::int FROM public.user_tracking_events t
      WHERE t.event_type = 'click' AND (v_is_geral OR t.cidade_id = v_cidade_id)
    ),
    'totalNotifications', (SELECT count(*)::int FROM public.notifications),
    'usuariosByType', (
      SELECT COALESCE(jsonb_object_agg(u.tipo_conta::text, u.cnt), '{}'::jsonb)
      FROM (
        SELECT tipo_conta, count(*)::int AS cnt
        FROM public.usuarios usr
        WHERE v_is_geral OR usr.cidade_id = v_cidade_id
        GROUP BY tipo_conta
      ) u
    ),
    'monthlyGrowth', (
      WITH month_series AS (
        SELECT gs::date AS month_start
        FROM generate_series(
          date_trunc('month', now()) - interval '5 months',
          date_trunc('month', now()),
          interval '1 month'
        ) gs
      )
      SELECT COALESCE(jsonb_agg(row_data ORDER BY month_start), '[]'::jsonb)
      FROM (
        SELECT
          ms.month_start,
          jsonb_build_object(
            'monthKey', to_char(ms.month_start, 'YYYY-MM'),
            'empresas', (
              SELECT count(*)::int FROM public.empresas e
              WHERE e.ativo = true
                AND date_trunc('month', e.criado_em) = ms.month_start
                AND (v_is_geral OR e.cidade_id = v_cidade_id)
            ),
            'usuarios', (
              SELECT count(*)::int FROM public.usuarios u
              WHERE date_trunc('month', u.criado_em) = ms.month_start
                AND (v_is_geral OR u.cidade_id = v_cidade_id)
            ),
            'eventos', (
              SELECT count(*)::int FROM public.eventos ev
              WHERE ev.ativo = true
                AND date_trunc('month', ev.criado_em) = ms.month_start
                AND (v_is_geral OR ev.cidade_id = v_cidade_id)
            ),
            'pageViews', (
              SELECT count(*)::int FROM public.user_tracking_events t
              WHERE t.event_type = 'page_view'
                AND date_trunc('month', t.created_at) = ms.month_start
                AND (v_is_geral OR t.cidade_id = v_cidade_id)
            )
          ) AS row_data
        FROM month_series ms
      ) monthly
    ),
    'topCidades', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('name', c.nome, 'value', c.cnt) ORDER BY c.cnt DESC), '[]'::jsonb)
      FROM (
        SELECT ci.nome, count(*)::int AS cnt
        FROM public.empresas e
        JOIN public.cidades ci ON ci.id = e.cidade_id
        WHERE e.ativo = true AND (v_is_geral OR e.cidade_id = v_cidade_id)
        GROUP BY ci.nome
        ORDER BY cnt DESC
        LIMIT 6
      ) c
    ),
    'ratingDistribution', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('stars', r.nota, 'count', r.cnt) ORDER BY r.nota), '[]'::jsonb)
      FROM (
        SELECT av.nota, count(*)::int AS cnt
        FROM public.avaliacoes av
        JOIN public.empresas e ON e.id = av.empresa_id
        WHERE v_is_geral OR e.cidade_id = v_cidade_id
        GROUP BY av.nota
      ) r
    ),
    'problemasByStatus', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('status', p.status::text, 'count', p.cnt)), '[]'::jsonb)
      FROM (
        SELECT status, count(*)::int AS cnt
        FROM public.problemas_cidade pc
        WHERE v_is_geral OR pc.cidade_id = v_cidade_id
        GROUP BY status
      ) p
    ),
    'deviceBreakdown', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('name', d.device_type, 'value', d.cnt) ORDER BY d.cnt DESC), '[]'::jsonb)
      FROM (
        SELECT coalesce(t.device_type, 'desconhecido') AS device_type, count(*)::int AS cnt
        FROM public.user_tracking_events t
        WHERE (v_is_geral OR t.cidade_id = v_cidade_id) AND t.device_type IS NOT NULL
        GROUP BY t.device_type
      ) d
    ),
    'topPages', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('name', pg.page_url, 'value', pg.cnt) ORDER BY pg.cnt DESC), '[]'::jsonb)
      FROM (
        SELECT coalesce(nullif(t.page_url, ''), '/') AS page_url, count(*)::int AS cnt
        FROM public.user_tracking_events t
        WHERE t.event_type = 'page_view'
          AND (v_is_geral OR t.cidade_id = v_cidade_id)
        GROUP BY coalesce(nullif(t.page_url, ''), '/')
        ORDER BY cnt DESC
        LIMIT 8
      ) pg
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_site_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_site_stats() TO authenticated;
