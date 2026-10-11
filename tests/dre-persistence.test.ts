import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { SQLiteStorageAdapter } from '../server/storage';
import { EGMEngine } from '../server/engine';
import { DRELite, verifyDRETrace } from '../server/dre';
import { createApp } from '../server/app';
import { seedSources, seedClaims, seedEvidenceLinks } from '../server/seed';

async function seed(storage: SQLiteStorageAdapter) {
  await storage.initialize();
  for (const source of seedSources) await storage.insertSource(source);
  for (const claim of seedClaims) await storage.insertClaim(claim);
  for (const link of seedEvidenceLinks) await storage.insertEvidenceLink(link);
}

describe('Phase 2.1 — persisted DRE inference, conservative uncertainty and provenance integrity', () => {
  let storage: SQLiteStorageAdapter;
  let dre: DRELite;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    storage = new SQLiteStorageAdapter(':memory:');
    await seed(storage);
    const engine = new EGMEngine(storage);
    dre = new DRELite(storage, engine);
    app = createApp({ storage, engine });
  });
  afterAll(async () => { await storage.close(); });

  it('persists EGM-linked DRE inference and independently verifies its digest', async () => {
    const r = await dre.evaluate({ claimId: 'CLM-001', hypothesis: { predicate: 'synthetic_review_priority', value: 'LOW' } });
    const stored = await storage.getDRETrace(r.id);
    expect(stored).not.toBeNull();
    expect(stored?.egm_evaluation_id).toBe(r.egm.evaluationId);
    expect(stored?.trace_hash).toBe(r.traceHash);
    expect(stored?.claim_id).toBe('CLM-001');
    expect(verifyDRETrace(JSON.parse(stored!.full_result_json))).toBe(true);
    expect(r.limits.persistentDRETrace).toBe(true);
    expect(r.uncertainty).toEqual({ kind: 'CORROBORATED', calibratedProbability: false });
    expect(await storage.getEvaluation(r.egm.evaluationId)).not.toBeNull();
  });

  it('returns a stored trace over HTTP, and exposes no fictional confidence probability', async () => {
    const post = await request(app).post('/api/v1/dre/evaluate')
      .send({ claimId: 'CLM-001', hypothesis: { predicate: 'synthetic_temperature_band', value: 'IN_RANGE' } });
    expect(post.status).toBe(201);
    const id = post.body.result.id;
    const get = await request(app).get('/api/v1/dre/evaluations/' + id);
    expect(get.status).toBe(200);
    expect(get.body.integrityValid).toBe(true);
    expect(get.body.result.id).toBe(id);
    expect(get.body.result.uncertainty.calibratedProbability).toBe(false);
    expect(get.body.result.trace).toHaveLength(2);
  });

  it('exposes bounded persisted history', async () => {
    const get = await request(app).get('/api/v1/dre/evaluations');
    expect(get.status).toBe(200);
    expect(get.body.count).toBeGreaterThan(0);
    expect(get.body.evaluations.every((e: {id: string}) => e.id.startsWith('DRE-EVAL-'))).toBe(true);
  });

  it('returns 400 for malformed ID and 404 for absent stored inference', async () => {
    const malformed = await request(app).get('/api/v1/dre/evaluations/bad');
    expect(malformed.status).toBe(400);
    const missing = await request(app).get('/api/v1/dre/evaluations/DRE-EVAL-AAAAAAAA');
    expect(missing.status).toBe(404);
  });

  it('persists safe ERROR/ABSTAIN for a missing claim without breaking SQLite FKs', async () => {
    const r = await dre.evaluate({ claimId: 'CLM-MISSING', hypothesis: { predicate: 'synthetic_review_priority', value: 'LOW' } });
    expect(r.verdict).toBe('ERROR');
    expect(r.decision).toBe('ABSTAIN');
    expect(r.uncertainty.kind).toBe('INVALID');
    const saved = await storage.getDRETrace(r.id);
    expect(saved?.claim_id).toBeNull();
    expect(await storage.getEvaluation(r.egm.evaluationId)).not.toBeNull();
  });

  it('classifies contradictory evidence and insufficiency without numeric probabilities', async () => {
    const hypothesis = { predicate: 'synthetic_review_priority' as const, value: 'LOW' as const };
    const contradictory = await dre.evaluate({ claimId: 'CLM-002', hypothesis });
    expect(contradictory.uncertainty.kind).toBe('CONFLICTING');
    expect(contradictory.decision).toBe('ABSTAIN');
    const insufficient = await dre.evaluate({ claimId: 'CLM-003', hypothesis });
    expect(insufficient.uncertainty.kind).toBe('INSUFFICIENT');
    expect(insufficient.decision).toBe('ABSTAIN');
    expect(verifyDRETrace(contradictory)).toBe(true);
  });

  it('persists after closing and reopening the database and EGM/DRE instances', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hag-dre-restart-'));
    const filename = path.join(dir, 'dre.sqlite');
    let first: SQLiteStorageAdapter | undefined;
    let second: SQLiteStorageAdapter | undefined;
    try {
      first = new SQLiteStorageAdapter(filename);
      await seed(first);
      const dre1 = new DRELite(first, new EGMEngine(first));
      const old = await dre1.evaluate({ claimId: 'CLM-001', hypothesis: { predicate: 'synthetic_review_priority', value: 'LOW' } });
      await first.close(); first = undefined;

      second = new SQLiteStorageAdapter(filename);
      await second.initialize();
      const restored = await second.getDRETrace(old.id);
      expect(restored?.egm_evaluation_id).toBe(old.egm.evaluationId);
      expect(verifyDRETrace(JSON.parse(restored!.full_result_json))).toBe(true);
      const response = await request(createApp({ storage: second, engine: new EGMEngine(second) }))
        .get('/api/v1/dre/evaluations/' + old.id);
      expect(response.status).toBe(200);
      expect(response.body.integrityValid).toBe(true);
    } finally {
      if (first) await first.close();
      if (second) await second.close();
      fs.rmSync(dir, { force: true, recursive: true });
    }
  });

  it('returns 409 rather than trusting a tampered SQLite DRE trace', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hag-dre-tamper-'));
    const filename = path.join(dir, 'dre.sqlite');
    let storage2: SQLiteStorageAdapter | undefined;
    try {
      storage2 = new SQLiteStorageAdapter(filename);
      await seed(storage2);
      const old = await new DRELite(storage2, new EGMEngine(storage2)).evaluate({
        claimId: 'CLM-001', hypothesis: { predicate: 'synthetic_review_priority', value: 'LOW' },
      });
      await storage2.close(); storage2 = undefined;
      const raw = new Database(filename);
      const oldPayload = JSON.parse((raw.prepare('SELECT full_result_json FROM dre_traces WHERE id = ?').get(old.id) as {full_result_json: string}).full_result_json);
      oldPayload.verdict = 'CONTRADICTED';
      raw.prepare('UPDATE dre_traces SET full_result_json = ? WHERE id = ?').run(JSON.stringify(oldPayload), old.id);
      raw.close();

      storage2 = new SQLiteStorageAdapter(filename);
      await storage2.initialize();
      const response = await request(createApp({ storage: storage2, engine: new EGMEngine(storage2) }))
        .get('/api/v1/dre/evaluations/' + old.id);
      expect(response.status).toBe(409);
      expect(response.body.code).toBe('DRE_INTEGRITY_ERROR');
    } finally {
      if (storage2) await storage2.close();
      fs.rmSync(dir, { force: true, recursive: true });
    }
  });
});
