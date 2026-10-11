import type { ApiState } from '../core/api-client';

interface ConnectionBannerProps {
  connected: boolean | null;
  apiState: ApiState;
  onRecheck: () => void;
}

export function ConnectionBanner({ connected, apiState, onRecheck }: ConnectionBannerProps) {
  if (connected === null) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-gray-500 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-gray-400 text-sm">Verificando conexión con el backend...</span>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <span className="text-red-400 text-xl">⊘</span>
            <div>
              <h3 className="font-bold text-red-300 text-sm uppercase tracking-wide">
                SIN CONEXIÓN AL SERVIDOR
              </h3>
              <p className="text-red-200/80 text-sm mt-1">
                El backend no está disponible. La interfaz requiere el servidor Express para funcionar.
                Inicie el servidor con <code className="bg-red-900/50 px-1 rounded">npm run server</code> en un terminal.
              </p>
              {apiState.lastError && (
                <p className="text-red-400/60 text-xs mt-1 font-mono">
                  Último error: {apiState.lastError}
                </p>
              )}
              {apiState.lastChecked && (
                <p className="text-red-400/40 text-xs mt-0.5">
                  Verificado: {apiState.lastChecked}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onRecheck}
            className="bg-red-800 hover:bg-red-700 text-red-200 px-3 py-1.5 rounded text-xs border border-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 flex items-center gap-3">
      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
      <span className="text-green-300 text-sm">
        Conectado al servidor backend — API HTTP activa — Persistencia SQLite
      </span>
      {apiState.lastChecked && (
        <span className="text-green-600 text-xs ml-auto">
          {apiState.lastChecked}
        </span>
      )}
    </div>
  );
}
