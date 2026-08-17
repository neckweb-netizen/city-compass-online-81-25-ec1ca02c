import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type FinanceTransactionType = 'receita' | 'despesa';
export type FinanceTransactionStatus = 'pago' | 'pendente';

export type FinanceTransaction = {
  id: string;
  type: FinanceTransactionType;
  title: string;
  amount: number;
  category: string;
  date: string;
  status: FinanceTransactionStatus;
  recurring: boolean;
  note?: string;
  notify: boolean;
  reminderDaysBefore: number;
  reminderTime: string;
  createdAt: string;
};

export type FinanceSettings = {
  monthlyBudget: number;
  savingsGoal: number;
  emergencyFundGoal: number;
};

export type FinanceState = {
  transactions: FinanceTransaction[];
  settings: FinanceSettings;
};

export const FINANCE_STORAGE_KEY = 'sajtem:controle-financeiro:v1';
const userStorageKey = (userId: string) => `${FINANCE_STORAGE_KEY}:user:${userId}`;

export const EMPTY_FINANCE_STATE: FinanceState = {
  transactions: [],
  settings: {
    monthlyBudget: 0,
    savingsGoal: 0,
    emergencyFundGoal: 0,
  },
};

const isMeaningfulState = (state: FinanceState) =>
  state.transactions.length > 0 ||
  state.settings.monthlyBudget > 0 ||
  state.settings.savingsGoal > 0 ||
  state.settings.emergencyFundGoal > 0;

const loadLocalState = (storageKey = FINANCE_STORAGE_KEY): FinanceState => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return EMPTY_FINANCE_STATE;

    const parsed = JSON.parse(raw) as Partial<FinanceState>;
    return {
      transactions: Array.isArray(parsed.transactions)
        ? parsed.transactions.map((item: any) => ({
            ...item,
            notify: Boolean(item.notify),
            reminderDaysBefore: Number(item.reminderDaysBefore ?? 1),
            reminderTime: item.reminderTime || '09:00',
          }))
        : [],
      settings: {
        ...EMPTY_FINANCE_STATE.settings,
        ...(parsed.settings || {}),
      },
    };
  } catch {
    return EMPTY_FINANCE_STATE;
  }
};

const toTransactionRow = (userId: string, item: FinanceTransaction) => ({
  id: item.id,
  user_id: userId,
  tipo: item.type,
  titulo: item.title,
  valor: item.amount,
  categoria: item.category,
  data_lancamento: item.date,
  status: item.status,
  recorrente: item.recurring,
  observacao: item.note || null,
  notificar: item.notify,
  lembrete_dias_antes: item.reminderDaysBefore,
  lembrete_hora: item.reminderTime || '09:00',
  criado_em: item.createdAt,
  atualizado_em: new Date().toISOString(),
});

const fromTransactionRow = (row: any): FinanceTransaction => ({
  id: row.id,
  type: row.tipo,
  title: row.titulo,
  amount: Number(row.valor || 0),
  category: row.categoria,
  date: row.data_lancamento,
  status: row.status,
  recurring: Boolean(row.recorrente),
  note: row.observacao || '',
  notify: Boolean(row.notificar),
  reminderDaysBefore: Number(row.lembrete_dias_antes ?? 1),
  reminderTime: row.lembrete_hora ? String(row.lembrete_hora).slice(0, 5) : '09:00',
  createdAt: row.criado_em,
});

export const useControleFinanceiroStorage = () => {
  const { user, loading: authLoading } = useAuth();
  const legacyLocalRef = useRef<FinanceState>(loadLocalState());
  const [state, setState] = useState<FinanceState>(legacyLocalRef.current);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [hasLocalDataToImport, setHasLocalDataToImport] = useState(false);
  const loadedUserRef = useRef<string | null>(null);

  const persistLocal = useCallback((next: FinanceState) => {
    setState(next);
    const storageKey = user ? userStorageKey(user.id) : FINANCE_STORAGE_KEY;
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // O estado em memória continua funcionando mesmo se o navegador bloquear o storage.
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      loadedUserRef.current = null;
      setState(loadLocalState(FINANCE_STORAGE_KEY));
      setLoading(false);
      setSyncError(null);
      setHasLocalDataToImport(false);
      return;
    }

    if (loadedUserRef.current === user.id) return;
    loadedUserRef.current = user.id;

    let cancelled = false;

    const loadRemote = async () => {
      setLoading(true);
      setSyncError(null);

      const accountCache = loadLocalState(userStorageKey(user.id));
      if (isMeaningfulState(accountCache)) setState(accountCache);

      const [transactionsResponse, settingsResponse] = await Promise.all([
        (supabase as any)
          .from('finance_lancamentos')
          .select('*')
          .eq('user_id', user.id)
          .order('data_lancamento', { ascending: false })
          .order('criado_em', { ascending: false }),
        (supabase as any)
          .from('finance_configuracoes')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      if (transactionsResponse.error || settingsResponse.error) {
        const message = transactionsResponse.error?.message || settingsResponse.error?.message || 'Falha ao carregar dados financeiros.';
        setSyncError(message);
        setLoading(false);
        return;
      }

      const remoteState: FinanceState = {
        transactions: (transactionsResponse.data || []).map(fromTransactionRow),
        settings: settingsResponse.data
          ? {
              monthlyBudget: Number(settingsResponse.data.orcamento_mensal || 0),
              savingsGoal: Number(settingsResponse.data.meta_economia || 0),
              emergencyFundGoal: Number(settingsResponse.data.meta_reserva_emergencia || 0),
            }
          : EMPTY_FINANCE_STATE.settings,
      };

      const remoteHasData = isMeaningfulState(remoteState);
      const localHasData = isMeaningfulState(legacyLocalRef.current);

      if (remoteHasData) {
        persistLocal(remoteState);
        setHasLocalDataToImport(false);
      } else if (localHasData) {
        // Não migra automaticamente dados sensíveis do aparelho para uma conta.
        // O usuário escolhe explicitamente fazer a importação.
        persistLocal(legacyLocalRef.current);
        setHasLocalDataToImport(true);
      } else {
        persistLocal(remoteState);
        setHasLocalDataToImport(false);
      }

      setLoading(false);
    };

    loadRemote();

    return () => {
      cancelled = true;
    };
  }, [authLoading, persistLocal, user]);

  const saveTransaction = useCallback(async (transaction: FinanceTransaction) => {
    const next: FinanceState = {
      ...state,
      transactions: state.transactions.some((item) => item.id === transaction.id)
        ? state.transactions.map((item) => (item.id === transaction.id ? transaction : item))
        : [...state.transactions, transaction],
    };

    persistLocal(next);

    if (!user) return { synced: false, reason: 'not_authenticated' as const };

    setSyncing(true);
    setSyncError(null);
    const { error } = await (supabase as any)
      .from('finance_lancamentos')
      .upsert(toTransactionRow(user.id, transaction), { onConflict: 'id' });
    setSyncing(false);

    if (error) {
      setSyncError(error.message);
      return { synced: false, reason: 'remote_error' as const, error };
    }

    return { synced: true as const };
  }, [persistLocal, state, user]);

  const removeTransaction = useCallback(async (id: string) => {
    const next: FinanceState = {
      ...state,
      transactions: state.transactions.filter((item) => item.id !== id),
    };
    persistLocal(next);

    if (!user) return { synced: false, reason: 'not_authenticated' as const };

    setSyncing(true);
    setSyncError(null);
    const { error } = await (supabase as any)
      .from('finance_lancamentos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    setSyncing(false);

    if (error) {
      setSyncError(error.message);
      return { synced: false, reason: 'remote_error' as const, error };
    }

    return { synced: true as const };
  }, [persistLocal, state, user]);

  const saveSettings = useCallback(async (settings: FinanceSettings) => {
    const next = { ...state, settings };
    persistLocal(next);

    if (!user) return { synced: false, reason: 'not_authenticated' as const };

    setSyncing(true);
    setSyncError(null);
    const { error } = await (supabase as any)
      .from('finance_configuracoes')
      .upsert({
        user_id: user.id,
        orcamento_mensal: settings.monthlyBudget,
        meta_economia: settings.savingsGoal,
        meta_reserva_emergencia: settings.emergencyFundGoal,
        atualizado_em: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    setSyncing(false);

    if (error) {
      setSyncError(error.message);
      return { synced: false, reason: 'remote_error' as const, error };
    }

    return { synced: true as const };
  }, [persistLocal, state, user]);

  const replaceAll = useCallback(async (next: FinanceState) => {
    persistLocal(next);

    if (!user) return { synced: false, reason: 'not_authenticated' as const };

    setSyncing(true);
    setSyncError(null);

    const deleteResponse = await (supabase as any)
      .from('finance_lancamentos')
      .delete()
      .eq('user_id', user.id);

    if (deleteResponse.error) {
      setSyncing(false);
      setSyncError(deleteResponse.error.message);
      return { synced: false, reason: 'remote_error' as const, error: deleteResponse.error };
    }

    if (next.transactions.length > 0) {
      const insertResponse = await (supabase as any)
        .from('finance_lancamentos')
        .insert(next.transactions.map((item) => toTransactionRow(user.id, item)));

      if (insertResponse.error) {
        setSyncing(false);
        setSyncError(insertResponse.error.message);
        return { synced: false, reason: 'remote_error' as const, error: insertResponse.error };
      }
    }

    const settingsResponse = await (supabase as any)
      .from('finance_configuracoes')
      .upsert({
        user_id: user.id,
        orcamento_mensal: next.settings.monthlyBudget,
        meta_economia: next.settings.savingsGoal,
        meta_reserva_emergencia: next.settings.emergencyFundGoal,
        atualizado_em: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    setSyncing(false);

    if (settingsResponse.error) {
      setSyncError(settingsResponse.error.message);
      return { synced: false, reason: 'remote_error' as const, error: settingsResponse.error };
    }

    setHasLocalDataToImport(false);
    return { synced: true as const };
  }, [persistLocal, user]);

  const importLocalToAccount = useCallback(async () => {
    if (!user) return { synced: false, reason: 'not_authenticated' as const };
    const result = await replaceAll(state);
    if (result.synced) setHasLocalDataToImport(false);
    return result;
  }, [replaceAll, state, user]);

  const clearAll = useCallback(async () => {
    const previous = state;
    persistLocal(EMPTY_FINANCE_STATE);

    if (!user) {
      try {
        localStorage.removeItem(user ? userStorageKey(user.id) : FINANCE_STORAGE_KEY);
      } catch {
        // Sem ação.
      }
      return { synced: false, reason: 'not_authenticated' as const };
    }

    setSyncing(true);
    setSyncError(null);

    const [transactionsResponse, settingsResponse] = await Promise.all([
      (supabase as any).from('finance_lancamentos').delete().eq('user_id', user.id),
      (supabase as any).from('finance_configuracoes').delete().eq('user_id', user.id),
    ]);

    setSyncing(false);

    const error = transactionsResponse.error || settingsResponse.error;
    if (error) {
      persistLocal(previous);
      setSyncError(error.message);
      return { synced: false, reason: 'remote_error' as const, error };
    }

    try {
      localStorage.removeItem(userStorageKey(user.id));
    } catch {
      // Sem ação.
    }

    setHasLocalDataToImport(false);
    return { synced: true as const };
  }, [persistLocal, state, user]);

  const storageLabel = useMemo(() => {
    if (authLoading || loading) return 'Carregando dados';
    if (!user) return 'Salvo neste aparelho';
    if (syncing) return 'Sincronizando';
    if (syncError) return 'Sincronização pendente';
    return 'Sincronizado na conta';
  }, [authLoading, loading, syncError, syncing, user]);

  return {
    state,
    user,
    authLoading,
    loading,
    syncing,
    syncError,
    storageLabel,
    hasLocalDataToImport,
    saveTransaction,
    removeTransaction,
    saveSettings,
    replaceAll,
    importLocalToAccount,
    clearAll,
  };
};

