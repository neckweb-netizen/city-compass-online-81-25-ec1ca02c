
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCidadePadrao } from '@/hooks/useCidadePadrao';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Edit, Building2 } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { EnderecosList } from '@/components/empresa/EnderecosList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  verificado: z.boolean().default(false),
  destaque: z.boolean().default(false),
  ativo: z.boolean().default(true),
  horario_funcionamento: z.any().optional(),
});

type EmpresaFormData = z.infer<typeof empresaSchema>;

interface EditEmpresaFormProps {
  empresa: any;
  onSuccess?: () => void;
}

export const EditEmpresaForm = ({ empresa, onSuccess }: EditEmpresaFormProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dados');
  const [horarios, setHorarios] = useState<HorarioFuncionamento>(empresa.horario_funcionamento || {});
  const { toast } = useToast();
  const { data: cidadePadrao } = useCidadePadrao();

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('ativo', true)
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
      verificado: empresa.verificado || false,
      destaque: empresa.destaque || false,
      ativo: empresa.ativo !== undefined ? empresa.ativo : true,
    },
  });

  // Detectar mudança de categoria para mostrar/esconder campo da rádio
  const categoriaAtual = form.watch('categoria_id');
  const isRadioCategory = categorias?.find(cat => cat.id === categoriaAtual)?.nome === 'Rádios';

  const onSubmit = async (data: EmpresaFormData) => {
    try {
      if (!cidadePadrao) {
        toast({ 
          title: 'Erro', 
          description: 'Cidade padrão não encontrada',
          variant: 'destructive' 
        });
        return;
      }

      const { error } = await supabase
        .from('empresas')
        .update({
          nome: data.nome,
          descricao: data.descricao || null,
          endereco: data.endereco || null,
          telefone: data.telefone || null,
          site: data.site || null,
          link_radio: data.link_radio || null,
          categoria_id: data.categoria_id,
          imagem_capa_url: data.imagem_capa_url || null,
          verificado: data.verificado,
          destaque: data.destaque,
          ativo: data.ativo,
          horario_funcionamento: horarios,
        })
        .eq('id', empresa.id);

      if (error) throw error;

      toast({ title: 'Empresa atualizada com sucesso!' });
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      toast({ 
        title: 'Erro ao atualizar empresa', 
        description: 'Tente novamente.',
        variant: 'destructive' 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Editar Empresa: {empresa.nome}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dados">Dados da Empresa</TabsTrigger>
            <TabsTrigger value="horarios">Horários</TabsTrigger>
            <TabsTrigger value="enderecos">Endereços</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dados" className="space-y-4">
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
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
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
                        <FormLabel>Endereço Principal</FormLabel>
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
                        <FormLabel>Telefone Principal</FormLabel>
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

                <div className="grid grid-cols-3 gap-4">
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
                        <FormLabel>Ativo</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="verificado"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Verificado</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="destaque"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Destaque</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

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
          </TabsContent>
          
          <TabsContent value="horarios" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Configure os horários de funcionamento da empresa.
            </div>
            <HorarioFuncionamentoFormField
              value={horarios}
              onChange={setHorarios}
            />
          </TabsContent>
          
          <TabsContent value="enderecos" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Gerencie os endereços desta empresa. Use o sistema de múltiplos endereços para melhor organização.
            </div>
            <EnderecosList empresaId={empresa.id} canEdit={true} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
