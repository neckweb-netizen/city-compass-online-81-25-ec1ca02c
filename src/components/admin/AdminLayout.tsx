import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { Button } from '@/components/ui/button';
import { LogOut, User, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ui/theme-provider';
import { supabase } from '@/integrations/supabase/client';
import { AdminMfaGate } from './AdminMfaGate';

export const AdminLayout = () => {
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [serverAccess, setServerAccess] = useState<'loading' | 'allowed' | 'denied'>('loading');
  const { theme, setTheme } = useTheme();

  // Removido o efeito antigo que forçava o light mode e limpava a classe dark

  useEffect(() => {
    console.log('📍 Admin route changed:', location.pathname);
    
    if (location.pathname === '/admin') {
      setActiveSection('dashboard');
    } else {
      const pathParts = location.pathname.split('/');
      if (pathParts.length > 2) {
        const section = pathParts[2];
        console.log('🎯 Setting active section:', section);
        setActiveSection(section);
      }
    }
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      console.log('🚪 Admin signing out...');
      await signOut();
    } catch (error) {
      console.error('❌ Error signing out:', error);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setServerAccess('denied');
      return;
    }

    let active = true;
    const validateAdminAccess = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || authData.user?.id !== user.id) {
        if (active) setServerAccess('denied');
        return;
      }

      const { data, error } = await supabase
        .from('usuarios')
        .select('tipo_conta')
        .eq('id', user.id)
        .maybeSingle();

      const allowed = !error && data && ['admin_geral', 'admin_cidade'].includes(data.tipo_conta);
      if (active) setServerAccess(allowed ? 'allowed' : 'denied');
    };

    void validateAdminAccess();
    const interval = window.setInterval(() => void validateAdminAccess(), 5 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [user?.id]);

  if (loading || serverAccess === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-lg font-medium">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  // Redirect to home if not authenticated or not admin
  if (!user || !user.email_confirmed_at || !profile || !['admin_geral', 'admin_cidade'].includes(profile.tipo_conta) || serverAccess !== 'allowed') {
    console.log('🚫 Admin access denied:', {
      hasUser: !!user,
      hasProfile: !!profile,
      userType: profile?.tipo_conta
    });
    return <Navigate to="/" replace />;
  }

  console.log('✅ Admin access granted:', {
    user: profile.nome,
    type: profile.tipo_conta,
    activeSection
  });

  return (
    <AdminMfaGate onSignOut={handleSignOut}>
      <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background text-foreground transition-colors duration-200">
        <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <main className="flex-1 bg-background text-foreground">
          <header className="h-16 border-b flex items-center px-6 bg-card text-card-foreground border-border shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-foreground">Painel Administrativo</h1>
            </div>
            
            <div className="ml-auto flex items-center gap-4">
              {/* Botão Seletor de Modo Escuro / Modo Claro integrado ao Header Administrativo */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="h-10 w-10 rounded-full p-0 text-muted-foreground hover:text-foreground"
                title={theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5 text-amber-400" />
                )}
              </Button>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <div className="text-right">
                  <p className="font-medium text-foreground">{profile?.nome}</p>
                  <p className="text-xs">{profile?.tipo_conta.replace('_', ' ')}</p>
                </div>
              </div>
              
              <Button 
                onClick={handleSignOut} 
                variant="ghost" 
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </header>
          
          <div className="p-6 bg-background text-foreground">
            <Outlet />
          </div>
        </main>
      </div>
      </SidebarProvider>
    </AdminMfaGate>
  );
};
