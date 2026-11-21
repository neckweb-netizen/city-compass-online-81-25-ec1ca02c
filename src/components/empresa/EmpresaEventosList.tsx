
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NeonCard } from '@/components/ui/neon-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EventoFormModal } from '@/components/forms/EventoFormModal';
import { EventoEditModal, type EventoEditavel } from './EventoEditModal';
import { usePlanoLimites } from '@/hooks/usePlanoLimites';
import { Plus, Calendar, MapPin, Clock, Users, Pencil } from 'lucide-react';

interface EmpresaEventosListProps {
  empresaId: string;
  isOwner?: boolean;
}

export const EmpresaEventosList = ({ empresaId, isOwner = false }: EmpresaEventosListProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingEvento, setEditingEvento] = useState<EventoEditavel | null>(null);
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null);
  const [checkingLimit, setCheckingLimit] = useState(false);
  const queryClient = useQueryClient();
  const { verificarLimiteEventos } = usePlanoLimites(empresaId);

  const { data: eventos, isLoading, isError, refetch } = useQuery({
    queryKey: ['empresa-eventos', empresaId, isOwner],
    queryFn: async () => {
      const now = new Date().toISOString();
      let query = supabase
        .from('eventos')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('data_inicio', { ascending: true });
      if (!isOwner) {
        query = query.eq('ativo', true)
          .eq('status_aprovacao', 'aprovado')
          .or(`data_fim.gte.${now},and(data_fim.is.null,data_inicio.gte.${now})`);
      }
      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!empresaId
  });

  const toggleVisibility = async (evento: { id: string; ativo: boolean; status_aprovacao: string }) => {
    if (statusPendingId || evento.status_aprovacao !== 'aprovado') return;
    setStatusPendingId(evento.id);
    try {
      const { data: updated, error } = await supabase
        .from('eventos')
        .update({ ativo: !evento.ativo })
        .eq('id', evento.id)
        .eq('empresa_id', empresaId)
        .eq('status_aprovacao', 'aprovado')
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!updated) throw new Error('Evento não encontrado ou sem permissão.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['empresa-eventos'] }),
        queryClient.invalidateQueries({ queryKey: ['eventos-publicos'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-eventos'] }),
      ]);
      toast.success(evento.ativo ? 'Evento ocultado do público.' : 'Evento publicado novamente.');
      void refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar a visibilidade.');
    } finally {
      setStatusPendingId(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="space-y-3 rounded-2xl border p-6 text-center">
        <p className="font-semibold">Não foi possível carregar os eventos.</p>
        <p className="text-sm text-muted-foreground">Verifique sua conexão e tente novamente.</p>
        <Button type="button" variant="outline" className="min-h-11" onClick={() => { void refetch(); }}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold">Eventos</h2>
        {isOwner && (
          <Button 
            onClick={async () => {
              if (checkingLimit) return;
              setCheckingLimit(true);
              try {
                if (await verificarLimiteEventos()) setShowForm(true);
              } catch {
                toast.error('Não foi possível conferir o plano desta empresa. Tente novamente.');
              } finally {
                setCheckingLimit(false);
              }
            }} 
            className="w-full sm:w-auto"
            disabled={checkingLimit}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Evento
          </Button>
        )}
      </div>

      {eventos && eventos.length > 0 ? (
        <div className="grid gap-4">
          {eventos.map((evento) => (
            <Card key={evento.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  {evento.imagem_url && (
                    <div className="w-full lg:w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={evento.imagem_url}
                        alt={evento.titulo}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                      <h3 className="font-semibold text-lg">{evento.titulo}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="default">
                          {evento.gratuito ? 'Gratuito' : 'Pago'}
                        </Badge>
                        {isOwner && (
                          <Badge variant={evento.status_aprovacao === 'aprovado' ? 'secondary' : 'outline'}>
                            {evento.status_aprovacao === 'aprovado' ? (evento.ativo ? 'Publicado' : 'Inativo')
                              : evento.status_aprovacao === 'rejeitado' ? 'Rejeitado' : 'Aguardando aprovação'}
                          </Badge>
                        )}
                        {evento.destaque && (
                          <Badge variant="secondary">Destaque</Badge>
                        )}
                      </div>
                    </div>
                    
                    {evento.descricao && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {evento.descricao}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDate(evento.data_inicio)}
                          {evento.data_fim && evento.data_fim !== evento.data_inicio && 
                            ` - ${formatDate(evento.data_fim)}`
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatTime(evento.data_inicio)}
                          {evento.hora_fim && ` - ${evento.hora_fim}`}
                        </span>
                      </div>
                      
                      {evento.local && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{evento.local}</span>
                        </div>
                      )}
                      
                      {evento.limite_participantes && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>
                            {evento.participantes_confirmados || 0}/{evento.limite_participantes} participantes
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {!evento.gratuito && evento.preco && (
                      <div className="mt-3">
                        <span className="font-bold text-lg text-primary">
                          R$ {evento.preco}
                        </span>
                      </div>
                    )}
                    {isOwner && (
                      <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
                        <Button type="button" variant="outline" size="sm" className="min-h-10"
                          disabled={!!statusPendingId} onClick={() => setEditingEvento(evento)}>
                          <Pencil className="mr-2 h-4 w-4" />Editar evento
                        </Button>
                        {evento.status_aprovacao === 'aprovado' && (
                          <Button type="button" variant="outline" size="sm" className="min-h-10"
                            disabled={!!statusPendingId}
                            onClick={() => { void toggleVisibility(evento); }}>
                            {statusPendingId === evento.id ? 'Atualizando...' : evento.ativo ? 'Ocultar evento' : 'Reativar evento'}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum evento disponível</h3>
            <p className="text-muted-foreground mb-4">
              Esta empresa ainda não possui eventos cadastrados.
            </p>
            {isOwner && (
              <Button 
                onClick={async () => {
                  const podecriar = await verificarLimiteEventos();
                  if (podecriar) {
                    setShowForm(true);
                  }
                }} 
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Evento
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {isOwner && editingEvento && (
        <EventoEditModal
          key={editingEvento.id}
          open
          empresaId={empresaId}
          evento={editingEvento}
          onOpenChange={(nextOpen) => { if (!nextOpen) setEditingEvento(null); }}
          onSaved={() => { void refetch(); }}
        />
      )}

      {isOwner && showForm && (
        <EventoFormModal
          open={showForm}
          onOpenChange={setShowForm}
          empresaId={empresaId}
          onSuccess={() => { void refetch(); setShowForm(false); }}
        />
      )}
    </div>
  );
};
