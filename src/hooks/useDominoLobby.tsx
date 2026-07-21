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

  // Busca centralizada dos dados no banco
  const carregarDados = useCallback(async () => {
    if (!usuarioId) return;
    console.log('🔍 [LOBBY-BROADCAST] Buscando salas do banco para o usuário:', usuarioId);

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
        console.error('❌ [LOBBY-BROADCAST] Erro no SELECT de domino_salas:', errorSalas);
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
      console.error('❌ [LOBBY-BROADCAST] Exceção em carregarDados:', err.message || err);
    } finally {
      setCarregando(false);
    }
  }, [usuarioId]);

  const carregarDadosRef = useRef(carregarDados);
  useEffect(() => {
    carregarDadosRef.current = carregarDados;
  }, [carregarDados]);

  // Função para avisar a todos os navegadores na rede sobre uma mudança
  const notificarOutrosUsuarios = () => {
    if (canalRef.current) {
      console.log('📢 [LOBBY-BROADCAST] Emitindo aviso via WebSocket para a sala...');
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

  // CANAL DE WEBSOCKET BROADCAST (Sem erro de Postgres Change Bindings!)
  useEffect(() => {
    if (!usuarioId) return;

    console.log('🔌 [LOBBY-BROADCAST] Conectando no canal Broadcast do Realtime...');

    const canal = supabase.channel('sala-global-domino-broadcast', {
      config: {
        broadcast: { self: false }, // Não precisa escutar a própria mensagem
      },
    });

    canal
      .on('broadcast', { event: 'MUDANCA_LOBBY' }, async (payload) => {
        console.log('⚡ [LOBBY-BROADCAST] AVISO DE MUDANÇA RECEBIDO!', payload);
        await carregarDadosRef.current();
      })
      .subscribe((status) => {
        console.log('📡 [LOBBY-BROADCAST] Status da Conexão WebSocket:', status);
      });

    canalRef.current = canal;

    return () => {
      console.log('🔌 [LOBBY-BROADCAST] Fechando canal Broadcast...');
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
      notificarOutrosUsuarios(); // Dispara o sinal via WebSocket para todos
    } catch (err) {
      console.error('❌ [LOBBY-BROADCAST] Erro ao entrar no jogo:', err);
    }
  };

  const sairDoJogo = async () => {
    if (!usuarioId) return;
    try {
      await limparResiduosUsuario();
      await carregarDados();
      notificarOutrosUsuarios(); // Dispara o sinal via WebSocket para todos
    } catch (err) {
      console.error('❌ [LOBBY-BROADCAST] Erro ao sair do jogo:', err);
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
