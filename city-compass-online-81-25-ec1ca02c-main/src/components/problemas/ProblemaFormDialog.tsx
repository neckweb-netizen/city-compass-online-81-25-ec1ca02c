import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProblemasCidade, useCategoriasProblema } from '@/hooks/useProblemasCidade';
import { useCidadePadrao } from '@/hooks/useCidadePadrao';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const problemaSchema = z.object({
  titulo: z.string().min(10, 'O título deve ter pelo menos 10 caracteres').max(200),
  descricao: z.string().min(20, 'A descrição deve ter pelo menos 20 caracteres').max(2000),
  categoria_id: z.string().min(1, 'Selecione uma categoria'),
  endereco: z.string().min(5, 'Informe o endereço completo'),
  bairro: z.string().optional(),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']),
});

type ProblemaFormData = z.infer<typeof problemaSchema>;

interface ProblemaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProblemaFormDialog = ({ open, onOpenChange }: ProblemaFormDialogProps) => {
  const { data: cidadePadrao } = useCidadePadrao();
  const { categorias } = useCategoriasProblema();
  const { criarProblema } = useProblemasCidade();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProblemaFormData>({
    resolver: zodResolver(problemaSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      categoria_id: '',
      endereco: '',
      bairro: '',
      prioridade: 'media',
    },
  });

  const onSubmit = async (data: ProblemaFormData) => {
    if (!cidadePadrao) return;

    setIsSubmitting(true);
    try {
      await criarProblema.mutateAsync({
        titulo: data.titulo,
        descricao: data.descricao,
        categoria_id: data.categoria_id,
        endereco: data.endereco,
        bairro: data.bairro,
        prioridade: data.prioridade,
        cidade_id: cidadePadrao.id,
      });
      form.reset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Relatar Reclamação</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Melhoria na iluminação da via principal"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoria_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categorias?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prioridade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridade</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva sua reclamação em detalhes..."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Rua, número, complemento"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bairro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do bairro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Publicando...' : 'Publicar Reclamação'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
