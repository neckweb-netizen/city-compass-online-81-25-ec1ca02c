
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAdminUsuarios } from '@/hooks/useAdminData';
import { User, Mail, Calendar, MapPin, Search, Filter, Trash2, Shield, ShieldCheck, Building2 } from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const UsuariosSection = () => {
  const { usuarios, loading, updateUsuario, deleteUsuario, currentUserRole, getAvailableRoles } = useAdminUsuarios();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-blue-900">Gestão de Usuários</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  const handleUpdateTipoConta = async (userId: string, novoTipo: 'admin_geral' | 'admin_cidade' | 'empresa' | 'criador_empresa' | 'usuario') => {
    // Check if user has permission to assign this role
    const availableRoles = getAvailableRoles();
    if (!availableRoles.includes(novoTipo)) {
      toast({
        title: "Acesso Negado",
        description: `Você não tem permissão para atribuir o papel "${novoTipo.replace('_', ' ')}".`,
        variant: "destructive"
      });
      return;
    }

    try {
      await updateUsuario({ id: userId, tipo_conta: novoTipo });
      toast({
        title: "Usuário atualizado",
        description: `Tipo de conta alterado para ${novoTipo.replace('_', ' ')}.`,
      });
    } catch (error) {
      // Error is already handled in the hook with proper security message
      console.error('Role update error:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      deleteUsuario(userId);
    } catch (error) {
      // Error is already handled in the hook with proper security message
      console.error('Delete user error:', error);
    }
  };

  const getTipoContaBadge = (tipo: string) => {
    const variants = {
      'admin_geral': { variant: 'destructive' as const, label: 'Admin Geral', icon: ShieldCheck },
      'admin_cidade': { variant: 'secondary' as const, label: 'Admin Cidade', icon: Shield },
      'empresa': { variant: 'default' as const, label: 'Empresa', icon: Building2 },
      'criador_empresa': { variant: 'outline' as const, label: 'Criador de Empresa', icon: Building2 },
      'usuario': { variant: 'outline' as const, label: 'Usuário', icon: User }
    };
    
    return variants[tipo as keyof typeof variants] || variants.usuario;
  };

  // Filtrar usuários
  const usuariosFiltrados = usuarios.filter(usuario => {
    const matchSearch = usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filterTipo === 'todos' || usuario.tipo_conta === filterTipo;
    
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-blue-900">Gestão de Usuários</h2>
          <p className="text-muted-foreground">
            Gerencie os usuários cadastrados no sistema
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {usuariosFiltrados.length} de {usuarios.length} usuários
        </Badge>
      </div>

      {/* Filtros */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-blue-200 focus:border-blue-400"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-blue-600" />
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-40 bg-white border-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="usuario">Usuários</SelectItem>
                  <SelectItem value="criador_empresa">Criadores de Empresa</SelectItem>
                  <SelectItem value="empresa">Empresas</SelectItem>
                  <SelectItem value="admin_cidade">Admin Cidade</SelectItem>
                  <SelectItem value="admin_geral">Admin Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4">
        {usuariosFiltrados.map((usuario) => {
          const badgeInfo = getTipoContaBadge(usuario.tipo_conta);
          const IconComponent = badgeInfo.icon;
          
          return (
            <Card key={usuario.id} className="hover:shadow-md transition-shadow border-blue-100">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                      <IconComponent className="w-5 h-5 text-blue-600" />
                      {usuario.nome}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4 text-blue-500" />
                        {usuario.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        {new Date(usuario.criado_em).toLocaleDateString('pt-BR')}
                      </span>
                      {usuario.cidades && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          {usuario.cidades.nome}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant={badgeInfo.variant} className="flex items-center gap-1">
                    <IconComponent className="w-3 h-3" />
                    {badgeInfo.label}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    {usuario.telefone && (
                      <p className="text-sm text-muted-foreground">
                        Telefone: {usuario.telefone}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      ID: {usuario.id}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-900">Tipo:</span>
                      <Select
                        value={usuario.tipo_conta}
                        onValueChange={(value: 'admin_geral' | 'admin_cidade' | 'empresa' | 'criador_empresa' | 'usuario') => 
                          handleUpdateTipoConta(usuario.id, value)
                        }
                      >
                        <SelectTrigger className="w-48 border-blue-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableRoles().includes('usuario') && (
                            <SelectItem value="usuario">Usuário</SelectItem>
                          )}
                          {getAvailableRoles().includes('criador_empresa') && (
                            <SelectItem value="criador_empresa">Criador de Empresa</SelectItem>
                          )}
                          {getAvailableRoles().includes('empresa') && (
                            <SelectItem value="empresa">Empresa</SelectItem>
                          )}
                          {getAvailableRoles().includes('admin_cidade') && (
                            <SelectItem value="admin_cidade">Admin Cidade</SelectItem>
                          )}
                          {getAvailableRoles().includes('admin_geral') && (
                            <SelectItem value="admin_geral">Admin Geral</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o usuário "{usuario.nome}"? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteUser(usuario.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {usuariosFiltrados.length === 0 && (
          <Card className="border-blue-200">
            <CardContent className="text-center py-12">
              <User className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || filterTipo !== 'todos' 
                  ? 'Nenhum usuário encontrado com os filtros aplicados.' 
                  : 'Nenhum usuário cadastrado ainda.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
