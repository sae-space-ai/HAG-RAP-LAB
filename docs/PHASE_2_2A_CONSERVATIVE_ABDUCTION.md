# HAG-RAP LAB — Phase 2.2a: Conservatively integrated experimental abduction

Status: **UNVERIFIED until GitHub Actions passes**, SYNTHETIC ONLY. Based on verified main (Phase 2.1). Not a merge of Qwen PR #6, whose code contains unverified or fabricated conclusions.

## Scientific scope

- Two input domains: synthetic meteorological temperature readings, and simulated technical component unavailability.
- Evidence gating: the stored initial observation must obtain EGM `SUPPORTED` with at least two distinct, traceable, synthetic sources and original evidence links.
- Explicit abduction: a bounded, declarative catalogue of four candidate explanation rules. For each validated observation, select applicable rules by exact predicate/domain and, where relevant, value.
- Multiple explanations are returned as *proposed hypotheses*, **never true causal assertions**.
- Prediction comparison only treats a related claim as corroborated if its own EGM evaluation is `SUPPORTED`. Single-source readings remain unknown.
- Discriminating observations are constructed from *differences in actual catalogued predictions* for the same predicate. No fabricated `value_0` predictions.
- All inference results retain `ABSTAIN`, including supported observations, because an explanation is not a proven cause.
- Limited to two candidates for each of two fixture patterns, 4 total declared rules, bounded prediction list. No untrusted user code, no execution of generated experiments.

## Distinction from Qwen's submitted branch

PR #6 has four blocking scientific errors:

1. `couldExplainObservation` ignores the requested observation and accepts any rule with a stored premise.
2. `compareHypotheses` uses an empty local array: it cannot compare real hypotheses.
3. `proposeDiscriminatingObservations` invents generic values rather than comparing rule predictions.
4. Evidence is labelled VERIFIED without obtaining an EGM SUPPORTED verdict.

The new subset is an independent conservative implementation based on main. It does not claim full Qwen Phase 2.2 implementation completeness.

## Data model and API

Existing `dre_traces` and all Phase 2.1 modules remain untouched. A new table `abduction_runs` persists experiments with a foreign-key link to their EGM evaluation. Missing claim IDs are stored with a null claim FK but retain the error and ABSTAIN. Results include SHA-256 content checks and serialized provenance.

- `GET /api/v1/dre/abduction/rules`
- `POST /api/v1/dre/abduction/evaluate` body: `{"claimId":"CLM-001"}`
- `GET /api/v1/dre/abduction/runs`
- `GET /api/v1/dre/abduction/runs/:id`

Run in the experimental UI or via HTTP. A content hash detects accidental modification of stored data but does not establish authenticity or tamper-proof security.

## Synthetic validation cases

- `CLM-001`: corroborated temperature, two candidate explanations. Additional proposed calibration check distinguishes them.
- `ABD-TECH-OBS-A`: corroborated synthetic component unavailability; two candidates (power / communication failure) predict conflicting technical checks.
- `CLM-002`: contradictory sources → no hypotheses, ABSTAIN.
- `CLM-003`: insufficient evidence → no hypotheses, ABSTAIN.
- `CLM-004`: unresolved source → ERROR, ABSTAIN.
- `CLM-007`: only one corroborating source → no hypotheses.
- `ABD-TECH-POWER`: single-source auxiliary reading; cannot independently establish a causal explanation.
- `NOT-FOUND`: unknown claim, safe ERROR and nullable claim FK.

## Limitations and remaining Phase 2.2 requirements

This is **a technically testable partial increment**, not a complete scientific abduction engine. The following remain pending: generic typed backward-chaining, contradiction resolution across all premises, configurable safe rule interpretation, a validated comparator with scoring and abstention thresholds, independent domain-separated scientific benchmarking, probabilistic calibration, independent provenance/authenticity verification and TRL assessment. The seeded sources' independence is a synthetic design assumption, not an externally established fact.

Acceptance requires frontend/server TypeScript checks, build, all previous 60 tests, new abduction tests, live HTTP verification, and persisted trace retrieval across process restart.

**No TRL 4, causal inference, general intelligence, autonomous action or deployment suitability is claimed.**
