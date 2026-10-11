import type { CapabilitiesData } from '../core/api-client';

interface CapabilityMatrixProps {
  capabilities: CapabilitiesData | null;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'VERIFICADO_LOCAL': 'bg-green-900/50 text-green-300 border-green-700',
    'VERIFIED_IN_CI': 'bg-green-900/50 text-green-300 border-green-700',
    'IMPLEMENTED_UNVERIFIED': 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
    'IMPLEMENTADO_SIN_VERIFICAR': 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
    'NO_IMPLEMENTADO': 'bg-gray-800 text-gray-500 border-gray-700',
    'BLOQUEADO': 'bg-red-900/50 text-red-300 border-red-700',
  };

  const labels: Record<string, string> = {
    'VERIFICADO_LOCAL': '✓ Verificado Local',
    'VERIFIED_IN_CI': '✓ Verificado en CI',
    'IMPLEMENTED_UNVERIFIED': 'Pendiente de CI',
    'IMPLEMENTADO_SIN_VERIFICAR': '⚡ Sin Verificar',
    'NO_IMPLEMENTADO': '✗ No Implementado',
    'BLOQUEADO': '⊘ Bloqueado',
  };

  const style = styles[status] || styles['NO_IMPLEMENTADO'];
  const label = labels[status] || status;

  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${style}`}>
      {label}
    </span>
  );
}

export function CapabilityMatrix({ capabilities }: CapabilityMatrixProps) {
  if (!capabilities) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-center text-gray-500">
        Cargando estado de componentes...
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-gray-800">
        {capabilities.components.map((comp) => (
          <div
            key={comp.id}
            className={`bg-gray-900 p-4 ${comp.status === 'NO_IMPLEMENTADO' ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-mono text-sm font-bold text-gray-200">{comp.name}</h3>
                <p className="text-xs text-gray-500">{comp.fullName}</p>
              </div>
            </div>
            <StatusBadge status={comp.status} />
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              {comp.description}
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
              <span>WP: {comp.workPackage}</span>
              {comp.testReference && (
                <span className="text-green-600">• Tests: ✓</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-gray-900 px-4 py-2 border-t border-gray-800 text-xs text-gray-500">
        Implementados: {capabilities.totalImplemented}/{capabilities.components.length} | 
        No implementados: {capabilities.totalNotImplemented}/{capabilities.components.length}
      </div>
    </div>
  );
}
