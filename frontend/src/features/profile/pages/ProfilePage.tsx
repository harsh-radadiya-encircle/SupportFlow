import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import toast from 'react-hot-toast';
import { auth, googleProvider } from '../../../shared/config/firebase';
import { useAuthStore } from '../../../shared/store/authStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../../auth/api/auth.api';
import { usersApi } from '../../users/api/users.api';
import { Button } from '../../../shared/components/ui/Button';
import { Badge } from '../../../shared/components/ui/Badge';
import { Card } from '../../../shared/components/ui/Card';
import { Input } from '../../../shared/components/ui/Input';
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  Building,
  Key,
  Link2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phoneNumber: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val))
    .refine(
      (val) => !val || /^\+?[0-9\s\-()]{10,15}$/.test(val),
      'Phone number must be a valid format (10 to 15 digits)'
    ),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export const ProfilePage: React.FC = () => {
  const { user, setAuth, updateUserProfile } = useAuthStore();
  const [isLinkingGoogle, setIsLinkingGoogle] = useState<boolean>(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      phoneNumber: user?.phoneNumber || '',
    },
  });

  const onUpdateProfile = async (data: ProfileFormValues) => {
    setIsUpdatingProfile(true);
    try {
      const response = await usersApi.updateProfile({
        fullName: data.fullName,
        phoneNumber: data.phoneNumber || undefined,
      });
      updateUserProfile({ fullName: data.fullName, phoneNumber: data.phoneNumber });
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Use PostgreSQL DB (via Zustand store) as single source of truth for provider status.
  // Firebase client-side auth.currentUser is null when using backend JWT sessions.
  const isPasswordConnected =
    user?.authProvider === 'EMAIL_PASSWORD' || user?.authProvider === 'MULTI_PROVIDER';
  const isGoogleConnected =
    user?.authProvider === 'GOOGLE' || user?.authProvider === 'MULTI_PROVIDER';

  /**
   * Connect Google Account via signInWithPopup.
   * Does NOT use linkWithPopup / auth.currentUser — those require a live Firebase session
   * which we don't have since we store backend JWTs, not Firebase ID tokens.
   *
   * Flow:
   * 1. Open Google popup to get the user's Google credentials.
   * 2. Verify the Google email matches the currently logged-in user email.
   * 3. Call backend syncUser with MULTI_PROVIDER to update PostgreSQL.
   * 4. Sign out the transient Google Firebase session (we use backend JWTs).
   */
  const handleLinkGoogle = async () => {
    setIsLinkingGoogle(true);

    try {
      // Open Google sign-in popup
      const result = await signInWithPopup(auth, googleProvider);
      const googleEmail = result.user.email;

      // Security check: the Google account email must match the logged-in user email
      if (googleEmail?.toLowerCase() !== user?.email?.toLowerCase()) {
        await auth.signOut().catch(() => null);
        toast.error(
          `Google account mismatch. Please sign in with your account email (${user?.email}) to link it.`
        );
        return;
      }

      // Sync the MULTI_PROVIDER upgrade with PostgreSQL backend
      const syncResponse = await authApi.syncUser({
        firebaseUid: result.user.uid,
        email: googleEmail || user?.email || '',
        fullName: user?.fullName || result.user.displayName || 'User',
        role: user?.role,
        mode: 'login',
        authProvider: 'MULTI_PROVIDER',
      });

      const syncData = syncResponse?.data || syncResponse;
      if (syncData?.user && syncData?.token) {
        // Update Zustand store with the new session token & updated user record
        localStorage.setItem('supportflow_token', syncData.token);
        setAuth(syncData.user, syncData.token);
      }

      // Sign out the transient Google Firebase session — we use backend JWTs exclusively
      await auth.signOut().catch(() => null);

      toast.success('Google account successfully connected to your profile!');
    } catch (err: any) {
      console.error('[Link Google Error]:', err);

      // Always clean up transient Firebase session on error
      await auth.signOut().catch(() => null);

      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        toast('Google connection cancelled.', { icon: 'ℹ️' });
      } else if (code === 'auth/account-exists-with-different-credential') {
        toast.error(
          'This Google account is already associated with a different SupportFlow user.'
        );
      } else {
        const serverMsg = err?.response?.data?.message;
        toast.error(serverMsg || err?.message || 'Failed to connect Google account. Please try again.');
      }
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserIcon className="w-6 h-6 text-indigo-600" /> My Profile & Security
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-1">
            Manage your personal profile details and connected authentication providers
          </p>
        </div>

        <Badge variant="purple" className="self-start md:self-auto text-xs py-1 px-3">
          <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500 fill-amber-500 inline" /> SupportFlow
          Account
        </Badge>
      </div>

      {/* User Info Overview Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-20 h-20 rounded-full bg-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg ring-4 ring-indigo-50 shrink-0">
            {getInitials(user?.fullName)}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <h2 className="text-xl font-bold text-slate-900">{user?.fullName || 'User Profile'}</h2>
            <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> {user?.email}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              <Badge variant="info" className="text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 inline" /> {user?.role || 'CUSTOMER'}
              </Badge>

              {user?.business && (
                <Badge variant="purple" className="text-xs font-semibold">
                  <Building className="w-3.5 h-3.5 mr-1 inline" /> {user.business.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Update Personal Information Section */}
      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-indigo-600" /> Personal Information
          </h2>
          <p className="text-xs text-slate-500 font-normal mt-1">
            Update your profile details. Changes will be reflected immediately.
          </p>
        </div>

        <form onSubmit={handleSubmit(onUpdateProfile)} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <Input
              {...register('fullName')}
              placeholder="e.g. John Doe"
              error={errors.fullName?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
            <Input
              {...register('phoneNumber')}
              placeholder="e.g. +1 234 567 8900"
              error={errors.phoneNumber?.message}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isUpdatingProfile}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-md"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Connected Accounts & Authentication Section */}
      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-indigo-600" /> Connected Accounts & Sign-In Methods
          </h2>
          <p className="text-xs text-slate-500 font-normal mt-1">
            Link multiple sign-in methods to access your SupportFlow account using Password or
            Google seamlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email & Password Provider Card */}
          <div className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 flex flex-col justify-between space-y-4 shadow-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Email & Password</h3>
                    <p className="text-xs text-slate-500 font-normal">Standard login credential</p>
                  </div>
                </div>

                {isPasswordConnected ? (
                  <Badge variant="success" className="text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" /> Connected
                  </Badge>
                ) : (
                  <Badge variant="warning" className="text-xs font-bold">
                    Not Set
                  </Badge>
                )}
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span className="font-semibold text-slate-500">Email:</span>
                  <span className="font-medium text-slate-900 truncate max-w-[180px]">
                    {user?.email}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-semibold text-slate-500">Provider ID:</span>
                  <span className="font-mono text-[11px] text-slate-700">password</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-medium text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Standard Email
                Authentication Active
              </span>
            </div>
          </div>

          {/* Google Account Provider Card */}
          <div className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 flex flex-col justify-between space-y-4 shadow-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Google Account</h3>
                    <p className="text-xs text-slate-500 font-normal">Social single sign-on</p>
                  </div>
                </div>

                {isGoogleConnected ? (
                  <Badge variant="success" className="text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" /> Connected
                  </Badge>
                ) : (
                  <Badge variant="info" className="text-xs font-bold">
                    Not Connected
                  </Badge>
                )}
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span className="font-semibold text-slate-500">Status:</span>
                  <span className="font-medium text-slate-900">
                    {isGoogleConnected ? 'Linked to Firebase Auth' : 'Unlinked'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-semibold text-slate-500">Provider ID:</span>
                  <span className="font-mono text-[11px] text-slate-700">google.com</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              {isGoogleConnected ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-800 font-semibold">
                    Google account is linked. You can sign in with Google or Email & Password.
                  </p>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleLinkGoogle}
                  isLoading={isLinkingGoogle}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                >
                  <Link2 className="w-3.5 h-3.5 mr-1" /> Connect Google Account
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Informative Guidance Banner */}
        <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold">Why link your Google Account?</h4>
            <p className="text-slate-600 font-normal leading-relaxed">
              Linking Google to your SupportFlow profile allows you to sign in with either your
              password or 1-click Google Sign-In. Firebase will explicitly link both providers under
              your single user identity.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
