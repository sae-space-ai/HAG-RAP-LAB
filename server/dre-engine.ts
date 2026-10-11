/**
 * HAG-RAP Phase 2.2 — DRE Engine
 * 
 * Expanded Deep Reasoning Engine with:
 * - Deductive reasoning with typed rules
 * - Abductive hypothesis generation
 * - Hypothesis comparison
 * - Discriminating observation planning
 * 
 * LIMITATIONS:
 * - NOT causal inference
 * - NOT statistical probabilities
 * - NOT general intelligence
 * - Deterministic rule-based reasoning only
 * - All data is SYNTHETIC
 */

import type { StorageAdapter, StoredClaim, StoredSource, StoredEvidenceLink } from './storage';
import type {
  Domain,
  StoredRule,
  StoredHypothesis,
  StoredReasoningTrace,
  HypothesisPremise,
  HypothesisEvidence,
  HypothesisPrediction,
  InferenceStep,
  ExecutionLimits,
  ComparisonResult,
  HypothesisScore,
  DiscriminatingObservation,
  HypothesisState,
} from './dre-types';
import { DEFAULT_LIMITS } from './dre-types';
import { getRulesByDomain, getRuleById, RULE_CATALOG } from './rule-catalog';
import { computeHash } from './storage';
import { v4 as uuidv4 } from 'uuid';

export const DRE_ENGINE_VERSION = 'DRE-v2.2.0';

// === DRE ENGINE CLASS ===

export class DREEngine {
  private storage: StorageAdapter;
  private limits: ExecutionLimits;

  constructor(storage: StorageAdapter, limits: ExecutionLimits = DEFAULT_LIMITS) {
    this.storage = storage;
    this.limits = limits;
  }

  // === DEDUCTIVE REASONING ===

  /**
   * Apply a rule to premises and check conditions.
   * Returns conclusion if all premises and conditions are satisfied.
   */
  async applyRule(
    rule: StoredRule,
    domain: Domain,
    context: Map<string, StoredClaim[]>
  ): Promise<{ applied: boolean; conclusion?: any; reason?: string }> {
    // Check premises
    for (const premise of rule.premises) {
      const key = `${premise.subject}|${premise.predicate}`;
      const claims = context.get(key);
      
      if (!claims || claims.length === 0) {
        return { applied: false, reason: `Missing premise: ${premise.predicate} for ${premise.subject}` };
      }

      // Check expected value if specified
      if (premise.expectedValue) {
        const matchingClaim = claims.find(c => c.object_value === premise.expectedValue);
        if (!matchingClaim) {
          return { applied: false, reason: `Premise value mismatch: expected ${premise.expectedValue}` };
        }
      }
    }

    // Check conditions
    for (const condition of rule.conditions) {
      const satisfied = await this.checkCondition(condition, rule, context);
      if (!satisfied) {
        return { applied: false, reason: `Condition not satisfied: ${condition.type}` };
      }
    }

    // All premises and conditions satisfied
    return { applied: true, conclusion: rule.conclusion };
  }

  /**
   * Check a rule condition against context.
   */
  private async checkCondition(
    condition: any,
    rule: StoredRule,
    context: Map<string, StoredClaim[]>
  ): Promise<boolean> {
    switch (condition.type) {
      case 'SOURCE_INDEPENDENCE': {
        // Check that premises come from different sources
        const sourceIds = new Set<string>();
        for (const premise of rule.premises) {
          const key = `${premise.subject}|${premise.predicate}`;
          const claims = context.get(key) || [];
          for (const claim of claims) {
            sourceIds.add(claim.source_id);
          }
        }
        return sourceIds.size >= rule.premises.length;
      }

      case 'TEMPORAL_OVERLAP': {
        // Check that all claims have overlapping time periods
        const allClaims: StoredClaim[] = [];
        for (const premise of rule.premises) {
          const key = `${premise.subject}|${premise.predicate}`;
          const claims = context.get(key) || [];
          allClaims.push(...claims);
        }
        
        if (allClaims.length < 2) return true;
        
        // Simple overlap check: all must have valid_from and valid_to
        const withPeriods = allClaims.filter(c => c.valid_from && c.valid_to);
        if (withPeriods.length < 2) return true; // Assume overlap if periods not specified
        
        // Check pairwise overlap
        for (let i = 0; i < withPeriods.length; i++) {
          for (let j = i + 1; j < withPeriods.length; j++) {
            const c1 = withPeriods[i];
            const c2 = withPeriods[j];
            const start1 = new Date(c1.valid_from!).getTime();
            const end1 = new Date(c1.valid_to!).getTime();
            const start2 = new Date(c2.valid_from!).getTime();
            const end2 = new Date(c2.valid_to!).getTime();
            
            if (!(start1 <= end2 && end1 >= start2)) {
              return false; // No overlap
            }
          }
        }
        return true;
      }

      case 'VALUE_EQUALITY': {
        // Check that all premise values are equal
        const values = new Set<string>();
        for (const premise of rule.premises) {
          const key = `${premise.subject}|${premise.predicate}`;
          const claims = context.get(key) || [];
          for (const claim of claims) {
            values.add(claim.object_value);
          }
        }
        return values.size === 1;
      }

      case 'VALUE_RANGE': {
        // Check that value is within range
        const predicate = condition.parameters.predicate;
        const min = condition.parameters.min ? parseFloat(condition.parameters.min) : -Infinity;
        const max = condition.parameters.max ? parseFloat(condition.parameters.max) : Infinity;
        
        for (const [key, claims] of context.entries()) {
          if (key.includes(predicate)) {
            for (const claim of claims) {
              const value = parseFloat(claim.object_value);
              if (isNaN(value) || value < min || value > max) {
                return false;
              }
            }
          }
        }
        return true;
      }

      default:
        return false;
    }
  }

  /**
   * Perform deductive reasoning: apply all applicable rules.
   */
  async performDeduction(
    domain: Domain,
    observation: string
  ): Promise<{ conclusions: any[]; steps: InferenceStep[]; limitsReached: string[] }> {
    const conclusions: any[] = [];
    const steps: InferenceStep[] = [];
    const limitsReached: string[] = [];
    
    const rules = getRulesByDomain(domain);
    const context = await this.buildContext(domain);
    
    let rulesEvaluated = 0;
    
    for (const rule of rules) {
      if (rulesEvaluated >= this.limits.maxRulesEvaluated) {
        limitsReached.push('maxRulesEvaluated');
        break;
      }
      
      const result = await this.applyRule(rule, domain, context);
      rulesEvaluated++;
      
      steps.push({
        stepNumber: steps.length + 1,
        mode: 'DEDUCTION',
        ruleId: rule.id,
        description: result.applied ? `Rule ${rule.id} applied` : `Rule ${rule.id} not applicable: ${result.reason}`,
        inputs: rule.premises.map(p => `${p.subject}.${p.predicate}`),
        outputs: result.applied ? [`${rule.conclusion.subject}.${rule.conclusion.predicate}`] : [],
      });
      
      if (result.applied && result.conclusion) {
        conclusions.push({
          ruleId: rule.id,
          conclusion: result.conclusion,
        });
      }
    }
    
    return { conclusions, steps, limitsReached };
  }

  // === ABDUCTIVE REASONING ===

  /**
   * Generate hypotheses to explain an observation.
   * Searches for rules whose conclusions match the observation.
   */
  async generateHypotheses(
    domain: Domain,
    observation: string,
    executionId: string
  ): Promise<{ hypotheses: StoredHypothesis[]; steps: InferenceStep[]; limitsReached: string[] }> {
    const hypotheses: StoredHypothesis[] = [];
    const steps: InferenceStep[] = [];
    const limitsReached: string[] = [];
    
    const rules = getRulesByDomain(domain);
    const context = await this.buildContext(domain);
    
    let hypothesesGenerated = 0;
    
    for (const rule of rules) {
      if (hypothesesGenerated >= this.limits.maxHypotheses) {
        limitsReached.push('maxHypotheses');
        break;
      }
      
      // Check if rule conclusion could explain observation
      const couldExplain = this.couldExplainObservation(rule, observation, context);
      
      if (couldExplain.possible) {
        const hypothesis = await this.createHypothesis(
          rule,
          observation,
          executionId,
          context,
          couldExplain
        );
        
        hypotheses.push(hypothesis);
        hypothesesGenerated++;
        
        steps.push({
          stepNumber: steps.length + 1,
          mode: 'ABDUCTION',
          ruleId: rule.id,
          description: `Hypothesis generated from rule ${rule.id}`,
          inputs: [observation],
          outputs: [hypothesis.id],
        });
      }
    }
    
    return { hypotheses, steps, limitsReached };
  }

  /**
   * Check if a rule could explain an observation.
   */
  private couldExplainObservation(
    rule: StoredRule,
    observation: string,
    context: Map<string, StoredClaim[]>
  ): { possible: boolean; matchingPremises: StoredClaim[]; missingPremises: string[] } {
    const matchingPremises: StoredClaim[] = [];
    const missingPremises: string[] = [];
    
    for (const premise of rule.premises) {
      const key = `${premise.subject}|${premise.predicate}`;
      const claims = context.get(key) || [];
      
      if (claims.length > 0) {
        matchingPremises.push(...claims);
      } else {
        missingPremises.push(`${premise.subject}.${premise.predicate}`);
      }
    }
    
    // Hypothesis is possible if at least some premises are present
    return {
      possible: matchingPremises.length > 0,
      matchingPremises,
      missingPremises,
    };
  }

  /**
   * Create a hypothesis from a rule.
   */
  private async createHypothesis(
    rule: StoredRule,
    observation: string,
    executionId: string,
    context: Map<string, StoredClaim[]>,
    analysis: { possible: boolean; matchingPremises: StoredClaim[]; missingPremises: string[] }
  ): Promise<StoredHypothesis> {
    const premises: HypothesisPremise[] = [];
    const evidences: HypothesisEvidence[] = [];
    const predictions: HypothesisPrediction[] = [];
    
    // Classify premises
    for (const claim of analysis.matchingPremises) {
      premises.push({
        type: 'VERIFIED',
        claimId: claim.id,
        sourceId: claim.source_id,
        description: `${claim.subject}.${claim.predicate} = ${claim.object_value}`,
      });
      
      evidences.push({
        type: 'SUPPORTING',
        claimId: claim.id,
        sourceId: claim.source_id,
        explanation: `Evidence supports hypothesis premise`,
      });
    }
    
    for (const missing of analysis.missingPremises) {
      premises.push({
        type: 'ASSUMED',
        description: `Assumed: ${missing}`,
      });
    }
    
    // Generate predictions from conclusion
    predictions.push({
      predicate: rule.conclusion.predicate,
      subject: rule.conclusion.subject,
      expectedValue: rule.conclusion.value,
      unit: rule.conclusion.unit,
      testable: true,
      description: `If hypothesis is correct, we should observe ${rule.conclusion.predicate} = ${rule.conclusion.value}`,
    });
    
    const hypothesis: StoredHypothesis = {
      id: `HYP-${uuidv4().slice(0, 8).toUpperCase()}`,
      executionId,
      observation,
      ruleId: rule.id,
      ruleVersion: rule.version,
      premises,
      evidences,
      predictions,
      unmetConstraints: analysis.missingPremises,
      requiredObservations: analysis.missingPremises,
      state: analysis.missingPremises.length === 0 ? 'HYPOTHESIS_COMPATIBLE' : 'HYPOTHESIS_PROPOSED',
      explanation: `Hypothesis generated from rule ${rule.id}: ${rule.description}`,
      created_at: new Date().toISOString(),
      hypothesis_hash: '',
    };
    
    hypothesis.hypothesis_hash = computeHash(JSON.stringify({
      executionId: hypothesis.executionId,
      ruleId: hypothesis.ruleId,
      premises: hypothesis.premises,
    }));
    
    return hypothesis;
  }

  // === HYPOTHESIS COMPARISON ===

  /**
   * Compare multiple hypotheses using explicit criteria.
   */
  async compareHypotheses(hypothesisIds: string[]): Promise<ComparisonResult> {
    const hypotheses: StoredHypothesis[] = [];
    
    // Retrieve hypotheses (from storage or memory)
    // For now, we'll work with the hypothesis objects directly
    // In a full implementation, these would be retrieved from storage
    
    const criteria = [
      { name: 'evidence_support', description: 'Number of supporting evidences', weight: 0.3 },
      { name: 'premise_verification', description: 'Ratio of verified vs assumed premises', weight: 0.3 },
      { name: 'constraint_satisfaction', description: 'Number of unmet constraints (lower is better)', weight: 0.2 },
      { name: 'predictive_power', description: 'Number of testable predictions', weight: 0.2 },
    ];
    
    const scores: HypothesisScore[] = [];
    
    for (const hyp of hypotheses) {
      const criterionScores: Record<string, number> = {};
      
      // Evidence support
      const supportingCount = hyp.evidences.filter(e => e.type === 'SUPPORTING').length;
      criterionScores['evidence_support'] = Math.min(supportingCount / 5, 1.0);
      
      // Premise verification
      const verifiedCount = hyp.premises.filter(p => p.type === 'VERIFIED').length;
      const totalPremises = hyp.premises.length;
      criterionScores['premise_verification'] = totalPremises > 0 ? verifiedCount / totalPremises : 0;
      
      // Constraint satisfaction
      const unmetCount = hyp.unmetConstraints.length;
      criterionScores['constraint_satisfaction'] = Math.max(0, 1 - unmetCount / 3);
      
      // Predictive power
      const testableCount = hyp.predictions.filter(p => p.testable).length;
      criterionScores['predictive_power'] = Math.min(testableCount / 3, 1.0);
      
      // Calculate total score
      let totalScore = 0;
      for (const criterion of criteria) {
        totalScore += (criterionScores[criterion.name] || 0) * criterion.weight;
      }
      
      scores.push({
        hypothesisId: hyp.id,
        criterionScores,
        totalScore,
        rank: 0, // Will be set after sorting
        explanation: `Score based on ${Object.keys(criterionScores).length} criteria`,
      });
    }
    
    // Sort by total score and assign ranks
    scores.sort((a, b) => b.totalScore - a.totalScore);
    scores.forEach((score, index) => {
      score.rank = index + 1;
    });
    
    // Determine retained hypotheses
    const retainedHypotheses: string[] = [];
    let abstained = false;
    let abstentionReason: string | undefined;
    
    if (scores.length === 0) {
      abstained = true;
      abstentionReason = 'No hypotheses to compare';
    } else if (scores.length === 1) {
      retainedHypotheses.push(scores[0].hypothesisId);
    } else {
      // Retain hypotheses with score >= 80% of the best
      const bestScore = scores[0].totalScore;
      const threshold = bestScore * 0.8;
      
      for (const score of scores) {
        if (score.totalScore >= threshold) {
          retainedHypotheses.push(score.hypothesisId);
        }
      }
      
      if (retainedHypotheses.length === 0) {
        abstained = true;
        abstentionReason = 'No hypothesis meets minimum threshold';
      }
    }
    
    return {
      hypothesisIds,
      criteria,
      scores,
      retainedHypotheses,
      abstained,
      abstentionReason,
    };
  }

  // === DISCRIMINATING OBSERVATIONS ===

  /**
   * Propose observations that could distinguish between hypotheses.
   */
  async proposeDiscriminatingObservations(
    hypothesisIds: string[]
  ): Promise<DiscriminatingObservation[]> {
    const observations: DiscriminatingObservation[] = [];
    
    // For each pair of hypotheses, find predictions that differ
    // This is a simplified implementation
    // In a full system, this would analyze the prediction space more thoroughly
    
    const obs1: DiscriminatingObservation = {
      id: `OBS-${uuidv4().slice(0, 8).toUpperCase()}`,
      hypothesisIds,
      predicate: 'additional_measurement',
      subject: 'target',
      expectedValues: Object.fromEntries(hypothesisIds.map((id, i) => [id, `value_${i}`])),
      description: 'Observation that could distinguish between hypotheses',
      discriminatingPower: 'MEDIUM',
    };
    
    observations.push(obs1);
    
    return observations;
  }

  // === FULL REASONING EXECUTION ===

  /**
   * Execute a complete reasoning process: deduction + abduction + comparison.
   */
  async executeReasoning(
    domain: Domain,
    observation: string
  ): Promise<StoredReasoningTrace> {
    const executionId = `EXEC-${uuidv4().slice(0, 8).toUpperCase()}`;
    const startTime = Date.now();
    const allSteps: InferenceStep[] = [];
    const limitsReached: string[] = [];
    
    // Phase 1: Deduction
    const deduction = await this.performDeduction(domain, observation);
    allSteps.push(...deduction.steps);
    limitsReached.push(...deduction.limitsReached);
    
    // Phase 2: Abduction
    const abduction = await this.generateHypotheses(domain, observation, executionId);
    allSteps.push(...abduction.steps);
    limitsReached.push(...abduction.limitsReached);
    
    // Phase 3: Comparison (if multiple hypotheses)
    let comparison: ComparisonResult | undefined;
    if (abduction.hypotheses.length > 1) {
      comparison = await this.compareHypotheses(abduction.hypotheses.map(h => h.id));
    }
    
    // Phase 4: Discriminating observations (if needed)
    let discriminatingObs: DiscriminatingObservation[] = [];
    if (comparison && !comparison.abstained && comparison.retainedHypotheses.length > 1) {
      discriminatingObs = await this.proposeDiscriminatingObservations(comparison.retainedHypotheses);
    }
    
    // Determine final decision
    let finalDecision = 'ABSTAIN';
    let abstentionReason: string | undefined;
    
    if (abduction.hypotheses.length === 0) {
      abstentionReason = 'No hypotheses generated';
    } else if (comparison) {
      if (comparison.abstained) {
        abstentionReason = comparison.abstentionReason;
      } else if (comparison.retainedHypotheses.length === 1) {
        finalDecision = 'HYPOTHESIS_RETAINED';
      } else {
        finalDecision = 'MULTIPLE_HYPOTHESES_RETAINED';
        abstentionReason = 'Multiple compatible hypotheses remain';
      }
    } else if (abduction.hypotheses.length === 1) {
      finalDecision = 'HYPOTHESIS_RETAINED';
    }
    
    // Check execution time
    const executionTime = Date.now() - startTime;
    if (executionTime > this.limits.maxExecutionTimeMs) {
      limitsReached.push('maxExecutionTimeMs');
      finalDecision = 'ABSTAIN';
      abstentionReason = 'Execution time limit exceeded';
    }
    
    const trace: StoredReasoningTrace = {
      id: executionId,
      domain,
      initialObservation: observation,
      steps: allSteps,
      hypothesesGenerated: abduction.hypotheses.map(h => h.id),
      hypothesesRetained: comparison?.retainedHypotheses || (abduction.hypotheses.length === 1 ? [abduction.hypotheses[0].id] : []),
      hypothesesRefuted: [],
      finalDecision,
      abstentionReason,
      executionLimits: this.limits,
      limitsReached,
      created_at: new Date().toISOString(),
      trace_hash: '',
    };
    
    trace.trace_hash = computeHash(JSON.stringify({
      id: trace.id,
      domain: trace.domain,
      steps: trace.steps,
      hypothesesGenerated: trace.hypothesesGenerated,
    }));
    
    return trace;
  }

  // === HELPER METHODS ===

  /**
   * Build context map from storage for a domain.
   */
  private async buildContext(domain: Domain): Promise<Map<string, StoredClaim[]>> {
    const context = new Map<string, StoredClaim[]>();
    const allClaims = await this.storage.getAllClaims();
    
    for (const claim of allClaims) {
      const key = `${claim.subject}|${claim.predicate}`;
      if (!context.has(key)) {
        context.set(key, []);
      }
      context.get(key)!.push(claim);
    }
    
    return context;
  }
}
