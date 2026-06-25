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
  Loader2
} from "lucide-react";

interface EstatisticasGerais {
  totalUsuarios: number;
  totalEmpresas: number;
  totalProblemas: number;
  totalAgendamentos: number;
  totalVagas: number;
}

export const AdminEstatisticas = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [stats, setStats] = useState<EstatisticasGerais>({
    totalUsuarios: 0,
    totalEmpresas: 0,
    totalProblemas: 0,
    totalAgendamentos: 0,
    totalVagas: 0,
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

      // 3. Total de Problemas Relatados (Tabela: problemas_coluna_cidade)
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

      setStats({
        totalUsuarios: countUsuarios || 0,
        totalEmpresas: countEmpresas || 0,
        totalProblemas: countProblemas || 0,
        totalAgendamentos: countAgendamentos || 0,
        totalVagas: countVagas || 0,
      });

    } catch (error) {
      console.error("Erro ao carregar métricas estatísticas:", error);
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
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Estatísticas</h2>
          <p className="text-muted-foreground mt-1">
            Consulte indicadores consolidados do ecossistema e engajamento do portal.
          </p>
        </div>
        
        <button
          onClick={carregarEstatisticas}
          disabled={loading || refreshing}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors border rounded-md bg-background text-foreground hover:bg-accent/50 disabled:opacity-50 self-start sm:self-center"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Atualizando..." : "Sincronizar Dados"}
        </button>
      </div>

      <hr className="border-border/60" />

      {/* Grid Principal de Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        
        {/* Card: Usuários Cadastrados */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground tracking-wide">USUÁRIOS</p>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2">
            {loading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <h3 className="text-3xl font-bold tracking-tight">{stats.totalUsuarios}</h3>
            )}
            <p className="text-xs text-muted-foreground mt-1">Contas registradas no app</p>
          </div>
        </div>

        {/* Card: Empresas */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground tracking-wide">EMPRESAS</p>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2">
            {loading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <h3 className="text-3xl font-bold tracking-tight">{stats.totalEmpresas}</h3>
            )}
            <p className="text-xs text-muted-foreground mt-1">Estabelecimentos comerciais</p>
          </div>
        </div>

        {/* Card: Problemas Urbanos */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground tracking-wide">PROBLEMAS CIDADÃOS</p>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2">
            {loading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <h3 className="text-3xl font-bold tracking-tight">{stats.totalProblemas}</h3>
            )}
            <p className="text-xs text-muted-foreground mt-1">Relatórios da comunidade</p>
          </div>
        </div>

        {/* Card: Agendamentos */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground tracking-wide">AGENDAMENTOS</p>
            <div className="p-2 bg-violet-500/10 rounded-lg text-violet-500">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2">
            {loading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <h3 className="text-3xl font-bold tracking-tight">{stats.totalAgendamentos}</h3>
            )}
            <p className="text-xs text-muted-foreground mt-1">Reservas de serviços marcadas</p>
          </div>
        </div>

        {/* Card: Vagas de Emprego */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground tracking-wide">VAGAS ATIVAS</p>
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2">
            {loading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <h3 className="text-3xl font-bold tracking-tight">{stats.totalVagas}</h3>
            )}
            <p className="text-xs text-muted-foreground mt-1">Oportunidades de trabalho</p>
          </div>
        </div>

      </div>

      {/* Painel Inferior de Insights Informativos */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <h4>Visão Operacional do Banco de Dados</h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            As métricas consolidadas acima refletem a quantidade de registros ativos armazenados em tabelas nativas do sistema. Modificações inseridas por usuários finais, novos registros corporativos ou resoluções de problemas da cidade sincronizam automaticamente após atualizar o barramento de requisições.
          </p>
          <div className="pt-2 text-xs text-muted-foreground/80 flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Conectado de forma íntegra ao ambiente de produção do Supabase.
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between">
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Distribuição Estatística</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Utilize o painel para gerenciar a volumetria operacional do guia. O fluxo de dados opera de forma assíncrona, assegurando a integridade e escalabilidade dos logs de monitoramento.
            </p>
          </div>
          
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
              Processando registros estruturados...
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
