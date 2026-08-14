import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Globe,
  HelpCircle,
  Loader2,
  Settings,
  Shield,
  Smartphone,
  Sun,
  Trash2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/contexts/PushNotificationsContext';

interface ConfiguracoesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConfiguracoesDialog = ({ open, onOpenChange }: ConfiguracoesDialogProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    supported,
    permission,
    enabled: pushEnabled,
    loading: pushLoading,
    error: pushError,
    preferences,
    enable: enablePush,
    disable: disablePush,
    savePreferences,
  } = usePushNotifications();
  const [saving, setSaving] = useState(false);
  const [configuracoes, setConfiguracoes] = useState({
    notificacoes: preferences.in_app_enabled,
    sistema: preferences.system_enabled,
    marketing: preferences.marketing_enabled,
    eventos: preferences.events_enabled,
    comunidade: preferences.community_enabled,
    tema: localStorage.getItem('app-tema') || 'sistema',
    idioma: localStorage.getItem('app-idioma') || 'pt-BR',
  });

  useEffect(() => {
    setConfiguracoes(prev => ({
      ...prev,
      notificacoes: preferences.in_app_enabled,
      sistema: preferences.system_enabled,
      marketing: preferences.marketing_enabled,
      eventos: preferences.events_enabled,
      comunidade: preferences.community_enabled,
    }));
  }, [preferences]);

  const handleSaveConfiguracoes = async () => {
    setSaving(true);
    try {
      await savePreferences({
        in_app_enabled: configuracoes.notificacoes,
        system_enabled: configuracoes.sistema,
        marketing_enabled: configuracoes.marketing,
        events_enabled: configuracoes.eventos,
        community_enabled: configuracoes.comunidade,
      });
      localStorage.setItem('app-tema', configuracoes.tema);
      localStorage.setItem('app-idioma', configuracoes.idioma);
      toast({ title: 'Configurações salvas', description: 'Suas preferências foram atualizadas.' });
    } catch (error) {
      toast({
        title: 'Não foi possível salvar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePushToggle = async (checked: boolean) => {
    try {
      if (checked) await enablePush();
      else await disablePush();
    } catch {
      // O contexto apresenta o motivo detalhado abaixo do controle.
    }
  };

  const handleDeleteAccount = () => {
    toast({
      title: 'Funcionalidade em desenvolvimento',
      description: 'A exclusão de conta estará disponível em breve.',
      variant: 'destructive',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5" />
                <h3 className="font-semibold">Notificações</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="notificacoes-geral">Central de notificações</Label>
                    <p className="text-xs text-muted-foreground">Exibe avisos dentro do Saj Tem</p>
                  </div>
                  <Switch
                    id="notificacoes-geral"
                    checked={configuracoes.notificacoes}
                    onCheckedChange={(checked) => setConfiguracoes(prev => ({ ...prev, notificacoes: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-2">
                    <Smartphone className="h-4 w-4 mt-0.5 text-primary" />
                    <div>
                      <Label htmlFor="notificacoes-push">Push neste dispositivo</Label>
                      <p className="text-xs text-muted-foreground">
                        {permission === 'denied'
                          ? 'Bloqueado nas configurações do navegador'
                          : pushEnabled
                            ? 'Dispositivo conectado ao Firebase'
                            : 'Receba alertas mesmo com o app fechado'}
                      </p>
                    </div>
                  </div>
                  {pushLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <Switch
                      id="notificacoes-push"
                      checked={pushEnabled}
                      onCheckedChange={handlePushToggle}
                      disabled={!supported || permission === 'denied'}
                    />
                  )}
                </div>

                {!supported && (
                  <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Este navegador não oferece suporte ao push. No iPhone, instale o site na tela inicial e abra pelo ícone.
                  </div>
                )}
                {pushError && (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {pushError}
                  </div>
                )}
                {pushEnabled && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Firebase ativo neste dispositivo.
                  </div>
                )}

                <Separator />

                <PreferenceSwitch id="notificacoes-sistema" label="Conta e segurança" checked={configuracoes.sistema} onChange={(checked) => setConfiguracoes(prev => ({ ...prev, sistema: checked }))} />
                <PreferenceSwitch id="notificacoes-eventos" label="Eventos e novidades locais" checked={configuracoes.eventos} onChange={(checked) => setConfiguracoes(prev => ({ ...prev, eventos: checked }))} />
                <PreferenceSwitch id="notificacoes-comunidade" label="Comunidade" checked={configuracoes.comunidade} onChange={(checked) => setConfiguracoes(prev => ({ ...prev, comunidade: checked }))} />
                <PreferenceSwitch id="notificacoes-marketing" label="Promoções e campanhas" checked={configuracoes.marketing} onChange={(checked) => setConfiguracoes(prev => ({ ...prev, marketing: checked }))} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Sun className="h-5 w-5" />
                <h3 className="font-semibold">Aparência</h3>
              </div>
              <Label>Tema</Label>
              <Select value={configuracoes.tema} onValueChange={(tema) => setConfiguracoes(prev => ({ ...prev, tema }))}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sistema">Sistema</SelectItem>
                  <SelectItem value="claro">Claro</SelectItem>
                  <SelectItem value="escuro">Escuro</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4"><Globe className="h-5 w-5" /><h3 className="font-semibold">Idioma</h3></div>
              <Select value={configuracoes.idioma} onValueChange={(idioma) => setConfiguracoes(prev => ({ ...prev, idioma }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4"><Shield className="h-5 w-5" /><h3 className="font-semibold">Privacidade e segurança</h3></div>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => { onOpenChange(false); navigate('/help'); }}>
                  <HelpCircle className="h-4 w-4 mr-2" />Central de Ajuda
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => { onOpenChange(false); navigate('/privacy'); }}>
                  <Shield className="h-4 w-4 mr-2" />Política de Privacidade
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator />
          <div className="flex gap-3">
            <Button onClick={handleSaveConfiguracoes} className="flex-1" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar configurações
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          </div>

          <Card className="border-red-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-red-600 mb-3">Zona de perigo</h3>
              <Button variant="destructive" onClick={handleDeleteAccount} className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />Excluir conta
              </Button>
              <p className="text-xs text-muted-foreground mt-2">Esta ação não pode ser desfeita.</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PreferenceSwitch = ({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (checked: boolean) => void }) => (
  <div className="flex items-center justify-between gap-4">
    <Label htmlFor={id}>{label}</Label>
    <Switch id={id} checked={checked} onCheckedChange={onChange} />
  </div>
);
