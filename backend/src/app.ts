import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { StatusCodes } from 'http-status-codes';
import { ZodError, ZodIssue } from 'zod';
import { apiRouter } from './routes';
import { logger } from './shared/utils/logger';
import { StatusCodes as Http } from 'http-status-codes';
import { ValidationError } from './shared/domain/errors/ValidationError';
import { NotFoundError } from './shared/domain/errors/NotFoundError';
import { UnauthorizedError } from './shared/domain/errors/UnauthorizedError';
import { ConflictError } from './shared/domain/errors/ConflictError';
import { HttpClientError } from './shared/infrastructure/http/HttpClientError';

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(helmet());
  app.use(express.json({ limit: '10mb' }));

  app.get('/health', (_req, res) => {
    res.status(StatusCodes.OK).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api', apiRouter);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error(err);

    // Erros de validação do Zod
    if (err instanceof ZodError) {
      const errors = err.issues.map((e: ZodIssue) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      res.status(Http.BAD_REQUEST).json({
        message: 'Erro de validação',
        errors,
      });
      return;
    }

    // Erros de domínio
    if (err instanceof ValidationError) {
      res.status(Http.BAD_REQUEST).json({ message: err.message });
      return;
    }

    if (err instanceof NotFoundError) {
      res.status(Http.NOT_FOUND).json({ message: err.message });
      return;
    }

    if (err instanceof UnauthorizedError) {
      res.status(Http.UNAUTHORIZED).json({ message: err.message });
      return;
    }

    if (err instanceof ConflictError) {
      res.status(Http.CONFLICT).json({ message: err.message });
      return;
    }

    // Erros de HTTP client
    if (err instanceof HttpClientError) {
      const status = err.status ?? Http.BAD_GATEWAY;
      const responseBody: Record<string, unknown> = {
        message: err.message,
      };
      if (err.cause && typeof err.cause === 'object') {
        responseBody.cause = err.cause;
      }
      res.status(status).json(responseBody);
      return;
    }

    // Erro genérico - não expor detalhes em produção
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(Http.INTERNAL_SERVER_ERROR).json({
      message: isDevelopment ? err.message : 'Erro interno do servidor',
      ...(isDevelopment && { stack: err.stack }),
    });
  });

  return app;
};

