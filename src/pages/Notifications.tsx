import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, Bell, BellRing, CalendarDays, CheckCheck, Megaphone, Settings, ShieldCheck, UserRound } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNotifications, type AppNotification } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const categoryIcons = {
  system: Bell,
  marketing: Megaphone,
  events: CalendarDays,
  security: ShieldCheck,
  account: UserRound,
  community: BellRing,
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, totalUnread, loading, error, markAsRead, markAllAsRead, archive } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const visible = filter === 'unread' ? notifications.filter(item => !item.read) : notifications;

  const openNotification = (item: AppNotification) => {
    if (!item.read) markAsRead(item.id);
    if (!item.action_url) return;
    if (/^https:\/\//i.test(item.action_url)) window.open(item.action_url, '_blank', 'noopener,noreferrer');
    else navigate(item.action_url);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BellRing className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Notificações</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {totalUnread ? `${totalUnread} ${totalUnread === 1 ? 'aviso não lido' : 'avisos não lidos'}` : 'Você está em dia'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
            <Settings className="h-4 w-4 mr-2" />Preferências
          </Button>
          {totalUnread > 0 && (
            <Button size="sm" onClick={() => markAllAsRead()}>
              <CheckCheck className="h-4 w-4 mr-2" />Marcar todas
            </Button>
          )}
        </div>
      </div>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as 'all' | 'unread')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="unread">Não lidas ({totalUnread})</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map(item => <div key={item} className="h-28 rounded-2xl bg-muted animate-pulse" />)}</div>
      ) : error ? (
        <Card className="border-destructive/30"><CardContent className="py-10 text-center text-sm text-destructive">Não foi possível carregar suas notificações.</CardContent></Card>
      ) : visible.length === 0 ? (
        <Card><CardContent className="py-14 text-center">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <h2 className="font-semibold">Nenhuma notificação por aqui</h2>
          <p className="text-sm text-muted-foreground mt-1">Novos avisos aparecerão nesta tela.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {visible.map(item => {
            const Icon = categoryIcons[item.category] || Bell;
            return (
              <Card key={item.id} className={cn('overflow-hidden transition-colors', !item.read && 'border-primary/40 bg-primary/[0.035]')}>
                {item.image_url && <img src={item.image_url} alt="" className="w-full max-h-60 object-cover" />}
                <CardContent className="p-4 sm:p-5">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                      {item.icon_url ? <img src={item.icon_url} alt="" className="h-full w-full object-cover" /> : <Icon className="h-5 w-5 text-primary" />}
                    </div>
                    <button className="min-w-0 flex-1 text-left" onClick={() => openNotification(item)}>
                      <div className="flex items-start gap-2">
                        <h2 className={cn('font-semibold leading-tight flex-1', !item.read && 'text-primary')}>{item.title}</h2>
                        {!item.read && <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      {item.message && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{item.message}</p>}
                      <p className="text-xs text-muted-foreground/80 mt-2">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                      {item.action_url && <span className="inline-block text-sm font-medium text-primary mt-3">{item.action_label || 'Abrir detalhes'} →</span>}
                    </button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" title="Arquivar" onClick={() => archive(item.id)}>
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
