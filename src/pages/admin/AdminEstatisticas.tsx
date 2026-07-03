import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Building2, 
  AlertTriangle, 
  Calendar, 
  Briefcase, 
  TrendingUp, 
  RefreshCw,
  Loader2,
  MousePointerClick,
  Eye,
  Percent,
  Star,
  Compass,
  Smartphone,
  Download,
  SmartphoneCharging
} from "lucide-react";

interface EstatisticasAvancadas {
  // Métricas Básicas
  totalUsuarios: number;
  totalEmpresas: number;
  totalProblemas: number;
  totalAgendamentos: number;
  totalVagas: number;
  
  // Métricas Avançadas de Tráfego e Eventos
  totalVisualizacoes: number;
  totalCliques: number;
  taxaConversao: number;
  mediaAvaliacoes: number;
  totalSessoesAtivas: number;

  // Novas Métricas de Telemetria e Uso do PWA
  pwaExibicoes: number;
  pwaCliques: number;
  pwaInstalacoes: number;
  pwaAcessosApp: number;
}

export const AdminEstatisticas = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [stats, setStats] = useState<EstatisticasAvancadas>({
    totalUsuarios: 0,
    totalEmpresas: 0,
    totalProblemas: 0,
    totalAgendamentos: 0,
    totalVagas: 0,
    totalVisualizacoes: 0,
    totalCliques: 0,
    taxaConversao: 0,
    mediaAvaliacoes: 0,
    totalSessoesAtivas: 0,
    pwaExibicoes: 0,
    pwaCliques: 0,
    pwaInstalacoes: 0,
    pwaAcessosApp: 0,
  });

  const carregarEstatisticas = async () => {
    try {
      setRefreshing(true);
      
      // 1. Total de Usuários (Tabela: usuarios)
      const { count: countUsuarios, error: errUsuarios } = await supabase
        .from("usuarios")
        .select("*", { count: "exact", head: true });
      if (errUsuarios) throw errUsuarios;

      // 2. Total de Empresas (Tabela: empresas)
      const { count: countEmpresas, error: errEmpresas } = await supabase
        .from("empresas")
        .select("*", { count: "exact", head: true });
      if (errEmpresas) throw errEmpresas;

      // 3. Total de Problemas Relatados (Tabela: problemas_cidade)
      const { count: countProblemas, error: errProblemas } = await supabase
        .from("problems_cidade" as any) // Mantendo compatibilidade com seu esquema original
        .select("*", { count: "exact", head: true })
        .catch(() => supabase.from("problemas_cidade").select("*", { count: "exact", head: true }));
      
      let countProblemasFinal = countProblemas;
      if (!countProblemasFinal) {
        const { count: fallbackCount } = await supabase.from("problemas_cidade").select("*", { count: "exact", head: true });
        countProblemasFinal = fallbackCount;
      }

      // 4. Total de Agendamentos (Tabela: agendamentos)
      const { count: countAgendamentos, error: errAgendamentos } = await supabase
        .from("agendamentos")
        .select("*", { count: "exact", head: true });
      if (errAgendamentos) throw errAgendamentos;

      // 5. Total de Vagas de Emprego (Tabela: vagas_emprego)
      const { count: countVagas, error: errVagas } = await supabase
        .from("vagas_emprego")
        .select("*", { count: "exact", head: true });
      if (errVagas) throw errVagas;

      // 6. Tráfego: Total de Visualizações (Filtro na tabela user_tracking_events)
      const { count: countVisualizacoes, error: errVisualizacoes } = await supabase
        .from("user_tracking_events")
        .select("*", { count: "exact", head: true });
      if (errVisualizacoes) throw errVisualizacoes;

      // 7. Tráfego: Total de Cliques/Conversões (Tabela: conversion_events)
      const { count: countCliques, error: errCliques } = await supabase
        .from("conversion_events")
        .select("*", { count: "exact", head: true });
      if (errCliques) throw errCliques;

      // 8. Sessões Ativas (Tabela: user_sessions)
      const { count: countSessoes, error: errSessoes } = await supabase
        .from("user_sessions")
        .select("*", { count: "exact", head: true });
      if (errSessoes) throw errSessoes;

      // 9. Média de Avaliações das Empresas (Tabela: avaliacoes)
      const { data: dataAvaliacoes, error: errAvaliacoes } = await supabase
        .from("avaliacoes")
        .select("nota");
      if (errAvaliacoes) throw errAvaliacoes;

      // 10. Busca os logs brutos de telemetria da tabela de estatísticas do PWA
      const { data: pwaLogs, error: errPwa } = await supabase
        .from("estatisticas_pwa" as any)
        .select("evento");
      if (errPwa) console.error("Aviso: Falha ao carregar logs da tabela estatisticas_pwa", errPwa);

      // Processamento seguro dos dados do PWA se existirem registros no banco
      let pwaExibicoesCount = 0;
      let pwaCliquesCount = 0;
      let pwaInstalacoesCount = 0;
      let pwaAcessosAppCount = 0;

      if (pwaLogs && pwaLogs.length > 0) {
        pwaExibicoesCount = pwaLogs.filter((l: any) => l.evento === "banner_exibido").length;
        pwaCliquesCount = pwaLogs.filter((l: any) => l.evento === "clique_instalar" || l.evento === "clique_instalar_ios").length;
        pwaInstalacoesCount = pwaLogs.filter((l: any) => l.evento === "instalado_com_sucesso").length;
        pwaAcessosAppCount = pwaLogs.filter((l: any) => l.evento === "acesso_standalone").length;
      }

      // Cálculo da Média de Avaliações de forma segura
      let mediaNotas = 0;
      if (dataAvaliacoes && dataAvaliacoes.length > 0) {
        const soma = dataAvaliacoes.reduce((acc, curr) => acc + (curr.nota || 0), 0);
        mediaNotas = parseFloat((soma / dataAvaliacoes.length).toFixed(1));
      }

      // Cálculo da Taxa de Conversão (Cliques / Visualizações * 100)
      const vizoes = countVisualizacoes || 0;
      const cliques = countCliques || 0;
      const taxa = vizoes > 0 ? parseFloat(((cliques / vizoes) * 100).toFixed(2)) : 0;

      setStats({
        totalUsuarios: countUsuarios || 0,
        totalEmpresas: countEmpresas || 0,
        totalProblemas: countProblemasFinal || 0,
        totalAgendamentos: countAgendamentos || 0,
        totalVagas: countVagas || 0,
        totalVisualizacoes: vizoes,
        totalCliques: cliques,
        taxaConversao: taxa,
        mediaAvaliacoes: mediaNotas,
        totalSessoesAtivas: countSessoes || 0,
        pwaExibicoes: pwaExibicoesCount,
        pwaCliques: pwaCliquesCount,
        pwaInstalacoes: pwaInstalacoesCount,
        pwaAcessosApp: pwaAcessosAppCount,
      });

    } catch (error) {
      console.error("Erro ao carregar métricas analíticas e de tráfego:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  return (
    <div className="space-y-8 p-1">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Compass className="h-8 w-8 text-blue-500 animate-pulse" />
            Painel de Estatísticas Avançadas
          </h2>
          <p className="text-muted-foreground mt-1">
            Métricas de tráfego, eventos de conversão e volumetria geral do banco em tempo real.
          </p>
        </div>
        
        <button
          onClick={carregarEstatisticas}
          disabled={loading || refreshing}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors border rounded-md bg-background text-foreground hover:bg-accent/50 disabled:opacity-50 self-start sm:self-center"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Sincronizando..." : "Atualizar Painel"}
        </button>
      </div>

      <hr className="border-border/60" />

      {/* SEÇÃO 1: MÉTRICAS DE TRÁFEGO E PERFORMANCE (AVANÇADO) */}
      <div>
        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Tráfego & Engajamento</h4>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Card: Visualizações de Páginas */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 text-card-foreground shadow-sm p-6 relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-blue-400 tracking-wide">VISUALIZAÇÕES (Acessos)</p>
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <Eye className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2">
              {loading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <h3 className="text-3xl font-bold tracking-tight text-blue-500">{stats.totalVisualizacoes}</h3>
              )}
              <p className="text-xs text-muted-foreground mt-1">Eventos totais de rastreamento de página</p>
            </div>
          </div>

          {/* Card: Eventos de Conversão / Cliques */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 text-card-foreground shadow-sm p-6 relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-amber-400 tracking-wide">CLIQUES / CONVERSÕES</p>
              <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                <MousePointerClick className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2">
              {loading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <h3 className="text-3xl font-bold tracking-tight text-amber-500">{stats.totalCliques}</h3>
              )}
              <p className="text-xs text-muted-foreground mt-1">Interações diretas em banners e botões</p>
            </div>
          </div>

          {/* Card: Taxa de Conversão Média */}
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 text-card-foreground shadow-sm p-6 relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-violet-400 tracking-wide">TAXA DE CONVERSÃO</p>
              <div className="p-2 bg-violet-500/20 rounded-lg text-violet-400">
                <Percent className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2">
              {loading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <h3 className="text-3xl font-bold tracking-tight text-violet-500">{stats.taxaConversao}%</h3>
              )}
              <p className="text-xs text-muted-foreground mt-1">Percentual de cliques sobre visualizações</p>
            </div>
          </div>

          {/* Card: Média de Avaliações */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 text-card-foreground shadow-sm p-6 relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-rose-400 tracking-wide">AVALIAÇÃO MÉDIA</p>
              <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400">
                <Star className="h-5 w-5 fill-rose-400/20" />
              </div>
            </div>
            <div className="mt-2">
              {loading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <h3 className="text-3xl font-bold tracking-tight text-rose-500">{stats.mediaAvaliacoes} / 5.0</h3>
              )}
              <p className="text-xs text-muted-foreground mt-1">Reputação média das empresas locais</p>
            </div>
          </div>

        </div>
      </div>

      {/* SEÇÃO NOVA: TELEMETRIA E USO DO APLICATIVO MOBILE PWA */}
      <div className="pt-2">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Desempenho do Aplicativo PWA (Mobile)</h4>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

          {/* Card PWA: Banners Exibidos */}
          <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Banners Ofertados</p>
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <Eye className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              {loading ? (
                <div className="h-6 w-16 bg-muted animate-pulse rounded" />
              ) : (
