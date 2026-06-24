
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Globe } from 'lucide-react';

interface Categoria {
  id: string;
  nome: string;
  slug: string;
  icone_url: string | null;
  tipo: 'empresa' | 'evento' | 'servico';
  ativo: boolean;
  criado_em: string;
}

export const AdminCategorias = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    icone_url: '',
    tipo: 'empresa' as 'empresa' | 'evento' | 'servico',
    ativo: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar categorias
  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ['admin-categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data as Categoria[];
    }
  });

  // Criar categoria
  const createCategoria = useMutation({
    mutationFn: async (data: typeof formData) => {
      const slug = data.nome.toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      const { error } = await supabase
        .from('categorias')
        .insert({
          nome: data.nome,
          slug,
          icone_url: data.icone_url || null,
          tipo: data.tipo,
          ativo: data.ativo
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categorias'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "Categoria criada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar categoria",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Atualizar categoria
  const updateCategoria = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const slug = data.nome.toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      const { error } = await supabase
        .from('categorias')
        .update({
          nome: data.nome,
          slug,
          icone_url: data.icone_url || null,
          tipo: data.tipo,
          ativo: data.ativo
        })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categorias'] });
      setIsEditDialogOpen(false);
      setEditingCategoria(null);
      resetForm();
      toast({ title: "Categoria atualizada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar categoria",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Deletar categoria
  const deleteCategoria = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categorias'] });
      toast({ title: "Categoria removida com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover categoria",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      icone_url: '',
      tipo: 'empresa',
      ativo: true
    });
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setFormData({
      nome: categoria.nome,
      icone_url: categoria.icone_url || '',
      tipo: categoria.tipo,
      ativo: categoria.ativo
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (categoria: Categoria) => {
    if (confirm(`Tem certeza que deseja remover a categoria "${categoria.nome}"?`)) {
      deleteCategoria.mutate(categoria.id);
    }
  };

  const toggleStatus = async (categoria: Categoria) => {
    const { error } = await supabase
      .from('categorias')
      .update({ ativo: !categoria.ativo })
      .eq('id', categoria.id);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['admin-categorias'] });
      toast({ 
        title: `Categoria ${!categoria.ativo ? 'ativada' : 'desativada'} com sucesso!` 
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Gerenciar Categorias</h2>
          <p className="text-muted-foreground">
            Gerencie as categorias disponíveis no sistema
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Categoria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Nome da categoria"
                />
              </div>
              
              <div>
                <Label htmlFor="icone">Ícone URL</Label>
                <Input
                  id="icone"
                  value={formData.icone_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, icone_url: e.target.value }))}
                  placeholder="URL do ícone ou emoji"
                />
              </div>
              
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select 
                  value={formData.tipo} 
                  onValueChange={(value: 'empresa' | 'evento' | 'servico') => 
                    setFormData(prev => ({ ...prev, tipo: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empresa">Local</SelectItem>
                    <SelectItem value="evento">Evento</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
                />
                <Label htmlFor="ativo">Categoria ativa</Label>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => createCategoria.mutate(formData)}
                  disabled={!formData.nome || createCategoria.isPending}
                  className="flex-1"
                >
                  {createCategoria.isPending ? 'Criando...' : 'Criar Categoria'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de categorias */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando categorias...</p>
          </div>
        ) : categorias.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Nenhuma categoria encontrada.</p>
            </CardContent>
          </Card>
        ) : (
          categorias.map((categoria) => (
            <Card key={categoria.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {categoria.icone_url?.startsWith('http') ? (
                        <img src={categoria.icone_url} alt="" className="w-8 h-8" />
                      ) : (
                        <span>{categoria.icone_url || '📁'}</span>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{categoria.nome}</CardTitle>
                      <p className="text-sm text-muted-foreground">/{categoria.slug}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={categoria.tipo === 'empresa' ? 'default' : categoria.tipo === 'servico' ? 'outline' : 'secondary'}>
                      {categoria.tipo === 'empresa' ? 'Empresa' : categoria.tipo === 'evento' ? 'Evento' : 'Serviço'}
                    </Badge>
                    <Badge variant={categoria.ativo ? 'default' : 'secondary'}>
                      {categoria.ativo ? 'Ativa' : 'Inativa'}
                    </Badge>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStatus(categoria)}
                      >
                        <Globe className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(categoria)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(categoria)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nome">Nome</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome da categoria"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-icone">Ícone URL</Label>
              <Input
                id="edit-icone"
                value={formData.icone_url}
                onChange={(e) => setFormData(prev => ({ ...prev, icone_url: e.target.value }))}
                placeholder="URL do ícone ou emoji"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-tipo">Tipo</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(value: 'empresa' | 'evento' | 'servico') => 
                  setFormData(prev => ({ ...prev, tipo: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empresa">Local</SelectItem>
                  <SelectItem value="evento">Evento</SelectItem>
                  <SelectItem value="servico">Serviço</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
              />
              <Label htmlFor="edit-ativo">Categoria ativa</Label>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => editingCategoria && updateCategoria.mutate({ 
                  ...formData, 
                  id: editingCategoria.id 
                })}
                disabled={!formData.nome || updateCategoria.isPending}
                className="flex-1"
              >
                {updateCategoria.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingCategoria(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
