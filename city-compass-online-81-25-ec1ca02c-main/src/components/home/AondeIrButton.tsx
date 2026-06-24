import { useState } from 'react';
import { MapPin, Clock, Phone, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useLugaresPublicos } from '@/hooks/useLugaresPublicos';
import { useCidadePadrao } from '@/hooks/useCidadePadrao';
import { Skeleton } from '@/components/ui/skeleton';

const tipoLabels: Record<string, string> = {
  'praca': 'Praça',
  'biblioteca': 'Biblioteca',
  'cinema': 'Cinema',
  'parque': 'Parque',
  'terminal': 'Terminal',
  'estacao': 'Estação',
  'cultura': 'Centro Cultural',
  'shopping': 'Shopping',
  'mercado': 'Mercado',
  'hospital': 'Hospital',
  'escola': 'Escola',
  'museu': 'Museu'
};

export const AondeIrButton = () => {
  const [open, setOpen] = useState(false);
  const { data: cidade } = useCidadePadrao();
  const { data: lugares, isLoading } = useLugaresPublicos(cidade?.id);

  const handleNavigateToPlace = (endereco: string) => {
    // Codificar endereço para URL
    const encodedAddress = encodeURIComponent(endereco);
    
    // Detectar se é mobile ou desktop para escolher a melhor opção
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // No mobile, tentar abrir o app de mapas nativo primeiro
      const mapsUrl = `https://maps.google.com/maps?q=${encodedAddress}&navigate=yes`;
      window.open(mapsUrl, '_blank');
    } else {
      // No desktop, abrir Google Maps na web
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      window.open(mapsUrl, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <MapPin className="w-4 h-4 mr-2" />
          Aonde ir?
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Lugares para visitar em {cidade?.nome || 'Santo Antônio de Jesus'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          ) : lugares && lugares.length > 0 ? (
            <div className="grid gap-4">
              {lugares.map((lugar) => (
                <div 
                  key={lugar.id} 
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    lugar.destaque ? 'border-primary/30 bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{lugar.nome}</h3>
                        {lugar.destaque && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                            Destaque
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                          {tipoLabels[lugar.tipo] || lugar.tipo}
                        </span>
                      </div>
                      
                      {lugar.descricao && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {lugar.descricao}
                        </p>
                      )}
                      
                       <div className="space-y-2">
                         {lugar.endereco && (
                           <div className="flex items-center gap-2 text-sm text-muted-foreground">
                             <MapPin className="w-4 h-4" />
                             {lugar.endereco}
                           </div>
                         )}
                         
                         {lugar.telefone && (
                           <div className="flex items-center gap-2 text-sm text-muted-foreground">
                             <Phone className="w-4 h-4" />
                             {lugar.telefone}
                           </div>
                         )}
                         
                         {lugar.horario_funcionamento && (
                           <div className="flex items-center gap-2 text-sm text-muted-foreground">
                             <Clock className="w-4 h-4" />
                             Ver horários de funcionamento
                           </div>
                         )}
                       </div>
                       
                       {lugar.endereco && (
                         <div className="mt-3">
                           <Button
                             size="sm"
                             onClick={() => handleNavigateToPlace(lugar.endereco!)}
                             className="bg-primary hover:bg-primary/90"
                           >
                             <Navigation className="w-3 h-3 mr-1" />
                             Me leva lá!
                           </Button>
                         </div>
                       )}
                    </div>
                    
                    {lugar.imagem_url && (
                      <div className="ml-4">
                        <img 
                          src={lugar.imagem_url} 
                          alt={lugar.nome}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum lugar público cadastrado ainda.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};