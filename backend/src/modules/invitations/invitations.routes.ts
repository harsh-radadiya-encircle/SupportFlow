import { Router } from 'express';
import { InvitationsController } from './invitations.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { inviteAgentSchema, acceptInvitationSchema } from './invitations.schema';

const router = Router();

// Protected Business Admin Endpoints
router.post(
  '/',
  authenticate,
  authorize(['BUSINESS_ADMIN']),
  validate(inviteAgentSchema),
  InvitationsController.inviteAgent
);

router.get(
  '/',
  authenticate,
  authorize(['BUSINESS_ADMIN']),
  InvitationsController.getTeamAndInvitations
);

router.patch(
  '/agents/:agentId/toggle-active',
  authenticate,
  authorize(['BUSINESS_ADMIN']),
  InvitationsController.toggleAgentActiveStatus
);

router.delete(
  '/:id',
  authenticate,
  authorize(['BUSINESS_ADMIN']),
  InvitationsController.deleteInvitation
);

// Public Invitation Endpoints for Invited Agents
router.get('/verify/:token', InvitationsController.verifyToken);
router.post('/accept', validate(acceptInvitationSchema), InvitationsController.acceptInvitation);

export default router;
