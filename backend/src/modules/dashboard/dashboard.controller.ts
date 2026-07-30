import { Response } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import { DashboardService } from './dashboard.service';

const dashboardService = new DashboardService();

export class DashboardController {
  async getBusinessAdminMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;

      if (!user.businessId) {
        res.status(400).json({ success: false, message: 'User is not associated with a business.' });
        return;
      }

      const metrics = await dashboardService.getBusinessAdminMetrics(user.businessId);

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      console.error('[Dashboard Error]:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch dashboard metrics.' });
    }
  }

  async getAgentMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const metrics = await dashboardService.getAgentMetrics(user.id);

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      console.error('[Agent Dashboard Error]:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch agent metrics.' });
    }
  }

  async getPlatformAdminMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const metrics = await dashboardService.getPlatformAdminMetrics();

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      console.error('[Platform Admin Dashboard Error]:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch platform admin metrics.' });
    }
  }

  async toggleBusinessSuspension(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { businessId } = req.params;
      const updated = await dashboardService.toggleBusinessSuspension(businessId);

      res.status(200).json({
        success: true,
        message: `Business ${updated.isSuspended ? 'suspended' : 'activated'} successfully.`,
        data: updated,
      });
    } catch (error: any) {
      console.error('[Toggle Business Suspension Error]:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to toggle business suspension.' });
    }
  }
}
