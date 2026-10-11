/**
 * HAG-RAP Phase 1 — Server Entry Point
 * 
 * Starts the Express server with SQLite storage.
 * Configurable via environment variables.
 * 
 * ENVIRONMENT VARIABLES:
 * - PORT: Server port (default: 4000)
 * - DB_PATH: SQLite database path (default: ./data/hagrap.db)
 * - CORS_ORIGINS: Comma-separated allowed origins
 * - HAGRAP_DEV_TOKEN: Token required to enable seed endpoint
 * - NODE_ENV: 'development' | 'production' | 'test'
 */

import { createApp, createDependencies } from './app';
import { seedSources, seedClaims, seedEvidenceLinks } from './seed';
import { techSources, techClaims, techEvidenceLinks } from './seed-tech-domain';
import { RULE_CATALOG } from './rule-catalog';

const PORT = parseInt(process.env.PORT || '4000', 10);
const DB_PATH = process.env.DB_PATH || './data/hagrap.db';

async function main() {
  console.log('=== HAG-RAP Phase 1 — Server Starting ===');
  console.log(`Port: ${PORT}`);
  console.log(`Database: ${DB_PATH}`);
  console.log(`Node env: ${process.env.NODE_ENV || 'development'}`);

  // Initialize storage
  const deps = createDependencies(DB_PATH);
  await deps.storage.initialize();
  console.log('✓ Storage initialized (SQLite)');

  // Auto-seed synthetic data (Meteorological domain)
  console.log('Seeding synthetic data (idempotent)...');
  for (const source of seedSources) {
    await deps.storage.insertSource(source);
  }
  for (const claim of seedClaims) {
    await deps.storage.insertClaim(claim);
  }
  for (const link of seedEvidenceLinks) {
    await deps.storage.insertEvidenceLink(link);
  }
  console.log(`✓ Seeded meteorological: ${seedSources.length} sources, ${seedClaims.length} claims, ${seedEvidenceLinks.length} evidence links`);

  // Auto-seed Technical System domain data
  for (const source of techSources) {
    await deps.storage.insertSource(source);
  }
  for (const claim of techClaims) {
    await deps.storage.insertClaim(claim);
  }
  for (const link of techEvidenceLinks) {
    await deps.storage.insertEvidenceLink(link);
  }
  console.log(`✓ Seeded technical: ${techSources.length} sources, ${techClaims.length} claims, ${techEvidenceLinks.length} evidence links`);

  // Load DRE rules
  for (const rule of RULE_CATALOG) {
    await deps.storage.insertDRERule(rule);
  }
  console.log(`✓ Loaded ${RULE_CATALOG.length} DRE rules`);

  // Create and start app
  const app = createApp(deps);
  
  const server = app.listen(PORT, () => {
    console.log(`✓ Server listening on http://localhost:${PORT}`);
    console.log(`✓ API available at http://localhost:${PORT}/api/v1/`);
    console.log('');
    console.log('Endpoints (EGM):');
    console.log('  GET  /api/v1/health');
    console.log('  GET  /api/v1/capabilities');
    console.log('  GET  /api/v1/cases');
    console.log('  GET  /api/v1/cases/:id');
    console.log('  POST /api/v1/evaluations');
    console.log('  GET  /api/v1/evaluations/:id');
    console.log('  GET  /api/v1/evaluations');
    console.log('  GET  /api/v1/sources');
    console.log('  GET  /api/v1/claims');
    console.log('  GET  /api/v1/audit');
    console.log('  POST /api/v1/seed (requires x-dev-token header)');
    console.log('');
    console.log('Endpoints (DRE Phase 2.2):');
    console.log('  GET  /api/v1/dre/rules');
    console.log('  GET  /api/v1/dre/rules/:id');
    console.log('  POST /api/v1/dre/reasoning');
    console.log('  GET  /api/v1/dre/traces/:id');
    console.log('  GET  /api/v1/dre/traces');
    console.log('  GET  /api/v1/dre/hypotheses/:id');
    console.log('  GET  /api/v1/dre/domains');
    console.log('');
    console.log('All data is SYNTHETIC. No real-world data.');
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down...');
    server.close();
    await deps.storage.close();
    console.log('✓ Server stopped');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
