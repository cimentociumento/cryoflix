import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../../../config/environment';
import { container } from '../../../../shared/container';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ message: 'Token não fornecido' });
      return;
    }

    const [, token] = authHeader.split(' ');

    const decoded = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;
    const userId = decoded.sub as string;

    const user = await container.userRepository.findById(userId);
    if (!user || user.deletedAt) {
      res.status(401).json({ message: 'Sessão inválida' });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ message: 'Conta inativa' });
      return;
    }

    req.user = {
      id: user.id,
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    next();
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
};
