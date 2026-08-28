import { FormEvent, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownCircle,
  BellRing,
  ArrowLeft,
  ArrowUpCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Download,
  Edit3,
  FileJson,
  Landmark,
  ListFilter,
  MoreHorizontal,
  PiggyBank,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  Cloud,
  CloudOff,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  WalletCards,
} from 'lucide-react';
import { toast } from 'sonner';
import { ToolBanner } from '@/components/ferramentas/ToolBanner';
import { useControleFinanceiroStorage, EMPTY_FINANCE_STATE, type FinanceState } from '@/hooks/useControleFinanceiroStorage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { usePushNotifications } from '@/contexts/PushNotificationsContext';

type TransactionType = 'receita' | 'despesa';
type TransactionStatus = 'pago' | 'pendente';
type ViewMode = 'resumo' | 'lancamentos' | 'calendario' | 'planejamento';

type Transaction = {
  id: string;
  type: TransactionType;
  title: string;
  amount: number;
  category: string;
  date: string;
  status: TransactionStatus;
  recurring: boolean;
  note?: string;
  notify: boolean;
  reminderDaysBefore: number;
  reminderTime: string;
  createdAt: string;
};

const categories: Record<TransactionType, string[]> = {
  receita: ['Salário', 'Freelance', 'Vendas', 'Benefício', 'Rendimento', 'Presente', 'Outros'],
  despesa: ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Contas', 'Compras', 'Dívidas', 'Outros'],
};

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const pad = (value: number) => String(value).padStart(2, '0');

const toDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const todayKey = () => toDateKey(new Date());

const monthKeyFromDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

const monthKeyFromString = (value: string) => value.slice(0, 7);

const parseDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

const formatDate = (value: string) =>
  parseDate(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');

const formatFullDate = (value: string) =>
  parseDate(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

const monthLabel = (date: Date) => {
  const text = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const uid = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const safeNumber = (value: string) => {
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getCalendarDays = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const firstWeekday = first.getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const previousLastDay = new Date(year, month, 0).getDate();
  const cells: { date: Date; currentMonth: boolean }[] = [];

  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    cells.push({ date: new Date(year, month - 1, previousLastDay - i), currentMonth: false });
  }

  for (let day = 1; day <= lastDay; day += 1) {
    cells.push({ date: new Date(year, month, day), currentMonth: true });
  }

  while (cells.length < 42) {
    const day = cells.length - (firstWeekday + lastDay) + 1;
    cells.push({ date: new Date(year, month + 1, day), currentMonth: false });
  }

  return cells;
};

export const ControleFinanceiro = () => {
  const navigate = useNavigate();
  const push = usePushNotifications();
  const importRef = useRef<HTMLInputElement>(null);
  const {
    state,
    user,
    loading: financeLoading,
    syncing,
    syncError,
    storageLabel,
    hasLocalDataToImport,
    saveTransaction,
    removeTransaction,
    saveSettings: persistSettings,
    replaceAll,
    importLocalToAccount,
    clearAll,
  } = useControleFinanceiroStorage();
  const [view, setView] = useState<ViewMode>('resumo');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(todayKey());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'todos' | TransactionType>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | TransactionStatus>('todos');
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [form, setForm] = useState({
    type: 'despesa' as TransactionType,
    title: '',
    amount: '',
    category: 'Alimentação',
    date: todayKey(),
    status: 'pago' as TransactionStatus,
    recurring: false,
    note: '',
    notify: false,
    reminderDaysBefore: 1,
    reminderTime: '09:00',
  });

  const [settingsForm, setSettingsForm] = useState({
    monthlyBudget: '',
    savingsGoal: '',
    emergencyFundGoal: '',
  });


  const selectedMonthKey = monthKeyFromDate(selectedMonth);
  const monthTransactions = useMemo(
    () => state.transactions.filter((item) => monthKeyFromString(item.date) === selectedMonthKey),
    [state.transactions, selectedMonthKey],
  );

  const paidIncome = monthTransactions
    .filter((item) => item.type === 'receita' && item.status === 'pago')
    .reduce((sum, item) => sum + item.amount, 0);
  const paidExpenses = monthTransactions
    .filter((item) => item.type === 'despesa' && item.status === 'pago')
    .reduce((sum, item) => sum + item.amount, 0);
  const pendingIncome = monthTransactions
    .filter((item) => item.type === 'receita' && item.status === 'pendente')
    .reduce((sum, item) => sum + item.amount, 0);
  const pendingExpenses = monthTransactions
    .filter((item) => item.type === 'despesa' && item.status === 'pendente')
    .reduce((sum, item) => sum + item.amount, 0);
  const balance = paidIncome - paidExpenses;
  const projectedBalance = paidIncome + pendingIncome - paidExpenses - pendingExpenses;
  const budgetUsage = state.settings.monthlyBudget > 0
    ? Math.min(100, (paidExpenses / state.settings.monthlyBudget) * 100)
    : 0;
  const savingsProgress = state.settings.savingsGoal > 0
    ? Math.min(100, (Math.max(balance, 0) / state.settings.savingsGoal) * 100)
    : 0;

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return monthTransactions
      .filter((item) => typeFilter === 'todos' || item.type === typeFilter)
      .filter((item) => statusFilter === 'todos' || item.status === statusFilter)
      .filter((item) => !query || `${item.title} ${item.category} ${item.note || ''}`.toLowerCase().includes(query))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [monthTransactions, search, typeFilter, statusFilter]);

  const upcoming = useMemo(() => {
    const today = todayKey();
    return state.transactions
      .filter((item) => item.status === 'pendente' && item.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [state.transactions]);

  const categoryExpenses = useMemo(() => {
    const map = new Map<string, number>();
    monthTransactions
      .filter((item) => item.type === 'despesa' && item.status === 'pago')
      .forEach((item) => map.set(item.category, (map.get(item.category) || 0) + item.amount));
    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthTransactions]);

  const monthlyHistory = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - (5 - index), 1);
      const key = monthKeyFromDate(date);
      const entries = state.transactions.filter((item) => monthKeyFromString(item.date) === key && item.status === 'pago');
      const income = entries.filter((item) => item.type === 'receita').reduce((sum, item) => sum + item.amount, 0);
      const expenses = entries.filter((item) => item.type === 'despesa').reduce((sum, item) => sum + item.amount, 0);
      return {
        key,
        label: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        income,
        expenses,
        balance: income - expenses,
      };
    });
  }, [selectedMonth, state.transactions]);

  const maxHistoryValue = Math.max(1, ...monthlyHistory.flatMap((item) => [item.income, item.expenses]));

  const openNewEntry = (preset?: Partial<typeof form>) => {
    setEditing(null);
    const type = preset?.type || 'despesa';
    setForm({
      type,
      title: '',
      amount: '',
      category: categories[type][0],
      date: preset?.date || selectedDay || todayKey(),
      status: 'pago',
      recurring: false,
      note: '',
      notify: false,
      reminderDaysBefore: 1,
      reminderTime: '09:00',
      ...preset,
    });
    setIsEntryOpen(true);
  };

  const openEdit = (item: Transaction) => {
    setEditing(item);
    setForm({
      type: item.type,
      title: item.title,
      amount: item.amount.toFixed(2).replace('.', ','),
      category: item.category,
      date: item.date,
      status: item.status,
      recurring: item.recurring,
      note: item.note || '',
      notify: item.notify,
      reminderDaysBefore: item.reminderDaysBefore,
      reminderTime: item.reminderTime,
    });
    setIsEntryOpen(true);
  };

  const changeFormType = (type: TransactionType) => {
    setForm((current) => ({
      ...current,
      type,
      category: categories[type].includes(current.category) ? current.category : categories[type][0],
    }));
  };

  const saveEntry = (event: FormEvent) => {
    event.preventDefault();
    const amount = safeNumber(form.amount);
    if (!form.title.trim()) {
      toast.error('Informe uma descrição para o lançamento.');
      return;
    }
    if (amount <= 0) {
      toast.error('Informe um valor maior que zero.');
      return;
    }
    if (!form.date) {
      toast.error('Informe a data do lançamento.');
      return;
    }

    const payload: Transaction = {
      id: editing?.id || uid(),
      type: form.type,
      title: form.title.trim(),
      amount,
      category: form.category,
      date: form.date,
      status: form.status,
      recurring: form.recurring,
      note: form.note.trim(),
      notify: Boolean(user && form.type === 'despesa' && form.status === 'pendente' && form.notify),
      reminderDaysBefore: form.reminderDaysBefore,
      reminderTime: form.reminderTime,
      createdAt: editing?.createdAt || new Date().toISOString(),
    };

    void saveTransaction(payload).then((result) => {
      if (!result.synced && result.reason === 'remote_error') {
        toast.warning('Salvo neste aparelho, mas a sincronização com sua conta ficou pendente.');
      }
    });
    setSelectedMonth(parseDate(form.date));
    setSelectedDay(form.date);
    setIsEntryOpen(false);
    toast.success(editing ? 'Lançamento atualizado.' : user ? 'Lançamento salvo na sua conta.' : 'Lançamento salvo neste aparelho.');
  };

  const removeEntry = (id: string) => {
    void removeTransaction(id).then((result) => {
      if (!result.synced && result.reason === 'remote_error') {
        toast.warning('Removido deste aparelho, mas a sincronização com sua conta ficou pendente.');
      }
    });
    toast.success('Lançamento removido.');
  };

  const togglePaid = (item: Transaction) => {
    const updated: Transaction = {
      ...item,
      status: item.status === 'pago' ? 'pendente' : 'pago',
    };
    void saveTransaction(updated).then((result) => {
      if (!result.synced && result.reason === 'remote_error') {
        toast.warning('Alteração salva localmente; sincronização pendente.');
      }
    });
  };

  const openSettings = () => {
    setSettingsForm({
      monthlyBudget: state.settings.monthlyBudget ? String(state.settings.monthlyBudget).replace('.', ',') : '',
      savingsGoal: state.settings.savingsGoal ? String(state.settings.savingsGoal).replace('.', ',') : '',
      emergencyFundGoal: state.settings.emergencyFundGoal ? String(state.settings.emergencyFundGoal).replace('.', ',') : '',
    });
    setIsSettingsOpen(true);
  };

  const saveSettings = () => {
    const nextSettings = {
      monthlyBudget: Math.max(0, safeNumber(settingsForm.monthlyBudget)),
      savingsGoal: Math.max(0, safeNumber(settingsForm.savingsGoal)),
      emergencyFundGoal: Math.max(0, safeNumber(settingsForm.emergencyFundGoal)),
    };
    void persistSettings(nextSettings).then((result) => {
      if (!result.synced && result.reason === 'remote_error') {
        toast.warning('Metas salvas neste aparelho; sincronização pendente.');
      }
    });
    setIsSettingsOpen(false);
    toast.success(user ? 'Planejamento salvo na sua conta.' : 'Planejamento salvo neste aparelho.');
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `saj-tem-financas-${todayKey()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Backup financeiro exportado.');
  };

  const importData = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as FinanceState;
        if (!Array.isArray(parsed.transactions) || !parsed.settings) throw new Error('Formato inválido');
        const nextState: FinanceState = {
          transactions: parsed.transactions,
          settings: { ...EMPTY_FINANCE_STATE.settings, ...parsed.settings },
        };
        void replaceAll(nextState).then((result) => {
          if (result.synced) toast.success('Backup importado e sincronizado com sua conta.');
          else if (result.reason === 'remote_error') toast.warning('Backup importado localmente; sincronização pendente.');
          else toast.success('Backup importado neste aparelho.');
        });
      } catch {
        toast.error('Não foi possível importar esse arquivo.');
      }
    };
    reader.readAsText(file);
  };

  const clearData = () => {
    const target = user ? 'da sua conta e deste aparelho' : 'deste aparelho';
    if (!window.confirm(`Apagar todos os lançamentos e metas ${target}? Essa ação não pode ser desfeita.`)) return;
    void clearAll().then((result) => {
      if (result.synced) toast.success('Dados financeiros apagados da sua conta.');
      else if (result.reason === 'remote_error') toast.error('Não foi possível apagar os dados do servidor. Nada foi removido definitivamente.');
      else toast.success('Dados financeiros apagados deste aparelho.');
    });
  };

  const calendarDays = useMemo(() => getCalendarDays(selectedMonth), [selectedMonth]);
  const selectedDayEntries = state.transactions
    .filter((item) => item.date === selectedDay)
    .sort((a, b) => a.type.localeCompare(b.type));

  const navItems: { id: ViewMode; label: string; shortLabel: string; icon: typeof WalletCards }[] = [
    { id: 'resumo', label: 'Visão geral', shortLabel: 'Resumo', icon: WalletCards },
    { id: 'lancamentos', label: 'Lançamentos', shortLabel: 'Lançar', icon: ReceiptText },
    { id: 'calendario', label: 'Calendário', shortLabel: 'Calendário', icon: CalendarDays },
    { id: 'planejamento', label: 'Planejamento', shortLabel: 'Metas', icon: Target },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-background dark:text-foreground">
      <div className="mx-auto w-full max-w-6xl px-3 pb-28 pt-4 sm:px-6 sm:pb-10 sm:pt-8">
        <div className="mb-4 flex items-center justify-between gap-2 sm:mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/ferramentas')}
            className="h-10 rounded-xl px-2 text-slate-700 hover:bg-white sm:px-3 dark:text-foreground dark:hover:bg-muted"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Voltar para Ferramentas</span>
            <span className="sm:hidden">Voltar</span>
          </Button>
          <Badge className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider ${user && !syncError ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300' : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300'}`}>
            {user && !syncError ? <Cloud className="mr-1 h-3.5 w-3.5" /> : <CloudOff className="mr-1 h-3.5 w-3.5" />}
            {storageLabel}
          </Badge>
        </div>

        <ToolBanner secao="controle_financeiro" />

        {!user && !financeLoading && (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <CloudOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
              <div>
                <p className="text-sm font-black">Entre na sua conta para não perder seus dados.</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-800 dark:text-amber-200">Sem login, os lançamentos ficam apenas neste aparelho. Com login, eles ficam protegidos no Supabase e aparecem em outros dispositivos.</p>
              </div>
            </div>
            <Button onClick={() => navigate('/login')} className="shrink-0 rounded-xl bg-amber-600 font-extrabold text-white hover:bg-amber-700">Entrar para sincronizar</Button>
          </div>
        )}

        {user && hasLocalDataToImport && (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-950 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <Cloud className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-300" />
              <div>
                <p className="text-sm font-black">Encontramos dados financeiros salvos neste aparelho.</p>
                <p className="mt-1 text-xs leading-relaxed text-blue-800 dark:text-blue-200">Sua conta ainda não tem dados financeiros. Confirme para enviar esses lançamentos e metas ao Supabase.</p>
              </div>
            </div>
            <Button
              disabled={syncing}
              onClick={() => {
                void importLocalToAccount().then((result) => {
                  if (result.synced) toast.success('Dados deste aparelho salvos na sua conta.');
                  else toast.error('Não foi possível sincronizar agora. Seus dados continuam salvos neste aparelho.');
                });
              }}
              className="shrink-0 rounded-xl bg-blue-600 font-extrabold text-white hover:bg-blue-700"
            >
              {syncing ? 'Sincronizando...' : 'Salvar na minha conta'}
            </Button>
          </div>
        )}

        {user && syncError && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
            Seus dados continuam no cache deste aparelho, mas a última sincronização com o servidor falhou. Tente novamente quando a conexão estiver estável.
          </div>
        )}

        <section className="relative mt-4 overflow-hidden rounded-[28px] border border-emerald-200/80 bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 p-5 text-white shadow-xl shadow-emerald-900/10 sm:p-8 dark:border-emerald-800/60">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
            <div>
              <Badge className="mb-3 border-white/20 bg-white/10 text-white hover:bg-white/15">
                <Sparkles className="mr-1 h-3.5 w-3.5" /> Minha Vida Financeira
              </Badge>
              <h1 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Controle seu dinheiro sem complicação.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-emerald-50/90 sm:text-base">
                Organize receitas, despesas, contas a vencer, metas e o saldo do mês em um só lugar.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  onClick={() => openNewEntry({ type: 'despesa' })}
                  className="h-11 rounded-xl bg-white font-extrabold text-emerald-700 shadow-lg hover:bg-emerald-50"
                >
                  <Plus className="mr-2 h-4 w-4" /> Novo lançamento
                </Button>
                <Button
                  variant="outline"
                  onClick={openSettings}
                  className="h-11 rounded-xl border-white/30 bg-white/10 font-bold text-white hover:bg-white/20 hover:text-white"
                >
                  <Target className="mr-2 h-4 w-4" /> Definir metas
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-black/10 p-4 backdrop-blur-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Saldo disponível</p>
              <p className="mt-1 text-3xl font-black sm:text-4xl">{currency.format(balance)}</p>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-emerald-50/90">
                <span>Projetado no mês</span>
                <span className="font-extrabold">{currency.format(projectedBalance)}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="sticky top-2 z-20 mt-4 grid grid-cols-4 gap-1.5 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-lg shadow-slate-900/5 backdrop-blur sm:static sm:mt-6 sm:gap-2 sm:p-2 dark:border-border dark:bg-card/95">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={`group flex min-h-[58px] flex-col items-center justify-center rounded-xl px-1.5 py-2 text-center transition-all sm:min-h-[64px] sm:flex-row sm:gap-2 sm:px-4 ${
                  active
                    ? 'bg-slate-950 text-white shadow-md dark:bg-primary dark:text-primary-foreground'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'scale-110' : 'group-hover:scale-105'} transition-transform`} />
                <span className="mt-1 text-[10px] font-extrabold leading-tight sm:mt-0 sm:text-sm">
                  <span className="sm:hidden">{item.shortLabel}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-border dark:bg-card">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-muted-foreground">Período</p>
            <p className="text-sm font-black text-slate-950 dark:text-foreground sm:text-base">{monthLabel(selectedMonth)}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {view === 'resumo' && (
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <SummaryCard
                label="Receitas recebidas"
                value={paidIncome}
                icon={TrendingUp}
                tone="emerald"
                helper={pendingIncome > 0 ? `+ ${currency.format(pendingIncome)} a receber` : 'Tudo recebido'}
              />
              <SummaryCard
                label="Despesas pagas"
                value={paidExpenses}
                icon={TrendingDown}
                tone="rose"
                helper={pendingExpenses > 0 ? `${currency.format(pendingExpenses)} a pagar` : 'Sem contas pendentes'}
              />
              <SummaryCard
                label="Saldo do mês"
                value={balance}
                icon={CircleDollarSign}
                tone={balance >= 0 ? 'blue' : 'rose'}
                helper={balance >= 0 ? 'Receitas menos despesas' : 'Atenção ao orçamento'}
              />
              <SummaryCard
                label="Saldo projetado"
                value={projectedBalance}
                icon={Landmark}
                tone={projectedBalance >= 0 ? 'violet' : 'rose'}
                helper="Incluindo pendências"
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
              <Card className="border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg font-black text-slate-950 dark:text-foreground">Fluxo dos últimos 6 meses</CardTitle>
                      <CardDescription>Compare entradas e saídas rapidamente.</CardDescription>
                    </div>
                    <Badge variant="outline" className="hidden sm:inline-flex">Histórico</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid h-52 grid-cols-6 items-end gap-2 rounded-2xl bg-slate-50 p-3 dark:bg-muted/30 sm:gap-4 sm:p-5">
                    {monthlyHistory.map((item) => (
                      <div key={item.key} className="flex h-full flex-col justify-end gap-1.5">
                        <div className="flex flex-1 items-end justify-center gap-1">
                          <div
                            title={`Receitas: ${currency.format(item.income)}`}
                            className="w-2.5 rounded-t-md bg-emerald-500 sm:w-4"
                            style={{ height: `${Math.max(item.income ? 6 : 0, (item.income / maxHistoryValue) * 100)}%` }}
                          />
                          <div
                            title={`Despesas: ${currency.format(item.expenses)}`}
                            className="w-2.5 rounded-t-md bg-rose-500 sm:w-4"
                            style={{ height: `${Math.max(item.expenses ? 6 : 0, (item.expenses / maxHistoryValue) * 100)}%` }}
                          />
                        </div>
                        <span className="text-center text-[10px] font-extrabold uppercase text-slate-500 dark:text-muted-foreground">{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-5 text-xs font-bold text-slate-600 dark:text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Receitas</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Despesas</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-black text-slate-950 dark:text-foreground">Próximos vencimentos</CardTitle>
                  <CardDescription>O que precisa da sua atenção.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {upcoming.length === 0 ? (
                    <EmptyState icon={CheckCircle2} title="Tudo em dia" description="Nenhuma conta pendente cadastrada para os próximos dias." />
                  ) : (
                    upcoming.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => openEdit(item)}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:bg-slate-50 dark:border-border dark:hover:bg-muted/40"
                      >
                        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.type === 'despesa' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
                          <Clock3 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-extrabold text-slate-950 dark:text-foreground">{item.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-muted-foreground">{formatFullDate(item.date)}</p>
                        </div>
                        <p className={`text-sm font-black ${item.type === 'despesa' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {item.type === 'despesa' ? '-' : '+'}{currency.format(item.amount)}
                        </p>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-black text-slate-950 dark:text-foreground">Para onde seu dinheiro foi?</CardTitle>
                  <CardDescription>Despesas pagas por categoria neste mês.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {categoryExpenses.length === 0 ? (
                    <EmptyState icon={ReceiptText} title="Ainda sem despesas" description="Adicione despesas para acompanhar as categorias que mais pesam no orçamento." />
                  ) : (
                    categoryExpenses.slice(0, 6).map((item) => {
                      const percentage = paidExpenses > 0 ? (item.amount / paidExpenses) * 100 : 0;
                      return (
                        <div key={item.category} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="font-bold text-slate-700 dark:text-foreground">{item.category}</span>
                            <span className="font-extrabold text-slate-950 dark:text-foreground">{currency.format(item.amount)}</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg font-black text-slate-950 dark:text-foreground">Planejamento do mês</CardTitle>
                      <CardDescription>Orçamento e meta de economia.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={openSettings}>Editar</Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <GoalLine
                    label="Orçamento de despesas"
                    current={paidExpenses}
                    goal={state.settings.monthlyBudget}
                    percentage={budgetUsage}
                    inverse
                  />
                  <GoalLine
                    label="Meta de economia"
                    current={Math.max(balance, 0)}
                    goal={state.settings.savingsGoal}
                    percentage={savingsProgress}
                  />
                  {!state.settings.monthlyBudget && !state.settings.savingsGoal && (
                    <Button variant="outline" className="w-full rounded-xl border-dashed" onClick={openSettings}>
                      <Target className="mr-2 h-4 w-4" /> Criar meu planejamento
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {view === 'lancamentos' && (
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => openNewEntry({ type: 'receita' })}
                className="group rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-emerald-900/60 dark:bg-emerald-950/30"
              >
                <ArrowUpCircle className="h-7 w-7 text-emerald-600 transition-transform group-hover:scale-110 dark:text-emerald-400" />
                <p className="mt-3 text-sm font-black text-emerald-950 dark:text-emerald-100">Adicionar receita</p>
                <p className="mt-1 text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-300">Salário, vendas, freelance ou qualquer entrada.</p>
              </button>
              <button
                type="button"
                onClick={() => openNewEntry({ type: 'despesa' })}
                className="group rounded-2xl border border-rose-200 bg-rose-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-rose-900/60 dark:bg-rose-950/30"
              >
                <ArrowDownCircle className="h-7 w-7 text-rose-600 transition-transform group-hover:scale-110 dark:text-rose-400" />
                <p className="mt-3 text-sm font-black text-rose-950 dark:text-rose-100">Adicionar despesa</p>
                <p className="mt-1 text-[11px] leading-relaxed text-rose-700 dark:text-rose-300">Conta, compra, dívida ou gasto do dia a dia.</p>
              </button>
            </div>

            <Card className="border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg font-black text-slate-950 dark:text-foreground">Lançamentos do mês</CardTitle>
                    <CardDescription>{filteredTransactions.length} lançamento(s) encontrado(s).</CardDescription>
                  </div>
                  <Button className="rounded-xl" onClick={() => openNewEntry()}><Plus className="mr-2 h-4 w-4" /> Novo</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-[1fr_150px_150px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar lançamento..." className="h-10 rounded-xl pl-9" />
                  </div>
                  <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}>
                    <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os tipos</SelectItem>
                      <SelectItem value="receita">Receitas</SelectItem>
                      <SelectItem value="despesa">Despesas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                    <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os status</SelectItem>
                      <SelectItem value="pago">Pago/recebido</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-4 space-y-2">
                  {filteredTransactions.length === 0 ? (
                    <EmptyState icon={ListFilter} title="Nenhum lançamento encontrado" description="Adicione seu primeiro lançamento ou ajuste os filtros acima." />
                  ) : (
                    filteredTransactions.map((item) => (
                      <TransactionRow key={item.id} item={item} onEdit={openEdit} onDelete={removeEntry} onTogglePaid={togglePaid} />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {view === 'calendario' && (
          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
            <Card className="overflow-hidden border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-black text-slate-950 dark:text-foreground">Calendário financeiro</CardTitle>
                    <CardDescription>Veja contas, receitas e movimentações por dia.</CardDescription>
                  </div>
                  <CalendarDays className="h-6 w-6 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent className="px-2 pb-3 sm:px-5 sm:pb-5">
                <div className="grid grid-cols-7 border-b border-slate-200 pb-2 text-center text-[10px] font-extrabold uppercase text-slate-500 dark:border-border dark:text-muted-foreground sm:text-xs">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => <span key={day}>{day}</span>)}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
                  {calendarDays.map(({ date, currentMonth }) => {
                    const key = toDateKey(date);
                    const entries = state.transactions.filter((item) => item.date === key);
                    const selected = selectedDay === key;
                    const isToday = key === todayKey();
                    const hasExpense = entries.some((item) => item.type === 'despesa');
                    const hasIncome = entries.some((item) => item.type === 'receita');
                    const hasPending = entries.some((item) => item.status === 'pendente');
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedDay(key)}
                        className={`relative min-h-[58px] rounded-xl border p-1.5 text-left transition sm:min-h-[82px] sm:p-2 ${
                          selected
                            ? 'border-slate-950 bg-slate-950 text-white shadow-md dark:border-primary dark:bg-primary dark:text-primary-foreground'
                            : currentMonth
                              ? 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40 dark:border-border dark:bg-card dark:hover:border-emerald-700 dark:hover:bg-emerald-950/20'
                              : 'border-transparent bg-slate-50 text-slate-400 dark:bg-muted/20 dark:text-muted-foreground/50'
                        }`}
                      >
                        <span className={`inline-grid h-6 w-6 place-items-center rounded-full text-xs font-extrabold ${isToday && !selected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : ''}`}>
                          {date.getDate()}
                        </span>
                        <div className="absolute bottom-2 left-2 flex gap-1">
                          {hasIncome && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                          {hasExpense && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                          {hasPending && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                        </div>
                        {entries.length > 0 && <span className="absolute right-1.5 top-1.5 text-[9px] font-black opacity-70">{entries.length}</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 px-1 text-[10px] font-bold text-slate-500 dark:text-muted-foreground sm:text-xs">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Receita</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> Despesa</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> Pendente</span>
                </div>
              </CardContent>
            </Card>

            <Card className="h-fit border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-black text-slate-950 dark:text-foreground">{formatFullDate(selectedDay)}</CardTitle>
                <CardDescription>{selectedDayEntries.length ? `${selectedDayEntries.length} movimentação(ões)` : 'Nenhuma movimentação'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {selectedDayEntries.map((item) => (
                  <TransactionRow key={item.id} item={item} onEdit={openEdit} onDelete={removeEntry} onTogglePaid={togglePaid} compact />
                ))}
                <Button variant="outline" className="mt-2 w-full rounded-xl border-dashed" onClick={() => openNewEntry({ date: selectedDay })}>
                  <Plus className="mr-2 h-4 w-4" /> Adicionar neste dia
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {view === 'planejamento' && (
          <div className="mt-5 space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <PlanningCard
                icon={WalletCards}
                title="Orçamento mensal"
                goal={state.settings.monthlyBudget}
                current={paidExpenses}
                percentage={budgetUsage}
                description="Limite que você deseja gastar no mês."
                inverse
                onEdit={openSettings}
              />
              <PlanningCard
                icon={PiggyBank}
                title="Meta de economia"
                goal={state.settings.savingsGoal}
                current={Math.max(balance, 0)}
                percentage={savingsProgress}
                description="Quanto deseja guardar do saldo deste mês."
                onEdit={openSettings}
              />
              <PlanningCard
                icon={ShieldCheck}
                title="Reserva de emergência"
                goal={state.settings.emergencyFundGoal}
                current={0}
                percentage={0}
                description="Defina um valor-alvo para sua reserva."
                onEdit={openSettings}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-black text-slate-950 dark:text-foreground">Resumo inteligente</CardTitle>
                  <CardDescription>Leitura rápida da situação do mês selecionado.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Insight
                    icon={balance >= 0 ? TrendingUp : TrendingDown}
                    title={balance >= 0 ? 'Seu mês está positivo' : 'Seu mês está no vermelho'}
                    description={balance >= 0
                      ? `Depois das movimentações pagas, sobraram ${currency.format(balance)}.`
                      : `As despesas ultrapassaram as receitas em ${currency.format(Math.abs(balance))}.`}
                    tone={balance >= 0 ? 'good' : 'warning'}
                  />
                  <Insight
                    icon={Clock3}
                    title={pendingExpenses > 0 ? 'Existem contas pendentes' : 'Sem contas pendentes no mês'}
                    description={pendingExpenses > 0
                      ? `Você ainda tem ${currency.format(pendingExpenses)} em despesas marcadas como pendentes.`
                      : 'Ótimo: não há despesas pendentes cadastradas para este mês.'}
                    tone={pendingExpenses > 0 ? 'warning' : 'good'}
                  />
                  <Insight
                    icon={Target}
                    title={state.settings.monthlyBudget ? 'Orçamento acompanhado' : 'Defina um orçamento'}
                    description={state.settings.monthlyBudget
                      ? `Você já utilizou ${budgetUsage.toFixed(0)}% do seu limite mensal de ${currency.format(state.settings.monthlyBudget)}.`
                      : 'Criar um limite mensal ajuda a perceber gastos excessivos antes do fim do mês.'}
                    tone={budgetUsage > 90 ? 'warning' : 'neutral'}
                  />
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-black text-slate-950 dark:text-foreground">Privacidade e backup</CardTitle>
                  <CardDescription>Seus lançamentos não são enviados ao Supabase por esta ferramenta.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100">
                    <div className="flex gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="font-black">Dados salvos neste navegador</p>
                        <p className="mt-1 text-xs leading-relaxed opacity-80">Se você limpar os dados do navegador ou trocar de aparelho, use o backup abaixo para não perder seu histórico.</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="h-11 rounded-xl" onClick={exportData}><Download className="mr-2 h-4 w-4" /> Exportar</Button>
                    <Button variant="outline" className="h-11 rounded-xl" onClick={() => importRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Importar</Button>
                  </div>
                  <input
                    ref={importRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(event) => {
                      importData(event.target.files?.[0]);
                      event.target.value = '';
                    }}
                  />
                  <Button variant="outline" className="w-full rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900" onClick={clearData}>
                    <Trash2 className="mr-2 h-4 w-4" /> Apagar todos os dados deste aparelho
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => openNewEntry()}
        aria-label="Adicionar lançamento"
        className="fixed bottom-5 right-5 z-30 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-600 text-white shadow-2xl shadow-emerald-900/30 transition hover:scale-105 hover:bg-emerald-700 active:scale-95 sm:hidden"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Dialog open={isEntryOpen} onOpenChange={setIsEntryOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">{editing ? 'Editar lançamento' : 'Novo lançamento'}</DialogTitle>
            <DialogDescription>Registre uma entrada ou saída para manter seu mês organizado.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveEntry} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-muted">
              <button
                type="button"
                onClick={() => changeFormType('receita')}
                className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-black transition ${form.type === 'receita' ? 'bg-white text-emerald-700 shadow-sm dark:bg-card dark:text-emerald-400' : 'text-slate-500 dark:text-muted-foreground'}`}
              >
                <ArrowUpCircle className="h-4 w-4" /> Receita
              </button>
              <button
                type="button"
                onClick={() => changeFormType('despesa')}
                className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-black transition ${form.type === 'despesa' ? 'bg-white text-rose-700 shadow-sm dark:bg-card dark:text-rose-400' : 'text-slate-500 dark:text-muted-foreground'}`}
              >
                <ArrowDownCircle className="h-4 w-4" /> Despesa
              </button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="finance-title">Descrição</Label>
              <Input id="finance-title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder={form.type === 'despesa' ? 'Ex: Mercado' : 'Ex: Salário'} className="h-11 rounded-xl" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="finance-amount">Valor</Label>
                <Input id="finance-amount" inputMode="decimal" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="0,00" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="finance-date">Data</Label>
                <Input id="finance-date" type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className="h-11 rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(category) => setForm((current) => ({ ...current, category }))}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{categories[form.type].map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(status) => setForm((current) => ({ ...current, status: status as TransactionStatus }))}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pago">{form.type === 'receita' ? 'Recebido' : 'Pago'}</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-3 dark:border-border">
              <div>
                <p className="text-sm font-bold">Movimento recorrente</p>
                <p className="text-[11px] text-muted-foreground">Marque contas ou receitas que costumam se repetir mensalmente.</p>
              </div>
              <Switch checked={form.recurring} onCheckedChange={(recurring) => setForm((current) => ({ ...current, recurring }))} />
            </div>

            {form.type === 'despesa' && form.status === 'pendente' && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-2">
                    <BellRing className="mt-0.5 h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-black text-slate-950 dark:text-foreground">Lembrar deste vencimento</p>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">O aviso fica agendado com segurança e é enviado mesmo com o Saj Tem fechado.</p>
                    </div>
                  </div>
                  <Switch checked={form.notify} onCheckedChange={(notify) => setForm((current) => ({ ...current, notify }))} disabled={!user} />
                </div>

                {form.notify && user && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="finance-reminder-days">Avisar</Label>
                      <Select value={String(form.reminderDaysBefore)} onValueChange={(value) => setForm((current) => ({ ...current, reminderDaysBefore: Number(value) }))}>
                        <SelectTrigger id="finance-reminder-days" className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">No dia</SelectItem>
                          <SelectItem value="1">1 dia antes</SelectItem>
                          <SelectItem value="2">2 dias antes</SelectItem>
                          <SelectItem value="3">3 dias antes</SelectItem>
                          <SelectItem value="7">7 dias antes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="finance-reminder-time">Horário</Label>
                      <Input id="finance-reminder-time" type="time" value={form.reminderTime} onChange={(event) => setForm((current) => ({ ...current, reminderTime: event.target.value }))} className="h-10 rounded-xl" />
                    </div>
                  </div>
                )}

                {!user && <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">Faça login para receber lembretes automáticos.</p>}
                {user && form.notify && !push.enabled && (
                  <Button type="button" variant="outline" size="sm" className="mt-3 w-full rounded-xl" disabled={push.loading || !push.supported} onClick={() => void push.enable()}>
                    <BellRing className="mr-2 h-4 w-4" /> Ativar notificações neste aparelho
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="finance-note">Observação (opcional)</Label>
              <Textarea id="finance-note" value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} placeholder="Ex: parcela 2/6, pagamento via PIX..." className="min-h-[80px] rounded-xl" />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              {editing && (
                <Button type="button" variant="outline" className="rounded-xl border-rose-200 text-rose-600" onClick={() => { removeEntry(editing.id); setIsEntryOpen(false); }}>
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </Button>
              )}
              <Button type="submit" className="rounded-xl bg-emerald-600 font-black hover:bg-emerald-700">
                <CheckCircle2 className="mr-2 h-4 w-4" /> {editing ? 'Salvar alterações' : 'Adicionar lançamento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Planejamento financeiro</DialogTitle>
            <DialogDescription>Defina valores que façam sentido para a sua realidade. Você pode mudar quando quiser.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Limite de despesas por mês</Label>
              <Input inputMode="decimal" value={settingsForm.monthlyBudget} onChange={(event) => setSettingsForm((current) => ({ ...current, monthlyBudget: event.target.value }))} placeholder="Ex: 2500,00" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Meta de economia mensal</Label>
              <Input inputMode="decimal" value={settingsForm.savingsGoal} onChange={(event) => setSettingsForm((current) => ({ ...current, savingsGoal: event.target.value }))} placeholder="Ex: 500,00" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Meta de reserva de emergência</Label>
              <Input inputMode="decimal" value={settingsForm.emergencyFundGoal} onChange={(event) => setSettingsForm((current) => ({ ...current, emergencyFundGoal: event.target.value }))} placeholder="Ex: 10000,00" className="h-11 rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveSettings} className="rounded-xl bg-emerald-600 font-black hover:bg-emerald-700">Salvar planejamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

type SummaryCardProps = {
  label: string;
  value: number;
  icon: typeof TrendingUp;
  tone: 'emerald' | 'rose' | 'blue' | 'violet';
  helper: string;
};

const SummaryCard = ({ label, value, icon: Icon, tone, helper }: SummaryCardProps) => {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300',
    rose: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300',
    blue: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300',
    violet: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300',
  };

  return (
    <Card className={`border shadow-sm ${tones[tone]}`}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-extrabold uppercase leading-tight tracking-wider opacity-75 sm:text-xs">{label}</p>
          <Icon className="h-5 w-5 shrink-0 opacity-80" />
        </div>
        <p className="mt-3 break-words text-lg font-black sm:text-2xl">{currency.format(value)}</p>
        <p className="mt-1 text-[10px] font-semibold opacity-70 sm:text-[11px]">{helper}</p>
      </CardContent>
    </Card>
  );
};

const TransactionRow = ({
  item,
  onEdit,
  onDelete,
  onTogglePaid,
  compact = false,
}: {
  item: Transaction;
  onEdit: (item: Transaction) => void;
  onDelete: (id: string) => void;
  onTogglePaid: (item: Transaction) => void;
  compact?: boolean;
}) => (
  <div className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:shadow-sm dark:border-border dark:bg-card dark:hover:border-muted-foreground/30">
    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.type === 'receita' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'}`}>
      {item.type === 'receita' ? <ArrowUpCircle className="h-5 w-5" /> : <ArrowDownCircle className="h-5 w-5" />}
    </div>
    <button type="button" onClick={() => onEdit(item)} className="min-w-0 flex-1 text-left">
      <div className="flex items-center gap-2">
        <p className="truncate text-sm font-extrabold text-slate-950 dark:text-foreground">{item.title}</p>
        {item.recurring && <RotateCcw className="h-3 w-3 shrink-0 text-slate-400" />}
      </div>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold text-slate-500 dark:text-muted-foreground">
        {!compact && <span>{formatDate(item.date)}</span>}
        <span>{item.category}</span>
        <span className={`rounded-full px-1.5 py-0.5 ${item.status === 'pago' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>
          {item.status === 'pago' ? (item.type === 'receita' ? 'Recebido' : 'Pago') : 'Pendente'}
        </span>
      </div>
    </button>
    <div className="text-right">
      <p className={`whitespace-nowrap text-sm font-black ${item.type === 'receita' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        {item.type === 'receita' ? '+' : '-'}{currency.format(item.amount)}
      </p>
      <div className="mt-1 flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
        <button type="button" title={item.status === 'pago' ? 'Marcar como pendente' : 'Marcar como pago'} onClick={() => onTogglePaid(item)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-muted">
          <CheckCircle2 className="h-3.5 w-3.5" />
        </button>
        <button type="button" title="Editar" onClick={() => onEdit(item)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-muted dark:hover:text-foreground">
          <Edit3 className="h-3.5 w-3.5" />
        </button>
        <button type="button" title="Excluir" onClick={() => onDelete(item.id)} className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, title, description }: { icon: typeof ReceiptText; title: string; description: string }) => (
  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center dark:border-border dark:bg-muted/20">
    <Icon className="mx-auto h-8 w-8 text-slate-300 dark:text-muted-foreground/50" />
    <p className="mt-3 text-sm font-black text-slate-700 dark:text-foreground">{title}</p>
    <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-muted-foreground">{description}</p>
  </div>
);

const GoalLine = ({ label, current, goal, percentage, inverse = false }: { label: string; current: number; goal: number; percentage: number; inverse?: boolean }) => {
  const noGoal = goal <= 0;
  const danger = inverse && percentage >= 90;
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-600 dark:text-muted-foreground">{label}</p>
          <p className="text-sm font-black text-slate-950 dark:text-foreground">{currency.format(current)}</p>
        </div>
        <p className={`text-xs font-extrabold ${danger ? 'text-rose-600' : 'text-slate-500 dark:text-muted-foreground'}`}>
          {noGoal ? 'Meta não definida' : `de ${currency.format(goal)}`}
        </p>
      </div>
      <Progress value={noGoal ? 0 : percentage} className={`h-2.5 ${danger ? '[&>div]:bg-rose-500' : ''}`} />
      {!noGoal && <p className="text-right text-[10px] font-bold text-slate-400">{percentage.toFixed(0)}%</p>}
    </div>
  );
};

const PlanningCard = ({ icon: Icon, title, goal, current, percentage, description, onEdit, inverse = false }: {
  icon: typeof WalletCards;
  title: string;
  goal: number;
  current: number;
  percentage: number;
  description: string;
  onEdit: () => void;
  inverse?: boolean;
}) => (
  <Card className="border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"><Icon className="h-5 w-5" /></div>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={onEdit}><MoreHorizontal className="h-4 w-4" /></Button>
      </div>
      <h3 className="mt-4 font-black text-slate-950 dark:text-foreground">{title}</h3>
      <p className="mt-1 min-h-8 text-xs leading-relaxed text-slate-500 dark:text-muted-foreground">{description}</p>
      <div className="mt-5">
        <GoalLine label="Progresso" current={current} goal={goal} percentage={percentage} inverse={inverse} />
      </div>
    </CardContent>
  </Card>
);

const Insight = ({ icon: Icon, title, description, tone }: { icon: typeof TrendingUp; title: string; description: string; tone: 'good' | 'warning' | 'neutral' }) => {
  const styles = {
    good: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200',
    warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200',
    neutral: 'border-slate-200 bg-slate-50 text-slate-800 dark:border-border dark:bg-muted/30 dark:text-foreground',
  };
  return (
    <div className={`flex gap-3 rounded-2xl border p-4 ${styles[tone]}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="text-sm font-black">{title}</p>
        <p className="mt-1 text-xs leading-relaxed opacity-80">{description}</p>
      </div>
    </div>
  );
};

export default ControleFinanceiro;

