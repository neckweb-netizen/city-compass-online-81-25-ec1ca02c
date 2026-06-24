
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NeonCard } from '@/components/ui/neon-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { FavoritosDialog } from './FavoritosDialog';
import { AvaliacoesDialog } from './AvaliacoesDialog';
import { ConfiguracoesDialog } from './ConfiguracoesDialog';
import { CadastrarEmpresaDialog } from './CadastrarEmpresaDialog';
import { CreateNotificationTest } from '@/components/test/CreateNotificationTest';
import { 
  User, 
  Heart, 
  Star, 
  Settings, 
  LogOut, 
  MapPin,
  Mail,
  Phone,
  Calendar,
  Building2,
  Plus
} from 'lucide-react';

export const ProfileContent = () => {
  const { user, profile, signOut } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [favoritosDialogOpen, setFavoritosDialogOpen] = useState(false);
  const [avaliacoesDialogOpen, setAvaliacoesDialogOpen] = useState(false);
  const [configuracoesDialogOpen, setConfiguracoesDialogOpen] = useState(false);

  if (!user || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <NeonCard className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <User className="h-10 w-10 text-gray-400" />
            </div>
            <CardTitle>Acesso ao Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Faça login para acessar seu perfil e gerenciar suas informações.
            </p>
            <Button 
              onClick={() => setAuthDialogOpen(true)}
              className="w-full"
            >
              Fazer Login
            </Button>
          </CardContent>
        </NeonCard>
        
        <AuthDialog 
          open={authDialogOpen} 
          onOpenChange={setAuthDialogOpen}
        />
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const getTipoContaBadge = (tipo: string) => {
    switch (tipo) {
      case 'empresa':
        return <Badge variant="default">Empresa</Badge>;
      case 'admin_cidade':
        return <Badge variant="secondary">Admin Cidade</Badge>;
      case 'admin_geral':
        return <Badge variant="destructive">Admin Geral</Badge>;
      default:
        return <Badge variant="outline">Usuário</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header do Perfil */}
      <NeonCard className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-10 w-10 text-primary" />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <CardTitle className="text-2xl">{profile.nome}</CardTitle>
                {getTipoContaBadge(profile.tipo_conta)}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{profile.email}</span>
                </div>
                
                {profile.telefone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{profile.telefone}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Membro desde {new Date(profile.criado_em).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </CardHeader>
      </NeonCard>

      {/* Ações do Perfil */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Meus Favoritos */}
        <NeonCard className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="h-6 w-6 text-red-500" />
              <h3 className="font-semibold">Meus Favoritos</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Empresas que você marcou como favoritas
            </p>
            <Button onClick={() => setFavoritosDialogOpen(true)}>
              Ver Favoritos
            </Button>
            <FavoritosDialog 
              open={favoritosDialogOpen} 
              onOpenChange={setFavoritosDialogOpen} 
            />
          </CardContent>
        </NeonCard>

        {/* Minhas Avaliações */}
        <NeonCard className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Star className="h-6 w-6 text-yellow-500" />
              <h3 className="font-semibold">Minhas Avaliações</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Avaliações que você fez sobre empresas
            </p>
            <Button onClick={() => setAvaliacoesDialogOpen(true)}>
              Ver Avaliações
            </Button>
            <AvaliacoesDialog 
              open={avaliacoesDialogOpen} 
              onOpenChange={setAvaliacoesDialogOpen} 
            />
          </CardContent>
        </NeonCard>

        {/* Configurações */}
        <NeonCard className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="h-6 w-6 text-gray-600" />
              <h3 className="font-semibold">Configurações</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Gerencie suas preferências e dados pessoais
            </p>
            <Button onClick={() => setConfiguracoesDialogOpen(true)}>
              Configurações
            </Button>
            <ConfiguracoesDialog 
              open={configuracoesDialogOpen} 
              onOpenChange={setConfiguracoesDialogOpen} 
            />
          </CardContent>
        </NeonCard>
      </div>

      {/* Seção específica para empresas */}
      {(profile.tipo_conta === 'empresa' || profile.tipo_conta === 'usuario') && (
        <NeonCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Área da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Cadastre sua empresa no nosso guia e alcance mais clientes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <CadastrarEmpresaDialog />
              
              <Button variant="outline" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Painel da Empresa
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>• Cadastre informações completas da sua empresa</p>
              <p>• Adicione fotos e descrições detalhadas</p>
              <p>• Gerencie cupons e promoções</p>
              <p>• Acompanhe avaliações dos clientes</p>
            </div>
          </CardContent>
        </NeonCard>
      )}
      
      {/* Componente de teste para notificações (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6">
          <CreateNotificationTest />
        </div>
      )}
    </div>
  );
};
