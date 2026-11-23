import app from './app';
import { env } from './config/environment';
import { logger } from './shared/utils/logger';

app.listen(env.port, () => {
  logger.info(`CryoFlix API rodando na porta ${env.port}`);
});

