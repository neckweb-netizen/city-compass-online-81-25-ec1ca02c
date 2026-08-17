import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Droplets,
  HeartPulse,
  Info,
  LockKeyhole,
  Moon,
  RotateCcw,
  Save,
  ShieldAlert,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ToolBanner } from '@/components/ferramentas/ToolBanner';

type FlowLevel = 'nenhum' | 'leve' | 'moderado' | 'intenso';
type Mood = 'otimo' | 'bem' | 'neutro' | 'sensivel' | 'irritada' | 'triste' | 'ansiosa';

type CycleSettings = {
  lastPeriodStart: string;
  averageCycleLength: number;
  periodDuration: number;
};

type PeriodRecord = {
  id: string;
  startDate: string;
  duration: number;
};

type DailyLog = {
  date: string;
  flow: FlowLevel;
  mood: Mood | '';
  symptoms: string[];
  note: string;
};

type StoredData = {
  settings: CycleSettings;
  periods: PeriodRecord[];
  logs: Record<string, DailyLog>;
};

const STORAGE_KEY = 'sajtem:ciclo-menstrual:v1';

const DEFAULT_SETTINGS: CycleSettings = {
  lastPeriodStart: '',
  averageCycleLength: 28,
  periodDuration: 5,
};

const SYMPTOMS = [
  'Cólica',
  'Dor de cabeça',
  'Dor nas costas',
  'Inchaço',
  'Seios sensíveis',
  'Acne',
  'Fadiga',
  'Náusea',
  'Desejo por doces',
  'Insônia',
  'Corrimento',
  'Libido alta',
];

const MOOD_LABELS: Record<Exclude<Mood, ''>, string> = {
  otimo: 'Ótimo',
  bem: 'Bem',
  neutro: 'Neutro',
  sensivel: 'Sensível',
  irritada: 'Irritada',
  triste: 'Triste',
  ansiosa: 'Ansiosa',
};

const FLOW_LABELS: Record<FlowLevel, string> = {
  nenhum: 'Sem fluxo',
  leve: 'Leve',
  moderado: 'Moderado',
  intenso: 'Intenso',
};

const safeParseDate = (value?: string) => {
  if (!value) return null;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const getCalendarDays = (month: Date) => {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days: Date[] = [];
  let cursor = start;

  while (!isAfter(cursor, end)) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return days;
};

const isDateInRange = (date: Date, start: Date, end: Date) =>
  !isBefore(date, start) && !isAfter(date, end);

const CicloMenstrual = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [settings, setSettings] = useState<CycleSettings>(DEFAULT_SETTINGS);
  const [periods, setPeriods] = useState<PeriodRecord[]>([]);
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newPeriodStart, setNewPeriodStart] = useState(toDateKey(new Date()));
  const [newPeriodDuration, setNewPeriodDuration] = useState(5);

  const selectedKey = toDateKey(selectedDate);
  const selectedLog = logs[selectedKey] ?? {
    date: selectedKey,
    flow: 'nenhum' as FlowLevel,
    mood: '' as Mood | '',
    symptoms: [],
    note: '',
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredData>;
        if (parsed.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
        }
        if (Array.isArray(parsed.periods)) {
          setPeriods(parsed.periods);
        }
        if (parsed.logs && typeof parsed.logs === 'object') {
          setLogs(parsed.logs);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do ciclo menstrual:', error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    const payload: StoredData = { settings, periods, logs };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [loaded, settings, periods, logs]);

  const sortedPeriods = useMemo(
    () => [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [periods],
  );

  const calculatedAverageCycle = useMemo(() => {
    if (sortedPeriods.length < 2) return settings.averageCycleLength;

    const intervals: number[] = [];
    for (let i = 1; i < sortedPeriods.length; i += 1) {
      const previous = safeParseDate(sortedPeriods[i - 1].startDate);
      const current = safeParseDate(sortedPeriods[i].startDate);
      if (!previous || !current) continue;

      const diff = differenceInCalendarDays(current, previous);
      if (diff >= 15 && diff <= 60) intervals.push(diff);
    }

    if (!intervals.length) return settings.averageCycleLength;
    return Math.round(intervals.reduce((sum, value) => sum + value, 0) / intervals.length);
  }, [settings.averageCycleLength, sortedPeriods]);

  const lastPeriodStart = useMemo(() => {
    const latestRecorded = [...sortedPeriods].reverse().find((item) => safeParseDate(item.startDate));
    return safeParseDate(latestRecorded?.startDate) ?? safeParseDate(settings.lastPeriodStart);
  }, [settings.lastPeriodStart, sortedPeriods]);

  const predictions = useMemo(() => {
    if (!lastPeriodStart) return [];

    const items = [];
    for (let index = 1; index <= 6; index += 1) {
      const periodStart = addDays(lastPeriodStart, calculatedAverageCycle * index);
      const periodEnd = addDays(periodStart, settings.periodDuration - 1);
      const ovulation = addDays(periodStart, -14);
      const fertileStart = addDays(ovulation, -5);
      const fertileEnd = addDays(ovulation, 1);
      items.push({ periodStart, periodEnd, ovulation, fertileStart, fertileEnd });
    }
    return items;
  }, [calculatedAverageCycle, lastPeriodStart, settings.periodDuration]);

  const nextPrediction = predictions[0];

  const cycleDay = useMemo(() => {
    if (!lastPeriodStart) return null;
    const diff = differenceInCalendarDays(new Date(), lastPeriodStart);
    if (diff < 0) return null;
    return (diff % calculatedAverageCycle) + 1;
  }, [calculatedAverageCycle, lastPeriodStart]);

  const variation = useMemo(() => {
    if (sortedPeriods.length < 3) return null;
    const diffs: number[] = [];
    for (let i = 1; i < sortedPeriods.length; i += 1) {
      const current = safeParseDate(sortedPeriods[i].startDate);
      const previous = safeParseDate(sortedPeriods[i - 1].startDate);
      if (!current || !previous) continue;
      const diff = differenceInCalendarDays(current, previous);
      if (diff >= 15 && diff <= 60) diffs.push(diff);
    }
    if (diffs.length < 2) return null;
    return Math.max(...diffs) - Math.min(...diffs);
  }, [sortedPeriods]);

  const updateSettings = (patch: Partial<CycleSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  };

  const saveInitialSettings = () => {
    if (!settings.lastPeriodStart) {
      toast({ title: 'Informe a última menstruação', description: 'Selecione o primeiro dia da sua última menstruação.' });
      return;
    }

    const start = safeParseDate(settings.lastPeriodStart);
    if (!start) return;

    const key = toDateKey(start);
    setPeriods((current) => {
      if (current.some((period) => period.startDate === key)) return current;
      return [...current, { id: createId(), startDate: key, duration: settings.periodDuration }];
    });
    setCalendarMonth(startOfMonth(start));
    toast({ title: 'Dados salvos', description: 'As previsões do seu ciclo foram atualizadas neste aparelho.' });
  };

  const addPeriodRecord = () => {
    const start = safeParseDate(newPeriodStart);
    if (!start) {
      toast({ title: 'Data inválida', variant: 'destructive' });
      return;
    }

    if (newPeriodDuration < 1 || newPeriodDuration > 14) {
      toast({ title: 'Duração inválida', description: 'Use uma duração entre 1 e 14 dias.', variant: 'destructive' });
      return;
    }

    const key = toDateKey(start);
    const existing = periods.find((period) => period.startDate === key);

    if (existing) {
      setPeriods((current) =>
        current.map((period) =>
          period.id === existing.id ? { ...period, duration: newPeriodDuration } : period,
        ),
      );
      toast({ title: 'Menstruação atualizada' });
    } else {
      setPeriods((current) => [
        ...current,
        { id: createId(), startDate: key, duration: newPeriodDuration },
      ]);
      toast({ title: 'Menstruação registrada' });
    }

    updateSettings({ lastPeriodStart: key, periodDuration: newPeriodDuration });
    setCalendarMonth(startOfMonth(start));
  };

  const deletePeriod = (id: string) => {
    setPeriods((current) => current.filter((period) => period.id !== id));
    toast({ title: 'Registro removido' });
  };

  const saveDailyLog = (nextLog: DailyLog) => {
    const isEmpty =
      nextLog.flow === 'nenhum' &&
      !nextLog.mood &&
      nextLog.symptoms.length === 0 &&
      !nextLog.note.trim();

    setLogs((current) => {
      const copy = { ...current };
      if (isEmpty) delete copy[nextLog.date];
      else copy[nextLog.date] = nextLog;
      return copy;
    });
  };

  const toggleSymptom = (symptom: string) => {
    const hasSymptom = selectedLog.symptoms.includes(symptom);
    saveDailyLog({
      ...selectedLog,
      symptoms: hasSymptom
        ? selectedLog.symptoms.filter((item) => item !== symptom)
        : [...selectedLog.symptoms, symptom],
    });
  };

  const getDayState = (date: Date) => {
    const dateKey = toDateKey(date);

    const recordedPeriod = sortedPeriods.some((period) => {
      const start = safeParseDate(period.startDate);
      if (!start) return false;
      return isDateInRange(date, start, addDays(start, period.duration - 1));
    });

    const predictedPeriod = predictions.some((prediction) =>
      isDateInRange(date, prediction.periodStart, prediction.periodEnd),
    );

    const ovulation = predictions.some((prediction) => isSameDay(date, prediction.ovulation));
    const fertile = predictions.some((prediction) =>
      isDateInRange(date, prediction.fertileStart, prediction.fertileEnd),
    );

    return {
      recordedPeriod,
      predictedPeriod,
      ovulation,
      fertile,
      hasLog: Boolean(logs[dateKey]),
    };
  };

  const getPhaseText = (date: Date) => {
    const state = getDayState(date);
    if (state.recordedPeriod) return 'Menstruação registrada';
    if (state.ovulation) return 'Ovulação estimada';
    if (state.fertile) return 'Janela fértil estimada';
    if (state.predictedPeriod) return 'Menstruação prevista';
    return 'Dia do ciclo';
  };

  const exportData = () => {
    const data: StoredData = { settings, periods, logs };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ciclo-menstrual-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const clearAllData = () => {
    const confirmed = window.confirm(
      'Apagar todos os dados do ciclo menstrual salvos neste aparelho? Essa ação não pode ser desfeita.',
    );
    if (!confirmed) return;

    localStorage.removeItem(STORAGE_KEY);
    setSettings(DEFAULT_SETTINGS);
    setPeriods([]);
    setLogs({});
    setNewPeriodDuration(5);
    setNewPeriodStart(toDateKey(new Date()));
    toast({ title: 'Dados apagados', description: 'Todo o histórico local foi removido deste aparelho.' });
  };

  const calendarDays = useMemo(() => getCalendarDays(calendarMonth), [calendarMonth]);

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="border-b border-border/60 bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/ferramentas')} aria-label="Voltar para ferramentas">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-rose-500" />
              <h1 className="truncate text-lg font-black sm:text-xl">Ciclo Menstrual</h1>
            </div>
            <p className="text-xs text-muted-foreground">Calendário, previsões e diário do ciclo no seu aparelho.</p>
          </div>
          <Badge variant="outline" className="hidden gap-1.5 sm:flex">
            <LockKeyhole className="h-3.5 w-3.5" /> Dados locais
          </Badge>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <ToolBanner secao="ferramentas" />

        <section className="overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-500/15 via-background to-fuchsia-500/10 p-5 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
            <div className="space-y-4">
              <Badge className="w-fit bg-rose-500/15 text-rose-600 hover:bg-rose-500/15 dark:text-rose-300">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Minha saúde, meu ritmo
              </Badge>
              <div>
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Entenda seu ciclo com mais clareza.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Registre menstruações, acompanhe sintomas e visualize estimativas de próxima menstruação, ovulação e janela fértil em um calendário simples.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary">Sem cadastro adicional</Badge>
                <Badge variant="secondary">Histórico local</Badge>
                <Badge variant="secondary">Calendário de 6 meses</Badge>
                <Badge variant="secondary">Diário de sintomas</Badge>
              </div>
            </div>

            <Card className="border-rose-500/20 bg-background/80 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold">Previsões são estimativas</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      O ciclo pode variar. Não use este calendário como método contraceptivo ou para confirmar gravidez. Em caso de sintomas importantes ou dúvidas, procure atendimento profissional.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {!lastPeriodStart && (
          <Card className="border-primary/20 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5 text-primary" /> Configure seu ciclo
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="lastPeriodStart">1º dia da última menstruação</Label>
                <Input
                  id="lastPeriodStart"
                  type="date"
                  value={settings.lastPeriodStart}
                  onChange={(event) => updateSettings({ lastPeriodStart: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cycleLength">Duração média do ciclo</Label>
                <Input
                  id="cycleLength"
                  type="number"
                  min={15}
                  max={60}
                  value={settings.averageCycleLength}
                  onChange={(event) => updateSettings({ averageCycleLength: Number(event.target.value) || 28 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodDuration">Dias de menstruação</Label>
                <Input
                  id="periodDuration"
                  type="number"
                  min={1}
                  max={14}
                  value={settings.periodDuration}
                  onChange={(event) => updateSettings({ periodDuration: Number(event.target.value) || 5 })}
                />
              </div>
              <div className="md:col-span-3">
                <Button onClick={saveInitialSettings} className="w-full sm:w-auto">
                  <Save className="mr-2 h-4 w-4" /> Criar meu calendário
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl p-1 sm:grid-cols-4">
            <TabsTrigger value="visao-geral" className="rounded-xl py-2.5 text-xs sm:text-sm">Visão geral</TabsTrigger>
            <TabsTrigger value="calendario" className="rounded-xl py-2.5 text-xs sm:text-sm">Calendário</TabsTrigger>
            <TabsTrigger value="registro" className="rounded-xl py-2.5 text-xs sm:text-sm">Registrar</TabsTrigger>
            <TabsTrigger value="historico" className="rounded-xl py-2.5 text-xs sm:text-sm">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="visao-geral" className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-rose-500/20">
                <CardContent className="p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                    <Droplets className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Próxima menstruação</p>
                  <p className="mt-1 text-xl font-black">
                    {nextPrediction ? format(nextPrediction.periodStart, "dd 'de' MMM", { locale: ptBR }) : '—'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Estimativa baseada no seu ciclo.</p>
                </CardContent>
              </Card>

              <Card className="border-fuchsia-500/20">
                <CardContent className="p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-fuchsia-500">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Ovulação estimada</p>
                  <p className="mt-1 text-xl font-black">
                    {nextPrediction ? format(nextPrediction.ovulation, "dd 'de' MMM", { locale: ptBR }) : '—'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Aproximadamente 14 dias antes da próxima menstruação.</p>
                </CardContent>
              </Card>

              <Card className="border-violet-500/20">
                <CardContent className="p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500">
                    <Activity className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Dia do ciclo</p>
                  <p className="mt-1 text-xl font-black">{cycleDay ? `Dia ${cycleDay}` : '—'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Média atual: {calculatedAverageCycle} dias.</p>
                </CardContent>
              </Card>

              <Card className="border-sky-500/20">
                <CardContent className="p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500">
                    <Moon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Regularidade</p>
                  <p className="mt-1 text-xl font-black">
                    {variation === null ? 'Poucos dados' : variation <= 7 ? 'Mais regular' : 'Variável'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {variation === null ? 'Registre pelo menos 3 ciclos.' : `Variação observada: ${variation} dias.`}
                  </p>
                </CardContent>
              </Card>
            </div>

            {nextPrediction && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Próximas estimativas</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                  {predictions.slice(0, 3).map((prediction, index) => (
                    <div key={prediction.periodStart.toISOString()} className="rounded-2xl border border-border bg-muted/20 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Ciclo {index + 1}</p>
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span>Menstruação</span>
                          <strong>{format(prediction.periodStart, 'dd/MM/yyyy')}</strong>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>Janela fértil</span>
                          <strong>{format(prediction.fertileStart, 'dd/MM')}–{format(prediction.fertileEnd, 'dd/MM')}</strong>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>Ovulação</span>
                          <strong>{format(prediction.ovulation, 'dd/MM')}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="flex gap-3 p-5">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div className="space-y-1 text-sm">
                  <p className="font-bold">Como a previsão funciona?</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    A ferramenta usa a média dos ciclos que você registrar. Quando ainda há poucos registros, usa a duração informada por você. A ovulação é estimada cerca de 14 dias antes da próxima menstruação e a janela fértil cobre os 5 dias anteriores até 1 dia depois da ovulação estimada.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendario" className="space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="capitalize">{format(calendarMonth, 'MMMM yyyy', { locale: ptBR })}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">Toque em um dia para registrar sintomas e anotações.</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" onClick={() => setCalendarMonth((current) => subMonths(current, 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setCalendarMonth((current) => addMonths(current, 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase text-muted-foreground sm:gap-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => <div key={day} className="py-2">{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {calendarDays.map((date) => {
                    const state = getDayState(date);
                    const selected = isSameDay(date, selectedDate);
                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          'relative flex aspect-square min-h-10 flex-col items-center justify-center rounded-xl border text-xs transition-all sm:min-h-14 sm:text-sm',
                          !isSameMonth(date, calendarMonth) && 'opacity-35',
                          state.predictedPeriod && 'border-rose-300 bg-rose-500/10',
                          state.fertile && !state.predictedPeriod && 'border-emerald-300 bg-emerald-500/10',
                          state.ovulation && 'border-fuchsia-400 bg-fuchsia-500/15 font-black',
                          state.recordedPeriod && 'border-rose-500 bg-rose-500 text-white',
                          isToday(date) && !state.recordedPeriod && 'ring-1 ring-primary',
                          selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                        )}
                      >
                        <span>{format(date, 'd')}</span>
                        <div className="mt-0.5 flex gap-0.5">
                          {state.hasLog && <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />}
                          {state.ovulation && <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-500" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-rose-500" /> Registrada</span>
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-rose-300 bg-rose-500/10" /> Prevista</span>
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-emerald-300 bg-emerald-500/10" /> Fértil estimada</span>
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-fuchsia-500/30" /> Ovulação estimada</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-500" /> Tem diário</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base capitalize">
                  {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{getPhaseText(selectedDate)}</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fluxo</Label>
                    <Select
                      value={selectedLog.flow}
                      onValueChange={(value) => saveDailyLog({ ...selectedLog, flow: value as FlowLevel })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(FLOW_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Humor</Label>
                    <Select
                      value={selectedLog.mood || 'sem-registro'}
                      onValueChange={(value) => saveDailyLog({ ...selectedLog, mood: value === 'sem-registro' ? '' : value as Mood })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sem-registro">Sem registro</SelectItem>
                        {Object.entries(MOOD_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Sintomas</Label>
                  <div className="flex flex-wrap gap-2">
                    {SYMPTOMS.map((symptom) => {
                      const active = selectedLog.symptoms.includes(symptom);
                      return (
                        <Button
                          key={symptom}
                          type="button"
                          size="sm"
                          variant={active ? 'default' : 'outline'}
                          onClick={() => toggleSymptom(symptom)}
                          className="h-8 rounded-full text-xs"
                        >
                          {active && <Check className="mr-1 h-3 w-3" />}{symptom}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="daily-note">Anotação</Label>
                  <Textarea
                    id="daily-note"
                    placeholder="Ex.: cólica mais forte pela manhã, dormi melhor, comecei um medicamento..."
                    value={selectedLog.note}
                    onChange={(event) => saveDailyLog({ ...selectedLog, note: event.target.value })}
                    rows={3}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">As alterações deste diário são salvas automaticamente neste navegador.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="registro" className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Droplets className="h-5 w-5 text-rose-500" /> Registrar menstruação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-period-start">Primeiro dia</Label>
                    <Input id="new-period-start" type="date" value={newPeriodStart} onChange={(event) => setNewPeriodStart(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-period-duration">Quantos dias durou?</Label>
                    <Input
                      id="new-period-duration"
                      type="number"
                      min={1}
                      max={14}
                      value={newPeriodDuration}
                      onChange={(event) => setNewPeriodDuration(Number(event.target.value) || 1)}
                    />
                  </div>
                  <Button onClick={addPeriodRecord} className="w-full">
                    <Save className="mr-2 h-4 w-4" /> Salvar menstruação
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ajustar média do ciclo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="settings-cycle-length">Ciclo médio informado</Label>
                    <Input
                      id="settings-cycle-length"
                      type="number"
                      min={15}
                      max={60}
                      value={settings.averageCycleLength}
                      onChange={(event) => updateSettings({ averageCycleLength: Number(event.target.value) || 28 })}
                    />
                    <p className="text-xs text-muted-foreground">Com 2 ou mais ciclos registrados, a ferramenta passa a calcular uma média real do seu histórico.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-period-duration">Duração padrão da menstruação</Label>
                    <Input
                      id="settings-period-duration"
                      type="number"
                      min={1}
                      max={14}
                      value={settings.periodDuration}
                      onChange={(event) => updateSettings({ periodDuration: Number(event.target.value) || 5 })}
                    />
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-4 text-xs text-muted-foreground">
                    Média utilizada agora: <strong className="text-foreground">{calculatedAverageCycle} dias</strong>.
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="historico" className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histórico de menstruações</CardTitle>
              </CardHeader>
              <CardContent>
                {sortedPeriods.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                    <Droplets className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-3 text-sm font-bold">Nenhuma menstruação registrada</p>
                    <p className="mt-1 text-xs text-muted-foreground">Use a aba Registrar para começar seu histórico.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...sortedPeriods].reverse().map((period, index) => {
                      const start = safeParseDate(period.startDate)!;
                      const previous = [...sortedPeriods].reverse()[index + 1];
                      const previousStart = safeParseDate(previous?.startDate);
                      const interval = previousStart ? differenceInCalendarDays(start, previousStart) : null;
                      return (
                        <div key={period.id} className="flex items-center gap-3 rounded-2xl border border-border p-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                            <Droplets className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold capitalize">{format(start, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                            <p className="text-xs text-muted-foreground">
                              {period.duration} dias de menstruação{interval ? ` • ciclo anterior: ${interval} dias` : ''}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => deletePeriod(period.id)} aria-label="Excluir registro">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><LockKeyhole className="h-5 w-5" /> Privacidade e dados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Seus dados desta ferramenta ficam no armazenamento local deste navegador. Eles não são sincronizados automaticamente entre aparelhos. Se você limpar os dados do navegador ou trocar de aparelho, o histórico pode ser perdido.
                </p>
                <Separator />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" onClick={exportData} className="sm:flex-1">
                    <Download className="mr-2 h-4 w-4" /> Exportar backup JSON
                  </Button>
                  <Button variant="destructive" onClick={clearAllData} className="sm:flex-1">
                    <Trash2 className="mr-2 h-4 w-4" /> Apagar todos os dados
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="border-border/70 bg-muted/20">
          <CardContent className="space-y-3 p-5 text-xs leading-relaxed text-muted-foreground">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <RotateCcw className="h-4 w-4" /> Informações importantes
            </div>
            <p>
              Um ciclo menstrual é contado do primeiro dia de uma menstruação até o primeiro dia da próxima. A ovulação pode variar de um ciclo para outro, especialmente em ciclos irregulares, durante mudanças hormonais, após gravidez, com certas condições de saúde ou uso de medicamentos.
            </p>
            <p>
              Procure orientação de um profissional de saúde se houver sangramento muito intenso, dor importante, desmaio, suspeita de gravidez, atraso persistente ou mudanças relevantes no seu padrão menstrual.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CicloMenstrual;
