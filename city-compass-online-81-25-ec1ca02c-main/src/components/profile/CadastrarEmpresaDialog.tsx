import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { ImageUpload } from '@/components/ui/image-upload';
import { HorarioFuncionamentoFormField } from '@/components/admin/forms/HorarioFuncionamentoFormField';
import { Building2, Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { HorarioFuncionamento } from '@/types/horarios';

const empresaSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  endereco: z.string().optional(),
  telefone: z.string().optional(),
  site: z.string().url('URL inválida').optional().or(z.literal('')),
  link_radio: z.string().url('URL inválida').optional().or(z.literal('')),
  categoria_id: z.string().uuid('Selecione uma categoria'),
  imagem_capa_url: z.string().optional(),
  imagem_perfil_url: z.string().url('URL inválida').optional().or(z.literal('')),
  horario_funcionamento: z.any().optional()
});

const usuarioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  telefone_usuario: z.string().optional(),
});

type EmpresaFormData = z.infer<typeof empresaSchema>;
type UsuarioFormData = z.infer<typeof usuarioSchema>;

interface CadastrarEmpresaDialogProps {
  onSuccess?: () => void;
  variant?: 'button' | 'card';
  buttonText?: string;
}

// Função para gerar slug a partir do nome
const generateSlug = (nome: string): string => {
  return nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
  .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
  .trim().replace(/\s+/g, '-') // Substitui espaços por hífens
  .replace(/-+/g, '-'); // Remove hífens duplicados
};

export const CadastrarEmpresaDialog = ({
  onSuccess,
  variant = 'button',
  buttonText = 'Cadastrar Empresa'
}: CadastrarEmpresaDialogProps) => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [horarios, setHorarios] = useState<HorarioFuncionamento>({});
  const [empresaData, setEmpresaData] = useState<EmpresaFormData | null>(null);
  
  const { toast } = useToast();
  const { data: categorias } = useCategorias();
  const { data: cidadePadrao } = useCidadePadrao();
  const { user, profile } = useAuth();
  
  const isAdmin = profile?.tipo_conta === 'admin_geral' || profile?.tipo_conta === 'admin_cidade';

  const empresaForm = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {}
  });

  const usuarioForm = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {}
  });

  const onEmpresaSubmit = (data: EmpresaFormData) => {
    setEmpresaData({ ...data, horario_funcionamento: horarios });
    setCurrentStep(2);
  };

  const onUsuarioSubmit = async (data: UsuarioFormData) => {
    if (!empresaData) return;

    try {
      // 1. Verificar se a cidade padrão está disponível
      if (!cidadePadrao) {
        toast({
          title: 'Erro de configuração',
          description: 'Cidade padrão não configurada. Entre em contato com o administrador.',
          variant: 'destructive'
        });
        return;
      }

      // 2. Definir usuário proprietário: usa o usuário atual se estiver logado,
      // caso contrário cria uma nova conta e tenta autenticar para passar no RLS
      let ownerUserId: string | null = user?.id ?? null;
      let createdNewAccount = false;

      if (!ownerUserId) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.senha,
          options: {
            data: {
              nome: data.nome,
              tipo_conta: 'empresa',
              telefone: data.telefone_usuario
            },
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        // Aguardar um pouco para o usuário ser criado no banco
        if (authData.user && !authError) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Garantir que o perfil seja criado com tipo empresa
          const { error: profileError } = await supabase
            .from('usuarios')
            .upsert({
              id: authData.user.id,
              nome: data.nome,
              email: data.email,
              tipo_conta: 'empresa',
              telefone: data.telefone_usuario
            }, {
              onConflict: 'id'
            });

          if (profileError) {
            console.error('Erro ao criar perfil:', profileError);
          }
        }

        if (authError) {
          console.error('Erro ao criar conta:', authError);
          
          // Tratar diferentes tipos de erro em português
          let errorMessage = 'Erro inesperado ao criar conta';
          if (authError.message === 'User already registered') {
            errorMessage = 'Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.';
          } else if (authError.message.includes('password')) {
            errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
          } else if (authError.message.includes('email')) {
            errorMessage = 'E-mail inválido. Verifique o formato do e-mail.';
          }
          
          toast({
            title: 'Erro ao criar conta',
            description: errorMessage,
            variant: 'destructive'
          });
          return;
        }

        if (!authData.user) {
          toast({
            title: 'Erro',
            description: 'Falha ao criar usuário. Tente novamente.',
            variant: 'destructive'
          });
          return;
        }

        ownerUserId = authData.user.id;
        createdNewAccount = true;

        // Tentar autenticar imediatamente para satisfazer as políticas de RLS
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.senha,
        });

        if (signInError) {
          // Caso confirmação de email seja exigida, informar o próximo passo
          toast({
            title: 'Conta criada com sucesso!',
            description: 'Verifique seu e-mail para ativar a conta. Após confirmar, você poderá entrar e finalizar o cadastro da empresa.',
            variant: 'default'
          });
          return;
        }
      }

      // 3. Gerar slug único para a empresa
      const baseSlug = generateSlug(empresaData.nome);
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

      // 4. Criar empresa associada ao usuário
      const { error: empresaError } = await supabase.from('empresas').insert({
        nome: empresaData.nome,
        slug: slug,
        descricao: empresaData.descricao || null,
        endereco: empresaData.endereco || null,
        telefone: empresaData.telefone || null,
        site: empresaData.site || null,
        link_radio: empresaData.link_radio || null,
        categoria_id: empresaData.categoria_id,
        cidade_id: cidadePadrao.id,
        usuario_id: ownerUserId,
        verificado: false,
        destaque: false,
        horario_funcionamento: horarios,
        imagem_capa_url: empresaData.imagem_capa_url || null
      });

      if (empresaError) {
        console.error('Erro ao criar empresa:', empresaError);
        toast({
          title: 'Erro ao cadastrar empresa',
          description: 'Ocorreu um erro ao cadastrar a empresa. Verifique os dados e tente novamente.',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: createdNewAccount ? 'Cadastro realizado com sucesso!' : 'Empresa cadastrada com sucesso!',
        description: createdNewAccount ? 'Conta e empresa criadas com sucesso. Aguarde a aprovação do administrador.' : 'Empresa cadastrada. Aguarde a aprovação do administrador.'
      });

      // Reset forms e fechar dialog
      empresaForm.reset();
      usuarioForm.reset();
      setHorarios({});
      setEmpresaData(null);
      setCurrentStep(1);
      setOpen(false);
      onSuccess?.();

    } catch (error) {
      console.error('Erro no cadastro:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro inesperado. Verifique sua conexão e tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleCancel = () => {
    empresaForm.reset();
    usuarioForm.reset();
    setHorarios({});
    setEmpresaData(null);
    setCurrentStep(1);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === 'card' ? (
          <div className="bg-primary border border-primary/20 rounded-lg p-4 cursor-pointer hover:bg-primary/90 transition-colors" data-tutorial="register-business">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-5 w-5 text-primary-foreground" />
              <h3 className="font-semibold text-primary-foreground">Tem uma empresa?</h3>
            </div>
            <p className="text-sm text-primary-foreground/80 mb-3">
              Cadastre sua empresa em nosso guia e alcance mais clientes
            </p>
            <div className="flex items-center gap-1 text-sm font-medium text-primary-foreground">
              <Plus className="h-4 w-4" />
              Cadastrar Agora
            </div>
          </div>
        ) : (
          <Button className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            {buttonText}
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {currentStep === 1 ? 'Dados da Empresa' : 'Dados do Responsável'}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              1
            </div>
            <div className={`flex-1 h-1 rounded ${
              currentStep >= 2 ? 'bg-primary' : 'bg-muted'
            }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
          </div>
        </DialogHeader>

        {/* Etapa 1: Dados da Empresa */}
        {currentStep === 1 && (
          <Form {...empresaForm}>
            <form onSubmit={empresaForm.handleSubmit(onEmpresaSubmit)} className="space-y-4">
              <FormField
                control={empresaForm.control}
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
                control={empresaForm.control}
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
                        {categorias?.filter(c => c.ativo && c.tipo === 'empresa').map(categoria => (
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
                control={empresaForm.control}
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
                  control={empresaForm.control}
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
                  control={empresaForm.control}
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
                control={empresaForm.control}
                name="site"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo específico para rádios */}
              {categorias?.find(cat => cat.id === empresaForm.watch('categoria_id'))?.nome === 'Rádios' && (
                <FormField
                  control={empresaForm.control}
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
                control={empresaForm.control}
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

              {/* Campo específico para admins - Link da imagem de perfil */}
              {isAdmin && (
                <FormField
                  control={empresaForm.control}
                  name="imagem_perfil_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link da Imagem de Perfil (Admin)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://exemplo.com/imagem.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div>
                <HorarioFuncionamentoFormField 
                  value={horarios} 
                  onChange={setHorarios} 
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Próxima Etapa
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Etapa 2: Dados do Usuário */}
        {currentStep === 2 && (
          <Form {...usuarioForm}>
            <form onSubmit={usuarioForm.handleSubmit(onUsuarioSubmit)} className="space-y-4">
              <FormField
                control={usuarioForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={usuarioForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={usuarioForm.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={usuarioForm.control}
                name="telefone_usuario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone (opcional)</FormLabel>
                    <FormControl>
                      <PhoneInput {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Finalizar Cadastro
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};