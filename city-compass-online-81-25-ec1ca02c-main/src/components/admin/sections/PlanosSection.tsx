
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, CreditCard, Check, X, UserPlus } from 'lucide-react';
import { useAdminPlanos } from '@/hooks/useAdminPlanos';
import { PlanoForm } from '@/components/admin/forms/PlanoForm';
import { AssignPlanoModal } from '@/components/admin/forms/AssignPlanoModal';
import { AssignPlanoManualModal } from '@/components/admin/forms/AssignPlanoManualModal';
import type { Tables } from '@/integrations/supabase/types';

type Plano = Tables<'planos'>;

export const PlanosSection = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [planoParaEditar, setPlanoParaEditar] = useState<Plano | undefined>();
  const [planoParaExcluir, setPlanoParaExcluir] = useState<Plano | undefined>();
  const [alertOpen, setAlertOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const {
    planos,
    isLoading,
    createPlano,
    updatePlano,
    deletePlano,
  } = useAdminPlanos();

  const handleNovoPlano = () => {
    setPlanoParaEditar(undefined);
    setDialogOpen(true);
  };

  const handleEditarPlano = (plano: Plano) => {
    setPlanoParaEditar(plano);
    setDialogOpen(true);
  };

  const handleExcluirPlano = (plano: Plano) => {
    setPlanoParaExcluir(plano);
    setAlertOpen(true);
  };

  const confirmarExclusao = () => {
    if (planoParaExcluir) {
      deletePlano.mutate(planoParaExcluir.id);
      setAlertOpen(false);
      setPlanoParaExcluir(undefined);
    }
  };

  const handleSubmitForm = (dados: any) => {
    if (planoParaEditar) {
      updatePlano.mutate({ 
        id: planoParaEditar.id, 
        dados 
      }, {
        onSuccess: () => setDialogOpen(false)
      });
    } else {
      createPlano.mutate(dados, {
        onSuccess: () => setDialogOpen(false)
      });
    }
  };

  const formatarPreco = (preco: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(preco);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Planos</h2>
          <p className="text-muted-foreground">
            Gerencie os planos de assinatura do sistema
          </p>
        </div>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Planos</h2>
          <p className="text-muted-foreground">
            Gerencie os planos de assinatura do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAssignModalOpen(true)} variant="outline">
            <UserPlus className="w-4 h-4 mr-2" />
            Atribuir Plano
          </Button>
          <Button onClick={handleNovoPlano}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Plano
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Planos Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!planos || planos.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum plano cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando seu primeiro plano de assinatura
              </p>
              <Button onClick={handleNovoPlano}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Plano
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Cupons</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Destaque</TableHead>
                  <TableHead>Eventos</TableHead>
                  <TableHead>Suporte</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planos.map((plano) => (
                  <TableRow key={plano.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{plano.nome}</div>
                        {plano.descricao && (
                          <div className="text-sm text-muted-foreground">
                            {plano.descricao}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatarPreco(plano.preco_mensal)}
                    </TableCell>
                    <TableCell>{plano.limite_cupons}</TableCell>
                    <TableCell>
                      {plano.limite_produtos}/{plano.produtos_destaque_permitidos}
                    </TableCell>
                    <TableCell>{plano.prioridade_destaque}</TableCell>
                    <TableCell>
                      {plano.acesso_eventos ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-red-600" />
                      )}
                    </TableCell>
                    <TableCell>
                      {plano.suporte_prioritario ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-red-600" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={plano.ativo ? 'default' : 'secondary'}>
                        {plano.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditarPlano(plano)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExcluirPlano(plano)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PlanoForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plano={planoParaEditar}
        onSubmit={handleSubmitForm}
        isLoading={createPlano.isPending || updatePlano.isPending}
      />

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o plano "{planoParaExcluir?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AssignPlanoManualModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        onSuccess={() => {
          // Pode adicionar refresh de dados se necessário
        }}
      />
    </div>
  );
};
