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

  // Busca central de dados do banco
  const carregarDados = useCallback(async () => {
    if (!usuarioId) return;
    console.log('🔍 [LOBBY-DEBUG] Buscando dados atualizados das salas...');

    try {
      const { data: dataSalas, error: errorSalas } = await supabase
        .from('domino_salas')
        .select(`
          id,
          numero_sala,
          status,
          jogador_1_id,
          jogador_2_id,
          criado_em,
          atualizado_em,
          jogador_1:jogador_1_id ( nome ),
          jogador_2:jogador_2_id ( nome )
        `)
        .order('numero_sala', { ascending: true });

      if (errorSalas) {
        console.error('❌ [LOBBY-DEBUG] Erro SQL ao buscar domino_salas:', errorSalas);
        throw errorSalas;
      }

      if (dataSalas) {
        const novasSalas = dataSalas.map((s: any) => ({ ...s }));
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
        setFila([...dataFila]);
        const index = dataFila.findIndex((f) => f.usuario_id === usuarioId);
        setMinhaPosicaoFila(index !== -1 ? index + 1 : null);
      }
    } catch (err: any) {
      console.error('❌ [LOBBY-DEBUG] Exceção em carregarDados:', err.message || err);
    } finally {
      setCarregando(false);
    }
  }, [usuarioId]);

  const carregarDadosRef = useRef(carregarDados);
  useEffect(() => {
    carregarDadosRef.current = carregarDados;
  }, [carregarDados]);

  // Carga inicial ao montar o componente
  useEffect(() => {
    if (usuarioId) {
      carregarDados();
    }
  }, [usuarioId, carregarDados]);

  // ASSINATURA REALTIME COM IDENTIFICADOR ÚNICO DE CANAL E TRATAMENTO DE RETRY
  useEffect(() => {
    if (!usuarioId) return;

    console.log('🔌 [LOBBY-DEBUG] Criando canal Realtime isolado...');

    const nomeCanalUnico = `domino-lobby-live-${usuarioId.slice(0, 8)}`;
    
    const canalLobby = supabase
      .channel(nomeCanalUnico)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'domino_salas' },
        async (payload: any) => {
          console.log('⚡ [LOBBY-DEBUG] WEBSOCKET DISPAROU (domino_salas):', payload);
          await carregarDadosRef.current();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'domino_fila' },
        async (payload: any) => {
          console.log('⚡ [LOBBY-DEBUG] WEBSOCKET DISPAROU (domino_fila):', payload);
          await carregarDadosRef.current();
        }
      )
      .subscribe((status, err) => {
        console.log('📡 [LOBBY-DEBUG] Status do WebSocket:', status);
        if (err) {
          console.error('❌ [LOBBY-DEBUG] Detalhe do Erro no WebSocket:', err);
        }
      });

    return () => {
      console.log('🔌 [LOBBY-DEBUG] Removendo canal Realtime...');
      supabase.removeChannel(canalLobby);
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
      console.error('❌ [LOBBY-DEBUG] Erro ao limpar resíduos:', err);
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
          await supabase
            .from('domino_salas')
            .update({
              jogador_1_id: usuarioId,
              status: salaAlvo.jogador_2_id ? 'jogando' : 'aguardando',
              vez_usuario_id: salaAlvo.jogador_2_id ? salaAlvo.jogador_2_id : null,
              passadas_count: 0,
              atualizado_em: new Date().toISOString(),
            })
            .eq('id', salaAlvo.id);
        } else {
          await supabase
            .from('domino_salas')
            .update({
              jogador_2_id: usuarioId,
              status: 'jogando',
              vez_usuario_id: salaAlvo.jogador_1_id,
              passadas_count: 0,
              atualizado_em: new Date().toISOString(),
            })
            .eq('id', salaAlvo.id);
        }
      } else {
        await supabase.from('domino_fila').insert([{ usuario_id: usuarioId }]);
      }

      await carregarDados();
    } catch (err) {
      console.error('❌ [LOBBY-DEBUG] Erro em entrarNoJogo:', err);
    }
  };

  const sairDoJogo = async () => {
    if (!usuarioId) return;
    try {
      await limparResiduosUsuario();
      await carregarDados();
    } catch (err) {
      console.error('❌ [LOBBY-DEBUG] Erro em sairDoJogo:', err);
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
