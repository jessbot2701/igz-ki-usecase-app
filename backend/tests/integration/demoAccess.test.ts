import '../testEnv';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import { DEMO_EMPLOYEE_EMAIL, env } from '../../src/config/env';
import { prisma } from '../../src/config/prisma';
import { Role } from '../../src/domain/enums';
import { mailService } from '../../src/services/mailService';
import { createTestUser, resetDatabase } from './helpers';

const app = createApp();
const initialEnv = { ...env };
const input = {
  email: DEMO_EMPLOYEE_EMAIL,
  name: 'Demo Mitarbeiter',
  idea: {
    title: 'Demo Wissenssuche',
    department: 'IT',
    problemDescription: 'Die Suche dauert sehr lange.',
    solutionIdea: 'Ein KI-Assistent hilft beim Suchen.'
  }
};
const tokenFrom = (link: string) => new URLSearchParams(new URL(link).hash.slice(1)).get('token');

describe('Local demonstration access', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await resetDatabase();
    Object.assign(env, initialEnv, {
      demoMode: true,
      nodeEnv: 'test',
      mailTransport: 'file',
      emailAllowedDomains: ['igz.com'],
      publicAppUrl: 'http://localhost:5175'
    });
  });
  afterAll(async () => {
    Object.assign(env, initialEnv);
    vi.restoreAllMocks();
    await prisma.$disconnect();
  });

  it('provides a one-time demo link without mail, while keeping explicit confirmation and employee ownership', async () => {
    const send = vi.spyOn(mailService, 'send');
    const config = await request(app).get('/api/v1/auth/access-config').expect(200);
    expect(config.body).toEqual({ demoMode: true, demoEmail: DEMO_EMPLOYEE_EMAIL });
    const response = await request(app).post('/api/v1/auth/email-link').send(input).expect(202);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(send).not.toHaveBeenCalled();
    expect(await prisma.useCase.count()).toBe(0);
    const token = tokenFrom(response.body.demoLink);
    const verified = await request(app)
      .post('/api/v1/auth/email-link/verify')
      .send({ token })
      .expect(200);
    expect(verified.body.user.role).toBe(Role.EMPLOYEE);
    expect(verified.body.user.email).toBe(DEMO_EMPLOYEE_EMAIL);
    expect(verified.body.submitted).toBe(true);
    expect((await prisma.statusHistory.findFirstOrThrow()).note).toContain('Demo-Modus');
    await request(app).post('/api/v1/auth/email-link/verify').send({ token }).expect(400);
    const reopened = await request(app)
      .post('/api/v1/auth/email-link')
      .send({ email: DEMO_EMPLOYEE_EMAIL, targetId: verified.body.useCaseId })
      .expect(202);
    const session = await request(app)
      .post('/api/v1/auth/email-link/verify')
      .send({ token: tokenFrom(reopened.body.demoLink) })
      .expect(200);
    expect(session.body.useCaseId).toBe(verified.body.useCaseId);
    expect(session.body.user.id).toBe(verified.body.user.id);
  });

  it('rejects real employee addresses in demo mode and never exposes management links', async () => {
    await request(app)
      .post('/api/v1/auth/email-link')
      .send({ ...input, email: 'echter.mitarbeiter@igz.com' })
      .expect(400);
    await createTestUser(Role.AI_CHAMPION, DEMO_EMPLOYEE_EMAIL);
    const denied = await request(app).post('/api/v1/auth/email-link').send(input).expect(202);
    expect(denied.body.demoLink).toBeUndefined();
    expect(await prisma.useCase.count()).toBe(0);
  });

  it('invalidates demo links when demo mode is switched off', async () => {
    const response = await request(app).post('/api/v1/auth/email-link').send(input).expect(202);
    env.demoMode = false;
    await request(app)
      .post('/api/v1/auth/email-link/verify')
      .send({ token: tokenFrom(response.body.demoLink) })
      .expect(400);
    expect((await request(app).get('/api/v1/auth/access-config')).body).toEqual({
      demoMode: false
    });
  });

  it('allows repeated presentations with the fixed demo account', async () => {
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await request(app).post('/api/v1/auth/email-link').send(input).expect(202);
      expect(response.body.demoLink).toContain('/zugang/bestaetigen#token=');
    }
  });

  it('never returns a demo link in production, even if the demo flag was accidentally set', async () => {
    env.nodeEnv = 'production';
    env.publicAppUrl = 'https://ideas.igz.com';
    expect((await request(app).get('/api/v1/auth/access-config')).body).toEqual({
      demoMode: false
    });
    const response = await request(app).post('/api/v1/auth/email-link').send(input).expect(503);
    expect(response.body.demoLink).toBeUndefined();
    expect(await prisma.emailLoginToken.count()).toBe(0);
  });

  it('retains the real mail flow when demo mode is off', async () => {
    env.demoMode = false;
    const send = vi.spyOn(mailService, 'send').mockResolvedValue(undefined);
    const response = await request(app)
      .post('/api/v1/auth/email-link')
      .send({ ...input, email: 'employee@igz.com' })
      .expect(202);
    expect(response.body.demoLink).toBeUndefined();
    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0][0]).toBe('employee@igz.com');
  });
});
