# HAG-RAP LAB — Web deployment / API 404 incident

## Verified root cause (source inspection)
The Vite frontend requests \`/api/v1/health\` by default. On a static frontend host, that endpoint does not exist unless a separately deployed backend or reverse proxy handles it. Express runs as a standalone Node process and requires persistent SQLite storage. GitHub Actions verifies it inside a short-lived runner, **not** on the user-facing host.

The screenshot's HTTP 404 signals an absent API route at the queried origin; it does **not** prove that the Express implementation is defective. The old "FASE 1" header was hardcoded and is now updated.

## Local development (no cloud service required)
1. Install Node 22+, run \`npm ci\`.
2. Terminal A: \`npm run server\` (Node/Express on localhost:4000, persistent SQLite in ./data).
3. Terminal B: \`npm run dev\` (Vite on localhost:3000).
4. Open http://localhost:3000. The Vite development proxy forwards /api/v1 to http://127.0.0.1:4000.
5. Verify http://localhost:4000/api/v1/health in your browser or with curl. The browser UI will switch to connected status when the proxy can reach Express.

Do **not** expect the production Vercel build to run Express, or expect SQLite persisted on serverless ephemeral storage.

## Recommended two-service deployment
- Frontend: Vercel, framework Vite, output dist, public access without login.
- Backend: Node.js hosting with a persistent mounted disk (e.g. a long-running Render instance with a persistent disk). There is an OPTIONAL \`render.yaml\` blueprint.
- WARNING: persistent disk instances can incur charges. Review and approve costs before creating services. This repository does not create or purchase services automatically.
- Backend must be HTTPS and return JSON at \`https://YOUR-BACKEND/api/v1/health\`.
- Set \`CORS_ORIGINS=https://YOUR-FRONTEND.vercel.app\` in the backend runtime (comma-separated exact scheme+origin for additional trusted domains; NO wildcards).
- Set Vercel **build-time** environment variable \`VITE_API_BASE_URL=https://YOUR-BACKEND\` for Production (and Preview if needed). Do not include secret tokens in VITE_* variables.
- Redeploy/rebuild the frontend after setting the build-time variable. Merely updating a setting without rebuilding will not update existing JS bundles.
- Open the frontend; verify connected status and compare /health, /cases and /dre/abduction/rules to the live backend.
- Use the browser developer tools Network tab to inspect whether /api/v1/health targets the Vercel domain (missing configuration) or the real backend origin.

## Operational and security boundaries
- SQLite on a persistent disk is a controlled *single-process demonstration*, not a general-purpose production multiinstance database. Avoid parallel server replicas sharing the same file.
- This prototype has multiple public read and POST evaluation endpoints. Do not store personal or sensitive data, and do not expose the service to uncontrolled traffic without appropriate authentication, quotas and abuse protection.
- \`/seed\` is guarded by \`HAGRAP_DEV_TOKEN\`; other experimental evaluations are not a hardened public product.
- Source independence is an assumption of the synthetic fixtures. No real-world causal reasoning, production readiness or TRL-4 certification is claimed.

## Failure diagnostics
- **HTTP 404**: backend route is not deployed at the requested origin; commonly a static-only frontend or wrong API_BASE.
- **HTTP 200 but HTML**: SPA fallback returned index.html instead of an API JSON response; still a missing backend.
- **Network error / CORS**: wrong backend hostname, HTTPS misconfiguration, offline service or mismatch in \`CORS_ORIGINS\`.
- **HTTP 5xx**: backend responded but had an internal startup/database/runtime error; inspect backend logs.
- **HTTP 200 valid JSON**: verify response includes genuine health keys and that other endpoints work. A successful isolated health check is not a full acceptance test.

## Acceptance gate
1. \`npm run typecheck\`, \`npm run typecheck:server\`, \`npm run build\`, \`npm test\` PASS on GitHub Actions.
2. Local integrated server health and SQLite restart tests PASS (existing CI).
3. On the real public URL, browser Network confirms HTTPS API returns JSON from an operational backend. **Until observed, deployment state is NOT VERIFIED.**
