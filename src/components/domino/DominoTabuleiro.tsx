import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Trophy, User, Maximize2, Minimize2, ShieldAlert, Award, MessageSquare, Timer, Move, ExternalLink } from 'lucide-react';
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

interface BannerPublicitario {
  id: string;
  titulo: string;
  imagem_url: string;
  link_url?: string | null;
  ativo: boolean;
  secao?: string;
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

// PEDRA COM PROTEÇÃO ANTI-DARKMODE DO NAVEGADOR
const PedraClassica = ({ 
  valor, 
  disabled, 
  menor = false, 
  deitada = false,
  destacada = false,
  onDragStart,
  onTouchStart
}: { 
  valor: string; 
  disabled?: boolean; 
  menor?: boolean; 
  deitada?: boolean;
  destacada?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
}) => {
  const safeValor = valor || '0-0';
  const [ladoA, ladoB] = safeValor.split('-').map(Number);

  const renderBolinhas = (pontos: number) => {
    const posicoes: Record<number, number[]> = {
      0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
    };

    const ativas = posicoes[pontos] || [];
    const tamanhoBolinha = menor ? 'w-1 h-1 sm:w-1.5 sm:h-1.5' : 'w-1.5 h-1.5 sm:w-2 sm:h-2';
    const espacamentoGrid = menor ? 'gap-0.5 p-0.5' : 'gap-0.5 p-1';

    return (
      <div className={`grid grid-cols-3 ${espacamentoGrid} h-full w-full items-center justify-items-center pointer-events-none`}>
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className={`${tamanhoBolinha} rounded-full transition-all`}
            style={{
              backgroundColor: ativas.includes(i) ? '#000000' : 'transparent',
              forcedColorAdjust: 'none',
              filter: 'none'
            }}
          />
        ))}
      </div>
    );
  };

  const classesTamanho = deitada
    ? (menor ? "w-12 h-6 sm:w-14 sm:h-7 border-2 flex-row" : "w-16 h-8 sm:w-18 sm:h-9 border-2 flex-row")
    : (menor ? "w-6 h-12 sm:w-7 sm:h-14 border-2 flex-col" : "w-8 h-16 sm:w-9 sm:h-18 border-2 flex-col");

  return (
    <div
      draggable={!disabled && !!onDragStart}
      onDragStart={onDragStart}
      onTouchStart={onTouchStart}
      className={`${classesTamanho} rounded-md flex items-center justify-between relative transition-all touch-none select-none ${
        destacada 
          ? 'border-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.9)] scale-105 animate-pulse cursor-grab active:cursor-grabbing z-10' 
          : disabled
            ? 'opacity-100'
            : 'opacity-40 cursor-not-allowed'
      }`}
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: '#9CA3AF',
        colorScheme: 'only light',
        forcedColorAdjust: 'none',
        filter: 'none',
        WebkitFilter: 'none',
        boxShadow: '0 2px 5px rgba(0,0,0,0.4)'
      }}
    >
      <div className="flex-1 w-full h-full flex items-center justify-center pointer-events-none" style={{ filter: 'none' }}>
        {renderBolinhas(ladoA)}
      </div>
      <div 
        className={deitada ? "h-[90%] w-[2px] rounded-full pointer-events-none" : "w-[90%] h-[2px] rounded-full pointer-events-none"} 
        style={{ backgroundColor: '#D97706', filter: 'none' }}
      />
      <div className="flex-1 w-full h-full flex items-center justify-center pointer-events-none" style={{ filter: 'none' }}>
        {renderBolinhas(ladoB)}
      </div>
    </div>
  );
};

export const DominoTabuleiro = ({ usuarioId, salaId, numeroSala, onVoltarAoLobby }: DominoTabuleiroProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canalRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(true);
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

  const [pedraArrastando, setPedraArrastando] = useState<string | null>(null);
  const [sobreDropZone, setSobreDropZone] = useState<'esquerda' | 'direita' | null>(null);
  const [touchPosicao, setTouchPosicao] = useState<{ x: number; y: number } | null>(null);

  const [bannerAtivo, setBannerAtivo] = useState<BannerPublicitario | null>(null);

  const [tempoRestante, setTempoRestante] = useState<number>(30);
  
  const processandoJogadaLocal = useRef(false);
  const pedrasInicializadas = useRef(false);

  const [modalNotificacao, setModalNotificacao] = useState<{ visivel: boolean; titulo: string; message: string; tipo: 'info' | 'erro' | 'fim' }>({
    visivel: false, titulo: '', message: '', tipo: 'info'
  });

  const [alertaTemporario, setAlertaTemporario] = useState<{ visivel: boolean; mensagem: string } | null>(null);

  const keyStoragePedras = `domino_pedras_sala_${salaId}_usr_${usuarioId}`;

  // BUSCA EXATA NA TABELA 'banners_publicitarios'
  useEffect(() => {
    const buscarBannerDomino = async () => {
      try {
        const { data, error } = await supabase
          .from('banners_publicitarios')
          .select('id, titulo, imagem_url, link_url, ativo, ordem, secao')
          .eq('secao', 'domino' as any)
          .eq('ativo', true)
          .order('ordem', { ascending: true })
          .limit(1);

        if (!error && data && data.length > 0) {
          setBannerAtivo(data[0] as BannerPublicitario);
        } else {
          const { data: todos } = await supabase
            .from('banners_publicitarios')
            .select('*')
            .eq('ativo', true);

          if (todos && todos.length > 0) {
            const achado = todos.find((b: any) => 
              String(b.secao).toLowerCase().trim() === 'domino'
            );
            if (achado) {
              setBannerAtivo(achado as BannerPublicitario);
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar banner publicitário:', err);
      }
    };

    buscarBannerDomino();
  }, []);

  // ESCUTADOR DE MUDANÇA DE FULLSCREEN REAL DO NAVEGADOR
  useEffect(() => {
    const checarFullscreenReal = () => {
      const emFullscreenNativo = !!document.fullscreenElement || !!(document as any).webkitFullscreenElement;
      setIsFullscreen(emFullscreenNativo);
    };

    checarFullscreenReal();
    document.addEventListener('fullscreenchange', checarFullscreenReal);
    document.addEventListener('webkitfullscreenchange', checarFullscreenReal);

    return () => {
      document.removeEventListener('fullscreenchange', checarFullscreenReal);
      document.removeEventListener('webkitfullscreenchange', checarFullscreenReal);
    };
  }, []);

  const atualizarMinhasPedras = (novasPedras: string[]) => {
    setMinhasPedras(novasPedras);
    try {
      localStorage.setItem(keyStoragePedras, JSON.stringify(novasPedras));
    } catch (e) {
      console.warn('Erro ao salvar pedras no storage:', e);
    }
  };

  // NATIVO TELA CHEIA COMPLETO SEM ROTAÇÃO
  const alternarFullscreenModo = async () => {
    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        if (containerRef.current) {
          if (containerRef.current.requestFullscreen) {
            await containerRef.current.requestFullscreen();
          } else if ((containerRef.current as any).webkitRequestFullscreen) {
            await (containerRef.current as any).webkitRequestFullscreen();
          }
        }
        setIsFullscreen(true);
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock().catch(() => {});
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Erro ao alternar fullscreen:', err);
      setIsFullscreen(prev => !prev);
    }
  };

  const sairDaPartidaLocal = () => {
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      localStorage.removeItem(keyStoragePedras);
    } catch (e) {}
    onVoltarAoLobby();
  };

  // BOTÃO DE SAIR CORRIGIDO: INSTANTÂNEO NO PRIMEIRO CLIQUE
  const sairDaPartida = () => {
    sairDaPartidaLocal();

    // Executa em segundo plano para não travar a ação do usuário
    (async () => {
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
      } catch (err) {
        console.warn('Erro ao atualizar saída da sala:', err);
      }
    })();
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

  // PASSE INSTANTÂNEO
  const passarVez = async () => {
    if (processandoJogadaLocal.current) return;
    processandoJogadaLocal.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setVezUsuarioId(null);

    const proximoTurnoId = usuarioId === jogador1Id ? jogador2Id : jogador1Id;
    const novaContagemPassadas = passadasCount + 1;

    tocarEfeitoSonoro('passar');

    try {
      if (novaContagemPassadas >= 2) {
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
    } finally {
      processandoJogadaLocal.current = false;
    }
  };

  // EXECUÇÃO RIGOROSA DA JOGADA
  const executarJogadaNaPonta = async (pedra: string, ladoEscolha: 'esquerda' | 'direita') => {
    if (!meuTurno || processandoJogadaLocal.current || !isFullscreen) return;
    processandoJogadaLocal.current = true;
    setPedraArrastando(null);
    setTouchPosicao(null);
    setSobreDropZone(null);

    tocarEfeitoSonoro('jogar');

    const [ladoA, ladoB] = pedra.split('-').map(Number);
    let novaMesa = [...mesaPedras];
    let novaPontaE = pontaEsquerda;
    let novaPontaD = pontaDireita;

    if (mesaPedras.length === 0) {
      const novaPedra: PedraMesa = { valorOriginal: `${ladoA}-${ladoB}`, ladoEsquerdo: ladoA, ladoDireito: ladoB };
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
      const restoDasPedras = minhasPedras.filter(p => p !== pedra);
      atualizarMinhasPedras(restoDasPedras);
      setMesaPedras(novaMesa);
      setPontaEsquerda(novaPontaE);
      setPontaDireita(novaPontaD);
      setVezUsuarioId(proximoTurnoId);

      if (canalRef.current) {
        canalRef.current.send({
          type: 'broadcast',
          event: 'jogada_realizada',
          payload: { mesa: novaMesa, pontaE: novaPontaE, pontaD: novaPontaD, vezId: proximoTurnoId }
        });
      }

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
    } catch (err) {
      console.error(err);
      carregarDadosPartida();
    } finally {
      processandoJogadaLocal.current = false;
    }
  };

  // DESKTOP DRAG
  const handleDragStart = (pedra: string, e: React.DragEvent) => {
    if (!meuTurno || !isPedraJogavel(pedra) || !isFullscreen) return;
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
      validaESoltaPedra(pedra, lado);
    }
  };

  // TOUCH MOBILE
  const handleTouchStart = (pedra: string, e: React.TouchEvent) => {
    if (!meuTurno || !isPedraJogavel(pedra) || !isFullscreen) return;
    const touch = e.touches[0];
    setPedraArrastando(pedra);
    setTouchPosicao({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!pedraArrastando) return;
    const touch = e.touches[0];
    setTouchPosicao({ x: touch.clientX, y: touch.clientY });

    const elementoSobOToque = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZona = elementoSobOToque?.closest('[data-dropzone]');
    if (dropZona) {
      const lado = dropZona.getAttribute('data-dropzone') as 'esquerda' | 'direita';
      setSobreDropZone(lado);
    } else {
      setSobreDropZone(null);
    }
  };

  const handleTouchEnd = () => {
    if (!pedraArrastando) return;

    if (sobreDropZone) {
      validaESoltaPedra(pedraArrastando, sobreDropZone);
    }

    setPedraArrastando(null);
    setTouchPosicao(null);
    setSobreDropZone(null);
  };

  useEffect(() => {
    if (pedraArrastando) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pedraArrastando, sobreDropZone]);

  const validaESoltaPedra = (pedra: string, lado: 'esquerda' | 'direita') => {
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
  };

  // EMBARALHAMENTO SEGURO DE 7 PEDRAS INICIAIS
  const inicializarPedrasCompartilhadas = useCallback((userId: string, j1: string | null, j2: string | null, mesaVazia: boolean) => {
    if (pedrasInicializadas.current || !j1 || !j2) return;

    if (mesaVazia) {
      try { localStorage.removeItem(keyStoragePedras); } catch (e) {}
    } else {
      try {
        const pedrasSalvas = localStorage.getItem(keyStoragePedras);
        if (pedrasSalvas) {
          const pedrasArray = JSON.parse(pedrasSalvas);
          if (Array.isArray(pedrasArray) && pedrasArray.length > 0) {
            pedrasInicializadas.current = true;
            setMinhasPedras(pedrasArray);
            return;
          }
        }
      } catch (e) {
        console.warn('Erro ao ler pedras salvas:', e);
      }
    }

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

    let pedrasIniciais: string[] = [];
    if (userId === j1) {
      pedrasIniciais = pool.slice(0, 7);
    } else if (userId === j2) {
      pedrasIniciais = pool.slice(7, 14);
    }

    atualizarMinhasPedras(pedrasIniciais);
  }, [salaId, keyStoragePedras]);

  const carregarDadosPartida = useCallback(async () => {
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
        inicializarPedrasCompartilhadas(usuarioId, data.jogador_1_id, data.jogador_2_id, jogadasProcessadas.length === 0);

        if (!data.vez_usuario_id && data.jogador_1_id) {
          await supabase.from('domino_salas').update({ vez_usuario_id: data.jogador_1_id }).eq('id', salaId);
          setVezUsuarioId(data.jogador_1_id);
        }
      }
    } catch (err) {
      console.error('Erro em carregarDadosPartida:', err);
    }
  }, [salaId, usuarioId, inicializarPedrasCompartilhadas]);

  // CANAL REALTIME + BROADCAST ESTÁVEL
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

            if (newData.jogador_1_id && newData.jogador_2_id && !pedrasInicializadas.current) {
              inicializarPedrasCompartilhadas(usuarioId, newData.jogador_1_id, newData.jogador_2_id, jogadasProcessadas.length === 0);
            }

            setVezUsuarioId(newData.vez_usuario_id);
            const passadas = newData.passadas_count || 0;
            setPassadasCount(passadas);
            setPontaEsquerda(newData.mesa_ponta_esquerda);
            setPontaDireita(newData.mesa_ponta_direita);

            if (passadas >= 2) {
              tocarEfeitoSonoro('empate');
              setModalNotificacao({
                visivel: true,
                titulo: 'Jogo Trancado!',
                message: 'Ambos os jogadores não possuem peças jogáveis. Partida empatada!',
                tipo: 'info'
              });
            }

            setMesaPedras(jogadasProcessadas);
            setTempoRestante(30);
            processandoJogadaLocal.current = false;
          }
        }
      )
      .on('broadcast', { event: 'jogada_realizada' }, (payload) => {
        const { mesa, pontaE, pontaD, vezId } = payload.payload;
        if (mesa) setMesaPedras(mesa);
        if (pontaE !== undefined) setPontaEsquerda(pontaE);
        if (pontaD !== undefined) setPontaDireita(pontaD);
        if (vezId) setVezUsuarioId(vezId);
        setTempoRestante(30);
      })
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
  }, [salaId, usuarioId, carregarDadosPartida, inicializarPedrasCompartilhadas, jogador1Id, jogador2Id, nomeJ1, nomeJ2]);

  const meuTurno = vezUsuarioId === usuarioId;
  const adversarioNome = usuarioId === jogador1Id ? nomeJ2 : nomeJ1;

  // CRONÔMETRO
  useEffect(() => {
    if (!meuTurno || !isFullscreen) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    setTempoRestante(30);

    timerRef.current = setInterval(() => {
      setTempoRestante((tempo) => {
        if (tempo <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setAlertaTemporario({ visivel: true, mensagem: '⏱️ Seu tempo esgotou! A vez foi passada.' });
          setPedraArrastando(null);
          setTouchPosicao(null);
          passarVez();
          return 30;
        }
        return tempo - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [meuTurno, vezUsuarioId, isFullscreen]);

  useEffect(() => {
    if (alertaTemporario && alertaTemporario.visivel) {
      const timer = setTimeout(() => { setAlertaTemporario(null); }, 3500);
      return () => clearTimeout(timer);
    }
  }, [alertaTemporario]);

  // AUTO-PASSE INSTANTÂNEO
  useEffect(() => {
    if (meuTurno && minhasPedras.length > 0 && mesaPedras.length > 0 && !processandoJogadaLocal.current && isFullscreen) {
      const temQualquerPecaJogavel = minhasPedras.some(pedra => isPedraJogavel(pedra));

      if (!temQualquerPecaJogavel) {
        setAlertaTemporario({ visivel: true, mensagem: '⚠️ Sem peças! Passando a vez instantaneamente...' });
        passarVez();
      }
    }
  }, [meuTurno, minhasPedras, mesaPedras, pontaEsquerda, pontaDireita, isFullscreen]);

  // VITÓRIA
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

  // CÁLCULO DE ESCALONAMENTO PRECISO PARA MODO VERTICAL E PAISAGEM
  const getEscalaMesa = () => {
    const qtd = mesaPedras.length;
    if (qtd <= 3) return 'scale-90 sm:scale-100';
    if (qtd <= 5) return 'scale-75 sm:scale-90';
    if (qtd <= 8) return 'scale-60 sm:scale-75';
    if (qtd <= 11) return 'scale-45 sm:scale-65';
    return 'scale-35 sm:scale-50';
  };

  return (
    <div 
      ref={containerRef} 
      className={`w-screen bg-[#090610] text-white font-sans flex flex-col justify-between p-1 sm:p-3 overflow-hidden select-none relative ${
        isFullscreen ? 'fixed inset-0 z-[99999] h-[100dvh] w-screen' : 'h-screen'
      }`}
      style={{ forcedColorAdjust: 'none', filter: 'none' }}
    >
      {/* ELEMENTO FLUTUANTE SEGUINDO O DEDO NO TOUCH */}
      {touchPosicao && pedraArrastando && (
        <div 
          className="fixed z-[100000] pointer-events-none transform -translate-x-1/2 -translate-y-1/2 scale-110 shadow-[0_0_20px_rgba(168,85,247,0.9)] rounded-lg bg-purple-900 border-2 border-purple-400"
          style={{ left: `${touchPosicao.x}px`, top: `${touchPosicao.y}px` }}
        >
          <PedraClassica valor={pedraArrastando} disabled={false} menor={true} destacada={true} />
        </div>
      )}

      {/* AVISO FLUTUANTE AJUSTADO */}
      {alertaTemporario && alertaTemporario.visivel && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[60] bg-purple-950/95 border-2 border-purple-500 text-white px-3 py-1 rounded-2xl shadow-[0_4px_15px_rgba(147,51,234,0.4)] flex items-center gap-1.5 text-[10px] sm:text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-200 whitespace-nowrap">
          <MessageSquare className="w-3 h-3 text-purple-400 animate-pulse" />
          <span>{alertaTemporario.mensagem}</span>
        </div>
      )}

      {modalNotificacao.visivel && (
        <div className="absolute inset-0 bg-black/80 z-[10500] flex items-center justify-center p-4">
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

      {/* CABEÇALHO COMPACTO E ADAPTÁVEL SEM CORTES */}
      <div className="flex items-center justify-between bg-[#110D1A]/95 border border-purple-950/40 px-1.5 sm:px-3 py-1 rounded-xl shadow-lg h-[8%] min-h-[36px] z-30 w-full gap-1">
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" onClick={sairDaPartida} className="text-gray-400 hover:text-white h-7 text-[10px] sm:text-xs px-1 sm:px-2 cursor-pointer active:scale-95">
            <ArrowLeft className="w-3 h-3 mr-0.5" /> Sair
          </Button>
          <span className="text-[8px] sm:text-[10px] text-purple-300 font-bold bg-purple-950/50 px-1.5 py-0.5 rounded-full shrink-0">Mesa {numeroSala}</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 bg-purple-950/20 px-1 sm:px-2 py-0.5 rounded-xl border border-purple-900/20 text-[10px] shrink overflow-hidden max-w-full">
          <div className="flex items-center gap-0.5 shrink">
            <div className="p-0.5 bg-purple-950/40 rounded-full border border-purple-900/30 text-purple-400 shrink-0">
              <User className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </div>
            <span className="max-w-[32px] sm:max-w-[60px] truncate font-semibold text-gray-200">{nomeJ1}</span>
            <span className="text-[8px]">{vezUsuarioId === jogador1Id ? '🟢' : '⚫'}</span>
          </div>
          
          <div className="flex items-center gap-0.5 bg-[#170f2c] border border-purple-500/30 px-1 py-0.5 rounded-lg shadow-inner shrink-0">
            {['😀', '🔥', '😡', '😂'].map((emoji) => (
              <button 
                key={emoji} 
                onClick={() => enviarEmoji(emoji)} 
                className="hover:scale-125 active:scale-95 transition-all text-[10px] sm:text-xs p-0.5 cursor-pointer touch-manipulation select-none"
              >
                {emoji}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-0.5 shrink">
            <span className="text-[8px]">{vezUsuarioId === jogador2Id ? '🟢' : '⚫'}</span>
            <span className="max-w-[32px] sm:max-w-[60px] truncate font-semibold text-gray-200">{nomeJ2}</span>
            <div className="p-0.5 bg-purple-950/40 rounded-full border border-purple-900/30 text-purple-400 shrink-0">
              <User className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </div>
          </div>
        </div>

        {/* BOTÃO CLARO E EXPLÍCITO DE TELA CHEIA */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={alternarFullscreenModo} 
          className="bg-purple-950/60 hover:bg-purple-900 border-purple-500/40 text-purple-200 hover:text-white h-7 text-[9px] sm:text-[10px] font-bold px-2 rounded-lg shrink-0 flex items-center gap-1 cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-3 h-3 text-purple-400" /> : <Maximize2 className="w-3 h-3 text-purple-400" />}
          <span>{isFullscreen ? 'Sair Full' : 'Tela Cheia'}</span>
        </Button>
      </div>

      {/* ÁREA DO BANNER PUBLICITÁRIO - ALTURA ULTRA-COMPACTA PERFECT FIT */}
      {bannerAtivo && (
        <div className="w-full flex justify-center items-center my-0.5 px-0.5 shrink-0 z-20">
          {bannerAtivo.link_url ? (
            <a 
              href={bannerAtivo.link_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full max-w-xs sm:max-w-md h-8 sm:h-10 md:h-12 rounded-lg overflow-hidden border border-purple-500/30 shadow-md relative group block bg-[#110D1A]"
            >
              <img 
                src={bannerAtivo.imagem_url} 
                alt={bannerAtivo.titulo} 
                className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-all duration-300"
              />
              <div className="absolute top-0.5 right-0.5 z-20 bg-black/60 backdrop-blur-md p-0.5 rounded-full text-white/80">
                <ExternalLink className="w-2 h-2" />
              </div>
            </a>
          ) : (
            <div className="w-full max-w-xs sm:max-w-md h-8 sm:h-10 md:h-12 rounded-lg overflow-hidden border border-purple-500/30 shadow-md relative bg-[#110D1A]">
              <img 
                src={bannerAtivo.imagem_url} 
                alt={bannerAtivo.titulo} 
                className="w-full h-full object-cover object-center"
              />
            </div>
          )}
        </div>
      )}

      {/* TABULEIRO / MESA - ENQUADRADO E SEM EXCEDER AS BORDAS */}
      <div className="flex-grow my-0.5 bg-emerald-950 border-[3px] sm:border-[4px] border-amber-950 rounded-[20px] shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)] relative flex flex-col items-center justify-center overflow-hidden w-full">
        
        {/* OVERLAY OBRIGATÓRIO: COBRE APENAS A MESA DE JOGO (TABULEIRO) */}
        {!isFullscreen && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-[50] flex flex-col items-center justify-center p-4 text-center space-y-3 animate-in fade-in duration-200">
            <div className="p-3 bg-purple-950/60 border border-purple-500/40 rounded-full text-purple-400">
              <Maximize2 className="w-7 h-7 animate-bounce" />
            </div>
            <div className="space-y-1 max-w-xs">
              <h2 className="text-sm sm:text-base font-bold text-white">Modo Tela Cheia Obrigatório</h2>
              <p className="text-[10px] sm:text-xs text-gray-300 leading-relaxed">
                Ative a tela cheia para jogar no tabuleiro.
              </p>
            </div>
            <Button 
              onClick={alternarFullscreenModo}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 h-9 text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Ativar Tela Cheia Para Jogar</span>
            </Button>
          </div>
        )}

        {mesaPedras.length > 0 && (
          <div className="absolute top-1.5 left-2 sm:left-4 flex items-center gap-2 text-[9px] sm:text-[10px] font-semibold text-emerald-300/60 z-10">
            <span>Esq: <strong className="text-white bg-emerald-900/60 px-1 py-0.5 rounded text-[10px]">{pontaEsquerda}</strong></span>
            <span>Dir: <strong className="text-white bg-emerald-900/60 px-1 py-0.5 rounded text-[10px]">{pontaDireita}</strong></span>
          </div>
        )}

        {meuTurno && mesaPedras.length > 0 && (
          <div className="absolute top-1.5 z-20 text-[9px] sm:text-[10px] text-emerald-300/70 bg-emerald-900/40 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
            <Move className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>Arraste e solte na ponta</span>
          </div>
        )}

        <div className="flex items-center justify-center max-w-full w-full h-full px-1 py-1 relative overflow-hidden">
          {mesaPedras.length === 0 ? (
            <div 
              data-dropzone="esquerda"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, 'esquerda')}
              className={`w-36 sm:w-48 h-16 sm:h-20 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center font-bold text-[10px] sm:text-xs p-2 transition-all ${
                sobreDropZone === 'esquerda'
                  ? 'border-green-400 bg-green-500/40 text-white scale-105 shadow-[0_0_20px_rgba(34,197,94,0.9)]'
                  : 'border-emerald-400/40 bg-emerald-900/20 text-emerald-300/60'
              }`}
            >
              <Move className="w-4 h-4 mb-0.5 text-amber-400 animate-bounce" />
              <span>Arraste e solte a primeira pedra aqui</span>
            </div>
          ) : (
            <div className={`flex items-center justify-center transition-all duration-300 transform max-w-full origin-center ${getEscalaMesa()}`}>
              {/* DROP ZONE PONTA ESQUERDA */}
              <div
                data-dropzone="esquerda"
                onDragOver={(e) => handleDragOver(e, 'esquerda')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'esquerda')}
                className={`shrink-0 h-10 w-8 sm:h-16 sm:w-12 border-2 border-dashed rounded-lg flex items-center justify-center text-[7px] sm:text-[9px] font-black transition-all mr-1 ${
                  sobreDropZone === 'esquerda'
                    ? 'border-green-400 bg-green-500/40 text-white scale-110 shadow-[0_0_15px_rgba(34,197,94,0.9)]'
                    : 'border-emerald-500/50 bg-emerald-900/30 text-emerald-300 hover:border-green-400'
                }`}
              >
                SOLTAR ESQ
              </div>

              {/* RENDERIZAÇÃO DAS PEDRAS COM ALTO CONTRASTE BLINDADO */}
              <div className="flex items-center justify-center gap-0.5 shrink-0">
                {mesaPedras.map((pedra, idx) => {
                  const [lA, lB] = pedra.valorOriginal.split('-').map(Number);
                  const ehBucha = lA === lB;

                  return (
                    <div key={idx} className="shrink-0 flex items-center justify-center">
                      <PedraClassica 
                        valor={pedra.valorOriginal} 
                        disabled={true} 
                        menor={true} 
                        deitada={!ehBucha} 
                      />
                    </div>
                  );
                })}
              </div>

              {/* DROP ZONE PONTA DIREITA */}
              <div
                data-dropzone="direita"
                onDragOver={(e) => handleDragOver(e, 'direita')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'direita')}
                className={`shrink-0 h-10 w-8 sm:h-16 sm:w-12 border-2 border-dashed rounded-lg flex items-center justify-center text-[7px] sm:text-[9px] font-black transition-all ml-1 ${
                  sobreDropZone === 'direita'
                    ? 'border-green-400 bg-green-500/40 text-white scale-110 shadow-[0_0_15px_rgba(34,197,94,0.9)]'
                    : 'border-emerald-500/50 bg-emerald-900/30 text-emerald-300 hover:border-green-400'
                }`}
              >
                SOLTAR DIR
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-1 bg-[#090610]/95 border border-purple-900/40 px-2.5 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold tracking-wide">
          {meuTurno ? (
            <span className="text-green-400 animate-pulse flex items-center gap-1">
              <Timer className="w-2.5 h-2.5" /> {tempoRestante}s - SUA VEZ!
            </span>
          ) : (
            <span className="text-gray-400">Aguardando {adversarioNome}...</span>
          )}
        </div>
      </div>

      {/* ÁREA DAS SUAS PEDRAS (MÃO ARRASTÁVEL COM PEDRAS BRANCAS NÍTIDAS) */}
      <div className="bg-[#110D1A]/95 border border-purple-950/40 p-1 sm:p-2 rounded-2xl h-[24%] flex flex-col justify-between w-full">
        <div className="flex items-center justify-between px-1 h-[20%]">
          <span className="text-[8px] sm:text-[10px] text-purple-300 font-bold uppercase tracking-wider">Suas Pedras ({minhasPedras.length})</span>
          {pedraArrastando && (
            <span className="text-[8px] sm:text-[10px] text-amber-400 font-bold animate-pulse">Arrastando: [{pedraArrastando}]</span>
          )}
        </div>
        <div className="flex justify-center items-center gap-1 overflow-x-auto h-[80%] py-0.5">
          {minhasPedras.map((pedra, idx) => (
            <div key={idx} className="shrink-0 scale-85 sm:scale-100 touch-none">
              <PedraClassica 
                valor={pedra} 
                onDragStart={(e) => handleDragStart(pedra, e)}
                onTouchStart={(e) => handleTouchStart(pedra, e)}
                disabled={!(meuTurno && isPedraJogavel(pedra) && isFullscreen)} 
                menor={true} 
                destacada={meuTurno && isPedraJogavel(pedra) && isFullscreen} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
