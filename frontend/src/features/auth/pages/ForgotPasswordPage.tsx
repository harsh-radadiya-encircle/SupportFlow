import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthLayout } from '../components/AuthLayout';
import { AuthAlert } from '../components/AuthAlert';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Mail, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../../shared/config/firebase';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
type ForgotFormValues = z.infer<typeof forgotSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotFormValues>({ resolver: zodResolver(forgotSchema) });

  const onSubmit = async (data: ForgotFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setGoogleNotice(null);

    try {
      await sendPasswordResetEmail(auth, data.email);
      setIsSubmitted(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      const msg = err.message || 'Failed to send reset email. Please try again.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      {isSubmitted ? (
        /* ── Success ─────────────────────────────────────────────────────── */
        <div className="space-y-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Check your inbox</h2>
              <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                We've sent a reset link to{' '}
                <span className="font-semibold text-slate-700">{getValues('email')}</span>. Click
                the link to set a new password.
              </p>
            </div>
          </div>
          <AuthAlert
            variant="warning"
            message="Didn't receive it? Check your spam folder or wait a few minutes before trying again."
          />
          <Link to="/login">
            <Button variant="outline" size="lg" className="w-full mt-2">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
            </Button>
          </Link>
        </div>
      ) : (
        /* ── Form ────────────────────────────────────────────────────────── */
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              Forgot password?
            </h2>
            <p className="text-xs text-slate-500">
              No worries — enter your email and we'll send you a reset link.
            </p>
          </div>

          {googleNotice && (
            <div className="space-y-2">
              <AuthAlert variant="info" message={<><strong>Google Account Detected</strong><br />{googleNotice}</>} />
              <Link to="/login">
                <Button variant="primary" size="sm" className="w-full">
                  Sign In with Google
                </Button>
              </Link>
            </div>
          )}

          {errorMessage && <AuthAlert variant="error" message={errorMessage} />}

          {!googleNotice && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="owner@acme.com"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl shadow-md"
                isLoading={isSubmitting}
              >
                Send Password Reset Email
              </Button>
            </form>
          )}

          <div className="text-center pt-1">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};
