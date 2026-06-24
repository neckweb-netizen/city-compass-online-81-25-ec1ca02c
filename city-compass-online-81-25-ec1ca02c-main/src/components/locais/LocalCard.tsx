
import { NeonCard } from '@/components/ui/neon-card';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShareButton } from '@/components/ui/share-button';
import { useFavoritos } from '@/hooks/useFavoritos';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Star, 
  MapPin, 
  Phone, 
  Heart,
  Eye,
  Verified,
  Camera
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
    categorias?: { nome: string };
    cidades?: { nome: string };
    estatisticas?: {
      media_avaliacoes: number;
      total_avaliacoes: number;
      total_visualizacoes: number;
    };
  };
  onClick?: () => void;
  showActions?: boolean;
}

export const LocalCard = ({ empresa, onClick, showActions = true }: LocalCardProps) => {
  const { user } = useAuth();
  const { verificarFavorito, adicionarFavorito, removerFavorito } = useFavoritos();
  const { toast } = useToast();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para favoritar empresas.",
        variant: "destructive"
      });
      return;
    }

    if (verificarFavorito(empresa.id)) {
      removerFavorito.mutate(empresa.id);
    } else {
      adicionarFavorito.mutate(empresa.id);
    }
  };

  const isFavorited = user ? verificarFavorito(empresa.id) : false;

  return (
    <NeonCard className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-card backdrop-blur-sm">
      <div className="relative overflow-hidden rounded-t-lg">
        {empresa.imagem_capa_url ? (
          <>
            <img 
              src={empresa.imagem_capa_url} 
              alt={empresa.nome}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              onClick={onClick}
              crossOrigin="anonymous"
              loading="lazy"
              onError={(e) => {
                console.error('❌ Erro ao carregar imagem da empresa:', empresa.nome);
                console.error('❌ URL original da imagem:', empresa.imagem_capa_url);
                console.error('❌ Tipo de erro:', e.type);
                console.error('❌ Target src atual:', (e.target as HTMLImageElement)?.src);
                
                const img = e.currentTarget as HTMLImageElement;
                const originalUrl = empresa.imagem_capa_url!;
                
                // Para URLs do Google, tentar versão sem parâmetros de tamanho primeiro
                if (originalUrl.includes('googleusercontent.com') && !img.dataset.googleRetried) {
                  img.dataset.googleRetried = 'true';
                  // Remover parâmetros específicos do Google que podem causar problemas
                  let cleanUrl = originalUrl.split('=')[0]; // Remove tudo após o primeiro =
                  console.log('🔄 Tentando URL do Google limpa:', cleanUrl);
                  img.src = cleanUrl;
                  return;
                }
                
                // Tentar recarregar a imagem uma vez com timestamp para evitar cache
                if (!img.dataset.retried) {
                  img.dataset.retried = 'true';
                  const separator = originalUrl.includes('?') ? '&' : '?';
                  const retryUrl = `${originalUrl}${separator}t=${Date.now()}`;
                  console.log('🔄 Tentando com timestamp:', retryUrl);
                  img.src = retryUrl;
                  return;
                }
                
                console.warn('⚠️ Todas as tentativas falharam, mostrando fallback para:', empresa.nome);
                // Se ainda falhou, mostrar fallback
                img.style.display = 'none';
                const fallbackDiv = img.nextElementSibling as HTMLElement;
                if (fallbackDiv) {
                  fallbackDiv.style.display = 'flex';
                }
              }}
              onLoad={() => {
                console.log('✅ Imagem carregada com sucesso:', empresa.nome, empresa.imagem_capa_url);
              }}
            />
            {/* Fallback sempre presente, mas inicialmente escondido */}
            <div 
              className="w-full h-48 bg-gradient-to-br from-muted/50 to-muted hidden items-center justify-center group-hover:scale-105 transition-transform duration-300"
              onClick={onClick}
              style={{ display: 'none' }}
            >
              <div className="text-center">
                <Camera className="h-12 w-12 text-muted-foreground mb-2 mx-auto" />
                <p className="text-xs text-muted-foreground">Imagem não disponível</p>
              </div>
            </div>
          </>
        ) : (
          <div 
            className="w-full h-48 bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
            onClick={onClick}
          >
            <div className="text-center">
              <Camera className="h-12 w-12 text-muted-foreground mb-2 mx-auto" />
              <p className="text-xs text-muted-foreground">Sem imagem</p>
            </div>
          </div>
        )}
        
        {/* Badges no canto superior */}
        <div className="absolute top-3 left-3 flex flex-col space-y-1">
          {empresa.destaque && (
            <Badge className="bg-yellow-500 text-white text-xs">
              Destaque
            </Badge>
          )}
          {empresa.verificado && (
            <Badge className="bg-green-500 text-white text-xs flex items-center">
              <Verified className="h-3 w-3 mr-1" />
              Verificado
            </Badge>
          )}
        </div>
        
        {/* Ações no canto superior direito */}
        {showActions && (
          <div className="absolute top-3 right-3 flex gap-2">
            <div onClick={(e) => e.stopPropagation()}>
              <ShareButton 
                url={`${window.location.origin}/local/${empresa.id}`}
                title={empresa.nome}
                description={empresa.descricao || `Confira ${empresa.nome} no nosso app`}
                variant="secondary"
                size="sm"
                className="rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 hover:bg-card border border-border"
              />
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleFavoriteClick}
              className={`rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                isFavorited 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-card/90 hover:bg-card border border-border'
              }`}
              disabled={adicionarFavorito.isPending || removerFavorito.isPending}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
            </Button>
          </div>
        )}
      </div>

      <CardContent className="p-4" onClick={onClick}>
        <div className="space-y-3">
          {/* Header com nome e categoria */}
          <div>
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
              {empresa.nome}
            </h3>
            {empresa.categorias && (
              <Badge variant="secondary" className="text-xs mt-1">
                {empresa.categorias.nome}
              </Badge>
            )}
          </div>

          {/* Descrição */}
          {empresa.descricao && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {empresa.descricao}
            </p>
          )}

          {/* Informações de contato */}
          <div className="space-y-2">
            {empresa.endereco && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2 text-primary" />
                <span className="line-clamp-1">{empresa.endereco}</span>
              </div>
            )}
            
            {empresa.telefone && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="h-4 w-4 mr-2 text-primary" />
                <span>{empresa.telefone}</span>
              </div>
            )}
          </div>

          {/* Estatísticas */}
          {empresa.estatisticas && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">
                    {Number(empresa.estatisticas.media_avaliacoes).toFixed(1)}
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
