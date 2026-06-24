
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useEnderecosEmpresa } from '@/hooks/useEnderecosEmpresa';
import { 
  MapPin, 
  Navigation, 
  Clock,
  Phone,
  Globe
} from 'lucide-react';

interface EmpresaLocationProps {
  empresa: {
    id: string;
    nome: string;
    endereco?: string;
    telefone?: string;
    site?: string;
    horario_funcionamento?: any;
    cidades?: { nome: string };
  };
}

export const EmpresaLocation = ({ empresa }: EmpresaLocationProps) => {
  const { toast } = useToast();
  const { enderecos } = useEnderecosEmpresa(empresa.id);

  const handleGetDirections = (endereco?: string) => {
    const addressToUse = endereco || empresa.endereco;
    if (addressToUse) {
      const encodedAddress = encodeURIComponent(addressToUse);
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isMobile) {
        if (isIOS) {
          // Para iOS, usar Apple Maps
          window.open(`maps://?daddr=${encodedAddress}`, '_self');
        } else {
          // Para Android, usar Google Maps
          window.open(`google.navigation:q=${encodedAddress}`, '_self');
        }
      } else {
        // Para desktop, usar Google Maps no navegador
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
      }
    } else {
      toast({
        title: "Endereço indisponível",
        description: "Esta empresa não possui endereço cadastrado.",
        variant: "destructive"
      });
    }
  };

  const handleShowOnMap = (endereco?: string) => {
    const addressToUse = endereco || empresa.endereco;
    if (addressToUse) {
      const encodedAddress = encodeURIComponent(addressToUse);
      // Sempre usar Google Maps no navegador para visualizar
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  };

  const isOpenNow = () => {
    if (!empresa.horario_funcionamento) return false;
    
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const todayName = dayNames[currentDay];
    
    const todaySchedule = empresa.horario_funcionamento[todayName];
    
    if (!todaySchedule || !todaySchedule.aberto) return false;
    
    const [openHour, openMinute] = todaySchedule.abertura.split(':').map(Number);
    const [closeHour, closeMinute] = todaySchedule.fechamento.split(':').map(Number);
    
    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;
    
    return currentTime >= openTime && currentTime <= closeTime;
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hour, minute] = time.split(':');
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  };

  const getDayName = (key: string) => {
    const days = {
      'segunda': 'Segunda-feira',
      'terca': 'Terça-feira',
      'quarta': 'Quarta-feira',
      'quinta': 'Quinta-feira',
      'sexta': 'Sexta-feira',
      'sabado': 'Sábado',
      'domingo': 'Domingo'
    };
    return days[key] || key;
  };

  const getShortDayName = (key: string) => {
    const days = {
      'segunda': 'Seg',
      'terca': 'Ter',
      'quarta': 'Qua',
      'quinta': 'Qui',
      'sexta': 'Sex',
      'sabado': 'Sáb',
      'domingo': 'Dom'
    };
    return days[key] || key;
  };

  const renderSchedule = () => {
    if (!empresa.horario_funcionamento || Object.keys(empresa.horario_funcionamento).length === 0) {
      // Quando não há horários configurados
      return (
        <div className="text-muted-foreground text-sm">
          Horários não informados
        </div>
      );
    }

    // Usar horários salvos
    const dayOrder = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
    
    return dayOrder.map((day) => {
      const schedule = empresa.horario_funcionamento[day];
      
      if (!schedule) {
        return (
          <div key={day} className="flex justify-between items-center">
            <span className="hidden sm:inline text-sm">{getDayName(day)}:</span>
            <span className="sm:hidden text-sm">{getShortDayName(day)}:</span>
            <span className="text-red-600 text-sm">Fechado</span>
          </div>
        );
      }

      return (
        <div key={day} className="flex justify-between items-center">
          <span className="hidden sm:inline text-sm">{getDayName(day)}:</span>
          <span className="sm:hidden text-sm">{getShortDayName(day)}:</span>
          <span className={`text-sm ${schedule.aberto ? '' : 'text-red-600'}`}>
            {schedule.aberto 
              ? `${formatTime(schedule.abertura)} - ${formatTime(schedule.fechamento)}`
              : 'Fechado'
            }
          </span>
        </div>
      );
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Localização & Contato</h3>
          <Badge variant={isOpenNow() ? "default" : "secondary"} className="text-xs">
            {isOpenNow() ? "Aberto agora" : "Fechado"}
          </Badge>
        </div>
        
        <div className="space-y-4">
          {/* Endereços */}
          {(enderecos.length > 0 || empresa.endereco) && (
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">
                    {enderecos.length > 1 ? 'Endereços' : 'Endereço'}
                  </p>
                  
                  {/* Endereços da tabela enderecos_empresa */}
                  {enderecos.map((endereco, index) => (
                    <div key={endereco.id} className="mb-4 last:mb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground">
                          {endereco.nome_identificacao}
                        </p>
                        {endereco.principal && (
                          <Badge variant="default" className="text-xs">Principal</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{endereco.endereco}</p>
                      {endereco.bairro && (
                        <p className="text-xs text-muted-foreground">{endereco.bairro}</p>
                      )}
                      {endereco.telefone && (
                        <p className="text-xs text-muted-foreground">Tel: {endereco.telefone}</p>
                      )}
                      
                      <div className="flex gap-2 mt-2">
                        <Button 
                          onClick={() => handleGetDirections(endereco.endereco)}
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Navigation className="h-3 w-3 mr-1" />
                          Ir até lá
                        </Button>
                        <Button 
                          onClick={() => handleShowOnMap(endereco.endereco)}
                          variant="outline" 
                          size="sm"
                        >
                          Ver no Mapa
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Endereço principal da empresa (se não houver endereços na tabela separada) */}
                  {enderecos.length === 0 && empresa.endereco && (
                    <div>
                      <p className="text-sm text-muted-foreground">{empresa.endereco}</p>
                      {empresa.cidades && (
                        <p className="text-xs text-muted-foreground mt-1">{empresa.cidades.nome}</p>
                      )}
                      
                      <div className="flex gap-2 mt-2">
                        <Button 
                          onClick={() => handleGetDirections(empresa.endereco)}
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Navigation className="h-3 w-3 mr-1" />
                          Ir até lá
                        </Button>
                        <Button 
                          onClick={() => handleShowOnMap(empresa.endereco)}
                          variant="outline" 
                          size="sm"
                        >
                          Ver no Mapa
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Telefone */}
          {empresa.telefone && (
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-sm">Telefone</p>
                <a 
                  href={`tel:${empresa.telefone}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {empresa.telefone}
                </a>
              </div>
            </div>
          )}

          {/* Website */}
          {empresa.site && (
            <div className="flex items-center space-x-3">
              <Globe className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-sm">Website</p>
                <a 
                  href={empresa.site.startsWith('http') ? empresa.site : `https://${empresa.site}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {empresa.site}
                </a>
              </div>
            </div>
          )}

          {/* Horário de funcionamento */}
          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm mb-2">Horário de Funcionamento</p>
              <div className="text-muted-foreground space-y-1">
                {renderSchedule()}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
