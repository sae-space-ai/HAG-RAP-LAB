/**
 * HAG-RAP Phase 2.2 — DRE Types
 * 
 * Types for the expanded Deep Reasoning Engine with:
 * - Deductive reasoning with typed rules
 * - Abductive hypothesis generation
 * - Hypothesis comparison
 * - Discriminating observation planning
 * 
 * LIMITATIONS:
 * - NOT causal inference
 * - NOT statistical probabilities
 * - All data is SYNTHETIC
 * - Deterministic rule-based reasoning only
 */

// === EPISTEMIC STATES ===

export type EvidenceState = 
  | 'CORROBORATED'
  | 'CONFLICTING'
  | 'INSUFFICIENT'
  | 'INVALID';

export type HypothesisState =
  | 'HYPOTHESIS_PROPOSED'
  | 'HYPOTHESIS_COMPATIBLE'
  | 'HYPOTHESIS_REFUTED'
  | 'UNDERDETERMINED';

export type InferenceMode = 'DEDUCTION' | 'ABDUCTION';

// === DOMAIN TYPES ===

export type Domain = 'METEOROLOGICAL' | 'TECHNICAL_SYSTEM';

export interface DomainMetadata {
  id: Domain;
  name: string;
  description: string;
  predicates: string[];
  valueTypes: string[];
}

// === RULE TYPES ===

export interface TypedPredicate {
  name: string;
  parameterTypes: string[];
  returnType: string;
  domain: Domain;
}

export interface RulePremise {
  predicate: string;
  subject: string;
  expectedValue?: string;
  unit?: string;
}

export interface RuleConclusion {
  predicate: string;
  subject: string;
  value: string;
  unit?: string;
}

export interface RuleCondition {
  type: 'TEMPORAL_OVERLAP' | 'SOURCE_INDEPENDENCE' | 'VALUE_EQUALITY' | 'VALUE_RANGE';
  parameters: Record<string, string>;
}

export interface StoredRule {
  id: string;
  version: string;
  name: string;
  description: string;
  domain: Domain;
  premises: RulePremise[];
  conditions: RuleCondition[];
  conclusion: RuleConclusion;
  limitations: string[];
  created_at: string;
  rule_hash: string;
}

// === HYPOTHESIS TYPES ===

export interface HypothesisPremise {
  type: 'VERIFIED' | 'ASSUMED' | 'UNKNOWN';
  claimId?: string;
  sourceId?: string;
  description: string;
}

export interface HypothesisEvidence {
  type: 'SUPPORTING' | 'CONTRADICTING' | 'NEUTRAL';
  claimId: string;
  sourceId: string;
  explanation: string;
}

export interface HypothesisPrediction {
  predicate: string;
  subject: string;
  expectedValue: string;
  unit?: string;
  testable: boolean;
  description: string;
}

export interface StoredHypothesis {
  id: string;
  executionId: string;
  observation: string;
  ruleId: string;
  ruleVersion: string;
  premises: HypothesisPremise[];
  evidences: HypothesisEvidence[];
  predictions: HypothesisPrediction[];
  unmetConstraints: string[];
  requiredObservations: string[];
  state: HypothesisState;
  explanation: string;
  created_at: string;
  hypothesis_hash: string;
}

// === REASONING TRACE TYPES ===

export interface InferenceStep {
  stepNumber: number;
  mode: InferenceMode;
  ruleId?: string;
  description: string;
  inputs: string[];
  outputs: string[];
}

export interface StoredReasoningTrace {
  id: string;
  domain: Domain;
  initialObservation: string;
  steps: InferenceStep[];
  hypothesesGenerated: string[];
  hypothesesRetained: string[];
  hypothesesRefuted: string[];
  finalDecision: string;
  abstentionReason?: string;
  executionLimits: ExecutionLimits;
  limitsReached: string[];
  created_at: string;
  trace_hash: string;
}

// === EXECUTION LIMITS ===

export interface ExecutionLimits {
  maxRulesEvaluated: number;
  maxHypotheses: number;
  maxInferenceDepth: number;
  maxPremisesPerRule: number;
  maxExecutionTimeMs: number;
  maxResultSizeBytes: number;
  cycleDetection: boolean;
}

export const DEFAULT_LIMITS: ExecutionLimits = {
  maxRulesEvaluated: 100,
  maxHypotheses: 20,
  maxInferenceDepth: 5,
  maxPremisesPerRule: 10,
  maxExecutionTimeMs: 5000,
  maxResultSizeBytes: 1048576, // 1MB
  cycleDetection: true,
};

// === COMPARISON TYPES ===

export interface ComparisonCriterion {
  name: string;
  description: string;
  weight: number;
}

export interface HypothesisScore {
  hypothesisId: string;
  criterionScores: Record<string, number>;
  totalScore: number;
  rank: number;
  explanation: string;
}

export interface ComparisonResult {
  hypothesisIds: string[];
  criteria: ComparisonCriterion[];
  scores: HypothesisScore[];
  retainedHypotheses: string[];
  abstained: boolean;
  abstentionReason?: string;
}

// === DISCRIMINATING OBSERVATION TYPES ===

export interface DiscriminatingObservation {
  id: string;
  hypothesisIds: string[];
  predicate: string;
  subject: string;
  expectedValues: Record<string, string>;
  unit?: string;
  description: string;
  discriminatingPower: 'HIGH' | 'MEDIUM' | 'LOW';
}

// === BENCHMARK TYPES ===

export interface BenchmarkCase {
  id: string;
  domain: Domain;
  description: string;
  observation: string;
  expectedHypotheses: string[];
  expectedDecision: string;
  category: string;
}

export interface BenchmarkResult {
  caseId: string;
  passed: boolean;
  actualHypotheses: string[];
  actualDecision: string;
  executionTimeMs: number;
  error?: string;
}

export interface BenchmarkReport {
  version: string;
  executedAt: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  results: BenchmarkResult[];
  metrics: BenchmarkMetrics;
}

export interface BenchmarkMetrics {
  totalCases: number;
  executedCases: number;
  passedCases: number;
  inferenceErrors: number;
  correctAbstentions: number;
  incorrectAbstentions: number;
  compatibleHypothesesIdentified: number;
  discardedHypotheses: number;
  ruleCoverage: number;
  completeTraces: number;
  resultsByDomain: Record<Domain, { total: number; passed: number }>;
  averageExecutionTimeMs: number;
}
