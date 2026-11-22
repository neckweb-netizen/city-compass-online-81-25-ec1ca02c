import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type GestacaoPerfil = {
  dum: string;
  dpp: string;
  metodoCalculo: 'dum' | 'ultrassom';
  nomeBebe: string;
  observacaoMedica: string;
};

export type GestacaoEvento = {
  id: string;
  titulo: string;
  data: string;
  tipo: 'consulta' | 'exame' | 'lembrete';
  concluido: boolean;
  observacao: string;
  hora: string;
  notificar: boolean;
  lembreteMinutosAntes: number;
};

export type GestacaoDiario = {
  id: string;
  data: string;
  humor: string;
  sintomas: string[];
  peso: number | null;
  observacao: string;
};

type GestacaoState = {
  perfil: GestacaoPerfil | null;
  eventos: GestacaoEvento[];
  diario: GestacaoDiario[];
};

const STORAGE_PREFIX = 'sajtem:gestacao:v1';
const EMPTY_STATE: GestacaoState = { perfil: null, eventos: [], diario: [] };
const keyFor = (userId?: string) => (userId ? `${STORAGE_PREFIX}:user:${userId}` : STORAGE_PREFIX);

const readLocal = (key: string): GestacaoState => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<GestacaoState>;
    return {
      perfil: parsed.perfil || null,
      eventos: Array.isArray(parsed.eventos)
        ? parsed.eventos.map((item: any) => ({
            ...item,
            hora: item.hora || '',
            notificar: Boolean(item.notificar),
            lembreteMinutosAntes: Number(item.lembreteMinutosAntes ?? 1440),
          }))
        : [],
      diario: Array.isArray(parsed.diario) ? parsed.diario : [],
    };
  } catch {
    return EMPTY_STATE;
  }
};

const writeLocal = (key: string, state: GestacaoState) => {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // O estado em memória continua funcionando se o storage estiver indisponível.
  }
};

export const useGestacaoStorage = () => {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<GestacaoState>(EMPTY_STATE);
  const [stateAccountId, setStateAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const accountRef = useRef(user?.id ?? null);
  accountRef.current = user?.id ?? null;
  const sequenceRef = useRef(0);
  const operationRef = useRef(false);

  const persist = useCallback((next: GestacaoState, accountId: string | null) => {
    if (accountRef.current !== accountId) return;
    setState(next);
    setStateAccountId(accountId);
    writeLocal(keyFor(accountId ?? undefined), next);
  }, []);

  useEffect(() => {
    const sequence = ++sequenceRef.current;
    if (authLoading) {
      setState(EMPTY_STATE);
      setStateAccountId(null);
      setLoading(true);
      return;
    }
    const accountId = user?.id ?? null;
    setStateAccountId(accountId);
    const cached = readLocal(keyFor(accountId ?? undefined));
    setState(cached);
    setSyncError(null);
    if (!accountId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [perfilRes, eventosRes, diarioRes] = await Promise.all([
          (supabase as any).from('gestacao_perfis').select('*').eq('user_id', accountId).maybeSingle(),
          (supabase as any).from('gestacao_eventos').select('*').eq('user_id', accountId).order('data_evento', { ascending: true }),
          (supabase as any).from('gestacao_diario').select('*').eq('user_id', accountId).order('data_registro', { ascending: false }),
        ]);
        if (cancelled || sequence !== sequenceRef.current || accountRef.current !== accountId) return;
        const error = perfilRes.error || eventosRes.error || diarioRes.error;
        if (error) {
          setSyncError(error.message || 'Falha ao carregar os dados da gestação.');
          return;
        }
        const remote: GestacaoState = {
          perfil: perfilRes.data ? {
            dum: perfilRes.data.dum || '',
            dpp: perfilRes.data.dpp || '',
            metodoCalculo: perfilRes.data.metodo_calculo || 'dum',
            nomeBebe: perfilRes.data.nome_bebe || '',
            observacaoMedica: perfilRes.data.observacao_medica || '',
          } : null,
          eventos: (eventosRes.data || []).map((row: any) => ({
            id: row.id, titulo: row.titulo, data: row.data_evento, tipo: row.tipo,
            concluido: Boolean(row.concluido), observacao: row.observacao || '',
            hora: row.hora_evento ? String(row.hora_evento).slice(0, 5) : '',
            notificar: Boolean(row.notificar),
            lembreteMinutosAntes: Number(row.lembrete_minutos_antes ?? 1440),
          })),
          diario: (diarioRes.data || []).map((row: any) => ({
            id: row.id, data: row.data_registro, humor: row.humor || '',
            sintomas: Array.isArray(row.sintomas) ? row.sintomas : [],
            peso: row.peso == null ? null : Number(row.peso),
            observacao: row.observacao || '',
          })),
        };
        const hasCached = cached.perfil !== null || cached.eventos.length > 0 || cached.diario.length > 0;
        const hasRemote = remote.perfil !== null || remote.eventos.length > 0 || remote.diario.length > 0;
        if (!hasRemote && hasCached) {
          // Nunca apagar um cache antigo sem confirmação; não declará-lo sincronizado.
          setSyncError('Há dados antigos neste aparelho sem confirmação no servidor. Guarde uma cópia antes de editar.');
          return;
        }
        persist(remote, accountId);
      } catch (cause) {
        if (!cancelled && sequence === sequenceRef.current && accountRef.current === accountId)
          setSyncError(cause instanceof Error ? cause.message : 'Falha de conexão ao carregar acompanhamento.');
      } finally {
        if (!cancelled && sequence === sequenceRef.current && accountRef.current === accountId) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; sequenceRef.current += 1; };
  }, [authLoading, persist, user?.id]);

  const blocked = () => ({
    synced: false as const, reason: 'remote_error' as const,
    error: { message: 'Aguarde a sincronização ou o carregamento dos dados.' },
  });
  const mutate = useCallback(async (
    next: GestacaoState,
    action: (accountId: string) => Promise<{ error: { message: string } | null }>,
  ) => {
    if (authLoading || loading || operationRef.current || stateAccountId !== (user?.id ?? null) || syncError?.startsWith('Há dados antigos')) return blocked();
    const accountId = user?.id ?? null;
    if (!accountId) {
      persist(next, null);
      return { synced: false as const, reason: 'not_authenticated' as const };
    }
    operationRef.current = true;
    setSyncing(true);
    setSyncError(null);
    try {
      const { error } = await action(accountId);
      if (error) {
        if (accountRef.current === accountId) setSyncError(error.message);
        return { synced: false as const, reason: 'remote_error' as const, error };
      }
      if (accountRef.current !== accountId) {
        return { synced: false as const, reason: 'remote_error' as const,
          error: { message: 'A conta mudou durante a operação.' } };
      }
      persist(next, accountId);
      return { synced: true as const };
    } catch (cause) {
      const error = { message: cause instanceof Error ? cause.message : 'Falha ao sincronizar acompanhamento.' };
      if (accountRef.current === accountId) setSyncError(error.message);
      return { synced: false as const, reason: 'remote_error' as const, error };
    } finally {
      operationRef.current = false;
      if (accountRef.current === accountId) setSyncing(false);
    }
  }, [authLoading, loading, persist, stateAccountId, syncError, user?.id]);

  const savePerfil = useCallback(async (perfil: GestacaoPerfil) => mutate(
    { ...state, perfil },
    accountId => (supabase as any).from('gestacao_perfis').upsert({
      user_id: accountId, dum: perfil.dum || null, dpp: perfil.dpp || null,
      metodo_calculo: perfil.metodoCalculo, nome_bebe: perfil.nomeBebe || null,
      observacao_medica: perfil.observacaoMedica || null,
      atualizado_em: new Date().toISOString(),
    }, { onConflict: 'user_id' }),
  ), [mutate, state]);

  const saveEvento = useCallback(async (evento: GestacaoEvento) => mutate({
    ...state, eventos: state.eventos.some(item => item.id === evento.id)
      ? state.eventos.map(item => item.id === evento.id ? evento : item) : [...state.eventos, evento],
  }, accountId => (supabase as any).from('gestacao_eventos').upsert({
    id: evento.id, user_id: accountId, titulo: evento.titulo, data_evento: evento.data,
    tipo: evento.tipo, concluido: evento.concluido, observacao: evento.observacao || null,
    hora_evento: evento.hora || null, notificar: evento.notificar,
    lembrete_minutos_antes: evento.lembreteMinutosAntes,
    atualizado_em: new Date().toISOString(),
  }, { onConflict: 'id' })), [mutate, state]);

  const removeEvento = useCallback(async (id: string) => mutate({
    ...state, eventos: state.eventos.filter(item => item.id !== id),
  }, accountId => (supabase as any).from('gestacao_eventos').delete().eq('id', id).eq('user_id', accountId)), [mutate, state]);

  const saveDiario = useCallback(async (registro: GestacaoDiario) => mutate({
    ...state, diario: state.diario.some(item => item.id === registro.id)
      ? state.diario.map(item => item.id === registro.id ? registro : item) : [registro, ...state.diario],
  }, accountId => (supabase as any).from('gestacao_diario').upsert({
    id: registro.id, user_id: accountId, data_registro: registro.data,
    humor: registro.humor || null, sintomas: registro.sintomas, peso: registro.peso,
    observacao: registro.observacao || null, atualizado_em: new Date().toISOString(),
  }, { onConflict: 'id' })), [mutate, state]);

  const removeDiario = useCallback(async (id: string) => mutate({
    ...state, diario: state.diario.filter(item => item.id !== id),
  }, accountId => (supabase as any).from('gestacao_diario').delete().eq('id', id).eq('user_id', accountId)), [mutate, state]);

  const syncStatus = useMemo(() => {
    if (!user) return 'local' as const;
    if (syncing) return 'syncing' as const;
    if (syncError) return 'error' as const;
    return 'synced' as const;
  }, [syncError, syncing, user]);

  const visible = stateAccountId === (user?.id ?? null) ? state : EMPTY_STATE;
  return {
    user, perfil: visible.perfil, eventos: visible.eventos, diario: visible.diario,
    loading: authLoading || loading || stateAccountId !== (user?.id ?? null),
    syncing, syncStatus, syncError,
    savePerfil, saveEvento, removeEvento, saveDiario, removeDiario,
  };
};
