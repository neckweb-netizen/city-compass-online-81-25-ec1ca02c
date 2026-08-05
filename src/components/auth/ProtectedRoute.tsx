import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, LogIn, UserPlus, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Checar sessão ativa no Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Escutar mudanças no status de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se NÃO estiver logado, exibe tela estilizada de aviso de acesso restrito
  if (!session) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full border-primary/20 bg-card shadow-2xl text-center">
          <CardContent className="p-8 space-y-6">
            <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-foreground tracking-tight">
                Área Exclusiva para Membros
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Esta ferramenta é gratuita, porém restrita a usuários cadastrados na plataforma Saj Tem. Entre na sua conta para liberar o acesso.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Button 
                onClick={() => navigate('/profile')} 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 rounded-xl flex items-center justify-center gap-2 text-xs"
              >
                <LogIn className="w-4 h-4" /> Entrar na Minha Conta
              </Button>
              
              <Button 
                onClick={() => navigate('/profile')} 
                variant="outline" 
                className="w-full border-border font-semibold h-10 rounded-xl flex items-center justify-center gap-2 text-xs"
              >
                <UserPlus className="w-4 h-4" /> Criar Conta Gratuita
              </Button>
            </div>

            <Button 
              variant="ghost" 
              onClick={() => navigate('/ferramentas')} 
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Catálogo de Ferramentas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se estiver logado, libera o conteúdo da ferramenta
  return <>{children}</>;
};
