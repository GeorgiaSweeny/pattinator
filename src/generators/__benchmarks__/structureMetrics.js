/*
========================================
STRUCTURE/ENTROPY METRICS — SECONDARY RQ EMPIRICAL CONTENT
========================================
* Quantifies the claim behind this project's hybrid generators
* (docs/ALGORITHMIC_COMPOSITION_RESEARCH.md's secondary RQ): sweep each
* hybrid's own "how much randomness" parameter (recursiveNoise's
* `amplitude`, voronoiIslamic's `variation`) from 0 upward and measure how
* the rendered field's structure changes, using two standard metrics:
*
*   - Edge density: fraction of 4-connected adjacent pixel pairs whose
*     binarised values differ — a proxy for how much boundary the pattern has.
*   - 2x2 block-pattern Shannon entropy: entropy (bits) of the distribution
*     of 2x2 binary block patterns. Low = few distinct motifs (structured);
*     near 4 bits (log2(16)) = noise-dominated.
*
* Run with: npm run structure-metrics (from src/). Writes raw results to
* __benchmarks__/structureMetrics.results.json; docs/results/structure-metrics-results.md
* holds the interpreted numbers.
*/
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { recursiveNoise } from "../recursiveNoise.js";
import { voronoiIslamic } from "../voronoiIslamic.js";
import { CANVAS } from "../../config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---- field sampling ---------------------------------------------------------

function sampleField(fn, params, gridSize) {
   const field = new Int8Array(gridSize * gridSize);
   for (let j = 0; j < gridSize; j++) {
      const y = (j / (gridSize - 1)) * CANVAS.HEIGHT;
      for (let i = 0; i < gridSize; i++) {
         const x = (i / (gridSize - 1)) * CANVAS.WIDTH;
         field[j * gridSize + i] = fn(x, y, params) > 0 ? 1 : 0; // binarised — every generator's range is [-1, 1]
      }
   }
   return field;
}

// ---- metrics -----------------------------------------------------------------

// Fraction of 4-connected adjacent pixel pairs (right + down neighbours,
// counted once each) whose binarised values differ.
function edgeDensity(field, n) {
   let differing = 0, total = 0;
   for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
         const v = field[j * n + i];
         if (i + 1 < n) { total++; if (field[j * n + i + 1] !== v) differing++; }
         if (j + 1 < n) { total++; if (field[(j + 1) * n + i] !== v) differing++; }
      }
   }
   return differing / total;
}

// Shannon entropy (bits) of the distribution of 2x2 block patterns, over
// non-overlapping blocks. Maximum possible is log2(16) = 4 bits.
function blockEntropy(field, n) {
   const counts = new Array(16).fill(0);
   let blocks = 0;
   for (let j = 0; j + 1 < n; j += 2) {
      for (let i = 0; i + 1 < n; i += 2) {
         const pattern =
            (field[j * n + i] << 0) |
            (field[j * n + i + 1] << 1) |
            (field[(j + 1) * n + i] << 2) |
            (field[(j + 1) * n + i + 1] << 3);
         counts[pattern]++;
         blocks++;
      }
   }
   let entropy = 0;
   for (const c of counts) {
      if (c === 0) continue;
      const p = c / blocks;
      entropy -= p * Math.log2(p);
   }
   return entropy;
}

function fillFraction(field) {
   let sum = 0;
   for (const v of field) sum += v;
   return sum / field.length;
}

// ---- sweep configuration ------------------------------------------------------

const GRID_SIZE = 300;
const SEED = 1337;
const AMPLITUDES = [0, 0.02, 0.05, 0.08, 0.12, 0.16, 0.2, 0.25, 0.3, 0.4, 0.5, 0.7, 1.0, 1.5, 2.0];
const VARIATIONS = [0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

const SWEEPS = [
   {
      name: "recursiveNoise",
      // recursiveNoise.js now gives every level its own independent
      // amplitude (amplitude1..amplitude6) rather than one shared, ramped
      // value — sweeping amplitude1 alone exercises level 1's warp exactly
      // like the old single `amplitude` param used to (this script's
      // existing results.json/docs predate that change and are no longer
      // reproducible from it; rerun via `npm run structure-metrics` to
      // refresh them against the new API).
      label: "amplitude1",
      fixedParams: { depth: 4, seed: SEED },
      values: AMPLITUDES,
      fn: recursiveNoise,
   },
   {
      name: "voronoiIslamic",
      label: "variation",
      fixedParams: { numCells: 20, segments: 8, scale: 0.35, frequency: 2, seed: SEED },
      values: VARIATIONS,
      fn: voronoiIslamic,
   },
];

// ---- run ------------------------------------------------------------------

const allResults = { gridSize: GRID_SIZE, sweeps: {} };

for (const sweep of SWEEPS) {
   console.log(`=== ${sweep.name}.js structure/entropy sweep (${sweep.label}, grid ${GRID_SIZE}x${GRID_SIZE}) ===\n`);

   const rows = sweep.values.map((value) => {
      const field = sampleField(sweep.fn, { ...sweep.fixedParams, [sweep.label]: value }, GRID_SIZE);
      return {
         [sweep.label]: value,
         fillFraction: fillFraction(field),
         edgeDensity: edgeDensity(field, GRID_SIZE),
         blockEntropyBits: blockEntropy(field, GRID_SIZE),
      };
   });

   for (const r of rows) {
      console.log(
         `${sweep.label}=${r[sweep.label].toFixed(2).padStart(5)}  ` +
         `fill=${r.fillFraction.toFixed(3)}  ` +
         `edgeDensity=${r.edgeDensity.toFixed(4)}  ` +
         `blockEntropy=${r.blockEntropyBits.toFixed(3)} bits`
      );
   }
   console.log("");

   allResults.sweeps[sweep.name] = { label: sweep.label, fixedParams: sweep.fixedParams, rows };
}

const outPath = join(__dirname, "structureMetrics.results.json");
writeFileSync(outPath, JSON.stringify(allResults, null, 2));
console.log(`Raw results written to ${outPath}`);
