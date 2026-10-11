/**
 * HAG-RAP LAB — Main Application Component
 * 
 * PROTOTIPO EXPERIMENTAL — DATOS SINTETICOS — SIN VALIDACION TRL
 */

import { useState, useEffect } from 'react';
import { apiHealth, apiCapabilities, apiDemoCases, apiEvaluateCase } from './core/api';
import type {
  HealthResponse,
  CapabilitiesResponse,
  DemoCase,
  EvaluationResponse,
  ErrorResponse,
} from './core/types';
import { Header } from './components/Header';
import { CapabilityMatrix } from './components/CapabilityMatrix';
import { CaseSelector } from './components/CaseSelector';
import { EvaluationPanel } from './components/EvaluationPanel';

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [capabilities, setCapabilities] = useState<CapabilitiesResponse | null>(null);
  const [cases, setCases] = useState<DemoCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResponse | ErrorResponse | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    // Load initial data
    setHealth(apiHealth());
    setCapabilities(apiCapabilities());
    setCases(apiDemoCases());
  }, []);

  const handleEvaluate = () => {
    if (!selectedCase) return;
    setIsEvaluating(true);
    setEvaluationResult(null);

    // Simulate async execution (as if calling a real API)
    setTimeout(() => {
      const result = apiEvaluateCase(selectedCase);
      setEvaluationResult(result);
      setIsEvaluating(false);
    }, 300);
  };

  const handleCopyReport = () => {
    if (!evaluationResult) return;
    const report = JSON.stringify(evaluationResult, null, 2);
    navigator.clipboard.writeText(report).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const isErrorResponse = (r: EvaluationResponse | ErrorResponse): r is ErrorResponse => {
    return 'error' in r;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header health={health} />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Warning Banner */}
        <div className="bg-amber-900/30 border border-amber-600 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-amber-400 text-xl">⚠️</span>
            <div>
              <h3 className="font-bold text-amber-300 text-sm uppercase tracking-wide">
                PROTOTIPO EXPERIMENTAL — DATOS SINTÉTICOS — SIN VALIDACIÓN TRL
              </h3>
              <p className="text-amber-200/80 text-sm mt-1">
                Este sistema es un prototipo de Fase 0. Todos los datos son sintéticos (clasificación: SYNTHETIC).
                No existe inferencia causal, razonamiento profundo, abstracción, planificación ni certificación implementados.
                Solo el módulo EGM-Lite tiene funcionalidad real verificada. No tomar decisiones operativas basadas en estos resultados.
              </p>
            </div>
          </div>
        </div>

        {/* Capability Matrix */}
        <section>
          <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Estado de Componentes
          </h2>
          <CapabilityMatrix capabilities={capabilities} />
        </section>

        {/* Demo Cases & Evaluation */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Casos de Prueba Sintéticos
            </h2>
            <CaseSelector
              cases={cases}
              selectedCase={selectedCase}
              onSelect={setSelectedCase}
              onEvaluate={handleEvaluate}
              isEvaluating={isEvaluating}
            />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Resultado de Evaluación
            </h2>
            <EvaluationPanel
              result={evaluationResult}
              isEvaluating={isEvaluating}
              isErrorResponse={evaluationResult ? isErrorResponse(evaluationResult) : false}
              onCopy={handleCopyReport}
              copySuccess={copySuccess}
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-800 pt-6 mt-12">
          <div className="text-center text-gray-500 text-sm space-y-1">
            <p>HAG-RAP LAB — Fase 0 — Prototipo Científico Veraz</p>
            <p>
              {health && (
                <>
                  Motor: {health.version} | Persistencia: {health.dependencies.persistence} | 
                  Servicios externos: {health.dependencies.externalServices}
                </>
              )}
            </p>
            <p className="text-gray-600">
              Ningún dato real. Ningún servicio externo conectado. Sin decisiones operativas.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
