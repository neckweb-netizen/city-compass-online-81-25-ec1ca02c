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

  // Métricas Específicas do Aplicativo PWA
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
        .from("problemas_cidade")
        .select("*", { count: "exact", head: true });
      if (errProblemas) throw errProblemas;

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

      // 6. Tráfego: Total de Visualizações (Filtro na tabela user_tracking_events ou conversion_events)
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

      // 10. Coleta de Logs de Telemetria e Uso do PWA da nova tabela
      const { data: pwaLogs, error: errPwa } = await supabase
        .from("estatisticas_pwa" as any)
        .select("evento");
      if (errPwa) console.error("Erro interno ao recuperar logs PWA:", errPwa);

      // Processamento das métricas do PWA
      let exibicoesPwa = 0;
      let cliquesPwa = 0;
      let instalacoesPwa = 0;
      let acessosPwa = 0;

      if (pwaLogs) {
        exibicoesPwa = pwaLogs.filter((l: any) => l.evento === "banner_exibido").length;
        cliquesPwa = pwaLogs.filter((l: any) => l.evento === "clique_instalar" || l.evento === "clique_instalar_ios").length;
        instalacoesPwa = pwaLogs.filter((l: any) => l.evento === "instalado_com_sucesso").length;
        acessosPwa = pwaLogs.filter((l: any) => l.evento === "acesso_standalone").length;
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
        totalProblemas: countProblemas || 0,
        totalAgendamentos: countAgendamentos || 0,
        totalVagas: countVagas || 0,
        totalVisualizacoes: vizoes,
        totalCliques: cliques,
        taxaConversao: taxa,
        mediaAvaliacoes: mediaNotas,
        totalSessoesAtivas: countSessoes || 0,
        pwaExibicoes: exibicoesPwa,
        pwaCliques: cliquesPwa,
        pwaInstalacoes: instalacoesPwa,
        pwaAcessosApp: acessosPwa,
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
              <p className="text-xs text-muted-foreground mt-1">Eventos totals de rastreamento de página</p>
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

      {/* NOVA SEÇÃO: TELEMETRIA E USO DO APLICATIVO MOBILE PWA */}
      <div className="pt-2">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Desempenho do Aplicativo PWA (Mobile)</h4>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Card PWA: Banner Exibido */}
          <div className="rounded-xl border border-border bg-gradient-to-b from-background to-muted/20 shadow-sm p-6 relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground tracking-wide">BANNER EXIBIDO</p>
              <div className="p-2 bg-blue-500/10 border rounded-lg text-blue-500">
                <Eye className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2">
              {loading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <h3 className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{stats.pwaExibicoes}</h3>
              )}
              <p className="text-xs text-muted-foreground mt-1">Ofertas de instalação exibidas aos visitantes</p>
            </div>
          </div>

          {/* Card PWA: Intenções de Clique */}
          <div className="rounded-xl border border-border bg-gradient-to-b from-background to-muted/20 shadow-sm p-6 relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground tracking-wide">INTENÇÕES DE CLIQUE</p>
              <div className="p-2 bg-orange-500/10 border rounded-lg text-orange-500">
                <SmartphoneCharging className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2">
              {loading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <h3 className="text-3xl font-bold tracking-tight text-orange-600 dark:text-orange-400">{stats.pwaCliques}</h3>
              )}
              <p className="text-xs text-muted-foreground mt-1">Cliques realizados no botão "Instalar Aplicativo"</p>
            </div>
          </div>

          {/* Card PWA: Apps Instalados Concluídos */}
          <div className="rounded-xl border border-border bg-gradient-to-br from-background to-primary/5 shadow-sm p-6 relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground tracking-wide">APPS INSTALADOS</p>
              <div className="p-2 bg-green-500/10 border rounded-lg text-green-500">
                <Download className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2">
              {loading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <h3 className="text-3xl font-bold tracking-tight text-green-600 dark:text-green-400">{stats.pwaInstalacoes}</h3>
              )}
              <p className="text-xs text-muted-foreground mt-1">Instalações concluídas com sucesso na tela inicial</p>
            </div>
          </div>

          {/* Card PWA: Acessos Standalone */}
          <div className="rounded-xl border border-border bg-gradient-to-b from-background to-muted/20 shadow-sm p-6 relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground tracking-wide">ACESSOS VIA APP</p>
              <div className="p-2 bg-purple-500/10 border rounded-lg text-purple-500">
                <Smartphone className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2">
              {loading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <h3 className="text-3xl font-bold tracking-tight text-purple-600 dark:text-purple-400">{stats.pwaAcessosApp}</h3>
              )}
              <p className="text-xs text-muted-foreground mt-1">Sessões iniciadas a partir do aplicativo PWA</p>
            </div>
          </div>

        </div>
      </div>

      {/* SEÇÃO 3: MÉTRICAS GERAIS DO SITE */}
      <div className="pt-2">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Métricas Gerais e Cadastros</h4>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          
          {/* Card: Usuários Cadastrados */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground tracking-wide">USUÁRIOS</p>
              <div className="p-2 bg-foreground/5 border rounded-lg text-muted-foreground">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2">
              {loading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <h3 className="text-3xl font-bold tracking-tight">{stats.totalUsuarios}</h3>
              )}
              <p className="text-xs text-muted-foreground mt-1">Total de contas criadas</p>
            </div>
          </div>

          {/* Card: Empresas */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground tracking-wide">EMPRESAS</p>
              <div className="p-2 bg-foreground/5 border rounded-lg text-muted-foreground">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2">
              {loading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <h3 className="text-3xl font-bold tracking-tight">{stats.totalEmpresas}</h3>
              )}
              <p className="text-xs text-muted-foreground mt-1">Estabelecimentos parceiros</p>
            </div>
          </div>

          {/* Card: Problemas Urbanos */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground tracking-wide">PROBLEMAS CIDADÃOS</p>
              <div className="p-2 bg-foreground/5 border rounded-lg text-muted-foreground">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2">
              {loading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <h3 className="text-3xl font-bold tracking-tight">{stats.totalProblemas}</h3>
              )}
              <p className="text-xs text-muted-foreground mt-1">Reclamações enviadas</p>
            </div>
          </div>

          {/* Card: Agendamentos */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground tracking-wide">AGENDAMENTOS</p>
              <div className="p-2 bg-foreground/5 border rounded-lg text-muted-foreground">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2">
              {loading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <h3 className="text-3xl font-bold tracking-tight">{stats.totalAgendamentos}</h3>
              )}
              <p className="text-xs text-muted-foreground mt-1">Reservas de serviços</p>
            </div>
          </div>

          {/* Card: Vagas de Emprego */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground tracking-wide">VAGAS ATIVAS</p>
              <div className="p-2 bg-foreground/5 border rounded-lg text-muted-foreground">
                <Briefcase className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2">
              {loading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <h3 className="text-3xl font-bold tracking-tight">{stats.totalVagas}</h3>
              )}
              <p className="text-xs text-muted-foreground mt-1">Oportunidades de emprego</p>
            </div>
          </div>

        </div>
      </div>

      {/* PAINEL INFERIOR: DETALHES DE SESSÕES E RELATÓRIO OPERACIONAL */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <h4>Análise Estratégica de Conversão e Tráfego</h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A integração de dados correlaciona as tabelas de monitoramento de eventos de jornada com as ações finais dos usuários no ecossistema. A taxa de conversão calcula o nível de assertividade das divulgações internas e das interações diretas realizadas dentro do ambiente do portal de empresas.
          </p>
          <div className="pt-2 text-xs text-muted-foreground/80 flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Sincronização assíncrona estabelecida com tabelas analíticas avançadas.
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Monitoramento Ativo
            </h4>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Histórico de Sessões Registradas</p>
              {loading ? (
                <div className="h-6 w-16 bg-muted animate-pulse rounded mt-1" />
              ) : (
                <h5 className="text-2xl font-bold text-foreground">{stats.totalSessoesAtivas}</h5>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Quantidade agregada de sessões geradas e salvas na tabela de auditoria de acessos.
            </p>
          </div>
          
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 pt-2 border-t">
              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
              Processando logs estruturados de tráfego...
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminEstatisticas;
