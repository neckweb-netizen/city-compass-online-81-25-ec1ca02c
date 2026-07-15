import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Trophy, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DominoTabuleiroProps {
  usuarioId: string;
  salaId: string;
  numeroSala: number;
  onVoltarAoLobby: () => void;
}

// Componente para renderizar a pedra de dominó clássica (Fundo preto com bolinhas brancas)
const PedraClassica = ({ valor, onClick, disabled }: { valor: string; onClick?: () => void; disabled?: boolean }) => {
  const [ladoA, ladoB] = valor.split('-').map(Number);

  // Função auxiliar para renderizar as bolinhas pretas/brancas nas posições corretas (grid 3x3 para cada metade)
  const renderBolinhas = (pontos: number) => {
    const posicoes: Record<number, number[]> = {
      0: [],
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };

    const ativas = posicoes[pontos] || [];

    return (
      <div className="grid grid-cols-3 gap-1 p-1.5 h-full w-full items-center justify-items-center">
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              ativas.includes(i) ? 'bg-white' : 'bg-transparent'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`w-12 h-24 bg-[#1a1a1a] border-2 border-[#333] rounded-xl flex flex-col items-center justify-between shadow-2xl relative transition-all ${
        disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:-translate-y-2 hover:border-purple-500 cursor-pointer active:scale-95'
      }`}
    >
      {/* Metade Superior */}
      <div className="flex-1 w-full h-[45%] flex items-center justify-center">
        {renderBolinhas(ladoA)}
      </div>

      {/* Linha divisória de metal/plástico clássica */}
      <div className="w-[90%] h-[2px] bg-amber-600/80 rounded-full" />

      {/* Metade Inferior */}
      <div className="flex-1 w-full h-[45%] flex items-center justify-center">
        {renderBolinhas(ladoB)}
      </div>
    </button>
  );
};

export const DominoTabuleiro = ({ usuarioId, salaId, numeroSala, onVoltarAoLobby }: DominoTabuleiroProps) => {
  const [jogador1Id, setJogador1Id] = useState<string | null>(null);
  const [jogador2Id, setJogador2Id] = useState<string | null>(null);
  const [nomeJ1, setNomeJ1] = useState('Jogador 1');
  const [nomeJ2, setNomeJ2] = useState('Jogador 2');
  const [vezUsuarioId, setVezUsuarioId] = useState<string | null>(null);
  
  // Estados do Jogo local sincronizados com o banco
  const [minhasPedras, setMinhasPedras] = useState<string[]>([]);
  const [mesaPedras, setMesaPedras] = useState<string[]>([]);
  const [pontaEsquerda, setPontaEsquerda] = useState<number | null>(null);
  const [pontaDireita, setPontaDireita] = useState<number | null>(null);

  const carregarDadosPartida = async () => {
    try {
      const { data, error } = await supabase
        .from('domino_salas')
        .select(`
          id,
          jogador_1_id,
          jogador_2_id,
          vez_usuario_id,
          mesa_ponta_esquerda,
          mesa_ponta_direita,
          historico_jogadas,
          jogador_1:jogador_1_id ( nome ),
          jogador_2:jogador_2_id ( nome )
        `)
        .eq('id', salaId)
        .single();

      if (error) throw error;

      if (data) {
        setJogador1Id(data.jogador_1_id);
        setJogador2Id(data.jogador_2_id);
        setVezUsuarioId(data.vez_usuario_id);
        setNomeJ1(data.jogador_1 ? (data.jogador_1 as any).nome : 'Jogador 1');
        setNomeJ2(data.jogador_2 ? (data.jogador_2 as any).nome : 'Jogador 2');
        setPontaEsquerda(data.mesa_ponta_esquerda);
        setPontaDireita(data.mesa_ponta_direita);

        // Se o histórico de jogadas vier nulo, começamos um jogo novo
        const jogadas = (data.historico_jogadas as string[]) || [];
        setMesaPedras(jogadas);

        // Define a vez inicial de forma justa caso não esteja definida
        if (!data.vez_usuario_id && data.jogador_1_id) {
          await supabase
            .from('domino_salas')
            .update({ vez_usuario_id: data.jogador_1_id })
            .eq('id', salaId);
          setVezUsuarioId(data.jogador_1_id);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar dados do tabuleiro:', err);
    }
  };

  // Distribuição simples e justa de pedras para o início (7 pedras para cada)
  useEffect(() => {
    carregarDadosPartida();

    // Gera pedras aleatórias para o jogador local ao iniciar
    const pedrasIniciais = [
      '6-6', '6-5', '5-4', '4-4', '3-3', '2-1', '0-4', '5-2', 
      '3-2', '1-1', '0-0', '5-5', '6-4', '6-1', '3-1'
    ];
    // Embaralha e pega 7
    const minhasPróprias = pedrasIniciais.sort(() => 0.5 - Math.random()).slice(0, 7);
    setMinhasPedras(minhasPróprias);

    // Ouvinte em tempo real para sincronizar as jogadas do outro jogador instantaneamente
    const canalJogo = supabase
      .channel(`jogo-realtime-${salaId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'domino_salas', filter: `id=eq.${salaId}` },
        (payload) => {
          const newData = payload.new;
          if (newData) {
            setVezUsuarioId(newData.vez_usuario_id);
            setPontaEsquerda(newData.mesa_ponta_esquerda);
            setPontaDireita(newData.mesa_ponta_direita);
            setMesaPedras((newData.historico_jogadas as string[]) || []);

            // Se o adversário saiu do jogo
            if (newData.jogador_1_id === null || newData.jogador_2_id === null) {
              alert('Partida encerrada: O adversário saiu da sala.');
              onVoltarAoLobby();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalJogo);
    };
  }, [salaId]);

  const meuTurno = vezUsuarioId === usuarioId;
  const adversarioNome = usuarioId === jogador1Id ? nomeJ2 : nomeJ1;

  // Função clássica: Verifica se a pedra pode ser jogada nas pontas da mesa
  const tentarJogarPedra = async (pedra: string) => {
    if (!meuTurno) return;

    const [ladoA, ladoB] = pedra.split('-').map(Number);
    let novaMesa = [...mesaPedras];
    let novaPontaE = pontaEsquerda;
    let novaPontaD = pontaDireita;

    // Se a mesa estiver vazia, qualquer pedra entra e define ambas as pontas
    if (mesaPedras.length === 0) {
      novaMesa.push(pedra);
      novaPontaE = ladoA;
      novaPontaD = ladoB;
    } else {
      // Regra de encaixe do dominó brasileiro
      if (ladoA === pontaEsquerda) {
        novaMesa.unshift(`${ladoB}-${ladoA}`); // Rotaciona a pedra para encaixar visualmente
        novaPontaE = ladoB;
      } else if (ladoB === pontaEsquerda) {
        novaMesa.unshift(pedra);
        novaPontaE = ladoA;
      } else if (ladoA === pontaDireita) {
        novaMesa.push(pedra);
        novaPontaD = ladoB;
      } else if (ladoB === pontaDireita) {
        novaMesa.push(`${ladoB}-${ladoA}`);
        novaPontaD = ladoA;
      } else {
        alert('Essa pedra não encaixa em nenhuma das pontas!');
        return;
      }
    }

    // Passa o turno para o adversário
    const proximoTurnoId = usuarioId === jogador1Id ? jogador2Id : jogador1Id;

    try {
      const { error } = await supabase
        .from('domino_salas')
        .update({
          historico_jogadas: novaMesa as any,
          mesa_ponta_esquerda: novaPontaE,
          mesa_ponta_direita: novaPontaD,
          vez_usuario_id: proximoTurnoId,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', salaId);

      if (error) throw error;

      // Remove a pedra jogada da mão do usuário local
      setMinhasPedras(prev => prev.filter(p => p !== pedra));
    } catch (err) {
      console.error('Erro ao processar jogada:', err);
    }
  };

  // Função para passar a vez caso o jogador não tenha nenhuma pedra compatível (o famoso "passo")
  const passarVez = async () => {
    if (!meuTurno) return;

    const proximoTurnoId = usuarioId === jogador1Id ? jogador2Id : jogador1Id;

    try {
      await supabase
        .from('domino_salas')
        .update({
          vez_usuario_id: proximoTurnoId,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', salaId);
    } catch (err) {
      console.error('Erro ao passar a vez:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 flex flex-col h-[92vh] justify-between text-white font-sans">
      
      {/* Topo informativo */}
      <div className="flex items-center justify-between bg-[#110D1A] border border-purple-950/40 p-3 rounded-xl shadow-lg">
        <Button variant="ghost" size="sm" onClick={onVoltarAoLobby} className="text-gray-400 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar ao Lobby
        </Button>
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500 animate-pulse" />
          <span className="text-xs font-bold text-purple-300">Sala {numeroSala}</span>
        </div>
      </div>

      {/* Adversário */}
      <div className="text-center bg-[#150F22]/60 border border-purple-900/20 p-3 rounded-xl max-w-xs mx-auto w-full">
        <span className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider block">Adversário</span>
        <h4 className="font-bold text-sm text-white flex items-center justify-center gap-1.5">
          <User className="w-4 h-4 text-purple-500" /> {adversarioNome || 'Aguardando...'}
        </h4>
      </div>

      {/* Mesa Central do Jogo (Feltro Verde Clássico de Bar) */}
      <div className="flex-grow my-4 bg-emerald-950 border-[6px] border-amber-950 rounded-[35px] shadow-[inset_0_4px_20px_rgba(0,0,0,0.6)] relative flex flex-col items-center justify-center min-h-[320px] p-4">
        
        {/* Marcadores de Pontas da Mesa */}
        {mesaPedras.length > 0 && (
          <div className="absolute top-4 left-6 flex items-center gap-4 text-xs font-semibold text-emerald-300/60">
            <span>Ponta Esquerda: <strong className="text-white text-sm bg-emerald-900/60 px-2 py-0.5 rounded">{pontaEsquerda}</strong></span>
            <span>Ponta Direita: <strong className="text-white text-sm bg-emerald-900/60 px-2 py-0.5 rounded">{pontaDireita}</strong></span>
          </div>
        )}

        {/* Linha das pedras clássicas na mesa */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-full overflow-x-auto p-4">
          {mesaPedras.length === 0 ? (
            <div className="text-center text-emerald-300/30 font-bold uppercase tracking-widest text-sm py-12">
              Mesa de Dominó Limpa<br />
              <span className="text-xs font-normal">Aguardando a primeira pedra ser jogada...</span>
            </div>
          ) : (
            mesaPedras.map((pedra, idx) => (
              <div key={idx} className="rotate-90 origin-center my-4 shrink-0 scale-90">
                <PedraClassica valor={pedra} disabled={true} />
              </div>
            ))
          )}
        </div>

        {/* Status Dinâmico de Turnos */}
        <div className="absolute bottom-4 bg-[#090610]/90 border border-purple-900/40 px-5 py-2 rounded-full text-xs font-bold tracking-wide">
          {meuTurno ? (
            <span className="text-green-400 animate-pulse flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> É SUA VEZ DE JOGAR!
            </span>
          ) : (
            <span className="text-gray-400">Aguardando a jogada de {adversarioNome}...</span>
          )}
        </div>
      </div>

      {/* Minha Mão de Pedras de Dominó */}
      <div className="bg-[#110D1A] border border-purple-950/40 p-4 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-purple-300 font-black uppercase tracking-wider">Suas Pedras ({minhasPedras.length})</span>
          {meuTurno && (
            <Button 
              onClick={passarVez} 
              variant="outline" 
              size="sm" 
              className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10 font-bold h-8 text-xs"
            >
              Não tenho pedra (Passar Vez)
            </Button>
          )}
        </div>

        {/* Mão de pedras alinhadas */}
        <div className="flex flex-wrap justify-center gap-3">
          {minhasPedras.map((pedra, idx) => (
            <PedraClassica 
              key={idx} 
              valor={pedra} 
              onClick={() => tentarJogarPedra(pedra)}
              disabled={!meuTurno}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
