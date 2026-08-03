import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { User as UserIcon } from 'lucide-react';
import { Card } from '../../../shared/components/ui/Card';
import { Input } from '../../../shared/components/ui/Input';
import { Button } from '../../../shared/components/ui/Button';
import { usersApi } from '../../users/api/users.api';
import { useAuthStore } from '../../../shared/store/authStore';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phoneNumber: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val))
    .refine(
      (val) => !val || /^\+?[0-9\s\-()]{10,15}$/.test(val),
      'Phone number must be a valid format (10 to 15 digits)'
    ),
  businessName: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export const PersonalInfoForm: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const isBusinessAdmin = user?.role === 'BUSINESS_ADMIN';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      phoneNumber: user?.phoneNumber || '',
      businessName: user?.business?.name || '',
    },
  });

  const onUpdateProfile = async (data: ProfileFormValues) => {
    setIsUpdatingProfile(true);
    try {
      const response = await usersApi.updateProfile({
        fullName: data.fullName,
        phoneNumber: data.phoneNumber || undefined,
        businessName: isBusinessAdmin ? data.businessName : undefined,
      });

      const updatedUser = response?.data || response;
      if (updatedUser) {
        setUser(updatedUser);
      }

      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-indigo-600" /> Personal & Business Information
        </h2>
        <p className="text-xs text-slate-500 font-normal mt-1">
          Update your profile and business details. Changes will be reflected immediately.
        </p>
      </div>

      <form onSubmit={handleSubmit(onUpdateProfile)} className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <Input
            {...register('fullName')}
            placeholder="e.g. John Doe"
            error={errors.fullName?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
          <Input
            {...register('phoneNumber')}
            placeholder="e.g. +1 234 567 8900"
            error={errors.phoneNumber?.message}
          />
        </div>

        {isBusinessAdmin && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Company / Business Name <span className="text-rose-500">*</span>
            </label>
            <Input
              {...register('businessName')}
              placeholder="e.g. Acme Corp"
              error={errors.businessName?.message}
            />
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={isUpdatingProfile}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-md"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
};
