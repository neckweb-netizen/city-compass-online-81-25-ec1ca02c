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

const PedraClassica = ({ valor, onClick, disabled, menor = false, deitada = false, destacada = false }: { valor: string; onClick?: () => void; disabled?: boolean; menor?: boolean; deitada?: boolean; destacada?: boolean; }) => {
  const safeValor = valor || '0-0';
  const [ladoA, ladoB] = safeValor.split('-').map(Number);

  const renderBolinhas = (pontos: number) => {
    const posicoes: Record<number, number[]> = { 0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
    const ativas = posicoes[pontos] || [];
    const tamanhoBolinha = menor ? 'w-1 h-1' : 'w-1.5 h-1.5';
    const espacamentoGrid = menor ? 'gap-0.5 p-1' : 'gap-1 p-1.5';

    return (
      <div className={`grid grid-cols-3 ${espacamentoGrid} h-full w-full items-center justify-items-center`}>
        {[...Array(9)].map((_, i) => <div key={i} className={`${tamanhoBolinha} rounded-full transition-all ${ativas.includes(i) ? 'bg-white' : 'bg-transparent'}`} />)}
      </div>
    );
  };

  const classesTamanho = deitada ? (menor ? "w-16 h-8 border-2 flex-row" : "w-20 h-10 border-2 flex-row") : (menor ? "w-8 h-16 border-2 flex-col" : "w-10 h-20 border-2 flex-col");

  return (
    <button disabled={disabled} onClick={onClick} className={`${classesTamanho} bg-[#1a1a1a] border-[#333] rounded-lg flex items-center justify-between shadow-lg relative transition-all ${destacada ? 'border-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.7)] scale-105 animate-pulse cursor-pointer z-10' : 'opacity-100'}`}>
      <div className="flex-1 w-full h-full flex items-center justify-center">{renderBolinhas(ladoA)}</div>
      <div className={deitada ? "h-[90%] w-[1.5px] bg-amber-600/80 rounded-full" : "w-[90%] h-[1.5px] bg-amber-600/80 rounded-full"} />
      <div className="flex-1 w-full h-full flex items-center justify-center">{renderBolinhas(ladoB)}</div>
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

  // Sistema de alertas temporários flutuantes na tela
  const [alertaTemporario, setAlertaTemporario] = useState<string | null>(null);

  // Contador persistente de inatividade consecutiva (3 turnos)
  const turnosPassadosSeguidosRef = useRef<number>(0);

  const [modalNotificacao, setModalNotificacao] = useState<{ visivel: boolean; titulo: string; message: string; tipo: 'info' | 'erro' | 'fim' | 'passe' }>({ 
    visivel: false, 
    titulo: '', 
    message: '', 
    tipo: 'info' 
  });

  const partidaJaIniciadaRef = useRef(false);
  const ambosJogadoresPresentes = jogador1Id !== null && bandwidth2Id !== null;
  const ambosJogadoresPresentesLocal = jogador1Id !== null && jogador2Id !== null;

  const entrarModoJogoReal = async () => {
    try { if (containerRef.current?.requestFullscreen) await containerRef.current.requestFullscreen(); setIsFullscreen(true); } catch (e) {}
  };

  const sairModoJogoReal = () => { if (document.fullscreenElement) document.exitFullscreen(); setIsFullscreen(false); };

  useEffect(() => {
    entrarModoJogoReal();
    const monitorarTelaCheia = () => { setIsFullscreen(!!document.fullscreenElement); };
    document.addEventListener('fullscreenchange', monitorarTelaCheia);
    return () => { document.removeEventListener('fullscreenchange', monitorarTelaCheia); sairModoJogoReal(); };
  }, []);

  const inicializarPedrasCompartilhadas = (userId: string, j1: string | null, j2: string | null) => {
    const pool = ['0-0', '0-1', '0-2', '0-3', '0-4', '0-5', '0-6', '1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '2-2', '2-3', '2-4', '2-5', '2-6', '3-3', '3-4', '3-5', '3-6', '4-4', '4-5', '4-6', '5-5', '5-6', '6-6'];
    const salaHash = salaId.replace(/[^0-9]/g, '');
    const seed = salaHash ? parseInt(salaHash.substring(0, 5)) : 12345;
    let localPool = [...pool];
    let tempSeed = seed;
    for (let i = localPool.length - 1; i > 0; i--) {
      tempSeed = (tempSeed * 9301 + 49297) % 233280;
      const j = Math.floor((tempSeed / 233280) * (i + 1));
      const temp = localPool[i]; localPool[i] = localPool[j]; localPool[j] = temp;
    }
    if (userId === j1) setMinhasPedras(localPool.slice(0, 7));
    else if (userId === j2) setMinhasPedras(localPool.slice(7, 14));
  };

  const carregarDadosPartida = async () => {
    try {
      const { data } = await supabase.from('domino_salas').select('id, jogador_1_id, jogador_2_id, vez_usuario_id, mesa_ponta_esquerda, mesa_ponta_direita, historico_jogadas').eq('id', salaId).single();
      if (data) {
        setJogador1Id(data.jogador_1_id);
        setJogador2Id(data.jogador_2_id);
        setVezUsuarioId(data.vez_usuario_id);
        setPontaEsquerda(data.mesa_ponta_esquerda);
        setPontaDireita(data.mesa_ponta_direita);

        if (data.jogador_1_id && data.jogador_2_id) partidaJaIniciadaRef.current = true;

        const ids = [data.jogador_1_id, data.jogador_2_id].filter(Boolean) as string[];
        if (ids.length > 0) {
          const { data: uData } = await supabase.from('usuarios').select('id, nome, foto_url').in('id', ids);
          const p1 = uData?.find(u => u.id === data.jogador_1_id);
          const p2 = uData?.find(u => u.id === data.jogador_2_id);
          if (p1) { setNomeJ1(p1.nome); setFotoJ1(p1.foto_url); }
          if (p2) { setNomeJ2(p2.nome); setFotoJ2(p2.foto_url); }
        }

        const jogadasRaw = data.historico_jogadas as any[];
        const jogadasProcessadas: PedraMesa[] = Array.isArray(jogadasRaw) ? jogadasRaw.map((jogada: any) => {
          if (typeof jogada === 'string') {
            const [lA, lB] = jogada.split('-').map(Number); return { valorOriginal: jogada, ladoEsquerdo: lA, ladoDireito: lB };
          }
          return jogada as PedraMesa;
        }) : [];
        setMesaPedras(jogadasProcessadas);
        inicializarPedrasCompartilhadas(usuarioId, data.jogador_1_id, data.jogador_2_id);
      }
    } catch (e) {}
  };

  useEffect(() => {
    carregarDadosPartida();

    // IMPLEMENTAÇÃO DE SUPABASE PRESENCE (Limpa jogador da mesa se ele fechar a aba/site)
    const canalJogo = supabase.channel(`jogo-realtime-${salaId}`, { config: { broadcast: { self: true }, presence: { key: usuarioId } } })
      .on('presence', { event: 'sync' }, async () => {
        const estadoPresenca = canalJogo.presenceState();
        const chavesPresencas = Object.keys(estadoPresenca);
        
        // Se a partida começou e um dos dois sumir do presence da rede, força abandono de vaga
        if (partidaJaIniciadaRef.current && chavesPresencas.length < 2) {
          let updates: any = {};
          if (jogador1Id && !chavesPresencas.includes(jogador1Id)) updates.jogador_1_id = null;
          if (jogador2Id && !chavesPresencas.includes(jogador2Id)) updates.jogador_2_id = null;
          
          if (Object.keys(updates).length > 0) {
            await supabase.from('domino_salas').update(updates).eq('id', salaId);
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'domino_salas', filter: `id=eq.${salaId}` }, async (payload) => {
        const newData = payload.new;
        if (newData) {
          // Monitora se a vez mudou para exibir o alerta temporário sem botão
          if (newData.vez_usuario_id !== vezUsuarioId && newData.jogador_1_id && newData.jogador_2_id) {
            if (newData.vez_usuario_id === usuarioId) {
              setAlertaTemporario("SUA VEZ!");
            } else {
              setAlertaTemporario("PASSE / VEZ DO OPONENTE");
            }
            setTimeout(() => setAlertaTemporario(null), 2500);
          }

          setJogador1Id(newData.jogador_1_id);
          setJogador2Id(newData.jogador_2_id);
          setVezUsuarioId(newData.vez_usuario_id);
          setPontaEsquerda(newData.mesa_ponta_esquerda);
          setPontaDireita(newData.mesa_ponta_direita);

          if (newData.jogador_1_id && newData.jogador_2_id) partidaJaIniciadaRef.current = true;

          // Se a partida foi cancelada por inatividade via trigger externo do banco
          if (newData.jogador_1_id === null && newData.jogador_2_id === null && partidaJaIniciadaRef.current) {
            setModalNotificacao({ visivel: true, titulo: 'Partida Anulada!', message: 'O jogo foi cancelado devido ao excesso de turnos sem jogar por inatividade.', tipo: 'erro' });
            return;
          }

          if (partidaJaIniciadaRef.current && (!newData.jogador_1_id || !newData.jogador_2_id)) {
            tocarSom('vitoria');
            setModalNotificacao({ visivel: true, titulo: 'Vitória por W.O.!', message: 'Seu oponente fechou o navegador ou abandonou a partida.', tipo: 'fim' });
          }

          const jogadasRaw = newData.historico_jogadas as any[];
          const jogadasProcessadas: PedraMesa[] = Array.isArray(jogadasRaw) ? jogadasRaw.map((jogada: any) => {
            if (typeof jogada === 'string') {
              const [lA, lB] = jogada.split('-').map(Number); return { valorOriginal: jogada, ladoEsquerdo: lA, ladoDireito: lB };
            }
            return jogada as PedraMesa;
          }) : [];
          setMesaPedras(jogadasProcessadas);
          tocarSom('jogar');
        }
      })
      .on('broadcast', { event: 'provocacao' }, (response) => {
        const payload = response.payload;
        if (payload.autorId === jogador1Id) { setEmojiAtivoJ1(payload.emoji); tocarSom('emoji'); setTimeout(() => setEmojiAtivoJ1(null), 6000); }
        else { setEmojiAtivoJ2(payload.emoji); tocarSom('emoji'); setTimeout(() => setEmojiAtivoJ2(null), 6000); }
      });

    canalJogo.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await canalJogo.track({ online_at: new Date().toISOString() });
      }
    });

    canalRef.current = canalJogo;
    return () => { supabase.removeChannel(canalJogo); };
  }, [salaId, vezUsuarioId, jogador1Id, jogador2Id]);

  const meuTurno = vezUsuarioId === usuarioId && ambosJogadoresPresentesLocal;
  const adversarioNome = usuarioId === jogador1Id ? nomeJ2 : nomeJ1;

  const isPedraJogavel = (pedra: string) => {
    if (mesaPedras.length === 0) return true;
    const [ladoA, ladoB] = pedra.split('-').map(Number);
    return ladoA === pontaEsquerda || ladoB === pontaEsquerda || ladoA === pontaDireita || ladoB === pontaDireita;
  };

  useEffect(() => { if (ambosJogadoresPresentesLocal) setTempoRestante(20); }, [vezUsuarioId, ambosJogadoresPresentesLocal]);

  useEffect(() => {
    if (!vezUsuarioId || !ambosJogadoresPresentesLocal) return;
    const tick = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) { 
          if (meuTurno) {
            const temPecaCompativel = minhasPedras.some(p => isPedraJogavel(p));
            // REGRA: Se o tempo esgotar tendo peças válidas na mão, conta como turno perdido por inatividade
            if (temPecaCompativel) {
              turnosPassadosSeguidosRef.current += 1;
              if (turnosPassadosSeguidosRef.current >= 3) {
                anularPartidaPorInatividade();
                return 20;
              }
            }
            passarVez(); 
          }
          return 20; 
        }
        if (prev === 6) tocarSom('alerta');
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [vezUsuarioId, meuTurno, ambosJogadoresPresentesLocal, minhasPedras, mesaPedras]);

  // Alerta de passe reativo limpo sem quebrar layout
  useEffect(() => {
    if (meuTurno && minhasPedras.length > 0 && mesaPedras.length > 0) {
      const temQualquerPecaJogavel = minhasPedras.some(pedra => isPedraJogavel(pedra));
      if (!temQualquerPecaJogavel) {
        passarVez();
      }
    }
  }, [meuTurno, minhasPedras, mesaPedras]);

  useEffect(() => {
    if (minhasPedras.length === 0 && mesaPedras.length > 0) {
      tocarSom('vitoria');
      setModalNotificacao({ visivel: true, titulo: 'Parabéns, Você Venceu!', message: 'Você bateu o jogo de dominó!', tipo: 'fim' });
    }
  }, [minhasPedras]);

  const anularPartidaPorInatividade = async () => {
    try {
      await supabase.from('domino_salas').update({ jogador_1_id: null, jogador_2_id: null, historico_jogadas: [] }).eq('id', salaId);
      setModalNotificacao({ visivel: true, titulo: 'Partida Anulada!', message: 'Você ficou 3 turnos seguidos sem jogar possuindo peças compatíveis. O jogo foi encerrado por inatividade.', tipo: 'erro' });
    } catch (e) {}
  };

  const tentarJogarPedra = async (pedra: string) => {
    if (!meuTurno || !ambosJogadoresPresentesLocal) return;

    const [ladoA, ladoB] = pedra.split('-').map(Number);
    let novaMesa = [...mesaPedras];
    let novaPontaE = pontaEsquerda;
    let novaPontaD = pontaDireita;

    if (mesaPedras.length === 0) {
      novaMesa.push({ valorOriginal: pedra, ladoEsquerdo: ladoA, ladoDireito: ladoB });
      novaPontaE = ladoA; novaPontaD = ladoB;
    } else {
      if (ladoA === pontaEsquerda) { novaMesa.unshift({ valorOriginal: `${ladoB}-${ladoA}`, ladoEsquerdo: ladoB, ladoDireito: ladoA }); novaPontaE = ladoB; }
      else if (ladoB === pontaEsquerda) { novaMesa.unshift({ valorOriginal: `${ladoA}-${ladoB}`, ladoEsquerdo: ladoA, ladoDireito: ladoB }); novaPontaE = ladoA; }
      else if (ladoA === pontaDireita) { novaMesa.push({ valorOriginal: `${ladoA}-${ladoB}`, ladoEsquerdo: ladoA, ladoDireito: ladoB }); novaPontaD = ladoB; }
      else if (ladoB === pontaDireita) { novaMesa.push({ valorOriginal: `${ladoB}-${ladoA}`, ladoEsquerdo: ladoB, ladoDireito: ladoA }); novaPontaD = ladoA; }
      else return;
    }

    const proximoTurnoId = usuarioId === jogador1Id ? jogador2Id : jogador1Id;
    try {
      // Zera o contador já que o usuário efetuou uma ação válida
      turnosPassadosSeguidosRef.current = 0;
      await supabase.from('domino_salas').update({ historico_jogadas: novaMesa as any, mesa_ponta_esquerda: novaPontaE, mesa_ponta_direita: novaPontaD, vez_usuario_id: proximoTurnoId }).eq('id', salaId);
      setMinhasPedras(prev => prev.filter(p => p !== pedra));
    } catch (e) {}
  };

  const passarVez = async () => {
    const proximoTurnoId = usuarioId === jogador1Id ? jogador2Id : jogador1Id;
    tocarSom('passar');
    try {
      await supabase.from('domino_salas').update({ vez_usuario_id: proximoTurnoId }).eq('id', salaId);
    } catch (e) {}
  };

  const lidarComSaidaVoluntaria = async () => {
    partidaJaIniciadaRef.current = false;
    await supabase.from('domino_salas').update({ jogador_1_id: null, jogador_2_id: null, historico_jogadas: [] }).eq('id', salaId);
    onVoltarAoLobby();
  };

  const enviarProvocacao = (emoji: string) => {
    if (canalRef.current) canalRef.current.send({ type: 'broadcast', event: 'provocacao', payload: { autorId: usuarioId, emoji } });
  };

  return (
    <div ref={containerRef} className="w-full h-screen bg-[#090610] text-white font-sans flex flex-col justify-between p-2 md:p-4 overflow-hidden select-none relative">
      
      {/* BANNER NOTIFICAÇÃO FLUTUANTE TEMPORÁRIA (SEM BOTÃO) */}
      {alertaTemporario && (
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 bg-purple-600/90 border border-purple-400 text-white font-black tracking-widest text-sm md:text-md px-8 py-3 rounded-full shadow-[0_0_30px_rgba(147,51,234,0.6)] z-50 transition-all animate-in fade-in zoom-in duration-200 uppercase">
          {alertaTemporario}
        </div>
      )}

      {modalNotificacao.visivel && (
        <div className="absolute inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
          <div className="max-w-sm bg-[#110D1A] border border-purple-950/60 p-8 rounded-2xl shadow-2xl text-center space-y-5">
            <div className="p-4 bg-purple-950/40 border border-purple-900/30 rounded-full w-fit mx-auto">
              {modalNotificacao.tipo === 'fim' ? <Award className="w-12 h-12 text-yellow-500 animate-bounce" /> : <ShieldAlert className="w-12 h-12 text-red-500" />}
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-xl text-white">{modalNotificacao.titulo}</h3>
              <p className="text-xs text-gray-300 leading-relaxed">{modalNotificacao.message}</p>
            </div>
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-11 text-xs rounded-xl" onClick={lidarComSaidaVoluntaria}>Voltar ao Lobby</Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between bg-[#110D1A]/95 border border-purple-950/40 px-3 py-1.5 rounded-xl shadow-lg h-[12%] relative gap-2">
        <Button variant="ghost" size="sm" onClick={lidarComSaidaVoluntaria} className="text-gray-400 hover:text-white h-8 text-xs px-2"><ArrowLeft className="w-3.5 h-3.5 mr-1" /> Sair</Button>
        <div className="flex items-center gap-4 bg-purple-950/20 px-3 py-1 rounded-lg text-xs">
          <span className="font-medium">{nomeJ1}</span>
          <span className="text-purple-500 font-bold">VS</span>
          <span className="font-medium">{nomeJ2}</span>
        </div>
      </div>

      <div className="flex-grow my-1 bg-emerald-950 border-[4px] border-amber-950 rounded-[24px] shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)] relative flex flex-col items-center justify-center h-[53%] overflow-hidden">
        {mesaPedras.length > 0 && (
          <div className="absolute top-2 left-4 flex items-center gap-3 text-[10px] font-semibold text-emerald-300/60">
            <span>Esquerda: <strong className="text-white bg-emerald-900/60 px-1.5 py-0.5 rounded text-xs">{pontaEsquerda}</strong></span>
            <span>Direita: <strong className="text-white bg-emerald-900/60 px-1.5 py-0.5 rounded text-xs">{pontaDireita}</strong></span>
          </div>
        )}

        <div className="flex items-center justify-center gap-0 max-w-full overflow-x-auto px-4 py-2">
          {mesaPedras.length === 0 ? (
            <div className="text-center text-emerald-300/30 font-bold uppercase tracking-widest text-xs py-6">
              {ambosJogadoresPresentesLocal ? <>Mesa de Dominó Limpa<br /><span className="text-[10px] font-normal lowercase">Seu turno! Jogue a primeira pedra.</span></> : <span className="text-amber-500 animate-pulse">Aguardando oponente para iniciar...</span>}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-0 max-w-full overflow-x-auto px-4 py-2">
              {mesaPedras.map((pedra, idx) => {
                const [ladoA, ladoB] = pedra.valorOriginal.split('-').map(Number);
                return (
                  <div key={idx} className={`shrink-0 flex items-center justify-center ${idx > 0 ? '-ml-2' : ''}`}>
                    <PedraClassica valor={pedra.valorOriginal} disabled={true} menor={true} deitada={ladoA !== ladoB} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="absolute left-3 bottom-3 flex items-center gap-1.5 bg-black/60 border border-purple-900/30 p-1.5 rounded-full shadow-lg">
          <Smile className="w-3.5 h-3.5 text-purple-400 ml-1" />
          {LISTA_EMOJIS.map((emoji) => (
            <button key={emoji} onClick={() => enviarProvocacao(emoji)} className="hover:scale-125 transition-transform duration-100 text-sm active:scale-95">{emoji}</button>
          ))}
        </div>

        <div className="absolute bottom-2 right-3 bg-[#090610]/95 border border-purple-900/40 px-4 py-1.5 rounded-2xl flex flex-col items-center justify-center gap-1 min-w-[130px]">
          <div className="text-[10px] font-bold tracking-wide">
            {!ambosJogadoresPresentesLocal ? <span className="text-amber-500 animate-pulse">AGUARDANDO...</span> : meuTurno ? <span className="text-green-400 animate-pulse flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> SUA VEZ ({tempoRestante}s)</span> : <span className="text-gray-400">Tempo de {adversarioNome}: {tempoRestante}s</span>}
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 ${!ambosJogadoresPresentesLocal ? 'bg-gray-600' : tempoRestante > 10 ? 'bg-green-500' : tempoRestante > 4 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${!ambosJogadoresPresentesLocal ? 100 : (tempoRestante / 20) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="bg-[#110D1A]/95 border border-purple-950/40 p-2.5 rounded-2xl h-[30%] flex flex-col justify-between">
        <div className="flex items-center justify-between px-1 h-[25%]"><span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Suas Pedras ({minhasPedras.length})</span></div>
        <div className="flex justify-center items-center gap-1.5 overflow-x-auto h-[75%] py-1">
          {minhasPedras.map((pedra, idx) => {
            const jogavel = meuTurno && isPedraJogavel(pedra) && ambosJogadoresPresentesLocal;
            return (
              <div key={idx} className="shrink-0 scale-90 md:scale-100">
                <PedraClassica valor={pedra} onClick={() => tentarJogarPedra(pedra)} disabled={!jogavel} menor={true} destacada={jogavel} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DominoTabuleiro;
