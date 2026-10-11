# PHASE_0_AUDIT.md — Auditoría de Fase 0

**Fecha auditoría:** 2025-01-15  
**Auditor:** Inspección de código fuente + verificación de build  
**Estado de partida:** Fase 0 PARTIAL (según informe previo)

---

## 1. QUÉ SE COMPROBÓ LEYENDO CÓDIGO

### src/core/types.ts
- ✅ Tipos estrictos con uniones literales para `ClaimStatus`, `ComponentStatus`, `DataClassification`
- ✅ Sin `any` implícitos
- ✅ Interfaces bien documentadas con clasificación SYNTHETIC explícita
- ✅ `Evaluation` incluye `algorithmVersion`, `ruleApplied`, `explanation` — trazabilidad correcta

### src/core/egm-lite.ts
- ✅ Motor determinista con reglas transparentes (RULE-ERR, RULE-INSUFFICIENT, RULE-CONTRADICTED, RULE-SUPPORTED, RULE-PARTIAL)
- ✅ `EvidenceGraphMemory` valida integridad referencial al cargar
- ✅ `detectContradictions` compara valores por igualdad estricta (documentado como limitación)
- ✅ `determineDecision`: solo SUPPORTED → PROCEED, resto → ABSTAIN
- ✅ Clase `EvidenceGraphMemory` con métodos `evaluate`, `checkIntegrity`
- ⚠️ **Limitación detectada:** `areValuesCompatible` usa igualdad de strings; "22.0" ≠ "22"
- ⚠️ **Limitación detectada:** No maneja ventanas temporales ni unidades diferentes
- ✅ `ALGORITHM_VERSION = 'EGM-LITE-v0.1.0'` — constante para reproducibilidad

### src/core/fixtures.ts
- ✅ Todas las fuentes marcadas `classification: 'SYNTHETIC'`
- ✅ Todas las evidencias marcadas `classification: 'SYNTHETIC'`
- ✅ Todas las claims marcadas `classification: 'SYNTHETIC'`
- ✅ 5 casos cubren las 5 reglas del motor
- ✅ `caseToClaimMap` mapea IDs de caso a IDs de claim
- ⚠️ **Sin datos personales, sin claves, sin información contractual**

### src/core/api.ts
- ✅ Funciones TypeScript que simulan endpoints HTTP (NO son HTTP real)
- ✅ `apiHealth()` reporta `persistence: 'DEMO_NO_PERSISTENT'` honestamente
- ✅ `apiEvaluateCase()` valida caso, mapea a claim, ejecuta evaluación
- ✅ Retorna `ErrorResponse` con código y detalles para errores
- ⚠️ **NO es API HTTP real** — son funciones locales llamadas directamente por la UI
- ⚠️ **NO hay persistencia** — `egmInstance` se pierde al recargar
- ✅ `apiReset()` permite reiniciar el estado (para tests)

### src/core/capabilities.ts
- ✅ 7 componentes registrados
- ✅ Solo EGM-Lite con `status: 'VERIFICADO_LOCAL'`
- ✅ Resto con `status: 'NO_IMPLEMENTADO'`
- ✅ Sin endpoints ficticios ni resultados fabricados para componentes no implementados

### Componentes React
- ✅ `Header.tsx` — Muestra estado de salud y versión de fase
- ✅ `CapabilityMatrix.tsx` — Muestra estados reales de los 7 componentes
- ✅ `CaseSelector.tsx` — Selector con resultado esperado visible
- ✅ `EvaluationPanel.tsx` — Muestra resultado, regla, explicación, procedencia
- ✅ Aviso experimental visible en `App.tsx`
- ✅ Botones deshabilitados cuando no hay selección
- ✅ Función de copiar JSON del informe

### Tests
- ✅ `tests/egm-lite.test.ts` — 15 tests escritos
- ✅ `tests/api.test.ts` — 10 tests escritos
- ⚠️ **NO ejecutados** en el entorno sandbox (vitest no se puede lanzar como proceso)
- ⚠️ Test 10 en api.test.ts usa `await import()` dinámico — puede causar problemas

---

## 2. DEPENDENCIAS INSTALADAS

### Dependencias de producción (package.json)
```
react: ^18.2.0
react-dom: ^18.2.0
react-router-dom: ^6.8.0 (NO USADA en este prototipo)
framer-motion: ^11.16.1 (NO USADA)
recharts: ^2.10.0 (NO USADA)
lucide-react: ^0.294.0 (NO USADA)
@dnd-kit/* (NO USADO)
@supabase/supabase-js: ^2.98.0 (NO CONECTADA)
canvas-confetti, date-fns, uuid (parcialmente usadas)
```

### Dependencias de desarrollo
```
typescript: ^5.7.0
vite: ^6.3.5
@vitejs/plugin-react: ^4.3.4
tailwindcss: ^4.1.7
@tailwindcss/vite: ^4.1.7
vitest: (añadida en Fase 0)
```

### Dependencias añadidas en Fase 1 (previsión)
```
express, @types/express
zod
cors, @types/cors
better-sqlite3, @types/better-sqlite3
```

### Versión de Node/npm
- No verificable directamente en sandbox
- El build de Vite funciona → Node.js compatible con ES2020+

---

## 3. REVISIÓN DE POSIBLES PROBLEMAS

### Llamadas simuladas
- `src/core/api.ts` contiene funciones que **simulan** endpoints HTTP. No son HTTP real.
- La UI llama a estas funciones directamente → **no hay red, no hay servidor**
- **Veredicto:** Correctamente documentado como `DEMO_NO_PERSISTENT` y `NONE_CONNECTED`

### Mensajes de estado engañosos
- `apiHealth()` retorna `status: 'ok'` — ¿es engañoso?
  - NO: el proceso SPA responde correctamente, las funciones están disponibles
  - Pero NO hay servidor HTTP → debería indicar limitación
- **Propuesta:** Añadir campo `runtime: 'SPA_CLIENT_ONLY'` para mayor claridad

### Manejo de errores
- `apiEvaluateCase()` retorna `ErrorResponse` con código y detalles
- `egm-lite.ts` lanza `Error` para datos inválidos (carga de evidencia con fuente inexistente)
- ✅ Manejo correcto, sin filtración de trazas

---

## 4. LISTA DE PRUEBAS EXISTENTES

### tests/egm-lite.test.ts (15 tests)
1. Fuentes concordantes → SUPPORTED
2. Fuentes contradictorias → CONTRADICTED + ABSTAIN
3. Sin evidencia → INSUFFICIENT_EVIDENCE + ABSTAIN
4. Referencia inexistente → ERROR
5. Determinismo (mismos datos → mismo resultado)
6. Integridad referencial
7. Detección de contradicciones
8. Abstención para estados no-SUPPORTED
9. Etiquetado SYNTHETIC
10. Error seguro para afirmación inexistente
11. Compatibilidad de valores determinista
12. Validación de referencias
13. Versión de algoritmo consistente
14. Verificación de integridad
15. Error al cargar evidencia con fuente inexistente

### tests/api.test.ts (10 tests)
1. Health endpoint
2. Capabilities endpoint
3. Demo cases listing
4. Evaluar caso 1
5. Evaluar caso 2
6. Evaluar caso 3
7. Evaluar caso 4
8. Caso inexistente
9. Etiquetado SYNTHETIC
10. Ausencia de mutaciones (usa `await import()` dinámico)

### Duplicaciones detectadas
- Test 1 y Test 5 de egm-lite evalúan el mismo caso (CLM-001 vs CLM-005) — correcto, verifican determinismo
- Sin duplicaciones innecesarias

### Pruebas faltantes
- Tests de integración HTTP (no hay servidor)
- Tests de persistencia (no hay persistencia)
- Tests de casos extendidos (copias derivadas, unidades, periodos)
- Tests de seguridad (CORS, rate limiting, validación)

---

## 5. INDEPENDENCIA DE FUENTES Y ÁMBITO TEMPORAL

### Revisión de fixtures
- SRC-001 y SRC-002 son fuentes independientes (diferentes IDs, diferentes timestamps)
- SRC-003 es otra fuente independiente
- SRC-004 es otra fuente independiente
- ✅ No hay duplicación de fuentes

### Identidad de hecho
- SUBJ-TEMP-MADRID + temperature_celsius → mismo hecho
- SUBJ-HUMIDITY-BARCELONA + humidity_percent → mismo hecho
- ✅ Sujetos y predicados bien definidos

### Ámbito temporal
- ⚠️ **No se maneja:** Las evidencias tienen `collectedAt` pero el motor no compara ventanas temporales
- Dos evidencias del mismo día con valores diferentes se marcan como contradicción
- Esto es correcto para Fase 0, pero debe documentarse como limitación

### Unidades
- ⚠️ **No se maneja:** Los valores son strings; "22" (°C) vs "72" (°F) no se comparan
- El motor usa igualdad estricta de strings
- Documentado en `areValuesCompatible`

---

## 6. PROPUESTA DE CAMBIOS LIMITADA

### Cambios necesarios para Fase 1
1. **Backend Express** con endpoints HTTP reales
2. **Persistencia SQLite** con migraciones versionadas
3. **Frontend actualizado** para usar `fetch` al backend
4. **Tests de integración** que levanten el servidor
5. **Casos extendidos** con unidades, periodos, copias derivadas
6. **Seguridad básica** (CORS, validación, límites)

### Matriz de compatibilidad
| Componente | Fase 0 | Fase 1 | Cambio |
|------------|--------|--------|--------|
| types.ts | ✅ | ✅ | Extender con campos de persistencia |
| egm-lite.ts | ✅ | ✅ | Reutilizar lógica, añadir storage adapter |
| fixtures.ts | ✅ | ✅ | Añadir casos extendidos |
| capabilities.ts | ✅ | ✅ | Añadir EGM-Persistent |
| api.ts | ✅ (local) | ❌ | Reemplazar por fetch HTTP |
| Componentes React | ✅ | ✅ | Añadir estado de conexión |
| Tests | ✅ (no ejecutados) | ✅ | Ejecutar + añadir integración |

---

## 7. RIESGOS IDENTIFICADOS

1. **better-sqlite3** requiere compilación nativa → puede fallar en algunos entornos
2. **Vite build** no verifica el código del servidor → necesita typecheck separado
3. **Tests de integración** requieren levantar servidor → no posible en sandbox
4. **Persistencia en Vercel** no funciona con SQLite → requiere PostgreSQL externo
5. **CORS** debe configurarse correctamente para desarrollo y producción
