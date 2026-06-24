
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NeonCard } from '@/components/ui/neon-card';
import { Badge } from '@/components/ui/badge';
import { useAdminStats } from '@/hooks/useAdminData';
import { 
  Building2, 
  Users, 
  Calendar, 
  Star, 
  TrendingUp,
  CheckCircle,
  Clock,
  Award
} from 'lucide-react';

export const DashboardSection = () => {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total de Locais',
      value: stats?.totalEmpresas || 0,
      icon: Building2,
      description: 'Locais ativos no sistema',
      variant: 'default' as const,
    },
    {
      title: 'Locais Pendentes',
      value: stats?.empresasPendentes || 0,
      icon: Clock,
      description: 'Aguardando aprovação',
      variant: 'secondary' as const,
      highlight: (stats?.empresasPendentes || 0) > 0,
    },
    {
      title: 'Locais Verificados',
      value: stats?.empresasVerificadas || 0,
      icon: CheckCircle,
      description: 'Com selo de verificação',
      variant: 'default' as const,
    },
    {
      title: 'Locais em Destaque',
      value: stats?.empresasDestaque || 0,
      icon: Award,
      description: 'Destacados na plataforma',
      variant: 'default' as const,
    },
    {
      title: 'Total de Usuários',
      value: stats?.totalUsuarios || 0,
      icon: Users,
      description: 'Usuários cadastrados',
      variant: 'default' as const,
    },
    {
      title: 'Usuários Local',
      value: stats?.usuariosEmpresa || 0,
      icon: Building2,
      description: 'Contas de locais',
      variant: 'default' as const,
    },
    {
      title: 'Total de Eventos',
      value: stats?.totalEventos || 0,
      icon: Calendar,
      description: 'Eventos ativos',
      variant: 'default' as const,
    },
    {
      title: 'Avaliações',
      value: stats?.totalAvaliacoes || 0,
      icon: Star,
      description: `Média: ${stats?.mediaAvaliacoes || '0'}`,
      variant: 'default' as const,
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral das atividades da plataforma
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          <TrendingUp className="w-4 h-4 mr-2" />
          Sistema ativo
        </Badge>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <NeonCard 
              key={card.title} 
              className={`relative ${card.highlight ? 'border-yellow-500 bg-yellow-50' : ''}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${card.highlight ? 'text-yellow-600' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${card.highlight ? 'text-yellow-700' : ''}`}>
                  {card.value.toLocaleString()}
                </div>
                <p className={`text-xs ${card.highlight ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                  {card.description}
                </p>
                {card.highlight && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-2 -right-2 bg-yellow-500 text-white"
                  >
                    Atenção
                  </Badge>
                )}
              </CardContent>
            </NeonCard>
          );
        })}
      </div>

      {(stats?.empresasPendentes || 0) > 0 && (
        <NeonCard className="border-yellow-500 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Clock className="w-5 h-5" />
              Locais Aguardando Aprovação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700">
              Existem <strong>{stats?.empresasPendentes}</strong> locais aguardando aprovação. 
              Acesse a seção "Locais Pendentes" para revisar e aprovar as solicitações.
            </p>
          </CardContent>
        </NeonCard>
      )}
    </div>
  );
};
