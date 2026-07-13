Feature: Controlled multiscale biochemical platform
  Every user-visible capability must remain reproducible, inspectable, and scientifically bounded.

  Scenario: Explain hybrid literature retrieval
    Given pinned atlas and evidence corpus releases
    When the user searches for SAM inhibition of MTHFR
    Then exact, full-text, ontology, graph, annotation, and vector contributions are visible
    And every result exposes exact evidence spans, lifecycle status, and license

  Scenario: Generate an unreviewed Ollama evidence candidate
    Given licensed supporting spans and a pinned local Ollama model
    When structured extraction runs
    Then model, model digest, prompt digest, input digest, schema, and spans are recorded
    And missing context and parameters are listed
    And the candidate is visibly excluded from trusted atlas claims

  Scenario: Run standards-based ODE, SSA, and FBA models
    Given valid declarative model contracts for each supported engine
    When each controlled experiment runs
    Then ODE trajectories satisfy an analytic benchmark
    And seeded SSA satisfies its deterministic seed contract and statistical benchmark
    And FBA reports optimal, infeasible, and unbounded outcomes distinctly
    And every result pins model, engine, knowledge, units, controls, and seeds

  Scenario: Reject unsafe or unsupported model content
    Given a model archive contains path traversal, external references, unsupported semantics, or incompatible units
    When it is imported
    Then validation fails before execution
    And exact findings remain inspectable

  Scenario: Explain parameter selection
    Given competing qualified parameter evidence
    When a model context selects effective values
    Then selected and excluded candidates have deterministic rationale codes
    And manual values are labeled assumptions
    And taxon transfer requires an explicit transformation

  Scenario: Calibrate without validation leakage
    Given disjoint calibration and held-out observations
    When calibration and posterior prediction run
    Then only calibration observations affect fitting
    And held-out metrics are reported separately
    And sensitivity, identifiability, convergence, and uncertainty diagnostics are visible

  Scenario: Downgrade a conclusion under robustness analysis
    Given alternative model forms, parameter evidence sets, and numerical controls
    When the robustness matrix runs
    Then conclusion stability derives from actual runs
    And unstable or non-converged conclusions are not labeled validated

  Scenario: Run the human APAP pharmacokinetic protocol
    Given the pinned human liver benchmark and evidence release
    When the user executes the supported oral exposure protocol
    Then plasma and liver outputs retain units, uncertainty, parameter evidence, and validation status
    And no output is presented as treatment guidance

  Scenario: Compare human and mouse APAP contexts
    Given supported human and mouse benchmark protocols
    When their results are compared
    Then the equation and plugin digests remain visible
    And every physiology, enzyme, strain, route, and context difference is inspectable
    And changing only the taxon label cannot alter equations or values

  Scenario: Pass APAP limiting cases
    Given the APAP benchmark model
    When CYP activity is set to zero
    Then NAPQI, adduct, and APAP-mediated injury remain zero
    And mass and cell-state conservation diagnostics pass

  Scenario: Link spatial liver results across views
    Given a completed spatial liver run
    When the user selects a region and time
    Then pathway, tissue, organ, chart, and numeric table identify the same run context
    And every representation exposes units, scaling, interpolation, uncertainty, and provenance

  Scenario: Preserve species-specific coordinate spaces
    Given a mouse lobule result
    When the organ workspace opens
    Then it is not placed into unsupported human reference geometry
    And the missing mapping is stated explicitly

  Scenario: Review and reproduce a derived assertion
    Given a successful run and declared analysis produce a candidate assertion
    When a reviewer reproduces and accepts it
    Then the reviewed-derived layer exposes it with complete lineage
    And source facts remain unchanged
    And superseded or invalidated history remains accessible

  Scenario: Export and reproduce a controlled experiment
    Given a completed public-data experiment
    When it is exported and imported into a clean workspace
    Then the same specification and knowledge snapshot are reconstructed
    And the rerun satisfies its declared reproducibility contract

  Scenario: Cancel, checkpoint, and resume safely
    Given a long controlled experiment is running
    When cancellation follows a valid checkpoint
    Then partial output is not labeled successful
    And compatible resume creates a traceable new attempt
    And incompatible engine or specification digests are rejected

  Scenario: Enforce resource profiles
    Given an experiment exceeds its CPU, memory, output, or storage budget
    When the worker reaches the limit
    Then the attempt ends as resource-exhausted
    And prior artifacts and queue state remain intact

  Scenario: Install and certify a physiology plugin
    Given a signed declarative organ plugin package
    When it is imported and validated
    Then signature, license, protocol, applicability, resources, and benchmarks are reported
    And it cannot run scientifically until certification succeeds

  Scenario: Couple circulation, liver, and kidney conservatively
    Given certified plugins and a pinned multirate coupling contract
    When the coupled experiment runs
    Then each plugin advances on its declared schedule
    And exchanged quantities conserve within tolerance
    And every plugin, coupling, model, and knowledge digest is recorded

  Scenario: Refuse unsupported plugin extrapolation
    Given a human-only plugin is selected for mouse
    When execution is requested
    Then execution is blocked
    And the coverage matrix reports unsupported applicability instead of substituting parameters

  Scenario: Complete every workflow without 3D
    Given WebGL is unavailable on a narrow viewport
    When the user searches evidence, runs models, inspects spatial results, reviews derivations, and compares experiments
    Then all scientific controls, values, warnings, provenance, and exports remain available semantically
