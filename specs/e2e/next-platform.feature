Feature: Verified measured platform expansion
  Goals 11-15 extend the completed bounded fixtures without changing their scientific labels.

  @goal11 @active
  Scenario: Rebuild and consume an authoritative release offline
    Given clean checkouts and the complete pinned local source-object closure
    And external network access is unavailable
    When the release factory rebuilds and the inference local data plane is populated
    Then the rebuilt payloads and release identity match the authoritative build
    And signed metadata verifies under the configured trust policy
    And a pinned inference workflow completes after the producer is stopped

  @goal11 @active
  Scenario: Traverse a release through snapshot-pinned pagination
    Given a verified release is mirrored in the empty local data plane
    When the inference application follows every page cursor for a fixed query
    Then every eligible identity is returned exactly once in deterministic order
    And every page remains pinned to one release and query contract
    And a cursor from another release or query is rejected

  @goal11 @active
  Scenario: Explain a semantic release change
    Given a pinned baseline release and a reproducible candidate release
    When the inference application requests their semantic difference
    Then scientific, provenance, and packaging-only changes remain distinct
    And each record change identifies its source-object or transformation cause
    And affected workflows retain both release identities

  @goal12 @pending
  Scenario: Use measured evidence with complete lineage
    Given a measured parameter and observation release with source and transformation closure
    When a compatible value is selected for an inference context
    Then its study, protocol, sample, evidence locator, license, original value, normalized value, units, uncertainty, and transformations are inspectable
    And excluded or transferred candidates retain deterministic rationale
    And no Goal 5 assumption or synthetic observation is presented as measured

  @goal12 @pending
  Scenario: Isolate study families across scientific partitions
    Given related subjects, specimens, samples, and repeated observations
    When a calibration and held-out study is run
    Then no study family or derived summary crosses its immutable partition
    And calibration cannot read validation or external-held-out values
    And the run artifact pins the complete partition identity

  @goal13 @pending
  Scenario: Challenge the frozen APAP model with external held-out evidence
    Given the APAP model, selection policy, endpoints, metrics, and thresholds were frozen before held-out disclosure
    And the challenge studies were not used for development or calibration
    When the external-held-out challenge runs in a clean offline workspace
    Then every declared endpoint is reported as failed, not-evaluable, or supported-within-boundary
    And measured observations, predictions, uncertainty, diagnostics, and lineage remain distinct
    And the completed Goal 6 synthetic benchmark is not cited as biological support

  @goal14 @pending
  Scenario: Inspect verified chunks from a measured spatial release
    Given a signed measured liver release contains multiresolution arrays and a complete chunk inventory
    When the user opens a region, level, and channel from the local data plane
    Then only matching verified chunks are read and cached
    And acquisition, specimen, physical units, missingness, segmentation, uncertainty, source, and license remain visible
    And absent or corrupt chunks fail without falling back to the Goal 7 synthetic geometry

  @goal14 @pending
  Scenario: Enforce spatial registration boundaries
    Given measured assets have directed registrations with declared validity regions
    When the user links coordinates across spatial views
    Then every coordinate resolves through a compatible pinned transform chain
    And quality, interpolation, uncertainty, and valid bounds are visible
    And unsupported cross-taxon, cross-donor, version-mismatched, or out-of-boundary placement is blocked

  @goal15 @pending
  Scenario: Recover an impacted local revalidation campaign
    Given a signed release change affects a subset of pinned runs, assertions, reports, and registrations
    And a bounded local campaign is interrupted after some work becomes terminal
    When the inference service restarts and resumes the campaign
    Then the exact campaign and queue identities are recovered
    And verified completed work is not duplicated
    And only transitively affected work is revalidated
    And execution outcomes remain separate from scientific conclusion labels

  @goal15 @pending
  Scenario: Preserve trust across signing-key rotation
    Given historical campaign and review events were signed by a trusted retired key
    And a replacement key is active under signed rotation metadata
    When new events are appended and the complete history is replayed
    Then historical signatures still verify with their original key identifiers
    And new events verify only with the active key
    And unknown or revoked signing states fail closed without erasing the audit chain
