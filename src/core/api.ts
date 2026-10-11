/**
 * HAG-RAP Phase 0 — API Service Layer
 * 
 * In a production deployment, these would be HTTP endpoints.
 * In this SPA prototype, they are TypeScript functions that
 * the UI calls directly. The logic is identical to what a
 * server would execute.
 * 
 * IMPORTANT: No persistence. All data is in-memory and SYNTHETIC.
 */

import type {
  HealthResponse,
  CapabilitiesResponse,
  DemoCase,
  EvaluationResponse,
  ErrorResponse,
} from './types';

import { CAPABILITIES, getCapabilitiesSummary } from './capabilities';
import { EvidenceGraphMemory, ALGORITHM_VERSION } from './egm-lite';
import { sources, evidences, claims, demoCases, caseToClaimMap } from './fixtures';

// === SINGLETON: In-memory evidence graph ===
let egmInstance: EvidenceGraphMemory | null = null;

function getEGM(): EvidenceGraphMemory {
  if (!egmInstance) {
    egmInstance = new EvidenceGraphMemory();
    egmInstance.loadSources(sources);
    egmInstance.loadEvidences(evidences);
    egmInstance.loadClaims(claims);
  }
  return egmInstance;
}

// === API FUNCTIONS ===

/**
 * GET /api/health
 * Confirms the process responds and reports actually verified dependencies.
 */
export function apiHealth(): HealthResponse {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    dependencies: {
      coreLogic: 'VERIFIED',
      persistence: 'DEMO_NO_PERSISTENT',
      externalServices: 'NONE_CONNECTED',
    },
    version: ALGORITHM_VERSION,
  };
}

/**
 * GET /api/capabilities
 * Returns the true status of all seven components.
 */
export function apiCapabilities(): CapabilitiesResponse {
  const summary = getCapabilitiesSummary();
  return {
    components: CAPABILITIES,
    totalImplemented: summary.verified,
    totalNotImplemented: summary.notImplemented,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * GET /api/demo/cases
 * Lists predefined synthetic test cases with their limitations.
 */
export function apiDemoCases(): DemoCase[] {
  return demoCases;
}

/**
 * GET /api/demo/cases/[id]/evaluate
 * Executes deterministic evaluation of a case on the server side.
 * Returns evidence, provenance, conflict, and applied rule.
 */
export function apiEvaluateCase(
  caseId: string
): EvaluationResponse | ErrorResponse {
  // Validate case ID
  const demoCase = demoCases.find((c) => c.id === caseId);
  if (!demoCase) {
    return {
      error: `Caso de demostración "${caseId}" no encontrado`,
      code: 'CASE_NOT_FOUND',
      details: `Los casos disponibles son: ${demoCases.map((c) => c.id).join(', ')}`,
    };
  }

  // Map case to claim
  const claimId = caseToClaimMap[caseId];
  if (!claimId) {
    return {
      error: `No existe mapeo entre caso "${caseId}" y una afirmación`,
      code: 'CASE_CLAIM_MAPPING_ERROR',
    };
  }

  const egm = getEGM();

  // Get claim
  const claim = egm.getClaim(claimId);
  if (!claim) {
    return {
      error: `Afirmación "${claimId}" no encontrada en el grafo de evidencias`,
      code: 'CLAIM_NOT_FOUND',
    };
  }

  // Execute evaluation
  let evaluation;
  try {
    const result = egm.evaluate(claimId);
    evaluation = result;
  } catch (err) {
    return {
      error: `Error durante la evaluación: ${err instanceof Error ? err.message : String(err)}`,
      code: 'EVALUATION_ERROR',
    };
  }

  // Gather evidences and sources for provenance
  const evidencesForClaim = claim.evidenceIds
    .map((id) => egm.getEvidence(id))
    .filter((e): e is NonNullable<typeof e> => e !== undefined);

  const sourceIds = [...new Set(evidencesForClaim.map((e) => e.sourceId))];
  const sourcesForClaim = sourceIds
    .map((id) => egm.getSource(id))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);

  return {
    caseId,
    evaluation,
    claim,
    evidences: evidencesForClaim,
    sources: sourcesForClaim,
    classification: 'SYNTHETIC',
  };
}

/**
 * Reset the in-memory store (for testing purposes).
 */
export function apiReset(): void {
  egmInstance = null;
}
