import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BellRing, CalendarClock, CarFront, CheckCircle2, Cloud, CloudOff,
  Fuel, Gauge, Plus, Receipt, ShieldCheck, Sparkles, Trash2, Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { usePushNotifications } from '@/contexts/PushNotificationsContext';
import {
  type Abastecimento, type LembreteVeiculo, type Manutencao, type Veiculo,
  useMeuVeiculoStorage,
} from '@/hooks/useMeuVeiculoStorage';

const todayKey = () => new Date().toISOString().slice(0, 10);
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const num = (value: string) => Number(String(value).replace(',', '.')) || 0;

const MeuVeiculo = () => {
  const navigate = useNavigate();
  const push = usePushNotifications();
  const {
    veiculos, abastecimentos, manutencoes, lembretes, user, loading, storageLabel, syncError,
    saveVehicle, removeVehicle, saveFuel, removeFuel, saveMaintenance, removeMaintenance,
    saveReminder, removeReminder,
  } = useMeuVeiculoStorage();

  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const selectedVehicle = veiculos.find((v) => v.id === selectedVehicleId) || veiculos[0] || null;
  const currentVehicleId = selectedVehicle?.id || '';

  const [vehicleForm, setVehicleForm] = useState({ apelido: '', marca: '', modelo: '', ano: '', placa: '', combustivel: 'Flex', km: '' });
  const [fuelForm, setFuelForm] = useState({ data: todayKey(), km: '', litros: '', valor: '', combustivel: 'Gasolina', posto: '', tanqueCompleto: true, observacao: '' });
  const [maintenanceForm, setMaintenanceForm] = useState({ data: todayKey(), tipo: 'Troca de óleo', km: '', valor: '', oficina: '', observacao: '' });
  const [reminderForm, setReminderForm] = useState({ titulo: '', tipo: 'manutencao' as LembreteVeiculo['tipo'], data: '', km: '', diasAntes: '7', hora: '09:00', notificar: true });

  const ownFuel = abastecimentos.filter((a) => a.veiculoId === currentVehicleId);
  const ownMaintenance = manutencoes.filter((m) => m.veiculoId === currentVehicleId);
  const ownReminders = lembretes.filter((l) => l.veiculoId === currentVehicleId);

  const metrics = useMemo(() => {
    const totalFuel = ownFuel.reduce((sum, a) => sum + a.valorTotal, 0);
    const totalMaintenance = ownMaintenance.reduce((sum, m) => sum + m.valor, 0);
    const sorted = [...ownFuel].filter((a) => a.tanqueCompleto && a.litros > 0).sort((a, b) => a.quilometragem - b.quilometragem);
    const consumptions: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const distance = sorted[i].quilometragem - sorted[i - 1].quilometragem;
      if (distance > 0) consumptions.push(distance / sorted[i].litros);
    }
    const avgKmL = consumptions.length ? consumptions.reduce((a, b) => a + b, 0) / consumptions.length : 0;
    const literCost = ownFuel.reduce((s, a) => s + a.valorTotal, 0) / Math.max(ownFuel.reduce((s, a) => s + a.litros, 0), 1);
    return { totalFuel, totalMaintenance, avgKmL, literCost };
  }, [ownFuel, ownMaintenance]);

  const saveVehicleForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.modelo.trim()) return toast.error('Informe pelo menos o modelo do veículo.');
    const id = crypto.randomUUID();
    await saveVehicle({
      id, apelido: vehicleForm.apelido.trim(), marca: vehicleForm.marca.trim(), modelo: vehicleForm.modelo.trim(),
      ano: vehicleForm.ano ? Number(vehicleForm.ano) : null, placa: vehicleForm.placa.toUpperCase().trim(),
      combustivel: vehicleForm.combustivel, quilometragemAtual: num(vehicleForm.km), ativo: true,
    });
    setSelectedVehicleId(id);
    setVehicleForm({ apelido: '', marca: '', modelo: '', ano: '', placa: '', combustivel: 'Flex', km: '' });
    toast.success(user ? 'Veículo salvo na sua conta.' : 'Veículo salvo neste aparelho.');
  };

  const saveFuelForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentVehicleId) return toast.error('Cadastre um veículo primeiro.');
    const item: Abastecimento = {
      id: crypto.randomUUID(), veiculoId: currentVehicleId, data: fuelForm.data,
      quilometragem: num(fuelForm.km), litros: num(fuelForm.litros), valorTotal: num(fuelForm.valor),
      combustivel: fuelForm.combustivel, posto: fuelForm.posto.trim(), tanqueCompleto: fuelForm.tanqueCompleto,
      observacao: fuelForm.observacao.trim(),
    };
    if (item.litros <= 0 || item.valorTotal <= 0) return toast.error('Informe litros e valor do abastecimento.');
    await saveFuel(item);
    setFuelForm({ data: todayKey(), km: '', litros: '', valor: '', combustivel: fuelForm.combustivel, posto: '', tanqueCompleto: true, observacao: '' });
    toast.success('Abastecimento registrado.');
  };

  const saveMaintenanceForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentVehicleId) return toast.error('Cadastre um veículo primeiro.');
    const item: Manutencao = {
      id: crypto.randomUUID(), veiculoId: currentVehicleId, data: maintenanceForm.data,
      tipo: maintenanceForm.tipo, quilometragem: maintenanceForm.km ? num(maintenanceForm.km) : null,
      valor: num(maintenanceForm.valor), oficina: maintenanceForm.oficina.trim(), observacao: maintenanceForm.observacao.trim(),
    };
    await saveMaintenance(item);
    setMaintenanceForm({ data: todayKey(), tipo: 'Troca de óleo', km: '', valor: '', oficina: '', observacao: '' });
    toast.success('Manutenção registrada.');
  };

  const saveReminderForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentVehicleId) return toast.error('Cadastre um veículo primeiro.');
    if (!reminderForm.titulo.trim()) return toast.error('Informe o nome do lembrete.');
    if (!reminderForm.data && !reminderForm.km) return toast.error('Informe uma data ou quilometragem alvo.');
    const item: LembreteVeiculo = {
      id: crypto.randomUUID(), veiculoId: currentVehicleId, titulo: reminderForm.titulo.trim(),
      tipo: reminderForm.tipo, dataVencimento: reminderForm.data || null,
      quilometragemAlvo: reminderForm.km ? num(reminderForm.km) : null,
      lembrarDiasAntes: Number(reminderForm.diasAntes), lembrarHora: reminderForm.hora,
      notificar: reminderForm.notificar && Boolean(user), concluido: false,
    };
    await saveReminder(item);
    setReminderForm({ titulo: '', tipo: 'manutencao', data: '', km: '', diasAntes: '7', hora: '09:00', notificar: true });
    toast.success(user ? 'Lembrete salvo e integrado às notificações.' : 'Lembrete salvo localmente.');
  };

  if (loading) return <div className="min-h-[60vh] grid place-items-center text-muted-foreground">Carregando seus veículos...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-background dark:text-foreground">
      <div className="mx-auto w-full max-w-6xl px-3 pb-24 pt-4 sm:px-6 sm:py-8">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={() => navigate('/ferramentas')} className="rounded-xl"><ArrowLeft className="mr-1 h-4 w-4" />Voltar</Button>
          <Badge variant="outline" className="rounded-full bg-background/80">
            {user ? <Cloud className="mr-1 h-3.5 w-3.5 text-emerald-600" /> : <CloudOff className="mr-1 h-3.5 w-3.5" />}{storageLabel}
          </Badge>
        </div>

        <section className="mb-5 rounded-3xl border bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800 p-5 text-white shadow-xl sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white/15 p-3"><CarFront className="h-8 w-8" /></div>
            <div>
              <Badge className="mb-2 border-white/20 bg-white/10 text-white">Veículos • controle completo</Badge>
              <h1 className="text-2xl font-black tracking-tight sm:text-4xl">Meu Veículo</h1>
              <p className="mt-2 max-w-2xl text-sm text-blue-50 sm:text-base">Abastecimentos, consumo, gastos, manutenções, documentos e lembretes automáticos pelo Firebase.</p>
            </div>
          </div>
        </section>

        {!user && <Card className="mb-4 border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"><CardContent className="p-4 text-sm">Sem login, os dados ficam apenas neste aparelho. Entre na conta para sincronizar e receber notificações.</CardContent></Card>}
        {user && push.permission !== 'granted' && <Card className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">Ative notificações do veículo</p><p className="text-sm text-muted-foreground">Para receber IPVA, licenciamento, seguro e manutenção.</p></div><Button className="rounded-xl" onClick={() => void push.requestPermission()}><BellRing className="mr-2 h-4 w-4" />Ativar</Button></CardContent></Card>}
        {syncError && <Card className="mb-4 border-red-300"><CardContent className="p-4 text-sm text-red-700 dark:text-red-300">Sincronização pendente: {syncError}</CardContent></Card>}

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {veiculos.map((v) => <Button key={v.id} variant={currentVehicleId === v.id ? 'default' : 'outline'} className="shrink-0 rounded-2xl" onClick={() => setSelectedVehicleId(v.id)}><CarFront className="mr-2 h-4 w-4" />{v.apelido || `${v.marca} ${v.modelo}`.trim()}</Button>)}
        </div>

        {selectedVehicle && (
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="rounded-2xl"><CardContent className="p-4"><Gauge className="mb-2 h-5 w-5 text-sky-600" /><p className="text-xl font-black">{selectedVehicle.quilometragemAtual.toLocaleString('pt-BR')} km</p><p className="text-xs text-muted-foreground">Quilometragem</p></CardContent></Card>
            <Card className="rounded-2xl"><CardContent className="p-4"><Fuel className="mb-2 h-5 w-5 text-emerald-600" /><p className="text-xl font-black">{metrics.avgKmL ? `${metrics.avgKmL.toFixed(1)} km/L` : '—'}</p><p className="text-xs text-muted-foreground">Consumo médio</p></CardContent></Card>
            <Card className="rounded-2xl"><CardContent className="p-4"><Receipt className="mb-2 h-5 w-5 text-amber-600" /><p className="text-xl font-black">{currency.format(metrics.totalFuel)}</p><p className="text-xs text-muted-foreground">Combustível</p></CardContent></Card>
            <Card className="rounded-2xl"><CardContent className="p-4"><Wrench className="mb-2 h-5 w-5 text-violet-600" /><p className="text-xl font-black">{currency.format(metrics.totalMaintenance)}</p><p className="text-xs text-muted-foreground">Manutenções</p></CardContent></Card>
          </div>
        )}

        <Tabs defaultValue="resumo" className="space-y-4">
          <TabsList className="grid h-auto grid-cols-4 gap-1 bg-transparent p-0">
            <TabsTrigger value="resumo" className="rounded-2xl border bg-card py-3 text-xs"><CarFront className="mr-1 h-4 w-4" />Veículo</TabsTrigger>
            <TabsTrigger value="abastecer" className="rounded-2xl border bg-card py-3 text-xs"><Fuel className="mr-1 h-4 w-4" />Abastecer</TabsTrigger>
            <TabsTrigger value="manutencao" className="rounded-2xl border bg-card py-3 text-xs"><Wrench className="mr-1 h-4 w-4" />Manutenção</TabsTrigger>
            <TabsTrigger value="lembretes" className="rounded-2xl border bg-card py-3 text-xs"><CalendarClock className="mr-1 h-4 w-4" />Lembretes</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
            <Card className="rounded-3xl"><CardHeader><CardTitle><Plus className="mr-2 inline h-5 w-5 text-sky-600" />Adicionar veículo</CardTitle></CardHeader><CardContent><form onSubmit={saveVehicleForm} className="space-y-3">
              <div className="grid grid-cols-2 gap-3"><div><Label>Apelido</Label><Input value={vehicleForm.apelido} onChange={(e)=>setVehicleForm({...vehicleForm,apelido:e.target.value})} placeholder="Meu carro" /></div><div><Label>Placa</Label><Input value={vehicleForm.placa} onChange={(e)=>setVehicleForm({...vehicleForm,placa:e.target.value})} placeholder="ABC1D23" /></div></div>
              <div className="grid grid-cols-2 gap-3"><div><Label>Marca</Label><Input value={vehicleForm.marca} onChange={(e)=>setVehicleForm({...vehicleForm,marca:e.target.value})} /></div><div><Label>Modelo *</Label><Input value={vehicleForm.modelo} onChange={(e)=>setVehicleForm({...vehicleForm,modelo:e.target.value})} /></div></div>
              <div className="grid grid-cols-3 gap-3"><div><Label>Ano</Label><Input inputMode="numeric" value={vehicleForm.ano} onChange={(e)=>setVehicleForm({...vehicleForm,ano:e.target.value})} /></div><div><Label>Combustível</Label><Select value={vehicleForm.combustivel} onValueChange={(v)=>setVehicleForm({...vehicleForm,combustivel:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Flex">Flex</SelectItem><SelectItem value="Gasolina">Gasolina</SelectItem><SelectItem value="Etanol">Etanol</SelectItem><SelectItem value="Diesel">Diesel</SelectItem><SelectItem value="Elétrico">Elétrico</SelectItem><SelectItem value="Híbrido">Híbrido</SelectItem></SelectContent></Select></div><div><Label>Km atual</Label><Input inputMode="numeric" value={vehicleForm.km} onChange={(e)=>setVehicleForm({...vehicleForm,km:e.target.value})} /></div></div>
              <Button className="w-full rounded-xl">Salvar veículo</Button>
            </form></CardContent></Card>

            <Card className="rounded-3xl"><CardHeader><CardTitle>Meus veículos</CardTitle></CardHeader><CardContent className="space-y-3">
              {veiculos.length === 0 ? <p className="text-sm text-muted-foreground">Cadastre seu primeiro carro, moto ou outro veículo.</p> : veiculos.map((v)=><div key={v.id} className="flex items-center justify-between rounded-2xl border p-4"><div><p className="font-black">{v.apelido || `${v.marca} ${v.modelo}`}</p><p className="text-sm text-muted-foreground">{[v.marca,v.modelo,v.ano,v.placa].filter(Boolean).join(' • ')} • {v.quilometragemAtual.toLocaleString('pt-BR')} km</p></div><Button size="icon" variant="ghost" onClick={()=>{if(confirm(`Excluir ${v.apelido || v.modelo}?`)) void removeVehicle(v.id)}}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>)}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="abastecer" className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
            <Card className="rounded-3xl"><CardHeader><CardTitle>Novo abastecimento</CardTitle></CardHeader><CardContent><form onSubmit={saveFuelForm} className="space-y-3">
              <div className="grid grid-cols-2 gap-3"><div><Label>Data</Label><Input type="date" value={fuelForm.data} onChange={(e)=>setFuelForm({...fuelForm,data:e.target.value})} /></div><div><Label>Km do veículo</Label><Input inputMode="numeric" value={fuelForm.km} onChange={(e)=>setFuelForm({...fuelForm,km:e.target.value})} /></div></div>
              <div className="grid grid-cols-2 gap-3"><div><Label>Litros</Label><Input inputMode="decimal" value={fuelForm.litros} onChange={(e)=>setFuelForm({...fuelForm,litros:e.target.value})} /></div><div><Label>Valor total</Label><Input inputMode="decimal" value={fuelForm.valor} onChange={(e)=>setFuelForm({...fuelForm,valor:e.target.value})} /></div></div>
              <div className="grid grid-cols-2 gap-3"><div><Label>Combustível</Label><Select value={fuelForm.combustivel} onValueChange={(v)=>setFuelForm({...fuelForm,combustivel:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Gasolina">Gasolina</SelectItem><SelectItem value="Etanol">Etanol</SelectItem><SelectItem value="Diesel">Diesel</SelectItem><SelectItem value="GNV">GNV</SelectItem></SelectContent></Select></div><div><Label>Posto</Label><Input value={fuelForm.posto} onChange={(e)=>setFuelForm({...fuelForm,posto:e.target.value})} /></div></div>
              <div className="flex items-center justify-between rounded-2xl border p-3"><div><p className="font-bold">Tanque completo</p><p className="text-xs text-muted-foreground">Ajuda a calcular consumo em km/L.</p></div><Switch checked={fuelForm.tanqueCompleto} onCheckedChange={(v)=>setFuelForm({...fuelForm,tanqueCompleto:v})} /></div>
              <Button className="w-full rounded-xl">Registrar abastecimento</Button>
            </form></CardContent></Card>
            <Card className="rounded-3xl"><CardHeader><CardTitle>Histórico de abastecimentos</CardTitle></CardHeader><CardContent className="space-y-2">{ownFuel.length===0?<p className="text-sm text-muted-foreground">Nenhum abastecimento neste veículo.</p>:ownFuel.slice(0,20).map((a)=><div key={a.id} className="flex items-center justify-between rounded-2xl border p-3"><div><p className="font-bold">{currency.format(a.valorTotal)} • {a.litros.toFixed(2)} L</p><p className="text-xs text-muted-foreground">{new Date(a.data+'T12:00:00').toLocaleDateString('pt-BR')} • {a.quilometragem.toLocaleString('pt-BR')} km • {a.combustivel}</p></div><Button size="icon" variant="ghost" onClick={()=>void removeFuel(a.id)}><Trash2 className="h-4 w-4" /></Button></div>)}</CardContent></Card>
          </TabsContent>

          <TabsContent value="manutencao" className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
            <Card className="rounded-3xl"><CardHeader><CardTitle>Registrar manutenção</CardTitle></CardHeader><CardContent><form onSubmit={saveMaintenanceForm} className="space-y-3">
              <div><Label>Serviço</Label><Select value={maintenanceForm.tipo} onValueChange={(v)=>setMaintenanceForm({...maintenanceForm,tipo:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Troca de óleo','Revisão','Pneus','Freios','Bateria','Alinhamento/Balanceamento','Ar-condicionado','Outro'].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-3"><div><Label>Data</Label><Input type="date" value={maintenanceForm.data} onChange={(e)=>setMaintenanceForm({...maintenanceForm,data:e.target.value})} /></div><div><Label>Km</Label><Input inputMode="numeric" value={maintenanceForm.km} onChange={(e)=>setMaintenanceForm({...maintenanceForm,km:e.target.value})} /></div></div>
              <div className="grid grid-cols-2 gap-3"><div><Label>Valor</Label><Input inputMode="decimal" value={maintenanceForm.valor} onChange={(e)=>setMaintenanceForm({...maintenanceForm,valor:e.target.value})} /></div><div><Label>Oficina</Label><Input value={maintenanceForm.oficina} onChange={(e)=>setMaintenanceForm({...maintenanceForm,oficina:e.target.value})} /></div></div>
              <div><Label>Observações</Label><Textarea value={maintenanceForm.observacao} onChange={(e)=>setMaintenanceForm({...maintenanceForm,observacao:e.target.value})} /></div>
              <Button className="w-full rounded-xl">Salvar manutenção</Button>
            </form></CardContent></Card>
            <Card className="rounded-3xl"><CardHeader><CardTitle>Histórico de manutenção</CardTitle></CardHeader><CardContent className="space-y-2">{ownMaintenance.length===0?<p className="text-sm text-muted-foreground">Nenhuma manutenção registrada.</p>:ownMaintenance.map((m)=><div key={m.id} className="flex items-center justify-between rounded-2xl border p-3"><div><p className="font-bold">{m.tipo} • {currency.format(m.valor)}</p><p className="text-xs text-muted-foreground">{new Date(m.data+'T12:00:00').toLocaleDateString('pt-BR')}{m.quilometragem?` • ${m.quilometragem.toLocaleString('pt-BR')} km`:''}{m.oficina?` • ${m.oficina}`:''}</p></div><Button size="icon" variant="ghost" onClick={()=>void removeMaintenance(m.id)}><Trash2 className="h-4 w-4" /></Button></div>)}</CardContent></Card>
          </TabsContent>

          <TabsContent value="lembretes" className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
            <Card className="rounded-3xl"><CardHeader><CardTitle>Novo lembrete</CardTitle></CardHeader><CardContent><form onSubmit={saveReminderForm} className="space-y-3">
              <div><Label>Título</Label><Input value={reminderForm.titulo} onChange={(e)=>setReminderForm({...reminderForm,titulo:e.target.value})} placeholder="Ex.: Licenciamento 2027" /></div>
              <div><Label>Tipo</Label><Select value={reminderForm.tipo} onValueChange={(v)=>setReminderForm({...reminderForm,tipo:v as LembreteVeiculo['tipo']})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="documento">Documento/IPVA/licenciamento</SelectItem><SelectItem value="manutencao">Manutenção</SelectItem><SelectItem value="seguro">Seguro</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-3"><div><Label>Data limite</Label><Input type="date" value={reminderForm.data} onChange={(e)=>setReminderForm({...reminderForm,data:e.target.value})} /></div><div><Label>Km alvo</Label><Input inputMode="numeric" value={reminderForm.km} onChange={(e)=>setReminderForm({...reminderForm,km:e.target.value})} placeholder="Ex.: 60000" /></div></div>
              <div className="grid grid-cols-2 gap-3"><div><Label>Avisar antes</Label><Select value={reminderForm.diasAntes} onValueChange={(v)=>setReminderForm({...reminderForm,diasAntes:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">No dia</SelectItem><SelectItem value="1">1 dia antes</SelectItem><SelectItem value="3">3 dias antes</SelectItem><SelectItem value="7">7 dias antes</SelectItem><SelectItem value="15">15 dias antes</SelectItem><SelectItem value="30">30 dias antes</SelectItem></SelectContent></Select></div><div><Label>Horário</Label><Input type="time" value={reminderForm.hora} onChange={(e)=>setReminderForm({...reminderForm,hora:e.target.value})} /></div></div>
              <div className="flex items-center justify-between rounded-2xl border p-3"><div><p className="font-bold">Notificação Firebase</p><p className="text-xs text-muted-foreground">Disponível quando estiver logado.</p></div><Switch checked={reminderForm.notificar && Boolean(user)} disabled={!user} onCheckedChange={(v)=>setReminderForm({...reminderForm,notificar:v})} /></div>
              <Button className="w-full rounded-xl"><BellRing className="mr-2 h-4 w-4" />Salvar lembrete</Button>
            </form></CardContent></Card>

            <Card className="rounded-3xl"><CardHeader><CardTitle>Próximos cuidados</CardTitle></CardHeader><CardContent className="space-y-2">{ownReminders.length===0?<p className="text-sm text-muted-foreground">Nenhum lembrete cadastrado.</p>:ownReminders.map((l)=>{
              const kmReached = l.quilometragemAlvo!=null && selectedVehicle && selectedVehicle.quilometragemAtual >= l.quilometragemAlvo;
              return <div key={l.id} className={`rounded-2xl border p-3 ${kmReached&&!l.concluido?'border-amber-400 bg-amber-50 dark:bg-amber-950/20':''}`}><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{l.titulo}</p>{l.notificar&&<BellRing className="h-3.5 w-3.5 text-blue-600" />}{kmReached&&<Badge className="bg-amber-500">Km atingida</Badge>}{l.concluido&&<Badge className="bg-emerald-600"><CheckCircle2 className="mr-1 h-3 w-3" />Concluído</Badge>}</div><p className="mt-1 text-xs text-muted-foreground">{l.dataVencimento?`Data: ${new Date(l.dataVencimento+'T12:00:00').toLocaleDateString('pt-BR')}`:''}{l.dataVencimento&&l.quilometragemAlvo?' • ':''}{l.quilometragemAlvo?`Alvo: ${l.quilometragemAlvo.toLocaleString('pt-BR')} km`:''}</p></div><div className="flex"><Button size="sm" variant="outline" className="rounded-xl" onClick={()=>void saveReminder({...l,concluido:!l.concluido})}>{l.concluido?'Reabrir':'Concluir'}</Button><Button size="icon" variant="ghost" onClick={()=>void removeReminder(l.id)}><Trash2 className="h-4 w-4" /></Button></div></div></div>;
            })}</CardContent></Card>
          </TabsContent>
        </Tabs>

        <div className="mt-5 flex gap-2 rounded-2xl border bg-background p-4 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" /><p>Seus dados de veículos são privados. Os lembretes ajudam na organização, mas datas e obrigações legais devem ser conferidas nos canais oficiais correspondentes.</p></div>
      </div>
    </div>
  );
};

export default MeuVeiculo;

