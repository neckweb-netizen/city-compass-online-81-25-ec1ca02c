import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Trophy, User, Maximize2, Minimize2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DominoTabuleiroProps {
  usuarioId: string;
  salaId: string;
  numeroSala: number;
  onVoltarAoLobby: () => void;
}

// Componente para renderizar a pedra de dominó clássica (Fundo preto com bolinhas brancas)
const PedraClassica = ({ valor, onClick, disabled, menor = false }: { valor: string; onClick?: () => void; disabled?: boolean; menor?: boolean }) => {
  const [ladoA, ladoB] = valor.split('-').map(Number);
  const isBucha = ladoA === ladoB;

  // Função para renderizar as bolinhas pretas/brancas nas posições corretas (grid 3x3)
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
    const tamanhoBolinha = menor ? 'w-1 h-1' : 'w-1.5 h-1.5';
    const espacamentoGrid = menor ? 'gap-0.5 p-1' : 'gap-1 p-1.5';

    return (
      <div className={`grid grid-cols-3 ${espacamentoGrid} h-full w-full items-center justify-items-center`}>
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className={`${tamanhoBolinha} rounded-full transition-all ${
              ativas.includes(i) ? 'bg-white' : 'bg-transparent'
            }`}
          />
        ))}
      </div>
    );
  };

  // Tamanhos otimizados para Mobile de acordo com o parâmetro 'menor'
  const classesTamanho = menor 
    ? "w-8 h-16 border-2" 
    : "w-10 h-20 border-2";

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`${classesTamanho} bg-[#1a1a1a] border-[#333] rounded-lg flex flex-col items-center justify-between shadow-lg relative transition-all ${
        disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:-translate-y-1 hover:border-purple-500 cursor-pointer active:scale-95'
      }`}
    >
      {/* Metade Superior */}
      <div className="flex-1 w-full h-[45%] flex items-center justify-center">
        {renderBolinhas(ladoA)}
      </div>

      {/* Linha divisória de metal/plástico clássica */}
      <div className="w-[90%] h-[1.5px] bg-amber-600/80 rounded-full" />

      {/* Metade Inferior */}
      <div className="flex-1 w-full h-[45%] flex items-center justify-center">
        {renderBolinhas(ladoB)}
      </div>
    </button>
  );
};

export const DominoTabuleiro = ({ usuarioId, salaId, numeroSala, onVoltarAoLobby }: DominoTabuleiroProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [jogador1Id, setJogador1Id] = useState<string | null>(null);
  const [jogador2Id, setJogador2Id] = useState<string | null>(null);
  const [nomeJ1, setNomeJ1] = useState('Jogador 1');
  const [nomeJ2, setNomeJ2] = useState('Jogador 2');
  const [vezUsuarioId, setVezUsuarioId] = useState<string | null>(null);
  
  const [minhasPedras, setMinhasPedras] = useState<string[]>([]);
  const [mesaPedras, setMesaPedras] = useState<string[]>([]);
  const [pontaEsquerda, setPontaEsquerda] = useState<number | null>(null);
  const [pontaDireita, setPontaDireita] = useState<number | null>(null);

  // Lógica para forçar tela cheia e tentar rotacionar a tela para deitado (Landscape)
  const entrarModoJogoReal = async () => {
    try {
      if (containerRef.current) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);

        // Tenta rotacionar o celular para landscape (deitado)
        if (screen.orientation && (screen.orientation as any).lock) {
          await (screen.orientation as any).lock('landscape').catch((e: any) => {
            console.log("Rotação automática bloqueada pelo navegador. Ative a auto-rotação do celular.");
          });
        }
      }
    } catch (err) {
      console.warn("Navegador não suporta rotação automática completa:", err);
    }
  };

  const sairModoJogoReal = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setIsFullscreen(false);
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  };

  // Ativa o modo deitado automaticamente quando a tela monta
  useEffect(() => {
    entrarModoJogoReal();
    return () => {
      sairModoJogoReal();
    };
  }, []);

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

        const jogadas = (data.historico_jogadas as string[]) || [];
        setMesaPedras(jogadas);

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

  useEffect(() => {
    carregarDadosPartida();

    const pedrasIniciais = [
      '6-6', '6-5', '5-4', '4-4', '3-3', '2-1', '0-4', '5-2', 
      '3-2', '1-1', '0-0', '5-5', '6-4', '6-1', '3-1'
    ];
    const minhasPróprias = pedrasIniciais.sort(() => 0.5 - Math.random()).slice(0, 7);
    setMinhasPedras(minhasPróprias);

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

            if (newData.jogador_1_id === null || newData.jogador_2_id === null) {
              alert('Partida encerrada: O adversário saiu da sala.');
              sairModoJogoReal();
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

  const tentarJogarPedra = async (pedra: string) => {
    if (!meuTurno) return;

    const [ladoA, ladoB] = pedra.split('-').map(Number);
    let novaMesa = [...mesaPedras];
    let novaPontaE = pontaEsquerda;
    let novaPontaD = pontaDireita;

    if (mesaPedras.length === 0) {
      novaMesa.push(pedra);
      novaPontaE = ladoA;
      novaPontaD = ladoB;
    } else {
      if (ladoA === pontaEsquerda) {
        novaMesa.unshift(`${ladoB}-${ladoA}`);
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
      setMinhasPedras(prev => prev.filter(p => p !== pedra));
    } catch (err) {
      console.error('Erro ao processar jogada:', err);
    }
  };

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
    <div 
      ref={containerRef}
      className="w-full h-screen bg-[#090610] text-white font-sans flex flex-col justify-between p-2 md:p-4 overflow-hidden select-none"
    >
      
      {/* 1. HUD / BARRA SUPERIOR OTIMIZADA */}
      <div className="flex items-center justify-between bg-[#110D1A]/95 border border-purple-950/40 px-3 py-1.5 rounded-xl shadow-lg h-[10%]">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { sairModoJogoReal(); onVoltarAoLobby(); }} 
            className="text-gray-400 hover:text-white h-8 text-xs px-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Sair
          </Button>
          <span className="text-[10px] text-purple-300 font-bold bg-purple-950/50 px-2 py-0.5 rounded-full">
            Mesa {numeroSala}
          </span>
        </div>

        {/* Informação dos Jogadores Lado a Lado (Estilo Placar) */}
        <div className="flex items-center gap-4 bg-purple-950/20 px-3 py-1 rounded-lg border border-purple-900/10 text-xs">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${vezUsuarioId === jogador1Id ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
            <span className="max-w-[70px] truncate font-medium">{nomeJ1}</span>
          </div>
          <span className="text-purple-500 font-bold">VS</span>
          <div className="flex items-center gap-1.5">
            <span className="max-w-[70px] truncate font-medium">{nomeJ2}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${vezUsuarioId === jogador2Id ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
          </div>
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={isFullscreen ? sairModoJogoReal : entrarModoJogoReal} 
          className="text-purple-400 hover:text-white w-8 h-8"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>

      {/* 2. MESA DE FELTRO DE BAR (ALTAMENTE OTIMIZADA PARA LANDSCAPE) */}
      <div className="flex-grow my-2 bg-emerald-950 border-[4px] border-amber-950 rounded-[24px] shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)] relative flex flex-col items-center justify-center h-[55%] overflow-hidden">
        
        {/* Marcadores de Pontas da Mesa de forma discreta */}
        {mesaPedras.length > 0 && (
          <div className="absolute top-2 left-4 flex items-center gap-3 text-[10px] font-semibold text-emerald-300/60">
            <span>Esquerda: <strong className="text-white bg-emerald-900/60 px-1.5 py-0.5 rounded text-xs">{pontaEsquerda}</strong></span>
            <span>Direita: <strong className="text-white bg-emerald-900/60 px-1.5 py-0.5 rounded text-xs">{pontaDireita}</strong></span>
          </div>
        )}

        {/* Tabuleiro Dinâmico: Buchas ficam normais (em pé) e as outras deitadas */}
        <div className="flex items-center justify-center gap-1.5 max-w-full overflow-x-auto px-4 py-2">
          {mesaPedras.length === 0 ? (
            <div className="text-center text-emerald-300/30 font-bold uppercase tracking-widest text-xs py-6">
              Mesa de Dominó Limpa<br />
              <span className="text-[10px] font-normal lowercase">Seu turno! Jogue a primeira pedra.</span>
            </div>
          ) : (
            mesaPedras.map((pedra, idx) => {
              const [ladoA, ladoB] = pedra.split('-').map(Number);
              const isBucha = ladoA === ladoB;

              return (
                <div 
                  key={idx} 
                  className={`shrink-0 transition-transform ${
                    isBucha 
                      ? 'rotate-0 mx-0.5' // Bucha fica em pé no centro (vertical)
                      : 'rotate-90 mx-3 my-2' // Pedras comuns deitam de lado (horizontal)
                  }`}
                >
                  <PedraClassica valor={pedra} disabled={true} menor={true} />
                </div>
              );
            })
          )}
        </div>

        {/* Banner do Turno */}
        <div className="absolute bottom-2 bg-[#090610]/95 border border-purple-900/40 px-4 py-1 rounded-full text-[10px] font-bold tracking-wide">
          {meuTurno ? (
            <span className="text-green-400 animate-pulse flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> SUA VEZ DE JOGAR!
            </span>
          ) : (
            <span className="text-gray-400">Aguardando {adversarioNome}...</span>
          )}
        </div>
      </div>

      {/* 3. MINHA MÃO DE PEDRAS (OTIMIZADA E ESPAÇADA) */}
      <div className="bg-[#110D1A]/95 border border-purple-950/40 p-2.5 rounded-2xl h-[30%] flex flex-col justify-between">
        <div className="flex items-center justify-between px-1 h-[25%]">
          <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Suas Pedras ({minhasPedras.length})</span>
          {meuTurno && (
            <Button 
              onClick={passarVez} 
              variant="outline" 
              className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10 font-bold h-6 text-[10px] px-2 py-0"
            >
              Passar Vez
            </Button>
          )}
        </div>

        {/* Pedras de jogo menores na mão para não ocupar toda a tela mobile */}
        <div className="flex justify-center items-center gap-1.5 overflow-x-auto h-[75%] py-1">
          {minhasPedras.map((pedra, idx) => (
            <div key={idx} className="shrink-0 scale-90 md:scale-100">
              <PedraClassica 
                valor={pedra} 
                onClick={() => tentarJogarPedra(pedra)}
                disabled={!meuTurno}
                menor={true}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
