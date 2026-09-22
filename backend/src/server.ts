import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const app = createApp();

app.listen(env.port, () => {
  logger.info(`IGZ Use Case API läuft auf Port ${env.port} (AI provider: ${env.aiProvider})`);
});
