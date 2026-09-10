# Aperiodic Monotiles (Hat / Spectre) — Node-Level Research Plan

## Status

**Not committed, not scheduled, not built.** This document exists so the
dissertation's Future Work section can cite something concrete rather than
gesture vaguely at "aperiodic tiling would be interesting." It is explicitly
**not** a build plan in the sense `docs/research-plans/VORONOI_ISLAMIC_HYBRID_PLAN.md` was
for the Voronoi/Islamic hybrid — no milestone here has been started, no
registry entry is reserved, and section 6's phased milestones are a sketch
for a future continuation, not a schedule. Raised 2026-08-23, prompted by
the "Einstein problem" (https://en.wikipedia.org/wiki/Einstein_problem) as a
candidate for strengthening the dissertation's engagement with current
tiling-theory literature, and as a genuine stress test of this project's
primary research question: does the small composition vocabulary
(`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`) generalise to a construction
method none of the seven existing generators use?

Extended 2026-08-23 (this revision) from a references-and-feasibility note
into a full node-level plan: what nodes the node-graph UI would need, where
they reuse the existing library and where they don't, and an honest
strengths/weaknesses read of this system against a construction it wasn't
designed for.

---

## 1. Background: the Einstein problem, the hat, and the spectre

The "einstein problem" (from German *ein Stein*, "one stone/tile" — a pun
already noted on the Wikipedia page linked above) asks whether a single
prototile can tile the plane only *aperiodically*: admitting infinitely many
non-congruent tilings, none of which is periodic (has translational
symmetry) — unlike the two-tile Penrose rhombs, which need two prototiles
to force aperiodicity. It was open since Berger's 1966 proof that an
aperiodic *set* of tiles exists (originally thousands of tiles; reduced over
decades, culminating in Penrose's two, 1974).

It was resolved in March 2023 by amateur tiling enthusiast David Smith with
mathematicians Joseph Samuel Myers, Craig S. Kaplan, and Chaim
Goodman-Strauss, who exhibited the **"hat"** — a 13-sided polykite (built
from kite-shaped pieces of the hexagonal/triangular lattice) that tiles the
plane only aperiodically. Two months later the same team found the
**"spectre"**, a related shape that tiles aperiodically using rotations and
translations *only* — no reflections — a strictly *chiral* aperiodic
monotile.

Both results are proved and generated the same way: not by a matching-rule
constraint (the way Penrose tiles work — edges carry markings that forbid
certain adjacencies), but by a **hierarchical substitution system**:

1. A small number of **metatiles** — clusters of a few hats/spectres glued
   together, four in the original papers' presentation (commonly labelled
   H, T, P, F) — are defined.
2. A **substitution rule** replaces each metatile with a specific
   arrangement of *smaller* metatiles of the same four types, at a fixed
   inflation ratio. Each rule entry is a lookup: metatile type → list of
   (child type, rigid transform) pairs, not a formula.
3. Applying the rule *repeatedly*, starting from one metatile, produces
   patches of metatiles that grow with each application ("supertiles").
   Because the rule is confluent, this process can be run indefinitely to
   tile the whole plane.
4. To get an actual tiling of hats/spectres (not metatiles), the finest
   level of metatiles is unpacked into its constituent prototile instances
   — each with its own placement (position + rotation, and for the hat,
   optionally reflection).

The output that actually gets drawn is therefore not a formula evaluated at
a point — it is a **finite, precomputed list of (tile type, transform)
placements**, produced once by recursive substitution, which pixels are
then tested against.

---

## 2. What already exists in this codebase to build on

Read alongside `docs/GENERATOR_CONTRACT.md`'s `lib/` ↔ node table and
`docs/nodes/WORKFLOWS.md`'s per-generator node sequences, which this section
checks the hat/spectre construction against directly.

- **The constant-bind → cheap-per-pixel-lookup idiom.** `voronoi.js`
  computes `seedPoints(numCells, seed)` once per `(numCells, seed)` pair
  and caches it; every pixel then does a cheap `nearestPoint` search against
  the cached array. `islamic.js` does the same for its construction
  geometry (`constructionCircle → radialDivisions → starOutline`, computed
  once per `(segments, radius, rotation)`). This is exactly the shape a
  hat/spectre generator needs — expensive setup, cheap per-pixel query —
  and it's already a proven, tested pattern in this codebase, not something
  that would need inventing from scratch.
- **`pointInPolygon` and `nearestSegmentDistSq`** (`lib/distanceField.js`,
  added for `islamic.js`'s 2026-08-20 rebuild — see
  `docs/generators/ISLAMIC_PATTERN_CONSTRUCTION.md`) already answer "is this point
  inside this polygon" and "how far is this point from this polygon's
  boundary" for an arbitrary vertex list, not just regular shapes. The core
  per-pixel test a hat/spectre generator needs — "which tile, if any,
  contains this point" — is a repeated application of a primitive that
  already exists and is already tested, just not yet run against irregular
  13-sided polykites or applied across a *list* of candidate polygons
  instead of one.
- **The "repeat N times, show N repeated nodes" UI convention.**
  `recursive.js`'s workflow shows `depth` repeated Subdivide nodes;
  `recursiveNoise.js` shows `depth` repeated Noise/Subdivide pairs
  (`src/app/src/workflows.js`'s `STEP_DEFS`, `Array(...).fill(...)`
  pattern). This is exactly the right visual metaphor for "apply the
  substitution rule N supertile levels" — reuse, not invention, for at
  least the *display* of repeated application.
- **`lib/repeat.js`'s `repeat(step, n, initialValue)` combinator.** Already
  extracted and tested independently of `recursive.js`
  (`lib.repeat.test.js`). Section 4 below discusses exactly how far this
  generalises and where it stops.
- **Tone-banding / `colourMapping.js`.** Already generic over an arbitrary
  discrete count of tones (2-5, `tonesAndColourParams()` in
  `patternRegistry.js`) — colouring by *tile type* (a well-established way
  the original papers and popular coverage illustrate hat/spectre tilings,
  since it's what makes the aperiodic substitution structure visible to the
  eye) is a natural fit for this existing mechanism, not a new one.
- **`docs/GENERATOR_CONTRACT.md`'s interface** — `generator(x, y, params) =>
  number`, pure and deterministic — only constrains the *exposed* function
  signature, not what happens inside it. `voronoi.js` and `islamic.js`
  already do module-level, params-keyed caching behind that same pure
  interface. A hat/spectre generator satisfying the same contract (cache
  the tile list once per params, then a pure per-pixel lookup) is
  technically compatible with zero changes to the contract itself — this
  is a point in favour of feasibility, not a gap.

---

## 3. Proposed node sequence

Following `docs/nodes/WORKFLOWS.md`'s convention (linear sequence, Gap
callouts for anything the existing node library doesn't cleanly provide):

```
Workspace → Metatile Substitution (× supertileLevels) → Tile Instantiation
          → Distance Field (point-in-tile lookup) → Colour Mapping → Render
```

No **Seed** node: the standard hat/spectre construction is fully
deterministic — same substitution rule, same result, every time. That is
itself a notable data point for the spectrum bar
(`src/app/src/SpectrumBar.jsx`) work just done: this generator would sit at
the extreme deterministic end (1.0), alongside Tiles and Fractal, but unlike
those it would *not* look regular or repetitive — a good discussion point
for the dissertation ("aperiodic" is not "random"; a fully deterministic
substitution system can still defeat casual pattern-matching by eye) and a
genuinely new kind of entry at that end of the spectrum, not a repeat of
what Tiles/Fractal already demonstrate there.

### New node types this would require

| Proposed node | Category | What it does | Existing precedent |
|---|---|---|---|
| **Metatile Substitution** | pattern | Given the current set of metatile instances (type + transform), replace each with its rule-defined children, one level up in scale. Shown as `supertileLevels` repeated nodes, exactly like Subdivide's repeated-node display. | `lib/repeat.js`'s `repeat` combinator is the right *shape* (apply a step n times) but not the right *type* — see Gap 1 below. |
| **Tile Instantiation** | initialisation or pattern | Unpacks the finest level of metatiles into a flat list of concrete hat/spectre polygon vertex lists with their final placements. Computed once, cached — same idiom as `generateSeedPoints`. | `seedPoints.js`'s constant-bind caching pattern; `starPolygon.js`'s precomputed-geometry-then-reused pattern from `islamic.js`. |
| *(reused)* **Distance Field** | computation | Per pixel: which cached tile (if any) contains this point, via `pointInPolygon` against each candidate polygon. | `lib/distanceField.js`'s existing `pointInPolygon`/`nearestSegmentDistSq`, already used this way by `islamic.js`/`voronoiIslamic.js`. |
| *(reused)* **Colour Mapping** | presentation | Tone/colour by tile type (or by tile type + orientation for a richer palette). | `colourMapping.js`'s existing `toneSet`, already generic over an arbitrary discrete count. |
| *(reused)* **Render** | output | Unchanged. | — |

---

## 4. Gaps identified against the current node library

### Gap 1: no node type carries a growing collection as its value

Every existing node's data, threaded through the linear chain, is either a
per-pixel scalar/coordinate, or a *constant-bound* structure computed once
but **fixed in size by a simple density parameter** (`voronoi.js`'s
`numCells` seed points, `islamic.js`'s `segments`-sized construction
geometry). Metatile substitution's output set grows combinatorially with
each level — each metatile expands into several children (the hat's
substitution rules produce roughly 4-8 children per parent, varying by
type), so after `n` levels the tile count grows geometrically, not linearly
in a single exposed parameter the way `numCells` does. `lib/repeat.js`'s
`repeat(step, n, initialValue)` threads **one** `value` through `n` steps —
exactly recursive.js's and recursiveNoise.js's usage, a single point
remapped at each level. Metatile substitution needs the step to map **one
element to several**, and to apply that step to *every* element of the
current set, not just carry one value forward. That is a materially
different combinator — closer to a tree/graph rewrite (an L-system
production rule) than to `repeat`'s power/fold shape. This would need a new
primitive, not a reapplication of `repeat.js`, and — worth stating plainly
in the write-up rather than glossing over — it is not a small delta from
what exists; it is a different combinator with a different shape.

### Gap 2: this is, structurally, the L-Systems future-work item already listed

`README.md`'s Future Work already lists **L-Systems** as a speculative
addition ("Additional Generative Systems"), and its **Grammar-Based Pattern
Construction** section explicitly frames shape/tree grammars as out of
current scope. A from-first-principles hat/spectre substitution system
*is*, structurally, a shape-grammar/L-system production rule applied to
tiles instead of turtle-graphics symbols. That's a useful, honest framing
for the dissertation: this isn't a new, unrelated ask on top of the existing
Future Work list — it's a concrete, citable instance of an item already on
it, which strengthens the internal consistency of the write-up's scoping
rather than adding an unplanned exception to it.

### Gap 3: the linear-graph-only UI rule hides the substitution rule's own branching

`docs/design/UI_DESIGN.md` and `docs/PROJECT_SPECIFICATION.md` both deliberately
restrict the node graph to a straight line — "primarily linear... users
cannot construct arbitrary node graphs," an explicit non-goal of becoming a
visual programming language (`docs/planning/MOSCOW_PRIORITIES.md`'s "Won't" list).
That constraint is compatible with *displaying* Metatile Substitution as a
single repeated node type (same convention as Subdivide), but it means the
substitution rule's actual branching — one metatile type maps to several
differently-transformed children — stays entirely hidden inside that one
node's implementation. Contrast with `escher.js`'s Fork, which at least
*is* representable in the existing node model as two branches recombining
at a shared Atop. There is no equivalent way to show "one thing became
eight things, four different types, each with its own rotation" inside the
current single-column, one-node-per-stage graph without a fundamentally
different node-rendering mode. This is a real pedagogical/UI limitation
worth stating honestly, not just an implementation gap — the workflow view
would show that substitution *happened* at each level, but not what it
actually did structurally, unlike every other node currently in the
library.

### Gap 4: performance — no spatial index exists yet

`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`'s "Relationship to existing
infrastructure" section already flags `nearestPoint` (`voronoi.js`,
transitively `partition.js`) as the one primitive whose empirical cost
scales with a parameter (`numCells`) instead of staying O(1) per pixel —
see `docs/results/benchmark-results.md`. A hat/spectre tile list at even 4-6
supertile levels can run to hundreds or thousands of tiles; a naive
per-pixel scan doing `pointInPolygon` against every cached tile would be
considerably more expensive than the existing worst case, with no bound in
the registry's `map` ranges to keep it small the way `numCells`'s `[5, 80]`
range does. A real implementation would need a spatial index (e.g. a grid
bucket keyed by each tile's bounding box, so a pixel only tests nearby
tiles) — a genuinely new primitive, not a scaled-up reuse of what exists.

### Gap 5: SVG export would need real per-tile polygon geometry

Every vector-native generator has a hand-written `*-svg.js` renderer
(`grid-svg.js`, `voronoi-svg.js`, `islamic-svg.js`, `escher-svg.js`,
`recursive-svg.js`, `wave-svg.js`) built against closed-form shapes
(regular polygons, sine curves, lattice arithmetic). A hat/spectre SVG
renderer would need to emit the actual 13-sided polykite outlines at each
cached tile's placement — nontrivial vertex-path work, and a second
implementation surface beyond the raster generator, the same "SVG deferred
as a stretch goal beyond the raster build" precedent `voronoiIslamic.js`
already set (raster-only, SVG left as an explicit unbuilt M5 in
`docs/planning/plan-checklist.md`).

---

## 5. Strengths and weaknesses this stress test reveals

**Strengths of the current system, confirmed by this exercise:**

- The constant-bind-cache-then-cheap-lookup architecture (`voronoi.js`,
  `islamic.js`) generalises further than it might look — it's the right
  shape for a construction method (hierarchical substitution) that is
  nothing like either of the generators that established the pattern.
- `pointInPolygon`/`nearestSegmentDistSq` generalise to arbitrary polygon
  vertex lists already, not just the specific shapes `islamic.js` uses them
  for — a genuine reusable asset, not a coincidence.
- The generic contract (`docs/GENERATOR_CONTRACT.md`) is expressive enough
  to accommodate this without modification — the interface was never
  actually tied to per-pixel-only computation, just to purity and
  determinism at the outer boundary.
- The "N repeated nodes for N levels of recursion" UI convention transfers
  directly to supertile levels, at least for *display* purposes.
- The tone-banding colour pipeline is a natural fit for tile-type colouring
  without modification.

**Weaknesses this exposes, honestly:**

- The composition vocabulary's `repeat` (power/fold over a single carried
  value) does not cover "map one element to many, applied across a growing
  set" — a materially different combinator would be needed, confirming
  (per `docs/ALGORITHMIC_COMPOSITION_RESEARCH.md` open question 5) that the
  vocabulary's fold/repeat extension, while it covered `noise.js` and
  `recursive.js`, is not a complete account of recursive generative
  structure in general.
- The deliberately linear, non-branching node graph — a correct design
  choice for this project's actual scope (an educational explorer, not a
  visual programming language) — has no way to visually expose a
  substitution rule's branching, unlike Fork, which the graph already
  handles for `escher.js`/`islamic.js`.
- No spatial-indexing primitive exists yet; every current generator's
  per-pixel cost is either O(1) or O(numCells)-with-a-small-bounded-range,
  and this construction would exceed that without new work.
- SVG fidelity for genuinely irregular polygons is a real, separate
  implementation cost beyond the raster path.

---

## 6. If attempted: phased milestones (speculative, not scheduled)

Sketched in the same style as `docs/research-plans/VORONOI_ISLAMIC_HYBRID_PLAN.md` section
5, but explicitly for a future continuation, not a current commitment:

- **M1** — Hard-code the substitution lookup tables for the four hat
  metatiles (or the spectre's equivalent), as data, verified against the
  papers' own supplementary material or a reference implementation (e.g.
  the code released alongside arXiv:2303.10798), not re-derived from
  scratch.
- **M2** — `lib/metatileSubstitution.js`: a pure `substitute(tiles, level)`
  function, tested against a known small patch (e.g. one level of
  substitution on a single metatile should reproduce a documented figure
  from the paper) — the same "check against a known reference" discipline
  `voronoiIslamic.js`'s property tests already use for its own baseline
  claim.
- **M3** — `lib/tileInstantiate.js`: unpack the finest metatile level into
  concrete hat/spectre polygon vertex lists with final placements.
- **M4** — Constant-bind cache wiring (`supertileLevels`, tile variant) —
  same idiom as `generateSeedPoints`.
- **M5** — Naive O(N) per-pixel `pointInPolygon` scan as a correctness
  baseline, satisfying the generic contract suite unmodified; property test
  against the same known reference patch as M2.
- **M6** (only if M5's measured performance is unacceptable, per
  `docs/results/benchmark-results.md`'s existing methodology) — a spatial index,
  `lib/spatialIndex.js`, genuinely new primitive surface.
- **M7** — SVG renderer, real polygon paths — a second stretch beyond the
  raster stretch goal, mirroring `voronoiIslamic.js`'s own SVG deferral.

None of M1-M7 has a target date. This list exists so that if time permits
near the end of the project, or if this becomes a follow-on piece of work
after submission, there is a concrete starting point rather than open-ended
speculation — and so the dissertation's Future Work section can point at
something specific.

---

## 7. Validation: what test suites this would need

Every existing generator in this codebase is validated three ways —
`docs/GENERATOR_CONTRACT.md`'s generic suite (range, determinism, totality,
run automatically for every `REGISTRY` entry), a per-generator property
test file with algorithm-specific invariants and, in several cases
(`islamic.property.test.js`, `voronoiIslamic.property.test.js`), an
**independent oracle** re-derived directly from `lib/` primitives inside
the test file rather than re-importing the generator's own internals — plus
manual "verified live" visual checks recorded in `docs/planning/plan-checklist.md`
(no automated visual-regression tooling exists in this codebase; grepping
the test suite for `toMatchSnapshot`/`pixelmatch`/similar returns nothing).
A hat/spectre generator would need the same three layers, but the middle
one is qualitatively different from every existing property test, because
— unlike every current generator — the interesting correctness claims live
in an **intermediate cached data structure** (the substituted, instantiated
tile list), not only in the final per-pixel output. The sections below work
through what each layer would actually check, grounded in how the source
papers themselves define and verify the construction, not just in what
"looks right."

### 7.1 Reused unchanged: the generic contract suite

Once a `generateHatTiling(params)`-style cache and a pure per-pixel lookup
exist (section 6, M4-M5), `contract.generic.test.js` applies with no
modification — range `[-1, 1]`, determinism, totality are properties of the
outer `(x, y, params) => number` interface, which this construction
satisfies the same way `voronoi.js`/`islamic.js` already do. No new generic
infrastructure needed here; this is one of the reasons section 5 lists the
contract as a strength rather than a gap.

### 7.2 New: structural validity of the substitution system itself

None of the seven properties below can be checked by sampling `(x, y)`
points the way every existing property test does — they're claims about
`lib/metatileSubstitution.js`'s and `lib/tileInstantiate.js`'s own output
(section 3's proposed new primitives), so this would be the first property
test file in the codebase that exercises an intermediate structure directly
rather than only the final generator function.

1. **Tiling validity (no gaps or overlaps).** The standard definition of a
   valid tiling — every point of the plane covered, interiors of distinct
   tiles disjoint, adjacent tiles meeting edge-to-edge — is textbook
   (Grünbaum, B. & Shephard, G.C. (1987). *Tilings and Patterns*. W.H.
   Freeman.), and directly checkable at finite-patch scale even though the
   definition is stated for the infinite plane: sum of instantiated tile
   areas should equal the patch's total area (within floating-point
   tolerance, accounting for boundary tiles clipped by the patch edge), and
   no two tiles' interiors should overlap. A property test could generate
   small patches (few supertile levels, kept fast) and check both directly.
2. **Substitution inflation-exactness.** The defining property of a
   *combinatorial substitution system* in Smith et al.'s own formalism (and
   inflation tilings generally, per Baake, M. & Grimm, U. (2013).
   *Aperiodic Order, Vol. 1: A Mathematical Invitation*. Cambridge
   University Press — ch. 4-6 cover symbolic substitutions and inflation
   tilings directly): applying the substitution rule to a metatile and then
   scaling the result down by the construction's fixed inflation factor
   must exactly reproduce the parent metatile's boundary, with no gap or
   overlap at the seam. This is the property that makes "repeat the rule
   indefinitely" valid in the first place — testing it directly (for each
   of the four metatile types, one substitution step, compare the scaled
   children's combined boundary to the parent) is a much stronger check
   than only checking the final rendered pixels, the same way
   `islamic.property.test.js`'s n-fold-rotational-symmetry check verifies
   the *construction*, not just spot-checked output values.
3. **Prototile shape exactness.** Every instantiated tile's vertices, after
   inverting its placement transform, must exactly match the canonical hat
   (or spectre) polygon's vertex coordinates — same edge lengths, same
   interior angles — confirming the placement is a true rigid
   transformation (rotation + translation, and for the hat only,
   optionally a reflection) rather than something that silently distorts
   the shape. Needs an **independent oracle**: the canonical vertex
   coordinates checked once against the papers' own supplementary data or
   a released reference implementation (arXiv:2303.10798's and
   arXiv:2305.17743's supplementary material), hardcoded as the test
   fixture — the same "verify against an authoritative external source,
   don't just trust your own derivation" discipline this project already
   applies (`docs/generators/ISLAMIC_PATTERN_CONSTRUCTION.md`'s citation-accuracy
   correction; `docs/research-plans/VORONOI_ISLAMIC_HYBRID_PLAN.md`'s "checked directly,
   not assumed" ethic for `recursiveNoise.js`'s baseline claim).
4. **Chirality (spectre variant only).** Every placed tile's transform must
   have positive determinant — a proper rotation, never a reflection —
   directly checkable per tile instance from its transform matrix. The
   hat's own construction is *not* chiral (its proof permits reflected
   copies), so this test would apply only when generating the spectre
   variant — a genuine case where, unlike every current registry entry's
   params (which are all plain numeric/categorical sliders), the
   *mathematical claim being tested* differs by which prototile variant is
   selected, not just the rendered output.
5. **Aperiodicity — a finite-patch proxy, not a full proof.** For a
   rendered finite patch, check there is no nonzero translation vector
   mapping the patch's tile-type-and-orientation assignment onto itself.
   This is a **necessary but not sufficient** computational check: true
   aperiodicity is a claim about the infinite plane, and the papers
   themselves prove it via a combinatorial, computer-assisted case
   analysis showing every possible hat tiling must arise from the
   substitution system (Smith et al. 2023, §4-5), not by testing a finite
   sample. Worth stating explicitly in the write-up that this test can
   *falsify* a broken implementation (finding a repeating patch would mean
   something is wrong) but can never *confirm* aperiodicity the way this
   project's other property tests confirm exact algebraic invariants —
   a genuinely different, weaker category of test than anything else in
   this codebase's suite, and worth being honest about that limit rather
   than presenting it as equivalent rigor.
6. **Repetitivity / local isomorphism (exploratory, not pass/fail).** A
   defining statistical signature of genuine aperiodic order — every
   sufficiently large patch contains, somewhere within a bounded distance,
   a copy of every sub-patch that occurs anywhere in the tiling (Baake &
   Grimm 2013, ch. 5's formal repetitivity definition). Checking this
   exactly is impractical for a dissertation-scope test suite, but a
   weaker exploratory check — sampling several small sub-patch
   "signatures" (sequences of metatile types) from a generated patch and
   confirming each recurs at least once elsewhere in the same patch — would
   be a reasonable, citable sanity check that the substitution system
   *looks like* genuine aperiodic order rather than an arbitrary irregular
   pattern, framed explicitly as exploratory evidence rather than a proof.

### 7.3 Per-pixel lookup correctness

Once the tile list exists, the actual `GENERATORS.hat(x, y, params)`
function needs the same independent-oracle treatment
`islamic.property.test.js` already applies: re-derive "which tile (if any)
contains this point" directly from `lib/distanceField.js`'s
`pointInPolygon` inside the test file, applied to the same cached tile list
the generator itself would use, and confirm the two never disagree across
random `(x, y)` samples (`fast-check`, same as every existing property
test). A second check specific to this construction: every sampled point
should be assigned to **exactly one** tile, never zero (a gap in the
tiling — a bug, given 7.2.1's tiling-validity claim) or more than one (an
overlap) — the per-pixel analogue of 7.2.1's area-based check, and a direct
regression guard if 7.2.1 ever regresses without a corresponding pixel-level
symptom being caught.

### 7.4 Visual validation

This project has no automated visual-regression tooling (no snapshot or
pixel-diff testing anywhere in the current suite); every existing pattern's
visual correctness has instead been manually "verified live" in-browser,
recorded as such in `docs/planning/plan-checklist.md` entries (e.g. "verified live:
amplitude 0 renders the exact crisp Sierpinski carpet, increasing amplitude
smoothly deforms it"). For hat/spectre, the equivalent would be:

- **Reference-figure comparison.** Manually compare a rendered patch at a
  small, fixed number of supertile levels against the published tiling
  illustrations in Smith et al. (2023, 2023) and Kaplan (2025) — the same
  "reproduce a documented figure" check already named as part of milestone
  M2 in section 6, made concrete here as the actual validation step rather
  than left implicit.
- **Colour-by-tile-type as a built-in sanity check.** Reusing
  `colourMapping.js`'s existing tone-banding to colour each tile by its
  metatile type (the standard way the original papers and popular coverage
  illustrate the construction, since it's what makes the substitution
  hierarchy visible) means a broken substitution is likely to be
  *obviously* wrong by eye — mis-shaped clusters, colour discontinuities at
  supertile boundaries — unlike a subtle numerical bug in a continuous
  field (e.g. Perlin noise), which can look plausible even when wrong. This
  is a cheap, construction-specific advantage worth noting: visual
  debugging is unusually informative here precisely because the structure
  being tested is combinatorial, not continuous.
- **A first snapshot test, if ever justified.** A lightweight pixel-diff
  test (rendered canvas bytes for one fixed small param set, compared
  against a checked-in reference PNG) would be the first snapshot-style
  test in this codebase — worth flagging as new test *infrastructure*, not
  just a new test file, if this generator were ever built far enough to
  need regression protection beyond manual checks.

### 7.5 Benchmark suite extension

`docs/results/benchmark-results.md`'s existing methodology (grid-size scaling +
one-parameter sweep, median-of-7 calibrated timing,
`src/generators/__benchmarks__/benchmark.js`) would need a `supertileLevels`
sweep added, directly to characterise whether Gap 4's predicted cost
blow-up (naive per-pixel search over a combinatorially-growing tile list)
is real and to what degree — this is less about *correctness* than about
confirming and quantifying a predicted weakness before deciding whether
milestone M6's spatial index is actually necessary, the same
measure-before-optimising discipline `docs/results/benchmark-results.md`'s own
methodology section already states.

## 8. References

Checked against the project's existing bibliography
(`docs/references/MSc Project Proposal_Georgia Sweeny.pdf`) before adding —
worth flagging that **Craig S. Kaplan**, co-author of both papers below, is
already the most-cited author in this project's Islamic-pattern references
(`docs/research-plans/VORONOI_ISLAMIC_HYBRID_PLAN.md` §8, `docs/generators/ISLAMIC_PATTERN_CONSTRUCTION.md`)
for his 1999-2005 work on Voronoi ornament and Islamic star patterns. That
is a genuine, citable continuity in the literature review: the same
researcher spans this project's existing Islamic/Voronoi references and the
aperiodic-monotile result, so the discussion section can trace one author's
line of work across both halves of the dissertation's tiling literature
rather than treating the monotile result as an unrelated addition.

- Smith, D., Myers, J.S., Kaplan, C.S., & Goodman-Strauss, C. (2023). "An
  Aperiodic Monotile." arXiv:2303.10798. Published in *Combinatorial
  Theory*, 4(1) (2024). The original hat result — the primary source for
  the Einstein problem's resolution and for the metatile/substitution
  construction this document's plan is built against.
- Smith, D., Myers, J.S., Kaplan, C.S., & Goodman-Strauss, C. (2023). "A
  Chiral Aperiodic Monotile." arXiv:2305.17743. The spectre follow-up,
  strengthening the hat result to rotations-and-translations-only tilings.
- Kaplan, C.S. (2025). "The Path to Aperiodic Monotiles." arXiv:2509.12216.
  A first-person retrospective by one of the paper's own authors — useful
  for the write-up's exposition/motivation, the same role his 2000
  "Computer Generated Islamic Star Patterns" (Bridges 2000) already serves
  as the informal companion to the rigorous 2004 Islamic-patterns paper in
  this project's existing bibliography.
- Grünbaum, B. & Shephard, G.C. (1987). *Tilings and Patterns*. W.H.
  Freeman. The standard foundational reference for the edge-to-edge valid-
  tiling definition section 7.2.1's area/adjacency checks are grounded in —
  the same "cite the standard text rather than re-derive the definition
  from scratch" role Okabe et al.'s *Spatial Tessellations* already plays
  for `docs/research-plans/VORONOI_ISLAMIC_HYBRID_PLAN.md`'s Voronoi radius heuristic.
- Baake, M. & Grimm, U. (2013). *Aperiodic Order, Vol. 1: A Mathematical
  Invitation*. Cambridge University Press. Chapters 4-6 (symbolic
  substitutions, inflation tilings, patterns and tilings) are the rigorous
  source for section 7.2's inflation-exactness property and 7.2.6's
  repetitivity/local-isomorphism definition — the standard reference text
  for aperiodic order generally, not specific to the hat/spectre result.
