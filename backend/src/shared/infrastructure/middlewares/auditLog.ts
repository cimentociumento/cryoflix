import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/prismaClient';

export const logAudit =
  (action: string) => (req: Request, res: Response, next: NextFunction): void => {
    if (!process.env.DATABASE_URL?.trim()) {
      next();
      return;
    }
    res.on('finish', () => {
      if (res.statusCode >= 400) {
        return;
      }
      const metadata =
        req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0
          ? { body: req.body }
          : undefined;

      void prisma.auditLog
        .create({
          data: {
            userId: req.user?.id ?? null,
            action,
            entity: 'admin',
            entityId: (req.params as { id?: string }).id,
            metadata: metadata as object | undefined,
            ipAddress: req.ip,
            userAgent: req.get('user-agent') ?? undefined,
          },
        })
        .catch(() => undefined);
    });
    next();
  };
