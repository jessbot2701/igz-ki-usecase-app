import { Router } from 'express';
import { authService } from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody } from '../middleware/validate';
import { loginSchema, emailLinkRequestSchema, emailLinkVerifySchema } from '../validation/schemas';
import { emailAccessService } from '../services/emailAccessService';
import { authenticate } from '../middleware/auth';
import { userRepository } from '../repositories/userRepository';
import { ApiError } from '../utils/ApiError';
import { DEMO_EMPLOYEE_EMAIL, isDemoMode } from '../config/env';

export const authRouter = Router();

authRouter.get('/access-config', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ demoMode: isDemoMode(), ...(isDemoMode() ? { demoEmail: DEMO_EMPLOYEE_EMAIL } : {}) });
});

authRouter.post(
  '/email-link',
  validateBody(emailLinkRequestSchema),
  asyncHandler(async (req, res) => {
    const result = await emailAccessService.request(req.body, req.ip ?? 'unknown');
    res.setHeader('Cache-Control', 'no-store');
    res.status(202).json({
      message: isDemoMode()
        ? 'Demo-Modus: Der Bestätigungslink wird hier angezeigt. Falls noch keine Demo-Idee vorhanden ist, melden Sie zuerst eine Idee.'
        : 'Wenn Ihre Adresse für den Mitarbeiterzugang zugelassen ist, erhalten Sie einen Link per E-Mail. Verwaltungskonten verwenden weiterhin den Passwortzugang.',
      ...(result ?? {})
    });
  })
);

authRouter.post(
  '/email-link/verify',
  validateBody(emailLinkVerifySchema),
  asyncHandler(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json(await emailAccessService.verify(req.body.token));
  })
);

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
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    });
  })
);
