import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getSafeNotificationPath } from '@/lib/safeNavigation';
import { shouldShowNotificationToast } from '@/lib/notificationToastDedup';

// The Firebase SDK is intentionally loaded only for authenticated users.
const loadFirebaseMessaging = () => import('@/lib/firebaseMessaging');

export interface NotificationPreferences {
  in_app_enabled: boolean;
  push_enabled: boolean;
  system_enabled: boolean;
  marketing_enabled: boolean;
  events_enabled: boolean;
  community_enabled: boolean;
}

interface PushNotificationsContextValue {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  enabled: boolean;
  preferencesReady: boolean;
  pushStateReady: boolean;
  loading: boolean;
  error: string | null;
  preferences: NotificationPreferences;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  savePreferences: (values: Partial<NotificationPreferences>) => Promise<void>;
}

const defaultPreferences: NotificationPreferences = {
  in_app_enabled: true,
  push_enabled: true,
  system_enabled: true,
  marketing_enabled: true,
  events_enabled: true,
  community_enabled: true,
};

const PushNotificationsContext = createContext<PushNotificationsContextValue | null>(null);

export const PushNotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const currentUserRef = useRef<string | null>(user?.id ?? null);
  currentUserRef.current = user?.id ?? null;
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [enabled, setEnabled] = useState(false);
  const [supportReady, setSupportReady] = useState(false);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [pushStateReady, setPushStateReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState(defaultPreferences);

  useEffect(() => {
    if (!user?.id) {
      setSupported(false);
      setPermission('default');
      setSupportReady(false);
      return;
    }
    let active = true;
    loadFirebaseMessaging().then(({ isFirebasePushSupported }) => isFirebasePushSupported()).then((value) => {
      if (!active) return;
      setSupported(value);
      setPermission(value ? Notification.permission : 'unsupported');
      setSupportReady(true);
    }).catch(() => {
      if (active) {
        setSupported(false);
        setPermission('unsupported');
        setSupportReady(true);
      }
    });
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setEnabled(false);
      setPreferences(defaultPreferences);
      setPreferencesReady(false);
      setPushStateReady(false);
      setLoading(false);
      setError(null);
      return;
    }
    setPreferencesReady(false);
    setEnabled(false);
    setPreferences(defaultPreferences);
    setPushStateReady(false);
    setError(null);
    let active = true;
    (supabase as any)
      .from('notification_preferences')
      .select('in_app_enabled, push_enabled, system_enabled, marketing_enabled, events_enabled, community_enabled')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error: queryError }: any) => {
        if (!active) return;
        if (queryError) {
          console.warn('Falha ao carregar preferências de notificação:', queryError);
          setError('Não foi possível carregar as preferências de notificação.');
          setPreferences({ ...defaultPreferences, in_app_enabled: false, push_enabled: false });
        } else {
          setError(null);
          if (data) setPreferences({ ...defaultPreferences, ...data });
        }
        setPreferencesReady(true);
      }).catch(() => {
        if (!active) return;
        setError('Não foi possível consultar as preferências de notificação.');
          setPreferences({ ...defaultPreferences, in_app_enabled: false, push_enabled: false });
        setPreferencesReady(true);
      });
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !supported || Notification.permission !== 'granted' || !preferences.push_enabled) return;
    let active = true;
    loadFirebaseMessaging().then(({ syncFirebasePushIfGranted }) => syncFirebasePushIfGranted())
      .then((fid) => { if (active) setEnabled(Boolean(fid)); })
      .catch((syncError) => {
        if (active) setError(syncError instanceof Error ? syncError.message : 'Falha ao sincronizar notificações.');
      })
      .finally(() => { if (active) setPushStateReady(true); });
    return () => { active = false; };
  }, [user?.id, supported, preferences.push_enabled]);

  useEffect(() => {
    setPushStateReady(false);
    if (!user?.id || !supportReady || !preferencesReady) return;

    if (!supported || permission !== 'granted' || !preferences.push_enabled) {
      setPushStateReady(true);
      return;
    }

    if (enabled) {
      setPushStateReady(true);
      return;
    }

    // The Firebase effect above marks this ready only after its initial sync settles.
    return;
  }, [enabled, permission, preferences.push_enabled, preferencesReady, supportReady, supported, user?.id]);

  useEffect(() => {
    if (!user?.id || !supported || !preferencesReady || !preferences.push_enabled) return;
    const subscribingUser = user.id;
    let active = true;
    let unsubscribe: (() => void) | undefined;
    loadFirebaseMessaging().then(({ subscribeToForegroundMessages }) => subscribeToForegroundMessages((payload) => {
      if (!active || currentUserRef.current !== subscribingUser) return;
      if (!shouldShowNotificationToast(payload.data?.notification_id)) return;
      const title = payload.notification?.title || payload.data?.title || 'Nova notificação';
      const description = payload.notification?.body || payload.data?.body;
      const actionUrl = payload.data?.action_url;
      toast.info(title, {
        description,
        duration: 7000,
        ...(actionUrl ? { action: { label: 'Abrir', onClick: () => { const path = getSafeNotificationPath(actionUrl); if (path) window.location.assign(path); } } } : {}),
      });
    })).then((cleanup) => {
      if (active) unsubscribe = cleanup;
      else cleanup();
    }).catch(() => undefined);
    return () => { active = false; unsubscribe?.(); };
  }, [user?.id, supported, preferencesReady, preferences.push_enabled]);

  const savePreferences = useCallback(async (values: Partial<NotificationPreferences>) => {
    if (!user?.id) throw new Error('Faça login para alterar as preferências.');
    const requestedUser = user.id;
    if (currentUserRef.current !== requestedUser) throw new Error('Sua conta mudou. Atualize a página e tente novamente.');
    const next = { ...preferences, ...values };
    const { error: saveError } = await (supabase as any)
      .from('notification_preferences')
      .upsert({ user_id: requestedUser, ...next }, { onConflict: 'user_id' });
    if (currentUserRef.current !== requestedUser) throw new Error('A conta mudou durante a atualização. Confira suas preferências na nova conta.');
    if (saveError) throw saveError;
    setPreferences(next);
  }, [preferences, user?.id]);

  const enable = useCallback(async () => {
    if (!user?.id) throw new Error('Faça login para ativar as notificações.');
    const requestedUser = user.id;
    if (currentUserRef.current !== requestedUser) throw new Error('Sua conta mudou.');
    setLoading(true);
    setError(null);
    try {
      const { enableFirebasePush } = await loadFirebaseMessaging();
      await enableFirebasePush();
      if (currentUserRef.current !== requestedUser) throw new Error('Sua conta mudou durante a ativação.');
      await savePreferences({ push_enabled: true });
      if (currentUserRef.current !== requestedUser) return;
      setPermission(Notification.permission);
      setEnabled(true);
      toast.success('Notificações ativadas neste dispositivo.');
    } catch (enableError) {
      if (currentUserRef.current === requestedUser) {
        const message = enableError instanceof Error ? enableError.message : 'Não foi possível ativar as notificações.';
        setError(message);
        setPermission('Notification' in window ? Notification.permission : 'unsupported');
      }
      throw enableError;
    } finally {
      if (currentUserRef.current === requestedUser) setLoading(false);
    }
  }, [savePreferences, user?.id]);

  const disable = useCallback(async () => {
    if (!user?.id) throw new Error('Faça login para desativar as notificações.');
    const requestedUser = user.id;
    if (currentUserRef.current !== requestedUser) throw new Error('Sua conta mudou.');
    setLoading(true);
    setError(null);
    try {
      const { getStoredFirebaseFid, disableFirebasePush } = await loadFirebaseMessaging();
      if (getStoredFirebaseFid()) await disableFirebasePush();
      if (currentUserRef.current !== requestedUser) throw new Error('Sua conta mudou durante a desativação.');
      await savePreferences({ push_enabled: false });
      if (currentUserRef.current !== requestedUser) return;
      setEnabled(false);
      toast.success('Notificações desativadas neste dispositivo.');
    } catch (disableError) {
      if (currentUserRef.current === requestedUser) {
        const message = disableError instanceof Error ? disableError.message : 'Não foi possível desativar as notificações.';
        setError(message);
      }
      throw disableError;
    } finally {
      if (currentUserRef.current === requestedUser) setLoading(false);
    }
  }, [savePreferences, user?.id]);

  const value = useMemo(() => ({
    supported,
    permission,
    enabled,
    preferencesReady,
    pushStateReady,
    loading,
    error,
    preferences,
    enable,
    disable,
    savePreferences,
  }), [supported, permission, enabled, preferencesReady, pushStateReady, loading, error, preferences, enable, disable, savePreferences]);

  return <PushNotificationsContext.Provider value={value}>{children}</PushNotificationsContext.Provider>;
};

export const usePushNotifications = () => {
  const context = useContext(PushNotificationsContext);
  if (!context) throw new Error('usePushNotifications deve ser usado dentro de PushNotificationsProvider');
  return context;
};
