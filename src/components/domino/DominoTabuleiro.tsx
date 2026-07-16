import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Users, Search, Play, Trophy, User, LogOut, Moon, Sun } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

interface DominoLobbyProps {
  usuarioId: string;
  usuarioNome: string;
  onSelecionarSala: (salaId: string, numeroMesa: number) => void;
  onSair: () => void;
}

// 5 Avatares padrão modernos de backup
const AVATARES_PADROES = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Jack&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Emery&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=JD&backgroundColor=b1e2c6"
];

const obterAvatarUsuario = (fotoUrl: string | null, idUsuario: string | null) => {
  if (fotoUrl && fotoUrl !== "" && fotoUrl !== "NULL") {
    return fotoUrl;
  }
  const idNumerico = idUsuario ? idUsuario.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
  const indiceAvatar = idNumerico % 5;
  return AVATARES_PADROES[indiceAvatar];
};

export const DominoLobby = ({ usuarioId, usuarioNome, onSelecionarSala, onSair }: DominoLobbyProps) => {
  const [mesas, setMesas] = useState<MesaLobby[]>([]);
  const [procurandoFila, setProcurandoFila] = useState(false);
  const [jogadoresNaFila, setJogadoresNaFila] = useState<number>(0);

  // Busca as mesas do banco de dados
  const carregarMesas = async () => {
    try {
      const { data, error } = await supabase
        .from('domino_salas')
        .select(`
          id,
          numero,
          jogador_1_id,
          jogador_2_id,
          jogador_1:jogador_1_id ( id, nome, foto_url ),
          jogador_2:jogador_2_id ( id, nome, foto_url )
        `)
        .order('numero', { ascending: true });

      if (error) throw error;

      if (data) {
        const mesasFormatadas: MesaLobby[] = data.map((mesa: any) => {
          const emPartida = mesa.jogador_1_id !== null && mesa.jogador_2_id !== null;
          return {
            id: mesa.id,
            numero: mesa.numero,
            jogador_1_id: mesa.jogador_1_id,
            jogador_2_id: mesa.jogador_2_id,
            jogador_1: mesa.jogador_1,
            jogador_2: mesa.jogador_2,
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
    carregarMesas();

    // Inscrição Realtime para atualizar as mesas automaticamente na tela do jogador
    const canalLobby = supabase
      .channel('lobby-domino')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'domino_salas' },
        () => {
          carregarMesas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalLobby);
    };
  }, []);

  const alternarFilaEspera = () => {
    setProcurandoFila(!procurandoFila);
    setJogadoresNaFila(prev => !procurandoFila ? prev + 1 : Math.max(0, prev - 1));
  };

  const tentarEntrarNaMesa = async (mesa: MesaLobby) => {
    if (mesa.status === 'Em Partida') return;

    try {
      let updateData: any = {};
      
      if (!mesa.jogador_1_id) {
        updateData.jogador_1_id = usuarioId;
      } else if (!mesa.jogador_2_id && mesa.jogador_1_id !== usuarioId) {
        updateData.jogador_2_id = usuarioId;
      } else {
        // Usuário já está na mesa, apenas entra
        onSelecionarSala(mesa.id, mesa.numero);
        return;
      }

      const { error } = await supabase
        .from('domino_salas')
        .update(updateData)
        .eq('id', mesa.id);

      if (error) throw error;

      onSelecionarSala(mesa.id, mesa.numero);
    } catch (err) {
      console.error('Erro ao entrar na mesa:', err);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-[#090610] text-slate-900 dark:text-white transition-colors duration-200 font-sans p-4 md:p-6 select-none">
      
      {/* 1. HEADER DO LOBBY */}
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-6 bg-white dark:bg-[#110D1A]/95 border border-slate-200 dark:border-purple-950/40 p-4 rounded-2xl shadow-sm dark:shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-wide">Dominó do Paredão</h1>
            <p className="text-xs text-slate-500 dark:text-gray-400">Olá, <strong className="text-purple-600 dark:text-purple-400">{usuarioNome}</strong></p>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onSair}
          className="text-slate-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          <LogOut className="w-4 h-4 mr-1.5" /> Sair do Jogo
        </Button>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 2. CARD DE FILA DE ESPERA - MOVIDO DE FORMA DEFINITIVA PARA O TOPO */}
        <div className="w-full bg-white dark:bg-[#110D1A]/95 border border-slate-200 dark:border-purple-950/40 rounded-2xl p-5 shadow-sm dark:shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="p-3 bg-purple-100 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-md">Fila de espera atual</h2>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {jogadoresNaFila === 0 
                  ? "Ninguém na fila de espera no momento." 
                  : `${jogadoresNaFila} jogador(es) aguardando partida.`}
              </p>
            </div>
          </div>

          <Button
            onClick={alternarFilaEspera}
            className={`w-full sm:w-auto font-bold text-xs h-11 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
              procurandoFila 
                ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {procurandoFila ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Cancelar Busca
              </>
            ) : (
              <>
                <Search className="w-4 h-4" /> Entrar na Fila / Procurar Mesa
              </>
            )}
          </Button>
        </div>

        {/* 3. GRID DE MESAS DE JOGO (COMPATÍVEL COM MODO CLARO/ESCURO) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mesas.map((mesa) => {
            const jogador1 = mesa.jogador_1;
            const jogador2 = mesa.jogador_2;

            return (
              <div 
                key={mesa.id} 
                className="bg-white dark:bg-[#110D1A]/95 border border-slate-200 dark:border-purple-950/40 rounded-2xl p-5 shadow-sm dark:shadow-lg flex flex-col justify-between transition-transform duration-150 hover:scale-[1.01]"
              >
                {/* Header da Mesa */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-md text-slate-900 dark:text-white">Mesa de Jogo {mesa.numero}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400">Limite: 2 jogadores</p>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    mesa.status === 'Em Partida'
                      ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30'
                      : 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/30'
                  }`}>
                    {mesa.status}
                  </span>
                </div>

                {/* Área do Versus (VS) */}
                <div className="flex items-center justify-around py-4 bg-slate-50 dark:bg-[#0c0814] border border-slate-100 dark:border-purple-950/20 rounded-xl mb-4">
                  {/* Jogador 1 */}
                  <div className="flex flex-col items-center gap-2 w-24">
                    <img
                      src={obterAvatarUsuario(jogador1 ? jogador1.foto_url : null, jogador1 ? jogador1.id : null)}
                      alt={jogador1 ? jogador1.nome : "Vago"}
                      className={`w-12 h-12 rounded-full border-2 object-cover bg-slate-200 dark:bg-[#1c1230] ${
                        jogador1 ? 'border-purple-500' : 'border-dashed border-slate-300 dark:border-purple-900/40'
                      }`}
                    />
                    <span className="text-xs font-semibold truncate max-w-full text-slate-700 dark:text-gray-300">
                      {jogador1 ? jogador1.nome : "Vago"}
                    </span>
                  </div>

                  <span className="text-purple-500 dark:text-purple-400 font-black text-sm">VS</span>

                  {/* Jogador 2 */}
                  <div className="flex flex-col items-center gap-2 w-24">
                    <img
                      src={obterAvatarUsuario(jogador2 ? jogador2.foto_url : null, jogador2 ? jogador2.id : null)}
                      alt={jogador2 ? jogador2.nome : "Vago"}
                      className={`w-12 h-12 rounded-full border-2 object-cover bg-slate-200 dark:bg-[#1c1230] ${
                        jogador2 ? 'border-purple-500' : 'border-dashed border-slate-300 dark:border-purple-900/40'
                      }`}
                    />
                    <span className="text-xs font-semibold truncate max-w-full text-slate-700 dark:text-gray-300">
                      {jogador2 ? jogador2.nome : "Vago"}
                    </span>
                  </div>
                </div>

                {/* Ação de Entrar na Mesa */}
                <Button
                  disabled={mesa.status === 'Em Partida'}
                  onClick={() => tentarEntrarNaMesa(mesa)}
                  className={`w-full font-bold text-xs h-10 rounded-xl transition-all ${
                    mesa.status === 'Em Partida'
                      ? 'bg-slate-100 dark:bg-purple-950/20 text-slate-400 dark:text-gray-600 cursor-not-allowed border border-transparent dark:border-purple-950/30'
                      : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:scale-[1.01]'
                  }`}
                >
                  {mesa.status === 'Em Partida' ? 'Mesa Ocupada' : 'Sentar na Mesa / Jogar'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
