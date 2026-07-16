import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DominoLobby } from '@/components/domino/DominoLobby';
import { DominoTabuleiro } from '@/components/domino/DominoTabuleiro';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function DominoPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [telaAtiva, setTelaAtiva] = useState<'lobby' | 'tabuleiro'>('lobby');
  const [salaAtivaId, setSalaAtivaId] = useState<string | null>(null);
  const [numeroSalaAtiva, setNumeroSalaAtiva] = useState<number>(1);
  const navigate = useNavigate();

  useEffect(() => {
    const obterUsuario = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          verificarJogoEmAndamento(session.user.id);
        }
      } catch (err) {
        console.error("Erro ao verificar sessão:", err);
      } finally {
        setLoading(false);
      }
    };

    obterUsuario();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        verificarJogoEmAndamento(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Verifica se o usuário já está no meio de um jogo ativo ao carregar a página
  const verificarJogoEmAndamento = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('domino_salas')
        .select('id, numero_sala, status')
        .or(`jogador_1_id.eq.${userId},jogador_2_id.eq.${userId}`)
        .eq('status', 'jogando')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSalaAtivaId(data.id);
        setNumeroSalaAtiva(data.numero_sala);
        setTelaAtiva('tabuleiro');
      } else {
        setTelaAtiva('lobby');
      }
    } catch (err) {
      console.error('Erro ao verificar jogo ativo:', err);
    }
  };

  // Escuta alterações em tempo real para mandar o jogador para o tabuleiro assim que a mesa lotar
  useEffect(() => {
    if (!user) return;

    const canalSincronizadorRoteador = supabase
      .channel('roteador-realtime-domino')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'domino_salas' },
        (payload) => {
          const sala = payload.new;
          if (sala) {
            const euEstouNaSala = sala.jogador_1_id === user.id || sala.jogador_2_id === user.id;
            
            if (euEstouNaSala && sala.status === 'jogando') {
              setSalaAtivaId(sala.id);
              setNumeroSalaAtiva(sala.numero_sala);
              setTelaAtiva('tabuleiro');
            } else if (euEstouNaSala && sala.status === 'aguardando') {
              setTelaAtiva('lobby');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalSincronizadorRoteador);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090610] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="text-gray-400 text-sm">Carregando portal de jogos...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#090610] flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="max-w-md bg-[#110D1A] border border-purple-950/40 p-8 rounded-2xl shadow-xl space-y-6">
          <div className="p-4 bg-purple-950/30 border border-purple-900/30 rounded-full w-fit mx-auto text-purple-400">
            <AlertCircle className="w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Identificação Necessária</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Para jogar dominó online e acumular pontuação no ranking da cidade, você precisa fazer parte do portal SAJ Tem.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-11"
              onClick={() => navigate('/profile')}
            >
              Fazer Login / Criar Conta
            </Button>
            <Button 
              variant="ghost" 
              className="w-full text-gray-400 hover:text-white"
              onClick={() => navigate('/')}
            >
              Voltar ao Guia Comercial
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (telaAtiva === 'tabuleiro' && salaAtivaId) {
    return (
      <div className="min-h-screen bg-[#090610] text-white py-4">
        <DominoTabuleiro 
          usuarioId={user.id} 
          salaId={salaAtivaId} 
          numeroSala={numeroSalaAtiva} 
          onVoltarAoLobby={() => setTelaAtiva('lobby')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090610] text-white py-10">
      <DominoLobby usuarioId={user.id} />
    </div>
  );
}
