import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, MessageSquareText, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

type LocalRequestForBusiness = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  bairro: string | null;
  faixa_orcamento: string | null;
  prazo: string | null;
  criado_em: string;
  pedido_local_respostas: Array<{ id: string; empresa_id: string; mensagem: string; preco_estimado: string | null; status: string }>;
};

export function EmpresaPedidosLocais({ empresaId }: { empresaId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const requestsQuery = useQuery({
    queryKey: ['empresa', empresaId, 'pedidos-locais'],
    enabled: Boolean(user?.id && empresaId),
    queryFn: async () => {
      const { data, error } = await supabase.from('pedidos_locais' as any)
        .select('id,titulo,descricao,categoria,bairro,faixa_orcamento,prazo,criado_em,pedido_local_respostas(id,empresa_id,mensagem,preco_estimado,status)')
        .eq('status', 'aberto').eq('receber_ofertas', true).order('criado_em', { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as LocalRequestForBusiness[];
    },
  });

  const requests = useMemo(() => (requestsQuery.data ?? []).map(item => ({
    ...item,
    myReply: item.pedido_local_respostas?.find(reply => reply.empresa_id === empresaId) ?? null,
  })), [requestsQuery.data, empresaId]);

  const submit = async (requestId: string) => {
    if (!user || message.trim().length < 5) return toast.error('Escreva uma resposta com pelo menos 5 caracteres.');
    setSaving(true);
    const { error } = await supabase.from('pedido_local_respostas' as any).insert({
      pedido_id: requestId,
      empresa_id: empresaId,
      usuario_id: user.id,
      mensagem: message.trim(),
      preco_estimado: price.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error(error.code === '23505' ? 'Sua empresa já respondeu a este pedido.' : 'Não foi possível enviar a resposta.');
    setMessage(''); setPrice(''); setReplyingTo(null);
    await queryClient.invalidateQueries({ queryKey: ['empresa', empresaId, 'pedidos-locais'] });
    toast.success('Resposta enviada diretamente ao usuário.');
  };

  if (requestsQuery.isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin" /></div>;

  return <div className="space-y-4">
    <Card className="border-violet-500/20"><CardHeader><CardTitle className="flex items-center gap-2"><MessageSquareText className="h-5 w-5 text-violet-600" /> Pedidos do Viver SAJ</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Veja necessidades publicadas por moradores, confira a categoria e responda apenas quando sua empresa puder atender. O usuário recebe a resposta no próprio pedido.</p></CardContent></Card>
    {requests.length === 0 ? <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Nenhum pedido aberto no momento.</CardContent></Card> : requests.map(item => <Card key={item.id}><CardHeader><div className="flex flex-wrap items-start justify-between gap-2"><div><Badge variant="outline">{item.categoria}</Badge><CardTitle className="mt-2 text-lg">{item.titulo}</CardTitle></div>{item.myReply && <Badge className="bg-emerald-600"><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Respondido</Badge>}</div><p className="text-xs text-muted-foreground">{item.bairro || 'Região não informada'} · {new Date(item.criado_em).toLocaleDateString('pt-BR')}</p></CardHeader><CardContent className="space-y-3"><p className="text-sm leading-6 text-muted-foreground">{item.descricao}</p><div className="flex flex-wrap gap-2">{item.faixa_orcamento && <Badge variant="secondary">Orçamento: {item.faixa_orcamento}</Badge>}{item.prazo && <Badge variant="secondary">Prazo: {item.prazo}</Badge>}</div>{item.myReply ? <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3"><p className="text-sm font-bold">Sua resposta</p><p className="mt-1 text-sm">{item.myReply.mensagem}</p>{item.myReply.preco_estimado && <p className="mt-1 text-xs text-muted-foreground">Estimativa: {item.myReply.preco_estimado}</p>}</div> : replyingTo === item.id ? <div className="space-y-3 rounded-xl border p-4"><div className="space-y-2"><Label htmlFor={`reply-${item.id}`}>Como sua empresa pode atender?</Label><Textarea id={`reply-${item.id}`} value={message} onChange={event => setMessage(event.target.value)} maxLength={700} placeholder="Explique a solução, disponibilidade e como continuar o contato." /></div><div className="space-y-2"><Label htmlFor={`price-${item.id}`}>Preço estimado (opcional)</Label><Input id={`price-${item.id}`} value={price} onChange={event => setPrice(event.target.value)} maxLength={80} placeholder="Ex.: a partir de R$ 80" /></div><div className="flex gap-2"><Button onClick={() => void submit(item.id)} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Enviar resposta</Button><Button variant="ghost" onClick={() => { setReplyingTo(null); setMessage(''); setPrice(''); }}>Cancelar</Button></div></div> : <Button onClick={() => setReplyingTo(item.id)}><MessageSquareText className="mr-2 h-4 w-4" /> Responder pedido</Button>}</CardContent></Card>)}
  </div>;
}
