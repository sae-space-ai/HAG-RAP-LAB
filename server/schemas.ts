/**
 * HAG-RAP Phase 1 — Zod Validation Schemas
 */

import { z } from 'zod';

export const evaluationInputSchema = z.object({
  claimId: z.string().optional(),
  subject: z.string().optional(),
  predicate: z.string().optional(),
  proposedValue: z.string().optional(),
  sourceIds: z.array(z.string()).optional(),
  caseId: z.string().optional(),
}).refine(
  data => data.claimId || (data.subject && data.predicate && data.sourceIds),
  { message: 'Debe proporcionar claimId o (subject + predicate + sourceIds)' }
);

export const seedSourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  source_type: z.string().default('synthetic'),
  origin_uri: z.string().nullable().default(null),
  obtained_at: z.string(),
  reliability_metadata: z.string().nullable().default(null),
  synthetic: z.boolean().default(true),
});

export const seedClaimSchema = z.object({
  id: z.string(),
  subject: z.string(),
  predicate: z.string(),
  object_value: z.string(),
  unit: z.string().nullable().default(null),
  valid_from: z.string().nullable().default(null),
  valid_to: z.string().nullable().default(null),
  source_id: z.string(),
  status: z.string().default('pending'),
  revision: z.number().default(1),
  synthetic: z.boolean().default(true),
});

export const seedEvidenceLinkSchema = z.object({
  id: z.string(),
  claim_id: z.string(),
  source_id: z.string(),
  transformation: z.string().default('none'),
  extracted_at: z.string(),
  provenance_hash: z.string(),
});

export const seedPayloadSchema = z.object({
  sources: z.array(seedSourceSchema),
  claims: z.array(seedClaimSchema),
  evidenceLinks: z.array(seedEvidenceLinkSchema),
});

export type EvaluationInputDTO = z.infer<typeof evaluationInputSchema>;
export type SeedPayloadDTO = z.infer<typeof seedPayloadSchema>;


// Phase 2 accepts only a finite, documented experimental rule vocabulary.
export const dreInputSchema = z.object({
  claimId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  hypothesis: z.discriminatedUnion('predicate', [
    z.object({
      predicate: z.literal('synthetic_temperature_band'),
      value: z.enum(['IN_RANGE', 'OUT_OF_RANGE']),
    }).strict(),
    z.object({
      predicate: z.literal('synthetic_review_priority'),
      value: z.enum(['LOW', 'REVIEW']),
    }).strict(),
  ]),
}).strict();
