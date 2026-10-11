import {useState} from 'react';
import {fetchAbduction,fetchAbductionRun,type AbductionResult} from '../core/api-client';

export function AbductionPanel(){
 const [claimId,setClaimId]=useState('CLM-001');
 const [result,setResult]=useState<AbductionResult|null>(null);
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState<string|null>(null);
 async function run(){
  setBusy(true);setStatus(null);setResult(null);
  try {
   const data=await fetchAbduction(claimId);
   setResult(data.result);
  } catch(e){setStatus(e instanceof Error?e.message:'Error inesperado en abducción');}
  finally {setBusy(false)}
 }
 async function restore(){
  if(!result)return;
  setBusy(true);setStatus(null);
  try{
   const a=await fetchAbductionRun(result.id);
   if(!a.integrityValid)throw new Error('Fallo de integridad');
   setResult(a.result);setStatus('Traza recuperada desde SQLite y hash verificado');
  }catch(e){setStatus(e instanceof Error?e.message:'Error al recuperar')}
  finally{setBusy(false)}
 }
 return <section className="rounded-lg bg-gray-900 border border-amber-800 p-5 space-y-4">
   <div>
     <h2 className="text-xl text-amber-200 font-bold">Fase 2.2a — Abducción experimental</h2>
     <p className="text-sm text-amber-300 mt-1">Solo escenarios sintéticos. Las explicaciones son posibilidades, no diagnósticos ni conclusiones causales.</p>
   </div>
   <label className="text-xs text-gray-300 block space-y-2">Observación almacenada
     <select value={claimId} onChange={e=>{setClaimId(e.target.value);setResult(null)}} className="block rounded border border-gray-700 bg-gray-950 w-full p-2 text-gray-100">
       <option value="CLM-001">METEOROLOGICAL — dos fuentes coinciden (CLM-001)</option>
       <option value="ABD-TECH-OBS-A">TECHNICAL_SYSTEM — componente no disponible (ABD-TECH-OBS-A)</option>
       <option value="CLM-002">Control: fuentes contradictorias (CLM-002)</option>
       <option value="CLM-003">Control: evidencia insuficiente (CLM-003)</option>
     </select>
   </label>
   <button onClick={run} disabled={busy} className="rounded px-4 py-2 bg-amber-700 hover:bg-amber-600 text-sm text-white disabled:opacity-40">
     {busy?'Ejecutando...':'Generar hipótesis mediante API real'}
   </button>
   {status&&<p className="text-sm text-amber-300" role="status">{status}</p>}
   {result&&<div className="bg-gray-950 border border-gray-700 rounded p-4 space-y-4">
     <div className="flex flex-wrap gap-3 items-center text-sm">
       <strong className="text-amber-300">{result.verdict}</strong>
       <span className="text-gray-300">Decisión: {result.decision}</span>
       <span className="text-gray-500">EGM: {result.egmVerdict}</span>
     </div>
     <p className="text-xs text-gray-400">Observación: {result.observation?.subject} · {result.observation?.predicate} = {result.observation?.value}</p>
     <div className="space-y-2">
       {result.candidates.map(h=><article className="border border-gray-700 p-3 rounded text-xs space-y-2" key={h.hypothesisId}>
         <div className="font-bold text-amber-200">{h.hypothesisId} — {h.state}</div>
         <p className="text-gray-300">{h.explanation}</p>
         <div className="text-gray-500">Suposiciones: {h.assumptions.join(', ')}</div>
         {h.predictions.map(p=><p className="text-gray-400" key={p.predicate}>
           Predicción comprobable: {p.predicate} = {p.expectedValue} · Evidencia: {p.evidenceState}
         </p>)}
       </article>)}
     </div>
     <h3 className="text-sm text-gray-200 font-bold">Observaciones para discriminar</h3>
     {result.discriminators.map(d=><p key={d.predicate} className="text-xs text-gray-300">
       {d.predicate}: {Object.entries(d.expectedByHypothesis).map(([key,val])=>key+' → '+val).join(' / ')}
     </p>)}
     {result.discriminators.length===0&&<p className="text-xs text-gray-500">No hay observaciones discriminantes derivadas de las reglas.</p>}
     <p className="text-xs text-gray-500">Referencias trazadas: {result.references.map(r=>r.sourceId+' / '+r.claimId).join(', ') || 'Ninguna'}</p>
     {result.missingInfo.length>0&&<p className="text-xs text-amber-300">No confirmado: {result.missingInfo.join('; ')}</p>}
     <button onClick={restore} disabled={busy} className="rounded border border-gray-500 px-3 py-2 text-xs text-gray-200 disabled:opacity-40">Recuperar ejecución persistida y verificar integridad</button>
     <details className="text-xs text-gray-400"><summary className="cursor-pointer">Ver JSON, reglas y hashes de procedencia</summary>
       <pre className="whitespace-pre-wrap break-all max-h-72 overflow-auto">{JSON.stringify(result,null,2)}</pre>
     </details>
   </div>}
 </section>
}
