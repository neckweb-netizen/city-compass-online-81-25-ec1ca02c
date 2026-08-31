import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RankingJogador {
  usuario_id: string;
  vitorias: number;
  empates: number;
  derrotas: number;
  partidas_jogadas: number;
  pontuacao: number;
  usuario?: {
    nome: string;
    avatar_url?: string;
  } | null;
}

export const useDominoRanking = (limite: number = 10) => {
  const [ranking, setRanking] = useState<RankingJogador[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);

  const carregarRanking = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .rpc('obter_ranking_domino', { p_limite: limite });

      if (error) throw error;
      if (data) {
        setRanking(data.map((item: any) => ({
          usuario_id: item.usuario_id,
          vitorias: item.vitorias,
          empates: item.empates,
          derrotas: item.derrotas,
          partidas_jogadas: item.partidas_jogadas,
          pontuacao: item.pontuacao,
          usuario: {
            nome: item.nome,
            avatar_url: item.avatar_url,
          },
        })));
      }
    } catch (err) {
      console.error('Erro ao buscar ranking de dominó:', err);
    } finally {
      setCarregando(false);
    }
  }, [limite]);

  useEffect(() => {
    carregarRanking();

    // Inscrição em canal totalmente diferente e com ID único para impedir colisão com o lobby
    const canalRanking = supabase
      .channel('canal-ranking-dedicado-v1')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'domino_estatisticas' },
        () => {
          carregarRanking();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalRanking);
    };
  }, [carregarRanking]);

  return { ranking, carregando, recarregarRanking: carregarRanking };
};
