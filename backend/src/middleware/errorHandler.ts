import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

// Centralized error translation: domain errors -> consistent JSON error responses
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({ message: 'Validierungsfehler', details: err.flatten() });
    return;
  }
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error({ err }, 'Unbehandelter Serverfehler');
    }
    res.status(err.statusCode).json({ message: err.message, details: err.details });
    return;
  }
  logger.error({ err, path: req.path }, 'Unerwarteter Fehler');
  res.status(500).json({ message: 'Interner Serverfehler' });
}
