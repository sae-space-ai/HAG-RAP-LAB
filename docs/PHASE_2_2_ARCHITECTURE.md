# PHASE 2.2 ARCHITECTURE

**Version:** DRE-v2.2.0  
**Date:** 2025-01-15  
**Status:** IMPLEMENTED

---

## Overview

Phase 2.2 extends the Deep Reasoning Engine (DRE) with:
- **Deductive reasoning** with typed rules and explicit premises
- **Abductive hypothesis generation** from observations
- **Hypothesis comparison** using explicit criteria
- **Discriminating observation planning** to distinguish hypotheses
- **Multi-domain support** (Meteorological + Technical System)
- **Full traceability** with persistent reasoning traces

## Architecture Components

### Component A: Deductive Reasoner
- Applies explicit rules to premises
- Validates conditions (temporal overlap, source independence, value equality)
- Records each rule application with inputs/outputs
- Respects execution limits (max rules, max depth)

### Component B: Abductive Hypothesis Engine
- Generates hypotheses to explain observations
- Searches rule catalog for rules whose conclusions match observations
- Creates hypothesis objects with:
  - Verified premises (from evidence)
  - Assumed premises (missing but needed)
  - Supporting/contradicting evidence
  - Testable predictions
  - Epistemic state (PROPOSED, COMPATIBLE, REFUTED, UNDERDETERMINED)

### Component C: Hypothesis Comparator
- Compares multiple hypotheses using explicit criteria:
  - Evidence support (30%)
  - Premise verification (30%)
  - Constraint satisfaction (20%)
  - Predictive power (20%)
- Retains hypotheses scoring ≥80% of the best
- Abstains if no hypothesis meets threshold

### Component D: Discriminating Observation Planner
- Proposes observations that could distinguish between hypotheses
- Derives proposals from hypothesis predictions
- Does NOT execute actions or modify database
- Presents proposals as pending experimental requirements

## Data Model

### New Tables (SQLite)

```sql
dre_rules
  - id, version, name, description, domain
  - premises_json, conditions_json, conclusion_json
  - limitations_json, rule_hash

dre_hypotheses
  - id, execution_id, observation, rule_id, rule_version
  - premises_json, evidences_json, predictions_json
  - unmet_constraints_json, required_observations_json
  - state, explanation, hypothesis_hash

dre_traces
  - id, domain, initial_observation
  - steps_json, hypotheses_generated_json
  - hypotheses_retained_json, hypotheses_refuted_json
  - final_decision, abstention_reason
  - execution_limits_json, limits_reached_json, trace_hash
```

## API Endpoints

### DRE Endpoints (Phase 2.2)

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/v1/dre/domains | List available domains |
| GET | /api/v1/dre/rules | List all rules (filter by domain) |
| GET | /api/v1/dre/rules/:id | Get rule by ID |
| POST | /api/v1/dre/reasoning | Execute reasoning process |
| GET | /api/v1/dre/traces | List reasoning traces |
| GET | /api/v1/dre/traces/:id | Get trace by ID |
| GET | /api/v1/dre/hypotheses/:id | Get hypothesis by ID |

## Domains

### METEOROLOGICAL
- Predicates: temperature_celsius, humidity_percent, pressure_hpa
- Rules: Temperature Consistency, Humidity-Temperature Correlation, Pressure Drop Indicator

### TECHNICAL_SYSTEM
- Predicates: power_status, communication_status, operational_status, failure_cause, data_freshness
- Rules: Component Availability Check, Power Failure Diagnosis, Communication Failure Diagnosis, Stale Data Detection

## Execution Limits

```typescript
{
  maxRulesEvaluated: 100,
  maxHypotheses: 20,
  maxInferenceDepth: 5,
  maxPremisesPerRule: 10,
  maxExecutionTimeMs: 5000,
  maxResultSizeBytes: 1048576, // 1MB
  cycleDetection: true,
}
```

## Epistemic States

### Evidence States
- CORROBORATED: Multiple independent sources agree
- CONFLICTING: Sources disagree
- INSUFFICIENT: Not enough evidence
- INVALID: Evidence is invalid

### Hypothesis States
- HYPOTHESIS_PROPOSED: Generated but not yet evaluated
- HYPOTHESIS_COMPATIBLE: Compatible with evidence
- HYPOTHESIS_REFUTED: Contradicted by evidence
- UNDERDETERMINED: Cannot be determined with current evidence

## Limitations

- NOT causal inference
- NOT statistical probabilities
- NOT general intelligence
- Deterministic rule-based reasoning only
- All data is SYNTHETIC
- No learning or adaptation
- Rules are explicit data structures, not executable code

## Integration with EGM

The DRE engine:
- Reads claims and evidence from EGM storage
- Does NOT modify EGM data
- Creates separate DRE-specific entities (rules, hypotheses, traces)
- Maintains referential integrity with EGM through claim IDs

## Traceability

Each reasoning execution produces:
1. **Trace ID**: Unique identifier for the execution
2. **Steps**: Ordered list of inference steps (deduction + abduction)
3. **Hypotheses**: All generated hypotheses with full metadata
4. **Decision**: Final decision (HYPOTHESIS_RETAINED, MULTIPLE_HYPOTHESES_RETAINED, ABSTAIN)
5. **Hashes**: Integrity hashes for trace, hypotheses, and rules
6. **Limits**: Execution limits and any limits reached

## Security

- All endpoints validate inputs with Zod schemas
- No stack traces exposed in errors
- No secrets in code or responses
- CORS restricted to configured origins
- Read-only DRE endpoints (no mutations without auth)
