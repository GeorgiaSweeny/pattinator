# Generator Contract

Every entry in `GENERATORS` (`src/generators/index.js`) must satisfy this contract.
It exists so generators can be tested, benchmarked, and composed uniformly regardless
of the algorithm each one implements.

## Interface

```
generator(x: number, y: number, params: object) => number
```

* **Pure function of `(x, y, params)`.** Any internal cache (e.g. the Perlin permutation
  table in `noise.js`, the seed table in `voronoi.js`) must be keyed so that it never
  leaks state between distinct `params`. Calling the generator twice with identical
  arguments must return a bitwise-identical result.
* **Domain.** `x` and `y` are pixel coordinates in `[0, CANVAS.WIDTH] × [0, CANVAS.HEIGHT]`
  (`src/config.js`). Generators normalise internally if they need unit-square coordinates
  (see `recursive.js`).
* **Range.** The return value is always a finite number in `[-1, 1]`, for every point in
  the domain and every parameter combination declared in the generator's `REGISTRY`
  entries (`src/patternRegistry.js`) — including the extremes of each param's `map` range.
* **Total.** No parameter combination declared in the registry may throw, return `NaN`,
  or return `±Infinity`.

## Registration

* A generator is registered once in `GENERATORS` under a key.
* Every `REGISTRY` entry references that key via its `generator` field, and its `params[]`
  must be a valid input to the function (unknown/extra keys are ignored safely; declared
  keys are all read).

## Verification

The generic properties above (range, determinism, totality) are checked mechanically for
every `REGISTRY` entry in `src/generators/__tests__/contract.generic.test.js` — adding a
new pattern to the registry automatically gets these checks for free.

Algorithm-specific invariants (e.g. Voronoi partition exactness, Sierpinski self-similarity,
Perlin continuity) live in one property test file per generator, alongside the generic suite.

A separate check, `src/generators/__tests__/registry.params-consistency.test.js`, guards a
failure mode outside this contract: a `REGISTRY` entry declaring a param (and so exposing a
UI control for it) that the generator actually rendering that pattern never reads. It resolves
each entry's real render path — `GENERATORS[generator]` for `nativeFormat: "raster"`,
`SVG_GENERATORS[generator]` for `"vector"` — and asserts every declared param name appears in
that function's source. It caught a live bug: `recursive-svg.js` never read `mode`, so
`recursive-grid` and `sierpinski` rendered identically as vector patterns despite declaring
different `mode` values; fixed by enumerating `grid` mode's running-parity rule alongside
`sierpinski`'s early-exit, matching `recursive.js`'s per-pixel semantics.

Extended 2026-08-21 for raster patterns' `colour1`/`colour2`: these are read
by `render.js`'s `mapColour`, not the generator function itself — a
deliberate split (Colour Mapping is a separate stage from a generator's own
math, the same architectural point every vector pattern's `colourN`/
SVG-renderer split already embodies), so this one check resolves those two
param names against `mapColour` specifically rather than the raster
generator, while every other param still resolves against the generator
as before.

## Shared primitives (`src/generators/lib/`)

A generator satisfies the interface above by composing smaller pure functions, each
corresponding to exactly one node documented in `docs/nodes/`:

| `lib/` module          | Node (`docs/nodes/`)      | Used by                      |
|-------------------------|----------------------------|-------------------------------|
| `rng.js`                | Seed                       | `noise.js` (via `Perlin`), `voronoi.js`, `voronoiIslamic.js` (per-cell `cellVariation` jitter, `islamic.js`'s own `xorshift32Unit` re-derivation) |
| `fold.js` (`foldOctaves`) | Noise (`docs/nodes/core/noise.md`) | `noise.js` |
| `seedPoints.js`         | Seed Points                 | `voronoi.js`, `voronoiIslamic.js` (`generateSeedPoints`; also `nearestNeighbourDistances`, added for `voronoiIslamic.js`'s per-cell radius, section 3.2 of `docs/research-plans/VORONOI_ISLAMIC_HYBRID_PLAN.md`) |
| `distanceField.js`      | Distance Field              | `voronoi.js` (`nearestPoint`), `wave.js` (`distanceToPoint`), `islamic.js`/`voronoiIslamic.js` (`nearestSegmentDistSq`, `pointInPolygon` — the latter added for `islamic.js`'s 2026-08-20 rebuild, see `docs/generators/ISLAMIC_PATTERN_CONSTRUCTION.md`) |
| `partition.js`          | Partition                    | (available; not yet consumed — `grid.js` was checked against it and found to need `latticeIndex.js` instead, see `docs/ALGORITHMIC_COMPOSITION_RESEARCH.md` open question 1) |
| `colourMapping.js`      | Colour Mapping               | `grid.js`, `voronoi.js`, `escher.js`, `islamic.js`, `voronoiIslamic.js` (`toneSet`/`bandTone`); `svgFillsFor`/`DEFAULT_COLOURS`/`mixHex`/`hexToRgb` (added 2026-08-21 for user-editable colours) additionally used by every `*-svg.js` renderer and `render.js`'s `mapColour` (the raster-pattern equivalent of `svgFillsFor`) |
| `edgeDeformation.js`    | Edge Deformation             | `escher.js`                   |
| `subdivide.js`          | Subdivide (`docs/nodes/pattern/subdivide.md`) | `recursive.js`, `recursiveNoise.js` |
| `repeat.js`             | Subdivide's recursive reapplication (`docs/nodes/pattern/subdivide.md`) | `recursive.js`, `recursiveNoise.js` |
| `waveform.js`           | Waveform (`docs/nodes/computation/waveform.md`) | `wave.js` (both modes) |
| `latticeIndex.js`       | Lattice Index (`docs/nodes/computation/lattice-index.md`) | `grid.js` (all five shapes); also `hexagonCentroid` for `islamic.js`'s `tileShape: "hexagon"` |
| `constructionCircle.js` | Construction Circle + Radial Divisions (`docs/nodes/generation/construction-circle.md`, `docs/nodes/pattern/radial-divisions.md`) | `islamic.js`, `voronoiIslamic.js` |
| `starPolygon.js`        | folded into Radial Divisions / Distance Field for `islamic.js` — see `docs/nodes/WORKFLOWS.md` §7 (no separate node type; derives the star-polygon silhouette Distance Field then searches) | `islamic.js`, `islamic-svg.js`, `voronoiIslamic.js` |

This exists so the node graph (ReactFlow) can wrap each `lib/` function as one node
type directly, instead of a fresh implementation per node. A generator file (e.g.
`voronoi.js`) is then just one particular composition of these nodes — the same
composition the node graph should reproduce.

`noise.js`'s fBm octave loop and `recursive.js`'s recursion are now decomposed the
same way: `fold.js` (`foldOctaves`) and `repeat.js` (`repeat`) are the generic
fold/repeat combinators named in `docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`,
tested independently of either generator in
`src/generators/__tests__/lib.fold.test.js` and `lib.repeat.test.js`. Both
`fold.js` and `repeat.js` back an *existing* node (Noise, Subdivide) rather than
introducing a new one — the workflow view a learner sees is unchanged; what
changed is that those nodes' documented behaviour is now backed by tested,
reusable code instead of logic inlined in one generator file.

`recursiveNoise.js` (the Aug 7-9 hybrid — see
`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`'s composition table) is a
different kind of reuse from the table above: it imports `noise()` directly
from `noise.js` — a generator reusing another generator's exported pure
function, not a `lib/` primitive. Both are pure `(x, y, params) => number`
functions satisfying this same contract, so nothing about the interface
above needed to change to allow it; `recursiveNoise.js` is registered in
`GENERATORS` like any other entry and gets the generic contract suite for
free, same as every other pattern.

`voronoiIslamic.js` (the second hybrid — see
`docs/research-plans/VORONOI_ISLAMIC_HYBRID_PLAN.md` and `docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`'s
composition table) is reuse of a different shape again: rather than
importing another generator's exported function, it imports `islamic.js`'s
own exported `snapRotation` and re-implements `islamic.js`'s remaining
silhouette/banding pipeline directly against `lib/starPolygon.js`,
`lib/distanceField.js` and `lib/colourMapping.js` — the same primitives
`islamic.js` itself composes, applied to a per-cell radius/centre derived
from `voronoi.js`'s own point source instead of a fixed grid tile. Still a
pure `(x, y, params) => number` function satisfying this contract
unchanged; still registered in `GENERATORS` like any other entry.
