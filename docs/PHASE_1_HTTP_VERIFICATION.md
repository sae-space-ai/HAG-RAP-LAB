# PHASE_1_HTTP_VERIFICATION.md — Verificación HTTP Fase 1

**Fecha:** 2025-01-15  
**Estado:** ⚠️ NO VERIFICADO EN EJECUCIÓN

---

## ENDPOINTS DEFINIDOS (11 RUTAS)

| # | Método | Ruta | Descripción | Schema Zod | Auth | Test |
|---|--------|------|-------------|------------|------|------|
| 1 | GET | /api/v1/health | Estado del servidor | — | No | ✅ Escrito |
| 2 | GET | /api/v1/capabilities | 7 componentes | — | No | ✅ Escrito |
| 3 | GET | /api/v1/cases | 7 casos sintéticos | — | No | ✅ Escrito |
| 4 | GET | /api/v1/cases/:id | Detalle de caso | — | No | ✅ Escrito |
| 5 | POST | /api/v1/evaluations | Evaluar afirmación | evaluationInputSchema | No | ✅ Escrito |
| 6 | GET | /api/v1/evaluations/:id | Evaluación persistida | — | No | ✅ Escrito |
| 7 | GET | /api/v1/evaluations | Historial | — | No | ✅ Escrito |
| 8 | GET | /api/v1/sources | Fuentes | — | No | ✅ Escrito |
| 9 | GET | /api/v1/claims | Claims | — | No | ✅ Escrito |
| 10 | GET | /api/v1/audit | Auditoría | — | No | ✅ Escrito |
| 11 | POST | /api/v1/seed | Seed sintético | seedPayloadSchema | x-dev-token | ✅ Escrito |

---

## PRUEBAS SUPERTEST ESCRITAS (17)

| # | Test | Endpoint | Verificación | Estado |
|---|------|----------|--------------|--------|
| 1 | Health OK | GET /health | status=ok, runtime, stats | ✅ Escrito |
| 2 | Capabilities 7 | GET /capabilities | 7 componentes, 1 verificado | ✅ Escrito |
| 3 | Cases list | GET /cases | SYNTHETIC, 7 casos | ✅ Escrito |
| 4 | Case detail | GET /cases/CASE-001 | claim + sources | ✅ Escrito |
| 5 | Case 404 | GET /cases/NONEXISTENT | 404 + error code | ✅ Escrito |
| 6 | Eval SUPPORTED | POST /evaluations | verdict=SUPPORTED | ✅ Escrito |
| 7 | Eval CONTRADICTED | POST /evaluations | verdict=CONTRADICTED | ✅ Escrito |
| 8 | Eval INSUFFICIENT | POST /evaluations | verdict=INSUFFICIENT | ✅ Escrito |
| 9 | Eval invalid input | POST /evaluations | 400 + INVALID_INPUT | ✅ Escrito |
| 10 | Get evaluation | GET /evaluations/:id | Persistida | ✅ Escrito |
| 11 | Eval 404 | GET /evaluations/NONEXISTENT | 404 | ✅ Escrito |
| 12 | Evals list | GET /evaluations | Array + count | ✅ Escrito |
| 13 | Sources | GET /sources | SYNTHETIC | ✅ Escrito |
| 14 | Claims | GET /claims | SYNTHETIC | ✅ Escrito |
| 15 | Seed idempotent | POST /seed | Sin duplicados | ✅ Escrito |
| 16 | Determinism | POST /evaluations x2 | Mismo hash | ✅ Escrito |
| 17 | No secrets | GET /cases/NONEXISTENT | Sin stack trace | ✅ Escrito |

---

## ESTADO DE VERIFICACIÓN

| Aspecto | Estado | Evidencia |
|---------|--------|-----------|
| Código de rutas | ✅ Implementado | server/routes.ts |
| Validación Zod | ✅ Implementado | server/schemas.ts |
| Tests escritos | ✅ 17 tests | tests/integration/api.integration.test.ts |
| Tests ejecutados | ❌ BLOCKED | Sandbox no ejecuta Vitest |
| HTTP real probado | ❌ BLOCKED | Servidor no arrancado |
| Concordancia OpenAPI | ⚠️ NO VERIFICADO | Requiere ejecución |

---

## CONTRATO DE RESPUESTAS (ESPERADO)

### GET /api/v1/health
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T...",
  "version": "EGM-PERSISTENT-v1.0.0",
  "runtime": "NODE_EXPRESS_SQLITE",
  "dependencies": {
    "storage": "SQLite_LOCAL",
    "coreLogic": "VERIFIED",
    "externalServices": "NONE_CONNECTED"
  },
  "stats": { "sources": 6, "claims": 9, "evaluations": 0 }
}
```

### POST /api/v1/evaluations
```json
{
  "evaluation": {
    "id": "EVAL-XXXXXXXX",
    "caseId": "CASE-001",
    "algorithmVersion": "EGM-PERSISTENT-v1.0.0",
    "verdict": "SUPPORTED",
    "decision": "PROCEED",
    "appliedRule": "RULE-SUPPORTED",
    "inputsHash": "abc123...",
    "explanation": "...",
    "supportingSourceIds": ["SRC-001", "SRC-002"],
    "contradictingSourceIds": [],
    "createdAt": "2025-01-15T..."
  },
  "classification": "SYNTHETIC"
}
```

### Errores
```json
{
  "error": "Case not found",
  "code": "CASE_NOT_FOUND",
  "message": "El caso \"NONEXISTENT\" no existe."
}
```

---

## PARA VERIFICAR EN EJECUCIÓN

```bash
# Terminal 1: Servidor
npm run server

# Terminal 2: Pruebas
curl http://localhost:4000/api/v1/health
curl http://localhost:4000/api/v1/cases
curl -X POST http://localhost:4000/api/v1/evaluations \
  -H "Content-Type: application/json" \
  -d '{"claimId":"CLM-001","caseId":"CASE-001"}'
```

O ejecutar tests:
```bash
npm test
```

---

**ESTADO FINAL:** 11 endpoints implementados, 17 tests escritos, 0 ejecutados.
