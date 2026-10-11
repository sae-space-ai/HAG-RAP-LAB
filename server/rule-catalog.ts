/**
 * HAG-RAP Phase 2.2 — Rule Catalog
 * 
 * Explicit rule definitions for two synthetic domains:
 * 1. METEOROLOGICAL: Temperature, humidity, pressure
 * 2. TECHNICAL_SYSTEM: Component availability and status
 * 
 * Rules are data structures, NOT executable code.
 * Each rule has explicit premises, conditions, and conclusions.
 */

import type { StoredRule, Domain } from './dre-types';
import { computeHash } from './storage';

function computeRuleHash(rule: Omit<StoredRule, 'rule_hash' | 'created_at'>): string {
  const canonical = JSON.stringify({
    id: rule.id,
    version: rule.version,
    premises: rule.premises,
    conditions: rule.conditions,
    conclusion: rule.conclusion,
  });
  return computeHash(canonical);
}

// === METEOROLOGICAL DOMAIN RULES ===

const METEOROLOGICAL_RULES: StoredRule[] = [
  {
    id: 'METEO-R001',
    version: '1.0.0',
    name: 'Temperature Consistency',
    description: 'If two independent sources report the same temperature for the same location and time period, the reading is corroborated.',
    domain: 'METEOROLOGICAL',
    premises: [
      { predicate: 'temperature_celsius', subject: 'location', expectedValue: undefined },
      { predicate: 'temperature_celsius', subject: 'location', expectedValue: undefined },
    ],
    conditions: [
      { type: 'SOURCE_INDEPENDENCE', parameters: {} },
      { type: 'TEMPORAL_OVERLAP', parameters: {} },
      { type: 'VALUE_EQUALITY', parameters: {} },
    ],
    conclusion: { predicate: 'temperature_confirmed', subject: 'location', value: 'corroborated' },
    limitations: [
      'Does not verify sensor calibration',
      'Assumes time synchronization between sources',
      'Only valid within same temporal window',
    ],
    created_at: '2025-01-15T00:00:00Z',
    rule_hash: '',
  },
  {
    id: 'METEO-R002',
    version: '1.0.0',
    name: 'Humidity-Temperature Correlation',
    description: 'High humidity with stable temperature suggests precipitation possibility.',
    domain: 'METEOROLOGICAL',
    premises: [
      { predicate: 'humidity_percent', subject: 'location' },
      { predicate: 'temperature_celsius', subject: 'location' },
    ],
    conditions: [
      { type: 'VALUE_RANGE', parameters: { min: '80', max: '100', predicate: 'humidity_percent' } },
      { type: 'TEMPORAL_OVERLAP', parameters: {} },
    ],
    conclusion: { predicate: 'precipitation_likely', subject: 'location', value: 'possible' },
    limitations: [
      'Correlation does not imply causation',
      'Does not account for air pressure',
      'Heuristic rule, not deterministic',
    ],
    created_at: '2025-01-15T00:00:00Z',
    rule_hash: '',
  },
  {
    id: 'METEO-R003',
    version: '1.0.0',
    name: 'Pressure Drop Indicator',
    description: 'Rapid pressure drop may indicate approaching weather system.',
    domain: 'METEOROLOGICAL',
    premises: [
      { predicate: 'pressure_hpa', subject: 'location' },
      { predicate: 'pressure_hpa', subject: 'location' },
    ],
    conditions: [
      { type: 'TEMPORAL_OVERLAP', parameters: {} },
    ],
    conclusion: { predicate: 'weather_change_likely', subject: 'location', value: 'possible' },
    limitations: [
      'Requires temporal comparison',
      'Does not predict specific weather',
      'Many factors affect pressure',
    ],
    created_at: '2025-01-15T00:00:00Z',
    rule_hash: '',
  },
];

// === TECHNICAL_SYSTEM DOMAIN RULES ===

const TECHNICAL_RULES: StoredRule[] = [
  {
    id: 'TECH-R001',
    version: '1.0.0',
    name: 'Component Availability Check',
    description: 'If power and communication are available, component is operational.',
    domain: 'TECHNICAL_SYSTEM',
    premises: [
      { predicate: 'power_status', subject: 'component', expectedValue: 'available' },
      { predicate: 'communication_status', subject: 'component', expectedValue: 'available' },
    ],
    conditions: [
      { type: 'TEMPORAL_OVERLAP', parameters: {} },
    ],
    conclusion: { predicate: 'operational_status', subject: 'component', value: 'available' },
    limitations: [
      'Does not verify internal component health',
      'Assumes sensors are accurate',
      'Binary status only',
    ],
    created_at: '2025-01-15T00:00:00Z',
    rule_hash: '',
  },
  {
    id: 'TECH-R002',
    version: '1.0.0',
    name: 'Power Failure Diagnosis',
    description: 'If component is unavailable and power is missing, power failure is likely cause.',
    domain: 'TECHNICAL_SYSTEM',
    premises: [
      { predicate: 'operational_status', subject: 'component', expectedValue: 'unavailable' },
      { predicate: 'power_status', subject: 'component', expectedValue: 'unavailable' },
    ],
    conditions: [
      { type: 'TEMPORAL_OVERLAP', parameters: {} },
    ],
    conclusion: { predicate: 'failure_cause', subject: 'component', value: 'power_failure' },
    limitations: [
      'Hypothesis, not proven cause',
      'Other causes possible',
      'Requires additional verification',
    ],
    created_at: '2025-01-15T00:00:00Z',
    rule_hash: '',
  },
  {
    id: 'TECH-R003',
    version: '1.0.0',
    name: 'Communication Failure Diagnosis',
    description: 'If component is unavailable but power is available, communication failure is likely.',
    domain: 'TECHNICAL_SYSTEM',
    premises: [
      { predicate: 'operational_status', subject: 'component', expectedValue: 'unavailable' },
      { predicate: 'power_status', subject: 'component', expectedValue: 'available' },
      { predicate: 'communication_status', subject: 'component', expectedValue: 'unavailable' },
    ],
    conditions: [
      { type: 'TEMPORAL_OVERLAP', parameters: {} },
    ],
    conclusion: { predicate: 'failure_cause', subject: 'component', value: 'communication_failure' },
    limitations: [
      'Hypothesis, not proven cause',
      'Component internal failure possible',
      'Requires additional verification',
    ],
    created_at: '2025-01-15T00:00:00Z',
    rule_hash: '',
  },
  {
    id: 'TECH-R004',
    version: '1.0.0',
    name: 'Stale Data Detection',
    description: 'If data timestamp is too old relative to current time, data may be stale.',
    domain: 'TECHNICAL_SYSTEM',
    premises: [
      { predicate: 'last_update', subject: 'component' },
    ],
    conditions: [
      { type: 'VALUE_RANGE', parameters: { max_age_hours: '1' } },
    ],
    conclusion: { predicate: 'data_freshness', subject: 'component', value: 'stale' },
    limitations: [
      'Threshold is arbitrary',
      'Does not indicate actual staleness',
      'May be false positive',
    ],
    created_at: '2025-01-15T00:00:00Z',
    rule_hash: '',
  },
];

// === COMPUTE HASHES ===

export const RULE_CATALOG: StoredRule[] = [
  ...METEOROLOGICAL_RULES,
  ...TECHNICAL_RULES,
].map(rule => ({
  ...rule,
  rule_hash: computeRuleHash(rule),
}));

// === DOMAIN METADATA ===

export const DOMAIN_METADATA: Record<Domain, { name: string; description: string; predicates: string[]; valueTypes: string[] }> = {
  METEOROLOGICAL: {
    name: 'Meteorological Observations',
    description: 'Synthetic weather data: temperature, humidity, pressure',
    predicates: [
      'temperature_celsius',
      'humidity_percent',
      'pressure_hpa',
      'temperature_confirmed',
      'precipitation_likely',
      'weather_change_likely',
    ],
    valueTypes: ['numeric', 'categorical', 'boolean'],
  },
  TECHNICAL_SYSTEM: {
    name: 'Technical System Status',
    description: 'Synthetic component availability and status data',
    predicates: [
      'power_status',
      'communication_status',
      'operational_status',
      'failure_cause',
      'data_freshness',
      'last_update',
    ],
    valueTypes: ['categorical', 'temporal'],
  },
};

// === RULE ACCESS FUNCTIONS ===

export function getRulesByDomain(domain: Domain): StoredRule[] {
  return RULE_CATALOG.filter(r => r.domain === domain);
}

export function getRuleById(id: string): StoredRule | undefined {
  return RULE_CATALOG.find(r => r.id === id);
}

export function getAllRules(): StoredRule[] {
  return RULE_CATALOG;
}

export function getRulesForPredicate(domain: Domain, predicate: string): StoredRule[] {
  return RULE_CATALOG.filter(r => 
    r.domain === domain && 
    (r.premises.some(p => p.predicate === predicate) || r.conclusion.predicate === predicate)
  );
}
