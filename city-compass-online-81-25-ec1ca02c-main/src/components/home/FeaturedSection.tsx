
import { NeonCard } from '@/components/ui/neon-card';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEmpresasDestaque } from '@/hooks/useEmpresas';
import { Star, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

interface FeaturedSectionProps {
  cidadeId: string;
}

export const FeaturedSection = ({ cidadeId }: FeaturedSectionProps) => {
  const { data: empresasDestaque, isLoading } = useEmpresasDestaque(cidadeId);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <NeonCard className="mx-2 sm:mx-4 lg:mx-6 p-4">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <h2 className="text-lg sm:text-xl font-bold">⭐ Em Destaque</h2>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs sm:text-sm">
              Premium
            </Badge>
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
        
        <div className="flex space-x-3 sm:space-x-4 overflow-x-auto pb-4 scrollbar-hide">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="min-w-64 sm:min-w-72 lg:min-w-80 bg-card rounded-lg shadow-lg">
              <Skeleton className="h-28 sm:h-32 lg:h-36 w-full rounded-t-lg" />
              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </NeonCard>
    );
  }

  if (!empresasDestaque?.length) {
    return null;
  }

  const handleEmpresaClick = (empresaId: string) => {
    navigate(`/local/${empresaId}`);
  };

  return (
    <NeonCard className="mx-2 sm:mx-4 lg:mx-6 p-4">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <h2 className="text-lg sm:text-xl font-bold">⭐ Em Destaque</h2>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs sm:text-sm">
            Premium
          </Badge>
        </div>
        <button 
          onClick={() => navigate('/locais')}
          className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Ver todas →
        </button>
      </div>
      
      <div className="flex space-x-3 sm:space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        {empresasDestaque.slice(0, 6).map((empresa) => (
          <NeonCard 
            key={empresa.id} 
            className="min-w-64 sm:min-w-72 lg:min-w-80 bg-gradient-to-br from-card to-muted/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
            onClick={() => handleEmpresaClick(empresa.id)}
          >
            <CardContent className="p-0">
              <div className="relative h-28 sm:h-32 lg:h-36 bg-gradient-to-br from-primary/20 to-primary/10 rounded-t-lg overflow-hidden">
                {empresa.imagem_capa_url ? (
                  <img 
                    src={empresa.imagem_capa_url} 
                    alt={empresa.nome}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                    style={{ aspectRatio: '16/9' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <span className="text-muted-foreground text-sm">Sem imagem</span>
                  </div>
                )}
                <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
                  <Badge className="bg-primary/90 text-primary-foreground text-xs">
                    Destaque
                  </Badge>
                </div>
                {empresa.verificado && (
                  <div className="absolute top-1 sm:top-2 left-1 sm:left-2">
                    <Badge className="bg-green-500 text-white text-xs">
                      Verificado
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                <div className="space-y-1">
                  <h3 className="font-semibold text-base sm:text-lg leading-tight hover:text-primary transition-colors line-clamp-2">
                    {empresa.nome}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{empresa.categoria_nome}</p>
                </div>
                
                {empresa.endereco && (
                  <div className="flex items-center space-x-1 text-xs sm:text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="line-clamp-1 truncate">{empresa.endereco}</span>
                  </div>
                )}

                {empresa.total_avaliacoes > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-xs sm:text-sm">
                        {Number(empresa.media_avaliacoes).toFixed(1)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate">
                      ({empresa.total_avaliacoes} avaliações)
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </NeonCard>
        ))}
      </div>
    </NeonCard>
  );
};
