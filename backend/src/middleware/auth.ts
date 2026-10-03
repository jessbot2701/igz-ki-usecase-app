import { NextFunction, Request, Response } from 'express';
import { Role } from '../domain/enums';
import { ApiError } from '../utils/ApiError';
import { authService, AuthTokenPayload } from '../services/authService';
import { userRepository } from '../repositories/userRepository';
import { asyncHandler } from '../utils/asyncHandler';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized();
  }
  const token = header.slice('Bearer '.length);
  try {
    const payload = authService.verifyToken(token);
    const user = await userRepository.findById(payload.sub);
    if (
      !user?.active ||
      user.role !== payload.role ||
      (payload.scope === 'employee' && user.role !== Role.EMPLOYEE)
    ) {
      throw ApiError.unauthorized();
    }
    req.user = payload;
  } catch {
    throw ApiError.unauthorized('Sitzung abgelaufen oder ungültig');
  }
  next();
});

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw ApiError.forbidden();
    }
    next();
  };
}
