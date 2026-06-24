
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Edit, Tag } from 'lucide-react';

const categoriaSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  slug: z.string().min(2, 'Slug deve ter pelo menos 2 caracteres'),
  tipo: z.enum(['empresa', 'evento', 'servico']),
  icone_url: z.string().optional(),
  ativo: z.boolean().default(true),
});

type CategoriaFormData = z.infer<typeof categoriaSchema>;

interface EditCategoriaFormProps {
  categoria: any;
  onSuccess?: () => void;
}

export const EditCategoriaForm = ({ categoria, onSuccess }: EditCategoriaFormProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<CategoriaFormData>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: categoria.nome || '',
      slug: categoria.slug || '',
      tipo: categoria.tipo || 'empresa',
      icone_url: categoria.icone_url || '',
      ativo: categoria.ativo ?? true,
    },
  });

  const onSubmit = async (data: CategoriaFormData) => {
    try {
      console.log('Dados de edição enviados:', data);
      
      const { error } = await supabase
        .from('categorias')
        .update({
          nome: data.nome,
          slug: data.slug,
          tipo: data.tipo,
          icone_url: data.icone_url?.trim() || null,
          ativo: data.ativo,
        })
        .eq('id', categoria.id);

      if (error) {
        console.error('Erro do Supabase na edição:', error);
        throw error;
      }

      toast({ title: 'Categoria atualizada com sucesso!' });
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      toast({ 
        title: 'Erro ao atualizar categoria', 
        description: 'Tente novamente.',
        variant: 'destructive' 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Editar Categoria
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da categoria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="nome-categoria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="empresa">Empresa</SelectItem>
                      <SelectItem value="evento">Evento</SelectItem>
                      <SelectItem value="servico">Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icone_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ícone (URL ou Emoji)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://exemplo.com/icone.svg ou 🏢" 
                      {...field}
                      value={field.value || ''}
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
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Categoria ativa</FormLabel>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
