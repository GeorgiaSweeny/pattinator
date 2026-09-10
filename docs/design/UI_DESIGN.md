# User Interface Design

## Overview

The user interface is designed to make procedural algorithms inspectable rather than opaque. Instead of presenting users with only a final generated pattern, the application exposes the conceptual stages of each algorithm through a simplified visual workflow.

The interface combines three synchronised views, each representing a different perspective of the same computational process:

* **Algorithm Workflow** — the structure of the algorithm
* **Documentation Panel** — explanations of each computational stage
* **Pattern Canvas** — the visual output produced by the algorithm

Together, these views support exploration of computational thinking concepts through direct interaction with procedural systems.

---

# Changes from Original Design

This document has been updated against the working implementation in
`src/vanilla/ui-layout-mockup.html` / `.css`. The changes recorded below were made to
**improve clarity and simplify the layout** — not to change the interface's
underlying design objectives.

* **Parameter editing moved out of the Documentation Panel entirely**, into an
  expandable control panel that opens directly beneath the selected node in
  the Algorithm Workflow column. The Documentation Panel is now purely
  explanatory (text, concepts, a visual example) with no interactive controls
  of its own — a cleaner separation between *understanding* a stage
  (Documentation Panel) and *adjusting* it (inline node controls). See
  Documentation Panel and Parameter Editing below.
* **Parameters are now distinguished as free-exploration vs. fixed-by-geometry.**
  Some node values (e.g. a tile size or repeat count) are sliders the learner
  can freely explore; others (e.g. a rotation angle or lattice offset) are
  mathematically required by the shape being tessellated and are shown
  read-only, with a note explaining *why* they're fixed rather than a free
  choice. This directly serves the "understand why" objective rather than
  presenting every value as equally adjustable.
* **Workflow nodes are now conditionally visible.** A node only appears in the
  workflow if the current algorithm actually needs it — e.g. Rotate and
  Translate are hidden entirely for shapes that tile the plane without them
  (square, hexagon), and shown only for shapes that require them (triangle,
  diamond, brick). Showing a fixed step sequence regardless of relevance
  would misrepresent what the algorithm is actually doing.
* **The canvas now distinguishes the algorithm's workspace from the viewport.**
  A `Workspace` node was added representing the coordinate space the
  algorithm computes in, distinct from the canvas the learner views it
  through; the canvas overlays a workspace-boundary box (except during
  Render, where the output should read cleanly) and labels both the canvas
  and workspace dimensions.
* **Export moved from a canvas-level feature to a Render-node control.** Export
  actions (SVG/PNG) now live inline under the Render node specifically,
  rather than as separate, canvas-level buttons — tying the export action to
  the conceptual final stage of the workflow instead of treating it as a
  generic canvas toolbar feature.

The Interface Layout section below already matches this structure (Generator
Selection stacked above Algorithm Workflow in the same left column); the
sections after it have been updated to reflect the points above.

---

# Implementation Status

This document describes the target design. The working implementation is the
ReactFlow app at `src/app/` (distinct from the static, pre-React
`src/vanilla/ui-layout-mockup.html`/`.css`, which was a design exploration, not the
delivered interface). As of 2026-08-18:

**Implemented**, matching this document's structure and interaction model:

* The four-region layout (menu bar; Generator Selection + Algorithm Workflow
  stacked in the left column; Documentation Panel; Pattern Canvas; Status &
  Controls bar) — `src/app/src/App.jsx`, `App.css`.
* Single-node-at-a-time selection: clicking a node highlights it, opens its
  parameter controls inline beneath it (only one panel open at a time), and
  updates the Documentation Panel — `App.jsx`, `nodeTypes/WorkflowNode.jsx`.
* The Documentation Panel's operation/explanation/purpose/concepts fields,
  sourced from the same content as the per-node files under `docs/nodes/` —
  `DocumentationPanel.jsx`, `nodeDocs.js`.
* Stepping via Prev/Next and via direct node click, both driving the same
  selection state, with a `Step X of N` indicator — `App.jsx`'s status bar.
* Fixed-by-geometry parameters shown read-only with an explanatory note —
  `nodeTypes/WorkflowNode.jsx`'s `param-fixed` case.
* The workspace-boundary overlay and canvas/workspace dimension labels,
  hidden specifically on the Render step — `App.jsx`'s `canvas-panel`.
* Export (SVG/PNG) as a Render-node control rather than a canvas-level
  button — `export.js`, wired into the Render node's parameter panel.
* Changing a parameter immediately updates the rendered pattern, and — where
  the parameter changes the algorithm's own structure (e.g. recursive's
  `depth` controlling how many Subdivide nodes exist) — the workflow graph
  itself, not just the canvas (`workflows.js`'s `buildWorkflow` takes live
  param values, not just registry defaults).

**Built 2026-08-21** (previously listed as deliberately deferred here):

* **Per-node intermediate algorithm state on the canvas.** The canvas now
  shows each stage's own intermediate output where `src/app/src/stagePreview.js`
  defines a rule for it (all 9 generators, one generic mechanism — a
  declarative `(generator, nodeType) → params override | dedicated preview`
  table, not bespoke code per generator the way the discontinued mockup
  only ever built this for Grid Tessellation), falling back to the real
  final output for stages with no distinct, cheaply-producible
  intermediate look. See `docs/planning/plan-checklist.md`'s Aug 21 entry for the
  full mechanism and how each generator's own stage was handled.
* The Documentation Panel's "Visual Example" is a small live render of the
  selected node's own current intermediate state (the same `PatternCanvas`
  component, at thumbnail size, driven by the mechanism above) — no
  longer a static placeholder.

**Built 2026-09-01** — a Gallery, opened from a new menu-bar button:

* **Featured tab** — a hand-curated set of favourite outputs
  (`src/app/src/gallery/galleryPatterns.js`), each loadable with one click
  via the same `{entryId, overrides}` → full-params resolution the
  evaluation quiz already used (`evaluation/quizPatterns.js`).
* **My Gallery tab** — session-local (`sessionStorage`, cleared on tab
  close), populated via a new "Add to Gallery" action alongside the Render
  node's existing Export SVG/PNG buttons.
* Export actions also now download a `{entryId, params}` JSON sidecar
  alongside the image, so a favourite output can be re-imported into the
  Featured tab later without guessing its params back out of the pixels.

See `docs/planning/plan-checklist.md`'s Sep 1 entry for the full build (including a
`fitView` cold-load reliability fix found while testing this) and rationale.

**Still deliberately deferred** (tracked in `docs/planning/plan-checklist.md`'s
priorities, not a gap in this pass):

* An editable Workspace-dimensions control and canvas zoom/pan — both listed
  as design capabilities in this document but not yet wired to a control;
  `CANVAS.WIDTH`/`HEIGHT` are fixed constants (`src/config.js`).

---

# Design Objectives

The interface has been designed around the following principles:

* Reduce cognitive load through simplified workflows
* Encourage exploration through immediate visual feedback
* Reveal intermediate stages of procedural generation
* Connect computational concepts to visual outcomes
* Prioritise understanding over feature richness
* Maintain consistency across all implemented generators

Unlike professional procedural modelling software, the interface deliberately restricts functionality to maintain focus on learning.

---

# Interface Layout

The application consists of three primary regions.

```text
┌───────────────────────────────────────────────────────────────┐
│                         MENU BAR                              │
├──────────────┬───────────────────────────┬────────────────────┤
|Generator     │                           │                    │
|Selection     │                           │                    │
├──────────────┤                           │                    │ 
│              │                           │                    │
│ Visual       │                           │                    │
│ Algorithm    │ Documentation             │ Pattern            │
│ Workflow     │ Panel                     │ Canvas             │
│ (NODES)      │ (visuals & text)          │                    │
│              │                           │                    │
├──────────────┴───────────────────────────┴────────────────────┤
│              Status & Selected Param/Node Controls            │
└───────────────────────────────────────────────────────────────┘
```

Each panel remains visible throughout interaction, allowing users to continuously relate algorithm structure, conceptual explanation and visual output.

---

# Algorithm Workflow

The workflow provides a simplified visual representation of each procedural algorithm.

Each node corresponds to a meaningful conceptual operation rather than an individual implementation function.

Example (Grid Tessellation, any shape — square, triangle, hexagon, brick or diamond):

```text
Workspace
    │
    ▼
Base Geometry
    │
    ▼
Lattice Index
    │
    ▼
Colour Mapping
    │
    ▼
Render
```

This is the same 5-step workflow for every shape, not a template with
Rotate/Translate/Repeat X/Repeat Y steps that appear or disappear by shape.
An earlier version of this document showed Grid Tessellation going through
those four extra stages (shown conditionally per shape), on the assumption
that a diamond tile's 45° frame or a brick's row offset would be
independently observable steps a learner could inspect. Checked against the
actual implementation (`src/generators/grid.js`), that isn't how any of the
five shapes are computed: each one maps `(x, y)` straight to a colour-class
index via one closed-form coordinate calculation — an oblique basis for
triangle, cube coordinates for hexagon, a running-bond offset for brick, a
rotated frame for diamond — with no intermediate rotated- or
translated-geometry object a Rotate or Translate node could meaningfully
show. That calculation is the Lattice Index node
(`docs/nodes/computation/lattice-index.md`); see
`docs/nodes/WORKFLOWS.md` §5 for the full account of why the four-step
version didn't match the code, and why Lattice Index — rather than forcing
the shapes through Rotate/Translate/Repeat, which would misrepresent a shear
as a rotation for triangle and hexagon — is the honest fix.

The graph should remain primarily linear, with branching introduced only where it contributes meaningfully to understanding.

The objective is to communicate algorithm structure without overwhelming learners with unnecessary implementation details.

---

# Node Interaction

Nodes serve as the primary method of navigating the algorithm.

Selecting a node should:

* highlight the current computational stage
* update the documentation panel
* display the corresponding intermediate pattern state
* open an expandable parameter control panel directly beneath the node, where the node has editable parameters

That control panel — not the documentation panel — is where a node's
parameters are actually edited (see Parameter Editing below). Only one
node's controls are open at a time.

Nodes are not editable.

Users cannot:

* create nodes
* delete nodes
* reconnect workflows
* modify algorithm structure

The workflow represents predefined algorithms whose structure has been intentionally curated for educational purposes.

---

# Stepping Through Algorithms

A central feature of the application is the ability to inspect procedural generation incrementally.

Users should be able to move forwards and backwards through the workflow.

Example (Grid Tessellation, any shape):

```text
Step 1 of 5 — Workspace

↓

Step 2 of 5 — Base Geometry

↓

Step 3 of 5 — Lattice Index

↓

Step 4 of 5 — Colour Mapping

↓

Step 5 of 5 — Render
```

Grid Tessellation steps through the same 5 stages regardless of shape (see
Algorithm Workflow above); other generators' step counts still vary — e.g.
Wave/Concentric Rings' Distance Field step only appears in `rings` mode.
Navigation is available both via Prev/Next controls and by selecting a node
directly.

At each step, the pattern canvas displays the intermediate output produced by that stage of the algorithm.

This allows learners to observe how simple computational operations accumulate to produce complex visual structures.

---

# Documentation Panel

Selecting a workflow node displays educational information describing that operation.

Each node should present consistent documentation including:

* operation name
* a visual example
* conceptual explanation
* purpose within the algorithm
* computational thinking concepts

Editable parameters live in the workflow column, not here (see Node
Interaction and Parameter Editing) — this panel is explanatory only, so a
learner can read what a stage does and why without it being mixed together
with the controls for adjusting it. Optional animations, mentioned in the
original design, are deferred; the visual example is currently a static
placeholder.

Documentation should use clear language suitable for learners with limited programming experience.

Mathematical notation should be introduced only where it improves conceptual understanding.

---

# Parameter Editing

Many workflow nodes expose parameters that influence algorithm behaviour.
Selecting a node opens its parameter controls in an expandable panel directly
beneath it in the Algorithm Workflow column (see Node Interaction above) —
only one node's controls are open at a time, and they close when another node
is selected.

Parameters fall into two kinds, both surfaced by the same control panel:

* **Free to explore** — values the learner can freely adjust, e.g. tile size, repeat count, colour threshold, workspace dimensions.
* **Fixed by geometry** — values that are mathematically required for the algorithm to produce a valid result, e.g. a shape's rotation angle or translation offset. These are shown read-only, with a short note explaining *why* the value is fixed rather than a free choice — the point being to teach that some computational decisions follow necessarily from earlier ones, not that every value is equally negotiable.

Changing a free parameter should immediately update the generated pattern.

Parameter controls should remain constrained to meaningful values, preventing invalid procedural states.

The objective is to encourage experimentation while maintaining a coherent learning experience.

---

# Pattern Canvas

The pattern canvas provides visual feedback for every interaction.

It should support:

* real-time rendering
* intermediate algorithm states
* final generated patterns
* zooming and panning where appropriate
* a workspace-boundary overlay, distinguishing the algorithm's own coordinate space (the Workspace node) from the canvas viewport it's viewed through, with both dimensions labelled — hidden only during Render, where the output should read cleanly
* SVG and PNG export, available as controls under the Render node specifically (see Parameter Editing), not as separate canvas-level buttons

The canvas should always reflect the currently selected computational stage.

Rather than functioning purely as a drawing surface, the canvas acts as a visual explanation of algorithm execution.

---

# Synchronised Interaction

The three interface regions remain synchronised throughout interaction.

For example:

```text
User selects "Rotate"

        │

        ▼

Workflow
(highlights Rotate)

        │

        ▼

Documentation
(explains rotation)

        │

        ▼

Canvas
(shows rotated geometry)
```

Similarly, modifying a parameter updates:

* parameter controls
* rendered pattern
* intermediate algorithm states

This synchronisation reinforces the relationship between computational operations and visual outcomes.

---

# Educational Interaction Model

The application follows an inspect–modify–observe learning cycle.

```text
Select Node
      │
      ▼
Understand Operation
      │
      ▼
Modify Parameter
      │
      ▼
Observe Result
      │
      ▼
Continue Through Workflow
```

This cycle encourages learners to actively investigate how computational rules influence pattern generation.

---

# Relationship to Houdini

The interface is inspired by Houdini's procedural workflow model, particularly its ability to inspect intermediate stages of a procedural network.

However, the interface intentionally omits features associated with professional procedural modelling software.

Included concepts:

* parameterised operations
* non-destructive workflows
* inspection of intermediate results

Excluded concepts:

* arbitrary graph editing
* scripting
* custom node creation
* simulation networks
* procedural authoring

The interface therefore functions as an educational algorithm explorer rather than a procedural modelling environment.

---

# TODO: Planned Wireframes

Figures to be included as implementation progresses.

* Figure 1 — Early interface concept sketch
* Figure 2 — Overall application layout
* Figure 3 — Workflow interaction sequence
* Figure 4 — Documentation panel layout
* Figure 5 — Parameter editing interface
* Figure 6 — Pattern canvas interaction
* Figure 7 — Example workflow for Perlin Noise
* Figure 8 — Example workflow for Islamic Geometric Patterns

These figures document the evolution of the interface throughout the design process and provide visual justification for key interaction decisions.
