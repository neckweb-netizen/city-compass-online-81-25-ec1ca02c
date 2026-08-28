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
  vapidKey: string;
}

const FID_STORAGE_KEY = 'sajtem-firebase-fid';
let configPromise: Promise<PublicFirebaseConfig> | null = null;
let messagingPromise: Promise<{ messaging: Messaging; config: PublicFirebaseConfig }> | null = null;
let registrationPromise: Promise<string> | null = null;

async function loadFirebaseConfig(): Promise<PublicFirebaseConfig> {
  if (!configPromise) {
    const request = (async () => {
      const { data, error } = await supabase.functions.invoke('firebase-public-config', {
        method: 'POST',
      });
      if (error) throw new Error(error.message || 'Não foi possível carregar a configuração das notificações.');
      if (!data?.apiKey || !data?.projectId || !data?.messagingSenderId || !data?.appId || !data?.vapidKey) {
        throw new Error('Configuração pública das notificações incompleta.');
      }
      return data as PublicFirebaseConfig;
    })();
    configPromise = request.catch((error) => {
      configPromise = null;
      throw error;
    });
  }
  return configPromise;
}

async function getMessagingClient(): Promise<{ messaging: Messaging; config: PublicFirebaseConfig }> {
  if (!messagingPromise) {
    const request = (async () => {
      if (!(await isSupported())) throw new Error('Este navegador não oferece suporte a notificações push.');
      const config = await loadFirebaseConfig();
      const app: FirebaseApp = getApps()[0] || initializeApp(config);
      return { messaging: getMessaging(app), config };
    })();
    messagingPromise = request.catch((error) => {
      messagingPromise = null;
      throw error;
    });
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

async function registerFirebasePush(): Promise<string> {
  if (!(await isFirebasePushSupported())) throw new Error('Notificações push não são suportadas neste navegador.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(permission === 'denied'
      ? 'A permissão de notificações foi bloqueada no navegador.'
      : 'A permissão de notificações não foi concedida.');
  }

  const { messaging, config } = await getMessagingClient();
  const serviceWorkerRegistration = await getServiceWorkerRegistration();
  let unsubscribe = () => undefined;
  let timeout: number | undefined;
  const cleanup = () => {
    if (timeout !== undefined) window.clearTimeout(timeout);
    unsubscribe();
  };
  const fidPromise = new Promise<string>((resolve, reject) => {
    timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('O serviço de notificações demorou para registrar este dispositivo. Tente novamente.'));
    }, 20_000);
    unsubscribe = onRegistered(messaging, async (fid) => {
      cleanup();
      try {
        await saveRegistration(fid);
        resolve(fid);
      } catch (error) {
        reject(error);
      }
    });
  });

  try {
    await register(messaging, {
      serviceWorkerRegistration,
      vapidKey: config.vapidKey,
    });
  } catch (error) {
    cleanup();
    throw error;
  }
  return fidPromise;
}

export function enableFirebasePush(): Promise<string> {
  if (!registrationPromise) {
    const request = registerFirebasePush();
    registrationPromise = request.finally(() => {
      registrationPromise = null;
    });
  }
  return registrationPromise;
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
