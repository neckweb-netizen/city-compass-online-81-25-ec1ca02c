import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, CheckCircle2, Lock, LogIn, UserPlus, Users, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type EventoLista = {
  id: string;
  data_inicio: string;
  lista_participantes_ativa: boolean;
  lista_exibir_nomes: boolean;
  limite_participantes: number | null;
  participantes_confirmados: number | null;
  fila_espera_ativa: boolean;
  permitir_acompanhantes: boolean;
  limite_acompanhantes: number;
  inscricoes_encerram_em: string | null;
};

export const EventoGuestList = ({ evento }: { evento: EventoLista }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [nome, setNome] = useState(profile?.nome || user?.user_metadata?.nome || '');
  const [acompanhantes, setAcompanhantes] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const { data: inscricoes = [], isLoading } = useQuery({
    queryKey: ['evento-inscricoes', evento.id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evento_inscricoes')
        .select('id, nome, acompanhantes, status, usuario_id, criado_em')
        .eq('evento_id', evento.id)
        .order('criado_em');
      if (error) throw error;
      return data;
    },
  });

  const minhaInscricao = inscricoes.find((item) => item.usuario_id === user?.id);
  const confirmados = inscricoes.filter((item) => item.status === 'confirmado');
  const ocupadas = evento.participantes_confirmados || 0;
  const limite = evento.limite_participantes || 0;
  const lotado = limite > 0 && ocupadas >= limite;
  const encerramento = evento.inscricoes_encerram_em || evento.data_inicio;
  const encerrado = new Date(encerramento).getTime() < Date.now();
  const percentual = useMemo(() => limite ? Math.min(100, (ocupadas / limite) * 100) : 0, [ocupadas, limite]);

  const atualizar = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['evento-inscricoes', evento.id] }),
      queryClient.invalidateQueries({ queryKey: ['evento-detail', evento.id] }),
      queryClient.invalidateQueries({ queryKey: ['eventos'] }),
    ]);
  };

  const inscrever = async () => {
    if (!user) return setAuthOpen(true);
    if (nome.trim().length < 2) {
      toast({ title: 'Informe seu nome', description: 'Use pelo menos dois caracteres.', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    const { data, error } = await supabase.from('evento_inscricoes').insert({
      evento_id: evento.id,
      usuario_id: user.id,
      nome: nome.trim(),
      acompanhantes,
    }).select('status').single();
    setSalvando(false);
    if (error) {
      const mensagem = error.message.includes('duplicate') ? 'Você já está nesta lista.' : error.message;
      toast({ title: 'Não foi possível confirmar', description: mensagem, variant: 'destructive' });
      return;
    }
    toast({
      title: data.status === 'espera' ? 'Você entrou na fila de espera' : 'Presença confirmada!',
      description: data.status === 'espera' ? 'Avisaremos quando uma vaga for liberada.' : 'Seu lugar foi reservado com segurança.',
    });
    await atualizar();
  };

  const cancelar = async () => {
    if (!minhaInscricao) return;
    setSalvando(true);
    const { error } = await supabase.from('evento_inscricoes').delete().eq('id', minhaInscricao.id);
    setSalvando(false);
    if (error) {
      toast({ title: 'Erro ao cancelar', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Inscrição cancelada', description: 'A vaga foi liberada para outra pessoa.' });
    await atualizar();
  };

  if (!evento.lista_participantes_ativa) return null;

  return (
    <div className="rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-800">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Users className="h-5 w-5 text-violet-600" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Lista do evento</h3>
          </div>
          <p className="text-sm text-muted-foreground">Confirme sua presença e garanta sua vaga.</p>
        </div>
        {lotado && <Badge variant="secondary">Lotado</Badge>}
      </div>

      <div className="mb-5 rounded-2xl border bg-muted/30 p-4">
        <div className="mb-2 flex justify-between text-sm font-medium">
          <span>{ocupadas} {ocupadas === 1 ? 'presença' : 'presenças'}</span>
          <span>{limite ? `${Math.max(0, limite - ocupadas)} vagas` : 'Sem limite'}</span>
        </div>
        {limite > 0 && <Progress value={percentual} className="h-2" />}
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarClock className="h-4 w-4" />
          Inscrições até {new Date(encerramento).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
        </div>
      </div>

      {minhaInscricao ? (
        <div className="space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-semibold">{minhaInscricao.status === 'confirmado' ? 'Sua presença está confirmada' : 'Você está na fila de espera'}</p>
              <p className="text-sm text-muted-foreground">{minhaInscricao.nome}{minhaInscricao.acompanhantes ? ` + ${minhaInscricao.acompanhantes} acompanhante(s)` : ''}</p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline" className="w-full" disabled={salvando}><XCircle className="mr-2 h-4 w-4" />Cancelar inscrição</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Cancelar sua inscrição?</AlertDialogTitle><AlertDialogDescription>Sua vaga será liberada e poderá ser ocupada por outra pessoa.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Manter inscrição</AlertDialogCancel><AlertDialogAction onClick={cancelar}>Sim, cancelar</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <div className="space-y-4">
          {user ? (
            <>
              <div className="space-y-2"><Label htmlFor="nome-lista">Nome na lista</Label><Input id="nome-lista" value={nome} maxLength={100} onChange={(e) => setNome(e.target.value)} placeholder="Como você quer aparecer" /></div>
              {evento.permitir_acompanhantes && <div className="space-y-2"><Label htmlFor="acompanhantes">Acompanhantes</Label><Input id="acompanhantes" type="number" min={0} max={evento.limite_acompanhantes} value={acompanhantes} onChange={(e) => setAcompanhantes(Math.max(0, Math.min(evento.limite_acompanhantes, Number(e.target.value))))} /><p className="text-xs text-muted-foreground">Até {evento.limite_acompanhantes} por inscrição.</p></div>}
              <Button className="w-full" onClick={inscrever} disabled={salvando || encerrado || (lotado && !evento.fila_espera_ativa)}><UserPlus className="mr-2 h-4 w-4" />{encerrado ? 'Inscrições encerradas' : lotado && evento.fila_espera_ativa ? 'Entrar na fila de espera' : lotado ? 'Lista lotada' : 'Confirmar presença'}</Button>
            </>
          ) : <Button className="w-full" onClick={() => setAuthOpen(true)}><LogIn className="mr-2 h-4 w-4" />Entrar para participar</Button>}
        </div>
      )}

      <div className="mt-6 border-t pt-5">
        {evento.lista_exibir_nomes ? (
          <div><p className="mb-3 text-sm font-semibold">Participantes confirmados</p>{isLoading ? <p className="text-sm text-muted-foreground">Carregando lista...</p> : confirmados.length ? <ol className="max-h-56 space-y-2 overflow-auto">{confirmados.map((item, index) => <li key={item.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm"><span>{index + 1}. {item.nome}</span>{item.acompanhantes > 0 && <Badge variant="outline">+{item.acompanhantes}</Badge>}</li>)}</ol> : <p className="text-sm text-muted-foreground">Seja a primeira pessoa a confirmar presença.</p>}</div>
        ) : <div className="flex items-center gap-2 text-sm text-muted-foreground"><Lock className="h-4 w-4" />Os nomes desta lista são privados.</div>}
      </div>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab="login" />
    </div>
  );
};
