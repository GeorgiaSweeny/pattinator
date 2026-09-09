# Spectrum Metrics: Checking the Declared `spectrum` Value Empirically

`src/generators/__benchmarks__/spectrumMetrics.js` (run via `npm run
spectrum-metrics` from `src/`) answers a question the project previously had
no test for: is each `REGISTRY` entry's declared `spectrum` value (0 = fully
stochastic, 1 = fully deterministic; `patternRegistry.js`, shown to users via
`SpectrumBar.jsx` and read by `evaluation/quizContent.js`) a checked claim, or
only a design judgement? Before this script it was only the latter — no test
in the suite touched `spectrum` at all. This script computes an independent,
empirical estimate of the same 0–1 quantity from each generator's actual
output and reports it alongside the declared value, so a marker (or the
project itself) can see where the two agree and, more usefully, exactly where
and why they don't.

## Methodology

For every `REGISTRY` entry, every parameter is held at its registry default
except `seed`. If the entry declares no `seed` parameter at all, it cannot
vary under re-seeding by construction, so it is scored `1.0` (fully
deterministic) without sampling. Otherwise, the same 150x150 grid
(`CANVAS.WIDTH x CANVAS.HEIGHT`, matching `structureMetrics.js`'s own
sampling convention) is sampled at 8 fixed seeds, and every seed pair (28
pairs, not just consecutive ones or comparisons against one reference seed)
is compared two ways:

- **Binarised disagreement** — the fraction of pixels whose `> 0`-thresholded
  value differs between the two seeds' fields, the same binarisation
  `structureMetrics.js`'s edge-density metric uses, just compared across
  seeds at a fixed pixel rather than across neighbouring pixels at a fixed
  seed. Two independent random binary fields disagree at ~50% of pixels by
  chance, so mean disagreement is rescaled by `/0.5` into `[0, 1]` before
  being read as a stochastic fraction, and `empiricalSpectrum = 1 -` that
  fraction.
- **Continuous mean absolute difference** — the mean `|a - b|` between the
  two seeds' raw (unbinarised) values, over the `[-1, 1]` range every
  generator's contract guarantees. Two independent values drawn uniformly
  from `[-1, 1]` differ by `2/3` on average, so this is the rescaling
  constant used for this second score.

Both are reported because they disagree in informative ways — see below.

## Results

| id | declared | empirical (binarised) | empirical (continuous) |
|---|---|---|---|
| wave-stripes | 0.75 | 1.000 | 1.000 |
| concentric-rings | 0.75 | 1.000 | 1.000 |
| perlin-noise | 0.10 | 0.000 | 0.627 |
| ridge-noise | 0.15 | 1.000 | 0.741 |
| square/hex/triangle/brick/diamond-grid | 0.95 | 1.000 | 1.000 |
| escher-translation | 0.95 | 1.000 | 1.000 |
| voronoi-cells | 0.45 | 0.004 | 0.000 |
| islamic-rosette | 0.95 | 1.000 | 1.000 |
| sierpinski | 0.95 | 1.000 | 1.000 |
| recursive-grid | 0.90 | 1.000 | 1.000 |
| perlin-sierpinski | 0.50 | 1.000 | 1.000 |
| voronoi-islamic | 0.55 | 0.295 | 0.000 |
| voronoi-islamic-v2 | 0.60 | 0.096 | 0.000 |

Full per-entry numbers (including raw disagreement/meanAbsDiff) in
`spectrumMetrics.results.json`.

## Discussion

**Generators with no `seed` parameter score a trivial, uninformative 1.0.**
Wave, Grid, Escher, Recursive/Sierpinski, and Islamic Rosette have no
randomness input at all, so re-seeding cannot change them by construction —
the empirical score confirms this correctly but adds nothing a source-code
read didn't already establish. The declared values for this group (0.75–0.95)
instead encode a structural judgement — how rule-bound the *construction*
looks — not anything re-seeding could measure. This is an honest limitation
of a seed-variance approach: it can only speak to generators whose randomness
is seed-driven, which is every source of randomness in this codebase, but it
says nothing about *how deterministic a deterministic generator's rule
itself is* (e.g. why grid-square scores lower "randomness-adjacent-ness"
than islamic-rosette is a design question, not an empirical one).

**`perlin-sierpinski` scores 1.0 at its own registry defaults, and that is
correct, not a bug.** Every level's `amplitudeN` defaults to `0`, and
`recursiveNoise.js` is provably identical to plain `recursive.js`'s Sierpinski
carpet at `amplitude = 0` regardless of seed (checked directly in
`recursiveNoise.property.test.js`, not assumed). The declared `spectrum: 0.5`
describes the generator's *typical* behaviour once a learner engages its
noise controls, not its shipped default — a real gap between "the value
shown before any interaction" and "the value the number describes," worth
being explicit about rather than treating the empirical 1.0 as a
contradiction.

**`ridge-noise` reveals a real limitation of the binarised metric.**
Binarised disagreement measures exactly `0.0000` — by the `>0` threshold,
ridge noise looks perfectly seed-invariant — while the raw values plainly do
change with seed (checked directly: two seeds' outputs at the same pixel
differ by up to ~0.05 in one spot-check, not identically equal). The
continuous metric (0.741) confirms real, if modest, seed sensitivity. The
cause is ridge noise's own construction, `1 - 2|raw|`: fBm's raw output
concentrates near 0, so `1 - 2|raw|` stays positive at most sampled points
regardless of which seed produced the underlying `raw`, only crossing zero
where `|raw|` happens to exceed 0.5. A `>0` threshold is a poor proxy for
"how much does this generator's output change with the seed" whenever a
generator's own construction skews its output distribution away from a
symmetric split around zero — a caveat worth carrying back into how
`structureMetrics.js`'s own binarised metrics should be read for this
generator too, not only here.

**The three Voronoi-family generators are where the declared and empirical
values disagree most, and the disagreement is conceptually informative
rather than a measurement failure.** `voronoi-cells` is declared `0.45`
("hybrid position": random seed points, deterministic partitioning once
placed), but scores close to `0.0` on both empirical metrics: changing the
seed relocates every cell boundary, so the value at almost any fixed pixel
is essentially uncorrelated with the value the previous seed produced there.
This is not a contradiction so much as two different questions being
answered. The declared value describes how rule-bound the *construction* is
**given** a seed — once points are placed, cell membership follows a fixed
nearest-neighbour rule with no further randomness, which is genuinely
"hybrid" in that sense. The empirical value instead measures sensitivity to
**which** seed is drawn — and a Voronoi partition is maximally sensitive to
that choice, in the same sense a chaotic dynamical system is deterministic
step-to-step but unpredictable in its dependence on initial conditions. Both
`voronoi-islamic` and `voronoi-islamic-v2` inherit this from the same
seed-point mechanism, which is why they show the same pattern despite
different declared values (0.55, 0.60). **This distinction — structural
determinism of the rule vs. empirical sensitivity to the random input — is
the main methodological finding of this script**, and is a more precise way
to state what "stochastic-deterministic position" means than a single
number can capture on its own.

## Limitations

- 8 seeds and a 150x150 grid trade precision for runtime across 17 registry
  entries; the qualitative findings above (which generators disagree, and
  why) are robust to this, but the exact empirical numbers would shift
  slightly with more seeds or a finer grid.
- Every measurement is taken at each entry's own registry-default parameter
  values. A generator whose empirical score depends heavily on a non-seed
  parameter (`perlin-sierpinski`'s `amplitudeN`, `voronoi-islamic`'s
  `variation`) will report only its behaviour at that one default point, not
  across its own parameter range — `structureMetrics.js`'s own sweeps already
  cover that dimension for the two hybrids specifically.
- This script does not attempt to replace the declared `spectrum` values; it
  is a check against them, and the discussion above argues the two are
  measuring related but distinct things for the Voronoi family specifically,
  not that the declared values are wrong.
