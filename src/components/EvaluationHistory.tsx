import type { EvaluationsListData } from '../core/api-client';

interface EvaluationHistoryProps {
  evaluations: EvaluationsListData | null;
}

export function EvaluationHistory({ evaluations }: EvaluationHistoryProps) {
  if (!evaluations || evaluations.count === 0) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 text-center">
        <p className="text-gray-500 text-sm">
          No hay evaluaciones registradas todavía. Ejecute un caso para crear la primera.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-800/50 border-b border-gray-700">
            <th className="text-left px-4 py-2 text-gray-400 font-medium">ID</th>
            <th className="text-left px-4 py-2 text-gray-400 font-medium">Caso</th>
            <th className="text-left px-4 py-2 text-gray-400 font-medium">Veredicto</th>
            <th className="text-left px-4 py-2 text-gray-400 font-medium">Decisión</th>
            <th className="text-left px-4 py-2 text-gray-400 font-medium">Regla</th>
            <th className="text-left px-4 py-2 text-gray-400 font-medium">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {evaluations.evaluations.map((ev) => (
            <tr key={ev.id} className="border-b border-gray-800 hover:bg-gray-800/30">
              <td className="px-4 py-2 font-mono text-xs text-gray-400">{ev.id}</td>
              <td className="px-4 py-2 text-gray-300">{ev.caseId || '—'}</td>
              <td className="px-4 py-2">
                <VerdictBadge verdict={ev.verdict} />
              </td>
              <td className="px-4 py-2">
                <span className={`text-xs font-mono ${ev.decision === 'PROCEED' ? 'text-green-400' : 'text-amber-400'}`}>
                  {ev.decision}
                </span>
              </td>
              <td className="px-4 py-2 font-mono text-xs text-blue-300">{ev.appliedRule}</td>
              <td className="px-4 py-2 text-xs text-gray-500">{new Date(ev.createdAt).toLocaleString('es')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bg-gray-900 px-4 py-2 border-t border-gray-800 text-xs text-gray-500">
        Total: {evaluations.count} evaluaciones persistidas en SQLite
      </div>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const styles: Record<string, string> = {
    'SUPPORTED': 'bg-green-900/40 text-green-400 border-green-800',
    'CONTRADICTED': 'bg-red-900/40 text-red-400 border-red-800',
    'INSUFFICIENT_EVIDENCE': 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
    'ERROR': 'bg-orange-900/40 text-orange-400 border-orange-800',
  };

  const style = styles[verdict] || 'bg-gray-800 text-gray-400 border-gray-700';

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded border font-mono ${style}`}>
      {verdict}
    </span>
  );
}
