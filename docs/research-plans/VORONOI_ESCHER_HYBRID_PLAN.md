# Voronoi-Seeded Escher Tessellation — Research Plan

## Status

**Not built, not scheduled.** Raised 2026-08-24 as the better of the two
remaining unbuilt hybrid candidates on `plan-checklist.md` — the
noise/reaction-diffusion-driven Islamic pattern (the other candidate) was
closed as won't-complete the same day, on the grounds that it would just be
a different stochastic *source* feeding the same deterministic construction
`voronoiIslamic.js` already tested, not a new data point. This document
exists to check whether that same objection applies here before any code is
written — see §1.

## 1. Why this is a genuinely different test, not a repeat

Both existing hybrids (`recursiveNoise.js`, `voronoiIslamic.js` — see
`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`'s composition table) turned out
to need at most one new primitive and zero new composition patterns: the
"Fork" and "Repeat" shapes already established by `escher.js` and
`recursive.js` respectively covered them. A third hybrid is only worth
building if there's a real reason to expect a different outcome.

The reason here: `escher.js`'s tessellation only interlocks because its
edge deformation is **periodic and antisymmetric** — every tile is exactly
`tileSize` (`S`) wide, so a bump function `b(t)` sampled at `t = (x mod S)/S`
automatically lines up with the same function sampled from the neighbouring
tile's own local coordinate, and `b(t) + b(1-t) = 0` guarantees the two
traces agree exactly on the shared boundary (see `escher.js`'s and
`escher-svg.js`'s own header comments — this is stated as the load-bearing
correctness property, not an incidental detail).

A Voronoi partition has no such regularity. Cells vary in size and shape;
each shared edge between two neighbouring cells is a distinct line segment
of its own length and orientation (a perpendicular-bisector segment between
two specific seed points), not a fixed-length repeat of the same edge shape
everywhere. Getting a bump deformation to trace consistently from *both*
sides of an irregular, non-periodic edge — so neighbouring cells still
interlock rather than leaving gaps or overlaps — is a problem `voronoiIslamic.js`
never had to solve, because Islamic rosettes are self-contained,
radially-symmetric motifs that don't need to match anything at their own
cell boundary (see that generator's own construction). This hybrid would be
the first one where the *deterministic* half of the composition (Escher's
edge-matching) is stressed by the *stochastic* half's irregularity, rather
than the deterministic half being indifferent to it.

## 2. What already exists to build on

- **`voronoi.js`**: `seedPoints(numCells, seed)`, constant-bind cached, plus
  `nearestPoint(x, y, points)` for per-pixel cell membership. No cell
  *polygon* construction — membership only, the same limitation
  `voronoiIslamic.js` worked within.
- **`voronoiIslamic.js`'s later follow-up** (`docs/planning/plan-checklist.md`'s
  "Second follow-up, 2026-08-21"): `lib/distanceField.js`'s
  `nearestTwoPoints(x, y, points)` — the standard per-pixel proxy for "is
  this point on the Voronoi edge between its two nearest seeds" (equidistant
  from both). This is a genuine boundary *test*, but not a boundary
  *parameterisation* — it answers "am I on an edge," not "where along this
  specific edge am I, and how long is it," which is what a bump function
  needs as its `t` argument.
- **`lib/edgeDeformation.js`'s `bump(t, type)`**: already generic over `t`,
  reusable unchanged once a `t` coordinate along an irregular edge exists.
- **`escher-svg.js`**: for the SVG path, demonstrates that edge tracing at
  N sample points per edge with antisymmetric bump functions is
  computationally cheap once the edge itself (start point, end point,
  outward normal) is known — the missing piece is purely getting that edge
  geometry for a Voronoi cell, not the tracing technique itself.

## 3. The core open design question

Two distinct approaches, differing sharply in cost:

### 3.1 Raster approximation (no polygon construction)

Reuse `nearestTwoPoints` to detect proximity to a cell edge, and derive a
local `t` by projecting the pixel onto the perpendicular bisector line
between the two nearest seeds, then taking that projected position modulo
some fixed period (mirroring `escher.js`'s own `(coord mod S)/S`). This
avoids ever computing the edge's true endpoints or length.

**Risk, to check empirically before committing to this path**: a
perpendicular bisector between two seed points is an *infinite* line: the
actual Voronoi edge is only the finite segment of it bounded by two Voronoi
*vertices* (where three or more cells meet). Applying a periodic bump along
the infinite line rather than the finite segment could produce a
deformation that looks locally plausible near the segment's middle but
visibly wrong near its ends, where the "true" edge has already stopped and
a different neighbour's edge should take over. Worth a fast visual
prototype specifically to check this before investing further — an honest
possible outcome here is "this approximation doesn't look convincing," which
would itself be a legitimate (if less satisfying) finding.

### 3.2 True Voronoi polygon construction

Compute each cell's actual bounding polygon (ordered list of Voronoi
vertices) once, constant-bind cached alongside the seed points — the
standard textbook construction (de Berg et al. 2008, ch. 7; see §5) — then
apply `escher-svg.js`'s existing per-edge tracing technique directly to
each real edge, with `t` genuinely parameterising a finite, correctly-bounded
segment. This is the geometrically correct approach and the only
one that can produce an SVG renderer at all (a raster-only proxy has
nothing to export as vector paths), but it is a materially larger
undertaking: a new primitive (`lib/voronoiPolygon.js` or similar) computing
bounded cell polygons from a seed set is a genuine new capability this
codebase doesn't have anywhere yet, not a recombination of existing
primitives the way every hybrid built so far has been.

**Recommendation if attempted**: prototype §3.1 first, raster-only, as a
fast, low-cost check of whether the compositional question is interesting
before deciding whether §3.2's real cost is justified.

## 4. Predicted compositional structure (a hypothesis, not a result)

Best guess, to be checked against whichever of §3.1/§3.2 is actually built,
in the same spirit as `docs/research-plans/VORONOI_ISLAMIC_HYBRID_PLAN.md` §4's own
prediction (which turned out to need one new primitive, not zero, once
checked):

- §3.1 (raster proxy): `Constant-bind(seedPoints) → Atop(nearestTwoPoints)
  → Atop(project onto bisector, mod period) → Atop(bump)` — plausibly still
  within the existing vocabulary, since it never introduces a genuinely new
  *pattern*, only reuses `nearestTwoPoints` in a new way. If this is what's
  actually needed, it would be evidence *for* the vocabulary's completeness,
  similar to `voronoiIslamic.js`'s own "one new primitive, zero new
  patterns" result.
- §3.2 (true polygons): the polygon-construction step itself doesn't
  obviously fit `atop`/`fork`/`constant-bind`/`fold`/`repeat` — building a
  bounded cell shape from a seed set and its neighbours is closer to a
  graph/incidence construction than a per-pixel or per-cell arithmetic
  chain. If built, this would be the more informative result for the
  primary RQ: either the vocabulary stretches to cover it in a way not yet
  seen, or it's a second concrete example (alongside
  `docs/research-plans/EINSTEIN_APERIODIC_STRETCH.md`'s hat/spectre finding) of a
  construction method that needs something genuinely outside the current
  five-combinator set.

## 5. References

- de Berg, M., Cheong, O., van Kreveld, M., & Overmars, M. (2008).
  *Computational Geometry: Algorithms and Applications* (3rd ed.). Springer.
  DOI: 10.1007/978-3-540-77974-2. Ch. 7 (Voronoi Diagrams) — the standard
  construction §3.2 would be built against, cited here the same way Okabe
  et al.'s *Spatial Tessellations* already grounds this project's other
  Voronoi work (`docs/research-plans/VORONOI_ISLAMIC_HYBRID_PLAN.md` §8) rather than
  re-deriving the construction from scratch.
- Okabe, A., Boots, B., Sugihara, K., & Chiu, S.N. (2000). *Spatial
  Tessellations: Concepts and Applications of Voronoi Diagrams* (2nd ed.).
  Wiley. Already in this project's bibliography; relevant here for the same
  underlying structure, a more applied companion to de Berg et al.'s more
  formal algorithmic treatment.
- NGV Digital Creatives: *Tessellate by Code Workshop Instructions*
  (already cited in `escher.js`'s and `escher-svg.js`'s own header
  comments) — the source for the antisymmetric-bump interlocking technique
  §3.2 would extend from a periodic grid to irregular Voronoi edges.
