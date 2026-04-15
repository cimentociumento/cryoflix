import { NextFunction, Request, Response } from 'express';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const safeHandler =
  (handler: AsyncHandler) => (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };

