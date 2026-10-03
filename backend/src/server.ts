import { createApp } from './app';
import { env, isDemoMode } from './config/env';
import { logger } from './utils/logger';
import { startNotificationDelivery } from './services/notificationService';

if (env.demoMode && (env.nodeEnv === 'production' || env.mailTransport !== 'file')) {
  throw new Error('DEMO_MODE benötigt eine lokale Testumgebung und MAIL_TRANSPORT=file.');
}
const app = createApp();
startNotificationDelivery();

app.listen(env.port, isDemoMode() ? '127.0.0.1' : '0.0.0.0', () => {
  logger.info(`IGZ Use Case API läuft auf Port ${env.port} (AI provider: ${env.aiProvider})`);
});
