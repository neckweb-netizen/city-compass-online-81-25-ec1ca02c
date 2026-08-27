import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, Clock, MessageCircle, MessageSquare, Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [filtro, setFiltro] = useState('ativos');
  const [busca, setBusca] = useState('');

  // Função utilitária interna para converter datas com segurança e evitar quebras de tempo de execução
  const safeNewDate = (dateString: any): Date => {
    if (!dateString) return new Date();
    const parsedDate = new Date(dateString);
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  };

  const hoje = new Date().toDateString();
  const agendamentosOrdenados = useMemo(() => (Array.isArray(agendamentos) ? [...agendamentos] : [])
    .filter((item) => {
      const termo = busca.trim().toLowerCase();
      const corresponde = !termo || `${item.nome_cliente} ${item.telefone_cliente} ${item.servico}`.toLowerCase().includes(termo);
      if (!corresponde) return false;
      if (filtro === 'todos') return true;
      if (filtro === 'ativos') return ['pendente','confirmado'].includes(item.status) && safeNewDate(item.data_agendamento) >= new Date(new Date().setHours(0,0,0,0));
      return item.status === filtro;
    })
    .sort((a, b) => safeNewDate(a.data_agendamento).getTime() - safeNewDate(b.data_agendamento).getTime()), [agendamentos, busca, filtro]);

  const resumo = useMemo(() => ({
    hoje: agendamentos.filter(a => safeNewDate(a.data_agendamento).toDateString() === hoje && !['cancelado'].includes(a.status)).length,
    pendentes: agendamentos.filter(a => a.status === 'pendente').length,
    confirmados: agendamentos.filter(a => a.status === 'confirmado').length,
    concluidos: agendamentos.filter(a => a.status === 'concluido').length,
  }), [agendamentos, hoje]);

  const abrirWhatsApp = (telefone: string, nome: string, data: Date) => {
    const numero = telefone.replace(/\D/g, '');
    const destino = numero.startsWith('55') ? numero : `55${numero}`;
    const texto = encodeURIComponent(`Olá, ${nome}! Entramos em contato sobre seu agendamento de ${format(data, "dd/MM 'às' HH:mm", { locale: ptBR })}.`);
    window.open(`https://wa.me/${destino}?text=${texto}`, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) return <Card><CardHeader><CardTitle>Agendamentos</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Carregando agendamentos...</p></CardContent></Card>;

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
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{[
          ['Hoje', resumo.hoje], ['Pendentes', resumo.pendentes], ['Confirmados', resumo.confirmados], ['Concluídos', resumo.concluidos]
        ].map(([label, valor]) => <div key={String(label)} className="rounded-xl border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">{label}</p><b className="text-2xl">{valor}</b></div>)}</div>

        <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_190px]"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar cliente, telefone ou serviço" className="pl-9"/></div><Select value={filtro} onValueChange={setFiltro}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ativos">Próximos ativos</SelectItem><SelectItem value="pendente">Pendentes</SelectItem><SelectItem value="confirmado">Confirmados</SelectItem><SelectItem value="concluido">Concluídos</SelectItem><SelectItem value="cancelado">Cancelados</SelectItem><SelectItem value="todos">Todos</SelectItem></SelectContent></Select></div>

        {agendamentosOrdenados.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
            <p className="text-sm text-muted-foreground mt-2">
              Os agendamentos aparecerão aqui quando os clientes marcarem horários
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {agendamentosOrdenados.map((agendamento) => {
              const dataValida = safeNewDate(agendamento.data_agendamento);
              
              return (
                <div 
                  key={agendamento.id} 
                  className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{agendamento.nome_cliente || 'Cliente'}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={statusColors[agendamento.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}
                    >
                      {statusLabels[agendamento.status as keyof typeof statusLabels] || agendamento.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageCircle className="w-4 h-4" />
                      {agendamento.telefone_cliente || 'Não informado'}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {format(dataValida, 'dd/MM/yyyy', { locale: ptBR })}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {format(dataValida, 'HH:mm')} · {agendamento.duracao_minutos || 60} min
                    </div>

                    <div className="text-sm">
                      <span className="font-medium">Serviço:</span> {agendamento.servico || 'Não especificado'}
                    </div>
                  </div>

                  {agendamento.observacoes && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
                      <MessageSquare className="w-4 h-4 mt-0.5" />
                      <span>{agendamento.observacoes}</span>
                    </div>
                  )}

                  {agendamento.status === 'pendente' && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => atualizarStatus({ id: agendamento.id, status: 'confirmado' })}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Confirmar
                      </Button>
                      <Button size="sm" variant="outline" onClick={()=>abrirWhatsApp(agendamento.telefone_cliente,agendamento.nome_cliente,dataValida)}><MessageCircle className="mr-1 h-4 w-4"/>WhatsApp</Button>
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
                    <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => atualizarStatus({ id: agendamento.id, status: 'concluido' })} className="bg-blue-600 hover:bg-blue-700"><CheckCircle2 className="mr-1 h-4 w-4"/>Marcar como concluído</Button><Button size="sm" variant="outline" onClick={()=>abrirWhatsApp(agendamento.telefone_cliente,agendamento.nome_cliente,dataValida)}><MessageCircle className="mr-1 h-4 w-4"/>WhatsApp</Button></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
