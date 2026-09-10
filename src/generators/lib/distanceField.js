/*
========================================
DISTANCE FIELD
========================================
* Maps to the "Distance Field" computation node (docs/nodes/computation/distance-field.md):
* the minimum Euclidean distance from a point to a set of features, and which
* feature was nearest. Partition builds on this directly.
*/

// Brute-force nearest-point search (O(points.length) per query — see
// docs/results/benchmark-results.md for the measured cost as numCells scales).
export function nearestPoint(x, y, points) {
   let minDistSq = Infinity, nearestIndex = 0;
   for (let i = 0; i < points.length; i += 2) {
      const dx = x - points[i], dy = y - points[i + 1];
      const distSq = dx * dx + dy * dy;
      if (distSq < minDistSq) { minDistSq = distSq; nearestIndex = i / 2; }
   }
   return { index: nearestIndex, distSq: minDistSq };
}

// Like nearestPoint, but also tracks the second-nearest distance in the
// same pass: sqrt(secondDistSq) - sqrt(distSq) is a cheap per-pixel proxy
// for distance to a Voronoi cell's boundary (zero exactly on the edge),
// with no cell-polygon construction — see docs/generators/voronoi-islamic.md.
// Kept separate from nearestPoint since most callers don't need it.
export function nearestTwoPoints(x, y, points) {
   let minDistSq = Infinity, secondDistSq = Infinity, nearestIndex = 0;
   for (let i = 0; i < points.length; i += 2) {
      const dx = x - points[i], dy = y - points[i + 1];
      const distSq = dx * dx + dy * dy;
      if (distSq < minDistSq) {
         secondDistSq = minDistSq;
         minDistSq = distSq;
         nearestIndex = i / 2;
      } else if (distSq < secondDistSq) {
         secondDistSq = distSq;
      }
   }
   return { index: nearestIndex, distSq: minDistSq, secondDistSq };
}

// The single-feature case of a Distance Field: Euclidean distance from (x, y) to one
// fixed point (e.g. the workspace centre for a concentric-rings pattern).
export function distanceToPoint(x, y, px, py) {
   const dx = x - px, dy = y - py;
   return Math.sqrt(dx * dx + dy * dy);
}

// The line-feature case of a Distance Field: minimum Euclidean distance from
// (x, y) to any segment in a flat [x1, y1, x2, y2, ...] edge list (see
// lib/starPolygon.js) — "Points or geometry" per docs/nodes/computation/
// distance-field.md, distanceToPoint's straight-edge sibling.
export function nearestSegmentDistSq(x, y, edges) {
   let minDistSq = Infinity;
   for (let i = 0; i < edges.length; i += 4) {
      const x1 = edges[i], y1 = edges[i + 1], x2 = edges[i + 2], y2 = edges[i + 3];
      const dx = x2 - x1, dy = y2 - y1;
      const lenSq = dx * dx + dy * dy;
      let t = lenSq > 0 ? ((x - x1) * dx + (y - y1) * dy) / lenSq : 0;
      t = Math.max(0, Math.min(1, t));
      const px = x1 + t * dx, py = y1 + t * dy;
      const ddx = x - px, ddy = y - py;
      const distSq = ddx * ddx + ddy * ddy;
      if (distSq < minDistSq) minDistSq = distSq;
   }
   return minDistSq;
}

// Standard ray-casting point-in-polygon test (even-odd rule) against a
// flat [x1, y1, x2, y2, ...] closed vertex list — the sign half of
// islamic.js's rosette construction: nearestSegmentDistSq gives distance
// to the boundary, this gives which side of it a pixel is on, so the two
// combine into a signed distance field for radial tone banding.
export function pointInPolygon(x, y, poly) {
   const n = poly.length / 2;
   let inside = false;
   for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = poly[i * 2], yi = poly[i * 2 + 1];
      const xj = poly[j * 2], yj = poly[j * 2 + 1];
      const intersects = (yi > y) !== (yj > y) &&
         x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersects) inside = !inside;
   }
   return inside;
}
