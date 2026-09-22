import { Router } from 'express';
import { Role } from '../domain/enums';
import { userService } from '../services/userService';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createUserSchema, updateUserSchema } from '../validation/schemas';
import { asyncHandler } from '../utils/asyncHandler';

export const userRouter = Router();

userRouter.use(authenticate, requireRole(Role.ADMINISTRATOR));

userRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const users = await userService.list();
    res.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        active: u.active,
        createdAt: u.createdAt
      }))
    );
  })
);

userRouter.post(
  '/',
  validateBody(createUserSchema),
  asyncHandler(async (req, res) => {
    const user = await userService.create(req.body);
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  })
);

userRouter.patch(
  '/:id',
  validateBody(updateUserSchema),
  asyncHandler(async (req, res) => {
    const user = await userService.update(req.params.id, req.body);
    res.json({ id: user.id, name: user.name, role: user.role, active: user.active });
  })
);
