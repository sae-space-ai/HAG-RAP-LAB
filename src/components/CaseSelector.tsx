import type { CaseData } from '../core/api-client';

interface CaseSelectorProps {
  cases: CaseData[];
  selectedCase: string | null;
  onSelect: (id: string) => void;
  onEvaluate: () => void;
  isEvaluating: boolean;
}

function ExpectedBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'SUPPORTED': 'bg-green-900/40 text-green-400 border-green-800',
    'CONTRADICTED': 'bg-red-900/40 text-red-400 border-red-800',
    'INSUFFICIENT_EVIDENCE': 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
    'ERROR': 'bg-orange-900/40 text-orange-400 border-orange-800',
  };

  const style = styles[status] || 'bg-gray-800 text-gray-400 border-gray-700';

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded border ${style}`}>
      {status}
    </span>
  );
}

export function CaseSelector({ cases, selectedCase, onSelect, onEvaluate, isEvaluating }: CaseSelectorProps) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-3">
      <p className="text-xs text-gray-500 mb-2">
        Todos los casos son datos sintéticos almacenados en SQLite.
        Selecciónelos y ejecute la evaluación real vía API HTTP.
      </p>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {cases.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              selectedCase === c.id
                ? 'border-blue-600 bg-blue-900/20 ring-1 ring-blue-600'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs text-gray-400">{c.id}</span>
              <ExpectedBadge status={c.expectedVerdict} />
            </div>
            <h4 className="text-sm font-medium text-gray-200">{c.title}</h4>
            <p className="text-xs text-gray-500 mt-1">{c.description}</p>
            <div className="mt-1">
              <span className="text-xs bg-gray-700/50 text-gray-400 px-1.5 py-0.5 rounded">
                {c.classification}
              </span>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onEvaluate}
        disabled={!selectedCase || isEvaluating}
        className={`w-full py-3 rounded-lg font-medium text-sm transition-all ${
          !selectedCase || isEvaluating
            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
        }`}
      >
        {isEvaluating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Evaluando vía API...
          </span>
        ) : (
          '▶ Ejecutar evaluación REAL (POST /api/v1/evaluations)'
        )}
      </button>

      {!selectedCase && (
        <p className="text-xs text-center text-gray-600">
          Seleccione un caso para habilitar la evaluación
        </p>
      )}
    </div>
  );
}
