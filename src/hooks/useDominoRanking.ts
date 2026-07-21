import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RankingJogador {
  usuario_id: string;
  vitorias: number;
  derrotas: number;
  partidas_jogadas: number;
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
      const { data, error } = await supabase
        .from('domino_estatisticas')
        .select(`
          usuario_id,
          vitorias,
          derrotas,
          partidas_jogadas,
          usuario:usuario_id ( nome, avatar_url )
        `)
        .order('vitorias', { ascending: false })
        .limit(limite);

      if (error) throw error;
      if (data) {
        setRanking(data as any);
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
