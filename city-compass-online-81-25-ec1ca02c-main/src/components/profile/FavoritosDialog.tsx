
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Star, ExternalLink } from 'lucide-react';
import { useFavoritos } from '@/hooks/useFavoritos';
import { useNavigate } from 'react-router-dom';

interface FavoritosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FavoritosDialog = ({ open, onOpenChange }: FavoritosDialogProps) => {
  const { favoritos, removerFavorito } = useFavoritos();
  const navigate = useNavigate();

  const handleVisitEmpresa = (empresaId: string) => {
    navigate(`/local/${empresaId}`);
    onOpenChange(false);
  };

  const handleRemoveFavorito = (empresaId: string) => {
    removerFavorito.mutate(empresaId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Meus Favoritos ({favoritos?.length || 0})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {favoritos && favoritos.length > 0 ? (
            favoritos.map((favorito) => (
              <Card key={favorito.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {favorito.empresas?.imagem_capa_url ? (
                      <img
                        src={favorito.empresas.imagem_capa_url}
                        alt={favorito.empresas.nome}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        <Heart className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {favorito.empresas?.nome}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground mb-1">
                        {favorito.empresas?.categorias?.nome}
                      </p>
                      
                      {favorito.empresas?.endereco && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                          <MapPin className="h-3 w-3" />
                          {favorito.empresas.endereco}
                        </p>
                      )}
                      
                      {favorito.empresas?.estatisticas && 
                       favorito.empresas.estatisticas.total_avaliacoes > 0 && (
                        <div className="flex items-center gap-1 mb-3">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {Number(favorito.empresas.estatisticas.media_avaliacoes).toFixed(1)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({favorito.empresas.estatisticas.total_avaliacoes} avaliações)
                          </span>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleVisitEmpresa(favorito.empresas!.id)}
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ver Perfil
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveFavorito(favorito.empresa_id)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Heart className="h-3 w-3" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum favorito ainda</h3>
              <p className="text-muted-foreground mb-4">
                Comece a favoritar empresas que você gosta para vê-las aqui!
              </p>
              <Button onClick={() => onOpenChange(false)}>
                Explorar Empresas
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
