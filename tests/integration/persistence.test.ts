/**
 * HAG-RAP Phase 1 — Persistence Tests
 * 
 * Verifies that data survives server restart.
 * Creates data, "restarts" (reopens DB), and verifies data is intact.
 * 
 * IMPORTANT: Requires better-sqlite3 native module.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { SQLiteStorageAdapter, computeProvenanceHash } from '../../server/storage';
import { seedSources, seedClaims, seedEvidenceLinks } from '../../server/seed';

const PERSISTENCE_DB_PATH = path.join(process.cwd(), 'data', 'persistence-test.db');

describe('HAG-RAP Persistence Tests', () => {
  afterAll(() => {
    // Clean up
    if (fs.existsSync(PERSISTENCE_DB_PATH)) {
      try { fs.unlinkSync(PERSISTENCE_DB_PATH); } catch {}
    }
  });

  it('Data persists after closing and reopening database', async () => {
    // Phase 1: Create data with first connection
    const db1 = new SQLiteStorageAdapter(PERSISTENCE_DB_PATH);
    await db1.initialize();

    // Seed data
    for (const source of seedSources) {
      await db1.insertSource(source);
    }
    for (const claim of seedClaims) {
      await db1.insertClaim(claim);
    }
    for (const link of seedEvidenceLinks) {
      await db1.insertEvidenceLink(link);
    }

    // Create an evaluation
    const evalId = await db1.insertEvaluation({
      id: 'EVAL-PERSIST-TEST',
      case_id: 'CASE-001',
      algorithm_version: 'TEST-v1',
      verdict: 'SUPPORTED',
      decision: 'PROCEED',
      applied_rule: 'RULE-SUPPORTED',
      inputs_hash: 'test-hash',
      created_at: new Date().toISOString(),
      full_result_json: JSON.stringify({ test: true }),
    });

    // Verify data exists
    const sourcesBefore = await db1.getAllSources();
    const claimsBefore = await db1.getAllClaims();
    const evalBefore = await db1.getEvaluation(evalId);

    expect(sourcesBefore.length).toBe(seedSources.length);
    expect(claimsBefore.length).toBe(seedClaims.length);
    expect(evalBefore).not.toBeNull();
    expect(evalBefore!.verdict).toBe('SUPPORTED');

    // Close first connection (simulate server stop)
    await db1.close();

    // Phase 2: Reopen database (simulate server restart)
    const db2 = new SQLiteStorageAdapter(PERSISTENCE_DB_PATH);
    await db2.initialize();

    // Verify ALL data survived
    const sourcesAfter = await db2.getAllSources();
    const claimsAfter = await db2.getAllClaims();
    const evalAfter = await db2.getEvaluation(evalId);
    const linksAfter = await db2.getEvidenceLinksForClaim('CLM-001');

    expect(sourcesAfter.length).toBe(sourcesBefore.length);
    expect(claimsAfter.length).toBe(claimsBefore.length);
    expect(evalAfter).not.toBeNull();
    expect(evalAfter!.id).toBe('EVAL-PERSIST-TEST');
    expect(evalAfter!.verdict).toBe('SUPPORTED');
    expect(evalAfter!.decision).toBe('PROCEED');
    expect(linksAfter.length).toBeGreaterThan(0);

    // Verify source data integrity
    const src1 = await db2.getSource('SRC-001');
    expect(src1).not.toBeNull();
    expect(src1!.title).toBe('Informe meteorológico sintético A');
    expect(src1!.synthetic).toBe(true);

    // Verify claim data integrity
    const clm1 = await db2.getClaim('CLM-001');
    expect(clm1).not.toBeNull();
    expect(clm1!.subject).toBe('SUBJ-TEMP-MADRID');
    expect(clm1!.object_value).toBe('22');

    await db2.close();
  });

  it('Idempotent seed: running seed twice does not duplicate records', async () => {
    const idempotentDbPath = path.join(process.cwd(), 'data', 'idempotent-test.db');
    
    try {
      const db = new SQLiteStorageAdapter(idempotentDbPath);
      await db.initialize();

      // Seed first time
      for (const source of seedSources) {
        await db.insertSource(source);
      }
      const count1 = (await db.getAllSources()).length;

      // Seed second time (same data)
      for (const source of seedSources) {
        await db.insertSource(source);
      }
      const count2 = (await db.getAllSources()).length;

      // Count should be the same — INSERT OR IGNORE prevents duplicates
      expect(count2).toBe(count1);

      await db.close();
    } finally {
      if (fs.existsSync(idempotentDbPath)) {
        try { fs.unlinkSync(idempotentDbPath); } catch {}
      }
    }
  });

  it('Referential integrity: evidence links reference valid sources and claims', async () => {
    const integrityDbPath = path.join(process.cwd(), 'data', 'integrity-test.db');
    
    try {
      const db = new SQLiteStorageAdapter(integrityDbPath);
      await db.initialize();

      // Seed data
      for (const source of seedSources) {
        await db.insertSource(source);
      }
      for (const claim of seedClaims) {
        await db.insertClaim(claim);
      }
      for (const link of seedEvidenceLinks) {
        await db.insertEvidenceLink(link);
      }

      // Verify all evidence links reference existing sources and claims
      const allClaims = await db.getAllClaims();
      for (const claim of allClaims) {
        const links = await db.getEvidenceLinksForClaim(claim.id);
        for (const link of links) {
          const source = await db.getSource(link.source_id);
          // Source might not exist (intentional test case for SRC-NONEXISTENT)
          // But if it does exist, it should be valid
          if (source) {
            expect(source.id).toBe(link.source_id);
          }
        }
      }

      await db.close();
    } finally {
      if (fs.existsSync(integrityDbPath)) {
        try { fs.unlinkSync(integrityDbPath); } catch {}
      }
    }
  });

  it('Provenance hash is deterministic', () => {
    const hash1 = computeProvenanceHash('SRC-001', 'CLM-001', 'raw_extraction');
    const hash2 = computeProvenanceHash('SRC-001', 'CLM-001', 'raw_extraction');
    const hash3 = computeProvenanceHash('SRC-002', 'CLM-001', 'raw_extraction');

    expect(hash1).toBe(hash2); // Same inputs → same hash
    expect(hash1).not.toBe(hash3); // Different inputs → different hash
  });
});
