import { useCallback, useEffect, useMemo, useState } from 'react';
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
      eventos: Array.isArray(parsed.eventos) ? parsed.eventos : [],
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
  const [state, setState] = useState<GestacaoState>(() => readLocal(STORAGE_PREFIX));
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const persist = useCallback((next: GestacaoState) => {
    setState(next);
    writeLocal(keyFor(user?.id), next);
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setState(readLocal(STORAGE_PREFIX));
      setLoading(false);
      setSyncError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setSyncError(null);
      const cached = readLocal(keyFor(user.id));
      setState(cached);

      const [perfilRes, eventosRes, diarioRes] = await Promise.all([
        (supabase as any).from('gestacao_perfis').select('*').eq('user_id', user.id).maybeSingle(),
        (supabase as any).from('gestacao_eventos').select('*').eq('user_id', user.id).order('data_evento', { ascending: true }),
        (supabase as any).from('gestacao_diario').select('*').eq('user_id', user.id).order('data_registro', { ascending: false }),
      ]);

      if (cancelled) return;

      const error = perfilRes.error || eventosRes.error || diarioRes.error;
      if (error) {
        setSyncError(error.message || 'Não foi possível carregar os dados da gestação.');
        setLoading(false);
        return;
      }

      const remote: GestacaoState = {
        perfil: perfilRes.data
          ? {
              dum: perfilRes.data.dum || '',
              dpp: perfilRes.data.dpp || '',
              metodoCalculo: perfilRes.data.metodo_calculo || 'dum',
              nomeBebe: perfilRes.data.nome_bebe || '',
              observacaoMedica: perfilRes.data.observacao_medica || '',
            }
          : cached.perfil,
        eventos: (eventosRes.data || []).map((row: any) => ({
          id: row.id,
          titulo: row.titulo,
          data: row.data_evento,
          tipo: row.tipo,
          concluido: Boolean(row.concluido),
          observacao: row.observacao || '',
        })),
        diario: (diarioRes.data || []).map((row: any) => ({
          id: row.id,
          data: row.data_registro,
          humor: row.humor || '',
          sintomas: Array.isArray(row.sintomas) ? row.sintomas : [],
          peso: row.peso == null ? null : Number(row.peso),
          observacao: row.observacao || '',
        })),
      };

      // Se a conta ainda estiver vazia, mantém o cache local para não apagar dados do aparelho.
      const hasRemote = Boolean(perfilRes.data) || remote.eventos.length > 0 || remote.diario.length > 0;
      const next = hasRemote ? remote : cached;
      persist(next);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, persist, user]);

  const savePerfil = useCallback(async (perfil: GestacaoPerfil) => {
    const next = { ...state, perfil };
    persist(next);
    if (!user) return { synced: false as const, reason: 'not_authenticated' as const };

    setSyncing(true);
    setSyncError(null);
    const { error } = await (supabase as any).from('gestacao_perfis').upsert({
      user_id: user.id,
      dum: perfil.dum || null,
      dpp: perfil.dpp || null,
      metodo_calculo: perfil.metodoCalculo,
      nome_bebe: perfil.nomeBebe || null,
      observacao_medica: perfil.observacaoMedica || null,
      atualizado_em: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    setSyncing(false);

    if (error) {
      setSyncError(error.message);
      return { synced: false as const, reason: 'remote_error' as const };
    }
    return { synced: true as const };
  }, [persist, state, user]);

  const saveEvento = useCallback(async (evento: GestacaoEvento) => {
    const next = {
      ...state,
      eventos: state.eventos.some((item) => item.id === evento.id)
        ? state.eventos.map((item) => (item.id === evento.id ? evento : item))
        : [...state.eventos, evento],
    };
    persist(next);
    if (!user) return;

    setSyncing(true);
    setSyncError(null);
    const { error } = await (supabase as any).from('gestacao_eventos').upsert({
      id: evento.id,
      user_id: user.id,
      titulo: evento.titulo,
      data_evento: evento.data,
      tipo: evento.tipo,
      concluido: evento.concluido,
      observacao: evento.observacao || null,
      atualizado_em: new Date().toISOString(),
    }, { onConflict: 'id' });
    setSyncing(false);
    if (error) setSyncError(error.message);
  }, [persist, state, user]);

  const removeEvento = useCallback(async (id: string) => {
    persist({ ...state, eventos: state.eventos.filter((item) => item.id !== id) });
    if (!user) return;
    const { error } = await (supabase as any).from('gestacao_eventos').delete().eq('id', id).eq('user_id', user.id);
    if (error) setSyncError(error.message);
  }, [persist, state, user]);

  const saveDiario = useCallback(async (registro: GestacaoDiario) => {
    const next = {
      ...state,
      diario: state.diario.some((item) => item.id === registro.id)
        ? state.diario.map((item) => (item.id === registro.id ? registro : item))
        : [registro, ...state.diario],
    };
    persist(next);
    if (!user) return;

    setSyncing(true);
    setSyncError(null);
    const { error } = await (supabase as any).from('gestacao_diario').upsert({
      id: registro.id,
      user_id: user.id,
      data_registro: registro.data,
      humor: registro.humor || null,
      sintomas: registro.sintomas,
      peso: registro.peso,
      observacao: registro.observacao || null,
      atualizado_em: new Date().toISOString(),
    }, { onConflict: 'id' });
    setSyncing(false);
    if (error) setSyncError(error.message);
  }, [persist, state, user]);

  const removeDiario = useCallback(async (id: string) => {
    persist({ ...state, diario: state.diario.filter((item) => item.id !== id) });
    if (!user) return;
    const { error } = await (supabase as any).from('gestacao_diario').delete().eq('id', id).eq('user_id', user.id);
    if (error) setSyncError(error.message);
  }, [persist, state, user]);

  const syncStatus = useMemo(() => {
    if (!user) return 'local' as const;
    if (syncing) return 'syncing' as const;
    if (syncError) return 'error' as const;
    return 'synced' as const;
  }, [syncError, syncing, user]);

  return {
    user,
    perfil: state.perfil,
    eventos: state.eventos,
    diario: state.diario,
    loading,
    syncStatus,
    syncError,
    savePerfil,
    saveEvento,
    removeEvento,
    saveDiario,
    removeDiario,
  };
};

