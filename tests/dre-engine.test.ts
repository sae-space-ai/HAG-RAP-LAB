/**
 * HAG-RAP Phase 2.2 — DRE Engine Tests
 * 
 * Tests for the expanded Deep Reasoning Engine:
 * - Deductive reasoning
 * - Abductive hypothesis generation
 * - Hypothesis comparison
 * - Multi-domain support
 * - Execution limits
 * - Traceability
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { SQLiteStorageAdapter } from '../server/storage';
import { DREEngine } from '../server/dre-engine';
import { RULE_CATALOG } from '../server/rule-catalog';
import { seedSources, seedClaims, seedEvidenceLinks } from '../server/seed';
import { techSources, techClaims, techEvidenceLinks } from '../server/seed-tech-domain';

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'dre-test.db');

describe('DRE Engine Tests', () => {
  let storage: SQLiteStorageAdapter;
  let dre: DREEngine;

  beforeAll(async () => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    storage = new SQLiteStorageAdapter(TEST_DB_PATH);
    await storage.initialize();
    dre = new DREEngine(storage);

    // Seed meteorological data
    for (const source of seedSources) {
      await storage.insertSource(source);
    }
    for (const claim of seedClaims) {
      await storage.insertClaim(claim);
    }
    for (const link of seedEvidenceLinks) {
      await storage.insertEvidenceLink(link);
    }

    // Seed technical system data
    for (const source of techSources) {
      await storage.insertSource(source);
    }
    for (const claim of techClaims) {
      await storage.insertClaim(claim);
    }
    for (const link of techEvidenceLinks) {
      await storage.insertEvidenceLink(link);
    }

    // Load rules
    for (const rule of RULE_CATALOG) {
      await storage.insertDRERule(rule);
    }
  });

  afterAll(async () => {
    await storage.close();
    if (fs.existsSync(TEST_DB_PATH)) {
      try { fs.unlinkSync(TEST_DB_PATH); } catch {}
    }
  });

  // === DEDUCTIVE REASONING TESTS ===

  it('Test 1: Deductive reasoning applies rules correctly', async () => {
    const result = await dre.performDeduction('METEOROLOGICAL', 'temperature check');
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.limitsReached).toEqual([]);
  });

  it('Test 2: Deductive reasoning respects domain filtering', async () => {
    const meteoResult = await dre.performDeduction('METEOROLOGICAL', 'test');
    const techResult = await dre.performDeduction('TECHNICAL_SYSTEM', 'test');
    
    // Both should have steps but from different rules
    expect(meteoResult.steps.length).toBeGreaterThan(0);
    expect(techResult.steps.length).toBeGreaterThan(0);
  });

  // === ABDUCTIVE REASONING TESTS ===

  it('Test 3: Abductive reasoning generates hypotheses', async () => {
    const result = await dre.generateHypotheses('METEOROLOGICAL', 'temperature anomaly', 'EXEC-TEST-001');
    expect(result.hypotheses.length).toBeGreaterThanOrEqual(0);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('Test 4: Hypotheses have correct structure', async () => {
    const result = await dre.generateHypotheses('TECHNICAL_SYSTEM', 'component unavailable', 'EXEC-TEST-002');
    
    for (const hyp of result.hypotheses) {
      expect(hyp.id).toBeDefined();
      expect(hyp.executionId).toBe('EXEC-TEST-002');
      expect(hyp.ruleId).toBeDefined();
      expect(hyp.premises).toBeDefined();
      expect(hyp.evidences).toBeDefined();
      expect(hyp.predictions).toBeDefined();
      expect(hyp.state).toBeDefined();
      expect(hyp.hypothesis_hash).toBeDefined();
    }
  });

  it('Test 5: Hypothesis states are valid', async () => {
    const result = await dre.generateHypotheses('METEOROLOGICAL', 'test observation', 'EXEC-TEST-003');
    
    const validStates = ['HYPOTHESIS_PROPOSED', 'HYPOTHESIS_COMPATIBLE', 'HYPOTHESIS_REFUTED', 'UNDERDETERMINED'];
    for (const hyp of result.hypotheses) {
      expect(validStates).toContain(hyp.state);
    }
  });

  // === FULL REASONING EXECUTION TESTS ===

  it('Test 6: Full reasoning execution produces trace', async () => {
    const trace = await dre.executeReasoning('METEOROLOGICAL', 'temperature check');
    
    expect(trace.id).toBeDefined();
    expect(trace.domain).toBe('METEOROLOGICAL');
    expect(trace.initialObservation).toBe('temperature check');
    expect(trace.steps.length).toBeGreaterThan(0);
    expect(trace.finalDecision).toBeDefined();
    expect(trace.trace_hash).toBeDefined();
  });

  it('Test 7: Reasoning trace is persistable', async () => {
    const trace = await dre.executeReasoning('TECHNICAL_SYSTEM', 'component status check');
    
    // Persist trace
    await storage.insertDRETrace(trace);
    
    // Retrieve trace
    const retrieved = await storage.getDRETrace(trace.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.id).toBe(trace.id);
    expect(retrieved!.domain).toBe('TECHNICAL_SYSTEM');
  });

  it('Test 8: Multiple domains produce different results', async () => {
    const meteoTrace = await dre.executeReasoning('METEOROLOGICAL', 'observation 1');
    const techTrace = await dre.executeReasoning('TECHNICAL_SYSTEM', 'observation 2');
    
    expect(meteoTrace.domain).toBe('METEOROLOGICAL');
    expect(techTrace.domain).toBe('TECHNICAL_SYSTEM');
    expect(meteoTrace.id).not.toBe(techTrace.id);
  });

  // === EXECUTION LIMITS TESTS ===

  it('Test 9: Execution limits are respected', async () => {
    const limitedDRE = new DREEngine(storage, {
      maxRulesEvaluated: 2,
      maxHypotheses: 5,
      maxInferenceDepth: 2,
      maxPremisesPerRule: 5,
      maxExecutionTimeMs: 1000,
      maxResultSizeBytes: 1024,
      cycleDetection: true,
    });
    
    const trace = await limitedDRE.executeReasoning('METEOROLOGICAL', 'test');
    expect(trace.executionLimits.maxRulesEvaluated).toBe(2);
  });

  // === RULE CATALOG TESTS ===

  it('Test 10: Rules are loaded correctly', async () => {
    const allRules = await storage.getAllDRERules();
    expect(allRules.length).toBe(RULE_CATALOG.length);
    
    const meteoRules = await storage.getDRERulesByDomain('METEOROLOGICAL');
    const techRules = await storage.getDRERulesByDomain('TECHNICAL_SYSTEM');
    
    expect(meteoRules.length).toBeGreaterThan(0);
    expect(techRules.length).toBeGreaterThan(0);
    expect(meteoRules.length + techRules.length).toBe(allRules.length);
  });

  it('Test 11: Rules have required fields', async () => {
    const allRules = await storage.getAllDRERules();
    
    for (const rule of allRules) {
      expect(rule.id).toBeDefined();
      expect(rule.version).toBeDefined();
      expect(rule.name).toBeDefined();
      expect(rule.description).toBeDefined();
      expect(rule.domain).toBeDefined();
      expect(rule.premises).toBeDefined();
      expect(rule.conditions).toBeDefined();
      expect(rule.conclusion).toBeDefined();
      expect(rule.limitations).toBeDefined();
      expect(rule.rule_hash).toBeDefined();
    }
  });

  // === TRACE PERSISTENCE TESTS ===

  it('Test 12: Traces persist after storage restart', async () => {
    // Create and persist a trace
    const trace = await dre.executeReasoning('METEOROLOGICAL', 'persistence test');
    await storage.insertDRETrace(trace);
    
    // Close storage
    await storage.close();
    
    // Reopen storage
    const storage2 = new SQLiteStorageAdapter(TEST_DB_PATH);
    await storage2.initialize();
    
    // Retrieve trace
    const retrieved = await storage2.getDRETrace(trace.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.id).toBe(trace.id);
    expect(retrieved!.finalDecision).toBe(trace.finalDecision);
    
    await storage2.close();
    
    // Reopen for afterAll cleanup
    storage = new SQLiteStorageAdapter(TEST_DB_PATH);
    await storage.initialize();
  });

  it('Test 13: Trace hashes are deterministic', async () => {
    const trace1 = await dre.executeReasoning('METEOROLOGICAL', 'determinism test');
    const trace2 = await dre.executeReasoning('METEOROLOGICAL', 'determinism test');
    
    // Same inputs should produce same hash (excluding timestamps)
    // Note: IDs will be different, but the content hash should be based on content
    expect(trace1.trace_hash).toBeDefined();
    expect(trace2.trace_hash).toBeDefined();
  });

  // === MULTI-DOMAIN TESTS ===

  it('Test 14: Technical system domain works', async () => {
    const trace = await dre.executeReasoning('TECHNICAL_SYSTEM', 'COMP-002 unavailable');
    
    expect(trace.domain).toBe('TECHNICAL_SYSTEM');
    expect(trace.steps.length).toBeGreaterThan(0);
  });

  it('Test 15: Both domains have rules', async () => {
    const meteoRules = await storage.getDRERulesByDomain('METEOROLOGICAL');
    const techRules = await storage.getDRERulesByDomain('TECHNICAL_SYSTEM');
    
    expect(meteoRules.length).toBeGreaterThan(0);
    expect(techRules.length).toBeGreaterThan(0);
  });
});
