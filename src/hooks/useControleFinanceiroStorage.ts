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
  const [stateAccountId, setStateAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [hasLocalDataToImport, setHasLocalDataToImport] = useState(false);
  const loadedUserRef = useRef<string | null>(null);
  const restoreInProgressRef = useRef(false);
  const activeUserIdRef = useRef(user?.id ?? null);
  activeUserIdRef.current = user?.id ?? null;

  const persistLocal = useCallback((next: FinanceState) => {
    setState(next);
    setStateAccountId(user?.id ?? null);
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
      setStateAccountId(null);
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
      // Sempre descarte o estado da conta anterior antes de qualquer operação remota.
      // Mesmo um cache vazio é um estado legítimo e não pode mostrar dados de outro usuário.
      setState(accountCache);
      setStateAccountId(user.id);

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
        // Dados antigos sem proprietário identificado nunca entram no cache da conta.
        // Apenas a confirmação explícita pode enviá-los ao servidor.
        persistLocal(remoteState);
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

  // Serializa mudanças de lançamentos, metas, restauração e limpeza para
  // impedir gravações fora de ordem e exclusões concorrentes.
  const accountOperationRef = useRef(false);
  const operationBlocked = () => ({
    synced: false as const,
    reason: 'remote_error' as const,
    error: { message: 'Outra operação financeira está em andamento. Aguarde a conclusão.' },
  });

  const runFinanceMutation = useCallback(async (
    next: FinanceState,
    mutate: (accountId: string) => Promise<{ error: { message: string } | null }>,
  ) => {
    if (accountOperationRef.current) return operationBlocked();
    if (!user) {
      persistLocal(next);
      return { synced: false as const, reason: 'not_authenticated' as const };
    }

    const accountId = user.id;
    if (authLoading || loading || activeUserIdRef.current !== accountId) {
      return {
        synced: false as const,
        reason: 'remote_error' as const,
        error: { message: 'Aguarde o carregamento da conta antes de editar os dados.' },
      };
    }
    accountOperationRef.current = true;
    setSyncing(true);
    setSyncError(null);
    try {
      const { error } = await mutate(accountId);
      if (error) {
        if (activeUserIdRef.current === accountId) setSyncError(error.message);
        return { synced: false as const, reason: 'remote_error' as const, error };
      }
      if (activeUserIdRef.current !== accountId) {
        return {
          synced: false as const,
          reason: 'remote_error' as const,
          error: { message: 'A sessão mudou. Atualize o Controle Financeiro antes de continuar.' },
        };
      }
      // Salva no dispositivo apenas depois da confirmação do Supabase.
      persistLocal(next);
      return { synced: true as const };
    } catch (cause) {
      const error = { message: cause instanceof Error ? cause.message : 'Falha de conexão ao sincronizar dados.' };
      if (activeUserIdRef.current === accountId) setSyncError(error.message);
      return { synced: false as const, reason: 'remote_error' as const, error };
    } finally {
      accountOperationRef.current = false;
      if (activeUserIdRef.current === accountId) setSyncing(false);
    }
  }, [authLoading, loading, persistLocal, user]);

  const saveTransaction = useCallback(async (transaction: FinanceTransaction) => {
    const next: FinanceState = {
      ...state,
      transactions: state.transactions.some((item) => item.id === transaction.id)
        ? state.transactions.map((item) => item.id === transaction.id ? transaction : item)
        : [...state.transactions, transaction],
    };
    return runFinanceMutation(next, accountId =>
      (supabase as any).from('finance_lancamentos')
        .upsert(toTransactionRow(accountId, transaction), { onConflict: 'id' }));
  }, [runFinanceMutation, state]);

  const removeTransaction = useCallback(async (id: string) => {
    const next: FinanceState = {
      ...state,
      transactions: state.transactions.filter(item => item.id !== id),
    };
    return runFinanceMutation(next, accountId =>
      (supabase as any).from('finance_lancamentos')
        .delete().eq('id', id).eq('user_id', accountId));
  }, [runFinanceMutation, state]);

  const saveSettings = useCallback(async (settings: FinanceSettings) => {
    const next: FinanceState = { ...state, settings };
    return runFinanceMutation(next, accountId =>
      (supabase as any).from('finance_configuracoes').upsert({
        user_id: accountId,
        orcamento_mensal: settings.monthlyBudget,
        meta_economia: settings.savingsGoal,
        meta_reserva_emergencia: settings.emergencyFundGoal,
        atualizado_em: new Date().toISOString(),
      }, { onConflict: 'user_id' }));
  }, [runFinanceMutation, state]);

  const replaceAll = useCallback(async (next: FinanceState) => {
    if (restoreInProgressRef.current || accountOperationRef.current) {
      return { synced: false, reason: 'remote_error' as const, error: { message: 'Já existe uma restauração em andamento.' } };
    }
    if (!user) {
      persistLocal(next);
      return { synced: false, reason: 'not_authenticated' as const };
    }

    // Nunca substituir o cache local antes da confirmação da transação remota.
    // Se o servidor falhar, os dados existentes do usuário permanecem intactos.
    restoreInProgressRef.current = true;
    accountOperationRef.current = true;
    setSyncing(true);
    setSyncError(null);
    const requestedUserId = user.id;
    try {
      const { error } = await supabase.rpc('restore_finance_account_data' as any, {
        p_transactions: next.transactions,
        p_settings: next.settings,
      });
      if (error) {
        setSyncError(error.message);
        return { synced: false, reason: 'remote_error' as const, error };
      }

      if (activeUserIdRef.current !== requestedUserId) {
        // Outra conta iniciou sessão: não mostrar nem gravar backup alheio.
        return { synced: false, reason: 'remote_error' as const, error: { message: 'A sessão mudou durante a restauração. Atualize os dados.' } };
      }

      persistLocal(next);
      setHasLocalDataToImport(false);
      return { synced: true as const };
    } catch (cause) {
      const error = { message: cause instanceof Error ? cause.message : 'Falha ao restaurar backup financeiro.' };
      setSyncError(error.message);
      return { synced: false, reason: 'remote_error' as const, error };
    } finally {
      restoreInProgressRef.current = false;
      accountOperationRef.current = false;
      if (activeUserIdRef.current === requestedUserId) setSyncing(false);
    }
  }, [persistLocal, user]);

  const importLocalToAccount = useCallback(async () => {
    if (!user) return { synced: false, reason: 'not_authenticated' as const };
    if (!hasLocalDataToImport) return operationBlocked();
    const result = await replaceAll(legacyLocalRef.current);
    if (result.synced) setHasLocalDataToImport(false);
    return result;
  }, [hasLocalDataToImport, replaceAll, user]);

  const clearAll = useCallback(async () => {
    if (accountOperationRef.current) return operationBlocked();
    if (!user) {
      persistLocal(EMPTY_FINANCE_STATE);
      try {
        localStorage.removeItem(FINANCE_STORAGE_KEY);
      } catch {
        // Sem ação.
      }
      return { synced: false, reason: 'not_authenticated' as const };
    }

    // A limpeza das duas tabelas é feita numa única transação pelo servidor.
    // O cache local só é apagado quando a transação inteira foi confirmada.
    const requestedUserId = user.id;
    accountOperationRef.current = true;
    setSyncing(true);
    setSyncError(null);
    try {
      const { error } = await supabase.rpc('clear_finance_account_data' as any);
      if (error) {
        setSyncError(error.message);
        return { synced: false, reason: 'remote_error' as const, error };
      }

      if (activeUserIdRef.current !== requestedUserId) {
        return { synced: false, reason: 'remote_error' as const, error: { message: 'A sessão mudou durante a exclusão. Atualize os dados.' } };
      }
      persistLocal(EMPTY_FINANCE_STATE);
      try {
        localStorage.removeItem(userStorageKey(requestedUserId));
      } catch {
        // O cache em memória já foi limpo.
      }
      setHasLocalDataToImport(false);
      return { synced: true as const };
    } catch (cause) {
      const error = { message: cause instanceof Error ? cause.message : 'Falha ao apagar dados financeiros.' };
      setSyncError(error.message);
      return { synced: false, reason: 'remote_error' as const, error };
    } finally {
      accountOperationRef.current = false;
      if (activeUserIdRef.current === requestedUserId) setSyncing(false);
    }
  }, [persistLocal, user]);

  const storageLabel = useMemo(() => {
    if (authLoading || loading) return 'Carregando dados';
    if (!user) return 'Salvo neste aparelho';
    if (syncing) return 'Sincronizando';
    if (syncError) return 'Sincronização pendente';
    return 'Sincronizado na conta';
  }, [authLoading, loading, syncError, syncing, user]);

  const visibleState = stateAccountId === (user?.id ?? null) ? state : EMPTY_FINANCE_STATE;

  return {
    state: visibleState,
    user,
    authLoading,
    loading: authLoading || loading || stateAccountId !== (user?.id ?? null),
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

