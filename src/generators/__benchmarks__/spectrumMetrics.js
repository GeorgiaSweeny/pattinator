/*
========================================
SPECTRUM METRICS — EMPIRICAL CHECK ON THE DECLARED spectrum VALUE
========================================
* Every REGISTRY entry declares a `spectrum` value (patternRegistry.js;
* SpectrumBar.jsx: 0 = fully stochastic, 1 = fully deterministic), shown to
* users in the app and read by the evaluation quiz (evaluation/quizContent.js).
* That value is currently hand-assigned by design judgement, not measured —
* this script computes an independent, empirical estimate of the same
* quantity and reports both side by side, so the declared position is a
* checked claim rather than an assertion.
*
* Method: hold every parameter at its registry default except `seed`, sample
* the same grid at SEED_COUNT different seeds, and measure how much the
* binarised field actually changes when only the seed changes. A generator
* with no `seed` parameter at all cannot vary with re-seeding by
* construction, so it is scored 1.0 (fully deterministic) without sampling.
*
* Disagreement between two seeds' fields is the same per-pixel binarised
* comparison structureMetrics.js's edge-density metric uses internally, just
* applied across seeds at a fixed pixel rather than across neighbouring
* pixels at a fixed seed. Two independent random binary fields disagree at
* ~50% of pixels by chance, so raw mean disagreement is rescaled by /0.5 to
* land in [0, 1] before being read as a stochastic fraction.
*
* Run with: npm run spectrum-metrics (from src/). Writes raw results to
* __benchmarks__/spectrumMetrics.results.json; docs/results/spectrum-metrics-results.md
* holds the interpreted numbers and discussion.
*/
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { REGISTRY } from "../../patternRegistry.js";
import { GENERATORS } from "../index.js";
import { CANVAS } from "../../config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const GRID_SIZE = 150;
const SEEDS = [1337, 42, 7, 999, 2024, 31415, 8675309, 123456];

function defaultParams(entry) {
   const params = {};
   for (const p of entry.params) params[p.param] = p.value;
   return params;
}

function hasSeedParam(entry) {
   return entry.params.some((p) => p.param === "seed");
}

// Samples both the binarised field (for the edge-density-style comparison
// structureMetrics.js already uses) and the raw continuous value (for a
// threshold-free comparison — see the ridge-noise note below).
function sampleField(fn, params) {
   const n = GRID_SIZE * GRID_SIZE;
   const binarised = new Int8Array(n);
   const raw = new Float64Array(n);
   for (let j = 0; j < GRID_SIZE; j++) {
      const y = (j / (GRID_SIZE - 1)) * CANVAS.HEIGHT;
      for (let i = 0; i < GRID_SIZE; i++) {
         const x = (i / (GRID_SIZE - 1)) * CANVAS.WIDTH;
         const v = fn(x, y, params);
         raw[j * GRID_SIZE + i] = v;
         binarised[j * GRID_SIZE + i] = v > 0 ? 1 : 0;
      }
   }
   return { binarised, raw };
}

// Fraction of pixels that differ between two same-sized binarised fields.
function disagreement(a, b) {
   let diff = 0;
   for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) diff++;
   return diff / a.length;
}

// Mean absolute difference between two same-sized raw-value fields, over
// the [-1, 1] range every generator's contract guarantees, so it is
// already scaled to [0, 2] without needing a binarisation threshold at
// all -- catches seed-driven variation a >0 threshold can miss when a
// generator's output is skewed mostly to one side of zero (ridge noise's
// 1 - 2|raw| construction is exactly this case: raw fBm concentrates near
// 0, so 1-2|raw| stays positive at most pixels regardless of seed, even
// though the underlying value clearly varies with it).
function meanAbsDiff(a, b) {
   let total = 0;
   for (let k = 0; k < a.length; k++) total += Math.abs(a[k] - b[k]);
   return total / a.length;
}

// Mean pairwise value across every seed pair, not just consecutive pairs
// or comparisons against one reference seed, so one atypical seed can't
// dominate the estimate. `metric` is one of the two functions above.
function meanPairwise(items, metric) {
   let total = 0, pairs = 0;
   for (let a = 0; a < items.length; a++) {
      for (let b = a + 1; b < items.length; b++) {
         total += metric(items[a], items[b]);
         pairs++;
      }
   }
   return total / pairs;
}

const results = [];

for (const entry of REGISTRY) {
   const fn = GENERATORS[entry.generator];
   const params = defaultParams(entry);
   const seeded = hasSeedParam(entry);

   let empiricalSpectrum, empiricalSpectrumContinuous, meanDisagreement, meanContinuousDiff;
   if (!seeded) {
      meanDisagreement = 0;
      meanContinuousDiff = 0;
      empiricalSpectrum = 1;
      empiricalSpectrumContinuous = 1;
   } else {
      const samples = SEEDS.map((seed) => sampleField(fn, { ...params, seed }));
      meanDisagreement = meanPairwise(samples.map((s) => s.binarised), disagreement);
      meanContinuousDiff = meanPairwise(samples.map((s) => s.raw), meanAbsDiff);
      // Binarised: two independent random binary fields disagree ~50% of the
      // time by chance. Continuous: two independent uniform-ish [-1,1]
      // fields differ by ~2/3 (E[|X-Y|] for X,Y ~ U(-1,1)) on average.
      empiricalSpectrum = 1 - Math.min(1, meanDisagreement / 0.5);
      empiricalSpectrumContinuous = 1 - Math.min(1, meanContinuousDiff / (2 / 3));
   }

   results.push({
      id: entry.id,
      generator: entry.generator,
      declaredSpectrum: entry.spectrum,
      hasSeedParam: seeded,
      meanPairwiseDisagreement: meanDisagreement,
      meanPairwiseContinuousDiff: meanContinuousDiff,
      empiricalSpectrum,
      empiricalSpectrumContinuous,
      delta: entry.spectrum - empiricalSpectrum,
      deltaContinuous: entry.spectrum - empiricalSpectrumContinuous,
   });
}

console.log(`=== Spectrum metrics: declared vs. empirical (grid ${GRID_SIZE}x${GRID_SIZE}, ${SEEDS.length} seeds) ===\n`);
for (const r of results) {
   console.log(
      `${r.id.padEnd(20)}  declared=${r.declaredSpectrum.toFixed(2)}  ` +
      `empirical(binarised)=${r.empiricalSpectrum.toFixed(3)}  ` +
      `empirical(continuous)=${r.empiricalSpectrumContinuous.toFixed(3)}  ` +
      `${r.hasSeedParam ? `(disagreement=${r.meanPairwiseDisagreement.toFixed(4)}, meanAbsDiff=${r.meanPairwiseContinuousDiff.toFixed(4)})` : "(no seed param)"}`
   );
}

const outPath = join(__dirname, "spectrumMetrics.results.json");
writeFileSync(outPath, JSON.stringify({ gridSize: GRID_SIZE, seeds: SEEDS, results }, null, 2));
console.log(`\nRaw results written to ${outPath}`);
