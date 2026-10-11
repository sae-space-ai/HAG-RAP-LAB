import type { EvaluationResponse, ErrorResponse } from '../core/types';

interface EvaluationPanelProps {
  result: EvaluationResponse | ErrorResponse | null;
  isEvaluating: boolean;
  isErrorResponse: boolean;
  onCopy: () => void;
  copySuccess: boolean;
}

function StatusIndicator({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string; icon: string }> = {
    'SUPPORTED': { color: 'text-green-400 bg-green-900/30 border-green-700', label: 'SUPPORTED', icon: '✓' },
    'CONTRADICTED': { color: 'text-red-400 bg-red-900/30 border-red-700', label: 'CONTRADICTED', icon: '✗' },
    'INSUFFICIENT_EVIDENCE': { color: 'text-yellow-400 bg-yellow-900/30 border-yellow-700', label: 'INSUFFICIENT_EVIDENCE', icon: '?' },
    'ERROR': { color: 'text-orange-400 bg-orange-900/30 border-orange-700', label: 'ERROR', icon: '⚠' },
    'ABSTAIN': { color: 'text-gray-400 bg-gray-800 border-gray-700', label: 'ABSTAIN', icon: '⊘' },
  };

  const c = config[status] || config['ABSTAIN'];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-sm font-mono font-bold ${c.color}`}>
      <span>{c.icon}</span>
      {c.label}
    </span>
  );
}

export function EvaluationPanel({ result, isEvaluating, isErrorResponse, onCopy, copySuccess }: EvaluationPanelProps) {
  if (isEvaluating) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-400 text-sm">Ejecutando evaluación determinista...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
        <p className="text-gray-500 text-sm">
          Seleccione un caso y ejecute la evaluación para ver el resultado aquí.
        </p>
        <p className="text-gray-600 text-xs mt-2">
          El motor procesa los datos de forma determinista y transparente.
        </p>
      </div>
    );
  }

  if (isErrorResponse) {
    const error = result as ErrorResponse;
    return (
      <div className="bg-gray-900 rounded-lg border border-orange-800 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <StatusIndicator status="ERROR" />
        </div>
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
          <p className="text-red-300 text-sm font-medium">{error.error}</p>
          <p className="text-red-400/70 text-xs mt-1 font-mono">Código: {error.code}</p>
          {error.details && (
            <p className="text-red-400/60 text-xs mt-1">{error.details}</p>
          )}
        </div>
        <button
          onClick={onCopy}
          className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded border border-gray-700 transition-colors"
        >
          {copySuccess ? '✓ Copiado' : 'Copiar informe JSON'}
        </button>
      </div>
    );
  }

  const evalResult = result as EvaluationResponse;
  const { evaluation, claim, evidences, sources: evalSources } = evalResult;

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-4">
      {/* Status */}
      <div className="flex items-center justify-between">
        <StatusIndicator status={evaluation.status} />
        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded font-mono">
          {evaluation.classification}
        </span>
      </div>

      {/* Decision */}
      <div className="bg-gray-800/50 rounded-lg p-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Decisión Operativa</p>
        <p className={`text-sm font-bold ${evaluation.status === 'SUPPORTED' ? 'text-green-400' : 'text-amber-400'}`}>
          {evaluation.status === 'SUPPORTED' ? '→ PROCEED (evidencia soporta la afirmación)' : '→ ABSTAIN (no se toma decisión operativa)'}
        </p>
      </div>

      {/* Claim */}
      <div className="space-y-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">Afirmación Evaluada</p>
        <div className="bg-gray-800 rounded p-2 font-mono text-xs text-gray-300">
          <p><span className="text-gray-500">ID:</span> {claim.id}</p>
          <p><span className="text-gray-500">Sujeto:</span> {claim.subjectId}</p>
          <p><span className="text-gray-500">Predicado:</span> {claim.predicate}</p>
          <p><span className="text-gray-500">Valor propuesto:</span> {claim.proposedValue}</p>
        </div>
      </div>

      {/* Rule Applied */}
      <div className="space-y-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">Regla Aplicada</p>
        <p className="text-sm text-blue-300 font-mono">{evaluation.ruleApplied}</p>
      </div>

      {/* Explanation */}
      <div className="space-y-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">Explicación Transparente</p>
        <p className="text-sm text-gray-300 leading-relaxed bg-gray-800/50 rounded p-3">
          {evaluation.explanation}
        </p>
      </div>

      {/* Provenance: Sources */}
      {evalSources.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Procedencia — Fuentes</p>
          <div className="space-y-1">
            {evalSources.map((s) => (
              <div key={s.id} className="bg-gray-800/50 rounded p-2 text-xs">
                <span className="text-gray-400 font-mono">{s.id}</span>
                <span className="text-gray-500 mx-1">—</span>
                <span className="text-gray-300">{s.title}</span>
                <span className="ml-2 bg-gray-700 text-gray-400 px-1 rounded">{s.classification}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evidences */}
      {evidences.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Evidencias</p>
          <div className="space-y-1">
            {evidences.map((e) => {
              const isSupporting = evaluation.supportingEvidenceIds.includes(e.id);
              const isContradicting = evaluation.contradictingEvidenceIds.includes(e.id);
              return (
                <div
                  key={e.id}
                  className={`rounded p-2 text-xs border ${
                    isSupporting
                      ? 'bg-green-900/20 border-green-800'
                      : isContradicting
                      ? 'bg-red-900/20 border-red-800'
                      : 'bg-gray-800/50 border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-gray-400">{e.id}</span>
                    <span className="text-gray-500">
                      {isSupporting ? '✓ Soporta' : isContradicting ? '✗ Contradice' : '—'}
                    </span>
                  </div>
                  <p className="text-gray-300 mt-1">
                    Valor: <span className="font-mono text-blue-300">{e.value}</span>
                  </p>
                  <p className="text-gray-500">
                    Fuente: {e.sourceId} | Transformaciones: {e.transformations.join(', ') || 'ninguna'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contradictions */}
      {evaluation.contradictingEvidenceIds.length > 0 && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
          <p className="text-xs text-red-400 uppercase tracking-wide mb-1">⚠ Contradicción Detectada</p>
          <p className="text-xs text-red-300">
            Evidencias contradictorias: {evaluation.contradictingEvidenceIds.join(', ')}
          </p>
          <p className="text-xs text-red-400/70 mt-1">
            El sistema se abstiene. No se resuelve la contradicción arbitrariamente.
          </p>
        </div>
      )}

      {/* Missing Evidence */}
      {evaluation.missingEvidence.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-3">
          <p className="text-xs text-yellow-400 uppercase tracking-wide mb-1">? Evidencia Faltante</p>
          <ul className="text-xs text-yellow-300 list-disc list-inside">
            {evaluation.missingEvidence.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Algorithm Version */}
      <div className="text-xs text-gray-600 flex items-center justify-between">
        <span>Algoritmo: {evaluation.algorithmVersion}</span>
        <button
          onClick={onCopy}
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded border border-gray-700 transition-colors"
        >
          {copySuccess ? '✓ Copiado' : '📋 Copiar informe JSON'}
        </button>
      </div>
    </div>
  );
}
