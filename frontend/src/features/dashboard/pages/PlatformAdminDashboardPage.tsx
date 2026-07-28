import React from 'react';
import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { Building2, CreditCard, DollarSign, ShieldAlert, UserX } from 'lucide-react';

export const PlatformAdminDashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Platform SuperAdmin</h1>
        <p className="text-sm font-medium text-slate-500">
          Global metrics across all registered businesses, active subscriptions, and revenue.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card glass className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Businesses</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">48</p>
          </div>
        </Card>

        <Card glass className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Subscriptions</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">42</p>
          </div>
        </Card>

        <Card glass className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-sm">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Est. Monthly Revenue</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">$3,840</p>
          </div>
        </Card>

        <Card glass className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Suspended</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">2</p>
          </div>
        </Card>
      </div>

      <Card glass>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Registered Businesses</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="p-3">Business Name</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Status</th>
                <th className="p-3">Joined Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { name: 'Acme Corporation', plan: 'BUSINESS', status: 'ACTIVE', date: '2026-01-10' },
                { name: 'Apex Logistics', plan: 'STANDARD', status: 'ACTIVE', date: '2026-02-04' },
                { name: 'Nexus Commerce', plan: 'FREE', status: 'ACTIVE', date: '2026-03-12' },
              ].map((b, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{b.name}</td>
                  <td className="p-3">
                    <Badge variant="purple">{b.plan}</Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant="success">{b.status}</Badge>
                  </td>
                  <td className="p-3 text-slate-500">{b.date}</td>
                  <td className="p-3 text-right">
                    <Button variant="outline" size="sm">
                      <UserX className="w-3.5 h-3.5" /> Suspend
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
