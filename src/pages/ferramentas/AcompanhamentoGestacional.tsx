import { useEffect, useMemo, useState } from 'react';
import { addDays, differenceInCalendarDays, format, isBefore, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Baby,
  BellRing,
  Clock3,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  Cloud,
  CloudOff,
  HeartPulse,
  NotebookPen,
  Plus,
  Save,
  Sparkles,
  Stethoscope,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { GestacaoDiario, GestacaoEvento, GestacaoPerfil, useGestacaoStorage } from '@/hooks/useGestacaoStorage';
import { usePushNotifications } from '@/contexts/PushNotificationsContext';

const sintomasDisponiveis = [
  'Náusea', 'Azia', 'Cansaço', 'Dor nas costas', 'Dor de cabeça', 'Inchaço', 'Câimbras', 'Sono', 'Ansiedade', 'Bem-estar',
];

const marcos = [
  { semana: 8, titulo: 'Início do pré-natal', texto: 'Organize consultas, exames iniciais e dúvidas para levar ao profissional de saúde.' },
  { semana: 12, titulo: 'Fim do 1º trimestre', texto: 'Momento de revisar a datação da gestação e os exames já realizados.' },
  { semana: 20, titulo: 'Metade da gestação', texto: 'Uma boa fase para revisar consultas, ultrassons e preparação para os próximos meses.' },
  { semana: 28, titulo: 'Entrada no 3º trimestre', texto: 'Reforce o calendário de consultas e a preparação para o nascimento.' },
  { semana: 36, titulo: 'Reta final', texto: 'Deixe documentos, plano de ida à maternidade e contatos importantes organizados.' },
  { semana: 40, titulo: 'DPP estimada', texto: 'A data provável do parto é uma estimativa; siga a orientação da equipe que acompanha a gestação.' },
];

const formatDate = (date?: string) => {
  if (!date) return '—';
  try { return format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }); } catch { return date; }
};

const AcompanhamentoGestacional = () => {
  const { toast } = useToast();
  const push = usePushNotifications();
  const {
    user, perfil, eventos, diario, loading, syncStatus, syncError,
    savePerfil, saveEvento, removeEvento, saveDiario, removeDiario,
  } = useGestacaoStorage();

  const [activeTab, setActiveTab] = useState('visao-geral');
  const [profileForm, setProfileForm] = useState<GestacaoPerfil>(() => perfil || {
    dum: '', dpp: '', metodoCalculo: 'dum', nomeBebe: '', observacaoMedica: '',
  });

  useEffect(() => {
    if (perfil) setProfileForm(perfil);
  }, [perfil]);

  const [eventoForm, setEventoForm] = useState({
    titulo: '',
    data: '',
    hora: '09:00',
    tipo: 'consulta' as GestacaoEvento['tipo'],
    observacao: '',
    notificar: true,
    lembreteMinutosAntes: 1440,
  });
  const [diarioForm, setDiarioForm] = useState({ data: format(new Date(), 'yyyy-MM-dd'), humor: '', sintomas: [] as string[], peso: '', observacao: '' });

  const calc = useMemo(() => {
    const dpp = perfil?.dpp ? parseISO(perfil.dpp) : (perfil?.dum ? addDays(parseISO(perfil.dum), 280) : null);
    const reference = perfil?.dum ? parseISO(perfil.dum) : (dpp ? addDays(dpp, -280) : null);
    if (!reference || !dpp) return null;

    const today = startOfDay(new Date());
    const elapsed = Math.max(0, differenceInCalendarDays(today, reference));
    const weeks = Math.floor(elapsed / 7);
    const days = elapsed % 7;
    const remaining = differenceInCalendarDays(dpp, today);
    const progress = Math.min(100, Math.max(0, (elapsed / 280) * 100));
    const trimester = weeks < 14 ? 1 : weeks < 28 ? 2 : 3;
    return { dpp, weeks, days, remaining, progress, trimester };
  }, [perfil]);

  const saveProfile = async () => {
    if (!profileForm.dum && !profileForm.dpp) {
      toast({ title: 'Informe uma data', description: 'Use a DUM ou uma DPP definida pelo profissional de saúde.', variant: 'destructive' });
      return;
    }

    let next = { ...profileForm };
    if (profileForm.metodoCalculo === 'dum' && profileForm.dum) {
      next.dpp = format(addDays(parseISO(profileForm.dum), 280), 'yyyy-MM-dd');
    }
    await savePerfil(next);
    setProfileForm(next);
    toast({ title: 'Gestação atualizada', description: user ? 'Dados salvos na sua conta.' : 'Dados salvos neste aparelho. Entre na conta para sincronizar.' });
  };

  const addEvento = async () => {
    if (!eventoForm.titulo.trim() || !eventoForm.data) return;
    await saveEvento({
      id: crypto.randomUUID(),
      titulo: eventoForm.titulo.trim(),
      data: eventoForm.data,
      tipo: eventoForm.tipo,
      concluido: false,
      observacao: eventoForm.observacao.trim(),
      hora: eventoForm.hora,
      notificar: Boolean(user && eventoForm.notificar),
      lembreteMinutosAntes: eventoForm.lembreteMinutosAntes,
    });
    setEventoForm({ titulo: '', data: '', hora: '09:00', tipo: 'consulta', observacao: '', notificar: true, lembreteMinutosAntes: 1440 });
    if (eventoForm.notificar && !user) {
      toast({ title: 'Compromisso salvo', description: 'Entre na sua conta para receber o lembrete automático no celular.' });
    }
  };

  const addDiario = async () => {
    await saveDiario({
      id: crypto.randomUUID(),
      data: diarioForm.data,
      humor: diarioForm.humor,
      sintomas: diarioForm.sintomas,
      peso: diarioForm.peso ? Number(diarioForm.peso.replace(',', '.')) : null,
      observacao: diarioForm.observacao.trim(),
    });
    setDiarioForm({ data: format(new Date(), 'yyyy-MM-dd'), humor: '', sintomas: [], peso: '', observacao: '' });
  };

  const toggleSintoma = (sintoma: string) => {
    setDiarioForm((prev) => ({
      ...prev,
      sintomas: prev.sintomas.includes(sintoma) ? prev.sintomas.filter((item) => item !== sintoma) : [...prev.sintomas, sintoma],
    }));
  };

  const próximosEventos = eventos.filter((e) => !e.concluido && !isBefore(parseISO(e.data), startOfDay(new Date()))).slice(0, 4);
  const completed = eventos.filter((e) => e.concluido).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-8">
        <div className="mb-4 rounded-3xl border border-rose-200/70 bg-gradient-to-br from-rose-500/15 via-fuchsia-500/5 to-background p-4 shadow-sm dark:border-rose-900/40 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <Badge className="w-fit bg-rose-600 text-white hover:bg-rose-600"><Baby className="mr-1 h-3.5 w-3.5" /> Saúde • Gestação</Badge>
              <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-4xl">Acompanhamento Gestacional</h1>
              <p className="max-w-2xl text-sm font-medium text-muted-foreground sm:text-base">Semanas, DPP, agenda, diário e marcos da gravidez em um só lugar.</p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border bg-background/85 px-3 py-2 text-xs font-semibold shadow-sm">
              {syncStatus === 'synced' && <><Cloud className="h-4 w-4 text-emerald-600" /> Sincronizado na conta</>}
              {syncStatus === 'syncing' && <><Cloud className="h-4 w-4 animate-pulse text-blue-600" /> Sincronizando</>}
              {syncStatus === 'error' && <><CloudOff className="h-4 w-4 text-destructive" /> Sincronização pendente</>}
              {syncStatus === 'local' && <><CloudOff className="h-4 w-4 text-amber-600" /> Somente neste aparelho</>}
            </div>
          </div>
        </div>

        {!user && (
          <Alert className="mb-4 border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            <CloudOff className="h-4 w-4" />
            <AlertTitle>Entre na sua conta para não perder o acompanhamento</AlertTitle>
            <AlertDescription>Sem login, os dados ficam apenas neste aparelho. Com login, o histórico é sincronizado com o Supabase.</AlertDescription>
          </Alert>
        )}
        {syncError && <p className="mb-4 text-sm text-destructive">{syncError}</p>}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid h-auto w-full grid-cols-4 gap-2 bg-transparent p-0">
            {[
              ['visao-geral', HeartPulse, 'Resumo'],
              ['agenda', CalendarDays, 'Agenda'],
              ['diario', NotebookPen, 'Diário'],
              ['configurar', Stethoscope, 'Gestação'],
            ].map(([value, Icon, label]: any) => (
              <TabsTrigger key={value} value={value} className="group flex h-20 flex-col gap-1 rounded-2xl border bg-card px-1 text-[11px] font-bold shadow-sm data-[state=active]:border-rose-500 data-[state=active]:bg-rose-500 data-[state=active]:text-white sm:h-16 sm:flex-row sm:px-4 sm:text-sm">
                <Icon className="h-5 w-5" /><span>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="visao-geral" className="mt-4 space-y-4">
            {!perfil ? (
              <Card className="border-dashed border-rose-300">
                <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                  <Baby className="h-12 w-12 text-rose-500" />
                  <div><h2 className="text-xl font-bold">Comece configurando a gestação</h2><p className="text-sm text-muted-foreground">Informe a DUM ou uma DPP confirmada pelo profissional que acompanha o pré-natal.</p></div>
                  <Button onClick={() => setActiveTab('configurar')} className="rounded-xl bg-rose-600 hover:bg-rose-700">Configurar agora <ChevronRight className="ml-1 h-4 w-4" /></Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="border-rose-200 dark:border-rose-900"><CardContent className="p-4"><p className="text-xs font-bold uppercase text-muted-foreground">Idade gestacional</p><p className="mt-1 text-2xl font-black text-rose-600">{calc?.weeks ?? 0}s {calc?.days ?? 0}d</p><p className="text-xs text-muted-foreground">{calc?.trimester}º trimestre</p></CardContent></Card>
                  <Card><CardContent className="p-4"><p className="text-xs font-bold uppercase text-muted-foreground">DPP</p><p className="mt-1 text-lg font-black">{formatDate(perfil.dpp)}</p><p className="text-xs text-muted-foreground">{perfil.metodoCalculo === 'ultrassom' ? 'Informada por ultrassom/profissional' : 'Estimativa pela DUM'}</p></CardContent></Card>
                  <Card><CardContent className="p-4"><p className="text-xs font-bold uppercase text-muted-foreground">Faltam aproximadamente</p><p className="mt-1 text-2xl font-black">{Math.max(0, calc?.remaining ?? 0)} dias</p><p className="text-xs text-muted-foreground">até a DPP estimada</p></CardContent></Card>
                  <Card><CardContent className="p-4"><p className="text-xs font-bold uppercase text-muted-foreground">Agenda</p><p className="mt-1 text-2xl font-black">{eventos.length}</p><p className="text-xs text-muted-foreground">{completed} concluídos</p></CardContent></Card>
                </div>

                <Card className="overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="mb-2 flex items-center justify-between"><span className="font-bold">Progresso da gestação</span><span className="text-sm font-bold text-rose-600">{Math.round(calc?.progress ?? 0)}%</span></div>
                    <Progress value={calc?.progress ?? 0} className="h-3" />
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {marcos.map((marco) => {
                        const reached = (calc?.weeks ?? 0) >= marco.semana;
                        return <div key={marco.semana} className={`rounded-2xl border p-3 ${reached ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20' : 'bg-muted/30'}`}><div className="flex items-center gap-2"><div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${reached ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>{marco.semana}</div><p className="font-bold">{marco.titulo}</p></div><p className="mt-2 text-xs text-muted-foreground">{marco.texto}</p></div>;
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><CalendarDays className="h-5 w-5 text-rose-500" /> Próximos compromissos</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {próximosEventos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum compromisso futuro cadastrado.</p> : próximosEventos.map((evento) => <div key={evento.id} className="flex items-center justify-between rounded-xl border p-3"><div><p className="font-bold">{evento.titulo}</p><p className="text-xs text-muted-foreground">{formatDate(evento.data)} • {evento.tipo}</p></div><Badge variant="outline">Pendente</Badge></div>)}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="agenda" className="mt-4 grid gap-4 lg:grid-cols-[400px_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Novo compromisso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input value={eventoForm.titulo} onChange={(e) => setEventoForm({ ...eventoForm, titulo: e.target.value })} placeholder="Consulta de pré-natal" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Data</Label>
                    <Input type="date" value={eventoForm.data} onChange={(e) => setEventoForm({ ...eventoForm, data: e.target.value })} />
                  </div>
                  <div>
                    <Label>Horário</Label>
                    <Input type="time" value={eventoForm.hora} onChange={(e) => setEventoForm({ ...eventoForm, hora: e.target.value })} />
                  </div>
                </div>

                <div>
                  <Label>Tipo</Label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(['consulta','exame','lembrete'] as const).map((tipo) => (
                      <Button key={tipo} type="button" variant={eventoForm.tipo === tipo ? 'default' : 'outline'} className="capitalize" onClick={() => setEventoForm({ ...eventoForm, tipo })}>{tipo}</Button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3 dark:border-rose-900/60 dark:bg-rose-950/20">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-2">
                      <BellRing className="mt-0.5 h-5 w-5 text-rose-600" />
                      <div>
                        <p className="text-sm font-bold">Lembrete automático</p>
                        <p className="text-xs text-muted-foreground">O Saj Tem agenda o aviso e o Firebase envia mesmo com o app fechado.</p>
                      </div>
                    </div>
                    <Switch checked={eventoForm.notificar} onCheckedChange={(notificar) => setEventoForm({ ...eventoForm, notificar })} disabled={!user} />
                  </div>

                  {eventoForm.notificar && user && (
                    <div className="mt-3">
                      <Label htmlFor="gestacao-reminder">Avisar</Label>
                      <select
                        id="gestacao-reminder"
                        value={eventoForm.lembreteMinutosAntes}
                        onChange={(e) => setEventoForm({ ...eventoForm, lembreteMinutosAntes: Number(e.target.value) })}
                        className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                      >
                        <option value={60}>1 hora antes</option>
                        <option value={180}>3 horas antes</option>
                        <option value={720}>12 horas antes</option>
                        <option value={1440}>1 dia antes</option>
                        <option value={2880}>2 dias antes</option>
                        <option value={10080}>7 dias antes</option>
                      </select>
                    </div>
                  )}

                  {!user && <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">Faça login para sincronizar e receber lembretes.</p>}
                  {user && eventoForm.notificar && !push.enabled && (
                    <Button type="button" variant="outline" size="sm" className="mt-3 w-full rounded-xl" disabled={push.loading || !push.supported} onClick={() => void push.enable()}>
                      <BellRing className="mr-2 h-4 w-4" /> Ativar notificações neste aparelho
                    </Button>
                  )}
                </div>

                <div>
                  <Label>Observação</Label>
                  <Textarea value={eventoForm.observacao} onChange={(e) => setEventoForm({ ...eventoForm, observacao: e.target.value })} />
                </div>

                <Button className="w-full bg-rose-600 hover:bg-rose-700" onClick={addEvento}><Plus className="mr-2 h-4 w-4" />Adicionar</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Minha agenda</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {eventos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum compromisso cadastrado.</p> : eventos.map((evento) => (
                  <div key={evento.id} className="flex items-start gap-3 rounded-2xl border p-3">
                    <Checkbox checked={evento.concluido} onCheckedChange={(checked) => saveEvento({ ...evento, concluido: Boolean(checked) })} className="mt-1" />
                    <div className="min-w-0 flex-1">
                      <p className={`font-bold ${evento.concluido ? 'line-through opacity-60' : ''}`}>{evento.titulo}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(evento.data)}{evento.hora ? ` às ${evento.hora}` : ''} • {evento.tipo}</p>
                      {evento.notificar && !evento.concluido && <Badge variant="secondary" className="mt-2"><BellRing className="mr-1 h-3 w-3" /> Lembrete ativo</Badge>}
                      {evento.observacao && <p className="mt-1 text-sm text-muted-foreground">{evento.observacao}</p>}
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeEvento(evento.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diario" className="mt-4 grid gap-4 lg:grid-cols-[420px_1fr]">
            <Card><CardHeader><CardTitle>Registrar meu dia</CardTitle></CardHeader><CardContent className="space-y-3"><div><Label>Data</Label><Input type="date" value={diarioForm.data} onChange={(e) => setDiarioForm({ ...diarioForm, data: e.target.value })} /></div><div><Label>Como você está se sentindo?</Label><Input value={diarioForm.humor} onChange={(e) => setDiarioForm({ ...diarioForm, humor: e.target.value })} placeholder="Ex.: tranquila, cansada..." /></div><div><Label>Sintomas / sensações</Label><div className="mt-2 flex flex-wrap gap-2">{sintomasDisponiveis.map((item) => <button key={item} type="button" onClick={() => toggleSintoma(item)} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${diarioForm.sintomas.includes(item) ? 'border-rose-600 bg-rose-600 text-white' : 'bg-card hover:border-rose-400'}`}>{item}</button>)}</div></div><div><Label>Peso (kg, opcional)</Label><Input inputMode="decimal" value={diarioForm.peso} onChange={(e) => setDiarioForm({ ...diarioForm, peso: e.target.value })} /></div><div><Label>Anotações</Label><Textarea value={diarioForm.observacao} onChange={(e) => setDiarioForm({ ...diarioForm, observacao: e.target.value })} placeholder="Dúvidas para a próxima consulta, acontecimentos do dia..." /></div><Button className="w-full bg-rose-600 hover:bg-rose-700" onClick={addDiario}><Save className="mr-2 h-4 w-4" />Salvar no diário</Button></CardContent></Card>
            <Card><CardHeader><CardTitle>Histórico</CardTitle></CardHeader><CardContent className="space-y-3">{diario.length === 0 ? <p className="text-sm text-muted-foreground">Ainda não há registros.</p> : diario.map((registro) => <div key={registro.id} className="rounded-2xl border p-3"><div className="flex items-start justify-between"><div><p className="font-bold">{formatDate(registro.data)}</p><p className="text-sm text-muted-foreground">{registro.humor || 'Sem humor informado'}{registro.peso ? ` • ${registro.peso} kg` : ''}</p></div><Button size="icon" variant="ghost" onClick={() => removeDiario(registro.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>{registro.sintomas.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{registro.sintomas.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}</div>}{registro.observacao && <p className="mt-2 text-sm">{registro.observacao}</p>}</div>)}</CardContent></Card>
          </TabsContent>

          <TabsContent value="configurar" className="mt-4">
            <Card className="mx-auto max-w-2xl"><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-rose-500" /> Dados da gestação</CardTitle></CardHeader><CardContent className="space-y-4"><div><Label>Como deseja definir a DPP?</Label><div className="mt-2 grid grid-cols-2 gap-2"><Button type="button" variant={profileForm.metodoCalculo === 'dum' ? 'default' : 'outline'} onClick={() => setProfileForm({ ...profileForm, metodoCalculo: 'dum' })}>Calcular pela DUM</Button><Button type="button" variant={profileForm.metodoCalculo === 'ultrassom' ? 'default' : 'outline'} onClick={() => setProfileForm({ ...profileForm, metodoCalculo: 'ultrassom' })}>DPP por ultrassom</Button></div></div><div><Label>Primeiro dia da última menstruação (DUM)</Label><Input type="date" value={profileForm.dum} onChange={(e) => setProfileForm({ ...profileForm, dum: e.target.value })} /><p className="mt-1 text-xs text-muted-foreground">Se usar a DUM, o app estima a DPP em 280 dias. Ciclos irregulares podem reduzir a precisão.</p></div>{profileForm.metodoCalculo === 'ultrassom' && <div><Label>DPP informada pelo profissional</Label><Input type="date" value={profileForm.dpp} onChange={(e) => setProfileForm({ ...profileForm, dpp: e.target.value })} /></div>}<div><Label>Nome/apelido do bebê (opcional)</Label><Input value={profileForm.nomeBebe} onChange={(e) => setProfileForm({ ...profileForm, nomeBebe: e.target.value })} /></div><div><Label>Observação médica (opcional)</Label><Textarea value={profileForm.observacaoMedica} onChange={(e) => setProfileForm({ ...profileForm, observacaoMedica: e.target.value })} placeholder="Ex.: DPP ajustada no ultrassom de primeiro trimestre" /></div><Button className="w-full bg-rose-600 hover:bg-rose-700" onClick={saveProfile} disabled={loading}><Save className="mr-2 h-4 w-4" />Salvar gestação</Button></CardContent></Card>
          </TabsContent>
        </Tabs>

        <Alert className="mt-5 border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-100">
          <ClipboardCheck className="h-4 w-4" />
          <AlertTitle>Ferramenta de organização, não diagnóstico</AlertTitle>
          <AlertDescription>Datas, semanas e marcos são estimativas para organização pessoal. Pré-natal, exames, sintomas preocupantes e qualquer decisão clínica devem ser discutidos com um profissional de saúde.</AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default AcompanhamentoGestacional;

