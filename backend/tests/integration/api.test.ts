import '../testEnv';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { Role } from '../../src/domain/enums';
import { authService } from '../../src/services/authService';
import { createTestUser, resetDatabase } from './helpers';

const app = createApp();

describe('IGZ Use Case API (integration)', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('rejects login with wrong credentials', async () => {
    await createTestUser(Role.EMPLOYEE, 'emp@test.local');
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'emp@test.local', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('logs in with correct credentials and returns a JWT', async () => {
    await createTestUser(Role.EMPLOYEE, 'emp2@test.local');
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'emp2@test.local', password: 'Test123!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe(Role.EMPLOYEE);
  });

  describe('Use Case lifecycle & RBAC', () => {
    it('allows an employee to create a use case and only see their own', async () => {
      const employee = await createTestUser(Role.EMPLOYEE, 'owner@test.local');
      const otherEmployee = await createTestUser(Role.EMPLOYEE, 'other@test.local');
      const employeeToken = authService.signToken(employee);
      const otherToken = authService.signToken(otherEmployee);

      const createRes = await request(app)
        .post('/api/v1/use-cases')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          title: 'Test Use Case',
          requestor: 'Owner',
          department: 'IT',
          problemDescription: 'Ein ausreichend langes Problem.',
          solutionIdea: 'Eine ausreichend lange Lösungsidee.'
        });
      expect(createRes.status).toBe(201);
      const useCaseId = createRes.body.id;

      const otherListRes = await request(app)
        .get('/api/v1/use-cases')
        .set('Authorization', `Bearer ${otherToken}`);
      expect(otherListRes.body.items).toHaveLength(0);

      const ownerListRes = await request(app)
        .get('/api/v1/use-cases')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(ownerListRes.body.items).toHaveLength(1);
      expect(ownerListRes.body.items[0].id).toBe(useCaseId);
    });

    it('enforces the status transition workflow and role permissions', async () => {
      const employee = await createTestUser(Role.EMPLOYEE, 'wf-emp@test.local');
      const champion = await createTestUser(Role.AI_CHAMPION, 'wf-champ@test.local');
      const coreTeam = await createTestUser(Role.AI_CORE_TEAM, 'wf-core@test.local');
      const employeeToken = authService.signToken(employee);
      const championToken = authService.signToken(champion);
      const coreTeamToken = authService.signToken(coreTeam);

      const createRes = await request(app)
        .post('/api/v1/use-cases')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          title: 'Workflow Use Case',
          requestor: 'Owner',
          department: 'IT',
          problemDescription: 'Ein ausreichend langes Problem.',
          solutionIdea: 'Eine ausreichend lange Lösungsidee.'
        });
      const useCaseId = createRes.body.id;

      // Champion cannot submit on behalf of the owner
      const forbiddenSubmit = await request(app)
        .post(`/api/v1/use-cases/${useCaseId}/status`)
        .set('Authorization', `Bearer ${championToken}`)
        .send({ toStatus: 'SUBMITTED' });
      expect(forbiddenSubmit.status).toBe(403);

      // Owner submits
      const submitRes = await request(app)
        .post(`/api/v1/use-cases/${useCaseId}/status`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ toStatus: 'SUBMITTED' });
      expect(submitRes.status).toBe(200);
      expect(submitRes.body.status).toBe('SUBMITTED');

      // Champion moves to IN_REVIEW
      const reviewRes = await request(app)
        .post(`/api/v1/use-cases/${useCaseId}/status`)
        .set('Authorization', `Bearer ${championToken}`)
        .send({ toStatus: 'IN_REVIEW' });
      expect(reviewRes.status).toBe(200);

      // Champion cannot approve (core team only)
      const forbiddenApprove = await request(app)
        .post(`/api/v1/use-cases/${useCaseId}/status`)
        .set('Authorization', `Bearer ${championToken}`)
        .send({ toStatus: 'APPROVED' });
      expect(forbiddenApprove.status).toBe(403);

      // Core team approves
      const approveRes = await request(app)
        .post(`/api/v1/use-cases/${useCaseId}/status`)
        .set('Authorization', `Bearer ${coreTeamToken}`)
        .send({ toStatus: 'APPROVED' });
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.status).toBe('APPROVED');

      // Invalid transition (skip PILOT) is rejected
      const invalidRes = await request(app)
        .post(`/api/v1/use-cases/${useCaseId}/status`)
        .set('Authorization', `Bearer ${coreTeamToken}`)
        .send({ toStatus: 'IMPLEMENTED' });
      expect(invalidRes.status).toBe(400);

      const history = await request(app)
        .get(`/api/v1/use-cases/${useCaseId}/history`)
        .set('Authorization', `Bearer ${coreTeamToken}`);
      expect(history.body.length).toBeGreaterThanOrEqual(3);
    });

    it('lets an AI champion add an evaluation but blocks a plain employee', async () => {
      const employee = await createTestUser(Role.EMPLOYEE, 'eval-emp@test.local');
      const champion = await createTestUser(Role.AI_CHAMPION, 'eval-champ@test.local');
      const employeeToken = authService.signToken(employee);
      const championToken = authService.signToken(champion);

      const createRes = await request(app)
        .post('/api/v1/use-cases')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          title: 'Evaluation Use Case',
          requestor: 'Owner',
          department: 'IT',
          problemDescription: 'Ein ausreichend langes Problem.',
          solutionIdea: 'Eine ausreichend lange Lösungsidee.'
        });
      const useCaseId = createRes.body.id;

      const forbiddenEval = await request(app)
        .post(`/api/v1/use-cases/${useCaseId}/evaluations`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          businessValue: 'HOCH',
          feasibility: 'MITTEL',
          risk: 'NIEDRIG',
          strategicRelevance: 'QUICK_WIN'
        });
      expect(forbiddenEval.status).toBe(403);

      const okEval = await request(app)
        .post(`/api/v1/use-cases/${useCaseId}/evaluations`)
        .set('Authorization', `Bearer ${championToken}`)
        .send({
          businessValue: 'HOCH',
          feasibility: 'MITTEL',
          risk: 'NIEDRIG',
          strategicRelevance: 'QUICK_WIN'
        });
      expect(okEval.status).toBe(201);
    });

    it('adds and lists comments on a use case', async () => {
      const employee = await createTestUser(Role.EMPLOYEE, 'comment-emp@test.local');
      const employeeToken = authService.signToken(employee);

      const createRes = await request(app)
        .post('/api/v1/use-cases')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          title: 'Comment Use Case',
          requestor: 'Owner',
          department: 'IT',
          problemDescription: 'Ein ausreichend langes Problem.',
          solutionIdea: 'Eine ausreichend lange Lösungsidee.'
        });
      const useCaseId = createRes.body.id;

      const commentRes = await request(app)
        .post(`/api/v1/use-cases/${useCaseId}/comments`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ text: 'Bitte weitere Details ergänzen.' });
      expect(commentRes.status).toBe(201);

      const listRes = await request(app)
        .get(`/api/v1/use-cases/${useCaseId}/comments`)
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(listRes.body).toHaveLength(1);
      expect(listRes.body[0].text).toBe('Bitte weitere Details ergänzen.');
    });
  });

  describe('Admin-only routes', () => {
    it('blocks non-admin users from managing users', async () => {
      const employee = await createTestUser(Role.EMPLOYEE, 'nonadmin@test.local');
      const employeeToken = authService.signToken(employee);
      const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });

    it('allows an admin to list and create users', async () => {
      const admin = await createTestUser(Role.ADMINISTRATOR, 'admin2@test.local');
      const adminToken = authService.signToken(admin);

      const listRes = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${adminToken}`);
      expect(listRes.status).toBe(200);

      const createRes = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Neu Employee', email: 'new@test.local', password: 'Password1!', role: Role.EMPLOYEE });
      expect(createRes.status).toBe(201);
    });
  });

  describe('Dashboard portfolio analytics', () => {
    it('blocks employees and AI champions from the portfolio view', async () => {
      const employee = await createTestUser(Role.EMPLOYEE, 'portfolio-emp@test.local');
      const champion = await createTestUser(Role.AI_CHAMPION, 'portfolio-champ@test.local');
      const employeeToken = authService.signToken(employee);
      const championToken = authService.signToken(champion);

      const employeeRes = await request(app)
        .get('/api/v1/dashboard/portfolio')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(employeeRes.status).toBe(403);

      const championRes = await request(app)
        .get('/api/v1/dashboard/portfolio')
        .set('Authorization', `Bearer ${championToken}`);
      expect(championRes.status).toBe(403);
    });

    it('allows the AI Core Team and Administrator to view portfolio analytics', async () => {
      const coreTeam = await createTestUser(Role.AI_CORE_TEAM, 'portfolio-core@test.local');
      const admin = await createTestUser(Role.ADMINISTRATOR, 'portfolio-admin@test.local');
      const coreTeamToken = authService.signToken(coreTeam);
      const adminToken = authService.signToken(admin);

      const createRes = await request(app)
        .post('/api/v1/use-cases')
        .set('Authorization', `Bearer ${coreTeamToken}`)
        .send({
          title: 'Portfolio Use Case',
          requestor: 'Owner',
          department: 'Finanzen',
          problemDescription: 'Ein ausreichend langes Problem.',
          solutionIdea: 'Eine ausreichend lange Lösungsidee.',
          targetDate: '2000-01-01'
        });
      expect(createRes.status).toBe(201);

      const coreTeamRes = await request(app)
        .get('/api/v1/dashboard/portfolio')
        .set('Authorization', `Bearer ${coreTeamToken}`);
      expect(coreTeamRes.status).toBe(200);
      expect(coreTeamRes.body.overdueTargetDates).toBe(1);
      expect(coreTeamRes.body.attentionItems).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Portfolio Use Case', reasons: ['OVERDUE_TARGET_DATE'] })
        ])
      );

      const adminRes = await request(app)
        .get('/api/v1/dashboard/portfolio')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);
    });
  });
});
