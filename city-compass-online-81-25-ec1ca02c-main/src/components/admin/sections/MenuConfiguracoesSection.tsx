
import { useState } from 'react';
import { useMenuConfiguracoes, MenuConfiguracao } from '@/hooks/useMenuConfiguracoes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Pencil, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MenuConfiguracoesSection = () => {
  const { configuracoes, isLoading, updateConfiguracao, isUpdating } = useMenuConfiguracoes();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MenuConfiguracao>>({});

  const handleEdit = (config: MenuConfiguracao) => {
    setEditingId(config.id);
    setEditForm({
      posicao_desktop: config.posicao_desktop,
      posicao_mobile: config.posicao_mobile,
      ativo: config.ativo,
      apenas_admin: config.apenas_admin,
      ordem: config.ordem,
    });
  };

  const handleSave = () => {
    if (editingId && editForm) {
      updateConfiguracao({ id: editingId, updates: editForm });
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações de Menu</h2>
        <p className="text-muted-foreground">
          Configure onde cada item do menu deve aparecer no desktop e mobile
        </p>
      </div>

      <div className="grid gap-4">
        {configuracoes.map((config) => {
          const isEditing = editingId === config.id;
          
          return (
            <Card key={config.id} className={cn(
              "transition-all duration-200",
              isEditing && "ring-2 ring-primary"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {config.nome_item}
                    <Badge variant={config.ativo ? "default" : "secondary"}>
                      {config.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                    {config.apenas_admin && (
                      <Badge variant="destructive">Admin</Badge>
                    )}
                  </CardTitle>
                  
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={isUpdating}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(config)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <strong>Rota:</strong> {config.rota}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Posição Desktop</label>
                    {isEditing ? (
                      <Select
                        value={editForm.posicao_desktop}
                        onValueChange={(value: 'sidebar' | 'bottom') => 
                          setEditForm(prev => ({ ...prev, posicao_desktop: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sidebar">Menu Lateral</SelectItem>
                          <SelectItem value="bottom">Menu Inferior</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm">
                        {config.posicao_desktop === 'sidebar' ? 'Menu Lateral' : 'Menu Inferior'}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Posição Mobile</label>
                    {isEditing ? (
                      <Select
                        value={editForm.posicao_mobile}
                        onValueChange={(value: 'hamburger' | 'bottom') => 
                          setEditForm(prev => ({ ...prev, posicao_mobile: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hamburger">Menu Hambúrguer</SelectItem>
                          <SelectItem value="bottom">Menu Inferior</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm">
                        {config.posicao_mobile === 'hamburger' ? 'Menu Hambúrguer' : 'Menu Inferior'}
                      </div>
                    )}
                  </div>
                </div>
                
                {isEditing && (
                  <div className="flex items-center space-x-4 pt-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editForm.ativo ?? false}
                        onCheckedChange={(checked) => 
                          setEditForm(prev => ({ ...prev, ativo: checked }))
                        }
                        id={`ativo-${config.id}`}
                      />
                      <label htmlFor={`ativo-${config.id}`} className="text-sm">
                        Ativo
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editForm.apenas_admin ?? false}
                        onCheckedChange={(checked) => 
                          setEditForm(prev => ({ ...prev, apenas_admin: checked }))
                        }
                        id={`admin-${config.id}`}
                      />
                      <label htmlFor={`admin-${config.id}`} className="text-sm">
                        Apenas Admin
                      </label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
