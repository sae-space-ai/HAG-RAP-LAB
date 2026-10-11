import type { HealthData } from '../core/api-client';

interface HeaderProps {
  health: HealthData | null;
  connected: boolean | null;
}

export function Header({ health, connected }: HeaderProps) {
  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">HR</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">HAG-RAP LAB</h1>
            <p className="text-xs text-gray-400">
              Human-Governed Deep Reasoning, Abstraction and Planning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {connected !== null && (
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-gray-400">
                {connected ? 'Conectado' : 'Sin conexión'}
              </span>
            </div>
          )}
          {health && (
            <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded font-mono">
              {health.version}
            </span>
          )}
          <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded">
            FASE 1
          </span>
        </div>
      </div>
    </header>
  );
}
