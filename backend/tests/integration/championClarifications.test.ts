import '../testEnv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { Role } from '../../src/domain/enums';
import { authService } from '../../src/services/authService';
import { createTestUser, resetDatabase } from './helpers';

const app = createApp();
const input = {
  title: 'Zuordnung und Rückfrage',
  requestor: 'Einreicher',
  department: 'IT',
  problemDescription: 'Ein ausreichend beschriebenes Problem.',
  solutionIdea: 'Eine ausreichend beschriebene Lösung.'
};
const authorization = (user: Parameters<typeof authService.signToken>[0]) =>
  `Bearer ${authService.signToken(user)}`;

async function fixture() {
  const owner = await createTestUser(Role.EMPLOYEE, 'owner@test.local');
  const champion = await createTestUser(Role.AI_CHAMPION, 'champion@test.local');
  const core = await createTestUser(Role.AI_CORE_TEAM, 'core@test.local');
  const idea = await prisma.useCase.create({
    data: { ...input, createdById: owner.id, lastModifiedById: owner.id, status: 'IN_REVIEW' }
  });
  return { owner, champion, core, idea };
}

describe('Champion assignment and clarification tracking', () => {
  beforeEach(resetDatabase);
  afterAll(() => prisma.$disconnect());

  it('lists only active champions for management and hides sensitive account fields', async () => {
    const { owner, champion, core } = await fixture();
    const inactive = await createTestUser(Role.AI_CHAMPION, 'inactive@test.local');
    await prisma.user.update({ where: { id: inactive.id }, data: { active: false } });
    await request(app).get('/api/v1/champions').expect(401);
    await request(app)
      .get('/api/v1/champions')
      .set('Authorization', authorization(owner))
      .expect(403);
    for (const user of [champion, core]) {
      const result = await request(app)
        .get('/api/v1/champions')
        .set('Authorization', authorization(user))
        .expect(200);
      expect(result.body).toEqual([
        { id: champion.id, name: champion.name, department: 'IT', email: champion.email }
      ]);
    }
  });

  it('validates assignment permissions and target role on create and update', async () => {
    const { owner, champion, core, idea } = await fixture();
    await prisma.useCase.update({ where: { id: idea.id }, data: { status: 'DRAFT' } });
    const inactive = await createTestUser(Role.AI_CHAMPION, 'inactive@test.local');
    await prisma.user.update({ where: { id: inactive.id }, data: { active: false } });
    await request(app)
      .patch(`/api/v1/use-cases/${idea.id}`)
      .set('Authorization', authorization(owner))
      .send({ aiChampionId: champion.id })
      .expect(403);
    await request(app)
      .post('/api/v1/use-cases')
      .set('Authorization', authorization(owner))
      .send({ ...input, aiChampionId: champion.id })
      .expect(403);
    for (const aiChampionId of [owner.id, core.id, inactive.id, 'cmissingchampion00000000000']) {
      await request(app)
        .patch(`/api/v1/use-cases/${idea.id}`)
        .set('Authorization', authorization(core))
        .send({ aiChampionId })
        .expect(400);
    }
    const result = await request(app)
      .patch(`/api/v1/use-cases/${idea.id}`)
      .set('Authorization', authorization(core))
      .send({ aiChampionId: champion.id })
      .expect(200);
    expect(result.body.aiChampionId).toBe(champion.id);
    const created = await request(app)
      .post('/api/v1/use-cases')
      .set('Authorization', authorization(champion))
      .send({ ...input, aiChampionId: champion.id })
      .expect(201);
    expect(created.body.aiChampionId).toBe(champion.id);
  });

  it('keeps legacy labels and inactive assignments until explicitly changed', async () => {
    const { champion, core, idea } = await fixture();
    await prisma.useCase.update({
      where: { id: idea.id },
      data: { aiChampion: 'Unbekannter Altname' }
    });
    const patch = (data: object) =>
      request(app)
        .patch(`/api/v1/use-cases/${idea.id}`)
        .set('Authorization', authorization(core))
        .send(data);
    expect((await patch({ title: 'Neuer Titel' }).expect(200)).body.aiChampion).toBe(
      'Unbekannter Altname'
    );
    await patch({ aiChampionId: champion.id }).expect(200);
    await prisma.user.update({
      where: { id: champion.id },
      data: { name: 'Neuer Name', active: false }
    });
    await patch({ title: 'Noch ein Titel', aiChampionId: champion.id }).expect(200);
    const fetched = await request(app)
      .get(`/api/v1/use-cases/${idea.id}`)
      .set('Authorization', authorization(core))
      .expect(200);
    expect(fetched.body.assignedChampion).toMatchObject({
      id: champion.id,
      name: 'Neuer Name',
      active: false
    });
    const cleared = await patch({ aiChampionId: null }).expect(200);
    expect(cleared.body.aiChampionId).toBeNull();
    expect(cleared.body.aiChampion).toBeNull();
  });

  it('notifies the assigned account even when another champion has the same name', async () => {
    const { owner, champion, core, idea } = await fixture();
    await createTestUser(Role.AI_CHAMPION, 'same-name@test.local');
    await request(app)
      .patch(`/api/v1/use-cases/${idea.id}`)
      .set('Authorization', authorization(core))
      .send({ aiChampionId: champion.id })
      .expect(200);
    await request(app)
      .post(`/api/v1/use-cases/${idea.id}/comments`)
      .set('Authorization', authorization(owner))
      .send({ text: 'Eine Ergänzung zur Idee.' })
      .expect(201);
    const notifications = await prisma.emailNotification.findMany({
      where: { useCaseId: idea.id }
    });
    expect(notifications.map((entry) => entry.recipientId)).toEqual([champion.id]);
  });

  it('tracks only owner replies, preserves workflow status and resets on a new question', async () => {
    const { owner, champion, core, idea } = await fixture();
    const status = (user: typeof owner, toStatus: string) =>
      request(app)
        .post(`/api/v1/use-cases/${idea.id}/status`)
        .set('Authorization', authorization(user))
        .send({ toStatus, note: 'Bitte den Prozess genauer erläutern.' })
        .expect(200);
    const comment = (user: typeof owner, text: string) =>
      request(app)
        .post(`/api/v1/use-cases/${idea.id}/comments`)
        .set('Authorization', authorization(user))
        .send({ text });
    const get = () =>
      request(app)
        .get(`/api/v1/use-cases/${idea.id}`)
        .set('Authorization', authorization(owner))
        .expect(200);
    await comment(owner, 'Kommentar vor der Rückfrage.').expect(201);
    await status(champion, 'NEED_MORE_INFO');
    const requested = (await get()).body;
    expect(requested.hasUnansweredQuestion).toBe(true);
    expect(requested.clarificationRequestedAt).toBeTruthy();
    await comment(champion, 'Ergänzung der Rückfrage.').expect(201);
    await comment(owner, '   ').expect(400);
    expect((await get()).body.hasUnansweredQuestion).toBe(true);
    const answer = await comment(owner, 'Hier ist meine ausführliche Antwort.').expect(201);
    const answered = (await get()).body;
    expect(answered.clarificationAnsweredAt).toBe(answer.body.createdAt);
    expect(answered.hasUnansweredQuestion).toBe(false);
    expect(answered.status).toBe('NEED_MORE_INFO');
    const portfolio = await request(app)
      .get('/api/v1/dashboard/portfolio')
      .set('Authorization', authorization(core))
      .expect(200);
    expect(portfolio.body.needMoreInfo).toBe(1);
    expect(portfolio.body.unansweredQuestions).toBe(0);
    expect(portfolio.body.attentionItems[0].reasons).toContain('ANSWER_RECEIVED');
    expect(portfolio.body.topUseCases[0].nextAction).toBe('Antwort prüfen');
    await status(owner, 'SUBMITTED');
    await status(champion, 'IN_REVIEW');
    await status(champion, 'NEED_MORE_INFO');
    const reopened = (await get()).body;
    expect(reopened.clarificationAnsweredAt).toBeNull();
    expect(reopened.hasUnansweredQuestion).toBe(true);
  });

  it('filters before pagination and retains employee ownership boundaries', async () => {
    const { owner, champion, idea } = await fixture();
    const other = await createTestUser(Role.EMPLOYEE, 'other@test.local');
    for (let i = 0; i < 3; i++)
      await prisma.useCase.create({
        data: {
          ...input,
          title: `Offen ${i}`,
          createdById: owner.id,
          lastModifiedById: owner.id,
          status: 'NEED_MORE_INFO'
        }
      });
    await prisma.useCase.create({
      data: {
        ...input,
        title: 'Andere Idee',
        createdById: other.id,
        lastModifiedById: other.id,
        status: 'NEED_MORE_INFO'
      }
    });
    await prisma.useCase.update({
      where: { id: idea.id },
      data: { status: 'NEED_MORE_INFO', clarificationAnsweredAt: new Date() }
    });
    const search = (user: typeof owner, query: object) =>
      request(app)
        .get('/api/v1/use-cases')
        .query(query)
        .set('Authorization', authorization(user))
        .expect(200);
    const first = (await search(owner, { unansweredOnly: 'true', pageSize: 2, page: 1 })).body;
    const second = (await search(owner, { unansweredOnly: 'true', pageSize: 2, page: 2 })).body;
    expect(first.total).toBe(3);
    expect(first.items).toHaveLength(2);
    expect(second.items).toHaveLength(1);
    expect(new Set([...first.items, ...second.items].map((item) => item.id)).size).toBe(3);
    expect((await search(champion, { unansweredOnly: 'true' })).body.total).toBe(4);
    expect((await search(owner, { unansweredOnly: 'false' })).body.total).toBe(4);
  });

  it('migrates only unambiguous legacy assignments and answers after the latest question', async () => {
    const { owner, champion, idea } = await fixture();
    await createTestUser(Role.AI_CHAMPION, 'duplicate@test.local');
    await prisma.useCase.update({
      where: { id: idea.id },
      data: { aiChampion: champion.name, status: 'NEED_MORE_INFO' }
    });
    const unique = await prisma.useCase.create({
      data: {
        ...input,
        aiChampion: ` ${champion.email.toUpperCase()} `,
        createdById: owner.id,
        lastModifiedById: owner.id,
        status: 'NEED_MORE_INFO'
      }
    });
    const at = (day: number) => new Date(`2026-10-0${day}T12:00:00Z`);
    for (const useCaseId of [idea.id, unique.id]) {
      for (const day of [1, 3])
        await prisma.statusHistory.create({
          data: {
            useCaseId,
            changedById: champion.id,
            fromStatus: 'IN_REVIEW',
            toStatus: 'NEED_MORE_INFO',
            changedAt: at(day)
          }
        });
      await prisma.comment.create({
        data: { useCaseId, authorId: owner.id, text: 'Frühere Antwort', createdAt: at(2) }
      });
      await prisma.comment.create({
        data: { useCaseId, authorId: champion.id, text: 'Nachfrage', createdAt: at(4) }
      });
    }
    await prisma.comment.create({
      data: { useCaseId: unique.id, authorId: owner.id, text: 'Neue Antwort', createdAt: at(4) }
    });
    const sql = readFileSync(
      resolve(
        __dirname,
        '../../prisma/migrations/20261003120000_champion_and_clarifications/migration.sql'
      ),
      'utf8'
    ).replace(/--[^\n]*/g, '');
    for (const statement of sql
      .split(';')
      .map((part) => part.trim())
      .filter((part) => part.startsWith('UPDATE')))
      await prisma.$executeRawUnsafe(statement);
    const ambiguous = await prisma.useCase.findUniqueOrThrow({ where: { id: idea.id } });
    const mapped = await prisma.useCase.findUniqueOrThrow({ where: { id: unique.id } });
    expect(ambiguous.aiChampionId).toBeNull();
    expect(ambiguous.aiChampion).toBe(champion.name);
    expect(ambiguous.clarificationRequestedAt).toEqual(at(3));
    expect(ambiguous.clarificationAnsweredAt).toBeNull();
    expect(mapped.aiChampionId).toBe(champion.id);
    expect(mapped.clarificationAnsweredAt).toEqual(at(4));
  });
});
