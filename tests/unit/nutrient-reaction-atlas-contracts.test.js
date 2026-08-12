import { describe, expect, test } from 'vitest'
import {
  NUTRIENT_REACTION_ATLAS_FOUNDATION,
  NUTRIENT_REACTION_I2_RECONCILIATION,
  NUTRIENT_REACTION_REACTOME_CANDIDATES,
  NUTRIENT_REACTION_RHEA_CANDIDATES,
  NUTRIENT_REACTION_SIMULATION_BOOTSTRAP,
  verifyNutrientReactionAtlasFoundationSummary,
  verifyNutrientReactionHypothesis,
  verifyNutrientReactionI2ReconciliationSummary,
  verifyNutrientReactionReactomeCandidateSummary,
  verifyNutrientReactionRheaCandidateSummary,
  verifyNutrientReactionSimulationBootstrapSummary,
  verifyNutrientReactionSimulationCandidate
} from '../../shared/nutrient-reaction-atlas-contracts.js'

const digest = (value) => value.repeat(64)

function foundation() {
  return {
    release_id: NUTRIENT_REACTION_ATLAS_FOUNDATION.releaseId,
    release_digest: NUTRIENT_REACTION_ATLAS_FOUNDATION.releaseDigest,
    contract: NUTRIENT_REACTION_ATLAS_FOUNDATION.contract,
    release_kind: 'foundation-contract',
    source_count: 52,
    ontology_term_count: 85,
    nutrient_concept_count: 60,
    form_class_count: 17,
    event_kind_count: 8,
    reaction_ingestion_status: 'not-started',
    reaction_record_count: 0,
    simulation_ready_reaction_count: 0,
    policies: {
      trusted_knowledge: { automatic_promotion: false, requires_human_review: true },
      simulation_candidate: { automatic_promotion: false, can_support_biological_conclusion: false, requires_uncertainty: true },
      hypothesis: { automatic_promotion: false, can_support_biological_conclusion: false, requires_uncertainty: true }
    },
    coverage: {
      source_registry: { denominator: 52, registered: 52 },
      nutrient_roster: { denominator: 60, represented: 60 },
      reaction_ingestion: { enumeration_status: 'pending', denominator: 0 },
      simulation_readiness: { enumeration_status: 'pending', denominator: 0 }
    },
    automatic_promotion: false,
    simulation_enabled: false,
    candidate_writes_enabled: false
  }
}

function candidate() {
  return {
    id: 'REACTION_CANDIDATE:HYPOTHETICAL-1',
    content_digest: digest('a'),
    origin: 'hypothetical',
    event_kind_id: 'EVENT_KIND:CHEMICAL_TRANSFORMATION',
    nutrient_concept_ids: ['NUTRIENT:THIAMINE'],
    participants: [
      { identity_status: 'unresolved', chemical_id: null, unresolved_constraints: ['thiamine-derived coenzyme form'], role: 'reactant', coefficient: '1', compartment_id: 'GO:0005829' }
    ],
    direction_status: 'known',
    compartment_status: 'known',
    source_ids: [],
    generation_lineage: [digest('b')],
    assumptions: ['The unresolved participant is available in the declared compartment.'],
    uncertainty: { representation: 'unknown', description: 'No kinetic or abundance evidence is available.', parameters: {} },
    simulation_eligible: true,
    simulation_eligibility_rationale: 'The simulation treats the unresolved form as a declared symbolic pool.',
    trusted_knowledge_eligible: false,
    can_support_biological_conclusion: false,
    automatic_promotion: false,
    review_status: 'unreviewed'
  }
}

function rheaCandidateSummary() {
  return {
    schema_version: '1.0.0',
    artifact_kind: 'compressed-rhea-nutrient-reaction-candidate-report',
    artifact: {
      filename: 'rhea-141-nutrient-reaction-candidates.json.gz',
      media_type: 'application/gzip',
      bytes: 1186521,
      sha256: NUTRIENT_REACTION_RHEA_CANDIDATES.artifactDigest
    },
    content: {
      media_type: 'application/json',
      bytes: 29097133,
      sha256: NUTRIENT_REACTION_RHEA_CANDIDATES.contentDigest
    },
    source_sha256: NUTRIENT_REACTION_RHEA_CANDIDATES.sourceDigest,
    query_sha256: NUTRIENT_REACTION_RHEA_CANDIDATES.queryDigest,
    method: 'direct-rhea-participant-to-unreviewed-chebi-candidate-v1',
    closure_policy: 'Direct Rhea reaction participants only; no chemical ancestry, pathway, or downstream reaction expansion.',
    counts: {
      source_reactions: 18558,
      source_sides: 37113,
      source_participants: 90037,
      source_compounds: 15193,
      selected_reactions: 7288,
      excluded_reactions: 11270,
      matched_nutrient_terms: 30,
      unresolved_participant_references: 0,
      unresolved_compound_references: 0,
      non_chebi_participant_references: 7646
    },
    trust_boundary: {
      candidate_mappings_human_reviewed: false,
      human_applicability_established: false,
      trusted_knowledge_eligible: false,
      simulation_eligible: false,
      can_support_biological_conclusion: false,
      automatic_promotion: false
    }
  }
}

function reactomeCandidateSummary() {
  return {
    schema_version: '1.0.0',
    artifact_kind: 'compressed-reactome-nutrient-reaction-candidate-report',
    artifact: {
      filename: 'reactome-97-nutrient-reaction-candidates.json.gz',
      media_type: 'application/gzip',
      bytes: 2021476,
      sha256: NUTRIENT_REACTION_REACTOME_CANDIDATES.artifactDigest
    },
    content: {
      media_type: 'application/json',
      bytes: 25084441,
      sha256: NUTRIENT_REACTION_REACTOME_CANDIDATES.contentDigest
    },
    source: {
      id: 'SOURCE:REACTOME',
      release: '97',
      publication_date: '2026-06',
      license: 'CC0 for Reactome database data',
      sbml_sha256: NUTRIENT_REACTION_REACTOME_CANDIDATES.sbmlDigest,
      mapping_sha256: NUTRIENT_REACTION_REACTOME_CANDIDATES.mappingDigest,
      pmid_sha256: NUTRIENT_REACTION_REACTOME_CANDIDATES.pmidDigest
    },
    query_sha256: NUTRIENT_REACTION_REACTOME_CANDIDATES.queryDigest,
    method: 'reactome-human-sbml-plus-chebi-reaction-mapping-v1',
    closure_policy: 'Union of unique reactions in the Reactome 97 human SBML archive and Homo sapiens reaction IDs in the versioned ChEBI mapping; direct participant or mapping ChEBI candidates only; no recursive pathway or chemical ancestry expansion.',
    counts: {
      sbml_pathways: 2883,
      sbml_reaction_instances: 74977,
      sbml_unique_reactions: 16107,
      sbml_duplicate_conflicts: 0,
      sbml_duplicate_conflict_reactions: 0,
      mapping_rows: 221901,
      mapping_human_rows: 32487,
      mapping_human_reactions: 9658,
      pmid_rows: 50195,
      pmid_missing_rows: 7,
      source_reactions: 16186,
      selected_reactions: 3595,
      excluded_reactions: 12591,
      selected_sbml_detail: 3575,
      selected_mapping_only: 20,
      matched_nutrient_terms: 27,
      unresolved_species_references: 0
    },
    trust_boundary: {
      candidate_mappings_human_reviewed: false,
      endogenous_human_process_established: false,
      disease_drug_pathogen_events_separated: false,
      stoichiometric_balance_established: false,
      trusted_knowledge_eligible: false,
      simulation_eligible: false,
      can_support_biological_conclusion: false,
      automatic_promotion: false
    }
  }
}

function i2ReconciliationSummary() {
  return {
    schema_version: '1.0.0',
    artifact_kind: 'compressed-rhea-reactome-reconciliation-report',
    artifact: {
      filename: 'rhea-141-reactome-97-reconciliation.json.gz',
      media_type: 'application/gzip',
      bytes: 37378,
      sha256: NUTRIENT_REACTION_I2_RECONCILIATION.artifactDigest
    },
    content: {
      media_type: 'application/json',
      bytes: 998289,
      sha256: NUTRIENT_REACTION_I2_RECONCILIATION.contentDigest
    },
    source_artifacts: {
      rhea_sha256: NUTRIENT_REACTION_RHEA_CANDIDATES.artifactDigest,
      reactome_sha256: NUTRIENT_REACTION_REACTOME_CANDIDATES.artifactDigest,
      rhea_tsv_sha256: '409107649151d43289a16e99372154254670e8783034d21e5137e79e9a6aa59c'
    },
    method: 'direction-aware-exact-chebi-stoichiometric-side-comparison-v1',
    closure_policy: 'Reactome selected nutrient candidates with explicit Rhea links only; directional IDs normalize to their Rhea master; modifiers are excluded from stoichiometric side comparison; no inferred links.',
    counts: {
      reactome_selected_reactions: 3595,
      reactome_reactions_with_rhea_links: 580,
      reactome_reactions_without_rhea_links: 3015,
      links: 735,
      exact_directional_matches: 245,
      exact_undirected_matches: 7,
      side_match_direction_conflicts: 2,
      participant_mismatches: 46,
      non_comparable_non_chebi: 262,
      non_comparable_rhea_not_selected: 173,
      non_comparable_rhea_master_absent: 0,
      non_comparable_obsolete_rhea_id: 0,
      non_comparable_unknown_rhea_id: 0,
      rhea_direction_rows: 18558,
      rhea_obsolete_ids: 1184
    },
    trust_boundary: {
      source_identity_reviewed: false,
      mismatches_adjudicated: false,
      human_applicability_established: false,
      trusted_knowledge_eligible: false,
      simulation_eligible: false,
      can_support_biological_conclusion: false,
      automatic_promotion: false
    }
  }
}

describe('nutrient reaction atlas consumer contracts', () => {
  test('pins the zero-reaction foundation and disables writes and promotion', () => {
    expect(verifyNutrientReactionAtlasFoundationSummary(foundation())).toEqual(foundation())
    for (const mutate of [
      (value) => { value.release_digest = digest('0') },
      (value) => { value.reaction_record_count = 1 },
      (value) => { value.simulation_enabled = true },
      (value) => { value.automatic_promotion = true },
      (value) => { value.coverage.source_registry.registered = 51 },
      (value) => { value.policies.simulation_candidate.can_support_biological_conclusion = true }
    ]) {
      const value = structuredClone(foundation())
      mutate(value)
      expect(() => verifyNutrientReactionAtlasFoundationSummary(value)).toThrow()
    }
  })

  test('pins the one-reaction bootstrap without broad coverage or promotion', () => {
    const value = {
      release_id: NUTRIENT_REACTION_SIMULATION_BOOTSTRAP.releaseId,
      release_digest: NUTRIENT_REACTION_SIMULATION_BOOTSTRAP.releaseDigest,
      contract: NUTRIENT_REACTION_SIMULATION_BOOTSTRAP.contract,
      release_kind: 'simulation-bootstrap',
      candidate_count: 1,
      simulation_ready_count: 1,
      candidate_id: NUTRIENT_REACTION_SIMULATION_BOOTSTRAP.candidateId,
      candidate_digest: NUTRIENT_REACTION_SIMULATION_BOOTSTRAP.candidateDigest,
      simulation_mode: 'stoichiometric-symbolic',
      broad_reaction_coverage_status: 'not-started',
      trusted_knowledge_eligible: false,
      can_support_biological_conclusion: false,
      automatic_promotion: false
    }
    expect(verifyNutrientReactionSimulationBootstrapSummary(value)).toEqual(value)
    expect(() => verifyNutrientReactionSimulationBootstrapSummary({ ...value, broad_reaction_coverage_status: 'complete' })).toThrow()
    expect(() => verifyNutrientReactionSimulationBootstrapSummary({ ...value, trusted_knowledge_eligible: true })).toThrow()
  })

  test('pins source-bounded Rhea enumeration without implying human or simulation readiness', () => {
    expect(verifyNutrientReactionRheaCandidateSummary(rheaCandidateSummary())).toEqual(rheaCandidateSummary())
    for (const mutate of [
      (value) => { value.artifact.sha256 = digest('0') },
      (value) => { value.counts.source_reactions = 18557 },
      (value) => { value.counts.unresolved_compound_references = 1 },
      (value) => { value.closure_policy = 'recursive chemical ancestry' },
      (value) => { value.trust_boundary.human_applicability_established = true },
      (value) => { value.trust_boundary.simulation_eligible = true },
      (value) => { value.trust_boundary.automatic_promotion = true }
    ]) {
      const value = structuredClone(rheaCandidateSummary())
      mutate(value)
      expect(() => verifyNutrientReactionRheaCandidateSummary(value)).toThrow()
    }
  })

  test('pins Reactome human-export enumeration without treating HSA as endogenous biology', () => {
    expect(verifyNutrientReactionReactomeCandidateSummary(reactomeCandidateSummary())).toEqual(reactomeCandidateSummary())
    for (const mutate of [
      (value) => { value.artifact.sha256 = digest('0') },
      (value) => { value.counts.source_reactions = 16185 },
      (value) => { value.counts.sbml_duplicate_conflicts = 1 },
      (value) => { value.counts.unresolved_species_references = 1 },
      (value) => { value.closure_policy = 'recursive pathway expansion' },
      (value) => { value.trust_boundary.endogenous_human_process_established = true },
      (value) => { value.trust_boundary.disease_drug_pathogen_events_separated = true },
      (value) => { value.trust_boundary.simulation_eligible = true },
      (value) => { value.trust_boundary.trusted_knowledge_eligible = true }
    ]) {
      const value = structuredClone(reactomeCandidateSummary())
      mutate(value)
      expect(() => verifyNutrientReactionReactomeCandidateSummary(value)).toThrow()
    }
  })

  test('pins direction-aware Rhea and Reactome reconciliation with unresolved differences visible', () => {
    expect(verifyNutrientReactionI2ReconciliationSummary(i2ReconciliationSummary())).toEqual(i2ReconciliationSummary())
    for (const mutate of [
      (value) => { value.source_artifacts.rhea_sha256 = digest('0') },
      (value) => { value.counts.links = 734 },
      (value) => { value.counts.non_comparable_unknown_rhea_id = 1 },
      (value) => { value.counts.participant_mismatches = 0 },
      (value) => { value.trust_boundary.mismatches_adjudicated = true },
      (value) => { value.trust_boundary.human_applicability_established = true },
      (value) => { value.trust_boundary.simulation_eligible = true }
    ]) {
      const value = structuredClone(i2ReconciliationSummary())
      mutate(value)
      expect(() => verifyNutrientReactionI2ReconciliationSummary(value)).toThrow()
    }
  })

  test('allows low-evidence simulation only with explicit lineage and assumptions', () => {
    expect(verifyNutrientReactionSimulationCandidate(candidate())).toEqual(candidate())
    for (const mutate of [
      (value) => { value.assumptions = [] },
      (value) => { value.generation_lineage = [] },
      (value) => { value.direction_status = 'unknown' },
      (value) => { value.trusted_knowledge_eligible = true },
      (value) => { value.automatic_promotion = true },
      (value) => { value.participants[0].chemical_id = 'CHEBI:1234' }
    ]) {
      const value = structuredClone(candidate())
      mutate(value)
      expect(() => verifyNutrientReactionSimulationCandidate(value)).toThrow()
    }
  })

  test('keeps tested hypotheses outside trusted knowledge', () => {
    const value = {
      id: 'HYPOTHESIS:THIAMINE-POOL-1',
      content_digest: digest('c'),
      candidate_ids: ['REACTION_CANDIDATE:HYPOTHETICAL-1'],
      input_digests: [digest('a'), digest('b')],
      generation_method: 'bounded symbolic sensitivity exploration',
      assumptions: ['The candidate symbolic pool is available.'],
      uncertainty: { representation: 'qualitative', description: 'Participant identity and rate are unresolved.', parameters: {} },
      falsifiable_statement: 'A future exact source record either resolves or rejects the proposed event.',
      proposed_test: 'Reconcile against pinned Rhea, Reactome, and human protein evidence.',
      status: 'tested-supported-within-boundary',
      trusted_knowledge_eligible: false,
      can_support_biological_conclusion: false,
      automatic_promotion: false
    }
    expect(verifyNutrientReactionHypothesis(value)).toEqual(value)
    expect(() => verifyNutrientReactionHypothesis({ ...value, automatic_promotion: true })).toThrow()
    expect(() => verifyNutrientReactionHypothesis({ ...value, trusted_knowledge_eligible: true })).toThrow()
  })
})
