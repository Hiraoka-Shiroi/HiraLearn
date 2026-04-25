import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import {
  Analytics,
  getAnalytics,
  isSupported,
  logEvent,
  setUserId,
} from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

let app: FirebaseApp | null = null;
let analyticsInstance: Analytics | null = null;
let initPromise: Promise<Analytics | null> | null = null;

const initAnalytics = (): Promise<Analytics | null> => {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!isFirebaseConfigured) return null;
    if (typeof window === 'undefined') return null;
    try {
      const supported = await isSupported();
      if (!supported) return null;
      app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      analyticsInstance = getAnalytics(app);
      return analyticsInstance;
    } catch (e) {
      console.warn('Firebase analytics init failed:', e);
      return null;
    }
  })();

  return initPromise;
};

/** Public analytics events tracked across the app. */
export type AnalyticsEvent =
  | 'registration_complete'
  | 'lesson_start'
  | 'lesson_complete'
  | 'payment_click'
  | 'game_start';

export const trackEvent = async (
  event: AnalyticsEvent,
  params?: Record<string, string | number | boolean>,
): Promise<void> => {
  const a = await initAnalytics();
  if (!a) return;
  try {
    logEvent(a, event, params);
  } catch (e) {
    console.warn('Analytics logEvent failed:', e);
  }
};

export const identifyUser = async (userId: string | null): Promise<void> => {
  const a = await initAnalytics();
  if (!a) return;
  try {
    setUserId(a, userId ?? '');
  } catch (e) {
    console.warn('Analytics setUserId failed:', e);
  }
};

export const initAnalyticsOnce = (): void => {
  void initAnalytics();
};
