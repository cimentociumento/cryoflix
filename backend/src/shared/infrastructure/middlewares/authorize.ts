import { Request, Response, NextFunction } from 'express';

type Role = 'USER' | 'ADMIN';

export const authorize =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }
    if (!roles.includes(req.user.role as Role)) {
      res.status(403).json({
        error: 'Acesso negado. Permissão insuficiente.',
        required: roles,
        current: req.user.role,
      });
      return;
    }
    next();
  };
