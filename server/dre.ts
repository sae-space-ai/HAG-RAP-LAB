/**
 * HAG-RAP Phase 2 — DRE-Lite v0.1
 * Bounded, deterministic rule inference over synthetic EGM-verified facts.
 * Not a causal model, an LLM, formal proof, or a real-world decision system.
 */
import { createHash } from 'node:crypto';
import type { StorageAdapter, StoredClaim, StoredEvidenceLink, StoredDRETrace } from './storage';
import type { EGMEngine, EvaluationResult } from './engine';

export const DRE_VERSION = 'DRE-LITE-v0.2.0';
export type DREPredicate = 'synthetic_temperature_band' | 'synthetic_review_priority';
export type DREVerdict = 'ENTAILED' | 'CONTRADICTED' | 'INCONSISTENT_EVIDENCE' | 'UNDETERMINED' | 'ERROR';
export type DREValue = 'IN_RANGE' | 'OUT_OF_RANGE' | 'LOW' | 'REVIEW';

export interface DREHypothesis { predicate: DREPredicate; value: DREValue }
export interface DREInput { claimId: string; hypothesis: DREHypothesis }
export interface DREProposition { subject: string; predicate: string; value: string }
export interface DREReference {
  claimId: string;
  sourceId: string;
  evidenceLinkIds: string[];
  provenanceHashes: string[];
}
export interface DREStep {
  stepId: string;
  ruleId: string;
  premises: DREProposition[];
  conclusion: DREProposition;
  references: DREReference[];
}
export type EpistemicState = 'CORROBORATED' | 'CONFLICTING' | 'INSUFFICIENT' | 'INVALID';

export interface DREResult {
  id: string;
  uncertainty: { kind: EpistemicState; calibratedProbability: false };
  algorithmVersion: string;
  classification: 'SYNTHETIC';
  claimId: string;
  hypothesis: DREHypothesis;
  verdict: DREVerdict;
  decision: 'PROCEED' | 'ABSTAIN';
  explanation: string;
  egm: { evaluationId: string; verdict: string; decision: string; appliedRule: string; inputsHash: string };
  trace: DREStep[];
  references: DREReference[];
  missingInfo: string[];
  inputHash: string;
  traceHash: string;
  createdAt: string;
  limits: { maxSteps: 2; persistentDRETrace: true; causalInference: false; autonomousActions: false };
}

export const DRE_RULES = [
  { id: 'DRE-R01-IN-BAND', premise: 'EGM-supported temperature_celsius in [20,25] C', conclusion: 'synthetic_temperature_band=IN_RANGE' },
  { id: 'DRE-R02-OUT-BAND', premise: 'EGM-supported temperature_celsius outside [20,25] C', conclusion: 'synthetic_temperature_band=OUT_OF_RANGE' },
  { id: 'DRE-R03-LOW', premise: 'synthetic_temperature_band=IN_RANGE', conclusion: 'synthetic_review_priority=LOW' },
  { id: 'DRE-R04-REVIEW', premise: 'synthetic_temperature_band=OUT_OF_RANGE', conclusion: 'synthetic_review_priority=REVIEW' },
] as const;

function traceDigestData(result: DREResult) {
  return {
    version: result.algorithmVersion,
    inputHash: result.inputHash,
    verdict: result.verdict,
    decision: result.decision,
    uncertainty: result.uncertainty,
    egm: {
      verdict: result.egm.verdict,
      decision: result.egm.decision,
      appliedRule: result.egm.appliedRule,
      inputsHash: result.egm.inputsHash,
    },
    explanation: result.explanation,
    trace: result.trace,
    references: result.references,
    missingInfo: result.missingInfo,
  };
}

export function verifyDRETrace(result: DREResult): boolean {
  return digest(traceDigestData(result)) === result.traceHash;
}

function digest(input: unknown): string {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex');
}

function overlap(a: StoredClaim, b: StoredClaim): boolean {
  // Seed corpus uses normalized UTC timestamps. Do not infer cross-zone equivalence.
  if (a.valid_to && b.valid_from && a.valid_to < b.valid_from) return false;
  if (b.valid_to && a.valid_from && b.valid_to < a.valid_from) return false;
  return true;
}

export class DRELite {
  constructor(private storage: StorageAdapter, private egm: EGMEngine) {}

  async evaluate(input: DREInput): Promise<DREResult> {
    const evaluation = await this.egm.evaluate({ claimId: input.claimId });
    const hypothesis = input.hypothesis;
    const result: DREResult = {
      id: 'DRE-' + evaluation.id,
      uncertainty: {
        kind: evaluation.verdict === 'SUPPORTED' ? 'CORROBORATED'
          : evaluation.verdict === 'CONTRADICTED' ? 'CONFLICTING'
          : evaluation.verdict === 'ERROR' ? 'INVALID' : 'INSUFFICIENT',
        calibratedProbability: false,
      },
      algorithmVersion: DRE_VERSION,
      classification: 'SYNTHETIC',
      claimId: input.claimId,
      hypothesis,
      verdict: 'UNDETERMINED',
      decision: 'ABSTAIN',
      explanation: '',
      egm: {
        evaluationId: evaluation.id,
        verdict: evaluation.verdict,
        decision: evaluation.decision,
        appliedRule: evaluation.appliedRule,
        inputsHash: evaluation.inputsHash,
      },
      trace: [],
      references: [],
      missingInfo: [],
      inputHash: digest({ version: DRE_VERSION, claimId: input.claimId, hypothesis }),
      traceHash: '',
      createdAt: new Date().toISOString(),
      limits: { maxSteps: 2, persistentDRETrace: true, causalInference: false, autonomousActions: false },
    };
    const finish = async (): Promise<DREResult> => {
      result.traceHash = digest(traceDigestData(result));
      const record: StoredDRETrace = {
        id: result.id, claim_id: (await this.storage.getClaim(input.claimId)) ? input.claimId : null,
        egm_evaluation_id: evaluation.id,
        algorithm_version: DRE_VERSION, verdict: result.verdict,
        decision: result.decision, input_hash: result.inputHash,
        trace_hash: result.traceHash, created_at: result.createdAt,
        full_result_json: JSON.stringify(result),
      };
      await this.storage.insertDRETrace(record);
      return result;
    };
    if (evaluation.verdict === 'CONTRADICTED') {
      result.verdict = 'INCONSISTENT_EVIDENCE';
      result.explanation = 'EGM detectó afirmaciones incompatibles: se bloquea toda inferencia.';
      result.missingInfo.push('RESOLVE_EGM_CONTRADICTION');
      return finish();
    }
    if (evaluation.verdict === 'ERROR') {
      result.verdict = 'ERROR';
      result.explanation = 'EGM no pudo validar la procedencia. No se ejecutan reglas.';
      result.missingInfo.push('FIX_EGM_ERROR');
      return finish();
    }
    if (evaluation.verdict !== 'SUPPORTED' || evaluation.decision !== 'PROCEED') {
      result.explanation = 'EGM no acredita evidencia suficiente para inferir.';
      result.missingInfo.push('REQUIRE_TWO_INDEPENDENT_AGREEING_SOURCES');
      return finish();
    }
    const claim = await this.storage.getClaim(input.claimId);
    if (!claim || !claim.synthetic || claim.predicate !== 'temperature_celsius'
        || claim.unit !== '°C') {
      result.explanation = 'La regla experimental solo acepta afirmaciones sintéticas de temperatura en °C.';
      result.missingInfo.push('SUPPORTED_SYNTHETIC_TEMPERATURE_CLAIM_REQUIRED');
      return finish();
    }

    const allClaims = await this.storage.getAllClaims();
    const supportedSources = [...new Set(evaluation.supportingSourceIds)].sort();
    const refs: DREReference[] = [];
    for (const sourceId of supportedSources) {
      const source = await this.storage.getSource(sourceId);
      if (!source || !source.synthetic || source.source_type === 'synthetic_derivative'
          || source.source_type === 'synthetic_unresolved_reference') {
        result.missingInfo.push('INADMISSIBLE_SOURCE:' + sourceId);
        continue;
      }
      const candidates = allClaims.filter(c =>
        c.source_id === sourceId && c.subject === claim.subject
        && c.predicate === claim.predicate && c.object_value === claim.object_value
        && c.unit === claim.unit && c.synthetic && overlap(c, claim)
      );
      let found = false;
      for (const premiseClaim of candidates) {
        const links: StoredEvidenceLink[] = await this.storage.getEvidenceLinksForClaim(premiseClaim.id);
        const matching = links.filter(link => link.source_id === sourceId);
        if (matching.length === 0) continue;
        refs.push({
          claimId: premiseClaim.id, sourceId,
          evidenceLinkIds: matching.map(link => link.id).sort(),
          provenanceHashes: matching.map(link => link.provenance_hash).sort(),
        });
        found = true;
        break;
      }
      if (!found) result.missingInfo.push('MISSING_EVIDENCE_LINK:' + sourceId);
    }
    result.references = refs;
    if (supportedSources.length < 2 || refs.length < 2 || result.missingInfo.length > 0) {
      result.explanation = 'Las premisas no tienen dos fuentes independientes con enlaces de procedencia verificables.';
      result.missingInfo.push('TRACEABLE_CORROBORATION_REQUIRED');
      return finish();
    }
    const temperature = Number(claim.object_value);
    if (!Number.isFinite(temperature)) {
      result.explanation = 'La temperatura no es un número finito.';
      result.missingInfo.push('FINITE_NUMERIC_VALUE_REQUIRED');
      return finish();
    }

    const subject = claim.subject;
    const band = temperature >= 20 && temperature <= 25 ? 'IN_RANGE' : 'OUT_OF_RANGE';
    const review = band === 'IN_RANGE' ? 'LOW' : 'REVIEW';
    const fact: DREProposition = { subject, predicate: 'temperature_celsius', value: claim.object_value };
    const bandFact: DREProposition = { subject, predicate: 'synthetic_temperature_band', value: band };
    const priorityFact: DREProposition = { subject, predicate: 'synthetic_review_priority', value: review };
    result.trace = [
      { stepId: 'STEP-001', ruleId: band === 'IN_RANGE' ? 'DRE-R01-IN-BAND' : 'DRE-R02-OUT-BAND',
        premises: [fact], conclusion: bandFact, references: refs },
      { stepId: 'STEP-002', ruleId: review === 'LOW' ? 'DRE-R03-LOW' : 'DRE-R04-REVIEW',
        premises: [bandFact], conclusion: priorityFact, references: refs },
    ];

    const derived = hypothesis.predicate === 'synthetic_temperature_band' ? bandFact : priorityFact;
    if (hypothesis.value === derived.value) {
      result.verdict = 'ENTAILED';
      result.decision = 'PROCEED';
      result.explanation = 'Hipótesis inferida mediante dos reglas sintéticas trazables; PROCEED solo autoriza la conclusión de laboratorio.';
    } else {
      result.verdict = 'CONTRADICTED';
      result.explanation = 'La hipótesis contradice la conclusión de las reglas sintéticas. Abstención.';
    }
    return finish();
  }
}
