import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import toast from 'react-hot-toast';
import { auth, googleProvider, requestFcmToken } from '../../../shared/config/firebase';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Card } from '../../../shared/components/ui/Card';
import { useAuthStore } from '../../../shared/store/authStore';
import { Role } from '../../../shared/types';
import { Headset, Mail, Lock, LogIn, AlertCircle, Building, User, CheckCircle2, ShieldCheck } from 'lucide-react';
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

  const onSubmit = async (data: AuthFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);
    setSuccessMessage(null);

    try {
      // Check if email was registered via Google Sign-In
      try {
        const methods = await fetchSignInMethodsForEmail(auth, data.email);
        if (methods.includes('google.com') && !methods.includes('password')) {
          const errMsg = 'This email address was registered using Google Sign-In. Please sign in using the "Continue with Google" button!';
          toast.error(errMsg);
          throw new Error(errMsg);
        }
      } catch (checkErr: any) {
        if (checkErr.message?.includes('Google Sign-In')) {
          throw checkErr;
        }
      }

      let firebaseUser: any = null;

      if (isRegisterMode) {
        // 1. REGISTER MODE (Email / Password)
        try {
          const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
          firebaseUser = cred.user;
        } catch (fbErr: any) {
          if (fbErr.code === 'auth/email-already-in-use') {
            const errMsg = 'An account already exists with this email address. Please sign in instead.';
            toast.error(errMsg);
            throw new Error(errMsg);
          }
          console.warn('[Firebase Auth Register Notice]:', fbErr.message);
        }

        const uid = firebaseUser?.uid || `dev_uid_${Date.now()}`;
        const token = firebaseUser ? await firebaseUser.getIdToken() : `dev_token_${Date.now()}`;

        const syncPayload = {
          firebaseUid: uid,
          email: data.email,
          fullName: data.fullName || data.email.split('@')[0],
          role: selectedRole as Role,
          businessName: data.businessName,
          mode: 'register' as const,
          authProvider: 'EMAIL_PASSWORD' as const,
        };

        try {
          const result = await authApi.syncUser(syncPayload);
          const finalToken = result.data.token || token;
          setAuth(result.data.user, finalToken);
          registerFcmDeviceToken(finalToken);
          const succMsg = 'Account registered successfully! Redirecting...';
          setSuccessMessage(succMsg);
          toast.success('Account registered successfully!');
          setTimeout(() => redirectUserByRole(result.data.user.role), 1000);
        } catch (apiErr: any) {
          const errMsg = apiErr.response?.data?.message || 'Registration failed. Please try again.';
          toast.error(errMsg);
          throw new Error(errMsg);
        }
      } else {
        // 2. LOGIN MODE (Email / Password)
        try {
          const cred = await signInWithEmailAndPassword(auth, data.email, data.password);
          firebaseUser = cred.user;
        } catch (fbErr: any) {
          console.warn('[Firebase Auth Login Notice]:', fbErr.message);
          const errMsg = 'Invalid email or password. Please verify your credentials and try again.';
          toast.error(errMsg);
          throw new Error(errMsg);
        }

        const uid = firebaseUser.uid;
        const token = await firebaseUser.getIdToken();

        const syncPayload = {
          firebaseUid: uid,
          email: data.email,
          fullName: data.fullName || data.email.split('@')[0],
          mode: 'login' as const,
          authProvider: 'EMAIL_PASSWORD' as const,
        };

        try {
          const result = await authApi.syncUser(syncPayload);
          const finalToken = result.data.token || token;
          setAuth(result.data.user, finalToken);
          registerFcmDeviceToken(finalToken);
          const succMsg = 'Authentication successful! Redirecting to dashboard...';
          setSuccessMessage(succMsg);
          toast.success('Welcome back! Signed in successfully.');
          setTimeout(() => redirectUserByRole(result.data.user.role), 800);
        } catch (apiErr: any) {
          const msg = apiErr.response?.data?.message || 'No account found with this email. Please register your account first.';
          toast.error(msg);
          throw new Error(msg);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);
    setSuccessMessage(null);

    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const token = await cred.user.getIdToken();
      const userEmail = cred.user.email || '';

      // Check if email was registered via Email & Password
      try {
        const methods = await fetchSignInMethodsForEmail(auth, userEmail);
        if (methods.includes('password') && !methods.includes('google.com') && !isRegisterMode) {
          const errMsg = 'This email address was registered using Email & Password. Please sign in using your email and password!';
          toast.error(errMsg);
          throw new Error(errMsg);
        }
      } catch (checkErr: any) {
        if (checkErr.message?.includes('Email & Password')) {
          throw checkErr;
        }
      }

      if (isRegisterMode) {
        // GOOGLE REGISTER MODE
        const syncPayload = {
          firebaseUid: cred.user.uid,
          email: userEmail,
          fullName: cred.user.displayName || 'Google User',
          role: selectedRole as Role,
          mode: 'register' as const,
          authProvider: 'GOOGLE' as const,
        };

        try {
          const result = await authApi.syncUser(syncPayload);
          const finalToken = result.data.token || token;
          setAuth(result.data.user, finalToken);
          registerFcmDeviceToken(finalToken);
          const succMsg = 'Google Account registered successfully! Redirecting...';
          setSuccessMessage(succMsg);
          toast.success('Registered successfully with Google!');
          setTimeout(() => redirectUserByRole(result.data.user.role), 1000);
        } catch (apiErr: any) {
          const errMsg = apiErr.response?.data?.message || 'Google registration failed. Please try again.';
          toast.error(errMsg);
          throw new Error(errMsg);
        }
      } else {
        // GOOGLE LOGIN MODE
        const syncPayload = {
          firebaseUid: cred.user.uid,
          email: userEmail,
          fullName: cred.user.displayName || 'Google User',
          mode: 'login' as const,
          authProvider: 'GOOGLE' as const,
        };

        try {
          const result = await authApi.syncUser(syncPayload);
          const finalToken = result.data.token || token;
          setAuth(result.data.user, finalToken);
          registerFcmDeviceToken(finalToken);
          const succMsg = 'Signed in with Google! Redirecting...';
          setSuccessMessage(succMsg);
          toast.success('Signed in with Google successfully!');
          setTimeout(() => redirectUserByRole(result.data.user.role), 800);
        } catch (apiErr: any) {
          // Purge orphan user from Firebase Auth console tab immediately!
          try {
            await cred.user.delete().catch(() => auth.signOut());
          } catch (delErr) {
            await auth.signOut().catch(() => null);
          }

          setIsRegisterMode(true);
          const infMsg = `No existing account found for ${userEmail}. Cleaned up session — please select your account type below to register!`;
          setInfoMessage(infMsg);
          toast.error(apiErr.response?.data?.message || 'No account found. Please register your account.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign in canceled or failed.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const redirectUserByRole = (role: string) => {
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
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden text-slate-900">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 border border-indigo-500 text-white shadow-lg shadow-indigo-600/30 mb-2">
            <Headset className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">SupportFlow</h1>
          <p className="text-sm font-medium text-slate-500">
            Centralized support platform for modern businesses
          </p>
        </div>

        <Card glass className="p-8 shadow-xl shadow-slate-200/60 border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
            <button
              onClick={() => {
                setIsRegisterMode(false);
                setErrorMessage(null);
                setInfoMessage(null);
              }}
              className={`text-sm font-bold pb-2 transition-colors ${
                !isRegisterMode ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsRegisterMode(true);
                setErrorMessage(null);
                setInfoMessage(null);
              }}
              className={`text-sm font-bold pb-2 transition-colors ${
                isRegisterMode ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {infoMessage && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{infoMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {isRegisterMode && (
              <>
                <div className="space-y-2 mb-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">I want to register as:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('BUSINESS_ADMIN')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        selectedRole === 'BUSINESS_ADMIN'
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Building className="w-4 h-4" /> Business Owner
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('CUSTOMER')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        selectedRole === 'CUSTOMER'
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm'
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
              label="Email Address"
              type="email"
              placeholder="owner@acme.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            {!isRegisterMode && (
              <div className="flex items-center justify-end pt-1">
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isSubmitting}>
              <LogIn className="w-4 h-4" />
              {isRegisterMode ? 'Register Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full justify-center bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm"
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
              Continue with Google
            </Button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>Encrypted 256-bit SSL Firebase Security</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
