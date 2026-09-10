# MoSCoW Priorities — Full Project Scope

This is the single consolidated priority table for everything scoped in the
project. It merges three sources that each carry a partial view of priority:

* [`README.md`](../README.md) — MVP feature list (no priority tags)
* [`docs/PROJECT_SPECIFICATION.md`](PROJECT_SPECIFICATION.md) — user/functional
  requirements and an explicit Out of Scope section
* [`docs/evaluation/educator-consultation-user-stories.md`](evaluation/educator-consultation-user-stories.md) —
  44 UX/pedagogy user stories already tagged Must/Should/Could/Future

Where the source docs disagreed on emphasis, priority here follows
[`docs/planning/plan-checklist.md`](plan-checklist.md)'s "Priorities if time runs short"
ranking, since that's the one built under the actual time constraint.

Priority definitions used throughout:

* **Must** — required for either the primary (algorithmic) or secondary
  (demonstration) research contribution to stand on its own. Project fails
  without it.
* **Should** — materially strengthens the contribution; ship if the schedule
  allows.
* **Could** — adds value but the project is coherent without it; first to
  flex if time is short.
* **Won't (this project)** — explicitly out of scope per
  `PROJECT_SPECIFICATION.md`'s System Constraints / Out of Scope sections, or
  deferred to Future Work in `README.md`.

---

## 1. Pattern Generators (primary research contribution)

| Item | Priority | Notes |
|---|---|---|
| Perlin/Ridge Noise generator | Must | Implemented. Only fold/reduce composition example. |
| Voronoi Diagrams generator | Must | Implemented. Constant-bind → atop. |
| Escher-inspired Tessellations generator | Must | Implemented. Only cross-fork example. |
| Recursive/Fractal (Sierpinski) generator | Must | Implemented. Repeat/power composition. |
| Islamic Geometric Patterns generator | Must | Implemented (`islamic.js`) — 5th core spectrum position, deterministic mechanism (Distance Field over a fixed radial point set, no RNG) distinct from recursive's repeat/power. |
| Wave/Concentric Rings generator | Should | Implemented. Pedagogical scaffolding for Voronoi's pattern; not a distinct spectrum/composition position. |
| Grid Tessellations generator | Should | Implemented. Fully decomposed via `lib/latticeIndex.js` (composition question resolved in `ALGORITHMIC_COMPOSITION_RESEARCH.md` — not a `partition.js` reuse, a sixth reusable primitive family). |
| Generator contract (`GENERATOR_CONTRACT.md`) | Must | Verified by automated property-based tests, not manual inspection (non-functional requirement). |
| Property-based test suite, all 7 generators | Must | Primary contribution's success criterion is defensible, test-backed composition analysis. |
| Registry/generator param-consistency guard | Must | `registry.params-consistency.test.js` — same rigor bar; caught a live bug (`recursive-svg.js` ignoring `mode`) during the Aug 2-6 wiring work, since fixed. Extended 2026-08-21 to cover every pattern's `tones`/`colourN` params and raster patterns' `colour1`/`colour2` (checked against `render.js`'s `mapColour`, not the generator itself — see that file's own header comment for the "Colour Mapping is a separate stage" reasoning). |
| `lib/` primitive decomposition per generator | Must | Required so the composition analysis in `ALGORITHMIC_COMPOSITION_RESEARCH.md` is checkable against real code, not just claimed. |
| `noise.js` and `recursive.js` internals decomposed into `lib/` primitives | Could | Done — `lib/fold.js`, `lib/repeat.js`; both existing property-test suites pass unchanged. |
| `recursive.js` `mode` param behaviour decided | Could | Done — `grid` mode accumulates per-level cell parity (self-similar checkerboard, no holes), distinct from `sierpinski`'s centre-cell exclusion. |

## 2. Compositional/Hybrid Generators (secondary research question)

| Item | Priority | Notes |
|---|---|---|
| Perlin-perturbed recursive subdivision hybrid | Must | Done — `recursiveNoise.js` (`perlin-sierpinski`). `amplitude = 0` is byte-identical to Sierpinski Carpet, a falsifiable baseline; needed a genuinely new composition *shape* (Repeat whose step is a Fork) but zero new primitives. `scale`/`octaves` (noise.js's own params) exposed 2026-08-21 for a richer parameter sweep. |
| Voronoi-seeded Islamic tiling hybrid | Must | Done — `voronoiIslamic.js` (`voronoi-islamic`), built 2026-08-21. Selected over the Escher-tile-placement variant below as the more direct test of the primary RQ (does the "which cell → build a rosette there" pipeline generalise from a regular to a stochastic point source, downstream construction held fixed). One new primitive (`nearestNeighbourDistances`), zero new patterns — full reasoning in `docs/research-plans/VORONOI_ISLAMIC_HYBRID_PLAN.md`. Opt-in per-cell `variation` param added same day for visual range, default 0 (exact identity, doesn't disturb the original comparison). |
| Property tests for built hybrids | Must | Done — same rigor bar as the core 7 generators (`recursiveNoise.property.test.js`, `voronoiIslamic.property.test.js`, plus `lib.seedPoints.test.js` for the one new primitive). |
| Voronoi-seeded Escher tessellation hybrid (random partition drives tile placement) | Could | Not built — distinct from the Voronoi Islamic row above (that one seeds Islamic Rosette's construction, not Escher's). Deferred per `plan-checklist.md`'s Aug 7-9 cut order; the other two hybrids don't depend on it. |
| Noise/reaction-diffusion-driven Islamic pattern hybrid | Could | Cut-order #3 per plan-checklist.md — other two hybrids don't depend on it. |
| Entropy/structure metrics across hybrid params | Must | Done — `structureMetrics.js`/`docs/results/structure-metrics-results.md`, sweeps `recursiveNoise.js`'s `amplitude` against edge density and block-pattern entropy; both increase monotonically, direct quantitative evidence for the continuous stochastic/deterministic spectrum claim. |
| Benchmark suite extended to cover hybrids | Must | Done — `benchmark.js`'s `REPRESENTATIVE_PARAMS`/`PARAM_SWEEPS` cover both `recursiveNoise` and `voronoiIslamic`. |

## 3. Algorithm Explorer / Demonstration Interface

| Item | Priority | Notes |
|---|---|---|
| ReactFlow node graph (all 7 core generators plus 2 hybrids) | Must | Primary demonstration-layer deliverable — the node model *is* the thing being evaluated. |
| Functional page: select generator / view graph / adjust params / canvas updates | Must | MVP interaction loop per `PROJECT_SPECIFICATION.md` User Requirements. |
| Documentation panel per node (name, plain-language explanation, purpose, CT concepts, params) | Must | `PROJECT_SPECIFICATION.md` §Documentation Panel — required, not optional. |
| Real-time canvas rendering, immediate feedback on param change | Must | Core interaction principle; explicit functional requirement. |
| Inspect intermediate algorithm stages | Must | Done (2026-08-21) — `src/app/src/stagePreview.js`, one generic mechanism across all 9 generators (params override for 6, a dedicated small preview renderer for the 3 with no reducing param), previously the single most under-delivered Must relative to the spec calling this "the core contribution of the demonstration layer specifically." Also closed the Documentation Panel's "Visual Example" placeholder as a side effect (same mechanism, thumbnail size). |
| Reset parameters to default | Must | Done (2026-08-21) — one button in `App.jsx`'s status bar. |
| PNG export | Must | Explicit user requirement ("where supported"). |
| SVG export | Should | README MVP lists as "where supported" — secondary to PNG. |
| Component-level tests for the demonstration layer itself | Should | Done (2026-08-21) — `@testing-library/react` + jsdom; `App.test.jsx`/`WorkflowNode.test.jsx`/`DocumentationPanel.test.jsx`, 19 tests. Previously the generator layer's own "verified by tests, not manual inspection" rigor stopped exactly at the boundary of the layer actually being evaluated with users. |
| Documentation/education UI polish beyond MVP loop | Could | Explicitly deferred post-schedule-end in plan-checklist.md's cut order (#4, last to cut — but still not Must). |
| Optional short node-behaviour animations | Could | Spec marks these "optional" explicitly. |
| Visual overlays on canvas | Could | Spec marks these "optional where educationally useful." |

## 4. Educational / Pedagogical UX

Full detail lives in
[`educator-consultation-user-stories.md`](evaluation/educator-consultation-user-stories.md)
(44 stories); summarized here by theme so this table is a complete index.

| Item | Priority | Notes |
|---|---|---|
| Plain-language node documentation, no jargon required | Must | US-1.1, US-3.1 |
| Interface understandable with no programming background | Must | US-1.1 |
| Explorer Mode (step through existing algorithms, no building required) | Must | US-12.5 |
| Visual + interactive + written explanation per node (multi-modal) | Must | US-4.1, US-4.2, US-4.4 |
| Explicit learning objective shown per node/algorithm | Must | US-6.1. Done (2026-08-21) — a new `objective` field per `nodeDocs.js` entry, its own Documentation Panel block. |
| Minimal initial interface, progressive disclosure | Must | US-9.1, US-9.2 |
| Tiered algorithm structure (core/intermediate/advanced) | Must | US-10.1. Done (2026-08-23) — Generator Selection is grouped by category (`entry.category`) in `src/patternRegistry.js`'s own array order, reordered simplest → most complex (Wave, Noise, Tiles, Escher, Voronoi, Islamic, Fractal), with the two Hybrid patterns separated out and listed last since each only makes sense once its own ingredient generators are already understood on their own. `docs/nodes/WORKFLOWS.md`'s §1-9 section order mirrors the same sequence. |
| Adapts explanation depth across learner age/experience | Should | US-1.2 |
| Conceptual (not just surface) explanation per node | Should | US-3.2 |
| Optional animation of node behaviour over time | Should | US-4.3 |
| Guided tutorial on first open | Should | US-5.1 |
| Tooltips/hover help on interface elements | Should | US-5.2 |
| Nodes mapped to CT concepts explicitly (decomposition, iteration, etc.) | Should | US-6.2 |
| Progression indicator ("what I've learned / what's next") | Should | US-6.3 |
| Incremental concept introduction | Should | US-10.2 |
| Recognise shared concepts recurring across algorithms | Should | US-11.1, US-11.2 |
| Technical/mathematical explanation depth (advanced learners) | Could | US-1.3, US-3.3 |
| Contextual "what to try next" prompts | Could | US-5.3 |
| Side-by-side comparison view across algorithms sharing a concept | Could | US-11.3 |
| View underlying source code for a node | Could | US-12.1 |
| Structured lesson/curriculum mode, educator-led sync sessions | Won't (this project) | US-2.2, US-2.3 — Future in source doc |
| Engagement/gamification (challenges, unlocks, achievements) | Won't (this project) | US-7.1–7.3 — Future in source doc |
| Assessment engine (ID animation, rebuild pattern, debug graph, match graph↔output) | Won't (this project) | US-8.1–8.5 — Future in source doc; also explicit Out of Scope ("assessment, grading, progress tracking") in `PROJECT_SPECIFICATION.md` |
| Sandbox Mode (create/save own patterns) | Won't (this project) | US-12.2 — Future in source doc |
| Builder Mode (construct custom node graphs) | Won't (this project) | US-12.3 — Future in source doc; also explicit System Constraint ("shall not allow users to construct new procedural algorithms") |
| Save/share created patterns | Won't (this project) | US-12.4 — depends on Sandbox Mode, itself Won't |

## 5. Evaluation (secondary RQ empirical validation)

| Item | Priority | Notes |
|---|---|---|
| Computational-thinking quiz instrument (pre/during/post) drafted | Must | Done (2026-08-21) — `src/app/src/evaluation/quizContent.js` (12 questions covering all 9 named CT concepts) + `EvaluationOverlay.jsx` (single-instrument pre/post flow, opened from the menu bar, kept separate from the main explorer loop). The Aug-11/12 deliverable per plan-checklist.md is the instrument working, not a completed study — satisfied exactly. |
| In-app concept-check prompts during use | Must | Done (2026-08-21) — `ConceptCheckPrompt.jsx`, triggered once per session per newly-encountered node concept (reuses `nodeDocs.js`'s existing `NODE_DOCS[nodeType].concepts` tagging, not a second mapping). |
| Local, anonymous data capture for the instrument above | Must | Done (2026-08-21) — `evaluationStorage.js`, `localStorage`-backed, downloadable as JSON from the overlay's summary screen. No backend, no accounts — consistent with this project's own System Constraint. |
| Pre/post evaluation data collection + write-up | Must | Not started — requires the instrument above (now built) to actually be run with real participants. Required for the secondary RQ's empirical validation — the project's Success Criteria (`PROJECT_SPECIFICATION.md`) require evidence users actually achieved the listed learning outcomes, not just that the instrument exists. Targeting Aug 31 to leave a buffer before the Sep 11 submission deadline (confirmed 2026-08-23; earlier Sep 7 was a self-imposed buffer date, not the real deadline). |

## 6. Explicitly Out of Scope (Won't Have, any horizon)

Verbatim from `PROJECT_SPECIFICATION.md` §System Constraints / §Out of Scope,
not project-managed as issues:

* User-defined/arbitrary node graph editing, scripting, or code generation
* Collaborative editing
* Animation authoring
* Three-dimensional procedural modelling or physics/simulation systems
* User accounts or cloud synchronisation
* Adaptive learning / intelligent tutoring
* General-purpose procedural modelling (i.e. becoming a visual programming language)

## 7. Future Work (beyond this dissertation, per README)

Speculative extensions explicitly framed as post-project in
`README.md`'s Future Work section — distinct from "Won't" above in that these
are natural next steps rather than deliberately excluded:

* Grammar-based user-authored generative workflows
* Interactive algorithm authoring (guided, constraint-validated)
* Guided learning pathways (tutorials, exercises, lesson plans)
* Additional generative systems: L-Systems, reaction–diffusion, cellular automata, agent-based systems
* Aperiodic monotile tiling (hat / spectre, Smith et al. 2023's resolution of
  the Einstein problem) — references and feasibility assessment in
  `docs/research-plans/EINSTEIN_APERIODIC_STRETCH.md`; likely needs a genuinely new
  composition pattern (hierarchical substitution) beyond atop/fork/constant-
  bind/fold/repeat, so treated as a vocabulary stress-test rather than a
  near-term build

---

## Traceability to GitHub Project

The 18 issues tracked on the
[GitHub Project board](https://github.com/users/GeorgiaSweeny/projects/1)
cover the **currently scheduled slice** of this table (rows tagged Must/Should
within the Jul 10 – Aug 12 window from `plan-checklist.md`), tagged there with
a 6-value Priority field (High/Medium/Low/Possible/Future/Not Doing) rather
than 4-value MoSCoW, to also capture schedule risk. Rows marked Could above
that aren't yet issues (e.g. individual "Won't (this project)" and "Future
Work" rows) are deliberately not on the board — they're scope decisions, not
tasks.
