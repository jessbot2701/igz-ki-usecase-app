import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL', 'file:./dev.db'),
  jwtSecret: required('JWT_SECRET', 'dev-insecure-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
  aiProvider: (process.env.AI_PROVIDER ?? 'mock') as 'mock' | 'azure-openai',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  publicAppUrl: process.env.PUBLIC_APP_URL ?? 'http://localhost:5173',
  emailAllowedDomains: (process.env.EMAIL_ALLOWED_DOMAINS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  mailTransport: process.env.MAIL_TRANSPORT ?? 'smtp',
  demoMode: process.env.DEMO_MODE === 'true',
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  mailFrom: process.env.MAIL_FROM,
  trustProxy: process.env.TRUST_PROXY ?? ''
};

export const DEMO_EMPLOYEE_EMAIL = 'demo.mitarbeiter@igz.com';

export function isDemoMode(): boolean {
  return env.demoMode && env.nodeEnv !== 'production' && env.mailTransport === 'file';
}
