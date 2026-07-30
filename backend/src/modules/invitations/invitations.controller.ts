import { Request, Response, NextFunction } from 'express';
import { InvitationsService } from './invitations.service';
import { sendResponse } from '../../common/responses/apiResponse';
import { AuthenticatedRequest } from '../../common/types';

export class InvitationsController {
  static async inviteAgent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await InvitationsService.inviteAgent(req.body, req.user!);
      sendResponse({
        res,
        statusCode: 201,
        message: 'Agent invitation created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTeamAndInvitations(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await InvitationsService.getBusinessTeamAndInvitations(req.user!.businessId!);
      sendResponse({
        res,
        statusCode: 200,
        message: 'Team and invitations fetched successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleAgentActiveStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { agentId } = req.params;
      const updated = await InvitationsService.toggleAgentActiveStatus(agentId, req.user!);

      sendResponse({
        res,
        statusCode: 200,
        message: `Agent account '${updated.fullName}' has been ${updated.isActive ? 'activated' : 'deactivated'} successfully.`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteInvitation(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await InvitationsService.deleteInvitation(id, req.user!);

      sendResponse({
        res,
        statusCode: 200,
        message: `Invitation for '${deleted.email}' has been revoked successfully.`,
        data: deleted,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.params.token as string;
      const result = await InvitationsService.verifyInvitationToken(token);
      sendResponse({
        res,
        statusCode: 200,
        message: 'Invitation token verified successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async acceptInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await InvitationsService.acceptInvitation(req.body);
      sendResponse({
        res,
        statusCode: 201,
        message: 'Invitation accepted successfully. Account created.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
