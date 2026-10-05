import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Check, ExternalLink, HeartPulse, Landmark, Lightbulb, Loader2, RefreshCw, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { HealthService, InnovationChallenge, LocalRequest, ViverSajModule } from '@/features/viver-saj/types';
import { supabase } from '@/integrations/supabase/client';

const emptyHealth = { nome: '', tipo: 'ubs', descricao: '', endereco: '', bairro: '', telefone: '', horario: '', atendimento_sus: true, atendimento_24h: false, servicos: '', fonte_nome: 'CNES — Ministério da Saúde', fonte_url: 'https://cnes.datasus.gov.br/' };
const emptyChallenge = { titulo: '', descricao: '', area: '', proponente: '', prazo: '', status: 'rascunho' };

export default function AdminViverSaj() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState<ViverSajModule[]>([]);
  const [requests, setRequests] = useState<LocalRequest[]>([]);
  const [health, setHealth] = useState<HealthService[]>([]);
  const [challenges, setChallenges] = useState<InnovationChallenge[]>([]);
  const [healthForm, setHealthForm] = useState(emptyHealth);
  const [challengeForm, setChallengeForm] = useState(emptyChallenge);

  const load = async () => {
    setLoading(true);
    const [moduleResult, requestResult, healthResult, challengeResult] = await Promise.all([
      supabase.from('viver_saj_modulos' as any).select('*').order('ordem'),
      supabase.from('pedidos_locais' as any).select('*').order('criado_em', { ascending: false }).limit(100),
      supabase.from('servicos_saude_saj' as any).select('*').order('atendimento_24h', { ascending: false }).order('nome'),
      supabase.from('desafios_inovacao' as any).select('*').order('criado_em', { ascending: false }),
    ]);
    setLoading(false);
    const error = moduleResult.error || requestResult.error || healthResult.error || challengeResult.error;
    if (error) { toast.error('Não foi possível carregar a gestão do Viver SAJ.'); return; }
    setModules((moduleResult.data ?? []) as ViverSajModule[]);
    setRequests((requestResult.data ?? []) as LocalRequest[]);
    setHealth((healthResult.data ?? []) as HealthService[]);
    setChallenges((challengeResult.data ?? []) as InnovationChallenge[]);
  };

  useEffect(() => { void load(); }, []);

  const saveModules = async (next: ViverSajModule[]) => {
    setSaving(true);
    const payload = next.map((item, index) => ({ chave: item.chave, titulo: item.titulo, descricao: item.descricao, ordem: index + 1, ativo: item.ativo }));
    const { error } = await supabase.from('viver_saj_modulos' as any).upsert(payload, { onConflict: 'chave' });
    setSaving(false);
    if (error) { toast.error('Não foi possível salvar a organização dos módulos.'); return; }
    setModules(next.map((item, index) => ({ ...item, ordem: index + 1 })));
    toast.success('Organização pública atualizada.');
  };

  const moveModule = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= modules.length) return;
    const next = [...modules];
    [next[index], next[target]] = [next[target], next[index]];
    void saveModules(next);
  };

  const toggleModule = (key: string, active: boolean) => void saveModules(modules.map(item => item.chave === key ? { ...item, ativo: active } : item));

  const moderateRequest = async (id: string, status: LocalRequest['status']) => {
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from('pedidos_locais' as any).update({ status, revisado_por: auth.user?.id ?? null, revisado_em: new Date().toISOString() }).eq('id', id);
    if (error) return toast.error('Não foi possível atualizar o pedido.');
    setRequests(current => current.map(item => item.id === id ? { ...item, status } : item));
    toast.success('Pedido atualizado.');
  };

  const saveHealth = async () => {
    if (healthForm.nome.trim().length < 3) return toast.error('Informe o nome do serviço.');
    setSaving(true);
    const { error } = await supabase.from('servicos_saude_saj' as any).insert({ ...healthForm, descricao: healthForm.descricao || null, endereco: healthForm.endereco || null, bairro: healthForm.bairro || null, telefone: healthForm.telefone || null, horario: healthForm.horario || null, servicos: healthForm.servicos.split(',').map(value => value.trim()).filter(Boolean), fonte_nome: healthForm.fonte_nome || null, fonte_url: healthForm.fonte_url || null, verificado_em: new Date().toISOString().slice(0, 10), ativo: true });
    setSaving(false);
    if (error) return toast.error('Não foi possível cadastrar o serviço de saúde.');
    setHealthForm(emptyHealth); await load(); toast.success('Serviço de saúde publicado.');
  };

  const toggleHealth = async (id: string, active: boolean) => {
    const { error } = await supabase.from('servicos_saude_saj' as any).update({ ativo: active }).eq('id', id);
    if (error) return toast.error('Não foi possível alterar o serviço.');
    setHealth(current => current.map(item => item.id === id ? { ...item, ativo: active } : item));
  };

  const saveChallenge = async () => {
    if (challengeForm.titulo.trim().length < 5 || challengeForm.descricao.trim().length < 20 || !challengeForm.area.trim()) return toast.error('Preencha título, área e uma descrição completa.');
    const { data: auth } = await supabase.auth.getUser();
    setSaving(true);
    const { error } = await supabase.from('desafios_inovacao' as any).insert({ ...challengeForm, proponente: challengeForm.proponente || null, prazo: challengeForm.prazo || null, criado_por: auth.user?.id ?? null });
    setSaving(false);
    if (error) return toast.error('Não foi possível criar o desafio.');
    setChallengeForm(emptyChallenge); await load(); toast.success('Desafio criado.');
  };

  const updateChallenge = async (id: string, status: InnovationChallenge['status']) => {
    const { error } = await supabase.from('desafios_inovacao' as any).update({ status }).eq('id', id);
    if (error) return toast.error('Não foi possível alterar o desafio.');
    setChallenges(current => current.map(item => item.id === id ? { ...item, status } : item));
  };

  const totals = useMemo(() => ({ open: requests.filter(item => item.status === 'aberto').length, health: health.filter(item => item.ativo).length, published: challenges.filter(item => item.status === 'publicado').length }), [requests, health, challenges]);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="rounded-2xl bg-violet-500/10 p-3"><Landmark className="h-6 w-6 text-violet-600" /></div><div><h1 className="text-2xl font-black">Viver SAJ</h1><p className="text-sm text-muted-foreground">Controle módulos, modere pedidos e mantenha saúde e inovação atualizadas.</p></div></div><div className="flex gap-2"><Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" /> Atualizar</Button><Button asChild variant="outline"><Link to="/viver-saj" target="_blank"><ExternalLink className="mr-2 h-4 w-4" /> Ver página</Link></Button></div></div>
    <div className="grid gap-3 sm:grid-cols-3"><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Pedidos abertos</p><p className="text-3xl font-black text-violet-600">{totals.open}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Serviços de saúde ativos</p><p className="text-3xl font-black text-rose-600">{totals.health}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Desafios publicados</p><p className="text-3xl font-black text-amber-600">{totals.published}</p></CardContent></Card></div>

    <Tabs defaultValue="modules"><TabsList className="h-auto flex-wrap"><TabsTrigger value="modules">Organização</TabsTrigger><TabsTrigger value="requests">Pedidos ({totals.open})</TabsTrigger><TabsTrigger value="health">Saúde</TabsTrigger><TabsTrigger value="innovation">Inovação</TabsTrigger></TabsList>
      <TabsContent value="modules" className="mt-5 space-y-3"><Card><CardHeader><CardTitle>Módulos da central</CardTitle><CardDescription>Ative somente o necessário e defina a ordem. A home continuará exibindo apenas um card compacto.</CardDescription></CardHeader></Card>{modules.map((item, index) => <Card key={item.chave} className={!item.ativo ? 'bg-muted/30' : ''}><CardContent className="flex items-center gap-3 p-4"><div className="min-w-0 flex-1"><p className="font-black">{item.titulo}</p><p className="truncate text-xs text-muted-foreground">{item.descricao}</p></div><Button size="icon" variant="outline" disabled={saving || index === 0} onClick={() => moveModule(index, -1)} aria-label="Mover para cima"><ArrowUp className="h-4 w-4" /></Button><Button size="icon" variant="outline" disabled={saving || index === modules.length - 1} onClick={() => moveModule(index, 1)} aria-label="Mover para baixo"><ArrowDown className="h-4 w-4" /></Button><Switch checked={item.ativo} disabled={saving} onCheckedChange={active => toggleModule(item.chave, active)} aria-label={`Ativar ${item.titulo}`} /></CardContent></Card>)}</TabsContent>

      <TabsContent value="requests" className="mt-5 space-y-3">{requests.length === 0 ? <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Nenhum pedido publicado.</CardContent></Card> : requests.map(item => <Card key={item.id}><CardHeader><div className="flex flex-wrap items-start justify-between gap-2"><div><CardTitle className="text-lg">{item.titulo}</CardTitle><CardDescription>{item.categoria} · {item.bairro || 'bairro não informado'} · {new Date(item.criado_em).toLocaleDateString('pt-BR')}</CardDescription></div><Badge variant={item.status === 'aberto' ? 'default' : item.status === 'rejeitado' ? 'destructive' : 'secondary'}>{item.status}</Badge></div></CardHeader><CardContent><p className="text-sm text-muted-foreground">{item.descricao}</p><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => void moderateRequest(item.id, 'aberto')}><Check className="mr-1 h-4 w-4" /> Abrir</Button><Button size="sm" variant="outline" onClick={() => void moderateRequest(item.id, 'encerrado')}>Encerrar</Button><Button size="sm" variant="destructive" onClick={() => void moderateRequest(item.id, 'rejeitado')}><X className="mr-1 h-4 w-4" /> Rejeitar</Button></div></CardContent></Card>)}</TabsContent>

      <TabsContent value="health" className="mt-5 grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><Card><CardHeader><CardTitle className="flex items-center gap-2"><HeartPulse className="h-5 w-5 text-rose-600" /> Novo serviço</CardTitle><CardDescription>Publique apenas informações verificadas e mantenha a fonte.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Nome</Label><Input value={healthForm.nome} onChange={e => setHealthForm(v => ({ ...v, nome: e.target.value }))} /></div><div className="space-y-2"><Label>Tipo</Label><Select value={healthForm.tipo} onValueChange={tipo => setHealthForm(v => ({ ...v, tipo }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['upa','hospital','ubs','caps','farmacia_publica','hemocentro','laboratorio','clinica','farmacia','outro'].map(type => <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Descrição</Label><Textarea value={healthForm.descricao} onChange={e => setHealthForm(v => ({ ...v, descricao: e.target.value }))} /></div><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>Endereço</Label><Input value={healthForm.endereco} onChange={e => setHealthForm(v => ({ ...v, endereco: e.target.value }))} /></div><div className="space-y-2"><Label>Bairro</Label><Input value={healthForm.bairro} onChange={e => setHealthForm(v => ({ ...v, bairro: e.target.value }))} /></div><div className="space-y-2"><Label>Telefone</Label><Input value={healthForm.telefone} onChange={e => setHealthForm(v => ({ ...v, telefone: e.target.value }))} /></div><div className="space-y-2"><Label>Horário</Label><Input value={healthForm.horario} onChange={e => setHealthForm(v => ({ ...v, horario: e.target.value }))} /></div></div><div className="space-y-2"><Label>Serviços (separados por vírgula)</Label><Input value={healthForm.servicos} onChange={e => setHealthForm(v => ({ ...v, servicos: e.target.value }))} /></div><div className="flex gap-5"><Label className="flex items-center gap-2"><Switch checked={healthForm.atendimento_sus} onCheckedChange={atendimento_sus => setHealthForm(v => ({ ...v, atendimento_sus }))} /> SUS</Label><Label className="flex items-center gap-2"><Switch checked={healthForm.atendimento_24h} onCheckedChange={atendimento_24h => setHealthForm(v => ({ ...v, atendimento_24h }))} /> 24 horas</Label></div><Button className="w-full" onClick={() => void saveHealth()} disabled={saving}>Publicar serviço</Button></CardContent></Card><div className="space-y-3">{health.map(item => <Card key={item.id} className={!item.ativo ? 'bg-muted/30' : ''}><CardContent className="flex items-center gap-3 p-4"><HeartPulse className="h-5 w-5 text-rose-600" /><div className="min-w-0 flex-1"><p className="font-black">{item.nome}</p><p className="truncate text-xs text-muted-foreground">{item.tipo} · {item.bairro || 'sem bairro'} {item.atendimento_24h ? '· 24h' : ''}</p></div><Switch checked={item.ativo} onCheckedChange={active => void toggleHealth(item.id, active)} /></CardContent></Card>)}</div></TabsContent>

      <TabsContent value="innovation" className="mt-5 grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-amber-600" /> Novo desafio</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Título</Label><Input value={challengeForm.titulo} onChange={e => setChallengeForm(v => ({ ...v, titulo: e.target.value }))} /></div><div className="space-y-2"><Label>Área</Label><Input value={challengeForm.area} onChange={e => setChallengeForm(v => ({ ...v, area: e.target.value }))} placeholder="Ex.: Mobilidade, comércio, educação" /></div><div className="space-y-2"><Label>Descrição do problema</Label><Textarea value={challengeForm.descricao} onChange={e => setChallengeForm(v => ({ ...v, descricao: e.target.value }))} /></div><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>Proponente</Label><Input value={challengeForm.proponente} onChange={e => setChallengeForm(v => ({ ...v, proponente: e.target.value }))} /></div><div className="space-y-2"><Label>Prazo</Label><Input type="date" value={challengeForm.prazo} onChange={e => setChallengeForm(v => ({ ...v, prazo: e.target.value }))} /></div></div><div className="space-y-2"><Label>Status inicial</Label><Select value={challengeForm.status} onValueChange={status => setChallengeForm(v => ({ ...v, status }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="rascunho">Rascunho</SelectItem><SelectItem value="publicado">Publicado</SelectItem></SelectContent></Select></div><Button className="w-full" onClick={() => void saveChallenge()} disabled={saving}>Criar desafio</Button></CardContent></Card><div className="space-y-3">{challenges.length === 0 ? <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Nenhum desafio criado.</CardContent></Card> : challenges.map(item => <Card key={item.id}><CardHeader><div className="flex flex-wrap justify-between gap-2"><Badge>{item.area}</Badge><Badge variant="outline">{item.status}</Badge></div><CardTitle className="text-lg">{item.titulo}</CardTitle></CardHeader><CardContent><p className="line-clamp-4 text-sm text-muted-foreground">{item.descricao}</p><div className="mt-4 flex gap-2"><Button size="sm" onClick={() => void updateChallenge(item.id, 'publicado')}>Publicar</Button><Button size="sm" variant="outline" onClick={() => void updateChallenge(item.id, 'encerrado')}>Encerrar</Button><Button size="sm" variant="ghost" onClick={() => void updateChallenge(item.id, 'rascunho')}>Rascunho</Button></div></CardContent></Card>)}</div></TabsContent>
    </Tabs>
  </div>;
}
