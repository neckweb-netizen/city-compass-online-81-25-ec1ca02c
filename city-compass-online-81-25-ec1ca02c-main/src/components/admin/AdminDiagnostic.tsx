
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, User, Shield, Database } from 'lucide-react';

export const AdminDiagnostic = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2">Verificando autenticação...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const diagnostics = [
    {
      label: 'Usuário Autenticado',
      status: !!user,
      details: user ? `ID: ${user.id}` : 'Não logado',
      icon: user ? CheckCircle : XCircle
    },
    {
      label: 'Email Verificado',
      status: user?.email_confirmed_at ? true : false,
      details: user?.email || 'N/A',
      icon: user?.email_confirmed_at ? CheckCircle : AlertCircle
    },
    {
      label: 'Perfil na Base de Dados',
      status: !!profile,
      details: profile ? `Nome: ${profile.nome}` : 'Perfil não encontrado',
      icon: profile ? CheckCircle : XCircle
    },
    {
      label: 'Tipo de Conta',
      status: profile?.tipo_conta ? ['admin_geral', 'admin_cidade'].includes(profile.tipo_conta) : false,
      details: profile?.tipo_conta || 'N/A',
      icon: profile?.tipo_conta && ['admin_geral', 'admin_cidade'].includes(profile.tipo_conta) ? CheckCircle : XCircle
    }
  ];

  const canAccessAdmin = diagnostics.every(d => d.status);

  return (
    <div className="max-w-2xl mx-auto mt-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Diagnóstico de Acesso Admin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {diagnostics.map((diagnostic, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <diagnostic.icon 
                  className={`w-5 h-5 ${diagnostic.status ? 'text-green-600' : 'text-red-600'}`} 
                />
                <div>
                  <p className="font-medium">{diagnostic.label}</p>
                  <p className="text-sm text-muted-foreground">{diagnostic.details}</p>
                </div>
              </div>
              <Badge variant={diagnostic.status ? 'default' : 'destructive'}>
                {diagnostic.status ? 'OK' : 'ERRO'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status de Acesso</CardTitle>
        </CardHeader>
        <CardContent>
          {canAccessAdmin ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="w-6 h-6" />
                <span className="text-lg font-medium">Você pode acessar o admin!</span>
              </div>
              <Button onClick={() => navigate('/admin')} className="w-full">
                Ir para Admin Dashboard
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-red-600">
                <XCircle className="w-6 h-6" />
                <span className="text-lg font-medium">Acesso negado ao admin</span>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Possíveis soluções:</strong></p>
                <ul className="text-left space-y-1">
                  {!user && <li>• Faça login com uma conta válida</li>}
                  {user && !user.email_confirmed_at && <li>• Confirme seu email</li>}
                  {user && !profile && <li>• Contate o administrador - perfil não encontrado na base</li>}
                  {profile && !['admin_geral', 'admin_cidade'].includes(profile.tipo_conta) && 
                    <li>• Contate o administrador - sua conta precisa ser promovida a admin</li>
                  }
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Dados Detalhados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="font-medium">Dados do Usuário (Auth):</p>
                <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                  {JSON.stringify({
                    id: user.id,
                    email: user.email,
                    created_at: user.created_at,
                    email_confirmed_at: user.email_confirmed_at,
                    role: user.role
                  }, null, 2)}
                </pre>
              </div>
              
              {profile && (
                <div>
                  <p className="font-medium">Dados do Perfil (usuarios):</p>
                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(profile, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
