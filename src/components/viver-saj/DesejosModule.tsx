import { useMemo, useState } from 'react';
import { Bot, Building2, CheckCircle2, Loader2, MessageSquareText, Send, UserRound } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useMyLocalRequests } from '@/hooks/useViverSaj';
import { supabase } from '@/integrations/supabase/client';

const categories = ['Produto', 'Alimentação', 'Saúde', 'Casa e construção', 'Transporte', 'Serviço profissional', 'Outro'];

export function DesejosModule() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const requests = useMyLocalRequests(user?.id);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ titulo: '', descricao: '', categoria: '', bairro: '', faixa_orcamento: '', prazo: '' });

  const answered = useMemo(() => (requests.data ?? []).reduce((total, item) => total + (item.pedido_local_respostas?.length ?? 0), 0), [requests.data]);

  const submit = async () => {
    if (!user) {
      toast.error('Entre na sua conta para publicar o pedido e receber respostas.');
      return;
    }
    if (form.titulo.trim().length < 3 || form.descricao.trim().length < 10 || !form.categoria) {
      toast.error('Conte o que procura, escolha a categoria e dê um pouco mais de contexto.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('pedidos_locais' as any).insert({
      usuario_id: user.id,
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      categoria: form.categoria,
      bairro: form.bairro.trim() || null,
      faixa_orcamento: form.faixa_orcamento.trim() || null,
      prazo: form.prazo.trim() || null,
      receber_ofertas: true,
    });
    setSaving(false);
    if (error) {
      toast.error('Não foi possível publicar o pedido. Tente novamente.');
      return;
    }
    setForm({ titulo: '', descricao: '', categoria: '', bairro: '', faixa_orcamento: '', prazo: '' });
    await queryClient.invalidateQueries({ queryKey: ['viver-saj', 'pedidos'] });
    toast.success('Pedido publicado. Empresas compatíveis já podem responder.');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
      <Card className="overflow-hidden border-violet-500/20">
        <CardHeader className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
          <Badge className="mb-2 w-fit bg-white/15 text-white hover:bg-white/20">Conversa guiada, sem resultados aleatórios</Badge>
          <CardTitle className="flex items-center gap-2 text-2xl"><Bot className="h-6 w-6" /> O que você está procurando?</CardTitle>
          <p className="text-sm text-violet-50">Responda às perguntas abaixo. O pedido será mostrado apenas a empresas locais aptas a responder.</p>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <div className="rounded-2xl rounded-tl-sm bg-muted p-4 text-sm"><strong>Assistente SAJ:</strong> Primeiro, diga em poucas palavras o que você precisa.</div>
          <div className="space-y-2"><Label htmlFor="wish-title">O que procura?</Label><Input id="wish-title" value={form.titulo} onChange={e => setForm(v => ({ ...v, titulo: e.target.value }))} maxLength={120} placeholder="Ex.: eletricista para hoje, bolo de aniversário..." /></div>
          <div className="space-y-2"><Label htmlFor="wish-details">Algum detalhe importante?</Label><Textarea id="wish-details" value={form.descricao} onChange={e => setForm(v => ({ ...v, descricao: e.target.value }))} maxLength={1200} placeholder="Quantidade, preferência, tamanho, modelo ou serviço necessário." /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Categoria</Label><Select value={form.categoria} onValueChange={categoria => setForm(v => ({ ...v, categoria }))}><SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger><SelectContent>{categories.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="wish-neighborhood">Bairro ou região</Label><Input id="wish-neighborhood" value={form.bairro} onChange={e => setForm(v => ({ ...v, bairro: e.target.value }))} maxLength={80} placeholder="Opcional" /></div>
            <div className="space-y-2"><Label htmlFor="wish-budget">Faixa de preço</Label><Input id="wish-budget" value={form.faixa_orcamento} onChange={e => setForm(v => ({ ...v, faixa_orcamento: e.target.value }))} maxLength={80} placeholder="Ex.: até R$ 200" /></div>
            <div className="space-y-2"><Label htmlFor="wish-deadline">Para quando?</Label><Input id="wish-deadline" value={form.prazo} onChange={e => setForm(v => ({ ...v, prazo: e.target.value }))} maxLength={80} placeholder="Ex.: hoje à tarde" /></div>
          </div>
          {!user && <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">Você pode preencher agora, mas precisa entrar na conta para publicar e acompanhar respostas.</p>}
          <Button className="w-full" size="lg" onClick={() => void submit()} disabled={saving}>{saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />} Publicar pedido</Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3"><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Seus pedidos</p><p className="text-3xl font-black">{requests.data?.length ?? 0}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Respostas recebidas</p><p className="text-3xl font-black text-violet-600">{answered}</p></CardContent></Card></div>
        {!user ? <Card><CardContent className="py-12 text-center"><UserRound className="mx-auto h-9 w-9 text-muted-foreground" /><h3 className="mt-3 font-black">Acompanhe tudo com privacidade</h3><p className="mt-1 text-sm text-muted-foreground">Entre na conta pelo botão do topo. Seu pedido não mostra telefone nem dados pessoais publicamente.</p></CardContent></Card> : requests.isLoading ? <Loader2 className="mx-auto mt-12 h-7 w-7 animate-spin" /> : (requests.data ?? []).length === 0 ? <Card><CardContent className="py-12 text-center"><MessageSquareText className="mx-auto h-9 w-9 text-muted-foreground" /><h3 className="mt-3 font-black">Nenhum pedido ainda</h3><p className="mt-1 text-sm text-muted-foreground">Seu histórico e as respostas aparecerão aqui.</p></CardContent></Card> : (requests.data ?? []).map(request => <Card key={request.id}><CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><CardTitle className="text-base">{request.titulo}</CardTitle><Badge variant={request.status === 'aberto' ? 'default' : 'secondary'}>{request.status}</Badge></div><p className="text-xs text-muted-foreground">{new Date(request.criado_em).toLocaleDateString('pt-BR')} · {request.categoria}</p></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">{request.descricao}</p>{request.pedido_local_respostas?.map(answer => <div key={answer.id} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3"><p className="flex items-center gap-2 text-sm font-bold"><Building2 className="h-4 w-4" />{answer.empresas?.nome ?? 'Empresa local'} <CheckCircle2 className="h-4 w-4 text-emerald-600" /></p><p className="mt-1 text-sm">{answer.mensagem}</p>{answer.preco_estimado && <Badge variant="outline" className="mt-2">{answer.preco_estimado}</Badge>}</div>)}</CardContent></Card>)}
      </div>
    </div>
  );
}

