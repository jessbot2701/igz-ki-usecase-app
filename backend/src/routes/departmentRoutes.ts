import { Router } from 'express';
import { Role } from '../domain/enums';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { departmentService } from '../services/departmentService';
import { createDepartmentSchema, updateDepartmentSchema } from '../validation/schemas';

export const departmentRouter = Router();

departmentRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const includeInactive = req.user?.role === Role.ADMINISTRATOR && req.query.includeInactive === 'true';
    res.json(await departmentService.list(includeInactive));
  })
);

departmentRouter.post(
  '/',
  authenticate,
  requireRole(Role.ADMINISTRATOR),
  validateBody(createDepartmentSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await departmentService.create(req.body));
  })
);

departmentRouter.patch(
  '/:id',
  authenticate,
  requireRole(Role.ADMINISTRATOR),
  validateBody(updateDepartmentSchema),
  asyncHandler(async (req, res) => {
    res.json(await departmentService.update(req.params.id, req.body));
  })
);

departmentRouter.delete(
  '/:id',
  authenticate,
  requireRole(Role.ADMINISTRATOR),
  asyncHandler(async (req, res) => {
    await departmentService.remove(req.params.id);
    res.status(204).send();
  })
);