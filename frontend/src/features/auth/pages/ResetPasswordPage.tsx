import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthLayout } from '../components/AuthLayout';
import { AuthAlert } from '../components/AuthAlert';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Lock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { authApi } from '../api/auth.api';

const resetSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetFormValues = z.infer<typeof resetSchema>;

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('token') || searchParams.get('oobCode');

  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({ resolver: zodResolver(resetSchema) });

  const onSubmit = async (data: ResetFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      if (!oobCode) throw new Error('Invalid or missing password reset token.');
      await authApi.resetPassword(oobCode, data.password);
      setIsSuccess(true);
      toast.success('Password updated! Redirecting to sign in...');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to reset password. The link may have expired.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      {isSuccess ? (
        /* ── Success ─────────────────────────────────────────────────────── */
        <div className="space-y-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Password Updated!</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Your password has been successfully updated. Redirecting to sign in…
              </p>
            </div>
          </div>
          <Link to="/login">
            <Button variant="primary" size="lg" className="w-full bg-slate-900 hover:bg-slate-800 text-white">
              Go to Sign In
            </Button>
          </Link>
        </div>
      ) : (
        /* ── Form ────────────────────────────────────────────────────────── */
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              Create new password
            </h2>
            <p className="text-xs text-slate-500">
              Choose a strong password with at least 6 characters.
            </p>
          </div>

          {!oobCode && (
            <AuthAlert
              variant="warning"
              message={
                <>
                  This reset link appears invalid or expired.{' '}
                  <Link to="/forgot-password" className="font-bold underline">
                    Request a new one
                  </Link>
                  .
                </>
              }
            />
          )}

          {errorMessage && <AuthAlert variant="error" message={errorMessage} />}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl shadow-md"
              isLoading={isSubmitting}
              disabled={!oobCode}
            >
              Update Password
            </Button>
          </form>

          <div className="text-center">
            <Link
              to="/login"
              className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};
