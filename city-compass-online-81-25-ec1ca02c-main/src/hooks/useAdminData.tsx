
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ChartDataPoint = { name: string; value: number; color?: string };

export type MonthlyGrowthPoint = {
  month: string;
  empresas: number;
  usuarios: number;
  eventos: number;
  pageViews: number;
};

export type SiteStats = {
  totalEmpresas: number;
  empresasVerificadas: number;
  empresasDestaque: number;
  empresasPendentes: number;
  totalUsuarios: number;
  usuariosByType: Record<string, number>;
  totalEventos: number;
  totalAvaliacoes: number;
  mediaAvaliacoes: string;
  totalCupons: number;
  totalCategorias: number;
  totalCidades: number;
  totalProdutos: number;
  totalVagas: number;
  totalServicos: number;
  totalProblemas: number;
  problemasResolvidos: number;
  totalFavoritos: number;
  totalEnquetes: number;
  totalVisualizacoes: number;
  totalCurtidas: number;
  totalStories: number;
  totalBanners: number;
  totalCanalPosts: number;
  totalLugaresPublicos: number;
  totalAgendamentos: number;
  totalTrackingEvents: number;
  totalPageViews: number;
  totalClicks: number;
  totalNotifications: number;
  overviewChart: ChartDataPoint[];
  empresasDistribution: ChartDataPoint[];
  usuariosByTypeChart: ChartDataPoint[];
  monthlyGrowth: MonthlyGrowthPoint[];
  topCidades: ChartDataPoint[];
  ratingDistribution: ChartDataPoint[];
  problemasByStatus: ChartDataPoint[];
  contentOverview: ChartDataPoint[];
  deviceBreakdown: ChartDataPoint[];
  topPages: ChartDataPoint[];
};

const USER_TYPE_LABELS: Record<string, string> = {
  usuario: 'Usuários',
  empresa: 'Locais',
  criador_empresa: 'Criadores',
  admin_cidade: 'Admin Cidade',
  admin_geral: 'Admin Geral',
};

const USER_TYPE_COLORS: Record<string, string> = {
  usuario: '#3b82f6',
  empresa: '#8b5cf6',
  criador_empresa: '#06b6d4',
  admin_cidade: '#f59e0b',
  admin_geral: '#ef4444',
};

const PROBLEMA_STATUS_LABELS: Record<string, string> = {
  aberto: 'Abertos',
  em_analise: 'Em Análise',
  resolvido: 'Resolvidos',
  fechado: 'Fechados',
};

const PROBLEMA_STATUS_COLORS: Record<string, string> = {
  aberto: '#ef4444',
  em_analise: '#f59e0b',
  resolvido: '#22c55e',
  fechado: '#6b7280',
};

function getLastMonths(count: number) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = subMonths(startOfMonth(now), count - 1 - index);
    return {
      key: format(date, 'yyyy-MM'),
      label: format(date, 'MMM yy', { locale: ptBR }),
    };
  });
}

function mapAdminSiteStatsPayload(raw: Record<string, unknown>): SiteStats {
  const months = getLastMonths(6);
  const usuariosByType = (raw.usuariosByType as Record<string, number>) ?? {};
  const monthlyRaw = (raw.monthlyGrowth as Array<Record<string, unknown>>) ?? [];
  const monthlyByKey = Object.fromEntries(
    monthlyRaw.map((item) => [String(item.monthKey), item])
  );

  const totalEmpresas = Number(raw.totalEmpresas ?? 0);
  const empresasVerificadas = Number(raw.empresasVerificadas ?? 0);
  const empresasDestaque = Number(raw.empresasDestaque ?? 0);
  const totalUsuarios = Number(raw.totalUsuarios ?? 0);
  const totalEventos = Number(raw.totalEventos ?? 0);
  const totalAvaliacoes = Number(raw.totalAvaliacoes ?? 0);
  const totalCupons = Number(raw.totalCupons ?? 0);
  const totalProdutos = Number(raw.totalProdutos ?? 0);
  const totalVagas = Number(raw.totalVagas ?? 0);
  const totalServicos = Number(raw.totalServicos ?? 0);
  const totalProblemas = Number(raw.totalProblemas ?? 0);
  const totalFavoritos = Number(raw.totalFavoritos ?? 0);
  const totalStories = Number(raw.totalStories ?? 0);
  const totalAgendamentos = Number(raw.totalAgendamentos ?? 0);
  const empresasNormais = Math.max(totalEmpresas - empresasVerificadas - empresasDestaque, 0);

  const topCidades = ((raw.topCidades as Array<{ name: string; value: number }>) ?? []).map((item) => ({
    name: item.name,
    value: Number(item.value ?? 0),
  }));

  const ratingRaw = (raw.ratingDistribution as Array<{ stars: number; count: number }>) ?? [];
  const ratingByStar = Object.fromEntries(ratingRaw.map((item) => [item.stars, Number(item.count ?? 0)]));
  const ratingDistribution = [1, 2, 3, 4, 5].map((stars) => ({
    name: `${stars}★`,
    value: ratingByStar[stars] ?? 0,
    color: stars >= 4 ? '#22c55e' : stars === 3 ? '#f59e0b' : '#ef4444',
  }));

  const problemasByStatus = ((raw.problemasByStatus as Array<{ status: string; count: number }>) ?? []).map((item) => ({
    name: PROBLEMA_STATUS_LABELS[item.status] ?? item.status,
    value: Number(item.count ?? 0),
    color: PROBLEMA_STATUS_COLORS[item.status] ?? '#6b7280',
  }));

  const deviceBreakdown = ((raw.deviceBreakdown as ChartDataPoint[]) ?? []).map((item, index) => ({
    name: item.name,
    value: Number(item.value ?? 0),
    color: CHART_DEVICE_COLORS[item.name] ?? CHART_COLORS[index % CHART_COLORS.length],
  }));

  const topPages = ((raw.topPages as ChartDataPoint[]) ?? []).map((item) => ({
    name: shortenPagePath(String(item.name)),
    value: Number(item.value ?? 0),
    color: '#3b82f6',
  }));

  return {
    totalEmpresas,
    empresasVerificadas,
    empresasDestaque,
    empresasPendentes: Number(raw.empresasPendentes ?? 0),
    totalUsuarios,
    usuariosByType,
    totalEventos,
    totalAvaliacoes,
    mediaAvaliacoes: String(raw.mediaAvaliacoes ?? '0'),
    totalCupons,
    totalCategorias: Number(raw.totalCategorias ?? 0),
    totalCidades: Number(raw.totalCidades ?? 0),
    totalProdutos,
    totalVagas,
    totalServicos,
    totalProblemas,
    problemasResolvidos: Number(raw.problemasResolvidos ?? 0),
    totalFavoritos,
    totalEnquetes: Number(raw.totalEnquetes ?? 0),
    totalVisualizacoes: Number(raw.totalVisualizacoes ?? 0),
    totalCurtidas: Number(raw.totalCurtidas ?? 0),
    totalStories,
    totalBanners: Number(raw.totalBanners ?? 0),
    totalCanalPosts: Number(raw.totalCanalPosts ?? 0),
    totalLugaresPublicos: Number(raw.totalLugaresPublicos ?? 0),
    totalAgendamentos,
    totalTrackingEvents: Number(raw.totalTrackingEvents ?? 0),
    totalPageViews: Number(raw.totalPageViews ?? 0),
    totalClicks: Number(raw.totalClicks ?? 0),
    totalNotifications: Number(raw.totalNotifications ?? 0),
    overviewChart: [
      { name: 'Locais', value: totalEmpresas, color: '#3b82f6' },
      { name: 'Usuários', value: totalUsuarios, color: '#8b5cf6' },
      { name: 'Eventos', value: totalEventos, color: '#06b6d4' },
      { name: 'Avaliações', value: totalAvaliacoes, color: '#f59e0b' },
      { name: 'Cupons', value: totalCupons, color: '#22c55e' },
      { name: 'Produtos', value: totalProdutos, color: '#ec4899' },
    ],
    empresasDistribution: [
      { name: 'Verificadas', value: empresasVerificadas, color: '#22c55e' },
      { name: 'Destaque', value: empresasDestaque, color: '#f59e0b' },
      { name: 'Normais', value: empresasNormais, color: '#94a3b8' },
    ],
    usuariosByTypeChart: Object.entries(usuariosByType).map(([type, value]) => ({
      name: USER_TYPE_LABELS[type] ?? type,
      value: Number(value),
      color: USER_TYPE_COLORS[type] ?? '#6b7280',
    })),
    monthlyGrowth: months.map((month) => {
      const entry = monthlyByKey[month.key];
      return {
        month: month.label,
        empresas: Number(entry?.empresas ?? 0),
        usuarios: Number(entry?.usuarios ?? 0),
        eventos: Number(entry?.eventos ?? 0),
        pageViews: Number(entry?.pageViews ?? 0),
      };
    }),
    topCidades,
    ratingDistribution,
    problemasByStatus,
    contentOverview: [
      { name: 'Vagas', value: totalVagas, color: '#3b82f6' },
      { name: 'Serviços', value: totalServicos, color: '#8b5cf6' },
      { name: 'Problemas', value: totalProblemas, color: '#ef4444' },
      { name: 'Favoritos', value: totalFavoritos, color: '#ec4899' },
      { name: 'Stories', value: totalStories, color: '#06b6d4' },
      { name: 'Agendamentos', value: totalAgendamentos, color: '#22c55e' },
    ],
    deviceBreakdown,
    topPages,
  };
}

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ec4899'];

const CHART_DEVICE_COLORS: Record<string, string> = {
  desktop: '#3b82f6',
  mobile: '#8b5cf6',
  tablet: '#06b6d4',
  desconhecido: '#94a3b8',
};

function shortenPagePath(path: string) {
  if (path.length <= 28) return path;
  return `${path.slice(0, 25)}...`;
}

// Define the tipo_conta enum to match the database
type TipoConta = 'usuario' | 'empresa' | 'criador_empresa' | 'admin_cidade' | 'admin_geral';

// Hook para buscar estatísticas gerais
export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data: empresas } = await supabase
        .from('empresas')
        .select('id, ativo, verificado, destaque, status_aprovacao')
        .eq('ativo', true);

      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, tipo_conta');

      const { data: eventos } = await supabase
        .from('eventos')
        .select('id, ativo')
        .eq('ativo', true);

      const { data: avaliacoes } = await supabase
        .from('avaliacoes')
        .select('id, nota');

      const { data: cupons } = await supabase
        .from('cupons')
        .select('id, ativo')
        .eq('ativo', true);

      const { data: empresasPendentes } = await supabase
        .from('empresas')
        .select('id')
        .eq('status_aprovacao', 'pendente');

      return {
        totalEmpresas: empresas?.length || 0,
        empresasVerificadas: empresas?.filter(e => e.verificado).length || 0,
        empresasDestaque: empresas?.filter(e => e.destaque).length || 0,
        empresasPendentes: empresasPendentes?.length || 0,
        totalUsuarios: usuarios?.length || 0,
        usuariosEmpresa: usuarios?.filter(u => u.tipo_conta === 'empresa').length || 0,
        totalEventos: eventos?.length || 0,
        totalAvaliacoes: avaliacoes?.length || 0,
        mediaAvaliacoes: avaliacoes?.length ? 
          (avaliacoes.reduce((acc, a) => acc + a.nota, 0) / avaliacoes.length).toFixed(1) : '0',
        totalCupons: cupons?.length || 0,
      };
    },
  });
};

export const useSiteStats = () => {
  return useQuery({
    queryKey: ['site-stats'],
    queryFn: async (): Promise<SiteStats> => {
      const { data, error } = await supabase.rpc('get_admin_site_stats');

      if (error) {
        throw new Error(error.message || 'Erro ao carregar estatísticas');
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Resposta inválida do servidor de estatísticas');
      }

      return mapAdminSiteStatsPayload(data as Record<string, unknown>);
    },
    staleTime: 60_000,
    retry: 1,
  });
};

// Hook para gerenciar usuários com segurança
export const useAdminUsuarios = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const usuariosQuery = useQuery({
    queryKey: ['admin-usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          *,
          cidades(nome)
        `)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Get current user profile to check permissions
  const currentUserQuery = useQuery({
    queryKey: ['current-user-profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('tipo_conta, cidade_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id || '')
        .single();

      if (error) throw error;
      return data;
    },
  });

  const updateUsuarioMutation = useMutation({
    mutationFn: async ({ id, tipo_conta }: { id: string; tipo_conta: TipoConta }) => {
      // Client-side validation (server will also validate)
      const currentUser = currentUserQuery.data;
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      // Check if user can assign this role
      if (currentUser.tipo_conta === 'admin_cidade' && tipo_conta === 'admin_geral') {
        throw new Error('Admin de cidade não pode criar Admin Geral');
      }

      if (currentUser.tipo_conta !== 'admin_geral' && currentUser.tipo_conta !== 'admin_cidade') {
        throw new Error('Acesso negado: permissões insuficientes');
      }

      const { error } = await supabase
        .from('usuarios')
        .update({ tipo_conta })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] });
      toast({ title: 'Usuário atualizado com sucesso!' });
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Erro ao atualizar usuário';
      toast({ 
        title: 'Erro de Segurança', 
        description: errorMessage,
        variant: 'destructive' 
      });
    },
  });

  const deleteUsuarioMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Client-side validation
      const currentUser = currentUserQuery.data;
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      // Only admin_geral and admin_cidade can delete users
      if (currentUser.tipo_conta !== 'admin_geral' && currentUser.tipo_conta !== 'admin_cidade') {
        throw new Error('Acesso negado: permissões insuficientes');
      }

      // Check if trying to delete another admin
      const userToDelete = usuariosQuery.data?.find(u => u.id === userId);
      if (userToDelete?.tipo_conta === 'admin_geral' && currentUser.tipo_conta !== 'admin_geral') {
        throw new Error('Apenas Admin Geral pode excluir outros Admin Geral');
      }

      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] });
      toast({ title: 'Usuário excluído com sucesso!' });
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Erro ao excluir usuário';
      toast({ 
        title: 'Erro de Segurança', 
        description: errorMessage,
        variant: 'destructive' 
      });
    },
  });

  // Function to check what roles current user can assign
  const getAvailableRoles = (): TipoConta[] => {
    const currentUser = currentUserQuery.data;
    if (!currentUser) return [];

    if (currentUser.tipo_conta === 'admin_geral') {
      return ['usuario', 'criador_empresa', 'empresa', 'admin_cidade', 'admin_geral'];
    } else if (currentUser.tipo_conta === 'admin_cidade') {
      return ['usuario', 'criador_empresa', 'empresa'];
    }
    
    return [];
  };

  return {
    usuarios: usuariosQuery.data || [],
    loading: usuariosQuery.isLoading || currentUserQuery.isLoading,
    updateUsuario: updateUsuarioMutation.mutate,
    deleteUsuario: deleteUsuarioMutation.mutate,
    refetch: usuariosQuery.refetch,
    currentUserRole: currentUserQuery.data?.tipo_conta,
    getAvailableRoles,
  };
};

// Hook para gerenciar categorias
export const useAdminCategorias = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const categoriasQuery = useQuery({
    queryKey: ['admin-categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome');

      if (error) throw error;
      return data;
    },
  });

  const toggleCategoriaMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('categorias')
        .update({ ativo })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categorias'] });
      toast({ title: 'Categoria atualizada com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar categoria', variant: 'destructive' });
    },
  });

  return {
    categorias: categoriasQuery.data || [],
    loading: categoriasQuery.isLoading,
    toggleCategoria: toggleCategoriaMutation.mutate,
    refetch: categoriasQuery.refetch,
  };
};
