import type { EvaluationData } from '../core/api-client';

interface EvaluationPanelProps {
  result: EvaluationData | null;
  isEvaluating: boolean;
  onCopy: () => void;
  copySuccess: boolean;
}

function StatusIndicator({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string; icon: string }> = {
    'SUPPORTED': { color: 'text-green-400 bg-green-900/30 border-green-700', label: 'SUPPORTED', icon: '✓' },
    'CONTRADICTED': { color: 'text-red-400 bg-red-900/30 border-red-700', label: 'CONTRADICTED', icon: '✗' },
    'INSUFFICIENT_EVIDENCE': { color: 'text-yellow-400 bg-yellow-900/30 border-yellow-700', label: 'INSUFFICIENT_EVIDENCE', icon: '?' },
    'ERROR': { color: 'text-orange-400 bg-orange-900/30 border-orange-700', label: 'ERROR', icon: '⚠' },
  };

  const c = config[status] || { color: 'text-gray-400 bg-gray-800 border-gray-700', label: status, icon: '—' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-sm font-mono font-bold ${c.color}`}>
      <span>{c.icon}</span>
      {c.label}
    </span>
  );
}

export function EvaluationPanel({ result, isEvaluating, onCopy, copySuccess }: EvaluationPanelProps) {
  if (isEvaluating) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-400 text-sm">Ejecutando evaluación vía API HTTP...</p>
        <p className="text-gray-600 text-xs mt-1">POST /api/v1/evaluations</p>
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
          El motor procesa los datos de forma determinista con persistencia SQLite.
        </p>
      </div>
    );
  }

  const { evaluation } = result;

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-4">
      {/* Status */}
      <div className="flex items-center justify-between">
        <StatusIndicator status={evaluation.verdict} />
        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded font-mono">
          {result.classification}
        </span>
      </div>

      {/* Decision */}
      <div className="bg-gray-800/50 rounded-lg p-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Decisión Operativa</p>
        <p className={`text-sm font-bold ${evaluation.decision === 'PROCEED' ? 'text-green-400' : 'text-amber-400'}`}>
          {evaluation.decision === 'PROCEED'
            ? '→ PROCEED (evidencia soporta la afirmación)'
            : '→ ABSTAIN (no se toma decisión operativa)'}
        </p>
      </div>

      {/* Evaluation ID */}
      <div className="text-xs text-gray-500 font-mono">
        ID Evaluación: {evaluation.id} | Persistida en SQLite
      </div>

      {/* Claim */}
      {evaluation.claim && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Afirmación Evaluada</p>
          <div className="bg-gray-800 rounded p-2 font-mono text-xs text-gray-300">
            <p><span className="text-gray-500">ID:</span> {String((evaluation.claim as Record<string, unknown>).id || '—')}</p>
            <p><span className="text-gray-500">Sujeto:</span> {String((evaluation.claim as Record<string, unknown>).subject || '—')}</p>
            <p><span className="text-gray-500">Predicado:</span> {String((evaluation.claim as Record<string, unknown>).predicate || '—')}</p>
            <p><span className="text-gray-500">Valor:</span> {String((evaluation.claim as Record<string, unknown>).object_value || '—')}</p>
          </div>
        </div>
      )}

      {/* Rule Applied */}
      <div className="space-y-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">Regla Aplicada</p>
        <p className="text-sm text-blue-300 font-mono">{evaluation.appliedRule}</p>
      </div>

      {/* Explanation */}
      <div className="space-y-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">Explicación Transparente</p>
        <p className="text-sm text-gray-300 leading-relaxed bg-gray-800/50 rounded p-3">
          {evaluation.explanation}
        </p>
      </div>

      {/* Provenance: Sources */}
      {evaluation.sources.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Procedencia — Fuentes</p>
          <div className="space-y-1">
            {evaluation.sources.map((s, i) => (
              <div key={i} className="bg-gray-800/50 rounded p-2 text-xs">
                <span className="text-gray-400 font-mono">{String((s as Record<string, unknown>).id || `source-${i}`)}</span>
                <span className="text-gray-500 mx-1">—</span>
                <span className="text-gray-300">{String((s as Record<string, unknown>).title || '—')}</span>
                <span className="ml-2 bg-gray-700 text-gray-400 px-1 rounded">SYNTHETIC</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contradictions */}
      {evaluation.contradictingSourceIds.length > 0 && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
          <p className="text-xs text-red-400 uppercase tracking-wide mb-1">⚠ Contradicción Detectada</p>
          <p className="text-xs text-red-300">
            Fuentes contradictorias: {evaluation.contradictingSourceIds.join(', ')}
          </p>
          <p className="text-xs text-red-400/70 mt-1">
            El sistema se abstiene. No se resuelve la contradicción arbitrariamente.
          </p>
        </div>
      )}

      {/* Missing Info */}
      {evaluation.missingInfo.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-3">
          <p className="text-xs text-yellow-400 uppercase tracking-wide mb-1">? Información Faltante</p>
          <ul className="text-xs text-yellow-300 list-disc list-inside">
            {evaluation.missingInfo.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Algorithm Version & Hash */}
      <div className="text-xs text-gray-600 flex items-center justify-between">
        <div>
          <span>Algoritmo: {evaluation.algorithmVersion}</span>
          <span className="mx-2">|</span>
          <span>Hash: {evaluation.inputsHash}</span>
        </div>
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
