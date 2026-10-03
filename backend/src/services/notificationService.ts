import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { Role } from '../domain/enums';
import { appUrl, mailService } from './mailService';
import { logger } from '../utils/logger';

export async function queueUseCaseNotification(
  tx: Prisma.TransactionClient,
  useCaseId: string,
  actorId: string,
  kind: string
): Promise<void> {
  const useCase = await tx.useCase.findUniqueOrThrow({ where: { id: useCaseId } });
  const recipients = new Set<string>();
  if (actorId !== useCase.createdById) {
    recipients.add(useCase.createdById);
  } else {
    const reviewers = await tx.user.findMany({
      where: { active: true, role: { in: [Role.AI_CHAMPION, Role.AI_CORE_TEAM] } }
    });
    const [comments, history] = await Promise.all([
      tx.comment.findMany({ where: { useCaseId }, select: { authorId: true } }),
      tx.statusHistory.findMany({ where: { useCaseId }, select: { changedById: true } })
    ]);
    const participants = new Set([
      ...comments.map((c) => c.authorId),
      ...history.map((h) => h.changedById)
    ]);
    for (const reviewer of reviewers) {
      if (
        participants.has(reviewer.id) ||
        (reviewer.role === Role.AI_CHAMPION && reviewer.id === useCase.aiChampionId)
      ) {
        recipients.add(reviewer.id);
      }
    }
    if (!recipients.size) {
      const champions = reviewers.filter((u) => u.role === Role.AI_CHAMPION);
      const departmentChampions = champions.filter((u) => u.department === useCase.department);
      for (const champion of departmentChampions.length ? departmentChampions : champions)
        recipients.add(champion.id);
    }
  }
  recipients.delete(actorId);
  for (const recipientId of recipients) {
    await tx.emailNotification.create({ data: { recipientId, useCaseId, kind } });
  }
}

let draining = false;

export async function deliverNotifications(): Promise<void> {
  if (draining) return;
  draining = true;
  try {
    const now = new Date();
    // Do not retain unconfirmed idea text beyond the link's lifetime.
    await prisma.emailLoginToken.deleteMany({ where: { expiresAt: { lt: now } } });
    const jobs = await prisma.emailNotification.findMany({
      where: { sentAt: null, nextAttemptAt: { lte: now } },
      take: 20,
      orderBy: { createdAt: 'asc' },
      include: { recipient: true, useCase: true }
    });
    for (const job of jobs) {
      try {
        const employee = job.recipient.role === Role.EMPLOYEE;
        // Recheck ownership on delivery in case roles/ownership changed while queued.
        if (job.recipient.active && (!employee || job.useCase.createdById === job.recipientId)) {
          const url = appUrl(`${employee ? '/meine-ideen' : '/use-cases'}/${job.useCaseId}`);
          const message =
            job.kind === 'NEED_MORE_INFO'
              ? 'Zu einer Ihrer Ideen werden weitere Informationen benötigt.'
              : job.kind === 'SUBMITTED'
                ? 'Eine Idee wurde zur Prüfung eingereicht.'
                : job.kind === 'COMMENT'
                  ? 'Es gibt eine neue Nachricht zu einer Idee.'
                  : 'Der Status einer Idee wurde aktualisiert.';
          await mailService.send(
            job.recipient.email,
            'IGZ – Neuigkeiten zu einer KI-Idee',
            `${message}\n\nÖffnen Sie den Vorgang und antworten Sie direkt in der App:\n${url}\n\n${employee ? 'Falls Ihre Sitzung abgelaufen ist, können Sie dort einen neuen Zugangslink per E-Mail anfordern. Ein Passwort ist nicht erforderlich.' : 'Bitte melden Sie sich mit Ihrem Verwaltungskonto an.'}\n\nDies ist eine automatische Benachrichtigung. Bitte antworten Sie in der App.`
          );
        }
        await prisma.emailNotification.update({
          where: { id: job.id },
          data: { sentAt: new Date() }
        });
      } catch {
        await prisma.emailNotification.update({
          where: { id: job.id },
          data: {
            attempts: { increment: 1 },
            nextAttemptAt: new Date(
              Date.now() + Math.min(3600000, 60000 * 2 ** Math.min(job.attempts, 6))
            )
          }
        });
        logger.warn({ notificationId: job.id }, 'E-Mail wird später erneut zugestellt');
      }
    }
    await prisma.emailNotification.deleteMany({
      where: { sentAt: { lt: new Date(Date.now() - 7 * 86400000) } }
    });
  } finally {
    draining = false;
  }
}

export function startNotificationDelivery(): NodeJS.Timeout {
  const tick = () => {
    void deliverNotifications().catch(() =>
      logger.error('E-Mail-Warteschlange konnte nicht verarbeitet werden')
    );
  };
  tick();
  const timer = setInterval(tick, 30000);
  timer.unref();
  return timer;
}
