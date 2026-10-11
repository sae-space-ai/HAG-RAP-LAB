import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { SQLiteStorageAdapter } from '../server/storage';
import { EGMEngine } from '../server/engine';
import { DRELite, DRE_RULES } from '../server/dre';
import { createApp } from '../server/app';
import { seedSources, seedClaims, seedEvidenceLinks } from '../server/seed';

describe('Phase 2 DRE-Lite (synthetic-only bounded reasoning)', () => {
  let storage: SQLiteStorageAdapter;
  let dre: DRELite;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    storage = new SQLiteStorageAdapter(':memory:');
    await storage.initialize();
    for (const s of seedSources) await storage.insertSource(s);
    for (const c of seedClaims) await storage.insertClaim(c);
    for (const link of seedEvidenceLinks) await storage.insertEvidenceLink(link);
    const engine = new EGMEngine(storage);
    dre = new DRELite(storage, engine);
    app = createApp({ storage, engine });
  });
  afterAll(async () => { await storage.close(); });

  it('has four explicit immutable, bounded rule descriptions', () => {
    expect(DRE_RULES).toHaveLength(4);
  });
  it('entails IN_RANGE with reproducible 2-step trace and source provenance', async () => {
    const r = await dre.evaluate({ claimId: 'CLM-001', hypothesis: { predicate: 'synthetic_temperature_band', value: 'IN_RANGE' } });
    expect(r.verdict).toBe('ENTAILED');
    expect(r.decision).toBe('PROCEED');
    expect(r.trace.map(s => s.ruleId)).toEqual(['DRE-R01-IN-BAND', 'DRE-R03-LOW']);
    expect(new Set(r.references.map(x => x.sourceId)).size).toBeGreaterThanOrEqual(2);
    expect(r.references.every(x => x.evidenceLinkIds.length > 0 && x.provenanceHashes.length > 0)).toBe(true);
  });
  it('proves two-step inference for synthetic review priority', async () => {
    const r = await dre.evaluate({ claimId: 'CLM-001', hypothesis: { predicate: 'synthetic_review_priority', value: 'LOW' } });
    expect(r.verdict).toBe('ENTAILED');
    expect(r.trace[1].premises[0]).toEqual(r.trace[0].conclusion);
  });
  it('refutes counter-hypothesis without authorizing an action', async () => {
    const r = await dre.evaluate({ claimId: 'CLM-001', hypothesis: { predicate: 'synthetic_temperature_band', value: 'OUT_OF_RANGE' } });
    expect(r.verdict).toBe('CONTRADICTED');
    expect(r.decision).toBe('ABSTAIN');
  });
  it('abstains if EGM finds inconsistent evidence', async () => {
    const r = await dre.evaluate({ claimId: 'CLM-002', hypothesis: { predicate: 'synthetic_review_priority', value: 'REVIEW' } });
    expect(r.verdict).toBe('INCONSISTENT_EVIDENCE');
    expect(r.trace).toHaveLength(0);
    expect(r.decision).toBe('ABSTAIN');
  });
  it('abstains if EGM evidence is insufficient', async () => {
    const r = await dre.evaluate({ claimId: 'CLM-003', hypothesis: { predicate: 'synthetic_temperature_band', value: 'OUT_OF_RANGE' } });
    expect(r.verdict).toBe('UNDETERMINED');
    expect(r.decision).toBe('ABSTAIN');
  });
  it('abstains on derivative-only source', async () => {
    const r = await dre.evaluate({ claimId: 'CLM-006', hypothesis: { predicate: 'synthetic_temperature_band', value: 'IN_RANGE' } });
    expect(r.verdict).toBe('UNDETERMINED');
  });
  it('treats missing reference as an error, never a premise', async () => {
    const r = await dre.evaluate({ claimId: 'CLM-004', hypothesis: { predicate: 'synthetic_review_priority', value: 'LOW' } });
    expect(r.verdict).toBe('ERROR');
    expect(r.decision).toBe('ABSTAIN');
  });
  it('does not conflate different time periods', async () => {
    const r = await dre.evaluate({ claimId: 'CLM-007', hypothesis: { predicate: 'synthetic_temperature_band', value: 'OUT_OF_RANGE' } });
    expect(r.verdict).toBe('UNDETERMINED');
  });
  it('repeats the same hypothesis with an identical trace hash', async () => {
    const input = { claimId: 'CLM-001', hypothesis: { predicate: 'synthetic_review_priority' as const, value: 'LOW' as const } };
    const a = await dre.evaluate(input);
    const b = await dre.evaluate(input);
    expect(a.inputHash).toBe(b.inputHash);
    expect(a.traceHash).toBe(b.traceHash);
    expect(a.egm.evaluationId).not.toBe(b.egm.evaluationId);
  });
  it('HTTP rules endpoint lists actual supported rules only', async () => {
    const r = await request(app).get('/api/v1/dre/rules');
    expect(r.status).toBe(200);
    expect(r.body.rules).toHaveLength(4);
    expect(r.body.causalInference).toBe(false);
  });
  it('HTTP endpoint returns actual inference and provenance', async () => {
    const r = await request(app).post('/api/v1/dre/evaluate').send({
      claimId: 'CLM-001', hypothesis: { predicate: 'synthetic_review_priority', value: 'LOW' }
    });
    expect(r.status).toBe(201);
    expect(r.body.result.verdict).toBe('ENTAILED');
    expect(r.body.result.trace).toHaveLength(2);
  });
  it('rejects malformed, unrelated and oversized payloads', async () => {
    for (const body of [
      {}, { claimId: 'X'.repeat(300), hypothesis: { predicate: 'synthetic_temperature_band', value: 'IN_RANGE' } },
      { claimId: 'CLM-001', hypothesis: { predicate: 'arbitrary', value: 'WIN' } },
      { claimId: 'CLM-001', hypothesis: { predicate: 'synthetic_review_priority', value: 'IN_RANGE' } }
    ]) {
      const r = await request(app).post('/api/v1/dre/evaluate').send(body);
      expect(r.status).toBe(400);
      expect(r.body.code).toBe('DRE_INVALID_INPUT');
    }
  });
  it('does not create unsupported new claims in persistent storage', async () => {
    const before = await storage.getAllClaims();
    await dre.evaluate({ claimId: 'CLM-001', hypothesis: { predicate: 'synthetic_review_priority', value: 'LOW' } });
    const after = await storage.getAllClaims();
    expect(after).toEqual(before);
  });
});
