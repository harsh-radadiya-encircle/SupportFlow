import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { invitationsApi, InviteAgentPayload, AcceptInvitePayload } from '../api/invitations.api';
import { useAuthStore } from '../../../shared/store/authStore';

export const useInvitations = (enabled: boolean = true) => {
  const { user, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['invitations'],
    queryFn: invitationsApi.getTeamAndInvitations,
    enabled: enabled && isAuthenticated && Boolean(user),
    staleTime: 2 * 60 * 1000,
    retry: 1,
    refetchInterval: (q) => (q.state.status === 'error' ? false : 30000),
  });
};

export const useInviteAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InviteAgentPayload) => invitationsApi.inviteAgent(payload),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      const inviteUrl = res?.data?.inviteUrl;
      const emailSent = res?.data?.emailSent;
      const emailMessage = res?.data?.emailMessage;

      if (inviteUrl) {
        navigator.clipboard.writeText(inviteUrl);
      }

      if (emailSent === false) {
        toast.success(
          emailMessage || 'Invitation created! Email could not be sent via SMTP, so invitation link was copied to clipboard.',
          { duration: 6000 }
        );
      } else {
        toast.success('Agent invitation created & link copied to clipboard!');
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to send invitation.';
      toast.error(msg);
    },
  });
};

export const useToggleAgentActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentId: string) => invitationsApi.toggleAgentActiveStatus(agentId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success(res.message || 'Agent status updated successfully.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to update agent status.';
      toast.error(msg);
    },
  });
};

export const useDeleteInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => invitationsApi.deleteInvitation(invitationId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success(res.message || 'Invitation revoked successfully.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to revoke invitation.';
      toast.error(msg);
    },
  });
};

export const useVerifyInvitationToken = (token: string) => {
  return useQuery({
    queryKey: ['invitationToken', token],
    queryFn: () => invitationsApi.verifyInvitationToken(token),
    enabled: Boolean(token),
    retry: false,
  });
};

export const useAcceptInvitation = () => {
  return useMutation({
    mutationFn: (payload: AcceptInvitePayload) => invitationsApi.acceptInvitation(payload),
    onSuccess: () => {
      toast.success('Account created! Welcome to the team.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to accept invitation.';
      toast.error(msg);
    },
  });
};
