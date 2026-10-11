/**
 * HAG-RAP Phase 0 — Component Capability Registry
 * 
 * This file tracks the REAL status of each component.
 * No component is falsely marked as implemented.
 * Only EGM-Lite has VERIFICADO_LOCAL status.
 */

import type { ComponentCapability } from './types';

export const CAPABILITIES: ComponentCapability[] = [
  {
    id: 'EGM',
    name: 'EGM-Lite',
    fullName: 'Evidence Graph Memory (Lite)',
    status: 'VERIFICADO_LOCAL',
    description: 'Almacén de evidencias con procedencia, evaluación determinista y detección de contradicciones. Funcionalidad real verificada con tests unitarios.',
    workPackage: 'WP3 (parcial)',
    testReference: 'tests/egm-lite.test.ts',
  },
  {
    id: 'DRE',
    name: 'DRE',
    fullName: 'Deep Reasoning Engine',
    status: 'NO_IMPLEMENTADO',
    description: 'Motor de razonamiento profundo e inferencia causal. No implementado en Fase 0. No existe endpoint ni resultado fabricado.',
    workPackage: 'WP3',
    testReference: null,
  },
  {
    id: 'AWE',
    name: 'AWE',
    fullName: 'Abstraction and World-Model Engine',
    status: 'NO_IMPLEMENTADO',
    description: 'Motor de abstracción y modelos del mundo. No implementado en Fase 0.',
    workPackage: 'WP4',
    testReference: null,
  },
  {
    id: 'HCP',
    name: 'HCP',
    fullName: 'Hierarchical Contingent Planner',
    status: 'NO_IMPLEMENTADO',
    description: 'Planificador jerárquico contingente. No implementado en Fase 0.',
    workPackage: 'WP5',
    testReference: null,
  },
  {
    id: 'TAL',
    name: 'TAL',
    fullName: 'Trust and Assurance Layer',
    status: 'NO_IMPLEMENTADO',
    description: 'Capa de confianza y garantía. No implementado en Fase 0.',
    workPackage: 'WP6',
    testReference: null,
  },
  {
    id: 'HGI',
    name: 'HGI',
    fullName: 'Human Governance Interface',
    status: 'NO_IMPLEMENTADO',
    description: 'Interfaz de gobernanza humana. La UI actual es demostrativa y de solo lectura. No constituye gobernanza real.',
    workPackage: 'WP6',
    testReference: null,
  },
  {
    id: 'RAEC',
    name: 'RAEC',
    fullName: 'Resource-Aware Execution Controller',
    status: 'NO_IMPLEMENTADO',
    description: 'Controlador de ejecución consciente de recursos. No implementado en Fase 0.',
    workPackage: 'WP1',
    testReference: null,
  },
];

export function getCapabilityById(id: string): ComponentCapability | undefined {
  return CAPABILITIES.find((c) => c.id === id);
}

export function getCapabilitiesSummary(): {
  total: number;
  verified: number;
  notImplemented: number;
  blocked: number;
} {
  return {
    total: CAPABILITIES.length,
    verified: CAPABILITIES.filter((c) => c.status === 'VERIFICADO_LOCAL').length,
    notImplemented: CAPABILITIES.filter((c) => c.status === 'NO_IMPLEMENTADO').length,
    blocked: CAPABILITIES.filter((c) => c.status === 'BLOQUEADO').length,
  };
}
