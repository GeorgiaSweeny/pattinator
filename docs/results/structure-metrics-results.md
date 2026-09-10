# Structure/Entropy Metrics: Both Hybrids' Own "How Varied Is This" Parameter

`src/generators/__benchmarks__/structureMetrics.js` (run via `npm run
structure-metrics` from `src/`) turns the secondary research question's
qualitative claim — that a hybrid generator can sit anywhere on a continuous
stochastic/deterministic spectrum, rather than a fixed point on it — into
quantitative evidence. Originally swept `recursiveNoise.js`'s `amplitude`
only; extended to also sweep `voronoiIslamic.js`'s `variation`,
so the same empirical claim is checked on two structurally different
hybrids (a Fork-inside-Repeat vs. a per-cell Constant-bind), not asserted
once and assumed to generalise. The two sweeps turn out to tell a
genuinely different story — see the Discussion sections below, especially
`voronoiIslamic.js`'s.

## Methodology

Two metrics, both standard and independently well-known rather than invented
for this project:

- **Edge density** — the fraction of 4-connected adjacent pixel pairs (right
  and down neighbours) whose binarised values differ. A direct proxy for how
  much *boundary* the pattern has: a smooth solid region contributes close to
  0, a maximally jagged pattern approaches 1.
- **2x2 block-pattern Shannon entropy** — partition the field into
  non-overlapping 2x2 blocks, map each to one of 16 possible binary patterns,
  and compute the Shannon entropy (bits) of the resulting pattern
  distribution. Low entropy means the field is built from very few distinct
  local motifs (regular, deterministic structure); entropy approaching 4 bits
  (`log2(16)`, the maximum for 16 equiprobable patterns) means every local
  motif is about equally common — the signature of noise-dominated,
  unstructured output.

Both are computed directly from each generator's own pure
`(x, y, params) => value` function (the same interface every generator
satisfies, `docs/GENERATOR_CONTRACT.md`) — no separate rendering path, just
sampling it over a 300x300 grid the same way the app's own canvas does.

## `recursiveNoise.js`: sweeping `amplitude`

`depth` held fixed at 4 (the registry default) and `seed` at 1337, so
`amplitude` is the only variable changing between rows.

**Re-run 2026-08-21, then again 2026-08-24**: `amplitude` no longer applies
flatly at every recursion level — a linear per-level ramp (see
`recursiveNoise.js`'s own header comment for why: the previous flat
version was reported as making the whole carpet look merely shifted
rather than depth itself having character). The Aug-21 version of the
ramp went from exactly `0` at the shallowest level up to full `amplitude`
at the deepest; that was revised Aug-24 to go from a `LEVEL_AMPLITUDE_FLOOR`
(30%) fraction of `amplitude` up to the full value instead, because the
exact-zero floor made the corresponding Noise node in the ReactFlow
workflow view look like it had no effect regardless of `amplitude` — see
`docs/planning/plan-checklist.md`'s Aug-24 entry. The table below is the Aug-24
re-run; `amplitude = 0` is unchanged from every previous version (the
ramp still multiplies to exactly `0` there regardless of the floor
fraction), but every nonzero row shifted slightly from the Aug-21 numbers,
since the shallowest level now contributes some warp too.

| amplitude | fill fraction | edge density | block entropy (bits) |
|---:|---:|---:|---:|
| 0.00 | 0.628 | 0.0656 | 1.641 |
| 0.02 | 0.631 | 0.0679 | 1.739 |
| 0.05 | 0.637 | 0.0714 | 1.851 |
| 0.08 | 0.644 | 0.0738 | 1.865 |
| 0.12 | 0.653 | 0.0770 | 1.935 |
| 0.16 | 0.661 | 0.0819 | 1.983 |
| 0.20 | 0.666 | 0.0922 | 2.057 |
| 0.25 | 0.672 | 0.1038 | 2.145 |
| 0.30 | 0.676 | 0.1120 | 2.213 |
| 0.40 | 0.684 | 0.1286 | 2.325 |
| 0.50 | 0.679 | 0.1507 | 2.498 |
| 0.70 | 0.645 | 0.2197 | 2.978 |
| 1.00 | 0.619 | 0.2652 | 3.228 |
| 1.50 | 0.589 | 0.3082 | 3.449 |
| 2.00 | 0.580 | 0.3269 | 3.535 |

### Discussion

**Edge density and block entropy both increase monotonically with
`amplitude`**, across the entire swept range — edge density rises roughly
5-fold (0.066 → 0.33) and block entropy rises from 1.64 bits to 3.54 bits,
closer to the 16-pattern maximum of 4 bits than the Aug-21 ramp reached
(3.25 bits). That's the direct consequence of the floor fix: since the
shallowest level now warps too (instead of staying exactly fixed), high
`amplitude` no longer leaves any level of the carpet fully deterministic,
so the field can get closer to the noise-dominated end of the entropy
range than it could under the old zero-floor ramp. The qualitative claim
is unchanged either way: increasing the noise perturbation continuously
trades deterministic self-similar structure for organic irregularity,
smoothly and monotonically rather than as a step change.

**Growth visibly decelerates past `amplitude` ≈ 0.4-0.5.** Both metrics'
rate of increase slows in the upper half of the swept range. Unlike the
Aug-21 version of this document, this is *not* because any level stays
permanently unwarped — every level now has some warp at any nonzero
amplitude — but `subdivideCell`'s own deterministic grid-cell assignment
still governs each level's local structure at the point it's evaluated,
so there's a real floor to how disordered a recursively-subdivided field
can get regardless of how strongly any single level is perturbed.

**Fill fraction is non-monotonic — it rises then falls**, the same
qualitative shape every previous version of this sweep has shown: a small
rise from 0.628 toward a peak around `amplitude` = 0.4 (0.684), then
falling back toward 0.58 by `amplitude` = 2.0 — lower than the Aug-21
ramp's own floor of 0.591, consistent with the coarsest level no longer
being protected from warping at high amplitude. Worth stating plainly
rather than folded into "more noise = more disorder": not every
structural statistic moves in the same direction as perturbation
increases.

## `voronoiIslamic.js`: sweeping `variation`

`numCells` = 20, `segments` = 8, `scale` = 0.35, `frequency` = 2, `seed` =
1337 held fixed, so `variation` is the only variable changing between rows.

| variation | fill fraction | edge density | block entropy (bits) |
|---:|---:|---:|---:|
| 0.00 | 0.737 | 0.2562 | 3.009 |
| 0.05 | 0.737 | 0.2562 | 3.009 |
| 0.10 | 0.737 | 0.2539 | 3.005 |
| 0.15 | 0.733 | 0.2542 | 3.018 |
| 0.20 | 0.732 | 0.2541 | 3.012 |
| 0.30 | 0.732 | 0.2544 | 3.008 |
| 0.40 | 0.732 | 0.2547 | 3.014 |
| 0.50 | 0.734 | 0.2544 | 3.012 |
| 0.60 | 0.732 | 0.2547 | 3.016 |
| 0.70 | 0.731 | 0.2552 | 3.016 |
| 0.80 | 0.731 | 0.2537 | 3.007 |
| 0.90 | 0.730 | 0.2539 | 3.010 |
| 1.00 | 0.729 | 0.2546 | 3.029 |

### Discussion

**None of the three metrics show a meaningful trend against `variation`,
in sharp contrast to `recursiveNoise.js`'s `amplitude` sweep above.** All
three stay within a narrow band across the entire swept range (edge
density 0.2537-0.2562, block entropy 3.005-3.029 bits, fill fraction
0.729-0.737) — essentially flat, not a weak-but-real trend obscured by
sampling noise.

This is a genuine, and more nuanced, finding worth reporting honestly
rather than reshaping the write-up to fit the same "more randomness = more
disorder" story `recursiveNoise.js` tells: **`variation` and `amplitude`
are not the same kind of parameter, and these metrics correctly tell them
apart.** `amplitude` perturbs *where* structure is (which cell a point
falls into, continuously, at every point in the field), directly changing
how much boundary and local-pattern diversity the field has. `variation`
perturbs *which specific star shape and orientation* each Voronoi cell
uses — a discrete, per-cell choice (`cellVariation`'s bounded segment/
rotation jitter) that changes *what a cell looks like* without changing
*how much of the canvas is covered by lines*, since line coverage is
governed by `lineWidth`/`frequency` (held fixed here), not by which
`segments` value a given cell happens to draw. A global, per-pixel
structure metric like edge density has no reason to move when the thing
varying is "which of several similar-weight star shapes is drawn here,"
only when the *amount* or *boundary shape* of line-covered area itself
changes.

**The practical implication for the composition-quality question this
sweep exists to test**: a hybrid's own "how varied is this" parameter
sitting on a continuous stochastic/deterministic spectrum, *in the sense
these two global structure metrics measure it*, is not automatic just
because the parameter is continuous and randomises something — it depends
on *what* that parameter perturbs. `amplitude` perturbs global spatial
structure directly; `variation` perturbs local motif identity while
holding global structure constant. Both are legitimate randomness
parameters and both are worth having, but only one of them registers on
these particular metrics, and that's informative rather than a null
result to discard. A metric sensitive to *local motif diversity*
specifically (rather than global boundary/entropy) would very likely show
`variation`'s own effect — a natural extension if this line of measurement
is pursued further in the write-up.

## Reproducing

```
cd src
npm run structure-metrics
```

Raw per-run data (both sweeps, including each one's fixed params and the
grid size used) is written to
`src/generators/__benchmarks__/structureMetrics.results.json`.
