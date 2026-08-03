import React, { useState } from 'react';
import { linkWithPopup } from 'firebase/auth';
import toast from 'react-hot-toast';
import { auth, googleProvider } from '../../../shared/config/firebase';
import { authApi } from '../../auth/api/auth.api';
import { useAuthStore } from '../../../shared/store/authStore';
import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { Link2, Key, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

export const ConnectedAccountsCard: React.FC = () => {
  const { user, setAuth } = useAuthStore();
  const [isLinkingGoogle, setIsLinkingGoogle] = useState<boolean>(false);

  const isPasswordConnected =
    user?.authProvider === 'EMAIL_PASSWORD' || user?.authProvider === 'MULTI_PROVIDER';
  const isGoogleConnected =
    user?.authProvider === 'GOOGLE' || user?.authProvider === 'MULTI_PROVIDER';

  const handleLinkGoogle = async () => {
    setIsLinkingGoogle(true);

    try {
      // Open Google link popup
      const result = await linkWithPopup(auth.currentUser!, googleProvider);
      const googleEmail = result.user.email;

      // Security check: the Google account email must match the logged-in user email
      if (googleEmail?.toLowerCase() !== user?.email?.toLowerCase()) {
        toast.error(
          `Google account mismatch. Please sign in with your account email (${user?.email}) to link it.`
        );
        return;
      }

      const idToken = await result.user.getIdToken(true);
      // Update local storage so that linkProvider carries the fresh linked token
      localStorage.setItem('supportflow_token', idToken);

      // Link the MULTI_PROVIDER upgrade with PostgreSQL backend
      const linkResponse = await authApi.linkProvider();

      const linkData = linkResponse?.data || linkResponse;
      if (linkData?.user) {
        setAuth(linkData.user, idToken);
      }

      toast.success('Google account successfully connected to your profile!');
    } catch (err: any) {
      console.error('[Link Google Error]:', err);

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
  );
};
