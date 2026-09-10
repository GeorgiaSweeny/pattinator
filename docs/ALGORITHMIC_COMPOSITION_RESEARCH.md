# Algorithmic Composition as the Primary Research Contribution

## Status and scope

This document reframes the emphasis of the dissertation's two halves. The
**algorithmic composition question below is the primary computer-science research
contribution.** The educational interface (node graph, documentation panel,
evaluation study) is **secondary**: a demonstration and evaluation vehicle that
shows the compositional structure identified here is not just internally
correct, but externally legible to a learner. It is a means of showing the
algorithms work and are understandable — not the research contribution itself.

This is a deliberate change from `README.md` / `docs/PROJECT_SPECIFICATION.md`,
which currently frame the project the other way round (educational value as the
primary research question, algorithms as the vehicle). Those documents haven't
been edited yet — this file exists first so the reframing can be checked before
it's carried back into the project's primary framing documents.

**Supervisor scoping note** (direct guidance, recorded because it's the
boundary condition for everything below): the project should draw on
combinator-style thinking about function composition — supervisor referenced
Marshall Lochbaum's BQN tutorial on combinators
(https://mlochbaum.github.io/BQN/tutorial/combinator.html) — **at a high level**,
without going deep into formal grammar or language design. This project is not
designing a language. Combinators are used here purely as an **analytical
vocabulary for describing composition patterns that already exist** in the
codebase, not as a feature implemented for end users, and not as a parser, type
system, or grammar with production rules. The existing design philosophy
(`docs/PROJECT_SPECIFICATION.md`: "the system should not function as a visual
programming language... users cannot construct arbitrary node graphs") is
unaffected by this document.

---

## Research questions

**Primary**: Can a small, fixed vocabulary of composition patterns — borrowed
from combinator-style function composition (atop/compose, fork, constant-bind,
and, where the base vocabulary doesn't fit, fold and repeat) — describe how a
broad spectrum of generative pattern algorithms (stochastic → deterministic) is
actually built from a minimal library of reusable primitives? Where the minimal
vocabulary doesn't fit a generator, what does that gap reveal about the
primitive library's completeness?

**Secondary**: How do hybrid/composed generators (e.g. a Perlin-perturbed
subdivision threshold, a Voronoi-seeded tessellation — see `README.md`'s
Generative Spectrum future work) extend or stress this compositional model? Do
they require genuinely new composition patterns, or do they recombine the
patterns already found in the seven base generators? `islamic.js`'s original
`star-lines` mode was early evidence for the latter — recombining
`voronoi.js`'s and `wave.js`'s existing patterns with no new primitive — but
that mode (and its `rosette` sibling) was rebuilt
after both were found to be geometrically inaccurate (see
`docs/generators/ISLAMIC_PATTERN_CONSTRUCTION.md`), so that specific evidence no longer
applies to the current codebase; the rebuilt `islamic.js`'s own
composition-table entry below is a different (and, it turns out, stronger)
data point for this question — it needed the Fork pattern for the first time
outside `escher.js`, plus two new primitives, not zero. **`recursiveNoise.js`
is the hybrid this secondary question is really aimed at**: see its composition-table entry and open question 4 below — the answer there is
mixed, not purely "recombines existing patterns": it needed a genuinely new
*shape* (a Fork living inside a Repeat's step) but zero new *primitives*.
**`voronoiIslamic.js`** is a third data point, built specifically
to target the *other* half of this question directly: does the "which cell →
build a rosette there" pipeline generalise from a regular point source to a
stochastic one, with the downstream construction held fixed? See its
composition-table entry and `docs/research-plans/VORONOI_ISLAMIC_HYBRID_PLAN.md` — the
answer there is the cleanest of the three: no new pattern at all, and only
one new primitive, because (unlike the other two) it recombines two
pipelines (`voronoi.js`'s, `islamic.js`'s) that were each already fully
decomposed before this hybrid was built.

**Demonstration/evaluation (secondary, supports the above)**: Does the
educational node-graph interface make the compositional structure identified
above visible and understandable to a novice learner? This is the role of the
pre/during/post evaluation study — it tests whether the demonstration succeeds,
not whether the underlying compositional claim is true (that's established by
the analysis and testing below, independent of any user study).

---

## The primitive library (`src/generators/lib/`)

Documented in `docs/GENERATOR_CONTRACT.md`. Thirteen primitive modules, each
corresponding to one conceptual node in `docs/nodes/` (twelve as of Aug 2-6;
`starPolygon.js` is the one new row, added rebuilding `islamic.js`
— several existing rows also gained new exported functions the same rebuild,
noted inline below):

| Primitive | Signature | Role |
|---|---|---|
| `rng.js` (`xorshift32`, `xorshift32Unit`) | `(seed) => next()` | deterministic PRNG, shared by every stochastic generator |
| `seedPoints.js` (`generateSeedPoints`) | `(numPoints, seed) => Float32Array` | a point cloud from a seed — ignores per-pixel input entirely |
| `distanceField.js` (`nearestPoint`, `distanceToPoint`, `nearestSegmentDistSq`, `pointInPolygon`) | `(x, y, points\|px,py\|edges\|polygon) => {index, distSq}\|number\|boolean` | nearest-feature search (point or line-segment), single-point distance, and inside/outside test — the last two both added 2026-08-20 for `islamic.js`'s rebuild (see below) |
| `partition.js` (`partitionIndex`) | `(x, y, points, numRegions) => int` | `nearestPoint` folded into a bounded region index |
| `colourMapping.js` (`toneSet`, `bandTone`) | `(tones) => number[]`; `(shades, bandIndex) => number` | discrete index → output tone; `bandTone`  maps a *signed* concentric-band index to one of `tones`' values, generalising a flat two-way primary/accent split to any declared tone count 2-5 — shared, not islamic-specific, so any future radial-banding generator gets it for free |
| `edgeDeformation.js` (`bump`) | `(t, type) => number` | periodic boundary displacement |
| `subdivide.js` (`subdivideCell`) | `(x, y, n) => {gx, gy, x, y}` | one level of an n×n cell subdivision |
| `waveform.js` (`sineWave`) | `(value, frequency, phase) => number` | periodic fold of a scalar field — closes the gap where `wave.js`'s plain-sine mode had no corresponding primitive. No longer used by `islamic.js` as of the rebuild (its old `star-lines` mode's `Distance Field → Waveform` chain doesn't exist any more — see the composition table below), so `wave.js` is now its only consumer. |
| `constructionCircle.js` (`constructionCircle`, `radialDivisions`) | `(cx, cy, radius) => circle`; `(circle, segments, rotation) => Float32Array` | deterministic counterpart to `seedPoints.js` — places points at fixed angles instead of scattering them with an RNG. `radialDivisions`' own `rotation` argument went unused by any caller until `islamic.js` exposed it as a user parameter |
| `fold.js` (`foldOctaves`) | `(sample, octaves, {persistence, lacunarity}) => number` | the Fold/reduce combinator itself, generalised out of `noise.js`'s fBm loop — tested independently in `lib.fold.test.js` |
| `repeat.js` (`repeat`) | `(step, n, initialValue) => {stopped, value}` | the Repeat/power combinator itself, generalised out of `recursive.js`'s recursion — tested independently in `lib.repeat.test.js` |
| `latticeIndex.js` (`squareIndex`, `triangleIndex`, `hexagonIndex`, `brickIndex`, `diamondIndex`, `hexagonCentroid`) | `(x, y, tileSize, numShades) => int`; `hexagonCentroid: (x, y, size) => [cx, cy]` | closed-form cell index for one of five regular tilings — the answer to open question 1 below (not a `partition.js` in disguise). `hexagonCentroid`  is the inverse of `hexagonIndex`'s own cube-coordinate rounding — cell index and cell centre share one rounding step rather than two independent ones, so they can't disagree — reused by `islamic.js`'s new `tileShape: "hexagon"` option, the first consumer of `latticeIndex.js` outside `grid.js`. |
| `starPolygon.js` (`starSkip`, `starEdges`, `lineIntersect`, `starOutline`) | `(n) => int`; `(points, skip) => Float32Array`; `(4 points) => {x,y}\|null`; `(points, skip) => Float32Array` | `starSkip`/`starEdges` predate the rebuild (the old `star-lines` mode's raw `{n/k}` chords). `lineIntersect` and `starOutline`  derive the star polygon's own *silhouette* — tip ring plus waist points computed as genuine chord self-intersections — the geometric core of the rebuilt `islamic.js`; see `docs/generators/ISLAMIC_PATTERN_CONSTRUCTION.md`. |

## Combinator vocabulary used below

Kept deliberately small — three patterns from the BQN tutorial's six, plus two
patterns the seven generators turned out to need that aren't in that base set:

- **Atop / compose** — output of one primitive feeds directly into the next:
  `f(g(x))`.
- **Constant-bind** — a primitive's argument is fixed ahead of time and reused
  across every per-pixel call, rather than derived from `(x, y)` each time
  (BQN's "Constant" combinator, or a curried partial application).
- **Fork** — `(x, y)` (or a value derived from it) feeds two primitives whose
  outputs are then combined by a third function.
- **Fold / reduce** *(not in the base six — needed anyway, see `noise.js`)* — a
  primitive applied repeatedly to a running accumulator, each time with a
  transformed input (BQN has fold as a primitive operator, "´", separate from
  the six named combinators in the tutorial). Extracted as its own tested
  primitive, `lib/fold.js` (`foldOctaves`).
- **Repeat / power** *(also not in the base six — needed for `recursive.js`)* —
  a primitive applied to its own output some fixed number of times. Also
  precedented in the same language family (Dyalog APL's Power operator, `⍣`).
  Extracted as its own tested primitive, `lib/repeat.js` (`repeat`).

## Composition table: how each generator is actually built

| Generator | Pattern | Structure |
|---|---|---|
| `voronoi.js` | Constant-bind → Atop chain | `seedPoints(numCells, seed)` computed once (ignores `x,y`, cached), then per-pixel: `toneSet(tones)[nearestPoint(x, y, points).index % n]` — a straight compose chain over a constant-bound argument. |
| `wave.js` (rings) | Constant-bind → Atop | `distanceToPoint(x, y, CANVAS.WIDTH/2, CANVAS.HEIGHT/2)` fixes the second point ahead of time, then composes with `sineWave` (`waveform.js`). |
| `wave.js` (wave mode) | Atop | `sineWave(y, frequency)` — was a bare `Math.sin` leaf with no corresponding primitive; now built from `waveform.js`, so no generator in this table is an undecomposed leaf any more. |
| `escher.js` | Cross-fork → Atop | `y` feeds `bump(normY)` to get `dx`; `x` feeds `bump(normX)` to get `dy` — each axis's *displacement* is driven by the *other* axis's position, then `(x-dx, y-dy)` are combined into a tile index and passed through `toneSet`. Structurally different from voronoi/wave: two forked branches recombine before the final compose, and the forking is cross-wired (not the same input duplicated to both branches). |
| `recursive.js` | Repeat/power | `subdivideCell` applied to its own remapped output, `depth` times, with an early-exit test at each level, now built directly from `lib/repeat.js` (`repeat`) rather than a hand-rolled `_recurse` function. Doesn't fit atop, fork, or constant-bind — needed the fifth pattern. |
| `grid.js` | Atop, over a sixth primitive | `latticeIndex.js`'s per-shape function (`squareIndex`, `triangleIndex`, `hexagonIndex`, `brickIndex`, `diamondIndex`) computed from `(x, y, tileSize)`, then composed with `toneSet` — structurally Atop, same as Voronoi/Wave, but over a primitive that isn't `nearestPoint`, `distanceToPoint` or `sineWave`. Resolves open question 1 below: the per-shape arithmetic is fully decomposed now, but into a new primitive family, not a reuse of `partition.js`. |
| `noise.js` | Fold/reduce | The fBm octave loop (`src/generators/noise.js`) sums `octaves` transformed calls to `Perlin.noise2D` with increasing frequency and decreasing amplitude — a fold, not a fixed-arity compose. Now built directly from `lib/fold.js` (`foldOctaves`); the fold structure is exactly why a plain atop/fork vocabulary doesn't fit it, and is why it's the one pattern that needed a dedicated primitive rather than reusing an existing one. |
| `islamic.js`  | Constant-bind → Fork → Atop | `starOutline(radialDivisions(constructionCircle(...), segments, rotation), starSkip(segments))` computed once per (segments, radius, rotation) triple (constant-bind, cached) — itself an Atop chain, `constructionCircle → radialDivisions → starOutline`, where `starOutline` internally uses `lineIntersect` per waist vertex. Per pixel, the *same* local coordinates then Fork into two primitives — `nearestSegmentDistSq(lx, ly, edges)` (distance to the silhouette's boundary) and `pointInPolygon(lx, ly, outline)` (which side of it) — recombined by a sign flip into one signed distance, which is finally banded and passed through `bandTone`. Notably *not* the same shape as the original `rosette`/`star-lines` modes this replaced (see `docs/generators/ISLAMIC_PATTERN_CONSTRUCTION.md`): those were pure Atop chains reusing `nearestPoint`/`sineWave` with zero new primitives; this construction needed the Fork pattern — previously unique to `escher.js` — for the first time in a second generator, plus four new primitives (`pointInPolygon`, `lineIntersect`, `starOutline`, `bandTone`). A genuinely different, and arguably stronger, data point for the primary RQ than the original modes were: the *pattern* (Fork) is still reused from `escher.js`, but getting an accurate result this time cost real new primitive surface, not zero. |
| `recursiveNoise.js` | Repeat, whose step is a Fork → Atop | The secondary RQ's hybrid generator (resolves open question 4 below): `recursive.js`'s Repeat/power loop over Subdivide, but each iteration's step first Forks its own point into `(point, noise(point))`, recombines by addition into a domain-warped point, then feeds *that* to `subdivideCell`. Genuinely new shape — a Fork living *inside* a Repeat's step, not a fork feeding one decision — built from zero new primitives (`lib/fold.js` via `noise.js`, `lib/subdivide.js`/`lib/repeat.js` via `recursive.js`'s own structure). At its `amplitude = 0` boundary it is provably identical to `recursive.js`'s own output (checked directly in `recursiveNoise.property.test.js`, not assumed), giving the hybrid a falsifiable deterministic baseline rather than a claim taken on faith. **Follow-up**: the flat `amplitude` applied identically at every level (reported as making the whole carpet look merely shifted, not depth itself having character) is now a linear ramp keyed to `repeat.js`'s own per-iteration index `i` — a `step(value, i)` argument `repeat.js` always provided but this generator previously discarded. Still zero new primitives (`i` was free), but a richer *shape* than before: the Repeat step's own behaviour now varies with iteration index, not just its input — every other use of `lib/repeat.js` in this codebase (`recursive.js`, and this file's own unwarped Subdivide scaffold) still applies the identical step every time, so this is a genuinely new variant of Repeat, not just a parameter tweak. |
| `voronoiIslamic.js` | Constant-bind → Atop → Atop → Fork → Atop | Confirms the plan's own prediction (`docs/research-plans/VORONOI_ISLAMIC_HYBRID_PLAN.md` §4) almost exactly: `generateSeedPoints(numCells, seed)` plus, new this generator, `nearestNeighbourDistances(points)` are computed once (constant-bind, cached); per pixel, `nearestPoint(x, y, points)` gives cell membership (Atop), the pixel is re-expressed as local coordinates relative to its own seed (a second Atop), then `islamic.js`'s *unmodified* Fork (`nearestSegmentDistSq` + `pointInPolygon`) and closing Atop (`bandTone`) are reused verbatim. Cost: exactly one new primitive (`nearestNeighbourDistances`, `lib/seedPoints.js`) and zero new patterns — the cheapest of the three hybrid/rebuild data points in this table, exactly because it recombines two already-fully-decomposed pipelines (`voronoi.js`'s and `islamic.js`'s own rows above) rather than building new geometry (`islamic.js`'s rebuild, four new primitives) or a new recursive shape (`recursiveNoise.js`, a genuinely new Fork-inside-Repeat pattern). The one place the plan's "closed form" carried over only partially: `islamic.js`'s tile-fixed `radius = tileSize * scale` had no direct analogue for an irregular point source, resolved by scaling to each cell's own nearest-neighbour spacing (plan §3.2's "v2") rather than reusing a constant. **Follow-up**: an opt-in `variation` param (default 0, exact identity at that default) lets each cell's `segments`/`rotation` independently diverge, reusing `lib/rng.js`'s existing `xorshift32Unit` inside the same per-cell Atop chain — a Constant-bind on an extra derived seed, not a new pattern, so this row's "one new primitive, zero new patterns" finding is unchanged by the addition. **Second follow-up**: self-contained cells with no connection between them read as scattered medallions, not an Islamic *tiling* — added a second, independent line test for the Voronoi cell boundary itself (`lib/distanceField.js`'s new `nearestTwoPoints`, a pixel is exactly on its own cell's edge where equidistant from its two nearest seeds — the standard per-pixel proxy for a Voronoi edge, needing no real cell-polygon construction), combined with the existing star-silhouette line test by OR before banding. Structurally this is Fork *gaining a second branch* — two independent line-source tests feeding the same closing Atop (`bandTone`) — rather than a new pattern; cost is one further new primitive (`nearestTwoPoints`), the same order of cost as this hybrid's own original build, not a second hybrid's worth of new surface. |

**Reading across the table**: five generators (`voronoi`, `wave`, `escher`,
`islamic`, `grid`) now fit "compose, optionally with one constant-bound
input, optionally with a fork" — a genuinely small, reusable set for the
*pattern*, even though `grid.js` needed a *primitive* (`latticeIndex.js`)
none of the others share, and the rebuilt `islamic.js` needed four. That's
worth being precise about: the small vocabulary claim is about how
primitives compose (Atop/fork/constant-bind), not a claim that every
generator draws from the same handful of primitives — `grid.js` and the
rebuilt `islamic.js` are both now evidence for the former and genuine
counterexamples to a stronger version of the latter. (An earlier version of
this document could claim `islamic.js` needed *neither* a new pattern nor a
new primitive — true of the original `rosette`/`star-lines` modes, which
turned out to be geometrically inaccurate; the accurate rebuild needed Fork,
already established by `escher.js`, but real new primitive surface to get
there. The compositional-pattern claim survived being asked to actually
produce a correct result; the zero-new-primitives claim didn't, and that
distinction — pattern reuse surviving where primitive reuse didn't — is
itself a more informative finding for the primary RQ than either half taken
alone.) Two generators (`recursive`, `noise`) needed patterns outside that
set entirely (repeat, fold) — both of which are standard, named operators in
the array-language tradition this vocabulary is drawn from, not ad hoc
inventions. All seven generators are now fully decomposed into `lib/`
primitives; none remain partially decomposed.

---

## Open questions / next steps

1. **Resolved**: `grid.js`'s per-shape arithmetic is **not** a `partition.js`
   in disguise. `partition.js` answers "which of these finitely many seed
   points is nearest" by search; a plane tiling has no finite point set to
   search against, so there was never a `points` array for it to search — the
   question was really "does this reduce to a nearest-point search over
   *some* point set," and having worked through the actual math for all five
   shapes (triangle's oblique coordinates, hexagon's cube coordinates and
   lattice rounding, brick's running-bond offset, diamond's rotated frame),
   none of them are naturally expressed that way; they're closed-form
   coordinate-space changes, not searches. This is the "irreducibly bespoke"
   outcome flagged as possible when this question was first raised — but
   "bespoke" turned out to mean "a fifth reusable primitive," not "stays
   inline arithmetic": extracted as `lib/latticeIndex.js`, one function per
   shape, each independently pure and testable (`grid.property.test.js`
   passes unchanged against the refactor). `grid.js` is now `Atop` — `toneSet`
   composed with a `latticeIndex.js` call — the same composition *pattern* as
   Voronoi/Wave, just over a primitive that isn't shared with them. See
   `docs/nodes/computation/lattice-index.md` and
   `docs/nodes/WORKFLOWS.md` §5 for the full account, including why this also
   ruled out Rotate/Translate/Repeat as the decomposition (a shear isn't a
   rotation).
2. **Resolved**: `fold` and `repeat` are now first-class `lib/` primitives —
   `lib/fold.js` (`foldOctaves`) and `lib/repeat.js` (`repeat`) — so `noise.js`
   and `recursive.js` are decomposed the same way as the other five. Both are
   tested generically and independently of either generator
   (`lib.fold.test.js`, `lib.repeat.test.js`); `noise.property.test.js` and
   `recursive.property.test.js` were left unchanged and pass unmodified,
   confirming the refactor is behaviour-preserving rather than a rewrite.
   `grid.js` (question 1 above) remains the one generator not fully
   decomposed into `lib/` primitives.
3. **Compositional correctness**: given `docs/GENERATOR_CONTRACT.md`'s existing
   per-primitive and per-generator contracts, does composing two
   contract-satisfying primitives with `atop` or `fork` automatically produce a
   contract-satisfying result? This is a small, provable claim (not a language
   design exercise) that would directly extend the existing property-based test
   suite rather than requiring new infrastructure.
4. **Resolved** (2026-08-19): the guess above was partially correct.
   Built `recursiveNoise.js` — Perlin noise perturbing `recursive.js`'s
   "sierpinski" mode — and checked the actual composition needed, rather
   than assuming. It is a **Fork inside a Repeat**, not a fork feeding a
   single decision: at *each* iteration of the Repeat/power loop
   (`lib/repeat.js`, the same combinator `recursive.js` itself uses), that
   iteration's current point forks into two branches — the point unchanged,
   and the point fed through Noise (`noise.js`, itself a Fold over Perlin
   octaves) — recombined by addition into a domain-warped point, *before*
   that warped point is handed to Subdivide's centre-cell test. So the fork
   isn't a one-off combination of "noise value" and "cell coordinates" as
   guessed; it's the *input* to every one of the `depth` repeated steps,
   meaning the composition shape is `Repeat(step = Fork(id, Noise) → atop →
   Subdivide)` — a genuinely new shape (Repeat had never before contained a
   Fork), built entirely from two already-existing, already-tested
   primitives (`lib/fold.js` via `noise.js`, `lib/subdivide.js` +
   `lib/repeat.js` via `recursive.js`'s own structure) with zero new
   bespoke math. See `recursiveNoise.js`'s header comment and
   `docs/planning/plan-checklist.md`'s Aug 7-9 entry.

   This also gave a clean answer to open question 3 above, at least for this
   one case: at the hybrid's `amplitude = 0` boundary, the composition is
   *provably* identical to `recursive.js`'s own contract-satisfying output
   (`recursiveNoise.property.test.js` checks this directly against
   `recursive.js`, byte-for-byte, not just "close"), and for `amplitude > 0`
   the same generic contract suite (`contract.generic.test.js`) that covers
   every other registry entry — range, determinism, totality — passes
   without any hybrid-specific exception. So for this composition at least,
   Fork/Repeat/Atop chained together did preserve the contract automatically;
   generalising that to *all* possible fork/atop compositions remains open.
5. **Raised, not resolved** (2026-08-23, extended into a full node-level
   plan): does a hierarchical substitution / inflation system
   (the construction behind the hat and spectre aperiodic monotiles — see
   `docs/research-plans/EINSTEIN_APERIODIC_STRETCH.md`) fit this vocabulary at all?
   Answer, worked through in that document's §4: **no, not as `repeat` is
   currently defined.** `lib/repeat.js`'s `repeat(step, n, initialValue)`
   threads *one* carried value through `n` steps — exactly what
   `recursive.js` and `recursiveNoise.js` both do. Metatile substitution
   needs a step that maps *one element to several*, applied to *every*
   element of a set that grows each level — a map-one-to-many rewrite, not
   a power/fold over a single value. That is a genuinely different
   combinator, not a parameter tweak to the existing one, and — usefully
   for the primary RQ — it turns out to be structurally the same thing as
   the **L-Systems / shape-grammar** item `README.md`'s Future Work already
   lists as speculative and out of scope. So this generator, if ever built,
   wouldn't just be a ninth data point for the table above; it would need
   the vocabulary's first genuinely new addition since fold/repeat, and one
   this project had already flagged as future work on independent grounds
   before this stress test confirmed it's needed here too. Stretch goal
   only, not scheduled.
6. **Raised, not resolved** (2026-08-24): a third hybrid candidate —
   Voronoi-seeded Escher tessellation — revisited after the
   noise/reaction-diffusion Islamic alternative was closed as
   won't-complete (redundant with `voronoiIslamic.js`, since both would
   just swap the stochastic *source* feeding the same deterministic
   construction). This one is different: `escher.js`'s interlocking
   depends on edge deformation being periodic and antisymmetric across a
   *fixed-size* tile grid, a property a Voronoi partition's irregular,
   non-periodic cell edges don't have for free. Full design-space
   analysis in `docs/research-plans/VORONOI_ESCHER_HYBRID_PLAN.md` (kept local): a cheap
   raster proxy (reusing `nearestTwoPoints`) may still fit the existing
   vocabulary, but the geometrically correct version needs actual Voronoi
   polygon construction — closer to a graph/incidence structure than a
   per-pixel arithmetic chain, and not obviously an instance of
   atop/fork/constant-bind/fold/repeat. If built, this would be a second,
   independent example (alongside the hat/spectre one above) of a
   construction method that may need something outside the current
   five-combinator set — or, if the raster proxy suffices, a third
   confirming data point at much lower cost. Not scheduled.

## Relationship to existing infrastructure

- `docs/GENERATOR_CONTRACT.md` — the per-generator and per-primitive contracts
  this analysis sits on top of.
- `src/generators/__tests__/` — the property-based test suite; open question 3
  above is a natural extension of it.
- `docs/results/benchmark-results.md` — already produced one piece of evidence relevant
  here: `distanceField.js`'s `nearestPoint` (used by both `voronoi.js` and,
  transitively, `partition.js`) is the one primitive whose empirical cost scales
  with a parameter (`numCells`) rather than staying O(1) per pixel. Now that
  open question 1 is resolved (`grid.js` uses `latticeIndex.js`, not
  `partition.js`), this doesn't apply to `grid.js` — its closed-form per-shape
  arithmetic stays O(1) regardless of tile density, unlike a nearest-point
  search would have been. Worth re-running the benchmark suite to confirm
  this empirically rather than just asserting it from the algorithm's shape.
- `docs/nodes/` — the educational node documentation the secondary,
  demonstration-layer work (node graph UI) is built from; this document's
  composition table is a more formal restatement of relationships that
  documentation already describes informally.
