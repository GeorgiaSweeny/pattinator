/*
========================================
POLYGON OFFSET
========================================
* True perpendicular offset of a closed, star-shaped-about-the-origin
* polygon: shift every edge outward or inward along its own normal, then
* rebuild each vertex as the intersection of its two adjacent shifted
* edges — falling back to a bevel wherever that intersection would move
* too far from the original vertex (the same idea as SVG's own
* stroke-miterlimit). Extracted from svg/islamic-svg.js so its ring
* construction can be reused per-pixel (voronoiIslamicV2.js), not just
* rendered as stroked SVG polygons.
*/
import { lineIntersect } from "./starPolygon.js";

// Caps how far a vertex offset by d can move from its original position —
// a rosette's acute tip corners (e.g. an 18-degree half-angle at n=5) would
// otherwise balloon an uncapped miter to several times the medallion's own
// radius.
export const MITER_LIMIT = 1.8;

export function offsetPolygon(outline, d) {
   const n = outline.length / 2;
   const shifted = [];
   for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const x1 = outline[i * 2], y1 = outline[i * 2 + 1];
      const x2 = outline[j * 2], y2 = outline[j * 2 + 1];
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      let nx = dy / len, ny = -dx / len;
      const midx = (x1 + x2) / 2, midy = (y1 + y2) / 2;
      if (nx * midx + ny * midy < 0) { nx = -nx; ny = -ny; } // point outward
      shifted.push({ x1: x1 + nx * d, y1: y1 + ny * d, x2: x2 + nx * d, y2: y2 + ny * d });
   }

   const out = [];
   const limit = Math.abs(d) * MITER_LIMIT;
   for (let i = 0; i < n; i++) {
      const ox = outline[i * 2], oy = outline[i * 2 + 1]; // original vertex
      const prev = shifted[(i - 1 + n) % n];
      const cur = shifted[i];
      const hit = lineIntersect(prev.x1, prev.y1, prev.x2, prev.y2, cur.x1, cur.y1, cur.x2, cur.y2);
      if (hit && Math.hypot(hit.x - ox, hit.y - oy) <= limit) {
         out.push(hit.x, hit.y);
      } else {
         out.push(prev.x2, prev.y2, cur.x1, cur.y1); // bevel: two points, not one
      }
   }
   return Float32Array.from(out);
}

function minRadius(poly) {
   let min = Infinity;
   for (let i = 0; i < poly.length; i += 2) min = Math.min(min, Math.hypot(poly[i], poly[i + 1]));
   return min;
}

// How many offset bands stay clean before the naive per-vertex-miter offset
// (see above) becomes unreliable, as a function of segments — matched
// visually against actual rendered output, not derived in closed form. More
// segments packs more offset edges into the same radius (tangles sooner);
// segments = 5 is a special case (starSkip(5) gives the sharpest tip angle
// in the whole range) and is capped tighter still.
export function maxBandsFor(segments) {
   const n = Math.max(3, Math.round(segments));
   if (n === 5) return 1;
   if (n <= 8) return 2;
   if (n <= 11) return 1;
   return 0;
}

// The full set of ring polygons for a silhouette: band 0 is the outline
// itself, bands 1..maxBands are outward offsets (always included), and
// negative bands are inward offsets that stop early once a further inward
// offset stops shrinking — an inward waist vertex can invert through a
// collapse point past that. Shared by islamic-svg.js's stroke renderer and
// any raster consumer that needs the identical ring geometry.
export function buildOffsetBands(outline, step, maxBands) {
   const bands = [{ index: 0, poly: outline }];

   for (let i = 1; i <= maxBands; i++) {
      bands.push({ index: i, poly: offsetPolygon(outline, i * step) });
   }

   let prevRadius = Infinity;
   for (let i = 1; i <= maxBands; i++) {
      const poly = offsetPolygon(outline, -i * step);
      const r = minRadius(poly);
      if (!isFinite(r) || r >= prevRadius) break;
      bands.push({ index: -i, poly });
      prevRadius = r;
   }

   return bands;
}
