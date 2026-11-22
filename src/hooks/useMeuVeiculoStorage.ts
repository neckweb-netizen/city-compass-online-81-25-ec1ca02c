import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type Veiculo = {
  id: string;
  apelido: string;
  marca: string;
  modelo: string;
  ano: number | null;
  placa: string;
  combustivel: string;
  quilometragemAtual: number;
  ativo: boolean;
};

export type Abastecimento = {
  id: string;
  veiculoId: string;
  data: string;
  quilometragem: number;
  litros: number;
  valorTotal: number;
  combustivel: string;
  posto: string;
  tanqueCompleto: boolean;
  observacao: string;
};

export type Manutencao = {
  id: string;
  veiculoId: string;
  data: string;
  tipo: string;
  quilometragem: number | null;
  valor: number;
  oficina: string;
  observacao: string;
};

export type LembreteVeiculo = {
  id: string;
  veiculoId: string;
  titulo: string;
  tipo: 'documento' | 'manutencao' | 'seguro' | 'outro';
  dataVencimento: string | null;
  quilometragemAlvo: number | null;
  lembrarDiasAntes: number;
  lembrarHora: string;
  notificar: boolean;
  concluido: boolean;
};

type VehicleState = {
  veiculos: Veiculo[];
  abastecimentos: Abastecimento[];
  manutencoes: Manutencao[];
  lembretes: LembreteVeiculo[];
};

const LOCAL_KEY = 'sajtem:meu-veiculo:v1';
const EMPTY_STATE: VehicleState = { veiculos: [], abastecimentos: [], manutencoes: [], lembretes: [] };

const userStorageKey = (id: string) => `${LOCAL_KEY}:user:${id}`;
const readLocal = (key = LOCAL_KEY): VehicleState => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    if (!parsed) return EMPTY_STATE;
    return {
      veiculos: Array.isArray(parsed.veiculos) ? parsed.veiculos : [],
      abastecimentos: Array.isArray(parsed.abastecimentos) ? parsed.abastecimentos : [],
      manutencoes: Array.isArray(parsed.manutencoes) ? parsed.manutencoes : [],
      lembretes: Array.isArray(parsed.lembretes) ? parsed.lembretes : [],
    };
  } catch {
    return EMPTY_STATE;
  }
};

export const useMeuVeiculoStorage = () => {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<VehicleState>(EMPTY_STATE);
  const [stateAccountId, setStateAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const accountIdRef = useRef(user?.id ?? null);
  accountIdRef.current = user?.id ?? null;
  const requestSequenceRef = useRef(0);
  const mutationInProgressRef = useRef(false);

  const persistLocal = useCallback((next: VehicleState, accountId: string | null) => {
    if (accountIdRef.current !== accountId) return;
    setState(next);
    setStateAccountId(accountId);
    try { localStorage.setItem(accountId ? userStorageKey(accountId) : LOCAL_KEY, JSON.stringify(next)); }
    catch { /* Mantém em memória; não expõe dados de outras contas. */ }
  }, []);

  const loadRemote = useCallback(async () => {
    const sequence = ++requestSequenceRef.current;
    const accountId = user?.id ?? null;
    setLoading(true);
    setSyncError(null);
    // Limpa imediatamente qualquer informação da conta anterior.
    setStateAccountId(accountId);
    setState(accountId ? readLocal(userStorageKey(accountId)) : readLocal());
    if (!accountId) {
      setLoading(false);
      return;
    }

    try {
      const [v, a, m, l] = await Promise.all([
        (supabase as any).from('veiculos_usuario').select('*').eq('user_id', accountId).order('criado_em'),
        (supabase as any).from('veiculo_abastecimentos').select('*').eq('user_id', accountId).order('data_abastecimento', { ascending: false }),
        (supabase as any).from('veiculo_manutencoes').select('*').eq('user_id', accountId).order('data_manutencao', { ascending: false }),
        (supabase as any).from('veiculo_lembretes').select('*').eq('user_id', accountId).order('criado_em', { ascending: false }),
      ]);
      if (sequence !== requestSequenceRef.current || accountIdRef.current !== accountId) return;
      const error = v.error || a.error || m.error || l.error;
      if (error) {
        setSyncError(error.message);
        return;
      }

      persistLocal({
        veiculos: (v.data || []).map((r: any) => ({
          id: r.id, apelido: r.apelido || '', marca: r.marca || '', modelo: r.modelo || '',
          ano: r.ano == null ? null : Number(r.ano), placa: r.placa || '', combustivel: r.combustivel || '',
          quilometragemAtual: Number(r.quilometragem_atual || 0), ativo: Boolean(r.ativo),
        })),
        abastecimentos: (a.data || []).map((r: any) => ({
          id: r.id, veiculoId: r.veiculo_id, data: r.data_abastecimento,
          quilometragem: Number(r.quilometragem || 0), litros: Number(r.litros || 0),
          valorTotal: Number(r.valor_total || 0), combustivel: r.combustivel || '',
          posto: r.posto || '', tanqueCompleto: Boolean(r.tanque_completo), observacao: r.observacao || '',
        })),
        manutencoes: (m.data || []).map((r: any) => ({
          id: r.id, veiculoId: r.veiculo_id, data: r.data_manutencao, tipo: r.tipo,
          quilometragem: r.quilometragem == null ? null : Number(r.quilometragem),
          valor: Number(r.valor || 0), oficina: r.oficina || '', observacao: r.observacao || '',
        })),
        lembretes: (l.data || []).map((r: any) => ({
          id: r.id, veiculoId: r.veiculo_id, titulo: r.titulo, tipo: r.tipo,
          dataVencimento: r.data_vencimento, quilometragemAlvo: r.quilometragem_alvo == null ? null : Number(r.quilometragem_alvo),
          lembrarDiasAntes: Number(r.lembrar_dias_antes ?? 1),
          lembrarHora: r.lembrar_hora ? String(r.lembrar_hora).slice(0, 5) : '09:00',
          notificar: Boolean(r.notificar), concluido: Boolean(r.concluido),
        })),
      }, accountId);
    } catch (cause) {
      if (sequence === requestSequenceRef.current && accountIdRef.current === accountId)
        setSyncError(cause instanceof Error ? cause.message : 'Falha ao consultar seus veículos.');
    } finally {
      if (sequence === requestSequenceRef.current && accountIdRef.current === accountId)
        setLoading(false);
    }
  }, [persistLocal, user?.id]);

  useEffect(() => {
    if (authLoading) {
      requestSequenceRef.current += 1;
      setState(EMPTY_STATE);
      setStateAccountId(null);
      return;
    }
    void loadRemote();
    return () => { requestSequenceRef.current += 1; };
  }, [authLoading, loadRemote]);

  const blocked = () => ({ synced: false as const, reason: 'remote_error' as const,
    error: { message: 'Outra operação ou carregamento está em andamento. Tente novamente.' } });

  const mutate = useCallback(async (
    next: VehicleState,
    operation: (accountId: string) => Promise<{ error: { message: string } | null }>,
  ) => {
    if (authLoading || loading || mutationInProgressRef.current || stateAccountId !== (user?.id ?? null)) return blocked();
    const accountId = user?.id ?? null;
    if (!accountId) {
      persistLocal(next, null);
      return { synced: false as const, reason: 'not_authenticated' as const };
    }

    mutationInProgressRef.current = true;
    setSyncing(true);
    setSyncError(null);
    try {
      const { error } = await operation(accountId);
      if (error) {
        if (accountIdRef.current === accountId) setSyncError(error.message);
        return { synced: false as const, reason: 'remote_error' as const, error };
      }
      if (accountIdRef.current !== accountId)
        return { synced: false as const, reason: 'remote_error' as const,
          error: { message: 'A conta mudou durante a operação. Atualize seus dados.' } };
      // Não declarar sucesso nem atualizar cache antes de confirmar a gravação.
      persistLocal(next, accountId);
      return { synced: true as const };
    } catch (cause) {
      const error = { message: cause instanceof Error ? cause.message : 'Falha ao sincronizar o veículo.' };
      if (accountIdRef.current === accountId) setSyncError(error.message);
      return { synced: false as const, reason: 'remote_error' as const, error };
    } finally {
      mutationInProgressRef.current = false;
      if (accountIdRef.current === accountId) setSyncing(false);
    }
  }, [authLoading, loading, persistLocal, stateAccountId, user?.id]);

  const saveVehicle = useCallback(async (item: Veiculo) => {
    const next = { ...state, veiculos: state.veiculos.some(v => v.id === item.id)
      ? state.veiculos.map(v => v.id === item.id ? item : v) : [...state.veiculos, item] };
    return mutate(next, accountId =>
      (supabase as any).from('veiculos_usuario').upsert({
        id: item.id, user_id: accountId, apelido: item.apelido || null, marca: item.marca || null,
        modelo: item.modelo, ano: item.ano, placa: item.placa || null, combustivel: item.combustivel || null,
        quilometragem_atual: item.quilometragemAtual, ativo: item.ativo, atualizado_em: new Date().toISOString(),
      }, { onConflict: 'id' }));
  }, [mutate, state]);

  const removeVehicle = useCallback(async (id: string) => {
    const next = {
      veiculos: state.veiculos.filter(v => v.id !== id),
      abastecimentos: state.abastecimentos.filter(a => a.veiculoId !== id),
      manutencoes: state.manutencoes.filter(m => m.veiculoId !== id),
      lembretes: state.lembretes.filter(l => l.veiculoId !== id),
    };
    return mutate(next, accountId =>
      (supabase as any).from('veiculos_usuario').delete().eq('id', id).eq('user_id', accountId));
  }, [mutate, state]);

  const saveFuel = useCallback(async (item: Abastecimento) => {
    const vehicle = state.veiculos.find(v => v.id === item.veiculoId);
    const updateKm = Boolean(vehicle && item.quilometragem > vehicle.quilometragemAtual);
    const next = { ...state,
      abastecimentos: [item, ...state.abastecimentos.filter(a => a.id !== item.id)],
      veiculos: state.veiculos.map(v => v.id === item.veiculoId && updateKm
        ? { ...v, quilometragemAtual: item.quilometragem } : v),
    };
    return mutate(next, async () => {
      const { error } = await supabase.rpc('save_vehicle_fuel_atomic' as any, {
        p_fuel: item,
      });
      return { error };
    });
  }, [mutate, state]);

  const removeFuel = useCallback(async (id: string) =>
    mutate({ ...state, abastecimentos: state.abastecimentos.filter(a => a.id !== id) }, accountId =>
      (supabase as any).from('veiculo_abastecimentos').delete().eq('id', id).eq('user_id', accountId)),
  [mutate, state]);

  const saveMaintenance = useCallback(async (item: Manutencao) =>
    mutate({ ...state, manutencoes: [item, ...state.manutencoes.filter(m => m.id !== item.id)] }, accountId =>
      (supabase as any).from('veiculo_manutencoes').upsert({
        id: item.id, user_id: accountId, veiculo_id: item.veiculoId,
        data_manutencao: item.data, tipo: item.tipo, quilometragem: item.quilometragem,
        valor: item.valor, oficina: item.oficina || null, observacao: item.observacao || null,
      }, { onConflict: 'id' })),
  [mutate, state]);

  const removeMaintenance = useCallback(async (id: string) =>
    mutate({ ...state, manutencoes: state.manutencoes.filter(m => m.id !== id) }, accountId =>
      (supabase as any).from('veiculo_manutencoes').delete().eq('id', id).eq('user_id', accountId)),
  [mutate, state]);

  const saveReminder = useCallback(async (item: LembreteVeiculo) =>
    mutate({ ...state, lembretes: [item, ...state.lembretes.filter(l => l.id !== item.id)] }, accountId =>
      (supabase as any).from('veiculo_lembretes').upsert({
        id: item.id, user_id: accountId, veiculo_id: item.veiculoId, titulo: item.titulo,
        tipo: item.tipo, data_vencimento: item.dataVencimento, quilometragem_alvo: item.quilometragemAlvo,
        lembrar_dias_antes: item.lembrarDiasAntes, lembrar_hora: item.lembrarHora,
        notificar: item.notificar, concluido: item.concluido,
        atualizado_em: new Date().toISOString(),
      }, { onConflict: 'id' })),
  [mutate, state]);

  const removeReminder = useCallback(async (id: string) =>
    mutate({ ...state, lembretes: state.lembretes.filter(l => l.id !== id) }, accountId =>
      (supabase as any).from('veiculo_lembretes').delete().eq('id', id).eq('user_id', accountId)),
  [mutate, state]);

  const storageLabel = useMemo(() => {
    if (authLoading || loading) return 'Carregando';
    if (!user) return 'Salvo neste aparelho';
    if (syncing) return 'Sincronizando';
    if (syncError) return 'Sincronização pendente';
    return 'Sincronizado na conta';
  }, [authLoading, loading, syncError, syncing, user]);

  const visibleState = stateAccountId === (user?.id ?? null) ? state : EMPTY_STATE;

  return {
    ...visibleState, user, loading: authLoading || loading || stateAccountId !== (user?.id ?? null), syncing, syncError, storageLabel,
    saveVehicle, removeVehicle, saveFuel, removeFuel, saveMaintenance, removeMaintenance,
    saveReminder, removeReminder, reload: loadRemote,
  };
};

