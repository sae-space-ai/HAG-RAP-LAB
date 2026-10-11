/**
 * HAG-RAP Phase 2 — Deep Reasoning Engine Lite (DRE-LITE)
 * 
 * Extends EGM-Persistent with basic inference capabilities.
 * 
 * IMPORTANT LIMITATIONS:
 * - NOT causal inference
 * - NOT deep reasoning with LLMs
 * - NOT abstraction or world models
 * - Only deterministic rule-based inference
 * - All data remains SYNTHETIC
 */

import type { StorageAdapter, StoredClaim, StoredSource, StoredEvidenceLink } from '../storage';

export const DRE_ALGORITHM_VERSION = 'DRE-LITE-v2.0.0';

// === INFERENCE TYPES ===

export interface ConfidenceScore {
  value: number; // 0.0 to 1.0
  basis: string; // Explanation of how confidence was calculated
  factors: string[]; // List of factors considered
}

export interface InferenceResult {
  claimId: string;
  inferredValue: string;
  confidence: ConfidenceScore;
  inferenceChain: string[]; // Steps in the inference process
  supportingClaims: string[];
  contradictingClaims: string[];
  temporalConsistency: 'CONSISTENT' | 'INCONSISTENT' | 'UNKNOWN';
  algorithmVersion: string;
}

export interface ContradictionPattern {
  type: 'DIRECT' | 'TEMPORAL' | 'SOURCE_DERIVATION' | 'UNIT_MISMATCH';
  claims: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
}

// === DRE-LITE ENGINE ===

export class DRELiteEngine {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  /**
   * Calculate confidence score for a claim based on multiple factors.
   * This is NOT statistical confidence — it's a heuristic score.
   */
  async calculateConfidence(claimId: string): Promise<ConfidenceScore> {
    const claim = await this.storage.getClaim(claimId);
    if (!claim) {
      return {
        value: 0.0,
        basis: 'Claim not found',
        factors: ['missing_claim'],
      };
    }

    const factors: string[] = [];
    let score = 0.5; // Base confidence

    // Factor 1: Number of evidence links
    const evidenceLinks = await this.storage.getEvidenceLinksForClaim(claimId);
    if (evidenceLinks.length > 0) {
      score += 0.1;
      factors.push(`evidence_count:${evidenceLinks.length}`);
    }

    // Factor 2: Source diversity (different sources = higher confidence)
    const uniqueSources = new Set(evidenceLinks.map(l => l.source_id));
    if (uniqueSources.size > 1) {
      score += 0.15;
      factors.push(`source_diversity:${uniqueSources.size}`);
    }

    // Factor 3: Check for contradictions with related claims
    const relatedClaims = await this.getRelatedClaims(claim.subject, claim.predicate);
    const contradictions = relatedClaims.filter(c => 
      c.id !== claimId && c.object_value !== claim.object_value
    );
    
    if (contradictions.length === 0) {
      score += 0.1;
      factors.push('no_contradictions');
    } else {
      score -= 0.2 * contradictions.length;
      factors.push(`contradictions:${contradictions.length}`);
    }

    // Factor 4: Temporal consistency
    const temporalCheck = await this.checkTemporalConsistency(claim);
    if (temporalCheck === 'CONSISTENT') {
      score += 0.05;
      factors.push('temporal_consistent');
    } else if (temporalCheck === 'INCONSISTENT') {
      score -= 0.1;
      factors.push('temporal_inconsistent');
    }

    // Factor 5: Source type reliability (synthetic reports vs sensors)
    const sources = await Promise.all(
      Array.from(uniqueSources).map(sid => this.storage.getSource(sid))
    );
    const validSources = sources.filter(s => s !== null);
    const hasSensorData = validSources.some(s => s!.source_type.includes('sensor'));
    if (hasSensorData) {
      score += 0.05;
      factors.push('sensor_data_present');
    }

    // Clamp score between 0 and 1
    score = Math.max(0, Math.min(1, score));

    return {
      value: Math.round(score * 100) / 100, // Round to 2 decimals
      basis: `Heuristic confidence based on ${factors.length} factors`,
      factors,
    };
  }

  /**
   * Detect contradiction patterns in the evidence graph.
   */
  async detectContradictionPatterns(): Promise<ContradictionPattern[]> {
    const patterns: ContradictionPattern[] = [];
    const allClaims = await this.storage.getAllClaims();

    // Group claims by subject+predicate
    const grouped = new Map<string, StoredClaim[]>();
    for (const claim of allClaims) {
      const key = `${claim.subject}|${claim.predicate}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(claim);
    }

    // Analyze each group
    for (const [key, claims] of grouped.entries()) {
      if (claims.length < 2) continue;

      // Check for direct contradictions (same period, different values)
      const directContradictions = this.findDirectContradictions(claims);
      if (directContradictions.length > 0) {
        patterns.push({
          type: 'DIRECT',
          claims: directContradictions.map(c => c.id),
          severity: 'HIGH',
          explanation: `Direct contradiction: ${directContradictions.length} claims with incompatible values`,
        });
      }

      // Check for temporal contradictions (different periods)
      const temporalContradictions = this.findTemporalContradictions(claims);
      if (temporalContradictions.length > 0) {
        patterns.push({
          type: 'TEMPORAL',
          claims: temporalContradictions.map(c => c.id),
          severity: 'MEDIUM',
          explanation: `Temporal contradiction: values differ across time periods`,
        });
      }

      // Check for source derivation (non-independent sources)
      const derivationIssues = await this.findSourceDerivationIssues(claims);
      if (derivationIssues.length > 0) {
        patterns.push({
          type: 'SOURCE_DERIVATION',
          claims: derivationIssues.map(c => c.id),
          severity: 'LOW',
          explanation: `Source derivation: some claims rely on non-independent sources`,
        });
      }
    }

    return patterns;
  }

  /**
   * Perform transitive inference: if A→B and B→C, infer A→C.
   * This is simple rule-based inference, NOT causal reasoning.
   */
  async performTransitiveInference(
    startClaimId: string,
    maxDepth: number = 2
  ): Promise<InferenceResult | null> {
    const startClaim = await this.storage.getClaim(startClaimId);
    if (!startClaim) return null;

    const inferenceChain: string[] = [startClaimId];
    const supportingClaims: string[] = [];
    const contradictingClaims: string[] = [];

    // Find related claims (same subject+predicate)
    const relatedClaims = await this.getRelatedClaims(
      startClaim.subject,
      startClaim.predicate
    );

    // Simple transitive logic: if multiple claims agree, confidence increases
    const agreeingClaims = relatedClaims.filter(
      c => c.object_value === startClaim.object_value && c.id !== startClaimId
    );
    const disagreeingClaims = relatedClaims.filter(
      c => c.object_value !== startClaim.object_value && c.id !== startClaimId
    );

    supportingClaims.push(...agreeingClaims.map(c => c.id));
    contradictingClaims.push(...disagreeingClaims.map(c => c.id));

    // Calculate confidence
    const confidence = await this.calculateConfidence(startClaimId);

    // Check temporal consistency
    const temporalConsistency = await this.checkTemporalConsistency(startClaim);

    return {
      claimId: startClaimId,
      inferredValue: startClaim.object_value,
      confidence,
      inferenceChain,
      supportingClaims,
      contradictingClaims,
      temporalConsistency,
      algorithmVersion: DRE_ALGORITHM_VERSION,
    };
  }

  /**
   * Enhanced evaluation using DRE-Lite reasoning.
   * Combines EGM evaluation with confidence scoring and pattern detection.
   */
  async enhancedEvaluate(claimId: string): Promise<{
    verdict: string;
    decision: string;
    confidence: ConfidenceScore;
    contradictionPatterns: ContradictionPattern[];
    inferenceResult: InferenceResult | null;
    explanation: string;
  }> {
    // Get base EGM evaluation (would call EGM engine here)
    const confidence = await this.calculateConfidence(claimId);
    const contradictionPatterns = await this.detectContradictionPatterns();
    const inferenceResult = await this.performTransitiveInference(claimId);

    // Determine verdict based on confidence and contradictions
    let verdict = 'INSUFFICIENT_EVIDENCE';
    let decision = 'ABSTAIN';

    if (confidence.value >= 0.7 && inferenceResult && inferenceResult.contradictingClaims.length === 0) {
      verdict = 'SUPPORTED';
      decision = 'PROCEED';
    } else if (inferenceResult && inferenceResult.contradictingClaims.length > 0) {
      verdict = 'CONTRADICTED';
      decision = 'ABSTAIN';
    }

    const explanation = this.generateExplanation(verdict, confidence, contradictionPatterns, inferenceResult);

    return {
      verdict,
      decision,
      confidence,
      contradictionPatterns,
      inferenceResult,
      explanation,
    };
  }

  // === HELPER METHODS ===

  private async getRelatedClaims(subject: string, predicate: string): Promise<StoredClaim[]> {
    const allClaims = await this.storage.getAllClaims();
    return allClaims.filter(c => c.subject === subject && c.predicate === predicate);
  }

  private findDirectContradictions(claims: StoredClaim[]): StoredClaim[] {
    // Find claims with overlapping time periods but different values
    const contradictions: StoredClaim[] = [];
    
    for (let i = 0; i < claims.length; i++) {
      for (let j = i + 1; j < claims.length; j++) {
        const c1 = claims[i];
        const c2 = claims[j];
        
        if (c1.object_value !== c2.object_value) {
          // Check if time periods overlap
          if (this.timePeriodsOverlap(c1, c2)) {
            contradictions.push(c1, c2);
          }
        }
      }
    }
    
    return [...new Set(contradictions)];
  }

  private findTemporalContradictions(claims: StoredClaim[]): StoredClaim[] {
    // Find claims with different time periods and different values
    const contradictions: StoredClaim[] = [];
    
    for (let i = 0; i < claims.length; i++) {
      for (let j = i + 1; j < claims.length; j++) {
        const c1 = claims[i];
        const c2 = claims[j];
        
        if (c1.object_value !== c2.object_value) {
          if (!this.timePeriodsOverlap(c1, c2)) {
            contradictions.push(c1, c2);
          }
        }
      }
    }
    
    return [...new Set(contradictions)];
  }

  private async findSourceDerivationIssues(claims: StoredClaim[]): Promise<StoredClaim[]> {
    const issues: StoredClaim[] = [];
    
    for (const claim of claims) {
      const links = await this.storage.getEvidenceLinksForClaim(claim.id);
      for (const link of links) {
        if (link.transformation.includes('derived_from')) {
          issues.push(claim);
          break;
        }
      }
    }
    
    return issues;
  }

  private timePeriodsOverlap(c1: StoredClaim, c2: StoredClaim): boolean {
    if (!c1.valid_from || !c1.valid_to || !c2.valid_from || !c2.valid_to) {
      return true; // Assume overlap if periods not specified
    }
    
    const start1 = new Date(c1.valid_from).getTime();
    const end1 = new Date(c1.valid_to).getTime();
    const start2 = new Date(c2.valid_from).getTime();
    const end2 = new Date(c2.valid_to).getTime();
    
    return start1 <= end2 && end1 >= start2;
  }

  private async checkTemporalConsistency(claim: StoredClaim): Promise<'CONSISTENT' | 'INCONSISTENT' | 'UNKNOWN'> {
    if (!claim.valid_from || !claim.valid_to) {
      return 'UNKNOWN';
    }
    
    const relatedClaims = await this.getRelatedClaims(claim.subject, claim.predicate);
    const overlappingClaims = relatedClaims.filter(c => 
      c.id !== claim.id && this.timePeriodsOverlap(claim, c)
    );
    
    const contradictions = overlappingClaims.filter(c => 
      c.object_value !== claim.object_value
    );
    
    if (contradictions.length === 0) {
      return 'CONSISTENT';
    } else {
      return 'INCONSISTENT';
    }
  }

  private generateExplanation(
    verdict: string,
    confidence: ConfidenceScore,
    patterns: ContradictionPattern[],
    inference: InferenceResult | null
  ): string {
    const parts: string[] = [];
    
    parts.push(`Verdict: ${verdict}`);
    parts.push(`Confidence: ${(confidence.value * 100).toFixed(1)}% based on ${confidence.factors.length} factors`);
    
    if (patterns.length > 0) {
      parts.push(`Contradiction patterns detected: ${patterns.length}`);
      for (const pattern of patterns) {
        parts.push(`  - ${pattern.type}: ${pattern.explanation}`);
      }
    }
    
    if (inference) {
      parts.push(`Supporting claims: ${inference.supportingClaims.length}`);
      parts.push(`Contradicting claims: ${inference.contradictingClaims.length}`);
      parts.push(`Temporal consistency: ${inference.temporalConsistency}`);
    }
    
    parts.push(`NOTE: This is heuristic reasoning, NOT causal inference or proof.`);
    
    return parts.join('\n');
  }
}
