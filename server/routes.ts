/**
 * HAG-RAP Phase 1 — API Routes
 * 
 * All routes under /api/v1/
 * Returns uniform error format. No stack traces or secrets exposed.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import type { EGMEngine } from './engine';
import type { StorageAdapter } from './storage';
import { evaluationInputSchema, seedPayloadSchema } from './schemas';
import { seedSources, seedClaims, seedEvidenceLinks, seedScenarios } from './seed';
import { ALGORITHM_VERSION } from './engine';

export function createRouter(engine: EGMEngine, storage: StorageAdapter): Router {
  const router = Router();

  // === GET /api/v1/health ===
  router.get('/health', async (_req: Request, res: Response) => {
    try {
      const sources = await storage.getAllSources();
      const claims = await storage.getAllClaims();
      const evaluations = await storage.getAllEvaluations();
      
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: ALGORITHM_VERSION,
        runtime: 'NODE_EXPRESS_SQLITE',
        dependencies: {
          storage: 'SQLite_LOCAL',
          coreLogic: 'IMPLEMENTED_UNVERIFIED',
          externalServices: 'NONE_CONNECTED',
        },
        stats: {
          sources: sources.length,
          claims: claims.length,
          evaluations: evaluations.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        code: 'HEALTH_CHECK_FAILED',
        message: 'No se pudo verificar el estado del sistema.',
      });
    }
  });

  // === GET /api/v1/capabilities ===
  router.get('/capabilities', (_req: Request, res: Response) => {
    const capabilities = [
      {
        id: 'EGM',
        name: 'EGM-Persistent',
        fullName: 'Evidence Graph Memory (Persistent)',
        status: 'IMPLEMENTED_UNVERIFIED',
        description: 'Motor de evaluación con persistencia SQLite, procedencia y auditoría.',
        workPackage: 'WP3',
        testReference: 'tests/integration/',
      },
      { id: 'DRE', name: 'DRE', fullName: 'Deep Reasoning Engine', status: 'NO_IMPLEMENTADO', description: 'Motor de razonamiento profundo. No implementado.', workPackage: 'WP3', testReference: null },
      { id: 'AWE', name: 'AWE', fullName: 'Abstraction and World-Model Engine', status: 'NO_IMPLEMENTADO', description: 'Motor de abstracción. No implementado.', workPackage: 'WP4', testReference: null },
      { id: 'HCP', name: 'HCP', fullName: 'Hierarchical Contingent Planner', status: 'NO_IMPLEMENTADO', description: 'Planificador jerárquico. No implementado.', workPackage: 'WP5', testReference: null },
      { id: 'TAL', name: 'TAL', fullName: 'Trust and Assurance Layer', status: 'NO_IMPLEMENTADO', description: 'Capa de confianza. No implementado.', workPackage: 'WP6', testReference: null },
      { id: 'HGI', name: 'HGI', fullName: 'Human Governance Interface', status: 'NO_IMPLEMENTADO', description: 'Interfaz de gobernanza. UI demo de solo lectura.', workPackage: 'WP6', testReference: null },
      { id: 'RAEC', name: 'RAEC', fullName: 'Resource-Aware Execution Controller', status: 'NO_IMPLEMENTADO', description: 'Controlador de recursos. No implementado.', workPackage: 'WP1', testReference: null },
    ];

    res.json({
      components: capabilities,
      totalImplemented: 1,
      totalNotImplemented: 6,
      generatedAt: new Date().toISOString(),
    });
  });

  // === GET /api/v1/cases ===
  router.get('/cases', (_req: Request, res: Response) => {
    res.json({
      cases: seedScenarios,
      classification: 'SYNTHETIC',
      count: seedScenarios.length,
    });
  });

  // === GET /api/v1/cases/:id ===
  router.get('/cases/:id', async (req: Request, res: Response) => {
    const scenario = seedScenarios.find(s => s.id === req.params.id);
    if (!scenario) {
      return res.status(404).json({
        error: 'Case not found',
        code: 'CASE_NOT_FOUND',
        message: `El caso "${req.params.id}" no existe.`,
      });
    }

    const claim = await storage.getClaim(scenario.claimId);
    if (!claim) {
      return res.status(404).json({
        error: 'Claim not found for case',
        code: 'CLAIM_NOT_FOUND',
        message: `La afirmación asociada al caso no existe.`,
      });
    }

    const evidenceLinks = await storage.getEvidenceLinksForClaim(claim.id);
    const sources = [];
    for (const link of evidenceLinks) {
      const source = await storage.getSource(link.source_id);
      if (source) sources.push(source);
    }

    res.json({
      case: scenario,
      claim,
      evidenceLinks,
      sources,
      classification: 'SYNTHETIC',
    });
  });

  // === POST /api/v1/evaluations ===
  router.post('/evaluations', async (req: Request, res: Response) => {
    try {
      const parsed = evaluationInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation error',
          code: 'INVALID_INPUT',
          message: 'Los datos de entrada no son válidos.',
          details: parsed.error.issues,
        });
      }

      const result = await engine.evaluate(parsed.data);
      
      res.status(201).json({
        evaluation: result,
        classification: 'SYNTHETIC',
      });
    } catch (error) {
      console.error('Evaluation error:', error);
      res.status(500).json({
        error: 'Evaluation failed',
        code: 'EVALUATION_ERROR',
        message: 'Error interno durante la evaluación.',
      });
    }
  });

  // === GET /api/v1/evaluations/:id ===
  router.get('/evaluations/:id', async (req: Request, res: Response) => {
    try {
      const evaluationId = req.params.id;
      if (typeof evaluationId !== 'string') {
        return res.status(400).json({ error: 'Invalid ID', code: 'INVALID_ID' });
      }
      const evaluation = await storage.getEvaluation(evaluationId);
      if (!evaluation) {
        return res.status(404).json({
          error: 'Evaluation not found',
          code: 'EVALUATION_NOT_FOUND',
          message: `La evaluación "${req.params.id}" no existe.`,
        });
      }

      const fullResult = JSON.parse(evaluation.full_result_json);
      res.json({
        evaluation: fullResult,
        storedAt: evaluation.created_at,
        classification: 'SYNTHETIC',
      });
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        code: 'FETCH_EVALUATION_FAILED',
        message: 'Error al recuperar la evaluación.',
      });
    }
  });

  // === GET /api/v1/evaluations ===
  router.get('/evaluations', async (_req: Request, res: Response) => {
    try {
      const evaluations = await storage.getAllEvaluations();
      const parsed = evaluations.map(e => ({
        id: e.id,
        caseId: e.case_id,
        verdict: e.verdict,
        decision: e.decision,
        appliedRule: e.applied_rule,
        createdAt: e.created_at,
      }));
      res.json({ evaluations: parsed, count: parsed.length });
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        code: 'LIST_EVALUATIONS_FAILED',
        message: 'Error al listar evaluaciones.',
      });
    }
  });

  // === POST /api/v1/seed (restricted — dev auth required) ===
  router.post('/seed', async (req: Request, res: Response) => {
    // Check dev auth token
    const devToken = process.env.HAGRAP_DEV_TOKEN;
    const providedToken = req.headers['x-dev-token'];
    
    if (!devToken || providedToken !== devToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        code: 'INVALID_DEV_TOKEN',
        message: 'Token de desarrollo no válido.',
      });
    }

    try {
      // Idempotent seed: INSERT OR IGNORE prevents duplicates
      for (const source of seedSources) {
        await storage.insertSource(source);
      }
      for (const claim of seedClaims) {
        await storage.insertClaim(claim);
      }
      for (const link of seedEvidenceLinks) {
        await storage.insertEvidenceLink(link);
      }

      res.json({
        status: 'seeded',
        sources: seedSources.length,
        claims: seedClaims.length,
        evidenceLinks: seedEvidenceLinks.length,
        idempotent: true,
        message: 'Datos sintéticos cargados. Operación idempotente.',
      });
    } catch (error) {
      res.status(500).json({
        error: 'Seed failed',
        code: 'SEED_ERROR',
        message: 'Error al cargar datos sintéticos.',
      });
    }
  });

  // === GET /api/v1/sources ===
  router.get('/sources', async (_req: Request, res: Response) => {
    const sources = await storage.getAllSources();
    res.json({ sources, classification: 'SYNTHETIC' });
  });

  // === GET /api/v1/claims ===
  router.get('/claims', async (_req: Request, res: Response) => {
    const claims = await storage.getAllClaims();
    res.json({ claims, classification: 'SYNTHETIC' });
  });

  // === GET /api/v1/audit ===
  router.get('/audit', async (_req: Request, res: Response) => {
    const chainVerification = await storage.verifyAuditChain();
    const events = await storage.getAuditEvents();
    res.json({
      events,
      chainValid: chainVerification.valid,
      chainErrors: chainVerification.errors,
    });
  });

  return router;
}
