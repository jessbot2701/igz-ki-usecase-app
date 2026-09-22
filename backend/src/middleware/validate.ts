import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';

// Parses & replaces req.body with the validated/typed result, or throws a ZodError (400)
export function validateBody(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.body = schema.parse(req.body);
    next();
  };
}

export function validateQuery(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.query = schema.parse(req.query) as unknown as typeof req.query;
    next();
  };
}
