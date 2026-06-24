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
    <Card className="enquete-gradient-subtle enquete-border-glow relative overflow-hidden">
      {/* Efeito de vidro no fundo */}
      <div className="absolute inset-0 enquete-glass" />
      
      {/* Padrão decorativo */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-enquete-text/20 to-transparent rounded-full transform rotate-45" />
      </div>
      
      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-center space-x-2">
          <Vote className="h-6 w-6 text-enquete-text drop-shadow-sm" />
          <CardTitle className="text-xl font-bold text-enquete-text drop-shadow-sm">
            {enqueteAtiva.titulo}
          </CardTitle>
        </div>
        {enqueteAtiva.descricao && (
          <p className="text-sm text-enquete-muted font-medium">{enqueteAtiva.descricao}</p>
        )}
        <div className="flex items-center space-x-4 text-sm text-enquete-muted">
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
                    className="flex items-center space-x-3 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
                  >
                    <Checkbox
                      id={`opcao-${index}`}
                      checked={selectedOpcoes.includes(index)}
                      onCheckedChange={(checked) => 
                        handleOptionChange(index, checked as boolean)
                      }
                      className="border-enquete-text data-[state=checked]:bg-enquete-text data-[state=checked]:text-enquete-primary"
                    />
                    <Label 
                      htmlFor={`opcao-${index}`}
                      className="flex-1 cursor-pointer text-enquete-text font-medium"
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
                    className="flex items-center space-x-3 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
                  >
                    <RadioGroupItem 
                      value={index.toString()} 
                      id={`opcao-${index}`}
                      className="border-enquete-text text-enquete-text"
                    />
                    <Label 
                      htmlFor={`opcao-${index}`}
                      className="flex-1 cursor-pointer text-enquete-text font-medium"
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
              className="w-full bg-white text-enquete-primary hover:bg-white/90 font-bold py-3 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02]"
            >
              {votarEnquete.isPending ? 'Votando...' : 'Votar Agora'}
            </Button>
          </div>
        ) : isAdmin ? (
          // Resultados da enquete (apenas para admins)
          <div className="space-y-4">
            <div className="text-center p-4 rounded-lg bg-white/20 backdrop-blur-sm">
              <p className="text-enquete-text font-bold text-lg mb-1">
                ✨ Obrigado pelo seu voto!
              </p>
              <p className="text-enquete-muted text-sm">
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
                      ? 'bg-white/30 ring-2 ring-white/50' 
                      : 'bg-white/10'
                  }`}
                >
                  <div className="flex justify-between items-center text-sm">
                    <span className={`font-medium ${
                      isSelected 
                        ? 'text-enquete-text font-bold' 
                        : 'text-enquete-text'
                    }`}>
                      {opcao}
                      {isSelected && ' ✨'}
                    </span>
                    <span className="text-enquete-muted font-bold">
                      {votes} votos ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={percentage} 
                      className="h-3 bg-white/20"
                    />
                    <div 
                      className="absolute top-0 left-0 h-3 bg-gradient-to-r from-white to-white/80 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Mensagem de agradecimento sem resultados
          <div className="text-center p-8 rounded-lg bg-white/20 backdrop-blur-sm">
            <p className="text-enquete-text font-bold text-lg mb-2">
              ✨ Obrigado pelo seu voto!
            </p>
            <p className="text-enquete-muted text-sm">
              Seu voto foi registrado com sucesso. Os resultados estão sendo analisados pela administração.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};