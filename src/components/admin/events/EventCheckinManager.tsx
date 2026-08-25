import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ClipboardCheck, Undo2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const EventCheckinManager = ({ eventoId }: { eventoId: string }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: inscritos = [] } = useQuery({
    queryKey: ['admin-evento-checkins', eventoId],
    queryFn: async () => {
      const [{ data: inscricoes, error }, { data: checkins, error: checkinError }] = await Promise.all([
        supabase.from('evento_inscricoes').select('id, nome, acompanhantes, status').eq('evento_id', eventoId).eq('status', 'confirmado').order('nome'),
        supabase.from('evento_checkins').select('id, inscricao_id, realizado_em').eq('evento_id', eventoId),
      ]);
      if (error) throw error;
      if (checkinError) throw checkinError;
      const mapa = new Map((checkins || []).map((item) => [item.inscricao_id, item]));
      return (inscricoes || []).map((item) => ({ ...item, checkin: mapa.get(item.id) }));
    },
  });

  const alternar = async (inscricao: typeof inscritos[number]) => {
    if (!user) return;
    const result = inscricao.checkin
      ? await supabase.from('evento_checkins').delete().eq('id', inscricao.checkin.id)
      : await supabase.from('evento_checkins').insert({ evento_id: eventoId, inscricao_id: inscricao.id, realizado_por: user.id });
    if (result.error) return toast({ title: 'Erro no check-in', description: result.error.message, variant: 'destructive' });
    queryClient.invalidateQueries({ queryKey: ['admin-evento-checkins', eventoId] });
  };

  const presentes = inscritos.filter((item) => item.checkin).length;
  return <div className="mt-4 rounded-xl border bg-muted/20 p-4"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 font-semibold"><ClipboardCheck className="h-4 w-4 text-primary" />Controle de entrada</div><Badge variant="outline">{presentes}/{inscritos.length} presentes</Badge></div>{inscritos.length ? <div className="max-h-64 space-y-2 overflow-auto">{inscritos.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-background p-3"><div><p className="text-sm font-medium">{item.nome}</p><p className="text-xs text-muted-foreground">{item.acompanhantes ? `+ ${item.acompanhantes} acompanhante(s)` : 'Sem acompanhantes'}</p></div><Button size="sm" variant={item.checkin ? 'outline' : 'default'} onClick={() => alternar(item)}>{item.checkin ? <><Undo2 className="mr-1 h-4 w-4" />Desfazer</> : <><CheckCircle2 className="mr-1 h-4 w-4" />Check-in</>}</Button></div>)}</div> : <p className="text-sm text-muted-foreground">Nenhuma presença confirmada.</p>}</div>;
};
