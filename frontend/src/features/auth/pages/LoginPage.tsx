import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCustomToken,
  deleteUser,
} from 'firebase/auth';
import toast from 'react-hot-toast';
import { auth, googleProvider, requestFcmToken } from '../../../shared/config/firebase';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { useAuthStore } from '../../../shared/store/authStore';
import { Role } from '../../../shared/types';
import {
  Headset,
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  Building,
  User,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { authApi } from '../api/auth.api';

const registerFcmDeviceToken = async (authToken: string) => {
  try {
    const fcmToken = await requestFcmToken();
    if (fcmToken) {
      await fetch('http://localhost:5000/api/v1/users/fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token: fcmToken, deviceType: 'web' }),
      }).catch(() => null);
    }
  } catch (err) {
    console.warn('[FCM Registration] Notice:', err);
  }
};

const getFriendlyAuthErrorMessage = (err: any): string => {
  const code = err?.code || '';
  const serverMsg = err?.response?.data?.message || err?.message || '';

  if (serverMsg && !serverMsg.includes('Firebase: Error')) {
    return serverMsg;
  }

  if (code === 'auth/account-exists-with-different-credential') {
    return 'This email address is already registered using Email & Password. Please sign in with your email and password first, then connect your Google account in Profile Settings.';
  }
  if (code === 'auth/credential-already-in-use') {
    return 'This account is already linked to a different user account.';
  }
  if (code === 'auth/provider-already-linked') {
    return 'Google account is already linked to your profile.';
  }
  if (code === 'auth/user-not-found') {
    return 'No account found for this email address. Please click "Create account" below to sign up first.';
  }
  if (code === 'auth/wrong-password') {
    return 'Incorrect password. Please check your password or click "Forgot Password?" to reset it.';
  }
  if (code === 'auth/invalid-credential') {
    return 'Invalid email address or password. If you do not have an account, please click "Create account" below to sign up first.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email address already exists. Please sign in with your password or Google.';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Access to this account has been temporarily disabled due to multiple failed attempts. Please try again later.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network connection error. Please check your internet connection and try again.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in popup was closed before completing authentication.';
  }

  return 'Authentication failed. Please check your login details and try again.';
};

const authSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  businessName: z.string().optional(),
});

type AuthFormValues = z.infer<typeof authSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'BUSINESS_ADMIN' | 'CUSTOMER'>('BUSINESS_ADMIN');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
  });

  const handleFormSubmit = async (data: AuthFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);
    setSuccessMessage(null);

    if (isRegisterMode) {
      if (!data.fullName?.trim()) {
        setErrorMessage('Please enter your full name to create an account.');
        setIsSubmitting(false);
        return;
      }
      if (selectedRole === 'BUSINESS_ADMIN' && !data.businessName?.trim()) {
        setErrorMessage('Company / Business Name is required for Business Owners.');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      if (isRegisterMode) {
        // Register Mode with Email & Password
        let firebaseUid: string;

        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            data.email,
            data.password
          );
          firebaseUid = userCredential.user.uid;
        } catch (firebaseErr: any) {
          if (firebaseErr.code === 'auth/email-already-in-use') {
            const msg =
              'An account with this email address already exists. Please sign in with your password or click Google Sign-In.';
            setErrorMessage(msg);
            setIsRegisterMode(false);
            toast.error('Email already registered. Switching to Sign In.');
            return;
          }
          throw firebaseErr;
        }

        // Register in PostgreSQL DB
        try {
          const response = await authApi.syncUser({
            firebaseUid,
            email: data.email,
            fullName: data.fullName || 'User',
            role: selectedRole,
            businessName: selectedRole === 'BUSINESS_ADMIN' ? data.businessName : undefined,
            mode: 'register',
            authProvider: 'EMAIL_PASSWORD',
          });

          const syncData = response?.data || response;
          const user = syncData.user;
          const sessionToken = syncData.token;

          localStorage.setItem('supportflow_token', sessionToken);
          await registerFcmDeviceToken(sessionToken);

          setAuth(user, sessionToken);
          toast.success(`Welcome to SupportFlow, ${user.fullName}!`);
          redirectUserByRole(user.role);
        } catch (dbErr: any) {
          if (auth.currentUser) {
            await deleteUser(auth.currentUser).catch(() => null);
          }
          await auth.signOut().catch(() => null);
          throw dbErr;
        }
      } else {
        // Login Mode with Email & Password
        let idToken: string = '';
        let userUid: string = '';
        let userEmail: string = data.email;

        try {
          const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
          idToken = await userCredential.user.getIdToken();
          userUid = userCredential.user.uid;
          userEmail = userCredential.user.email || data.email;
        } catch (firebaseErr: any) {
          const code = firebaseErr?.code || '';
          if (
            code === 'auth/wrong-password' ||
            code === 'auth/invalid-credential' ||
            code === 'auth/user-not-found'
          ) {
            // Attempt automatic backend password sync & restoration via Firebase Admin SDK
            try {
              const syncRes = await authApi.syncPassword({
                email: data.email,
                password: data.password,
              });
              const syncData = syncRes?.data || syncRes;

              if (syncData?.user && syncData?.token) {
                const user = syncData.user;
                const sessionToken = syncData.token;

                if (syncData.firebaseCustomToken) {
                  await signInWithCustomToken(auth, syncData.firebaseCustomToken).catch(() => null);
                }

                localStorage.setItem('supportflow_token', sessionToken);
                await registerFcmDeviceToken(sessionToken);

                setAuth(user, sessionToken);
                toast.success(`Welcome back, ${user.fullName}!`);
                redirectUserByRole(user.role);
                return;
              }
            } catch (syncErr) {
              const msg =
                'Incorrect password. Please check your password or click "Forgot Password?" to reset it.';
              setErrorMessage(msg);
              toast.error(msg);
              return;
            }
          }
          throw firebaseErr;
        }

        // Authenticate via PostgreSQL DB sync API
        // Note: do NOT hardcode authProvider as EMAIL_PASSWORD here.
        // The backend will determine the correct provider from what's stored.
        const response = await authApi.syncUser({
          firebaseUid: userUid,
          email: userEmail,
          mode: 'login',
          authProvider: 'EMAIL_PASSWORD',
        });

        const syncData = response?.data || response;
        const user = syncData.user;
        // Always use backend JWT — never store a raw Firebase ID token in localStorage
        const sessionToken = syncData.token;

        localStorage.setItem('supportflow_token', sessionToken);
        await registerFcmDeviceToken(sessionToken);

        setAuth(user, sessionToken);
        toast.success(`Welcome back, ${user.fullName}!`);
        redirectUserByRole(user.role);
      }
    } catch (err: any) {
      console.error('[Auth Error]:', err);
      const friendlyMsg = getFriendlyAuthErrorMessage(err);
      setErrorMessage(friendlyMsg);
      toast.error(friendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      // Step 1: Attempt Google popup sign-in
      // This may throw auth/account-exists-with-different-credential
      // if the same email is registered under email/password in Firebase.
      let result;
      try {
        result = await signInWithPopup(auth, googleProvider);
      } catch (popupErr: any) {
        // Firebase explicitly tells us this email belongs to a different provider.
        // Show a clear message and abort — do NOT overwrite the existing account.
        if (
          popupErr.code === 'auth/account-exists-with-different-credential' ||
          popupErr.code === 'auth/credential-already-in-use'
        ) {
          await auth.signOut().catch(() => null);
          const msg =
            'This email is already registered using Email & Password. Please sign in with your password. You can then link Google in My Profile → Connected Accounts.';
          setErrorMessage(msg);
          toast.error(msg);
          return;
        }
        throw popupErr;
      }

      const email = result.user.email!;

      // Step 2: Check what provider this email is stored under in our PostgreSQL DB.
      // This is the authoritative check — Firebase providerData is unreliable after
      // account linking because Google popup can succeed but the DB still has
      // EMAIL_PASSWORD stored.
      const checkRes = await authApi.checkProvider(email).catch(() => null);
      const storedProvider = checkRes?.data?.authProvider as string | undefined;

      if (checkRes?.data?.exists && storedProvider === 'EMAIL_PASSWORD') {
        // This user registered with email/password. Block Google login to prevent
        // overwriting their firebaseUid with the Google UID in PostgreSQL.
        await auth.signOut().catch(() => null);
        const msg =
          'This email is registered with Email & Password. Please sign in with your password. You can link your Google account under My Profile → Connected Accounts after signing in.';
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }

      // Step 3: Sync with PostgreSQL — backend will auto-provision new Google users
      // or allow existing GOOGLE / MULTI_PROVIDER users through.
      const response = await authApi.syncUser({
        firebaseUid: result.user.uid,
        email,
        fullName: result.user.displayName || 'Google User',
        role: selectedRole,
        // In login mode for new Google users, backend auto-provisions them.
        // In register mode, backend creates with GOOGLE provider.
        mode: checkRes?.data?.exists ? 'login' : (isRegisterMode ? 'register' : 'login'),
        authProvider: 'GOOGLE',
      });

      const syncData = response?.data || response;
      const user = syncData.user;
      // Always use the backend JWT — never store a raw Firebase ID token
      const sessionToken = syncData.token;

      localStorage.setItem('supportflow_token', sessionToken);
      await registerFcmDeviceToken(sessionToken);

      setAuth(user, sessionToken);
      toast.success(`Welcome, ${user.fullName}!`);
      redirectUserByRole(user.role);
    } catch (err: any) {
      console.error('[Google Auth Error]:', err);
      // Always sign out from Firebase on any error to avoid stale Google sessions
      await auth.signOut().catch(() => null);
      const friendlyMsg = getFriendlyAuthErrorMessage(err);
      setErrorMessage(friendlyMsg);
      toast.error(friendlyMsg);
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const redirectUserByRole = (role: Role) => {
    switch (role) {
      case 'PLATFORM_ADMIN':
        navigate('/admin/dashboard');
        break;
      case 'BUSINESS_ADMIN':
        navigate('/business/dashboard');
        break;
      case 'SUPPORT_AGENT':
        navigate('/agent/dashboard');
        break;
      case 'CUSTOMER':
      default:
        navigate('/customer/tickets');
        break;
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-white text-slate-900 font-sans">
      {/* LEFT COLUMN: Hero Showcase */}
      <div className="hidden lg:flex lg:col-span-6 bg-gradient-to-br from-slate-100 via-indigo-50/50 to-white relative p-12 flex-col justify-between overflow-hidden border-r border-slate-200">
        <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Logo */}
        <div className="relative z-10 space-y-3">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Headset className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xl text-slate-900 tracking-tight block leading-none">
                SupportFlow
              </span>
              <span className="text-xs uppercase font-semibold tracking-wider text-indigo-600">
                Customer Success
              </span>
            </div>
          </Link>
          <p className="text-sm font-normal text-slate-500">
            Unified Customer Support Platform for Modern Businesses
          </p>
        </div>

        {/* Center Hero Illustration Image */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center">
          <div className="relative max-w-lg w-full">
            <img
              src="/login_hero.png"
              alt="SupportFlow Dashboard Illustration"
              className="w-full h-auto rounded-3xl shadow-2xl border border-white/60 backdrop-blur-md transform hover:scale-[1.01] transition-transform duration-300"
            />

            {/* Floating Proof Card Badge */}
            <div className="absolute -bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                  4.9★
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    Trusted by 50,000+ Teams{' '}
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  </div>
                  <div className="text-xs font-normal text-slate-500">
                    Real-Time Ticket Management & Live Chat
                  </div>
                </div>
              </div>
              <div className="flex -space-x-2">
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center border-2 border-white">
                  A
                </span>
                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center border-2 border-white">
                  B
                </span>
                <span className="w-7 h-7 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center border-2 border-white">
                  C
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof Footer */}
        <div className="relative z-10 pt-6 flex items-center gap-6 text-xs font-semibold text-slate-500 border-t border-slate-200/60">
          <span className="flex items-center gap-1 text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" /> 99.9% Uptime Guarantee
          </span>
          <span className="flex items-center gap-1 text-slate-700">
            <ShieldCheck className="w-4 h-4 text-indigo-600" /> 256-bit SSL Security
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: Authentication Form */}
      <div className="lg:col-span-6 flex flex-col justify-center items-center px-6 py-12 lg:px-16 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Top Brand Header */}
          <div className="lg:hidden text-center space-y-2 mb-6">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                <Headset className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl text-slate-900 tracking-tight">SupportFlow</span>
            </Link>
          </div>

          {/* Form Header */}
          <div className="space-y-1 text-center lg:text-left">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              {isRegisterMode ? 'Create your account' : 'Welcome back to SupportFlow'}
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              {isRegisterMode
                ? 'Get started with centralized customer support management'
                : 'Sign in to access your support dashboard and ticket management.'}
            </p>
          </div>

          {/* Notifications / Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-indigo-600" />
              <span>{infoMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Social Sign-In Button */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full font-semibold text-slate-700 hover:bg-slate-50 border-slate-200 shadow-sm"
            onClick={handleGoogleSignIn}
            isLoading={isGoogleSubmitting}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Google
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold">Or</span>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {isRegisterMode && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Select Account Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('BUSINESS_ADMIN')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        selectedRole === 'BUSINESS_ADMIN'
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Building className="w-4 h-4" /> Business Owner
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('CUSTOMER')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        selectedRole === 'CUSTOMER'
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <User className="w-4 h-4" /> Customer
                    </button>
                  </div>
                </div>

                <Input
                  label="Full Name"
                  type="text"
                  placeholder="Sarah Jenkins"
                  leftIcon={<User className="w-4 h-4" />}
                  {...register('fullName')}
                />

                {selectedRole === 'BUSINESS_ADMIN' && (
                  <Input
                    label="Company / Business Name"
                    type="text"
                    placeholder="Acme Corporation"
                    leftIcon={<Building className="w-4 h-4" />}
                    {...register('businessName')}
                  />
                )}
              </>
            )}

            <Input
              label="EMAIL ADDRESS"
              type="email"
              placeholder="owner@acme.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="PASSWORD"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            {!isRegisterMode && (
              <div className="flex items-center justify-end pt-0.5">
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl shadow-md transition-all"
              isLoading={isSubmitting}
            >
              <LogIn className="w-4 h-4 mr-1" />
              {isRegisterMode ? 'Create your account' : 'Sign in to account'}
            </Button>
          </form>

          {/* Toggle between Sign In and Create Account */}
          <div className="pt-4 text-center border-t border-slate-100">
            {isRegisterMode ? (
              <p className="text-xs font-medium text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(false);
                    setErrorMessage(null);
                    setInfoMessage(null);
                  }}
                  className="font-semibold text-indigo-600 hover:text-indigo-700 underline transition-colors"
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p className="text-xs font-medium text-slate-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setErrorMessage(null);
                    setInfoMessage(null);
                  }}
                  className="font-semibold text-indigo-600 hover:text-indigo-700 underline transition-colors"
                >
                  Create account
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
