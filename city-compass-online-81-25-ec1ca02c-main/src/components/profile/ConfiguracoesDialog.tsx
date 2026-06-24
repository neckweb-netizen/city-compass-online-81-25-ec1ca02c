
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';    
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Bell, 
  Moon, 
  Sun, 
  Globe, 
  Shield, 
  HelpCircle,
  Trash2
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface ConfiguracoesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConfiguracoesDialog = ({ open, onOpenChange }: ConfiguracoesDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [configuracoes, setConfiguracoes] = useState({
    notificacoes: true,
    notificacoesPush: false,
    notificacoesEmail: true,
    tema: 'sistema',
    idioma: 'pt-BR'
  });

  const handleSaveConfiguracoes = () => {
    // Aqui você salvaria as configurações no localStorage ou backend
    localStorage.setItem('app-configuracoes', JSON.stringify(configuracoes));
    toast({
      title: "Configurações salvas",
      description: "Suas preferências foram atualizadas com sucesso.",
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A exclusão de conta estará disponível em breve.",
      variant: "destructive"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Notificações */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5" />
                <h3 className="font-semibold">Notificações</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notificacoes-geral">Receber notificações</Label>
                  <Switch
                    id="notificacoes-geral"
                    checked={configuracoes.notificacoes}
                    onCheckedChange={(checked) => 
                      setConfiguracoes(prev => ({ ...prev, notificacoes: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="notificacoes-push">Notificações push</Label>
                  <Switch
                    id="notificacoes-push"
                    checked={configuracoes.notificacoesPush}
                    onCheckedChange={(checked) => 
                      setConfiguracoes(prev => ({ ...prev, notificacoesPush: checked }))
                    }
                    disabled={!configuracoes.notificacoes}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="notificacoes-email">Notificações por email</Label>
                  <Switch
                    id="notificacoes-email"
                    checked={configuracoes.notificacoesEmail}
                    onCheckedChange={(checked) => 
                      setConfiguracoes(prev => ({ ...prev, notificacoesEmail: checked }))
                    }
                    disabled={!configuracoes.notificacoes}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aparência */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Sun className="h-5 w-5" />
                <h3 className="font-semibold">Aparência</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <Select
                    value={configuracoes.tema}
                    onValueChange={(value) => 
                      setConfiguracoes(prev => ({ ...prev, tema: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sistema">Sistema</SelectItem>
                      <SelectItem value="claro">Claro</SelectItem>
                      <SelectItem value="escuro">Escuro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Idioma */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="h-5 w-5" />
                <h3 className="font-semibold">Idioma</h3>
              </div>
              
              <Select
                value={configuracoes.idioma}
                onValueChange={(value) => 
                  setConfiguracoes(prev => ({ ...prev, idioma: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Privacidade */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5" />
                <h3 className="font-semibold">Privacidade e Segurança</h3>
              </div>
              
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    onOpenChange(false);
                    navigate('/help');
                  }}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Central de Ajuda
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    onOpenChange(false);
                    navigate('/privacy');
                  }}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Política de Privacidade
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Salvar configurações */}
          <div className="flex gap-3">
            <Button 
              onClick={handleSaveConfiguracoes}
              className="flex-1"
            >
              Salvar Configurações
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
          </div>

          {/* Zona de perigo */}
          <Card className="border-red-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-red-600 mb-3">Zona de Perigo</h3>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Conta
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente removidos.
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
