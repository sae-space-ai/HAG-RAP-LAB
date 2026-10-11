# PHASE_1_SQLITE_RESTART_PROOF.md — Prueba de Persistencia SQLite

**Fecha:** 2025-01-15  
**Estado:** ⚠️ BLOCKED — No ejecutado en sandbox

---

## PRUEBA DISEÑADA (NO EJECUTADA)

### Objetivo
Verificar que los datos sobreviven al cierre y reapertura de la conexión SQLite, y preferiblemente al reinicio del proceso servidor.

### Pasos diseñados

1. **Crear BD temporal** en fichero real (no `:memory:`)
2. **Inicializar** migraciones (5 tablas)
3. **Seed** de datos sintéticos (6 fuentes, 9 claims, 10 evidence_links)
4. **Contar registros** en cada tabla
5. **Evaluar caso** CASE-001 → crear evaluación persistida
6. **Registrar ID** y hash de procedencia
7. **Cerrar conexión** explícitamente
8. **Abrir NUEVA conexión** al mismo fichero
9. **Verificar** que evaluación sigue presente con mismo ID
10. **Verificar** que hash de procedencia es idéntico
11. **Re-seed** idempotente (sin duplicados)
12. **Verificar** integridad referencial (foreign_keys=ON)
13. **Limpiar** fichero temporal

### Test escrito (no ejecutado)

Archivo: `tests/integration/persistence.test.ts`

```typescript
it('Data persists after closing and reopening database', async () => {
  // Fase 1: Crear datos
  const db1 = new SQLiteStorageAdapter(PERSISTENCE_DB_PATH);
  await db1.initialize();
  // ... seed y evaluación ...
  await db1.close();

  // Fase 2: Reabrir y verificar
  const db2 = new SQLiteStorageAdapter(PERSISTENCE_DB_PATH);
  await db2.initialize();
  // ... verificar datos ...
  await db2.close();
});
```

---

## ESTADO REAL

| Aspecto | Estado | Evidencia |
|---------|--------|-----------|
| Código de persistencia | ✅ Implementado | server/storage.ts |
| Migraciones | ✅ Implementado | 5 tablas + índices |
| Test escrito | ✅ 4 tests | tests/integration/persistence.test.ts |
| Test ejecutado | ❌ BLOCKED | Sandbox no ejecuta Vitest |
| Fichero SQLite creado | ❌ NO | Sandbox limita |
| Reapertura verificada | ❌ NO | No se pudo probar |
| Reinicio de proceso | ❌ NO | No se pudo probar |

---

## ESQUEMA SQLite (IMPLEMENTADO)

```sql
-- 5 tablas
CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL,
  origin_uri TEXT,
  obtained_at TEXT NOT NULL,
  reliability_metadata TEXT,
  synthetic INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE claims (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  predicate TEXT NOT NULL,
  object_value TEXT NOT NULL,
  unit TEXT,
  valid_from TEXT,
  valid_to TEXT,
  source_id TEXT NOT NULL,
  status TEXT NOT NULL,
  revision INTEGER NOT NULL,
  synthetic INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE evidence_links (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  transformation TEXT NOT NULL,
  extracted_at TEXT NOT NULL,
  provenance_hash TEXT NOT NULL,
  FOREIGN KEY (claim_id) REFERENCES claims(id),
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE evaluations (
  id TEXT PRIMARY KEY,
  case_id TEXT,
  algorithm_version TEXT NOT NULL,
  verdict TEXT NOT NULL,
  decision TEXT NOT NULL,
  applied_rule TEXT NOT NULL,
  inputs_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  full_result_json TEXT NOT NULL
);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  actor_identifier TEXT NOT NULL,
  previous_hash TEXT,
  event_hash TEXT NOT NULL,
  occurred_at TEXT NOT NULL
);

-- Índices
CREATE INDEX idx_claims_subject ON claims(subject, predicate);
CREATE INDEX idx_evidence_claim ON evidence_links(claim_id);
CREATE INDEX idx_evaluations_case ON evaluations(case_id);
CREATE INDEX idx_audit_occurred ON audit_events(occurred_at);
```

---

## CONFIGURACIÓN SQLite (IMPLEMENTADA)

```typescript
this.db = new Database(this.dbPath);
this.db.pragma('journal_mode = WAL');
this.db.pragma('foreign_keys = ON');
```

- **WAL mode:** Habilitado para concurrencia básica
- **Foreign keys:** Activadas para integridad referencial
- **INSERT OR IGNORE:** Para idempotencia de seed

---

## PARA VERIFICAR EN EJECUCIÓN

```bash
# Terminal 1: Servidor
npm run server
# Verificar: "✓ Storage initialized (SQLite)"
# Verificar: "✓ Seeded: 6 sources, 9 claims, 10 evidence links"

# Terminal 2: Evaluar
curl -X POST http://localhost:4000/api/v1/evaluations \
  -H "Content-Type: application/json" \
  -d '{"claimId":"CLM-001","caseId":"CASE-001"}'
# Registrar ID de evaluación

# Detener servidor (Ctrl+C)
# Reiniciar servidor
npm run server

# Terminal 2: Verificar persistencia
curl http://localhost:4000/api/v1/evaluations
# La evaluación anterior debe seguir presente
```

O ejecutar tests:
```bash
npm test
```

---

## LIMITACIÓN IMPORTANTE

**Reapertura de conexión ≠ Reinicio de proceso**

- Cerrar y reabrir conexión SQLite verifica persistencia en disco
- Reiniciar el proceso servidor verifica que no hay estado en memoria
- Esta prueba solo verifica lo primero (conexión)
- Para verificar reinicio de proceso, ejecutar el script manual arriba

---

**ESTADO FINAL:** Persistencia implementada, tests escritos, ejecución BLOCKED.
