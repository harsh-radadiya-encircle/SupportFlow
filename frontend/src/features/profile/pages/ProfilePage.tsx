import React from 'react';
import { useAuthStore } from '../../../shared/store/authStore';
import { Badge } from '../../../shared/components/ui/Badge';
import { User as UserIcon, Sparkles } from 'lucide-react';
import { UserInfoCard } from '../components/UserInfoCard';
import { PersonalInfoForm } from '../components/PersonalInfoForm';
import { ConnectedAccountsCard } from '../components/ConnectedAccountsCard';

export const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();

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
      <UserInfoCard user={user} />

      {/* Update Personal Information Section */}
      <PersonalInfoForm />

      {/* Connected Accounts & Authentication Section */}
      <ConnectedAccountsCard />
    </div>
  );
};
