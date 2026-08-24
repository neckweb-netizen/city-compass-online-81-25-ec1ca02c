import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import {
  BellRing, CalendarClock, CheckCircle2, Clock3, ExternalLink, Image as ImageIcon,
  Loader2, Megaphone, RefreshCw, Send, Smartphone, Upload, Users, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { uploadMedia } from '@/lib/media-upload';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

type Audience = 'all' | 'users' | 'businesses' | 'admins' | 'specific';
type Category = 'system' | 'marketing' | 'events' | 'security' | 'account' | 'community';
type Priority = 'low' | 'normal' | 'high' | 'urgent';

interface Recipient {
  id: string;
  nome: string | null;
  email: string | null;
  tipo_conta: string | null;
}

interface Campaign {
  id: string;
  title: string;
  message: string;
  status: string;
  audience_type: Audience;
  channels: { in_app?: boolean; push?: boolean };
  scheduled_at: string | null;
  created_at: string;
  total_recipients: number;
  total_deliveries: number;
  total_sent: number;
  total_failed: number;
  image_url: string | null;
  icon_url: string | null;
  action_url: string | null;
  last_error: string | null;
}

const initialForm = {
  title: '', message: '', category: 'system' as Category, priority: 'normal' as Priority,
  audienceType: 'all' as Audience, targetUserIds: [] as string[], inApp: true, push: true,
  imageUrl: '', iconUrl: '', actionUrl: '', actionLabel: '', scheduledAt: '',
};

const statusLabel: Record<string, string> = {
  draft: 'Rascunho', scheduled: 'Agendada', queued: 'Na fila', processing: 'Enviando',
  completed: 'Concluída', partial: 'Parcial', failed: 'Falhou', cancelled: 'Cancelada',
};

const statusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (status === 'completed') return 'default';
  if (status === 'failed' || status === 'partial') return 'destructive';
  if (status === 'scheduled' || status === 'queued' || status === 'processing') return 'secondary';
  return 'outline';
};

export const AdminAvisos = () => {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState<'image' | 'icon' | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const [{ data: campaignData, error: campaignError }, { data: userData, error: userError }] = await Promise.all([
      (supabase as any).from('notification_campaigns').select('*').order('created_at', { ascending: false }).limit(50),
      (supabase as any).from('usuarios').select('id,nome,email,tipo_conta').order('nome').limit(500),
    ]);
    if (campaignError || userError) {
      if (!silent) toast.error('Não foi possível carregar a central de notificações.');
    } else {
      setCampaigns((campaignData || []) as Campaign[]);
      setRecipients((userData || []) as Recipient[]);
    }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
    const timer = window.setInterval(() => void loadData(true), 15_000);
    return () => window.clearInterval(timer);
  }, [loadData]);

  const selectedNames = useMemo(() => recipients.filter(item => form.targetUserIds.includes(item.id)), [form.targetUserIds, recipients]);

  const change = <K extends keyof typeof initialForm>(key: K, value: (typeof initialForm)[K]) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const uploadAsset = async (event: ChangeEvent<HTMLInputElement>, kind: 'image' | 'icon') => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Escolha um arquivo de imagem.');
    if (file.size > 8 * 1024 * 1024) return toast.error('A imagem deve ter no máximo 8 MB.');
    setUploading(kind);
    try {
      const url = await uploadMedia(file, `notifications/${kind === 'image' ? 'images' : 'icons'}`);
      change(kind === 'image' ? 'imageUrl' : 'iconUrl', url);
      toast.success(kind === 'image' ? 'Imagem adicionada.' : 'Ícone adicionado.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha no envio da imagem.');
    } finally {
      setUploading(null);
    }
  };

  const sendCampaign = async (testOnly = false) => {
    if (!form.title.trim() || !form.message.trim()) return toast.error('Preencha o título e a mensagem.');
    if (!form.inApp && !form.push) return toast.error('Ative pelo menos um canal.');
    if (testOnly && !user?.id) return toast.error('Administrador não identificado.');
    if (!testOnly && form.audienceType === 'specific' && !form.targetUserIds.length) return toast.error('Selecione os destinatários.');
    setSending(true);
    const { data, error } = await supabase.functions.invoke('admin-notifications', {
      body: {
        title: form.title,
        message: form.message,
        category: form.category,
        priority: form.priority,
        audienceType: testOnly ? 'specific' : form.audienceType,
        targetUserIds: testOnly ? [user!.id] : form.targetUserIds,
        channels: { in_app: form.inApp, push: form.push },
        imageUrl: form.imageUrl || null,
        iconUrl: form.iconUrl || null,
        actionUrl: form.actionUrl || null,
        actionLabel: form.actionLabel || null,
        scheduledAt: testOnly || !form.scheduledAt ? null : new Date(form.scheduledAt).toISOString(),
        metadata: { source: testOnly ? 'admin_test' : 'admin_panel' },
      },
    });
    setSending(false);
    if (error) return toast.error(error.message || 'Não foi possível criar a campanha.');
    toast.success(testOnly ? 'Teste enviado para você.' : data?.scheduled ? 'Notificação agendada.' : 'Notificação enviada para a fila.');
    if (!testOnly) setForm(initialForm);
    await loadData(true);
  };

  const cancelCampaign = async (campaignId: string) => {
    const { error } = await supabase.functions.invoke('admin-notifications', {
      body: { action: 'cancel', campaignId },
    });
    if (error) return toast.error('Esta campanha não pode mais ser cancelada.');
    toast.success('Campanha cancelada.');
    await loadData(true);
  };

  return (
    <div className="space-y-6 p-1 sm:p-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2"><BellRing className="h-6 w-6 text-primary" /><h1 className="text-2xl font-bold">Central de Notificações</h1></div>
          <p className="mt-1 text-sm text-muted-foreground">Crie, teste, agende e acompanhe mensagens do aplicativo e push Firebase.</p>
        </div>
        <Button variant="outline" onClick={() => void loadData()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Atualizar</Button>
      </div>

      <Tabs defaultValue="compose" className="space-y-5">
        <TabsList><TabsTrigger value="compose">Criar notificação</TabsTrigger><TabsTrigger value="history">Histórico ({campaigns.length})</TabsTrigger></TabsList>

        <TabsContent value="compose" className="mt-0">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <Card><CardHeader><CardTitle>Mensagem</CardTitle><CardDescription>O conteúdo que aparecerá para os destinatários.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="notification-title">Título</Label><Input id="notification-title" maxLength={120} value={form.title} onChange={event => change('title', event.target.value)} placeholder="Ex.: Novo evento neste fim de semana" /><p className="text-right text-xs text-muted-foreground">{form.title.length}/120</p></div>
                  <div className="space-y-2"><Label htmlFor="notification-message">Mensagem</Label><Textarea id="notification-message" rows={5} maxLength={1000} value={form.message} onChange={event => change('message', event.target.value)} placeholder="Escreva uma mensagem curta, clara e útil..." /><p className="text-right text-xs text-muted-foreground">{form.message.length}/1000</p></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label>Categoria</Label><Select value={form.category} onValueChange={value => change('category', value as Category)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="system">Sistema</SelectItem><SelectItem value="marketing">Novidades</SelectItem><SelectItem value="events">Eventos</SelectItem><SelectItem value="security">Segurança</SelectItem><SelectItem value="account">Conta</SelectItem><SelectItem value="community">Comunidade</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label>Prioridade</Label><Select value={form.priority} onValueChange={value => change('priority', value as Priority)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Baixa</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">Alta</SelectItem><SelectItem value="urgent">Urgente</SelectItem></SelectContent></Select></div>
                  </div>
                </CardContent>
              </Card>

              <Card><CardHeader><CardTitle>Mídia e ação</CardTitle><CardDescription>Use imagem, ícone e um botão que leve ao conteúdo certo.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label>Imagem grande</Label><div className="flex gap-2"><Input value={form.imageUrl} onChange={event => change('imageUrl', event.target.value)} placeholder="https://..." /><Button variant="outline" size="icon" asChild><label className="cursor-pointer"><input className="hidden" type="file" accept="image/*" onChange={event => void uploadAsset(event, 'image')} />{uploading === 'image' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}</label></Button></div></div>
                    <div className="space-y-2"><Label>Ícone</Label><div className="flex gap-2"><Input value={form.iconUrl} onChange={event => change('iconUrl', event.target.value)} placeholder="https://..." /><Button variant="outline" size="icon" asChild><label className="cursor-pointer"><input className="hidden" type="file" accept="image/*" onChange={event => void uploadAsset(event, 'icon')} />{uploading === 'icon' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}</label></Button></div></div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[1fr_220px]"><div className="space-y-2"><Label htmlFor="action-url">Link ao tocar</Label><Input id="action-url" value={form.actionUrl} onChange={event => change('actionUrl', event.target.value)} placeholder="/eventos ou https://..." /></div><div className="space-y-2"><Label htmlFor="action-label">Texto do botão</Label><Input id="action-label" maxLength={60} value={form.actionLabel} onChange={event => change('actionLabel', event.target.value)} placeholder="Ver detalhes" /></div></div>
                </CardContent>
              </Card>

              <Card><CardHeader><CardTitle>Público, canais e horário</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2"><Label>Destinatários</Label><Select value={form.audienceType} onValueChange={value => change('audienceType', value as Audience)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os usuários</SelectItem><SelectItem value="users">Contas pessoais</SelectItem><SelectItem value="businesses">Empresas</SelectItem><SelectItem value="admins">Administradores</SelectItem><SelectItem value="specific">Pessoas específicas</SelectItem></SelectContent></Select></div>
                  {form.audienceType === 'specific' && <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border p-2">{recipients.map(item => <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted"><Checkbox checked={form.targetUserIds.includes(item.id)} onCheckedChange={checked => change('targetUserIds', checked ? [...form.targetUserIds, item.id] : form.targetUserIds.filter(id => id !== item.id))} /><span className="min-w-0"><span className="block truncate text-sm font-medium">{item.nome || item.email || 'Sem nome'}</span><span className="block truncate text-xs text-muted-foreground">{item.email} · {item.tipo_conta}</span></span></label>)}</div>}
                  {selectedNames.length > 0 && <p className="text-xs text-muted-foreground">{selectedNames.length} pessoa(s) selecionada(s)</p>}
                  <div className="grid gap-3 sm:grid-cols-2"><label className="flex items-center justify-between rounded-lg border p-3"><span><span className="block text-sm font-medium">Dentro do aplicativo</span><span className="text-xs text-muted-foreground">Histórico e sino</span></span><Switch checked={form.inApp} onCheckedChange={value => change('inApp', value)} /></label><label className="flex items-center justify-between rounded-lg border p-3"><span><span className="block text-sm font-medium">Push Firebase</span><span className="text-xs text-muted-foreground">Celular e PWA</span></span><Switch checked={form.push} onCheckedChange={value => change('push', value)} /></label></div>
                  <div className="space-y-2"><Label htmlFor="scheduled-at">Agendar (opcional)</Label><Input id="scheduled-at" type="datetime-local" value={form.scheduledAt} min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)} onChange={event => change('scheduledAt', event.target.value)} /><p className="text-xs text-muted-foreground">Sem data, a campanha entra na fila imediatamente.</p></div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end"><Button variant="outline" onClick={() => void sendCampaign(true)} disabled={sending || uploading !== null}><Smartphone className="mr-2 h-4 w-4" />Enviar teste para mim</Button><Button onClick={() => void sendCampaign(false)} disabled={sending || uploading !== null}>{sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : form.scheduledAt ? <CalendarClock className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}{form.scheduledAt ? 'Agendar campanha' : 'Enviar campanha'}</Button></div>
                </CardContent>
              </Card>
            </div>

            <div className="xl:sticky xl:top-4 xl:self-start">
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5" />Pré-visualização</CardTitle><CardDescription>Simulação aproximada no celular.</CardDescription></CardHeader><CardContent>
                <div className="mx-auto max-w-[320px] rounded-[2rem] border-[7px] border-foreground/90 bg-muted/40 p-3 shadow-xl">
                  <div className="mx-auto mb-4 h-1.5 w-20 rounded-full bg-foreground/70" />
                  <div className="overflow-hidden rounded-2xl border bg-background shadow-lg">{form.imageUrl && <img src={form.imageUrl} alt="Prévia" className="h-32 w-full object-cover" />}
                    <div className="flex gap-3 p-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10">{form.iconUrl ? <img src={form.iconUrl} alt="Ícone" className="h-full w-full object-cover" /> : <BellRing className="h-5 w-5 text-primary" />}</div><div className="min-w-0"><p className="text-xs text-muted-foreground">Saj Tem · agora</p><p className="mt-1 break-words text-sm font-semibold">{form.title || 'Título da notificação'}</p><p className="mt-1 break-words text-xs text-muted-foreground">{form.message || 'Sua mensagem será exibida aqui.'}</p>{form.actionUrl && <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">{form.actionLabel || 'Abrir'} <ExternalLink className="h-3 w-3" /></span>}</div></div>
                  </div>
                </div>
              </CardContent></Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0 space-y-3">
          {loading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : campaigns.length === 0 ? <Card><CardContent className="py-16 text-center"><Megaphone className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" /><p className="font-medium">Nenhuma campanha enviada</p></CardContent></Card> : campaigns.map(campaign => {
            const progress = campaign.total_deliveries ? Math.round(((campaign.total_sent + campaign.total_failed) / campaign.total_deliveries) * 100) : campaign.status === 'completed' ? 100 : 0;
            const cancellable = ['draft', 'scheduled', 'queued'].includes(campaign.status);
            return <Card key={campaign.id}><CardContent className="p-4 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{campaign.title}</h2><Badge variant={statusVariant(campaign.status)}>{statusLabel[campaign.status] || campaign.status}</Badge></div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{campaign.message}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{campaign.total_recipients} destinatários</span><span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{new Date(campaign.scheduled_at || campaign.created_at).toLocaleString('pt-BR')}</span><span>{campaign.channels?.push ? 'Push' : ''}{campaign.channels?.push && campaign.channels?.in_app ? ' + ' : ''}{campaign.channels?.in_app ? 'Aplicativo' : ''}</span></div>{campaign.total_deliveries > 0 && <div className="mt-4 max-w-xl"><Progress value={progress} className="h-2" /><div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>{campaign.total_sent} enviados</span><span>{campaign.total_failed} falhas</span></div></div>}{campaign.last_error && <p className="mt-3 flex items-start gap-1 text-xs text-destructive"><XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{campaign.last_error}</p>}{campaign.status === 'completed' && <p className="mt-3 flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />Processamento concluído</p>}</div>{cancellable && <Button variant="outline" size="sm" onClick={() => void cancelCampaign(campaign.id)}>Cancelar</Button>}</div></CardContent></Card>;
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
};
