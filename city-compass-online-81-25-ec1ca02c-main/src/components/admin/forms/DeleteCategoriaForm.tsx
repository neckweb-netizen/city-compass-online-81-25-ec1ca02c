
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface DeleteCategoriaFormProps {
  categoria: any;
  onSuccess?: () => void;
}

export const DeleteCategoriaForm = ({ categoria, onSuccess }: DeleteCategoriaFormProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setLoading(true);
    try {
      // Verificar se existem locais usando esta categoria
      const { data: empresas, error: empresasError } = await supabase
        .from('empresas')
        .select('id')
        .eq('categoria_id', categoria.id)
        .limit(1);

      if (empresasError) throw empresasError;

      if (empresas && empresas.length > 0) {
        toast({
          title: 'Não é possível deletar categoria',
          description: 'Existem locais vinculados a esta categoria. Remova as vinculações primeiro.',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      // Verificar se existem eventos usando esta categoria
      const { data: eventos, error: eventosError } = await supabase
        .from('eventos')
        .select('id')
        .eq('categoria_id', categoria.id)
        .limit(1);

      if (eventosError) throw eventosError;

      if (eventos && eventos.length > 0) {
        toast({
          title: 'Não é possível deletar categoria',
          description: 'Existem eventos vinculados a esta categoria. Remova as vinculações primeiro.',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      // Deletar categoria
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', categoria.id);

      if (error) throw error;

      toast({ title: 'Categoria deletada com sucesso!' });
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      toast({
        title: 'Erro ao deletar categoria',
        description: 'Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="w-4 h-4 mr-2" />
          Deletar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja deletar a categoria "{categoria.nome}"? 
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Deletando...' : 'Deletar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
