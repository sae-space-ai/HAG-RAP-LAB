# PHASE_1_ARCHITECTURE.md — Arquitectura Fase 1

**Versión:** EGM-PERSISTENT-v1.0.0  
**Fecha:** 2025-01-15

---

## 1. VISIÓN GENERAL

Fase 1 transforma el prototipo SPA de Fase 0 en una aplicación cliente-servidor con:
- Backend Express + TypeScript con API HTTP real
- Persistencia SQLite con migraciones versionadas
- Frontend que consume API vía fetch HTTP
- Tests de integración con supertest
- Auditoría con cadena de hashes

## 2. ARQUITECTURA

```
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vite + React)                       │
│  ConnectionBanner | CapabilityMatrix | CaseSelector              │
│  EvaluationPanel | EvaluationHistory | Header                    │
│  api-client.ts (fetch → /api/v1/*)                               │
├──────────────────────────────────────────────────────────────────┤
│                    HTTP (fetch / supertest)                       │
├──────────────────────────────────────────────────────────────────┤
│                    BACKEND (Express + TypeScript)                 │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ROUTES (/api/v1/*)                                      │    │
│  │  health | capabilities | cases | evaluations | sources   │    │
│  │  claims | audit | seed                                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────────────┐    │
│  │  EGM ENGINE          │  │  ZOD SCHEMAS                 │    │
│  │  evaluate()          │  │  evaluationInputSchema       │    │
│  │  RULE-SUPPORTED      │  │  seedPayloadSchema           │    │
│  │  RULE-CONTRADICTED   │  │  Validación server-side      │    │
│  │  RULE-INSUFFICIENT   │  │                              │    │
│  │  RULE-ERR            │  │                              │    │
│  └──────────────────────┘  └──────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  STORAGE ADAPTER (interface)                              │   │
│  │  → SQLiteStorageAdapter (better-sqlite3)                  │   │
│  │  → Future: PostgreSQLAdapter (no implementado)            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                    SQLite (data/hagrap.db)                        │
│  sources | claims | evidence_links | evaluations | audit_events  │
└──────────────────────────────────────────────────────────────────┘
```

## 3. ENDPOINTS HTTP

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | /api/v1/health | Estado del proceso | No |
| GET | /api/v1/capabilities | Estado de componentes | No |
| GET | /api/v1/cases | Lista de casos sintéticos | No |
| GET | /api/v1/cases/:id | Detalle de caso | No |
| POST | /api/v1/evaluations | Evaluar caso/claim | No |
| GET | /api/v1/evaluations/:id | Obtener evaluación persistida | No |
| GET | /api/v1/evaluations | Listar evaluaciones | No |
| GET | /api/v1/sources | Listar fuentes | No |
| GET | /api/v1/claims | Listar afirmaciones | No |
| GET | /api/v1/audit | Eventos de auditoría | No |
| POST | /api/v1/seed | Cargar datos sintéticos | x-dev-token |

## 4. MODELO DE DATOS

### sources
- id (PK), title, source_type, origin_uri, obtained_at, reliability_metadata, synthetic, created_at

### claims
- id (PK), subject, predicate, object_value, unit, valid_from, valid_to, source_id (FK), status, revision, synthetic, created_at

### evidence_links
- id (PK), claim_id (FK), source_id (FK), transformation, extracted_at, provenance_hash

### evaluations
- id (PK), case_id, algorithm_version, verdict, decision, applied_rule, inputs_hash, created_at, full_result_json

### audit_events
- id (PK), action, entity_type, entity_id, actor_identifier, previous_hash, event_hash, occurred_at

## 5. VARIABLES DE ENTORNO

| Variable | Default | Descripción |
|----------|---------|-------------|
| PORT | 4000 | Puerto del servidor |
| DB_PATH | ./data/hagrap.db | Ruta de la base de datos SQLite |
| CORS_ORIGINS | localhost:3000,localhost:5173 | Orígenes permitidos |
| HAGRAP_DEV_TOKEN | (vacío) | Token para endpoint seed |
| NODE_ENV | development | Entorno de ejecución |

## 6. SEPARACIÓN DE RESPONSABILIDADES

- **Frontend:** Solo presentación y consumo de API. Sin lógica de evaluación.
- **Backend:** Toda la lógica de negocio, validación, persistencia.
- **Storage:** Interfaz abstracta para permitir migración futura a PostgreSQL.
- **Engine:** Motor determinista aislado de la capa HTTP.
