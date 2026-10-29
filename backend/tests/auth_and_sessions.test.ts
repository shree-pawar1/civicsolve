import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';
import { clearTestDatabase } from './setup';

describe('Authentication & Single-Session Concurrency Test Suite', () => {
  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await clearTestDatabase();
    await prisma.$disconnect();
  });

  describe('Registration Matrix & Security', () => {
    it('registers all four stakeholder roles successfully', async () => {
      const roles = [
        { fullName: 'Citizen John', email: 'citizen@example.com', role: 'CITIZEN' },
        { fullName: 'Prof Davis', email: 'prof@university.edu', role: 'UNIVERSITY', organization: 'MIT' },
        { fullName: 'Tech Corp', email: 'contact@industry.com', role: 'INDUSTRY', organization: 'Tata Tech' },
        { fullName: 'Gov Officer', email: 'officer@gov.state.in', role: 'GOVERNMENT', organization: 'Municipal Corp' },
      ];

      for (const item of roles) {
        const res = await request(app)
          .post('/api/auth/register')
          .send({
            ...item,
            password: 'SecurePassword123!',
            confirmPassword: 'SecurePassword123!',
          });

        expect(res.status).toBe(201);
        expect(res.body.user).toBeDefined();
        expect(res.body.user.role).toBe(item.role);
        expect(res.body.user.password).toBeUndefined();
        expect(res.body.user.passwordHash).toBeUndefined();
      }

      // Verify records in real database
      const dbUsers = await prisma.user.findMany();
      expect(dbUsers.length).toBe(4);
      for (const u of dbUsers) {
        expect(u.passwordHash).toMatch(/^\$argon2id\$/);
      }
    });

    it('rejects duplicate email regardless of case or surrounding whitespace', async () => {
      // First registration
      const res1 = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Jane Doe',
          email: 'jane.doe@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
          role: 'CITIZEN',
        });
      expect(res1.status).toBe(201);

      // Attempt second registration with mixed case and whitespace
      const res2 = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Jane Duplicate',
          email: '   JANE.DOE@EXAMPLE.COM   ',
          password: 'Password123',
          confirmPassword: 'Password123',
          role: 'CITIZEN',
        });

      expect(res2.status).toBe(409);
      expect(res2.body.error).toMatch(/already exists/i);

      // Verify only 1 account exists in database
      const users = await prisma.user.findMany({ where: { emailNormalized: 'jane.doe@example.com' } });
      expect(users.length).toBe(1);
    });

    it('rejects invalid inputs and missing required organization for institutions', async () => {
      // University missing organization
      const res1 = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Dr Smith',
          email: 'smith@uni.edu',
          password: 'Password123',
          confirmPassword: 'Password123',
          role: 'UNIVERSITY',
        });
      expect(res1.status).toBe(400);

      // Password too short
      const res2 = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Bob',
          email: 'bob@example.com',
          password: 'short',
          confirmPassword: 'short',
          role: 'CITIZEN',
        });
      expect(res2.status).toBe(400);

      // Invalid role
      const res3 = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Fake Admin',
          email: 'admin@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
          role: 'SUPERADMIN',
        });
      expect(res3.status).toBe(400);
    });

    it('handles parallel registrations with identical email, producing exactly one account', async () => {
      const email = 'race.test@example.com';
      const registrationPayload = {
        fullName: 'Race Tester',
        email,
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'CITIZEN',
      };

      // Launch 5 parallel registration requests
      const promises = Array.from({ length: 5 }).map(() =>
        request(app).post('/api/auth/register').send(registrationPayload)
      );

      const results = await Promise.all(promises);

      const successCount = results.filter((r) => r.status === 201).length;
      const conflictCount = results.filter((r) => r.status === 409).length;

      expect(successCount).toBe(1);
      expect(conflictCount).toBe(4);

      const userRecords = await prisma.user.findMany({ where: { emailNormalized: email } });
      expect(userRecords.length).toBe(1);
    });
  });

  describe('Login & Single-Session Enforcement', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        fullName: 'Test Citizen',
        email: 'test@citizen.org',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'CITIZEN',
      });
    });

    it('authenticates with correct credentials and delivers HttpOnly cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@citizen.org',
          password: 'Password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('test@citizen.org');
      expect(res.headers['set-cookie']).toBeDefined();
      const cookieStr = res.headers['set-cookie'][0];
      expect(cookieStr).toContain('civic_session=');
      expect(cookieStr).toContain('HttpOnly');
    });

    it('rejects wrong password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@citizen.org',
          password: 'WrongPassword999',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password.');
    });

    it('rejects non-existent email with identical 401 message', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ghost@nonexistent.org',
          password: 'Password123',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password.');
    });

    it('rejects second login attempt with 409 when an active session exists', async () => {
      // 1st login from Client A
      const loginA = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@citizen.org', password: 'Password123' });

      expect(loginA.status).toBe(200);
      const cookieA = loginA.headers['set-cookie'][0];

      // 2nd login from Client B without logging out from Client A
      const loginB = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@citizen.org', password: 'Password123' });

      expect(loginB.status).toBe(409);
      expect(loginB.body.error).toMatch(/active session/i);

      // Verify Client A is still valid and authorized
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookieA);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe('test@citizen.org');
    });

    it('enforces single session under high parallel concurrency (parallel login race)', async () => {
      // 5 concurrent login requests for the same user at the exact same instant
      const loginPromises = Array.from({ length: 5 }).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({ email: 'test@citizen.org', password: 'Password123' })
      );

      const responses = await Promise.all(loginPromises);
      const successes = responses.filter((r) => r.status === 200);
      const conflicts = responses.filter((r) => r.status === 409);

      expect(successes.length).toBe(1);
      expect(conflicts.length).toBe(4);

      // Verify database physically contains only 1 active unrevoked session
      const activeSessions = await prisma.session.findMany({
        where: { revokedAt: null },
      });
      expect(activeSessions.length).toBe(1);
    });

    it('allows login again after user logs out and revokes server-side session', async () => {
      // 1st login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@citizen.org', password: 'Password123' });

      expect(loginRes.status).toBe(200);
      const cookie = loginRes.headers['set-cookie'][0];

      // Logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookie);

      expect(logoutRes.status).toBe(200);

      // Old cookie is now rejected with 401
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookie);
      expect(meRes.status).toBe(401);

      // User can now log in again from another device
      const reLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@citizen.org', password: 'Password123' });

      expect(reLoginRes.status).toBe(200);
      expect(reLoginRes.body.user.email).toBe('test@citizen.org');
    });
  });
});
