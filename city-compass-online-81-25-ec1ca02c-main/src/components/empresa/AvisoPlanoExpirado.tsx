import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar } from 'lucide-react';
import { usePlanoLimites } from '@/hooks/usePlanoLimites';
import { useState } from 'react';
import { PlanosModal } from './PlanosModal';

export const AvisoPlanoExpirado = () => {
  const { planoAtual } = usePlanoLimites();
  const [modalPlanosOpen, setModalPlanosOpen] = useState(false);

  if (!planoAtual?.expirado) return null;

  const dataVencimento = planoAtual.data_vencimento 
    ? new Date(planoAtual.data_vencimento).toLocaleDateString('pt-BR')
    : '';

  return (
    <>
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Plano Expirado - Renovação Necessária</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-2">
          <p>
            Seu plano expirou em {dataVencimento}. Você está temporariamente no plano gratuito 
            com recursos limitados.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              Renove seu plano para continuar aproveitando todos os recursos
            </span>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="outline" onClick={() => setModalPlanosOpen(true)}>
              Ver Planos
            </Button>
            <Button size="sm" onClick={() => setModalPlanosOpen(true)}>
              Renovar Agora
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
    
    <PlanosModal
      isOpen={modalPlanosOpen}
      onClose={() => setModalPlanosOpen(false)}
    />
  </>
);
};