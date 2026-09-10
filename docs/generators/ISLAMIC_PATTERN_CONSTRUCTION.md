# Islamic Geometric Pattern Generator — Construction Method vs. Reference Paper

## Purpose of this document

`src/generators/islamic.js` and `src/generators/lib/starPolygon.js` originally
carried code comments citing the project's reference source — Sweeny,
*"Maths to Magic and Visual Wizardry: Exploring the Procedural Creation of
Islamic Geometrical Patterns in Houdini"* (NCCA/Bournemouth),
github.com/GeorgiaSweeny/Pattern_Generator_HDA — as the source for
this generator's `{n/k}` star-polygon chord/skip construction, specifically
citing the paper's Figures 17-19. That citation was inaccurate and has been
corrected in the code comments; this document records what the paper actually
contains, what this codebase actually does, and why the two differ. It exists
so the dissertation's own account of this generator can cite the real
relationship rather than repeat the inaccurate comment.

## What the reference paper actually specifies

The paper is an implementation report for a proof-of-concept Houdini digital
asset, not a mathematical reference for star-polygon construction. It never
defines a `{n/k}` star polygon, never states a chord/skip rule, and never
gives a numeric worked example for 6-, 7-, 8- or 10-fold stars.

- **Figures 17-19** ("Motif A", "Motif B1", "Motif B2", pp. ~19-20) are
  screenshots of the author's own tool's *output*. They show what the results
  look like, not how they were constructed — they are not a specification.
- **The paper's actual construction method** (pp. 11-13, Figures 3-5, adapting
  Sayed 2017 / Stiny & Gips 1971 shape grammar) is: translate an initial shape
  (a circle or n-sided polygon) off-centre by a free `Translate` parameter,
  then rotate and duplicate it `n-1` more times evenly around a centre, then
  combine the *n* rotated copies via CSG boolean union/intersection. This is
  richer than, and not reducible to, "place n points evenly on a circle and
  connect them" — the translate distance is a free parameter with no
  equivalent in a pure point-on-circle construction, and the interlaced star
  look in the tool's output is an emergent side effect of the boolean clip
  operation on whole shapes, not of drawing straight chords between polygon
  vertices.
- **Figure 2** (p. 4, credited to Jowers et al. 2010) shows the one genuinely
  traditional method present in the paper: compass-and-ruler construction
  using several overlapping circles at different centres, each new circle
  drawn from the intersections of previous ones. This is presented as
  background/motivation only, not formalised into an algorithm the paper
  implements.
- The paper gives no chord-connection rule, no worked numeric example for any
  `n`, and no radius-ratio discussion for multi-circle constructions.

## What this codebase actually does, and why

`islamic.js` implements a **deliberately scoped-down reading** of the paper's
*mechanism* (radial symmetry generated from a deterministic construction),
not a reproduction of its *method* (translate-rotate-boolean CSG). This scope
decision is independently motivated and already documented in
`docs/design/UI_DESIGN.md` and `docs/nodes/WORKFLOWS.md` §7: this project's node
model is pure per-pixel functions (`docs/GENERATOR_CONTRACT.md`'s
`(x, y, params) => value` contract), and CSG boolean union has no natural
expression in that contract — there is no "shape" object to union, only a
scalar value per pixel. Full shape-grammar authoring is also explicitly out
of scope for the project's educational-node interface
(`docs/design/UI_DESIGN.md`: "users cannot construct new algorithms").

Two modes, both built on the same `Radial Divisions` point ring
(`lib/constructionCircle.js`):

- **`rosette` mode** asks, per pixel, which of the *n* ring points is nearest
  (`lib/distanceField.js`'s `nearestPoint`) and bands that distance into a
  tone set — the same nearest-point search `voronoi.js` uses, fed by a
  deterministic angular point set instead of an RNG-scattered one.
- **`star-lines` mode** builds a `{n/k}` star polygon (`lib/starPolygon.js`)
  by joining each ring point to the one `skip` steps around, then asks which
  *chord* is nearest (`lib/distanceField.js`'s `nearestSegmentDistSq`) and
  bands that through a thresholded Waveform to render crisp lines. **The skip
  formula and the general `{n/k}` star-polygon construction are this
  codebase's own reading of a real, well-known compass-and-ruler technique**
  (join every point of an evenly divided circle to a fixed offset), not
  something transcribed from the reference paper — the paper simply doesn't
  specify one. This is a legitimate, independently-known construction (the
  same one that produces, e.g., a pentagram from 5 points at skip 2), chosen
  because it reproduces the paper's *result* (interlaced star motifs with
  radial symmetry) inside the constraints the paper's own method cannot
  satisfy here.

## A genuine bug found and fixed during this investigation

While auditing this generator against the paper, the paper
question turned out to be a scope-and-citation issue rather than a
correctness bug — but a real, separate bug was found and fixed in
`src/generators/svg/islamic-svg.js`'s `star-lines` mode: it approximated each
chord's periodic echo by scaling the *whole* star polygon about the tile
centre, which moved each echo's endpoints off the constant-perpendicular-
distance band the pixel renderer (`islamic.js`) actually computes, and let
echoes drift outside the tile's SVG `<pattern>` box, clipping into unrelated
fragments. Visually this produced a scattered, illegible mess instead of
nested stars. Fixed by offsetting each chord along its own unit normal —
reproducing the true constant-distance bands — verified visually against the
(already-correct) raster renderer. See `docs/GENERATOR_CONTRACT.md`'s bug log
and the `islamic-svg.js` header comment for the technical detail.

## Rosette medallion shape

The `rosette` mode originally had no `shape` parameter: it banded plain
Euclidean distance to the nearest construction point, and Euclidean distance
contours are circles by definition, so every medallion was necessarily a set
of concentric circles — not the polygonal, straight-edged medallions real
Islamic rosettes use. This was a genuine capability gap (flagged during use,
not a paper-fidelity question this time), not a bug in the existing math.

Fixed by adding a `shape` param (`circle`/`triangle`/`square`/`pentagon`/
`hexagon`/`octagon`/`decagon`) and a new primitive,
`lib/regularPolygon.js`, exposing `polygonRadiusFactor(angle, sides)`: the
boundary radius of a unit-circumradius regular polygon at a given angle,
oriented with a flat edge facing angle 0. Dividing the raw Euclidean
distance by this factor rescales it so that a level set of the rescaled
distance traces the chosen polygon's boundary instead of a circle — because
`polygonRadiusFactor` is itself the radius-at-angle of a *unit*-circumradius
polygon, scaling by any target radius `R` gives exactly the radius-at-angle
of an `R`-circumradius polygon, so the existing band-radius arithmetic
(`rad = (k + 1) / frequency`) needed no other change. Implemented
identically in the raster (`islamic.js`) and SVG (`islamic-svg.js`, via
`polygonPoints` for the vertex list) renderers, and unit-tested independently
of `islamic.js` (`lib.regularPolygon.test.js`).

## Star-lines tile interlace — superseded, kept for the record

**This section and the next describe two intermediate fixes that were each
replaced.** They're kept because the dissertation's account of *why* the
final construction (below, "Final construction: pure translation, no
per-tile transform") is correct depends on understanding what the first two
attempts got right and wrong. The final section is the one that describes
the current code.

The `star-lines` construction radius (`tileSize * 0.42`, shared with
`rosette`) kept every tile's star fully inside its own tile boundary. Since
each pixel's local star geometry is computed purely from its own tile's
local coordinates (`lx`, `ly` relative to that tile's own centre — see the
Grid step in `docs/nodes/WORKFLOWS.md` §7), a tile's rendered star can never
be influenced by a neighbouring tile's construction; the only way two
adjacent tiles' rendered output can connect at their shared boundary is for
each tile's *own* local field, independently evaluated, to agree there. At
radius `0.42 × tileSize`, the star's own geometry never reaches that
boundary at all, so every tile drew a visually isolated star with a gap to
each neighbour — not the continuous interlace real Islamic star patterns
have.

**The fix and why it actually connects, not just looks close.** Star-lines
mode now uses `radius = tileSize / sqrt(2)`. For the default `segments = 8`,
this puts the point at 45° exactly on the tile's corner
(`radius * cos(45°) = radius * sin(45°) = tileSize / 2`), and the
axis-aligned points (0°, 90°, ...) land at `tileSize / sqrt(2) ≈ 0.707 ×
tileSize` from centre along an axis — past the edge midpoint at `0.5 ×
tileSize` — so those points, and the chords through them, extend into the
neighbouring tile's own rendered region.

That alone would only place the same construction over a wider area; it
would not guarantee the two independent evaluations *agree* at the shared
boundary, without a symmetry argument. The construction point set — `n`
points at angles `k * 360°/n`, starting at `0°` — is closed under the
reflection `angle → 180° - angle` whenever `n` is even (true for the default
`segments = 8`, and every even `segments` value), because `180°` is then
itself a multiple of `360°/n`. That reflection is exactly `lx → -lx` in a
tile's local coordinates, so the point set — and everything built from it
(the star polygon's chords, the nearest-chord distance field, the
thresholded waveform) — is an even function of `lx`: `f(lx, ly) = f(-lx,
ly)`. Two tiles sharing a vertical boundary evaluate the *same* function `f`
(same `segments`, `frequency`, radius) at mirrored local positions
(`tileSize/2 - ε` for the left tile, `-tileSize/2 + ε` for the right one),
so `f` being even in `lx` means they compute the identical value there —
the stars connect exactly, not approximately. (The equivalent argument for a
horizontal boundary uses evenness in `ly`, which holds by the same
reasoning since the point set is also symmetric about the horizontal axis.)

Verified visually (raster and SVG) at `segments` 6, 8 and 10, and via the
existing property-test suite's independent oracle
(`islamic.property.test.js`), updated to the new radius.

**The mirror-symmetry argument requires `segments` to be even — flagged by
a user report that odd segment counts looked wrong.**
The argument above needs the point set closed under `angle → 180° - angle`
(for `lx → -lx`) and under `angle → -angle` (for `ly → -ly`). The second
holds for any `segments`, since the points `k * 360°/n` are always closed
under negation. The first only holds when `180°` is itself a multiple of
`360°/n`, i.e. `n` even. More generally: a regular n-gon has `n` symmetry
axes spaced `180°/n` apart; for odd `n` every axis runs vertex-to-opposite-
edge-midpoint (no two vertices are ever exactly opposite), and no two axes
in that family are perpendicular unless `n` is even — so **the star's own
geometry** cannot simultaneously be symmetric about both the horizontal and
vertical tile boundary when `n` is odd. This is a real geometric fact, not
an implementation gap, and it is why traditional Islamic square-grid star
tilings are conventionally even-fold.

**First attempt (superseded): snapping `segments` to the nearest even
count.** This made the seam disappear, but at the cost of the actual
capability — a request for a 5-, 7- or 9-pointed star silently became a 6-,
8- or 10-pointed one. Flagged as unacceptable: odd-fold stars are
genuinely used in real Islamic geometric art (rosettes, and — the point
this codebase had missed — compound tilings where odd-fold motifs *are*
tiled periodically, just not by relying on the motif's own symmetry to
match its neighbour).

**The actual fix: alternating per-tile reflection (checkerboard flip),
the same technique `grid.js` already uses for its diamond and brick
shapes.** The seam-matching requirement doesn't need the star's own
geometry to already be symmetric — it only needs the two tiles sharing a
boundary to *evaluate to the same value there*, and a shape always matches
its own mirror image exactly along the mirror line, by definition, for any
shape at all. So instead of relying on `f` being even in `lx`/`ly`, each
tile mirrors its own copy of the (otherwise identical) star based on its
own column/row parity: `qx = (col is odd) ? -lx : lx`, `qy = (row is odd) ?
-ly : ly`, before searching for the nearest chord. Two tiles sharing a
vertical boundary — one with even column parity, one odd — evaluate the
same underlying function `f` at coordinates that are exact negatives of
each other in the reflected axis, which is precisely what makes them
agree, regardless of whether `f` itself has any symmetry. This works for
*any* `segments`, even or odd; for even `segments` the star already had
the symmetry, so the flip is a no-op there and behaviour is unchanged from
the first (even-only) fix.

Implemented identically in the raster (`islamic.js`) and SVG
(`islamic-svg.js`) renderers. The SVG case needed more care: a native SVG
`<pattern>` only supports pure-translation repeat, so it can't alternate a
transform per tile the way a per-pixel raster loop can. Worked around by
building one 2x2 "super-tile" containing all four flip combinations
(unflipped, x-flipped, y-flipped, both), then repeating *that* — the same
alternation, just baked in once per four tiles instead of decided per pixel.

One consequence worth recording precisely: the true repeat unit for
star-lines mode is now **two tiles wide**, not one — `islamic(x, y) ===
islamic(x + 2*tileSize, y)`, not `+ tileSize`. The existing periodicity
test asserted period `tileSize` for both modes; split into a `rosette`
version (still period `tileSize`) and a `star-lines` version (period
`2*tileSize`), each accurate to its mode.

Verified visually (raster and SVG) at `segments` 5, 6, 7, 8, 9 and 10 —
genuine connected 5-, 6-, 7-, 8-, 9- and 10-pointed star tessellations, no
seams, and the even cases render identically to before. Added a dedicated
regression test (`islamic.property.test.js`: "tiles seamlessly across a
tile boundary for any requested segment count") sampling both odd and even
`segments` and checking pixels immediately either side of a tile boundary
agree exactly — the existing periodicity test did not catch the original
seam bug at all, since it only checks a single tile's self-consistency
under exact translation, not whether two independently-evaluated adjacent
tiles agree at their shared edge.

**A second bug this exposed.** The SVG renderer's star-lines echoes (added
by the earlier "SVG rendering bug" fix above) drew every chord's every
periodic echo unconditionally, offset along that chord's own normal. At the
old small radius this happened to look reasonable because different chords'
echo families rarely overlapped much. At the new, larger radius the chords
are long enough that eight overlapping families of parallel stripes at
different angles paint nearly the whole tile black — the vector
approximation broke down. The raster renderer never had this problem
because it only ever asks "what is the *nearest* chord here", a genuine
per-pixel Voronoi-like partition among the chords that only ever shows one
echo layer at a time; the SVG version's unconditional per-chord echo loop
was always an approximation of that, not an exact reproduction, and it
stopped being a good one at this radius. Fixed pragmatically by dropping the
echo loop and drawing only the star's own base chords (`k = 0`), which
already closely matches the raster's dominant visual structure at this
radius — a known, documented simplification (the SVG renderer omits the
finer periodic-echo detail the raster's Waveform technically produces
beyond the star itself), not a claim of exact per-pixel equivalence.

## Construction radius: exact matching isn't the same as a good pattern — superseded, kept for the record

The checkerboard-flip fix above makes adjacent tiles match *exactly*
regardless of radius — that guarantee doesn't depend on how big the star
is. But at the radius the interlace fix originally used
(`tileSize / sqrt(2)`, chosen only to make even-`segments` stars reach the
tile's corners), odd-`segments` stars produced a technically-seamless but
visually poor result: columns of stars joined mainly by a single straight
line and a thin diamond connector, not a woven 2D lattice. Flagged as "not
valid Islamic-style patterns" — correct: exact boundary matching is
necessary for a seamless tile, but it says nothing about how *much* of the
tile the star's chords actually cross, and at that radius, too little of
each odd star's geometry extended into its neighbours for a dense weave.

The distance-banding construction is periodic in radius (`dist * frequency`
wraps every `2*pi/frequency`), so the visual density doesn't increase
smoothly with radius — it cycles through qualitatively different
structures, some dense and richly woven, others sparse (isolated dots,
thin diagonal bands), and where a given `segments` value lands in that
cycle varies by `segments` too. Swept `radius` against `segments` in
{4..11} to find a value that produces a dense, richly-crossing interlace
across that whole range: `radius = tileSize` (dropping the `/sqrt(2)`
factor entirely) does — verified visually for both even and odd
`segments` (5 through 11), raster and SVG, and live in the app. Smaller
values (including the original `tileSize/sqrt(2)`) technically still tile
correctly but under-fill the tile for several `segments` values, reading
as sparse rather than woven.

**This radius (`tileSize`) was itself superseded within the same session —
see the final section below.** Increasing the radius fixed density, but a
closer look at the *checkerboard flip's own* boundaries (not just whether
colours matched, but whether lines flowed smoothly across them) surfaced a
second, more fundamental problem the flip approach could never fully solve.

## Final construction: pure translation, no per-tile transform

**The checkerboard flip's real flaw.** Matching *colour* at a boundary
(no gap) is not the same as matching *slope* (no visible crease). A
reflection reverses the tangential component of any line crossing the
mirror axis at a non-perpendicular angle — it preserves position exactly
(which is what made the colour-matching proof work) but not direction.
Zoomed-in renders at a tile boundary showed this directly: value matched
exactly (no colour gap, as proven), but a chord crossing the boundary
obliquely formed a sharp "V" crease exactly at the seam, because the
continuing "chord" in the neighbouring tile was actually *this* chord's
mirror image, not its straight continuation. Higher `segments` (8, 9...)
mostly hid this, because more of their chords happen to cross near-
perpendicular to the boundary (which don't crease); lower counts have
fewer chords, so the ones that do cross are more likely to hit obliquely
and show the crease clearly — exactly the "doesn't close to Islamic style
until 8/9" pattern flagged by testing. This is inherent to using a
*reflection* to force two independently-evaluated tiles to agree — no
choice of radius or line width fixes it, because it's a property of the
transform itself, not a tuning parameter.

Two things were tried and rejected before the actual fix:

- **Rotating the whole point ring by a fixed offset** (e.g. so a 4-sided
  polygon shows flat-side-up as a diamond rather than point-up as a
  square): doesn't help. The crease comes from needing a *different*
  transform for alternating tiles, not from the ring's own absolute
  orientation — a global rotation applied identically to every tile
  changes what the pattern looks like, not whether adjacent tiles need to
  disagree in orientation to match.
- **180-degree point rotation instead of axis reflection**: rotation
  preserves chord slope (a rotated line is parallel to the original, so no
  crease), and is worth recording why it doesn't fully solve this either.
  The construction's point set (`angle_k = k * 360/n`, starting at 0) is
  *always* symmetric under negation (`f` even in `ly`, for any `n` — the
  x-axis reflection symmetry always holds), but only symmetric under
  `angle -> 180 - angle` (`f` even in `lx`) when `n` is even — an asymmetry
  that comes from starting the ring at angle 0, not a coincidence. Working
  through the checkerboard-by-`(col+row)`-parity rotation case for both a
  vertical and a horizontal boundary shows it reduces to needing the
  *always-true* symmetry for one boundary direction but the *only-if-even*
  one for the other — so a single rotation-based scheme cannot fix both
  boundary directions for odd `n` either. (This also revealed that the
  shipped checkerboard fix's *row*-based flip was doing nothing at all:
  since `f` is already always even in `ly`, flipping `ly` never changes
  the computed value — removing it produced pixel-identical output. Only
  the *column* flip was ever load-bearing, and it's exactly the one
  responsible for the crease.)

**The actual fix: tile by pure translation only, and search neighbouring
tiles' copies for the nearest chord.** Real periodic tiling of an
overlapping motif doesn't require every tile to independently reconstruct
a locally-consistent boundary — it requires one fixed shape, repeated
identically (translated, never reflected or rotated) at every lattice
point, with distance measured to the globally nearest copy of that shape.
Since translation never reverses a line's direction, there is no
mechanism for a crease to appear, for any `segments`, at any radius:

```
edges = starEdges(segments, radius)   // one fixed shape, built once

minDistSq = infinity
for dc in -1..1, dr in -1..1:         // this tile + its 8 neighbours
   (qx, qy) = (x, y) relative to lattice point (col+dc, row+dr)
   minDistSq = min(minDistSq, nearestSegmentDistSq(qx, qy, edges))

dist = sqrt(minDistSq)
```

Checking a 3x3 neighbourhood (not just the current tile) is what makes
this correct rather than merely different: since the star's radius can
exceed the tile's own half-width, the pixel's true nearest chord may
belong to an adjacent tile's copy. Nine is provably sufficient for
`radius <= tileSize` — a lattice point two tiles away is always farther
from any point in the current tile than that lattice point's own star can
reach.

**A consequence for the construction radius.** Once neighbours are
searched, a large radius (the `tileSize` value from the previous section)
means *many* nearby chords compete for "nearest", which — combined with
the periodic echo wave — produced excess density (large areas reading as
solid black). Re-swept radius under the corrected (translation-only,
neighbour-searched) construction and found `radius = 0.6 * tileSize` gives
a dense, richly-crossing, crease-free interlace across `segments` 4
through 11 — confirmed both with and without the periodic echo wave
included.

**A consequence for the SVG renderer.** Because there's no longer any
per-tile transform to reproduce, the SVG renderer no longer needs the 2x2
super-tile from the checkerboard-flip fix — native SVG `<pattern>`
tiling *is* pure translation, so a single star drawn once, sized to extend
past its own tile box, reproduces the same overlap-and-search behaviour
for free (the browser naturally layers each repeated tile's own stroke
drawing, and a pixel covered by *any* nearby tile's stroke is exactly the
raster's "within threshold of the nearest chord" condition, for the
same-as-before reason that the SVG renderer already omits the periodic
echo layers — see the SVG rendering bug section above).

**A consequence for exact rotational symmetry.** The property-test suite
had verified exact `n`-fold rotational symmetry about each tile's own
centre. That no longer holds in the strict sense for star-lines once
neighbours are close enough to be the nearest chord: the *square lattice*
of neighbouring tile centres is itself only symmetric under 90/180-degree
turns, not an arbitrary `360/segments` one, so a rotation that's exact for
a single isolated star is not exact once nearby lattice points can
contribute. What remains exactly true — and is what actually matters for
a correct tiling — is periodicity (`islamic(x, y) === islamic(x +
tileSize, y)`, verified) and boundary agreement (verified directly).
`rosette` mode is unaffected (its medallion, at `0.42 * tileSize`, never
reaches its own tile's boundary) and keeps the exact rotational-symmetry
test.

Verified visually (raster and SVG, with and without the periodic echo
wave) at `segments` 4 through 11 — zoomed-in renders at tile boundaries
confirmed no crease at any tested value, unlike the checkerboard-flip
version. Verified live in the browser. All property tests updated to
match: the oracle test now searches the same 3x3 neighbourhood; the
periodicity test is back to a single `tileSize`-period test covering both
modes (translation-only tiling has no reason to need two tiles per period,
unlike the flip version); the rotational-symmetry test is restricted to
`rosette` for the reason above; the boundary-seam regression test's
rationale was updated to describe the translation-based guarantee.

## Rebuild: one accurate rosette construction, not two approximations

Everything above this section describes the *original* two-mode
`islamic.js` and its evolution. That whole design was flagged as
inaccurate: `rosette` mode banded plain distance to the nearest of
`segments` ring points — level sets were circles (or, with `shape`, a
generic regular polygon unrelated to the actual points), not a real
rosette silhouette — and `star-lines` mode drew the raw `{n/k}` star
polygon's chords, thresholded through a sine wave to fake a line width,
which is a star shape but not a proportioned, filled rosette. Worse,
the two modes were unrelated constructions sharing only their starting
point ring, despite both claiming to render "an Islamic rosette" — the
user suggested merging them into one generator, since geometrically they
aren't different things.

### The reference source, and why it isn't transcribed literally

The user pointed at
`drawingislamicgeometricdesigns.com/basic-rosettes-anthony-lees-methods`
(Anthony Lee's compass-and-straightedge method for basic rosettes) as a
reference. Two separate `WebFetch` passes were made on that page, with
different, increasingly specific prompts asking for the exact labelled
construction steps. They came back **inconsistent with each other** on
several point labels and the exact sequence of circles/bisectors
involved — expected, since the page's actual content is diagrams (the
labelled points `a`, `b`, `g`, `P`, `oa`, `ob`, `oc`, etc. only make
sense next to the drawings), and an HTML→markdown text extraction can't
carry that. Both fetches agreed on the *shape* of the method, though:
divide a circle into `2n` parts, use one small "critical proportioning"
relationship to derive every other measurement in the drawing (not
independent free choices), and the result is one shape combining a
central star with petals reaching out to a bounding polygon.

Rather than guess at the specific labelled steps from two contradictory
summaries, this rebuild implements the piece of that method which is
both genuinely faithful to the description above *and* independently,
exactly verifiable without a diagram: the classic `{n/k}` star polygon's
own **silhouette** — its self-intersection outline, not its raw chords.

### The construction

`lib/starPolygon.js`'s new `starOutline(points, skip)`:

1. `n` **tip** points on a circle (the existing Radial Divisions ring),
   angles `i * 2π/n`.
2. `skip` fixed at 2 — the standard "basic star" skip (a pentagram at
   n=5, the same family at any `n`), matching the source page's own
   title. `starPolygon.js`'s existing `starSkip(n)` picks a different
   skip tuned for the old `star-lines` mode's different visual goal, so
   this doesn't reuse it.
3. `n` **waist** points: for the gap between tip `i` and tip `i+1`, the
   two star-polygon chords nearest that gap — `(tip_i, tip_{i+skip})`
   and `(tip_{i+1}, tip_{i+1-skip})` — are exact mirror images of each
   other about the bisector angle between tip `i` and tip `i+1` (provable
   directly from the ring's rotational symmetry), so they're guaranteed
   to cross exactly on that bisector. A new generic `lineIntersect`
   helper computes that crossing directly from the two chords' own
   endpoints — no trig derivation to get right, just real line-line
   intersection of geometry that already exists.
4. The closed 2n-vertex silhouette
   `[tip_0, waist_0, tip_1, waist_1, ...]` — star and petals as one
   shape, with one proportioning relationship (`skip`) determining
   everything else, same as the source method's own "single circle
   determines all the proportions" claim.

**Sanity check that clinched this was right, not just plausible:**
for `n = 5`, the waist/tip radius ratio this produces came out to
exactly `1/phi^2` (~0.382) — the well-known golden-ratio proportion of a
regular pentagram. That's not a value this construction was tuned
toward; it fell out of the general `n`-point formula applied at `n = 5`,
which is strong independent evidence this is genuine star-polygon
geometry rather than an approximation that merely looks plausible.
Verified as a unit test (`lib.starPolygon.test.js`).

### Rendering: one signed distance field, not two code paths

`islamic.js` now computes `nearestSegmentDistSq` (distance to the
silhouette's own boundary edges) and `pointInPolygon` (which side of
the boundary a pixel is on, new in `lib/distanceField.js`), combines
them into one signed distance (negative inside, positive outside), and
bands that by `frequency`/`tones` through the same Colour Mapping
formula every other radial-banding generator already uses. A filled
medallion (many tones, low frequency) and a thin traced outline (high
frequency) are now the same formula at different parameter values,
rather than a `mode` switch between two different pieces of code — the
LINE_WIDTH-thresholded-Waveform path the old `star-lines` mode used is
gone entirely.

Tiling: each tile draws one self-contained medallion
(`radius = 0.42 * tileSize`, the old `rosette` mode's already-tested
value) with no cross-tile interaction — a rosette is one bounded motif,
so unlike the old `star-lines` mode's chord construction there's nothing
that needs to reach into a neighbouring tile, and the 3x3-neighbour
search that mode required is gone too.

### SVG renderer: two more real bugs found and fixed while building this

`islamic-svg.js` was rewritten to draw the same silhouette. Two
approaches were tried and rejected before the working one, both caught
by rendering actual output (via headless Chrome, not just "does it
throw") rather than assuming the geometry translated directly:

1. **Scaling the whole silhouette per band.** Plausible-looking code,
   visibly wrong output: scaled copies of a non-circular shape don't
   give constant-width bands — near a sharp waist vertex, a given change
   in scale moves the boundary far less than the same change does near a
   tip, so band width varies wildly around the shape. Rendered as a
   dense fan of stripes radiating from each tip, worst for low
   `segments` (sharper waists).
2. **True perpendicular polygon offsetting, uncapped.** Each edge
   shifted along its own normal, new vertices from consecutive edges'
   intersection (the standard "straight skeleton" offset) — correct in
   principle, and confirmed correct in isolation (a single offset star,
   undamped, rendered as a clean nested shape). Broke in two ways once
   used for real: inward offsets **invert** through a collapse point once
   the offset exceeds a concave vertex's own local scale (a real,
   well-known limitation of naive polygon offsetting, not a coding
   mistake) — detected here as "this vertex's radius stopped
   decreasing" and capped; and SVG `<pattern>` content does **not**
   auto-clip to its own declared tile size, so bands wide enough to
   reach past the tile (which they do quickly for acute tip angles — an
   uncapped sharp miter at an 18-degree tip half-angle, n=5's case,
   extends a vertex over 3x the offset distance) bled into neighbouring
   tile repeats and produced the same kind of moiré tangle as approach 1,
   for an unrelated reason.

The fix: cap both offset directions at a small fixed band count
(`MAX_BANDS`), apply a real `MITER_LIMIT` so sharp tip corners bevel
instead of extending arbitrarily far (the same idea as SVG's own
`stroke-miterlimit`), and add an explicit `<clipPath>` matching the
tile's own box so unclipped content genuinely can't bleed into
neighbouring repeats. Verified visually (headless Chrome screenshots,
not just eyeballing a preview) at `segments` 5, 6, 8, 10: 6/8/10 render
as clean nested medallions matching the raster renderer; 5 renders as a
dense but non-chaotic chevron pattern — an honest result of 5-fold
symmetry not tiling a simple square lattice as cleanly as even divisors
do (a real mathematical constraint — the crystallographic restriction
theorem — not a renderer bug), not the illegible noise the two rejected
approaches produced.

### What was removed

`SHAPE_SIDES`, the `shape` param, and `lib/regularPolygon.js` (now
unused anywhere in the codebase, deleted along with its test) — the
"rescale distance to trace a generic n-gon" idea it implemented is
superseded by the actual star-polygon silhouette, which needs no
separate shape parameter. `islamic.js`'s `LINE_WIDTH`-thresholded-
Waveform sine wave is gone entirely, replaced by the signed-distance
banding above; `islamic-svg.js` has its own unrelated `MITER_LIMIT`
constant (SVG offset geometry, not raster banding — see below). The
`mode` param, the two `patternRegistry.js` entries
(`islamic-rosette`, `islamic-star-lines`) collapsed into one
(`islamic-rosette`, generator `islamic`), and the corresponding
`workflows.js` mode-branching all removed — see
`docs/nodes/WORKFLOWS.md` §7 for the current single node sequence.

## Summary for citation purposes

- The paper is correctly cited as *inspiration and motivation* for building an
  Islamic geometric pattern generator, and for the general idea that radial/
  circular symmetry underlies these patterns (its Figure 2, from Jowers et
  al. 2010, and its shape-grammar framing from Sayed 2017 / Stiny & Gips
  1971).
- The paper should **not** be cited as the source of this codebase's `{n/k}`
  chord/skip construction — that construction is independent, standard
  star-polygon geometry, applied here as this project's own scoped-down,
  pure-function-compatible reading of the paper's boolean-CSG method.
- `drawingislamicgeometricdesigns.com/basic-rosettes-anthony-lees-methods`
  (Anthony Lee's rosette method) is correctly cited as the prompt for the
  2026-08-20 rebuild and as the source of its general shape (`2n` circle
  divisions, one proportioning relationship deriving the whole star+petal
  silhouette). It should **not** be cited as the source of the specific
  `starOutline` construction (tip ring + chord self-intersection waists) —
  two independent `WebFetch` passes on that page came back mutually
  inconsistent on its exact labelled steps, so that construction is this
  codebase's own standard star-polygon-silhouette geometry, chosen because
  it's independently verifiable (the n=5 golden-ratio check above) without
  needing to trust either fetch.
- Wikipedia's "Islamic geometric patterns" article (fetched 2026-08-10,
  motivating the `starSkip(n)` fix below) should **not** be the citation
  used in the write-up for the "polygons in contact" claim it was fetched
  for — it's a convenient tertiary source, not the academic one. Use
  **Kaplan, C.S. & Salesin, D.H. (2004). "Islamic Star Patterns in
  Absolute Geometry." *ACM Transactions on Graphics*, 23(2), 97–119**
  instead, found while researching references for
  `docs/research-plans/VORONOI_ISLAMIC_HYBRID_PLAN.md` — see that fix's own
  section below for the correction in full.

## `segments` 3 and 4, and hexagon tiling

Two follow-up requests, both about the shape of the tiling rather than the
medallion's own geometry.

**`segments = 3` and `4` didn't render.** `starOutline`'s waist derivation
(chord `(tip_i, tip_{i+2})` crossing chord `(tip_{i+1}, tip_{i-1})`) is
only non-degenerate for `n >= 5`. At `n = 4`, `tip_{i+2}` is `tip_i`'s
*diametrically opposite* point, so every such chord is a diameter through
the centre, and every waist collapses onto that single centre point — a
pinched, effectively invisible medallion. At `n = 3`, `tip_{i+2}` (mod 3)
is just `tip_i`'s other neighbour on a 3-point ring, so the "star" chords
are the triangle's own edges and every waist coincides with its
neighbouring tip — again nothing star-shaped renders. Both are genuine
mathematical degeneracies of the `{n/2}`-chord-intersection construction
at those specific small `n`, not a bug in `starOutline` itself (verified:
`starOutline` computed exactly what the geometry implies in both cases,
correctly).

Fixed in `islamic.js`/`islamic-svg.js` with a `_skip(n)` helper:
`n >= 5` keeps `skip = 2` as before; `n = 3` or `4` uses `skip = 1`
instead, which makes the "star" degenerate on purpose to the tip ring
itself (waist = tip, a plain filled n-gon medallion) — a real, valid,
non-collapsed rosette reduction rather than a broken one. Also widened
`patternRegistry.js`'s `segments` range from `[4, 16]` to `[3, 16]`,
since the underlying bug meant 3 was never reachable through the UI at
all even before considering whether it rendered. Verified visually
(raster and SVG) at `segments` 3 and 4: clean concentric triangle/square
medallions, matching every other `segments` value's rendering style.

**Tile shape: square or hexagon, rosette centred on each tile's own
centroid.** Added a `tileShape` param (`"square"` default, `"hexagon"`).
Reuses `grid.js`'s existing pointy-top hex-tiling math
(`lib/latticeIndex.js`) rather than inventing new lattice arithmetic:
that file's `hexagonIndex` already rounds a pixel to its cube-coordinate
hex cell for colouring purposes, refactored (no behaviour change) to
share a `_hexCell` helper with a new `hexagonCentroid(x, y, size)`, which
converts that same rounded cell back to its Cartesian centre — the
inverse of the axial-to-pixel transform `hexagonIndex` already used.
`islamic.js` picks `_squareCentroid` or `hexagonCentroid` per
`tileShape` and otherwise proceeds identically (same local-coordinate
distance field, same self-contained-medallion radius), so "start each
tile's pattern at its own centroid" — square or hexagon — was already
true for the square case and is now equally true for hexagon.

The SVG renderer needed real new geometry, not just a coordinate swap:
native SVG `<pattern>` only tiles a plain rectangle, and a pointy-top
hex's own width equals one full horizontal lattice period, so *every*
hex cell straddles a rectangular pattern tile's edge in some direction —
there's no way to place it fully "inside" one tile the way a square
naturally sits inside a square tile. Handled with the standard two-
hex-per-rectangle repeat unit (`_hexPattern`, `W = tileSize * sqrt(3)`,
`H = tileSize * 3`, matching `hexagonCentroid`'s own lattice vectors
exactly, so "which hex cell" and "where does the SVG draw it" can't
disagree), with each hex's rings additionally drawn at every tile-period
offset in a 3x3 super-grid and clipped to that one hex's own boundary
(a `<clipPath>` hexagon, not the whole pattern box) — brute-forced
rather than computing the one minimal offset each cell actually needs,
since getting that direction wrong would silently drop content at a
seam and the redundant extra draws are cheap at this scale. Verified
visually (headless Chrome) at `segments` 6 and 8: honeycomb-offset rows
of rosette medallions, no gaps or bleed between cells, matching the
raster renderer's own hex-centroid placement.

## Vertical alignment of the initial tip ring

`Radial Divisions` (`radialDivisions(circle, n, rotation)`) defaults
`rotation` to 0, placing tip 0 rightward on the horizontal axis. That's
an arbitrary starting angle with no particular relationship to the
tiling grid — for most `n` it makes the medallion symmetric about its
own *horizontal* axis (point 0 and its mirror under negation both land
on real tips) but not necessarily its *vertical* one, so left/right
neighbours in a row didn't visually line up mirror-for-mirror.

Fixed by passing `rotation = Math.PI / 2` (tip 0 at the top) at every
call site (`islamic.js`, `islamic-svg.js`, the property test oracle): a
regular n-gon with a vertex sitting exactly on an axis is automatically
mirror-symmetric about that same axis, for any `n`, so putting tip 0 on
the vertical axis makes every medallion symmetric left-to-right — every
`n`, not just the ones where the old rightward start happened to line
up that way. Verified directly (not just visually): for `segments` 3
through 8, `islamic(x, y) === islamic(tileSize - x, y)` for 2000 random
points per `n`, holds exactly.

## Line art, not filled bands

Flagged: most `segments` below 8 (other than 4) looked "strange" and not
in keeping with Islamic geometric style. The construction itself
(`starOutline`) wasn't the problem — it's the same accurate silhouette
either way — the *rendering* was: filling the concentric bands between
echoes with alternating tones reads as a dense op-art texture at low
`segments`, not the thin traced line-work real Islamic geometric patterns
actually use.

Fixed by tracing lines instead of filling bands. `islamic.js` no longer
returns `shades[idx]` for a band index `idx`; it computes how far the
current pixel's signed-distance position (`signedDist * frequency`) sits
from the nearest whole number — the band boundaries, which are exactly
the multiples of one echo spacing, the medallion's own edge being the
`k = 0` one — and returns the line colour (`shades[shades.length - 1]`)
if that's within `LINE_WIDTH` of a boundary, the background colour
(`shades[0]`) otherwise. `LINE_WIDTH` (0.18, a fraction of one echo's
spacing, not an absolute pixel width) reuses the same "fixed by the
technique, not a free parameter" idea the pre-rebuild `star-lines` mode's
own `LINE_WIDTH` used.

`islamic-svg.js` matches: every band boundary polygon (the base outline,
each outward offset, each inward offset) is now drawn `fill="none"
stroke="..."`, not filled, with `stroke-width` derived from the same
`LINE_WIDTH` fraction. This also let `MAX_BANDS` reasoning simplify
somewhat — a self-intersecting *stroke* just draws a few stray extra
lines rather than a solid mangled fill region, a softer failure mode —
though the actual safe count (2) didn't change: verified visually that 3
already visibly tangles at `segments = 5`, the sharpest tip angle in the
tested range.

Verified visually (raster and SVG, headless Chrome) across `segments` 3
through 8: clean traced star/rosette outlines with concentric echo
lines, immediately recognisable as Islamic geometric line-work at every
tested value, not just the ones that happened to look fine as filled
bands before.

## Fixing the full `segments` range, not just 3-8

Flagged again: patterns still didn't all display as expected — the
previous fixes were verified mainly at `segments` 3-8, and the
registry's actual declared range is 3-16. Rendering the full range
exposed two more real problems, both matching the user's own hypothesis
that some parameters need to be constrained *relative to* `segments` (or
another param) rather than treated as independent free values — this
project's Wikipedia source was fetched again for this pass; see the
"What the sources establish" note below for what it actually confirmed
versus what remained this codebase's own reasoning.

**1. A fixed `skip = 2` stops looking like a star as `segments` grows.**
`starOutline`'s waist/tip radius ratio is a function of both `segments`
and `skip` — holding `skip` constant while `segments` grows shrinks the
angle the two waist-defining chords subtend at the centre, so the ratio
drifts toward 1 (a near-circle). Measured directly: `skip = 2`'s ratio is
0.38 at `segments = 5` but 0.90 at `segments = 12` — confirmed visually
too, `segments` above about 8 rendered as a dense field of wavy
near-concentric-circle echoes with only a faint wobble, not a
recognisable star.

Fixed by switching to `lib/starPolygon.js`'s existing `starSkip(n)` —
already in the codebase (built for the pre-rebuild `star-lines` mode,
never reused here because "that formula was tuned for star-lines'
different visual goal") — instead of a second, bespoke skip choice.
Turns out to be exactly the right general-purpose primitive for this
too: `starSkip(n)` keeps `skip` roughly proportional to `n` (about `n/3`),
which keeps the waist/tip ratio in a consistent ~0.35-0.6 band for every
`segments` from 3 to 16 (verified numerically), and — a bonus, not
targeted — already handled `segments` 3 and 4's degeneracy correctly
(`starSkip(3) = starSkip(4) = 1`), so the bespoke `_skip` helper the
previous fix added for exactly that case could be deleted entirely
rather than kept alongside it. One shared, already-tested primitive
instead of two overlapping ones — the "keep the node/primitive set
minimal and general" principle this project already follows elsewhere
(`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`), applied to a case found
after the fact rather than planned into the first pass.

**2. `frequency` was a raw spatial frequency, not scaled to the
medallion's own size.** `step = 1 / frequency` means the same
`frequency` value produces the same *absolute* ring spacing regardless
of `tileSize` — fine at whichever `tileSize` it was last visually tuned
against, but at the registry's declared extremes (`frequency` up to 0.4,
`tileSize` down to 40) the same spacing crams far more rings into a much
smaller medallion, degrading into an illegible dense scribble.
Confirmed this wasn't actually a `segments`-dependent problem (unlike
issue 1 above) — `segments = 3` broke exactly the same way as `segments
= 16` at high `frequency` — so the fix scales by radius, not `segments`:
`step = radius / frequency`, making `frequency` mean "roughly how many
rings fit across the medallion" consistently across the whole declared
`tileSize` range instead of an absolute spacing. Registry range changed
from `[0.05, 0.4]` to `[1, 6]` to match the new units (both `islamic.js`
and `islamic-svg.js` updated identically; `islamic-svg.js`'s echo-band
stroke width, itself derived from `step`, scales the same way for free).

**3. The SVG renderer's safe echo-band count depends on `segments` too,
separately from the skip fix above.** Once `starSkip` made higher
`segments` render as genuinely sharp stars again, `islamic-svg.js`'s
fixed `MAX_BANDS = 2` (chosen against the *old*, blunter `skip = 2`
shapes) started producing a solid merged ring at `segments` above about
11 — not the earlier miter-overshoot failure (`MITER_LIMIT` still bevels
each corner correctly), but a density failure: `starOutline`'s
silhouette has `2 * segments` vertices, so higher `segments` packs more
offset edges into the same medallion radius, and their offset copies
start overlapping each other before any individual corner even reaches
the miter limit. Fixed with `_maxBands(n)`, a small step function matched
directly against rendered output rather than derived from theory:
`segments <= 8` → 2 bands, `9-11` → 1, `12+` → 0 (just the accurate base
outline, no decorative echoes — the raster renderer has no such limit,
so this is a documented SVG-only simplification, consistent with this
file's other SVG-specific notes). `segments = 5` needed an extra
individual case (1 band, not 2) for an unrelated reason: `starSkip(5) =
2` is the single sharpest tip angle in the whole tested range, sharper
than `segments = 6` at the same skip and sharper than `7-8`'s own
`skip = 3`.

**What the sources establish, and what doesn't come from them.** The
user supplied Wikipedia's "Islamic geometric patterns" article for this
pass. It confirms the real construction is "polygons in contact" (Hankin's
term, quoted directly): a grid of touching regular polygons, each
polygon's own side count setting the star that forms there (its own
example: "every octagon is the basis for an 8-point star"), with
compass-and-straightedge construction throughout. That's consistent with
this generator's basic shape (one `n`-sided motif per tile) but the
article doesn't specify contact angles, the classical acute/median/
obtuse system, `{n/k}` notation, or any worked numeric example — so, as
with the previous session's source, this fix is this codebase's own
star-polygon geometry (now via the shared `starSkip` primitive) rather
than a transcription of a specific classical numeric method. The
Wikipedia article's real, useful contribution to this pass was the
"one polygon of a specific size sets its own star" framing, which is
exactly what motivated checking whether skip should vary with `segments`
in the first place, rather than any numeric detail it supplied directly.

**Correction: a proper academic citation for the above.**
Wikipedia was a convenient, immediately-fetchable source at the time,
but not the right one to cite in the dissertation write-up for a claim
about "polygons in contact" — the actual academic source, found while
researching references for the Voronoi-Islamic hybrid
(`docs/research-plans/VORONOI_ISLAMIC_HYBRID_PLAN.md`), is:

> Kaplan, C.S. & Salesin, D.H. (2004). "Islamic Star Patterns in
> Absolute Geometry." *ACM Transactions on Graphics*, 23(2), 97–119.

This is the rigorous, peer-reviewed source for Hankin's method that the
Wikipedia article was itself presumably drawing on. It should replace
Wikipedia as the *citation* for the "one polygon of a specific size
sets its own star" claim above when this section is used in the
write-up — the finding itself (that `starSkip` should vary with `n`,
confirmed numerically and visually against this codebase's own
construction) doesn't change, only which source it's properly
attributed to. Unlike the Wikipedia overview, the Kaplan & Salesin
paper *does* formalise contact angles and the acute/median/obtuse
system this document has repeatedly noted as absent from every source
consulted so far — worth reading properly before the write-up, rather
than continuing to note the gap.

## Real colour, and fixing `tones = "3"`'s dead middle value (2026-08-20, same day)

Flagged: `tones = "3"` had no visible effect, and — the underlying
request — this pattern should support genuine colour, not just black and
white.

**The bug.** `toneSet("3")` has always declared three values
(`[1, 0, -1]`), and `patternRegistry.js` has always offered "3" as an
option, but the line-art rewrite (this same day, earlier) introduced
`return onLine ? shades[shades.length - 1] : shades[0]` — every line
pixel, echoes included, got the *same* colour regardless of tone count.
The middle value was computed by `toneSet` and never read anywhere.
Property tests didn't catch it because "returns the declared tone set"
only checks *membership* (every returned value is one of the declared
ones), not that every declared value is *reachable* — true here, since
`shades[0]` and `shades[last]` are always members of the declared set
even when `shades[1]` never gets produced. Added a dedicated regression
test that actually scans for the middle tone appearing somewhere, so
"declared but unreachable" can't recur silently.

**The fix.** Gave the middle tone a real role instead of just making it
reachable: the medallion's own boundary (band 0, `signedDist` closest to
the multiple `0 * step`) is always the *primary* colour
(`shades[shades.length - 1]`); every other echo line (band != 0) is the
*accent* colour (`shades[1]`, only when `tones = "3"` declares one —
`tones = "2"` has nothing to accent with, so it's unchanged: every line
stays the single colour it always was). This gives `tones = "3"` a
genuine, visually distinct role — the primary star reads as one colour,
its decorative echoes as another — rather than just technically touching
a third value somewhere.

**Genuine colour, not grayscale.** The deeper request: "more than black
and white." Every generator's `FILLS` (the `*-svg.js` files) and the
raster `grayscale()` pipeline (`src/render.js`) share the same
white/grey/black convention project-wide — but `islamic-svg.js`'s
`FILLS` is a *local* constant, only ever read by this one file, and this
pattern's `nativeFormat: "vector"` (`patternRegistry.js`) means
`islamic-svg.js`'s output is the *only* thing ever shown for it —
`src/app/src/PatternCanvas.jsx`'s `isVector` branch skips the raster
`grayscale()` canvas path entirely for it. So `islamic-svg.js`'s palette
could change to real, non-grayscale colour with zero effect on any other
pattern or on the shared grayscale convention itself: `"2"` is now warm
ivory ground with a deep indigo line (`#f6efe0` / `#15395c`); `"3"` adds
a terracotta accent (`#b5622c`) for the echo lines. `islamic.js`'s
raster output — not shown in the UI, but still exercised by property
tests and benchmarks — keeps the numeric `-1/0/1` `toneSet` scheme
so it stays meaningful for the contract those tests actually check
(range, determinism, declared-tone-set membership), rather than trying
to carry colour information that has no consumer.

Verified visually (SVG, headless Chrome): `tones = "2"` and `"3"`
produce visibly different, genuinely coloured output — ivory/indigo
two-tone, and ivory/terracotta/indigo three-tone with the accent colour
clearly visible on the medallion's inner echo lines — at `segments` 6,
8, 9, in both square and hexagon tiling.

## `lineWidth`: independent control of line thickness

Flagged: the `frequency` ("Detail") slider visibly changed both ring
spacing *and* line thickness, and independent control of thickness was
asked for instead.

**Why it was coupled.** Line thickness was `LINE_WIDTH * step`, where
`LINE_WIDTH` was a fixed 0.18 fraction and `step = radius / frequency`
is the echo spacing itself. Deliberately, at the time: expressing
thickness as a fraction of spacing (rather than an absolute width) is
what kept lines from merging into solid fill at high frequency or
thinning into invisible dashes at low frequency, back when there was no
separate control for it. But it meant thickness could never be adjusted
without also changing spacing, and vice versa — one slider, two visual
effects.

**The fix.** Added `lineWidth` (default 0.06, registry range
`[0.01, 0.15]`), expressed as a fraction of the medallion's *radius*
directly rather than of `step`: `onLine = distToLine < lineWidth *
radius`. Since this formula has no `step`/`frequency` term in it at all,
changing `frequency` now only ever changes ring count/spacing, and
changing `lineWidth` only ever changes thickness — genuinely
independent, not just less coupled. Same idea already used once before
in this file's history: `frequency` itself was made independent of
`tileSize` the same way (relative to `radius` instead of an absolute
distance) earlier the same day.

Reused the "Threshold" archetype (`src/vanilla/archetypes.js`) for the new
param's UI slider rather than adding a new archetype entry — it's
already used elsewhere in this project (Perlin/Ridge noise's
`persistence`) for "a continuous fractional knob in a small range,"
which is exactly what `lineWidth` is; adding a new archetype for a
single param would grow the project's shared UI vocabulary for a case
an existing entry already fits, and this project keeps that vocabulary
deliberately minimal (`src/vanilla/archetypes.js`'s own header comment: "Adding
a new pattern never requires adding a new archetype — only mapping its
params to the existing ones here").

Verified directly, not just visually: a regression test scans a
scanline through the medallion at fixed `frequency`/varying `lineWidth`
and confirms the on-line pixel fraction actually grows with it (SVG
screenshots additionally confirm the *converse* — thickness stays
visually consistent when `frequency` varies at a fixed `lineWidth`, the
coupling this fix specifically targeted).

## `tones` 2-5, greyscale by default

Asked for: support for 2-5 tones (not just 2 or 3), staying greyscale
unless a user later opts into real colour (a follow-up feature, not
built now).

**`toneSet()` (`lib/colourMapping.js`) now generates 2-5 tones by
formula** — `Array.from({length:n}, (_,i) => 1 - (2*i)/(n-1))` — evenly
spaced from 1 (background) to -1 (dark), rather than only having "2" and
"3" hand-listed. Shared by every generator that already imports it
(`grid.js`, `voronoi.js`, `escher.js`, `islamic.js`), so all of them
gained the ability to accept "4"/"5" for free, though only
`islamic-rosette`'s registry entry actually offers them as a UI option
for now — this fix is scoped to the Islamic pattern the request was
about, not a registry-wide rollout.

**A shared `bandTone(shades, bandIndex)` helper** replaced the ad hoc
primary/accent split the previous `tones = "3"` fix added: band 0 (a
rosette's own boundary) is always the darkest declared tone; every other
echo cycles through whichever tones are left between the background and
the darkest. At `tones = "3"` this is identical to the old primary/accent
behaviour (only one tone to cycle through); at 4 or 5 it now reads as an
actual gradient of rings, using every declared tone rather than only
ever two regardless of how many were asked for. Added to
`lib/colourMapping.js` (not duplicated per-renderer) specifically so
`islamic.js` (raster) and `islamic-svg.js` (the one actually shown) use
identical band-to-tone logic and can't drift apart — both call the same
function with the same band index.

**Reverted to greyscale.** The same-day fix before this one gave
`islamic-svg.js`'s `FILLS` genuine, non-grayscale colour (ivory/indigo/
terracotta), justified at the time by `nativeFormat: "vector"` making
that file's palette fully independent of the shared raster
`grayscale()` convention. Asked to revert to greyscale as the default,
with real colour deferred to an explicit future feature rather than
baked in now. Implemented so that later feature has a small, obvious
extension point rather than requiring a rewrite:
`islamic-svg.js` now computes its fill strings by running `toneSet()`'s
own -1..1 values through the same `(value + 1) * 127.5` mapping
`src/render.js`'s `grayscale()` uses for every raster pattern, instead
of a hardcoded hex palette — adding real colour later is swapping that
one conversion function for a palette lookup, not restructuring the
banding logic around it.

**New test coverage.** `lib.colourMapping.test.js` (new file, matching
this project's per-primitive test convention) verifies `toneSet` and
`bandTone` in isolation: tone count, even spacing, endpoints, the 2-tone
"every band same colour" case, and that all echo tones are reachable
for 4/5. `islamic.property.test.js`'s tone-set tests extended to cover
"4"/"5" alongside "2"/"3", including a corrected reachability test
(needed `frequency = 6`, not the default 3, for `tones = "5"`'s
three-way echo cycle to fully complete within one tile's scan area —
not a product bug, just the earlier test's own scan window being too
small to reach that far out).

Verified visually (SVG, headless Chrome) at `tones` 2, 3, 4, 5,
`segments = 8`: black/white for 2, with 4 and 5 showing clearly
distinguishable additional greys across the echo rings, on a white
ground — genuinely greyscale, and genuinely using every declared tone.

## `scale`: resizing the medallion within its tile

Asked for: the ability to scale the medallion up/down within each tile,
plus which was more in keeping with this project's minimal-node-set
goal — a new node, or a parameter on an existing one.

**No new node.** `radius = tileSize * 0.42` was already there, just
hardcoded rather than exposed. `lib/constructionCircle.js`'s
Construction Circle step already exists specifically to "define the
centre and radius that later radial structure is built from" (its own
header comment) — radius has always been that node's one job. Turning
the hardcoded `0.42` into a `scale` param the user can set is filling in
a parameter that node was already conceptually built to own, not adding
a new capability the graph couldn't already express — the same reasoning
already used earlier this session for `frequency` and `lineWidth` (both
also just parameters on steps that already existed, not new nodes).

Registry range `[0.2, 0.48]`, default `0.42` (the old hardcoded value,
so existing renders don't change). Capped below 0.5 rather than allowed
up to 1: past `0.5 * tileSize` the medallion would exceed a square
tile's own half-width and stop being self-contained, which this
generator has relied on throughout its construction (no cross-tile
interaction, no neighbour-tile search — see the "Line art, not filled
bands" section above and this file's earlier sections). `0.48` leaves a
small margin rather than cutting it exactly at the theoretical limit.

`workflows.js`'s `PARAM_NODE_MAP` routes `scale` to `constructionCircle`
(not `grid`, where the other size-ish param `tileSize` lands) — it's a
Construction Circle concern specifically, not a Grid one.

Verified visually (SVG) at `scale` 0.2, 0.42, 0.48, both tile shapes:
medallions shrink to small isolated stars at the low end and grow to
fill nearly the whole tile at the high end, with no overlap or bleed
into neighbouring cells at any tested value. Verified directly with a
regression test: the medallion boundary's actual pixel distance from the
tile centroid (found by walking outward until the first on-line pixel)
grows with `scale`, and the oracle test's independent re-derivation was
extended to take `scale` as a parameter rather than assuming the old
constant.

## User-chosen colours, 2-5 independently editable slots

Asked for: colour1..colourN individually selectable (the brief's own
example: red and white for two tones), colourN slots appearing only once
`tones` selects that many (defaulting to sensible values until then), and
a simple picker — "something like a colour wheel" — for choosing them.

**Five colour params, sliced to `tones`.** `patternRegistry.js` declares
`colour1`..`colour5`, each `control: "color"`. `islamic-svg.js`'s
`_fillsFor(tones, slots)` takes the first `Number(tones)` of them as the
actual fill array, falling back to `DEFAULT_COLOURS` per-slot for any
left unset. `islamic.js` (raster) is untouched — it isn't the renderer
actually shown for this pattern (`nativeFormat: "vector"`), so it keeps
returning `toneSet`'s numeric `-1..1` values, which the property-test
suite and benchmarks still exercise meaningfully without needing to
carry colour information nothing consumes.

**A simple picker, not a custom one.** `<input type="color">` — every
major browser already renders this as a swatch that opens a native
colour-wheel/picker UI on click, so "something simple like a colour
wheel" didn't need any new UI code beyond wiring the input up, in either
app: `WorkflowNode.jsx` (the React app actually run day to day) gained a
`param.control === "color"` branch; `UIBuilder.js` (the older, script-
less vanilla app) gained a matching `_buildColor`, since without it a
`"color"`-controlled param would have been silently routed into
`_buildSelect`'s dropdown-building code, which expects `paramDef.options`
and doesn't handle colours — that would have been a real crash on
"a param declares a control type this UI doesn't understand," not just a
cosmetic gap.

**colour3/4/5 appearing only once selected: a new, general mechanism,
not something islamic-specific.** Added `visibleIf(params)` as a param-
definition field any registry entry can use (checked in
`workflows.js`'s `buildWorkflow`, which already resolves the live merged
param set every render — filtering by it there was a small addition,
not a new data flow). `patternRegistry.js` gives `colour3`/`colour4`/
`colour5` `visibleIf: (p) => Number(p.tones) >= 3/4/5`; `colour1`/
`colour2` have none, since `tones`'s own minimum is 2. Verified directly
(not just visually): `buildWorkflow("islamic-rosette", { tones: "5" })`'s
Colour Mapping node lists exactly `colour1`..`colour5`; dropping back to
`{ tones: "2" }` drops them again — a genuine two-way toggle, not a
one-way reveal. The vanilla UI doesn't get this dynamic show/hide (see
`UIBuilder.js`'s own comment): it builds its parameter panel once per
pattern load rather than reactively on every value change the way the
React app's `useMemo`-driven graph does, so respecting `visibleIf` there
would need restructuring that build/reload flow, not just reading the
field — out of scope for a script-less, non-primary UI; it shows all 5
colour pickers unconditionally instead, which still works, just without
the hide/reveal polish.

**Defaults stay greyscale, chosen to keep bandTone's own contract true
automatically.** `DEFAULT_COLOURS` is a monotonically darkening ramp
(`#ffffff` .. `#000000`) rather than 5 independently-chosen greys,
specifically because `bandTone` (`lib/colourMapping.js`) always treats
the *last active slot* as the primary/darkest line — with a monotonic
ramp, whichever slot ends up last (`colour2` at `tones = "2"`, `colour5`
at `"5"`) is automatically the darkest of the active set, for every
`tones` value, without special-casing any one of them. The one visible
trade-off: `tones = "2"`'s default is now white/light-grey rather than
the crisp pure white/black it rendered before user-editable colours
existed (`colour2`'s default, `#bfbfbf`, is partway down the ramp, not
the ramp's own endpoint) — a deliberate, documented cost of picking one
default rule that stays correct for every `tones` count rather than a
different rule per count; trivially fixed by a user picking black for
`colour2`, same as any other colour choice.

New test coverage: `islamic-svg.colours.test.js` (defaults, a user
override showing through verbatim including genuinely non-grey colours,
mixed set/unset slots, and slots beyond `tones` never leaking into
output — with the `tones = "5"` case written to tolerate `_maxBands`
capping how many echo bands actually render, a real pre-existing SVG
limitation unrelated to this feature, rather than asserting every echo
tone must appear); `workflows.test.js` gained the `visibleIf`
two-way-toggle test above.

## `rotation`, snapped to 180/segments

Asked for: rotating the medallion "by intervals of 360/n-fold degrees."

**Checked the maths before implementing anything, and it doesn't work as
literally asked.** This shape has exact `n`-fold rotational symmetry (the
whole point of the construction) — rotating a fully `n`-fold-symmetric
point set by any exact multiple of `360/n` maps it onto itself, so a
control snapped to that would visibly do nothing at all: same pixels,
every time, for every snap position. Flagged this back rather than
shipping a slider that appears broken. Follow-up clarified the actual
want with a concrete example — "square rotates to diamond orientation,"
maintaining vertical symmetry — which is a different, well-defined
operation: a regular `n`-gon (or this `n`-fold star) has `n` *reflection*
axes in addition to its rotational symmetry, spaced `180/n` apart, twice
as many positions as rotation alone gives, and exactly two of them fall
within each `360/n` rotational period — one through a tip (the existing
default), one through a waist. `180/n`, not `360/n`, is the finest
increment that (a) actually changes the rendered shape and (b) always
lands back on a vertical-symmetry-preserving orientation. Verified this
is exactly the square/diamond relationship asked for: at `segments = 4`,
`180/4 = 45` degrees turns the default point-up diamond into a flat-top
square (or the reverse, depending which is called the "default" — both
are equally valid starting orientations, and both stay vertically
symmetric either way).

**Implementation: `radialDivisions`'s own `rotation` parameter
(`lib/constructionCircle.js`), exposed and snapped, not a new node.**
That function has taken a `rotation` argument since it was written; this
generator has always called it with a hardcoded `Math.PI / 2` (the
"tip at top" base alignment). `rotation` (the new registry param, degrees)
is snapped to the nearest multiple of `180 / segments` via a new shared
`snapRotation(rotationDeg, segments)` (exported from `islamic.js`,
imported by `islamic-svg.js` and the property-test oracle, so all three
apply the identical snap rather than three independent re-derivations)
and added to that existing base, so `rotation = 0` reproduces the exact
previous default — verified directly, not assumed. `workflows.js` routes
it to the `radialDivisions` node, the same one `segments` already
belongs to, since rotation is that node's own parameter, not a new
concept.

Registry range is a plain `[0, 360]` (the existing "Rotation" archetype,
already used project-wide, needed no changes) rather than a
`segments`-dependent range — the snap happens after the slider, so any
two adjacent `180/segments` positions stay reachable at every `segments`
value without recomputing the slider's own bounds per `segments`.

Verified directly: `rotation = 0` produces pixel-identical output to
omitting the param entirely; rotating by any tested multiple of
`360/segments` (1x, 2x, 3x) is confirmed to be a true identity, matching
the mathematical prediction that motivated snapping to `180/n` in the
first place rather than `360/n`; rotating by exactly `180/segments`
is confirmed to visibly change the medallion for `segments` 4 through 8
(scanned a whole tile for at least one differing pixel, rather than
trusting a single sample point); `snapRotation` itself is verified to
always round to the nearest `180/n` multiple, within half a step, for
arbitrary input including negative and multi-turn angles. Verified
visually (raster and SVG) at `segments = 4` (diamond <-> square) and
`segments = 5` (point-up star <-> notch-up star), both orientations
staying vertically symmetric as intended.
