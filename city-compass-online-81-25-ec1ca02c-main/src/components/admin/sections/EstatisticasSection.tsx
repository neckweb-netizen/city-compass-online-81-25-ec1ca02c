
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NeonCard } from '@/components/ui/neon-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSiteStats } from '@/hooks/useAdminData';
import {
  Activity,
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  Eye,
  Heart,
  MapPin,
  Megaphone,
  MousePointerClick,
  Bell,
  RefreshCw,
  Star,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ec4899'];

type KpiCard = {
  title: string;
  value: number | string;
  description: string;
  icon: typeof Building2;
  accent: string;
};

function formatNumber(value: number) {
  return value.toLocaleString('pt-BR');
}

function StatTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
      <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600">{entry.name}:</span>
            <span className="font-semibold text-slate-900">{formatNumber(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <NeonCard>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mb-2 h-8 w-16" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </NeonCard>
  );
}

function ChartSkeleton({ height = 320 }: { height?: number }) {
  return (
    <NeonCard>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full rounded-xl" style={{ height }} />
      </CardContent>
    </NeonCard>
  );
}

function ProgressMetric({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-900">{percentage}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export const EstatisticasSection = () => {
  const { data: stats, isLoading, isFetching, isError, error, refetch } = useSiteStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <KpiSkeleton key={index} />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="space-y-4">
        <NeonCard className="border-red-200 bg-red-50/60">
          <CardHeader>
            <CardTitle className="text-lg text-red-700">Erro ao carregar estatísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-red-600">
              {error instanceof Error ? error.message : 'Não foi possível buscar os dados do Supabase.'}
            </p>
            <Button variant="outline" onClick={() => refetch()} className="w-fit">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </CardContent>
        </NeonCard>
      </div>
    );
  }

  const kpiCards: KpiCard[] = [
    {
      title: 'Locais Ativos',
      value: stats.totalEmpresas,
      description: `${stats.empresasPendentes} pendentes de aprovação`,
      icon: Building2,
      accent: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Usuários',
      value: stats.totalUsuarios,
      description: `${stats.usuariosByType.empresa ?? 0} contas de locais`,
      icon: Users,
      accent: 'from-violet-500 to-violet-600',
    },
    {
      title: 'Visualizações',
      value: stats.totalVisualizacoes,
      description: 'Total de views nos perfis',
      icon: Eye,
      accent: 'from-cyan-500 to-cyan-600',
    },
    {
      title: 'Avaliações',
      value: stats.totalAvaliacoes,
      description: `Média ${stats.mediaAvaliacoes}/5 estrelas`,
      icon: Star,
      accent: 'from-amber-500 to-amber-600',
    },
    {
      title: 'Eventos',
      value: stats.totalEventos,
      description: 'Eventos ativos na plataforma',
      icon: Calendar,
      accent: 'from-emerald-500 to-emerald-600',
    },
    {
      title: 'Vagas',
      value: stats.totalVagas,
      description: 'Oportunidades de emprego',
      icon: Briefcase,
      accent: 'from-indigo-500 to-indigo-600',
    },
    {
      title: 'Serviços',
      value: stats.totalServicos,
      description: 'Prestadores autônomos',
      icon: Wrench,
      accent: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Voz do Povo',
      value: stats.totalProblemas,
      description: `${stats.problemasResolvidos} problemas resolvidos`,
      icon: Megaphone,
      accent: 'from-rose-500 to-rose-600',
    },
  ];

  const engagementCards = [
    { label: 'Page Views', value: stats.totalPageViews, icon: Eye },
    { label: 'Cliques', value: stats.totalClicks, icon: MousePointerClick },
    { label: 'Curtidas', value: stats.totalCurtidas, icon: Heart },
    { label: 'Notificações', value: stats.totalNotifications, icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
              <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
              Analytics
            </Badge>
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
              Supabase
            </Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Estatísticas da Plataforma
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 md:text-base">
            Panorama completo do site: locais, usuários, conteúdo, engajamento e crescimento mensal.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-fit border-slate-200 bg-white hover:bg-slate-50"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar dados
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <NeonCard
              key={card.title}
              className="overflow-hidden border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">{card.title}</CardTitle>
                <div className={`rounded-xl bg-gradient-to-br ${card.accent} p-2 text-white shadow-sm`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight text-slate-900">
                  {typeof card.value === 'number' ? formatNumber(card.value) : card.value}
                </div>
                <p className="mt-1 text-xs text-slate-500">{card.description}</p>
              </CardContent>
            </NeonCard>
          );
        })}
      </div>

      <NeonCard className="border-slate-200/80">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900">Crescimento nos últimos 6 meses</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={stats.monthlyGrowth}>
              <defs>
                <linearGradient id="empresasGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="usuariosGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="eventosGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pageViewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip content={<StatTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="empresas" name="Locais" stroke="#3b82f6" fill="url(#empresasGradient)" strokeWidth={2} />
              <Area type="monotone" dataKey="usuarios" name="Usuários" stroke="#8b5cf6" fill="url(#usuariosGradient)" strokeWidth={2} />
              <Area type="monotone" dataKey="eventos" name="Eventos" stroke="#06b6d4" fill="url(#eventosGradient)" strokeWidth={2} />
              <Area type="monotone" dataKey="pageViews" name="Page Views" stroke="#ec4899" fill="url(#pageViewsGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </NeonCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Eventos de Tracking',
            value: stats.totalTrackingEvents,
            description: 'Interações registradas no site',
            icon: Activity,
            accent: 'from-slate-600 to-slate-700',
          },
          {
            title: 'Page Views',
            value: stats.totalPageViews,
            description: 'Visualizações de páginas',
            icon: Eye,
            accent: 'from-pink-500 to-pink-600',
          },
          {
            title: 'Cliques',
            value: stats.totalClicks,
            description: 'Cliques rastreados',
            icon: MousePointerClick,
            accent: 'from-orange-500 to-orange-600',
          },
          {
            title: 'Favoritos',
            value: stats.totalFavoritos,
            description: 'Locais salvos pelos usuários',
            icon: Heart,
            accent: 'from-red-500 to-red-600',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <NeonCard key={card.title} className="overflow-hidden border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">{card.title}</CardTitle>
                <div className={`rounded-xl bg-gradient-to-br ${card.accent} p-2 text-white shadow-sm`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight text-slate-900">
                  {formatNumber(card.value)}
                </div>
                <p className="mt-1 text-xs text-slate-500">{card.description}</p>
              </CardContent>
            </NeonCard>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <NeonCard className="border-slate-200/80">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Dispositivos dos visitantes</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.deviceBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stats.deviceBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stats.deviceBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.color ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip content={<StatTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-slate-500">
                Nenhum dado de dispositivo disponível.
              </div>
            )}
          </CardContent>
        </NeonCard>

        <NeonCard className="border-slate-200/80">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Páginas mais visitadas</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topPages.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.topPages} layout="vertical" barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip content={<StatTooltip />} />
                  <Bar dataKey="value" name="Views" fill="#ec4899" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-slate-500">
                Nenhuma page view registrada ainda.
              </div>
            )}
          </CardContent>
        </NeonCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <NeonCard className="border-slate-200/80">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Visão geral do ecossistema</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.overviewChart} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip content={<StatTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {stats.overviewChart.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.color ?? CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </NeonCard>

        <NeonCard className="border-slate-200/80">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Conteúdo e interações</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.contentOverview} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip content={<StatTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {stats.contentOverview.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.color ?? CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </NeonCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <NeonCard className="border-slate-200/80">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Distribuição de locais</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={stats.empresasDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {stats.empresasDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip content={<StatTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </NeonCard>

        <NeonCard className="border-slate-200/80">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Tipos de usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={stats.usuariosByTypeChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {stats.usuariosByTypeChart.map((entry) => (
                    <Cell key={entry.name} fill={entry.color ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip content={<StatTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </NeonCard>

        <NeonCard className="border-slate-200/80">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Status — Voz do Povo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={stats.problemasByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {stats.problemasByStatus.map((entry) => (
                    <Cell key={entry.name} fill={entry.color ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip content={<StatTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </NeonCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <NeonCard className="border-slate-200/80">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Top cidades por locais</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topCidades.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.topCidades} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip content={<StatTooltip />} />
                  <Bar dataKey="value" name="Locais" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-slate-500">
                Nenhum dado de cidade disponível.
              </div>
            )}
          </CardContent>
        </NeonCard>

        <NeonCard className="border-slate-200/80">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Distribuição de avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.ratingDistribution} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip content={<StatTooltip />} />
                <Bar dataKey="value" name="Avaliações" radius={[8, 8, 0, 0]}>
                  {stats.ratingDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color ?? '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </NeonCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <NeonCard className="border-slate-200/80">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Qualidade da base</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ProgressMetric
              label="Taxa de verificação"
              value={stats.empresasVerificadas}
              total={stats.totalEmpresas}
              color="#22c55e"
            />
            <ProgressMetric
              label="Locais em destaque"
              value={stats.empresasDestaque}
              total={stats.totalEmpresas}
              color="#f59e0b"
            />
            <ProgressMetric
              label="Problemas resolvidos"
              value={stats.problemasResolvidos}
              total={stats.totalProblemas}
              color="#06b6d4"
            />
          </CardContent>
        </NeonCard>

        <NeonCard className="border-slate-200/80">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Engajamento</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {engagementCards.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-center"
                >
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                    <Icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{formatNumber(item.value)}</div>
                  <div className="text-xs text-slate-500">{item.label}</div>
                </div>
              );
            })}
          </CardContent>
        </NeonCard>

        <NeonCard className="border-slate-200/80">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Inventário da plataforma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Categorias ativas', value: stats.totalCategorias },
              { label: 'Produtos ativos', value: stats.totalProdutos },
              { label: 'Stories publicados', value: stats.totalStories },
              { label: 'Banners ativos', value: stats.totalBanners },
              { label: 'Posts no canal', value: stats.totalCanalPosts },
              { label: 'Lugares públicos', value: stats.totalLugaresPublicos },
              { label: 'Enquetes', value: stats.totalEnquetes },
              { label: 'Agendamentos', value: stats.totalAgendamentos },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3"
              >
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className="text-sm font-semibold text-slate-900">{formatNumber(item.value)}</span>
              </div>
            ))}
          </CardContent>
        </NeonCard>
      </div>
    </div>
  );
};
