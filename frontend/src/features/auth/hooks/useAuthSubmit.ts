import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCustomToken,
  deleteUser,
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { auth, googleProvider, requestFcmToken } from '../../../shared/config/firebase';
import { useAuthStore } from '../../../shared/store/authStore';
import { Role } from '../../../shared/types';
import { authApi } from '../api/auth.api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const registerFcmToken = async (authToken: string) => {
  try {
    const fcmToken = await requestFcmToken();
    if (fcmToken) {
      await fetch('http://localhost:5000/api/v1/users/fcm-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ token: fcmToken, deviceType: 'web' }),
      }).catch(() => null);
    }
  } catch {
    /* FCM is non-critical */
  }
};

export const getFriendlyAuthError = (err: any): string => {
  const code = err?.code || '';
  const serverMsg = err?.response?.data?.message || err?.message || '';

  if (serverMsg && !serverMsg.includes('Firebase: Error')) return serverMsg;

  const map: Record<string, string> = {
    'auth/account-exists-with-different-credential':
      'This email is already registered with Email & Password. Sign in with your password, then link Google in Profile Settings.',
    'auth/credential-already-in-use': 'This account is already linked to a different user.',
    'auth/provider-already-linked': 'Google is already linked to your profile.',
    'auth/user-not-found':
      'No account found for this email. Click "Create account" below to sign up.',
    'auth/wrong-password':
      'Incorrect password. Check your password or click "Forgot password?" to reset it.',
    'auth/invalid-credential':
      'Invalid email or password. If you don\'t have an account, click "Create account".',
    'auth/email-already-in-use':
      'An account with this email already exists. Sign in with your password or Google.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    'auth/too-many-requests':
      'Too many failed attempts. This account is temporarily disabled. Try again later.',
    'auth/network-request-failed': 'Network error. Check your internet connection and try again.',
    'auth/popup-closed-by-user': 'Google sign-in popup was closed before completing.',
  };

  return map[code] || 'Authentication failed. Please check your details and try again.';
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface AuthFormValues {
  fullName?: string;
  email: string;
  password: string;
  businessName?: string;
}

export const useAuthSubmit = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = () => { setErrorMessage(null); setSuccessMessage(null); };

  const redirectByRole = (role: Role) => {
    const paths: Record<string, string> = {
      PLATFORM_ADMIN: '/admin/dashboard',
      BUSINESS_ADMIN: '/business/dashboard',
      SUPPORT_AGENT: '/agent/dashboard',
      CUSTOMER: '/customer/tickets',
    };
    navigate(paths[role] ?? '/customer/tickets');
  };

  const finishSession = async (user: any, token: string, welcomeMsg: string) => {
    localStorage.setItem('supportflow_token', token);
    await registerFcmToken(token);
    setAuth(user, token);
    toast.success(welcomeMsg);
    redirectByRole(user.role);
  };

  // ── Email/Password submit ───────────────────────────────────────────────
  const handleSubmit = async (
    data: AuthFormValues,
    isRegisterMode: boolean,
    selectedRole: 'BUSINESS_ADMIN' | 'CUSTOMER'
  ) => {
    setIsSubmitting(true);
    clearMessages();

    try {
      if (isRegisterMode) {
        // Validation
        if (!data.fullName?.trim()) throw new Error('Please enter your full name.');
        if (selectedRole === 'BUSINESS_ADMIN' && !data.businessName?.trim())
          throw new Error('Company / Business Name is required for Business Owners.');

        let firebaseUid: string;
        let idToken = '';
        try {
          const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
          firebaseUid = cred.user.uid;
          idToken = await cred.user.getIdToken();
        } catch (firebaseErr: any) {
          if (firebaseErr.code === 'auth/email-already-in-use') {
            setErrorMessage('Email already registered. Switching to Sign In.');
            toast.error('Email already registered. Switching to Sign In.');
            return 'switch-to-login';
          }
          throw firebaseErr;
        }

        try {
          const res = await authApi.syncUser({
            fullName: data.fullName || 'User',
            role: selectedRole,
            businessName: selectedRole === 'BUSINESS_ADMIN' ? data.businessName : undefined,
            mode: 'register',
          }, idToken);
          const { user } = res?.data || res;
          await finishSession(user, idToken, `Welcome to SupportFlow, ${user.fullName}!`);
        } catch (dbErr) {
          if (auth.currentUser) await deleteUser(auth.currentUser).catch(() => null);
          await auth.signOut().catch(() => null);
          throw dbErr;
        }
      } else {
        let userUid = '';
        let userEmail = data.email;
        let idToken = '';

        try {
          const cred = await signInWithEmailAndPassword(auth, data.email, data.password);
          userUid = cred.user.uid;
          userEmail = cred.user.email || data.email;
          idToken = await cred.user.getIdToken();
        } catch (firebaseErr: any) {
          const msg = getFriendlyAuthError(firebaseErr);
          setErrorMessage(msg);
          toast.error(msg);
          return;
        }

        const res = await authApi.syncUser({ mode: 'login' }, idToken);
        const { user } = res?.data || res;
        await finishSession(user, idToken, `Welcome back, ${user.fullName}!`);
      }
    } catch (err: any) {
      console.error('[Auth Error]:', err);
      const msg = getFriendlyAuthError(err);
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Google Sign-In ──────────────────────────────────────────────────────
  const handleGoogleSignIn = async (
    isRegisterMode: boolean,
    selectedRole: 'BUSINESS_ADMIN' | 'CUSTOMER'
  ) => {
    setIsGoogleSubmitting(true);
    clearMessages();

    try {
      let result;
      try {
        result = await signInWithPopup(auth, googleProvider);
      } catch (popupErr: any) {
        if (['auth/account-exists-with-different-credential', 'auth/credential-already-in-use'].includes(popupErr.code)) {
          await auth.signOut().catch(() => null);
          const msg = 'This email is registered with Email & Password. Please sign in with your password. You can link Google under My Profile → Connected Accounts.';
          setErrorMessage(msg);
          toast.error(msg);
          return;
        }
        throw popupErr;
      }

      const email = result.user.email!;
      const checkRes = await authApi.checkProvider(email).catch(() => null);
      const storedProvider = checkRes?.data?.authProvider as string | undefined;

      if (checkRes?.data?.exists && storedProvider === 'EMAIL_PASSWORD') {
        await auth.signOut().catch(() => null);
        const msg = 'This email is registered with Email & Password. Please sign in with your password. You can link Google under My Profile → Connected Accounts after signing in.';
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }

      const idToken = await result.user.getIdToken();
      const res = await authApi.syncUser({
        fullName: result.user.displayName || 'Google User',
        role: selectedRole,
        mode: checkRes?.data?.exists ? 'login' : isRegisterMode ? 'register' : 'login',
      }, idToken);
      const { user } = res?.data || res;
      await finishSession(user, idToken, `Welcome, ${user.fullName}!`);
    } catch (err: any) {
      console.error('[Google Auth Error]:', err);
      await auth.signOut().catch(() => null);
      const msg = getFriendlyAuthError(err);
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return {
    isSubmitting,
    isGoogleSubmitting,
    errorMessage,
    successMessage,
    setErrorMessage,
    clearMessages,
    handleSubmit,
    handleGoogleSignIn,
  };
};
