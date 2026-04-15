import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../../../config/environment';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ message: 'Token não fornecido' });
    return;
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    (req as Request & { user?: Record<string, unknown> }).user = decoded as Record<
      string,
      unknown
    >;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
};

