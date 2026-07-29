import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../shared/store/authStore';
import { Button } from '../../../shared/components/ui/Button';
import { Badge } from '../../../shared/components/ui/Badge';
import { Card } from '../../../shared/components/ui/Card';
import {
  Headset,
  MessageSquare,
  Users,
  ShieldCheck,
  Zap,
  Bell,
  Ticket,
  ChevronRight,
  CheckCircle2,
  Building2,
  UserCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'admin' | 'agent' | 'customer' | 'platform'>('admin');

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'PLATFORM_ADMIN':
        return '/admin/dashboard';
      case 'BUSINESS_ADMIN':
        return '/business/dashboard';
      case 'SUPPORT_AGENT':
        return '/agent/dashboard';
      case 'CUSTOMER':
      default:
        return '/customer/tickets';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col">
      {/* Fixed Glass Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
              <Headset className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight block leading-none">SupportFlow</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-600">Customer Success</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#workflows" className="hover:text-slate-900 transition-colors">Role Workflows</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button
                variant="primary"
                onClick={() => navigate(getDashboardPath())}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-md"
              >
                Go to Console <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="font-semibold text-slate-700 hover:text-slate-900">
                    Sign In
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="primary" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-md">
                    Get Started Free <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-6 max-w-7xl mx-auto text-center space-y-8 flex-1">
        <div className="space-y-4 max-w-3xl mx-auto">
          <Badge variant="purple" className="px-3.5 py-1 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Centralized Customer Success Platform
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.15]">
            One Platform for All Your Customer Conversations
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            Replace disconnected WhatsApp chats, emails, and phone calls. Assign tickets to support agents, track response times in real time, and monitor team performance.
          </p>
        </div>

        {/* Hero Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link to="/login">
            <Button variant="primary" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-base px-8 py-3 rounded-xl shadow-lg">
              Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <a href="#workflows">
            <Button variant="outline" className="font-semibold text-base px-6 py-3 rounded-xl border-slate-300 text-slate-700 hover:bg-white shadow-sm">
              See How It Works
            </Button>
          </a>
        </div>

        {/* Dashboard Preview Visual */}
        <div className="pt-8 max-w-5xl mx-auto">
          <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xl space-y-6 text-left">
            {/* Top Mock Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold text-slate-400 ml-2">supportflow.app / console</span>
              </div>
              <Badge variant="success" className="text-[11px] font-bold">
                ● Live Real-Time Socket
              </Badge>
            </div>

            {/* Mock Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Tickets</span>
                <p className="text-2xl font-bold text-slate-900">128</p>
                <span className="text-xs text-emerald-600 font-medium">↗ +12% this week</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Open Queue</span>
                <p className="text-2xl font-bold text-slate-900">14</p>
                <span className="text-xs text-amber-600 font-medium">Requires attention</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Resolved</span>
                <p className="text-2xl font-bold text-slate-900">114</p>
                <span className="text-xs text-emerald-600 font-medium">89% resolution rate</span>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Avg Response</span>
                <p className="text-2xl font-bold text-slate-900">18 mins</p>
                <span className="text-xs text-purple-600 font-medium">Target: &lt; 30 mins</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Workflows Showcase Section */}
      <section id="workflows" className="py-20 bg-white border-t border-b border-slate-200/80 px-6">
        <div className="max-w-7xl mx-auto space-y-12 text-center">
          <div className="max-w-2xl mx-auto space-y-3">
            <Badge variant="info" className="uppercase text-xs font-semibold">
              Tailored Experiences
            </Badge>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Designed for Every Role in Your Organization
            </h2>
            <p className="text-sm text-slate-500 font-normal">
              Whether you manage a team, handle tickets, or request support, SupportFlow provides role-scoped tools.
            </p>
          </div>

          {/* Interactive Role Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-white text-slate-900 shadow-md font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 text-indigo-600" /> Business Admin
            </button>

            <button
              onClick={() => setActiveTab('agent')}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'agent'
                  ? 'bg-white text-slate-900 shadow-md font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-600" /> Support Agent
            </button>

            <button
              onClick={() => setActiveTab('customer')}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'customer'
                  ? 'bg-white text-slate-900 shadow-md font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-amber-600" /> Customer
            </button>

            <button
              onClick={() => setActiveTab('platform')}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'platform'
                  ? 'bg-white text-slate-900 shadow-md font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" /> Platform Admin
            </button>
          </div>

          {/* Role Content Panels */}
          <div className="max-w-4xl mx-auto">
            {activeTab === 'admin' && (
              <Card glass className="p-8 text-left space-y-6 border border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Business Admin Control Center</h3>
                    <p className="text-xs text-slate-500">Central management of business operations & team productivity</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700 font-medium">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <h4 className="font-bold text-slate-900">Invite & Manage Support Agents</h4>
                    <p className="text-slate-500">Send single-use email invitation links to add agents up to your subscription seat limit.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <h4 className="font-bold text-slate-900">Ticket Assignment & Monitoring</h4>
                    <p className="text-slate-500">View all customer support requests and assign them to specific agents based on workload.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <h4 className="font-bold text-slate-900">Stripe Subscription Upgrades</h4>
                    <p className="text-slate-500">Manage plan quotas, upgrade to Standard ($29/mo) or Business ($79/mo), and access Stripe invoices.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <h4 className="font-bold text-slate-900">Performance Metrics</h4>
                    <p className="text-slate-500">Track total ticket volume, open queue items, resolution rates, and average first response times.</p>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'agent' && (
              <Card glass className="p-8 text-left space-y-6 border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Support Agent Workspace</h3>
                    <p className="text-xs text-slate-500">Isolated queue and real-time live chat tools</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700 font-medium">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <h4 className="font-bold text-slate-900">Strict Agent Access Isolation</h4>
                    <p className="text-slate-500">Agents strictly view tickets assigned to them by Business Admins for focused productivity.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <h4 className="font-bold text-slate-900">Real-Time Live Socket Chat</h4>
                    <p className="text-slate-500">Communicate with customers in real time with live message delivery and typing indicators.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <h4 className="font-bold text-slate-900">Private Internal Notes</h4>
                    <p className="text-slate-500">Add confidential notes on tickets that are strictly hidden from customers.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <h4 className="font-bold text-slate-900">Instant Push Notifications</h4>
                    <p className="text-slate-500">Receive FCM browser push alerts immediately when a new ticket is assigned to you.</p>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'customer' && (
              <Card glass className="p-8 text-left space-y-6 border border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Customer Support Portal</h3>
                    <p className="text-xs text-slate-500">Simple ticket submission & real-time messaging</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700 font-medium">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <h4 className="font-bold text-slate-900">Create Support Tickets</h4>
                    <p className="text-slate-500">Submit requests with category, priority, description, and target business organization selection.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <h4 className="font-bold text-slate-900">Track Ticket Status</h4>
                    <p className="text-slate-500">Monitor status changes from Open to In Progress, Resolved, or Closed in real time.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <h4 className="font-bold text-slate-900">Interactive Chat & Messages</h4>
                    <p className="text-slate-500">Send replies directly to assigned support agents with real-time updates.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <h4 className="font-bold text-slate-900">Notification History</h4>
                    <p className="text-slate-500">View persistent in-app notifications whenever an agent responds or resolves your ticket.</p>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'platform' && (
              <Card glass className="p-8 text-left space-y-6 border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Platform Admin Super Console</h3>
                    <p className="text-xs text-slate-500">System-wide governance & tenant management</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700 font-medium">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <h4 className="font-bold text-slate-900">Multi-Tenant Business Governance</h4>
                    <p className="text-slate-500">View and manage all registered businesses across the platform.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <h4 className="font-bold text-slate-900">Subscription & Revenue Monitoring</h4>
                    <p className="text-slate-500">Track active subscriptions across Free, Standard, and Business tiers.</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto text-center space-y-12">
        <div className="max-w-2xl mx-auto space-y-3">
          <Badge variant="purple" className="uppercase text-xs font-semibold">
            Simple Pricing
          </Badge>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Transparent Subscription Plans for Every Scale
          </h2>
          <p className="text-sm text-slate-500 font-normal">
            Start for free and upgrade as your support team expands
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Free Plan */}
          <Card glass className="p-6 space-y-6 border border-slate-200/80 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Free Starter</h3>
                <p className="text-xs text-slate-500">For small businesses starting out</p>
              </div>
              <p className="text-3xl font-bold text-slate-900">$0 <span className="text-xs font-semibold text-slate-500">/ month</span></p>
              <ul className="space-y-2.5 text-xs text-slate-600 font-normal pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> 1 Support Agent seat</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Up to 25 Tickets / month</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Real-Time Socket Live Chat</li>
              </ul>
            </div>
            <Link to="/login">
              <Button variant="outline" className="w-full font-semibold text-xs">Get Started Free</Button>
            </Link>
          </Card>

          {/* Standard Plan */}
          <Card glass className="p-6 space-y-6 border border-indigo-600 shadow-xl ring-2 ring-indigo-600/20 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Standard Plan</h3>
                  <p className="text-xs text-slate-500">For growing support operations</p>
                </div>
                <Badge variant="info" className="text-[10px] font-bold">POPULAR</Badge>
              </div>
              <p className="text-3xl font-bold text-slate-900">$29 <span className="text-xs font-semibold text-slate-500">/ month</span></p>
              <ul className="space-y-2.5 text-xs text-slate-600 font-normal pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Up to 5 Support Agent seats</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Unlimited Monthly Tickets</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Private Agent Internal Notes</li>
              </ul>
            </div>
            <Link to="/login">
              <Button variant="primary" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md">Upgrade to Standard</Button>
            </Link>
          </Card>

          {/* Business Plan */}
          <Card glass className="p-6 space-y-6 border border-purple-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Business Plan</h3>
                <p className="text-xs text-slate-500">For established enterprises</p>
              </div>
              <p className="text-3xl font-bold text-slate-900">$79 <span className="text-xs font-semibold text-slate-500">/ month</span></p>
              <ul className="space-y-2.5 text-xs text-slate-600 font-normal pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Up to 20 Support Agent seats</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Unlimited Monthly Tickets</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Priority 24/7 Dedicated Support</li>
              </ul>
            </div>
            <Link to="/login">
              <Button variant="primary" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md">Upgrade to Business</Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-12 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Headset className="w-4 h-4" />
            </div>
            <span className="font-bold text-white text-sm">SupportFlow</span>
          </div>
          <p>© {new Date().getFullYear()} SupportFlow. Centralized Customer Support Platform for Small Businesses.</p>
        </div>
      </footer>
    </div>
  );
};
