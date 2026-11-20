import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Clock3 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MeusAgendamentosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type BookingStatus = 'pendente' | 'confirmado' | 'cancelado' | 'concluido';

interface ClientBooking {
  id: string;
  empresa_id: string;
  empresa_nome: string;
  servico: string;
  data_agendamento: string;
  duracao_minutos: number;
  status: BookingStatus;
}

const labels: Record<BookingStatus, string> = {
  pendente: 'Aguardando confirmação',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
  concluido: 'Concluído',
};

const bookingDate = (date: string): string => {
  const parsed = new Date(date);
  if (!Number.isFinite(parsed.getTime())) return 'Data indisponível';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Bahia',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
};

export const MeusAgendamentosDialog = ({ open, onOpenChange }: MeusAgendamentosDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const bookingsQuery = useQuery({
    queryKey: ['meus-agendamentos', user?.id],
    enabled: open && Boolean(user?.id),
    queryFn: async (): Promise<ClientBooking[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('agendamentos')
        .select('id,empresa_id,servico,data_agendamento,duracao_minutos,status')
        .eq('cliente_usuario_id', user.id)
        .order('data_agendamento', { ascending: false })
        .limit(100);
      if (error) throw error;
      if (!data?.length) return [];

      const ids = [...new Set(data.map(item => item.empresa_id))];
      const { data: companies, error: companiesError } = await supabase
        .from('empresas')
        .select('id,nome')
        .in('id', ids);
      if (companiesError) throw companiesError;
      const names = new Map((companies || []).map(item => [item.id, item.nome]));
      return data.map(item => ({
        id: item.id,
        empresa_id: item.empresa_id,
        empresa_nome: names.get(item.empresa_id) || 'Empresa indisponível',
        servico: item.servico,
        data_agendamento: item.data_agendamento,
        duracao_minutos: item.duracao_minutos,
        status: item.status as BookingStatus,
      }));
    },
    staleTime: 30_000,
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('É necessário entrar na sua conta.');
      const { data, error } = await supabase
        .from('agendamentos')
        .update({ status: 'cancelado' })
        .eq('id', id)
        .eq('cliente_usuario_id', user.id)
        .in('status', ['pendente', 'confirmado'])
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Reserva já alterada ou sem permissão para cancelar.');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['meus-agendamentos', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      toast.success('Agendamento cancelado.');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Não foi possível cancelar.'),
  });

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen && cancel.isPending) return; onOpenChange(nextOpen); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Meus Agendamentos</DialogTitle>
          <DialogDescription>Confira suas reservas e cancele aquelas que ainda não foram concluídas.</DialogDescription>
        </DialogHeader>

        {bookingsQuery.isLoading ? (
          <p role="status" className="py-8 text-center text-sm text-muted-foreground">Carregando suas reservas...</p>
        ) : bookingsQuery.isError ? (
          <div role="alert" className="space-y-3 py-6 text-center">
            <p>Não foi possível carregar seus agendamentos.</p>
            <Button variant="outline" onClick={() => { void bookingsQuery.refetch(); }}>Tentar novamente</Button>
          </div>
        ) : !bookingsQuery.data?.length ? (
          <div className="space-y-2 py-8 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium">Nenhum agendamento encontrado</p>
            <p className="text-sm text-muted-foreground">As reservas feitas com sua conta aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookingsQuery.data.map(booking => (
              <div key={booking.id} className="space-y-3 rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold break-words">{booking.empresa_nome}</h3>
                    <p className="text-sm text-muted-foreground break-words">{booking.servico}</p>
                  </div>
                  <Badge variant={booking.status === 'cancelado' ? 'destructive' : booking.status === 'confirmado' ? 'default' : 'secondary'}>
                    {labels[booking.status] || booking.status}
                  </Badge>
                </div>
                <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Clock3 className="h-4 w-4 shrink-0" />{bookingDate(booking.data_agendamento)} · {booking.duracao_minutos} min
                </p>
                {['pendente', 'confirmado'].includes(booking.status) && (
                  <Button type="button" variant="outline" size="sm" className="min-h-10"
                    disabled={cancel.isPending}
                    onClick={() => {
                      if (window.confirm('Cancelar este agendamento? Esta ação não pode ser desfeita.')) {
                        cancel.mutate(booking.id);
                      }
                    }}>
                    {cancel.isPending ? 'Atualizando...' : 'Cancelar agendamento'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
