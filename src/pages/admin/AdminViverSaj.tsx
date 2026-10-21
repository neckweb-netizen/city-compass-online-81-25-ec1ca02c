import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Building2, Check, ExternalLink, HeartPulse, Landmark, Lightbulb, Loader2, Plus, RefreshCw, Search, Tags, Trash2, X } from 'lucide-react';
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
import type { DirectoryBusiness, HealthService, InnovationChallenge, LocalRequest, ViverSajBusinessAssignment, ViverSajModule } from '@/features/viver-saj/types';
import { supabase } from '@/integrations/supabase/client';

const emptyHealth = { nome: '', tipo: 'ubs', descricao: '', endereco: '', bairro: '', telefone: '', horario: '', atendimento_sus: true, atendimento_24h: false, servicos: '', fonte_nome: 'CNES — Ministério da Saúde', fonte_url: 'https://cnes.datasus.gov.br/' };
const emptyChallenge = { titulo: '', descricao: '', area: '', proponente: '', prazo: '', status: 'rascunho' };
const businessModules = [{ key: 'saude', label: 'Saúde' }, { key: 'mobilidade', label: 'Mobilidade' }] as const;
type BusinessModule = typeof businessModules[number]['key'];
type Category = { id: string; nome: string; slug: string };
type CategoryAssignment = { modulo: BusinessModule; categoria_id: string; ordem: number; ativo: boolean; categorias: Category | null };
type InnovationSolution = { id: string; desafio_id: string; nome_proponente: string; tipo_proponente: string; resumo: string; contato: string | null; status: 'recebida' | 'em_analise' | 'selecionada' | 'arquivada'; criado_em: string; desafios_inovacao: { titulo: string } | null };

export default function AdminViverSaj() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState<ViverSajModule[]>([]);
  const [requests, setRequests] = useState<LocalRequest[]>([]);
  const [health, setHealth] = useState<HealthService[]>([]);
  const [challenges, setChallenges] = useState<InnovationChallenge[]>([]);
  const [solutions, setSolutions] = useState<InnovationSolution[]>([]);
  const [businesses, setBusinesses] = useState<DirectoryBusiness[]>([]);
  const [assignments, setAssignments] = useState<ViverSajBusinessAssignment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryAssignments, setCategoryAssignments] = useState<CategoryAssignment[]>([]);
  const [businessModule, setBusinessModule] = useState<BusinessModule>('mobilidade');
  const [businessSearch, setBusinessSearch] = useState('');
  const [healthForm, setHealthForm] = useState(emptyHealth);
  const [challengeForm, setChallengeForm] = useState(emptyChallenge);

  const load = async () => {
    setLoading(true);
    const [moduleResult, requestResult, healthResult, challengeResult, solutionResult, businessResult, assignmentResult, categoryResult, categoryAssignmentResult] = await Promise.all([
      supabase.from('viver_saj_modulos' as any).select('*').order('ordem'),
      supabase.from('pedidos_locais' as any).select('*').order('criado_em', { ascending: false }).limit(100),
      supabase.from('servicos_saude_saj' as any).select('*').order('atendimento_24h', { ascending: false }).order('nome'),
      supabase.from('desafios_inovacao' as any).select('*').order('criado_em', { ascending: false }),
      supabase.from('solucoes_inovacao' as any).select('id,desafio_id,nome_proponente,tipo_proponente,resumo,contato,status,criado_em,desafios_inovacao(titulo)').order('criado_em', { ascending: false }).limit(200),
      supabase.from('empresas').select('id,nome,slug,descricao,endereco,telefone,verificado,categorias(nome)').eq('ativo', true).eq('status_aprovacao', 'aprovado').order('nome').limit(300),
      supabase.from('viver_saj_empresas' as any).select('modulo,empresa_id,ordem,ativo,empresas(id,nome,slug,descricao,endereco,telefone,verificado,categorias(nome))').in('modulo', ['saude', 'mobilidade']).order('ordem'),
      supabase.from('categorias').select('id,nome,slug').eq('ativo', true).eq('tipo', 'empresa').order('nome'),
      supabase.from('viver_saj_categorias' as any).select('modulo,categoria_id,ordem,ativo,categorias(id,nome,slug)').in('modulo', ['saude', 'mobilidade']).order('ordem'),
    ]);
    setLoading(false);
    const error = moduleResult.error || requestResult.error || healthResult.error || challengeResult.error || solutionResult.error || businessResult.error || assignmentResult.error || categoryResult.error || categoryAssignmentResult.error;
    if (error) { toast.error('Não foi possível carregar a gestão do Viver SAJ.'); return; }
    setModules((moduleResult.data ?? []) as ViverSajModule[]);
    setRequests((requestResult.data ?? []) as LocalRequest[]);
    setHealth((healthResult.data ?? []) as HealthService[]);
    setChallenges((challengeResult.data ?? []) as InnovationChallenge[]);
    setSolutions((solutionResult.data ?? []) as unknown as InnovationSolution[]);
    setBusinesses((businessResult.data ?? []).map((item: any) => ({ ...item, categoria: item.categorias?.nome ?? null })) as DirectoryBusiness[]);
    setAssignments((assignmentResult.data ?? []).map((item: any) => ({ ...item, empresas: item.empresas ? { ...item.empresas, categoria: item.empresas.categorias?.nome ?? null } : null })) as ViverSajBusinessAssignment[]);
    setCategories((categoryResult.data ?? []) as Category[]);
    setCategoryAssignments((categoryAssignmentResult.data ?? []) as unknown as CategoryAssignment[]);
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

  const addBusiness = async (business: DirectoryBusiness) => {
    setSaving(true);
    const moduleAssignments = assignments.filter(item => item.modulo === businessModule);
    const { error } = await supabase.from('viver_saj_empresas' as any).upsert({ modulo: businessModule, empresa_id: business.id, ordem: moduleAssignments.length + 1, ativo: true }, { onConflict: 'modulo,empresa_id' });
    setSaving(false);
    if (error) return toast.error('Não foi possível adicionar a empresa ao módulo.');
    await load();
    toast.success(`${business.nome} adicionada em ${businessModules.find(item => item.key === businessModule)?.label}.`);
  };

  const removeBusiness = async (businessId: string) => {
    const { error } = await supabase.from('viver_saj_empresas' as any).delete().eq('modulo', businessModule).eq('empresa_id', businessId);
    if (error) return toast.error('Não foi possível remover a empresa do módulo.');
    setAssignments(current => current.filter(item => item.modulo !== businessModule || item.empresa_id !== businessId));
    toast.success('Empresa removida somente desta área do Viver SAJ.');
  };

  const toggleCategory = async (category: Category, active: boolean) => {
    if (active) {
      const count = categoryAssignments.filter(item => item.modulo === businessModule).length;
      const { error } = await supabase.from('viver_saj_categorias' as any).upsert({ modulo: businessModule, categoria_id: category.id, ordem: count + 1, ativo: true }, { onConflict: 'modulo,categoria_id' });
      if (error) return toast.error('Não foi possível vincular a categoria.');
    } else {
      const { error } = await supabase.from('viver_saj_categorias' as any).delete().eq('modulo', businessModule).eq('categoria_id', category.id);
      if (error) return toast.error('Não foi possível desvincular a categoria.');
    }
    await load();
    toast.success(active ? 'Categoria integrada ao módulo.' : 'Categoria removida do módulo.');
  };

  const updateSolution = async (id: string, status: InnovationSolution['status']) => {
    const { error } = await supabase.from('solucoes_inovacao' as any).update({ status }).eq('id', id);
    if (error) return toast.error('Não foi possível atualizar a proposta.');
    setSolutions(current => current.map(item => item.id === id ? { ...item, status } : item));
    toast.success('Proposta atualizada.');
  };

  const totals = useMemo(() => ({ open: requests.filter(item => item.status === 'aberto').length, health: health.filter(item => item.ativo).length, published: challenges.filter(item => item.status === 'publicado').length }), [requests, health, challenges]);
  const visibleAssignments = useMemo(() => assignments.filter(item => item.modulo === businessModule), [assignments, businessModule]);
  const selectedBusinessIds = useMemo(() => new Set(visibleAssignments.map(item => item.empresa_id)), [visibleAssignments]);
  const selectedCategoryIds = useMemo(() => new Set(categoryAssignments.filter(item => item.modulo === businessModule).map(item => item.categoria_id)), [categoryAssignments, businessModule]);
  const businessOptions = useMemo(() => {
    const term = businessSearch.trim().toLowerCase();
    return businesses.filter(item => !selectedBusinessIds.has(item.id) && (!term || [item.nome, item.categoria, item.endereco].join(' ').toLowerCase().includes(term))).slice(0, 40);
  }, [businessSearch, businesses, selectedBusinessIds]);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="rounded-2xl bg-violet-500/10 p-3"><Landmark className="h-6 w-6 text-violet-600" /></div><div><h1 className="text-2xl font-black">Viver SAJ</h1><p className="text-sm text-muted-foreground">Controle módulos, modere pedidos e mantenha saúde e inovação atualizadas.</p></div></div><div className="flex gap-2"><Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" /> Atualizar</Button><Button asChild variant="outline"><Link to="/viver-saj" target="_blank"><ExternalLink className="mr-2 h-4 w-4" /> Ver página</Link></Button></div></div>
    <div className="grid gap-3 sm:grid-cols-3"><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Pedidos abertos</p><p className="text-3xl font-black text-violet-600">{totals.open}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Serviços de saúde ativos</p><p className="text-3xl font-black text-rose-600">{totals.health}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Desafios publicados</p><p className="text-3xl font-black text-amber-600">{totals.published}</p></CardContent></Card></div>

    <Tabs defaultValue="modules"><TabsList className="h-auto flex-wrap"><TabsTrigger value="modules">Organização</TabsTrigger><TabsTrigger value="requests">Pedidos ({totals.open})</TabsTrigger><TabsTrigger value="health">Saúde</TabsTrigger><TabsTrigger value="businesses">Empresas integradas</TabsTrigger><TabsTrigger value="innovation">Inovação ({solutions.filter(item => item.status === 'recebida').length})</TabsTrigger></TabsList>
      <TabsContent value="modules" className="mt-5 space-y-3"><Card><CardHeader><CardTitle>Módulos da central</CardTitle><CardDescription>Ative somente o necessário e defina a ordem. A home continuará exibindo apenas um card compacto.</CardDescription></CardHeader></Card>{modules.map((item, index) => <Card key={item.chave} className={!item.ativo ? 'bg-muted/30' : ''}><CardContent className="flex items-center gap-3 p-4"><div className="min-w-0 flex-1"><p className="font-black">{item.titulo}</p><p className="truncate text-xs text-muted-foreground">{item.descricao}</p></div><Button size="icon" variant="outline" disabled={saving || index === 0} onClick={() => moveModule(index, -1)} aria-label="Mover para cima"><ArrowUp className="h-4 w-4" /></Button><Button size="icon" variant="outline" disabled={saving || index === modules.length - 1} onClick={() => moveModule(index, 1)} aria-label="Mover para baixo"><ArrowDown className="h-4 w-4" /></Button><Switch checked={item.ativo} disabled={saving} onCheckedChange={active => toggleModule(item.chave, active)} aria-label={`Ativar ${item.titulo}`} /></CardContent></Card>)}</TabsContent>

      <TabsContent value="requests" className="mt-5 space-y-3">{requests.length === 0 ? <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Nenhum pedido publicado.</CardContent></Card> : requests.map(item => <Card key={item.id}><CardHeader><div className="flex flex-wrap items-start justify-between gap-2"><div><CardTitle className="text-lg">{item.titulo}</CardTitle><CardDescription>{item.categoria} · {item.bairro || 'bairro não informado'} · {new Date(item.criado_em).toLocaleDateString('pt-BR')}</CardDescription></div><Badge variant={item.status === 'aberto' ? 'default' : item.status === 'rejeitado' ? 'destructive' : 'secondary'}>{item.status}</Badge></div></CardHeader><CardContent><p className="text-sm text-muted-foreground">{item.descricao}</p><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => void moderateRequest(item.id, 'aberto')}><Check className="mr-1 h-4 w-4" /> Abrir</Button><Button size="sm" variant="outline" onClick={() => void moderateRequest(item.id, 'encerrado')}>Encerrar</Button><Button size="sm" variant="destructive" onClick={() => void moderateRequest(item.id, 'rejeitado')}><X className="mr-1 h-4 w-4" /> Rejeitar</Button></div></CardContent></Card>)}</TabsContent>

      <TabsContent value="health" className="mt-5 grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><Card><CardHeader><CardTitle className="flex items-center gap-2"><HeartPulse className="h-5 w-5 text-rose-600" /> Novo serviço</CardTitle><CardDescription>Publique apenas informações verificadas e mantenha a fonte.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Nome</Label><Input value={healthForm.nome} onChange={e => setHealthForm(v => ({ ...v, nome: e.target.value }))} /></div><div className="space-y-2"><Label>Tipo</Label><Select value={healthForm.tipo} onValueChange={tipo => setHealthForm(v => ({ ...v, tipo }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['upa','hospital','ubs','caps','farmacia_publica','hemocentro','laboratorio','clinica','farmacia','outro'].map(type => <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Descrição</Label><Textarea value={healthForm.descricao} onChange={e => setHealthForm(v => ({ ...v, descricao: e.target.value }))} /></div><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>Endereço</Label><Input value={healthForm.endereco} onChange={e => setHealthForm(v => ({ ...v, endereco: e.target.value }))} /></div><div className="space-y-2"><Label>Bairro</Label><Input value={healthForm.bairro} onChange={e => setHealthForm(v => ({ ...v, bairro: e.target.value }))} /></div><div className="space-y-2"><Label>Telefone</Label><Input value={healthForm.telefone} onChange={e => setHealthForm(v => ({ ...v, telefone: e.target.value }))} /></div><div className="space-y-2"><Label>Horário</Label><Input value={healthForm.horario} onChange={e => setHealthForm(v => ({ ...v, horario: e.target.value }))} /></div></div><div className="space-y-2"><Label>Serviços (separados por vírgula)</Label><Input value={healthForm.servicos} onChange={e => setHealthForm(v => ({ ...v, servicos: e.target.value }))} /></div><div className="flex gap-5"><Label className="flex items-center gap-2"><Switch checked={healthForm.atendimento_sus} onCheckedChange={atendimento_sus => setHealthForm(v => ({ ...v, atendimento_sus }))} /> SUS</Label><Label className="flex items-center gap-2"><Switch checked={healthForm.atendimento_24h} onCheckedChange={atendimento_24h => setHealthForm(v => ({ ...v, atendimento_24h }))} /> 24 horas</Label></div><Button className="w-full" onClick={() => void saveHealth()} disabled={saving}>Publicar serviço</Button></CardContent></Card><div className="space-y-3">{health.map(item => <Card key={item.id} className={!item.ativo ? 'bg-muted/30' : ''}><CardContent className="flex items-center gap-3 p-4"><HeartPulse className="h-5 w-5 text-rose-600" /><div className="min-w-0 flex-1"><p className="font-black">{item.nome}</p><p className="truncate text-xs text-muted-foreground">{item.tipo} · {item.bairro || 'sem bairro'} {item.atendimento_24h ? '· 24h' : ''}</p></div><Switch checked={item.ativo} onCheckedChange={active => void toggleHealth(item.id, active)} /></CardContent></Card>)}</div></TabsContent>

      <TabsContent value="businesses" className="mt-5 space-y-5">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-emerald-600" /> Integração com o catálogo</CardTitle><CardDescription>Escolha o módulo. Categorias vinculadas puxam automaticamente todas as empresas aprovadas; seleções manuais servem apenas para exceções.</CardDescription></CardHeader><CardContent><Select value={businessModule} onValueChange={value => setBusinessModule(value as BusinessModule)}><SelectTrigger className="max-w-sm"><SelectValue /></SelectTrigger><SelectContent>{businessModules.map(item => <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>)}</SelectContent></Select></CardContent></Card>
        <div className="grid gap-5 xl:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Tags className="h-5 w-5" /> Categorias automáticas</CardTitle><CardDescription>Ao ativar uma categoria, empresas novas e já aprovadas passam a aparecer automaticamente neste módulo.</CardDescription></CardHeader><CardContent className="max-h-[34rem] space-y-2 overflow-y-auto">{categories.map(category => <div key={category.id} className="flex items-center gap-3 rounded-xl border p-3"><div className="min-w-0 flex-1"><p className="font-bold">{category.nome}</p><p className="text-xs text-muted-foreground">/{category.slug}</p></div><Switch checked={selectedCategoryIds.has(category.id)} onCheckedChange={active => void toggleCategory(category, active)} aria-label={`Integrar ${category.nome}`} /></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Empresas adicionadas manualmente</CardTitle><CardDescription>Uma empresa manual continua vinculada mesmo que sua categoria não esteja ativa. Remover aqui não apaga o cadastro.</CardDescription></CardHeader><CardContent className="space-y-3">{visibleAssignments.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhuma exceção manual neste módulo.</p> : visibleAssignments.map(item => <div key={item.empresa_id} className="flex items-center gap-3 rounded-xl border p-3"><Building2 className="h-5 w-5 text-emerald-600" /><div className="min-w-0 flex-1"><p className="truncate font-bold">{item.empresas?.nome || 'Empresa indisponível'}</p><p className="truncate text-xs text-muted-foreground">{item.empresas?.categoria || 'Sem categoria'}</p></div><Button size="icon" variant="ghost" onClick={() => void removeBusiness(item.empresa_id)} aria-label={`Remover ${item.empresas?.nome || 'empresa'} do módulo`}><Trash2 className="h-4 w-4" /></Button></div>)}</CardContent></Card></div>
        <Card><CardHeader><CardTitle>Adicionar empresa existente</CardTitle><CardDescription>Pesquise apenas entre empresas aprovadas no catálogo e use esta opção quando a categoria geral não for adequada.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={businessSearch} onChange={event => setBusinessSearch(event.target.value)} className="pl-9" placeholder="Buscar empresa ou categoria" /></div><div className="grid max-h-[32rem] gap-2 overflow-y-auto md:grid-cols-2">{businessOptions.map(item => <div key={item.id} className="flex items-center gap-3 rounded-xl border p-3"><div className="min-w-0 flex-1"><p className="truncate font-bold">{item.nome}</p><p className="truncate text-xs text-muted-foreground">{item.categoria || 'Sem categoria'}{item.endereco ? ` · ${item.endereco}` : ''}</p></div><Button size="sm" variant="outline" disabled={saving} onClick={() => void addBusiness(item)}><Plus className="mr-1 h-4 w-4" /> Adicionar</Button></div>)}{businessOptions.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma empresa disponível com essa busca.</p>}</div></CardContent></Card>
      </TabsContent>

      <TabsContent value="innovation" className="mt-5 space-y-5">
        <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-amber-600" /> Novo desafio</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Título</Label><Input value={challengeForm.titulo} onChange={e => setChallengeForm(v => ({ ...v, titulo: e.target.value }))} /></div><div className="space-y-2"><Label>Área</Label><Input value={challengeForm.area} onChange={e => setChallengeForm(v => ({ ...v, area: e.target.value }))} placeholder="Ex.: Mobilidade, comércio, educação" /></div><div className="space-y-2"><Label>Descrição do problema</Label><Textarea value={challengeForm.descricao} onChange={e => setChallengeForm(v => ({ ...v, descricao: e.target.value }))} /></div><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>Proponente</Label><Input value={challengeForm.proponente} onChange={e => setChallengeForm(v => ({ ...v, proponente: e.target.value }))} /></div><div className="space-y-2"><Label>Prazo</Label><Input type="date" value={challengeForm.prazo} onChange={e => setChallengeForm(v => ({ ...v, prazo: e.target.value }))} /></div></div><div className="space-y-2"><Label>Status inicial</Label><Select value={challengeForm.status} onValueChange={status => setChallengeForm(v => ({ ...v, status }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="rascunho">Rascunho</SelectItem><SelectItem value="publicado">Publicado</SelectItem></SelectContent></Select></div><Button className="w-full" onClick={() => void saveChallenge()} disabled={saving}>Criar desafio</Button></CardContent></Card><div className="space-y-3">{challenges.length === 0 ? <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Nenhum desafio criado.</CardContent></Card> : challenges.map(item => <Card key={item.id}><CardHeader><div className="flex flex-wrap justify-between gap-2"><Badge>{item.area}</Badge><Badge variant="outline">{item.status}</Badge></div><CardTitle className="text-lg">{item.titulo}</CardTitle></CardHeader><CardContent><p className="line-clamp-4 text-sm text-muted-foreground">{item.descricao}</p><div className="mt-4 flex gap-2"><Button size="sm" onClick={() => void updateChallenge(item.id, 'publicado')}>Publicar</Button><Button size="sm" variant="outline" onClick={() => void updateChallenge(item.id, 'encerrado')}>Encerrar</Button><Button size="sm" variant="ghost" onClick={() => void updateChallenge(item.id, 'rascunho')}>Rascunho</Button></div></CardContent></Card>)}</div></div>
        <Card><CardHeader><CardTitle>Propostas recebidas</CardTitle><CardDescription>Respostas enviadas pela página pública aparecem aqui para análise e seleção.</CardDescription></CardHeader><CardContent className="space-y-3">{solutions.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhuma proposta recebida.</p> : solutions.map(item => <div key={item.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-black">{item.nome_proponente}</p><p className="text-xs text-muted-foreground">{item.tipo_proponente} · {item.desafios_inovacao?.titulo || 'Desafio indisponível'} · {new Date(item.criado_em).toLocaleDateString('pt-BR')}</p></div><Badge variant={item.status === 'selecionada' ? 'default' : 'outline'}>{item.status.replace('_', ' ')}</Badge></div><p className="mt-3 text-sm leading-6">{item.resumo}</p>{item.contato && <p className="mt-2 text-xs text-muted-foreground">Contato: {item.contato}</p>}<div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => void updateSolution(item.id, 'em_analise')}>Em análise</Button><Button size="sm" onClick={() => void updateSolution(item.id, 'selecionada')}>Selecionar</Button><Button size="sm" variant="ghost" onClick={() => void updateSolution(item.id, 'arquivada')}>Arquivar</Button></div></div>)}</CardContent></Card>
      </TabsContent>
    </Tabs>
  </div>;
}
