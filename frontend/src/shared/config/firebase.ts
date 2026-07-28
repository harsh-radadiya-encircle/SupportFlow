import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyMockKeyForDevSupportFlow123',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'supportflow-demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'supportflow-demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'supportflow-demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:mockappid123',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const getFirebaseMessaging = async () => {
  const supported = await isSupported();
  if (supported) {
    return getMessaging(app);
  }
  return null;
};

export default app;
