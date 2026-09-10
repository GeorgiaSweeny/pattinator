/*
========================================
SPECTRUM METRICS — STRUCTURAL SCORE (derived from the composition table)
========================================
* spectrumMetrics.js checks the declared `spectrum` value (patternRegistry.js)
* empirically, by measuring how much a generator's actual output changes
* under re-seeding. That alone is not a reliable definition on its own —
* see docs/results/spectrum-metrics-results.md's Voronoi discussion: an empirically
* seed-sensitive generator (Voronoi) can still be "hybrid", not "stochastic",
* under this dissertation's own pattern definition (1.2), because what
* matters is whether the RULE governing the output is fixed once a random
* draw is made, not how much the output happens to move when a different
* draw is made.
*
* This script computes a second, STRUCTURAL score instead of an empirical
* one, derived directly from each generator's already-documented
* composition (docs/ALGORITHMIC_COMPOSITION_RESEARCH.md's composition
* table), not from running the generator at all. The question it answers:
* where, structurally, does randomness (lib/rng.js, lib/seedPoints.js — the
* only two primitives in the shared library that touch a seed) sit in the
* generator's own composition chain?
*
*   1.0  no RNG primitive anywhere in the chain — deterministic by
*        construction, re-seeding is a no-op regardless of any empirical
*        measurement (matches spectrumMetrics.js's own `!hasSeedParam` case).
*   0.5  RNG appears only inside a Constant-bind: the seed produces a fixed,
*        finite structure (seed points, a permutation table used
*        identically everywhere) computed once and reused, unchanged, for
*        every (x, y) query. The per-pixel rule itself is then a purely
*        deterministic function of that fixed structure — the composition
*        table's own "Constant-bind -> Atop" pattern. Randomness is
*        quarantined to a bounded, low-dimensional draw, not resampled
*        continuously.
*   0.0  RNG is queried directly as part of the per-pixel evaluation itself
*        (the composition table's Fold pattern, or a Fold-based primitive
*        such as noise() invoked fresh inside another chain) — the rule
*        governing the output is not fixed once a random draw is made,
*        because a fresh draw effectively happens at every sample.
*
* This is a three-tier, not continuous, score deliberately: the underlying
* claim ("is randomness quarantined to a one-off draw, or resampled per
* point") is categorical, read directly off already-documented composition
* facts, not something a smoother formula would make more true. Continuous
* refinement is exactly what spectrumMetrics.js's empirical measurement is
* for — this script's job is to state, reliably and source-traceably, what
* the composition *should* predict, so the two can be cross-referenced.
*
* Run with: npm run spectrum-structural (from src/). Writes raw results to
* __benchmarks__/spectrumStructural.results.json; docs/results/spectrum-structural-results.md
* holds the interpreted numbers and discussion.
*/
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { REGISTRY } from "../../patternRegistry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// One row per GENERATOR (not per registry entry — structure is a property
// of the generator function, shared across every preset built on it), taken
// directly from docs/ALGORITHMIC_COMPOSITION_RESEARCH.md's composition
// table (the "Pattern" column) plus that table's own prose for the two
// generators (noise.js, recursiveNoise.js) whose RNG use is per-pixel
// rather than constant-bound.
const STRUCTURAL = {
   wave:            { score: 1.0, reason: "no RNG primitive in its chain (Constant-bind -> Atop / Atop over waveform.js, both deterministic)" },
   grid:            { score: 1.0, reason: "no RNG primitive in its chain (Atop over latticeIndex.js)" },
   escher:          { score: 1.0, reason: "no RNG primitive in its chain (Cross-fork -> Atop over edgeDeformation.js)" },
   recursive:       { score: 1.0, reason: "no RNG primitive in its chain (Repeat/power over subdivide.js)" },
   islamic:         { score: 1.0, reason: "no RNG primitive in its chain (Constant-bind -> Fork -> Atop, but the constant-bound structure is a fixed construction circle, not a seed draw)" },
   noise:           { score: 0.0, reason: "RNG (lib/rng.js via the seeded permutation table) is queried directly inside the Fold/fBm loop for every (x, y) sample -- not constant-bound, resampled continuously" },
   voronoi:         { score: 0.5, reason: "RNG (lib/seedPoints.js) produces a fixed point set, Constant-bind'ed once; every per-pixel query afterward (nearestPoint) is a purely deterministic function of that fixed set" },
   voronoiIslamic:  { score: 0.5, reason: "same Constant-bind'ed seed points as voronoi.js, with islamic.js's own fully-deterministic construction downstream -- the RNG's structural position is unchanged even though more deterministic stages follow it" },
   voronoiIslamicV2:{ score: 0.5, reason: "same Constant-bind'ed seed points as voronoi.js; the opt-in `variation` param is itself \"a Constant-bind on an extra derived seed, not a new pattern\" (ALGORITHMIC_COMPOSITION_RESEARCH.md), so it does not change the tier" },
   recursiveNoise:  { score: 0.0, reason: "each Repeat step's Fork branch calls noise() -- a Fold-based, per-pixel-direct RNG use -- on the warped point at every recursion level, not a value fixed once ahead of the per-pixel loop; structurally identical in kind to noise.js's own tier, independent of the amplitude parameter that can gate its effect to zero" },
};

function loadEmpirical() {
   const path = join(__dirname, "spectrumMetrics.results.json");
   if (!existsSync(path)) return null;
   const data = JSON.parse(readFileSync(path, "utf8"));
   const byId = {};
   for (const r of data.results) byId[r.id] = r;
   return byId;
}

const empirical = loadEmpirical();
const rows = [];

for (const entry of REGISTRY) {
   const structural = STRUCTURAL[entry.generator];
   if (!structural) throw new Error(`No structural classification for generator "${entry.generator}" (id "${entry.id}") -- add one to STRUCTURAL above.`);
   const emp = empirical?.[entry.id];
   rows.push({
      id: entry.id,
      generator: entry.generator,
      declaredSpectrum: entry.spectrum,
      structuralScore: structural.score,
      structuralReason: structural.reason,
      empiricalBinarised: emp?.empiricalSpectrum ?? null,
      empiricalContinuous: emp?.empiricalSpectrumContinuous ?? null,
      declaredVsStructural: entry.spectrum - structural.score,
   });
}

console.log("=== Spectrum: declared vs. structural (composition-derived) vs. empirical ===\n");
for (const r of rows) {
   const emp = r.empiricalBinarised == null
      ? "n/a"
      : `bin=${r.empiricalBinarised.toFixed(2)} cont=${r.empiricalContinuous.toFixed(2)}`;
   console.log(
      `${r.id.padEnd(20)}  declared=${r.declaredSpectrum.toFixed(2)}  ` +
      `structural=${r.structuralScore.toFixed(2)}  ` +
      `empirical(${emp})  ` +
      `declared-structural=${r.declaredVsStructural >= 0 ? "+" : ""}${r.declaredVsStructural.toFixed(2)}`
   );
}

const outPath = join(__dirname, "spectrumStructural.results.json");
writeFileSync(outPath, JSON.stringify({ structural: STRUCTURAL, rows }, null, 2));
console.log(`\nRaw results written to ${outPath}`);
