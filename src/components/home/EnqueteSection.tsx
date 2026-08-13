import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Users, Vote } from 'lucide-react';
import { useEnquetes } from '@/hooks/useEnquetes';
import { useAuth } from '@/hooks/useAuth';

export const EnqueteSection = () => {
  const { enqueteAtiva, isLoading, votarEnquete } = useEnquetes();
  const { profile } = useAuth();
  const [selectedOpcoes, setSelectedOpcoes] = useState<number[]>([]);
  const [jaVotou, setJaVotou] = useState(false);

  const isAdmin = profile?.tipo_conta === 'admin_geral' || profile?.tipo_conta === 'admin_cidade';

  if (isLoading || !enqueteAtiva) {
    return null;
  }

  const handleVote = () => {
    if (selectedOpcoes.length === 0) return;
    
    votarEnquete.mutate(
      { enqueteId: enqueteAtiva.id, opcoes: selectedOpcoes },
      {
        onSuccess: () => {
          setJaVotou(true);
        }
      }
    );
  };

  const handleOptionChange = (opcaoIndex: number, checked: boolean) => {
    if (enqueteAtiva.multipla_escolha) {
      if (checked) {
        setSelectedOpcoes([...selectedOpcoes, opcaoIndex]);
      } else {
        setSelectedOpcoes(selectedOpcoes.filter(o => o !== opcaoIndex));
      }
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
                        handleOptionChange(index, checked as boolean)
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
              onClick={handleVote}
              disabled={selectedOpcoes.length === 0 || votarEnquete.isPending}
              className="w-full font-bold py-3 shadow-sm"
            >
              {votarEnquete.isPending ? 'Votando...' : 'Votar Agora'}
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
  );
};
