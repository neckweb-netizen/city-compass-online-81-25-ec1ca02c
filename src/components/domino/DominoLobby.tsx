import React from 'react';
import { useDominoLobby } from '@/hooks/useDominoLobby';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Hourglass, Gamepad2, ArrowRight, DoorOpen, Loader2 } from 'lucide-react';

interface DominoLobbyProps {
  usuarioId: string; // Passe o ID do usuário logado na sua aplicação
}

export const DominoLobby = ({ usuarioId }: DominoLobbyProps) => {
  const {
    salas,
    fila,
    minhaPosicaoFila,
    minhaSala,
    carregando,
    entrarNoJogo,
    sairDoJogo,
  } = useDominoLobby(usuarioId);

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="text-muted-foreground text-sm">Carregando salas de dominó...</p>
      </div>
    );
  }

  const jaEstaParticipando = minhaSala !== null || minhaPosicaoFila !== null;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Cabeçalho do Lobby */}
      <div className="text-center md:text-left space-y-2">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center justify-center md:justify-start gap-2">
          <Gamepad2 className="w-8 h-8 text-purple-600" />
          Dominó SAJ Online
        </h2>
        <p className="text-muted-foreground text-sm">
          Participe de partidas de dominó em tempo real com pessoas de Santo Antônio de Jesus!
        </p>
      </div>

      {/* Painel do Meu Status (Mostra apenas se o usuário entrou no jogo ou na fila) */}
      {jaEstaParticipando && (
        <Card className="bg-[#1f1635] border-purple-900/60 shadow-xl text-white">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="p-3 bg-purple-900/50 rounded-full">
                <Hourglass className="w-6 h-6 text-purple-400 animate-pulse" />
              </div>
              <div>
                {minhaSala ? (
                  <>
                    <h3 className="font-bold text-lg">Você está na Sala {minhaSala.numero_sala}!</h3>
                    <p className="text-xs text-purple-300">
                      {minhaSala.status === 'jogando' 
                        ? 'A partida começou! Prepare suas pedras.' 
                        : 'Aguardando outro jogador entrar na sua sala...'}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-lg">Você está na Fila de Espera</h3>
                    <p className="text-xs text-purple-300">
                      Sua posição atual na fila é: <span className="font-mono font-bold text-white bg-purple-800 px-2 py-0.5 rounded text-sm">{minhaPosicaoFila}º</span> de {fila.length} pessoas
                    </p>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              {minhaSala?.status === 'jogando' && (
                <Button 
                  className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white font-bold"
                  onClick={() => console.log('Abrir a tela do tabuleiro do jogo')}
                >
                  Ir para o Jogo <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              )}
              <Button 
                variant="destructive" 
                className="flex-1 md:flex-none font-semibold"
                onClick={sairDoJogo}
              >
                <DoorOpen className="w-4 h-4 mr-1.5" /> Sair da Fila / Sala
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grade de Exibição das 4 Salas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {salas.map((sala) => {
          const isUserInThisSala = sala.jogador_1_id === usuarioId || sala.jogador_2_id === usuarioId;
          
          return (
            <Card 
              key={sala.id} 
              className={`border transition-all duration-200 ${
                isUserInThisSala 
                  ? 'border-purple-500 bg-[#171026] shadow-md shadow-purple-900/20' 
                  : 'border-border bg-card'
              }`}
            >
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-md font-bold flex items-center gap-1.5">
                    Mesa de Jogo {sala.numero_sala}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Limite: 2 jogadores
                  </CardDescription>
                </div>
                <div>
                  {sala.status === 'jogando' ? (
                    <Badge variant="default" className="bg-red-600 text-white">Em Partida</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-600 text-white">Disponível</Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Visual dos dois Jogadores na mesa */}
                <div className="flex items-center justify-around py-2 bg-[#090610]/40 rounded-xl border border-dashed border-muted-foreground/10">
                  {/* Jogador 1 */}
                  <div className="flex flex-col items-center space-y-1.5">
                    <Avatar className="w-10 h-10 border-2 border-purple-500">
                      <AvatarFallback className="text-xs bg-purple-900 text-white font-bold">
                        {sala.jogador_1 ? sala.jogador_1.nome.charAt(0).toUpperCase() : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium max-w-[90px] truncate text-center">
                      {sala.jogador_1 ? sala.jogador_1.nome : 'Vago'}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-muted-foreground">VS</span>

                  {/* Jogador 2 */}
                  <div className="flex flex-col items-center space-y-1.5">
                    <Avatar className="w-10 h-10 border-2 border-purple-500">
                      <AvatarFallback className="text-xs bg-purple-900 text-white font-bold">
                        {sala.jogador_2 ? sala.jogador_2.nome.charAt(0).toUpperCase() : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium max-w-[90px] truncate text-center">
                      {sala.jogador_2 ? sala.jogador_2.nome : 'Vago'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Seção Fila de Espera & Ação Principal */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-muted/30 rounded-2xl border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 dark:bg-purple-950/30 rounded-xl text-purple-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Fila de espera atual</h4>
            <p className="text-xs text-muted-foreground">
              {fila.length === 0 
                ? 'Ninguém na fila de espera no momento.' 
                : `${fila.length} jogador(es) na fila aguardando liberação de mesa.`}
            </p>
          </div>
        </div>

        {/* Botão de participar principal */}
        {!jaEstaParticipando && (
          <Button 
            className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-5 rounded-xl shadow-lg shadow-purple-900/10 active:scale-[0.98] transition-all"
            onClick={entrarNoJogo}
          >
            Entrar na Fila / Procurar Mesa
          </Button>
        )}
      </div>
    </div>
  );
};
