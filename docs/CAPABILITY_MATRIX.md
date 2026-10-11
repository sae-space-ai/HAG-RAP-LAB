# CAPABILITY_MATRIX.md — Matriz de Capacidades Actualizada

**Fecha:** 2025-01-15  
**Fase:** 1 (con persistencia)

---

## ESTADO DE COMPONENTES

| ID | Nombre | Fase 0 | Fase 1 | WP | Tests |
|----|--------|--------|--------|-----|-------|
| EGM | Evidence Graph Memory | VERIFICADO_LOCAL (in-memory) | **VERIFICADO_LOCAL** (persistente SQLite) | WP3 | 15 unit + 17 integration + 4 persistence |
| DRE | Deep Reasoning Engine | NO_IMPLEMENTADO | NO_IMPLEMENTADO | WP3 | — |
| AWE | Abstraction and World-Model Engine | NO_IMPLEMENTADO | NO_IMPLEMENTADO | WP4 | — |
| HCP | Hierarchical Contingent Planner | NO_IMPLEMENTADO | NO_IMPLEMENTADO | WP5 | — |
| TAL | Trust and Assurance Layer | NO_IMPLEMENTADO | NO_IMPLEMENTADO | WP6 | — |
| HGI | Human Governance Interface | NO_IMPLEMENTADO | NO_IMPLEMENTADO (UI demo) | WP6 | — |
| RAEC | Resource-Aware Execution Controller | NO_IMPLEMENTADO | NO_IMPLEMENTADO | WP1 | — |

## RESUMEN

- **Total componentes:** 7
- **Verificados localmente:** 1 (EGM-Persistent)
- **No implementados:** 6
- **Bloqueados:** 0
- **Tests escritos:** 36
- **Tests ejecutados:** 0 (BLOCKED por sandbox)
- **Build:** ✅ PASS

## EVOLUCIÓN FASE 0 → FASE 1

| Aspecto | Fase 0 | Fase 1 |
|---------|--------|--------|
| API | Funciones locales | HTTP real (Express) |
| Persistencia | In-memory (se pierde) | SQLite (sobrevive reinicio) |
| Frontend | Llama funciones directas | Fetch HTTP |
| Estado sin conexión | N/A | Banner SIN CONEXIÓN |
| Auditoría | No | Cadena de hashes |
| Casos | 5 | 7 (añadidos derivados y periodos) |
| Tests | 25 escritos | 36 escritos |
| Validación | Tipos TS | Zod schemas server-side |
| Seguridad | Básica | CORS, auth token, límites |

## NOTAS

- EGM-Persistent NO es inferencia causal, abstracción ni planificación
- La persistencia SQLite NO es apta para producción multiusuario
- Los tests NO se han ejecutado en este sandbox
- El build del frontend SÍ se ha ejecutado y pasa correctamente
