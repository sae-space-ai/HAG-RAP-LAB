# HAG-RAP LAB — Phase 2 DRE-Lite v0.1

Status: EXPERIMENTAL. All input and output data are SYNTHETIC.

## Scientific scope
Deterministic two-step Horn-like rule chaining over evidence-backed temperature claims. DRE-Lite does not implement causal inference, statistical learning, general theorem proving, or automated real-world decisions.

Rule IDs:
- DRE-R01-IN-BAND: corroborated synthetic temperature in [20,25] °C -> synthetic_temperature_band=IN_RANGE
- DRE-R02-OUT-BAND: corroborated synthetic temperature outside [20,25] °C -> synthetic_temperature_band=OUT_OF_RANGE
- DRE-R03-LOW: synthetic_temperature_band=IN_RANGE -> synthetic_review_priority=LOW
- DRE-R04-REVIEW: synthetic_temperature_band=OUT_OF_RANGE -> synthetic_review_priority=REVIEW

The review label is for testing only, not advice. Preconditions require EGM verdict SUPPORTED, two independent concordant sources, valid synthetic provenance links and an eligible temperature claim. Unresolved, derived-only and contradictory evidence trigger ABSTAIN.

## Interfaces
GET /api/v1/dre/rules
POST /api/v1/dre/evaluate
Request example: {"claimId":"CLM-001","hypothesis":{"predicate":"synthetic_review_priority","value":"LOW"}}

Results: ENTAILED (laboratory-only PROCEED), CONTRADICTED (ABSTAIN), INCONSISTENT_EVIDENCE (ABSTAIN), UNDETERMINED (ABSTAIN), ERROR (ABSTAIN).
Each step includes rule ID, premises, conclusion, claim IDs, source IDs, evidence link IDs, provenance hashes and a reproducible SHA-256 trace hash. A digest is not a digital signature.

## Integrity boundaries
The EGM evaluation is persisted to SQLite by EGM. DRE inference traces are returned to the client but NOT yet persisted. No external APIs or AI models are connected. EGM's synthetic UTC timestamp constraints apply. Production-grade security, scientific benchmarking, uncertainty models, domain-general deduction and TRL 4 are NOT claimed.

## Verification gate
GitHub Actions must pass existing 38 tests, added DRE unit and HTTP tests, TypeScript frontend/server checks, Vite build, and HTTP/SQLite restart smoke test. Capability status remains IMPLEMENTED_UNVERIFIED until that gate passes.