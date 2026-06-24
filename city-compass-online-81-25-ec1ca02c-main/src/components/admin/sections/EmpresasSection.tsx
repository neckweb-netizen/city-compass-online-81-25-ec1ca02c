
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NeonCard } from '@/components/ui/neon-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminEmpresas } from '@/hooks/useAdminEmpresas';
import { useAdminEmpresaStories } from '@/hooks/useEmpresaStories';
import { EmpresaForm } from '@/components/admin/forms/EmpresaForm';
import { EditEmpresaForm } from '@/components/admin/forms/EditEmpresaForm';
import { AssignPlanoModal } from '@/components/admin/forms/AssignPlanoModal';
import { StoryForm } from '@/components/admin/forms/StoryForm';
import { StoryManagement } from '@/components/admin/sections/StoryManagement';
import { Building2, Mail, User, MapPin, CheckCircle, Award, Calendar, Trash2, Clock, XCircle, Camera, CameraOff } from 'lucide-react';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';

export const EmpresasSection = () => {
  const { empresas, loading, toggleEmpresa, deleteEmpresa, refetch } = useAdminEmpresas();
  const { stories, createStory, updateStory, deleteStory } = useAdminEmpresaStories();
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Gestão de Empresas</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando empresas...</p>
        </div>
      </div>
    );
  }

  const empresasFiltradas = empresas.filter(empresa => {
    if (filtroStatus === 'todos') return true;
    return empresa.status_aprovacao === filtroStatus;
  });

  const getEmpresaStories = (empresaId: string) => {
    return stories.filter(story => story.empresa_id === empresaId);
  };

  const toggleStoriesExpanded = (empresaId: string) => {
    const newExpanded = new Set(expandedStories);
    if (newExpanded.has(empresaId)) {
      newExpanded.delete(empresaId);
    } else {
      newExpanded.add(empresaId);
    }
    setExpandedStories(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge variant="default" className="bg-green-600">Aprovado</Badge>;
      case 'pendente':
        return <Badge variant="secondary" className="bg-yellow-600">Pendente</Badge>;
      case 'rejeitado':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pendente':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejeitado':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Gestão de Empresas</h2>
          <p className="text-muted-foreground">
            Gerencie as empresas cadastradas no sistema
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Badge variant="outline" className="w-fit">
            {empresasFiltradas.length} empresas
          </Badge>
          <EmpresaForm onSuccess={refetch} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Filtrar por status:</span>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="aprovado">Aprovados</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="rejeitado">Rejeitados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid gap-4">
        {empresasFiltradas.map((empresa) => {
          const empresaStories = getEmpresaStories(empresa.id);
          const isStoriesExpanded = expandedStories.has(empresa.id);
          
          return (
            <NeonCard key={empresa.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="space-y-2 min-w-0 flex-1">
                    <CardTitle className="flex flex-wrap items-center gap-2">
                      <Building2 className="w-5 h-5 flex-shrink-0" />
                      <span className="truncate">{empresa.nome}</span>
                      {getStatusIcon(empresa.status_aprovacao)}
                      {empresa.verificado && (
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      )}
                      {empresa.destaque && (
                        <Award className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                      )}
                    </CardTitle>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{empresa.usuario?.nome}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{empresa.usuario?.email}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        {new Date(empresa.criado_em).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getStatusBadge(empresa.status_aprovacao)}
                    <Badge variant={empresa.ativo ? 'default' : 'secondary'}>
                      {empresa.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Badge variant="outline">
                      {empresa.categorias?.nome}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {empresa.descricao && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {empresa.descricao}
                  </p>
                )}
                
                {empresa.endereco && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{empresa.endereco}</span>
                  </div>
                )}

                {empresa.data_aprovacao && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Data de aprovação:</span> {new Date(empresa.data_aprovacao).toLocaleDateString()}
                  </div>
                )}

                {empresa.observacoes_admin && (
                  <div className="text-sm">
                    <span className="font-medium">Observações do admin:</span>
                    <p className="text-muted-foreground mt-1">{empresa.observacoes_admin}</p>
                  </div>
                )}
                
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-4 border-t">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={empresa.ativo}
                        onCheckedChange={(checked) => 
                          toggleEmpresa({ id: empresa.id, field: 'ativo', value: checked })
                        }
                      />
                      <span className="text-sm">Ativo</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={empresa.verificado}
                        onCheckedChange={(checked) => 
                          toggleEmpresa({ id: empresa.id, field: 'verificado', value: checked })
                        }
                      />
                      <span className="text-sm">Verificado</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={empresa.destaque}
                        onCheckedChange={(checked) => 
                          toggleEmpresa({ id: empresa.id, field: 'destaque', value: checked })
                        }
                      />
                      <span className="text-sm">Destaque</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Slug: <span className="font-mono text-xs">{empresa.slug}</span></p>
                      {empresa.telefone && <p>Tel: {empresa.telefone}</p>}
                      {empresa.site && (
                        <a 
                          href={empresa.site} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline block truncate max-w-[200px]"
                        >
                          Visitar site
                        </a>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <EditEmpresaForm empresa={empresa} onSuccess={refetch} />
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover Empresa</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover a empresa "{empresa.nome}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteEmpresa(empresa.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>

                {/* Seção de Stories */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      <span className="font-medium">Stories</span>
                      <Badge variant="outline">
                        {empresaStories.length} story{empresaStories.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <StoryForm
                        empresaId={empresa.id}
                        empresaNome={empresa.nome}
                        empresaImagemCapa={empresa.imagem_capa_url}
                        onCreateStory={createStory}
                      />
                      
                      {empresaStories.length > 0 && (
                        <Collapsible open={isStoriesExpanded} onOpenChange={() => toggleStoriesExpanded(empresa.id)}>
                          <CollapsibleTrigger asChild>
                            <Button size="sm" variant="ghost">
                              {isStoriesExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </Collapsible>
                      )}
                    </div>
                  </div>

                  {empresaStories.length > 0 && (
                    <Collapsible open={isStoriesExpanded} onOpenChange={() => toggleStoriesExpanded(empresa.id)}>
                      <CollapsibleContent>
                        <StoryManagement
                          stories={empresaStories}
                          onUpdateStory={updateStory}
                          onDeleteStory={deleteStory}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </CardContent>
            </NeonCard>
          );
        })}
        
        {empresasFiltradas.length === 0 && (
          <NeonCard>
            <CardContent className="text-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {filtroStatus === 'todos' 
                  ? 'Nenhuma empresa cadastrada ainda.'
                  : `Nenhuma empresa com status "${filtroStatus}" encontrada.`
                }
              </p>
            </CardContent>
          </NeonCard>
        )}
      </div>
    </div>
  );
};
