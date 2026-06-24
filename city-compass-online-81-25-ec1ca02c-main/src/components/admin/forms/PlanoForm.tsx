
import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { Tables } from '@/integrations/supabase/types';

type Plano = Tables<'planos'>;

interface PlanoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plano?: Plano;
  onSubmit: (dados: any) => void;
  isLoading?: boolean;
}

const planoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  preco_mensal: z.string().min(1, 'Preço é obrigatório'),
  limite_cupons: z.string().min(0, 'Limite de cupons é obrigatório'),
  limite_produtos: z.string().min(0, 'Limite de produtos é obrigatório'),
  produtos_destaque_permitidos: z.string().min(0, 'Produtos destaque é obrigatório'),
  prioridade_destaque: z.string().min(0, 'Prioridade de destaque é obrigatória'),
  acesso_eventos: z.boolean(),
  suporte_prioritario: z.boolean(),
  ativo: z.boolean(),
});

type PlanoFormData = z.infer<typeof planoSchema>;

export const PlanoForm = ({ open, onOpenChange, plano, onSubmit, isLoading }: PlanoFormProps) => {
  const form = useForm<PlanoFormData>({
    resolver: zodResolver(planoSchema),
    defaultValues: {
      nome: plano?.nome || '',
      descricao: plano?.descricao || '',
      preco_mensal: plano?.preco_mensal?.toString() || '0',
      limite_cupons: plano?.limite_cupons?.toString() || '0',
      limite_produtos: plano?.limite_produtos?.toString() || '0',
      produtos_destaque_permitidos: plano?.produtos_destaque_permitidos?.toString() || '0',
      prioridade_destaque: plano?.prioridade_destaque?.toString() || '0',
      acesso_eventos: plano?.acesso_eventos || false,
      suporte_prioritario: plano?.suporte_prioritario || false,
      ativo: plano?.ativo !== undefined ? plano.ativo : true,
    },
  });

  // Reset form when plano prop changes
  useEffect(() => {
    if (plano) {
      form.reset({
        nome: plano.nome || '',
        descricao: plano.descricao || '',
        preco_mensal: plano.preco_mensal?.toString() || '0',
        limite_cupons: plano.limite_cupons?.toString() || '0',
        limite_produtos: plano.limite_produtos?.toString() || '0',
        produtos_destaque_permitidos: plano.produtos_destaque_permitidos?.toString() || '0',
        prioridade_destaque: plano.prioridade_destaque?.toString() || '0',
        acesso_eventos: plano.acesso_eventos || false,
        suporte_prioritario: plano.suporte_prioritario || false,
        ativo: plano.ativo !== undefined ? plano.ativo : true,
      });
    } else {
      // Reset to default values for new plan
      form.reset({
        nome: '',
        descricao: '',
        preco_mensal: '0',
        limite_cupons: '0',
        limite_produtos: '0',
        produtos_destaque_permitidos: '0',
        prioridade_destaque: '0',
        acesso_eventos: false,
        suporte_prioritario: false,
        ativo: true,
      });
    }
  }, [plano, form]);

  const handleSubmit = (data: PlanoFormData) => {
    const dadosProcessados = {
      ...data,
      preco_mensal: parseFloat(data.preco_mensal),
      limite_cupons: parseInt(data.limite_cupons, 10),
      limite_produtos: parseInt(data.limite_produtos, 10),
      produtos_destaque_permitidos: parseInt(data.produtos_destaque_permitidos, 10),
      prioridade_destaque: parseInt(data.prioridade_destaque, 10),
    };
    
    console.log('📝 Dados do formulário:', dadosProcessados);
    onSubmit(dadosProcessados);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="text-lg sm:text-xl lg:text-2xl">
            {plano ? 'Editar Plano' : 'Novo Plano'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 sm:space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-foreground border-b pb-2">
                Informações Básicas
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Nome do Plano</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Plano Básico" 
                          className="h-9 sm:h-10 text-sm sm:text-base"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preco_mensal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Preço Mensal (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder="0.00"
                          className="h-9 sm:h-10 text-sm sm:text-base"
                          {...field} 
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
                    <FormLabel className="text-sm font-medium">Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva os benefícios do plano..."
                        rows={3}
                        className="resize-none text-sm sm:text-base"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Limites e Recursos */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-foreground border-b pb-2">
                Limites e Recursos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="limite_cupons"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Limite de Cupons</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="0"
                          className="h-9 sm:h-10 text-sm sm:text-base"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="limite_produtos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Limite de Produtos</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="0"
                          className="h-9 sm:h-10 text-sm sm:text-base"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="produtos_destaque_permitidos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Produtos Destaque</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="0"
                          className="h-9 sm:h-10 text-sm sm:text-base"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prioridade_destaque"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Prioridade Destaque</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="0"
                          className="h-9 sm:h-10 text-sm sm:text-base"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Configurações Avançadas */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-foreground border-b pb-2">
                Configurações Avançadas
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                <FormField
                  control={form.control}
                  name="acesso_eventos"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 sm:p-4 space-y-0">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <FormLabel className="text-xs sm:text-sm font-medium">
                          Acesso a Eventos
                        </FormLabel>
                        <div className="text-xs text-muted-foreground">
                          Permite criar eventos
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="suporte_prioritario"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 sm:p-4 space-y-0">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <FormLabel className="text-xs sm:text-sm font-medium">
                          Suporte Prioritário
                        </FormLabel>
                        <div className="text-xs text-muted-foreground">
                          Atendimento prioritário
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 sm:p-4 space-y-0">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <FormLabel className="text-xs sm:text-sm font-medium">
                          Plano Ativo
                        </FormLabel>
                        <div className="text-xs text-muted-foreground">
                          Disponível para contratação
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="w-full sm:w-auto h-9 sm:h-10 text-sm sm:text-base"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full sm:w-auto h-9 sm:h-10 text-sm sm:text-base"
              >
                {isLoading ? 'Salvando...' : (plano ? 'Atualizar Plano' : 'Criar Plano')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
