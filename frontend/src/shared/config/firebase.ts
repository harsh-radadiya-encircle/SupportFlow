import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAx0ZBWVYBIiHQ8dpnrcbmIiutx9PPEhpc',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'supportflow-app-2ce28.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'supportflow-app-2ce28',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'supportflow-app-2ce28.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '43565030150',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:43565030150:web:21c3f7eae5f6c9e1bb9c87',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const requestFcmToken = async (): Promise<string | null> => {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('[FCM] Push notifications not supported in this browser.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[FCM] Notification permission denied by user.');
      return null;
    }

    const messaging = getMessaging(app);
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

    const token = await getToken(messaging, { vapidKey });
    if (token) {
      console.log('[FCM] Device Push Token obtained successfully:', token);
      return token;
    } else {
      console.warn('[FCM] No registration token available.');
      return null;
    }
  } catch (error) {
    console.warn('[FCM] Error obtaining FCM device token:', error);
    return null;
  }
};

export default app;
