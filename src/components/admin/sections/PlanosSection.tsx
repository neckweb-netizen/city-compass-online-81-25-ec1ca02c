
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
import { formatarLimitePlano, formatarPrecoPlano, planoEmpresarial } from '@/lib/planos';
import { AiAssistantControls } from './AiAssistantControls';
import { AiKnowledgeControls } from './AiKnowledgeControls';

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
    <div className="min-w-0 space-y-6">
      <AiAssistantControls />
      <AiKnowledgeControls />
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Gestão de Planos</h2>
          <p className="text-muted-foreground">
            Gerencie os planos de assinatura do sistema
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2 sm:flex sm:shrink-0">
          <Button className="w-full sm:w-auto" onClick={() => setAssignModalOpen(true)} variant="outline">
            <UserPlus className="w-4 h-4 mr-2" />
            Atribuir Plano
          </Button>
          <Button className="w-full sm:w-auto" onClick={handleNovoPlano}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Plano
          </Button>
        </div>
      </div>

      <Card className="min-w-0">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <CreditCard className="h-5 w-5 shrink-0" />
            Planos Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 px-4 sm:px-6">
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
            <>
            <div className="grid gap-3 lg:hidden">
              {planos.map((plano) => (
                <article key={plano.id} className="min-w-0 rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words font-semibold">{plano.nome}</h3>
                      <p className="font-medium text-primary">{formatarPrecoPlano(plano)}</p>
                    </div>
                    <Badge variant={plano.ativo ? 'default' : 'secondary'}>
                      {planoEmpresarial(plano) ? 'Empresarial' : plano.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  {plano.descricao && <p className="mt-3 break-words text-sm text-muted-foreground">{plano.descricao}</p>}
                  <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-t pt-4 text-sm">
                    <div><dt className="text-muted-foreground">Cupons</dt><dd className="font-medium">{formatarLimitePlano(plano.limite_cupons)}</dd></div>
                    <div><dt className="text-muted-foreground">Produtos / destaque</dt><dd className="font-medium">{formatarLimitePlano(plano.limite_produtos)} / {formatarLimitePlano(plano.produtos_destaque_permitidos)}</dd></div>
                    <div><dt className="text-muted-foreground">Prioridade</dt><dd className="font-medium">{plano.prioridade_destaque}</dd></div>
                    <div><dt className="text-muted-foreground">Eventos</dt><dd className="font-medium">{plano.acesso_eventos ? 'Sim' : 'Não'}</dd></div>
                    <div><dt className="text-muted-foreground">Suporte prioritário</dt><dd className="font-medium">{plano.suporte_prioritario ? 'Sim' : 'Não'}</dd></div>
                  </dl>
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4">
                    <Button variant="outline" size="sm" className="min-w-0" onClick={() => handleEditarPlano(plano)} aria-label={`Editar ${plano.nome}`}>
                      <Edit className="mr-2 h-4 w-4 shrink-0" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" className="min-w-0 text-destructive hover:text-destructive" onClick={() => handleExcluirPlano(plano)} aria-label={`Excluir ${plano.nome}`}>
                      <Trash2 className="mr-2 h-4 w-4 shrink-0" /> Excluir
                    </Button>
                  </div>
                </article>
              ))}
            </div>
            <div className="hidden max-w-full overflow-x-auto lg:block">
            <Table className="min-w-[900px]">
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
                      {formatarPrecoPlano(plano)}
                    </TableCell>
                    <TableCell>{formatarLimitePlano(plano.limite_cupons)}</TableCell>
                    <TableCell>
                      {formatarLimitePlano(plano.limite_produtos)} / {formatarLimitePlano(plano.produtos_destaque_permitidos)}
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
                        {planoEmpresarial(plano) ? 'Empresarial' : plano.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditarPlano(plano)}
                          aria-label={`Editar ${plano.nome}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExcluirPlano(plano)}
                          aria-label={`Excluir ${plano.nome}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            </>
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
