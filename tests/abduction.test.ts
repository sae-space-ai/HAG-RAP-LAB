import { describe,it,expect,beforeAll,afterAll } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { SQLiteStorageAdapter } from '../server/storage';
import { EGMEngine } from '../server/engine';
import { AbductionEngine, listAbductionRules, verifyAbductionResult } from '../server/abduction';
import { seedSources,seedClaims,seedEvidenceLinks } from '../server/seed';
import { seedAbductionTechnicalDomain } from '../server/abduction-seeds';
import { createApp } from '../server/app';

async function seed(storage: SQLiteStorageAdapter) {
 await storage.initialize();
 for(const s of seedSources)await storage.insertSource(s);
 for(const c of seedClaims)await storage.insertClaim(c);
 for(const l of seedEvidenceLinks)await storage.insertEvidenceLink(l);
 await seedAbductionTechnicalDomain(storage);
}

describe('Phase 2.2a — evidence-gated bounded synthetic abduction',()=>{
 let storage:SQLiteStorageAdapter,eng:AbductionEngine,app:ReturnType<typeof createApp>;
 beforeAll(async()=>{
  storage=new SQLiteStorageAdapter(':memory:');
  await seed(storage);
  const egm=new EGMEngine(storage);eng=new AbductionEngine(storage,egm);
  app=createApp({storage,engine:egm});
 });
 afterAll(async()=>{await storage.close()});

 it('rules are explicit, two domains, predictions not invented on the fly',()=>{
  const rules=listAbductionRules();
  expect(rules).toHaveLength(4);
  expect(new Set(rules.map(r=>r.domain))).toEqual(new Set(['METEOROLOGICAL','TECHNICAL_SYSTEM']));
  expect(rules.every(r=>r.predictions.length>=1)).toBe(true);
 });
 it('generates two alternative explanations only for supported meteorological observation',async()=>{
  const r=await eng.evaluate({claimId:'CLM-001'});
  expect(r.egmVerdict).toBe('SUPPORTED');
  expect(r.candidates).toHaveLength(2);
  expect(r.verdict).toBe('MULTIPLE_EXPLANATIONS');
  expect(r.decision).toBe('ABSTAIN');
  expect(r.discriminators).toHaveLength(1);
  expect(r.discriminators[0].predicate).toBe('calibration_check');
  expect(Object.values(r.discriminators[0].expectedByHypothesis).sort()).toEqual(['FAIL','PASS']);
  expect(r.references.length).toBeGreaterThanOrEqual(2);
  expect(r.candidates.every(c=>c.state==='PROPOSED')).toBe(true);
  expect(r.limits.calibratedProbability).toBe(false);
  expect(verifyAbductionResult(r)).toBe(true);
 });
 it('supports a second technical domain with real evidence links, not a label-only demo',async()=>{
  const r=await eng.evaluate({claimId:'ABD-TECH-OBS-A'});
  expect(r.egmVerdict).toBe('SUPPORTED');
  expect(r.domain).toBe('TECHNICAL_SYSTEM');
  expect(r.candidates).toHaveLength(2);
  expect(r.references.map(x=>x.sourceId).sort()).toEqual(['ABD-TECH-SRC-A','ABD-TECH-SRC-B']);
  expect(r.discriminators.map(d=>d.predicate).sort()).toEqual(['communication_status','power_status']);
  expect(r.candidates.every(c=>c.state==='PROPOSED')).toBe(true);
 });
 it('does not generate hypotheses for unsupported, conflicting or missing observations',async()=>{
  for(const id of ['CLM-002','CLM-003','CLM-004','CLM-007','NOT-FOUND']){
   const r=await eng.evaluate({claimId:id});
   expect(r.candidates).toHaveLength(0);
   expect(r.discriminators).toHaveLength(0);
   expect(r.decision).toBe('ABSTAIN');
   expect(r.verdict).not.toBe('MULTIPLE_EXPLANATIONS');
   expect(await storage.getAbductionRun(r.id)).not.toBeNull();
  }
 });
 it('does not invent rules for unrelated supported observations',async()=>{
  const r=await eng.evaluate({claimId:'CLM-001B'});
  // CLM-001B is the matching temperature fixture and legitimately falls inside the domain.
  expect(r.candidates).toHaveLength(2);
  const unmatched=await eng.evaluate({claimId:'ABD-TECH-POWER'});
  expect(unmatched.candidates).toHaveLength(0);
 });
 it('stable content hashing despite per-run UUID and clock metadata',async()=>{
  const a=await eng.evaluate({claimId:'CLM-001'});
  const b=await eng.evaluate({claimId:'CLM-001'});
  expect(a.id).not.toBe(b.id);
  expect(a.contentHash).toBe(b.contentHash);
  expect(a.inputHash).toBe(b.inputHash);
 });
 it('API enforces strict schema and returns real hypotheses with exact references',async()=>{
  const bad=await request(app).post('/api/v1/dre/abduction/evaluate').send({claimId:'CLM-001',hacked:true});
  expect(bad.status).toBe(400);
  const ok=await request(app).post('/api/v1/dre/abduction/evaluate').send({claimId:'CLM-001'});
  expect(ok.status).toBe(201);
  expect(ok.body.result.references).toHaveLength(2);
  const saved=await request(app).get('/api/v1/dre/abduction/runs/'+ok.body.result.id);
  expect(saved.status).toBe(200);
  expect(saved.body.integrityValid).toBe(true);
  const history=await request(app).get('/api/v1/dre/abduction/runs');
  expect(history.status).toBe(200);
  expect(history.body.count).toBeGreaterThan(0);
  const rules=await request(app).get('/api/v1/dre/abduction/rules');
  expect(rules.status).toBe(200);
  expect(rules.body.rules).toHaveLength(4);
 });
 it('rejects malformed and missing execution IDs',async()=>{
  const bad=await request(app).get('/api/v1/dre/abduction/runs/foo');
  expect(bad.status).toBe(400);
  const missing=await request(app).get('/api/v1/dre/abduction/runs/ABD-RUN-1234567890ABCDEF');
  expect(missing.status).toBe(404);
 });
 it('survives real close/reopen of persistent database',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hag-abd-'));
  const filename=path.join(dir,'runs.db');
  let one:SQLiteStorageAdapter|undefined,two:SQLiteStorageAdapter|undefined;
  try{
   one=new SQLiteStorageAdapter(filename);await seed(one);
   const r=await new AbductionEngine(one,new EGMEngine(one)).evaluate({claimId:'ABD-TECH-OBS-A'});
   await one.close();one=undefined;
   two=new SQLiteStorageAdapter(filename);await two.initialize();
   const row=await two.getAbductionRun(r.id);
   expect(row?.egm_evaluation_id).toBe(r.egmEvaluationId);
   expect(verifyAbductionResult(JSON.parse(row!.full_result_json))).toBe(true);
   const resp=await request(createApp({storage:two,engine:new EGMEngine(two)}))
    .get('/api/v1/dre/abduction/runs/'+r.id);
   expect(resp.status).toBe(200);
  }finally{
   if(one)await one.close();if(two)await two.close();fs.rmSync(dir,{recursive:true,force:true});
  }
 });
 it('detects altered stored result instead of silently accepting a forged verdict',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hag-abd-tamper-'));
  const filename=path.join(dir,'runs.db');
  let storage2:SQLiteStorageAdapter|undefined;
  try{
   storage2=new SQLiteStorageAdapter(filename);await seed(storage2);
   const r=await new AbductionEngine(storage2,new EGMEngine(storage2)).evaluate({claimId:'CLM-001'});
   await storage2.close();storage2=undefined;
   const db=new Database(filename);
   const p=JSON.parse((db.prepare('SELECT full_result_json FROM abduction_runs WHERE id=?').get(r.id) as {full_result_json:string}).full_result_json);
   p.verdict='ERROR';
   db.prepare('UPDATE abduction_runs SET full_result_json=? WHERE id=?').run(JSON.stringify(p),r.id);
   db.close();
   storage2=new SQLiteStorageAdapter(filename);await storage2.initialize();
   const resp=await request(createApp({storage:storage2,engine:new EGMEngine(storage2)}))
    .get('/api/v1/dre/abduction/runs/'+r.id);
   expect(resp.status).toBe(409);
  }finally{
   if(storage2)await storage2.close();fs.rmSync(dir,{force:true,recursive:true});
  }
 });
});
