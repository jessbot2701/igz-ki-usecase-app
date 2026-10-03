import '../testEnv';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { env } from '../../src/config/env';
import { Role } from '../../src/domain/enums';
import { authService } from '../../src/services/authService';
import { mailService } from '../../src/services/mailService';
import { deliverNotifications } from '../../src/services/notificationService';
import { createTestUser, resetDatabase } from './helpers';
import { ApiError } from '../../src/utils/ApiError';

const app = createApp();
const idea = {
  title: 'KI im Arbeitsalltag',
  department: 'IT',
  problemDescription: 'Wir suchen sehr lange nach Informationen.',
  solutionIdea: 'KI könnte die Suche im Wissensbestand unterstützen.'
};
const input = { email: 'new@test.local', name: 'Neue Mitarbeiterin', idea };
let send: ReturnType<typeof vi.spyOn>;
function lastToken(): string {
  const text = send.mock.calls.at(-1)?.[2] as string;
  const token = text?.match(/#token=([a-f0-9]{64})/)?.[1];
  if (!token) throw new Error('No verification token delivered');
  return token;
}
async function submitIdea() {
  expect((await request(app).post('/api/v1/auth/email-link').send(input)).status).toBe(202);
  const verified = await request(app)
    .post('/api/v1/auth/email-link/verify')
    .send({ token: lastToken() });
  expect(verified.status).toBe(200);
  return verified.body as { token: string; useCaseId: string; user: { id: string } };
}

describe('Employee email access and collaboration', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await resetDatabase();
    env.emailAllowedDomains = ['test.local'];
    env.mailTransport = 'file';
    send = vi.spyOn(mailService, 'send').mockResolvedValue(undefined);
  });
  afterAll(async () => {
    vi.restoreAllMocks();
    await prisma.$disconnect();
  });

  it('creates no user or use case before confirmation; atomically submits once', async () => {
    const response = await request(app).post('/api/v1/auth/email-link').send(input);
    expect(response.status).toBe(202);
    expect(response.body.token).toBeUndefined();
    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.useCase.count()).toBe(0);
    const token = lastToken();
    expect((await prisma.emailLoginToken.findFirstOrThrow()).tokenHash).not.toBe(token);
    const confirmed = await request(app).post('/api/v1/auth/email-link/verify').send({ token });
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.submitted).toBe(true);
    expect(confirmed.body.user.role).toBe(Role.EMPLOYEE);
    const saved = await prisma.useCase.findUniqueOrThrow({
      where: { id: confirmed.body.useCaseId }
    });
    expect(saved.status).toBe('SUBMITTED');
    expect(saved.createdById).toBe(confirmed.body.user.id);
    expect(await prisma.statusHistory.count()).toBe(1);
    expect((await prisma.emailLoginToken.findFirstOrThrow()).ideaJson).toBeNull();
    expect((await request(app).post('/api/v1/auth/email-link/verify').send({ token })).status).toBe(
      400
    );
    expect(await prisma.useCase.count()).toBe(1);
  });

  it('rejects expired, malformed and forged links', async () => {
    await request(app).post('/api/v1/auth/email-link').send(input);
    const token = lastToken();
    await prisma.emailLoginToken.updateMany({ data: { expiresAt: new Date(0) } });
    for (const value of [token, 'bad', 'a'.repeat(64)]) {
      expect(
        (await request(app).post('/api/v1/auth/email-link/verify').send({ token: value })).status
      ).toBe(400);
    }
    expect(await prisma.user.count()).toBe(0);
  });

  it('normalizes addresses, reuses existing accounts and preserves old mixed-case addresses', async () => {
    const employee = await createTestUser(Role.EMPLOYEE, 'Existing@Test.Local');
    await request(app).post('/api/v1/auth/email-link').send({ email: ' EXISTING@test.local ' });
    const response = await request(app)
      .post('/api/v1/auth/email-link/verify')
      .send({ token: lastToken() });
    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(employee.id);
    expect(response.body.submitted).toBe(false);
    expect(await prisma.user.count()).toBe(1);
  });

  it('does not issue employee access for unknown login-only addresses, disabled users or management accounts', async () => {
    for (const role of [Role.AI_CHAMPION, Role.AI_CORE_TEAM, Role.ADMINISTRATOR]) {
      const user = await createTestUser(role, `${role}@test.local`);
      expect(
        (
          await request(app)
            .post('/api/v1/auth/email-link')
            .send({ ...input, email: user.email })
        ).status
      ).toBe(202);
    }
    const disabled = await createTestUser(Role.EMPLOYEE, 'disabled@test.local');
    await prisma.user.update({ where: { id: disabled.id }, data: { active: false } });
    await request(app)
      .post('/api/v1/auth/email-link')
      .send({ ...input, email: disabled.email });
    await request(app).post('/api/v1/auth/email-link').send({ email: 'unknown@test.local' });
    expect(send).not.toHaveBeenCalled();
  });

  it('rejects other email domains, extra privileged fields and repeated requests', async () => {
    expect(
      (
        await request(app)
          .post('/api/v1/auth/email-link')
          .send({ ...input, email: 'outside@example.com' })
      ).status
    ).toBe(400);
    expect(
      (
        await request(app)
          .post('/api/v1/auth/email-link')
          .send({ ...input, role: 'ADMINISTRATOR' })
      ).status
    ).toBe(400);
    for (let i = 0; i < 3; i++)
      expect((await request(app).post('/api/v1/auth/email-link').send(input)).status).toBe(202);
    expect((await request(app).post('/api/v1/auth/email-link').send(input)).status).toBe(429);
    expect(send).toHaveBeenCalledTimes(3);
  });

  it('invalidates an undelivered verification link and reports delivery failure', async () => {
    send.mockRejectedValueOnce(new ApiError(503, 'SMTP unavailable'));
    expect((await request(app).post('/api/v1/auth/email-link').send(input)).status).toBe(503);
    expect(
      (await request(app).post('/api/v1/auth/email-link/verify').send({ token: lastToken() }))
        .status
    ).toBe(400);
    expect((await prisma.emailLoginToken.findFirstOrThrow()).ideaJson).toBeNull();
  });

  it('blocks all foreign use-case resources and privileged endpoints', async () => {
    const own = await submitIdea();
    const other = await createTestUser(Role.EMPLOYEE, 'other@test.local');
    const token = authService.signToken(other);
    for (const suffix of ['', '/comments', '/evaluations', '/history', '/attachments']) {
      expect(
        (
          await request(app)
            .get(`/api/v1/use-cases/${own.useCaseId}${suffix}`)
            .auth(token, { type: 'bearer' })
        ).status
      ).toBe(403);
    }
    expect(
      (
        await request(app)
          .post(`/api/v1/use-cases/${own.useCaseId}/comments`)
          .auth(token, { type: 'bearer' })
          .send({ text: 'Fremder Kommentar' })
      ).status
    ).toBe(403);
    expect(
      (
        await request(app)
          .post(`/api/v1/use-cases/${own.useCaseId}/attachments`)
          .auth(token, { type: 'bearer' })
      ).status
    ).toBe(403);
    expect(
      (
        await request(app)
          .post(`/api/v1/use-cases/${own.useCaseId}/ai/summarize`)
          .auth(token, { type: 'bearer' })
      ).status
    ).toBe(403);
    const attachment = await prisma.attachment.create({
      data: {
        useCaseId: own.useCaseId,
        fileName: 'internal.txt',
        storedPath: 'not-present',
        mimeType: 'text/plain',
        size: 5,
        uploadedById: own.user.id
      }
    });
    expect(
      (
        await request(app)
          .get(`/api/v1/attachments/${attachment.id}/download`)
          .auth(token, { type: 'bearer' })
      ).status
    ).toBe(403);
    for (const url of ['/users', '/dashboard/portfolio', '/admin/activity']) {
      expect(
        (await request(app).get(`/api/v1${url}`).auth(own.token, { type: 'bearer' })).status
      ).toBe(403);
    }
    expect(
      (await request(app).get('/api/v1/dashboard/stats').auth(token, { type: 'bearer' })).body.total
    ).toBe(0);
  });

  it('completes champion question → employee reply/edit → resubmission, with targeted notifications', async () => {
    const champion = await createTestUser(Role.AI_CHAMPION, 'champion@test.local');
    const core = await createTestUser(Role.AI_CORE_TEAM, 'core@test.local');
    const own = await submitIdea();
    const championToken = authService.signToken(champion);
    const coreToken = authService.signToken(core);
    const url = `/api/v1/use-cases/${own.useCaseId}`;
    expect(
      await prisma.emailNotification.count({
        where: { recipientId: champion.id, kind: 'SUBMITTED' }
      })
    ).toBe(1);
    expect(
      (await request(app).get(url).auth(own.token, { type: 'bearer' })).body.allowedNextStatuses
    ).toEqual([]);
    expect(
      (await request(app).get(url).auth(championToken, { type: 'bearer' })).body.allowedNextStatuses
    ).toEqual(['IN_REVIEW']);
    await request(app)
      .post(`${url}/status`)
      .auth(championToken, { type: 'bearer' })
      .send({ toStatus: 'IN_REVIEW' });
    const coreView = await request(app).get(url).auth(coreToken, { type: 'bearer' });
    expect(coreView.body.allowedNextStatuses).toContain('APPROVED');
    expect(coreView.body.allowedNextStatuses).not.toContain('NEED_MORE_INFO');
    await request(app)
      .post(`${url}/status`)
      .auth(championToken, { type: 'bearer' })
      .send({ toStatus: 'NEED_MORE_INFO', note: 'Welche Daten werden benötigt?' });
    expect((await request(app).get(url).auth(own.token, { type: 'bearer' })).body.canEdit).toBe(
      true
    );
    expect(
      await prisma.emailNotification.count({
        where: { recipientId: own.user.id, kind: 'NEED_MORE_INFO' }
      })
    ).toBe(1);
    expect(
      (
        await request(app)
          .post(`${url}/comments`)
          .auth(own.token, { type: 'bearer' })
          .send({ text: 'Wir benötigen ausschließlich interne Handbücher.' })
      ).status
    ).toBe(201);
    expect(
      await prisma.emailNotification.count({ where: { recipientId: champion.id, kind: 'COMMENT' } })
    ).toBe(1);
    expect(
      (await request(app).get(`${url}/comments`).auth(coreToken, { type: 'bearer' })).body[0].text
    ).toContain('Handbücher');
    await prisma.useCase.update({
      where: { id: own.useCaseId },
      data: { benefitTypes: 'ZEITERSPARNIS' }
    });
    expect(
      (
        await request(app)
          .patch(url)
          .auth(own.token, { type: 'bearer' })
          .send({ solutionIdea: 'Interne Handbücher als Wissensquelle nutzen.' })
      ).status
    ).toBe(200);
    expect(
      (await prisma.useCase.findUniqueOrThrow({ where: { id: own.useCaseId } })).benefitTypes
    ).toBe('ZEITERSPARNIS');
    expect(
      (
        await request(app)
          .post(`${url}/status`)
          .auth(own.token, { type: 'bearer' })
          .send({ toStatus: 'SUBMITTED' })
      ).status
    ).toBe(200);
  });

  it('keeps failed notifications queued for retry and does not send comment text by email', async () => {
    const champion = await createTestUser(Role.AI_CHAMPION, 'delivery@test.local');
    const own = await submitIdea();
    // Make the job explicitly due; SQLite/Node clocks may differ by a few milliseconds.
    await prisma.emailNotification.updateMany({
      where: { recipientId: champion.id },
      data: { nextAttemptAt: new Date(0) }
    });
    send.mockRejectedValueOnce(new Error('SMTP down'));
    await deliverNotifications();
    const job = await prisma.emailNotification.findFirstOrThrow({
      where: { recipientId: champion.id }
    });
    expect(job.sentAt).toBeNull();
    expect(job.attempts).toBe(1);
    await prisma.emailNotification.update({
      where: { id: job.id },
      data: { nextAttemptAt: new Date(0) }
    });
    await deliverNotifications();
    expect(
      (await prisma.emailNotification.findUniqueOrThrow({ where: { id: job.id } })).sentAt
    ).not.toBeNull();
    expect(send.mock.calls.at(-1)?.[2]).toContain(`/use-cases/${own.useCaseId}`);
    expect(send.mock.calls.at(-1)?.[2]).not.toContain(idea.problemDescription);
  });

  it('rechecks disabled accounts and prevents elevation after a role change', async () => {
    const own = await submitIdea();
    await prisma.user.update({ where: { id: own.user.id }, data: { role: Role.ADMINISTRATOR } });
    expect(
      (await request(app).get('/api/v1/users').auth(own.token, { type: 'bearer' })).status
    ).toBe(401);
    await prisma.user.update({
      where: { id: own.user.id },
      data: { role: Role.EMPLOYEE, active: false }
    });
    expect(
      (await request(app).get('/api/v1/use-cases').auth(own.token, { type: 'bearer' })).status
    ).toBe(401);
  });

  it('invalidates the previous link when resending the same idea', async () => {
    await request(app).post('/api/v1/auth/email-link').send(input);
    const first = lastToken();
    await request(app).post('/api/v1/auth/email-link').send(input);
    const second = lastToken();
    expect(
      (await request(app).post('/api/v1/auth/email-link/verify').send({ token: first })).status
    ).toBe(400);
    expect(
      (await request(app).post('/api/v1/auth/email-link/verify').send({ token: second })).status
    ).toBe(200);
    expect(await prisma.useCase.count()).toBe(1);
  });

  it('rate-limits requests from the same client across different email addresses', async () => {
    for (let i = 0; i < 20; i++) {
      expect(
        (
          await request(app)
            .post('/api/v1/auth/email-link')
            .send({ email: `unknown${i}@test.local` })
        ).status
      ).toBe(202);
    }
    expect((await request(app).post('/api/v1/auth/email-link').send(input)).status).toBe(429);
  });

  it('does not redirect an authenticated employee to another employee’s idea', async () => {
    const own = await submitIdea();
    await createTestUser(Role.EMPLOYEE, 'someone@test.local');
    await request(app)
      .post('/api/v1/auth/email-link')
      .send({ email: 'someone@test.local', targetId: own.useCaseId });
    const response = await request(app)
      .post('/api/v1/auth/email-link/verify')
      .send({ token: lastToken() });
    expect(response.status).toBe(200);
    expect(response.body.useCaseId).toBeUndefined();
  });
});
