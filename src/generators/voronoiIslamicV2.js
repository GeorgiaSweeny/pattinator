/*
========================================
VORONOI-SEEDED ISLAMIC TILING V2 (HYBRID)
========================================
* Composition: Seed Points -> nearestPoint (cell lookup) -> Construction
* Circle -> Radial Divisions -> Star Polygon (silhouette) -> ring bands via
* islamic-svg.js's own offset-polygon geometry -> Colour Mapping. See
* docs/generators/voronoi-islamic-v2.md for the research question and full
* design reasoning, and voronoiIslamic.js (the original version of this
* hybrid) for the more elaborate take this one intentionally simplifies
* away from — every step after cell lookup here is islamic.js's own
* construction, reused completely unmodified.
*
* Implementation notes not covered by the doc:
* - Every cell uses the same fixed radius (`tileSize * scale`), not adapted
*   to local spacing, so densely-packed cells can overlap and sparse ones
*   can gap — an expected consequence of that choice, not a bug.
* - `randomRotation` composes with `rotation` (the Flipped toggle) by simple
*   addition rather than the two being mutually exclusive: each cell's own
*   random rotation (cellRotationOffset below, deterministic from seed +
*   point index) gets Flipped's shared offset added on top when both are on.
*/
import { generateSeedPoints } from "./lib/seedPoints.js";
import { nearestPoint, nearestSegmentDistSq } from "./lib/distanceField.js";
import { constructionCircle, radialDivisions } from "./lib/constructionCircle.js";
import { starOutline, starSkip } from "./lib/starPolygon.js";
import { toneSet, bandTone } from "./lib/colourMapping.js";
import { snapRotation } from "./islamic.js";
import { maxBandsFor, buildOffsetBands } from "./lib/polygonOffset.js";
import { xorshift32Unit } from "./lib/rng.js";

// Seed points are deterministic per (numCells, seed) — cached the same way
// voronoi.js caches its own.
const _cellCache = new Map();
function getPoints(numCells, seed) {
   const key = `${numCells}|${seed}`;
   if (!_cellCache.has(key)) _cellCache.set(key, generateSeedPoints(numCells, seed));
   return _cellCache.get(key);
}

// Each cell's own independent random rotation (see header comment) — the
// RNG stream depends only on (seed, index), same mixing technique as
// voronoiIslamic.js's cellVariation, so adding/removing cells never
// perturbs an existing cell's own angle. Exported so tests can build an
// independent oracle without re-deriving this exact bit-mixing scheme.
export function cellRotationOffset(seed, index) {
   const mixedSeed = (seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;
   const rand = xorshift32Unit(mixedSeed);
   return rand() * 360;
}

// Byte-identical to islamic.js's own getOutline — construction points
// depend only on (segments, radius, rotation), never on which cell they're
// placed in, so this cache is shared across every cell exactly as
// islamic.js shares it across every tile.
const _outlineCache = new Map();
function getOutline(segments, radius, rotationDeg) {
   const snappedDeg = snapRotation(rotationDeg, segments);
   const key = `${segments}|${radius}|${snappedDeg}`;
   if (!_outlineCache.has(key)) {
      const n = Math.max(3, Math.round(segments));
      const circle = constructionCircle(0, 0, radius);
      const points = radialDivisions(circle, n, Math.PI / 2 + (snappedDeg * Math.PI) / 180);
      _outlineCache.set(key, starOutline(points, starSkip(n)));
   }
   return _outlineCache.get(key);
}

// The full set of ring polygons for this medallion (see header comment) —
// depends on the same (segments, radius, rotation) as getOutline, plus
// frequency (it sets the offset step between bands), so every cell with
// matching params reuses the same rings, same as islamic-svg.js sharing
// one _buildRings result across every tile.
const _bandsCache = new Map();
function getBands(segments, radius, rotationDeg, frequency) {
   const snappedDeg = snapRotation(rotationDeg, segments);
   const key = `${segments}|${radius}|${snappedDeg}|${frequency}`;
   if (!_bandsCache.has(key)) {
      const outline = getOutline(segments, radius, rotationDeg);
      const step = radius / frequency;
      const bands = buildOffsetBands(outline, step, maxBandsFor(segments));
      _bandsCache.set(key, bands.map((band) => ({ index: band.index, edges: outlineEdges(band.poly) })));
   }
   return _bandsCache.get(key);
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

export function voronoiIslamicV2(x, y, params) {
   const {
      seed = 1337,
      segments = 8,
      tileSize = 100,
      numCells = 15,
      scale = 0.42,
      frequency = 3,
      lineWidth = 0.06,
      tones = "2",
      rotation = 0,
      randomRotation = 0,
   } = params;

   const points = getPoints(numCells, seed);
   const shades = toneSet(tones);

   // The only change from islamic.js: which cell (x, y) belongs to, and
   // that cell's own centre, comes from Voronoi's nearest-seed lookup
   // instead of Grid's tile lookup.
   const { index } = nearestPoint(x, y, points);
   const cx = points[index * 2], cy = points[index * 2 + 1];
   const lx = x - cx, ly = y - cy;

   // Everything from here down is Islamic Rosette's own ring construction
   // (see header comment) — the same rings islamic-svg.js itself draws,
   // evaluated per-pixel instead of stroked. `rotation` (the Flipped
   // toggle) and this cell's own random offset (see header comment) simply
   // add together.
   const cellRotation = (randomRotation ? cellRotationOffset(seed, index) : 0) + rotation;
   const radius = tileSize * scale;
   const bands = getBands(segments, radius, cellRotation, frequency);

   let bestDistSq = Infinity, bestIndex = 0;
   for (const band of bands) {
      const distSq = nearestSegmentDistSq(lx, ly, band.edges);
      if (distSq < bestDistSq) { bestDistSq = distSq; bestIndex = band.index; }
   }

   const threshold = lineWidth * radius;
   if (bestDistSq >= threshold * threshold) return shades[0];
   return bandTone(shades, bestIndex);
}
