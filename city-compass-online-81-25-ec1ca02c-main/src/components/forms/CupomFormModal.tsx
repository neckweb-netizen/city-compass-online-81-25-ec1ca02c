
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCidades } from '@/hooks/useCidades';
import { useQuery } from '@tanstack/react-query';
import { usePlanoLimites } from '@/hooks/usePlanoLimites';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tag } from 'lucide-react';

const cupomSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  codigo: z.string().min(3, 'Código deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  tipo: z.enum(['porcentagem', 'valor_fixo']),
  valor: z.number().min(0.01, 'Valor deve ser maior que 0'),
  empresa_id: z.string().uuid('Selecione uma empresa'),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_fim: z.string().min(1, 'Data de fim é obrigatória'),
  quantidade_total: z.number().min(1, 'Quantidade deve ser pelo menos 1').optional(),
});

type CupomFormData = z.infer<typeof cupomSchema>;

interface CupomFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId?: string;
  cupom?: any;
  onSuccess?: () => void;
}

export const CupomFormModal = ({ open, onOpenChange, empresaId, cupom, onSuccess }: CupomFormModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { verificarLimiteCupons } = usePlanoLimites();

  // Buscar empresas do usuário logado
  const { data: empresas } = useQuery({
    queryKey: ['user-empresas-cupom'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nome')
        .eq('usuario_id', user?.id)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const form = useForm<CupomFormData>({
    resolver: zodResolver(cupomSchema),
    defaultValues: cupom || {
      tipo: 'porcentagem',
      empresa_id: empresaId || '',
    },
  });

  const onSubmit = async (data: CupomFormData) => {
    try {
      if (cupom) {
        // Editar cupom existente
        const { error } = await supabase
          .from('cupons')
          .update({
            titulo: data.titulo,
            codigo: data.codigo.toUpperCase(),
            descricao: data.descricao || null,
            tipo: data.tipo,
            valor: data.valor,
            empresa_id: data.empresa_id,
            data_inicio: data.data_inicio,
            data_fim: data.data_fim,
            quantidade_total: data.quantidade_total || null,
          })
          .eq('id', cupom.id);

        if (error) throw error;
        toast({ title: 'Cupom atualizado com sucesso!' });
      } else {
        // Verificar limite do plano antes de criar novo cupom
        const podecriar = await verificarLimiteCupons();
        if (!podecriar) {
          return;
        }

        // Criar novo cupom
        const { error } = await supabase
          .from('cupons')
          .insert({
            titulo: data.titulo,
            codigo: data.codigo.toUpperCase(),
            descricao: data.descricao || null,
            tipo: data.tipo,
            valor: data.valor,
            empresa_id: data.empresa_id,
            data_inicio: data.data_inicio,
            data_fim: data.data_fim,
            quantidade_total: data.quantidade_total || null,
          });

        if (error) throw error;
        toast({ title: 'Cupom criado com sucesso!' });
      }

      form.reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar cupom:', error);
      toast({ 
        title: `Erro ao ${cupom ? 'atualizar' : 'criar'} cupom`, 
        description: 'Tente novamente.',
        variant: 'destructive' 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[600px] h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            {cupom ? 'Editar Cupom' : 'Criar Novo Cupom'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Título do cupom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="DESCONTO10" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrição do cupom" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="porcentagem">Porcentagem</SelectItem>
                        <SelectItem value="valor_fixo">Valor Fixo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="10.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantidade_total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="Ilimitado"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="empresa_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma empresa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {empresas?.map((empresa) => (
                        <SelectItem key={empresa.id} value={empresa.id}>
                          {empresa.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Fim</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        </div>
        
        {/* Botões fixos na parte inferior */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            {cupom ? 'Atualizar Cupom' : 'Criar Cupom'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
