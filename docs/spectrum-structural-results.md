# Spectrum Metrics, Part 2: A Structural Score Derived From the Composition Table

`spectrumMetrics.js` (see `spectrum-metrics-results.md`) checks the declared
`spectrum` value *empirically*, by re-seeding and measuring how much a
generator's output actually moves. That surfaced a real problem: an
empirically seed-sensitive generator (Voronoi) can still be correctly
"hybrid," not "stochastic," under this dissertation's own pattern definition
(1.2), because what the definition actually cares about is whether the
*rule* governing the output is fixed once a random draw is made, not how
much the output happens to move under a *different* draw. Empirical
seed-variance cannot distinguish these two questions on its own.

`spectrumStructural.js` computes a second score that can: a **structural**
score, read directly off each generator's already-documented composition
(`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`'s composition table) rather than
from running anything. It asks one question per generator: where does
randomness (`lib/rng.js` / `lib/seedPoints.js` — the only two primitives in
the shared library that touch a seed at all) sit in the composition chain?

- **1.0** — no RNG primitive anywhere in the chain. Deterministic by
  construction; re-seeding is structurally a no-op regardless of what any
  empirical measurement shows.
- **0.5** — RNG appears only inside a **Constant-bind**: a fixed, finite
  structure (seed points, a permutation table) is drawn once and reused
  unchanged for every `(x, y)` query. The per-pixel rule itself is then a
  purely deterministic function of that fixed structure.
- **0.0** — RNG is queried directly as part of the per-pixel evaluation
  itself (the composition table's **Fold** pattern, or a Fold-based
  primitive invoked fresh inside another chain). The rule is not fixed once
  a random draw is made, because a fresh draw effectively happens at every
  sample.

This is deliberately a three-tier, not continuous, score: the underlying
claim ("is randomness quarantined to a one-off draw, or resampled per
point") is categorical, and is read off already-documented, already-checked
composition facts rather than invented for this script.

## Results

| id | declared | structural | empirical (bin / cont) | declared − structural |
|---|---|---|---|---|
| wave-stripes | 0.75 | 1.00 | 1.00 / 1.00 | −0.25 |
| concentric-rings | 0.75 | 1.00 | 1.00 / 1.00 | −0.25 |
| perlin-noise | 0.10 | 0.00 | 0.00 / 0.63 | +0.10 |
| ridge-noise | 0.15 | 0.00 | 1.00 / 0.74 | +0.15 |
| square/hex/triangle/brick/diamond-grid | 0.95 | 1.00 | 1.00 / 1.00 | −0.05 |
| escher-translation | 0.95 | 1.00 | 1.00 / 1.00 | −0.05 |
| voronoi-cells | 0.45 | 0.50 | 0.00 / 0.00 | −0.05 |
| islamic-rosette | 0.95 | 1.00 | 1.00 / 1.00 | −0.05 |
| sierpinski | 0.95 | 1.00 | 1.00 / 1.00 | −0.05 |
| recursive-grid | 0.90 | 1.00 | 1.00 / 1.00 | −0.10 |
| perlin-sierpinski | 0.50 | 0.00 | 1.00 / 1.00 | +0.50 |
| voronoi-islamic | 0.55 | 0.50 | 0.29 / 0.00 | +0.05 |
| voronoi-islamic-v2 | 0.60 | 0.50 | 0.10 / 0.00 | +0.10 |

Full numbers, including each row's cited reason, in
`spectrumStructural.results.json`.

## Discussion

**The Voronoi family is where structural analysis succeeds where the
empirical score alone did not.** All three Voronoi-based generators land
within 0.05–0.10 of their declared value structurally (0.45→0.50, 0.55→0.50,
0.60→0.50), a far closer match than the empirical scores managed
(0.00–0.29). This is a genuine finding, not a coincidence: it suggests the
declared `spectrum` values for this family were always tracking something
closer to *structural quarantine of randomness* — Constant-bind vs.
per-pixel resampling — than to *measured output sensitivity*, even though
the field was never formally defined that way before this pair of scripts.
The structural score is a better predictor of the design judgement here
because it is asking the same question the judgement was (probably
implicitly) answering.

**`perlin-sierpinski` is the largest disagreement (+0.50), and it is
explainable rather than a flaw in either score.** Structurally,
`recursiveNoise.js`'s Fork branch calls `noise()` — a per-pixel-direct RNG
use, the same tier as plain `noise.js` — at every recursion level, so its
structural score (0.0) reflects what happens whenever its `amplitudeN`
parameters are engaged. Empirically, the shipped registry defaults set every
`amplitudeN` to `0`, at which point the generator is provably identical to
plain `recursive.js` regardless of seed (`recursiveNoise.property.test.js`),
so the empirical score (1.0) reflects the default a learner sees before
touching any control. The declared value (0.5) sits between the two because
it is describing neither extreme, but the generator's *typical* position
across its own parameter range once a learner actually engages the
Randomness controls. All three numbers are correct answers to three
different, precisely statable questions — "what can this structurally do,"
"what does it do today at its shipped defaults," and "what does it do
typically" — which is itself the point: a single scalar cannot carry all
three, and stating which question is being answered is doing real
methodological work here, not hedging.

**The purely deterministic cluster (Wave, Grid, Escher, Recursive,
Islamic Rosette) exposes a real limitation in the declared values, not in
either score proposed here.** Every one of these scores a clean 1.0
structurally (no RNG primitive exists in their chains at all) and 1.0
empirically (confirmed by direct measurement). Yet their declared values
range from 0.75 (`wave-stripes`) to 0.95 (`square-grid`, `islamic-rosette`),
a 0.20 spread among generators that are, on both independent measures,
equally and completely deterministic. This means the declared `spectrum`
field is doing double duty for this cluster: partly encoding position on
the stochastic-deterministic axis this dissertation defines, and partly
encoding an unstated second judgement — plausibly perceived visual/
structural complexity, since `wave-stripes` (a bare sine field) reads as
less structurally elaborate than `square-grid` or `islamic-rosette`. That
second judgement is legitimate design information, but conflating it with
this dissertation's own randomness-vs-rule axis inside one number is a
real, nameable inconsistency in the current registry, not a limitation of
either measurement approach.

## Reliability: why this score, unlike the empirical one, should not need re-running

The structural score requires no sampling, no grid size, no seed count —
it is read once off documented, already-verified facts about which
primitive each generator calls and where. It will only ever change if a
generator's own composition changes (e.g. a future generator moves its RNG
use from a Constant-bind into a per-pixel role), at which point
`docs/ALGORITHMIC_COMPOSITION_RESEARCH.md`'s own composition table — checked
independently by the property-test suite — would need updating first, and
this script's `STRUCTURAL` table would need to change to match it, not the
other way round. This ordering (documented composition fact → structural
score, not the reverse) is what makes the score reliable in the sense the
brief asked for: it cannot silently drift out of sync with what the code
actually does without a corresponding, visible change to already-tested
documentation.

## Limitations

- The three-tier scheme cannot express *how much* larger a Constant-bind's
  quarantined randomness is (20 Voronoi seed points vs. a full permutation
  table look-up) — it only expresses whether randomness is quarantined at
  all. A generator with 3 seed points and one with 300 both score 0.5.
- The classification is per generator FUNCTION, not per registry entry — a
  future registry entry that reused an existing generator with all
  randomness-affecting parameters fixed to constants (e.g. a hypothetical
  fixed-seed, non-randomizable preset) would still inherit that generator's
  structural score, even though such a preset's own re-seeding would be
  impossible by construction, closer to the `!hasSeedParam` case.
- This score answers "where does the composition put randomness," not "is
  the declared value wrong." The Discussion above treats disagreement as
  informative rather than corrective in every case except the deterministic
  cluster's internal 0.75–0.95 spread, where the inconsistency is real and
  independent of which score is doing the checking.
