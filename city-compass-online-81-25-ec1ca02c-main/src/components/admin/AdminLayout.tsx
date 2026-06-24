
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useTheme } from '@/components/ui/theme-provider';

export const AdminLayout = () => {
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const { setTheme } = useTheme();

  // Force light mode in admin section and disable dark mode
  useEffect(() => {
    setTheme('light');
    // Remove dark class from document root to ensure light mode
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }, [setTheme]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-lg font-medium">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  // Redirect to home if not authenticated or not admin
  if (!user || !profile || !['admin_geral', 'admin_cidade'].includes(profile.tipo_conta)) {
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-white">
        <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <main className="flex-1 bg-white">
          <header className="h-16 border-b flex items-center px-6 bg-white">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-foreground">Painel Administrativo</h1>
            </div>
            
            <div className="ml-auto flex items-center gap-4">
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
          
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
