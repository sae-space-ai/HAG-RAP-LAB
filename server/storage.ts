/**
 * HAG-RAP Phase 1 — Storage Adapter & SQLite Implementation
 * 
 * Provides persistent storage for the Evidence Graph Memory.
 * Uses better-sqlite3 for local SQLite database.
 * 
 * IMPORTANT:
 * - SQLite is NOT suitable for Vercel serverless deployments
 * - For production, a managed PostgreSQL would be required
 * - All data in this prototype is SYNTHETIC
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// === STORAGE ADAPTER INTERFACE ===
// Designed for future PostgreSQL migration without changing business logic

export interface StorageAdapter {
  initialize(): Promise<void>;
  close(): Promise<void>;
  
  // Sources
  insertSource(source: StoredSource): Promise<void>;
  getSource(id: string): Promise<StoredSource | null>;
  getAllSources(): Promise<StoredSource[]>;
  
  // Claims
  insertClaim(claim: StoredClaim): Promise<void>;
  getClaim(id: string): Promise<StoredClaim | null>;
  getAllClaims(): Promise<StoredClaim[]>;
  
  // Evidence Links
  insertEvidenceLink(link: StoredEvidenceLink): Promise<void>;
  getEvidenceLinksForClaim(claimId: string): Promise<StoredEvidenceLink[]>;
  getEvidenceLink(id: string): Promise<StoredEvidenceLink | null>;
  
  // Evaluations
  insertEvaluation(evaluation: StoredEvaluation): Promise<string>;
  getEvaluation(id: string): Promise<StoredEvaluation | null>;
  getAllEvaluations(): Promise<StoredEvaluation[]>;
  
  // Audit Events
  insertAuditEvent(event: StoredAuditEvent): Promise<void>;
  getAuditEvents(): Promise<StoredAuditEvent[]>;
  
  // Phase 2.2: DRE
  insertDRERule(rule: any): Promise<void>;
  getDRERule(id: string): Promise<any | null>;
  getAllDRERules(): Promise<any[]>;
  getDRERulesByDomain(domain: string): Promise<any[]>;
  
  insertDREHypothesis(hypothesis: any): Promise<void>;
  getDREHypothesis(id: string): Promise<any | null>;
  getDREHypothesesByExecution(executionId: string): Promise<any[]>;
  
  insertDRETrace(trace: any): Promise<void>;
  getDRETrace(id: string): Promise<any | null>;
  getAllDRETraces(): Promise<any[]>;
  getDRETracesByDomain(domain: string): Promise<any[]>;
  
  // Integrity
  verifyAuditChain(): Promise<{ valid: boolean; errors: string[] }>;
}

// === STORED TYPES ===

export interface StoredSource {
  id: string;
  title: string;
  source_type: string;
  origin_uri: string | null;
  obtained_at: string;
  reliability_metadata: string | null;
  synthetic: boolean;
  created_at: string;
}

export interface StoredClaim {
  id: string;
  subject: string;
  predicate: string;
  object_value: string; // JSON stringified structured value
  unit: string | null;
  valid_from: string | null;
  valid_to: string | null;
  source_id: string;
  status: string;
  revision: number;
  synthetic: boolean;
  created_at: string;
}

export interface StoredEvidenceLink {
  id: string;
  claim_id: string;
  source_id: string;
  transformation: string;
  extracted_at: string;
  provenance_hash: string;
}

export interface StoredEvaluation {
  id: string;
  case_id: string | null;
  algorithm_version: string;
  verdict: string;
  decision: string;
  applied_rule: string;
  inputs_hash: string;
  created_at: string;
  full_result_json: string;
}

export interface StoredAuditEvent {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  actor_identifier: string;
  previous_hash: string | null;
  event_hash: string;
  occurred_at: string;
}

// === MIGRATIONS ===

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'synthetic',
    origin_uri TEXT,
    obtained_at TEXT NOT NULL,
    reliability_metadata TEXT,
    synthetic INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS claims (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    predicate TEXT NOT NULL,
    object_value TEXT NOT NULL,
    unit TEXT,
    valid_from TEXT,
    valid_to TEXT,
    source_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    revision INTEGER NOT NULL DEFAULT 1,
    synthetic INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    FOREIGN KEY (source_id) REFERENCES sources(id)
  )`,
  `CREATE TABLE IF NOT EXISTS evidence_links (
    id TEXT PRIMARY KEY,
    claim_id TEXT NOT NULL,
    source_id TEXT NOT NULL,
    transformation TEXT NOT NULL DEFAULT 'none',
    extracted_at TEXT NOT NULL,
    provenance_hash TEXT NOT NULL,
    FOREIGN KEY (claim_id) REFERENCES claims(id),
    FOREIGN KEY (source_id) REFERENCES sources(id)
  )`,
  `CREATE TABLE IF NOT EXISTS evaluations (
    id TEXT PRIMARY KEY,
    case_id TEXT,
    algorithm_version TEXT NOT NULL,
    verdict TEXT NOT NULL,
    decision TEXT NOT NULL,
    applied_rule TEXT NOT NULL,
    inputs_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    full_result_json TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    actor_identifier TEXT NOT NULL DEFAULT 'system',
    previous_hash TEXT,
    event_hash TEXT NOT NULL,
    occurred_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_claims_subject ON claims(subject, predicate)`,
  `CREATE INDEX IF NOT EXISTS idx_evidence_claim ON evidence_links(claim_id)`,
  `CREATE INDEX IF NOT EXISTS idx_evaluations_case ON evaluations(case_id)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_occurred ON audit_events(occurred_at)`,
  // Phase 2.2: DRE tables
  `CREATE TABLE IF NOT EXISTS dre_rules (
    id TEXT PRIMARY KEY,
    version TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    domain TEXT NOT NULL,
    premises_json TEXT NOT NULL,
    conditions_json TEXT NOT NULL,
    conclusion_json TEXT NOT NULL,
    limitations_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    rule_hash TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS dre_hypotheses (
    id TEXT PRIMARY KEY,
    execution_id TEXT NOT NULL,
    observation TEXT NOT NULL,
    rule_id TEXT NOT NULL,
    rule_version TEXT NOT NULL,
    premises_json TEXT NOT NULL,
    evidences_json TEXT NOT NULL,
    predictions_json TEXT NOT NULL,
    unmet_constraints_json TEXT NOT NULL,
    required_observations_json TEXT NOT NULL,
    state TEXT NOT NULL,
    explanation TEXT NOT NULL,
    created_at TEXT NOT NULL,
    hypothesis_hash TEXT NOT NULL,
    FOREIGN KEY (execution_id) REFERENCES dre_traces(id)
  )`,
  `CREATE TABLE IF NOT EXISTS dre_traces (
    id TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    initial_observation TEXT NOT NULL,
    steps_json TEXT NOT NULL,
    hypotheses_generated_json TEXT NOT NULL,
    hypotheses_retained_json TEXT NOT NULL,
    hypotheses_refuted_json TEXT NOT NULL,
    final_decision TEXT NOT NULL,
    abstention_reason TEXT,
    execution_limits_json TEXT NOT NULL,
    limits_reached_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    trace_hash TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_dre_rules_domain ON dre_rules(domain)`,
  `CREATE INDEX IF NOT EXISTS idx_dre_hypotheses_execution ON dre_hypotheses(execution_id)`,
  `CREATE INDEX IF NOT EXISTS idx_dre_traces_domain ON dre_traces(domain)`,
];

// === HASH UTILITIES ===

export function computeHash(data: string): string {
  // Simple hash for provenance — NOT cryptographic security
  // Used for detecting accidental changes, not for digital signatures
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export function computeProvenanceHash(sourceId: string, claimId: string, transformation: string): string {
  return computeHash(`${sourceId}:${claimId}:${transformation}`);
}

export function computeInputsHash(data: Record<string, unknown>): string {
  const sorted = JSON.stringify(data, Object.keys(data).sort());
  return computeHash(sorted);
}

export function computeEventHash(event: Omit<StoredAuditEvent, 'event_hash'>): string {
  const payload = `${event.id}:${event.action}:${event.entity_type}:${event.entity_id}:${event.previous_hash}:${event.occurred_at}`;
  return computeHash(payload);
}

// === SQLITE IMPLEMENTATION ===

export class SQLiteStorageAdapter implements StorageAdapter {
  private db: Database.Database;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), 'data', 'hagrap.db');
    
    // Ensure data directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  async initialize(): Promise<void> {
    for (const migration of MIGRATIONS) {
      this.db.exec(migration);
    }
  }

  async close(): Promise<void> {
    this.db.close();
  }

  // === SOURCES ===

  async insertSource(source: StoredSource): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO sources (id, title, source_type, origin_uri, obtained_at, reliability_metadata, synthetic, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      source.id, source.title, source.source_type, source.origin_uri,
      source.obtained_at, source.reliability_metadata, source.synthetic ? 1 : 0,
      source.created_at
    );
  }

  async getSource(id: string): Promise<StoredSource | null> {
    const stmt = this.db.prepare('SELECT * FROM sources WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return { ...row, synthetic: row.synthetic === 1 };
  }

  async getAllSources(): Promise<StoredSource[]> {
    const stmt = this.db.prepare('SELECT * FROM sources ORDER BY created_at');
    const rows = stmt.all() as any[];
    return rows.map(r => ({ ...r, synthetic: r.synthetic === 1 }));
  }

  // === CLAIMS ===

  async insertClaim(claim: StoredClaim): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO claims (id, subject, predicate, object_value, unit, valid_from, valid_to, source_id, status, revision, synthetic, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      claim.id, claim.subject, claim.predicate, claim.object_value,
      claim.unit, claim.valid_from, claim.valid_to, claim.source_id,
      claim.status, claim.revision, claim.synthetic ? 1 : 0, claim.created_at
    );
  }

  async getClaim(id: string): Promise<StoredClaim | null> {
    const stmt = this.db.prepare('SELECT * FROM claims WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return { ...row, synthetic: row.synthetic === 1 };
  }

  async getAllClaims(): Promise<StoredClaim[]> {
    const stmt = this.db.prepare('SELECT * FROM claims ORDER BY created_at');
    const rows = stmt.all() as any[];
    return rows.map(r => ({ ...r, synthetic: r.synthetic === 1 }));
  }

  // === EVIDENCE LINKS ===

  async insertEvidenceLink(link: StoredEvidenceLink): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO evidence_links (id, claim_id, source_id, transformation, extracted_at, provenance_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(link.id, link.claim_id, link.source_id, link.transformation, link.extracted_at, link.provenance_hash);
  }

  async getEvidenceLinksForClaim(claimId: string): Promise<StoredEvidenceLink[]> {
    const stmt = this.db.prepare('SELECT * FROM evidence_links WHERE claim_id = ?');
    return stmt.all(claimId) as StoredEvidenceLink[];
  }

  async getEvidenceLink(id: string): Promise<StoredEvidenceLink | null> {
    const stmt = this.db.prepare('SELECT * FROM evidence_links WHERE id = ?');
    const row = stmt.get(id) as StoredEvidenceLink | undefined;
    return row || null;
  }

  // === EVALUATIONS ===

  async insertEvaluation(evaluation: StoredEvaluation): Promise<string> {
    const stmt = this.db.prepare(`
      INSERT INTO evaluations (id, case_id, algorithm_version, verdict, decision, applied_rule, inputs_hash, created_at, full_result_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      evaluation.id, evaluation.case_id, evaluation.algorithm_version,
      evaluation.verdict, evaluation.decision, evaluation.applied_rule,
      evaluation.inputs_hash, evaluation.created_at, evaluation.full_result_json
    );
    return evaluation.id;
  }

  async getEvaluation(id: string): Promise<StoredEvaluation | null> {
    const stmt = this.db.prepare('SELECT * FROM evaluations WHERE id = ?');
    const row = stmt.get(id) as StoredEvaluation | undefined;
    return row || null;
  }

  async getAllEvaluations(): Promise<StoredEvaluation[]> {
    const stmt = this.db.prepare('SELECT * FROM evaluations ORDER BY created_at DESC');
    return stmt.all() as StoredEvaluation[];
  }

  // === AUDIT EVENTS ===

  async insertAuditEvent(event: StoredAuditEvent): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO audit_events (id, action, entity_type, entity_id, actor_identifier, previous_hash, event_hash, occurred_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      event.id, event.action, event.entity_type, event.entity_id,
      event.actor_identifier, event.previous_hash, event.event_hash, event.occurred_at
    );
  }

  async getAuditEvents(): Promise<StoredAuditEvent[]> {
    const stmt = this.db.prepare('SELECT * FROM audit_events ORDER BY occurred_at');
    return stmt.all() as StoredAuditEvent[];
  }

  async verifyAuditChain(): Promise<{ valid: boolean; errors: string[] }> {
    const events = await this.getAuditEvents();
    const errors: string[] = [];

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const expectedHash = computeEventHash({
        id: event.id,
        action: event.action,
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        actor_identifier: event.actor_identifier,
        previous_hash: event.previous_hash,
        occurred_at: event.occurred_at,
      });

      if (event.event_hash !== expectedHash) {
        errors.push(`Audit event ${event.id}: hash mismatch (expected ${expectedHash}, got ${event.event_hash})`);
      }

      // Verify chain continuity
      if (i > 0) {
        const prevEvent = events[i - 1];
        if (event.previous_hash !== prevEvent.event_hash) {
          errors.push(`Audit event ${event.id}: broken chain (previous_hash ${event.previous_hash} != prev event hash ${prevEvent.event_hash})`);
        }
      } else {
        if (event.previous_hash !== null) {
          errors.push(`First audit event ${event.id}: previous_hash should be null`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // === PHASE 2.2: DRE TABLES ===

  async insertDRERule(rule: any): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO dre_rules (id, version, name, description, domain, premises_json, conditions_json, conclusion_json, limitations_json, created_at, rule_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      rule.id, rule.version, rule.name, rule.description, rule.domain,
      JSON.stringify(rule.premises), JSON.stringify(rule.conditions),
      JSON.stringify(rule.conclusion), JSON.stringify(rule.limitations),
      rule.created_at, rule.rule_hash
    );
  }

  async getDRERule(id: string): Promise<any | null> {
    const stmt = this.db.prepare('SELECT * FROM dre_rules WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      ...row,
      premises: JSON.parse(row.premises_json),
      conditions: JSON.parse(row.conditions_json),
      conclusion: JSON.parse(row.conclusion_json),
      limitations: JSON.parse(row.limitations_json),
    };
  }

  async getAllDRERules(): Promise<any[]> {
    const stmt = this.db.prepare('SELECT * FROM dre_rules ORDER BY domain, id');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      ...row,
      premises: JSON.parse(row.premises_json),
      conditions: JSON.parse(row.conditions_json),
      conclusion: JSON.parse(row.conclusion_json),
      limitations: JSON.parse(row.limitations_json),
    }));
  }

  async getDRERulesByDomain(domain: string): Promise<any[]> {
    const stmt = this.db.prepare('SELECT * FROM dre_rules WHERE domain = ? ORDER BY id');
    const rows = stmt.all(domain) as any[];
    return rows.map(row => ({
      ...row,
      premises: JSON.parse(row.premises_json),
      conditions: JSON.parse(row.conditions_json),
      conclusion: JSON.parse(row.conclusion_json),
      limitations: JSON.parse(row.limitations_json),
    }));
  }

  async insertDREHypothesis(hypothesis: any): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO dre_hypotheses (id, execution_id, observation, rule_id, rule_version, premises_json, evidences_json, predictions_json, unmet_constraints_json, required_observations_json, state, explanation, created_at, hypothesis_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      hypothesis.id, hypothesis.executionId, hypothesis.observation,
      hypothesis.ruleId, hypothesis.ruleVersion,
      JSON.stringify(hypothesis.premises), JSON.stringify(hypothesis.evidences),
      JSON.stringify(hypothesis.predictions), JSON.stringify(hypothesis.unmetConstraints),
      JSON.stringify(hypothesis.requiredObservations),
      hypothesis.state, hypothesis.explanation, hypothesis.created_at, hypothesis.hypothesis_hash
    );
  }

  async getDREHypothesis(id: string): Promise<any | null> {
    const stmt = this.db.prepare('SELECT * FROM dre_hypotheses WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      ...row,
      executionId: row.execution_id,
      ruleId: row.rule_id,
      ruleVersion: row.rule_version,
      premises: JSON.parse(row.premises_json),
      evidences: JSON.parse(row.evidences_json),
      predictions: JSON.parse(row.predictions_json),
      unmetConstraints: JSON.parse(row.unmet_constraints_json),
      requiredObservations: JSON.parse(row.required_observations_json),
    };
  }

  async getDREHypothesesByExecution(executionId: string): Promise<any[]> {
    const stmt = this.db.prepare('SELECT * FROM dre_hypotheses WHERE execution_id = ? ORDER BY created_at');
    const rows = stmt.all(executionId) as any[];
    return rows.map(row => ({
      ...row,
      executionId: row.execution_id,
      ruleId: row.rule_id,
      ruleVersion: row.rule_version,
      premises: JSON.parse(row.premises_json),
      evidences: JSON.parse(row.evidences_json),
      predictions: JSON.parse(row.predictions_json),
      unmetConstraints: JSON.parse(row.unmet_constraints_json),
      requiredObservations: JSON.parse(row.required_observations_json),
    }));
  }

  async insertDRETrace(trace: any): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO dre_traces (id, domain, initial_observation, steps_json, hypotheses_generated_json, hypotheses_retained_json, hypotheses_refuted_json, final_decision, abstention_reason, execution_limits_json, limits_reached_json, created_at, trace_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      trace.id, trace.domain, trace.initialObservation,
      JSON.stringify(trace.steps), JSON.stringify(trace.hypothesesGenerated),
      JSON.stringify(trace.hypothesesRetained), JSON.stringify(trace.hypothesesRefuted),
      trace.finalDecision, trace.abstentionReason || null,
      JSON.stringify(trace.executionLimits), JSON.stringify(trace.limitsReached),
      trace.created_at, trace.trace_hash
    );
  }

  async getDRETrace(id: string): Promise<any | null> {
    const stmt = this.db.prepare('SELECT * FROM dre_traces WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      ...row,
      initialObservation: row.initial_observation,
      steps: JSON.parse(row.steps_json),
      hypothesesGenerated: JSON.parse(row.hypotheses_generated_json),
      hypothesesRetained: JSON.parse(row.hypotheses_retained_json),
      hypothesesRefuted: JSON.parse(row.hypotheses_refuted_json),
      finalDecision: row.final_decision,
      abstentionReason: row.abstention_reason,
      executionLimits: JSON.parse(row.execution_limits_json),
      limitsReached: JSON.parse(row.limits_reached_json),
    };
  }

  async getAllDRETraces(): Promise<any[]> {
    const stmt = this.db.prepare('SELECT * FROM dre_traces ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      ...row,
      initialObservation: row.initial_observation,
      steps: JSON.parse(row.steps_json),
      hypothesesGenerated: JSON.parse(row.hypotheses_generated_json),
      hypothesesRetained: JSON.parse(row.hypotheses_retained_json),
      hypothesesRefuted: JSON.parse(row.hypotheses_refuted_json),
      finalDecision: row.final_decision,
      abstentionReason: row.abstention_reason,
      executionLimits: JSON.parse(row.execution_limits_json),
      limitsReached: JSON.parse(row.limits_reached_json),
    }));
  }

  async getDRETracesByDomain(domain: string): Promise<any[]> {
    const stmt = this.db.prepare('SELECT * FROM dre_traces WHERE domain = ? ORDER BY created_at DESC');
    const rows = stmt.all(domain) as any[];
    return rows.map(row => ({
      ...row,
      initialObservation: row.initial_observation,
      steps: JSON.parse(row.steps_json),
      hypothesesGenerated: JSON.parse(row.hypotheses_generated_json),
      hypothesesRetained: JSON.parse(row.hypotheses_retained_json),
      hypothesesRefuted: JSON.parse(row.hypotheses_refuted_json),
      finalDecision: row.final_decision,
      abstentionReason: row.abstention_reason,
      executionLimits: JSON.parse(row.execution_limits_json),
      limitsReached: JSON.parse(row.limits_reached_json),
    }));
  }
}
