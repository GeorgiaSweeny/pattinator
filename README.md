# Pattinator

> An MSc dissertation project investigating the compositional structure of generative pattern algorithms, demonstrated through an interactive educational interface.

**Click to run the [Pattinator app](https://georgiasweeny.github.io/algorithmic-pattern-explorer/)** — an algorithmic pattern explorer that walks you through how each generator is built, step by step

*Best viewed in Chrome — the only browser the app is developed and tested against. It has not been verified to behave correctly in Safari, Microsoft Edge, or other browsers.*

---

## Overview

Generative pattern software typically hides how a pattern is actually built
behind a handful of adjustable settings, leaving a user free to change the
picture but never to see the mechanism producing it.

Pattinator's primary research contribution is algorithmic: it
investigates whether a small, fixed vocabulary of composition patterns — drawn
from combinator-style function composition — can describe how a spectrum of
generative pattern algorithms (stochastic → deterministic) is built from a
minimal library of reusable primitives. See
[`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`](docs/ALGORITHMIC_COMPOSITION_RESEARCH.md)
for the full framing, the primitive library, and the composition analysis
against the current generators.

The educational web interface — the Pattinator app, an algorithmic pattern
explorer built as a node graph — is secondary: a demonstration and evaluation
vehicle that shows this compositional structure is not only internally correct
(verified by the property-based test suite in `src/generators/__tests__/`), but
also externally legible — that a learner using the interactive workflow view can
actually see how a generator's output is built from its computational stages,
rather than treating each algorithm as an opaque function from parameters to
pattern.

### Key Documents

* [`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`](docs/ALGORITHMIC_COMPOSITION_RESEARCH.md) — the primary research contribution: the composition vocabulary and the analysis of each generator against it.
* [`docs/GENERATOR_CONTRACT.md`](docs/GENERATOR_CONTRACT.md) — the interface every generator satisfies, verified by the property-based test suite.
* [`docs/results/benchmark-results.md`](docs/results/benchmark-results.md) — empirical time-complexity analysis per generator, including a couple of counter-intuitive findings.
* [`docs/planning/MOSCOW_PRIORITIES.md`](docs/planning/MOSCOW_PRIORITIES.md) — consolidated MoSCoW priority table across the full project scope (generators, explorer interface, educational UX, evaluation), tracing back to `docs/PROJECT_SPECIFICATION.md` and the educator user-stories doc.
* [`docs/results/spectrum-structural-results.md`](docs/results/spectrum-structural-results.md) — checks each generator's declared stochastic/deterministic `spectrum` value both empirically (re-seeding) and structurally (composition analysis).

---

## Research Questions

### Primary Research Question

> **Can a small, fixed vocabulary of composition patterns (atop/compose, fork, constant-bind, fold, repeat) describe how a spectrum of generative pattern algorithms is built from a minimal library of reusable primitives — and where that vocabulary doesn't fit a given generator, what does the gap reveal about the primitive library's completeness?**

See [`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`](docs/ALGORITHMIC_COMPOSITION_RESEARCH.md)
for the current composition analysis against all seven implemented generators.

### Secondary Research Question

> **How do different generative logics influence the emergence of visual structure across a spectrum from stochastic to deterministic systems, and how do hybrid/composed generators extend or stress the compositional model above?**

### Demonstration Question (supports the above, doesn't replace it)

> **Does an interactive node-based workflow view make a generator's compositional structure visible and understandable to a novice learner?**

This is the role of the educational interface and the pre/during/post evaluation
study described below — it tests whether the *demonstration* succeeds, not
whether the underlying compositional claim is true. That's established
independently through the algorithmic analysis and automated testing.

---

## Educational Objectives

These objectives belong to the secondary, demonstration layer of the project
(see Overview above) — they describe what the interface aims to make visible,
not the project's primary research claim.

The application is designed to help learners develop an understanding of computational thinking through direct interaction with generative systems.

Key concepts include:

* Randomness
* Iteration
* Transformation
* Symmetry
* Rule-based generation
* Parameterisation
* Emergence
* Procedural modelling
* Computational creativity

Rather than simply generating patterns, the application aims to explain **why** different algorithms produce different visual behaviours.

---

## Generative Spectrum

The project investigates five generators spanning the stochastic↔deterministic
spectrum. Each contributes either a spectrum position or a composition pattern
(see [`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`](docs/ALGORITHMIC_COMPOSITION_RESEARCH.md))
not covered by the others — including two, at the deterministic end, that
reach full determinism by genuinely different mechanisms.

| Generator                      | Computational Approach                        | Position on Spectrum | Composition pattern | Status         |
| ------------------------------ | --------------------------------------------- | --------------------- | -------------------- | -------------- |
| **Perlin / Ridge Noise**       | Controlled randomness                         | Stochastic            | Fold/reduce (only example) | ✅ Implemented |
| **Voronoi Diagrams**           | Random inputs with deterministic partitioning | Hybrid                | Constant-bind → atop | ✅ Implemented |
| **Escher Tessellations**       | Geometric transformations                     | Structured            | Cross-fork → atop (only fork example) | ✅ Implemented |
| **Recursive / Fractal (Sierpinski)** | Rule-based recursive subdivision       | Deterministic          | Repeat/power (only example) | ✅ Implemented |
| **Islamic Geometric Patterns** | Mathematical construction rules (symmetry groups) | Deterministic     | Constant-bind → atop, reusing Voronoi's Distance Field with a deterministic (not RNG) point source — distinct mechanism from recursive subdivision's repeat/power; see `docs/nodes/WORKFLOWS.md` §7 | ✅ Implemented |

Together these demonstrate how different computational rules — and different
ways of composing a small set of shared primitives — influence pattern
formation.

### Hybrid generators (secondary research question)

Two further generators test how far the compositional model above extends
under direct composition of two already-implemented pipelines — see
`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`'s secondary research question and
each generator's own composition-table row.

| Generator | Computational Approach | Composition pattern | Status |
| --- | --- | --- | --- |
| **Perlin Sierpinski** (`recursiveNoise.js`) | Recursive subdivision domain-warped by Perlin noise; `amplitude = 0` is byte-identical to Sierpinski Carpet, a falsifiable deterministic baseline | Repeat, whose step is a Fork → Atop — a genuinely new *shape*, zero new primitives | ✅ Implemented |
| **Voronoi Islamic** (`voronoiIslamic.js`) | Islamic Geometric Patterns' rosette construction, reused unmodified, seeded from Voronoi's stochastic point source instead of a regular grid | Constant-bind → Atop → Atop → Fork → Atop — one new primitive (`nearestNeighbourDistances`), zero new patterns | ✅ Implemented |
| **Voronoi Islamic (Improved)** (`voronoiIslamicV2.js`) | The same rosette-on-Voronoi idea as above, deliberately simplified: cell lookup is the only thing that changes, with no per-cell radius adaptation — see [`docs/generators/voronoi-islamic-v2.md`](docs/generators/voronoi-islamic-v2.md) for how the two versions answer different questions | Same pattern as Voronoi Islamic, minus the extra per-cell adaptation stage | ✅ Implemented |

All three are raster-only (`nativeFormat: "raster"` — no SVG renderer; see
each generator's own header comment for why) and fully covered by the same
property-based test suite standard as the core seven.

### Additional generators

Two further generators — Wave / Concentric Rings and Grid Tessellations —
support the core five without adding a distinct spectrum position or
composition pattern of their own, for two different reasons:

* **Wave** (rings mode) uses the *same* composition pattern as Voronoi
  (constant-bind → atop), just against a single fixed point instead of a
  searched set of seed points. It doesn't introduce anything new
  compositionally — that's exactly what makes it useful pedagogical
  scaffolding: a simpler first appearance of the pattern Voronoi later shows in
  full.
* **Grid** is now fully decomposed — each of the five tiling shapes' index
  arithmetic lives in `lib/latticeIndex.js`, composed with the same
  colour-mapping stage every other generator uses. Checking that decomposition
  answered the open question in
  [`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`](docs/ALGORITHMIC_COMPOSITION_RESEARCH.md):
  the arithmetic doesn't reduce to the existing `partition.js` primitive (a
  tiling has no finite point set to search against), so it's a sixth
  reusable primitive family rather than a `partition.js` in disguise. It's
  supporting material because it doesn't add a distinct spectrum position or
  composition *pattern* of its own (Atop, the same as Voronoi/Wave) — not
  because its status is unresolved.

Both also support the benchmark suite ([`docs/results/benchmark-results.md`](docs/results/benchmark-results.md)) as a
byproduct of sharing the same primitive library.

---

# Educational Interface

The secondary, demonstration-layer contribution of the project is an interactive
algorithm explorer that makes the compositional structure identified in
[`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`](docs/ALGORITHMIC_COMPOSITION_RESEARCH.md)
visible to a learner.

Instead of exposing only parameter controls, each generator is represented as a visual workflow composed of algorithmic stages.

Users can:

* Explore the structure of each algorithm
* Manipulate parameters at individual stages
* Observe live updates to generated patterns
* Learn the computational concepts represented by each operation
* Compare stochastic and deterministic approaches
* Browse a curated Gallery of example patterns

The educational interface transforms procedural generation from a hidden implementation into an explorable learning experience.

### Design Evolution

This interface design builds directly on a previous undergraduate R&D project: an Islamic geometric pattern generator implemented as a Houdini Digital Asset (HDA). That system used parameterised shape grammars to drive pattern generation, but kept the procedural graph hidden — users interacted only with a curated parameter panel, and could produce valid outputs without understanding the computational process behind them.

The dissertation inverts this approach. Rather than abstracting the algorithm away, the node-based workspace surfaces it as the primary learning object. The shift is from *design accessibility* to *educational accessibility* — from helping users use a procedural tool, to helping them understand how one works.

![Design evolution from a procedural design tool to an educational algorithm interface](docs/figures/fig-design-evolution.svg)

---

## Minimum Viable Product

### Pattern Generators

Core spectrum (Generative Spectrum, above):

* Perlin / Ridge Noise
* Voronoi Diagrams
* Escher-inspired Tessellations
* Recursive / Fractal (Sierpinski)
* Islamic Geometric Patterns

Additional generators (support the core five without a distinct spectrum position or composition pattern of their own — see Generative Spectrum above):

* Wave / Concentric Rings
* Grid Tessellations (square, hex, triangle, brick, diamond)

Hybrid generators (secondary research question — see Hybrid generators above):

* Perlin Sierpinski
* Voronoi Islamic
* Voronoi Islamic (Improved)

### Algorithm Explorer

* Interactive visual workflow
* Custom algorithm nodes
* Stage-by-stage parameter editing
* Live pattern updates
* Educational explanations for each computational concept

### Export

* PNG export
* SVG export (where supported)

---

## Target Audience

The application is intended for:

* Students learning programming and computational thinking
* Learners exploring generative art
* Creative coders
* Designers interested in procedural workflows
* Educators teaching algorithmic concepts through visual media

---

## Evaluation

This evaluates the demonstration layer (the Demonstration Question above) — it
does not evaluate the algorithmic composition claim, which is established
independently through the analysis in
[`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`](docs/ALGORITHMIC_COMPOSITION_RESEARCH.md)
and the property-based test suite (`src/generators/__tests__/`).

The project was evaluated through two user studies (see `docs/evaluation/`
for the full design, instruments, and results), focusing on:

* Usability
* Learning experience
* Understanding of computational concepts
* Understanding of algorithmic workflows
* Relationship between parameter changes and visual outcomes
* Perceived educational value

---

## Technical Architecture

The application is built using a modular architecture that separates pattern generation from educational visualisation.

Core design principles include:

* Generators composed from a shared primitive library (`src/generators/lib/`),
  each primitive corresponding to one conceptual node in `docs/nodes/` — see
  [`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`](docs/ALGORITHMIC_COMPOSITION_RESEARCH.md)
  for how each generator's composition is analysed
* A generator contract ([`docs/GENERATOR_CONTRACT.md`](docs/GENERATOR_CONTRACT.md)) verified by a
  property-based test suite (`src/generators/__tests__/`)
* Modular parameter system
* Interactive node-based algorithm visualisation
* Extensible educational content
* Real-time procedural rendering
* Vector and raster export

---

## Future Work

The current MVP focuses on helping users explore and understand predefined generative algorithms through an interactive visual interface. Several extensions could further develop the application into a richer educational platform.

### Grammar-Based Pattern Construction

*Speculative future work, out of current scope — distinct from the current
composition research in [`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`](docs/ALGORITHMIC_COMPOSITION_RESEARCH.md),
which analyses composition patterns already present in the codebase rather than
building a user-facing authoring language or grammar.*

A natural progression of the algorithm explorer would be to support user-created generative workflows. Rather than interacting with predefined algorithms, learners could construct their own pattern generators by composing reusable computational operations.

Drawing inspiration from **shape grammars**, **tree grammars**, and **functional combinators**, each visual node could represent a modular rule such as:

* Generate Grid
* Apply Symmetry
* Repeat
* Rotate
* Mirror
* Subdivide
* Add Randomness
* Render

Users could connect these operations to create new procedural workflows while learning how complex algorithms emerge from simple computational building blocks.

### Interactive Algorithm Authoring

The current visual workspace is designed as an educational algorithm explorer. Future versions could evolve into a guided authoring environment, allowing users to experiment with their own computational rules while maintaining valid graph structures through predefined constraints and validation.

This approach would encourage learners to transition from understanding existing algorithms to designing their own procedural systems.

### Guided Learning Pathways

Additional educational content could include:

* Step-by-step tutorials
* Interactive programming exercises
* Progressive difficulty levels
* Classroom lesson plans
* Self-assessment activities

### Additional Generative Systems

Future versions could introduce further procedural techniques for comparison, including:

* L-Systems
* Reaction–Diffusion Systems
* Cellular Automata
* Fractal Generation
* Aperiodic monotile tiling (the "hat" and "spectre" — Smith, Myers, Kaplan &
  Goodman-Strauss, 2023 — the recent resolution of the "Einstein problem").
  Full feasibility discussion, references, and honest assessment against
  this project's composition vocabulary in
  [`docs/research-plans/EINSTEIN_APERIODIC_STRETCH.md`](docs/research-plans/EINSTEIN_APERIODIC_STRETCH.md):
  the construction's hierarchical substitution system doesn't obviously fit
  the per-pixel atop/fork/constant-bind/repeat vocabulary used by every
  current generator, which is itself a useful data point for the primary
  research question rather than a reason to skip the citation.
* Agent-Based Systems

These additions would broaden the range of computational paradigms available for exploration while reinforcing the project's objective of making generative algorithms accessible through interactive visual learning.


---

## Project Status

**Complete — MSc Dissertation Project**

* Generator composition analysed against the vocabulary in
  [`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`](docs/ALGORITHMIC_COMPOSITION_RESEARCH.md)
  (primary research contribution), with empirical and structural checks on
  the declared stochastic/deterministic `spectrum` values in
  [`docs/results/spectrum-metrics-results.md`](docs/results/spectrum-metrics-results.md) and
  [`docs/results/spectrum-structural-results.md`](docs/results/spectrum-structural-results.md)
* Core and hybrid generators implemented, covered by the property-based test
  suite
* React Flow algorithm explorer and educational layer built, including the
  pattern Gallery
* User evaluation of the demonstration layer designed and conducted — see
  `docs/evaluation/` for both studies' results
