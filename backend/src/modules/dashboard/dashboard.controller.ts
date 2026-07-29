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
}
