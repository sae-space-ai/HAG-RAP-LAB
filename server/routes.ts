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
import { evaluationInputSchema, seedPayloadSchema, dreInputSchema } from './schemas';
import { DRELite, DRE_RULES, DRE_VERSION, verifyDRETrace, type DREResult } from './dre';
import { AbductionEngine, listAbductionRules, verifyAbductionResult, type AbductionResult } from './abduction';
import { abductionInputSchema } from './schemas';
import { seedSources, seedClaims, seedEvidenceLinks, seedScenarios } from './seed';
import { ALGORITHM_VERSION } from './engine';

export function createRouter(engine: EGMEngine, storage: StorageAdapter): Router {
  const router = Router();
  const dre = new DRELite(storage, engine);
  const abduction = new AbductionEngine(storage, engine);

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
          coreLogic: 'VERIFIED_IN_CI',
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
        status: 'VERIFIED_IN_CI',
        description: 'Motor de evaluación con persistencia SQLite, procedencia y auditoría.',
        workPackage: 'WP3',
        testReference: 'tests/integration/',
      },
      { id: 'DRE', name: 'DRE-Lite', fullName: 'Bounded Evidence-Based Rule Inference', status: 'VERIFIED_IN_CI', description: 'Dos pasos de reglas sintéticas; no es razonamiento causal ni motor cognitivo general.', workPackage: 'WP3', testReference: 'tests/dre-lite.test.ts' },
      { id: 'AWE', name: 'AWE', fullName: 'Abstraction and World-Model Engine', status: 'NO_IMPLEMENTADO', description: 'Motor de abstracción. No implementado.', workPackage: 'WP4', testReference: null },
      { id: 'HCP', name: 'HCP', fullName: 'Hierarchical Contingent Planner', status: 'NO_IMPLEMENTADO', description: 'Planificador jerárquico. No implementado.', workPackage: 'WP5', testReference: null },
      { id: 'TAL', name: 'TAL', fullName: 'Trust and Assurance Layer', status: 'NO_IMPLEMENTADO', description: 'Capa de confianza. No implementado.', workPackage: 'WP6', testReference: null },
      { id: 'HGI', name: 'HGI', fullName: 'Human Governance Interface', status: 'NO_IMPLEMENTADO', description: 'Interfaz de gobernanza. UI demo de solo lectura.', workPackage: 'WP6', testReference: null },
      { id: 'RAEC', name: 'RAEC', fullName: 'Resource-Aware Execution Controller', status: 'NO_IMPLEMENTADO', description: 'Controlador de recursos. No implementado.', workPackage: 'WP1', testReference: null },
    ];

    res.json({
      components: capabilities,
      totalImplemented: 2,
      totalNotImplemented: 5,
      generatedAt: new Date().toISOString(),
    });
  });

  // === PHASE 2: bounded deterministic DRE-Lite ===
  router.get('/dre/rules', (_req: Request, res: Response) => {
    res.json({
      version: DRE_VERSION,
      classification: 'SYNTHETIC',
      rules: DRE_RULES,
      maxSteps: 2,
      causalInference: false,
      persistentDRETrace: true,
      externalActions: false,
    });
  });

  router.post('/dre/evaluate', async (req: Request, res: Response) => {
    const parsed = dreInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        code: 'DRE_INVALID_INPUT',
        message: 'Hipótesis inválida para el demostrador de reglas sintéticas.',
        details: parsed.error.issues,
      });
    }
    try {
      const result = await dre.evaluate(parsed.data);
      return res.status(201).json({ result, classification: 'SYNTHETIC' });
    } catch (error) {
      console.error('DRE-Lite error:', error);
      return res.status(500).json({
        code: 'DRE_EVALUATION_ERROR',
        message: 'No se pudo completar la inferencia experimental.',
      });
    }
  });

  router.get('/dre/evaluations', async (_req: Request, res: Response) => {
    try {
      const records = await storage.listDRETraces(50);
      return res.json({
        evaluations: records.map(r => ({
          id: r.id, claimId: r.claim_id, verdict: r.verdict,
          decision: r.decision, traceHash: r.trace_hash,
          createdAt: r.created_at,
        })),
        count: records.length,
        classification: 'SYNTHETIC',
      });
    } catch {
      return res.status(500).json({ code: 'DRE_HISTORY_ERROR', message: 'No se pudo recuperar el historial DRE.' });
    }
  });

  router.get('/dre/evaluations/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      if (typeof id !== 'string' || !/^DRE-EVAL-[A-Z0-9]+$/.test(id)) {
        return res.status(400).json({ code: 'DRE_INVALID_ID', message: 'Identificador DRE incorrecto.' });
      }
      const record = await storage.getDRETrace(id);
      if (!record) return res.status(404).json({ code: 'DRE_NOT_FOUND', message: 'Traza no encontrada.' });
      const result: DREResult = JSON.parse(record.full_result_json);
      const integrityValid = verifyDRETrace(result)
        && result.id === record.id && result.egm.evaluationId === record.egm_evaluation_id
        && result.inputHash === record.input_hash && result.traceHash === record.trace_hash;
      if (!integrityValid) return res.status(409).json({
        code: 'DRE_INTEGRITY_ERROR',
        message: 'La traza almacenada no supera la verificación de integridad.',
      });
      return res.json({ result, integrityValid, classification: 'SYNTHETIC' });
    } catch {
      return res.status(500).json({ code: 'DRE_READ_ERROR', message: 'Error al recuperar la traza.' });
    }
  });

  // === Experimental Phase 2.2a: evidence-gated abduction ===
  router.get('/dre/abduction/rules', (_req: Request, res: Response) => {
    res.json({rules:listAbductionRules(),classification:'SYNTHETIC',
      scope:'BOUNDED_RULE_BASED_EXPLANATIONS',causalProof:false,calibratedProbability:false});
  });

  router.post('/dre/abduction/evaluate', async (req: Request,res: Response) => {
    const parsed=abductionInputSchema.safeParse(req.body);
    if(!parsed.success)return res.status(400).json({
      code:'ABD_INVALID_INPUT',message:'Entrada de abducción inválida.',details:parsed.error.issues
    });
    try {
      const result=await abduction.evaluate(parsed.data);
      return res.status(201).json({result,classification:'SYNTHETIC'});
    } catch(error) {
      console.error('Abduction failure:',error);
      return res.status(500).json({code:'ABD_EVALUATION_FAILED',message:'Error interno en la evaluación sintética.'});
    }
  });

  router.get('/dre/abduction/runs',async (_req: Request,res: Response)=>{
    try {
      const rows=await storage.listAbductionRuns(30);
      return res.json({runs:rows.map(r=>({id:r.id,createdAt:r.created_at,hash:r.result_hash})),
        count:rows.length,classification:'SYNTHETIC'});
    } catch {
      return res.status(500).json({code:'ABD_HISTORY_FAILED',message:'Error al listar ejecuciones.'});
    }
  });

  router.get('/dre/abduction/runs/:id',async (req: Request,res: Response)=>{
    const id=req.params.id;
    if(typeof id!=='string'||!/^ABD-RUN-[0-9A-F]{16}$/.test(id))
      return res.status(400).json({code:'ABD_BAD_ID',message:'ID inválido.'});
    try {
      const row=await storage.getAbductionRun(id);
      if(!row)return res.status(404).json({code:'ABD_NOT_FOUND',message:'Ejecución inexistente.'});
      const result:AbductionResult=JSON.parse(row.full_result_json);
      const valid=verifyAbductionResult(result)&&row.id===result.id
        && row.result_hash===result.contentHash&&row.egm_evaluation_id===result.egmEvaluationId;
      if(!valid)return res.status(409).json({code:'ABD_INTEGRITY_ERROR',message:'No coincide la integridad de la traza.'});
      return res.json({result,integrityValid:true,classification:'SYNTHETIC'});
    } catch {
      return res.status(500).json({code:'ABD_READ_FAILED',message:'Error al consultar ejecución.'});
    }
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
