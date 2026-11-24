import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/contexts/PushNotificationsContext';
import { getSafeNotificationPath } from '@/lib/safeNavigation';
import { shouldShowNotificationToast } from '@/lib/notificationToastDedup';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  category: 'system' | 'marketing' | 'events' | 'security' | 'account' | 'community';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  action_url: string | null;
  action_label: string | null;
  image_url: string | null;
  icon_url: string | null;
  metadata: Record<string, unknown>;
  read: boolean;
  read_at: string | null;
  archived_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

const notificationColumns = [
  'id', 'user_id', 'title', 'message', 'category', 'priority', 'action_url', 'action_label',
  'image_url', 'icon_url', 'metadata', 'read', 'read_at', 'archived_at', 'expires_at',
  'created_at', 'updated_at',
].join(',');

export const useNotifications = ({ detailsEnabled = true }: { detailsEnabled?: boolean } = {}) => {
  const { user } = useAuth();
  const activeAccountRef = useRef<string | null>(user?.id ?? null);
  activeAccountRef.current = user?.id ?? null;
  const { preferences, preferencesReady } = usePushNotifications();
  const queryClient = useQueryClient();
  const [pageSize, setPageSize] = useState(50);
  useEffect(() => { setPageSize(50); }, [user?.id]);
  const queryKey = useMemo(() => ['notifications', user?.id, pageSize] as const, [user?.id, pageSize]);
  const inAppEnabled = preferencesReady && preferences.in_app_enabled;

  const notificationsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select(notificationColumns)
        .eq('user_id', user.id)
        .is('archived_at', null)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(pageSize + 1);
      if (error) throw error;
      return (data || []) as AppNotification[];
    },
    enabled: Boolean(user?.id && inAppEnabled && detailsEnabled),
    staleTime: 60_000,
  });

  const unreadCountQuery = useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await (supabase as any)
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
        .is('archived_at', null)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
      if (error) throw error;
      return count || 0;
    },
    enabled: Boolean(user?.id && inAppEnabled),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!user?.id || !inAppEnabled) return;
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (activeAccountRef.current !== user.id) return;
        void queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        void queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user.id] });
        if (payload.eventType === 'INSERT') {
          const item = payload.new as AppNotification;
          if (!shouldShowNotificationToast(item.id)) return;
          toast.info(item.title, {
            description: item.message || undefined,
            duration: 6000,
            ...(item.action_url ? {
              action: { label: item.action_label || 'Abrir', onClick: () => { const path = getSafeNotificationPath(item.action_url); if (path) window.location.assign(path); } },
            } : {}),
          });
        }
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [inAppEnabled, queryClient, user?.id]);

  // Cada atualização é vinculada à conta de origem, inclusive após um await.
  const verifyAccount = async (account: string) => {
    if (activeAccountRef.current !== account) throw new Error('Sua conta mudou. Atualize e tente novamente.');
    const { data: { user: sessionUser }, error } = await supabase.auth.getUser();
    if (error || sessionUser?.id !== account || activeAccountRef.current !== account)
      throw new Error('Sua sessão mudou. Nenhuma atualização foi iniciada.');
  };

  const invalidateForAccount = (account: string) => {
    if (activeAccountRef.current !== account) return;
    void queryClient.invalidateQueries({ queryKey: ['notifications', account] });
    void queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', account] });
  };

  type ScopedNotification = { notificationId: string; account: string };

  const markAsReadMutation = useMutation({
    mutationFn: async ({ notificationId, account }: ScopedNotification) => {
      await verifyAccount(account);
      const { data: updated, error } = await (supabase as any).from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', account)
        .eq('read', false)
        .is('archived_at', null)
        .or(\`expires_at.is.null,expires_at.gt.\${new Date().toISOString()}\`)
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!updated) throw new Error('Notificação já lida ou indisponível.');
      return account;
    },
    onSuccess: account => invalidateForAccount(account),
    onError: (_error, variables) => {
      if (activeAccountRef.current === variables.account) toast.error('Não foi possível marcar a notificação como lida.');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async (account: string) => {
      await verifyAccount(account);
      const { error } = await (supabase as any).from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', account)
        .eq('read', false)
        .is('archived_at', null)
        .or(\`expires_at.is.null,expires_at.gt.\${new Date().toISOString()}\`);
      if (error) throw error;
      return account;
    },
    onSuccess: account => {
      if (activeAccountRef.current !== account) return;
      invalidateForAccount(account);
      toast.success('Todas as notificações foram marcadas como lidas.');
    },
    onError: (_error, account) => {
      if (activeAccountRef.current === account) toast.error('Não foi possível atualizar as notificações.');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ notificationId, account }: ScopedNotification) => {
      await verifyAccount(account);
      const { data: updated, error } = await (supabase as any).from('notifications')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', account)
        .is('archived_at', null)
        .or(\`expires_at.is.null,expires_at.gt.\${new Date().toISOString()}\`)
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!updated) throw new Error('Notificação já arquivada ou indisponível.');
      return account;
    },
    onSuccess: account => invalidateForAccount(account),
    onError: (_error, variables) => {
      if (activeAccountRef.current === variables.account) toast.error('Não foi possível arquivar a notificação.');
    },
  });

  const loaded = notificationsQuery.data || [];
  const notifications = inAppEnabled && detailsEnabled ? loaded.slice(0, pageSize) : [];
  const hasMore = inAppEnabled && detailsEnabled && loaded.length > pageSize;
  return {
    notifications,
    hasMore,
    loadMore: () => setPageSize(previous => previous + 50),
    unreadNotifications: notifications.filter(item => !item.read),
    totalUnread: inAppEnabled ? unreadCountQuery.data || 0 : 0,
    loading: !preferencesReady || (inAppEnabled && ((detailsEnabled && notificationsQuery.isLoading) || unreadCountQuery.isLoading)),
    error: notificationsQuery.error || unreadCountQuery.error,
    isMutating: markAsReadMutation.isPending || markAllAsReadMutation.isPending || archiveMutation.isPending,
    isProcessing: markAsReadMutation.isPending || markAllAsReadMutation.isPending || archiveMutation.isPending,
    markAsRead: (notificationId: string) => {
      if (!user?.id || activeAccountRef.current !== user.id) return;
      markAsReadMutation.mutate({ notificationId, account: user.id });
    },
    markAllAsRead: () => {
      if (!user?.id || activeAccountRef.current !== user.id) return;
      markAllAsReadMutation.mutate(user.id);
    },
    archive: (notificationId: string) => {
      if (!user?.id || activeAccountRef.current !== user.id) return;
      archiveMutation.mutate({ notificationId, account: user.id });
    },
    refetch: notificationsQuery.refetch,
  };
};
