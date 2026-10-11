# HAG-RAP LAB — Prototipo Científico

> **PROTOTIPO EXPERIMENTAL — DATOS SINTÉTICOS — SIN VALIDACIÓN TRL**

## Estado Actual

- **Fase 0:** ✅ PASS (cerrada)
- **Fase 1:** ⚠️ PARTIAL / IMPLEMENTED_UNVERIFIED

**Nota:** El código está completo pero no se ha verificado en ejecución debido a limitaciones del entorno de desarrollo. Para cerrar Fase 1 como PASS, ejecutar localmente con Node.js 22 LTS o publicar en GitHub.

---

## Requisitos

- **Node.js:** 22 LTS (https://nodejs.org/)
- **npm:** 10+ (incluido con Node.js)
- **Sistema:** Windows 10/11, Linux, macOS
- **NO requiere:** Python, Docker, GPU

---

## Instalación

```bash
npm ci
```

---

## Comandos de Verificación

### TypeCheck
```bash
npm run typecheck              # Frontend TypeScript
npm run typecheck:server       # Backend TypeScript
```

### Build
```bash
npm run build                  # Frontend Vite
```

### Tests
```bash
npm test                       # 36 tests (Vitest)
npm run test:coverage          # Con cobertura
```

### Servidor
```bash
npm run server                 # Express en http://localhost:4000
```

### Frontend (desarrollo)
```bash
npm run dev                    # Vite en http://localhost:5173
```

---

## Verificación Completa (Dos Terminales)

### Terminal 1: Servidor
```bash
npm run server
```
Esperar: `✓ Server listening on http://localhost:4000`

### Terminal 2: Pruebas
```bash
# Health check
curl http://localhost:4000/api/v1/health

# Evaluar caso
curl -X POST http://localhost:4000/api/v1/evaluations \
  -H "Content-Type: application/json" \
  -d '{"claimId":"CLM-001","caseId":"CASE-001"}'

# Ver historial
curl http://localhost:4000/api/v1/evaluations
```

### Verificar Persistencia
1. Detener servidor (Ctrl+C)
2. Reiniciar: `npm run server`
3. Consultar historial: `curl http://localhost:4000/api/v1/evaluations`
4. La evaluación anterior debe seguir presente

---

## Windows PowerShell

Ver guía completa: `docs/VERIFY_WINDOWS_POWERSHELL.md`

**Comandos rápidos:**
```powershell
node --version
npm --version
npm ci
npm run typecheck
npm run typecheck:server
npm run build
npm test
npm run server  # Terminal 1
# En Terminal 2:
Invoke-RestMethod -Uri "http://localhost:4000/api/v1/health"
```

---

## API Endpoints (11 rutas)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/v1/health | Estado del servidor |
| GET | /api/v1/capabilities | 7 componentes |
| GET | /api/v1/cases | 7 casos sintéticos |
| GET | /api/v1/cases/:id | Detalle de caso |
| POST | /api/v1/evaluations | Evaluar afirmación |
| GET | /api/v1/evaluations/:id | Evaluación persistida |
| GET | /api/v1/evaluations | Historial |
| GET | /api/v1/sources | Fuentes |
| GET | /api/v1/claims | Claims |
| GET | /api/v1/audit | Auditoría |
| POST | /api/v1/seed | Seed (requiere token) |

---

## Variables de Entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | 4000 | Puerto del servidor |
| `DB_PATH` | ./data/hagrap.db | Ruta SQLite |
| `CORS_ORIGINS` | localhost:3000,localhost:5173 | Orígenes CORS |
| `HAGRAP_DEV_TOKEN` | (vacío) | Token para POST /seed |
| `NODE_ENV` | development | Entorno |

---

## Componentes

| ID | Nombre | Estado |
|----|--------|--------|
| EGM | Evidence Graph Memory (Persistent) | ✅ IMPLEMENTED |
| DRE | Deep Reasoning Engine | ❌ NO_IMPLEMENTADO |
| AWE | Abstraction and World-Model Engine | ❌ NO_IMPLEMENTADO |
| HCP | Hierarchical Contingent Planner | ❌ NO_IMPLEMENTADO |
| TAL | Trust and Assurance Layer | ❌ NO_IMPLEMENTADO |
| HGI | Human Governance Interface | ❌ NO_IMPLEMENTADO |
| RAEC | Resource-Aware Execution Controller | ❌ NO_IMPLEMENTADO |

---

## Casos Experimentales (7)

| ID | Descripción | Verdict Esperado |
|----|-------------|-----------------|
| CASE-001 | Fuentes concordantes | SUPPORTED |
| CASE-002 | Fuentes contradictorias | CONTRADICTED → ABSTAIN |
| CASE-003 | Sin evidencia | INSUFFICIENT_EVIDENCE → ABSTAIN |
| CASE-004 | Fuente inexistente | ERROR → ABSTAIN |
| CASE-005 | Determinismo | SUPPORTED |
| CASE-006 | Fuente derivada | INSUFFICIENT_EVIDENCE |
| CASE-007 | Periodo diferente | SUPPORTED |

---

## Estructura

```
server/              — Backend Express + SQLite
├── index.ts         — Entry point
├── app.ts           — Configuración Express
├── routes.ts        — 11 endpoints
├── engine.ts        — Motor EGM-Persistent
├── storage.ts       — SQLite + StorageAdapter
├── schemas.ts       — Validación Zod
└── seed.ts          — Datos sintéticos

src/                 — Frontend React
├── core/
│   └── api-client.ts — Cliente HTTP
├── components/      — UI React
├── App.tsx          — Aplicación principal
└── main.tsx         — Entry point

tests/               — Tests Vitest
├── egm-engine.test.ts
└── integration/
    ├── api.integration.test.ts
    └── persistence.test.ts

docs/                — Documentación
.github/workflows/   — GitHub Actions
```

---

## GitHub Actions

Workflow: `.github/workflows/verify.yml`

**Triggers:** push, pull_request, workflow_dispatch  
**Jobs:** verify (typecheck + build + tests), smoke-test (HTTP)

**Para ejecutar:** Publicar repositorio en GitHub y hacer push.

---

## Documentación

- `docs/PHASE_1_GO_NO_GO_FINAL.md` — Veredicto final
- `docs/PHASE_1_EXECUTION_MATRIX.md` — Matriz de ejecución
- `docs/PHASE_1_HTTP_VERIFICATION.md` — Endpoints HTTP
- `docs/PHASE_1_SQLITE_RESTART_PROOF.md` — Persistencia
- `docs/PHASE_1_CI_REPORT.md` — CI/CD
- `docs/VERIFY_WINDOWS_POWERSHELL.md` — Guía Windows
- `docs/PHASE_1_API_OPENAPI.yaml` — OpenAPI spec

---

## Limitaciones

- SQLite local NO es apto para producción multiusuario
- No hay inferencia causal, abstracción ni planificación
- No se conecta a servicios externos ni modelos de IA
- Todos los datos son sintéticos
- TRL no validado

---

## Seguridad

- Validación Zod server-side
- CORS configurable
- Sin secretos en código
- Token para endpoint seed (opcional)
- Sin stack traces en errores

---

## Veredicto

**Fase 0:** ✅ PASS  
**Fase 1:** ⚠️ PARTIAL (implementado, no verificado en ejecución)

**Para cerrar Fase 1:** Ejecutar `docs/VERIFY_WINDOWS_POWERSHELL.md` o publicar en GitHub.

---

## Licencia

Prototipo científico de investigación. No para uso en producción.
