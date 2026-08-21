
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, CreditCard, Crown, Infinity, Sparkles, Star, X } from 'lucide-react';
import { useAdminPlanos } from '@/hooks/useAdminPlanos';
import { useMinhaEmpresa } from '@/hooks/useMinhaEmpresa';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { PixPaymentModal } from './PixPaymentModal';
import { usePlanoLimites } from '@/hooks/usePlanoLimites';
import type { Tables } from '@/integrations/supabase/types';
import { formatarLimitePlano, formatarPrecoPlano, ordenarPlanos, planoEmpresarial, planoGratuito } from '@/lib/planos';

type Plano = Tables<'planos'>;

interface PlanosDisponiveisProps {
  empresaId: string;
}

export const PlanosDisponiveis = ({ empresaId }: PlanosDisponiveisProps) => {
  const { planos, isLoading } = useAdminPlanos();
  const { empresa } = useMinhaEmpresa();
  const { planoAtual } = usePlanoLimites(); // Adiciona o plano atual real
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedPlano, setSelectedPlano] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [planoParaPagamento, setPlanoParaPagamento] = useState<Plano | null>(null);

  const planosOrdenados = ordenarPlanos((planos || []).filter((plano) => plano.ativo));

  const handleSelecionarPlano = (plano: Plano) => {
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para contratar um plano',
        variant: 'destructive',
      });
      return;
    }

    setPlanoParaPagamento(plano);
    setPaymentModalOpen(true);
  };

  const isPlanoAtual = (planoId: string) => {
    // Se o plano está expirado, consideramos que está no plano gratuito
    if (planoAtual?.expirado) {
      // Encontra o plano gratuito (preço = 0)
      const gratuito = planos?.find(planoGratuito);
      return gratuito?.id === planoId;
    }
    return empresa?.plano_atual_id === planoId;
  };

  const podeRenovarPlano = (plano: Plano) => {
    return isPlanoAtual(plano.id) && empresa?.plano_data_vencimento;
  };

  const getPlanoStatus = (plano: Plano) => {
    if (isPlanoAtual(plano.id)) {
      return { text: 'Plano Atual', variant: 'default' as const, icon: Star };
    }
    if (selectedPlano === plano.id) {
      return { text: 'Selecionado', variant: 'secondary' as const, icon: Check };
    }
    return null;
  };

  const getBotaoTexto = (plano: Plano) => {
    if (podeRenovarPlano(plano)) {
      return 'Renovar Plano';
    }
    if (selectedPlano === plano.id) {
      return 'Selecionado';
    }
    return 'Selecionar Plano';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Planos Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!planos || planos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Planos Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum plano disponível</h3>
            <p className="text-muted-foreground">
              Não há planos disponíveis no momento.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Escolha seu Plano</h3>
        <p className="text-muted-foreground">
          Selecione o plano que melhor atende às necessidades da sua empresa
        </p>
      </div>

      <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
        {planosOrdenados.map((plano) => {
          const status = getPlanoStatus(plano);
          const StatusIcon = status?.icon;
          const empresarial = planoEmpresarial(plano);
          const gratuito = planoGratuito(plano);
          
          return (
            <Card 
              key={plano.id} 
              className={`relative flex h-full flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl ${empresarial ? 'border-violet-400/70 bg-gradient-to-b from-violet-500/15 to-card shadow-lg shadow-violet-500/10' : ''} ${isPlanoAtual(plano.id) ? 'ring-2 ring-primary border-primary' : ''}`}
            >
              {empresarial && (
                <div className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2 text-xs font-bold uppercase tracking-wider text-white">
                  <Crown className="h-4 w-4" /> Mais completo
                </div>
              )}
              {status && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant={status.variant} className="flex items-center gap-1">
                    <StatusIcon className="w-3 h-3" />
                    {status.text}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">{plano.nome}</CardTitle>
                {plano.descricao && (
                  <p className="text-sm text-muted-foreground">{plano.descricao}</p>
                )}
                <div className="pt-2">
                  <div className={`font-bold ${empresarial ? 'text-2xl text-violet-300' : 'text-3xl'}`}>
                    {formatarPrecoPlano(plano)}
                  </div>
                  {!gratuito && !empresarial && <div className="text-sm text-muted-foreground">por mês</div>}
                  {empresarial && <div className="text-xs text-muted-foreground">ativação personalizada para sua empresa</div>}
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col space-y-4">
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Limite de Cupons:</span>
                    <span className="font-semibold text-foreground">{formatarLimitePlano(plano.limite_cupons)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Limite de Produtos:</span>
                    <span className="font-semibold text-foreground">{formatarLimitePlano(plano.limite_produtos)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Produtos Destaque:</span>
                    <span className="font-semibold text-foreground">{formatarLimitePlano(plano.produtos_destaque_permitidos)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Acesso a Eventos:</span>
                    <span className="font-medium">
                      {plano.acesso_eventos ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm"><span>Fotos na galeria:</span><span className="font-semibold">{formatarLimitePlano(plano.limite_fotos_galeria)}</span></div>
                  <div className="flex items-center justify-between text-sm"><span>Agendamentos/mês:</span><span className="font-semibold">{formatarLimitePlano(plano.limite_agendamentos_mes)}</span></div>
                  <div className="flex items-center justify-between text-sm"><span>Vagas:</span><span className="font-semibold">{formatarLimitePlano(plano.limite_vagas)}</span></div>
                  <div className="flex items-center justify-between text-sm"><span>WhatsApp/mês:</span><span className="font-semibold">{formatarLimitePlano(plano.limite_notificacoes_whatsapp_mes)}</span></div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Prioridade Destaque:</span>
                    <span className="font-medium">{plano.prioridade_destaque}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Suporte Prioritário:</span>
                    <span className="font-medium">
                      {plano.suporte_prioritario ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="mt-auto pt-2">
                  {gratuito ? (
                    <div className="text-center py-2">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground"><Check className="h-4 w-4" /> Disponível gratuitamente</span>
                    </div>
                  ) : empresarial ? (
                    <Button className="w-full border-violet-400/50" variant="outline" disabled>
                      <Infinity className="mr-2 h-4 w-4" /> Solicite ao administrador
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => handleSelecionarPlano(plano)}
                      variant={selectedPlano === plano.id ? 'secondary' : (podeRenovarPlano(plano) ? 'outline' : 'default')}
                    >
                    <Sparkles className="w-4 h-4 mr-2" />
                      {getBotaoTexto(plano)}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(empresa?.plano_atual_id || planoAtual?.expirado) && (
        <Card className={`${planoAtual?.expirado ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
          <CardContent className="pt-6">
            <div className={`flex items-center gap-2 ${planoAtual?.expirado ? 'text-orange-700' : 'text-blue-700'}`}>
              <Star className="w-5 h-5" />
              <span className="font-medium">
                Você está no plano: {
                  planoAtual?.expirado 
                    ? `${planoAtual.nome} (Expirado - usando Gratuito)`
                    : (planos.find(p => p.id === empresa?.plano_atual_id)?.nome || 'N/A')
                }
              </span>
            </div>
            <p className={`text-sm mt-1 ${planoAtual?.expirado ? 'text-orange-600' : 'text-blue-600'}`}>
              {planoAtual?.expirado 
                ? 'Seu plano expirou. Renove ou contrate um novo plano para continuar aproveitando todos os recursos.'
                : 'Para alterar seu plano, selecione uma das opções acima.'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {planoParaPagamento && (
        <PixPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setPlanoParaPagamento(null);
          }}
          plano={planoParaPagamento}
        />
      )}
    </div>
  );
};
