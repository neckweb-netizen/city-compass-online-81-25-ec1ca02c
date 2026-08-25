import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export const EventoRating = ({ eventoId, dataInicio, ativo }: { eventoId: string; dataInicio: string; ativo: boolean }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');
  const [salvando, setSalvando] = useState(false);
  const encerrado = new Date(dataInicio).getTime() <= Date.now();

  const { data: avaliacoes = [] } = useQuery({
    queryKey: ['evento-avaliacoes', eventoId],
    queryFn: async () => {
      const { data, error } = await supabase.from('evento_avaliacoes').select('id, nota, comentario, criado_em').eq('evento_id', eventoId).order('criado_em', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: ativo,
  });

  if (!ativo) return null;
  const media = avaliacoes.length ? avaliacoes.reduce((soma, item) => soma + item.nota, 0) / avaliacoes.length : 0;

  const salvar = async () => {
    if (!user) return toast({ title: 'Entre na sua conta para avaliar', variant: 'destructive' });
    setSalvando(true);
    const { error } = await supabase.from('evento_avaliacoes').upsert({ evento_id: eventoId, usuario_id: user.id, nota, comentario: comentario.trim() || null, atualizado_em: new Date().toISOString() }, { onConflict: 'evento_id,usuario_id' });
    setSalvando(false);
    if (error) return toast({ title: 'Não foi possível avaliar', description: error.message, variant: 'destructive' });
    toast({ title: 'Avaliação registrada. Obrigado!' });
    setComentario('');
    queryClient.invalidateQueries({ queryKey: ['evento-avaliacoes', eventoId] });
  };

  return <div className="rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-800">
    <div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="text-xl font-bold">Avaliações</h3><p className="text-sm text-muted-foreground">{avaliacoes.length ? `${media.toFixed(1)} de 5 · ${avaliacoes.length} avaliação(ões)` : 'Ainda não há avaliações'}</p></div><div className="flex items-center gap-1 font-bold text-amber-500"><Star className="h-5 w-5 fill-current" />{media ? media.toFixed(1) : '—'}</div></div>
    {encerrado && user && <div className="mb-5 space-y-3 rounded-2xl border p-4"><p className="text-sm font-semibold">Como foi sua experiência?</p><div className="flex gap-1">{[1,2,3,4,5].map((valor) => <button key={valor} type="button" aria-label={`${valor} estrelas`} onClick={() => setNota(valor)}><Star className={`h-7 w-7 ${valor <= nota ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`} /></button>)}</div><Textarea value={comentario} maxLength={1000} onChange={(e) => setComentario(e.target.value)} placeholder="Conte o que achou (opcional)" /><Button onClick={salvar} disabled={salvando}>Salvar minha avaliação</Button></div>}
    <div className="space-y-3">{avaliacoes.slice(0, 5).map((item) => item.comentario && <div key={item.id} className="rounded-xl bg-muted/40 p-3"><div className="mb-1 flex gap-0.5">{Array.from({ length: item.nota }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}</div><p className="text-sm">{item.comentario}</p></div>)}</div>
  </div>;
};
