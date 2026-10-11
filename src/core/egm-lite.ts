/**
 * HAG-RAP Phase 0 — Evidence Graph Memory Lite (EGM-LITE)
 * 
 * This is the ONLY component with real functionality in Phase 0.
 * It provides:
 * - Storage and retrieval of sources, evidences, and claims (in-memory)
 * - Deterministic evaluation of claims against evidence
 * - Contradiction detection
 * - Abstention when evidence is insufficient
 * 
 * LIMITATIONS:
 * - No causal inference
 * - No probabilistic reasoning
 * - No statistical confidence measures
 * - No persistence (DEMO_NO_PERSISTENT)
 * - All data is SYNTHETIC
 */

import type {
  Source,
  Evidence,
  Claim,
  Evaluation,
  ClaimStatus,
} from './types';

export const ALGORITHM_VERSION = 'EGM-LITE-v0.1.0';

/**
 * Validate that all referenced evidence IDs exist in the provided set.
 * Returns an array of missing evidence IDs.
 */
export function validateEvidenceReferences(
  claim: Claim,
  availableEvidences: Evidence[]
): string[] {
  const availableIds = new Set(availableEvidences.map((e) => e.id));
  return claim.evidenceIds.filter((id) => !availableIds.has(id));
}

/**
 * Check if two evidence values are compatible.
 * Phase 0 uses strict string equality for simplicity.
 * This is NOT causal inference or statistical comparison.
 */
export function areValuesCompatible(valueA: string, valueB: string): boolean {
  return valueA === valueB;
}

/**
 * Detect contradictions among a set of evidences about the same subject+predicate.
 * Returns pairs of contradicting evidence IDs.
 */
export function detectContradictions(
  evidences: Evidence[]
): Array<[string, string]> {
  const contradictions: Array<[string, string]> = [];
  for (let i = 0; i < evidences.length; i++) {
    for (let j = i + 1; j < evidences.length; j++) {
      if (!areValuesCompatible(evidences[i].value, evidences[j].value)) {
        contradictions.push([evidences[i].id, evidences[j].id]);
      }
    }
  }
  return contradictions;
}

/**
 * Evaluate a claim against its referenced evidence.
 * 
 * Rules applied (transparent and deterministic):
 * 
 * RULE-ERR: If any referenced evidence ID does not exist → ERROR
 * RULE-INSUFFICIENT: If no valid evidence references → INSUFFICIENT_EVIDENCE
 * RULE-CONTRADICTED: If evidences contain incompatible values → CONTRADICTED
 * RULE-SUPPORTED: If all evidences agree with proposed value → SUPPORTED
 * RULE-PARTIAL: If evidences agree among themselves but differ from proposed → INSUFFICIENT_EVIDENCE
 * 
 * In all cases except SUPPORTED, the system ABSTAINS from any operational decision.
 */
export function evaluateClaim(
  claim: Claim,
  allEvidences: Evidence[]
): Evaluation {
  const evaluatedAt = new Date().toISOString();

  // RULE-ERR: Check for missing evidence references
  const missingRefs = validateEvidenceReferences(claim, allEvidences);
  if (missingRefs.length > 0) {
    return {
      claimId: claim.id,
      status: 'ERROR',
      supportingEvidenceIds: [],
      contradictingEvidenceIds: [],
      missingEvidence: missingRefs,
      evaluatedAt,
      algorithmVersion: ALGORITHM_VERSION,
      ruleApplied: 'RULE-ERR',
      explanation: `Error de validación: las referencias de evidencia [${missingRefs.join(', ')}] no existen en el grafo. No se puede evaluar la afirmación sin evidencia verificable.`,
      classification: 'SYNTHETIC',
    };
  }

  // RULE-INSUFFICIENT: No evidence references at all
  if (claim.evidenceIds.length === 0) {
    return {
      claimId: claim.id,
      status: 'INSUFFICIENT_EVIDENCE',
      supportingEvidenceIds: [],
      contradictingEvidenceIds: [],
      missingEvidence: ['No hay referencias de evidencia en la afirmación'],
      evaluatedAt,
      algorithmVersion: ALGORITHM_VERSION,
      ruleApplied: 'RULE-INSUFFICIENT',
      explanation: 'La afirmación no referencia ninguna evidencia. Sin evidencia observable, el sistema se abstiene de cualquier conclusión.',
      classification: 'SYNTHETIC',
    };
  }

  // Gather referenced evidences
  const referencedEvidences = allEvidences.filter((e) =>
    claim.evidenceIds.includes(e.id)
  );

  // Filter only VALID evidences
  const validEvidences = referencedEvidences.filter((e) => e.status === 'VALID');

  if (validEvidences.length === 0) {
    return {
      claimId: claim.id,
      status: 'INSUFFICIENT_EVIDENCE',
      supportingEvidenceIds: [],
      contradictingEvidenceIds: [],
      missingEvidence: referencedEvidences.map((e) => e.id),
      evaluatedAt,
      algorithmVersion: ALGORITHM_VERSION,
      ruleApplied: 'RULE-INSUFFICIENT',
      explanation: 'Las evidencias referenciadas no tienen estado VALID. Sin evidencia válida, el sistema se abstiene.',
      classification: 'SYNTHETIC',
    };
  }

  // RULE-CONTRADICTED: Detect contradictions
  const contradictions = detectContradictions(validEvidences);
  if (contradictions.length > 0) {
    const contradictingIds = [...new Set(contradictions.flat())];
    return {
      claimId: claim.id,
      status: 'CONTRADICTED',
      supportingEvidenceIds: [],
      contradictingEvidenceIds: contradictingIds,
      missingEvidence: [],
      evaluatedAt,
      algorithmVersion: ALGORITHM_VERSION,
      ruleApplied: 'RULE-CONTRADICTED',
      explanation: `Contradicción detectada entre evidencias [${contradictingIds.join(', ')}]: valores incompatibles sobre el mismo sujeto y predicado. El sistema se abstiene de cualquier decisión operativa. No se resuelve la contradicción arbitrariamente.`,
      classification: 'SYNTHETIC',
    };
  }

  // All valid evidences agree — check if they support the claim
  const allAgreeWithClaim = validEvidences.every(
    (e) => e.value === claim.proposedValue
  );

  if (allAgreeWithClaim) {
    // RULE-SUPPORTED
    return {
      claimId: claim.id,
      status: 'SUPPORTED',
      supportingEvidenceIds: validEvidences.map((e) => e.id),
      contradictingEvidenceIds: [],
      missingEvidence: [],
      evaluatedAt,
      algorithmVersion: ALGORITHM_VERSION,
      ruleApplied: 'RULE-SUPPORTED',
      explanation: `Todas las evidencias válidas [${validEvidences.map((e) => e.id).join(', ')}] coinciden con el valor propuesto "${claim.proposedValue}" para el sujeto "${claim.subjectId}" y predicado "${claim.predicate}". La afirmación está soportada por evidencia trazable. NOTA: Esto NO constituye inferencia causal ni prueba formal.`,
      classification: 'SYNTHETIC',
    };
  } else {
    // RULE-PARTIAL: Evidences agree among themselves but not with claim
    return {
      claimId: claim.id,
      status: 'INSUFFICIENT_EVIDENCE',
      supportingEvidenceIds: [],
      contradictingEvidenceIds: [],
      missingEvidence: [`El valor propuesto "${claim.proposedValue}" no coincide con las evidencias [${validEvidences.map((e) => `${e.id}=${e.value}`).join(', ')}]`],
      evaluatedAt,
      algorithmVersion: ALGORITHM_VERSION,
      ruleApplied: 'RULE-PARTIAL',
      explanation: `Las evidencias son consistentes entre sí pero no coinciden con el valor propuesto. No se puede confirmar ni refutar categóricamente. El sistema se abstiene.`,
      classification: 'SYNTHETIC',
    };
  }
}

/**
 * Determine the operational decision based on evaluation status.
 * Phase 0 rule: Only SUPPORTED with full evidence allows a positive finding.
 * All other statuses result in ABSTAIN.
 */
export function determineDecision(status: ClaimStatus): 'PROCEED' | 'ABSTAIN' {
  if (status === 'SUPPORTED') {
    return 'PROCEED';
  }
  return 'ABSTAIN';
}

/**
 * In-memory evidence store for EGM-LITE.
 * This is NOT persistent. It resets on each session.
 */
export class EvidenceGraphMemory {
  private sources: Map<string, Source> = new Map();
  private evidences: Map<string, Evidence> = new Map();
  private claims: Map<string, Claim> = new Map();

  loadSources(sources: Source[]): void {
    for (const s of sources) {
      this.sources.set(s.id, s);
    }
  }

  loadEvidences(evidences: Evidence[]): void {
    for (const e of evidences) {
      // Validate source reference
      if (!this.sources.has(e.sourceId)) {
        throw new Error(`Evidence ${e.id} references non-existent source ${e.sourceId}`);
      }
      this.evidences.set(e.id, e);
    }
  }

  loadClaims(claims: Claim[]): void {
    for (const c of claims) {
      this.claims.set(c.id, c);
    }
  }

  getSource(id: string): Source | undefined {
    return this.sources.get(id);
  }

  getEvidence(id: string): Evidence | undefined {
    return this.evidences.get(id);
  }

  getClaim(id: string): Claim | undefined {
    return this.claims.get(id);
  }

  getAllEvidences(): Evidence[] {
    return Array.from(this.evidences.values());
  }

  getAllSources(): Source[] {
    return Array.from(this.sources.values());
  }

  getAllClaims(): Claim[] {
    return Array.from(this.claims.values());
  }

  /**
   * Full evaluation pipeline: validate → evaluate → decide.
   */
  evaluate(claimId: string): Evaluation & { decision: 'PROCEED' | 'ABSTAIN' } {
    const claim = this.getClaim(claimId);
    if (!claim) {
      throw new Error(`Claim ${claimId} not found in evidence graph`);
    }

    const evaluation = evaluateClaim(claim, this.getAllEvidences());
    const decision = determineDecision(evaluation.status);

    return { ...evaluation, decision };
  }

  /**
   * Integrity check: verify all references are valid.
   */
  checkIntegrity(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const evidence of this.evidences.values()) {
      if (!this.sources.has(evidence.sourceId)) {
        errors.push(`Evidence ${evidence.id} → missing source ${evidence.sourceId}`);
      }
    }

    for (const claim of this.claims.values()) {
      for (const evId of claim.evidenceIds) {
        if (!this.evidences.has(evId)) {
          errors.push(`Claim ${claim.id} → references non-existent evidence ${evId}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
