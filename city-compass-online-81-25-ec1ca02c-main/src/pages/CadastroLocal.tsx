
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCategorias } from '@/hooks/useCategorias';
import { useCidadePadrao } from '@/hooks/useCidadePadrao';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ImageUpload } from '@/components/ui/image-upload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, ArrowLeft, CheckCircle } from 'lucide-react';

const empresaSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  endereco: z.string().optional(),
  telefone: z.string().optional(),
  site: z.string().url('URL inválida').optional().or(z.literal('')),
  link_radio: z.string().url('URL inválida').optional().or(z.literal('')),
  categoria_id: z.string().uuid('Selecione uma categoria'),
  imagem_capa_url: z.string().optional(),
});

type EmpresaFormData = z.infer<typeof empresaSchema>;

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

const CadastroLocal = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: categorias } = useCategorias();
  const { data: cidadePadrao } = useCidadePadrao();

  const form = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {},
  });

  // Detectar mudança de categoria para mostrar/esconder campo da rádio
  const categoriaAtual = form.watch('categoria_id');
  const isRadioCategory = categorias?.find(cat => cat.id === categoriaAtual)?.nome === 'Rádios';

  const onSubmit = async (data: EmpresaFormData) => {
    try {
      setIsSubmitting(true);
      
      // Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ 
          title: 'Atenção', 
          description: 'Para cadastrar seu local, primeiro faça login em sua conta.',
          variant: 'default' 
        });
        navigate('/');
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

      const { error } = await supabase
        .from('empresas')
        .insert({
          nome: data.nome,
          slug: slug,
          descricao: data.descricao || null,
          endereco: data.endereco || null,
          telefone: data.telefone || null,
          site: data.site || null,
          link_radio: data.link_radio || null,
          categoria_id: data.categoria_id,
          cidade_id: cidadePadrao.id,
          usuario_id: user.id,
          verificado: false,
          destaque: false,
          imagem_capa_url: data.imagem_capa_url || null,
        });

      if (error) throw error;

      setShowSuccess(true);
      toast({ 
        title: 'Local cadastrado com sucesso!', 
        description: 'Aguarde a aprovação do administrador.'
      });
      
      // Redirecionar após 3 segundos
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao cadastrar local:', error);
      toast({ 
        title: 'Erro ao cadastrar local', 
        description: 'Tente novamente.',
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Local Cadastrado!</h2>
            <p className="text-muted-foreground mb-4">
              Seu local foi cadastrado com sucesso. Aguarde a aprovação do administrador.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecionando para a página inicial...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/10 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <div className="text-center mb-8">
            <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-primary mb-2">Cadastre seu Local</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Faça parte do nosso guia comercial e alcance mais clientes. 
              Preencha as informações abaixo para cadastrar seu local.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Local</CardTitle>
            <CardDescription>
              Preencha os dados do seu local. Todos os campos marcados com * são obrigatórios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                           <FormLabel>Nome do Local *</FormLabel>
                           <FormControl>
                             <Input placeholder="Nome do local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="categoria_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
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

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="descricao"
                      render={({ field }) => (
                        <FormItem>
                           <FormLabel>Descrição do Local</FormLabel>
                           <FormControl>
                             <Textarea 
                               placeholder="Descreva seu local, produtos ou serviços oferecidos"
                              className="min-h-[100px]"
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
                    <div className="md:col-span-2">
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
                    </div>
                  )}

                  <div className="md:col-span-2">
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
                  </div>

                </div>

                <div className="flex justify-end gap-4 pt-6 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/')}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="min-w-[140px]"
                  >
                    {isSubmitting ? 'Cadastrando...' : 'Cadastrar Local'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Ao cadastrar seu local, você concorda com nossos termos de uso e política de privacidade.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CadastroLocal;
