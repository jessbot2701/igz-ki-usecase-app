import { Router } from 'express';
import { prisma } from '../config/prisma';
import { Role } from '../domain/enums';
import { authenticate, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

export const championRouter = Router();
championRouter.get(
  '/',
  authenticate,
  requireRole(Role.AI_CHAMPION, Role.AI_CORE_TEAM, Role.ADMINISTRATOR),
  asyncHandler(async (_req, res) => {
    res.json(
      await prisma.user.findMany({
        where: { role: Role.AI_CHAMPION, active: true },
        select: { id: true, name: true, department: true, email: true },
        orderBy: [{ name: 'asc' }, { id: 'asc' }]
      })
    );
  })
);
