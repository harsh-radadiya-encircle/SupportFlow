import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Card } from '../../../shared/components/ui/Card';
import { Headset, Mail, ArrowLeft, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { authApi } from '../api/auth.api';

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
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setGoogleNotice(null);

    try {
      // Dispatch password reset via Backend Brevo Email API
      await authApi.forgotPassword(data.email);

      setIsSubmitted(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to send password reset email. Please try again.';

      if (msg.includes('Google Sign-In') || msg.includes('Google')) {
        setGoogleNotice(msg);
        toast.error('Google Account detected. Sign in directly with Google!');
      } else if (err.response?.status === 404 || msg.includes('No registered user account found') || msg.includes('not found')) {
        const notFoundMsg = 'No registered user account found with this email address.';
        setErrorMessage(notFoundMsg);
        toast.error(notFoundMsg);
      } else {
        setErrorMessage(msg);
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden text-slate-900">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 border border-indigo-500 text-white shadow-lg shadow-indigo-600/30 mb-2">
            <Headset className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">SupportFlow</h1>
          <p className="text-sm font-medium text-slate-500">Reset your account password</p>
        </div>

        <Card glass className="p-8 shadow-xl border border-slate-200">
          {isSubmitted ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Check your inbox</h2>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                We have sent an official password reset link to your email address. Please check your inbox and click the link to create your new password.
              </p>

              <Link to="/login">
                <Button variant="outline" className="w-full mt-4">
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">Forgot Password?</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Enter your registered email address below to reset your password.
                </p>
              </div>

              {googleNotice && (
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-700">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Google Account Detected</span>
                  </div>
                  <p className="text-indigo-800 font-medium leading-relaxed">{googleNotice}</p>
                  <Link to="/login" className="inline-block mt-1">
                    <Button variant="primary" size="sm" className="w-full mt-1">
                      <ArrowLeft className="w-3.5 h-3.5" /> Sign In with Google
                    </Button>
                  </Link>
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {!googleNotice && (
                <>
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="owner@acme.com"
                    leftIcon={<Mail className="w-4 h-4" />}
                    error={errors.email?.message}
                    {...register('email')}
                  />

                  <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isSubmitting}>
                    Send Password Reset Email
                  </Button>
                </>
              )}

              <div className="text-center pt-2">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
