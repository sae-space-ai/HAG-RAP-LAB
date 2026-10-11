/**
 * Two independent synthetic technical observations plus incomplete auxiliary
 * readings. Namespaced separately from legacy or Qwen branch experimental data.
 */
import { computeProvenanceHash, type StoredClaim, type StoredSource, type StoredEvidenceLink, type StorageAdapter } from './storage';

export const abductionTechSources: StoredSource[]=[
 {id:'ABD-TECH-SRC-A',title:'Synthetic component monitor A',source_type:'synthetic_sensor',
 origin_uri:null,obtained_at:'2025-01-15T14:00:00Z',reliability_metadata:'SYNTHETIC INDEPENDENCE ASSUMPTION: monitor A',
 synthetic:true,created_at:'2025-01-15T14:00:00Z'},
 {id:'ABD-TECH-SRC-B',title:'Synthetic component monitor B',source_type:'synthetic_sensor',
 origin_uri:null,obtained_at:'2025-01-15T14:05:00Z',reliability_metadata:'SYNTHETIC INDEPENDENCE ASSUMPTION: monitor B',
 synthetic:true,created_at:'2025-01-15T14:05:00Z'},
 {id:'ABD-TECH-SRC-POWER',title:'Synthetic power reading (single source)',source_type:'synthetic_sensor',
 origin_uri:null,obtained_at:'2025-01-15T14:10:00Z',reliability_metadata:'SYNTHETIC, SINGLE SOURCE ONLY; NOT CORROBORATED',
 synthetic:true,created_at:'2025-01-15T14:10:00Z'}
];
const base={subject:'COMP-SYNTH-01',unit:null,valid_from:'2025-01-15T14:00:00Z',
 valid_to:'2025-01-15T14:59:59Z',status:'pending',revision:1,synthetic:true,created_at:'2025-01-15T14:10:00Z'};
export const abductionTechClaims:StoredClaim[]=[
 {...base,id:'ABD-TECH-OBS-A',predicate:'operational_status',object_value:'unavailable',source_id:'ABD-TECH-SRC-A'},
 {...base,id:'ABD-TECH-OBS-B',predicate:'operational_status',object_value:'unavailable',source_id:'ABD-TECH-SRC-B'},
 {...base,id:'ABD-TECH-POWER',predicate:'power_status',object_value:'unavailable',source_id:'ABD-TECH-SRC-POWER'}
];
export const abductionTechLinks:StoredEvidenceLink[]=abductionTechClaims.map((c,i)=>({
 id:'ABD-TECH-LNK-'+(i+1),
 claim_id:c.id,source_id:c.source_id,transformation:'synthetic_direct_reading',
 extracted_at:c.created_at,
 provenance_hash:computeProvenanceHash(c.source_id,c.id,'synthetic_direct_reading')
}));
export async function seedAbductionTechnicalDomain(storage:StorageAdapter):Promise<void>{
 for(const s of abductionTechSources)await storage.insertSource(s);
 for(const c of abductionTechClaims)await storage.insertClaim(c);
 for(const l of abductionTechLinks)await storage.insertEvidenceLink(l);
}
