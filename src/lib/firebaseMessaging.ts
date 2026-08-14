import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import {
  getMessaging,
  isSupported,
  onMessage,
  onRegistered,
  register,
  unregister,
  type Messaging,
  type MessagePayload,
} from 'firebase/messaging';
import { supabase } from '@/integrations/supabase/client';

interface PublicFirebaseConfig extends FirebaseOptions {
  vapidKey?: string;
}

const FID_STORAGE_KEY = 'sajtem-firebase-fid';
let configPromise: Promise<PublicFirebaseConfig> | null = null;
let messagingPromise: Promise<{ messaging: Messaging; config: PublicFirebaseConfig }> | null = null;

async function loadFirebaseConfig(): Promise<PublicFirebaseConfig> {
  if (!configPromise) {
    configPromise = (async () => {
      const { data, error } = await supabase.functions.invoke('firebase-public-config', {
        method: 'POST',
      });
      if (error) throw new Error(error.message || 'Não foi possível carregar a configuração do Firebase.');
      if (!data?.apiKey || !data?.projectId || !data?.messagingSenderId || !data?.appId) {
        throw new Error('Configuração pública do Firebase incompleta.');
      }
      return data as PublicFirebaseConfig;
    })();
  }
  return configPromise;
}

async function getMessagingClient(): Promise<{ messaging: Messaging; config: PublicFirebaseConfig }> {
  if (!messagingPromise) {
    messagingPromise = (async () => {
      if (!(await isSupported())) throw new Error('Este navegador não oferece suporte a notificações push.');
      const config = await loadFirebaseConfig();
      const app: FirebaseApp = getApps()[0] || initializeApp(config);
      return { messaging: getMessaging(app), config };
    })();
  }
  return messagingPromise;
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) throw new Error('Service Worker não disponível neste navegador.');
  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing) return existing;
  return navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

function getPlatform(): 'web' | 'pwa' {
  const standalone = window.matchMedia('(display-mode: standalone)').matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return standalone ? 'pwa' : 'web';
}

function getDeviceName(): string {
  const extendedNavigator = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = extendedNavigator.userAgentData?.platform || navigator.platform || 'Dispositivo';
  return `${getPlatform() === 'pwa' ? 'PWA' : 'Navegador'} • ${platform}`;
}

async function saveRegistration(fid: string): Promise<void> {
  const { error } = await (supabase as any).rpc('register_notification_device', {
    p_registration_id: fid,
    p_target_type: 'fid',
    p_platform: getPlatform(),
    p_device_name: getDeviceName(),
    p_user_agent: navigator.userAgent,
  });
  if (error) throw error;
  localStorage.setItem(FID_STORAGE_KEY, fid);
}

export async function isFirebasePushSupported(): Promise<boolean> {
  return 'Notification' in window && 'serviceWorker' in navigator && await isSupported();
}

export async function enableFirebasePush(): Promise<string> {
  if (!(await isFirebasePushSupported())) throw new Error('Notificações push não são suportadas neste navegador.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(permission === 'denied'
      ? 'A permissão de notificações foi bloqueada no navegador.'
      : 'A permissão de notificações não foi concedida.');
  }

  const { messaging, config } = await getMessagingClient();
  const serviceWorkerRegistration = await getServiceWorkerRegistration();
  const fidPromise = new Promise<string>((resolve, reject) => {
    let unsubscribe = () => undefined;
    const timeout = window.setTimeout(() => {
      unsubscribe();
      reject(new Error('O Firebase demorou para registrar este dispositivo. Tente novamente.'));
    }, 20_000);
    unsubscribe = onRegistered(messaging, async (fid) => {
      window.clearTimeout(timeout);
      unsubscribe();
      try {
        await saveRegistration(fid);
        resolve(fid);
      } catch (error) {
        reject(error);
      }
    });
  });

  await register(messaging, {
    serviceWorkerRegistration,
    ...(config.vapidKey ? { vapidKey: config.vapidKey } : {}),
  });
  return fidPromise;
}

export async function syncFirebasePushIfGranted(): Promise<string | null> {
  if (!('Notification' in window) || Notification.permission !== 'granted') return null;
  return enableFirebasePush();
}

export async function disableFirebasePush(): Promise<void> {
  const fid = localStorage.getItem(FID_STORAGE_KEY);
  if (fid) {
    const { error } = await (supabase as any).rpc('unregister_notification_device', {
      p_registration_id: fid,
    });
    if (error) throw error;
  }
  try {
    const { messaging } = await getMessagingClient();
    await unregister(messaging);
  } finally {
    localStorage.removeItem(FID_STORAGE_KEY);
  }
}

export async function subscribeToForegroundMessages(
  callback: (payload: MessagePayload) => void,
): Promise<() => void> {
  const { messaging } = await getMessagingClient();
  return onMessage(messaging, callback);
}

export function getStoredFirebaseFid(): string | null {
  return localStorage.getItem(FID_STORAGE_KEY);
}
