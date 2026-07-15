
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, RefreshCw, MessageSquare, Trophy, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DominoTabuleiroProps {
  usuarioId: string;
  salaId: string;
  numeroSala: number;
  onVoltarAoLobby: () => void;
}

export const DominoTabuleiro = ({ usuarioId, salaId, numeroSala, onVoltarAoLobby }: DominoTabuleiroProps) => {
  const [adversario, setAdversario] = useState<{ nome: string } | null>(null);
  const [minhasPedras, setMinhasPedras] = useState<string[]>([
    '6-6', '6-5', '5-4', '3-3', '2-1', '0-4', '5-2' // Pedras de exemplo iniciais
  ]);
  const [mesaPedras, setMesaPedras] = useState<string[]>(['4-4', '4-2', '2-5']); // Pedras que já estão na mesa
  const [meuTurno, setMeuTurno] = useState(true);

  useEffect(() => {
    // Busca informações da sala para descobrir quem é o adversário
    const carregarAdversario = async () => {
      try {
        const { data, error } = await supabase
          .from('domino_salas')
          .select(`
            jogador_1_id,
            jogador_2_id,
            jogador_1:jogador_1_id ( nome ),
            jogador_2:jogador_2_id ( nome )
          `)
          .eq('id', salaId)
          .single();

        if (error) throw error;

        if (data) {
          if (data.jogador_1_id === usuarioId && data.jogador_2) {
            setAdversario(data.jogador_2 as any);
          } else if (data.jogador_2_id === usuarioId && data.jogador_1) {
            setAdversario(data.jogador_1 as any);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar adversário no tabuleiro:', err);
      }
    };

    carregarAdversario();

    // Ouvir alterações em tempo real na partida (ex: se o outro desistir ou jogar)
    const canalJogo = supabase
      .channel(`jogo-sala-${salaId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'domino_salas' },
        (payload) => {
          // Se um dos jogadores sair e a sala voltar a ficar aguardando, avisa e volta ao lobby
          if (payload.new && (payload.new.jogador_1_id === null || payload.new.jogador_2_id === null)) {
            alert('O outro jogador saiu da partida.');
            onVoltarAoLobby();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalJogo);
    };
  }, [salaId, usuarioId]);

  const jogarPedra = (pedra: string) => {
    if (!meuTurno) return;
    
    // Move da mão para a mesa de simulação
    setMinhasPedras(prev => prev.filter(p => p !== pedra));
    setMesaPedras(prev => [...prev, pedra]);
    setMeuTurno(false); // Passa a vez ficticiamente
    
    // Simula o bot/outro jogador jogando em 2 segundos para teste
    setTimeout(() => {
      setMeuTurno(true);
    }, 2000);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 flex flex-col h-[90vh] justify-between">
      
      {/* 1. Barra de Topo */}
      <div className="flex items-center justify-between bg-[#110D1A] border border-purple-950/40 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onVoltarAoLobby} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Sair
          </Button>
          <span className="text-xs text-purple-400 font-bold bg-purple-950/40 px-2.5 py-1 rounded-full">
            Mesa {numeroSala}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm font-semibold">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span>Partida Ativa</span>
        </div>
      </div>

      {/* 2. Área do Adversário (Topo) */}
      <div className="text-center bg-[#150F22]/40 border border-purple-900/10 p-3 rounded-2xl max-w-sm mx-auto w-full">
        <p className="text-xs text-gray-400">Adversário</p>
        <h4 className="font-bold text-sm text-white">{adversario?.nome || 'Conectando...'}</h4>
        <div className="flex gap-1 justify-center mt-1.5">
          {/* Mostra o verso das pedras do adversário de forma simulada */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-5 h-8 bg-purple-900/60 border border-purple-700/50 rounded-md shadow-md" />
          ))}
        </div>
      </div>

      {/* 3. Feltro Verde de Jogo (Mesa Central) */}
      <div className="flex-grow my-4 bg-emerald-950 border-4 border-amber-900 rounded-[40px] shadow-inner relative flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
        <div className="absolute top-4 left-4 flex items-center gap-1.5 text-emerald-300/40 text-xs font-bold uppercase tracking-wider">
          <Trophy className="w-4 h-4" /> Dominó SAJ
        </div>

        {/* Linha de pedras jogadas na mesa */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 p-6 max-w-xl">
          {mesaPedras.map((pedra, idx) => {
            const [ladoA, ladoB] = pedra.split('-');
            return (
              <div 
                key={idx} 
                className="w-8 h-14 bg-white text-gray-900 border-2 border-gray-300 rounded-lg shadow-lg flex flex-col divide-y-2 divide-gray-800 shrink-0 select-none relative origin-center"
              >
                <div className="flex-1 flex items-center justify-center font-bold text-lg">{ladoA}</div>
                <div className="flex-1 flex items-center justify-center font-bold text-lg">{ladoB}</div>
              </div>
            );
          })}
        </div>

        {/* Turno Banner */}
        <div className="absolute bottom-4 bg-[#090610]/80 border border-purple-900/30 px-4 py-1.5 rounded-full text-xs font-semibold">
          {meuTurno ? (
            <span className="text-green-400 animate-pulse flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sua vez de jogar!
            </span>
          ) : (
            <span className="text-gray-400">Aguardando jogada de {adversario?.nome || 'Adversário'}...</span>
          )}
        </div>
      </div>

      {/* 4. Minhas Pedras / Minha Mão (Rodapé) */}
      <div className="bg-[#110D1A] border border-purple-950/40 p-4 rounded-3xl space-y-3">
        <p className="text-center text-xs text-purple-300 font-bold uppercase tracking-widest">Sua Mão</p>
        
        <div className="flex flex-wrap justify-center gap-2">
          {minhasPedras.map((pedra, idx) => {
            const [ladoA, ladoB] = pedra.split('-');
            return (
              <button
                key={idx}
                disabled={!meuTurno}
                onClick={() => jogarPedra(pedra)}
                className={`w-10 h-16 bg-white text-gray-900 border-2 border-gray-300 rounded-xl shadow-md flex flex-col divide-y-2 divide-gray-800 transition-all ${
                  meuTurno 
                    ? 'hover:-translate-y-2.5 hover:shadow-xl hover:border-purple-500 cursor-pointer active:scale-95' 
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex-1 flex items-center justify-center font-bold text-xl">{ladoA}</div>
                <div className="flex-1 flex items-center justify-center font-bold text-xl">{ladoB}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
