import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, Bell, CheckCircle2, Eye, EyeOff, HelpCircle, KeyRound,
  Loader2, LockKeyhole, Settings, Shield, Smartphone, Sun, Trash2, UserRound,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/ui/theme-provider';
import { usePushNotifications } from '@/contexts/PushNotificationsContext';
import { supabase } from '@/integrations/supabase/client';

type ThemeSetting = 'system' | 'light' | 'dark';

interface ConfiguracoesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConfiguracoesDialog = ({ open, onOpenChange }: ConfiguracoesDialogProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const {
    supported, permission, enabled: pushEnabled, preferencesReady,
    loading: pushLoading, error: pushError, preferences,
    enable: enablePush, disable: disablePush, savePreferences,
  } = usePushNotifications();

  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [configuracoes, setConfiguracoes] = useState({
    notificacoes: preferences.in_app_enabled,
    sistema: preferences.system_enabled,
    marketing: preferences.marketing_enabled,
    eventos: preferences.events_enabled,
    comunidade: preferences.community_enabled,
    tema: theme as ThemeSetting,
  });

  useEffect(() => {
    if (!open) return;
    setConfiguracoes({
      notificacoes: preferences.in_app_enabled,
      sistema: preferences.system_enabled,
      marketing: preferences.marketing_enabled,
      eventos: preferences.events_enabled,
      comunidade: preferences.community_enabled,
      tema: theme as ThemeSetting,
    });
  }, [open, preferences, theme]);

  const handleSaveConfiguracoes = async () => {
    if (!preferencesReady) {
      toast({ title: 'Aguarde', description: 'Suas preferências ainda estão sendo carregadas.' });
      return;
    }

    setSaving(true);
    try {
      await savePreferences({
        in_app_enabled: configuracoes.notificacoes,
        system_enabled: configuracoes.sistema,
        marketing_enabled: configuracoes.marketing,
        events_enabled: configuracoes.eventos,
        community_enabled: configuracoes.comunidade,
      });
      setTheme(configuracoes.tema);
      document.documentElement.lang = 'pt-BR';
      localStorage.removeItem('app-tema');
      localStorage.setItem('app-idioma', 'pt-BR');
      toast({ title: 'Configurações salvas', description: 'Preferências de notificações e aparência atualizadas.' });
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

  const handlePasswordChange = async () => {
    if (newPassword.length < 8) {
      toast({ title: 'Senha muito curta', description: 'Use pelo menos 8 caracteres.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'As senhas não coincidem', description: 'Digite a mesma senha nos dois campos.', variant: 'destructive' });
      return;
    }

    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      toast({ title: 'Senha atualizada', description: 'Sua nova senha já está ativa.' });
    } catch (error) {
      toast({
        title: 'Não foi possível alterar a senha',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.email || deleteConfirmation.trim().toLowerCase() !== user.email.toLowerCase()) return;

    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account', {
        body: { confirmation: deleteConfirmation.trim() },
      });
      if (error) throw error;

      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
      toast({ title: 'Conta excluída', description: 'Seus dados de acesso foram removidos.' });
      window.location.assign('/');
    } catch (error) {
      toast({
        title: 'Não foi possível excluir a conta',
        description: error instanceof Error ? error.message : 'Tente novamente ou entre em contato com o suporte.',
        variant: 'destructive',
      });
      setDeleting(false);
    }
  };

  const closeAndNavigate = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(nextOpen) => !deleting && onOpenChange(nextOpen)}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" /> Configurações da conta
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <Card>
              <CardContent className="p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  <div>
                    <h3 className="font-semibold">Notificações</h3>
                    <p className="text-xs text-muted-foreground">Escolha como e sobre o que deseja receber avisos.</p>
                  </div>
                </div>

                {!preferencesReady ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/40 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando preferências...
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label htmlFor="notificacoes-geral">Central de notificações</Label>
                        <p className="text-xs text-muted-foreground">Controla os novos avisos exibidos dentro do Saj Tem.</p>
                      </div>
                      <Switch id="notificacoes-geral" checked={configuracoes.notificacoes} onCheckedChange={(checked) => setConfiguracoes(prev => ({ ...prev, notificacoes: checked }))} />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-start gap-2">
                        <Smartphone className="mt-0.5 h-4 w-4 text-primary" />
                        <div>
                          <Label htmlFor="notificacoes-push">Push neste dispositivo</Label>
                          <p className="text-xs text-muted-foreground">
                            {permission === 'denied' ? 'Bloqueado nas configurações do navegador' : pushEnabled ? 'Notificações ativas neste dispositivo' : 'Receba alertas mesmo com o app fechado'}
                          </p>
                        </div>
                      </div>
                      {pushLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                        <Switch id="notificacoes-push" checked={pushEnabled} onCheckedChange={handlePushToggle} disabled={!supported || permission === 'denied'} />
                      )}
                    </div>

                    {!supported && (
                      <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                        <AlertCircle className="h-4 w-4 shrink-0" /> Este navegador não oferece suporte ao push. No iPhone, instale o site na tela inicial e abra pelo ícone.
                      </div>
                    )}
                    {pushError && (
                      <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                        <AlertCircle className="h-4 w-4 shrink-0" /> {pushError}
                      </div>
                    )}
                    <Separator />
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Categorias permitidas</p>
                    <PreferenceSwitch id="notificacoes-sistema" label="Conta e segurança" checked={configuracoes.sistema} onChange={(checked) => setConfiguracoes(prev => ({ ...prev, sistema: checked }))} />
                    <PreferenceSwitch id="notificacoes-eventos" label="Eventos e novidades locais" checked={configuracoes.eventos} onChange={(checked) => setConfiguracoes(prev => ({ ...prev, eventos: checked }))} />
                    <PreferenceSwitch id="notificacoes-comunidade" label="Comunidade" checked={configuracoes.comunidade} onChange={(checked) => setConfiguracoes(prev => ({ ...prev, comunidade: checked }))} />
                    <PreferenceSwitch id="notificacoes-marketing" label="Promoções e campanhas" checked={configuracoes.marketing} onChange={(checked) => setConfiguracoes(prev => ({ ...prev, marketing: checked }))} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Sun className="h-5 w-5" />
                  <div>
                    <h3 className="font-semibold">Aparência e idioma</h3>
                    <p className="text-xs text-muted-foreground">O tema será aplicado em todo o site após salvar.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tema-interface">Tema</Label>
                    <Select value={configuracoes.tema} onValueChange={(tema) => setConfiguracoes(prev => ({ ...prev, tema: tema as ThemeSetting }))}>
                      <SelectTrigger id="tema-interface" className="mt-2"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">Usar configuração do aparelho</SelectItem>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Escuro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2.5">
                    <div><span className="block text-sm font-medium">Idioma da interface</span><span className="block text-xs text-muted-foreground">Português (Brasil)</span></div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <div><h3 className="font-semibold">Privacidade e segurança</h3><p className="text-xs text-muted-foreground">Gerencie a senha e consulte informações sobre seus dados.</p></div>
                </div>

                <div className="mb-3 flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
                  <UserRound className="h-5 w-5 text-primary" />
                  <div className="min-w-0"><span className="block text-xs text-muted-foreground">Conta conectada</span><strong className="block truncate text-sm">{user?.email || 'Usuário autenticado'}</strong></div>
                </div>

                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={() => setShowPasswordForm(prev => !prev)}>
                    <KeyRound className="mr-2 h-4 w-4" />Alterar senha
                  </Button>
                  {showPasswordForm && (
                    <div className="space-y-3 rounded-xl border p-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="nova-senha">Nova senha</Label>
                        <div className="relative">
                          <Input id="nova-senha" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Mínimo de 8 caracteres" className="pr-10" />
                          <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowPassword(prev => !prev)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="confirmar-senha">Confirmar nova senha</Label>
                        <Input id="confirmar-senha" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repita a nova senha" />
                      </div>
                      <Button className="w-full" onClick={handlePasswordChange} disabled={passwordSaving || !newPassword || !confirmPassword}>
                        {passwordSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LockKeyhole className="mr-2 h-4 w-4" />} Atualizar senha
                      </Button>
                    </div>
                  )}
                  <Button variant="outline" className="w-full justify-start" onClick={() => closeAndNavigate('/help')}><HelpCircle className="mr-2 h-4 w-4" />Central de Ajuda</Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => closeAndNavigate('/privacy')}><Shield className="mr-2 h-4 w-4" />Política de Privacidade</Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={handleSaveConfiguracoes} className="flex-1" disabled={saving || !preferencesReady}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar configurações</Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            </div>

            <Card className="border-destructive/30">
              <CardContent className="p-4">
                <h3 className="mb-1 font-semibold text-destructive">Zona de perigo</h3>
                <p className="mb-3 text-xs leading-relaxed text-muted-foreground">Exclui permanentemente seu acesso e os dados vinculados à conta.</p>
                <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} className="w-full"><Trash2 className="mr-2 h-4 w-4" />Excluir conta</Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={(nextOpen) => !deleting && setDeleteDialogOpen(nextOpen)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sua conta permanentemente?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">Esta ação remove o acesso, empresas vinculadas, notificações e conteúdos pessoais. Ela não pode ser desfeita.</span>
              <span className="block">Para confirmar, digite seu e-mail: <strong className="text-foreground">{user?.email}</strong></span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} placeholder="Digite seu e-mail" autoComplete="off" disabled={deleting} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => { event.preventDefault(); void handleDeleteAccount(); }}
              disabled={deleting || !user?.email || deleteConfirmation.trim().toLowerCase() !== user.email.toLowerCase()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Excluir definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const PreferenceSwitch = ({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (checked: boolean) => void }) => (
  <div className="flex items-center justify-between gap-4">
    <Label htmlFor={id}>{label}</Label>
    <Switch id={id} checked={checked} onCheckedChange={onChange} />
  </div>
);
