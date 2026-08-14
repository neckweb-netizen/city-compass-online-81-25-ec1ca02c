import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['notifications', user?.id] as const, [user?.id]);

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
        .limit(50);
      if (error) throw error;
      return (data || []) as AppNotification[];
    },
    enabled: Boolean(user?.id),
    staleTime: 30_000,
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
    enabled: Boolean(user?.id),
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey });
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user.id] });
        if (payload.eventType === 'INSERT') {
          const item = payload.new as AppNotification;
          toast.info(item.title, {
            description: item.message || undefined,
            duration: 6000,
            ...(item.action_url ? {
              action: { label: item.action_label || 'Abrir', onClick: () => { window.location.href = item.action_url!; } },
            } : {}),
          });
        }
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [queryClient, queryKey, user?.id]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
  };

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      const { error } = await (supabase as any).from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: () => toast.error('Não foi possível marcar a notificação como lida.'),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      const { error } = await (supabase as any).from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('read', false)
        .is('archived_at', null);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Todas as notificações foram marcadas como lidas.'); },
    onError: () => toast.error('Não foi possível atualizar as notificações.'),
  });

  const archiveMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      const { error } = await (supabase as any).from('notifications')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: () => toast.error('Não foi possível arquivar a notificação.'),
  });

  const notifications = notificationsQuery.data || [];
  return {
    notifications,
    unreadNotifications: notifications.filter(item => !item.read),
    totalUnread: unreadCountQuery.data || 0,
    loading: notificationsQuery.isLoading || unreadCountQuery.isLoading,
    error: notificationsQuery.error || unreadCountQuery.error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    archive: archiveMutation.mutate,
    refetch: notificationsQuery.refetch,
  };
};
