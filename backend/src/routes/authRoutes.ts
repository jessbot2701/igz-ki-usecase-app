import { Router } from 'express';
import { authService } from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody } from '../middleware/validate';
import { loginSchema } from '../validation/schemas';
import { authenticate } from '../middleware/auth';
import { userRepository } from '../repositories/userRepository';
import { ApiError } from '../utils/ApiError';

export const authRouter = Router();

authRouter.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  })
);

authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await userRepository.findById(req.user!.sub);
    if (!user) {
      throw ApiError.notFound('Benutzer nicht gefunden');
    }
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, department: user.department });
  })
);
