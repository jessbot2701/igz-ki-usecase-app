import express, { Express } from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { env } from './config/env';
import { authRouter } from './routes/authRoutes';
import { userRouter } from './routes/userRoutes';
import { useCaseRouter } from './routes/useCaseRoutes';
import { dashboardRouter } from './routes/dashboardRoutes';
import { adminRouter } from './routes/adminRoutes';
import { attachmentRouter } from './routes/attachmentRoutes';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  app.get('/api/v1/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/use-cases', useCaseRouter);
  app.use('/api/v1/dashboard', dashboardRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/attachments', attachmentRouter);

  app.use((req, res) => {
    res.status(404).json({ message: `Route nicht gefunden: ${req.method} ${req.path}` });
  });

  app.use(errorHandler);

  return app;
}
