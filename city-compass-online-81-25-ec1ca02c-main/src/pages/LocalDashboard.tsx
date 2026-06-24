
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { EmpresaDashboard as EmpresaDashboardComponent } from '@/components/empresa/EmpresaDashboard';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { SecureRoute } from '@/components/security/SecureRoute';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

export default function EmpresaDashboard() {
  const { user } = useSecureAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <main className="flex-1 flex items-center justify-center p-4 pb-20">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-12 w-12 text-blue-600" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Acesso Restrito</h2>
              <p className="text-gray-600">
                Você precisa estar logado para acessar o painel da empresa.
              </p>
            </div>
            
            <Button
              onClick={() => setAuthDialogOpen(true)}
              className="w-full"
            >
              Fazer Login
            </Button>
          </div>
          
          <AuthDialog 
            open={authDialogOpen} 
            onOpenChange={setAuthDialogOpen}
          />
        </main>
        
        <BottomNavigation />
      </div>
    );
  }

  return (
    <SecureRoute requiredRole="empresa" requireEmailVerification={true}>
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 pb-20">
          <EmpresaDashboardComponent />
        </main>
        
        <BottomNavigation />
      </div>
    </SecureRoute>
  );
}
