import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, User, AlertTriangle, Shield } from 'lucide-react';

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_values: any;
  new_values: any;
  changed_by: string;
  changed_at: string;
  usuario_nome?: string;
  target_usuario_nome?: string;
}

export const AuditLogsSection = () => {
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      // First get the audit logs
      const { data: logs, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      // Then get user names separately to avoid relation issues
      const userIds = [...new Set([
        ...logs?.map(log => log.changed_by).filter(Boolean) || [],
        ...logs?.map(log => log.record_id).filter(Boolean) || []
      ])];

      const { data: usuarios, error: usuariosError } = await supabase
        .from('usuarios')
        .select('id, nome')
        .in('id', userIds);

      if (usuariosError) console.warn('Failed to fetch user names:', usuariosError);

      const userMap = usuarios?.reduce((acc, user) => {
        acc[user.id] = user.nome;
        return acc;
      }, {} as Record<string, string>) || {};

      return logs?.map(log => ({
        ...log,
        usuario_nome: userMap[log.changed_by] || 'Sistema',
        target_usuario_nome: userMap[log.record_id] || 'Usuário desconhecido'
      })) || [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-blue-900">Logs de Auditoria</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando logs...</p>
        </div>
      </div>
    );
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'UPDATE_ROLE':
        return { variant: 'secondary' as const, label: 'Alteração de Papel', icon: Shield };
      default:
        return { variant: 'outline' as const, label: action, icon: AlertTriangle };
    }
  };

  const formatRoleChange = (oldValues: any, newValues: any) => {
    const oldRole = oldValues?.tipo_conta;
    const newRole = newValues?.tipo_conta;
    
    if (oldRole && newRole) {
      return `${oldRole.replace('_', ' ')} → ${newRole.replace('_', ' ')}`;
    }
    
    return 'Alteração de dados';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-blue-900">Logs de Auditoria</h2>
          <p className="text-muted-foreground">
            Histórico de alterações administrativas no sistema
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {auditLogs?.length || 0} registros
        </Badge>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <AlertTriangle className="w-5 h-5" />
            Monitoramento de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {auditLogs?.map((log) => {
                const badgeInfo = getActionBadge(log.action);
                const IconComponent = badgeInfo.icon;
                
                return (
                  <Card key={log.id} className="bg-white border-blue-100">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={badgeInfo.variant} className="flex items-center gap-1">
                              <IconComponent className="w-3 h-3" />
                              {badgeInfo.label}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatRoleChange(log.old_values, log.new_values)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              <p className="flex items-center gap-1 text-blue-700">
                                <User className="w-4 h-4" />
                                <strong>Alterado por:</strong> {log.usuario_nome}
                              </p>
                              <p className="flex items-center gap-1 text-muted-foreground">
                                <User className="w-4 h-4" />
                                <strong>Usuário alvo:</strong> {log.target_usuario_nome}
                              </p>
                            </div>
                            
                            <div className="space-y-1">
                              <p className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <strong>Data:</strong> {new Date(log.changed_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ID: {log.id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {(!auditLogs || auditLogs.length === 0) && (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum log de auditoria encontrado.
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