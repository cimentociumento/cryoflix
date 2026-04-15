import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

export const validateRequest =
  (schema: ZodSchema, target: ValidationTarget = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[target];
      const validated = schema.parse(data);
      req[target] = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((e: ZodIssue) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({
          message: 'Erro de validação',
          errors,
        });
        return;
      }
      next(error);
    }
  };

