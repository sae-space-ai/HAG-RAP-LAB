/**
 * HAG-RAP LAB — Main Application Component (Phase 1)
 * 
 * Uses real HTTP API to backend server.
 * Shows SIN CONEXIÓN when backend is unavailable.
 * NEVER fabricates success data.
 * 
 * PROTOTIPO EXPERIMENTAL — DATOS SINTETICOS — SIN VALIDACION TRL
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchHealth,
  fetchCapabilities,
  fetchCases,
  fetchEvaluate,
  fetchEvaluations,
  checkConnection,
  getApiState,
  type HealthData,
  type CapabilitiesData,
  type CaseData,
  type EvaluationData,
  type EvaluationsListData,
} from './core/api-client';
import { Header } from './components/Header';
import { CapabilityMatrix } from './components/CapabilityMatrix';
import { CaseSelector } from './components/CaseSelector';
import { EvaluationPanel } from './components/EvaluationPanel';
import { ConnectionBanner } from './components/ConnectionBanner';
import { EvaluationHistory } from './components/EvaluationHistory';
import { DREPanel } from './components/DREPanel';

export default function App() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [capabilities, setCapabilities] = useState<CapabilitiesData | null>(null);
  const [cases, setCases] = useState<CaseData[]>([]);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationData | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationsListData | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const loadInitialData = useCallback(async () => {
    const isConnected = await checkConnection();
    setConnected(isConnected);

    if (!isConnected) return;

    try {
      const [healthData, capsData, casesData, evalsData] = await Promise.all([
        fetchHealth(),
        fetchCapabilities(),
        fetchCases(),
        fetchEvaluations(),
      ]);
      setHealth(healthData);
      setCapabilities(capsData);
      setCases(casesData.cases);
      setEvaluations(evalsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data');
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleEvaluate = async () => {
    if (!selectedCase) return;
    setIsEvaluating(true);
    setEvaluationResult(null);
    setError(null);

    try {
      const result = await fetchEvaluate({ caseId: selectedCase });
      setEvaluationResult(result);
      
      // Refresh evaluations list
      const evalsData = await fetchEvaluations();
      setEvaluations(evalsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error evaluating case');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCopyReport = () => {
    if (!evaluationResult) return;
    const report = JSON.stringify(evaluationResult, null, 2);
    navigator.clipboard.writeText(report).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleRecheckConnection = async () => {
    setConnected(null);
    await loadInitialData();
  };

  // === RENDER ===

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header health={health} connected={connected} />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Connection Status */}
        <ConnectionBanner
          connected={connected}
          apiState={getApiState()}
          onRecheck={handleRecheckConnection}
        />

        {/* Warning Banner */}
        <div className="bg-amber-900/30 border border-amber-600 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-amber-400 text-xl">⚠️</span>
            <div>
              <h3 className="font-bold text-amber-300 text-sm uppercase tracking-wide">
                PROTOTIPO EXPERIMENTAL — DATOS SINTÉTICOS — SIN VALIDACIÓN TRL
              </h3>
              <p className="text-amber-200/80 text-sm mt-1">
                Este sistema incorpora EGM persistente y DRE-Lite experimental. Todos los datos son sintéticos.
                El DRE-Lite solo aplica reglas deterministas limitadas y trazables: no existe inferencia causal avanzada, planificación ni certificación.
                No tomar decisiones operativas basadas en estos resultados.
              </p>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
            <p className="text-red-300 text-sm font-medium">Error: {error}</p>
          </div>
        )}

        {connected && (
          <>
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
                  onCopy={handleCopyReport}
                  copySuccess={copySuccess}
                />
              </div>
            </section>

            {/* Phase 2: real bounded inference through backend HTTP */}
            <DREPanel cases={cases} />

            {/* Evaluation History */}
            <section>
              <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                Historial de Evaluaciones Persistidas
              </h2>
              <EvaluationHistory evaluations={evaluations} />
            </section>
          </>
        )}

        {/* Footer */}
        <footer className="border-t border-gray-800 pt-6 mt-12">
          <div className="text-center text-gray-500 text-sm space-y-1">
            <p>HAG-RAP LAB — Fase 2 inicial — EGM persistente + DRE-Lite experimental</p>
            <p>
              {health && (
                <>
                  Motor: {health.version} | Runtime: {health.runtime} | 
                  Almacenamiento: {health.dependencies.storage}
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
