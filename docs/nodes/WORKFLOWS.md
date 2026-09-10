# Generator Workflows

This document is the bridge between the node library (`docs/nodes/`), the
primitive library (`src/generators/lib/`), and the generators actually
registered in `src/patternRegistry.js` — the original seven (§1-7) plus two
later hybrids (§8-9). For each generator it states the
linear node sequence the ReactFlow workflow view (`docs/design/UI_DESIGN.md`) should
render, cross-checked against what the generator's source code actually
computes — not the aspirational description in `README.md` or
`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`.

Each workflow follows `docs/design/UI_DESIGN.md`'s rules: primarily linear, nodes
hidden (not shown as no-ops) when the current parameter values don't need
them, one node per meaningful conceptual stage. Every node named below has an
entry in `docs/nodes/`; a **Gap** callout marks anywhere the code needs
something the node library doesn't yet cleanly provide.

Read this alongside `docs/GENERATOR_CONTRACT.md` (the `lib/` ↔ node mapping
table) and `docs/ALGORITHMIC_COMPOSITION_RESEARCH.md` (the combinator-vocabulary
analysis of the same generators, one level more abstract than this
document's node-by-node view).

---

## 1. Wave / Concentric Rings (`wave.js`)

```
"wave" mode:  Workspace → Waveform → Colour Mapping → Render
"rings" mode: Workspace → Distance Field → Waveform → Colour Mapping → Render
```

- **Waveform** (`lib/waveform.js`, `sineWave` — new, see below) applies
  `sin(value * frequency)` to either the raw *y* coordinate (`wave` mode) or
  a Distance Field output (`rings` mode, distance to the workspace centre).
- 4 steps (`wave`) or 5 steps (`rings`) — Distance Field is the one
  conditionally-visible node, present only in `rings` mode.

**Gap, now closed**: before this document, `wave.js`'s `Math.sin(...)` call
was a bare leaf with no corresponding node — `docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`
explicitly names `wave.js` (`wave` mode) as "no primitive composition, a base
case." That's a real hole in the node library: the workflow view had nowhere
to put the one computation `wave.js`'s simplest mode actually does. Added
`lib/waveform.js` (`sineWave`) and `docs/nodes/computation/waveform.md` to
close it, and refactored `wave.js` to call it instead of inlining `Math.sin`
(behaviour-preserving — same formula, existing property tests in
`wave.property.test.js` pass unchanged). This is also what `islamic.js`'s
`star-lines` mode reuses (§6) — one new node, immediately shared by two
generators, which is exactly the "small fixed vocabulary" the primary
research question is asking about.

---

## 2. Perlin / Ridge Noise (`noise.js`)

```
Workspace → Seed → Noise → Colour Mapping → Render
```

- **Seed** initialises the Perlin permutation table (`rng.js` underlies
  `patternSystems/noiseLib/perlinNoise.js`).
- **Noise** is one node covering the whole fBm octave loop — `mode: standard`
  vs `mode: ridge` is a parameter on this node (see `docs/nodes/core/noise.md`),
  not two different nodes, since the ridge fold is one extra line over the
  same loop.
- 5 steps total. No conditional nodes — both registry entries (`perlin-noise`,
  `ridge-noise`) use every stage.

**Gap, now closed**: the fBm octave loop used to live inline in `noise.js`,
not as a separate `lib/` primitive the way every other generator's stages did.
Extracted as `lib/fold.js` (`foldOctaves`) — the ridge fold (`mode: ridge`)
stays inline in `noise.js` since it's one line applied *after* the fold
completes, not part of the fold itself. `noise.js` now calls `foldOctaves`
directly; `noise.property.test.js` passes unchanged (behaviour-preserving),
and `lib.fold.test.js` tests the fold combinator independently of Perlin
noise entirely.

---

## 3. Grid Tessellations (`grid.js`)

```
Workspace → Base Geometry (shape) → Lattice Index → Colour Mapping → Render
```

**5 steps, identical for every shape** (square, triangle, hexagon, brick,
diamond) — resolved from what used to be the most significant gap in this
document.

**Gap, now closed.** `docs/design/UI_DESIGN.md` used to document Grid Tessellation
(triangle) as an 8-step `Workspace → Base Geometry → Rotate → Translate →
Repeat X → Repeat Y → Colour Mapping → Render` sequence, conditionally
shortened per shape. But `grid.js` never called anything resembling Rotate,
Translate, Repeat X or Repeat Y for any shape — each shape function computed
a discrete cell index directly from closed-form coordinate arithmetic
(oblique coordinates for triangle, cube coordinates for hexagon, a
running-bond offset for brick, a 45°-rotated frame for diamond), with no
intermediate geometry a Rotate or Translate node could meaningfully show.

This was the same question as `docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`'s
open question 1 (whether the per-shape arithmetic reduces to `partition.js`),
approached from the workflow-legibility side instead of the composition-theory
side — and working through the actual math answers both at once: **no, it
isn't Partition in disguise** (Partition searches a finite point set; a
tiling has no finite point set to search — the resolution below computes each
cell directly), **and it isn't Rotate+Translate+Repeat either** (triangle and
hexagon's coordinate changes are shears, which the Rotate node — rotation
about a pivot, preserving angles and lengths — doesn't represent; forcing
them through Rotate would misrepresent the maths to a learner). The honest
resolution was a new, distinct node:

- Extracted every shape's index arithmetic into
  `src/generators/lib/latticeIndex.js` (`squareIndex`, `triangleIndex`,
  `hexagonIndex`, `brickIndex`, `diamondIndex`) — `grid.js` now composes
  these instead of holding the arithmetic inline. `grid.property.test.js`
  passes unchanged (behaviour-preserving).
- Added the **Lattice Index** node
  (`docs/nodes/computation/lattice-index.md`): "assigns a discrete
  colour-class index to a position within a regular, infinitely repeating
  tiling" — genuinely one node, since every shape's computation has the same
  shape (position → coordinate change → index), even though the coordinate
  change itself differs per shape.
- Updated `docs/design/UI_DESIGN.md`'s worked example (both "Algorithm Workflow" and
  "Stepping Through Algorithms") to the accurate 4-step sequence above, with
  no more per-shape conditional Rotate/Translate nodes.

This was the plan's highest-flagged overrun risk for the Aug 2–6 ReactFlow
block (`docs/planning/plan-checklist.md`) — resolved before that block starts, not
discovered mid-build.

---

## 4. Escher-Inspired Tessellations (`escher.js`)

```
Workspace → Base Geometry (tile size) → Edge Deformation → Colour Mapping → Render
```

- **Base Geometry** here is just `tileSize` — `escher.js` has no separate
  shape-type choice (Type I translation tessellation always starts from a
  square tile; see the file's own header comment).
- **Edge Deformation** (`lib/edgeDeformation.js`, `bump`) is applied
  cross-forked: the *y*-position drives the horizontal edge warp (`dx`) and
  the *x*-position drives the vertical edge warp (`dy`) — the one cross-fork
  composition pattern across all seven generators
  (`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`). This is a single node in the
  workflow view even though it's evaluated twice internally; the fork isn't
  something a learner needs a second node to see, the Documentation Panel
  text for Edge Deformation is where it's explained.
- 5 steps.

**Gap, now closed**: `docs/nodes/pattern/base-tile.md` used to exist as a
*separate* node from `docs/nodes/core/base-geometry.md`, both claiming to be
"Used By: Escher Tessellations" and both describing "the starting shape a
tessellation builds from" — `escher.js` only actually needs one concept here
(`tileSize`). Retired `pattern/base-tile.md`; `core/base-geometry.md` now
states Escher's case explicitly (a single square tile sized by Cell Size, no
Shape Type choice) instead of leaving it implicit. Base Tile's one
unabsorbed parameter (Aspect Ratio) wasn't migrated — `escher.js` never read
it, so it wasn't describing anything real.

---

## 5. Voronoi Diagrams (`voronoi.js`)

```
Workspace → Seed → Seed Points → Distance Field → Colour Mapping → Render
```

- **Seed Points** (`lib/seedPoints.js`) scatters `numCells` points with the
  shared xorshift RNG.
- **Distance Field** (`lib/distanceField.js`, `nearestPoint`) finds the
  nearest seed point per pixel.
- **Colour Mapping** (`lib/colourMapping.js`, `toneSet`) turns `index %
  tones.length` into an output tone.
- 6 steps. No conditional nodes.

No gaps — every stage is already its own `lib/` module. This was originally
the cleanest full decomposition among the six pre-existing generators; all
seven are now fully decomposed (see the gap-summary table at the end of this
document), but Voronoi's is still the simplest to read end-to-end.

---

## 6. Islamic Geometric Patterns (`islamic.js`) — rebuilt 2026-08-20

```
Workspace → Grid → Construction Circle → Radial Divisions → Distance Field → Colour Mapping → Render
```

**One construction, not two — rebuilt 2026-08-20.** This generator
previously had a `mode` param splitting it into `rosette` (banded plain
distance to the nearest of `segments` ring points — level sets were
circles, or a generic regular polygon with no relation to the actual
points) and `star-lines` (raw `{n/k}` star-polygon chords, thresholded
through a sine wave to fake a line width). Neither was an accurate
rosette: `rosette` had no real star geometry at all, and `star-lines`
drew disconnected chords rather than one proportioned star+petal shape.
Flagged as inaccurate, with
`drawingislamicgeometricdesigns.com/basic-rosettes-anthony-lees-methods`
(Anthony Lee's compass-and-straightedge rosette method) offered as a
reference. Two independent `WebFetch` passes on that page came back
inconsistent on the precise labelled construction points — expected,
since the page's real content is diagrams a text extraction can't carry
— so this rebuild does not claim to reproduce Lee's exact steps. Instead
it implements the piece of real, independently-verifiable geometry his
method and every basic rosette share: the whole star+petal shape is
*one* silhouette with *one* proportioning relationship, not independently
chosen radii. See `docs/generators/ISLAMIC_PATTERN_CONSTRUCTION.md` for the full
account, including the sanity check that clinched it: the new
construction's waist/tip radius ratio at `segments = 5` comes out to
exactly `1/phi^2` (~0.382), the well-known golden-ratio proportion of a
regular pentagram — strong evidence this is genuine star-polygon
geometry, not an approximation.

### Design decision: scoped down from the reference research, on purpose

*"Maths to Magic and Visual Wizardry"* (this project's own prior R&D — a
Houdini digital asset, github.com/GeorgiaSweeny/Pattern_Generator_HDA)
builds Islamic geometric patterns
by: translating an initial shape off-centre (Rule 1), rotating and
boolean-duplicating it *n* times around a construction circle (Rules 2–4),
mapping the resulting motif onto a tessellated grid of tiles, and optionally
boolean-clipping the overlap at tile edges. That pipeline is built for an
*artist-facing authoring tool* — its whole point (per the paper's own aims)
is maximum controllable variety within a shape-grammar system.

That is not this project's brief. `docs/PROJECT_SPECIFICATION.md` and
`docs/design/UI_DESIGN.md` are explicit that this application "should not function
as a visual programming language" and users "cannot construct arbitrary node
graphs" — each generator is one fixed, curated workflow, not a shape-grammar
authoring surface. Reproducing the Houdini tool's boolean-CSG shape grammar
here would (a) not fit the `generator(x, y, params) => [-1, 1]` pure-function
contract every other generator satisfies — CSG boolean union is a
discrete-geometry operation, not a per-pixel scalar field — and (b) rebuild
exactly the "flexible authoring" surface the spec says this project
deliberately excludes.

**What was kept from the reference research**: the *mechanism*, read at the
right level of abstraction. "Rotate and boolean-union *n* copies of a shape
around a circle" and "place *n* points evenly around that circle and ask
which is nearest, per pixel" are the same underlying idea — *n*-fold
rotational symmetry constructed from a circle — expressed in two different
computational paradigms (CSG geometry vs. scalar distance field). The second
is exactly what this project's other generators already do (Voronoi is
`Distance Field` over scattered points), so `islamic.js` reuses that
mechanism with a **deterministic** point source instead of Voronoi's
stochastic one — see `src/generators/lib/constructionCircle.js`'s header
comment for the full argument. This is also a clean answer to the primary
research question: the same `Distance Field` node/primitive, unmodified,
now demonstrably serves both a stochastic generator (Voronoi) and a fully
deterministic one (Islamic) — differing only in which node feeds it points.

### Node-by-node

- **Grid**: locates which tile `(x, y)` falls in and that tile's own
  centroid — the same conceptual node `docs/nodes/core/grid.md` already
  lists Islamic Geometric Patterns under "Used By" for. `tileShape`
  picks `square` (a `floor(x / tileSize)` lattice,
  centroid at the tile's own centre) or `hexagon` (reusing `grid.js`'s
  existing pointy-top hex-lattice math, `lib/latticeIndex.js`'s
  `hexagonCentroid` — the same cube-coordinate cell rounding
  `hexagonIndex` already does for colouring, inverted back to a
  Cartesian centre) — every rosette is centred on its own tile's
  centroid either way.
- **Construction Circle** (`lib/constructionCircle.js`): defines the centre
  (the tile centre) and radius — `scale × tileSize` (`scale` its own param,
  added 2026-08-20, default 0.42 matching the old hardcoded value; range
  `[0.2, 0.48]`, capped below 0.5 so the medallion stays inside the tile —
  see below), kept inside the tile so each medallion stays a self-contained
  motif (a rosette is one bounded shape, not an infinite lattice of lines,
  so unlike the old `star-lines` mode there's no need for the medallion to
  reach past its own tile and no neighbour-tile search anywhere in this
  construction) — that the pattern is built around. `scale` resizing the
  medallion was implemented as this existing parameter rather than a new
  node: Construction Circle's whole job is already "define the radius",
  so exposing its previously-hardcoded value is filling in what the node
  was already conceptually for. `docs/nodes/generation/construction-circle.md`
  already existed, written in anticipation of this generator.
- **Radial Divisions** (same module): divides that circle into `segments`
  equally spaced *tip* points — the *n* in *n*-fold symmetry — starting at
  90 degrees plus `rotation` (its own param, snapped to
  the nearest multiple of `180 / segments` via `islamic.js`'s
  `snapRotation`), rather than the module's own default of 0 degrees.
  `rotation` isn't snapped to `360 / segments`: this shape has exact
  `n`-fold rotational symmetry, so any multiple of `360/n` is a proven
  identity (the point set maps onto itself, confirmed before
  implementing) — `180/n` is the finest increment that both changes the
  rendered shape and always lands on one of this shape's own reflection
  axes, alternating between a tip-up and a waist-up reading of the same
  star (e.g. `segments = 4`: diamond <-> square). See
  `docs/generators/ISLAMIC_PATTERN_CONSTRUCTION.md` for the full reasoning, including
  why the first, more literal reading of the request (snap to `360/n`)
  was flagged back rather than implemented as asked.
  `docs/nodes/pattern/radial-divisions.md` also already existed for this.
  Folded into this same step (no separate node, same precedent as the old
  `star-lines` mode's chord construction): `lib/starPolygon.js`'s
  `starOutline(points, skip)` turns that tip ring into the star polygon's
  own *silhouette* — the tip ring alternating with `n` concave waist
  vertices, each waist being the actual crossing point of two of the
  star's own `{n/skip}`-style chords. `skip` is `starPolygon.js`'s own
  `starSkip(n)` — shared with that module's other consumer, not a second
  bespoke choice: an earlier fix held `skip` fixed at 2 for every
  `segments >= 5`, which stops looking like a star as `segments` grows
  (the waist/tip ratio drifts toward 1, a near-circle, since two fixed-
  skip chords subtend a shrinking angle as `n` grows). `starSkip(n)` keeps
  `skip` roughly proportional to `n`, giving a consistent, genuinely
  star-shaped ratio across the whole `segments` 3-16 range — and already
  handles 3 and 4's degeneracy correctly (`skip = 1`, the tip ring
  itself, no concave star) with no separate case needed. One shape, star
  and petals unified, replacing both old modes' separate constructions.
- **Distance Field**: `nearestSegmentDistSq` (the line-feature case, same
  primitive the old `star-lines` mode used for raw chords, now fed the
  true silhouette's own edges) gives distance to the medallion's boundary;
  `pointInPolygon` (new, `lib/distanceField.js`) gives which side of it a
  pixel is on. Combined into one **signed** distance (negative inside,
  positive outside).
- **Colour Mapping**: traces that signed distance as thin lines rather
  than filling bands between them — a pixel is "on a line" wherever its
  position (`signedDist / (radius / frequency)`, i.e. `frequency` echoes
  fitting across the medallion's own radius, not a raw spatial frequency
  — an earlier fix used `signedDist * frequency` directly, which looked
  fine at whichever `tileSize` it was tuned against but crammed far too
  many rings into a smaller medallion at the registry's declared `tileSize`
  extremes) sits within `lineWidth * radius` of a whole number, giving
  concentric echo lines anchored at the true rosette edge. `lineWidth`
  (its own param) is deliberately independent of
  `frequency`: an earlier version derived thickness from `frequency`
  itself (a fixed fraction of the echo spacing), coupling the two so
  that dragging `frequency` visibly changed line thickness too, with no
  way to adjust one without the other. Expressing thickness as a
  fraction of the medallion's radius instead (no `frequency`/spacing
  term in the formula at all) decouples them completely — the same
  "relative to `radius`, not `tileSize`/`frequency`" idea `frequency`
  itself already uses. An earlier version of this rebuild filled the
  bands between echoes with
  alternating tones instead; that read as a dense op-art texture for
  most `segments` below 8, not an Islamic geometric pattern — real ones
  are thin line-work on a plain ground, not solid fills. Reworked; see `docs/generators/ISLAMIC_PATTERN_CONSTRUCTION.md`. Band 0 (the
  medallion's own boundary) always uses the darkest declared tone; every
  other echo cycles through whichever tones are left, via
  `lib/colourMapping.js`'s shared `bandTone(shades, bandIndex)` — fixing
  a bug where the declared middle tone was computed by
  `toneSet` but never actually read, so `tones = "3"` had no visible
  effect, and generalising past a fixed two-way primary/accent split so
  `tones` "4" and "5" (`toneSet()` now generates any count 2-5 by
  formula, not just "2"/"3") read as an actual gradient of rings.
  `colour1`..`colour5` (`control: "color"` — a native
  colour-wheel picker in both UIs) let a user override any of those
  slots individually — `islamic-svg.js` (the renderer actually shown for
  this pattern) uses them verbatim instead of a computed greyscale value,
  defaulting to a greyscale ramp only until overridden. `colour3`/`4`/`5`
  only appear once `tones` selects that many, via a new general
  `visibleIf(params)` field any registry param can declare (`workflows.js`
  filters by it when building the live node graph) — not islamic-specific.
- 7 steps, always — no mode branch.

**No RNG anywhere** — `islamic.js` takes no `seed` parameter, which is
itself the point: it's the fifth spectrum position specifically because it
reaches full determinism by a mechanism distinct from Recursive/Fractal's
repeat-and-subdivide (`README.md`'s Generative Spectrum table). Verified by
property tests (`src/generators/__tests__/islamic.property.test.js`):
exact periodicity across tile boundaries, *n*-fold rotational symmetry
about each tile centre, and an independent oracle re-deriving the
silhouette and banding directly from the `lib/` primitives — plus
primitive-level invariants on the silhouette construction itself
(`lib.starPolygon.test.js`): waist strictly inside tip radius, exact
n-fold symmetry, the pentagram golden-ratio check above, centre always
inside the outline.

### Export representation

The single `islamic-rosette` registry entry declares `nativeFormat:
"vector"` in `patternRegistry.js`, so `ui.js` routes it through
`SVG_GENERATORS` rather than the raster canvas —
`src/generators/svg/islamic-svg.js` draws the same star-polygon silhouette
once and repeats it across the canvas via an SVG `<pattern>` (like
`wave-svg.js`'s stripes). Its banding can't just scale the silhouette
uniformly per band (tried first: near a sharp waist vertex a change in
scale moves the boundary far less than the same change does near a tip,
so scaled copies give wildly uneven band widths — visibly wrong) or offset
it by an unbounded number of true perpendicular bands (also tried: a
naive per-vertex-miter offset self-intersects once the offset exceeds the
shape's own local scale, and — combined with SVG `<pattern>` content not
auto-clipping to its own declared tile size — produced a moiré tangle
where far-reaching bands from unclipped tile copies overlapped). The
renderer that replaced both: true perpendicular polygon offsetting
(shift each edge along its own normal, rebuild vertices via line-line
intersection using `lib/starPolygon.js`'s `lineIntersect`) capped to a
small fixed band count with a real geometric stopping rule (inward: stop
once a vertex's radius would invert past its collapse point; outward: a
fixed `MITER_LIMIT` bevels sharp tip corners instead of letting them
miter out arbitrarily far), plus an explicit `<clipPath>` matching the
tile's own `tileSize` box so unclipped content can't bleed into
neighbouring tile repeats. This offsetting logic (`offsetPolygon`,
`buildOffsetBands`, `maxBandsFor`, `MITER_LIMIT`) now lives in its own
shared module, `src/generators/lib/polygonOffset.js`, rather than inline
in `islamic-svg.js` — extracted so `voronoiIslamicV2.js` (§10 below)
could evaluate the exact same ring geometry per pixel instead of stroking
it as SVG, letting that hybrid's raster output be compared fairly against
what Islamic Geometric Patterns itself actually renders. See
`islamic-svg.js`'s header comment for the full reasoning and
`docs/generators/ISLAMIC_PATTERN_CONSTRUCTION.md` for the visual debugging history.
Verified visually against the raster renderer across `segments` 5-10.

`islamic-svg.js` stays greyscale by design, matching every other
generator's `FILLS`/the raster `grayscale()` pipeline (`src/render.js`)
even though it isn't bound to that shared path — `nativeFormat: "vector"`
means this SVG output is the only thing ever shown for this pattern
(`PatternCanvas.jsx`'s `isVector` branch skips it entirely), so it's
free to diverge, but doesn't for now: real colour is deferred to an
explicit future user choice rather than a fixed palette baked into the
default (a same-day intermediate version tried genuine, non-grayscale
colour here — ivory/indigo/terracotta — reverted per that decision). Its
fill strings are generated by running `toneSet()`'s own -1..1 values
through the same conversion `grayscale()` uses, so a future colour
palette is a small swap of that one conversion, not a rewrite.

---

## 7. Recursive / Fractal (`recursive.js`) — two distinct modes

```
"sierpinski" mode: Workspace → Base Geometry (unit square) → Subdivide ×depth (with exclusion) → Colour Mapping → Render
"grid" mode:       Workspace → Base Geometry (unit square) → Subdivide ×depth (with parity)    → Colour Mapping → Render
```

- **Subdivide** (`lib/subdivide.js`, `subdivideCell`) is applied `depth`
  times either way, each level remapping into `[0,1)` for the next level —
  see `docs/nodes/pattern/subdivide.md` (Repeat/Power, not a fixed-arity
  compose — `docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`). What differs between
  modes is what each level's step does with its cell coordinates once
  computed, not the repetition mechanism itself:
  - **`sierpinski`**: a level whose cell is the centre cell stops the repeat
    immediately (a hole, Sierpinski Carpet's defining feature). Reaching
    `depth` levels without ever landing on the centre fills the pixel.
  - **`grid`**: no early exit — every level's `(gx + gy)` parity accumulates
    into a running total (mod 2), and the *final* parity, after all `depth`
    levels, picks the colour. This is still self-similar the same way
    `sierpinski` is (`recursive.property.test.js` proves the exact
    composition: the value at depth *d* equals the value at depth *d − 1* on
    the remapped point, sign-flipped iff the top level's own cell parity was
    odd) — it just never removes area, so the result is a fractal
    checkerboard rather than a carpet with holes. This is genuinely
    different from `grid.js`'s flat tiling (`docs/nodes/computation/lattice-index.md`):
    a plain tiling's colour only depends on one level's cell, `recursive.js`'s
    `grid` mode depends on every level's cell.
- The stepping-through-algorithm view (`docs/design/UI_DESIGN.md`) shows this as
  `depth` repeated Subdivide steps, each one level deeper, rather than one
  node evaluated once — the recursion *is* the thing being taught here, in
  both modes.
- 4 conceptual stages, `depth`-many Subdivide instances at runtime, for
  either mode.

**Gap, now closed**: `recursive.js`'s `mode` param used to be read but have
no effect — both registry entries (`sierpinski`, `recursive-grid`) produced
identical patterns, which would have meant the same five-node graph shown
twice under different names. Resolved by giving `grid` mode a genuinely
different step function (parity accumulation instead of centre-cell
exclusion) rather than a different name for the same computation — see
above. `recursive.property.test.js` now separately covers both modes,
including a mode-composition test for `grid` and a divergence test
confirming `sierpinski` produces a hole where `grid` produces a real colour
at the same point.

**Gap, now closed**: the recursion itself (`_recurse` in `recursive.js`) used
to be hand-rolled, not built from a generic `repeat` `lib/` primitive.
Extracted as `lib/repeat.js` (`repeat`) — `recursive.js` now calls it
directly, with each mode supplying its own step function. `lib.repeat.test.js`
tests the repeat combinator independently of Subdivide entirely.

**Gap, now closed**: `depth` was routed
(`src/app/src/workflows.js`'s `PARAM_NODE_MAP`) to every one of the
`depth`-many repeated Subdivide nodes above, not just one — editing it
from any of them changed the whole node count, reading as a broken
control rather than a real per-node one. Same fix as §9's
(`recursiveNoise.js`) own `depth` param, since both share this repeated-
Subdivide structure: `depth` now declares `firstOccurrenceOnly: true`
(`src/patternRegistry.js`) and only renders as an editable slider on the
first Subdivide node; subsequent ones show a short explanatory note
instead (`WorkflowNode.jsx`).

---

## 8. Voronoi-Seeded Islamic Tiling (`voronoiIslamic.js`) — hybrid

```
Workspace → Seed → Seed Points → Construction Circle → Radial Divisions → Distance Field → Colour Mapping → Render
```

Full design rationale recorded, before implementation, in
`docs/research-plans/VORONOI_ISLAMIC_HYBRID_PLAN.md` — this section only summarises the
built workflow. The research question: does the "which cell → build a
rosette there" pipeline behind Islamic Geometric Patterns (§6 above)
generalise from Grid's regular lattice to Seed Points' stochastic point
source, with the downstream construction held exactly fixed? Concretely,
this generator swaps §6's opening `Grid` step for `Seed → Seed Points`
(voronoi.js's own opening two nodes, unmodified) and reuses every
downstream stage from `islamic.js` verbatim.

**Cell membership without a Voronoi cell polygon.** `Distance Field`'s
`nearestPoint(x, y, seedPoints)` already returns which seed a pixel is
closest to — and a Voronoi cell is *defined* as the set of points closer
to its own seed than any other, so that seed *is* the cell's centre. No
separate cell-polygon construction, matching how `voronoi.js` itself never
builds one either (it only ever asks "which is nearest").

**Construction Circle's radius has no fixed-tile analogue here.** Grid
tiles are all the same size, so `islamic.js`'s `radius = tileSize * scale`
is always safe. Voronoi cells vary in size (uniform random points have
high-variance nearest-neighbour spacing), so a canvas-wide constant either
looks right on average and overflows in dense regions, or is tuned so
conservatively it shrinks every rosette to fit the smallest cell. Resolved
by scaling to *each cell's own* nearest-neighbour spacing:
`radius = scale * nearestNeighbourDistances(seedPoints)[cellIndex]` — a
new primitive, `lib/seedPoints.js`'s `nearestNeighbourDistances`
(O(n²) brute force over the seed set, same cost class as generating the
points themselves), the one genuinely new piece of surface this hybrid
needed. From Radial Divisions onward — Star Polygon's silhouette
derivation, the signed Distance Field Fork (`nearestSegmentDistSq` +
`pointInPolygon`), Colour Mapping's `bandTone` — is `islamic.js`'s
existing construction, imported and called unmodified.

**Registry defaults differ from `islamic.js`'s own** (`numCells: 15`,
`scale: 0.35`, `frequency: 2`, `lineWidth: 0.05`, vs. `islamic.js`'s 20/
0.42/3/0.06): visual testing found that at `islamic.js`'s own defaults,
larger Voronoi cells produce a large radius and, since echo spacing is
`radius / frequency`, far more concentric rings than a fixed-tile
construction ever shows at once — reading as dense interference noise
between medallions rather than legible rosettes once cell sizes actually
vary. Lower `frequency` and a smaller `scale` keep the same construction
legible against variable cell sizes.

`nativeFormat: "raster"` (like `recursiveNoise.js`, the other hybrid) — a
Voronoi tiling has no repeating unit an SVG `<pattern>` could exploit the
way `islamic-svg.js`'s tile-based one does, so an SVG renderer would need
to draw each cell's own clip polygon individually (reusing
`voronoi-svg.js`'s existing half-plane clipping). Scoped out as a stretch
goal (`docs/research-plans/VORONOI_ISLAMIC_HYBRID_PLAN.md` §3.5/M5), not required to
answer the compositional question this hybrid was built to test.

**`variation` (opt-in, default 0)** lets each cell's own
`segments`/`rotation` diverge from the base values, rather than every
medallion using an identical star shape. At `0` (the value every test and
finding above was checked against) it's an exact no-op — `voronoiIslamic.js`'s
`cellVariation()` returns the base `segments`/`rotation` unchanged. Above
`0`, each cell's jitter is a deterministic offset seeded from `(seed,
cellIndex)`, reusing `lib/rng.js`'s existing `xorshift32Unit` — routed to
the Radial Divisions node alongside `segments`/`rotation`, since it's the
same "how many points, at what angle" concern, just varied per cell
rather than fixed once for the whole pattern.

**Second follow-up**: direct feedback after using it —
self-contained cells with no visible connection between them read as
scattered medallions, not an Islamic *tiling*. Added a second, independent
line test for the Voronoi cell boundary itself: `lib/distanceField.js`'s
new `nearestTwoPoints(x, y, points)` returns both the nearest and
second-nearest seed's distance, so a pixel sits exactly on its own cell's
edge where the two are equal — the standard per-pixel proxy for a Voronoi
edge, needing no real cell-polygon construction. This combines with the
existing star-silhouette line test by OR before banding: `bandTone` now
fires if a pixel is on the star outline *or* on a cell boundary.
Structurally this is Fork *gaining a second branch* — two independent
line-source tests feeding the same closing Atop (`bandTone`) — rather than
a new pattern; cost is one further new primitive (`nearestTwoPoints`),
routed into the same Distance Field node the cell-membership test already
uses, not a new node in the diagram above.

---

## 9. Perlin Sierpinski (`recursiveNoise.js`) — hybrid

```
Workspace → Base Geometry → (Noise → Subdivide) × depth → Colour Mapping → Render
```

The secondary research question's own hybrid (`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`'s
"How do hybrid/composed generators extend or stress the compositional
model?"): `recursive.js`'s Sierpinski-mode Repeat/power loop, but each
level's own point is first Forked into `(point, noise(point))` and
recombined by addition into a domain-warped point before that level's
Subdivide test runs — a Fork living *inside* a Repeat's step, shown as a
Noise/Subdivide pair repeated `depth` times (matching the `"(1/2)"`-style
occurrence label every repeated node type gets) rather than
`recursive.js`'s own bare Subdivide chain, since the composition genuinely
differs.

**`amplitude = 0` is an exact identity**, not an approximation — this
generator is then byte-identical to `recursive(x, y, { depth,
subdivisions: 3, mode: "sierpinski" })`, checked directly in
`recursiveNoise.property.test.js` rather than assumed. This is the
falsifiable deterministic baseline the hybrid's own composition claim
rests on: at `amplitude = 0` there's no Fork to speak of, only at `> 0`
does the warp actually apply.

**Follow-up (superseded by the next entry): a shared `amplitude` ramped
across levels.** An earlier revision replaced one flat `amplitude` shared
by every level with a single ramp, `_levelAmplitude(amplitude, i, depth)`
— `0` at the first level rising to the full declared `amplitude` at the
last, later widened to ramp from a `LEVEL_AMPLITUDE_FLOOR` (30%) instead
of an exact `0` so the first Noise node stayed visibly active in the
ReactFlow view. Both were still a *single* `amplitude` value, only its
per-level share of that one value varied.

**Current design: every level's amplitude, scale and octaves are fully
independent params, not a ramp over one shared value.** `amplitude1..6`,
`scale1..6` and `octaves1..6` (`patternRegistry.js`'s `depth` maxes out at
6 levels) each control exactly one level's own warp strength and noise
texture, with zero automatic relationship to any other level's own values
— raising level 3's amplitude, or coarsening level 3's own texture, warps
only level 3's subdivision test, leaving every other level exactly as it
was (`docs/generators/recursive-noise.md`'s own "Try Exploring..."
section verifies this directly). Only `seed` stays shared across every
level, since a per-level seed wouldn't add anything once each level
already has its own independent `scale`/`octaves`. This is also what
makes every repeated Noise node in the diagram above a genuinely free
control in the workflow graph, not a slider that also moves every other
level's own value — the `stagePreview.js` isolation technique for these
nodes (§ below the diagram in `stagePreview.js` itself) depends on that
independence: diffing one level's own `amplitudeN` against `0` only makes
sense because no other level's amplitude is touched by doing so.
`amplitude1..6 = 0` (every level) is still an exact identity with
`recursive.js`'s own output, the same falsifiable boundary as above.

**`depth`'s routing fix still applies**: the `depth` param was previously
routed (`src/app/src/workflows.js`'s `PARAM_NODE_MAP`) to *every*
Subdivide node in the repeated chain above, not just one — editing it
from any of them changed the whole node count, which read as a broken
control rather than a real per-node one. `depth` (here and in
`recursive.js`'s own Subdivide chain, §7) declares
`firstOccurrenceOnly: true` (`src/patternRegistry.js`) and only renders
as an editable slider on the *first* Subdivide node; every subsequent one
shows a short explanatory note instead (`WorkflowNode.jsx`). Not a new
node or primitive — a routing/presentation fix in the workflow-graph
layer, not the generator math.

`nativeFormat: "raster"` (like `voronoiIslamic.js`, the other hybrid) —
`recursive-svg.js`'s enumeration approach doesn't have an equivalent for a
per-pixel domain warp, so this pattern has no vector renderer.

---

## 10. Voronoi-Seeded Islamic Tiling (Improved) (`voronoiIslamicV2.js`) — hybrid

```
Workspace → Seed → Seed Points → Construction Circle → Radial Divisions → Distance Field → Colour Mapping → Render
```

Same opening two nodes and same downstream sequence as §8's hybrid — this
is a second, deliberately narrower answer to the same research question
("does Islamic Geometric Patterns' cell → rosette pipeline generalise from
Grid's regular lattice to Seed Points' stochastic source"), not a
different workflow shape. §8 asks what *new* geometry is needed to make
the combination look coherent (and answers it: scale each medallion to
its own cell's local spacing). This version asks the more literal
question instead — what does it look like if *nothing* downstream of cell
placement is adapted at all, full stop — so every medallion uses the
exact same fixed radius (`tileSize * scale`, `islamic.js`'s own formula,
untouched). Overlap in dense regions and gaps in sparse ones follow
directly from that choice, an honest consequence of a Poisson-process
seed scatter meeting a fixed medallion size, not a bug held back from §8.

**Registry defaults are `islamic.js`'s own, unchanged** (`tileSize: 100`,
`scale: 0.42`, `segments: 8`, `frequency: 3`, `lineWidth: 0.06`) — unlike
§8, which lowers `frequency`/`scale` specifically to keep its
locally-scaled medallions legible. Nothing here needed retuning, which is
itself part of the point: this version changes nothing about the
downstream construction, so nothing about its own defaults needed to
change either.

**Ring construction reuses `islamic-svg.js`'s own rings, not
`islamic.js`'s raster banding.** Islamic Geometric Patterns is
`nativeFormat: "vector"` and always renders via `islamic-svg.js` in the
app, whose rings are true perpendicular offset polygons (`lib/polygonOffset.js`'s
`buildOffsetBands`/`offsetPolygon` — a new primitive this hybrid needed,
now shared with `islamic-svg.js`), each with its own independently
mitred vertices that start crossing each other two or more bands out —
genuinely different from the plain rounded signed-distance contours
`islamic.js`'s own raster function draws. Evaluating that same offset-
polygon geometry per pixel here, rather than stroking it as SVG, is what
makes this hybrid's raster output comparable against what the "normal"
vector-rendered pattern actually looks like on screen, matching §9's own
`nativeFormat: "raster"` reasoning for the same underlying question.

**`randomRotation` (opt-in, default 0)** plays the same per-cell-jitter
role §8's `variation` does, via the same technique (an `xorshift32`
stream mixed with the cell's own point index, so adding or removing
cells never perturbs an existing cell's angle) — but composes by simple
addition with `rotation`'s own `Flipped` toggle rather than the two being
exclusive: off+off is the plain construction, off+Flipped is one shared
180/segments rotation (as in `islamic.js` itself), on+off gives each
cell its own random rotation, and on+Flipped adds that same flip on top
of every cell's already-random angle. Routed to the same Radial
Divisions node as `segments`/`rotation` above, the same "how many
points, at what angle" concern.

`nativeFormat: "raster"` (like both other hybrids, §8-9) — a Voronoi
mosaic has no repeating unit an SVG `<pattern>` could exploit, the same
reason §8 has no vector renderer either.

---

## Node-library gap summary

What actually needed adding or fixing to make the seven workflows above
representable, in the order this document surfaces them:

| Gap | Resolution |
|---|---|
| `wave.js`'s plain-sine leaf had no corresponding node | Added `Waveform` node + `lib/waveform.js`; `wave.js` refactored to use it |
| Islamic Geometric Patterns had no generator or workflow yet | Added `islamic.js` + `lib/constructionCircle.js` (Construction Circle, Radial Divisions — docs already existed) |
| `docs/nodes/core/mirror.md` and `docs/nodes/core/scale.md` were empty stub files; their content was accidentally all filed under `docs/nodes/core/translate.md` | Split back into one file per node, matching `docs/nodes/README.md`'s taxonomy |
| Grid's documented UI_DESIGN.md workflow (Rotate/Translate/Repeat X/Repeat Y) didn't match `grid.js`'s actual closed-form-arithmetic implementation | Added `Lattice Index` node + `lib/latticeIndex.js`; `grid.js` refactored to use it, `grid.property.test.js` passes unchanged; `docs/design/UI_DESIGN.md`'s worked example corrected to the real 5-step workflow |
| Base Geometry and Base Tile were two node docs covering the same "Escher's starting shape" concept | Retired `pattern/base-tile.md`; `core/base-geometry.md` now states Escher's case explicitly |
| Noise's fBm fold, and Recursive's recursion, weren't decomposed into standalone `lib/` primitives (fold/repeat as generic combinators) | Added `lib/fold.js` (`foldOctaves`) and `lib/repeat.js` (`repeat`); both generators refactored to use them, both existing property-test suites pass unchanged, both combinators additionally unit-tested independently |
| `recursive.js`'s `mode` param had no effect, so Sierpinski Carpet and Recursive Grid rendered identical workflows/output under different names | Gave `grid` mode its own step function (parity accumulation instead of centre-cell exclusion) — genuinely different output, proven self-similar the same way `sierpinski` is; see §7 |

Two new node types were needed in total across all seven generators —
**Waveform** (§1) and **Lattice Index** (§3) — both now added. Every other
stage across all seven generators maps onto a `docs/nodes/` entry that
already existed before this document was written.

The three hybrids added later (§8-10) needed **zero** further new node
types — all three reuse the existing node sequence of the generator(s)
they compose (Seed Points onward for §8 and §10, Noise/Subdivide pairs
for §9), consistent with `docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`'s own
finding that composing already-decomposed generators is cheaper than
building new geometry from scratch.
