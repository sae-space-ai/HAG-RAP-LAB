# HAG-RAP LAB — Prototipo Científico Fase 0

> **PROTOTIPO EXPERIMENTAL — DATOS SINTÉTICOS — SIN VALIDACIÓN TRL**

## Finalidad

HAG-RAP (Human-Governed Deep Reasoning, Abstraction and Planning for Trustworthy Cognitive AI) investiga una arquitectura cognitiva que une memoria de evidencias, razonamiento profundo, abstracción, planificación, controles de garantía y supervisión humana.

Este repositorio contiene la **Fase 0**: un prototipo mínimo ejecutable que demuestra un flujo verificable de fuentes y evidencias contradictorias.

## ⚠️ Límites Críticos

- **Todos los datos son sintéticos** (clasificación: SYNTHETIC)
- **Solo EGM-Lite tiene funcionalidad real** (los demás componentes están NO_IMPLEMENTADO)
- **No hay inferencia causal, abstracción, planificación ni certificación**
- **No toma decisiones operativas sobre personas ni sistemas**
- **No se conecta a servicios externos**
- **No persiste datos** (DEMO_NO_PERSISTENT)

## Instalación

```bash
npm install
```

## Comandos

```bash
# Desarrollo
npm run dev          # Servidor en http://localhost:3000

# Producción
npm run build        # Build en dist/

# Verificación
npm run typecheck    # TypeScript strict
npx vitest run       # Tests unitarios (requiere entorno local)
```

## Estructura

```
src/
├── core/
│   ├── types.ts          — Tipos estrictos
│   ├── egm-lite.ts       — Motor de evaluación (VERIFICADO_LOCAL)
│   ├── fixtures.ts       — Datos sintéticos
│   ├── capabilities.ts   — Registro de componentes
│   └── api.ts            — Capa de servicios
├── components/
│   ├── Header.tsx
│   ├── CapabilityMatrix.tsx
│   ├── CaseSelector.tsx
│   └── EvaluationPanel.tsx
├── App.tsx               — Aplicación principal
├── main.tsx              — Punto de entrada
└── index.css             — Estilos

tests/
├── egm-lite.test.ts      — 15 tests del motor
└── api.test.ts           — 10 tests de la API

docs/
├── 00_BASELINE.md        — Estado inicial
├── 01_ARCHITECTURE.md    — Arquitectura
├── 02_CAPABILITY_MATRIX.md — Capacidades
├── 03_TEST_EVIDENCE.md   — Evidencia de pruebas
├── 04_LIMITATIONS.md     — Limitaciones
└── PHASE_0_REPORT.md     — Informe de fase
```

## Componentes

| ID | Nombre | Estado |
|----|--------|--------|
| EGM | Evidence Graph Memory (Lite) | ✅ VERIFICADO_LOCAL |
| DRE | Deep Reasoning Engine | ❌ NO_IMPLEMENTADO |
| AWE | Abstraction and World-Model Engine | ❌ NO_IMPLEMENTADO |
| HCP | Hierarchical Contingent Planner | ❌ NO_IMPLEMENTADO |
| TAL | Trust and Assurance Layer | ❌ NO_IMPLEMENTADO |
| HGI | Human Governance Interface | ❌ NO_IMPLEMENTADO |
| RAEC | Resource-Aware Execution Controller | ❌ NO_IMPLEMENTADO |

## Casos de Prueba

| Caso | Descripción | Resultado Esperado |
|------|-------------|-------------------|
| CASE-001 | Fuentes concordantes | SUPPORTED |
| CASE-002 | Fuentes contradictorias | CONTRADICTED → ABSTAIN |
| CASE-003 | Sin evidencia | INSUFFICIENT_EVIDENCE → ABSTAIN |
| CASE-004 | Referencia inexistente | ERROR → ABSTAIN |
| CASE-005 | Determinismo | SUPPORTED (reproducible) |

## Documentación Completa

Ver `/docs/` para detalles de arquitectura, capacidades, limitaciones y el informe completo de Fase 0.

## Licencia

Prototipo científico de investigación. No para uso en producción.
