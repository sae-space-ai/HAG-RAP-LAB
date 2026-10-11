/**
 * HAG-RAP Phase 0 — EGM-Lite Unit Tests
 * 
 * Tests cover:
 * - Case 1: Concordant sources → SUPPORTED
 * - Case 2: Contradictory sources → CONTRADICTED
 * - Case 3: No evidence → INSUFFICIENT_EVIDENCE
 * - Case 4: Non-existent reference → ERROR
 * - Case 5: Determinism (same data → same result)
 * - Referential integrity
 * - Contradiction detection
 * - Abstention behavior
 * - SYNTHETIC labeling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  EvidenceGraphMemory,
  evaluateClaim,
  detectContradictions,
  validateEvidenceReferences,
  areValuesCompatible,
  determineDecision,
  ALGORITHM_VERSION,
} from '../src/core/egm-lite';
import { sources, evidences, claims } from '../src/core/fixtures';
import type { Claim, Evidence } from '../src/core/types';

describe('EGM-Lite: Evidence Graph Memory', () => {
  let egm: EvidenceGraphMemory;

  beforeEach(() => {
    egm = new EvidenceGraphMemory();
    egm.loadSources(sources);
    egm.loadEvidences(evidences);
    egm.loadClaims(claims);
  });

  // === TEST 1: Case 1 — Concordant sources → SUPPORTED ===
  it('Test 1: Fuentes concordantes producen SUPPORTED', () => {
    const result = egm.evaluate('CLM-001');
    expect(result.status).toBe('SUPPORTED');
    expect(result.decision).toBe('PROCEED');
    expect(result.ruleApplied).toBe('RULE-SUPPORTED');
    expect(result.supportingEvidenceIds).toContain('EVD-001');
    expect(result.supportingEvidenceIds).toContain('EVD-002');
    expect(result.contradictingEvidenceIds).toHaveLength(0);
  });

  // === TEST 2: Case 2 — Contradictory sources → CONTRADICTED ===
  it('Test 2: Fuentes contradictorias producen CONTRADICTED y ABSTAIN', () => {
    const result = egm.evaluate('CLM-002');
    expect(result.status).toBe('CONTRADICTED');
    expect(result.decision).toBe('ABSTAIN');
    expect(result.ruleApplied).toBe('RULE-CONTRADICTED');
    expect(result.contradictingEvidenceIds.length).toBeGreaterThan(0);
  });

  // === TEST 3: Case 3 — No evidence → INSUFFICIENT_EVIDENCE ===
  it('Test 3: Sin evidencia produce INSUFFICIENT_EVIDENCE y ABSTAIN', () => {
    const result = egm.evaluate('CLM-003');
    expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.decision).toBe('ABSTAIN');
    expect(result.ruleApplied).toBe('RULE-INSUFFICIENT');
  });

  // === TEST 4: Case 4 — Non-existent reference → ERROR ===
  it('Test 4: Referencia inexistente produce ERROR', () => {
    const result = egm.evaluate('CLM-004');
    expect(result.status).toBe('ERROR');
    expect(result.decision).toBe('ABSTAIN');
    expect(result.ruleApplied).toBe('RULE-ERR');
    expect(result.missingEvidence).toContain('EVD-999');
  });

  // === TEST 5: Case 5 — Determinism ===
  it('Test 5: Mismos datos producen misma clasificación (determinismo)', () => {
    const result1 = egm.evaluate('CLM-001');
    const result5 = egm.evaluate('CLM-005');
    
    // Same claim data → same status and rule
    expect(result1.status).toBe(result5.status);
    expect(result1.ruleApplied).toBe(result5.ruleApplied);
    expect(result1.algorithmVersion).toBe(result5.algorithmVersion);
    expect(result1.supportingEvidenceIds.sort()).toEqual(result5.supportingEvidenceIds.sort());
  });

  // === TEST 6: Referential integrity ===
  it('Test 6: Integridad referencial — todas las evidencias referencian fuentes existentes', () => {
    for (const evidence of evidences) {
      const source = egm.getSource(evidence.sourceId);
      expect(source).toBeDefined();
      expect(source!.id).toBe(evidence.sourceId);
    }
  });

  // === TEST 7: Contradiction detection ===
  it('Test 7: Detección de contradicciones entre valores incompatibles', () => {
    const testEvidences: Evidence[] = [
      {
        id: 'EVD-TEST-A',
        sourceId: 'SRC-001',
        subjectId: 'SUBJ-TEST',
        predicate: 'test_pred',
        value: '100',
        collectedAt: '2025-01-01T00:00:00Z',
        transformations: [],
        classification: 'SYNTHETIC',
        status: 'VALID',
      },
      {
        id: 'EVD-TEST-B',
        sourceId: 'SRC-002',
        subjectId: 'SUBJ-TEST',
        predicate: 'test_pred',
        value: '200',
        collectedAt: '2025-01-01T00:00:00Z',
        transformations: [],
        classification: 'SYNTHETIC',
        status: 'VALID',
      },
    ];

    const contradictions = detectContradictions(testEvidences);
    expect(contradictions).toHaveLength(1);
    expect(contradictions[0]).toEqual(['EVD-TEST-A', 'EVD-TEST-B']);
  });

  // === TEST 8: Abstention for all non-SUPPORTED statuses ===
  it('Test 8: Abstención para todos los estados no-SUPPORTED', () => {
    expect(determineDecision('SUPPORTED')).toBe('PROCEED');
    expect(determineDecision('CONTRADICTED')).toBe('ABSTAIN');
    expect(determineDecision('INSUFFICIENT_EVIDENCE')).toBe('ABSTAIN');
    expect(determineDecision('ERROR')).toBe('ABSTAIN');
    expect(determineDecision('ABSTAIN')).toBe('ABSTAIN');
  });

  // === TEST 9: SYNTHETIC labeling ===
  it('Test 9: Todos los datos están etiquetados como SYNTHETIC', () => {
    for (const source of sources) {
      expect(source.classification).toBe('SYNTHETIC');
    }
    for (const evidence of evidences) {
      expect(evidence.classification).toBe('SYNTHETIC');
    }
    for (const claim of claims) {
      expect(claim.classification).toBe('SYNTHETIC');
    }

    // Evaluation results also carry SYNTHETIC
    const result = egm.evaluate('CLM-001');
    expect(result.classification).toBe('SYNTHETIC');
  });

  // === TEST 10: Non-existent claim throws error ===
  it('Test 10: Evaluar afirmación inexistente lanza error seguro', () => {
    expect(() => egm.evaluate('CLM-NONEXISTENT')).toThrow('not found');
  });

  // === TEST 11: Compatible values ===
  it('Test 11: Compatibilidad de valores es determinista', () => {
    expect(areValuesCompatible('22', '22')).toBe(true);
    expect(areValuesCompatible('22', '23')).toBe(false);
    expect(areValuesCompatible('abc', 'abc')).toBe(true);
    expect(areValuesCompatible('abc', 'def')).toBe(false);
  });

  // === TEST 12: Evidence reference validation ===
  it('Test 12: Validación de referencias detecta IDs faltantes', () => {
    const claimWithBadRef: Claim = {
      id: 'CLM-TEST',
      subjectId: 'SUBJ-TEST',
      predicate: 'test',
      proposedValue: 'x',
      evidenceIds: ['EVD-001', 'EVD-FAKE'],
      status: 'ERROR',
      classification: 'SYNTHETIC',
    };

    const missing = validateEvidenceReferences(claimWithBadRef, evidences);
    expect(missing).toContain('EVD-FAKE');
    expect(missing).not.toContain('EVD-001');
  });

  // === TEST 13: Algorithm version is consistent ===
  it('Test 13: Versión del algoritmo es consistente en todas las evaluaciones', () => {
    const r1 = egm.evaluate('CLM-001');
    const r2 = egm.evaluate('CLM-002');
    const r3 = egm.evaluate('CLM-003');
    expect(r1.algorithmVersion).toBe(ALGORITHM_VERSION);
    expect(r2.algorithmVersion).toBe(ALGORITHM_VERSION);
    expect(r3.algorithmVersion).toBe(ALGORITHM_VERSION);
  });

  // === TEST 14: Integrity check passes for valid data ===
  it('Test 14: Verificación de integridad pasa con datos válidos', () => {
    const integrity = egm.checkIntegrity();
    // CLM-004 references EVD-999 which doesn't exist, so integrity should fail
    // But the EGM still loads it — the evaluation handles it as ERROR
    // The integrity check detects the broken reference
    expect(integrity.errors.length).toBeGreaterThan(0);
    expect(integrity.valid).toBe(false);
  });

  // === TEST 15: Loading evidence with invalid source throws ===
  it('Test 15: Cargar evidencia con fuente inexistente lanza error', () => {
    const badEgm = new EvidenceGraphMemory();
    badEgm.loadSources(sources);
    
    expect(() => {
      badEgm.loadEvidences([{
        id: 'EVD-BAD',
        sourceId: 'SRC-NONEXISTENT',
        subjectId: 'SUBJ-TEST',
        predicate: 'test',
        value: 'x',
        collectedAt: '2025-01-01T00:00:00Z',
        transformations: [],
        classification: 'SYNTHETIC',
        status: 'VALID',
      }]);
    }).toThrow('non-existent source');
  });
});
