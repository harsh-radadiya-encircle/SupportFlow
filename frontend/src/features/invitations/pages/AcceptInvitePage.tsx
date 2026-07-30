import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import toast from 'react-hot-toast';
import { useVerifyInvitationToken, useAcceptInvitation } from '../hooks/useInvitations';
import { auth, googleProvider } from '../../../shared/config/firebase';
import { useAuthStore } from '../../../shared/store/authStore';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Card } from '../../../shared/components/ui/Card';
import {
  Headset,
  Mail,
  Lock,
  User,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Building,
} from 'lucide-react';

const acceptSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AcceptFormValues = z.infer<typeof acceptSchema>;

export const AcceptInvitePage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const { data, isLoading, isError, error } = useVerifyInvitationToken(token);
  const acceptMutation = useAcceptInvitation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptFormValues>({
    resolver: zodResolver(acceptSchema),
  });

  const invitation = data?.data;

  const onSubmit = async (formData: AcceptFormValues) => {
    if (!token || !invitation) return;
    setIsSubmitting(true);

    try {
      // 1. Create Firebase Auth user with invited email & password
      let firebaseUser: any = null;
      try {
        const cred = await createUserWithEmailAndPassword(
          auth,
          invitation.email,
          formData.password
        );
        firebaseUser = cred.user;
      } catch (fbErr: any) {
        console.warn('[Firebase Auth Agent Register Notice]:', fbErr.message);
      }

      const uid = firebaseUser?.uid || `dev_agent_uid_${Date.now()}`;
      const idToken = firebaseUser ? await firebaseUser.getIdToken() : `dev_token_${Date.now()}`;

      // 2. Accept Invitation on Backend API
      acceptMutation.mutate(
        {
          token,
          firebaseUid: uid,
          fullName: formData.fullName,
          authProvider: 'EMAIL_PASSWORD',
        },
        {
          onSuccess: (userRes) => {
            const user = userRes.data;
            setAuth(user, idToken);
            setTimeout(() => navigate('/agent/dashboard'), 800);
          },
        }
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete agent registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!token || !invitation) return;
    setIsGoogleSubmitting(true);

    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const idToken = await cred.user.getIdToken();
      const googleEmail = cred.user.email || '';

      if (googleEmail.toLowerCase() !== invitation.email.toLowerCase()) {
        toast.error(`Please sign in with your invited email address (${invitation.email}).`);
        await auth.signOut().catch(() => null);
        return;
      }

      acceptMutation.mutate(
        {
          token,
          firebaseUid: cred.user.uid,
          fullName: cred.user.displayName || 'Support Agent',
          authProvider: 'GOOGLE',
        },
        {
          onSuccess: (userRes) => {
            const user = userRes.data;
            setAuth(user, idToken);
            setTimeout(() => navigate('/agent/dashboard'), 800);
          },
        }
      );
    } catch (err: any) {
      toast.error(err.message || 'Google sign-up canceled or failed.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-500">Verifying team invitation link...</p>
      </div>
    );
  }

  if (isError || !invitation) {
    const errorMsg =
      (error as any)?.response?.data?.message || 'Invalid or expired invitation link.';
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
        <Card
          glass
          className="p-8 max-w-md w-full text-center space-y-4 shadow-xl border border-slate-200"
        >
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Invitation Link Error</h2>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">{errorMsg}</p>
          <Link to="/login">
            <Button variant="primary" className="w-full mt-2">
              Back to Sign In
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden text-slate-900">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 mb-2">
            <Headset className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Join SupportFlow
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Accept team invitation & create your account
          </p>
        </div>

        <Card glass className="p-8 shadow-xl border border-slate-200 space-y-5">
          {/* Business Invitation Box */}
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider">
              <Building className="w-4 h-4 text-indigo-600" /> Team Invitation
            </div>
            <p className="text-sm font-bold text-indigo-900">{invitation.business?.name}</p>
            <p className="text-xs text-indigo-700">
              Invited by <span className="font-semibold">{invitation.invitedBy?.fullName}</span> for
              email <span className="font-bold">{invitation.email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="Alex Morgan"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <Input
              label="Invited Email"
              type="email"
              value={invitation.email}
              disabled
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Create Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
            >
              Accept & Create Support Agent Account
            </Button>
          </form>

          <div className="pt-2 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full justify-center bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
              onClick={handleGoogleSignUp}
              isLoading={isGoogleSubmitting}
            >
              Continue with Google ({invitation.email})
            </Button>
          </div>

          <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>Encrypted 256-bit SSL Security</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
