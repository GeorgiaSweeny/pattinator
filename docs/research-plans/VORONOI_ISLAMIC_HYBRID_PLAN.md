# Voronoi-Seeded Islamic Tiling — Research Plan

## Status

**Implemented**, 2026-08-21, the same day as this plan. Written *before*
any code, so the dissertation's account of "how" and "why" doesn't have
to be reconstructed after the fact from commits and test diffs — the
sections below record the research question, the design space actually
considered, and the reasoning behind the choices made, in that order,
following the same-day discussion that selected this hybrid over the
alternatives in `docs/planning/plan-checklist.md`'s deferred list (a Voronoi-
seeded Escher tessellation, and a noise/reaction-diffusion-driven
Islamic pattern). References researched and added the same day (§8) —
see that section for how each source is actually load-bearing against a
specific design decision above, not just a reading list.

Built as `src/generators/voronoiIslamic.js` (registry id
`voronoi-islamic`), following M1-M4 below almost exactly as planned: the
§3.2 "v2" nearest-neighbour radius was built directly rather than
starting from "v1" and upgrading later (the plan's own reason for
sequencing v1 first — isolating whether the rest of the pipeline works
before adding v2's extra precomputation — was already covered by writing
the property tests against the real thing rather than an intermediate
version). §4's predicted structure held: **one new primitive**
(`nearestNeighbourDistances`, promoted to `lib/seedPoints.js` as the plan
leaned toward) and **zero new composition patterns** — see
`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`'s composition table for the
actual-vs-predicted comparison. M5 (an SVG renderer) remains an unbuilt
stretch goal, exactly as scoped in §3.5 — this pattern's `nativeFormat`
stays `"raster"`.

**Follow-up, same day**: `variation` (opt-in, default 0) added to §3.3's
uniform-by-default construction — see that section's own updated
paragraph for what it does and why it doesn't retract the original
decision. Every test and finding above was checked against `variation`'s
default (uniform construction); nothing in this Status section needed
correcting once it was added.

**Second follow-up, same day**: direct feedback after using it — §3.1's
self-contained cells, correct on their own terms, meant no line ever
connected one cell's medallion to its neighbour's, so the result read as
scattered stars on a map rather than an Islamic *tiling* (real girih
patterns get their character from adjacent motifs meeting at shared tile
edges — exactly what §8's Kaplan & Salesin "polygons in contact" citation
describes). Added a second, independent line test for the Voronoi cell
boundary itself, combined with the existing star-silhouette line test by
OR — `lib/distanceField.js`'s new `nearestTwoPoints` (a pixel is exactly
on its own cell's edge where equidistant from its two nearest seeds, the
standard per-pixel Voronoi-edge proxy), still no real cell-polygon
construction, so §3.1's own decision stands unchanged. One further new
primitive; see `docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`'s composition
table for the updated finding.

## 1. Motivation and the research question this tests

`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md` frames two research questions:

- **Primary**: is the whole spectrum of generative pattern algorithms
  (stochastic → deterministic) built from a minimal library of reusable
  primitives?
- **Secondary**: do hybrid/composed generators extend or stress this
  compositional model — do they need genuinely new composition patterns,
  or do they recombine what's already there?

`recursiveNoise.js` (the one hybrid built so far, Aug 7-9) answered the
secondary question with a mixed result: it needed a genuinely new
*shape* (a Fork living inside a Repeat's step) but *zero* new
*primitives*. The Islamic Rosette rebuild (2026-08-20, this same
session) answered a related question for the primary RQ with the
opposite mix: the accurate construction reused an existing *pattern*
(Fork, previously unique to `escher.js`) but needed *four* new
primitives (`pointInPolygon`, `lineIntersect`, `starOutline`,
`bandTone`) to get there — see `docs/generators/ISLAMIC_PATTERN_CONSTRUCTION.md`
and `docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`'s composition table.

A Voronoi-seeded Islamic tiling is chosen over the two alternatives
specifically because it targets a *third*, more direct version of the
primary RQ that neither existing data point covers: **does the
"which cell am I in → build a rosette there" pipeline generalise from a
regular point source to *any* point source, stochastic included?**
`lib/constructionCircle.js`'s own header comment already frames this as
an open comparison, unprompted, before this hybrid was proposed:

> Together these are the deterministic counterpart to Seed Points
> (`src/generators/lib/seedPoints.js`): both produce a point set that
> Distance Field (`nearestPoint`) can search, but Seed Points scatters
> points with an RNG while Radial Divisions places them at fixed angles
> around a centre. Same downstream primitive, two different
> point-generation strategies — one stochastic (Voronoi), one
> deterministic (Islamic Geometric Patterns).

And `lib/seedPoints.js`'s own header comment names this exact hybrid as
a reason the primitive exists in its current general form:

> Currently used by Voronoi; any future generator that needs a random
> point cloud (e.g. a Voronoi-seeded hybrid) draws from here too.

So this hybrid isn't a novel idea invented for the dissertation — it's
closing a comparison the codebase's own primitive documentation already
set up. That's worth stating plainly in the write-up: the plan is to
*test* a claim the architecture implies, not to retrofit a
justification onto an arbitrary combination.

## 2. What already exists to build on

Surveyed before designing anything new, per this project's own
established practice (`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`'s
whole method) of checking for reuse before adding primitives:

| Piece | File | What it gives this hybrid |
|---|---|---|
| Stochastic point cloud | `lib/seedPoints.js` (`generateSeedPoints`) | `(numPoints, seed) => Float32Array` — identical to what `voronoi.js` uses, no changes needed |
| Nearest-point search | `lib/distanceField.js` (`nearestPoint`) | `(x, y, points) => {index, distSq}` — tells a pixel which seed (cell) it belongs to |
| Deterministic rosette construction | `lib/constructionCircle.js`, `lib/starPolygon.js` | `constructionCircle`, `radialDivisions`, `starOutline`, `starSkip` — the whole silhouette-building pipeline from the 2026-08-20 rebuild, entirely reusable as-is once a cell has a centre and radius |
| Signed distance to the silhouette | `lib/distanceField.js` (`nearestSegmentDistSq`, `pointInPolygon`) | Reused verbatim from `islamic.js` — the per-pixel Fork that turns a local (x, y) into signed distance |
| Tone banding | `lib/colourMapping.js` (`toneSet`, `bandTone`) | Reused verbatim |

Notably absent from this list: anything that computes an actual
Voronoi *cell polygon*. `islamic.js`'s raster renderer never needed one
for the regular-grid case either — it only ever needed a **centre** and
a **radius**, both computed in closed form from `tileSize`. The
question this design has to answer is what replaces "closed form" once
the tiling is irregular.

## 3. Design decisions considered

### 3.1 What is a Voronoi cell's "centre," without computing the cell polygon?

**Decision: the seed point itself.** `nearestPoint(x, y, seedPoints)`
already returns `index` — the seed a pixel's cell belongs to.
`seedPoints[index]` *is* that cell's centre by definition (a Voronoi
cell is exactly the set of points closer to its own seed than to any
other), so no separate centroid computation is needed at all. This is
the same simplification `voronoi.js` itself relies on implicitly: it
never computes cell polygons either, only membership. Rejected
alternative: compute the true Voronoi cell polygon (via the
half-plane-clipping approach `voronoi-svg.js`/`islamic-svg.js`'s
`_squarePattern` clipping already uses) and use *its* centroid —
correct in principle, but unnecessary for the raster renderer (which
never draws cell boundaries, only asks "signed distance to a rosette
centred here"), and would reintroduce per-pixel cost this hybrid
doesn't need to pay. Worth revisiting only if the SVG renderer (§3.5)
needs actual cell boundaries to clip against.

**Still no real cell polygon, even once cell boundaries themselves
became visible (2026-08-21 follow-up, Status section above).** Drawing
the boundary as a *line* doesn't need the boundary as a *polygon*: the
boundary is exactly where a pixel is equidistant from its two nearest
seeds, which `nearestTwoPoints` (`lib/distanceField.js`) answers directly
from the same brute-force search `nearestPoint` already did — no clipping,
no vertex list, no change to this section's own decision.

### 3.2 Medallion radius: cells aren't a fixed size any more

This is the one place `islamic.js`'s existing design doesn't transfer
directly. Its `scale` param assumes every tile is the same size, so
`radius = tileSize * scale` is always safe (self-contained, no overlap
with neighbours). Voronoi cells vary in size — by construction, uniform
random points have high-variance nearest-neighbour spacing, so *any*
fixed radius will look right in some cells and overflow into a
neighbour's cell in others.

Two options, not mutually exclusive — planned as two milestones (§5),
not a single decision:

- **v1 — statistical estimate.** `radius = scale * CANVAS.WIDTH /
  sqrt(numCells)`, the expected spacing for `numCells` uniform points
  over the canvas area. Cheap (one number, no new computation), and
  correct *on average*, but will visibly overflow in denser-than-average
  regions (an inherent property of a Poisson-ish point process, not a
  bug to "fix" so much as a documented limitation of the simple version).
- **v2 — per-seed nearest-neighbour radius.** For each seed point,
  precompute the distance to its own nearest *other* seed once
  (constant-bind stage, O(n²) over the seed set — n is `numCells`,
  typically small, same cost class as `generateSeedPoints` itself), then
  `radius[index] = scale * nearestNeighbourDist[index]`. Correct
  per-cell rather than on average; the real fix. Whether this becomes
  its own `lib/` primitive (e.g. `seedPoints.js` gaining a
  `nearestNeighbourDistances(points)` export) or stays local to this
  hybrid's own file is an open question to resolve once written — see
  §6. Leaning toward promoting it to `lib/`: it's a generic "for each
  point in a set, how close is its nearest neighbour" query, not
  Islamic-specific, and the project's own precedent
  (`docs/GENERATOR_CONTRACT.md`'s shared-primitives table) is to
  extract anything that isn't tied to one generator's specific meaning.

Building v1 first, deliberately: it isolates whether the *rest* of the
pipeline (membership lookup → local coordinates → existing Fork →
existing banding) works at all before adding the extra precomputation
v2 needs, and gives an early, cheap falsifiable checkpoint (see §5's
milestone breakdown).

### 3.3 Uniform construction across cells, vs randomising per cell

**Decision: uniform.** `segments`, `rotation`, and (subject to §3.2)
`scale` stay the same fixed values for every cell — only the *centres*
are stochastic. Rejected alternative: also randomise `segments`/
`rotation` per cell (seeded from the same RNG) for a more visually
varied, organic result. Rejected for the first version specifically
*because* it would confound the experiment: the question this hybrid
asks is "does the same downstream construction work when driven by an
irregular point source," and that comparison is only clean if the
downstream construction is held constant — exactly parallel to how
`radialDivisions`'s own header comment frames the original
regular-vs-stochastic comparison ("everything downstream of the point
set is the *identical* composition" is the claim under test; changing
the downstream construction too would make it untestable). Per-cell
randomisation is a legitimate follow-up extension once the base
comparison is established, not a first-version feature.

**Follow-up (2026-08-21, same day)**: built as exactly that — a
`variation` param (default `0`), opt-in and additive rather than a change
to the default. At `0`, `voronoiIslamic.js`'s `cellVariation()` returns
`segments`/`rotation` completely unchanged (an exact, tested identity,
not an approximation), so every finding above still describes this
hybrid's default behaviour. Above `0`, each cell's own `segments`/
`rotation` are independently nudged by a deterministic offset seeded from
`(seed, cellIndex)` — reusing `lib/rng.js`'s existing `xorshift32Unit`,
not a new RNG primitive — so the base comparison (uniform construction)
and the visually richer one (varied construction) are now both available
from the same generator, as one continuous knob, rather than the plan
having to choose only one for the dissertation write-up.

### 3.4 Self-contained cells vs neighbour search

**Decision: self-contained**, matching the current (2026-08-20)
`islamic.js` design rather than its earlier, superseded neighbour-
searching `star-lines` construction (see
`docs/generators/ISLAMIC_PATTERN_CONSTRUCTION.md`'s "Final construction" section
for why that was retired even for the regular grid). With `radius`
chosen conservatively relative to actual local cell size (§3.2, v2
especially), each rosette should stay within its own cell without
needing to search neighbouring cells for the nearest chord — simpler,
and consistent with the architecture this hybrid is built to extend
rather than diverge from.

### 3.5 Raster first; SVG is a stretch goal, not a v1 requirement

`islamic-svg.js`'s `_squarePattern`/`_hexPattern` cell layouts both
exploit knowing the tiling in closed form ahead of time (a repeating
`<pattern>` tile, native to SVG). A Voronoi tiling has no such repeating
unit — every cell is a one-off, so an SVG version would need to
actually draw each cell's clip polygon individually (reusing the
Sutherland-Hodgman half-plane clipping `voronoi-svg.js` already
implements for exactly this purpose) rather than relying on
`<pattern>` tiling at all. That's a real, separate piece of work, and
this pattern's `nativeFormat` can reasonably stay `"raster"` (like
`recursiveNoise.js`, the existing hybrid) for the first version — the
compositional research question this hybrid exists to test doesn't
depend on having a vector export.

## 4. Predicted compositional structure (a hypothesis, not a result yet)

Written down now, before implementation, specifically so it can be
checked against what actually gets built rather than reasoned about
only in hindsight:

**Constant-bind** (seed points, and — v2 — per-seed radius) **→ Atop**
(`nearestPoint` for cell membership) **→ Atop** (translate to local
coordinates relative to the owning seed) **→ Fork** (`islamic.js`'s
existing `nearestSegmentDistSq` + `pointInPolygon` pair) **→ Atop**
(banding, `bandTone`).

If that holds, the predicted finding is: **this hybrid needs zero new
primitives** (v1) **or one** (v2, if `nearestNeighbourDistances` is
promoted to `lib/`) — a direct, informative contrast with both existing
data points. `recursiveNoise.js` needed a new *pattern* with zero new
primitives; the Islamic rebuild needed an existing *pattern* but four
new primitives; this hybrid, if the prediction holds, needs an existing
pattern (Atop chain, same shape `voronoi.js` and the rebuilt
`islamic.js` already use individually) *and* at most one new primitive
— the "cheapest" of the three, because it's recombining two pipelines
that were already fully decomposed into `lib/` primitives rather than
building new geometry from scratch. That contrast — cost of composition
dropping once the pieces being composed are already well-factored — is
arguably the more interesting dissertation point than any single
hybrid's own result, and this is exactly the kind of claim that needs
checking against the real implementation before being written up as a
finding.

## 5. Implementation milestones

Mirrors how `recursiveNoise.js` was actually built (one file, reusing
existing `lib/` primitives, property tests including a falsifiable
baseline, then registry/workflow wiring) rather than a from-scratch
process.

1. **M1 — core generator, v1 radius, raster only.**
   `src/generators/voronoiIslamic.js`. Params: `numCells`, `seed`
   (from `voronoi.js`'s side), `segments`, `scale`, `frequency`,
   `lineWidth`, `tones` (from `islamic.js`'s side — reused directly,
   not reinvented). A falsifiable baseline to test directly, the same
   way `recursiveNoise.js`'s `amplitude = 0` case is checked against
   `recursive.js`: `numCells = 1` should place a single rosette at that
   one seed point, structurally identical to what `islamic.js` computes
   for one tile once local coordinates are relative to that same
   centre — not byte-identical (the two generators' radius formulas
   differ, tile-relative vs canvas-relative), but the *shape* comparison
   (silhouette geometry, band structure) should match exactly at equal
   radius, which is a real, checkable property test.
2. **M2 — property tests.** Contract tests (range, determinism,
   totality) come free from `contract.generic.test.js` once registered.
   Dedicated tests: the M1 baseline above; that every pixel's nearest
   seed index is consistent with which rosette center its signed
   distance was computed against (no cross-cell leakage); determinism
   across repeated calls; that increasing `numCells` doesn't break
   totality at the registry's declared extremes (mirrors this session's
   own "check the full declared param range, not just the values
   already spot-checked" lesson from the Islamic rebuild's `segments`
   3-16 bugs — see `docs/generators/ISLAMIC_PATTERN_CONSTRUCTION.md`).
3. **M3 — v2 radius (nearest-neighbour-derived).** Only after M1/M2
   establish the rest of the pipeline works; isolates whether any
   visual/structural problems come from the pipeline shape or from the
   radius heuristic specifically.
4. **M4 — registry entry, workflow wiring, docs.**
   `patternRegistry.js` (new entry, `category: "Hybrid"`, following
   `perlin-sierpinski`'s exact precedent), `workflows.js` (`STEP_DEFS`/
   `PARAM_NODE_MAP` — the node sequence is predicted to be `Workspace →
   Seed → Seed Points → Construction Circle → Radial Divisions →
   Distance Field → Colour Mapping → Render`, i.e. Voronoi's own opening
   two nodes feeding directly into Islamic's existing tail, which — if
   accurate — is itself a visible, citable confirmation of the
   composition-table prediction in §4), a `docs/nodes/WORKFLOWS.md`
   entry.
5. **M5 (stretch) — SVG renderer.** Per §3.5, only if time allows after
   the raster version and its research write-up are solid.

## 6. Open questions — resolved during implementation

- Does `nearestNeighbourDistances` belong in `lib/seedPoints.js` or stay
  local to this one hybrid file? **Resolved: `lib/seedPoints.js`**, as
  leaned toward — it's a generic point-set query with no Islamic-specific
  meaning, and nothing about its actual implementation (a plain O(n²)
  brute-force nearest-neighbour scan, same cost class as
  `generateSeedPoints` itself) argued against that once written.
- Does the "shared pipeline actually matches at equal radius" claim hold
  exactly, or only approximately? **Resolved: exactly**, but not via the
  originally-suggested `numCells = 1` comparison — `generateSeedPoints`
  enforces a floor of 2 points, so there's no true single-cell case to
  test. Instead `voronoiIslamic.property.test.js` uses an independent
  oracle built directly from the same `lib/` primitives (mirroring
  `islamic.property.test.js`'s own oracle test), which holds as an exact
  `toBe` match across the full declared param range, not an approximate
  `toBeCloseTo` — a stronger check than the originally-planned baseline
  would have given anyway.
- Was `scale`'s registry range `[0.2, 0.48]` (islamic.js's own) still
  numerically appropriate against nearest-neighbour distance rather than
  tile size? **Resolved: kept as-is**, since the parameter's *role*
  (fraction of locally available space before a rosette stops being
  self-contained) is identical either way and nothing in visual testing
  argued for a different range — but the registry's *other* defaults
  needed retuning (`numCells: 15` not 20, `scale: 0.35` not 0.42,
  `frequency: 2` not 3, `lineWidth: 0.05` not 0.06): at `islamic.js`'s
  own defaults, larger Voronoi cells produce a large radius and, since
  echo spacing is `radius / frequency`, far more concentric rings than a
  fixed-size tile ever does, which read as dense interference noise
  between medallions rather than legible rosettes. Lower `frequency` and
  a smaller `scale` keep the same construction legible against variable
  cell sizes — a real, visually-confirmed consequence of §3.2's "radius
  isn't a canvas-wide constant any more" that the plan named as a
  possibility but didn't fully work through in advance.

## 7. Known limitation found during visual verification

Rendering the shipped defaults at a few different `seed` values surfaced
a real artifact §3.2's "v2" radius doesn't fully account for: uniform
random points occasionally land very close together by chance (a
property of Poisson-ish point processes, not a bug in
`nearestNeighbourDistances` itself), producing a near-zero radius for
that cell. The resulting medallion is so small that its echo rings (echo
spacing is `radius / frequency`, unchanged from `islamic.js`) collapse to
sub-pixel spacing, aliasing into a dense noise patch rather than a
legible tiny rosette — visible in several of the seeds checked during
implementation (not cherry-picked away). Not fixed here: doing so would
mean either a minimum-radius floor (breaking the "radius reflects actual
local spacing" property the whole point of v2 was to get right) or
excluding degenerate close pairs from the seed set (a different design
decision the plan above didn't consider, and one with its own
statistical consequences for the point process). Left as an honestly
documented, visually-confirmed limitation of the per-cell nearest-
neighbour radius approach — worth a paragraph in the write-up rather than
quietly tuned away, and a natural follow-up open question for anyone
extending this hybrid.

## 8. References

Checked against the project's existing bibliography
(`docs/references/MSc Project Proposal_Georgia Sweeny.pdf`) before
adding anything, rather than assembled independently of it.

- Kaplan, C.S. & Salesin, D.H. (2004). "Islamic Star Patterns in
  Absolute Geometry." *ACM Transactions on Graphics*, 23(2), 97–119.
  The rigorous academic source for Hankin's "polygons in contact"
  method — cited here (§1, §3) as the proper grounding for the
  deterministic side of this hybrid's construction, replacing the
  Wikipedia article `docs/generators/ISLAMIC_PATTERN_CONSTRUCTION.md` relied on
  for the same underlying claim (its own "one polygon of a specific
  size sets its own star" framing) when the 2026-08-20 `starSkip`
  fix was made — see that document's own note on the update.
- Kaplan, C.S. (1999). "Voronoi Diagrams and Ornamental Design."
  The most direct precedent for this specific hybrid found: the same
  researcher explicitly using Voronoi diagrams for ornamental pattern
  generation, rather than this being an unprecedented combination.
  Relevant throughout §3 (design decisions) as prior art to check this
  plan's choices against once drafting the write-up, not just cited in
  passing.
- Kaplan, C.S. (2000). "Computer Generated Islamic Star Patterns."
  *Bridges 2000 Proceedings*. The earlier, more informal version of the
  2004 paper above — useful for the construction's intuition/exposition
  rather than as the rigorous source.
- Kaplan, C.S. (2005). "Islamic Star Patterns from Polygons in
  Contact." *Graphics Interface 2005*. A later refinement of the same
  method; worth checking against §3.2's own radius derivation once that
  section moves from plan to implementation, in case it suggests a
  closed-form alternative to the nearest-neighbour heuristic proposed
  there.
- Okabe, A., Boots, B., Sugihara, K., & Chiu, S.N. (2000). *Spatial
  Tessellations: Concepts and Applications of Voronoi Diagrams* (2nd
  ed.). Wiley. The standard foundational Voronoi text — specifically
  relevant to §3.2's v2 radius heuristic (nearest-neighbour distance
  for a set of random points), which this book treats as a studied
  quantity (Poisson-Voronoi nearest-neighbour distributions) rather
  than something to derive from scratch. Worth citing in the write-up
  to ground that design decision in existing theory instead of
  presenting it as purely empirical.
- Washburn, D.K. & Crowe, D. (1988). *Symmetries of Culture: Theory
  and Practice of Plane Pattern Analysis*. University of Washington
  Press. Already in the existing bibliography; the relevant use for
  *this* document is §3.3's tension between a locally-symmetric motif
  (the rosette, with its own dihedral symmetry — see this same
  session's `rotation` feature and its `180/n` reflection-axis
  argument in `docs/generators/ISLAMIC_PATTERN_CONSTRUCTION.md`) and a globally
  asymmetric, stochastic placement (the Voronoi cells) — worth a
  paragraph in the write-up framed in this book's own symmetry-group
  vocabulary rather than reasoned about informally.

