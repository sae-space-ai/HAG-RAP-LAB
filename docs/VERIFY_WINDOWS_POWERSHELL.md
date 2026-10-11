# Guía de Verificación en Windows PowerShell

**Objetivo:** Verificar Fase 1 de HAG-RAP en entorno Windows local sin Docker, Python ni GPU.  
**Requisitos:** Node.js 22 LTS, npm, acceso a Internet para `npm ci`.

---

## PASO 1: Verificar versiones

Abra PowerShell y ejecute:

```powershell
node --version
npm --version
```

**Resultado esperado:**
- Node: `v22.x.x` (o superior)
- npm: `10.x.x` (o superior)

Si Node no está instalado, descargue desde: https://nodejs.org/ (LTS 22)

---

## PASO 2: Navegar al proyecto

```powershell
cd "C:\ruta\al\proyecto\hagrap-lab"
```

---

## PASO 3: Instalar dependencias

```powershell
npm ci
```

**Resultado esperado:** Instalación completa sin errores.  
**Tiempo estimado:** 1-3 minutos.

Si falla, verifique conexión a Internet y permisos de escritura.

---

## PASO 4: TypeCheck Frontend

```powershell
npm run typecheck
```

**Resultado esperado:** Sin errores de TypeScript. Código de salida 0.

---

## PASO 5: TypeCheck Servidor

```powershell
npm run typecheck:server
```

**Resultado esperado:** Sin errores de TypeScript. Código de salida 0.

---

## PASO 6: Build Frontend

```powershell
npm run build
```

**Resultado esperado:**
```
✓ built in X.XXs
```

Carpeta `dist/` generada con `index.html`, CSS y JS.

---

## PASO 7: Ejecutar Tests (Vitest)

```powershell
npm test
```

**Resultado esperado:**
```
✓ X tests passed
✓ X tests total
```

**Nota:** Los tests incluyen:
- 15 tests del motor EGM
- 17 tests de integración HTTP (supertest)
- 4 tests de persistencia SQLite

**Si falla:** Copie la salida completa y el código de error.

---

## PASO 8: Arrancar Servidor (Terminal 1)

Abra **una nueva ventana PowerShell** y ejecute:

```powershell
cd "C:\ruta\al\proyecto\hagrap-lab"
npm run server
```

**Resultado esperado:**
```
=== HAG-RAP Phase 1 — Server Starting ===
Port: 4000
Database: ./data/hagrap.db
✓ Storage initialized (SQLite)
✓ Seeded: 6 sources, 9 claims, 10 evidence links
✓ Server listening on http://localhost:4000
✓ API available at http://localhost:4000/api/v1/
```

**NO cierre esta ventana.** El servidor debe permanecer activo.

---

## PASO 9: Verificar API (Terminal 2)

En la **primera ventana PowerShell** (o una nueva), ejecute:

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/v1/health"
```

**Resultado esperado:**
```
status      : ok
timestamp   : 2025-XX-XXT...
version     : EGM-PERSISTENT-v1.0.0
runtime     : NODE_EXPRESS_SQLITE
dependencies : @{storage=SQLite_LOCAL; ...}
stats       : @{sources=6; claims=9; evaluations=0}
```

---

## PASO 10: Probar Evaluación HTTP

```powershell
$body = @{
    claimId = "CLM-001"
    caseId = "CASE-001"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/v1/evaluations" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Resultado esperado:**
```
evaluation : @{id=EVAL-...; verdict=SUPPORTED; decision=PROCEED; ...}
classification : SYNTHETIC
```

---

## PASO 11: Verificar Persistencia

1. **Detener servidor:** En la Terminal 1, pulse `Ctrl+C`
2. **Reiniciar servidor:**
   ```powershell
   npm run server
   ```
3. **Consultar historial:**
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:4000/api/v1/evaluations"
   ```

**Resultado esperado:** La evaluación del PASO 10 sigue presente en el historial (persistencia SQLite verificada).

---

## PASO 12: Probar Frontend (Opcional)

1. Abra **otra Terminal PowerShell**:
   ```powershell
   npm run dev
   ```
2. Abra navegador en: `http://localhost:5173`
3. Verá la interfaz HAG-RAP LAB conectada al backend.

---

## PASO 13: Detener todo

- Terminal servidor: `Ctrl+C`
- Terminal frontend: `Ctrl+C`

---

## SOLUCIÓN DE PROBLEMAS

### Error: "better-sqlite3" no compila
**Causa:** Faltan herramientas de compilación de Node.  
**Solución:**
```powershell
npm install --global windows-build-tools
```
O instale Visual Studio Build Tools desde: https://visualstudio.microsoft.com/visual-cpp-build-tools/

### Error: Puerto 4000 en uso
**Causa:** Otro proceso usa el puerto.  
**Solución:** Cambie el puerto:
```powershell
$env:PORT=4001
npm run server
```

### Error: "Cannot find module"
**Causa:** Dependencias no instaladas.  
**Solución:**
```powershell
npm ci
```

### Tests fallan con "timeout"
**Causa:** Vitest no puede crear ficheros SQLite.  
**Solución:** Verifique permisos de escritura en la carpeta del proyecto.

---

## RESUMEN DE COMANDOS

| Paso | Comando | Descripción |
|------|---------|-------------|
| 1 | `node --version` | Verificar Node 22+ |
| 3 | `npm ci` | Instalar dependencias |
| 4 | `npm run typecheck` | TypeCheck frontend |
| 5 | `npm run typecheck:server` | TypeCheck servidor |
| 6 | `npm run build` | Build frontend |
| 7 | `npm test` | Ejecutar 36 tests |
| 8 | `npm run server` | Arrancar backend (Terminal 1) |
| 9 | `Invoke-RestMethod ...` | Verificar API (Terminal 2) |
| 10 | `Invoke-RestMethod ... POST` | Probar evaluación |
| 11 | Reiniciar servidor | Verificar persistencia |
| 12 | `npm run dev` | Frontend (opcional) |

---

## CRITERIOS DE ÉXITO

✅ Todos los comandos ejecutados sin errores  
✅ 36 tests PASS  
✅ Servidor responde en `http://localhost:4000/api/v1/health`  
✅ Evaluación HTTP devuelve `verdict: SUPPORTED` o `CONTRADICTED`  
✅ Persistencia verificada tras reinicio del servidor  
✅ Frontend (si se prueba) muestra "Conectado al servidor"

---

## SI ALGO FALLA

1. **Copie la salida completa** del comando que falló
2. **Anote el código de error** (si lo hay)
3. **No continúe** con los siguientes pasos
4. **Informe** con:
   - Versión de Node y npm
   - Sistema operativo (Windows 10/11)
   - Comando ejecutado
   - Salida completa
   - Código de salida

---

**NOTA:** Esta guía NO requiere Python, Docker, Git CLI ni GPU. Solo Node.js 22 LTS y npm.
