/**
 * HAG-RAP Phase 1 — EGM Engine Unit Tests
 * 
 * Tests the server-side EGM engine with SQLite storage.
 * Covers all evaluation rules, determinism, and error handling.
 * 
 * IMPORTANT: Requires better-sqlite3 native module.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { SQLiteStorageAdapter, computeInputsHash, computeProvenanceHash, computeEventHash } from '../server/storage';
import { EGMEngine, ALGORITHM_VERSION } from '../server/engine';
import { seedSources, seedClaims, seedEvidenceLinks } from '../server/seed';

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'engine-test.db');

describe('EGM Engine Unit Tests', () => {
  let storage: SQLiteStorageAdapter;
  let engine: EGMEngine;

  beforeAll(async () => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    storage = new SQLiteStorageAdapter(TEST_DB_PATH);
    await storage.initialize();
    engine = new EGMEngine(storage);

    // Seed data
    for (const source of seedSources) {
      await storage.insertSource(source);
    }
    for (const claim of seedClaims) {
      await storage.insertClaim(claim);
    }
    for (const link of seedEvidenceLinks) {
      await storage.insertEvidenceLink(link);
    }
  });

  afterAll(async () => {
    await storage.close();
    if (fs.existsSync(TEST_DB_PATH)) {
      try { fs.unlinkSync(TEST_DB_PATH); } catch {}
    }
  });

  // === TEST 1: Concordant sources → SUPPORTED ===
  it('Test 1: Independent concordant sources produce SUPPORTED', async () => {
    const result = await engine.evaluate({ claimId: 'CLM-001', caseId: 'CASE-001' });
    expect(result.verdict).toBe('SUPPORTED');
    expect(result.decision).toBe('PROCEED');
    expect(result.appliedRule).toBe('RULE-SUPPORTED');
    expect(result.algorithmVersion).toBe(ALGORITHM_VERSION);
  });

  // === TEST 2: Contradictory sources → CONTRADICTED ===
  it('Test 2: Contradictory sources produce CONTRADICTED and ABSTAIN', async () => {
    const result = await engine.evaluate({ claimId: 'CLM-002', caseId: 'CASE-002' });
    expect(result.verdict).toBe('CONTRADICTED');
    expect(result.decision).toBe('ABSTAIN');
    expect(result.appliedRule).toBe('RULE-CONTRADICTED');
  });

  // === TEST 3: No evidence → INSUFFICIENT_EVIDENCE ===
  it('Test 3: No evidence links produce INSUFFICIENT_EVIDENCE and ABSTAIN', async () => {
    const result = await engine.evaluate({ claimId: 'CLM-003', caseId: 'CASE-003' });
    expect(result.verdict).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.decision).toBe('ABSTAIN');
    expect(result.appliedRule).toBe('RULE-INSUFFICIENT');
  });

  // === TEST 4: Missing source reference → ERROR ===
  it('Test 4: Missing source reference produces ERROR', async () => {
    const result = await engine.evaluate({ claimId: 'CLM-004', caseId: 'CASE-004' });
    expect(result.verdict).toBe('ERROR');
    expect(result.decision).toBe('ABSTAIN');
    expect(result.appliedRule).toContain('RULE-ERR');
  });

  // === TEST 5: Determinism ===
  it('Test 5: Same inputs produce same verdict (determinism)', async () => {
    const r1 = await engine.evaluate({ claimId: 'CLM-001', caseId: 'CASE-001' });
    const r2 = await engine.evaluate({ claimId: 'CLM-001', caseId: 'CASE-001' });
    expect(r1.verdict).toBe(r2.verdict);
    expect(r1.appliedRule).toBe(r2.appliedRule);
    expect(r1.inputsHash).toBe(r2.inputsHash);
  });

  // === TEST 6: Non-existent claim ===
  it('Test 6: Non-existent claim produces ERROR', async () => {
    const result = await engine.evaluate({ claimId: 'CLM-NONEXISTENT' });
    expect(result.verdict).toBe('ERROR');
    expect(result.appliedRule).toContain('CLAIM_NOT_FOUND');
  });

  // === TEST 7: Invalid input ===
  it('Test 7: No claimId and no subject/predicate produces ERROR', async () => {
    const result = await engine.evaluate({});
    expect(result.verdict).toBe('ERROR');
    expect(result.appliedRule).toContain('INVALID_INPUT');
  });

  // === TEST 8: SYNTHETIC labeling ===
  it('Test 8: All sources are marked SYNTHETIC', async () => {
    const sources = await storage.getAllSources();
    for (const s of sources) {
      expect(s.synthetic).toBe(true);
    }
  });

  // === TEST 9: Evaluations are persisted ===
  it('Test 9: Evaluations are persisted in storage', async () => {
    const allEvals = await storage.getAllEvaluations();
    expect(allEvals.length).toBeGreaterThan(0);
    
    // Verify we can retrieve a specific evaluation
    const evals = allEvals.filter(e => e.case_id === 'CASE-001');
    expect(evals.length).toBeGreaterThan(0);
  });

  // === TEST 10: Inputs hash is deterministic ===
  it('Test 10: Inputs hash is deterministic', () => {
    const h1 = computeInputsHash({ claimId: 'CLM-001', version: 'v1' });
    const h2 = computeInputsHash({ claimId: 'CLM-001', version: 'v1' });
    const h3 = computeInputsHash({ claimId: 'CLM-002', version: 'v1' });
    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
  });

  // === TEST 11: Provenance hash ===
  it('Test 11: Provenance hash is deterministic', () => {
    const h1 = computeProvenanceHash('SRC-001', 'CLM-001', 'raw');
    const h2 = computeProvenanceHash('SRC-001', 'CLM-001', 'raw');
    expect(h1).toBe(h2);
  });

  // === TEST 12: Event hash chain ===
  it('Test 12: Event hash computation is deterministic', () => {
    const event1 = {
      id: 'EVT-001',
      action: 'create',
      entity_type: 'evaluation',
      entity_id: 'EVAL-001',
      actor_identifier: 'system',
      previous_hash: null,
      occurred_at: '2025-01-15T10:00:00Z',
    };
    const h1 = computeEventHash(event1);
    const h2 = computeEventHash(event1);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]+$/);
  });

  // === TEST 13: Derivative source detection ===
  it('Test 13: Derivative source (CLM-006) has correct provenance', async () => {
    const links = await storage.getEvidenceLinksForClaim('CLM-006');
    expect(links.length).toBe(1);
    expect(links[0].transformation).toContain('derived_from');
  });

  // === TEST 14: Audit chain verification ===
  it('Test 14: Audit chain verification works on empty chain', async () => {
    const result = await storage.verifyAuditChain();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // === TEST 15: Algorithm version constant ===
  it('Test 15: Algorithm version is consistent', () => {
    expect(ALGORITHM_VERSION).toBe('EGM-PERSISTENT-v1.0.0');
  });
});
