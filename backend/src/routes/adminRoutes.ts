import { Router } from 'express';
import { Role } from '../domain/enums';
import { authenticate, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { dashboardService } from '../services/dashboardService';

// System-wide monitoring surface for Administrators ("komfortables Monitoring und Verwaltung")
export const adminRouter = Router();

adminRouter.use(authenticate, requireRole(Role.ADMINISTRATOR, Role.AI_CORE_TEAM));

adminRouter.get(
  '/activity',
  asyncHandler(async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 25;
    res.json(await dashboardService.recentActivity(limit));
  })
);
