/**
 * HAG-RAP Phase 0 — Synthetic Test Fixtures
 * ALL DATA IS MARKED AS SYNTHETIC. No real-world data is used.
 * These fixtures demonstrate the evaluation engine's behavior.
 */

import type { Source, Evidence, Claim, DemoCase } from './types';

// === SOURCES (all SYNTHETIC) ===

export const sources: Source[] = [
  {
    id: 'SRC-001',
    title: 'Informe meteorológico sintético A',
    origin: 'SYNTHETIC: Generated for testing HAG-RAP prototype',
    observedAt: '2025-01-15T10:00:00Z',
    classification: 'SYNTHETIC',
  },
  {
    id: 'SRC-002',
    title: 'Informe meteorológico sintético B',
    origin: 'SYNTHETIC: Generated for testing HAG-RAP prototype',
    observedAt: '2025-01-15T10:30:00Z',
    classification: 'SYNTHETIC',
  },
  {
    id: 'SRC-003',
    title: 'Registro de temperatura sintético C',
    origin: 'SYNTHETIC: Generated for testing HAG-RAP prototype',
    observedAt: '2025-01-15T11:00:00Z',
    classification: 'SYNTHETIC',
  },
  {
    id: 'SRC-004',
    title: 'Sensor ficticio D',
    origin: 'SYNTHETIC: Generated for testing HAG-RAP prototype',
    observedAt: '2025-01-15T12:00:00Z',
    classification: 'SYNTHETIC',
  },
];

// === EVIDENCES (all SYNTHETIC) ===

export const evidences: Evidence[] = [
  // Case 1: Two independent sources agree (SUPPORTED)
  {
    id: 'EVD-001',
    sourceId: 'SRC-001',
    subjectId: 'SUBJ-TEMP-MADRID',
    predicate: 'temperature_celsius',
    value: '22',
    collectedAt: '2025-01-15T10:00:00Z',
    transformations: ['raw_extraction'],
    classification: 'SYNTHETIC',
    status: 'VALID',
  },
  {
    id: 'EVD-002',
    sourceId: 'SRC-002',
    subjectId: 'SUBJ-TEMP-MADRID',
    predicate: 'temperature_celsius',
    value: '22',
    collectedAt: '2025-01-15T10:30:00Z',
    transformations: ['raw_extraction'],
    classification: 'SYNTHETIC',
    status: 'VALID',
  },

  // Case 2: Two sources contradict (CONTRADICTED)
  {
    id: 'EVD-003',
    sourceId: 'SRC-001',
    subjectId: 'SUBJ-HUMIDITY-BARCELONA',
    predicate: 'humidity_percent',
    value: '65',
    collectedAt: '2025-01-15T10:00:00Z',
    transformations: ['raw_extraction'],
    classification: 'SYNTHETIC',
    status: 'VALID',
  },
  {
    id: 'EVD-004',
    sourceId: 'SRC-003',
    subjectId: 'SUBJ-HUMIDITY-BARCELONA',
    predicate: 'humidity_percent',
    value: '89',
    collectedAt: '2025-01-15T11:00:00Z',
    transformations: ['raw_extraction'],
    classification: 'SYNTHETIC',
    status: 'VALID',
  },

  // Case 3: No evidence exists (INSUFFICIENT_EVIDENCE)
  // (No evidence records for this subject+predicate)

  // Case 4: Reference to non-existent evidence (ERROR)
  // (Claim references EVD-999 which does not exist)
  {
    id: 'EVD-005',
    sourceId: 'SRC-004',
    subjectId: 'SUBJ-PRESSURE-VALENCIA',
    predicate: 'pressure_hpa',
    value: '1013',
    collectedAt: '2025-01-15T12:00:00Z',
    transformations: ['raw_extraction'],
    classification: 'SYNTHETIC',
    status: 'VALID',
  },
];

// === CLAIMS ===

export const claims: Claim[] = [
  // Case 1: Two sources agree -> SUPPORTED
  {
    id: 'CLM-001',
    subjectId: 'SUBJ-TEMP-MADRID',
    predicate: 'temperature_celsius',
    proposedValue: '22',
    evidenceIds: ['EVD-001', 'EVD-002'],
    status: 'SUPPORTED',
    classification: 'SYNTHETIC',
  },
  // Case 2: Two sources contradict -> CONTRADICTED / ABSTAIN
  {
    id: 'CLM-002',
    subjectId: 'SUBJ-HUMIDITY-BARCELONA',
    predicate: 'humidity_percent',
    proposedValue: '65',
    evidenceIds: ['EVD-003', 'EVD-004'],
    status: 'CONTRADICTED',
    classification: 'SYNTHETIC',
  },
  // Case 3: No evidence -> INSUFFICIENT_EVIDENCE / ABSTAIN
  {
    id: 'CLM-003',
    subjectId: 'SUBJ-WIND-SEVILLA',
    predicate: 'wind_speed_kmh',
    proposedValue: '15',
    evidenceIds: [],
    status: 'INSUFFICIENT_EVIDENCE',
    classification: 'SYNTHETIC',
  },
  // Case 4: Reference to non-existent evidence -> ERROR
  {
    id: 'CLM-004',
    subjectId: 'SUBJ-PRESSURE-VALENCIA',
    predicate: 'pressure_hpa',
    proposedValue: '1013',
    evidenceIds: ['EVD-005', 'EVD-999'],
    status: 'ERROR',
    classification: 'SYNTHETIC',
  },
  // Case 5: Determinism test (same data -> same result)
  {
    id: 'CLM-005',
    subjectId: 'SUBJ-TEMP-MADRID',
    predicate: 'temperature_celsius',
    proposedValue: '22',
    evidenceIds: ['EVD-001', 'EVD-002'],
    status: 'SUPPORTED',
    classification: 'SYNTHETIC',
  },
];

// === DEMO CASES (for the UI selector) ===

export const demoCases: DemoCase[] = [
  {
    id: 'CASE-001',
    title: 'Caso 1: Fuentes concordantes',
    description: 'Dos fuentes independientes coinciden en el mismo valor. Resultado esperado: SUPPORTED.',
    expectedOutcome: 'SUPPORTED',
    classification: 'SYNTHETIC',
  },
  {
    id: 'CASE-002',
    title: 'Caso 2: Fuentes contradictorias',
    description: 'Dos fuentes aportan valores incompatibles sobre el mismo hecho. Resultado esperado: CONTRADICTED → ABSTAIN.',
    expectedOutcome: 'CONTRADICTED',
    classification: 'SYNTHETIC',
  },
  {
    id: 'CASE-003',
    title: 'Caso 3: Sin evidencia',
    description: 'No existe evidencia válida para la afirmación. Resultado esperado: INSUFFICIENT_EVIDENCE → ABSTAIN.',
    expectedOutcome: 'INSUFFICIENT_EVIDENCE',
    classification: 'SYNTHETIC',
  },
  {
    id: 'CASE-004',
    title: 'Caso 4: Referencia inexistente',
    description: 'La afirmación referencia evidencia que no existe. Resultado esperado: ERROR de validación.',
    expectedOutcome: 'ERROR',
    classification: 'SYNTHETIC',
  },
  {
    id: 'CASE-005',
    title: 'Caso 5: Determinismo',
    description: 'Mismos datos y versión de algoritmo producen la misma clasificación. Verifica reproducibilidad.',
    expectedOutcome: 'SUPPORTED',
    classification: 'SYNTHETIC',
  },
];

// === MAPPING: DemoCase ID -> Claim ID ===

export const caseToClaimMap: Record<string, string> = {
  'CASE-001': 'CLM-001',
  'CASE-002': 'CLM-002',
  'CASE-003': 'CLM-003',
  'CASE-004': 'CLM-004',
  'CASE-005': 'CLM-005',
};
