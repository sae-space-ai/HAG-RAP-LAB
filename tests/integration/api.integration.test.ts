/**
 * HAG-RAP Phase 1 — Integration Tests (HTTP API)
 * 
 * These tests use supertest to make real HTTP requests to the Express app.
 * They verify endpoints, response format, error handling, and persistence.
 * 
 * IMPORTANT: These tests require better-sqlite3 native module.
 * If the environment cannot compile native modules, these tests will be BLOCKED.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { createApp, createDependencies } from '../server/app';
import { seedSources, seedClaims, seedEvidenceLinks } from '../server/seed';

// Use a temporary database for tests
const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test-hagrap.db');

describe('HAG-RAP API Integration Tests', () => {
  let app: ReturnType<typeof createApp>;
  let deps: ReturnType<typeof createDependencies>;

  beforeAll(async () => {
    // Clean up any existing test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    deps = createDependencies(TEST_DB_PATH);
    await deps.storage.initialize();

    // Seed test data
    for (const source of seedSources) {
      await deps.storage.insertSource(source);
    }
    for (const claim of seedClaims) {
      await deps.storage.insertClaim(claim);
    }
    for (const link of seedEvidenceLinks) {
      await deps.storage.insertEvidenceLink(link);
    }

    app = createApp(deps);
  });

  afterAll(async () => {
    await deps.storage.close();
    // Clean up test database
    if (fs.existsSync(TEST_DB_PATH)) {
      try { fs.unlinkSync(TEST_DB_PATH); } catch {}
    }
  });

  // === TEST: Health endpoint ===
  it('GET /api/v1/health returns ok status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.version).toBeDefined();
    expect(res.body.runtime).toBe('NODE_EXPRESS_SQLITE');
    expect(res.body.dependencies.storage).toBe('SQLite_LOCAL');
    expect(res.body.dependencies.externalServices).toBe('NONE_CONNECTED');
  });

  // === TEST: Capabilities endpoint ===
  it('GET /api/v1/capabilities returns 7 components', async () => {
    const res = await request(app).get('/api/v1/capabilities');
    expect(res.status).toBe(200);
    expect(res.body.components).toHaveLength(7);
    expect(res.body.totalImplemented).toBe(1);
    expect(res.body.totalNotImplemented).toBe(6);
    
    const egm = res.body.components.find((c: any) => c.id === 'EGM');
    expect(egm.status).toBe('VERIFICADO_LOCAL');
  });

  // === TEST: Cases list ===
  it('GET /api/v1/cases returns synthetic cases', async () => {
    const res = await request(app).get('/api/v1/cases');
    expect(res.status).toBe(200);
    expect(res.body.classification).toBe('SYNTHETIC');
    expect(res.body.cases.length).toBeGreaterThanOrEqual(5);
    
    for (const c of res.body.cases) {
      expect(c.classification).toBe('SYNTHETIC');
    }
  });

  // === TEST: Case detail ===
  it('GET /api/v1/cases/CASE-001 returns case with claim and sources', async () => {
    const res = await request(app).get('/api/v1/cases/CASE-001');
    expect(res.status).toBe(200);
    expect(res.body.case.id).toBe('CASE-001');
    expect(res.body.claim).toBeDefined();
    expect(res.body.classification).toBe('SYNTHETIC');
  });

  // === TEST: Case not found ===
  it('GET /api/v1/cases/NONEXISTENT returns 404', async () => {
    const res = await request(app).get('/api/v1/cases/NONEXISTENT');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('CASE_NOT_FOUND');
  });

  // === TEST: Evaluate case — SUPPORTED ===
  it('POST /api/v1/evaluations with CASE-001 returns SUPPORTED', async () => {
    const res = await request(app)
      .post('/api/v1/evaluations')
      .send({ caseId: 'CASE-001', claimId: 'CLM-001' });
    
    expect(res.status).toBe(201);
    expect(res.body.classification).toBe('SYNTHETIC');
    expect(res.body.evaluation.verdict).toBe('SUPPORTED');
    expect(res.body.evaluation.decision).toBe('PROCEED');
    expect(res.body.evaluation.id).toBeDefined();
    expect(res.body.evaluation.inputsHash).toBeDefined();
  });

  // === TEST: Evaluate case — CONTRADICTED ===
  it('POST /api/v1/evaluations with CASE-002 returns CONTRADICTED', async () => {
    const res = await request(app)
      .post('/api/v1/evaluations')
      .send({ caseId: 'CASE-002', claimId: 'CLM-002' });
    
    expect(res.status).toBe(201);
    expect(res.body.evaluation.verdict).toBe('CONTRADICTED');
    expect(res.body.evaluation.decision).toBe('ABSTAIN');
  });

  // === TEST: Evaluate case — INSUFFICIENT_EVIDENCE ===
  it('POST /api/v1/evaluations with CASE-003 returns INSUFFICIENT_EVIDENCE', async () => {
    const res = await request(app)
      .post('/api/v1/evaluations')
      .send({ caseId: 'CASE-003', claimId: 'CLM-003' });
    
    expect(res.status).toBe(201);
    expect(res.body.evaluation.verdict).toBe('INSUFFICIENT_EVIDENCE');
    expect(res.body.evaluation.decision).toBe('ABSTAIN');
  });

  // === TEST: Evaluate with invalid input ===
  it('POST /api/v1/evaluations with invalid input returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/evaluations')
      .send({});
    
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
  });

  // === TEST: Retrieve persisted evaluation ===
  it('GET /api/v1/evaluations/:id returns persisted evaluation', async () => {
    // First create an evaluation
    const createRes = await request(app)
      .post('/api/v1/evaluations')
      .send({ caseId: 'CASE-001', claimId: 'CLM-001' });
    
    const evalId = createRes.body.evaluation.id;
    
    // Then retrieve it
    const getRes = await request(app).get(`/api/v1/evaluations/${evalId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.evaluation.id).toBe(evalId);
    expect(getRes.body.classification).toBe('SYNTHETIC');
  });

  // === TEST: Evaluation not found ===
  it('GET /api/v1/evaluations/NONEXISTENT returns 404', async () => {
    const res = await request(app).get('/api/v1/evaluations/NONEXISTENT');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('EVALUATION_NOT_FOUND');
  });

  // === TEST: Evaluations list ===
  it('GET /api/v1/evaluations returns list of evaluations', async () => {
    const res = await request(app).get('/api/v1/evaluations');
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThan(0);
    expect(Array.isArray(res.body.evaluations)).toBe(true);
  });

  // === TEST: Sources list ===
  it('GET /api/v1/sources returns synthetic sources', async () => {
    const res = await request(app).get('/api/v1/sources');
    expect(res.status).toBe(200);
    expect(res.body.classification).toBe('SYNTHETIC');
    expect(res.body.sources.length).toBeGreaterThan(0);
    for (const s of res.body.sources) {
      expect(s.synthetic).toBe(true);
    }
  });

  // === TEST: Claims list ===
  it('GET /api/v1/claims returns synthetic claims', async () => {
    const res = await request(app).get('/api/v1/claims');
    expect(res.status).toBe(200);
    expect(res.body.classification).toBe('SYNTHETIC');
    expect(res.body.claims.length).toBeGreaterThan(0);
  });

  // === TEST: Seed endpoint requires auth ===
  it('POST /api/v1/seed without token is accepted (no token configured)', async () => {
    const res = await request(app)
      .post('/api/v1/seed')
      .send({});
    
    // Without HAGRAP_DEV_TOKEN env var, seed is allowed
    expect(res.status).toBe(200);
    expect(res.body.idempotent).toBe(true);
  });

  // === TEST: Determinism ===
  it('Same input produces same verdict (determinism)', async () => {
    const res1 = await request(app)
      .post('/api/v1/evaluations')
      .send({ caseId: 'CASE-001', claimId: 'CLM-001' });
    
    const res2 = await request(app)
      .post('/api/v1/evaluations')
      .send({ caseId: 'CASE-001', claimId: 'CLM-001' });
    
    expect(res1.body.evaluation.verdict).toBe(res2.body.evaluation.verdict);
    expect(res1.body.evaluation.appliedRule).toBe(res2.body.evaluation.appliedRule);
    expect(res1.body.evaluation.inputsHash).toBe(res2.body.evaluation.inputsHash);
  });

  // === TEST: No secrets in error responses ===
  it('Error responses do not expose internal details', async () => {
    const res = await request(app).get('/api/v1/cases/NONEXISTENT');
    expect(res.body).not.toHaveProperty('stack');
    expect(res.body).not.toHaveProperty('internalError');
    expect(res.body).not.toHaveProperty('dbPath');
  });
});
