import { apiClient } from '../../../shared/api/apiClient';
import { Role } from '../../../shared/types';

export interface InviteAgentPayload {
  email: string;
  role?: Role;
}

export interface AcceptInvitePayload {
  token: string;
  firebaseUid: string;
  fullName: string;
  authProvider?: 'EMAIL_PASSWORD' | 'GOOGLE';
}

export interface TeamAgentItem {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  authProvider: string;
  isActive: boolean;
  createdAt: string;
}

export const invitationsApi = {
  inviteAgent: async (payload: InviteAgentPayload) => {
    const response = await apiClient.post('/invitations', payload);
    return response.data;
  },

  getTeamAndInvitations: async () => {
    const response = await apiClient.get('/invitations');
    return response.data;
  },

  toggleAgentActiveStatus: async (agentId: string) => {
    const response = await apiClient.patch(`/invitations/agents/${agentId}/toggle-active`);
    return response.data;
  },

  deleteInvitation: async (invitationId: string) => {
    const response = await apiClient.delete(`/invitations/${invitationId}`);
    return response.data;
  },

  verifyInvitationToken: async (token: string) => {
    const response = await apiClient.get(`/invitations/verify/${token}`);
    return response.data;
  },

  acceptInvitation: async (payload: AcceptInvitePayload) => {
    const response = await apiClient.post('/invitations/accept', payload);
    return response.data;
  },
};
