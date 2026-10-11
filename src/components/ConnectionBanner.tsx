import type { ApiState } from '../core/api-client';

interface ConnectionBannerProps {
  connected: boolean | null;
  apiState: ApiState;
  onRecheck: () => void;
}

export function ConnectionBanner({ connected, apiState, onRecheck }: ConnectionBannerProps) {
  if (connected === null) {
    return <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm text-gray-300">
      Comprobando la API HTTP de HAG-RAP LAB…
    </div>;
  }

  if (!connected) {
    const missingAPI = ['API_ROUTE_NOT_FOUND', 'NON_JSON_RESPONSE'].includes(apiState.failureKind ?? '');
    const wrongConfig = apiState.failureKind === 'MISCONFIGURED_BACKEND';
    return (
      <div className="bg-red-900/30 border border-red-700 rounded-lg p-5" role="alert">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2 min-w-0">
            <h3 className="font-bold text-red-200 text-sm uppercase tracking-wide">
              {missingAPI ? 'API NO DESPLEGADA O RUTA INCORRECTA' : wrongConfig ? 'CONFIGURACIÓN DE API NO VÁLIDA' : 'SIN CONEXIÓN CON EL BACKEND'}
            </h3>
            <p className="text-red-200/90 text-sm leading-relaxed">
              {missingAPI
                ? 'El frontend funciona, pero el servidor que debe responder a /api/v1 no está disponible en el destino configurado. GitHub Actions no publica un backend.'
                : wrongConfig
                ? 'Revise la variable VITE_API_BASE_URL en el proyecto Vercel y vuelva a compilar la web.'
                : 'No se ha podido contactar con el backend. Compruebe su URL, HTTPS, CORS y el estado del servicio.'}
            </p>
            <p className="font-mono text-xs text-red-300/90 break-all">
              Destino API: {apiState.apiUrl} ({apiState.source === 'same-origin' ? 'mismo dominio' : 'backend externo'})
            </p>
            {apiState.source === 'same-origin' && missingAPI && (
              <p className="text-amber-200 text-xs leading-relaxed">
                En Vercel: configure VITE_API_BASE_URL=https://su-backend-real y redepliegue.
                En desarrollo local: ejecute npm run server y npm run dev (proxy a localhost:4000).
                No se sustituirá el backend por respuestas ficticias.
              </p>
            )}
            {apiState.lastError && <p className="text-xs text-red-300/80 break-words">Diagnóstico: {apiState.lastError}</p>}
          </div>
          <button type="button" onClick={onRecheck}
            className="bg-red-800 hover:bg-red-700 text-red-100 px-4 py-2 rounded text-sm border border-red-700 shrink-0">
            Reintentar conexión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 flex items-center gap-3">
      <span className="w-2 h-2 bg-green-500 rounded-full shrink-0"></span>
      <span className="text-green-300 text-sm">Conectado a la API HAG-RAP — disponibilidad comprobada, validación científica independiente pendiente</span>
      <span className="text-green-700 text-xs ml-auto break-all">{apiState.apiUrl}</span>
    </div>
  );
}
