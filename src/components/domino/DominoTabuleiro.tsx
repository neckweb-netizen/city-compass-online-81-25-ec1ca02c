import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Trophy, User, Maximize2, Minimize2, ShieldAlert, Award, Smile, Search } from 'lucide-react';
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

const AVATARES_PADROES = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Jack&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Emery&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=JD&backgroundColor=b1e2c6"
];

const LISTA_EMOJIS = ['🤫', '😂', '🥱', '🤡', '☠️'];

const obterAvatarUsuario = (fotoUrl: string | null | undefined, idUsuario: string | null | undefined) => {
  if (fotoUrl && fotoUrl !== "" && fotoUrl !== "NULL") {
    return fotoUrl;
  }
  if (!idUsuario) {
    return AVATARES_PADROES[0];
  }
  try {
    const idNumerico = idUsuario.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const indiceAvatar = idNumerico % 5;
    return AVATARES_PADROES[indiceAvatar];
  } catch (err) {
    return AVATARES_PADROES[0];
  }
};

const tocarSom = (tipo: 'jogar' | 'alerta' | 'passar' | 'emoji' | 'vitoria') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    const tempo = ctx.currentTime;

    if (tipo === 'jogar') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, tempo);
      osc.frequency.exponentialRampToValueAtTime(800, tempo + 0.1);
      gain.gain.setValueAtTime(0.15, tempo);
      gain.gain.exponentialRampToValueAtTime(0.01, tempo + 0.12);
      osc.start(tempo);
      osc.stop(tempo + 0.12);
    } else if (tipo === 'alerta') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(550, tempo);
      gain.gain.setValueAtTime(0.08, tempo);
      gain.gain.setValueAtTime(0, tempo + 0.08);
      gain.gain.setValueAtTime(0.08, tempo + 0.12);
      gain.gain.setValueAtTime(0, tempo + 0.2);
      osc.start(tempo);
      osc.stop(tempo + 0.2);
    } else if (tipo === 'passar') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, tempo);
      osc.frequency.linearRampToValueAtTime(120, tempo + 0.3);
      gain.gain.setValueAtTime(0.12, tempo);
      gain.gain.exponentialRampToValueAtTime(0.01, tempo + 0.3);
      osc.start(tempo);
      osc.stop(tempo + 0.3);
    } else if (tipo === 'emoji') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, tempo);
      osc.frequency.exponentialRampToValueAtTime(1100, tempo + 0.25);
      gain.gain.setValueAtTime(0.15, tempo);
      gain.gain.exponentialRampToValueAtTime(0.01, tempo + 0.25);
      osc.start(tempo);
      osc.stop(tempo + 0.25);
    } else if (tipo === 'vitoria') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, tempo);
      osc.frequency.setValueAtTime(659.25, tempo + 0.1);
      osc.frequency.setValueAtTime(783.99, tempo + 0.2);
      osc.frequency.setValueAtTime(1046.50, tempo + 0.3);
      gain.gain.setValueAtTime(0.2, tempo);
      gain.gain.exponentialRampToValueAtTime(0.01, tempo + 0.6);
      osc.start(tempo);
      osc.stop(tempo + 0.6);
    }
  } catch (err) {
    console.warn('Erro ao reproduzir áudio:', err);
  }
};

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
  const canalRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [jogador1Id, setJogador1Id] = useState<string | null>(null);
  const [jogador2Id, setJogador2Id] = useState<string | null>(null);
  const [nomeJ1, setNomeJ1] = useState('Jogador 1');
  const [nomeJ2, setNomeJ2] = useState('Jogador 2');
  const [fotoJ1, setFotoJ1] = useState<string | null>(null);
  const [fotoJ2, setFotoJ2] = useState<string | null>(null);
  const [vezUsuarioId, setVezUsuarioId] = useState<string | null>(null);
  const [procurandoFila, setProcurandoFila] = useState(false);
  
  const [minhasPedras, setMinhasPedras] = useState<string[]>([]);
  const [mesaPedras, setMesaPedras] = useState<PedraMesa[]>([]);
  const [pontaEsquerda, setPontaEsquerda] = useState<number | null>(null);
  const [pontaDireita, setPontaDireita] = useState<number | null>(null);

  const [tempoRestante, setTempoRestante] = useState(20);
  const [emojiAtivoJ1, setEmojiAtivoJ1] = useState<string | null>(null);
  const [emojiAtivoJ2, setEmojiAtivoJ2] = useState<string | null>(null);

  const [modalNotificacao, setModalNotificacao] = useState<{ visivel: boolean; titulo: string; mensagem: string; tipo: 'info' | 'erro' | 'fim' }>({
    visivel: false,
    titulo: '',
    mensagem: '',
    tipo: 'info'
  });

  const partidaJaIniciadaRef = useRef(false);

  // Verificação em tempo real: Ambos os jogadores precisam estar na sala para o jogo rodar
  const ambosJogadoresPresentes = jogador1Id !== null && jogador2Id !== null;

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
            console.log("Rotação de tela não suportada.");
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
          jogador_1:jogador_1_id ( nome, foto_url ),
          jogador_2:jogador_2_id ( nome, foto_url )
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
        setFotoJ1(data.jogador_1 ? (data.jogador_1 as any).foto_url : null);
        setFotoJ2(data.jogador_2 ? (data.jogador_2 as any).foto_url : null);
        setPontaEsquerda(data.mesa_ponta_esquerda);
        setPontaDireita(data.mesa_ponta_direita);

        if (data.jogador_1_id !== null && data.jogador_2_id !== null) {
          partidaJaIniciadaRef.current = true;
        }

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
      .channel(`jogo-realtime-${salaId}`, {
        config: { broadcast: { self: true } }
      })
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'domino_salas', filter: `id=eq.${salaId}` },
        (payload) => {
          const newData = payload.new;
          if (newData) {
            setVezUsuarioId(newData.vez_usuario_id);
            setPontaEsquerda(newData.mesa_ponta_esquerda);
            setPontaDireita(newData.mesa_ponta_direita);
            setJogador1Id(newData.jogador_1_id);
            setJogador2Id(newData.jogador_2_id);

            if (newData.jogador_1_id !== null && newData.jogador_2_id !== null) {
              partidaJaIniciadaRef.current = true;
            }

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
            tocarSom('jogar');

            if (partidaJaIniciadaRef.current && (newData.jogador_1_id === null || newData.jogador_2_id === null)) {
              tocarSom('vitoria');
              setModalNotificacao({
                visivel: true,
                titulo: 'Vitória por W.O.!',
                mensagem: 'Seu adversário abandonou a partida de dominó. Você venceu o jogo automaticamente!',
                tipo: 'fim'
              });
            }
          }
        }
      )
      .on('broadcast', { event: 'provocacao' }, (response) => {
        const payload = response.payload;
        if (payload.autorId === jogador1Id) {
          setEmojiAtivoJ1(payload.emoji);
          tocarSom('emoji');
          setTimeout(() => setEmojiAtivoJ1(null), 6000);
        } else if (payload.autorId === jogador2Id) {
          setEmojiAtivoJ2(payload.emoji);
          tocarSom('emoji');
          setTimeout(() => setEmojiAtivoJ2(null), 6000);
        }
      })
      .subscribe();

    canalRef.current = canalJogo;

    return () => {
      supabase.removeChannel(canalJogo);
    };
  }, [salaId, jogador1Id, jogador2Id]);

  const meuTurno = vezUsuarioId === usuarioId && ambosJogadoresPresentes;
  const adversarioNome = usuarioId === jogador1Id ? nomeJ2 : nomeJ1;

  const isPedraJogavel = (pedra: string) => {
    if (mesaPedras.length === 0) return true;
    const [ladoA, ladoB] = pedra.split('-').map(Number);
    return ladoA === pontaEsquerda || ladoB === pontaEsquerda || ladoA === pontaDireita || ladoB === pontaDireita;
  };

  useEffect(() => {
    if (ambosJogadoresPresentes) {
      setTempoRestante(20);
    }
  }, [vezUsuarioId, ambosJogadoresPresentes]);

  // CORREÇÃO: O relógio e contagem regressiva só diminuem se os dois usuários estiverem na mesa
  useEffect(() => {
    if (!vezUsuarioId || !ambosJogadoresPresentes) return;

    const tick = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          if (meuTurno) {
            passarVez();
          }
          return 20;
        }
        if (prev === 6) {
          tocarSom('alerta');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [vezUsuarioId, meuTurno, ambosJogadoresPresentes]);

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
      tocarSom('vitoria');
      setModalNotificacao({
        visivel: true,
        titulo: 'Parabéns, Você Venceu!',
        mensagem: 'Você bateu o jogo e jogou todas as suas pedras na mesa de dominó.',
        tipo: 'fim'
      });
    }
  }, [minhasPedras]);

  const tentarJogarPedra = async (pedra: string) => {
    if (!meuTurno || !ambosJogadoresPresentes) return;

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
    const proximoTurnoId = usuarioId === jogador1Id ? jogador2Id : jogador1Id;
    tocarSom('passar');
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

  const lidarComSaidaVoluntaria = async () => {
    try {
      const updates: any = {
        jogador_1_id: null,
        jogador_2_id: null,
        historico_jogadas: []
      };
      
      await supabase
        .from('domino_salas')
        .update(updates)
        .eq('id', salaId);

      sairModoJogoReal();
      onVoltarAoLobby();
    } catch (err) {
      console.error('Erro ao processar abandono de partida:', err);
      sairModoJogoReal();
      onVoltarAoLobby();
    }
  };

  const enviarProvocacao = (emoji: string) => {
    if (canalRef.current) {
      canalRef.current.send({
        type: 'broadcast',
        event: 'provocacao',
        payload: { autorId: usuarioId, emoji }
      });
    }
  };

  const fecharModalNotificacao = async () => {
    setModalNotificacao(prev => ({ ...prev, visivel: false }));
    try {
      await supabase
        .from('domino_salas')
        .update({
          jogador_1_id: null,
          jogador_2_id: null,
          historico_jogadas: []
        })
        .eq('id', salaId);
    } catch (err) {
      console.warn("Falha ao redefinir sala:", err);
    }
    sairModoJogoReal();
    onVoltarAoLobby();
  };

  const alternarProcuraFila = () => {
    setProcurandoFila(!procurandoFila);
    tocarSom('emoji');
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-screen bg-[#090610] text-white font-sans flex flex-col justify-between p-2 md:p-4 overflow-hidden select-none relative"
    >
      {modalNotificacao.visivel && (
        <div className="absolute inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
          <div className="max-w-sm bg-[#110D1A] border border-purple-950/60 p-8 rounded-2xl shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-150 relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl" />

            <div className="p-4 bg-purple-950/40 border border-purple-900/30 rounded-full w-fit mx-auto text-purple-400">
              {modalNotificacao.tipo === 'fim' ? (
                <Award className="w-12 h-12 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)] animate-bounce" />
              ) : (
                <ShieldAlert className="w-12 h-12 text-purple-400" />
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="font-extrabold text-xl text-white tracking-wide">
                {modalNotificacao.titulo}
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed px-2">
                {modalNotificacao.mensagem}
              </p>
            </div>
            
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-11 text-xs rounded-xl shadow-lg shadow-purple-900/30 transition-all hover:scale-[1.02]"
              onClick={fecharModalNotificacao}
            >
              Confirmar e Voltar ao Lobby
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
      <div className="flex items-center justify-between bg-[#110D1A]/95 border border-purple-950/40 px-3 py-1.5 rounded-xl shadow-lg h-[12%] relative gap-2">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={lidarComSaidaVoluntaria} 
            className="text-gray-400 hover:text-white h-8 text-xs px-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Sair
          </Button>
          <span className="text-[10px] text-purple-300 font-bold bg-purple-950/50 px-2 py-0.5 rounded-full hidden sm:inline">
            Mesa {numeroSala}
          </span>
        </div>

        <div className="flex items-center">
          <Button
            size="sm"
            onClick={alternarProcuraFila}
            className={`font-bold text-[10px] h-8 px-3 rounded-lg shadow-md transition-all flex items-center gap-1.5 ${
              procurandoFila 
                ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {procurandoFila ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" /> Buscando...
              </>
            ) : (
              <>
                <Search className="w-3 h-3" /> Procurar Partida
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 bg-purple-950/20 px-2 sm:px-3 py-1 rounded-lg border border-purple-900/10 text-[11px] sm:text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2 relative">
            <div className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${vezUsuarioId === jogador1Id && ambosJogadoresPresentes ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
            <div className="relative">
              <img 
                src={obterAvatarUsuario(fotoJ1, jogador1Id)} 
                alt={nomeJ1} 
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-purple-500/50 object-cover bg-[#222]" 
                onError={(e) => { (e.target as HTMLImageElement).src = AVATARES_PADROES[0]; }}
              />
              {emojiAtivoJ1 && (
                <div className="absolute -top-10 -left-2 bg-purple-600 text-white p-1.5 rounded-full text-lg animate-bounce shadow-lg border border-purple-400 z-50">
                  {emojiAtivoJ1}
                </div>
              )}
            </div>
            <span className="max-w-[50px] sm:max-w-[70px] truncate font-medium">{nomeJ1}</span>
          </div>

          <span className="text-purple-500 font-bold text-[9px] sm:text-[10px]">VS</span>

          <div className="flex items-center gap-1.5 sm:gap-2 relative">
            <span className="max-w-[50px] sm:max-w-[70px] truncate font-medium">{nomeJ2}</span>
            <div className="relative">
              <img 
                src={obterAvatarUsuario(fotoJ2, jogador2Id)} 
                alt={nomeJ2} 
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-purple-500/50 object-cover bg-[#222]" 
                onError={(e) => { (e.target as HTMLImageElement).src = AVATARES_PADROES[1]; }}
              />
              {emojiAtivoJ2 && (
                <div className="absolute -top-10 -right-2 bg-purple-600 text-white p-1.5 rounded-full text-lg animate-bounce shadow-lg border border-purple-400 z-50">
                  {emojiAtivoJ2}
                </div>
              )}
            </div>
            <div className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${vezUsuarioId === jogador2Id && ambosJogadoresPresentes ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
          </div>
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={isFullscreen ? sairModoJogoReal : entrarModoJogoReal} 
          className="text-purple-400 hover:text-white w-8 h-8 hidden sm:flex"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>

      {/* 2. MESA DE JOGO */}
      <div className="flex-grow my-1 bg-emerald-950 border-[4px] border-amber-950 rounded-[24px] shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)] relative flex flex-col items-center justify-center h-[53%] overflow-hidden">
        
        {mesaPedras.length > 0 && (
          <div className="absolute top-2 left-4 flex items-center gap-3 text-[10px] font-semibold text-emerald-300/60">
            <span>Esquerda: <strong className="text-white bg-emerald-900/60 px-1.5 py-0.5 rounded text-xs">{pontaEsquerda}</strong></span>
            <span>Direita: <strong className="text-white bg-emerald-900/60 px-1.5 py-0.5 rounded text-xs">{pontaDireita}</strong></span>
          </div>
        )}

        <div className="flex items-center justify-center gap-0 max-w-full overflow-x-auto px-4 py-2">
          {/* CORREÇÃO DA RENDERIZAÇÃO DAS PEDRAS (ServerValor removido) */}
          {mesaPedras.length === 0 ? (
            <div className="text-center text-emerald-300/30 font-bold uppercase tracking-widest text-xs py-6">
              {ambosJogadoresPresentes ? (
                <>
                  Mesa de Dominó Limpa<br />
                  <span className="text-[10px] font-normal lowercase">Seu turno! Jogue a primeira pedra.</span>
                </>
              ) : (
                <span className="text-amber-500 animate-pulse">Aguardando oponente para iniciar...</span>
              )}
            </div>
          ) : (
            mesaPedras.map((pedra, idx) => {
              if (!pedra || !pedra.valorOriginal) return null;
              const [ladoA, ladoB] = pedra.valorOriginal.split('-').map(Number);
              const isBucha = ladoA === ladoB;

              return (
                <div key={idx} className={`shrink-0 flex items-center justify-center ${idx > 0 ? '-ml-2' : ''}`}>
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

        <div className="absolute left-3 bottom-3 flex items-center gap-1.5 bg-black/60 border border-purple-900/30 p-1.5 rounded-full shadow-lg">
          <Smile className="w-3.5 h-3.5 text-purple-400 ml-1" />
          {LISTA_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => enviarProvocacao(emoji)}
              className="hover:scale-125 transition-transform duration-100 text-sm active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* BARRA DO TEMPO CONDICIONADA */}
        <div className="absolute bottom-2 right-3 bg-[#090610]/95 border border-purple-900/40 px-4 py-1.5 rounded-2xl flex flex-col items-center justify-center gap-1 min-w-[130px]">
          <div className="text-[10px] font-bold tracking-wide">
            {!ambosJogadoresPresentes ? (
              <span className="text-amber-500 animate-pulse">AGUARDANDO...</span>
            ) : meuTurno ? (
              <span className="text-green-400 animate-pulse flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> SUA VEZ ({tempoRestante}s)
              </span>
            ) : (
              <span className="text-gray-400">Tempo de {adversarioNome}: {tempoRestante}s</span>
            )}
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${
                !ambosJogadoresPresentes ? 'bg-gray-600' : tempoRestante > 10 ? 'bg-green-500' : tempoRestante > 4 ? 'bg-amber-500' : 'bg-red-500'
              }`} 
              style={{ width: `${!ambosJogadoresPresentes ? 100 : (tempoRestante / 20) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. MINHA MÃO */}
      <div className="bg-[#110D1A]/95 border border-purple-950/40 p-2.5 rounded-2xl h-[30%] flex flex-col justify-between">
        <div className="flex items-center justify-between px-1 h-[25%]">
          <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Suas Pedras ({minhasPedras.length})</span>
        </div>

        <div className="flex justify-center items-center gap-1.5 overflow-x-auto h-[75%] py-1">
          {minhasPedras.map((pedra, idx) => {
            const jogavel = meuTurno && isPedraJogavel(pedra) && ambosJogadoresPresentes;

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

export default DominoTabuleiro;
