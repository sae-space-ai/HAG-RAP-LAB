/**
 * HAG-RAP Phase 1 — Server-side EGM Engine
 * 
 * Reuses the deterministic evaluation logic from Phase 0
 * but operates on persisted data via StorageAdapter.
 */

import type { StorageAdapter, StoredSource, StoredClaim, StoredEvidenceLink, StoredEvaluation } from './storage';
import { computeInputsHash } from './storage';
import { v4 as uuidv4 } from 'uuid';

export const ALGORITHM_VERSION = 'EGM-PERSISTENT-v1.0.0';

// === EVALUATION TYPES ===

export interface EvaluationInput {
  claimId?: string;
  subject?: string;
  predicate?: string;
  proposedValue?: string;
  sourceIds?: string[];
  caseId?: string;
}

export interface EvaluationResult {
  id: string;
  caseId: string | null;
  algorithmVersion: string;
  verdict: string;
  decision: 'PROCEED' | 'ABSTAIN';
  appliedRule: string;
  inputsHash: string;
  explanation: string;
  supportingSourceIds: string[];
  contradictingSourceIds: string[];
  missingInfo: string[];
  evidenceLinks: StoredEvidenceLink[];
  sources: StoredSource[];
  claim: StoredClaim | null;
  createdAt: string;
}

// === ENGINE ===

export class EGMEngine {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  /**
   * Evaluate a claim against its linked evidence.
   * Deterministic: same inputs → same verdict (excluding timestamps).
   */
  async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
    const createdAt = new Date().toISOString();
    const evaluationId = `EVAL-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Resolve claim
    let claim: StoredClaim | null = null;
    let evidenceLinks: StoredEvidenceLink[] = [];
    let sourceIds: string[] = [];

    if (input.claimId) {
      claim = await this.storage.getClaim(input.claimId);
      if (!claim) {
        return this.buildErrorResult(
          evaluationId, input.caseId || null, input,
          'CLAIM_NOT_FOUND',
          `La afirmación "${input.claimId}" no existe en el grafo de evidencias.`,
          createdAt
        );
      }
      evidenceLinks = await this.storage.getEvidenceLinksForClaim(claim.id);
      sourceIds = [...new Set(evidenceLinks.map(l => l.source_id))];
    } else if (input.subject && input.predicate && input.sourceIds) {
      // Direct evaluation without stored claim
      sourceIds = input.sourceIds;
      // Build synthetic evidence links for evaluation
      evidenceLinks = sourceIds.map((sid, i) => ({
        id: `EVL-TEMP-${i}`,
        claim_id: 'DIRECT',
        source_id: sid,
        transformation: 'direct_query',
        extracted_at: createdAt,
        provenance_hash: 'direct',
      }));
    } else {
      return this.buildErrorResult(
        evaluationId, input.caseId || null, input,
        'INVALID_INPUT',
        'Debe proporcionar claimId o (subject + predicate + sourceIds).',
        createdAt
      );
    }

    // RULE-INSUFFICIENT: No evidence links
    if (evidenceLinks.length === 0) {
      return this.buildResult(
        evaluationId, input.caseId || null, input, claim,
        'INSUFFICIENT_EVIDENCE', 'ABSTAIN', 'RULE-INSUFFICIENT',
        'No hay enlaces de evidencia para esta afirmación. El sistema se abstiene.',
        [], [], evidenceLinks.map(l => l.id),
        createdAt
      );
    }

    // Resolve sources and check for missing references
    const sources: StoredSource[] = [];
    const missingSources: string[] = [];
    for (const sid of sourceIds) {
      const source = await this.storage.getSource(sid);
      if (source?.source_type === 'synthetic_unresolved_reference') {
        // Explicit fixture marker: source unavailable, not admissible evidence.
        missingSources.push(sid);
      } else if (source) {
        sources.push(source);
      } else {
        missingSources.push(sid);
      }
    }

    // RULE-ERR: Missing source references
    if (missingSources.length > 0) {
      return this.buildErrorResult(
        evaluationId, input.caseId || null, input,
        'MISSING_SOURCES',
        `Fuentes referenciadas no encontradas: [${missingSources.join(', ')}]. No se puede evaluar sin procedencia completa.`,
        createdAt,
        evidenceLinks
      );
    }

    // Compare values from sources via claims
    // In Phase 1, we compare the object_value of claims linked to different sources
    // For simplicity, we look at the claim's own object_value vs other claims on same subject+predicate
    const subject = claim?.subject || input.subject || '';
    const predicate = claim?.predicate || input.predicate || '';
    const proposedValue = claim?.object_value || input.proposedValue || '';

    // Get all claims for same subject+predicate to detect contradictions
    const allClaims = await this.storage.getAllClaims();
    const relatedClaims = allClaims.filter(
      c => c.subject === subject && c.predicate === predicate && c.id !== claim?.id
    );

    // Check for contradictions with related claims from different sources
    const contradictingSourceIds: string[] = [];
    for (const rc of relatedClaims) {
      if (rc.object_value !== proposedValue) {
        contradictingSourceIds.push(rc.source_id);
      }
    }

    // RULE-CONTRADICTED: Values are incompatible
    if (contradictingSourceIds.length > 0) {
      return this.buildResult(
        evaluationId, input.caseId || null, input, claim,
        'CONTRADICTED', 'ABSTAIN', 'RULE-CONTRADICTED',
        `Contradicción detectada: fuentes [${contradictingSourceIds.join(', ')}] aportan valores incompatibles sobre "${subject}.${predicate}". El sistema se abstiene.`,
        [], contradictingSourceIds, evidenceLinks.map(l => l.id),
        createdAt, sources
      );
    }

    // Check if proposed value matches evidence
    const valueMatches = claim ? claim.object_value === proposedValue : true;

    if (valueMatches && sources.length > 0) {
      // RULE-SUPPORTED
      return this.buildResult(
        evaluationId, input.caseId || null, input, claim,
        'SUPPORTED', 'PROCEED', 'RULE-SUPPORTED',
        `Evidencia de [${sources.map(s => s.id).join(', ')}] soporta el valor "${proposedValue}" para "${subject}.${predicate}". NOTA: Esto NO constituye inferencia causal ni prueba formal.`,
        sourceIds, [], evidenceLinks.map(l => l.id),
        createdAt, sources
      );
    } else {
      // RULE-PARTIAL
      return this.buildResult(
        evaluationId, input.caseId || null, input, claim,
        'INSUFFICIENT_EVIDENCE', 'ABSTAIN', 'RULE-PARTIAL',
        `Las fuentes son consistentes pero el valor propuesto no coincide con la evidencia almacenada. El sistema se abstiene.`,
        [], [], evidenceLinks.map(l => l.id),
        createdAt, sources
      );
    }
  }

  private async buildResult(
    id: string, caseId: string | null, input: EvaluationInput,
    claim: StoredClaim | null,
    verdict: string, decision: 'PROCEED' | 'ABSTAIN', rule: string,
    explanation: string,
    supportingSourceIds: string[], contradictingSourceIds: string[],
    evidenceLinkIds: string[],
    createdAt: string,
    sources?: StoredSource[]
  ): Promise<EvaluationResult> {
    const inputsHash = computeInputsHash({ ...input, algorithmVersion: ALGORITHM_VERSION });

    // Resolve sources if not provided
    const resolvedSources = sources || await this.resolveSources([...supportingSourceIds, ...contradictingSourceIds]);

    // Resolve evidence links
    let evidenceLinks: StoredEvidenceLink[] = [];
    if (claim) {
      evidenceLinks = await this.storage.getEvidenceLinksForClaim(claim.id);
    }

    const result: EvaluationResult = {
      id, caseId, algorithmVersion: ALGORITHM_VERSION,
      verdict, decision, appliedRule: rule, inputsHash,
      explanation, supportingSourceIds, contradictingSourceIds,
      missingInfo: [], evidenceLinks, sources: resolvedSources,
      claim, createdAt,
    };

    // Persist evaluation
    const storedEval: StoredEvaluation = {
      id, case_id: caseId, algorithm_version: ALGORITHM_VERSION,
      verdict, decision, applied_rule: rule, inputs_hash: inputsHash,
      created_at: createdAt, full_result_json: JSON.stringify(result),
    };
    await this.storage.insertEvaluation(storedEval);

    return result;
  }

  private async buildErrorResult(
    id: string, caseId: string | null, input: EvaluationInput,
    errorCode: string, explanation: string, createdAt: string,
    evidenceLinks?: StoredEvidenceLink[]
  ): Promise<EvaluationResult> {
    const inputsHash = computeInputsHash({ ...input, algorithmVersion: ALGORITHM_VERSION });
    const result: EvaluationResult = {
      id, caseId, algorithmVersion: ALGORITHM_VERSION,
      verdict: 'ERROR', decision: 'ABSTAIN', appliedRule: `RULE-ERR:${errorCode}`,
      inputsHash, explanation,
      supportingSourceIds: [], contradictingSourceIds: [],
      missingInfo: [errorCode],
      evidenceLinks: evidenceLinks || [],
      sources: [], claim: null, createdAt,
    };

    // Persist error evaluation too
    const storedEval: StoredEvaluation = {
      id, case_id: caseId, algorithm_version: ALGORITHM_VERSION,
      verdict: 'ERROR', decision: 'ABSTAIN', applied_rule: `RULE-ERR:${errorCode}`,
      inputs_hash: inputsHash, created_at: createdAt,
      full_result_json: JSON.stringify(result),
    };
    await this.storage.insertEvaluation(storedEval);

    return result;
  }

  private async resolveSources(sourceIds: string[]): Promise<StoredSource[]> {
    const sources: StoredSource[] = [];
    for (const sid of [...new Set(sourceIds)]) {
      const s = await this.storage.getSource(sid);
      if (s) sources.push(s);
    }
    return sources;
  }
}
