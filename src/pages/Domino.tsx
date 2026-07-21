import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DominoLobby } from '@/components/domino/DominoLobby';
import { DominoTabuleiro } from '@/components/domino/DominoTabuleiro';
import { useDominoLobby } from '@/hooks/useDominoLobby';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function DominoPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Hook central que controla todas as salas
  const lobbyData = useDominoLobby(user?.id || undefined);

  useEffect(() => {
    const obterUsuario = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
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
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  // Se a sala estiver totalmente ocupada pelos dois jogadores, abre o jogo de tabuleiro
  if (lobbyData.minhaSala && lobbyData.minhaSala.jogador_1_id && lobbyData.minhaSala.jogador_2_id) {
    return (
      <div className="min-h-screen bg-[#090610] text-white py-4">
        <DominoTabuleiro 
          usuarioId={user.id} 
          salaId={lobbyData.minhaSala.id} 
          numeroSala={lobbyData.minhaSala.numero_sala} 
          onVoltarAoLobby={() => lobbyData.sairDoJogo()}
        />
      </div>
    );
  }

  // Caso contrário, renderiza o lobby passando as props prontas para evitar duplicação do WebSocket
  return (
    <div className="min-h-screen bg-[#090610] text-white py-10">
      <DominoLobby usuarioId={user.id} />
    </div>
  );
}
