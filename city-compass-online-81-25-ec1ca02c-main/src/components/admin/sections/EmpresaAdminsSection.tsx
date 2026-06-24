import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useEmpresaAdmins } from '@/hooks/useEmpresaAdmins';
import { Building2, User, Mail, Calendar, MapPin, Search, UserPlus, Trash2, Users } from 'lucide-react';
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

export const EmpresaAdminsSection = () => {
  const { 
    empresas, 
    usuariosDisponiveis, 
    atribuicoes, 
    loading, 
    atribuirAdmin, 
    removerAtribuicao 
  } = useEmpresaAdmins();
  
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsuario, setSelectedUsuario] = useState<string>('');
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-blue-900">Administradores de Empresa</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  const handleAtribuirAdmin = () => {
    if (!selectedUsuario || !selectedEmpresa) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um usuário e uma empresa.",
        variant: "destructive"
      });
      return;
    }

    atribuirAdmin({ usuarioId: selectedUsuario, empresaId: selectedEmpresa });
    setSelectedUsuario('');
    setSelectedEmpresa('');
  };

  // Filtrar atribuições por busca
  const atribuicoesFiltradas = atribuicoes.filter(atribuicao => {
    const usuario = atribuicao.usuarios;
    const empresa = atribuicao.empresas;
    
    if (!usuario || !empresa) return false;
    
    const matchSearch = 
      usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empresa.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-blue-900">Administradores de Local</h2>
          <p className="text-muted-foreground">
            Gerencie quais usuários podem administrar locais específicos
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Users className="w-4 h-4 mr-1" />
          {atribuicoesFiltradas.length} atribuições
        </Badge>
      </div>

      {/* Formulário para nova atribuição */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <UserPlus className="w-5 h-5" />
            Nova Atribuição
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-blue-900 mb-2 block">
                Usuário
              </label>
              <Select value={selectedUsuario} onValueChange={setSelectedUsuario}>
                <SelectTrigger className="bg-white border-blue-200">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {usuariosDisponiveis.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{usuario.nome}</div>
                          <div className="text-xs text-muted-foreground">{usuario.email}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-blue-900 mb-2 block">
                Local
              </label>
              <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
                <SelectTrigger className="bg-white border-blue-200">
                  <SelectValue placeholder="Selecione um local" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{empresa.nome}</div>
                          <div className="text-xs text-muted-foreground">
                            {empresa.categorias?.nome} • {empresa.cidades?.nome}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleAtribuirAdmin}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!selectedUsuario || !selectedEmpresa}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Atribuir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Busca */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-4 w-4" />
            <Input
              placeholder="Buscar por usuário ou local..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-blue-200 focus:border-blue-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de atribuições */}
      <div className="grid gap-4">
        {atribuicoesFiltradas.map((atribuicao) => {
          const usuario = atribuicao.usuarios;
          const empresa = atribuicao.empresas;
          
          if (!usuario || !empresa) return null;
          
          return (
            <Card key={atribuicao.id} className="hover:shadow-md transition-shadow border-blue-100">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                     <CardTitle className="flex items-center gap-2 text-blue-900">
                       <User className="w-5 h-5 text-blue-600" />
                       {usuario.nome}
                       <Badge variant="outline" className="text-xs">
                         Admin
                       </Badge>
                       {(atribuicao as any).tipo_atribuicao === 'automatica' && (
                         <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                           Proprietário
                         </Badge>
                       )}
                     </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4 text-blue-500" />
                        {usuario.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        {new Date(atribuicao.criado_em).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  
                  {(atribuicao as any).tipo_atribuicao !== 'automatica' ? (
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
                          <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover "{usuario.nome}" como administrador de "{empresa.nome}"?
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => removerAtribuicao(atribuicao.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Proprietário - Não removível
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Local Administrado:</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">{empresa.nome}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{empresa.categorias?.nome}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {empresa.cidades?.nome}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {atribuicoesFiltradas.length === 0 && (
          <Card className="border-blue-200">
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Nenhuma atribuição encontrada com os filtros aplicados.' 
                  : 'Nenhuma atribuição de administrador criada ainda.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};