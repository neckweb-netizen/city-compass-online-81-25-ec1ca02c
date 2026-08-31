import React from 'react';
import { useDominoRanking } from '@/hooks/useDominoRanking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Loader2 } from 'lucide-react';

export const DominoRanking = () => {
  const { ranking, carregando } = useDominoRanking(10);

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-2">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        <span className="text-xs text-gray-400">Carregando classificação...</span>
      </div>
    );
  }

  // Ícones do pódio para os 3 primeiros colocados
  const getIconePodio = (posicao: number) => {
    switch (posicao) {
      case 0:
        return <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />;
      case 1:
        return <Medal className="w-5 h-5 text-slate-300" />;
      case 2:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-xs font-mono font-bold text-gray-500">{posicao + 1}º</span>;
    }
  };

  return (
    <Card className="bg-[#110d1a] border-[#221b30] text-white shadow-2xl overflow-hidden">
      <CardHeader className="border-b border-purple-900/20 bg-[#171026] pb-4">
        <CardTitle className="text-lg font-extrabold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Mestres do Dominó (SAJ)
        </CardTitle>
        <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
          <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2 py-1.5 text-emerald-300">
            Vitória +3
          </div>
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-1.5 text-amber-300">
            Empate +1
          </div>
          <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-2 py-1.5 text-red-300">
            Derrota −2
          </div>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-gray-400">
          A pontuação nunca fica negativa. Se o jogador tiver menos de 2 pontos, uma derrota reduz o saldo até zero.
        </p>
      </CardHeader>

      <CardContent className="p-0 divide-y divide-purple-950/30">
        {ranking.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-400">
            Nenhuma partida contabilizada ainda. Seja o primeiro a vencer!
          </div>
        ) : (
          ranking.map((item, index) => {
            const nomeUsuario = item.usuario?.nome || 'Jogador Anônimo';
            const taxaVitoria = item.partidas_jogadas > 0 
              ? Math.round((item.vitorias / item.partidas_jogadas) * 100) 
              : 0;

            return (
              <div 
                key={item.usuario_id} 
                className={`flex items-center justify-between p-3.5 transition-colors ${
                  index === 0 ? 'bg-amber-500/5' : 'hover:bg-purple-950/20'
                }`}
              >
                {/* Lado Esquerdo: Posição + Avatar + Nome */}
                <div className="flex items-center gap-3">
                  <div className="w-6 flex justify-center items-center">
                    {getIconePodio(index)}
                  </div>

                  <Avatar className="w-9 h-9 border border-purple-800">
                    <AvatarImage src={item.usuario?.avatar_url} alt={nomeUsuario} />
                    <AvatarFallback className="bg-purple-900 text-white font-bold text-xs">
                      {nomeUsuario.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <p className="text-xs font-bold text-white max-w-[120px] sm:max-w-[180px] truncate">
                      {nomeUsuario}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {item.vitorias}V • {item.empates}E • {item.derrotas}D • {taxaVitoria}% vitórias
                    </p>
                  </div>
                </div>

                {/* Lado Direito: Total de Vitórias */}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-purple-950 text-purple-300 border border-purple-800/50 font-mono text-xs px-2.5 py-1">
                    <strong className="text-amber-400 mr-1">{item.pontuacao}</strong> pts
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
