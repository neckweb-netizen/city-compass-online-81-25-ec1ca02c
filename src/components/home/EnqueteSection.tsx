import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Users, Vote } from 'lucide-react';
import { useEnquetes } from '@/hooks/useEnquetes';
import { useAuth } from '@/hooks/useAuth';
import { AuthDialog } from '@/components/auth/AuthDialog';

export const EnqueteSection = () => {
  const { enqueteAtiva, isLoading, isActiveError, refetchActive, votarEnquete } = useEnquetes();
  const { profile, user } = useAuth();
  const [selectedOpcoes, setSelectedOpcoes] = useState<number[]>([]);
  const [jaVotou, setJaVotou] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const votingRef = useRef(false);
  const currentAccountRef = useRef(user?.id ?? null);
  const currentPollRef = useRef(enqueteAtiva?.id ?? null);
  currentAccountRef.current = user?.id ?? null;
  currentPollRef.current = enqueteAtiva?.id ?? null;

  useEffect(() => {
    setSelectedOpcoes([]);
    setJaVotou(false);
  }, [enqueteAtiva?.id, user?.id]);

  const isAdmin = profile?.tipo_conta === 'admin_geral' || profile?.tipo_conta === 'admin_cidade';

  if (isLoading) return null;
  if (isActiveError) return (
    <Card role="alert" className="rounded-3xl"><CardContent className="space-y-3 p-6 text-center">
      <p>Não foi possível carregar a enquete.</p>
      <Button variant="outline" onClick={() => { void refetchActive(); }}>Tentar novamente</Button>
    </CardContent></Card>
  );
  if (!enqueteAtiva) return null;

  const handleVote = async () => {
    if (selectedOpcoes.length === 0 || votingRef.current || votarEnquete.isPending) return;
    if (!user) { setAuthOpen(true); return; }
    if (!enqueteAtiva || selectedOpcoes.some(index => !Number.isInteger(index) || index < 0 || index >= enqueteAtiva.opcoes.length) ||
        (!enqueteAtiva.multipla_escolha && selectedOpcoes.length !== 1) ||
        new Set(selectedOpcoes).size !== selectedOpcoes.length) return;
    const account = user.id;
    const pollId = enqueteAtiva.id;
    const choices = [...selectedOpcoes];
    votingRef.current = true;
    try {
      await votarEnquete.mutateAsync({ enqueteId: pollId, opcoes: choices });
      if (currentAccountRef.current === account && currentPollRef.current === pollId) setJaVotou(true);
    } catch {
      // O hook informa a falha e preserva a seleção para uma nova tentativa.
    } finally {
      votingRef.current = false;
    }
  };

  const handleOptionChange = (opcaoIndex: number, checked: boolean) => {
    if (enqueteAtiva.multipla_escolha) {
      setSelectedOpcoes(previous => checked
        ? previous.includes(opcaoIndex) ? previous : [...previous, opcaoIndex]
        : previous.filter(index => index !== opcaoIndex));
    } else {
      setSelectedOpcoes(checked ? [opcaoIndex] : []);
    }
  };

  const getPercentage = (opcaoIndex: number) => {
    if (enqueteAtiva.total_votos === 0) return 0;
    const resultado = enqueteAtiva.resultados.find(r => r.opcao_indice === opcaoIndex);
    return resultado ? (resultado.count / enqueteAtiva.total_votos) * 100 : 0;
  };

  const getVotes = (opcaoIndex: number) => {
    const resultado = enqueteAtiva.resultados.find(r => r.opcao_indice === opcaoIndex);
    return resultado?.count || 0;
  };

  return (
    <>
    <Card className="relative overflow-hidden rounded-3xl border border-border/60 bg-card text-card-foreground shadow-sm">
      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-center space-x-2">
          <Vote className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl font-bold text-foreground">
            {enqueteAtiva.titulo}
          </CardTitle>
        </div>
        {enqueteAtiva.descricao && (
          <p className="text-sm text-muted-foreground font-medium">{enqueteAtiva.descricao}</p>
        )}
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span className="font-medium">{enqueteAtiva.total_votos} votos</span>
          </div>
          <div className="flex items-center space-x-1">
            <BarChart3 className="h-4 w-4" />
            <span className="font-medium">
              {enqueteAtiva.multipla_escolha ? 'Múltipla escolha' : 'Escolha única'}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative z-10">
        {!jaVotou ? (
          // Interface de votação
          <div className="space-y-4">
            {enqueteAtiva.multipla_escolha ? (
              // Múltipla escolha
              <div className="space-y-3">
                {enqueteAtiva.opcoes.map((opcao, index) => (
                  <div 
                    key={index} 
                    className="flex items-center space-x-3 rounded-xl border border-border/40 bg-muted/40 p-3 transition-colors hover:bg-muted/60"
                  >
                    <Checkbox
                      id={`opcao-${index}`}
                      checked={selectedOpcoes.includes(index)}
                      onCheckedChange={(checked) =>
                        handleOptionChange(index, checked === true)
                      }
                      className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                    <Label 
                      htmlFor={`opcao-${index}`}
                      className="flex-1 cursor-pointer text-foreground font-medium"
                    >
                      {opcao}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              // Escolha única
              <RadioGroup
                value={selectedOpcoes[0]?.toString() || ''}
                onValueChange={(value) => setSelectedOpcoes([parseInt(value)])}
                className="space-y-3"
              >
                {enqueteAtiva.opcoes.map((opcao, index) => (
                  <div 
                    key={index} 
                    className="flex items-center space-x-3 rounded-xl border border-border/40 bg-muted/40 p-3 transition-colors hover:bg-muted/60"
                  >
                    <RadioGroupItem 
                      value={index.toString()} 
                      id={`opcao-${index}`}
                      className="border-primary text-primary"
                    />
                    <Label 
                      htmlFor={`opcao-${index}`}
                      className="flex-1 cursor-pointer text-foreground font-medium"
                    >
                      {opcao}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            <Button 
              onClick={() => { void handleVote(); }}
              disabled={selectedOpcoes.length === 0 || votarEnquete.isPending || votingRef.current}
              className="w-full font-bold py-3 shadow-sm"
            >
              {votarEnquete.isPending ? 'Votando...' : user ? 'Votar Agora' : 'Entrar para votar'}
            </Button>
          </div>
        ) : isAdmin ? (
          // Resultados da enquete (apenas para admins)
          <div className="space-y-4">
            <div className="text-center p-4 rounded-xl bg-muted/40">
              <p className="text-foreground font-bold text-lg mb-1">
                ✨ Obrigado pelo seu voto!
              </p>
              <p className="text-muted-foreground text-sm">
                Veja os resultados em tempo real:
              </p>
            </div>
            
            {enqueteAtiva.opcoes.map((opcao, index) => {
              const percentage = getPercentage(index);
              const votes = getVotes(index);
              const isSelected = selectedOpcoes.includes(index);
              
              return (
                <div 
                  key={index} 
                  className={`space-y-2 p-3 rounded-lg transition-all duration-200 ${
                    isSelected 
                      ? 'bg-primary/10 ring-2 ring-primary/30'
                      : 'bg-muted/40'
                  }`}
                >
                  <div className="flex justify-between items-center text-sm">
                    <span className={`font-medium ${
                      isSelected 
                        ? 'text-foreground font-bold'
                        : 'text-foreground'
                    }`}>
                      {opcao}
                      {isSelected && ' ✨'}
                    </span>
                    <span className="text-muted-foreground font-bold">
                      {votes} votos ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={percentage} 
                      className="h-3 bg-muted"
                    />
                    <div 
                      className="absolute top-0 left-0 h-3 bg-primary rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Mensagem de agradecimento sem resultados
          <div className="text-center p-8 rounded-xl bg-muted/40">
            <p className="text-foreground font-bold text-lg mb-2">
              ✨ Obrigado pelo seu voto!
            </p>
            <p className="text-muted-foreground text-sm">
              Seu voto foi registrado com sucesso. Os resultados estão sendo analisados pela administração.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
    <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab="login" />
    </>
  );
};
