/**
 * HAG-RAP Phase 0 — Core Type Definitions
 * All types are strict and validated. No implicit any.
 * SYNTHETIC data is explicitly marked throughout.
 */

// === CLASSIFICATIONS ===
export type DataClassification = 'SYNTHETIC' | 'REAL' | 'CLASSIFIED';
export type EvidenceStatus = 'VALID' | 'INVALID' | 'PENDING_REVIEW';
export type ClaimStatus = 'SUPPORTED' | 'CONTRADICTED' | 'INSUFFICIENT_EVIDENCE' | 'ABSTAIN' | 'ERROR';
export type ComponentStatus = 'NO_IMPLEMENTADO' | 'IMPLEMENTADO_SIN_VERIFICAR' | 'VERIFICADO_LOCAL' | 'BLOQUEADO';

// === ENTITIES ===

/**
 * Source: origin of evidence. In Phase 0, all sources are SYNTHETIC.
 */
export interface Source {
  id: string;
  title: string;
  origin: string;
  observedAt: string; // ISO 8601
  classification: DataClassification;
}

/**
 * Evidence: a single observation linked to a source.
 */
export interface Evidence {
  id: string;
  sourceId: string;
  subjectId: string;
  predicate: string;
  value: string;
  collectedAt: string; // ISO 8601
  transformations: string[]; // chain of transformations applied
  classification: DataClassification;
  status: EvidenceStatus;
}

/**
 * Claim: a proposition to be evaluated against evidence.
 */
export interface Claim {
  id: string;
  subjectId: string;
  predicate: string;
  proposedValue: string;
  evidenceIds: string[];
  status: ClaimStatus;
  classification: DataClassification;
}

/**
 * Evaluation: result of evaluating a claim against evidence.
 */
export interface Evaluation {
  claimId: string;
  status: ClaimStatus;
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  missingEvidence: string[];
  evaluatedAt: string; // ISO 8601
  algorithmVersion: string;
  ruleApplied: string;
  explanation: string;
  classification: DataClassification;
}

// === COMPONENT REGISTRY ===

export interface ComponentCapability {
  id: string;
  name: string;
  fullName: string;
  status: ComponentStatus;
  description: string;
  workPackage: string;
  testReference: string | null;
}

// === API RESPONSE TYPES ===

export interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  dependencies: {
    coreLogic: 'VERIFIED';
    persistence: 'DEMO_NO_PERSISTENT';
    externalServices: 'NONE_CONNECTED';
  };
  version: string;
}

export interface CapabilitiesResponse {
  components: ComponentCapability[];
  totalImplemented: number;
  totalNotImplemented: number;
  generatedAt: string;
}

export interface DemoCase {
  id: string;
  title: string;
  description: string;
  expectedOutcome: ClaimStatus;
  classification: DataClassification;
}

export interface EvaluationResponse {
  caseId: string;
  evaluation: Evaluation;
  claim: Claim;
  evidences: Evidence[];
  sources: Source[];
  classification: DataClassification;
}

export interface ErrorResponse {
  error: string;
  code: string;
  details?: string;
}
