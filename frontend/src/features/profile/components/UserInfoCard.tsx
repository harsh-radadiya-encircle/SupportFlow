import React from 'react';
import { Mail, ShieldCheck, Building, User as UserIcon } from 'lucide-react';
import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';

interface UserInfoCardProps {
  user: {
    fullName: string;
    email: string;
    role: string;
    business?: {
      name: string;
    } | null;
  } | null;
}

export const UserInfoCard: React.FC<UserInfoCardProps> = ({ user }) => {
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
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
  );
};
