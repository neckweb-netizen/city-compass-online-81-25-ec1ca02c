import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NeonCard } from '@/components/ui/neon-card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { useCidadePadrao } from '@/hooks/useCidadePadrao';
import { useNavigate } from 'react-router-dom';

interface Evento {
  id: string;
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim?: string;
  local?: string;
  imagem_banner?: string;
  
  categorias?: { nome: string };
  empresas?: { nome: string };
  cidades?: { nome: string; estado: string };
}

export const EventosSlider = () => {
  const { data: cidadePadrao } = useCidadePadrao();
  const navigate = useNavigate();

  const { data: eventos, isLoading } = useQuery({
    queryKey: ['eventos-home', cidadePadrao?.id],
    queryFn: async () => {
      if (!cidadePadrao?.id) return [];
      
      const { data, error } = await supabase
        .from('eventos')
        .select(`
          id,
          titulo,
          descricao,
          data_inicio,
          data_fim,
          local,
          endereco,
          imagem_banner,
          categorias(nome),
          empresas(nome),
          cidades(nome, estado)
        `)
        .eq('ativo', true)
        .eq('status_aprovacao', 'aprovado')
        .eq('cidade_id', cidadePadrao.id)
        .gte('data_inicio', new Date().toISOString())
        .order('data_inicio', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data as Evento[];
    },
    enabled: !!cidadePadrao?.id,
  });

  const handleEventoClick = (eventoId: string) => {
    navigate(`/evento/${eventoId}`);
  };

  if (isLoading) {
    return (
      <section className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="flex-1 h-64 rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!eventos || eventos.length === 0) {
    return null;
  }

  return (
    <NeonCard className="mx-2 sm:mx-4 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
          Próximos Eventos
        </h2>
        <button 
          onClick={() => navigate('/eventos')}
          className="text-sm text-primary hover:underline"
        >
          Ver todos
        </button>
      </div>

        <Carousel className="w-full" opts={{ align: "start" }}>
          <CarouselContent className="-ml-2 sm:-ml-4">
            {eventos.map((evento) => (
              <CarouselItem key={evento.id} className="pl-2 sm:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                <Card 
                  className="h-full cursor-pointer hover:shadow-lg transition-shadow duration-300"
                  onClick={() => handleEventoClick(evento.id)}
                 >
                  {evento.imagem_banner && (
                    <div className="relative w-full h-40 sm:h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={evento.imagem_banner}
                        alt={evento.titulo}
                        className="w-full h-full object-cover object-center"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                  )}
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-2 text-base sm:text-lg">
                      {evento.titulo}
                    </CardTitle>
                    {evento.categorias && (
                      <Badge variant="secondary" className="w-fit">
                        {evento.categorias.nome}
                      </Badge>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {evento.descricao && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {evento.descricao}
                      </p>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{new Date(evento.data_inicio).toLocaleDateString('pt-BR')}</span>
                      </div>
                      
                      {evento.data_fim && evento.data_fim !== evento.data_inicio && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>até {new Date(evento.data_fim).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                      
                      {evento.local && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="line-clamp-1">{evento.local}</span>
                        </div>
                      )}
                      
                      {evento.empresas && (
                        <div className="text-xs text-muted-foreground">
                          Por: {evento.empresas.nome}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {eventos.length > 1 && (
            <>
              <CarouselPrevious className="left-2 sm:left-4 bg-white/90 hover:bg-white shadow-lg" />
              <CarouselNext className="right-2 sm:right-4 bg-white/90 hover:bg-white shadow-lg" />
            </>
          )}
        </Carousel>
    </NeonCard>
  );
};