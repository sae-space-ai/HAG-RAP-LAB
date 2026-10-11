/**
 * HAG-RAP Phase 2.2 — Technical System Domain Seed Data
 * 
 * SYNTHETIC data for the TECHNICAL_SYSTEM domain.
 * Simulates component availability and status observations.
 */

import type { StoredSource, StoredClaim, StoredEvidenceLink } from './storage';
import { computeProvenanceHash } from './storage';

// === TECHNICAL SYSTEM SOURCES ===

export const techSources: StoredSource[] = [
  {
    id: 'TECH-SRC-001',
    title: 'Monitor de estado de componentes - Nodo A',
    source_type: 'synthetic_sensor',
    origin_uri: null,
    obtained_at: '2025-01-15T14:00:00Z',
    reliability_metadata: 'SYNTHETIC: Simulated component monitoring system',
    synthetic: true,
    created_at: '2025-01-15T14:00:00Z',
  },
  {
    id: 'TECH-SRC-002',
    title: 'Monitor de estado de componentes - Nodo B',
    source_type: 'synthetic_sensor',
    origin_uri: null,
    obtained_at: '2025-01-15T14:05:00Z',
    reliability_metadata: 'SYNTHETIC: Simulated component monitoring system',
    synthetic: true,
    created_at: '2025-01-15T14:05:00Z',
  },
  {
    id: 'TECH-SRC-003',
    title: 'Registro de alimentación eléctrica',
    source_type: 'synthetic_sensor',
    origin_uri: null,
    obtained_at: '2025-01-15T14:10:00Z',
    reliability_metadata: 'SYNTHETIC: Simulated power monitoring',
    synthetic: true,
    created_at: '2025-01-15T14:10:00Z',
  },
  {
    id: 'TECH-SRC-004',
    title: 'Registro de comunicación de red',
    source_type: 'synthetic_sensor',
    origin_uri: null,
    obtained_at: '2025-01-15T14:15:00Z',
    reliability_metadata: 'SYNTHETIC: Simulated network monitoring',
    synthetic: true,
    created_at: '2025-01-15T14:15:00Z',
  },
];

// === TECHNICAL SYSTEM CLAIMS ===

export const techClaims: StoredClaim[] = [
  // Component COMP-001: Available with power and communication
  {
    id: 'TECH-CLM-001',
    subject: 'COMP-001',
    predicate: 'power_status',
    object_value: 'available',
    unit: null,
    valid_from: '2025-01-15T14:00:00Z',
    valid_to: '2025-01-15T14:59:59Z',
    source_id: 'TECH-SRC-003',
    status: 'corroborated',
    revision: 1,
    synthetic: true,
    created_at: '2025-01-15T14:10:00Z',
  },
  {
    id: 'TECH-CLM-002',
    subject: 'COMP-001',
    predicate: 'communication_status',
    object_value: 'available',
    unit: null,
    valid_from: '2025-01-15T14:00:00Z',
    valid_to: '2025-01-15T14:59:59Z',
    source_id: 'TECH-SRC-004',
    status: 'corroborated',
    revision: 1,
    synthetic: true,
    created_at: '2025-01-15T14:15:00Z',
  },
  {
    id: 'TECH-CLM-003',
    subject: 'COMP-001',
    predicate: 'operational_status',
    object_value: 'available',
    unit: null,
    valid_from: '2025-01-15T14:00:00Z',
    valid_to: '2025-01-15T14:59:59Z',
    source_id: 'TECH-SRC-001',
    status: 'corroborated',
    revision: 1,
    synthetic: true,
    created_at: '2025-01-15T14:00:00Z',
  },
  
  // Component COMP-002: Unavailable, power failure
  {
    id: 'TECH-CLM-004',
    subject: 'COMP-002',
    predicate: 'power_status',
    object_value: 'unavailable',
    unit: null,
    valid_from: '2025-01-15T14:00:00Z',
    valid_to: '2025-01-15T14:59:59Z',
    source_id: 'TECH-SRC-003',
    status: 'corroborated',
    revision: 1,
    synthetic: true,
    created_at: '2025-01-15T14:10:00Z',
  },
  {
    id: 'TECH-CLM-005',
    subject: 'COMP-002',
    predicate: 'operational_status',
    object_value: 'unavailable',
    unit: null,
    valid_from: '2025-01-15T14:00:00Z',
    valid_to: '2025-01-15T14:59:59Z',
    source_id: 'TECH-SRC-001',
    status: 'corroborated',
    revision: 1,
    synthetic: true,
    created_at: '2025-01-15T14:00:00Z',
  },
  
  // Component COMP-003: Unavailable, communication failure
  {
    id: 'TECH-CLM-006',
    subject: 'COMP-003',
    predicate: 'power_status',
    object_value: 'available',
    unit: null,
    valid_from: '2025-01-15T14:00:00Z',
    valid_to: '2025-01-15T14:59:59Z',
    source_id: 'TECH-SRC-003',
    status: 'corroborated',
    revision: 1,
    synthetic: true,
    created_at: '2025-01-15T14:10:00Z',
  },
  {
    id: 'TECH-CLM-007',
    subject: 'COMP-003',
    predicate: 'communication_status',
    object_value: 'unavailable',
    unit: null,
    valid_from: '2025-01-15T14:00:00Z',
    valid_to: '2025-01-15T14:59:59Z',
    source_id: 'TECH-SRC-004',
    status: 'corroborated',
    revision: 1,
    synthetic: true,
    created_at: '2025-01-15T14:15:00Z',
  },
  {
    id: 'TECH-CLM-008',
    subject: 'COMP-003',
    predicate: 'operational_status',
    object_value: 'unavailable',
    unit: null,
    valid_from: '2025-01-15T14:00:00Z',
    valid_to: '2025-01-15T14:59:59Z',
    source_id: 'TECH-SRC-002',
    status: 'corroborated',
    revision: 1,
    synthetic: true,
    created_at: '2025-01-15T14:05:00Z',
  },
  
  // Component COMP-004: Stale data
  {
    id: 'TECH-CLM-009',
    subject: 'COMP-004',
    predicate: 'last_update',
    object_value: '2025-01-14T10:00:00Z',
    unit: null,
    valid_from: '2025-01-14T10:00:00Z',
    valid_to: '2025-01-14T10:59:59Z',
    source_id: 'TECH-SRC-001',
    status: 'stale',
    revision: 1,
    synthetic: true,
    created_at: '2025-01-14T10:00:00Z',
  },
];

// === TECHNICAL SYSTEM EVIDENCE LINKS ===

export const techEvidenceLinks: StoredEvidenceLink[] = [
  {
    id: 'TECH-EVL-001',
    claim_id: 'TECH-CLM-001',
    source_id: 'TECH-SRC-003',
    transformation: 'direct_reading',
    extracted_at: '2025-01-15T14:10:00Z',
    provenance_hash: computeProvenanceHash('TECH-SRC-003', 'TECH-CLM-001', 'direct_reading'),
  },
  {
    id: 'TECH-EVL-002',
    claim_id: 'TECH-CLM-002',
    source_id: 'TECH-SRC-004',
    transformation: 'direct_reading',
    extracted_at: '2025-01-15T14:15:00Z',
    provenance_hash: computeProvenanceHash('TECH-SRC-004', 'TECH-CLM-002', 'direct_reading'),
  },
  {
    id: 'TECH-EVL-003',
    claim_id: 'TECH-CLM-003',
    source_id: 'TECH-SRC-001',
    transformation: 'inferred_from_power_and_comm',
    extracted_at: '2025-01-15T14:00:00Z',
    provenance_hash: computeProvenanceHash('TECH-SRC-001', 'TECH-CLM-003', 'inferred_from_power_and_comm'),
  },
  {
    id: 'TECH-EVL-004',
    claim_id: 'TECH-CLM-004',
    source_id: 'TECH-SRC-003',
    transformation: 'direct_reading',
    extracted_at: '2025-01-15T14:10:00Z',
    provenance_hash: computeProvenanceHash('TECH-SRC-003', 'TECH-CLM-004', 'direct_reading'),
  },
  {
    id: 'TECH-EVL-005',
    claim_id: 'TECH-CLM-005',
    source_id: 'TECH-SRC-001',
    transformation: 'direct_reading',
    extracted_at: '2025-01-15T14:00:00Z',
    provenance_hash: computeProvenanceHash('TECH-SRC-001', 'TECH-CLM-005', 'direct_reading'),
  },
  {
    id: 'TECH-EVL-006',
    claim_id: 'TECH-CLM-006',
    source_id: 'TECH-SRC-003',
    transformation: 'direct_reading',
    extracted_at: '2025-01-15T14:10:00Z',
    provenance_hash: computeProvenanceHash('TECH-SRC-003', 'TECH-CLM-006', 'direct_reading'),
  },
  {
    id: 'TECH-EVL-007',
    claim_id: 'TECH-CLM-007',
    source_id: 'TECH-SRC-004',
    transformation: 'direct_reading',
    extracted_at: '2025-01-15T14:15:00Z',
    provenance_hash: computeProvenanceHash('TECH-SRC-004', 'TECH-CLM-007', 'direct_reading'),
  },
  {
    id: 'TECH-EVL-008',
    claim_id: 'TECH-CLM-008',
    source_id: 'TECH-SRC-002',
    transformation: 'direct_reading',
    extracted_at: '2025-01-15T14:05:00Z',
    provenance_hash: computeProvenanceHash('TECH-SRC-002', 'TECH-CLM-008', 'direct_reading'),
  },
  {
    id: 'TECH-EVL-009',
    claim_id: 'TECH-CLM-009',
    source_id: 'TECH-SRC-001',
    transformation: 'timestamp_check',
    extracted_at: '2025-01-14T10:00:00Z',
    provenance_hash: computeProvenanceHash('TECH-SRC-001', 'TECH-CLM-009', 'timestamp_check'),
  },
];

// === TECHNICAL SYSTEM SCENARIOS ===

export interface TechScenario {
  id: string;
  title: string;
  description: string;
  domain: 'TECHNICAL_SYSTEM';
  observation: string;
  expectedHypotheses: string[];
  classification: 'SYNTHETIC';
}

export const techScenarios: TechScenario[] = [
  {
    id: 'TECH-CASE-001',
    title: 'Componente operativo normal',
    description: 'COMP-001 tiene alimentación y comunicación disponibles. Se espera que esté operativo.',
    domain: 'TECHNICAL_SYSTEM',
    observation: 'COMP-001 operational_status = available',
    expectedHypotheses: ['Normal operation confirmed'],
    classification: 'SYNTHETIC',
  },
  {
    id: 'TECH-CASE-002',
    title: 'Fallo de alimentación',
    description: 'COMP-002 no está operativo y no tiene alimentación. Hipótesis: fallo de alimentación.',
    domain: 'TECHNICAL_SYSTEM',
    observation: 'COMP-002 operational_status = unavailable',
    expectedHypotheses: ['Power failure', 'Component internal failure'],
    classification: 'SYNTHETIC',
  },
  {
    id: 'TECH-CASE-003',
    title: 'Fallo de comunicación',
    description: 'COMP-003 no está operativo pero tiene alimentación. Hipótesis: fallo de comunicación.',
    domain: 'TECHNICAL_SYSTEM',
    observation: 'COMP-003 operational_status = unavailable',
    expectedHypotheses: ['Communication failure', 'Component internal failure'],
    classification: 'SYNTHETIC',
  },
  {
    id: 'TECH-CASE-004',
    title: 'Datos desactualizados',
    description: 'COMP-004 tiene datos con marca de tiempo antigua. Hipótesis: datos desactualizados.',
    domain: 'TECHNICAL_SYSTEM',
    observation: 'COMP-004 data freshness check',
    expectedHypotheses: ['Stale data', 'Component offline'],
    classification: 'SYNTHETIC',
  },
];
