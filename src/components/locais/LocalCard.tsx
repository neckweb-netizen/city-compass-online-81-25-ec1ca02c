import { useState } from 'react';
import { NeonCard } from '@/components/ui/neon-card';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShareButton } from '@/components/ui/share-button';
import { useFavoritos } from '@/hooks/useFavoritos';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getOptimizedImageUrl } from '@/lib/imageOptimization';
import {
  Star,
  MapPin,
  Phone,
  Heart,
  Eye,
  Verified,
  Camera,
} from 'lucide-react';

interface LocalCardProps {
  empresa: {
    id: string;
    nome: string;
    descricao?: string;
    endereco?: string;
    telefone?: string;
    imagem_capa_url?: string;
    verificado: boolean;
    destaque: boolean;
    categorias?: {
      nome: string;
    };
    cidades?: {
      nome: string;
    };
    estatisticas?: {
      media_avaliacoes: number;
      total_avaliacoes: number;
      total_visualizacoes: number;
    };
  };
  onClick?: () => void;
  showActions?: boolean;
}

export const LocalCard = ({
  empresa,
  onClick,
  showActions = true,
}: LocalCardProps) => {
  const { user } = useAuth();

  const {
    verificarFavorito,
    adicionarFavorito,
    removerFavorito,
  } = useFavoritos();

  const { toast } = useToast();

  const [imageFailed, setImageFailed] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para favoritar empresas.',
        variant: 'destructive',
      });

      return;
    }

    if (verificarFavorito(empresa.id)) {
      removerFavorito.mutate(empresa.id);
    } else {
      adicionarFavorito.mutate(empresa.id);
    }
  };

  const isFavorited = user
    ? verificarFavorito(empresa.id)
    : false;

  const optimizedImageUrl = getOptimizedImageUrl(
    empresa.imagem_capa_url,
    640,
  );

  const showImage =
    Boolean(optimizedImageUrl) &&
    !imageFailed;

  return (
    <NeonCard className="group cursor-pointer border-0 bg-card backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
      <div className="relative overflow-hidden rounded-t-lg">
        {showImage ? (
          <div className="relative flex h-48 w-full items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
            <img
              src={optimizedImageUrl}
              alt={empresa.nome}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onClick={onClick}
              loading="lazy"
              decoding="async"
              width={640}
              height={384}
              sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) 50vw, 33vw"
              onError={() => setImageFailed(true)}
            />
          </div>
        ) : (
          <div
            className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-muted/50 to-muted"
            onClick={onClick}
          >
            <div className="text-center">
              <Camera className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Sem imagem
              </p>
            </div>
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-col space-y-1">
          {empresa.destaque && (
            <Badge className="bg-yellow-500 text-xs text-white">
              Destaque
            </Badge>
          )}

          {empresa.verificado && (
            <Badge className="flex items-center bg-green-500 text-xs text-white">
              <Verified className="mr-1 h-3 w-3" />
              Verificado
            </Badge>
          )}
        </div>

        {showActions && (
          <div className="absolute right-3 top-3 flex gap-2">
            <div onClick={(e) => e.stopPropagation()}>
              <ShareButton
                url={`${window.location.origin}/local/${empresa.id}`}
                title={empresa.nome}
                description={
                  empresa.descricao ||
                  `Confira ${empresa.nome} no nosso app`
                }
                variant="secondary"
                size="sm"
                className="rounded-full border border-border bg-card/90 p-2 opacity-0 transition-opacity hover:bg-card group-hover:opacity-100"
              />
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleFavoriteClick}
              className={`rounded-full p-2 opacity-0 transition-opacity group-hover:opacity-100 ${
                isFavorited
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'border border-border bg-card/90 hover:bg-card'
              }`}
              disabled={
                adicionarFavorito.isPending ||
                removerFavorito.isPending
              }
            >
              <Heart
                className={`h-4 w-4 ${
                  isFavorited ? 'fill-current' : ''
                }`}
              />
            </Button>
          </div>
        )}
      </div>

      <CardContent
        className="p-4"
        onClick={onClick}
      >
        <div className="space-y-3">
          <div>
            <h3 className="line-clamp-1 text-lg font-semibold transition-colors group-hover:text-primary">
              {empresa.nome}
            </h3>

            {empresa.categorias && (
              <Badge
                variant="secondary"
                className="mt-1 text-xs"
              >
                {empresa.categorias.nome}
              </Badge>
            )}
          </div>

          {empresa.descricao && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {empresa.descricao}
            </p>
          )}

          <div className="space-y-2">
            {empresa.endereco && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="mr-2 h-4 w-4 shrink-0 text-primary" />

                <span className="line-clamp-1">
                  {empresa.endereco}
                </span>
              </div>
            )}

            {empresa.telefone && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="mr-2 h-4 w-4 shrink-0 text-primary" />
                <span>{empresa.telefone}</span>
              </div>
            )}
          </div>

          {empresa.estatisticas && (
            <div className="flex items-center justify-between border-t pt-2">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />

                  <span className="text-sm font-medium">
                    {Number(
                      empresa.estatisticas.media_avaliacoes,
                    ).toFixed(1)}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    ({empresa.estatisticas.total_avaliacoes})
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4 text-muted-foreground" />

                  <span className="text-xs text-muted-foreground">
                    {empresa.estatisticas.total_visualizacoes}
                  </span>
                </div>
              </div>

              {empresa.cidades && (
                <span className="text-xs text-muted-foreground">
                  {empresa.cidades.nome}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </NeonCard>
  );
};
