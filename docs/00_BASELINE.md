# 00_BASELINE.md — Estado Inicial del Repositorio

**Fecha:** 2025-01-15  
**Proyecto:** HAG-RAP — Fase 0  
**Autor:** Prototipo científico veraz

---

## 1. ESTADO INICIAL DEL REPOSITORIO

### Framework y Stack Detectado
- **Runtime:** Node.js (entorno de ejecución Vite)
- **Framework de build:** Vite 6.3.5
- **Lenguaje:** TypeScript 5.7.0
- **UI:** React 18.2.0
- **Estilos:** Tailwind CSS 4.1.7 (vía plugin @tailwindcss/vite)
- **Tipo de aplicación:** SPA (Single Page Application)
- **NO es Next.js** — el repositorio original usa Vite, no Next.js

### Archivos Originales Encontrados
```
index.html          — HTML base con tema inline (chino, tema light/dark)
package.json        — Dependencias y scripts
package-lock.json   — Lockfile
tsconfig.json       — Configuración TypeScript (strict mode)
vite.config.js      — Configuración Vite (puerto 3000, HMR)
src/App.tsx         — Componente raíz (sin lógica previa)
src/main.tsx        — Punto de entrada React
src/index.css       — Import de Tailwind CSS
```

### Dependencias Preexistentes
- react, react-dom (UI)
- react-router-dom (routing)
- framer-motion (animaciones)
- recharts (gráficos)
- lucide-react (iconos)
- @dnd-kit/* (drag & drop)
- @supabase/supabase-js (NO USADO en este prototipo)
- canvas-confetti, date-fns, uuid (utilidades)
- tailwindcss, @vitejs/plugin-react (build)

### Dependencias Añadidas
- vitest (testing framework)

### Comandos Disponibles
- `npm run dev` — Servidor de desarrollo Vite
- `npm run build` — Build de producción
- `npm run typecheck` — Verificación de tipos TypeScript
- `npx vitest run` — Ejecutar tests unitarios

### Control de Versiones
- No se detecta directorio .git en el entorno de sandbox
- El estado Git no puede verificarse automáticamente
- Se documenta la versión del código mediante ALGORITHM_VERSION en el motor

### Riesgos Identificados
1. **No es Next.js:** La arquitectura solicitada menciona Next.js con App Router, pero el repositorio usa Vite SPA. Se adapta la arquitectura manteniendo la separación de lógica/UI.
2. **Sin persistencia real:** No hay base de datos conectada. Todo es in-memory.
3. **Sin CI/CD:** No hay GitHub Actions configurado en este entorno.
4. **Sin servidor real:** Los "endpoints API" son funciones TypeScript llamadas directamente por la UI.

---

## 2. DECISIONES DE CONSERVACIÓN

### Se conserva:
- `vite.config.js` — Configuración de build funcional
- `tsconfig.json` — Strict mode TypeScript
- `src/index.css` — Import de Tailwind
- `src/main.tsx` — Punto de entrada React
- Dependencias preexistentes en package.json (no se eliminan)

### Se modifica:
- `index.html` — Título y lang actualizados a español
- `src/App.tsx` — Reemplazado completamente con la interfaz HAG-RAP

### Se añade:
- `src/core/` — Lógica científica aislada
- `src/components/` — Componentes de UI
- `tests/` — Tests unitarios
- `docs/` — Documentación del proyecto
- `vitest.config.ts` — Configuración de tests
