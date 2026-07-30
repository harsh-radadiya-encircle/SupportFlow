import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateTicket, useActiveBusinesses } from '../hooks/useTickets';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Card } from '../../../shared/components/ui/Card';
import { SearchableSelect } from '../../../shared/components/ui/SearchableSelect';
import { Ticket, ArrowLeft, Send, Building, Layers, HelpCircle } from 'lucide-react';

const createTicketSchema = z.object({
  title: z.string().min(3, 'Ticket title must be at least 3 characters'),
  description: z.string().min(10, 'Ticket description must be at least 10 characters'),
  category: z.enum([
    'GENERAL_INQUIRY',
    'TECHNICAL_ISSUE',
    'BILLING',
    'FEATURE_REQUEST',
    'BUG_REPORT',
  ]),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  businessId: z.string().optional(),
});

type CreateTicketFormValues = z.infer<typeof createTicketSchema>;

export const CreateTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreateTicket();
  const { data: businesses = [] } = useActiveBusinesses();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      category: 'GENERAL_INQUIRY',
      priority: 'MEDIUM',
    },
  });

  const onSubmit = (formData: CreateTicketFormValues) => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        setTimeout(() => navigate('/customer/tickets'), 800);
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link
            to="/customer/tickets"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Tickets
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-indigo-600" /> Create Support Ticket
          </h1>
        </div>
      </div>

      <Card glass className="p-8 border border-slate-200 shadow-xl space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Target Business Selection Dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-indigo-600" /> Target Company / Business
            </label>
            <Controller
              name="businessId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  options={[
                    { id: '', name: 'Default Business / System Support' },
                    ...businesses.map((b: any) => ({ id: b.id, name: b.name })),
                  ]}
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Search and select a business..."
                  error={errors.businessId?.message}
                />
              )}
            />
            <p className="text-[11px] text-slate-400">
              Select which company's support team should receive and handle this ticket.
            </p>
          </div>

          <Input
            label="Ticket Subject / Title"
            type="text"
            placeholder="e.g. Unable to access billing dashboard"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Category
              </label>
              <select
                {...register('category')}
                className="w-full px-3 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              >
                <option value="GENERAL_INQUIRY">General Inquiry</option>
                <option value="TECHNICAL_ISSUE">Technical Issue</option>
                <option value="BILLING">Billing & Payments</option>
                <option value="FEATURE_REQUEST">Feature Request</option>
                <option value="BUG_REPORT">Bug Report</option>
              </select>
              {errors.category?.message && (
                <p className="text-xs font-semibold text-rose-600 mt-1">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Priority Level
              </label>
              <select
                {...register('priority')}
                className="w-full px-3 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              >
                <option value="LOW">Low - General Question</option>
                <option value="MEDIUM">Medium - Normal Request</option>
                <option value="HIGH">High - Important Issue</option>
                <option value="URGENT">Urgent - Service Disruption</option>
              </select>
              {errors.priority?.message && (
                <p className="text-xs font-semibold text-rose-600 mt-1">
                  {errors.priority.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Detailed Description
            </label>
            <textarea
              rows={6}
              placeholder="Please provide details about the issue you are experiencing..."
              {...register('description')}
              className="w-full p-3.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white leading-relaxed resize-y"
            />
            {errors.description?.message && (
              <p className="text-xs font-semibold text-rose-600 mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Link to="/customer/tickets">
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold"
              isLoading={createMutation.isPending}
            >
              <Send className="w-4 h-4 mr-1.5" /> Submit Ticket
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
