import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { CadastrarEmpresaDialog } from '@/components/profile/CadastrarEmpresaDialog';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'login' | 'register';
}

export const AuthDialog = ({ open, onOpenChange, defaultTab = 'login' }: AuthDialogProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isEmpresaDirectOpen, setIsEmpresaDirectOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();

  // Sincroniza o estado de login/cadastro e intercepta para empresas
  useEffect(() => {
    if (open) {
      if (defaultTab === 'register') {
        setIsLogin(false);
        setIsEmpresaDirectOpen(true);
      } else {
        setIsLogin(true);
        setIsEmpresaDirectOpen(false);
      }
    }
  }, [open, defaultTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        
        if (error) throw error;
        
        toast.success('Login realizado com sucesso!');
        onOpenChange(false);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nome: name,
            },
            emailRedirectTo: `${window.location.origin}/`
          },
        });
        
        if (error) throw error;
        
        toast.success('Conta criada com sucesso!');
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setShowPassword(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast.error('Digite seu email primeiro');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });
      
      if (error) throw error;
      
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar email de recuperação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <VisuallyHidden>
          <DialogTitle>
            {isEmpresaDirectOpen ? 'Cadastrar Empresa' : isLogin ? 'Entrar na conta' : 'Criar nova conta'}
          </DialogTitle>
        </VisuallyHidden>
        
        {isEmpresaDirectOpen ? (
          /* FLUXO DIRETO DE CADASTRO DE EMPRESA SOLICITADO PELA PÁGINA COMERCIAL */
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary">Painel do Comerciante</h2>
              <p className="text-muted-foreground">Inicie o preenchimento do seu estabelecimento abaixo</p>
            </div>
            
            <div className="p-1 bg-card rounded-xl border">
              <CadastrarEmpresaDialog variant="card" />
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setIsEmpresaDirectOpen(false)}
                className="text-xs text-muted-foreground hover:text-primary hover:underline transition-all"
              >
                ← Voltar para opções de login de usuário padrão
              </button>
            </div>
          </div>
        ) : (
          /* FLUXO PADRÃO DE USUÁRIO (LOGIN / REGISTRO) */
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">
                {isLogin ? 'Entrar' : 'Criar Conta'}
              </h2>
              <p className="text-muted-foreground">
                {isLogin 
                  ? 'Acesse sua conta para continuar' 
                  : 'Crie sua conta para começar'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showPassword}
                    className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
              </Button>
            </form>

            {/* Alternador entre Login e Cadastro */}
            <div className="text-center space-y-3">
              <button
                type="button"
                onClick={toggleMode}
                className="rounded-lg px-2 py-1 font-semibold text-primary hover:bg-primary/10 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                data-tutorial="create-account"
              >
                {isLogin 
                  ? 'Não tem uma conta? Criar conta' 
                  : 'Já tem uma conta? Entrar'
                }
              </button>
              
              {isLogin && (
                <div>
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-primary/10 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    disabled={loading}
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Separator />
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Tem uma empresa?
                </p>
                <CadastrarEmpresaDialog variant="card" />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
