# HAG-RAP LAB — Prototipo Científico Fase 1

> **PROTOTIPO EXPERIMENTAL — DATOS SINTÉTICOS — SIN VALIDACIÓN TRL**

## Finalidad

HAG-RAP investiga una arquitectura cognitiva con memoria de evidencias, razonamiento, abstracción, planificación y supervisión humana. Este repositorio contiene las Fases 0 y 1 del prototipo.

**Fase 0:** Motor EGM-Lite in-memory con evaluación determinista.  
**Fase 1:** API HTTP real (Express), persistencia SQLite, frontend conectado.

## ⚠️ Límites Críticos

- **Todos los datos son sintéticos** (clasificación: SYNTHETIC)
- **Solo EGM-Persistent tiene funcionalidad real** (6 componentes NO_IMPLEMENTADO)
- **No hay inferencia causal, abstracción, planificación ni certificación**
- **SQLite local NO es apto para producción multiusuario**
- **No se conecta a servicios externos ni modelos de IA**

## Instalación

```bash
npm install
```

## Comandos

### Desarrollo Frontend
```bash
npm run dev          # Vite dev server en http://localhost:5173
```

### Servidor Backend
```bash
npm run server       # Express en http://localhost:4000
npm run server:dev   # Con hot reload (tsx watch)
```

### Producción (local)
```bash
npm run start        # Build + servidor
```

### Verificación
```bash
npm run build            # Build frontend (Vite)
npm run typecheck        # TypeScript frontend
npm run typecheck:server # TypeScript servidor
npm test                 # Tests unitarios + integración
npm run test:coverage    # Con cobertura
```

### PowerShell (Windows)
```powershell
npm install
npm run build
npm run server
# En otra ventana:
npm test
```

## Variables de Entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | 4000 | Puerto del servidor |
| `DB_PATH` | ./data/hagrap.db | Ruta base de datos SQLite |
| `CORS_ORIGINS` | localhost:3000,localhost:5173 | Orígenes CORS |
| `HAGRAP_DEV_TOKEN` | (vacío) | Token para POST /seed |
| `NODE_ENV` | development | Entorno |

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/v1/health | Estado del servidor |
| GET | /api/v1/capabilities | Estado de componentes |
| GET | /api/v1/cases | Casos sintéticos |
| GET | /api/v1/cases/:id | Detalle de caso |
| POST | /api/v1/evaluations | Evaluar afirmación |
| GET | /api/v1/evaluations/:id | Evaluación persistida |
| GET | /api/v1/evaluations | Historial |
| GET | /api/v1/sources | Fuentes |
| GET | /api/v1/claims | Afirmaaciones |
| GET | /api/v1/audit | Auditoría |
| POST | /api/v1/seed | Seed (requiere token) |

### Ejemplo con curl
```bash
# Health
curl http://localhost:4000/api/v1/health

# Evaluar caso
curl -X POST http://localhost:4000/api/v1/evaluations \
  -H "Content-Type: application/json" \
  -d '{"claimId":"CLM-001","caseId":"CASE-001"}'
```

## Estructura

```
server/
├── index.ts          — Entry point Express
├── app.ts            — Configuración + middleware
├── routes.ts         — 11 endpoints API
├── engine.ts         — Motor EGM persistente
├── storage.ts        — SQLite + StorageAdapter
├── schemas.ts        — Validación Zod
└── seed.ts           — Datos sintéticos

src/
├── core/
│   └── api-client.ts — Cliente HTTP fetch
├── components/       — UI React
├── App.tsx           — Aplicación principal
└── main.tsx          — Entry point

tests/
├── egm-engine.test.ts                    — 15 tests
└── integration/
    ├── api.integration.test.ts           — 17 tests
    └── persistence.test.ts              — 4 tests

docs/                   — Documentación completa
```

## Componentes

| ID | Nombre | Estado |
|----|--------|--------|
| EGM | Evidence Graph Memory (Persistent) | ✅ VERIFICADO_LOCAL |
| DRE | Deep Reasoning Engine | ❌ NO_IMPLEMENTADO |
| AWE | Abstraction and World-Model Engine | ❌ NO_IMPLEMENTADO |
| HCP | Hierarchical Contingent Planner | ❌ NO_IMPLEMENTADO |
| TAL | Trust and Assurance Layer | ❌ NO_IMPLEMENTADO |
| HGI | Human Governance Interface | ❌ NO_IMPLEMENTADO |
| RAEC | Resource-Aware Execution Controller | ❌ NO_IMPLEMENTADO |

## Casos Experimentales

| ID | Descripción | Verdict Esperado |
|----|-------------|-----------------|
| CASE-001 | Fuentes concordantes | SUPPORTED |
| CASE-002 | Fuentes contradictorias | CONTRADICTED → ABSTAIN |
| CASE-003 | Sin evidencia | INSUFFICIENT_EVIDENCE → ABSTAIN |
| CASE-004 | Fuente inexistente | ERROR → ABSTAIN |
| CASE-005 | Determinismo | SUPPORTED |
| CASE-006 | Fuente derivada | INSUFFICIENT_EVIDENCE |
| CASE-007 | Periodo diferente | SUPPORTED |

## Documentación

- `docs/PHASE_0_AUDIT.md` — Auditoría Fase 0
- `docs/PHASE_0_VERIFICATION.md` — Verificación Fase 0
- `docs/PHASE_1_ARCHITECTURE.md` — Arquitectura Fase 1
- `docs/PHASE_1_API_OPENAPI.yaml` — Especificación OpenAPI
- `docs/PHASE_1_TEST_EVIDENCE.md` — Evidencia de pruebas
- `docs/PHASE_1_SECURITY_NOTES.md` — Seguridad
- `docs/PHASE_1_LIMITATIONS.md` — Limitaciones
- `docs/PHASE_1_REPORT.md` — Informe final
- `docs/CAPABILITY_MATRIX.md` — Matriz actualizada

## Veredicto

- **FASE 0:** PASS (cerrada)
- **FASE 1:** PARTIAL (implementación completa, tests no ejecutados en sandbox)

Para PASS completo de Fase 1, ejecutar `npx vitest run` en entorno local.
