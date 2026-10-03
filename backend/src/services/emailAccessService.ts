import { createHash, createHmac, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { DEMO_EMPLOYEE_EMAIL, env, isDemoMode } from '../config/env';
import { Role, UseCaseStatus } from '../domain/enums';
import { emailLinkRequestSchema, ideaInputSchema } from '../validation/schemas';
import { ApiError } from '../utils/ApiError';
import { authService } from './authService';
import { appUrl, mailService } from './mailService';
import { queueUseCaseNotification } from './notificationService';
import { findUserByEmail } from '../repositories/userRepository';

const LINK_LIFETIME_MS = 15 * 60 * 1000;
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
type LinkRequest = z.infer<typeof emailLinkRequestSchema>;

function assertDomainAllowed(email: string): void {
  if (env.nodeEnv === 'production' && !env.emailAllowedDomains.length) {
    throw new ApiError(503, 'Der Mitarbeiterzugang ist noch nicht eingerichtet.');
  }
  if (env.emailAllowedDomains.length && !env.emailAllowedDomains.includes(email.split('@')[1])) {
    throw ApiError.badRequest('Bitte verwenden Sie eine zugelassene Firmen-E-Mail-Adresse.');
  }
}

export class EmailAccessService {
  async request(input: LinkRequest, ip: string): Promise<{ demoLink: string } | undefined> {
    const demo = isDemoMode();
    if (demo && input.email !== DEMO_EMPLOYEE_EMAIL) {
      throw ApiError.badRequest(`Für die Demo verwenden Sie bitte ${DEMO_EMPLOYEE_EMAIL}.`);
    }
    assertDomainAllowed(input.email);
    mailService.assertConfigured();
    const now = new Date();
    const since = new Date(now.getTime() - LINK_LIFETIME_MS);
    const requestIpHash = createHmac('sha256', env.jwtSecret).update(ip).digest('hex');
    const token = randomBytes(32).toString('hex');
    const record = await prisma.$transaction(async (tx) => {
      await tx.emailLoginToken.deleteMany({ where: { expiresAt: { lt: now } } });
      const emailCount = await tx.emailLoginToken.count({
        where: { email: input.email, createdAt: { gte: since } }
      });
      const ipCount = await tx.emailLoginToken.count({
        where: { requestIpHash, createdAt: { gte: since } }
      });
      if (emailCount >= (demo ? 30 : 3) || ipCount >= (demo ? 100 : 20)) {
        throw new ApiError(429, 'Zu viele Anfragen. Bitte versuchen Sie es in 15 Minuten erneut.');
      }
      const existing = await findUserByEmail(tx, input.email);
      // Never turn a public email link into a privileged management login.
      const eligible = existing
        ? existing.active && existing.role === Role.EMPLOYEE
        : Boolean(input.idea);
      if (eligible) {
        // Resending the same request must not create a second copy of the idea.
        await tx.emailLoginToken.updateMany({
          where: {
            email: input.email,
            usedAt: null,
            ideaJson: input.idea ? JSON.stringify(input.idea) : null
          },
          data: { usedAt: now, ideaJson: null }
        });
      }
      return tx.emailLoginToken.create({
        data: {
          tokenHash: `${demo ? 'demo:' : ''}${hashToken(token)}`,
          email: input.email,
          name: input.name,
          ideaJson: eligible && input.idea ? JSON.stringify(input.idea) : null,
          targetId: input.targetId,
          requestIpHash,
          expiresAt: new Date(now.getTime() + LINK_LIFETIME_MS),
          usedAt: eligible ? null : now
        }
      });
    });
    if (record.usedAt) return;
    const url = `${appUrl('/zugang/bestaetigen')}#token=${token}`;
    if (demo) return { demoLink: url };
    try {
      await mailService.send(
        input.email,
        input.idea ? 'IGZ – KI-Idee bestätigen' : 'IGZ – Ihr Zugang zu Meine Ideen',
        `${input.idea ? 'Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihre KI-Idee einzureichen.' : 'Mit diesem Link können Sie Ihre eigenen Ideen und Rückfragen öffnen.'}\n\n${url}\n\nDer Link ist 15 Minuten gültig und kann einmal verwendet werden. Bestätigen Sie den Zugang auf der geöffneten Seite.\n\nWenn Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.`
      );
    } catch (error) {
      await prisma.emailLoginToken.update({
        where: { id: record.id },
        data: { usedAt: new Date(), ideaJson: null }
      });
      throw error;
    }
  }

  async verify(token: string) {
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const record = await tx.emailLoginToken.findUnique({
        where: { tokenHash: `${isDemoMode() ? 'demo:' : ''}${hashToken(token)}` }
      });
      if (!record || record.usedAt || record.expiresAt <= now) {
        throw ApiError.badRequest(
          'Dieser Link ist abgelaufen oder wurde bereits verwendet. Bitte fordern Sie einen neuen Link an.'
        );
      }
      assertDomainAllowed(record.email);
      const claimed = await tx.emailLoginToken.updateMany({
        where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now, ideaJson: null }
      });
      if (claimed.count !== 1) throw ApiError.badRequest('Dieser Link wurde bereits verwendet.');
      let user = await findUserByEmail(tx, record.email);
      if (user && (!user.active || user.role !== Role.EMPLOYEE)) {
        throw ApiError.forbidden(
          'Bitte verwenden Sie den Verwaltungszugang oder wenden Sie sich an das AI-Team.'
        );
      }
      if (!user) {
        if (!record.ideaJson || !record.name)
          throw ApiError.badRequest('Bitte melden Sie zunächst eine Idee.');
        user = await tx.user.create({
          data: {
            email: record.email,
            name: record.name,
            role: Role.EMPLOYEE,
            // No usable password: email-only accounts cannot use the password login.
            passwordHash: 'EMAIL_LINK_ONLY'
          }
        });
      }
      let useCaseId: string | undefined;
      if (record.ideaJson) {
        const idea = ideaInputSchema.parse(JSON.parse(record.ideaJson));
        const created = await tx.useCase.create({
          data: {
            ...idea,
            requestor: record.name ?? user.name,
            status: UseCaseStatus.SUBMITTED,
            createdById: user.id,
            lastModifiedById: user.id,
            statusHistory: {
              create: {
                fromStatus: null,
                toStatus: UseCaseStatus.SUBMITTED,
                changedById: user.id,
                note: isDemoMode()
                  ? 'Idee im Demo-Modus bestätigt und eingereicht.'
                  : 'Idee per E-Mail bestätigt und eingereicht.'
              }
            }
          }
        });
        useCaseId = created.id;
        await queueUseCaseNotification(tx, created.id, user.id, 'SUBMITTED');
      } else if (record.targetId) {
        const target = await tx.useCase.findFirst({
          where: { id: record.targetId, createdById: user.id }
        });
        useCaseId = target?.id;
      }
      return { user, useCaseId, submitted: Boolean(record.ideaJson) };
    });
    const { user } = result;
    return {
      token: authService.signToken(user, 'employee'),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      },
      useCaseId: result.useCaseId,
      submitted: result.submitted
    };
  }
}

export const emailAccessService = new EmailAccessService();
