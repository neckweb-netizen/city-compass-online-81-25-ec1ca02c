import { useEffect, useMemo, useRef, useState, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Download, MessageCircle, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { ToolBanner } from '@/components/ferramentas/ToolBanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { GeradorCobranca } from './GeradorCobranca';
import { EMPTY_COBRANCAS, cobrancasStorageKey, formatCobrancaMoney, hojeLocal, parseCobrancaCentavos, telefoneWhatsapp, validarBackupCobrancas, type CobrancaCliente, type CobrancaDados, type CobrancaRegistro } from '@/features/cobrancas/microCrm';

const blankClient = { nome: '', telefone: '' };
const blankBill = () => ({ clienteId: '', descricao: '', valor: '', vencimento: hojeLocal() });
export const GestaoCobrancas = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const uid = user?.id ?? null;
  const activeAccountRef = useRef(uid);
  activeAccountRef.current = uid;
  const [owner, setOwner] = useState<string | null>(null);
  const [data, setData] = useState<CobrancaDados>(EMPTY_COBRANCAS);
  const [failure, setFailure] = useState('');
  const [conflictDraft, setConflictDraft] = useState<{ account: string; snapshot: CobrancaDados } | null>(null);
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [legacy, setLegacy] = useState<CobrancaDados | null>(null);
  const [localStorageWarning, setLocalStorageWarning] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [client, setClient] = useState(blankClient);
  const [clientEditing, setClientEditing] = useState<string | null>(null);
  const [bill, setBill] = useState(blankBill);
  const [billEditing, setBillEditing] = useState<string | null>(null);
  const [filter, setFilter] = useState('todas');
  const [search, setSearch] = useState('');
  useEffect(() => {
    let cancelled = false;
    setOwner(null); setData(EMPTY_COBRANCAS); setFailure(''); setLegacy(null); setRevision(0); setLocalStorageWarning(''); setConflictDraft(null);
    setClient(blankClient); setClientEditing(null); setBill(blankBill()); setBillEditing(null);
    if (!uid) return;
    const account = uid;
    const load = async () => {
      let backup: CobrancaDados | null = null;
      try {
        // Uma cópia local ilegível não deve impedir a leitura do caderno remoto.
        // Preserve a chave antiga e não sobrescreva dados que não puderam ser lidos.
        try {
          const raw = localStorage.getItem(cobrancasStorageKey(account));
          if (raw) {
            backup = validarBackupCobrancas(JSON.parse(raw));
            if (!backup) throw new Error('O backup local está ilegível.');
          }
        } catch {
          if (!cancelled && activeAccountRef.current === account)
            setLocalStorageWarning('A cópia deste aparelho não pôde ser lida. Ela será preservada sem alterações. Exporte o caderno remoto e verifique o armazenamento do navegador.');
        }
        const { data: row, error } = await supabase.from('crm_cadernos' as any)
          .select('dados, revision').eq('user_id', account).maybeSingle();
        if (error) throw error;
        const remote = row ? validarBackupCobrancas((row as any).dados) : EMPTY_COBRANCAS;
        if (!remote) throw new Error('Os dados remotos estão incompatíveis. Nenhum registro será alterado.');
        if (cancelled || activeAccountRef.current !== account) return;
        setData(remote);
        setRevision(row ? Number((row as any).revision) : 0);
        if (backup && (backup.clientes.length || backup.cobrancas.length) && JSON.stringify(backup) !== JSON.stringify(remote))
          setLegacy(backup);
      } catch (error) {
        if (cancelled || activeAccountRef.current !== account) return;
        setFailure(error instanceof Error ? error.message : 'Não foi possível carregar o caderno.');
      } finally {
        if (!cancelled && activeAccountRef.current === account) setOwner(account);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [uid]);
  const current = uid && owner === uid ? data : EMPTY_COBRANCAS;
  const blocked = authLoading || !uid || uid !== owner || Boolean(failure) || saving;
  const persist = async (next: CobrancaDados): Promise<boolean> => {
    if (!uid || blocked || savingRef.current) return false;
    const account = uid;
    savingRef.current = true; setSaving(true);
    try {
      if (!validarBackupCobrancas(next)) throw new Error('Dados inválidos; nenhuma alteração enviada.');
      const { data: nextRevision, error } = await supabase.rpc('save_crm_caderno' as any,
        { p_expected_revision: revision, p_dados: next } as any);
      if (activeAccountRef.current !== account) return false;
      if (error) throw error;
      if (!nextRevision || Number(nextRevision) <= 0) {
        setConflictDraft({ account, snapshot: next });
        setFailure('Outro dispositivo alterou o caderno. Baixe suas alterações não salvas antes de recarregar. O servidor preservou os dados.');
        toast.error('Conflito de sincronização. Nenhum dado foi sobrescrito.');
        return false;
      }
      setRevision(Number(nextRevision)); setData(next);
      // Não substitua um backup legado ainda não importado; o usuário decide quando migrar.
      if (!localStorageWarning && (!legacy || JSON.stringify(legacy) === JSON.stringify(next))) {
        try { localStorage.setItem(cobrancasStorageKey(account), JSON.stringify(next)); } catch {
          toast.warning('Salvo na conta, mas a cópia local não pôde ser atualizada.');
        }
        setLegacy(null);
      }
      return true;
    } catch (error) {
      if (activeAccountRef.current === account)
        toast.error(error instanceof Error ? error.message : 'Falha na sincronização.');
      return false;
    } finally {
      savingRef.current = false; setSaving(false);
    }
  };
  const importLocal = async () => {
    if (!legacy || blocked) return;
    if (!window.confirm('Importar este backup local para sua conta? Isso substituirá o caderno atualmente sincronizado. Faça backup da versão remota antes de continuar.')) return;
    if (await persist(legacy)) toast.success('Histórico deste aparelho sincronizado.');
  };
  const saveClient = async (e: FormEvent) => {
    e.preventDefault();
    const name = client.nome.trim(), phone = client.telefone.trim();
    if (name.length < 2 || name.length > 120 || phone.length > 25) return toast.error('Nome ou telefone inválido.');
    const previous = current.clientes.find(c => c.id === clientEditing);
    const item: CobrancaCliente = { id: previous?.id ?? crypto.randomUUID(), nome: name, telefone: phone, criadoEm: previous?.criadoEm ?? new Date().toISOString() };
    if (await persist({ ...current, clientes: previous ? current.clientes.map(c => c.id === previous.id ? item : c) : [...current.clientes, item] })) {
      setClient(blankClient); setClientEditing(null); toast.success('Cliente salvo.');
    }
  };
  const removeClient = async (c: CobrancaCliente) => {
    if (current.cobrancas.some(b => b.clienteId === c.id)) return toast.error('Exclua as cobranças deste cliente antes de removê-lo.');
    if (window.confirm('Excluir o cliente ' + c.nome + '?') && await persist({ ...current, clientes: current.clientes.filter(x => x.id !== c.id) })) toast.success('Cliente excluído.');
  };
  const saveBill = async (e: FormEvent) => {
    e.preventDefault();
    const cents = parseCobrancaCentavos(bill.valor);
    const desc = bill.descricao.trim();
    const day = new Date(bill.vencimento + 'T12:00:00Z');
    if (!current.clientes.some(c => c.id === bill.clienteId) || !desc || desc.length > 300 || cents === null ||
      !/^\d{4}-\d{2}-\d{2}$/.test(bill.vencimento) || Number.isNaN(day.getTime()) ||
      day.toISOString().slice(0, 10) !== bill.vencimento) return toast.error('Confira cliente, valor, descrição e vencimento.');
    const previous = current.cobrancas.find(c => c.id === billEditing);
    const item: CobrancaRegistro = { id: previous?.id ?? crypto.randomUUID(), clienteId: bill.clienteId, descricao: desc, valorCentavos: cents, vencimento: bill.vencimento, status: previous?.status ?? 'pendente', pagoEm: previous?.pagoEm ?? null, criadoEm: previous?.criadoEm ?? new Date().toISOString() };
    if (await persist({ ...current, cobrancas: previous ? current.cobrancas.map(c => c.id === previous.id ? item : c) : [...current.cobrancas, item] })) {
      setBill(blankBill()); setBillEditing(null); toast.success('Cobrança salva.');
    }
  };
  const togglePaid = async (c: CobrancaRegistro) => {
    const paid = c.status !== 'paga';
    if (!paid && !window.confirm('Reabrir cobrança paga?')) return;
    if (await persist({ ...current, cobrancas: current.cobrancas.map(x => x.id === c.id ? { ...x, status: paid ? ('paga' as const) : ('pendente' as const), pagoEm: paid ? new Date().toISOString() : null } : x) })) toast.success(paid ? 'Pagamento registrado.' : 'Cobrança reaberta.');
  };
  const removeBill = async (c: CobrancaRegistro) => {
    if (window.confirm('Excluir esta cobrança e seu histórico?') && await persist({ ...current, cobrancas: current.cobrancas.filter(x => x.id !== c.id) })) toast.success('Cobrança removida.');
  };
  const downloadSnapshot = (snapshot: CobrancaDados, filename: string) => {
    try {
      const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = filename;
      document.body.appendChild(a);
      try { a.click(); } finally { a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 60_000); }
      toast.info('Arquivo preparado. Guarde-o em local privado.');
    } catch { toast.error('Não foi possível exportar o backup.'); }
  };
  const exportBackup = () => {
    if (blocked) return;
    downloadSnapshot(current, 'sajtem-cobrancas-' + hojeLocal() + '.json');
  };
  const exportConflict = () => {
    if (!uid || conflictDraft?.account !== uid || owner !== uid) return;
    downloadSnapshot(conflictDraft.snapshot, 'sajtem-cobrancas-alteracoes-nao-salvas-' + hojeLocal() + '.json');
  };
  const importBackup = async (e: ChangeEvent<HTMLInputElement>) => {
    const requestedAccount = uid;
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file || blocked) return;
    if (file.size > 2_000_000) return toast.error('Backup acima do limite de 2 MB.');
    try {
      const parsed = validarBackupCobrancas(JSON.parse(await file.text()));
      if (activeAccountRef.current !== requestedAccount) return;
      if (!parsed) return toast.error('Arquivo de backup inválido.');
      if (!window.confirm('Substituir TODOS os clientes e cobranças sincronizados na conta? Exporte uma cópia antes de continuar.')) return;
      if (activeAccountRef.current !== requestedAccount) return;
      if (await persist(parsed)) { setClient(blankClient); setBill(blankBill()); setClientEditing(null); setBillEditing(null); toast.success('Backup restaurado e sincronizado.'); }
    } catch { toast.error('Não foi possível ler o backup.'); }
  };
  const today = hojeLocal();
  const clients = useMemo(() => new Map(current.clientes.map(c => [c.id, c])), [current.clientes]);
  const bills = current.cobrancas.filter(c => {
    const matches = (c.descricao + ' ' + (clients.get(c.clienteId)?.nome ?? '')).toLowerCase().includes(search.trim().toLowerCase());
    return matches && (filter === 'todas' || (filter === 'pagas' && c.status === 'paga') || (filter === 'pendentes' && c.status === 'pendente') || (filter === 'vencidas' && c.status === 'pendente' && c.vencimento < today));
  }).sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  const pending = current.cobrancas.filter(c => c.status === 'pendente');
  const pendingAmount = pending.reduce((sum, c) => sum + c.valorCentavos, 0);
  const overdueAmount = pending.filter(c => c.vencimento < today).reduce((sum, c) => sum + c.valorCentavos, 0);
  const paidAmount = current.cobrancas.filter(c => c.status === 'paga').reduce((sum, c) => sum + c.valorCentavos, 0);
  const whatsapp = (c: CobrancaRegistro) => {
    const customer = clients.get(c.clienteId);
    const phone = telefoneWhatsapp(customer?.telefone ?? '');
    if (!phone) return null;
    const message = 'Olá, ' + customer?.nome + '! Lembrete de pagamento: ' + c.descricao + ', no valor de ' +
      formatCobrancaMoney(c.valorCentavos) + ', com vencimento em ' + c.vencimento.split('-').reverse().join('/') +
      '. Se já pagou, desconsidere. Obrigado!';
    return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
  };
  return <div className="min-h-screen bg-muted/20 p-3 pb-20 sm:p-6"><div className="mx-auto max-w-6xl space-y-5">
    <Button variant="ghost" onClick={() => navigate('/ferramentas')}><ArrowLeft className="mr-2 h-4 w-4"/>Ferramentas</Button>
    <header className="rounded-3xl bg-gradient-to-r from-amber-800 to-orange-600 p-6 text-white"><h1 className="text-3xl font-black">Caderno de Cobranças & Micro CRM</h1><p className="mt-2 text-sm">Clientes, vencimentos, pagamentos e cobranças manuais.</p></header>
    <Tabs defaultValue="caderno"><TabsList className="mb-4 h-auto"><TabsTrigger value="caderno">Caderno</TabsTrigger><TabsTrigger value="gerador">Gerador de mensagens</TabsTrigger></TabsList>
      <TabsContent value="gerador"><GeradorCobranca bannerSecao="gestao_cobrancas"/></TabsContent>
      <TabsContent value="caderno" className="space-y-5"><ToolBanner secao="gestao_cobrancas"/>
        {localStorageWarning && <Card><CardContent role="alert" className="p-4 text-sm text-amber-700 dark:text-amber-300">{localStorageWarning}</CardContent></Card>}
        <Card><CardContent className="p-4 text-sm"><b>Sincronização:</b> clientes e cobranças são guardados na sua conta e sincronizam entre aparelhos após carregar novamente. O navegador mantém uma cópia local para backup; faça exportações regularmente. Nunca compartilhe esses arquivos com terceiros. Pagamentos são confirmados manualmente, sem Pix automático.</CardContent></Card>
        {authLoading || (uid && owner !== uid) ? <p role="status">Carregando...</p> : !user ?
          <Card><CardContent className="space-y-3 p-6"><p>Entre na sua conta para usar o caderno. O gerador de mensagens funciona sem login.</p><Button onClick={() => setAuthOpen(true)}>Entrar</Button><AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab="login"/></CardContent></Card> :
          failure ? <Card><CardContent role="alert" className="space-y-3 p-5 text-destructive"><p>{failure} Nenhum registro será sobrescrito até corrigir o problema. Preserve uma cópia dos dados do navegador.</p><div className="flex flex-wrap gap-2">{conflictDraft?.account === uid && <Button type="button" variant="outline" onClick={exportConflict}><Download className="mr-2 h-4 w-4"/>Baixar alterações não salvas</Button>}<Button type="button" variant="outline" onClick={() => window.location.reload()}>Recarregar caderno</Button></div></CardContent></Card> :
          <>
            {legacy && <Card><CardContent className="space-y-2 p-4"><p className="text-sm">Encontramos dados antigos deste aparelho. Eles não foram enviados automaticamente à sua conta.</p><Button type="button" variant="outline" disabled={blocked} onClick={() => void importLocal()}>Importar dados locais para minha conta</Button></CardContent></Card>}
            <div className="grid gap-3 sm:grid-cols-3">{[['A receber',pendingAmount],['Vencidas',overdueAmount],['Pagas',paidAmount]].map(([label,value]) => <Card key={String(label)}><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><b className="text-2xl">{formatCobrancaMoney(Number(value))}</b></CardContent></Card>)}</div>
            <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={blocked} onClick={() => window.location.reload()}>Atualizar dados de outros aparelhos</Button><Button variant="outline" onClick={exportBackup}><Download className="mr-2 h-4 w-4"/>Exportar backup</Button><label className="inline-flex cursor-pointer items-center rounded-md border px-4 py-2 text-sm font-medium"><Upload className="mr-2 h-4 w-4"/>Importar backup<input type="file" accept=".json,application/json" className="sr-only" aria-label="Importar arquivo JSON" onChange={e => void importBackup(e)}/></label></div>
            <div className="grid gap-5 lg:grid-cols-2">
              <Card><CardHeader><CardTitle>Clientes</CardTitle></CardHeader><CardContent className="space-y-3">
                <form className="space-y-3" onSubmit={saveClient}><div><Label htmlFor="crm-name">Nome</Label><Input id="crm-name" required maxLength={120} value={client.nome} onChange={e => setClient({ ...client, nome: e.target.value })}/></div><div><Label htmlFor="crm-phone">WhatsApp (opcional)</Label><Input id="crm-phone" type="tel" maxLength={25} value={client.telefone} onChange={e => setClient({ ...client, telefone: e.target.value })}/></div><div className="flex gap-2"><Button type="submit"><Plus className="mr-1 h-4 w-4"/>{clientEditing ? 'Atualizar' : 'Adicionar'} cliente</Button>{clientEditing && <Button type="button" variant="outline" onClick={() => {setClientEditing(null);setClient(blankClient);}}>Cancelar</Button>}</div></form>
                <div className="max-h-64 space-y-2 overflow-auto">{current.clientes.map(c => <div key={c.id} className="flex items-center justify-between rounded-xl border p-3"><div><b>{c.nome}</b><p className="text-xs text-muted-foreground">{c.telefone || 'Sem telefone'}</p></div><div className="flex"><Button aria-label={'Editar ' + c.nome} variant="ghost" size="icon" onClick={() => { setClientEditing(c.id); setClient({nome:c.nome,telefone:c.telefone}); }}><Pencil className="h-4 w-4"/></Button><Button aria-label={'Excluir ' + c.nome} variant="ghost" size="icon" onClick={() => removeClient(c)}><Trash2 className="h-4 w-4"/></Button></div></div>)}{!current.clientes.length && <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado.</p>}</div>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>Nova cobrança</CardTitle></CardHeader><CardContent><form className="space-y-3" onSubmit={saveBill}>
                <div><Label htmlFor="crm-customer">Cliente</Label><select id="crm-customer" className="h-10 w-full rounded-md border bg-background px-3" required value={bill.clienteId} onChange={e => setBill({ ...bill, clienteId:e.target.value })}><option value="">Selecione...</option>{current.clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
                <div><Label htmlFor="crm-description">Descrição</Label><Input id="crm-description" required maxLength={300} value={bill.descricao} onChange={e => setBill({ ...bill, descricao:e.target.value })}/></div>
                <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="crm-amount">Valor (R$)</Label><Input id="crm-amount" required inputMode="decimal" value={bill.valor} onChange={e => setBill({ ...bill, valor:e.target.value })}/></div><div><Label htmlFor="crm-due">Vencimento</Label><Input id="crm-due" required type="date" value={bill.vencimento} onChange={e => setBill({ ...bill, vencimento:e.target.value })}/></div></div>
                <div className="flex gap-2"><Button disabled={!current.clientes.length} type="submit"><Plus className="mr-1 h-4 w-4"/>{billEditing ? 'Atualizar' : 'Cadastrar'} cobrança</Button>{billEditing && <Button type="button" variant="outline" onClick={() => { setBillEditing(null); setBill(blankBill()); }}>Cancelar</Button>}</div>
              </form></CardContent></Card>
            </div>
            <Card><CardHeader><CardTitle>Histórico de cobranças</CardTitle></CardHeader><CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2"><Input className="flex-1" aria-label="Buscar cobrança" placeholder="Buscar cliente ou descrição" value={search} onChange={e => setSearch(e.target.value)}/><select aria-label="Filtrar cobranças" className="rounded-md border bg-background px-3" value={filter} onChange={e => setFilter(e.target.value)}><option value="todas">Todas</option><option value="pendentes">Pendentes</option><option value="vencidas">Vencidas</option><option value="pagas">Pagas</option></select></div>
              {!bills.length && <p className="text-sm text-muted-foreground">Nenhuma cobrança encontrada.</p>}
              {bills.map(c => { const customer = clients.get(c.clienteId); const overdue = c.status === 'pendente' && c.vencimento < today; const url = c.status === 'pendente' ? whatsapp(c) : null; return <div key={c.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-2"><div><b>{customer?.nome}</b><p>{c.descricao}</p><p className="text-sm font-semibold">{formatCobrancaMoney(c.valorCentavos)} · Vence {c.vencimento.split('-').reverse().join('/')}</p>{c.pagoEm && <p className="text-xs text-muted-foreground">Pago em {new Date(c.pagoEm).toLocaleDateString('pt-BR')}</p>}</div><Badge variant={overdue ? 'destructive' : c.status === 'paga' ? 'default' : 'secondary'}>{c.status === 'paga' ? 'Paga' : overdue ? 'Vencida' : 'Pendente'}</Badge></div><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => togglePaid(c)}><Check className="mr-1 h-4 w-4"/>{c.status === 'paga' ? 'Reabrir' : 'Marcar paga'}</Button><Button size="sm" variant="outline" onClick={() => {setBillEditing(c.id);setBill({clienteId:c.clienteId,descricao:c.descricao,valor:(c.valorCentavos/100).toFixed(2).replace('.',','),vencimento:c.vencimento});}}><Pencil className="mr-1 h-4 w-4"/>Editar</Button>{url && <Button size="sm" asChild><a href={url} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-1 h-4 w-4"/>WhatsApp</a></Button>}<Button size="sm" variant="ghost" onClick={() => removeBill(c)}><Trash2 className="mr-1 h-4 w-4"/>Excluir</Button></div></div>; })}
            </CardContent></Card>
          </>
        }
      </TabsContent>
    </Tabs>
  </div></div>;
};
export default GestaoCobrancas;
