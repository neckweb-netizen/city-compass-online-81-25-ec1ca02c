import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Sala {
  id: string;
  numero_sala: number;
  status: 'aguardando' | 'jogando' | 'finalizada';
  jogador_1_id: string | null;
  jogador_2_id: string | null;
  jogador_1?: { nome: string } | null;
  jogador_2?: { nome: string } | null;
}

export interface FilaItem {
  id: string;
  usuario_id: string;
  entrou_em: string;
}

export const useDominoLobby = (usuarioId: string | undefined) => {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [fila, setFila] = useState<FilaItem[]>([]);
  const [minhaPosicaoFila, setMinhaPosicaoFila] = useState<number | null>(null);
  const [minhaSala, setMinhaSala] = useState<Sala | null>(null);
  const [carregando, setCarregando] = useState(true);

  const canalRef = useRef<any>(null);
  const ultimaCargaRef = useRef(0);

  // Busca de dados do banco com JOIN de usuários
  const carregarDados = useCallback(async () => {
    if (!usuarioId) return;
    const cargaAtual = ++ultimaCargaRef.current;
    console.log('🔍 [LOBBY-BROADCAST] Buscando dados atualizados das salas...');

    try {
      const { data: dataSalas, error: errorSalas } = await (supabase as any)
        .rpc('obter_lobby_domino');

      if (errorSalas) {
        console.error('❌ [LOBBY-BROADCAST] Erro SQL em domino_salas:', errorSalas);
        throw errorSalas;
      }

      if (dataSalas) {
        if (cargaAtual !== ultimaCargaRef.current) return;
        const novasSalas: Sala[] = dataSalas.map((s: any) => ({
          id: s.id,
          numero_sala: s.numero_sala,
          status: s.status,
          jogador_1_id: s.jogador_1_id,
          jogador_2_id: s.jogador_2_id,
          jogador_1: s.jogador_1_id
            ? { nome: s.jogador_1_nome?.trim() || 'Jogador' }
            : null,
          jogador_2: s.jogador_2_id
            ? { nome: s.jogador_2_nome?.trim() || 'Jogador' }
            : null,
        }));
        setSalas(novasSalas);

        const salaAtiva = novasSalas.find(
          (s) => s.jogador_1_id === usuarioId || s.jogador_2_id === usuarioId
        );
        setMinhaSala(salaAtiva ? { ...salaAtiva } : null);
      }

      const { data: dataFila, error: errorFila } = await supabase
        .from('domino_fila')
        .select('*')
        .order('entrou_em', { ascending: true });

      if (errorFila) throw errorFila;

      if (dataFila) {
        if (cargaAtual !== ultimaCargaRef.current) return;
        setFila([...dataFila]);
        const index = dataFila.findIndex((f) => f.usuario_id === usuarioId);
        setMinhaPosicaoFila(index !== -1 ? index + 1 : null);
      }
    } catch (err: any) {
      console.error('❌ [LOBBY-BROADCAST] Exceção em carregarDados:', err.message || err);
    } finally {
      if (cargaAtual === ultimaCargaRef.current) setCarregando(false);
    }
  }, [usuarioId]);

  const carregarDadosRef = useRef(carregarDados);
  useEffect(() => {
    carregarDadosRef.current = carregarDados;
  }, [carregarDados]);

  // Função para notificar instantaneamente todos os outros clientes via WebSocket
  const notificarOutrosUsuarios = () => {
    if (canalRef.current) {
      console.log('📢 [LOBBY-BROADCAST] Emitindo aviso de alteração de sala...');
      canalRef.current.send({
        type: 'broadcast',
        event: 'MUDANCA_LOBBY',
        payload: { acao: 'MUDANCA_ESTADO', timestamp: Date.now() },
      });
    }
  };

  // Carga inicial
  useEffect(() => {
    if (usuarioId) {
      carregarDados();
    }
  }, [usuarioId, carregarDados]);

  // WEBSOCKET NATIVO BROADCAST (Inspecionado, limpo e imune a erros de binding)
  useEffect(() => {
    if (!usuarioId) return;

    console.log('🔌 [LOBBY-BROADCAST] Conectando no canal Broadcast do Realtime...');

    const canal = supabase.channel('sala-global-domino-lobby', {
      config: {
        broadcast: { self: false },
      },
    });

    canal
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'domino_salas' },
        () => carregarDadosRef.current(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'domino_fila' },
        () => carregarDadosRef.current(),
      )
      .on('broadcast', { event: 'MUDANCA_LOBBY' }, async (payload) => {
        console.log('⚡ [LOBBY-BROADCAST] AVISO RECEBIDO DE OUTRO JOGADOR!', payload);
        await carregarDadosRef.current();
      })
      .subscribe((status) => {
        console.log('📡 [LOBBY-BROADCAST] Status do WebSocket Broadcast:', status);
        if (status === 'SUBSCRIBED') carregarDadosRef.current();
      });

    canalRef.current = canal;

    return () => {
      console.log('🔌 [LOBBY-BROADCAST] Encerrando conexão com o canal Broadcast...');
      supabase.removeChannel(canal);
      canalRef.current = null;
    };
  }, [usuarioId]);

  const limparResiduosUsuario = async () => {
    if (!usuarioId) return;
    try {
      await supabase.from('domino_fila').delete().eq('usuario_id', usuarioId);
      const { data } = await supabase
        .from('domino_salas')
        .select('id, jogador_1_id, jogador_2_id')
        .or(`jogador_1_id.eq.${usuarioId},jogador_2_id.eq.${usuarioId}`);

      if (data && data.length > 0) {
        for (const sala of data) {
          const updates: any = {};
          if (sala.jogador_1_id === usuarioId) updates.jogador_1_id = null;
          if (sala.jogador_2_id === usuarioId) updates.jogador_2_id = null;
          updates.status = 'aguardando';
          updates.vez_usuario_id = null;
          updates.mesa_ponta_esquerda = null;
          updates.mesa_ponta_direita = null;
          updates.passadas_count = 0;
          updates.historico_jogadas = [];
          updates.atualizado_em = new Date().toISOString();

          await supabase.from('domino_salas').update(updates).eq('id', sala.id);
        }
      }
    } catch (err) {
      console.error('❌ [LOBBY-BROADCAST] Erro ao limpar resíduos:', err);
    }
  };

  const entrarNoJogo = async () => {
    if (!usuarioId) return;

    try {
      if (minhaSala || minhaPosicaoFila !== null) return;
      await limparResiduosUsuario();

      const { data: salasLivres, error: errorSalas } = await supabase
        .from('domino_salas')
        .select('*')
        .or('jogador_1_id.is.null,jogador_2_id.is.null')
        .order('numero_sala', { ascending: true })
        .limit(1);

      if (errorSalas) throw errorSalas;

      if (salasLivres && salasLivres.length > 0) {
        const salaAlvo = salasLivres[0];

        if (!salaAlvo.jogador_1_id) {
          const { error: erroEntrada } = await supabase
            .from('domino_salas')
            .update({
              jogador_1_id: usuarioId,
              status: salaAlvo.jogador_2_id ? 'jogando' : 'aguardando',
              vez_usuario_id: salaAlvo.jogador_2_id ? salaAlvo.jogador_2_id : null,
              passadas_count: 0,
              atualizado_em: new Date().toISOString(),
            })
            .eq('id', salaAlvo.id);
          if (erroEntrada) throw erroEntrada;
        } else {
          const { error: erroEntrada } = await supabase
            .from('domino_salas')
            .update({
              jogador_2_id: usuarioId,
              status: 'jogando',
              vez_usuario_id: salaAlvo.jogador_1_id,
              passadas_count: 0,
              atualizado_em: new Date().toISOString(),
            })
            .eq('id', salaAlvo.id);
          if (erroEntrada) throw erroEntrada;
        }
      } else {
        const { error: erroFila } = await supabase
          .from('domino_fila')
          .insert([{ usuario_id: usuarioId }]);
        if (erroFila) throw erroFila;
      }

      await carregarDados();
      notificarOutrosUsuarios();
    } catch (err) {
      console.error('❌ [LOBBY-BROADCAST] Erro em entrarNoJogo:', err);
    }
  };

  const sairDoJogo = async () => {
    if (!usuarioId) return;
    try {
      await limparResiduosUsuario();
      await carregarDados();
      notificarOutrosUsuarios();
    } catch (err) {
      console.error('❌ [LOBBY-BROADCAST] Erro em sairDoJogo:', err);
    }
  };

  return {
    salas,
    fila,
    minhaPosicaoFila,
    minhaSala,
    carregando,
    entrarNoJogo,
    sairDoJogo,
    carregarDados,
  };
};
