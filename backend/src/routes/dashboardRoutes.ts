import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { dashboardService } from '../services/dashboardService';
import { Role } from '../domain/enums';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

dashboardRouter.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    res.json(await dashboardService.stats());
  })
);

// Extended portfolio analytics reserved for the AI Core Team / Administrator monitoring view
dashboardRouter.get(
  '/portfolio',
  requireRole(Role.AI_CORE_TEAM, Role.ADMINISTRATOR),
  asyncHandler(async (_req, res) => {
    res.json(await dashboardService.portfolioStats());
  })
);

