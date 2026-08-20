-- Defense in depth: visitors must never receive direct write grants on
-- administrative or account tables. Authenticated access remains governed by RLS.
revoke insert, update, delete, truncate on table public.bairros from anon;
revoke insert, update, delete, truncate on table public.banners_publicitarios from anon;
revoke insert, update, delete, truncate on table public.categorias from anon;
revoke insert, update, delete, truncate on table public.categorias_oportunidades from anon;
revoke insert, update, delete, truncate on table public.cidades from anon;
revoke insert, update, delete, truncate on table public.cupons from anon;
revoke insert, update, delete, truncate on table public.empresa_stories from anon;
revoke insert, update, delete, truncate on table public.enderecos_empresa from anon;
revoke insert, update, delete, truncate on table public.eventos from anon;
revoke insert, update, delete, truncate on table public.lugares_publicos from anon;
revoke insert, update, delete, truncate on table public.pagamentos_planos from anon;
revoke insert, update, delete, truncate on table public.planos from anon;
revoke insert, update, delete, truncate on table public.produtos from anon;
revoke insert, update, delete, truncate on table public.servicos_agendamento from anon;
revoke insert, update, delete, truncate on table public.servicos_autonomos from anon;
revoke insert, update, delete, truncate on table public.vagas_emprego from anon;
revoke insert, update, delete, truncate on table public.usuarios from anon;
revoke insert, update, delete, truncate on table public.estatisticas_pwa from anon;
revoke insert, update, delete, truncate on table public.audit_logs from anon;
