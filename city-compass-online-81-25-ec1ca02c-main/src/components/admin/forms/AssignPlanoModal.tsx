import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminPlanos } from '@/hooks/useAdminPlanos';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Empresa = Tables<'empresas'>;

interface AssignPlanoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresa?: Empresa;
  onSuccess?: () => void;
}

const assignPlanoSchema = z.object({
  plano_id: z.string().min(1, 'Selecione um plano'),
});

type AssignPlanoFormData = z.infer<typeof assignPlanoSchema>;

export const AssignPlanoModal = ({ open, onOpenChange, empresa, onSuccess }: AssignPlanoModalProps) => {
  const { toast } = useToast();
  const { planos } = useAdminPlanos();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AssignPlanoFormData>({
    resolver: zodResolver(assignPlanoSchema),
    defaultValues: {
      plano_id: empresa?.plano_atual_id || '',
    },
  });

  const handleSubmit = async (data: AssignPlanoFormData) => {
    if (!empresa) return;
    
    setIsLoading(true);
    try {
      // Se está atribuindo um plano (não removendo), calcular data de vencimento
      const updateData: any = { plano_atual_id: data.plano_id };
      
      if (data.plano_id) {
        const agora = new Date();
        const dataVencimentoAtual = empresa.plano_data_vencimento ? new Date(empresa.plano_data_vencimento) : null;
        
        // Se tem data de vencimento e ainda não expirou, adicionar 30 dias à data atual de vencimento
        // Se não tem ou já expirou, começar contagem a partir de agora
        const dataBase = (dataVencimentoAtual && dataVencimentoAtual > agora) ? dataVencimentoAtual : agora;
        
        const novaDataVencimento = new Date(dataBase);
        novaDataVencimento.setDate(novaDataVencimento.getDate() + 30);
        updateData.plano_data_vencimento = novaDataVencimento.toISOString();
      } else {
        updateData.plano_data_vencimento = null;
      }

      const { error } = await supabase
        .from('empresas')
        .update(updateData)
        .eq('id', empresa.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Plano atribuído com sucesso!',
      });
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atribuir plano:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atribuir plano. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Atribuir Plano - {empresa?.nome}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="plano_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um plano" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Nenhum plano (Gratuito)</SelectItem>
                      {planos?.map((plano) => (
                        <SelectItem key={plano.id} value={plano.id}>
                          {plano.nome} - R$ {plano.preco_mensal.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Atribuindo...' : 'Atribuir Plano'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};