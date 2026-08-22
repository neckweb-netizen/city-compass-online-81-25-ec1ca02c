import { NeonCard } from '@/components/ui/neon-card';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEmpresasDestaque } from '@/hooks/useEmpresas';
import { Star, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { getOptimizedImageUrl } from '@/lib/imageOptimization';

interface FeaturedSectionProps {
  cidadeId: string;
}

export const FeaturedSection = ({
  cidadeId,
}: FeaturedSectionProps) => {
  const {
    data: empresasDestaque,
    isLoading,
  } = useEmpresasDestaque(cidadeId);

  const navigate = useNavigate();

  if (isLoading) {
    return (
      <NeonCard className="mx-2 rounded-3xl border border-border/60 bg-card p-4 shadow-sm sm:mx-4 lg:mx-6">
        <div className="mb-3 flex items-center justify-between sm:mb-4">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <h2 className="text-lg font-bold sm:text-xl">
              ⭐ Em Destaque
            </h2>

            <Badge
              variant="secondary"
              className="bg-yellow-100 text-xs text-yellow-800 sm:text-sm"
            >
              Premium
            </Badge>
          </div>

          <Skeleton className="h-5 w-16" />
        </div>

        <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide sm:space-x-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="min-w-64 rounded-lg bg-card shadow-lg sm:min-w-72 lg:min-w-80"
            >
              <Skeleton className="h-28 w-full rounded-t-lg sm:h-32 lg:h-36" />

              <div className="space-y-2 p-3 sm:space-y-3 sm:p-4">
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
    <NeonCard className="mx-2 rounded-3xl border border-border/60 bg-card p-4 shadow-sm sm:mx-4 lg:mx-6">
      <div className="mb-3 flex items-center justify-between sm:mb-4">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <h2 className="text-lg font-bold sm:text-xl">
            ⭐ Em Destaque
          </h2>

          <Badge
            variant="secondary"
            className="bg-yellow-100 text-xs text-yellow-800 sm:text-sm"
          >
            Premium
          </Badge>
        </div>

        <button
          onClick={() => navigate('/locais')}
          className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          Ver todas →
        </button>
      </div>

      <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide sm:space-x-4">
        {empresasDestaque
          .slice(0, 6)
          .map((empresa) => {
            const imageUrl = getOptimizedImageUrl(
              empresa.imagem_capa_url,
              640,
            );

            return (
              <NeonCard
                key={empresa.id}
                className="min-w-64 cursor-pointer rounded-2xl bg-muted/40 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl sm:min-w-72 lg:min-w-80"
                onClick={() =>
                  handleEmpresaClick(empresa.id)
                }
              >
                <CardContent className="p-0">
                  <div className="relative h-28 overflow-hidden rounded-t-lg bg-gradient-to-br from-primary/20 to-primary/10 sm:h-32 lg:h-36">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={empresa.nome}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                        decoding="async"
                        width={640}
                        height={360}
                        sizes="(max-width: 640px) 256px, (max-width: 1024px) 288px, 320px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <span className="text-sm text-muted-foreground">
                          Sem imagem
                        </span>
                      </div>
                    )}

                    <div className="absolute right-1 top-1 sm:right-2 sm:top-2">
                      <Badge className="bg-primary/90 text-xs text-primary-foreground">
                        Destaque
                      </Badge>
                    </div>

                    {empresa.verificado && (
                      <div className="absolute left-1 top-1 sm:left-2 sm:top-2">
                        <Badge className="bg-green-500 text-xs text-white">
                          Verificado
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 p-3 sm:space-y-3 sm:p-4">
                    <div className="space-y-1">
                      <h3 className="line-clamp-2 text-base font-semibold leading-tight transition-colors hover:text-primary sm:text-lg">
                        {empresa.nome}
                      </h3>

                      <p className="line-clamp-1 text-xs text-muted-foreground sm:text-sm">
                        {empresa.categoria_nome}
                      </p>
                    </div>

                    {empresa.endereco && (
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground sm:text-sm">
                        <MapPin className="h-3 w-3 shrink-0" />

                        <span className="truncate">
                          {empresa.endereco}
                        </span>
                      </div>
                    )}

                    {empresa.total_avaliacoes > 0 && (
                      <div className="flex items-center space-x-1">
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 sm:h-4 sm:w-4" />

                          <span className="text-xs font-medium sm:text-sm">
                            {Number(
                              empresa.media_avaliacoes,
                            ).toFixed(1)}
                          </span>
                        </div>

                        <span className="truncate text-xs text-muted-foreground">
                          ({empresa.total_avaliacoes}{' '}
                          avaliações)
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </NeonCard>
            );
          })}
      </div>
    </NeonCard>
  );
};
