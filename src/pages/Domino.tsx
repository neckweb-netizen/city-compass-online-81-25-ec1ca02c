import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DominoTabuleiro } from '@/components/domino/DominoTabuleiro';
import { Loader2, AlertCircle, Trophy, Users, Search, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JogadorLobby {
  id: string;
  nome: string;
  foto_url: string | null;
}

interface MesaLobby {
  id: string;
  numero: number; 
  jogador_1_id: string | null;
  jogador_2_id: string | null;
  jogador_1?: JogadorLobby;
  jogador_2?: JogadorLobby;
  status: 'Disponível' | 'Em Partida';
}

const AVATARES_PADROES = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Jack&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Emery&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=JD&backgroundColor=b1e2c6"
];

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

export default function Domino() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [salaAtivaId, setSalaAtivaId] = useState<string | null>(null);
  const [numeroMesaAtiva, setNumeroMesaAtiva] = useState<number>(1);
  const [mesas, setMesas] = useState<MesaLobby[]>([]);
  const [procurandoFila, setProcurandoFila] = useState(false);
  const [jogadoresNaFila, setJogadoresNaFila] = useState<number>(0);
  const [erroBanco, setErroBanco] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const carregarMesas = async () => {
    try {
      const { data: salasData, error: salasError } = await supabase
        .from('domino_salas')
        .select('id, jogador_1_id, jogador_2_id');

      if (salasError) throw salasError;

      if (salasData) {
        const idsJogadores = Array.from(new Set(
          salasData.reduce((acc: string[], cur: any) => {
            if (cur.jogador_1_id) acc.push(cur.jogador_1_id);
            if (cur.jogador_2_id) acc.push(cur.jogador_2_id);
            return acc;
          }, [])
        ));

        let perfisMapeados: Record<string, JogadorLobby> = {};

        if (idsJogadores.length > 0) {
          const { data: perfisData, error: perfisError } = await supabase
            .from('usuarios') 
            .select('id, nome, foto_url')
            .in('id', idsJogadores);

          if (!perfisError && perfisData) {
            perfisData.forEach((perfil: any) => {
              perfisMapeados[perfil.id] = {
                id: perfil.id,
                nome: perfil.nome || 'Jogador',
                foto_url: perfil.foto_url
              };
            });
          }
        }

        const mesasFormatadas: MesaLobby[] = salasData.map((mesa: any, index: number) => {
          const j1 = mesa.jogador_1_id ? perfisMapeados[mesa.jogador_1_id] : undefined;
          const j2 = mesa.jogador_2_id ? perfisMapeados[mesa.jogador_2_id] : undefined;
          const emPartida = mesa.jogador_1_id !== null && mesa.jogador_2_id !== null;

          return {
            id: mesa.id,
            numero: index + 1, 
            jogador_1_id: mesa.jogador_1_id,
            jogador_2_id: mesa.jogador_2_id,
            jogador_1: j1,
            jogador_2: j2,
            status: emPartida ? 'Em Partida' : 'Disponível'
          };
        });

        setMesas(mesasFormatadas);
      }
    } catch (err) {
      console.error('Erro ao buscar salas:', err);
    }
  };

  useEffect(() => {
    if (session) {
      carregarMesas();

      const canalLobby = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'domino_salas' },
          () => {
            carregarMesas();
          }
        )
        .subscribe();

      const intervaloSincronia = setInterval(() => {
        carregarMesas();
      }, 2000);

      return () => {
        supabase.removeChannel(canalLobby);
        clearInterval(intervaloSincronia);
      };
    }
  }, [session]);

  const executarMatchmaking = async () => {
    if (!session || procurandoFila) {
      setProcurandoFila(false);
      setJogadoresNaFila(0);
      return;
    }

    setProcurandoFila(true);
    setJogadoresNaFila(1);
    setErroBanco(null);

    try {
      const { data: salas, error } = await supabase
        .from('domino_salas')
        .select('id, jogador_1_id, jogador_2_id');

      if (error) throw error;
      if (!salas || salas.length === 0) return;

      const mesaAguardandoDesafiante = salas.find(
        s => (s.jogador_1_id && s.jogador_1_id !== session.user.id && !s.jogador_2_id) || 
             (!s.jogador_1_id && s.jogador_2_id && s.jogador_2_id !== session.user.id)
      );

      if (mesaAguardandoDesafiante) {
        let updateData: any = {};
        if (!mesaAguardandoDesafiante.jogador_1_id) {
          updateData.jogador_1_id = session.user.id;
        } else {
          updateData.jogador_2_id = session.user.id;
        }

        const { error: joinError } = await supabase
          .from('domino_salas')
          .update(updateData)
          .eq('id', mesaAguardandoDesafiante.id);

        if (joinError) {
          setErroBanco(`Erro ao registrar vaga no Supabase: ${joinError.message}`);
          setProcurandoFila(false);
          return;
        }

        const mIndex = salas.findIndex(s => s.id === mesaAguardandoDesafiante.id);
        setProcurandoFila(false);
        setJogadoresNaFila(0);
        setNumeroMesaAtiva(mIndex !== -1 ? mIndex + 1 : 1);
        setSalaAtivaId(mesaAguardandoDesafiante.id);
        return;
      }

      const mesaVazia = salas.find(s => !s.jogador_1_id && !s.jogador_2_id);
      if (mesaVazia) {
        const { error: joinError } = await supabase
          .from('domino_salas')
          .update({ jogador_1_id: session.user.id })
          .eq('id', mesaVazia.id);

        if (joinError) {
          setErroBanco(`Erro ao sentar na mesa vazia: ${joinError.message}`);
          setProcurandoFila(false);
          return;
        }

        const mIndex = salas.findIndex(s => s.id === mesaVazia.id);
        setProcurandoFila(false);
        setJogadoresNaFila(0);
        setNumeroMesaAtiva(mIndex !== -1 ? mIndex + 1 : 1);
        setSalaAtivaId(mesaVazia.id);
        return;
      }

    } catch (err: any) {
      setErroBanco(`Falha de rede/execução: ${err.message || err}`);
      setProcurandoFila(false);
      setJogadoresNaFila(0);
    }
  };

  const tentarEntrarNaMesa = async (mesa: MesaLobby) => {
    if (!session) return;
    setErroBanco(null);

    try {
      let updateData: any = {};
      
      if (!mesa.jogador_1_id) {
        updateData.jogador_1_id = session.user.id;
      } else if (!mesa.jogador_2_id && mesa.jogador_1_id !== session.user.id) {
        updateData.jogador_2_id = session.user.id;
      } else {
        setNumeroMesaAtiva(mesa.numero);
        setSalaAtivaId(mesa.id);
        return;
      }

      const { error } = await supabase
        .from('domino_salas')
        .update(updateData)
        .eq('id', mesa.id);

      if (error) {
        // Exibe o erro na tela para sabermos se o RLS bloqueou o update
        setErroBanco(`O Supabase recusou a gravação! Código: ${error.code} - Mensagem: ${error.message}`);
        return;
      }

      await carregarMesas();

      setNumeroMesaAtiva(mesa.numero);
      setSalaAtivaId(mesa.id);
    } catch (err: any) {
      setErroBanco(`Erro inesperado ao tentar sentar: ${err.message || err}`);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090610]">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-[#090610] text-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold">Acesso não autorizado</h2>
        <p className="text-xs text-slate-500 max-w-xs">Por favor, faça login para jogar.</p>
      </div>
    );
  }

  if (salaAtivaId) {
    return (
      <DominoTabuleiro
        usuarioId={session.user.id}
        salaId={salaAtivaId}
        numeroSala={numeroMesaAtiva}
        onVoltarAoLobby={() => setSalaAtivaId(null)}
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-[#090610] text-slate-900 dark:text-white transition-colors duration-200 font-sans p-4 md:p-6 select-none">
      
      {/* BANNER DE DIAGNÓSTICO DE ERROS DO BANCO DE DADOS */}
      {erroBanco && (
        <div className="max-w-6xl mx-auto mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-xl flex items-center gap-2 text-xs font-semibold animate-bounce">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{erroBanco} (Verifique as Policies de RLS da tabela <strong>domino_salas</strong> no painel do Supabase).</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto flex items-center justify-between mb-6 bg-white dark:bg-[#110D1A]/95 border border-slate-200 dark:border-purple-950/40 p-4 rounded-2xl shadow-sm dark:shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-wide text-slate-900 dark:text-white">Dominó do Paredão</h1>
            <p className="text-xs text-slate-700 dark:text-gray-300 text-left">Participe de partidas de dominó em tempo real com pessoas de Santo Antônio de Jesus!</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()} className="text-slate-500 dark:text-gray-400 hover:text-red-500"><LogOut className="w-4 h-4 mr-1.5" /> Sair do Jogo</Button>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="w-full bg-white dark:bg-[#110D1A]/95 border border-slate-300 dark:border-purple-950/40 rounded-2xl p-5 shadow-sm dark:shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="p-3 bg-purple-100 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/30 rounded-full text-purple-600 dark:text-purple-400"><Users className="w-6 h-6" /></div>
            <div>
              <h2 className="font-bold text-md text-slate-900 dark:text-white">Fila de espera atual</h2>
              <p className="text-xs text-slate-700 dark:text-gray-300">{jogadoresNaFila === 0 ? "Ninguém na fila de espera no momento." : `${jogadoresNaFila} jogador(es) aguardando partida.`}</p>
            </div>
          </div>
          <Button onClick={executarMatchmaking} className={`w-full sm:w-auto font-bold text-xs h-11 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${procurandoFila ? 'bg-amber-600 text-white animate-pulse' : 'bg-purple-600 text-white'}`}>
            {procurandoFila ? <><RefreshCw className="w-4 h-4 animate-spin" /> Cancelar Busca</> : <><Search className="w-4 h-4" /> Entrar na Fila / Procurar Mesa</>}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mesas.map((mesa) => {
            const j1 = mesa.jogador_1;
            const j2 = mesa.jogador_2;

            return (
              <div key={mesa.id} className="bg-white dark:bg-[#110D1A]/95 border border-slate-300 dark:border-purple-950/40 rounded-2xl p-5 shadow-md dark:shadow-lg flex flex-col justify-between transition-transform duration-150 hover:scale-[1.01]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-md text-slate-900 dark:text-white">Mesa de Jogo {mesa.numero}</h3>
                    <p className="text-[11px] text-slate-600 dark:text-gray-300">Limite: 2 jogadores</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${mesa.status === 'Em Partida' ? 'bg-red-50 text-red-700 border-red-300' : 'bg-green-50 text-green-700 border-green-300'}`}>{mesa.status}</span>
                </div>

                <div className="flex items-center justify-around py-4 bg-slate-200 dark:bg-[#0c0814] border border-slate-300 dark:border-purple-950/20 rounded-xl mb-4">
                  <div className="flex flex-col items-center gap-2 w-24">
                    <img src={obterAvatarUsuario(j1 ? j1.foto_url : null, j1 ? j1.id : null)} alt={j1 ? j1.nome : "Vago"} className={`w-12 h-12 rounded-full border-2 object-cover bg-slate-300 ${j1 ? 'border-purple-600' : 'border-dashed border-slate-400'}`} />
                    <span className="text-xs font-bold truncate max-w-full text-slate-800 dark:text-gray-300">{j1 ? j1.nome : "Vago"}</span>
                  </div>
                  <span className="text-purple-700 dark:text-purple-455 font-black text-sm">VS</span>
                  <div className="flex flex-col items-center gap-2 w-24">
                    <img src={obterAvatarUsuario(j2 ? j2.foto_url : null, j2 ? j2.id : null)} alt={j2 ? j2.nome : "Vago"} className={`w-12 h-12 rounded-full border-2 object-cover bg-slate-300 ${j2 ? 'border-purple-600' : 'border-dashed border-slate-400'}`} />
                    <span className="text-xs font-bold truncate max-w-full text-slate-800 dark:text-gray-300">{j2 ? j2.nome : "Vago"}</span>
                  </div>
                </div>

                <Button onClick={() => tentarEntrarNaMesa(mesa)} className="w-full font-bold text-xs h-10 rounded-xl bg-purple-600 text-white shadow-md hover:bg-purple-700 transition-all">Sentar na Mesa / Jogar</Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
