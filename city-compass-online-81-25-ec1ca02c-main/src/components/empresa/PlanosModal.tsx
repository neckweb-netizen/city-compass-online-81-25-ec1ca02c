import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, CreditCard, Star, X } from 'lucide-react';
import { useAdminPlanos } from '@/hooks/useAdminPlanos';
import { useMinhaEmpresa } from '@/hooks/useMinhaEmpresa';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { PixPaymentModal } from './PixPaymentModal';
import type { Tables } from '@/integrations/supabase/types';

type Plano = Tables<'planos'>;

interface PlanosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlanosModal = ({ isOpen, onClose }: PlanosModalProps) => {
  const { planos, isLoading } = useAdminPlanos();
  const { empresa } = useMinhaEmpresa();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedPlano, setSelectedPlano] = React.useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = React.useState(false);
  const [planoParaPagamento, setPlanoParaPagamento] = React.useState<Plano | null>(null);

  // Filtrar apenas planos pagos (não gratuitos)
  const planosPagos = planos?.filter(plano => plano.preco_mensal > 0) || [];

  const formatarPreco = (preco: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(preco);
  };

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
    return empresa?.plano_atual_id === planoId;
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

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Planos de Assinatura
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (planosPagos.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Planos de Assinatura
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum plano disponível</h3>
            <p className="text-muted-foreground">
              Não há planos de assinatura disponíveis no momento.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Planos de Assinatura
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-2">Escolha seu Plano</h3>
              <p className="text-muted-foreground">
                Selecione o plano que melhor atende às necessidades da sua empresa
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {planosPagos.map((plano) => {
                const status = getPlanoStatus(plano);
                const StatusIcon = status?.icon;
                
                return (
                  <Card 
                    key={plano.id} 
                    className={`relative ${isPlanoAtual(plano.id) ? 'border-primary bg-primary/5' : ''}`}
                  >
                    {status && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge variant={status.variant} className="flex items-center gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {status.text}
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-4">
                      <CardTitle className="text-lg">{plano.nome}</CardTitle>
                      {plano.descricao && (
                        <p className="text-sm text-muted-foreground">{plano.descricao}</p>
                      )}
                      <div className="pt-2">
                        <div className="text-2xl font-bold">
                          {formatarPreco(plano.preco_mensal)}
                        </div>
                        <div className="text-sm text-muted-foreground">por mês</div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <Separator />
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Limite de Cupons:</span>
                          <span className="font-medium">{plano.limite_cupons}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span>Limite de Produtos:</span>
                          <span className="font-medium">{plano.limite_produtos}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span>Produtos Destaque:</span>
                          <span className="font-medium">{plano.produtos_destaque_permitidos}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span>Acesso a Eventos:</span>
                          <span className="font-medium">
                            {plano.acesso_eventos ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              '❌'
                            )}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span>Suporte Prioritário:</span>
                          <span className="font-medium">
                            {plano.suporte_prioritario ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              '❌'
                            )}
                          </span>
                        </div>
                      </div>

                      <Separator />

                      <div className="pt-2 space-y-2">
                        {isPlanoAtual(plano.id) ? (
                          <>
                            <Button className="w-full" disabled>
                              <Star className="w-4 h-4 mr-2" />
                              Plano Atual
                            </Button>
                            <Button 
                              className="w-full" 
                              onClick={() => handleSelecionarPlano(plano)}
                              variant="outline"
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Renovar Plano
                            </Button>
                          </>
                        ) : (
                          <Button 
                            className="w-full" 
                            onClick={() => handleSelecionarPlano(plano)}
                            variant={selectedPlano === plano.id ? 'secondary' : 'default'}
                          >
                            <CreditCard className="w-4 h-4 mr-2" />
                            {selectedPlano === plano.id ? 'Selecionado' : 'Selecionar Plano'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {empresa?.plano_atual_id && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Star className="w-5 h-5" />
                    <span className="font-medium">
                      Você está no plano: {planos?.find(p => p.id === empresa.plano_atual_id)?.nome || 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    Para alterar seu plano, selecione uma das opções acima.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  );
};