import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Phone, MessageSquare } from 'lucide-react';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AgendamentosEmpresaProps {
  empresaId: string;
}

const statusColors = {
  pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmado: 'bg-green-100 text-green-800 border-green-200',
  cancelado: 'bg-red-100 text-red-800 border-red-200',
  concluido: 'bg-blue-100 text-blue-800 border-blue-200'
};

const statusLabels = {
  pendente: 'Pendente',
  confirmado: 'Confirmado', 
  cancelado: 'Cancelado',
  concluido: 'Concluído'
};

export const AgendamentosEmpresa: React.FC<AgendamentosEmpresaProps> = ({ empresaId }) => {
  const { agendamentos, isLoading, atualizarStatus } = useAgendamentos(empresaId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando agendamentos...</p>
        </CardContent>
      </Card>
    );
  }

  const agendamentosOrdenados = agendamentos
    .sort((a, b) => new Date(a.data_agendamento).getTime() - new Date(b.data_agendamento).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Agendamentos
        </CardTitle>
        <CardDescription>
          Gerencie os agendamentos da sua empresa
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {agendamentos.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
            <p className="text-sm text-muted-foreground mt-2">
              Os agendamentos aparecerão aqui quando os clientes marcarem horários
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {agendamentosOrdenados.map((agendamento) => (
              <div 
                key={agendamento.id} 
                className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{agendamento.nome_cliente}</span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={statusColors[agendamento.status as keyof typeof statusColors]}
                  >
                    {statusLabels[agendamento.status as keyof typeof statusLabels]}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {agendamento.telefone_cliente}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(agendamento.data_agendamento), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {format(new Date(agendamento.data_agendamento), 'HH:mm')}
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">Serviço:</span> {agendamento.servico}
                  </div>
                </div>

                {agendamento.observacoes && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
                    <MessageSquare className="w-4 h-4 mt-0.5" />
                    <span>{agendamento.observacoes}</span>
                  </div>
                )}

                {agendamento.status === 'pendente' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => atualizarStatus({ id: agendamento.id, status: 'confirmado' })}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => atualizarStatus({ id: agendamento.id, status: 'cancelado' })}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Cancelar
                    </Button>
                  </div>
                )}

                {agendamento.status === 'confirmado' && (
                  <Button
                    size="sm"
                    onClick={() => atualizarStatus({ id: agendamento.id, status: 'concluido' })}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Marcar como Concluído
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};