
import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

type RequiredRole = 'admin_geral' | 'admin_cidade' | 'empresa' | 'usuario';

interface SecureRouteProps {
  children: ReactNode;
  requiredRole?: RequiredRole;
  requiredRoles?: RequiredRole[];
  fallbackPath?: string;
  requireEmailVerification?: boolean;
}

export const SecureRoute = ({ 
  children, 
  requiredRole, 
  requiredRoles,
  fallbackPath = '/auth',
  requireEmailVerification = true
}: SecureRouteProps) => {
  const { user, profile, loading, securityContext } = useSecureAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    // Check if user is authenticated
    if (!user) {
      console.log('🔒 SecureRoute: User not authenticated, redirecting to:', fallbackPath);
      navigate(fallbackPath, { state: { from: location.pathname } });
      return;
    }

    // Check email verification if required
    if (requireEmailVerification && !user.email_confirmed_at) {
      console.log('📧 SecureRoute: Email not verified');
      return;
    }

    // Check session validity
    if (!securityContext.sessionValid) {
      console.log('⚠️ SecureRoute: Invalid session, redirecting to login');
      navigate('/auth');
      return;
    }

    // Check profile exists
    if (!profile) {
      console.log('👤 SecureRoute: No profile found');
      return;
    }

    // Check role-based access
    const allowedRoles = requiredRoles || (requiredRole ? [requiredRole] : []);
    if (allowedRoles.length > 0 && !allowedRoles.includes(profile.tipo_conta as RequiredRole)) {
      console.log('🚫 SecureRoute: Insufficient permissions. Required:', allowedRoles, 'Has:', profile.tipo_conta);
      navigate('/unauthorized');
      return;
    }

    console.log('✅ SecureRoute: Access granted for user:', profile.nome);
  }, [user, profile, loading, requiredRole, requiredRoles, fallbackPath, requireEmailVerification, securityContext.sessionValid, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 pt-6">
            <Shield className="h-8 w-8 text-primary animate-pulse" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Verificando Segurança</h3>
              <p className="text-sm text-muted-foreground">
                Validando autenticação e permissões...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null; // Redirect will happen in useEffect
  }

  if (requireEmailVerification && !user.email_confirmed_at) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 pt-6">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Verificação de Email Necessária</h3>
              <p className="text-sm text-muted-foreground">
                Por favor, verifique seu email antes de acessar esta área.
              </p>
              <p className="text-xs text-muted-foreground">
                Verifique sua caixa de entrada e spam.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!securityContext.sessionValid) {
    return null; // Redirect will happen in useEffect
  }

  return <>{children}</>;
};
