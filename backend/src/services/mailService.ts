import nodemailer from 'nodemailer';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

export function appUrl(pathname: string): string {
  const base = new URL(env.publicAppUrl);
  if (
    !['http:', 'https:'].includes(base.protocol) ||
    base.username ||
    base.password ||
    (env.nodeEnv === 'production' && base.protocol !== 'https:')
  ) {
    throw new ApiError(503, 'Der E-Mail-Zugang ist noch nicht eingerichtet.');
  }
  return new URL(pathname, base.origin).toString();
}

class MailService {
  assertConfigured(): void {
    appUrl('/');
    if (env.mailTransport === 'file' && env.nodeEnv !== 'production') return;
    if (env.mailTransport !== 'smtp' || !env.smtpHost || !env.mailFrom) {
      throw new ApiError(
        503,
        'Der E-Mail-Versand ist noch nicht eingerichtet. Bitte wenden Sie sich an das AI-Team.'
      );
    }
  }

  async send(to: string, subject: string, text: string): Promise<void> {
    this.assertConfigured();
    if (env.mailTransport === 'file' && env.nodeEnv !== 'production') {
      const directory = path.resolve('.local-mail');
      await mkdir(directory, { recursive: true });
      await writeFile(
        path.join(directory, `${Date.now()}-${randomUUID()}.json`),
        JSON.stringify({ to, subject, text }, null, 2),
        { mode: 0o600 }
      );
      return;
    }
    const transport = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      requireTLS: true,
      auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPassword } : undefined,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });
    try {
      const result = await transport.sendMail({ from: env.mailFrom, to, subject, text });
      if (!result.accepted.length) throw new Error('Recipient rejected');
    } catch {
      // SMTP errors can contain credentials or addresses; do not log the underlying error.
      throw new ApiError(
        503,
        'Die E-Mail konnte nicht versendet werden. Bitte versuchen Sie es später erneut.'
      );
    } finally {
      transport.close();
    }
  }
}

export const mailService = new MailService();
