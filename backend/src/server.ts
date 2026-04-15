import { createApp } from './app';
import { env } from './config/environment';
import { logger } from './shared/utils/logger';

const app = createApp();

app.listen(env.port, () => {
  logger.info(`CryoFlix API rodando na porta ${env.port}`);
});

