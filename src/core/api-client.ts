/**
 * HAG-RAP Phase 1 — Frontend API Client
 * 
 * Uses real HTTP fetch to the backend server.
 * Shows SIN CONEXIÓN when backend is unavailable.
 * NEVER fabricates success data.
 */

const API_BASE = '/api/v1';

export interface ApiState {
  connected: boolean;
  lastError: string | null;
  lastChecked: string | null;
}

let apiState: ApiState = {
  connected: false,
  lastError: null,
  lastChecked: null,
};

export function getApiState(): ApiState {
  return { ...apiState };
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(
        errorBody?.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    apiState = {
      connected: true,
      lastError: null,
      lastChecked: new Date().toISOString(),
    };

    return response.json();
  } catch (error) {
    apiState = {
      connected: false,
      lastError: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date().toISOString(),
    };
    throw error;
  }
}

// === API FUNCTIONS ===

export interface HealthData {
  status: string;
  timestamp: string;
  version: string;
  runtime: string;
  dependencies: Record<string, string>;
  stats: Record<string, number>;
}

export async function fetchHealth(): Promise<HealthData> {
  return fetchJson<HealthData>('/health');
}

export interface CapabilitiesData {
  components: Array<{
    id: string;
    name: string;
    fullName: string;
    status: string;
    description: string;
    workPackage: string;
    testReference: string | null;
  }>;
  totalImplemented: number;
  totalNotImplemented: number;
  generatedAt: string;
}

export async function fetchCapabilities(): Promise<CapabilitiesData> {
  return fetchJson<CapabilitiesData>('/capabilities');
}

export interface CaseData {
  id: string;
  title: string;
  description: string;
  expectedVerdict: string;
  claimId: string;
  classification: string;
}

export interface CasesListData {
  cases: CaseData[];
  classification: string;
  count: number;
}

export async function fetchCases(): Promise<CasesListData> {
  return fetchJson<CasesListData>('/cases');
}

export interface CaseDetailData {
  case: CaseData;
  claim: Record<string, unknown>;
  evidenceLinks: Array<Record<string, unknown>>;
  sources: Array<Record<string, unknown>>;
  classification: string;
}

export async function fetchCaseDetail(caseId: string): Promise<CaseDetailData> {
  return fetchJson<CaseDetailData>(`/cases/${caseId}`);
}

export interface EvaluationInput {
  claimId?: string;
  caseId?: string;
}

export interface EvaluationData {
  evaluation: {
    id: string;
    caseId: string | null;
    algorithmVersion: string;
    verdict: string;
    decision: string;
    appliedRule: string;
    inputsHash: string;
    explanation: string;
    supportingSourceIds: string[];
    contradictingSourceIds: string[];
    missingInfo: string[];
    evidenceLinks: Array<Record<string, unknown>>;
    sources: Array<Record<string, unknown>>;
    claim: Record<string, unknown> | null;
    createdAt: string;
  };
  classification: string;
}

export async function fetchEvaluate(input: EvaluationInput): Promise<EvaluationData> {
  return fetchJson<EvaluationData>('/evaluations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export interface EvaluationRecord {
  evaluation: EvaluationData['evaluation'];
  storedAt: string;
  classification: string;
}

export async function fetchEvaluation(evaluationId: string): Promise<EvaluationRecord> {
  return fetchJson<EvaluationRecord>(`/evaluations/${evaluationId}`);
}

export interface EvaluationsListData {
  evaluations: Array<{
    id: string;
    caseId: string | null;
    verdict: string;
    decision: string;
    appliedRule: string;
    createdAt: string;
  }>;
  count: number;
}

export async function fetchEvaluations(): Promise<EvaluationsListData> {
  return fetchJson<EvaluationsListData>('/evaluations');
}

export async function checkConnection(): Promise<boolean> {
  try {
    await fetchHealth();
    return true;
  } catch {
    return false;
  }
}
