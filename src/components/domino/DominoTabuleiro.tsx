import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Trophy, User, Maximize2, Minimize2, ShieldAlert, Award, MessageSquare, Timer, Move, Volume2 } from 'lucide-react';
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

// SINTETIZADOR WEB AUDIO API PARA EFEITOS SONOROS
const tocarEfeitoSonoro = (tipo: 'jogar' | 'passar' | 'vitoria' | 'empate') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (tipo === 'jogar') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (tipo === 'passar') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (tipo === 'vitoria') {
      const notas = [261.63, 329.63, 392.00, 523.25];
      notas.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.12 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.3);
      });
    } else if (tipo === 'empate') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (err) {
    console.warn('Erro ao tocar efeito sonoro:', err);
  }
};

const PedraClassica = ({ 
  valor, 
  onClick, 
  disabled, 
  menor = false, 
  deitada = false,
  destacada = false,
  onDragStart
}: { 
  valor: string; 
  onClick?: () => void; 
  disabled?: boolean; 
  menor?: boolean; 
  deitada?: boolean;
  destacada?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}) => {
  const safeValor = valor || '0-0';
  const [ladoA, ladoB] = safeValor.split('-').map(Number);

  const renderBolinhas = (pontos: number) => {
    const posicoes: Record<number, number[]> = {
      0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
    };

    const ativas = posicoes[pontos] || [];
    const tamanhoBolinha = menor ? 'w-1 h-1' : 'w-1.5 h-1.5';
    const espacamentoGrid = menor ? 'gap-0.5 p-1' : 'gap-1 p-1.5';

    return (
      <div className={`grid grid-cols-3 ${espacamentoGrid} h-full w-full items-center justify-items-center pointer-events-none`}>
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
      draggable={!disabled && !!onDragStart}
      onDragStart={onDragStart}
      className={`${classesTamanho} bg-[#1a1a1a] border-[#333] rounded-lg flex items-center justify-between shadow-lg relative transition-all ${
        destacada 
          ? 'border-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.7)] scale-105 animate-pulse cursor-grab active:cursor-grabbing z-10' 
          : disabled && !onClick
            ? 'opacity-100'
            : 'opacity-40 cursor-not-allowed'
      }`}
    >
      <div className="flex-1 w-full h-full flex items-center justify-center pointer-events-none">
        {renderBolinhas(ladoA)}
      </div>
      <div className={deitada ? "h-[90%] w-[1.5px] bg-amber-600/80 rounded-full pointer-events-none" : "w-[90%] h-[1.5px] bg-amber-600/80 rounded-full pointer-events-none"} />
      <div className="flex-1 w-full h-full flex items-center justify-center pointer-events-none">
        {renderBolinhas(ladoB)}
      </div>
    </button>
  );
};

export const DominoTabuleiro = ({ usuarioId, salaId, numeroSala, onVoltarAoLobby }: DominoTabuleiroProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canalRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [jogador1Id, setJogador1Id] = useState<string | null>(null);
  const [jogador2Id, setJogador2Id] = useState<string | null>(null);
  const [nomeJ1, setNomeJ1] = useState('Jogador 1');
  const [nomeJ2, setNomeJ2] = useState('Jogador 2');
  const [vezUsuarioId, setVezUsuarioId] = useState<string | null>(null);
  const [passadasCount, setPassadasCount] = useState<number>(0);
  
  const [minhasPedras, setMinhasPedras] = useState<string[]>([]);
  const [mesaPedras, setMesaPedras] = useState<PedraMesa[]>([]);
  const [pontaEsquerda, setPontaEsquerda] = useState<number | null>(null);
  const [pontaDireita, setPontaDireita] = useState<number | null>(null);

  // ESTADO DE DRAG AND DROP
  const [pedraArrastando, setPedraArrastando] = useState<string | null>(null);
  const [sobreDropZone, setSobreDropZone] = useState<'esquerda' | 'direita' | null>(null);

  const [tempoRestante, setTempoRestante] = useState<number>(30);
  
  const processandoJogadaLocal = useRef(false);
  const pedrasInicializadas = useRef(false);

  const [modalNotificacao, setModalNotificacao] = useState<{ visivel: boolean; titulo: string; message: string; tipo: 'info' | 'erro' | 'fim' }>({
    visivel: false, titulo: '', message: '', tipo: 'info'
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
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const sairModoJogoReal = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    setIsFullscreen(false);
  };

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

      await supabase.from('domino_salas').update(updates).eq('id', salaId);
      sairDaPartidaLocal();
    } catch (err) {
      sairDaPartidaLocal();
    }
  };

  const isPedraJogavel = (pedra: string) => {
    if (mesaPedras.length === 0) return true;
    const [ladoA, ladoB] = pedra.split('-').map(Number);
    return ladoA === pontaEsquerda || ladoB === pontaEsquerda || ladoA === pontaDireita || ladoB === pontaDireita;
  };

  const enviarEmoji = (emoji: string) => {
    if (canalRef.current) {
      canalRef.current.send({
        type: 'broadcast',
        event: 'emoji',
        payload: { remetenteId: usuarioId, emoji }
      });
      
      setAlertaTemporario({
        visivel: true,
        mensagem: `Você provocou com: ${emoji}`
      });
    }
  };

  // LÓGICA REUTILIZADA DE PASSE COM CONTAGEM DE JOGO TRANCADO
  const passarVez = async () => {
    const proximoTurnoId = usuarioId === jogador1Id ? jogador2Id : jogador1Id;
    const novaContagemPassadas = passadasCount + 1;

    tocarEfeitoSonoro('passar');

    try {
      if (novaContagemPassadas >= 2) {
        // TRANCADO / FECHADO: NENHUM DOS DOIS JOGADORES TEM PEÇA
        tocarEfeitoSonoro('empate');
        setModalNotificacao({
          visivel: true,
          titulo: 'Jogo Trancado!',
          message: 'Ambos os jogadores passaram a vez. A partida empatou/fechou!',
          tipo: 'info'
        });
        
        await supabase.from('domino_salas').update({
          passadas_count: novaContagemPassadas,
          atualizado_em: new Date().toISOString()
        }).eq('id', salaId);

        return;
      }

      await supabase
        .from('domino_salas')
        .update({
          vez_usuario_id: proximoTurnoId,
          passadas_count: novaContagemPassadas,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', salaId);
    } catch (err) {
      console.error(err);
    }
  };

  // EXECUÇÃO FINAL DA JOGADA ENCAIXANDO NA PONTA ESCOLHIDA
  const executarJogadaNaPonta = async (pedra: string, ladoEscolha: 'esquerda' | 'direita') => {
    if (!meuTurno || processandoJogadaLocal.current) return;
    processandoJogadaLocal.current = true;
    setPedraArrastando(null);

    tocarEfeitoSonoro('jogar');

    const [ladoA, ladoB] = pedra.split('-').map(Number);
    let novaMesa = [...mesaPedras];
    let novaPontaE = pontaEsquerda;
    let novaPontaD = pontaDireita;

    if (mesaPedras.length === 0) {
      const novaPedra: PedraMesa = { valorOriginal: pedra, ladoEsquerdo: ladoA, ladoDireito: ladoB };
      novaMesa.push(novaPedra);
      novaPontaE = ladoA;
      novaPontaD = ladoB;
    } else if (ladoEscolha === 'esquerda') {
      if (ladoA === pontaEsquerda) {
        const novaPedra: PedraMesa = { valorOriginal: `${ladoB}-${ladoA}`, ladoEsquerdo: ladoB, ladoDireito: ladoA };
        novaMesa.unshift(novaPedra);
        novaPontaE = ladoB;
      } else {
        const novaPedra: PedraMesa = { valorOriginal: `${ladoA}-${ladoB}`, ladoEsquerdo: ladoA, ladoDireito: ladoB };
        novaMesa.unshift(novaPedra);
        novaPontaE = ladoA;
      }
    } else if (ladoEscolha === 'direita') {
      if (ladoA === pontaDireita) {
        const novaPedra: PedraMesa = { valorOriginal: `${ladoA}-${ladoB}`, ladoEsquerdo: ladoA, ladoDireito: ladoB };
        novaMesa.push(novaPedra);
        novaPontaD = ladoB;
      } else {
        const novaPedra: PedraMesa = { valorOriginal: `${ladoB}-${ladoA}`, ladoEsquerdo: ladoB, ladoDireito: ladoA };
        novaMesa.push(novaPedra);
        novaPontaD = ladoA;
      }
    }

    const proximoTurnoId = usuarioId === jogador1Id ? jogador2Id : jogador1Id;

    try {
      setMinhasPedras(prev => prev.filter(p => p !== pedra));

      const { error } = await supabase
        .from('domino_salas')
        .update({
          historico_jogadas: novaMesa as any,
          mesa_ponta_esquerda: novaPontaE,
          mesa_ponta_direita: novaPontaD,
          vez_usuario_id: proximoTurnoId,
          passadas_count: 0, // Reseta contagem de passadas ao jogar
          atualizado_em: new Date().toISOString()
        })
        .eq('id', salaId);

      if (error) throw error;
    } catch (err) {
      console.error(err);
      carregarDadosPartida();
    }
  };

  // EVENTOS DE DRAG & DROP
  const handleDragStart = (pedra: string, e: React.DragEvent) => {
    if (!meuTurno || !isPedraJogavel(pedra)) return;
    setPedraArrastando(pedra);
    e.dataTransfer.setData('text/plain', pedra);
  };

  const handleDragOver = (e: React.DragEvent, lado: 'esquerda' | 'direita') => {
    e.preventDefault();
    setSobreDropZone(lado);
  };

  const handleDragLeave = () => {
    setSobreDropZone(null);
  };

  const handleDrop = (e: React.DragEvent, lado: 'esquerda' | 'direita') => {
    e.preventDefault();
    setSobreDropZone(null);
    const pedra = e.dataTransfer.getData('text/plain') || pedraArrastando;
    if (pedra) {
      const [ladoA, ladoB] = pedra.split('-').map(Number);
      const serveNaEsquerda = ladoA === pontaEsquerda || ladoB === pontaEsquerda;
      const serveNaDireita = ladoA === pontaDireita || ladoB === pontaDireita;

      if (mesaPedras.length === 0) {
        executarJogadaNaPonta(pedra, 'esquerda');
      } else if (lado === 'esquerda' && serveNaEsquerda) {
        executarJogadaNaPonta(pedra, 'esquerda');
      } else if (lado === 'direita' && serveNaDireita) {
        executarJogadaNaPonta(pedra, 'direita');
      } else {
        setAlertaTemporario({ visivel: true, mensagem: '❌ Esta pedra não encaixa nessa ponta!' });
      }
    }
  };

  // CLIQUE SIMPLES
  const tentarJogarPedraClique = (pedra: string) => {
    if (!meuTurno || processandoJogadaLocal.current) return;

    if (mesaPedras.length === 0) {
      executarJogadaNaPonta(pedra, 'esquerda');
      return;
    }

    const [ladoA, ladoB] = pedra.split('-').map(Number);
    const daNaEsquerda = ladoA === pontaEsquerda || ladoB === pontaEsquerda;
    const daNaDireita = ladoA === pontaDireita || ladoB === pontaDireita;

    if (daNaEsquerda && daNaDireita) {
      setPedraArrastando(pedra);
    } else if (daNaEsquerda) {
      executarJogadaNaPonta(pedra, 'esquerda');
    } else if (daNaDireita) {
      executarJogadaNaPonta(pedra, 'direita');
    }
  };

  // EMBARALHAMENTO REAL E ÚNICO DE 28 PEDRAS (SEM REPETIÇÃO)
  const inicializarPedrasCompartilhadas = (userId: string, j1: string | null, j2: string | null) => {
    if (pedrasInicializadas.current || !j1 || !j2) return;
    pedrasInicializadas.current = true;

    const totalVinteOitoPedras = [
      '0-0', '0-1', '0-2', '0-3', '0-4', '0-5', '0-6',
      '1-1', '1-2', '1-3', '1-4', '1-5', '1-6',
      '2-2', '2-3', '2-4', '2-5', '2-6',
      '3-3', '3-4', '3-5', '3-6',
      '4-4', '4-5', '4-6',
      '5-5', '5-6',
      '6-6'
    ];

    let hashNum = 0;
    for (let i = 0; i < salaId.length; i++) {
      hashNum = (hashNum << 5) - hashNum + salaId.charCodeAt(i);
      hashNum |= 0;
    }
    const seed = Math.abs(hashNum) || 98765;

    let pool = [...totalVinteOitoPedras];
    let tempSeed = seed;

    for (let i = pool.length - 1; i > 0; i--) {
      tempSeed = (tempSeed * 1103515245 + 12345) & 0x7fffffff;
      const j = Math.floor((tempSeed / 0x7fffffff) * (i + 1));
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
          id, jogador_1_id, jogador_2_id, vez_usuario_id, passadas_count,
          mesa_ponta_esquerda, mesa_ponta_direita, historico_jogadas,
          jogador_1:jogador_1_id ( nome ), jogador_2:jogador_2_id ( nome )
        `)
        .eq('id', salaId)
        .single();

      if (error) throw error;

      if (data) {
        setJogador1Id(data.jogador_1_id);
        setJogador2Id(data.jogador_2_id);
        setVezUsuarioId(data.vez_usuario_id);
        setPassadasCount(data.passadas_count || 0);
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
          await supabase.from('domino_salas').update({ vez_usuario_id: data.jogador_1_id }).eq('id', salaId);
          setVezUsuarioId(data.jogador_1_id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    carregarDadosPartida();

    const canalJogo = supabase
      .channel(`jogo-realtime-${salaId}`, {
        config: { broadcast: { self: false } }
      })
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'domino_salas', filter: `id=eq.${salaId}` },
        async (payload) => {
          const newData = payload.new;
          if (newData) {
            if ((newData.jogador_1_id === null || newData.jogador_2_id === null) && newData.status === 'jogando') {
              supabase.removeChannel(canalJogo);
              setModalNotificacao({
                visivel: true,
                titulo: 'Adversário Desconectado',
                message: 'A partida foi encerrada porque o seu oponente deixou a sala.',
                tipo: 'erro'
              });
              return;
            }

            setJogador1Id(newData.jogador_1_id);
            setJogador2Id(newData.jogador_2_id);

            if (newData.jogador_1_id && newData.jogador_2_id && !pedrasInicializadas.current) {
              inicializarPedrasCompartilhadas(usuarioId, newData.jogador_1_id, newData.jogador_2_id);
            }

            setVezUsuarioId(newData.vez_usuario_id);
            setPassadasCount(newData.passadas_count || 0);
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
              
            setMesaPedras(jogadasProcessadas);
            setTempoRestante(30);
            processandoJogadaLocal.current = false;
          }
        }
      )
      .on('broadcast', { event: 'emoji' }, (payload) => {
        const { remetenteId, emoji } = payload.payload;
        if (remetenteId !== usuarioId) {
          const nomeRemetente = remetenteId === jogador1Id ? nomeJ1 : nomeJ2;
          setAlertaTemporario({
            visivel: true,
            mensagem: `💥 ${nomeRemetente} provocou você com: ${emoji}`
          });
        }
      })
      .subscribe();

    canalRef.current = canalJogo;

    return () => {
      supabase.removeChannel(canalJogo);
    };
  }, [salaId, mesaPedras.length, nomeJ1, nomeJ2, jogador1Id, jogador2Id]);

  const meuTurno = vezUsuarioId === usuarioId;
  const adversarioNome = usuarioId === jogador1Id ? nomeJ2 : nomeJ1;

  useEffect(() => {
    if (!meuTurno) return;

    const cronometro = setInterval(() => {
      setTempoRestante((tempo) => {
        if (tempo <= 1) {
          clearInterval(cronometro);
          setAlertaTemporario({ visivel: true, mensagem: '⏱️ Seu tempo esgotou! A vez foi passada.' });
          setPedraArrastando(null);
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
      const timer = setTimeout(() => { setAlertaTemporario(null); }, 3500);
      return () => clearTimeout(timer);
    }
  }, [alertaTemporario]);

  // AUTO-PASSAR QUANDO NÃO TEM PEDRA JOGÁVEL
  useEffect(() => {
    if (meuTurno && minhasPedras.length > 0 && mesaPedras.length > 0 && !processandoJogadaLocal.current) {
      const temQualquerPecaJogavel = minhasPedras.some(pedra => isPedraJogavel(pedra));

      if (!temQualquerPecaJogavel) {
        setAlertaTemporario({ visivel: true, mensagem: '⚠️ Sem peças jogáveis! Passando a vez...' });
        passarVez();
      }
    }
  }, [meuTurno, minhasPedras, mesaPedras, pontaEsquerda, pontaDireita]);

  // VITÓRIA AO BATER O JOGO
  useEffect(() => {
    if (minhasPedras.length === 0 && mesaPedras.length > 0) {
      tocarEfeitoSonoro('vitoria');
      setModalNotificacao({
        visivel: true,
        titulo: 'Parabéns, Você Venceu!',
        message: 'Você bateu o jogo!',
        tipo: 'fim'
      });
    }
  }, [minhasPedras]);

  const fecharModalNotificacao = () => {
    setModalNotificacao(prev => ({ ...prev, visivel: false }));
    sairDaPartidaLocal();
  };

  return (
    <div ref={containerRef} className="w-full h-screen bg-[#090610] text-white font-sans flex flex-col justify-between p-2 md:p-4 overflow-hidden select-none relative">
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
              <p className="text-[11px] text-gray-400 leading-relaxed">{modalNotificacao.message}</p>
            </div>
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-9 text-xs" onClick={fecharModalNotificacao}>OK, Entendi</Button>
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
              <p className="text-xs text-gray-400 leading-relaxed">Para garantir a melhor experiência, jogue em modo tela cheia.</p>
            </div>
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-11 shadow-lg shadow-purple-900/20" onClick={entrarModoJogoReal}>Ativar Tela Cheia</Button>
          </div>
        </div>
      )}
      
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between bg-[#110D1A]/95 border border-purple-950/40 px-3 py-1.5 rounded-xl shadow-lg h-[12%] z-30">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={sairDaPartida} className="text-gray-400 hover:text-white h-8 text-xs px-2">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Sair
          </Button>
          <span className="text-[10px] text-purple-300 font-bold bg-purple-950/50 px-2 py-0.5 rounded-full">Mesa {numeroSala}</span>
        </div>

        <div className="flex items-center gap-2 md:gap-4 bg-purple-950/20 px-2 md:px-4 py-1 rounded-xl border border-purple-900/20 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-purple-950/40 rounded-full border border-purple-900/30 text-purple-400">
              <User className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </div>
            <span className="max-w-[60px] md:max-w-[80px] truncate font-semibold text-gray-200">{nomeJ1}</span>
            <span>{vezUsuarioId === jogador1Id ? '🟢' : '⚫'}</span>
          </div>
          
          <div className="flex items-center gap-2 bg-[#170f2c] border border-purple-500/30 px-3 py-1.5 rounded-xl shadow-inner mx-1">
            {['😀', '🔥', '😡', '😂'].map((emoji) => (
              <button 
                key={emoji} 
                onClick={() => enviarEmoji(emoji)} 
                className="hover:scale-125 active:scale-95 transition-all text-base p-1.5 md:p-1 cursor-pointer touch-manipulation select-none"
              >
                {emoji}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-1.5">
            <span>{vezUsuarioId === jogador2Id ? '🟢' : '⚫'}</span>
            <span className="max-w-[60px] md:max-w-[80px] truncate font-semibold text-gray-200">{nomeJ2}</span>
            <div className="p-1 bg-purple-950/40 rounded-full border border-purple-900/30 text-purple-400">
              <User className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </div>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={isFullscreen ? sairModoJogoReal : entrarModoJogoReal} className="text-purple-400 hover:text-white w-8 h-8">
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>

      {/* TABULEIRO / MESA COM ÁREAS DE SOLTURA (DROP ZONES) */}
      <div className="flex-grow my-2 bg-emerald-950 border-[4px] border-amber-950 rounded-[24px] shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)] relative flex flex-col items-center justify-center h-[53%] overflow-hidden">
        {mesaPedras.length > 0 && (
          <div className="absolute top-2 left-4 flex items-center gap-3 text-[10px] font-semibold text-emerald-300/60">
            <span>Esquerda: <strong className="text-white bg-emerald-900/60 px-1.5 py-0.5 rounded text-xs">{pontaEsquerda}</strong></span>
            <span>Direita: <strong className="text-white bg-emerald-900/60 px-1.5 py-0.5 rounded text-xs">{pontaDireita}</strong></span>
          </div>
        )}

        {/* MENSAGEM INDICANDO COMO ARRASTAR */}
        {meuTurno && mesaPedras.length > 0 && (
          <div className="absolute top-2 z-20 text-[10px] text-emerald-300/70 bg-emerald-900/40 px-3 py-0.5 rounded-full flex items-center gap-1 font-semibold">
            <Move className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>Arraste a peça e solte na ponta desejada</span>
          </div>
        )}

        <div className="flex items-center justify-center gap-[2px] max-w-full overflow-x-auto px-4 py-2 relative w-full h-full">
          {mesaPedras.length === 0 ? (
            /* DROP ZONE MESA VAZIA */
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, 'esquerda')}
              className="w-48 h-24 border-2 border-dashed border-emerald-400/40 rounded-2xl flex flex-col items-center justify-center text-center text-emerald-300/60 font-bold text-xs p-4 bg-emerald-900/20 hover:bg-emerald-900/40 transition-all cursor-pointer"
            >
              <Move className="w-6 h-6 mb-1 text-amber-400 animate-bounce" />
              <span>Arraste e solte a primeira pedra aqui</span>
            </div>
          ) : (
            <>
              {/* DROP ZONE PONTA ESQUERDA */}
              <div
                onDragOver={(e) => handleDragOver(e, 'esquerda')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'esquerda')}
                className={`shrink-0 h-20 w-16 border-2 border-dashed rounded-xl flex items-center justify-center text-[10px] font-black transition-all mr-2 ${
                  sobreDropZone === 'esquerda'
                    ? 'border-green-400 bg-green-500/30 text-white scale-110 shadow-[0_0_15px_rgba(34,197,94,0.8)]'
                    : 'border-emerald-500/50 bg-emerald-900/30 text-emerald-300 hover:border-green-400'
                }`}
              >
                SOLTAR ESQ
              </div>

              {mesaPedras.map((pedra, idx) => {
                const ehBucha = pedra.ladoEsquerdo === pedra.ladoDireito;
                const limiteHorizontal = 7;
                
                const ehDobraEsquerda = mesaPedras.length > limiteHorizontal && idx === 0;
                const ehDobraDireita = mesaPedras.length > limiteHorizontal && idx === mesaPedras.length - 1;
                const deveFicarDeitada = !ehBucha && !ehDobraEsquerda && !ehDobraDireita;

                return (
                  <div key={idx} className="shrink-0 flex items-center justify-center transition-all duration-300">
                    <PedraClassica 
                      valor={pedra.valorOriginal} 
                      disabled={true} 
                      menor={true} 
                      deitada={deveFicarDeitada} 
                    />
                  </div>
                );
              })}

              {/* DROP ZONE PONTA DIREITA */}
              <div
                onDragOver={(e) => handleDragOver(e, 'direita')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'direita')}
                className={`shrink-0 h-20 w-16 border-2 border-dashed rounded-xl flex items-center justify-center text-[10px] font-black transition-all ml-2 ${
                  sobreDropZone === 'direita'
                    ? 'border-green-400 bg-green-500/30 text-white scale-110 shadow-[0_0_15px_rgba(34,197,94,0.8)]'
                    : 'border-emerald-500/50 bg-emerald-900/30 text-emerald-300 hover:border-green-400'
                }`}
              >
                SOLTAR DIR
              </div>
            </>
          )}
        </div>

        <div className="absolute bottom-2 bg-[#090610]/95 border border-purple-900/40 px-4 py-1 rounded-full text-[10px] font-bold tracking-wide">
          {meuTurno ? <span className="text-green-400 animate-pulse flex items-center gap-1.5"><Timer className="w-3.5 h-3.5" /> {tempoRestante}s - SUA VEZ!</span> : <span className="text-gray-400">Aguardando {adversarioNome}...</span>}
        </div>
      </div>

      {/* ÁREA DAS SUAS PEDRAS (MÃO ARRASTÁVEL) */}
      <div className="bg-[#110D1A]/95 border border-purple-950/40 p-2.5 rounded-2xl h-[30%] flex flex-col justify-between">
        <div className="flex items-center justify-between px-1 h-[25%]">
          <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Suas Pedras ({minhasPedras.length})</span>
          {pedraArrastando && (
            <span className="text-[10px] text-amber-400 font-bold animate-pulse">Arrastando: [{pedraArrastando}]</span>
          )}
        </div>
        <div className="flex justify-center items-center gap-1.5 overflow-x-auto h-[75%] py-1">
          {minhasPedras.map((pedra, idx) => (
            <div key={idx} className="shrink-0 scale-90 md:scale-100">
              <PedraClassica 
                valor={pedra} 
                onClick={() => tentarJogarPedraClique(pedra)} 
                onDragStart={(e) => handleDragStart(pedra, e)}
                disabled={!(meuTurno && isPedraJogavel(pedra))} 
                menor={true} 
                destacada={meuTurno && isPedraJogavel(pedra)} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
