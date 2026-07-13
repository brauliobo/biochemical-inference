Feature: Linked synthetic spatial tissue workbench

  Scenario: A verified APAP run links semantic and spatial selections
    Given the pinned APAP and spatial releases are available
    When I run the APAP benchmark and select a time, result field, and lobule bin
    Then the heatmap, numeric table, spatial inspector, and tissue scene share that selection
    And the selected value, scale, interpolation, missing-value policy, uncertainty, LOD, and provenance are visible

  Scenario: Human reference anatomy is unavailable
    Given the release contains only repository-authored synthetic geometry
    Then the workbench states that synthetic geometry is not reference anatomy
    And the unavailable HRA mapping has no target space or transform
    And mouse pointer interaction cannot place data into human reference anatomy

  Scenario: WebGL is optional
    Given WebGL is unavailable or its context is lost
    When I use the APAP spatial workbench
    Then the complete numeric table, time and field controls, bin selection, selected values, encoding, and provenance remain usable

  Scenario: Mobile retains scientific information
    Given I use a 360 pixel wide viewport
    When I run and inspect the APAP spatial benchmark
    Then all semantic controls and values remain available without page-level horizontal overflow
