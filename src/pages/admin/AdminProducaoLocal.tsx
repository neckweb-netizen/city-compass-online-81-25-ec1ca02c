import { useEffect, useMemo, useState } from 'react';
import { Check, ExternalLink, LayoutList, Loader2, MapPin, RefreshCw, Sprout, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ProdutorLocal } from '@/hooks/useProducaoLocal';
import { supabase } from '@/integrations/supabase/client';

type FilterStatus = 'pendente' | 'aprovado' | 'rejeitado';

export default function AdminProducaoLocal() {
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [configId, setConfigId] = useState<string | null>(null);
  const [produtores, setProdutores] = useState<ProdutorLocal[]>([]);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const [configResult, produtoresResult] = await Promise.all([
      supabase.from('configuracoes_sistema' as any).select('id,producao_local_ativa').limit(1).maybeSingle(),
      supabase.from('produtores_locais' as any).select('*').order('criado_em', { ascending: false }),
    ]);
    setLoading(false);
    if (configResult.error || produtoresResult.error) {
      toast.error('Não foi possível carregar a gestão da produção local.');
      return;
    }
    setConfigId((configResult.data as any)?.id ?? null);
    setEnabled((configResult.data as any)?.producao_local_ativa === true);
    setProdutores((produtoresResult.data ?? []) as ProdutorLocal[]);
  };

  useEffect(() => { void load(); }, []);

  const saveEnabled = async (next: boolean) => {
    if (!configId) {
      toast.error('Configuração principal do site não encontrada.');
      return;
    }
    setSavingConfig(true);
    const { error } = await supabase.from('configuracoes_sistema' as any).update({ producao_local_ativa: next }).eq('id', configId);
    setSavingConfig(false);
    if (error) {
      toast.error('Não foi possível alterar a disponibilidade da página.');
      return;
    }
    setEnabled(next);
    toast.success(next ? 'Produção Local ativada.' : 'Produção Local desativada.');
  };

  const moderate = async (id: string, status: FilterStatus) => {
    setUpdatingId(id);
    const { data: authData } = await supabase.auth.getUser();
    const { error } = await supabase.from('produtores_locais' as any).update({
      status,
      ativo: status === 'aprovado',
      revisado_por: authData.user?.id ?? null,
      revisado_em: new Date().toISOString(),
    }).eq('id', id);
    setUpdatingId(null);
    if (error) {
      toast.error('Não foi possível revisar este cadastro.');
      return;
    }
    setProdutores(current => current.map(item => item.id === id ? { ...item, status, ativo: status === 'aprovado' } : item));
    toast.success(status === 'aprovado' ? 'Produtor aprovado e publicado.' : 'Cadastro rejeitado.');
  };

  const visible = useMemo(() => produtores.filter(item => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [item.nome_publico, item.comunidade, item.tipo, ...item.produtos].join(' ').toLowerCase().includes(term);
  }), [produtores, search]);

  const list = (status: FilterStatus) => visible.filter(item => item.status === status);
  const totals = useMemo(() => ({
    pendente: produtores.filter(item => item.status === 'pendente').length,
    aprovado: produtores.filter(item => item.status === 'aprovado').length,
    rejeitado: produtores.filter(item => item.status === 'rejeitado').length,
  }), [produtores]);

  const renderProducerList = (status: FilterStatus) => {
    const items = list(status);
    if (!items.length) return <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">Nenhum cadastro nesta situação.</CardContent></Card>;
    return <div className="grid gap-4 xl:grid-cols-2">{items.map(item => <Card key={item.id}><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>{item.nome_publico}</CardTitle><CardDescription className="mt-1 capitalize">{item.tipo.replace(/_/g, ' ')} · enviado em {new Date(item.criado_em).toLocaleDateString('pt-BR')}</CardDescription></div><Badge variant={status === 'aprovado' ? 'default' : status === 'rejeitado' ? 'destructive' : 'secondary'}>{status}</Badge></div></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">{item.descricao || 'Sem apresentação.'}</p>{item.comunidade && <p className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4" />{item.comunidade}</p>}<div className="flex flex-wrap gap-1.5">{item.produtos.map(produto => <Badge key={produto} variant="outline">{produto}</Badge>)}</div><div className="flex flex-wrap gap-2 text-xs text-muted-foreground">{item.varejo && <span>Varejo</span>}{item.atacado && <span>Atacado</span>}{item.entrega && <span>Entrega</span>}{item.telefone_whatsapp && <span>WhatsApp informado</span>}</div><div className="flex flex-wrap gap-2">{status !== 'aprovado' && <Button size="sm" onClick={() => void moderate(item.id, 'aprovado')} disabled={updatingId === item.id}><Check className="mr-1 h-4 w-4" /> Aprovar</Button>}{status !== 'rejeitado' && <Button size="sm" variant="destructive" onClick={() => void moderate(item.id, 'rejeitado')} disabled={updatingId === item.id}><X className="mr-1 h-4 w-4" /> Rejeitar</Button>}</div></CardContent></Card>)}</div>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-3"><div className="rounded-2xl bg-emerald-500/10 p-3"><Sprout className="h-6 w-6 text-emerald-600" /></div><div><h1 className="text-2xl font-black">Produção Local</h1><p className="text-sm text-muted-foreground">Aprove ou rejeite cadastros e controle a presença da produção local no SAJ TEM.</p></div></div></div><div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link to="/admin/home-sections"><LayoutList className="mr-2 h-4 w-4" /> Posição na página inicial</Link></Button><Button asChild variant="outline"><a href="/producao-local" target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Ver página pública</a></Button></div></div>

      <Card><CardHeader><CardTitle>Disponibilidade pública</CardTitle><CardDescription>Desative a área sem remover os dados cadastrados.</CardDescription></CardHeader><CardContent><div className="flex items-center justify-between gap-4 rounded-2xl border p-4"><div><Label htmlFor="production-enabled" className="text-base font-bold">Página Produção Local</Label><p className="text-sm text-muted-foreground">{enabled ? 'Visível no site e nos menus.' : 'Oculta para visitantes.'}</p></div><Switch id="production-enabled" checked={enabled} disabled={savingConfig || loading} onCheckedChange={next => void saveEnabled(next)} /></div></CardContent></Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-amber-500/30"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Aguardando análise</p><p className="mt-1 text-3xl font-black text-amber-600">{totals.pendente}</p></CardContent></Card>
        <Card className="border-emerald-500/30"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Aprovados e publicados</p><p className="mt-1 text-3xl font-black text-emerald-600">{totals.aprovado}</p></CardContent></Card>
        <Card className="border-destructive/30"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Rejeitados</p><p className="mt-1 text-3xl font-black text-destructive">{totals.rejeitado}</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-3"><Input value={search} onChange={event => setSearch(event.target.value)} className="max-w-md" placeholder="Buscar produtor, comunidade ou produto" /><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar</Button></div>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div> : <Tabs defaultValue="pendente"><TabsList className="h-auto flex-wrap"><TabsTrigger value="pendente">Pendentes ({list('pendente').length})</TabsTrigger><TabsTrigger value="aprovado">Aprovados ({list('aprovado').length})</TabsTrigger><TabsTrigger value="rejeitado">Rejeitados ({list('rejeitado').length})</TabsTrigger></TabsList><TabsContent value="pendente" className="mt-5">{renderProducerList('pendente')}</TabsContent><TabsContent value="aprovado" className="mt-5">{renderProducerList('aprovado')}</TabsContent><TabsContent value="rejeitado" className="mt-5">{renderProducerList('rejeitado')}</TabsContent></Tabs>}
    </div>
  );
}
