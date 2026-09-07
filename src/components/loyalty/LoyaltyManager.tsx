import { useCallback, useMemo, useState } from 'react';
import { Award, Gift, Loader2, Plus, Save, Search, ShieldCheck, Sparkles, Stamp, Trash2, Users } from 'lucide-react';
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

const normalizeCardIdentifier = (value: string) => value.replace(/^sajtem-loyalty:/i, '').trim().toUpperCase();

const ProgramForm = ({ program, onSave, saving }: { program: LoyaltyProgram | null; onSave: (v: any) => Promise<void>; saving: boolean }) => {
  const initialRewards = program?.loyalty_rewards?.length ? program.loyalty_rewards : [{
    nome: program?.recompensa_descricao || '',
    descricao: '',
    carimbos_necessarios: program?.carimbos_necessarios || 10,
    ativo: true,
  }];
  const [form, setForm] = useState<any>({ ...defaults, ...(program || {}), loyalty_rewards: initialRewards });
  const set = (name: string, value: any) => setForm((current) => ({ ...current, [name]: value }));
  const updateReward = (index: number, name: string, value: any) => setForm((current: any) => ({
    ...current,
    loyalty_rewards: current.loyalty_rewards.map((reward: any, rewardIndex: number) => rewardIndex === index ? { ...reward, [name]: value } : reward),
  }));
  const addReward = () => setForm((current: any) => ({
    ...current,
    loyalty_rewards: [...current.loyalty_rewards, { nome: '', descricao: '', carimbos_necessarios: 10, ativo: true }],
  }));
  const removeReward = (index: number) => setForm((current: any) => ({
    ...current,
    loyalty_rewards: current.loyalty_rewards.filter((_: any, rewardIndex: number) => rewardIndex !== index),
  }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const rewards = form.loyalty_rewards.map((reward: any) => ({
      nome: reward.nome.trim(),
      descricao: reward.descricao?.trim() || null,
      carimbos_necessarios: Number(reward.carimbos_necessarios),
      ativo: true,
    })).sort((a: any, b: any) => a.carimbos_necessarios - b.carimbos_necessarios);
    if (!rewards.length || rewards.some((reward: any) => reward.nome.length < 2 || reward.carimbos_necessarios < 2 || reward.carimbos_necessarios > 30)) return toast.error('Revise o nome e a meta de todos os prêmios.');
    const firstReward = rewards[0];
    if (Number(form.bonus_boas_vindas) >= firstReward.carimbos_necessarios) return toast.error('O bônus precisa ser menor que a primeira meta.');
    await onSave({
      ...form,
      nome: form.nome.trim(), descricao: form.descricao.trim() || null,
      recompensa_descricao: firstReward.nome, rotulo_carimbo: form.rotulo_carimbo.trim(),
      termos: form.termos.trim() || null, carimbos_necessarios: firstReward.carimbos_necessarios,
      bonus_boas_vindas: Number(form.bonus_boas_vindas), validade_dias: form.validade_dias ? Number(form.validade_dias) : null,
      loyalty_rewards: rewards,
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
          <div className="space-y-2"><Label htmlFor="loyalty-label">Nome de cada carimbo</Label><Input id="loyalty-label" value={form.rotulo_carimbo} onChange={(e) => set('rotulo_carimbo', e.target.value)} placeholder="visita, compra, pedido..." maxLength={30} /></div>
          <div className="space-y-2"><Label htmlFor="loyalty-bonus">Bônus de boas-vindas</Label><Input id="loyalty-bonus" type="number" min={0} max={5} value={form.bonus_boas_vindas} onChange={(e) => set('bonus_boas_vindas', e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="loyalty-validity">Validade do cartão (dias)</Label><Input id="loyalty-validity" type="number" min={30} max={730} value={form.validade_dias || ''} onChange={(e) => set('validade_dias', e.target.value)} /></div>
          <div className="space-y-2 md:col-span-2"><Label htmlFor="loyalty-description">Apresentação</Label><Textarea id="loyalty-description" value={form.descricao || ''} onChange={(e) => set('descricao', e.target.value)} maxLength={240} placeholder="Explique de forma curta como o programa funciona." /></div>
          <div className="space-y-2 md:col-span-2"><Label htmlFor="loyalty-terms">Regras e condições</Label><Textarea id="loyalty-terms" value={form.termos || ''} onChange={(e) => set('termos', e.target.value)} maxLength={1000} placeholder="Ex.: um carimbo por compra; benefício não cumulativo..." /></div>
          <div className="space-y-2"><Label htmlFor="loyalty-color">Cor do cartão</Label><div className="flex gap-2"><Input id="loyalty-color" type="color" className="w-16" value={form.cor_principal} onChange={(e) => set('cor_principal', e.target.value)} /><Input value={form.cor_principal} onChange={(e) => set('cor_principal', e.target.value)} pattern="#[0-9A-Fa-f]{6}" /></div></div>
        </div>
        <div className="space-y-3 rounded-2xl border border-violet-400/20 bg-violet-500/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-semibold">Prêmios e metas</h3><p className="text-xs text-muted-foreground">Cadastre até 10 opções. O cliente escolhe qual deseja resgatar.</p></div><Button type="button" variant="outline" size="sm" onClick={addReward} disabled={form.loyalty_rewards.length >= 10}><Plus className="mr-2 h-4 w-4" /> Adicionar prêmio</Button></div>
          {form.loyalty_rewards.map((reward: any, index: number) => <div key={reward.id || index} className="grid gap-3 rounded-xl border border-white/10 bg-black/15 p-3 sm:grid-cols-[1fr_150px_auto]">
            <div className="space-y-2"><Label htmlFor={`reward-name-${index}`}>Prêmio {index + 1}</Label><Input id={`reward-name-${index}`} value={reward.nome} onChange={(e) => updateReward(index, 'nome', e.target.value)} placeholder="Ex.: Café grátis" maxLength={160} required /><Input value={reward.descricao || ''} onChange={(e) => updateReward(index, 'descricao', e.target.value)} placeholder="Detalhes opcionais" maxLength={240} aria-label={`Detalhes do prêmio ${index + 1}`} /></div>
            <div className="space-y-2"><Label htmlFor={`reward-goal-${index}`}>Carimbos</Label><Input id={`reward-goal-${index}`} type="number" min={2} max={30} value={reward.carimbos_necessarios} onChange={(e) => updateReward(index, 'carimbos_necessarios', e.target.value)} required /></div>
            <Button type="button" variant="ghost" size="icon" className="self-end text-red-300" onClick={() => removeReward(index)} disabled={form.loyalty_rewards.length === 1} aria-label={`Remover prêmio ${index + 1}`}><Trash2 className="h-4 w-4" /></Button>
          </div>)}
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
  const rewards = useMemo(() => (program?.loyalty_rewards || []).filter((reward) => reward.ativo).sort((a, b) => a.carimbos_necessarios - b.carimbos_necessarios), [program?.loyalty_rewards]);
  const highestGoal = rewards.length ? rewards[rewards.length - 1].carimbos_necessarios : program?.carimbos_necessarios || 10;
  const filtered = useMemo(() => {
    const normalized = normalizeCardIdentifier(query).toLowerCase();
    if (!normalized) return cards;
    return cards.filter((card) => `${card.cliente_nome} ${card.cliente_email} ${card.display_code} ${card.public_token}`.toLowerCase().includes(normalized));
  }, [cards, query]);

  const save = async (values: any) => {
    try { await saveProgram.mutateAsync(values); toast.success(values.ativo ? 'Programa salvo e ativado!' : 'Programa salvo.'); }
    catch (error: any) { toast.error(error?.message || 'Não foi possível salvar.'); }
  };
  const move = async (tipo: 'credito' | 'resgate', rewardId?: string) => {
    if (!selected) return;
    try {
      await applyTransaction.mutateAsync({ identifier: selected.display_code, tipo, rewardId });
      toast.success(tipo === 'credito' ? 'Carimbo adicionado e cliente notificado!' : 'Recompensa resgatada e registrada!');
      setSelected(null);
    } catch (error: any) { toast.error(error?.message || 'Não foi possível registrar.'); }
  };
  const handleQrRead = useCallback((token: string) => {
    setQuery(token);
    const normalized = normalizeCardIdentifier(token);
    const card = cards.find((item) => item.public_token.toUpperCase() === normalized || item.display_code === normalized);
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
        <div className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleQrRead(query); }} className="pl-9" placeholder="Nome, e-mail ou código de 8 caracteres" autoCapitalize="characters" autoComplete="off" /></div><LoyaltyScanner onRead={handleQrRead} /></div>
        <p className="text-xs text-muted-foreground">Você também pode usar um leitor QR USB/Bluetooth: mantenha o campo selecionado e leia o código normalmente.</p>
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {filtered.slice(0, 50).map((card) => <button key={card.card_id} type="button" onClick={() => setSelected(card)} className={`w-full rounded-xl border p-3 text-left transition ${selected?.card_id === card.card_id ? 'border-violet-400 bg-violet-500/10' : 'border-white/10 hover:bg-white/5'}`}>
            <div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate font-medium">{card.cliente_nome}</p><p className="truncate text-xs text-muted-foreground">{card.cliente_email} · Código {card.display_code}</p></div><Badge variant="outline">{card.saldo}/{highestGoal}</Badge></div>
            <Progress value={Math.min(100, card.saldo / highestGoal * 100)} className="mt-2 h-1.5" />
          </button>)}
          {!filtered.length && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</p>}
        </div>
        {selected && <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{selected.cliente_nome}</p><p className="text-xs text-muted-foreground">Código {selected.display_code} · Saldo: {selected.saldo} {program.rotulo_carimbo}(s)</p></div><Badge>{rewards.filter((reward) => selected.saldo >= reward.carimbos_necessarios).length} prêmio(s) disponível(is)</Badge></div>
          <Button disabled={applyTransaction.isPending} onClick={() => move('credito')}><Stamp className="mr-2 h-4 w-4" /> Adicionar 1 carimbo</Button>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">{rewards.map((reward) => <div key={reward.id} className="rounded-xl border border-white/10 bg-black/10 p-3"><div className="mb-2 flex justify-between gap-2"><div><p className="text-sm font-medium">{reward.nome}</p><p className="text-xs text-muted-foreground">{reward.carimbos_necessarios} carimbos</p></div>{selected.saldo >= reward.carimbos_necessarios && <Badge className="bg-emerald-500/15 text-emerald-300">Liberado</Badge>}</div>
            <AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="secondary" className="w-full" disabled={applyTransaction.isPending || selected.saldo < reward.carimbos_necessarios}><Award className="mr-2 h-4 w-4" /> Resgatar este prêmio</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Entregar “{reward.nome}”?</AlertDialogTitle><AlertDialogDescription>Serão descontados {reward.carimbos_necessarios} carimbos de {selected.cliente_nome}. A operação ficará registrada no histórico.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => move('resgate', reward.id)}>Confirmar resgate</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
          </div>)}</div>
        </div>}
      </CardContent>
    </Card>}
    <ProgramForm key={program?.id || 'new'} program={program} onSave={save} saving={saveProgram.isPending} />
  </div>;
};
