import React from 'react';
import { Link } from 'react-router-dom';
import { Headset, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Shared two-column auth layout.
 * Left  = brand showcase with login_hero.png image (matches original design).
 * Right = white form slot.
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => (
  <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-white text-slate-900 font-sans">

    {/* ── LEFT: Brand Showcase ──────────────────────────────────────────── */}
    <div className="hidden lg:flex lg:col-span-6 bg-gradient-to-br from-slate-100 via-indigo-50/50 to-white relative p-12 flex-col justify-between overflow-hidden border-r border-slate-200">
      {/* Background glows */}
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

      {/* Hero Illustration */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center">
        <div className="relative max-w-lg w-full">
          <img
            src="/login_hero.png"
            alt="SupportFlow Dashboard"
            className="w-full h-auto rounded-3xl shadow-2xl border border-white/60 backdrop-blur-md hover:scale-[1.01] transition-transform duration-300"
          />

          {/* Floating Trust Badge */}
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
                  Real-Time Ticket Management &amp; Live Chat
                </div>
              </div>
            </div>
            <div className="flex -space-x-2">
              {[
                { label: 'A', bg: 'bg-indigo-600' },
                { label: 'B', bg: 'bg-emerald-600' },
                { label: 'C', bg: 'bg-purple-600' },
              ].map(({ label, bg }) => (
                <span
                  key={label}
                  className={`w-7 h-7 rounded-full ${bg} text-white text-xs font-bold flex items-center justify-center border-2 border-white`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Social Proof */}
      <div className="relative z-10 pt-6 flex items-center gap-6 text-xs font-semibold text-slate-500 border-t border-slate-200/60">
        <span className="flex items-center gap-1 text-slate-700">
          <CheckCircle2 className="w-4 h-4 text-indigo-600" /> 99.9% Uptime Guarantee
        </span>
        <span className="flex items-center gap-1 text-slate-700">
          <ShieldCheck className="w-4 h-4 text-indigo-600" /> 256-bit SSL Security
        </span>
      </div>
    </div>

    {/* ── RIGHT: Form Slot ──────────────────────────────────────────────── */}
    <div className="lg:col-span-6 flex flex-col justify-center items-center px-6 py-12 lg:px-16 overflow-y-auto bg-white">
      {/* Mobile brand header */}
      <div className="lg:hidden mb-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
            <Headset className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">SupportFlow</span>
        </Link>
      </div>

      <div className="w-full max-w-md">{children}</div>
    </div>
  </div>
);
