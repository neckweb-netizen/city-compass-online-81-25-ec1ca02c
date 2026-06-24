
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MessageCircle, ExternalLink, Calendar } from 'lucide-react';
import { useUserAvaliacoes } from '@/hooks/useAvaliacoes';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface AvaliacoesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AvaliacoesDialog = ({ open, onOpenChange }: AvaliacoesDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: avaliacoes, isLoading } = useUserAvaliacoes(user?.id);

  const handleVisitEmpresa = (empresa: any) => {
    navigate(`/local/${empresa.slug || empresa.id}`);
    onOpenChange(false);
  };

  const renderStars = (nota: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < nota ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Minhas Avaliações ({avaliacoes?.length || 0})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Carregando avaliações...</p>
            </div>
          ) : avaliacoes && avaliacoes.length > 0 ? (
            avaliacoes.map((avaliacao) => (
              <Card key={avaliacao.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {avaliacao.empresas?.imagem_capa_url ? (
                      <img
                        src={avaliacao.empresas.imagem_capa_url}
                        alt={avaliacao.empresas.nome}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        <Star className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {avaliacao.empresas?.nome}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {avaliacao.empresas?.categorias?.nome}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(avaliacao.criado_em).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 mb-3">
                        {renderStars(avaliacao.nota)}
                        <span className="ml-2 font-medium">{avaliacao.nota}/5</span>
                      </div>
                      
                      {avaliacao.comentario && (
                        <div className="bg-muted/50 rounded-lg p-3 mb-3">
                          <p className="text-sm">{avaliacao.comentario}</p>
                        </div>
                      )}
                      
                      {avaliacao.resposta_empresa && (
                        <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-3 mb-3">
                          <p className="text-sm font-medium text-primary mb-1">
                            Resposta da empresa:
                          </p>
                          <p className="text-sm">{avaliacao.resposta_empresa}</p>
                          {avaliacao.respondido_em && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(avaliacao.respondido_em).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVisitEmpresa(avaliacao.empresas)}
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ver Empresa
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação ainda</h3>
              <p className="text-muted-foreground mb-4">
                Avalie empresas que você visitou para ajudar outros usuários!
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
