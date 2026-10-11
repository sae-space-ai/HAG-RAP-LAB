# 02_CAPABILITY_MATRIX.md — Matriz de Capacidades

**Fecha:** 2025-01-15  
**Algoritmo:** EGM-LITE-v0.1.0

---

## ESTADO DE COMPONENTES

| ID | Nombre | Estado | WP | Tests | Descripción |
|----|--------|--------|-----|-------|-------------|
| EGM | Evidence Graph Memory (Lite) | **VERIFICADO_LOCAL** | WP3 | tests/egm-lite.test.ts | Evaluación determinista, detección de contradicciones, procedencia |
| DRE | Deep Reasoning Engine | NO_IMPLEMENTADO | WP3 | — | Sin implementación, sin endpoint, sin datos fabricados |
| AWE | Abstraction and World-Model Engine | NO_IMPLEMENTADO | WP4 | — | Sin implementación |
| HCP | Hierarchical Contingent Planner | NO_IMPLEMENTADO | WP5 | — | Sin implementación |
| TAL | Trust and Assurance Layer | NO_IMPLEMENTADO | WP6 | — | Sin implementación |
| HGI | Human Governance Interface | NO_IMPLEMENTADO | WP6 | — | UI demo de solo lectura; no es gobernanza real |
| RAEC | Resource-Aware Execution Controller | NO_IMPLEMENTADO | WP1 | — | Sin implementación |

## RESUMEN

- **Total componentes:** 7
- **Verificados localmente:** 1 (EGM-Lite)
- **No implementados:** 6
- **Bloqueados:** 0
- **Implementados sin verificar:** 0

## CRITERIOS DE ETIQUETADO

| Estado | Significado | Evidencia requerida |
|--------|-------------|---------------------|
| VERIFICADO_LOCAL | Funcionalidad implementada y probada con tests | Tests unitarios que pasan |
| IMPLEMENTADO_SIN_VERIFICAR | Código escrito pero sin tests que lo validen | Código fuente visible |
| NO_IMPLEMENTADO | No existe código funcional | Ausencia de endpoint/función |
| BLOQUEADO | Existe código pero no puede ejecutarse por limitación del entorno | Documentación del bloqueo |

## PRUEBAS ASOCIADAS

### EGM-Lite (VERIFICADO_LOCAL)
- `tests/egm-lite.test.ts` — 15 tests
  - Test 1: Fuentes concordantes → SUPPORTED
  - Test 2: Fuentes contradictorias → CONTRADICTED + ABSTAIN
  - Test 3: Sin evidencia → INSUFFICIENT_EVIDENCE + ABSTAIN
  - Test 4: Referencia inexistente → ERROR
  - Test 5: Determinismo (mismos datos → mismo resultado)
  - Test 6: Integridad referencial
  - Test 7: Detección de contradicciones
  - Test 8: Abstención para estados no-SUPPORTED
  - Test 9: Etiquetado SYNTHETIC en todos los datos
  - Test 10: Error seguro para afirmación inexistente
  - Test 11: Compatibilidad de valores determinista
  - Test 12: Validación de referencias
  - Test 13: Versión de algoritmo consistente
  - Test 14: Verificación de integridad
  - Test 15: Error al cargar evidencia con fuente inexistente

### API Service Layer
- `tests/api.test.ts` — 10 tests
  - Health endpoint
  - Capabilities endpoint (7 componentes, 1 verificado)
  - Demo cases listing (5 casos sintéticos)
  - Evaluación de casos 1-4
  - Error para caso inexistente
  - Etiquetado SYNTHETIC en respuestas
  - Ausencia de endpoints de escritura

## NOTA IMPORTANTE

No se afirma que la funcionalidad de EGM-Lite sea:
- Inferencia causal
- Razonamiento profundo
- Abstracción
- Planificación
- Certificación formal
- Prueba matemática

Es un **primer motor de reconciliación de evidencias** basado en reglas deterministas simples.
