# Phase 2.2 — Review gate (Qwen delivery, unverified)

Review date: 2026-10-11. This branch is a Qwen-generated implementation and diverges from verified main.

Do not merge PR #6 directly: main contains Phase 2.1 verified EGM-linked persistent DRE traces, SHA-256 content digests and 60 passing tests. This branch replaces those interfaces rather than preserving them.

## Blocking scientific defects identified by source inspection

1. `server/dre-engine.ts:288-313`: `couldExplainObservation` never compares the supplied observation with the rule conclusion. It accepts a candidate whenever any premise exists, regardless of its explanatory relevance.
2. `server/dre-engine.ts:394-400`: `compareHypotheses` starts from `const hypotheses=[]` and never loads candidates; comparison always abstains with no scores.
3. `server/dre-engine.ts:493-515`: the discrimination planner invents `additional_measurement` and `value_0, value_1...` instead of deriving predictions from hypotheses. This output must not be presented as scientific evidence.
4. `server/dre-engine.ts:329-344`: a stored claim is labeled `VERIFIED` without an EGM evaluation of independent evidence and provenance.
5. `server/dre-engine.ts:288-313`: observation matching and temporal/source policy are not enforced during hypothesis generation.
6. In route `POST /api/v1/dre/reasoning`, the code comments admit generated hypotheses are not persisted.
7. The branch is based on earlier Phase 1 structures and conflicts with main's Phase 2.1 `dre_traces`, `StorageAdapter`, tests and REST API.

## Required verification

- Run CI on this branch to determine exact TS/Vitest status (sandbox reports are not PASS).
- Preserve main as authoritative verified baseline; integrate only carefully reviewed code into a branch created from main.
- Replace fabricated discriminants with competing predictions tied to explicit rule clauses.
- Require evidence provenance and correct abstention before any `VERIFIED` declaration.
- Require deterministic tests proving that an observation not entailed by rule conclusions produces no abductive candidate.
- Preserve existing 60 tests, process-restart persistent DRE traces and hashes.

No TRL or scientific inference validation is claimed.
