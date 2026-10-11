/**
 * HAG-RAP Phase 1 — Synthetic Seed Data
 * 
 * ALL DATA IS SYNTHETIC. No real-world data.
 * Idempotent: running seed multiple times does not duplicate records.
 */

import type { StoredSource, StoredClaim, StoredEvidenceLink } from './storage';
import { computeProvenanceHash } from './storage';

export interface SeedScenario {
  id: string;
  title: string;
  description: string;
  expectedVerdict: string;
  claimId: string;
  classification: 'SYNTHETIC';
}

export const seedSources: StoredSource[] = [
  {
    id: 'SRC-001',
    title: 'Informe meteorológico sintético A',
    source_type: 'synthetic_report',
    origin_uri: null,
    obtained_at: '2025-01-15T10:00:00Z',
    reliability_metadata: 'SYNTHETIC: Generated for testing HAG-RAP prototype',
    synthetic: true,
    created_at: '2025-01-15T10:00:00Z',
  },
  {
    id: 'SRC-002',
    title: 'Informe meteorológico sintético B',
    source_type: 'synthetic_report',
    origin_uri: null,
    obtained_at: '2025-01-15T10:30:00Z',
    reliability_metadata: 'SYNTHETIC: Generated for testing HAG-RAP prototype',
    synthetic: true,
    created_at: '2025-01-15T10:30:00Z',
  },
  {
    id: 'SRC-003',
    title: 'Registro de temperatura sintético C',
    source_type: 'synthetic_sensor',
    origin_uri: null,
    obtained_at: '2025-01-15T11:00:00Z',
    reliability_metadata: 'SYNTHETIC: Generated for testing HAG-RAP prototype',
    synthetic: true,
    created_at: '2025-01-15T11:00:00Z',
  },
  {
    id: 'SRC-004',
    title: 'Sensor ficticio D',
    source_type: 'synthetic_sensor',
    origin_uri: null,
    obtained_at: '2025-01-15T12:00:00Z',
    reliability_metadata: 'SYNTHETIC: Generated for testing HAG-RAP prototype',
    synthetic: true,
    created_at: '2025-01-15T12:00:00Z',
  },
  {
    id: 'SRC-005',
    title: 'Copia derivada de SRC-001 (no independiente)',
    source_type: 'synthetic_derivative',
    origin_uri: null,
    obtained_at: '2025-01-15T10:05:00Z',
    reliability_metadata: 'SYNTHETIC: Derivative of SRC-001, NOT independent confirmation',
    synthetic: true,
    created_at: '2025-01-15T10:05:00Z',
  },
  {
    id: 'SRC-006',
    title: 'Informe de periodo diferente',
    source_type: 'synthetic_report',
    origin_uri: null,
    obtained_at: '2025-01-16T10:00:00Z',
    reliability_metadata: 'SYNTHETIC: Different time period than SRC-001',
    synthetic: true,
    created_at: '2025-01-16T10:00:00Z',
  },
];

// A deliberately UNRESOLVED external reference is represented by an explicit
// synthetic placeholder. We do not insert broken foreign keys into SQLite.
// The engine treats this record as unavailable and returns ERROR / ABSTAIN.
seedSources.push({
  id: 'SRC-NONEXISTENT',
  title: 'UNRESOLVED EXTERNAL SOURCE — synthetic placeholder (not evidence)',
  source_type: 'synthetic_unresolved_reference',
  origin_uri: null,
  obtained_at: '2025-01-15T12:00:00Z',
  reliability_metadata: 'SYNTHETIC: Unavailable source marker; must never support a claim',
  synthetic: true,
  created_at: '2025-01-15T12:00:00Z',
});

export const seedClaims: StoredClaim[] = [
  // Case 1: Two independent sources agree
  {
    id: 'CLM-001',
    subject: 'SUBJ-TEMP-MADRID',
    predicate: 'temperature_celsius',
    object_value: '22',
    unit: '°C',
    valid_from: '2025-01-15T10:00:00Z',
    valid_to: '2025-01-15T10:59:59Z',
    source_id: 'SRC-001',
    status: 'supported',
    revision: 1,
    synthetic: true,
    created_at: '2025-01-15T10:00:00Z',
  },
  {
    id: 'CLM-001B',
    subject: 'SUBJ-TEMP-MADRID',
    predicate: 'temperature_celsius',
    object_value: '22',
    unit: '°C',
    valid_from: '2025-01-15T10:00:00Z',
    valid_to: '2025-01-15T10:59:59Z',
    source_id: 'SRC-002',
    status: 'supported',
    revision: 1,
    synthetic: true,
    created_at: '2025-01-15T10:30:00Z',
  },
  // Case 2: Contradictory values
  {
    id: 'CLM-002',
    subject: 'SUBJ-HUMIDITY-BARCELONA',
    predicate: 'humidity_percent',
    object_value: '65',
    unit: '%',
    valid_from: '2025-01-15T10:00:00Z',
    valid_to: '2025-01-15T10:59:59Z',
    source_id: 'SRC-001',
    status: 'contradicted',
    revision: 1,
    synthetic: true,
    created_at: '2025-01-15T10:00:00Z',
  },
  {
    id: 'CLM-002B',
    subject: 'SUBJ-HUMIDITY-BARCELONA',
    predicate: 'humidity_percent',
    object_value: '89',
    unit: '%',
    valid_from: '2025-01-15T10:00:00Z',
    valid_to: '2025-01-15T10:59:59Z',
    source_id: 'SRC-003',
    status: 'contradicted',
    revision: 1,
    synthetic: true,
    created_at: '2025-01-15T11:00:00Z',
  },
  // Case 3: No evidence (claim exists but no evidence links)
  {
    id: 'CLM-003',
    subject: 'SUBJ-WIND-SEVILLA',
    predicate: 'wind_speed_kmh',
    object_value: '15',
    unit: 'km/h',
    valid_from: '2025-01-15T10:00:00Z',
    valid_to: '2025-01-15T10:59:59Z',
    source_id: 'SRC-001',
    status: 'pending',
    revision: 1,
    synthetic: true,
    created_at: '2025-01-15T10:00:00Z',
  },
  // Case 4: Unresolved external source represented by a non-evidence placeholder
  {
    id: 'CLM-004',
    subject: 'SUBJ-PRESSURE-VALENCIA',
    predicate: 'pressure_hpa',
    object_value: '1013',
    unit: 'hPa',
    valid_from: '2025-01-15T12:00:00Z',
    valid_to: '2025-01-15T12:59:59Z',
    source_id: 'SRC-004',
    status: 'error',
    revision: 1,
    synthetic: true,
    created_at: '2025-01-15T12:00:00Z',
  },
  // Case 5: Determinism test (same as Case 1)
  {
    id: 'CLM-005',
    subject: 'SUBJ-TEMP-MADRID',
    predicate: 'temperature_celsius',
    object_value: '22',
    unit: '°C',
    valid_from: '2025-01-15T10:00:00Z',
    valid_to: '2025-01-15T10:59:59Z',
    source_id: 'SRC-001',
    status: 'supported',
    revision: 1,
    synthetic: true,
    created_at: '2025-01-15T10:00:00Z',
  },
  // Case 6: Derivative source (not independent confirmation)
  {
    id: 'CLM-006',
    subject: 'SUBJ-TEMP-MADRID',
    predicate: 'temperature_celsius',
    object_value: '22',
    unit: '°C',
    valid_from: '2025-01-15T10:00:00Z',
    valid_to: '2025-01-15T10:59:59Z',
    source_id: 'SRC-005',
    status: 'pending',
    revision: 1,
    synthetic: true,
    created_at: '2025-01-15T10:05:00Z',
  },
  // Case 7: Different time period
  {
    id: 'CLM-007',
    subject: 'SUBJ-TEMP-MADRID',
    predicate: 'temperature_celsius',
    object_value: '18',
    unit: '°C',
    valid_from: '2025-01-16T10:00:00Z',
    valid_to: '2025-01-16T10:59:59Z',
    source_id: 'SRC-006',
    status: 'pending',
    revision: 1,
    synthetic: true,
    created_at: '2025-01-16T10:00:00Z',
  },
];

export const seedEvidenceLinks: StoredEvidenceLink[] = [
  // Case 1: Two independent sources
  {
    id: 'EVL-001',
    claim_id: 'CLM-001',
    source_id: 'SRC-001',
    transformation: 'raw_extraction',
    extracted_at: '2025-01-15T10:00:00Z',
    provenance_hash: computeProvenanceHash('SRC-001', 'CLM-001', 'raw_extraction'),
  },
  {
    id: 'EVL-002',
    claim_id: 'CLM-001B',
    source_id: 'SRC-002',
    transformation: 'raw_extraction',
    extracted_at: '2025-01-15T10:30:00Z',
    provenance_hash: computeProvenanceHash('SRC-002', 'CLM-001B', 'raw_extraction'),
  },
  // Case 2: Contradictory
  {
    id: 'EVL-003',
    claim_id: 'CLM-002',
    source_id: 'SRC-001',
    transformation: 'raw_extraction',
    extracted_at: '2025-01-15T10:00:00Z',
    provenance_hash: computeProvenanceHash('SRC-001', 'CLM-002', 'raw_extraction'),
  },
  {
    id: 'EVL-004',
    claim_id: 'CLM-002B',
    source_id: 'SRC-003',
    transformation: 'raw_extraction',
    extracted_at: '2025-01-15T11:00:00Z',
    provenance_hash: computeProvenanceHash('SRC-003', 'CLM-002B', 'raw_extraction'),
  },
  // Case 3: No evidence links (CLM-003 has no links)
  // Case 4: Reference to non-existent source
  {
    id: 'EVL-005',
    claim_id: 'CLM-004',
    source_id: 'SRC-004',
    transformation: 'raw_extraction',
    extracted_at: '2025-01-15T12:00:00Z',
    provenance_hash: computeProvenanceHash('SRC-004', 'CLM-004', 'raw_extraction'),
  },
  {
    id: 'EVL-006',
    claim_id: 'CLM-004',
    source_id: 'SRC-NONEXISTENT',
    transformation: 'raw_extraction',
    extracted_at: '2025-01-15T12:00:00Z',
    provenance_hash: computeProvenanceHash('SRC-NONEXISTENT', 'CLM-004', 'raw_extraction'),
  },
  // Case 5: Determinism (same as Case 1)
  {
    id: 'EVL-007',
    claim_id: 'CLM-005',
    source_id: 'SRC-001',
    transformation: 'raw_extraction',
    extracted_at: '2025-01-15T10:00:00Z',
    provenance_hash: computeProvenanceHash('SRC-001', 'CLM-005', 'raw_extraction'),
  },
  {
    id: 'EVL-008',
    claim_id: 'CLM-005',
    source_id: 'SRC-002',
    transformation: 'raw_extraction',
    extracted_at: '2025-01-15T10:30:00Z',
    provenance_hash: computeProvenanceHash('SRC-002', 'CLM-005', 'raw_extraction'),
  },
  // Case 6: Derivative source
  {
    id: 'EVL-009',
    claim_id: 'CLM-006',
    source_id: 'SRC-005',
    transformation: 'derived_from_SRC-001',
    extracted_at: '2025-01-15T10:05:00Z',
    provenance_hash: computeProvenanceHash('SRC-005', 'CLM-006', 'derived_from_SRC-001'),
  },
  // Case 7: Different period
  {
    id: 'EVL-010',
    claim_id: 'CLM-007',
    source_id: 'SRC-006',
    transformation: 'raw_extraction',
    extracted_at: '2025-01-16T10:00:00Z',
    provenance_hash: computeProvenanceHash('SRC-006', 'CLM-007', 'raw_extraction'),
  },
];

export const seedScenarios: SeedScenario[] = [
  {
    id: 'CASE-001',
    title: 'Caso 1: Fuentes independientes concordantes',
    description: 'Dos fuentes independientes coinciden en el mismo valor. Resultado esperado: SUPPORTED.',
    expectedVerdict: 'SUPPORTED',
    claimId: 'CLM-001',
    classification: 'SYNTHETIC',
  },
  {
    id: 'CASE-002',
    title: 'Caso 2: Fuentes contradictorias',
    description: 'Dos fuentes aportan valores incompatibles sobre el mismo hecho y periodo. Resultado esperado: CONTRADICTED → ABSTAIN.',
    expectedVerdict: 'CONTRADICTED',
    claimId: 'CLM-002',
    classification: 'SYNTHETIC',
  },
  {
    id: 'CASE-003',
    title: 'Caso 3: Sin evidencia',
    description: 'No existe enlace de evidencia válido para la afirmación. Resultado esperado: INSUFFICIENT_EVIDENCE → ABSTAIN.',
    expectedVerdict: 'INSUFFICIENT_EVIDENCE',
    claimId: 'CLM-003',
    classification: 'SYNTHETIC',
  },
  {
    id: 'CASE-004',
    title: 'Caso 4: Referencia externa no resoluble',
    description: 'Marcador sintético de fuente externa no resuelta: no es evidencia admisible. Resultado esperado: ERROR → ABSTAIN.',
    expectedVerdict: 'ERROR',
    claimId: 'CLM-004',
    classification: 'SYNTHETIC',
  },
  {
    id: 'CASE-005',
    title: 'Caso 5: Determinismo',
    description: 'Mismos datos y versión de algoritmo producen la misma clasificación. Verifica reproducibilidad.',
    expectedVerdict: 'SUPPORTED',
    claimId: 'CLM-005',
    classification: 'SYNTHETIC',
  },
  {
    id: 'CASE-006',
    title: 'Caso 6: Fuente derivada (no independiente)',
    description: 'Una fuente es copia derivada de otra. No constituye confirmación independiente.',
    expectedVerdict: 'INSUFFICIENT_EVIDENCE',
    claimId: 'CLM-006',
    classification: 'SYNTHETIC',
  },
  {
    id: 'CASE-007',
    title: 'Caso 7: Periodo temporal diferente',
    description: 'Valores de periodos temporales distintos: no hay contradicción temporal, pero una sola fuente no basta para apoyar la afirmación.',
    expectedVerdict: 'INSUFFICIENT_EVIDENCE',
    claimId: 'CLM-007',
    classification: 'SYNTHETIC',
  },
];
