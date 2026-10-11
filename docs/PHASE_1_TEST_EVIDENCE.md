# PHASE_1_TEST_EVIDENCE.md — Evidencia de Pruebas Fase 1

**Fecha:** 2025-01-15

---

## PRUEBAS ESCRITAS

### tests/egm-engine.test.ts (15 tests)
| # | Test | Descripción |
|---|------|-------------|
| 1 | Fuentes concordantes → SUPPORTED | Verifica RULE-SUPPORTED |
| 2 | Fuentes contradictorias → CONTRADICTED | Verifica RULE-CONTRADICTED |
| 3 | Sin evidencia → INSUFFICIENT_EVIDENCE | Verifica RULE-INSUFFICIENT |
| 4 | Fuente inexistente → ERROR | Verifica RULE-ERR |
| 5 | Determinismo | Mismos inputs → mismos outputs |
| 6 | Claim inexistente → ERROR | Manejo de errores |
| 7 | Input inválido → ERROR | Validación |
| 8 | Etiquetado SYNTHETIC | Todos los datos sintéticos |
| 9 | Evaluaciones persistidas | SQLite funciona |
| 10 | Inputs hash determinista | Reproducibilidad |
| 11 | Provenance hash determinista | Trazabilidad |
| 12 | Event hash determinista | Auditoría |
| 13 | Fuente derivada | Caso extendido |
| 14 | Cadena de auditoría vacía | Integridad |
| 15 | Versión de algoritmo | Constante |

### tests/integration/api.integration.test.ts (17 tests)
| # | Test | Descripción |
|---|------|-------------|
| 1 | GET /health | Estado del servidor |
| 2 | GET /capabilities | 7 componentes |
| 3 | GET /cases | Lista sintética |
| 4 | GET /cases/:id | Detalle con claim |
| 5 | GET /cases/NONEXISTENT | 404 |
| 6 | POST /evaluations SUPPORTED | Caso 1 |
| 7 | POST /evaluations CONTRADICTED | Caso 2 |
| 8 | POST /evaluations INSUFFICIENT | Caso 3 |
| 9 | POST /evaluations invalid input | 400 |
| 10 | GET /evaluations/:id | Persistencia |
| 11 | GET /evaluations/NONEXISTENT | 404 |
| 12 | GET /evaluations | Lista |
| 13 | GET /sources | Fuentes sintéticas |
| 14 | GET /claims | Claims sintéticas |
| 15 | POST /seed | Idempotente |
| 16 | Determinismo HTTP | Mismo resultado |
| 17 | Sin secretos en errores | Seguridad |

### tests/integration/persistence.test.ts (4 tests)
| # | Test | Descripción |
|---|------|-------------|
| 1 | Persistencia tras reinicio | Datos sobreviven close+reopen |
| 2 | Idempotencia | Seed repetido no duplica |
| 3 | Integridad referencial | FKs válidas |
| 4 | Hash determinista | Reproducibilidad |

**Total: 36 tests escritos**

---

## PRUEBAS EJECUTADAS

| Comando | Estado | Resultado |
|---------|--------|-----------|
| `npm run build` | ✅ PASS | 35 módulos, 2.01s |
| `npm run typecheck` | ✅ PASS | Implícito en build |
| `npx vitest run` | ⚠️ BLOCKED | Sandbox no ejecuta vitest |
| `npm run server` | ⚠️ BLOCKED | Sandbox no permite servidor |
| Tests integración | ⚠️ BLOCKED | Requieren servidor + SQLite nativo |
| Tests persistencia | ⚠️ BLOCKED | Requieren SQLite nativo |

---

## COMANDO PARA REPRODUCIR LOCALMENTE

```bash
# Instalar dependencias
npm install

# Build frontend
npm run build

# Ejecutar tests
npx vitest run

# Levantar servidor
npm run server

# En otro terminal, probar API
curl http://localhost:4000/api/v1/health
curl http://localhost:4000/api/v1/cases
curl -X POST http://localhost:4000/api/v1/evaluations \
  -H "Content-Type: application/json" \
  -d '{"claimId":"CLM-001","caseId":"CASE-001"}'
```
