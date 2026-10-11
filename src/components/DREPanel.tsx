import { useState } from 'react';
import { fetchDRE, type CaseData, type DREResult, type DREInput } from '../core/api-client';

type Props = { cases: CaseData[] };

export function DREPanel({ cases }: Props) {
  const [caseId, setCaseId] = useState('CASE-001');
  const [predicate, setPredicate] = useState<DREInput['hypothesis']['predicate']>('synthetic_review_priority');
  const [value, setValue] = useState('LOW');
  const [result, setResult] = useState<DREResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    const chosen = cases.find(c => c.id === caseId);
    if (!chosen) return;
    setBusy(true);
    setResult(null);
    setError(null);
    try {
      const payload: DREInput = predicate === 'synthetic_temperature_band'
        ? { claimId: chosen.claimId, hypothesis: { predicate, value: value as 'IN_RANGE' | 'OUT_OF_RANGE' } }
        : { claimId: chosen.claimId, hypothesis: { predicate, value: value as 'LOW' | 'REVIEW' } };
      const response = await fetchDRE(payload);
      setResult(response.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo evaluar la hipótesis.');
    } finally {
      setBusy(false);
    }
  };

  const options = predicate === 'synthetic_temperature_band' ? ['IN_RANGE', 'OUT_OF_RANGE'] : ['LOW', 'REVIEW'];
  return (
    <section className="border border-indigo-800 bg-gray-900 rounded-lg p-5 space-y-4" aria-label="Razonamiento DRE-Lite">
      <div>
        <h2 className="text-xl text-indigo-200 font-semibold">DRE-Lite — hipótesis comprobables</h2>
        <p className="text-sm text-amber-300 mt-1">
          Experimento sintético con dos reglas encadenadas. No es inferencia causal ni una recomendación operativa.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="text-xs text-gray-300 space-y-1">
          <span className="block">Caso de prueba</span>
          <select className="bg-gray-950 w-full border border-gray-700 rounded p-2 text-gray-100"
            value={caseId} onChange={e => { setCaseId(e.target.value); setResult(null); }}>
            {cases.map(c => <option key={c.id} value={c.id}>{c.id}: {c.title}</option>)}
          </select>
        </label>
        <label className="text-xs text-gray-300 space-y-1">
          <span className="block">Hipótesis</span>
          <select className="bg-gray-950 w-full border border-gray-700 rounded p-2 text-gray-100"
            value={predicate} onChange={e => {
              const next = e.target.value as DREInput['hypothesis']['predicate'];
              setPredicate(next);
              setValue(next === 'synthetic_temperature_band' ? 'IN_RANGE' : 'LOW');
              setResult(null);
            }}>
            <option value="synthetic_temperature_band">Intervalo sintético de temperatura</option>
            <option value="synthetic_review_priority">Prioridad sintética de revisión</option>
          </select>
        </label>
        <label className="text-xs text-gray-300 space-y-1">
          <span className="block">Valor a contrastar</span>
          <select className="bg-gray-950 w-full border border-gray-700 rounded p-2 text-gray-100"
            value={value} onChange={e => { setValue(e.target.value); setResult(null); }}>
            {options.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </div>
      <button onClick={run} disabled={busy || !cases.some(c => c.id === caseId)}
        className="bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 rounded px-4 py-2 text-sm text-white">
        {busy ? 'Evaluando hipótesis...' : 'Ejecutar DRE-Lite vía API HTTP'}
      </button>
      {error && <p className="text-red-300 text-sm" role="alert">{error}</p>}
      {result && <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <strong className={result.decision === 'PROCEED' ? 'text-green-300' : 'text-amber-300'}>{result.verdict}</strong>
          <span className="text-xs text-gray-400">Decisión experimental: {result.decision}</span>
          <span className="text-xs text-gray-500">EGM: {result.egm.verdict}</span>
        </div>
        <p className="text-gray-300 text-sm">{result.explanation}</p>
        {result.missingInfo.length > 0 &&
          <p className="text-amber-300 text-xs">Pendiente: {result.missingInfo.join('; ')}</p>}
        <h3 className="font-semibold text-indigo-200 text-sm">Trazas de inferencia ({result.trace.length})</h3>
        {result.trace.length === 0 && <p className="text-gray-500 text-xs">No se aplicaron reglas. El sistema se abstiene.</p>}
        {result.trace.map(step => <div key={step.stepId} className="border border-gray-700 rounded p-3 text-xs text-gray-200 space-y-1">
          <div className="font-mono text-indigo-300">{step.ruleId}</div>
          <div>Premisas: {step.premises.map(p => p.predicate + '=' + p.value).join(' ∧ ')}</div>
          <div>Conclusión: {step.conclusion.predicate} = <strong>{step.conclusion.value}</strong></div>
          <div className="text-gray-400">Fuentes: {step.references.map(r => r.sourceId).join(', ')}</div>
          <div className="text-gray-500">Afirmaciones: {step.references.map(r => r.claimId).join(', ')}</div>
          <div className="text-gray-500">Enlaces: {step.references.flatMap(r => r.evidenceLinkIds).join(', ')}</div>
        </div>)}
        <details className="text-xs text-gray-400">
          <summary className="cursor-pointer">Ver procedencia, hashes y JSON completo</summary>
          <pre className="overflow-auto whitespace-pre-wrap break-all mt-2 p-2 bg-gray-900">{JSON.stringify(result, null, 2)}</pre>
        </details>
        <p className="text-xs text-gray-500">DRE v0.1: trazas no persistidas. La evaluación EGM sí queda en SQLite. Sin acciones externas.</p>
      </div>}
    </section>
  );
}
