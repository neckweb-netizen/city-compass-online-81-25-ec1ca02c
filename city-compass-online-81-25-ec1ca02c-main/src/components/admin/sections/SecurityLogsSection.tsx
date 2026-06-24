
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, User, Shield, AlertTriangle, LogIn, LogOut, UserPlus } from 'lucide-react';

interface SecurityLog {
  id: string;
  event_type: string;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: any;
  created_at: string;
}

interface SecurityDashboard {
  event_type: string;
  event_count: number;
  unique_users: number;
  unique_ips: number;
}

interface SecurityDashboardTemp {
  event_type: string;
  event_count: number;
  unique_users: Set<string>;
  unique_ips: Set<string>;
}

export const SecurityLogsSection = () => {
  const [filterEventType, setFilterEventType] = useState<string>('all');

  const { data: securityLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['security-logs', filterEventType],
    queryFn: async () => {
      let query = supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (filterEventType !== 'all') {
        query = query.eq('event_type', filterEventType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SecurityLog[];
    },
  });

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['security-dashboard'],
    queryFn: async () => {
      // Get recent logs from the last 7 days for dashboard
      const { data, error } = await supabase
        .from('security_logs')
        .select('event_type, user_id, ip_address, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Process data to create dashboard statistics
      const eventStats: Record<string, SecurityDashboardTemp> = {};
      
      data.forEach(log => {
        if (!eventStats[log.event_type]) {
          eventStats[log.event_type] = {
            event_type: log.event_type,
            event_count: 0,
            unique_users: new Set<string>(),
            unique_ips: new Set<string>()
          };
        }
        
        eventStats[log.event_type].event_count++;
        if (log.user_id) eventStats[log.event_type].unique_users.add(log.user_id);
        if (log.ip_address) eventStats[log.event_type].unique_ips.add(log.ip_address);
      });

      // Convert sets to counts
      return Object.values(eventStats).map(stat => ({
        event_type: stat.event_type,
        event_count: stat.event_count,
        unique_users: stat.unique_users.size,
        unique_ips: stat.unique_ips.size
      }));
    },
  });

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'login_success':
        return LogIn;
      case 'login_failed':
        return AlertTriangle;
      case 'logout':
        return LogOut;
      case 'signup_success':
        return UserPlus;
      case 'user_creation':
        return User;
      default:
        return Shield;
    }
  };

  const getEventBadgeVariant = (eventType: string) => {
    switch (eventType) {
      case 'login_success':
      case 'signup_success':
      case 'user_creation':
        return 'default' as const;
      case 'login_failed':
      case 'unauthorized_access':
      case 'suspicious_activity':
        return 'destructive' as const;
      case 'logout':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const formatEventType = (eventType: string) => {
    const eventMap: Record<string, string> = {
      'login_success': 'Login Sucesso',
      'login_failed': 'Login Falhado',
      'logout': 'Logout',
      'signup_success': 'Cadastro Sucesso',
      'user_creation': 'Criação de Usuário',
      'unauthorized_access': 'Acesso Negado',
      'suspicious_activity': 'Atividade Suspeita'
    };

    return eventMap[eventType] || eventType;
  };

  if (logsLoading || dashboardLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-blue-900">Logs de Segurança</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando logs de segurança...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-blue-900">Logs de Segurança</h2>
          <p className="text-muted-foreground">
            Monitoramento de eventos de segurança do sistema
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={filterEventType} onValueChange={setFilterEventType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os eventos</SelectItem>
              <SelectItem value="login_success">Login Sucesso</SelectItem>
              <SelectItem value="login_failed">Login Falhado</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
              <SelectItem value="signup_success">Cadastro</SelectItem>
              <SelectItem value="user_creation">Criação de Usuário</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dashboard Summary */}
      {dashboardData && dashboardData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardData.slice(0, 4).map((item, index) => (
            <Card key={index} className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      {formatEventType(item.event_type)}
                    </p>
                    <p className="text-2xl font-bold text-blue-900">{item.event_count}</p>
                    <p className="text-xs text-blue-600">
                      {item.unique_users} usuários únicos
                    </p>
                  </div>
                  <div className="text-blue-400">
                    {(() => {
                      const IconComponent = getEventIcon(item.event_type);
                      return <IconComponent className="h-8 w-8" />;
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Security Logs */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Shield className="w-5 h-5" />
            Eventos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {securityLogs?.map((log) => {
                const IconComponent = getEventIcon(log.event_type);
                
                return (
                  <Card key={log.id} className="bg-white border-blue-100">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={getEventBadgeVariant(log.event_type)} 
                              className="flex items-center gap-1"
                            >
                              <IconComponent className="w-3 h-3" />
                              {formatEventType(log.event_type)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              <p className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <strong>Data:</strong> {new Date(log.created_at).toLocaleString('pt-BR')}
                              </p>
                              <p className="flex items-center gap-1 text-muted-foreground">
                                <User className="w-4 h-4" />
                                <strong>IP:</strong> {log.ip_address || 'Desconhecido'}
                              </p>
                            </div>
                            
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                <strong>User ID:</strong> {log.user_id ? log.user_id.slice(0, 8) + '...' : 'Sistema'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                <strong>User Agent:</strong> {log.user_agent ? log.user_agent.slice(0, 50) + '...' : 'N/A'}
                              </p>
                            </div>
                          </div>

                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                              <strong>Metadata:</strong>
                              <pre className="mt-1 text-xs text-gray-600">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {(!securityLogs || securityLogs.length === 0) && (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum log de segurança encontrado.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
