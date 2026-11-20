
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NeonCard } from '@/components/ui/neon-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogCancel, 
  AlertDialogAction 
} from '@/components/ui/alert-dialog';
import { CupomFormModal } from '@/components/forms/CupomFormModal';
import { Plus, Edit, Trash2, Calendar, Copy, Package, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePlanoLimites } from '@/hooks/usePlanoLimites';

interface EmpresaCuponsListProps {
  empresaId: string;
  isOwner?: boolean;
}

export const EmpresaCuponsList = ({ empresaId, isOwner = false }: EmpresaCuponsListProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCupom, setEditingCupom] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { verificarLimiteCupons } = usePlanoLimites();

  const { data: cupons, isLoading, isError, refetch } = useQuery({
    queryKey: ['empresa-cupons', empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cupons')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .gte('data_fim', new Date().toISOString())
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!empresaId
  });

  const excluirCupom = useMutation({
    mutationFn: async (cupomId: string) => {
      const { data: removed, error } = await supabase
        .from('cupons')
        .delete()
        .eq('id', cupomId)
        .eq('empresa_id', empresaId)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!removed) throw new Error('Cupom não encontrado ou sem permissão para excluir.');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['empresa-cupons', empresaId] });
      void queryClient.invalidateQueries({ queryKey: ['latest-cupons'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-cupons'] });
      toast({
        title: "Cupom excluído!",
        description: "O cupom foi removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir cupom",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleEdit = (cupom: any) => {
    setEditingCupom(cupom);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId || excluirCupom.isPending) return;
    try {
      await excluirCupom.mutateAsync(deleteId);
      setDeleteId(null);
    } catch {
      // Preservar confirmação quando a exclusão falhar.
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCupom(null);
  };

  const copyToClipboard = async (codigo: string) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Cópia indisponível');
      await navigator.clipboard.writeText(codigo);
      toast({ title: 'Código copiado!', description: 'O código do cupom foi copiado.' });
    } catch {
      toast({ title: 'Não foi possível copiar', description: 'Copie o código exibido manualmente.', variant: 'destructive' });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const isExpired = (dataFim: string) => {
    return new Date(dataFim) < new Date();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) return (
    <div role="alert" className="space-y-3 rounded-xl border p-6 text-center">
      <p className="font-semibold">Não foi possível carregar os cupons.</p>
      <Button type="button" variant="outline" onClick={() => { void refetch(); }}>Tentar novamente</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold">Cupons de Desconto</h2>
        {isOwner && (
          <Button 
            onClick={async () => {
              const podecriar = await verificarLimiteCupons();
              if (podecriar) {
                setShowForm(true);
              }
            }} 
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Cupom
          </Button>
        )}
      </div>

      {cupons && cupons.length > 0 ? (
        <div className="grid gap-4">
          {cupons.map((cupom) => (
            <Card key={cupom.id} className={`hover:shadow-lg transition-shadow ${isExpired(cupom.data_fim) ? 'opacity-75' : ''}`}>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                      <h3 className="font-semibold text-lg">{cupom.titulo}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="default">Ativo</Badge>
                        {isExpired(cupom.data_fim) && (
                          <Badge variant="destructive">Expirado</Badge>
                        )}
                      </div>
                    </div>
                    
                    {cupom.descricao && (
                      <p className="text-gray-600 text-sm mb-3">
                        {cupom.descricao}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Desconto:</span>
                        <span className="font-bold text-primary">
                          {cupom.tipo === 'porcentagem' ? `${cupom.valor}%` : `R$ ${cupom.valor}`}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Válido até {formatDate(cupom.data_fim)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Código:</span>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-xs">{cupom.codigo}</code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { void copyToClipboard(cupom.codigo); }}
                            aria-label={`Copiar código ${cupom.codigo}`}
                            className="min-h-10 px-3"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {cupom.quantidade_total && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Uso:</span>
                          <span>{cupom.quantidade_usada}/{cupom.quantidade_total}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isOwner && (
                    <div className="flex gap-2 justify-end lg:flex-col lg:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(cupom)}
                        disabled={excluirCupom.isPending}
                        aria-label={`Editar cupom ${cupom.titulo}`}
                        className="flex-1 lg:flex-none"
                      >
                        <Edit className="w-4 h-4 sm:mr-0 lg:mr-2" />
                        <span className="sm:hidden lg:inline">Editar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteId(cupom.id)}
                        disabled={excluirCupom.isPending}
                        aria-label={`Excluir cupom ${cupom.titulo}`}
                        className="flex-1 lg:flex-none"
                      >
                        <Trash2 className="w-4 h-4 sm:mr-0 lg:mr-2" />
                        <span className="sm:hidden lg:inline">Excluir</span>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum cupom disponível</h3>
            <p className="text-muted-foreground mb-4">
              Esta empresa ainda não possui cupons de desconto ativos.
            </p>
            {isOwner && (
              <Button 
                onClick={async () => {
                  const podecriar = await verificarLimiteCupons();
                  if (podecriar) {
                    setShowForm(true);
                  }
                }} 
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Cupom
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {isOwner && showForm && (
        <CupomFormModal
          open={showForm}
          onOpenChange={handleCloseForm}
          empresaId={empresaId}
          cupom={editingCupom}
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: ['empresa-cupons', empresaId] });
      void queryClient.invalidateQueries({ queryKey: ['latest-cupons'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-cupons'] });
            handleCloseForm();
          }}
        />
      )}

      {isOwner && (
        <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open && !excluirCupom.isPending) setDeleteId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Cupom</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este cupom? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={excluirCupom.isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction disabled={excluirCupom.isPending} onClick={() => { void handleDelete(); }}>
                {excluirCupom.isPending ? 'Excluindo...' : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};
