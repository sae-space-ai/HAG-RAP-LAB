/**
 * Reproducible SYNTHETIC rule fixture checks only.
 * These metrics do not estimate real-world accuracy, uncertainty calibration, or TRL.
 */
import fs from 'node:fs';
import path from 'node:path';
import { SQLiteStorageAdapter } from '../server/storage';
import { EGMEngine } from '../server/engine';
import { DRELite, DRE_VERSION, type DREVerdict, type DREInput } from '../server/dre';
import { seedSources, seedClaims, seedEvidenceLinks } from '../server/seed';

type Trial = { id: string; input: DREInput; expected: DREVerdict; expectedDecision: 'PROCEED'|'ABSTAIN' };
const hypothesis = { predicate: 'synthetic_review_priority' as const, value: 'LOW' as const };
const trials: Trial[] = [
 { id:'B01-entailed', input:{claimId:'CLM-001',hypothesis}, expected:'ENTAILED', expectedDecision:'PROCEED' },
 { id:'B02-counter', input:{claimId:'CLM-001',hypothesis:{predicate:'synthetic_review_priority',value:'REVIEW'}}, expected:'CONTRADICTED', expectedDecision:'ABSTAIN' },
 { id:'B03-inconsistency', input:{claimId:'CLM-002',hypothesis}, expected:'INCONSISTENT_EVIDENCE', expectedDecision:'ABSTAIN' },
 { id:'B04-insufficient', input:{claimId:'CLM-003',hypothesis}, expected:'UNDETERMINED', expectedDecision:'ABSTAIN' },
 { id:'B05-unresolved', input:{claimId:'CLM-004',hypothesis}, expected:'ERROR', expectedDecision:'ABSTAIN' },
 { id:'B06-derivative', input:{claimId:'CLM-006',hypothesis}, expected:'UNDETERMINED', expectedDecision:'ABSTAIN' },
 { id:'B07-temporal', input:{claimId:'CLM-007',hypothesis}, expected:'UNDETERMINED', expectedDecision:'ABSTAIN' },
 { id:'B08-missing', input:{claimId:'MISSING-CLAIM',hypothesis}, expected:'ERROR', expectedDecision:'ABSTAIN' },
];

async function main() {
 const storage = new SQLiteStorageAdapter(':memory:');
 await storage.initialize();
 try {
  for(const s of seedSources) await storage.insertSource(s);
  for(const c of seedClaims) await storage.insertClaim(c);
  for(const l of seedEvidenceLinks) await storage.insertEvidenceLink(l);
  const engine = new DRELite(storage,new EGMEngine(storage));
  const results = [];
  for(const t of trials){
   const a = await engine.evaluate(t.input);
   results.push({
    id:t.id,expected:t.expected,actual:a.verdict,
    expectedDecision:t.expectedDecision,actualDecision:a.decision,
    passed:a.verdict===t.expected && a.decision===t.expectedDecision,
    traceHash:a.traceHash, uncertaintyKind:a.uncertainty.kind,
   });
  }
  const correct=results.filter(r=>r.passed).length;
  const output={
    suite:'DRE-LITE-SYNTHETIC-REGRESSION-v1',
    version:DRE_VERSION,
    classification:'SYNTHETIC_ONLY',
    calibratedUncertainty:false,
    externalValidity:'NOT_ESTABLISHED',
    numericalConfidence:'NOT_AVAILABLE',
    cases:results.length,
    passed:correct,
    failed:results.length-correct,
    exactFixtureMatch:correct/results.length,
    results,
  };
  const dest=path.join(process.cwd(),'reports','dre-benchmark.json');
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.writeFileSync(dest,JSON.stringify(output,null,2)+'\n');
  console.log(JSON.stringify({path:dest,cases:output.cases,passed:output.passed,failed:output.failed}));
  if(correct!==trials.length)process.exitCode=1;
 } finally { await storage.close(); }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
