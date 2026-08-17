import { useCallback, useEffect, useMemo, useState } from 'react';
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

const readLocal = (): VehicleState => {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null');
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
  const [state, setState] = useState<VehicleState>(readLocal);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const persistLocal = useCallback((next: VehicleState) => {
    setState(next);
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(next)); } catch { /* mantém em memória */ }
  }, []);

  const loadRemote = useCallback(async () => {
    if (!user) {
      setState(readLocal());
      setLoading(false);
      setSyncError(null);
      return;
    }

    setLoading(true);
    setSyncError(null);

    const [v, a, m, l] = await Promise.all([
      (supabase as any).from('veiculos_usuario').select('*').eq('user_id', user.id).order('criado_em'),
      (supabase as any).from('veiculo_abastecimentos').select('*').eq('user_id', user.id).order('data_abastecimento', { ascending: false }),
      (supabase as any).from('veiculo_manutencoes').select('*').eq('user_id', user.id).order('data_manutencao', { ascending: false }),
      (supabase as any).from('veiculo_lembretes').select('*').eq('user_id', user.id).order('criado_em', { ascending: false }),
    ]);

    const error = v.error || a.error || m.error || l.error;
    if (error) {
      setSyncError(error.message);
      setLoading(false);
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
    });
    setLoading(false);
  }, [persistLocal, user]);

  useEffect(() => {
    if (authLoading) return;
    void loadRemote();
  }, [authLoading, loadRemote]);

  const saveVehicle = useCallback(async (item: Veiculo) => {
    const next = {
      ...state,
      veiculos: state.veiculos.some((v) => v.id === item.id)
        ? state.veiculos.map((v) => v.id === item.id ? item : v)
        : [...state.veiculos, item],
    };
    persistLocal(next);
    if (!user) return { synced: false as const, reason: 'not_authenticated' as const };

    setSyncing(true);
    setSyncError(null);
    const { error } = await (supabase as any).from('veiculos_usuario').upsert({
      id: item.id, user_id: user.id, apelido: item.apelido || null, marca: item.marca || null,
      modelo: item.modelo, ano: item.ano, placa: item.placa || null, combustivel: item.combustivel || null,
      quilometragem_atual: item.quilometragemAtual, ativo: item.ativo, atualizado_em: new Date().toISOString(),
    }, { onConflict: 'id' });
    setSyncing(false);
    if (error) { setSyncError(error.message); return { synced: false as const, reason: 'remote_error' as const }; }
    return { synced: true as const };
  }, [persistLocal, state, user]);

  const removeVehicle = useCallback(async (id: string) => {
    persistLocal({
      veiculos: state.veiculos.filter((v) => v.id !== id),
      abastecimentos: state.abastecimentos.filter((a) => a.veiculoId !== id),
      manutencoes: state.manutencoes.filter((m) => m.veiculoId !== id),
      lembretes: state.lembretes.filter((l) => l.veiculoId !== id),
    });
    if (!user) return;
    const { error } = await (supabase as any).from('veiculos_usuario').delete().eq('id', id).eq('user_id', user.id);
    if (error) setSyncError(error.message);
  }, [persistLocal, state, user]);

  const saveFuel = useCallback(async (item: Abastecimento) => {
    const next = { ...state, abastecimentos: [item, ...state.abastecimentos.filter((a) => a.id !== item.id)] };
    persistLocal(next);
    if (!user) return;
    setSyncing(true);
    const { error } = await (supabase as any).from('veiculo_abastecimentos').upsert({
      id: item.id, user_id: user.id, veiculo_id: item.veiculoId, data_abastecimento: item.data,
      quilometragem: item.quilometragem, litros: item.litros, valor_total: item.valorTotal,
      combustivel: item.combustivel || null, posto: item.posto || null, tanque_completo: item.tanqueCompleto,
      observacao: item.observacao || null,
    }, { onConflict: 'id' });
    if (!error) {
      const vehicle = state.veiculos.find((v) => v.id === item.veiculoId);
      if (vehicle && item.quilometragem > vehicle.quilometragemAtual) {
        await saveVehicle({ ...vehicle, quilometragemAtual: item.quilometragem });
      }
    } else setSyncError(error.message);
    setSyncing(false);
  }, [persistLocal, saveVehicle, state, user]);

  const removeFuel = useCallback(async (id: string) => {
    persistLocal({ ...state, abastecimentos: state.abastecimentos.filter((a) => a.id !== id) });
    if (user) {
      const { error } = await (supabase as any).from('veiculo_abastecimentos').delete().eq('id', id).eq('user_id', user.id);
      if (error) setSyncError(error.message);
    }
  }, [persistLocal, state, user]);

  const saveMaintenance = useCallback(async (item: Manutencao) => {
    persistLocal({ ...state, manutencoes: [item, ...state.manutencoes.filter((m) => m.id !== item.id)] });
    if (!user) return;
    const { error } = await (supabase as any).from('veiculo_manutencoes').upsert({
      id: item.id, user_id: user.id, veiculo_id: item.veiculoId, data_manutencao: item.data,
      tipo: item.tipo, quilometragem: item.quilometragem, valor: item.valor,
      oficina: item.oficina || null, observacao: item.observacao || null,
    }, { onConflict: 'id' });
    if (error) setSyncError(error.message);
  }, [persistLocal, state, user]);

  const removeMaintenance = useCallback(async (id: string) => {
    persistLocal({ ...state, manutencoes: state.manutencoes.filter((m) => m.id !== id) });
    if (user) {
      const { error } = await (supabase as any).from('veiculo_manutencoes').delete().eq('id', id).eq('user_id', user.id);
      if (error) setSyncError(error.message);
    }
  }, [persistLocal, state, user]);

  const saveReminder = useCallback(async (item: LembreteVeiculo) => {
    persistLocal({ ...state, lembretes: [item, ...state.lembretes.filter((l) => l.id !== item.id)] });
    if (!user) return;
    const { error } = await (supabase as any).from('veiculo_lembretes').upsert({
      id: item.id, user_id: user.id, veiculo_id: item.veiculoId, titulo: item.titulo,
      tipo: item.tipo, data_vencimento: item.dataVencimento, quilometragem_alvo: item.quilometragemAlvo,
      lembrar_dias_antes: item.lembrarDiasAntes, lembrar_hora: item.lembrarHora,
      notificar: item.notificar, concluido: item.concluido, atualizado_em: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) setSyncError(error.message);
  }, [persistLocal, state, user]);

  const removeReminder = useCallback(async (id: string) => {
    persistLocal({ ...state, lembretes: state.lembretes.filter((l) => l.id !== id) });
    if (user) {
      const { error } = await (supabase as any).from('veiculo_lembretes').delete().eq('id', id).eq('user_id', user.id);
      if (error) setSyncError(error.message);
    }
  }, [persistLocal, state, user]);

  const storageLabel = useMemo(() => {
    if (authLoading || loading) return 'Carregando';
    if (!user) return 'Salvo neste aparelho';
    if (syncing) return 'Sincronizando';
    if (syncError) return 'Sincronização pendente';
    return 'Sincronizado na conta';
  }, [authLoading, loading, syncError, syncing, user]);

  return {
    ...state, user, loading: authLoading || loading, syncing, syncError, storageLabel,
    saveVehicle, removeVehicle, saveFuel, removeFuel, saveMaintenance, removeMaintenance,
    saveReminder, removeReminder, reload: loadRemote,
  };
};

