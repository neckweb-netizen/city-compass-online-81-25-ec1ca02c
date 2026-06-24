
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HorarioFuncionamento } from '@/types/horarios';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCategorias } from '@/hooks/useCategorias';
import { useCidadePadrao } from '@/hooks/useCidadePadrao';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/ui/image-upload';
import { EnderecosList } from '@/components/empresa/EnderecosList';
import { HorarioFuncionamentoFormField } from './HorarioFuncionamentoFormField';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Building2 } from 'lucide-react';

const empresaSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  endereco: z.string().optional(),
  telefone: z.string().optional(),
  site: z.string().url('URL inválida').optional().or(z.literal('')),
  categoria_id: z.string().uuid('Selecione uma categoria'),
  verificado: z.boolean().default(false),
  destaque: z.boolean().default(false),
  imagem_capa_url: z.string().optional(),
  horario_funcionamento: z.custom<HorarioFuncionamento>().optional(),
});

type EmpresaFormData = z.infer<typeof empresaSchema>;

interface EmpresaFormProps {
  onSuccess?: () => void;
}

// Função para gerar slug a partir do nome
const generateSlug = (nome: string): string => {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-'); // Remove hífens duplicados
};

export const EmpresaForm = ({ onSuccess }: EmpresaFormProps) => {
  const [open, setOpen] = useState(false);
  const [createdEmpresaId, setCreatedEmpresaId] = useState<string | null>(null);
  const { toast } = useToast();
  const { data: categorias } = useCategorias();
  const { data: cidadePadrao } = useCidadePadrao();

  const form = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      verificado: false,
      destaque: false,
    },
  });

  const onSubmit = async (data: EmpresaFormData) => {
    try {
      // Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ 
          title: 'Erro', 
          description: 'Usuário não autenticado',
          variant: 'destructive' 
        });
        return;
      }

      // Verificar se a cidade padrão está disponível
      if (!cidadePadrao) {
        toast({ 
          title: 'Erro', 
          description: 'Cidade padrão não configurada',
          variant: 'destructive' 
        });
        return;
      }

      // Gerar slug único
      const baseSlug = generateSlug(data.nome);
      let slug = baseSlug;
      let counter = 1;

      // Verificar se o slug já existe e gerar um único
      while (true) {
        const { data: existingEmpresa } = await supabase
          .from('empresas')
          .select('id')
          .eq('slug', slug)
          .single();

        if (!existingEmpresa) {
          break; // Slug é único
        }

        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Verificar tipo de conta do usuário para decidir se vai ter proprietário
      const { data: userProfile, error: profileError } = await supabase
        .from('usuarios')
        .select('tipo_conta')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Erro ao buscar perfil do usuário:', profileError);
        toast({ 
          title: 'Erro', 
          description: 'Erro ao verificar permissões do usuário',
          variant: 'destructive' 
        });
        return;
      }

      const isAdmin = userProfile?.tipo_conta === 'admin_geral' || userProfile?.tipo_conta === 'admin_cidade';
      
      console.log('Usuário é admin?', isAdmin, 'Tipo conta:', userProfile?.tipo_conta);
      
      // Se for admin, empresa fica sem proprietário (null), senão fica com o user.id
      const usuarioId = isAdmin ? null : user.id;

      const { data: novaEmpresa, error } = await supabase
        .from('empresas')
        .insert({
          nome: data.nome,
          slug: slug,
          descricao: data.descricao || null,
          endereco: data.endereco || null,
          telefone: data.telefone || null,
          site: data.site || null,
          categoria_id: data.categoria_id,
          cidade_id: cidadePadrao.id,
          usuario_id: usuarioId,
          verificado: data.verificado,
          destaque: data.destaque,
          imagem_capa_url: data.imagem_capa_url || null,
          horario_funcionamento: data.horario_funcionamento || null,
          // Empresas criadas por admin são aprovadas automaticamente
          status_aprovacao: isAdmin ? 'aprovado' : 'pendente',
          aprovado_por: isAdmin ? user.id : null,
          data_aprovacao: isAdmin ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Se a empresa foi criada, definir o ID para mostrar a aba de endereços
      if (novaEmpresa) {
        setCreatedEmpresaId(novaEmpresa.id);
        toast({ 
          title: 'Empresa criada com sucesso!',
          description: 'Agora você pode adicionar endereços para esta empresa.'
        });
      } else {
        toast({ title: 'Empresa criada com sucesso!' });
        form.reset();
        setOpen(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      toast({ 
        title: 'Erro ao criar empresa', 
        description: 'Tente novamente.',
        variant: 'destructive' 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Empresa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Criar Nova Empresa
          </DialogTitle>
        </DialogHeader>
        
        {!createdEmpresaId ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da empresa" {...field} />
                  </FormControl>
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

            <FormField
              control={form.control}
              name="categoria_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categorias?.filter(c => c.ativo && c.tipo === 'empresa').map((categoria) => (
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

            <div className="grid grid-cols-2 gap-4">
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
                    <Input placeholder="https://exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imagem_capa_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imagem de Capa</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <ImageUpload
                        value={field.value}
                        onChange={field.onChange}
                        onRemove={() => field.onChange('')}
                        bucket="imagens_empresas"
                        folder="capas"
                      />
                      <div>
                        <FormLabel className="text-sm text-muted-foreground">Ou cole um link direto da imagem</FormLabel>
                        <Input 
                          placeholder="https://exemplo.com/imagem-capa.jpg"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-6">
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
                    <FormLabel>Empresa verificada</FormLabel>
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
                    <FormLabel>Em destaque</FormLabel>
                  </FormItem>
                )}
              />
              </div>

              <FormField
                control={form.control}
                name="horario_funcionamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Funcionamento</FormLabel>
                    <FormControl>
                      <HorarioFuncionamentoFormField
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Criar Empresa
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Tabs defaultValue="enderecos" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="enderecos">Endereços</TabsTrigger>
              <TabsTrigger value="horarios">Horários</TabsTrigger>
              <TabsTrigger value="concluir">Concluir</TabsTrigger>
            </TabsList>
            
            <TabsContent value="enderecos" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Configure os endereços da empresa recém-criada:
              </div>
              <EnderecosList empresaId={createdEmpresaId} canEdit={true} />
            </TabsContent>
            
            <TabsContent value="horarios" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Configure os horários de funcionamento da empresa:
              </div>
              <HorarioFuncionamentoFormField
                value={form.watch('horario_funcionamento')}
                onChange={(horarios) => form.setValue('horario_funcionamento', horarios)}
              />
            </TabsContent>
            
            <TabsContent value="concluir" className="space-y-4">
              <div className="text-center py-6">
                <h3 className="text-lg font-semibold mb-2">Empresa criada com sucesso!</h3>
                <p className="text-muted-foreground mb-4">
                  A empresa foi criada e você pode gerenciar seus endereços.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setCreatedEmpresaId(null);
                      form.reset();
                    }}
                  >
                    Criar Outra Empresa
                  </Button>
                  <Button 
                    onClick={() => {
                      setCreatedEmpresaId(null);
                      form.reset();
                      setOpen(false);
                      onSuccess?.();
                    }}
                  >
                    Finalizar
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
