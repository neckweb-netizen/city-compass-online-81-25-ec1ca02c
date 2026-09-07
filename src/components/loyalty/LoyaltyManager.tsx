import { useCallback, useMemo, useState } from 'react';
import { Award, Gift, Loader2, Save, Search, ShieldCheck, Sparkles, Stamp, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { LoyaltyOwnerCard, LoyaltyProgram, useLoyaltyManager } from '@/hooks/useLoyalty';
import { LoyaltyScanner } from './LoyaltyScanner';

const defaults = {
  ativo: false, nome: 'Cartão Fidelidade', descricao: '', recompensa_descricao: '',
  carimbos_necessarios: 10, rotulo_carimbo: 'visita', cor_principal: '#7c3aed',
  termos: '', validade_dias: 180, bonus_boas_vindas: 0,
};

const ProgramForm = ({ program, onSave, saving }: { program: LoyaltyProgram | null; onSave: (v: any) => Promise<void>; saving: boolean }) => {
  const [form, setForm] = useState({ ...defaults, ...(program || {}) });
  const set = (name: string, value: any) => setForm((current) => ({ ...current, [name]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.recompensa_descricao.trim()) return toast.error('Descreva a recompensa do cliente.');
    if (Number(form.bonus_boas_vindas) >= Number(form.carimbos_necessarios)) return toast.error('O bônus precisa ser menor que a meta.');
    await onSave({
      ...form,
      nome: form.nome.trim(), descricao: form.descricao.trim() || null,
      recompensa_descricao: form.recompensa_descricao.trim(), rotulo_carimbo: form.rotulo_carimbo.trim(),
      termos: form.termos.trim() || null, carimbos_necessarios: Number(form.carimbos_necessarios),
      bonus_boas_vindas: Number(form.bonus_boas_vindas), validade_dias: form.validade_dias ? Number(form.validade_dias) : null,
    });
  };

  return (
    <Card className="border-violet-500/20 bg-[#1c1528]">
      <CardHeader><CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-violet-300" /> Configuração do programa</CardTitle></CardHeader>
      <CardContent><form onSubmit={submit} className="space-y-5">
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/15 p-4">
          <div><Label htmlFor="loyalty-active" className="text-base">Programa ativo</Label><p className="text-xs text-muted-foreground">Quando ativo, aparece no perfil público da empresa.</p></div>
          <Switch id="loyalty-active" checked={form.ativo} onCheckedChange={(v) => set('ativo', v)} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="loyalty-name">Nome do cartão</Label><Input id="loyalty-name" value={form.nome} onChange={(e) => set('nome', e.target.value)} maxLength={80} required /></div>
          <div className="space-y-2"><Label htmlFor="loyalty-reward">Recompensa</Label><Input id="loyalty-reward" value={form.recompensa_descricao} onChange={(e) => set('recompensa_descricao', e.target.value)} placeholder="Ex.: 1 café grátis" maxLength={160} required /></div>
          <div className="space-y-2"><Label htmlFor="loyalty-goal">Carimbos para ganhar</Label><Input id="loyalty-goal" type="number" min={2} max={30} value={form.carimbos_necessarios} onChange={(e) => set('carimbos_necessarios', e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="loyalty-label">Nome de cada carimbo</Label><Input id="loyalty-label" value={form.rotulo_carimbo} onChange={(e) => set('rotulo_carimbo', e.target.value)} placeholder="visita, compra, pedido..." maxLength={30} /></div>
          <div className="space-y-2"><Label htmlFor="loyalty-bonus">Bônus de boas-vindas</Label><Input id="loyalty-bonus" type="number" min={0} max={5} value={form.bonus_boas_vindas} onChange={(e) => set('bonus_boas_vindas', e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="loyalty-validity">Validade do cartão (dias)</Label><Input id="loyalty-validity" type="number" min={30} max={730} value={form.validade_dias || ''} onChange={(e) => set('validade_dias', e.target.value)} /></div>
          <div className="space-y-2 md:col-span-2"><Label htmlFor="loyalty-description">Apresentação</Label><Textarea id="loyalty-description" value={form.descricao || ''} onChange={(e) => set('descricao', e.target.value)} maxLength={240} placeholder="Explique de forma curta como o programa funciona." /></div>
          <div className="space-y-2 md:col-span-2"><Label htmlFor="loyalty-terms">Regras e condições</Label><Textarea id="loyalty-terms" value={form.termos || ''} onChange={(e) => set('termos', e.target.value)} maxLength={1000} placeholder="Ex.: um carimbo por compra; benefício não cumulativo..." /></div>
          <div className="space-y-2"><Label htmlFor="loyalty-color">Cor do cartão</Label><div className="flex gap-2"><Input id="loyalty-color" type="color" className="w-16" value={form.cor_principal} onChange={(e) => set('cor_principal', e.target.value)} /><Input value={form.cor_principal} onChange={(e) => set('cor_principal', e.target.value)} pattern="#[0-9A-Fa-f]{6}" /></div></div>
        </div>
        <Button type="submit" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar programa</Button>
      </form></CardContent>
    </Card>
  );
};

export const LoyaltyManager = ({ empresaId }: { empresaId: string }) => {
  const { programQuery, cardsQuery, saveProgram, applyTransaction } = useLoyaltyManager(empresaId);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<LoyaltyOwnerCard | null>(null);
  const program = programQuery.data || null;
  const cards = useMemo(() => cardsQuery.data || [], [cardsQuery.data]);
  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return cards;
    return cards.filter((card) => `${card.cliente_nome} ${card.cliente_email} ${card.public_token}`.toLowerCase().includes(normalized));
  }, [cards, query]);

  const save = async (values: any) => {
    try { await saveProgram.mutateAsync(values); toast.success(values.ativo ? 'Programa salvo e ativado!' : 'Programa salvo.'); }
    catch (error: any) { toast.error(error?.message || 'Não foi possível salvar.'); }
  };
  const move = async (tipo: 'credito' | 'resgate') => {
    if (!selected) return;
    try {
      await applyTransaction.mutateAsync({ token: selected.public_token, tipo });
      toast.success(tipo === 'credito' ? 'Carimbo adicionado e cliente notificado!' : 'Recompensa resgatada e registrada!');
      setSelected(null);
    } catch (error: any) { toast.error(error?.message || 'Não foi possível registrar.'); }
  };
  const handleQrRead = useCallback((token: string) => {
    setQuery(token);
    const card = cards.find((item) => item.public_token === token);
    setSelected(card || null);
    if (!card) toast.error('Este cartão não pertence ao programa da empresa.');
  }, [cards]);

  if (programQuery.isLoading) return <div className="grid min-h-48 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-violet-300" /></div>;

  return <div className="space-y-6">
    <div className="rounded-2xl bg-gradient-to-r from-violet-900/60 to-fuchsia-900/30 p-5">
      <Badge className="mb-3 bg-violet-500/20 text-violet-200"><Sparkles className="mr-1 h-3 w-3" /> Fidelização</Badge>
      <h2 className="text-2xl font-bold">Cartão fidelidade digital</h2>
      <p className="mt-1 text-sm text-muted-foreground">Configure a campanha, encontre o cliente e registre cada movimento com segurança.</p>
    </div>
    {program && <div className="grid gap-3 sm:grid-cols-3">
      <Card><CardContent className="flex items-center gap-3 p-4"><Users className="h-7 w-7 text-violet-300" /><div><p className="text-2xl font-bold">{cards.length}</p><p className="text-xs text-muted-foreground">clientes participantes</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-3 p-4"><Stamp className="h-7 w-7 text-emerald-300" /><div><p className="text-2xl font-bold">{cards.reduce((s, c) => s + c.total_carimbos, 0)}</p><p className="text-xs text-muted-foreground">carimbos entregues</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-3 p-4"><Award className="h-7 w-7 text-amber-300" /><div><p className="text-2xl font-bold">{cards.reduce((s, c) => s + c.total_resgates, 0)}</p><p className="text-xs text-muted-foreground">recompensas resgatadas</p></div></CardContent></Card>
    </div>}
    {program?.ativo && <Card className="border-emerald-500/20">
      <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-400" /> Atender cliente</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" placeholder="Buscar por nome, e-mail ou código do cartão" /></div><LoyaltyScanner onRead={handleQrRead} /></div>
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {filtered.slice(0, 50).map((card) => <button key={card.card_id} type="button" onClick={() => setSelected(card)} className={`w-full rounded-xl border p-3 text-left transition ${selected?.card_id === card.card_id ? 'border-violet-400 bg-violet-500/10' : 'border-white/10 hover:bg-white/5'}`}>
            <div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate font-medium">{card.cliente_nome}</p><p className="truncate text-xs text-muted-foreground">{card.cliente_email}</p></div><Badge variant="outline">{card.saldo}/{program.carimbos_necessarios}</Badge></div>
            <Progress value={Math.min(100, card.saldo / program.carimbos_necessarios * 100)} className="mt-2 h-1.5" />
          </button>)}
          {!filtered.length && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</p>}
        </div>
        {selected && <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{selected.cliente_nome}</p><p className="text-xs text-muted-foreground">Saldo atual: {selected.saldo} {program.rotulo_carimbo}(s)</p></div><Badge>{selected.saldo >= program.carimbos_necessarios ? 'Recompensa liberada' : `Faltam ${program.carimbos_necessarios - selected.saldo}`}</Badge></div>
          <div className="flex flex-col gap-2 sm:flex-row"><Button disabled={applyTransaction.isPending} onClick={() => move('credito')}><Stamp className="mr-2 h-4 w-4" /> Adicionar 1 carimbo</Button>
            <AlertDialog><AlertDialogTrigger asChild><Button variant="secondary" disabled={applyTransaction.isPending || selected.saldo < program.carimbos_necessarios}><Award className="mr-2 h-4 w-4" /> Resgatar recompensa</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar entrega do benefício?</AlertDialogTitle><AlertDialogDescription>Serão descontados {program.carimbos_necessarios} carimbos de {selected.cliente_nome}. A operação ficará no histórico.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => move('resgate')}>Confirmar resgate</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
          </div>
        </div>}
      </CardContent>
    </Card>}
    <ProgramForm key={program?.id || 'new'} program={program} onSave={save} saving={saveProgram.isPending} />
  </div>;
};
