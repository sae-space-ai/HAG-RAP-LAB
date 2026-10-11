/**
 * Phase 2.2a — deliberately limited, evidence-gated synthetic abduction.
 * Hypotheses are explanatory candidates, NEVER assertions of causal truth.
 * No simulated generic predictions, no LLM, no autonomous actions.
 */
import { createHash } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import type { StorageAdapter, StoredClaim } from './storage';
import type { EGMEngine } from './engine';

export const ABDUCTION_VERSION = 'ABD-SYNTHETIC-v0.1.0';
export type Domain = 'METEOROLOGICAL' | 'TECHNICAL_SYSTEM';
export type CandidateState = 'PROPOSED' | 'REFUTED_BY_CORROBORATED_FACT' | 'PARTIALLY_CORROBORATED';
type Prediction = { predicate: string; expectedValue: string; description: string };
type ExplanatoryRule = {
  id: string; version: string; domain: Domain; observationPredicate: string;
  observationValue?: string; description: string; predictions: Prediction[];
};
export interface AbductionInput { claimId: string }
export interface AbductionCandidate {
  hypothesisId: string; ruleId: string; explanation: string; state: CandidateState;
  assumptions: string[];
  predictions: Array<Prediction & { observedClaimIds: string[]; evidenceState: 'CORROBORATED_MATCH' | 'CORROBORATED_CONFLICT' | 'UNKNOWN' }>;
}
export interface AbductionResult {
  id: string; version: string; classification: 'SYNTHETIC';
  domain: Domain | null;
  observation: { claimId: string; subject: string; predicate: string; value: string } | null;
  egmEvaluationId: string; egmVerdict: string;
  verdict: 'MULTIPLE_EXPLANATIONS' | 'INSUFFICIENT_EVIDENCE' | 'ERROR' | 'NO_EXPLANATORY_RULE';
  decision: 'ABSTAIN';
  candidates: AbductionCandidate[];
  discriminators: Array<{ predicate: string; subject: string; expectedByHypothesis: Record<string,string> }>;
  references: Array<{ claimId: string; sourceId: string; evidenceLinkIds: string[]; provenanceHashes: string[] }>;
  missingInfo: string[]; inputHash: string; contentHash: string; createdAt: string;
  limits: { maxCandidates: 4; maxPredictionsPerCandidate: 2; externalActions: false; calibratedProbability: false; causalProof: false };
}

const RULES: ReadonlyArray<ExplanatoryRule> = [
 { id:'ABD-MET-01', version:'1.0', domain:'METEOROLOGICAL', observationPredicate:'temperature_celsius',
   description:'Synthetic ambient variation could explain the observed temperature.',
   predictions:[{predicate:'calibration_check',expectedValue:'PASS',description:'An independent calibration check would pass.'}] },
 { id:'ABD-MET-02', version:'1.0', domain:'METEOROLOGICAL', observationPredicate:'temperature_celsius',
   description:'Synthetic sensor calibration bias could explain the observed temperature.',
   predictions:[{predicate:'calibration_check',expectedValue:'FAIL',description:'An independent calibration check would fail.'}] },
 { id:'ABD-TECH-01', version:'1.0', domain:'TECHNICAL_SYSTEM', observationPredicate:'operational_status',observationValue:'unavailable',
   description:'Power interruption is one possible explanation for unavailability.',
   predictions:[
    {predicate:'power_status',expectedValue:'unavailable',description:'Independent power measurement reports unavailable.'},
    {predicate:'communication_status',expectedValue:'available',description:'Network measurement remains available.'}
   ] },
 { id:'ABD-TECH-02', version:'1.0', domain:'TECHNICAL_SYSTEM', observationPredicate:'operational_status',observationValue:'unavailable',
   description:'Communication interruption is an alternative possible explanation.',
   predictions:[
    {predicate:'power_status',expectedValue:'available',description:'Independent power measurement reports available.'},
    {predicate:'communication_status',expectedValue:'unavailable',description:'Network measurement reports unavailable.'}
   ] },
];

const sha256=(x:unknown)=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const overlaps=(a:StoredClaim,b:StoredClaim)=>
  !(a.valid_to && b.valid_from && a.valid_to < b.valid_from)
  && !(b.valid_to && a.valid_from && b.valid_to < a.valid_from);

export const listAbductionRules=()=>RULES.map(r=>({...r, predictions:r.predictions.map(p=>({...p}))}));
function contentDigest(r: AbductionResult):string {
 return sha256({
  version:r.version,domain:r.domain,observation:r.observation,
  egmVerdict:r.egmVerdict,verdict:r.verdict,decision:r.decision,
  candidates:r.candidates,discriminators:r.discriminators,
  references:r.references,missingInfo:r.missingInfo,inputHash:r.inputHash,limits:r.limits
 });
}
export const verifyAbductionResult=(r: AbductionResult)=>r.contentHash===contentDigest(r);

export class AbductionEngine {
 constructor(private readonly storage: StorageAdapter,private readonly egm: EGMEngine){}
 async evaluate(input:AbductionInput):Promise<AbductionResult> {
  const egm=await this.egm.evaluate({claimId:input.claimId});
  const claim=await this.storage.getClaim(input.claimId);
  const result:AbductionResult={
   id:'ABD-RUN-'+uuidv4().replaceAll('-','').slice(0,16).toUpperCase(),
   version:ABDUCTION_VERSION,classification:'SYNTHETIC',domain:null,
   observation:claim?{claimId:claim.id,subject:claim.subject,predicate:claim.predicate,value:claim.object_value}:null,
   egmEvaluationId:egm.id,egmVerdict:egm.verdict,
   verdict:'INSUFFICIENT_EVIDENCE',decision:'ABSTAIN',candidates:[],discriminators:[],
   references:[],missingInfo:[],
   inputHash:sha256({version:ABDUCTION_VERSION,claimId:input.claimId}),
   contentHash:'',createdAt:new Date().toISOString(),
   limits:{maxCandidates:4,maxPredictionsPerCandidate:2,externalActions:false,calibratedProbability:false,causalProof:false}
  };
  const finish=async()=>{
    result.contentHash=contentDigest(result);
    await this.storage.insertAbductionRun({
     id:result.id,claim_id:claim?.id ?? null,egm_evaluation_id:egm.id,
     result_hash:result.contentHash,full_result_json:JSON.stringify(result),
     created_at:result.createdAt
    });
    return result;
  };
  if(egm.verdict==='ERROR'||!claim) {
   result.verdict='ERROR';result.missingInfo=['EGM_REFERENCE_OR_SOURCE_ERROR'];return finish();
  }
  if(!claim.synthetic || egm.verdict!=='SUPPORTED'||egm.decision!=='PROCEED') {
   result.missingInfo=['EGM_SUPPORTED_SYNTHETIC_OBSERVATION_REQUIRED'];
   return finish();
  }
  const eligible=RULES.filter(r=>
   r.observationPredicate===claim.predicate
   && (r.observationValue===undefined||r.observationValue===claim.object_value));
  if(claim.predicate==='temperature_celsius'&&
      (claim.unit!=='°C'||!Number.isFinite(Number(claim.object_value)))) {
   result.missingInfo=['FINITE_CELSIUS_VALUE_REQUIRED'];return finish();
  }
  if(eligible.length===0){result.verdict='NO_EXPLANATORY_RULE';result.missingInfo=['NO_APPLICABLE_EXPLICIT_RULE'];return finish();}
  const domain=eligible[0].domain;result.domain=domain;
  // At least two independently traceable corroborations, not merely two source IDs.
  const allClaims=await this.storage.getAllClaims();
  for(const sourceId of [...new Set(egm.supportingSourceIds)].sort()){
   const source=await this.storage.getSource(sourceId);
   if(!source?.synthetic||source.source_type.includes('derivative')
      ||source.source_type==='synthetic_unresolved_reference')continue;
   const matched=allClaims.find(c=>c.id!==''&&c.subject===claim.subject&&c.predicate===claim.predicate
     &&c.object_value===claim.object_value&&c.source_id===sourceId&&c.synthetic&&overlaps(c,claim));
   if(!matched)continue;
   const links=(await this.storage.getEvidenceLinksForClaim(matched.id)).filter(l=>l.source_id===sourceId);
   if(links.length===0)continue;
   result.references.push({
    claimId:matched.id,sourceId,evidenceLinkIds:links.map(l=>l.id).sort(),
    provenanceHashes:links.map(l=>l.provenance_hash).sort()
   });
  }
  if(result.references.length<2){
   result.missingInfo=['AT_LEAST_TWO_TRACEABLE_SOURCES_REQUIRED'];return finish();
  }
  for(const rule of eligible.slice(0,result.limits.maxCandidates)){
   const predictions:AbductionCandidate['predictions']=[];
   for(const prediction of rule.predictions.slice(0,result.limits.maxPredictionsPerCandidate)){
    const matching=allClaims.filter(c=>c.subject===claim.subject&&c.predicate===prediction.predicate
      &&c.synthetic&&overlaps(c,claim));
    const supported:StoredClaim[]=[];
    for(const c of matching){
     const v=await this.egm.evaluate({claimId:c.id});
     if(v.verdict==='SUPPORTED'&&v.decision==='PROCEED')supported.push(c);
    }
    const contradictions=supported.filter(c=>c.object_value!==prediction.expectedValue);
    const affirmations=supported.filter(c=>c.object_value===prediction.expectedValue);
    predictions.push({
     ...prediction,observedClaimIds:supported.map(c=>c.id),
     evidenceState:contradictions.length>0?'CORROBORATED_CONFLICT':affirmations.length>0?'CORROBORATED_MATCH':'UNKNOWN'
    });
   }
   const refuted=predictions.some(p=>p.evidenceState==='CORROBORATED_CONFLICT');
   const corroborated=predictions.some(p=>p.evidenceState==='CORROBORATED_MATCH');
   result.candidates.push({
    hypothesisId:rule.id,ruleId:rule.id,explanation:rule.description,
    state:refuted?'REFUTED_BY_CORROBORATED_FACT':corroborated?'PARTIALLY_CORROBORATED':'PROPOSED',
    assumptions:['EXPLANATORY_CAUSE_NOT_OBSERVED','CAUSAL_RELATION_NOT_PROVEN'],
    predictions
   });
  }
  const live=result.candidates.filter(c=>c.state!=='REFUTED_BY_CORROBORATED_FACT');
  // Derive discriminators from predictions that genuinely differ on the same predicate.
  for(let i=0;i<live.length;i++){
   for(let j=i+1;j<live.length;j++){
    for(const p of live[i].predictions) {
     const other=live[j].predictions.find(q=>q.predicate===p.predicate&&q.expectedValue!==p.expectedValue);
     if(!other)continue;
     if(result.discriminators.some(d=>d.predicate===p.predicate))continue;
     result.discriminators.push({
      predicate:p.predicate,subject:claim.subject,
      expectedByHypothesis:{
       [live[i].hypothesisId]:p.expectedValue,
       [live[j].hypothesisId]:other.expectedValue
      }
     });
    }
   }
  }
  result.verdict='MULTIPLE_EXPLANATIONS';
  result.missingInfo=live.length>1?['ADDITIONAL_DISCRIMINATING_OBSERVATIONS_REQUIRED']:
    live.length===1?['HYPOTHESIS_NOT_CAUSALLY_PROVEN']:['ALL_CANDIDATES_REFUTED'];
  // No candidate, including a leading candidate, can authorize an external decision.
  return finish();
 }
}
