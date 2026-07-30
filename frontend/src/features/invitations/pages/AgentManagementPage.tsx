import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  useInvitations,
  useInviteAgent,
  useToggleAgentActive,
  useDeleteInvitation,
} from '../hooks/useInvitations';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { DataTable, Column } from '../../../shared/components/ui/DataTable';
import { Role } from '../../../shared/types';
import { useAuthStore } from '../../../shared/store/authStore';
import {
  UserPlus,
  Users,
  Mail,
  Copy,
  Check,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Ban,
  UserX,
  UserCheck,
  Trash2,
} from 'lucide-react';

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['SUPPORT_AGENT', 'BUSINESS_ADMIN']).default('SUPPORT_AGENT'),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export const AgentManagementPage: React.FC = () => {
  const { user } = useAuthStore();
  const { data, isLoading, isError, error } = useInvitations();
  const inviteMutation = useInviteAgent();
  const toggleActiveMutation = useToggleAgentActive();
  const deleteInviteMutation = useDeleteInvitation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: 'SUPPORT_AGENT',
    },
  });

  const teamData = data?.data || {
    agents: [],
    invitations: [],
    plan: 'FREE',
    activeAgentCount: 0,
    maxAgents: 1,
    remainingSlots: 0,
  };

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/accept-invite?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    toast.success('Invitation link copied to clipboard!');
    setTimeout(() => setCopiedToken(null), 3000);
  };

  const handleDeleteInvite = (inviteId: string, email: string) => {
    if (window.confirm(`Are you sure you want to revoke the pending invitation for "${email}"?`)) {
      deleteInviteMutation.mutate(inviteId);
    }
  };

  const onSubmit = (formData: InviteFormValues) => {
    inviteMutation.mutate(
      { email: formData.email, role: formData.role as Role },
      {
        onSuccess: (res) => {
          reset();
          setIsModalOpen(false);
          const inviteUrl = res?.data?.inviteUrl;
          if (inviteUrl) {
            navigator.clipboard.writeText(inviteUrl);
            toast.success('Invitation link copied to clipboard!');
          }
        },
      }
    );
  };

  const agentColumns: Column<any>[] = [
    {
      key: 'fullName',
      header: 'User',
      sortable: true,
      render: (agent) => (
        <div className="flex items-center gap-2.5 font-bold text-slate-900">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
            {agent.fullName ? agent.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <span>{agent.fullName}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (agent) => <span className="text-slate-600 font-medium">{agent.email}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (agent) => (
        <Badge variant={agent.role === 'BUSINESS_ADMIN' ? 'purple' : 'info'}>
          {agent.role === 'BUSINESS_ADMIN' ? 'Business Admin' : 'Support Agent'}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (agent) =>
        agent.isActive ? (
          <Badge variant="success" className="text-xs font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Active
          </Badge>
        ) : (
          <Badge variant="danger" className="text-xs font-semibold flex items-center gap-1">
            <Ban className="w-3 h-3" /> Deactivated
          </Badge>
        ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      sortable: true,
      render: (agent) => (
        <span className="text-slate-500 font-normal">
          {new Date(agent.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right whitespace-nowrap',
      render: (agent) => {
        const isSelf = agent.id === user?.id;

        return (
          <Button
            variant={agent.isActive ? 'outline' : 'success'}
            size="sm"
            disabled={isSelf}
            className={
              agent.isActive
                ? 'border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs disabled:opacity-40'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs'
            }
            isLoading={
              toggleActiveMutation.isPending && toggleActiveMutation.variables === agent.id
            }
            onClick={() => toggleActiveMutation.mutate(agent.id)}
          >
            {agent.isActive ? (
              <>
                <UserX className="w-3.5 h-3.5 mr-1" /> Deactivate
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5 mr-1" /> Activate
              </>
            )}
          </Button>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading team members & invitations...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-2">
        <div className="flex items-center gap-2 font-bold text-rose-700">
          <AlertTriangle className="w-5 h-5" />
          <span>Failed to load team data</span>
        </div>
        <p className="text-xs text-rose-600">
          {(error as any)?.response?.data?.message || 'An error occurred.'}
        </p>
      </div>
    );
  }

  const quotaPercent = Math.min(
    100,
    Math.round((teamData.activeAgentCount / teamData.maxAgents) * 100)
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Support Team & Invites
            </h1>
            <Badge variant="purple" className="text-xs">
              {teamData.plan} Plan
            </Badge>
          </div>
          <p className="text-sm text-slate-500 font-normal">
            Manage your active support agents, toggle agent access, and invite new team members
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          disabled={teamData.remainingSlots <= 0}
          className="shrink-0 bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md"
        >
          <UserPlus className="w-4 h-4 mr-2" /> Invite Support Agent
        </Button>
      </div>

      {/* Plan Quota Usage Meter */}
      <Card glass className="p-5 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-600" /> Support Agent Quota Usage
          </span>
          <span className="text-xs font-bold text-slate-700">
            {teamData.activeAgentCount} / {teamData.maxAgents} Active ({teamData.remainingSlots}{' '}
            slots remaining)
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className={`h-full transition-all duration-500 ${
              quotaPercent >= 100
                ? 'bg-rose-500'
                : quotaPercent >= 80
                  ? 'bg-amber-500'
                  : 'bg-indigo-600'
            }`}
            style={{ width: `${quotaPercent}%` }}
          />
        </div>
        {teamData.remainingSlots <= 0 && (
          <p className="text-xs font-semibold text-rose-600 mt-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Plan limit reached. Upgrade your subscription plan
            to invite additional agents.
          </p>
        )}
      </Card>

      {/* Active Team Members Section using Shared DataTable */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-600" /> Business Team Members
        </h2>

        <DataTable
          title="Agents"
          totalCount={teamData.agents.length}
          data={teamData.agents}
          columns={agentColumns}
          isLoading={isLoading}
          searchPlaceholder="Search team members by name or email..."
          emptyMessage="No team members found."
        />
      </div>

      {/* Pending Invitations Section */}
      <div className="space-y-3 pt-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Mail className="w-4 h-4 text-indigo-600" /> Pending Invitations (
          {teamData.invitations.length})
        </h2>

        {teamData.invitations.length === 0 ? (
          <Card glass className="p-8 text-center space-y-2 border border-slate-200">
            <Mail className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No pending invitations</p>
            <p className="text-xs text-slate-400">
              Click "Invite Support Agent" above to send your first team invitation link.
            </p>
          </Card>
        ) : (
          <Card glass className="overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Recipient Email</th>
                    <th className="p-3.5">Assigned Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Expires</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {teamData.invitations.map((invite: any) => {
                    const isExpired = new Date(invite.expiresAt) < new Date();
                    return (
                      <tr key={invite.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{invite.email}</td>
                        <td className="p-3.5">
                          <Badge variant="info">Support Agent</Badge>
                        </td>
                        <td className="p-3.5">
                          {isExpired ? (
                            <Badge variant="danger" icon={<Clock className="w-3 h-3" />}>
                              Expired
                            </Badge>
                          ) : (
                            <Badge variant="warning" icon={<Clock className="w-3 h-3" />}>
                              Pending
                            </Badge>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-400">
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!isExpired && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyLink(invite.token)}
                                className="text-xs font-semibold"
                              >
                                {copiedToken === invite.token ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" /> Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy Link
                                  </>
                                )}
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                              isLoading={
                                deleteInviteMutation.isPending &&
                                deleteInviteMutation.variables === invite.id
                              }
                              onClick={() => handleDeleteInvite(invite.id, invite.email)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Revoke
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Invite Agent Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-lg">
                <UserPlus className="w-5 h-5 text-indigo-600" /> Invite Support Agent
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Agent Email Address"
                type="email"
                placeholder="agent@company.com"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={inviteMutation.isPending}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold"
                >
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
