import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Sala {
  id: string;
  numero_sala: number;
  status: 'aguardando' | 'jogando' | 'finalizada';
  jogador_1_id: string | null;
  jogador_2_id: string | null;
  jogador_1?: { nome: string; imagem_capa_url: string | null } | null;
  jogador_2?: { nome: string; imagem_capa_url: string | null } | null;
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

  // Busca o estado inicial das salas e da fila
  const carregarDados = async () => {
    try {
      // MODIFICADO: Busca as salas trazendo os perfis da tabela pública 'usuarios'
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
          jogador_1:jogador_1_id (
            nome,
            imagem_capa_url
          ),
          jogador_2:jogador_2_id (
            nome,
            imagem_capa_url
          )
        `)
        .order('numero_sala', { ascending: true });

      if (errorSalas) throw errorSalas;
      if (dataSalas) {
        setSalas(dataSalas as any);
        
        // Verifica se eu estou jogando em alguma sala ativa
        const salaAtiva = (dataSalas as any[]).find(
          (s) => s.jogador_1_id === usuarioId || s.jogador_2_id === usuarioId
        );
        setMinhaSala(salaAtiva || null);
      }

      // Busca a fila de espera
      const { data: dataFila, error: errorFila } = await supabase
        .from('domino_fila')
        .select('*')
        .order('entrou_em', { ascending: true });

      if (errorFila) throw errorFila;
      if (dataFila) {
        setFila(dataFila);

        // Calcula minha posição atual na fila
        const index = dataFila.findIndex((f) => f.usuario_id === usuarioId);
        setMinhaPosicaoFila(index !== -1 ? index + 1 : null);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados do lobby:', err.message || err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (!usuarioId) return;

    carregarDados();

    // Inscrição em Tempo Real (Realtime) para alterações nas salas e fila
    const canalRealtime = supabase
      .channel('realtime-domino')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'domino_salas' },
        () => {
          carregarDados();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'domino_fila' },
        () => {
          carregarDados();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalRealtime);
    };
  }, [usuarioId]);

  // Função para entrar no jogo (Tenta sala livre ou vai para a fila)
  const entrarNoJogo = async () => {
    if (!usuarioId) return;

    try {
      // 1. Verifica se já está em alguma sala ou fila para evitar duplicados
      if (minhaSala || minhaPosicaoFila !== null) return;

      // 2. Procura uma sala que tenha pelo menos uma vaga vazia
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
          // Preenche vaga 1
          await supabase
            .from('domino_salas')
            .update({
              jogador_1_id: usuarioId,
              status: salaAlvo.jogador_2_id ? 'jogando' : 'aguardando',
              atualizado_em: new Date().toISOString(),
            })
            .eq('id', salaAlvo.id);
        } else {
          // Preenche vaga 2
          await supabase
            .from('domino_salas')
            .update({
              jogador_2_id: usuarioId,
              status: 'jogando',
              atualizado_em: new Date().toISOString(),
            })
            .eq('id', salaAlvo.id);
        }
      } else {
        // 3. Se todas as 4 salas estiverem lotadas, vai para a fila de espera
        await supabase
          .from('domino_fila')
          .insert([{ usuario_id: usuarioId }]);
      }

      await carregarDados();
    } catch (err) {
      console.error('Erro ao tentar entrar no jogo:', err);
    }
  };

  // Função para sair do jogo (Desistir da fila ou sair da sala atual)
  const sairDoJogo = async () => {
    if (!usuarioId) return;

    try {
      // Se estiver na fila de espera, apenas remove dela
      if (minhaPosicaoFila !== null) {
        await supabase
          .from('domino_fila')
          .delete()
          .eq('usuario_id', usuarioId);
      }

      // Se estiver em uma sala de jogo ativa, remove o ID e redefine a sala
      if (minhaSala) {
        const atualizacoes: any = {};
        if (minhaSala.jogador_1_id === usuarioId) {
          atualizacoes.jogador_1_id = null;
        } else if (minhaSala.jogador_2_id === usuarioId) {
          atualizacoes.jogador_2_id = null;
        }
        
        atualizacoes.status = 'aguardando';
        atualizacoes.atualizado_em = new Date().toISOString();

        await supabase
          .from('domino_salas')
          .update(atualizacoes)
          .eq('id', minhaSala.id);
      }

      await carregarDados();
    } catch (err) {
      console.error('Erro ao sair do jogo:', err);
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
  };
};
