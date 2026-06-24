
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAdminAvaliacoes, useRemoverAvaliacao } from '@/hooks/useAvaliacoes';
import { Star, Building2, User, Calendar, MessageSquare, Edit, Trash2 } from 'lucide-react';
import { EditAvaliacaoModal } from '@/components/admin/forms/EditAvaliacaoModal';

export const AvaliacoesSection = () => {
  const [editingAvaliacao, setEditingAvaliacao] = useState<any>(null);
  const { data: avaliacoes, isLoading } = useAdminAvaliacoes();
  const { mutate: removerAvaliacao, isPending: isRemoving } = useRemoverAvaliacao();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Avaliações</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando avaliações...</p>
        </div>
      </div>
    );
  }

  const renderStars = (nota: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < nota ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Avaliações</h2>
          <p className="text-muted-foreground">
            Visualize e gerencie as avaliações dos locais
          </p>
        </div>
        <Badge variant="outline">
          {avaliacoes?.length || 0} avaliações cadastradas
        </Badge>
      </div>
      
      <div className="grid gap-4">
        {avaliacoes?.map((avaliacao) => (
          <Card key={avaliacao.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <div className="flex">{renderStars(avaliacao.nota)}</div>
                    <span className="text-lg">({avaliacao.nota}/5)</span>
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {avaliacao.usuarios?.nome}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {avaliacao.empresas?.nome}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(avaliacao.criado_em).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {avaliacao.resposta_empresa ? (
                    <Badge variant="default">Respondida</Badge>
                  ) : (
                    <Badge variant="secondary">Pendente</Badge>
                  )}
                  {avaliacao.imagens && avaliacao.imagens.length > 0 && (
                    <Badge variant="outline">Com imagens</Badge>
                  )}
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingAvaliacao(avaliacao)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover Avaliação</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover esta avaliação? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removerAvaliacao(avaliacao.id)}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isRemoving}
                          >
                            {isRemoving ? 'Removendo...' : 'Remover'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {avaliacao.comentario && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Comentário do usuário:
                    </h4>
                    <p className="text-sm bg-muted p-3 rounded-lg">
                      "{avaliacao.comentario}"
                    </p>
                  </div>
                )}
                
                {avaliacao.resposta_empresa && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Resposta do local:
                    </h4>
                    <p className="text-sm bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                      "{avaliacao.resposta_empresa}"
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Respondido em: {avaliacao.respondido_em ? 
                        new Date(avaliacao.respondido_em).toLocaleDateString() : 
                        'Data não disponível'
                      }
                    </p>
                  </div>
                )}
                
                {avaliacao.imagens && avaliacao.imagens.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Imagens anexadas:</h4>
                    <div className="flex gap-2">
                      {avaliacao.imagens.map((imagem, index) => (
                        <Badge key={index} variant="outline">
                          Imagem {index + 1}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t text-xs text-muted-foreground">
                  <p>ID da avaliação: {avaliacao.id}</p>
                  <p>Última atualização: {new Date(avaliacao.atualizado_em).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )) || []}
        
        {(!avaliacoes || avaliacoes.length === 0) && (
          <Card>
            <CardContent className="text-center py-12">
              <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhuma avaliação cadastrada ainda.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {editingAvaliacao && (
        <EditAvaliacaoModal
          isOpen={!!editingAvaliacao}
          onClose={() => setEditingAvaliacao(null)}
          avaliacao={editingAvaliacao}
        />
      )}
    </div>
  );
};
