import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEnderecosEmpresa } from '@/hooks/useEnderecosEmpresa';
import { EnderecoFormModal } from './EnderecoFormModal';
import { MapPin, Phone, Clock, Star, Trash2, Edit } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface EnderecosListProps {
  empresaId: string;
  canEdit?: boolean;
}

export const EnderecosList = ({ empresaId, canEdit = false }: EnderecosListProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEndereco, setEditingEndereco] = useState<any>(null);
  const { enderecos, isLoading, deleteEndereco, definirPrincipal } = useEnderecosEmpresa(empresaId);

  const handleEdit = (endereco: any) => {
    setEditingEndereco(endereco);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEndereco(null);
  };

  const formatHorario = (horarios: any) => {
    if (!horarios) return 'Não informado';
    
    const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const hoje = new Date().getDay();
    const diaHoje = diasSemana[hoje];
    
    const horarioHoje = horarios[diaHoje];
    if (!horarioHoje || !horarioHoje.ativo) {
      return 'Fechado hoje';
    }
    
    return `${horarioHoje.abertura} - ${horarioHoje.fechamento}`;
  };

  if (isLoading) {
    return <div>Carregando endereços...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Endereços da Empresa</h3>
        {canEdit && (
          <Button onClick={() => setIsModalOpen(true)}>
            Adicionar Endereço
          </Button>
        )}
      </div>

      {enderecos.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Nenhum endereço cadastrado
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {enderecos.map((endereco) => (
            <Card key={endereco.id} className={endereco.principal ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {endereco.nome_identificacao}
                    {endereco.principal && (
                      <Badge variant="default" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Principal
                      </Badge>
                    )}
                  </CardTitle>
                  
                  {canEdit && (
                    <div className="flex gap-2">
                      {!endereco.principal && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => definirPrincipal(endereco.id)}
                        >
                          <Star className="h-4 w-4" />
                          Definir como Principal
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(endereco)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover Endereço</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover este endereço? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteEndereco(endereco.id)}>
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div>{endereco.endereco}</div>
                    {endereco.bairro && <div className="text-muted-foreground">{endereco.bairro}</div>}
                    {endereco.cep && <div className="text-muted-foreground">CEP: {endereco.cep}</div>}
                    <div className="text-muted-foreground">Cidade</div>
                  </div>
                </div>

                {endereco.telefone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{endereco.telefone}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatHorario(endereco.horario_funcionamento)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EnderecoFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        empresaId={empresaId}
        endereco={editingEndereco}
      />
    </div>
  );
};