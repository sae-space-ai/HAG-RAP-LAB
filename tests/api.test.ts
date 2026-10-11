/**
 * HAG-RAP Phase 0 — API Service Tests
 * 
 * Tests cover:
 * - Health endpoint
 * - Capabilities endpoint
 * - Demo cases listing
 * - Evaluation endpoint (all cases)
 * - Error handling
 * - SYNTHETIC labeling in responses
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  apiHealth,
  apiCapabilities,
  apiDemoCases,
  apiEvaluateCase,
  apiReset,
} from '../src/core/api';
import type { EvaluationResponse, ErrorResponse } from '../src/core/types';

describe('API Service Layer', () => {
  beforeEach(() => {
    apiReset();
  });

  // === TEST: Health endpoint ===
  it('Health endpoint returns ok status with correct dependencies', () => {
    const health = apiHealth();
    expect(health.status).toBe('ok');
    expect(health.dependencies.coreLogic).toBe('VERIFIED');
    expect(health.dependencies.persistence).toBe('DEMO_NO_PERSISTENT');
    expect(health.dependencies.externalServices).toBe('NONE_CONNECTED');
    expect(health.version).toBeDefined();
    expect(health.timestamp).toBeDefined();
  });

  // === TEST: Capabilities endpoint ===
  it('Capabilities endpoint returns all 7 components with correct statuses', () => {
    const caps = apiCapabilities();
    expect(caps.components).toHaveLength(7);
    expect(caps.totalImplemented).toBe(1); // Only EGM-Lite
    expect(caps.totalNotImplemented).toBe(6);
    
    // Verify EGM is the only verified one
    const egm = caps.components.find(c => c.id === 'EGM');
    expect(egm).toBeDefined();
    expect(egm!.status).toBe('VERIFICADO_LOCAL');
    
    // Verify all others are NOT implemented
    const others = caps.components.filter(c => c.id !== 'EGM');
    for (const comp of others) {
      expect(comp.status).toBe('NO_IMPLEMENTADO');
    }
  });

  // === TEST: Demo cases listing ===
  it('Demo cases endpoint returns 5 synthetic cases', () => {
    const cases = apiDemoCases();
    expect(cases).toHaveLength(5);
    for (const c of cases) {
      expect(c.classification).toBe('SYNTHETIC');
      expect(c.id).toMatch(/^CASE-/);
    }
  });

  // === TEST: Evaluate case 1 — SUPPORTED ===
  it('Evaluate CASE-001 returns SUPPORTED with provenance', () => {
    const result = apiEvaluateCase('CASE-001') as EvaluationResponse;
    expect('evaluation' in result).toBe(true);
    expect(result.evaluation.status).toBe('SUPPORTED');
    expect(result.evaluation.classification).toBe('SYNTHETIC');
    expect(result.classification).toBe('SYNTHETIC');
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.evidences.length).toBeGreaterThan(0);
    // All sources must be SYNTHETIC
    for (const s of result.sources) {
      expect(s.classification).toBe('SYNTHETIC');
    }
  });

  // === TEST: Evaluate case 2 — CONTRADICTED ===
  it('Evaluate CASE-002 returns CONTRADICTED', () => {
    const result = apiEvaluateCase('CASE-002') as EvaluationResponse;
    expect('evaluation' in result).toBe(true);
    expect(result.evaluation.status).toBe('CONTRADICTED');
    expect(result.evaluation.contradictingEvidenceIds.length).toBeGreaterThan(0);
  });

  // === TEST: Evaluate case 3 — INSUFFICIENT_EVIDENCE ===
  it('Evaluate CASE-003 returns INSUFFICIENT_EVIDENCE', () => {
    const result = apiEvaluateCase('CASE-003') as EvaluationResponse;
    expect('evaluation' in result).toBe(true);
    expect(result.evaluation.status).toBe('INSUFFICIENT_EVIDENCE');
  });

  // === TEST: Evaluate case 4 — ERROR ===
  it('Evaluate CASE-004 returns ERROR for missing evidence reference', () => {
    const result = apiEvaluateCase('CASE-004') as EvaluationResponse;
    expect('evaluation' in result).toBe(true);
    expect(result.evaluation.status).toBe('ERROR');
    expect(result.evaluation.missingEvidence).toContain('EVD-999');
  });

  // === TEST: Evaluate non-existent case ===
  it('Evaluate non-existent case returns error response', () => {
    const result = apiEvaluateCase('CASE-NONEXISTENT') as ErrorResponse;
    expect('error' in result).toBe(true);
    expect(result.code).toBe('CASE_NOT_FOUND');
  });

  // === TEST: No unlabeled data in responses ===
  it('All evaluation responses contain SYNTHETIC classification', () => {
    const caseIds = ['CASE-001', 'CASE-002', 'CASE-003', 'CASE-004', 'CASE-005'];
    for (const caseId of caseIds) {
      const result = apiEvaluateCase(caseId) as EvaluationResponse;
      expect('evaluation' in result).toBe(true);
      expect(result.classification).toBe('SYNTHETIC');
      expect(result.evaluation.classification).toBe('SYNTHETIC');
      expect(result.claim.classification).toBe('SYNTHETIC');
    }
  });

  // === TEST: No mutation endpoints exist ===
  it('API has no mutation endpoints (write operations absent)', () => {
    // Verify that the API module only exports read-only functions
    const apiExports = Object.keys(await import('../src/core/api'));
    const mutationKeywords = ['create', 'update', 'delete', 'insert', 'write', 'mutate', 'post', 'put'];
    const hasMutations = apiExports.some(name =>
      mutationKeywords.some(kw => name.toLowerCase().includes(kw))
    );
    expect(hasMutations).toBe(false);
  });
});
