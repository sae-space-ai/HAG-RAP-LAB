# 01_ARCHITECTURE.md — Arquitectura HAG-RAP Fase 0

**Versión:** EGM-LITE-v0.1.0  
**Fecha:** 2025-01-15

---

## 1. VISIÓN GENERAL

HAG-RAP investiga una arquitectura cognitiva con nueve paquetes de trabajo. En Fase 0, solo se implementa funcionalidad real en EGM-Lite. Los demás componentes están registrados pero marcados como NO_IMPLEMENTADO.

## 2. MAPA DE COMPONENTES

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTERFAZ (HGI-Lite)                          │
│  Header | CapabilityMatrix | CaseSelector | EvaluationPanel    │
├─────────────────────────────────────────────────────────────────┤
│                    API SERVICE LAYER                            │
│  apiHealth | apiCapabilities | apiDemoCases | apiEvaluateCase   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   EGM    │  │   DRE    │  │   AWE    │  │   HCP    │       │
│  │  LITE    │  │  (N/I)   │  │  (N/I)   │  │  (N/I)   │       │
│  │VERIFICADO│  │          │  │          │  │          │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │   TAL    │  │   HGI    │  │   RAEC   │                      │
│  │  (N/I)   │  │  (N/I)   │  │  (N/I)   │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                    FIXTURES (SYNTHETIC)                         │
│  Sources | Evidences | Claims | DemoCases                      │
└─────────────────────────────────────────────────────────────────┘
```

**N/I = NO_IMPLEMENTADO**

## 3. CONTRATOS DE COMPONENTES

### EGM-Lite (Evidence Graph Memory — Lite)
- **Estado:** VERIFICADO_LOCAL
- **Responsabilidad:** Almacenar evidencias con procedencia, evaluar afirmaciones de forma determinista, detectar contradicciones
- **Entrada:** Source[], Evidence[], Claim[]
- **Salida:** Evaluation (status, rule, explanation, provenance)
- **Reglas:**
  - RULE-ERR: Referencia inexistente → ERROR
  - RULE-INSUFFICIENT: Sin evidencia → INSUFFICIENT_EVIDENCE
  - RULE-CONTRADICTED: Valores incompatibles → CONTRADICTED
  - RULE-SUPPORTED: Evidencias concordantes → SUPPORTED
  - RULE-PARTIAL: Consistentes pero no coinciden → INSUFFICIENT_EVIDENCE
- **Decisión:** Solo SUPPORTED → PROCEED; todo lo demás → ABSTAIN
- **Tests:** tests/egm-lite.test.ts (15 tests)

### DRE (Deep Reasoning Engine)
- **Estado:** NO_IMPLEMENTADO
- **WP:** WP3
- **Futuro:** Inferencia causal, razonamiento profundo
- **Fase 0:** Sin endpoint, sin resultado fabricado

### AWE (Abstraction and World-Model Engine)
- **Estado:** NO_IMPLEMENTADO
- **WP:** WP4
- **Futuro:** Abstracción, modelos del mundo

### HCP (Hierarchical Contingent Planner)
- **Estado:** NO_IMPLEMENTADO
- **WP:** WP5
- **Futuro:** Planificación adaptativa, replanificación

### TAL (Trust and Assurance Layer)
- **Estado:** NO_IMPLEMENTADO
- **WP:** WP6
- **Futuro:** Certificación, garantías de seguridad

### HGI (Human Governance Interface)
- **Estado:** NO_IMPLEMENTADO
- **WP:** WP6
- **Nota:** La UI actual es demostrativa y de solo lectura. No constituye gobernanza humana real.

### RAEC (Resource-Aware Execution Controller)
- **Estado:** NO_IMPLEMENTADO
- **WP:** WP1
- **Futuro:** Control de recursos, límites de ejecución

## 4. LÍMITES ENTRE COMPONENTES

Los componentes se comunican a través de interfaces TypeScript estrictas definidas en `src/core/types.ts`. Cada componente:
- Recibe datos tipados
- Retorna resultados tipados
- No accede directamente al estado interno de otros componentes
- Puede ser reemplazado sin afectar al resto (cuando se implemente)

## 5. DEPENDENCIAS

### Internas
- `types.ts` → Todos los módulos (definiciones de tipos)
- `fixtures.ts` → `api.ts` (datos sintéticos)
- `egm-lite.ts` → `api.ts` (lógica de evaluación)
- `capabilities.ts` → `api.ts` (registro de estados)

### Externas
- React 18 (UI)
- Tailwind CSS 4 (estilos)
- vitest (tests)
- **Ningún servicio externo conectado**
- **Ninguna base de datos**
- **Ningún modelo de IA externo**

## 6. FLUJO DE DATOS

```
Usuario → Selecciona caso → apiEvaluateCase(caseId)
  → Obtiene Claim de EGM
  → Valida referencias (RULE-ERR si faltan)
  → Verifica evidencia (RULE-INSUFFICIENT si vacía)
  → Detecta contradicciones (RULE-CONTRADICTED si incompatibles)
  → Compara con valor propuesto (RULE-SUPPORTED o RULE-PARTIAL)
  → Determina decisión (PROCEED o ABSTAIN)
  → Retorna Evaluation + provenance completo
```
