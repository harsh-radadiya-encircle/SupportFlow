import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../shared/components/ui/Card';
import { Input } from '../../../shared/components/ui/Input';
import { Button } from '../../../shared/components/ui/Button';
import { Send, ArrowLeft, Paperclip } from 'lucide-react';
import { ticketsApi } from '../api/tickets.api';

const ticketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(15, 'Description must be at least 15 characters'),
  category: z.enum(['GENERAL_INQUIRY', 'TECHNICAL_ISSUE', 'BILLING', 'FEATURE_REQUEST', 'BUG_REPORT']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

export const CreateTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      category: 'TECHNICAL_ISSUE',
      priority: 'MEDIUM',
    },
  });

  const onSubmit = async (data: TicketFormValues) => {
    setIsSubmitting(true);
    try {
      await ticketsApi.createTicket(data).catch(() => null);
      navigate('/customer/tickets');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to tickets
      </button>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Support Ticket</h1>
        <p className="text-sm font-medium text-slate-500">Describe your issue in detail and our agent team will respond immediately.</p>
      </div>

      <Card glass>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Ticket Title"
            placeholder="e.g., Unable to synchronize WhatsApp contacts"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Category
              </label>
              <select
                className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-600"
                {...register('category')}
              >
                <option value="GENERAL_INQUIRY">General Inquiry</option>
                <option value="TECHNICAL_ISSUE">Technical Issue</option>
                <option value="BILLING">Billing & Subscription</option>
                <option value="FEATURE_REQUEST">Feature Request</option>
                <option value="BUG_REPORT">Bug Report</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Priority
              </label>
              <select
                className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-600"
                {...register('priority')}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Detailed Description
            </label>
            <textarea
              rows={5}
              placeholder="Provide exact error messages, steps to reproduce, or relevant background details..."
              className="w-full bg-white text-slate-900 placeholder-slate-400 border border-slate-200 rounded-xl p-3.5 text-sm font-medium focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-sm"
              {...register('description')}
            />
            {errors.description && (
              <span className="text-xs font-medium text-rose-600">{errors.description.message}</span>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-indigo-600" /> Upload Screenshots / Attachments
            </span>
            <Button type="button" variant="outline" size="sm">
              Choose File
            </Button>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isSubmitting}>
            <Send className="w-4 h-4" /> Submit Support Request
          </Button>
        </form>
      </Card>
    </div>
  );
};
