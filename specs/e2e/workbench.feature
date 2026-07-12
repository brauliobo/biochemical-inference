Feature: Evidence-linked controlled biochemical simulation
  The workbench must make every simulation inspectable and reproducible.

  Scenario: Load the verified scientific workspace
    Given the knowledge and inference services are running
    When the user opens the workbench
    Then the active knowledge release identifier and digest are visible
    And human and mouse are available taxa
    And model units and scientific limitations are visible
    And network compounds, reactions, proteins, and evidence can be inspected

  Scenario: Run a deterministic human baseline
    Given the verified one-carbon release is selected
    And human and the baseline preset are selected
    When the user runs the simulation
    Then the completed run displays its stable run identifier
    And the exact release and model versions are displayed
    And concentration and flux time series are displayed with units
    And integration diagnostics and warnings are displayed
    And repeating the unchanged run returns equivalent canonical output

  Scenario: Compare reduced MTHFR activity
    Given a completed baseline run
    When the user selects reduced MTHFR activity and runs the model
    Then the perturbed run has a different run identifier
    And the baseline remains available for comparison
    And the documented directional changes in homocysteine and SAM-to-SAH behavior are visible
    And the workbench identifies the result as a model prediction

  Scenario: Keep human and mouse runs distinct
    Given the user has completed a human run
    When the same model configuration is run for mouse
    Then the mouse run pins the same chemistry release
    And the run uses mouse protein associations
    And the run receives a distinct identity
    And no human protein is presented as mouse evidence

  Scenario: Inspect a selected network entity
    Given a completed simulation is displayed
    When the user selects homocysteine from the accessible network list
    Then homocysteine is selected in the 3D view
    And its concentration series is emphasized
    And connected reactions and evidence are displayed
    And the numeric value and unit are available without using the canvas

  Scenario: Reject invalid simulation controls
    Given the user enters an unsupported activity or duration
    When the user attempts to run the simulation
    Then the affected field has an actionable validation message
    And no simulation request is sent
    And the prior successful result is not relabeled as the invalid configuration

  Scenario: Recover from a service failure
    Given a valid configured experiment
    When the simulation service returns an error
    Then the workbench displays a non-destructive failure message
    And preserves all valid controls
    And does not display stale output as the failed run
    And allows the user to retry

  Scenario: Reject an incompatible knowledge release
    Given the knowledge service reports an unsupported schema or digest mismatch
    When the workbench loads the release
    Then simulation execution is disabled
    And the compatibility problem is visible
    And no partial field interpretation is attempted

  Scenario: Continue without WebGL
    Given WebGL initialization is unavailable
    When the user opens and runs the workbench
    Then the network list, controls, charts, evidence, diagnostics, and results remain usable
    And the 3D limitation is explained

  Scenario: Complete the workflow on a narrow viewport
    Given the workbench width is 360 CSS pixels
    When the user selects a taxon, runs a preset, inspects results, and selects an entity
    Then no essential action depends on hover
    And all controls and validation messages remain reachable
    And the page has no essential horizontal overflow

  Scenario: Use the workbench by keyboard
    Given the workbench is loaded
    When the user navigates without a pointer
    Then controls, run action, network list, result selection, and evidence are reachable
    And the 3D canvas does not trap focus
