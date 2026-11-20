
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v3';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMinhaEmpresa } from '@/hooks/useMinhaEmpresa';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ImageUpload } from '@/components/ui/image-upload';
import { HorarioFuncionamentoFormField } from '@/components/admin/forms/HorarioFuncionamentoFormField';
import { HorarioFuncionamento } from '@/types/horarios';

const empresaSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  endereco: z.string().optional(),
  telefone: z.string().optional(),
  site: z.string().url('URL inválida').optional().or(z.literal('')),
  link_radio: z.string().url('URL inválida').optional().or(z.literal('')),
  categoria_id: z.string().uuid('Categoria é obrigatória'),
  imagem_capa_url: z.string().optional(),
  horario_funcionamento: z.any().optional(),
});

type EmpresaFormData = z.infer<typeof empresaSchema>;

interface EmpresaEditFormProps {
  empresa: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EmpresaEditForm = ({ empresa, open, onOpenChange }: EmpresaEditFormProps) => {
  const { updateEmpresaAsync, isUpdating } = useMinhaEmpresa();
  const [horarios, setHorarios] = useState<HorarioFuncionamento>(empresa.horario_funcionamento || {});
  
  // Verificar se é um influencer - temporariamente comentado até ter o join com categorias
  // const isInfluencer = empresa?.categoria_id === 'categoria-influencers';
  const isInfluencer = false;

  const { data: categorias, isLoading: categoriasLoading, isError: categoriasError, refetch: refetchCategorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('ativo', true)
        .eq('tipo', 'empresa')
        .order('nome');
      
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      nome: empresa.nome || '',
      descricao: empresa.descricao || '',
      endereco: empresa.endereco || '',
      telefone: empresa.telefone || '',
      site: empresa.site || '',
      link_radio: empresa.link_radio || '',
      categoria_id: empresa.categoria_id || '',
      imagem_capa_url: empresa.imagem_capa_url || '',
    },
  });

  // React Hook Form reads defaultValues once; refresh when editing a different
  // business, but never discard unsaved changes while the dialog is open.
  useEffect(() => {
    if (!open) return;
    form.reset({
      nome: empresa.nome || '',
      descricao: empresa.descricao || '',
      endereco: empresa.endereco || '',
      telefone: empresa.telefone || '',
      site: empresa.site || '',
      link_radio: empresa.link_radio || '',
      categoria_id: empresa.categoria_id || '',
      imagem_capa_url: empresa.imagem_capa_url || '',
    });
    setHorarios(empresa.horario_funcionamento || {});
  }, [empresa.id, open, form.reset]);

  // Detectar mudança de categoria para mostrar/esconder campo da rádio
  const categoriaAtual = form.watch('categoria_id');
  const isRadioCategory = categorias?.find(cat => cat.id === categoriaAtual)?.nome === 'Rádios';

  const onSubmit = async (data: EmpresaFormData) => {
    if (isUpdating) return;
    if (categoriasError || categoriasLoading) return;
    try {
      await updateEmpresaAsync({
        nome: data.nome,
        descricao: data.descricao || null,
        endereco: data.endereco || null,
        telefone: data.telefone || null,
        site: data.site || null,
        link_radio: data.link_radio || null,
        categoria_id: data.categoria_id,
        imagem_capa_url: data.imagem_capa_url || null,
        horario_funcionamento: horarios,
      }, empresa.id);
      // Keep the dialog open if the database rejects the update.
      onOpenChange(false);
    } catch {
      // useMinhaEmpresa already displays the error toast.
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen && isUpdating) return; onOpenChange(nextOpen); }}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-[600px] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl sm:w-full">
        <DialogHeader>
          <DialogTitle>Editar Empresa</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da empresa" {...field} />
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={categoriasLoading || categoriasError} aria-label="Categoria da empresa">
                        <SelectValue placeholder={categoriasLoading ? 'Carregando categorias...' : 'Selecione uma categoria'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categorias?.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {categoriasError && (
                    <div role="alert" className="space-y-2 text-sm">
                      <p>Não foi possível carregar as categorias.</p>
                      <Button type="button" variant="outline" size="sm" onClick={() => { void refetchCategorias(); }}>Tentar novamente</Button>
                    </div>
                  )}
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
                    <Textarea placeholder="Descrição da empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="endereco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Endereço completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

                <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <PhoneInput {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="site"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site</FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo específico para rádios */}
            {isRadioCategory && (
              <FormField
                control={form.control}
                name="link_radio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link da Rádio (Stream)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://radio.exemplo.com/stream" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="imagem_capa_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imagem de Capa</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      bucket="imagens_empresas"
                      folder="capas"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <HorarioFuncionamentoFormField
                value={horarios}
                onChange={setHorarios}
              />
            </div>

            <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="min-h-11" disabled={isUpdating} onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="min-h-11" aria-busy={isUpdating} disabled={isUpdating || categoriasLoading || categoriasError}>
                {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
