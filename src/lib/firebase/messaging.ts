import { getApps, getApp, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
} from 'firebase/messaging';
import { supabase } from '@/lib/supabase/client';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY as string | undefined;

export const isFcmConfigured = (): boolean =>
  Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && VAPID_KEY);

let cachedApp: FirebaseApp | null = null;
let cachedMessaging: Messaging | null = null;

const getFirebaseApp = (): FirebaseApp | null => {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) return null;
  if (cachedApp) return cachedApp;
  cachedApp = getApps().length ? getApp() : initializeApp(firebaseConfig as Record<string, string>);
  return cachedApp;
};

const getMessagingSafe = async (): Promise<Messaging | null> => {
  if (cachedMessaging) return cachedMessaging;
  if (!(await isSupported().catch(() => false))) return null;
  const app = getFirebaseApp();
  if (!app) return null;
  cachedMessaging = getMessaging(app);
  return cachedMessaging;
};

export type PushPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export const getPushPermission = (): PushPermissionState => {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission as PushPermissionState;
};

export const requestPushPermission = async (): Promise<PushPermissionState> => {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  const res = await Notification.requestPermission();
  return res as PushPermissionState;
};

const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  } catch (e) {
    console.warn('SW registration failed', e);
    return null;
  }
};

/**
 * Request permission, fetch the FCM token, and persist it on the server.
 * Idempotent — safe to call repeatedly. Returns the token or null.
 */
export const ensurePushToken = async (): Promise<string | null> => {
  if (!isFcmConfigured()) return null;
  const messaging = await getMessagingSafe();
  if (!messaging) return null;
  const swReg = await registerServiceWorker();
  if (!swReg) return null;
  const perm = await requestPushPermission();
  if (perm !== 'granted') return null;
  try {
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });
    if (!token) return null;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return token;

    // Functions table is unspecified in our generated types; cast to bypass.
    await (supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ error: { message: string } | null }>)('register_push_token', {
      p_token: token,
      p_platform: 'web',
      p_device_info: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
      },
    });
    return token;
  } catch (e) {
    console.warn('Failed to fetch FCM token', e);
    return null;
  }
};

export const subscribeForegroundPush = async (
  handler: (n: { title?: string; body?: string; link?: string }) => void,
): Promise<() => void> => {
  const messaging = await getMessagingSafe();
  if (!messaging) return () => {};
  const unsub = onMessage(messaging, (payload) => {
    const link = payload.fcmOptions?.link ?? (payload.data?.link as string | undefined);
    handler({
      title: payload.notification?.title,
      body: payload.notification?.body,
      link,
    });
  });
  return unsub;
};
