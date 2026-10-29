import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';
import { clearTestDatabase } from './setup';

describe('Problems, Solutions & Workflow Test Suite', () => {
  let citizenCookie: string;
  let citizenId: string;

  let universityCookie: string;
  let universityId: string;

  let industryCookie: string;
  let industryId: string;

  let govCookie: string;
  let govId: string;

  beforeEach(async () => {
    await clearTestDatabase();

    // Register all 4 stakeholders
    await request(app).post('/api/auth/register').send({
      fullName: 'Alice Citizen',
      email: 'alice@citizen.org',
      password: 'Password123',
      confirmPassword: 'Password123',
      role: 'CITIZEN',
    });

    await request(app).post('/api/auth/register').send({
      fullName: 'Dr Brown',
      email: 'brown@university.edu',
      password: 'Password123',
      confirmPassword: 'Password123',
      role: 'UNIVERSITY',
      organization: 'Tech Institute',
    });

    await request(app).post('/api/auth/register').send({
      fullName: 'Industry Lead',
      email: 'lead@industry.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      role: 'INDUSTRY',
      organization: 'Civic Infra Ltd',
    });

    await request(app).post('/api/auth/register').send({
      fullName: 'Officer Dave',
      email: 'dave@gov.state.in',
      password: 'Password123',
      confirmPassword: 'Password123',
      role: 'GOVERNMENT',
      organization: 'City Council',
    });

    // Login each to obtain active cookies
    const loginCitizen = await request(app).post('/api/auth/login').send({ email: 'alice@citizen.org', password: 'Password123' });
    citizenCookie = loginCitizen.headers['set-cookie'][0];
    citizenId = loginCitizen.body.user.id;

    const loginUni = await request(app).post('/api/auth/login').send({ email: 'brown@university.edu', password: 'Password123' });
    universityCookie = loginUni.headers['set-cookie'][0];
    universityId = loginUni.body.user.id;

    const loginInd = await request(app).post('/api/auth/login').send({ email: 'lead@industry.com', password: 'Password123' });
    industryCookie = loginInd.headers['set-cookie'][0];
    industryId = loginInd.body.user.id;

    const loginGov = await request(app).post('/api/auth/login').send({ email: 'dave@gov.state.in', password: 'Password123' });
    govCookie = loginGov.headers['set-cookie'][0];
    govId = loginGov.body.user.id;
  });

  afterAll(async () => {
    await clearTestDatabase();
    await prisma.$disconnect();
  });

  describe('Problem Lifecycle & Ownership', () => {
    it('allows a citizen to report a problem and ignores forged creatorId', async () => {
      const res = await request(app)
        .post('/api/problems')
        .set('Cookie', citizenCookie)
        .send({
          title: 'Dangerous Pothole on 5th Main Street',
          description: 'A massive crater on the roadway is causing severe vehicle accidents and traffic congestion.',
          category: 'INFRASTRUCTURE',
          location: '5th Main Road, Ward 12',
          priority: 'HIGH',
          creatorId: 'forged-fake-user-id', // Attacker trying to spoof author
        });

      expect(res.status).toBe(201);
      expect(res.body.problem).toBeDefined();
      expect(res.body.problem.creatorId).toBe(citizenId); // Ignored forged ID
      expect(res.body.problem.status).toBe('SUBMITTED');

      // Verify in DB
      const dbProblem = await prisma.problem.findUnique({ where: { id: res.body.problem.id } });
      expect(dbProblem).not.toBeNull();
      expect(dbProblem?.creatorId).toBe(citizenId);
    });

    it('prevents non-citizens from reporting problems', async () => {
      const res = await request(app)
        .post('/api/problems')
        .set('Cookie', govCookie)
        .send({
          title: 'Government Notice',
          description: 'This is an unauthorized attempt by government account to report a citizen problem.',
          category: 'INFRASTRUCTURE',
          location: 'City Hall',
          priority: 'LOW',
        });

      expect(res.status).toBe(403);
    });

    it('allows creator to edit own problem while in SUBMITTED status', async () => {
      const createRes = await request(app)
        .post('/api/problems')
        .set('Cookie', citizenCookie)
        .send({
          title: 'Original Title with Enough Chars',
          description: 'Original detailed description with plenty of characters to pass validation.',
          category: 'SANITATION',
          location: 'Downtown Market',
          priority: 'MEDIUM',
        });

      const problemId = createRes.body.problem.id;

      const patchRes = await request(app)
        .patch(`/api/problems/${problemId}`)
        .set('Cookie', citizenCookie)
        .send({
          title: 'Updated Title with Enough Chars',
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.problem.title).toBe('Updated Title with Enough Chars');
    });

    it('forbids other users from editing or deleting problems', async () => {
      const createRes = await request(app)
        .post('/api/problems')
        .set('Cookie', citizenCookie)
        .send({
          title: 'Citizen Private Issue',
          description: 'Detailed description about water leakage in residential apartment complex.',
          category: 'INFRASTRUCTURE',
          location: 'Sector 4',
          priority: 'LOW',
        });

      const problemId = createRes.body.problem.id;

      // University tries to edit
      const editRes = await request(app)
        .patch(`/api/problems/${problemId}`)
        .set('Cookie', universityCookie)
        .send({ title: 'Hacked Title' });
      expect(editRes.status).toBe(403);

      // University tries to delete
      const delRes = await request(app)
        .delete(`/api/problems/${problemId}`)
        .set('Cookie', universityCookie);
      expect(delRes.status).toBe(403);
    });
  });

  describe('Solutions & Support Matrix', () => {
    let testProblemId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/problems')
        .set('Cookie', citizenCookie)
        .send({
          title: 'Severe Waterlogging in Low-Lying Area',
          description: 'Every monsoon season the storm drains overflow, flooding ground floors of homes.',
          category: 'ENVIRONMENT',
          location: 'South Ward Basin',
          priority: 'CRITICAL',
        });
      testProblemId = res.body.problem.id;
    });

    it('allows University to submit a PROPOSAL and Industry to submit a RECOMMENDATION', async () => {
      // University Proposal
      const uniRes = await request(app)
        .post(`/api/problems/${testProblemId}/solutions`)
        .set('Cookie', universityCookie)
        .send({
          title: 'Permeable Concrete and Bio-swale Drainage Research',
          explanation: 'A sustainable drainage system using recycled aggregate permeable pavements to absorb stormwater runoff.',
          expectedBenefits: 'Reduces surface water flooding by up to 80% and recharges local aquifers.',
          implementationApproach: 'Phase 1: Soil percolation test. Phase 2: Pilot paving along 500m arterial roads.',
        });

      expect(uniRes.status).toBe(201);
      expect(uniRes.body.solution.type).toBe('PROPOSAL');
      expect(uniRes.body.solution.authorRole).toBe('UNIVERSITY');

      // Industry Recommendation
      const indRes = await request(app)
        .post(`/api/problems/${testProblemId}/solutions`)
        .set('Cookie', industryCookie)
        .send({
          title: 'Pre-Cast Modular Storm Water Channels',
          explanation: 'Factory-cured high capacity pre-cast trench systems installed with heavy machinery in 48 hours.',
          expectedBenefits: 'Immediate drainage capacity upgrade without weeks of road closure.',
          implementationApproach: 'Turnkey deployment with 5-year commercial maintenance contract.',
        });

      expect(indRes.status).toBe(201);
      expect(indRes.body.solution.type).toBe('RECOMMENDATION');
      expect(indRes.body.solution.authorRole).toBe('INDUSTRY');

      // Fetch problem detail and verify both solutions appear
      const detailRes = await request(app).get(`/api/problems/${testProblemId}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.problem.solutions.length).toBe(2);
    });

    it('allows Citizen to support a solution and toggles/enforces uniqueness', async () => {
      const solRes = await request(app)
        .post(`/api/problems/${testProblemId}/solutions`)
        .set('Cookie', universityCookie)
        .send({
          title: 'Academic Research Study for Filtration',
          explanation: 'In-depth study on bio-filtration ponds to naturally treat urban runoff before canal discharge.',
          expectedBenefits: 'Purifies runoff and prevents toxic silt accumulation.',
          implementationApproach: 'Implement small wetland vegetation basin at canal junction.',
        });

      const solutionId = solRes.body.solution.id;

      // 1st support: Upvote added
      const sup1 = await request(app)
        .post(`/api/solutions/${solutionId}/support`)
        .set('Cookie', citizenCookie);

      expect(sup1.status).toBe(201);
      expect(sup1.body.supported).toBe(true);
      expect(sup1.body.totalSupports).toBe(1);

      // 2nd call: Toggle removes upvote
      const sup2 = await request(app)
        .post(`/api/solutions/${solutionId}/support`)
        .set('Cookie', citizenCookie);

      expect(sup2.status).toBe(200);
      expect(sup2.body.supported).toBe(false);
      expect(sup2.body.totalSupports).toBe(0);
    });
  });

  describe('Government Workflow & Status State Machine', () => {
    let testProblemId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/problems')
        .set('Cookie', citizenCookie)
        .send({
          title: 'Broken Streetlights Near School Crossing',
          description: 'Dark crossing creates hazardous conditions for children during early morning and evening hours.',
          category: 'PUBLIC_SAFETY',
          location: 'Maple School Crossing',
          priority: 'HIGH',
        });
      testProblemId = res.body.problem.id;
    });

    it('enforces valid status transition sequence and rejects invalid jumps', async () => {
      // Invalid transition: SUBMITTED directly to RESOLVED must fail with 422
      const invalidJump = await request(app)
        .post(`/api/problems/${testProblemId}/status`)
        .set('Cookie', govCookie)
        .send({
          toStatus: 'RESOLVED',
          message: 'Trying to resolve without review.',
        });

      expect(invalidJump.status).toBe(422);

      // Valid transition 1: SUBMITTED -> UNDER_REVIEW
      const step1 = await request(app)
        .post(`/api/problems/${testProblemId}/status`)
        .set('Cookie', govCookie)
        .send({
          toStatus: 'UNDER_REVIEW',
          message: 'Field engineering team dispatched to inspect wiring.',
        });

      expect(step1.status).toBe(200);
      expect(step1.body.problem.status).toBe('UNDER_REVIEW');

      // Valid transition 2: UNDER_REVIEW -> IN_PROGRESS
      const step2 = await request(app)
        .post(`/api/problems/${testProblemId}/status`)
        .set('Cookie', govCookie)
        .send({
          toStatus: 'IN_PROGRESS',
          message: 'Contractor selected to replace damaged luminaires with high-efficiency LEDs.',
        });

      expect(step2.status).toBe(200);
      expect(step2.body.problem.status).toBe('IN_PROGRESS');

      // Valid transition 3: IN_PROGRESS -> RESOLVED
      const step3 = await request(app)
        .post(`/api/problems/${testProblemId}/status`)
        .set('Cookie', govCookie)
        .send({
          toStatus: 'RESOLVED',
          message: 'All 8 streetlights successfully installed, verified operational, and illumination certified.',
        });

      expect(step3.status).toBe(200);
      expect(step3.body.problem.status).toBe('RESOLVED');

      // Problem is in terminal state RESOLVED -> cannot transition further
      const step4 = await request(app)
        .post(`/api/problems/${testProblemId}/status`)
        .set('Cookie', govCookie)
        .send({
          toStatus: 'CLOSED',
          message: 'Trying to close a resolved problem.',
        });

      expect(step4.status).toBe(422);

      // Verify complete append-only audit trail matches DB records
      const detail = await request(app).get(`/api/problems/${testProblemId}`);
      expect(detail.status).toBe(200);
      // 1 initial creation update + 3 status transitions = 4 updates
      expect(detail.body.problem.updates.length).toBe(4);
      expect(detail.body.problem.updates[3].toStatus).toBe('RESOLVED');
    });

    it('rejects status transition attempts by non-government roles', async () => {
      const res = await request(app)
        .post(`/api/problems/${testProblemId}/status`)
        .set('Cookie', citizenCookie)
        .send({
          toStatus: 'UNDER_REVIEW',
          message: 'Citizen attempting to approve own problem.',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Real Dashboard Analytics', () => {
    it('returns accurate live statistics based strictly on database records', async () => {
      // Empty database state
      const emptyStats = await request(app).get('/api/dashboard/stats');
      expect(emptyStats.status).toBe(200);
      expect(emptyStats.body.summary.totalProblems).toBe(0);
      expect(emptyStats.body.summary.totalSolutions).toBe(0);

      // Create 1 problem
      await request(app)
        .post('/api/problems')
        .set('Cookie', citizenCookie)
        .send({
          title: 'Damaged Community Playground Swing',
          description: 'Playground swing chain snapped creating injury risk for neighborhood children.',
          category: 'PUBLIC_SAFETY',
          location: 'Oak Park Playground',
          priority: 'MEDIUM',
        });

      const updatedStats = await request(app).get('/api/dashboard/stats');
      expect(updatedStats.status).toBe(200);
      expect(updatedStats.body.summary.totalProblems).toBe(1);
      expect(updatedStats.body.statusBreakdown.SUBMITTED).toBe(1);
      expect(updatedStats.body.categoryBreakdown.PUBLIC_SAFETY).toBe(1);
    });
  });
});
