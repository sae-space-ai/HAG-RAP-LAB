# HAG-RAP LAB — Prototipo experimental de razonamiento gobernado

**Datos sintéticos. Sin validación TRL ni autorización para decisiones reales.**

## Estado técnico acreditado
- Phase 0: fundación y EGM-Lite
- Phase 1: Express + SQLite + EGM persistent
- Phase 2.1: DRE-Lite acotado, inferencias trazables con historial persistente
- Phase 2.2a: abducción explicativa limitada sobre dos dominios sintéticos, siempre ABSTAIN
- DRE científico general, AWE, HCP y certificación TRL: NO IMPLEMENTADO / NO ACREDITADO

La verificación de CI está documentada en GitHub Actions; no demuestra que Vercel tenga un backend operativo.

## Desarrollo local (Node 22+, npm 10+)

\`\`\`bash
npm ci
npm run typecheck
npm run typecheck:server
npm test
npm run build
\`\`\`

En **dos terminales**:

\`\`\`bash
npm run server
\`\`\`

\`\`\`bash
npm run dev
\`\`\`

Abrir http://localhost:3000; el proxy de Vite dirige \`/api/v1\` a Express en http://localhost:4000. Comprobar http://localhost:4000/api/v1/health. Los datos de demostración se guardan en \`./data/hagrap.db\`.

## Publicación web y resolución del HTTP 404

La SPA puede desplegarse como sitio estático en Vercel. **Eso no inicia Express ni mantiene SQLite.** Para que la web funcione en internet se requiere un backend Node accesible por HTTPS con almacenamiento persistente.

1. Publicar el backend Node/Express en un alojamiento con disco persistente; \`render.yaml\` contiene una **opción de Render de pago** que requiere aprobación explícita.
2. Configurar \`CORS_ORIGINS=https://SU-FRONTEND.vercel.app\` en el backend.
3. Comprobar que \`https://SU-BACKEND/api/v1/health\` responde con JSON real.
4. En Vercel, configurar variable de compilación \`VITE_API_BASE_URL=https://SU-BACKEND\`. No incluir \`/api/v1\` es válido; el cliente la añade.
5. **Reconstruir y desplegar** el frontend para que incorpore la URL.
6. Comprobar las peticiones en Network y el historial SQLite después de reiniciar el servicio.

Si no configura el backend externo, Vercel continuará mostrando el diagnóstico API 404; no es correcto presentar una respuesta simulada como un servidor activo.

Guía: [docs/WEB_DEPLOYMENT_API_404.md](docs/WEB_DEPLOYMENT_API_404.md).

## Variables

Frontend (Vercel, build-time):
- \`VITE_API_BASE_URL\`: URL pública HTTPS de Express, **no** un secreto. Vacío = mismo origen (válido detrás del proxy de desarrollo).

Backend (Node, runtime):
- \`PORT\`: puerto de Express; por defecto 4000.
- \`DB_PATH\`: fichero SQLite con disco persistente.
- \`CORS_ORIGINS\`: orígenes autorizados separados por coma, sin comodines.
- \`HAGRAP_DEV_TOKEN\`: necesario para habilitar escritura en \`/seed\`.
- \`NODE_ENV\`: production/test/development.

SQLite es experimental y no es una base multiinstancia ni una plataforma endurecida para uso público. No introducir datos personales ni sensibles.

## Contratos
- \`/api/v1/health\`, \`/api/v1/cases\`, \`/api/v1/evaluations\`
- \`/api/v1/dre/rules\`, \`/api/v1/dre/evaluate\`, \`/api/v1/dre/evaluations\`
- \`/api/v1/dre/abduction/rules\`, \`/api/v1/dre/abduction/evaluate\`, \`/api/v1/dre/abduction/runs\`

La respuesta del servidor debe ser JSON, sin falsos positivos cuando una SPA devuelve HTML con HTTP 200.
