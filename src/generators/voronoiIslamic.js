/*
========================================
VORONOI-SEEDED ISLAMIC TILING (HYBRID)
========================================
* Composition: Seed Points -> nearestPoint (cell membership) -> local
* coordinates relative to the owning seed -> islamic.js's unchanged
* silhouette pipeline. See docs/generators/voronoi-islamic.md for the
* research question (does islamic.js's construction generalise from a
* regular grid to an irregular point source) and full design reasoning
* in docs/research-plans/VORONOI_ISLAMIC_HYBRID_PLAN.md.
*
* Implementation notes not covered by the doc:
* - A cell's centre is just its seed point (nearestPoint's `index`) — no
*   cell-polygon construction needed, same simplification voronoi.js relies on.
* - `radius` scales to each cell's own nearest-neighbour spacing
*   (lib/seedPoints.js's nearestNeighbourDistances), not a canvas-wide
*   constant, since Voronoi cells vary in size unlike islamic.js's tiles.
* - `segments`/`rotation`/`scale` are held uniform across cells by default
*   (only cell centres are stochastic) so the comparison to islamic.js's
*   construction stays clean; `variation` (opt-in, default 0 = exact no-op)
*   later added optional per-cell divergence via cellVariation() below.
* - Cells are self-contained (radius bounded by local spacing), so no
*   neighbour-cell search is needed for the star's own lines.
* - Raster only (nativeFormat: "raster") — an SVG version would need a
*   per-cell clip polygon rather than a repeating <pattern> unit.
* - A second independent line test traces each cell's own Voronoi boundary
*   (equidistant from its two nearest seeds, lib/distanceField.js's
*   nearestTwoPoints), OR'd with the star's own line test, so adjacent
*   medallions read as one connected tiling rather than scattered stars.
*/
import { generateSeedPoints, nearestNeighbourDistances } from "./lib/seedPoints.js";
import { nearestTwoPoints, nearestSegmentDistSq, pointInPolygon } from "./lib/distanceField.js";
import { constructionCircle, radialDivisions } from "./lib/constructionCircle.js";
import { starOutline, starSkip } from "./lib/starPolygon.js";
import { toneSet, bandTone } from "./lib/colourMapping.js";
import { xorshift32Unit } from "./lib/rng.js";
import { snapRotation } from "./islamic.js";

// Per-cell segments/rotation jitter (see header). RNG stream depends only
// on (seed, index), so adding cells never perturbs an existing cell's own
// jitter. At variation = 0 both jitter terms are exactly 0 — byte-identical
// to this param not existing. Exported so tests can build an independent oracle.
export function cellVariation(seed, index, segments, rotation, variation) {
   const mixedSeed = (seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;
   const rand = xorshift32Unit(mixedSeed);
   const jitterA = rand(), jitterB = rand();

   const maxSegJitter = 5; // keeps cellSegments sensible across the declared [3, 16] range
   const segJitter = Math.round(variation * maxSegJitter * (jitterA * 2 - 1));
   const cellSegments = Math.min(16, Math.max(3, Math.round(segments) + segJitter));

   const rotJitterDeg = variation * 180 * (jitterB * 2 - 1);
   return { segments: cellSegments, rotation: rotation + rotJitterDeg };
}

// Cached per (numCells, seed) so the O(numCells^2) nearestNeighbourDistances
// cost is paid once, not once per pixel.
const _cellCache = new Map();
function getCells(numCells, seed) {
   const key = `${numCells}|${seed}`;
   if (!_cellCache.has(key)) {
      const points = generateSeedPoints(numCells, seed);
      const nnDist = nearestNeighbourDistances(points);
      _cellCache.set(key, { points, nnDist });
   }
   return _cellCache.get(key);
}

// Same outline construction as islamic.js, but `radius` varies per cell —
// the cache key still collapses to one entry per distinct radius seen
// (bounded by the seed set, not pixel count).
const _outlineCache = new Map();
function getOutline(segments, radius, rotationDeg) {
   const snappedDeg = snapRotation(rotationDeg, segments);
   const key = `${segments}|${radius}|${snappedDeg}`;
   if (!_outlineCache.has(key)) {
      const n = Math.max(3, Math.round(segments));
      const circle = constructionCircle(0, 0, radius);
      // Base alignment matches islamic.js: tip 0 at 90 degrees so every
      // medallion is vertically symmetric regardless of segments.
      const points = radialDivisions(circle, n, Math.PI / 2 + (snappedDeg * Math.PI) / 180);
      _outlineCache.set(key, starOutline(points, starSkip(n)));
   }
   return _outlineCache.get(key);
}

const _edgeCache = new Map();
function outlineEdges(outline) {
   if (!_edgeCache.has(outline)) {
      const n = outline.length / 2;
      const edges = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
         const j = (i + 1) % n;
         edges[i * 4] = outline[i * 2];
         edges[i * 4 + 1] = outline[i * 2 + 1];
         edges[i * 4 + 2] = outline[j * 2];
         edges[i * 4 + 3] = outline[j * 2 + 1];
      }
      _edgeCache.set(outline, edges);
   }
   return _edgeCache.get(outline);
}

export function voronoiIslamic(x, y, params) {
   const {
      numCells = 20,
      seed = 1337,
      segments = 8,
      scale = 0.42,
      frequency = 3,
      lineWidth = 0.06,
      tones = "2",
      rotation = 0,
      variation = 0,
   } = params;

   const { points, nnDist } = getCells(numCells, seed);
   const shades = toneSet(tones);

   // Which cell (x, y) belongs to, and its centre (the seed point itself).
   // secondDistSq (from the same search) feeds the boundary line test below.
   const { index, distSq, secondDistSq } = nearestTwoPoints(x, y, points);
   const cx = points[index * 2], cy = points[index * 2 + 1];
   const lx = x - cx, ly = y - cy;

   const cell = cellVariation(seed, index, segments, rotation, variation);

   // Radius scaled to this cell's own local spacing (see header).
   const radius = scale * nnDist[index];
   const outline = getOutline(cell.segments, radius, cell.rotation);
   const edges = outlineEdges(outline);

   // islamic.js's own signed-distance banding, unchanged.
   const dist = Math.sqrt(nearestSegmentDistSq(lx, ly, edges));
   const inside = pointInPolygon(lx, ly, outline);
   const signedDist = inside ? -dist : dist;

   const step = radius / frequency;
   const bandPos = signedDist / step;
   const nearestBand = Math.round(bandPos);
   const distToLine = Math.abs(bandPos - nearestBand) * step;
   const onStarLine = distToLine < lineWidth * radius;

   // Cell-boundary line (see header): traced at the same weight as the
   // star's own lines so the lattice reads as one connected strapwork.
   const boundaryGap = Math.sqrt(secondDistSq) - Math.sqrt(distSq);
   const onBoundaryLine = boundaryGap < lineWidth * radius;

   if (!onStarLine && !onBoundaryLine) return shades[0];
   return onStarLine ? bandTone(shades, nearestBand) : bandTone(shades, 0);
}
