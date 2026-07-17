import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Trophy, User, Maximize2, Minimize2, ShieldAlert, Award, MessageSquare, Timer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DominoTabuleiroProps {
  usuarioId: string;
  salaId: string;
  numeroSala: number;
  onVoltarAoLobby: () => void;
}

interface PedraMesa {
  valorOriginal: string;
  ladoEsquerdo: number;
  ladoDireito: number;
}

const PedraClassica = ({ 
  valor, 
  onClick, 
  disabled, 
  menor = false, 
  deitada = false,
  destacada = false 
}: { 
  valor: string; 
  onClick?: () => void; 
  disabled?: boolean; 
  menor?: boolean; 
  deitada?: boolean;
  destacada?: boolean;
}) => {
  const safeValor = valor || '0-0';
  const [ladoA, ladoB] = safeValor.split('-').map(Number);

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

  const classesTamanho = deitada
    ? (menor ? "w-16 h-8 border-2 flex-row" : "w-20 h-10 border-2 flex-row")
    : (menor ? "w-8 h-16 border-2 flex-col" : "w-10 h-20 border-2 flex-col");

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`${classesTamanho} bg-[#1a1a1a] border-[#333] rounded-lg flex items-center justify-between shadow-lg relative transition-all ${
        destacada 
          ? 'border-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.7)] scale-105 animate-pulse cursor-pointer z-10' 
          : disabled && !onClick
            ? 'opacity-100'
            : 'opacity-40 cursor-not-allowed'
      }`}
    >
      <div className="flex-1 w-full h-full flex items-center justify-center">
        {renderBolinhas(ladoA)}
      </div>
      <div className={deitada ? "h-[90%] w-[1.5px] bg-amber-600/80 rounded-full" : "w-[90%] h-[1.5px] bg-amber-600/80 rounded-full"} />
      <div className="flex-1 w-full h-full flex items-center justify-center">
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
  const [mesaPedras, setMesaPedras] = useState<PedraMesa[]>([]);
  const [pontaEsquerda, setPontaEsquerda] = useState<number | null>(null);
  const [pontaDireita, setPontaDireita] = useState<number | null>(null);

  const [tempoRestante, setTempoRestante] = useState<number>(30);

  const [modalNotificacao, setModalNotificacao] = useState<{ visivel: boolean; titulo: string; mensagem: string; tipo: 'info' | 'erro' | 'fim' }>({
    visivel: false,
    titulo: '',
    mensagem: '',
    tipo: 'info'
  });

  const [alertaTemporario, setAlertaTemporario] = useState<{ visivel: boolean; mensagem: string } | null>(null);

  const entrarModoJogoReal = async () => {
    try {
      if (containerRef.current) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);

        if (screen.orientation && (screen.orientation as any).lock) {
          await (screen.orientation as any).lock('landscape').catch(() => {
            console.log("Rotação bloqueada.");
          });
        }
      }
    } catch (err) {
      console.warn("Navegador não suporta rotação:", err);
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

  // Executa apenas o encerramento visual e volta para o lobby no frontend
  const sairDaPartidaLocal = () => {
    sairModoJogoReal();
    onVoltarAoLobby();
  };

  const sairDaPartida = async () => {
    try {
      const updates: any = {};
      if (jogador1Id === usuarioId) updates.jogador_1_id = null;
      if (jogador2Id === usuarioId) updates.jogador_2_id = null;
      
      updates.status = 'aguardando';
      updates.vez_usuario_id = null;
      updates.mesa_ponta_esquerda = null;
      updates.mesa_ponta_direita = null;
      updates.historico_jogadas = [];
      updates.passadas_count = 0;
      updates.atualizado_em = new Date().toISOString();

      await supabase
        .from('domino_salas')
        .update(updates)
        .eq('id', salaId);

      sairDaPartidaLocal();
    } catch (err) {
      console.error('Erro ao sair da partida:', err);
      sairDaPartidaLocal();
    }
  };

  const isPedraJogavel = (pedra: string) => {
    if (mesaPedras.length === 0) return true;
    const [ladoA, ladoB] = pedra.split('-').map(Number);
    return ladoA === pontaEsquerda || ladoB === pontaEsquerda || ladoA === pontaDireita || ladoB === pontaDireita;
  };

  const passarVez = async () => {
    const proximoTurnoId = usuarioId === jogador1Id ? jogador2Id : jogador1Id;

    try {
      const { data: salaAtual } = await supabase
        .from('domino_salas')
        .select('passadas_count')
        .eq('id', salaId)
        .single();

      const novasPassadas = (salaAtual?.passadas_count || 0) + 1;

      if (novasPassadas >= 3) {
        // Envia o comando de reset total e limpa o banco de dados
        await supabase
          .from('domino_salas')
          .update({
            jogador_1_id: null,
            jogador_2_id: null,
            status: 'aguardando',
            vez_usuario_id: null,
            mesa_ponta_esquerda: null,
            mesa_ponta_direita: null,
            historico_jogadas: [],
            passadas_count: 0,
            atualizado_em: new Date().toISOString()
          })
          .eq('id', salaId);

        // Notifica e ejeta localmente na hora quem realizou a última passada
        setModalNotificacao({
          visivel: true,
          titulo: 'Partida Anulada!',
          mensagem: 'O limite máximo de 3 passadas seguidas foi atingido. O jogo foi encerrado.',
          tipo: 'erro'
        });
      } else {
        await supabase
          .from('domino_salas')
          .update({
            vez_usuario_id: proximoTurnoId,
            passadas_count: novasPassadas,
            atualizado_em: new Date().toISOString()
          })
          .eq('id', salaId);
      }
    } catch (err) {
      console.error('Erro ao passar a vez:', err);
    }
  };

  const tentarJogarPedra = async (pedra: string) => {
    if (!meuTurno) return;

    const [ladoA, ladoB] = pedra.split('-').map(Number);
    let novaMesa = [...mesaPedras];
    let novaPontaE = pontaEsquerda;
    let novaPontaD = pontaDireita;

    if (mesaPedras.length === 0) {
      const novaPedra: PedraMesa = {
        valorOriginal: pedra,
        ladoEsquerdo: ladoA,
        ladoDireito: ladoB
      };
      novaMesa.push(novaPedra);
      novaPontaE = ladoA;
      novaPontaD = ladoB;
    } else {
      if (ladoA === pontaEsquerda) {
        const novaPedra: PedraMesa = {
          valorOriginal: `${ladoB}-${ladoA}`,
          ladoEsquerdo: ladoB,
          ladoDireito: ladoA
        };
        novaMesa.unshift(novaPedra);
        novaPontaE = ladoB;
      } else if (ladoB === pontaEsquerda) {
        const novaPedra: PedraMesa = {
          valorOriginal: `${ladoA}-${ladoB}`,
          ladoEsquerdo: ladoA,
          ladoDireito: ladoB
        };
        novaMesa.unshift(novaPedra);
        novaPontaE = ladoA;
      }
      else if (ladoA === pontaDireita) {
        const novaPedra: PedraMesa = {
          valorOriginal: `${ladoA}-${ladoB}`,
          ladoEsquerdo: ladoA,
          ladoDireito: ladoB
        };
        novaMesa.push(novaPedra);
        novaPontaD = ladoB;
      } else if (ladoB === pontaDireita) {
        const novaPedra: PedraMesa = {
          valorOriginal: `${ladoB}-${ladoA}`,
          ladoEsquerdo: ladoB,
          ladoDireito: ladoA
        };
        novaMesa.push(novaPedra);
        novaPontaD = ladoA;
      } else {
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
          passadas_count: 0,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', salaId);

      if (error) throw error;
      setMinhasPedras(prev => prev.filter(p => p !== pedra));
    } catch (err) {
      console.error('Erro ao processar jogada:', err);
    }
  };

  useEffect(() => {
    entrarModoJogoReal();

    const monitorarTelaCheia = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', monitorarTelaCheia);
    document.addEventListener('webkitfullscreenchange', monitorarTelaCheia);

    return () => {
      document.removeEventListener('fullscreenchange', monitorarTelaCheia);
      document.removeEventListener('webkitfullscreenchange', monitorarTelaCheia);
      sairModoJogoReal();
    };
  }, []);

  const inicializarPedrasCompartilhadas = (userId: string, j1: string | null, j2: string | null) => {
    const totalVinteOitoPedras = [
      '0-0', '0-1', '0-2', '0-3', '0-4', '0-5', '0-6',
      '1-1', '1-2', '1-3', '1-4', '1-5', '1-6',
      '2-2', '2-3', '2-4', '2-5', '2-6',
      '3-3', '3-4', '3-5', '3-6',
      '4-4', '4-5', '4-6',
      '5-5', '5-6',
      '6-6'
    ];

    const salaHash = salaId.replace(/[^0-9]/g, '');
    const seed = salaHash ? parseInt(salaHash.substring(0, 5)) : 12345;
    
    let pool = [...totalVinteOitoPedras];
    let tempSeed = seed;
    for (let i = pool.length - 1; i > 0; i--) {
      tempSeed = (tempSeed * 9301 + 49297) % 233280;
      const j = Math.floor((tempSeed / 233280) * (i + 1));
      const temp = pool[i];
      pool[i] = pool[j];
      pool[j] = temp;
    }

    if (userId === j1) {
      setMinhasPedras(pool.slice(0, 7));
    } else if (userId === j2) {
      setMinhasPedras(pool.slice(7, 14));
    }
  };

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

        const jogadasRaw = data.historico_jogadas as any[];
        const jogadasProcessadas: PedraMesa[] = Array.isArray(jogadasRaw) 
          ? jogadasRaw.map((jogada: any) => {
              if (typeof jogada === 'string') {
                const [lA, lB] = jogada.split('-').map(Number);
                return { valorOriginal: jogada, ladoEsquerdo: lA, ladoDireito: lB };
              }
              return jogada as PedraMesa;
            })
          : [];

        setMesaPedras(jogadasProcessadas);

        inicializarPedrasCompartilhadas(usuarioId, data.jogador_1_id, data.jogador_2_id);

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

    const canalJogo = supabase
      .channel(`jogo-realtime-${salaId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'domino_salas', filter: `id=eq.${salaId}` },
        (payload) => {
          const newData = payload.new;
          const oldData = payload.old;
          if (newData) {
            // DETECTA SE A SALA FOI ZERADA/ANULADA PELO SUPABASE
            if (newData.jogador_1_id === null && newData.jogador_2_id === null && newData.status === 'aguardando') {
              supabase.removeChannel(canalJogo); // Desliga o listener imediatamente para evitar loops de renderização
              setModalNotificacao({
                visivel: true,
                titulo: 'Partida Anulada!',
                mensagem: 'O limite máximo de 3 passadas automáticas seguidas foi atingido. O jogo foi encerrado.',
                tipo: 'erro'
              });
              return;
            }

            const vezAntigaId = oldData ? oldData.vez_usuario_id : vezUsuarioId;
            const novaVezId = newData.vez_usuario_id;
            
            setVezUsuarioId(novaVezId);
            setPontaEsquerda(newData.mesa_ponta_esquerda);
            setPontaDireita(newData.mesa_ponta_direita);

            const jogadasRaw = newData.historico_jogadas as any[];
            const jogadasProcessadas: PedraMesa[] = Array.isArray(jogadasRaw) 
              ? jogadasRaw.map((jogada: any) => {
                  if (typeof jogada === 'string') {
                    const [lA, lB] = jogada.split('-').map(Number);
                    return { valorOriginal: jogada, ladoEsquerdo: lA, ladoDireito: lB };
                  }
                  return jogada as PedraMesa;
                })
              : [];
              
            const mesaAntigaLength = mesaPedras.length;
            const mesaNovaLength = jogadasProcessadas.length;

            setMesaPedras(jogadasProcessadas);
            setTempoRestante(30);

            if (novaVezId === usuarioId && vezAntigaId !== usuarioId) {
              if (mesaNovaLength === mesaAntigaLength && mesaNovaLength > 0) {
                const nomeAdv = usuarioId === newData.jogador_1_id ? (newData.jogador_2 as any)?.nome || 'Adversário' : (newData.jogador_1 as any)?.nome || 'Adversário';
                setAlertaTemporario({
                  visivel: true,
                  mensagem: `⚠️ ${nomeAdv} passou a vez (ou esgotou o tempo)! Seu turno.`
                });
              } else {
                setAlertaTemporario({
                  visivel: true,
                  mensagem: '🟢 Sua vez de jogar! Faça a sua jogada na mesa.'
                });
              }
            }

            if ((newData.jogador_1_id === null || newData.jogador_2_id === null) && newData.status !== 'aguardando') {
              supabase.removeChannel(canalJogo);
              setModalNotificacao({
                visivel: true,
                titulo: 'Adversário Desconectado',
                mensagem: 'A partida foi encerrada porque o seu oponente deixou a sala de dominó.',
                tipo: 'erro'
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalJogo);
    };
  }, [salaId, mesaPedras.length]);

  const meuTurno = vezUsuarioId === usuarioId;
  const adversarioNome = usuarioId === jogador1Id ? nomeJ2 : nomeJ1;

  useEffect(() => {
    if (!meuTurno) return;

    const cronometro = setInterval(() => {
      setTempoRestante((tempo) => {
        if (tempo <= 1) {
          clearInterval(cronometro);
          setAlertaTemporario({
            visivel: true,
            mensagem: '⏱️ Seu tempo esgotou! A vez foi passada para o adversário.'
          });
          passarVez();
          return 30;
        }
        return tempo - 1;
      });
    }, 1000);

    return () => clearInterval(cronometro);
  }, [meuTurno, vezUsuarioId]);

  useEffect(() => {
    if (alertaTemporario && alertaTemporario.visivel) {
      const timer = setTimeout(() => {
        setAlertaTemporario(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [alertaTemporario]);

  useEffect(() => {
    if (meuTurno && minhasPedras.length > 0 && mesaPedras.length > 0) {
      const temQualquerPecaJogavel = minhasPedras.some(pedra => isPedraJogavel(pedra));

      if (!temQualquerPecaJogavel) {
        setModalNotificacao({
          visivel: true,
          titulo: 'Sem Peças Compatíveis!',
          mensagem: 'Você não tem peças jogáveis para as pontas disponíveis. Sua vez foi passada para o oponente automaticamente.',
          tipo: 'info'
        });
        passarVez();
      }
    }
  }, [meuTurno, minhasPedras, mesaPedras, pontaEsquerda, pontaDireita]);

  useEffect(() => {
    if (minhasPedras.length === 0 && mesaPedras.length > 0) {
      setModalNotificacao({
        visivel: true,
        titulo: 'Parabéns, Você Venceu!',
        mensagem: 'Você bateu o jogo e jogou todas as suas pedras na mesa de dominó.',
        tipo: 'fim'
      });
    }
  }, [minhasPedras]);

  const fecharModalNotificacao = () => {
    setModalNotificacao(prev => ({ ...prev, visivel: false }));
    sairDaPartidaLocal();
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-screen bg-[#090610] text-white font-sans flex flex-col justify-between p-2 md:p-4 overflow-hidden select-none relative"
    >
      {alertaTemporario && alertaTemporario.visivel && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[60] bg-purple-950/95 border-2 border-purple-500 text-white px-5 py-2 rounded-2xl shadow-[0_4px_15px_rgba(147,51,234,0.4)] flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-200">
          <MessageSquare className="w-4 h-4 text-purple-400 animate-pulse" />
          <span>{alertaTemporario.mensagem}</span>
        </div>
      )}

      {modalNotificacao.visivel && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="max-w-xs bg-[#110D1A] border border-purple-950/60 p-6 rounded-2xl shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-3 bg-purple-950/40 border border-purple-900/30 rounded-full w-fit mx-auto text-purple-400">
              {modalNotificacao.tipo === 'fim' ? <Award className="w-8 h-8 text-yellow-500" /> : <ShieldAlert className="w-8 h-8" />}
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-md text-white">{modalNotificacao.titulo}</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed">{modalNotificacao.mensagem}</p>
            </div>
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-9 text-xs"
              onClick={fecharModalNotificacao}
            >
              OK, Entendi
            </Button>
          </div>
        </div>
      )}

      {!isFullscreen && (
        <div className="absolute inset-0 bg-[#090610]/98 z-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-sm space-y-6">
            <div className="p-4 bg-purple-950/40 border border-purple-900/30 rounded-full w-fit mx-auto text-purple-400 animate-bounce">
              <ShieldAlert className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">Modo Exclusivo Ativo</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Para garantir a melhor experiência e usabilidade visual do dominó, você deve jogar em modo tela cheia.
              </p>
            </div>
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-11 shadow-lg shadow-purple-900/20"
              onClick={entrarModoJogoReal}
            >
              Ativar Tela Cheia / Jogar
            </Button>
          </div>
        </div>
      )}
      
      {/* 1. HUD SUPERIOR */}
      <div className="flex items-center justify-between bg-[#110D1A]/95 border border-purple-950/40 px-3 py-1.5 rounded-xl shadow-lg h-[10%]">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={sairDaPartida} 
            className="text-gray-400 hover:text-white h-8 text-xs px-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Sair
          </Button>
          <span className="text-[10px] text-purple-300 font-bold bg-purple-950/50 px-2 py-0.5 rounded-full">
            Mesa {numeroSala}
          </span>
        </div>

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

      {/* 2. MESA DE JOGO */}
      <div className="flex-grow my-2 bg-emerald-950 border-[4px] border-amber-950 rounded-[24px] shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)] relative flex flex-col items-center justify-center h-[55%] overflow-hidden">
        
        {mesaPedras.length > 0 && (
          <div className="absolute top-2 left-4 flex items-center gap-3 text-[10px] font-semibold text-emerald-300/60">
            <span>Esquerda: <strong className="text-white bg-emerald-900/60 px-1.5 py-0.5 rounded text-xs">{pontaEsquerda}</strong></span>
            <span>Direita: <strong className="text-white bg-emerald-900/60 px-1.5 py-0.5 rounded text-xs">{pontaDireita}</strong></span>
          </div>
        )}

        <div className="flex items-center justify-center gap-[2px] max-w-full overflow-x-auto px-4 py-2">
          {mesaPedras.length === 0 ? (
            <div className="text-center text-emerald-300/30 font-bold uppercase tracking-widest text-xs py-6">
              Mesa de Dominó Limpa<br />
              <span className="text-[10px] font-normal lowercase">Seu turno! Jogue a primeira pedra.</span>
            </div>
          ) : (
            mesaPedras.map((pedra, idx) => {
              if (!pedra || !pedra.valorOriginal) return null;
              const [ladoA, ladoB] = pedra.valorOriginal.split('-').map(Number);
              const isBucha = ladoA === ladoB;

              return (
                <div key={idx} className="shrink-0 flex items-center justify-center">
                  <PedraClassica 
                    valor={pedra.valorOriginal} 
                    disabled={true} 
                    menor={true} 
                    deitada={!isBucha} 
                  />
                </div>
              );
            })
          )}
        </div>

        <div className="absolute bottom-2 bg-[#090610]/95 border border-purple-900/40 px-4 py-1 rounded-full text-[10px] font-bold tracking-wide">
          {meuTurno ? (
            <span className="text-green-400 animate-pulse flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 animate-spin" /> {tempoRestante}s - SUA VEZ DE JOGAR!
            </span>
          ) : (
            <span className="text-gray-400">Aguardando {adversarioNome}...</span>
          )}
        </div>
      </div>

      {/* 3. MINHA MÃO */}
      <div className="bg-[#110D1A]/95 border border-purple-950/40 p-2.5 rounded-2xl h-[30%] flex flex-col justify-between">
        <div className="flex items-center justify-between px-1 h-[25%]">
          <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Suas Pedras ({minhasPedras.length})</span>
        </div>

        <div className="flex justify-center items-center gap-1.5 overflow-x-auto h-[75%] py-1">
          {minhasPedras.map((pedra, idx) => {
            const jogavel = meuTurno && isPedraJogavel(pedra);

            return (
              <div key={idx} className="shrink-0 scale-90 md:scale-100">
                <PedraClassica 
                  valor={pedra} 
                  onClick={() => tentarJogarPedra(pedra)}
                  disabled={!jogavel}
                  menor={true}
                  destacada={jogavel}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
