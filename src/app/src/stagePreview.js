/*
========================================
STAGE PREVIEW
========================================
* Per-node intermediate canvas state: a declarative table mapping
* (generator, nodeType) to either a *params override* — re-run the
* pattern's existing generator/SVG function with a modified param — or,
* for stages with no reducing param (seed points, wave's rings-mode
* distance field), a small dedicated preview renderer. Every generator's
* opening Workspace node is handled once, centrally, as a blank canvas
* (resolvePreview) rather than per-generator. Stages with no rule below
* fall through to the pattern's real current output.
*/

import { generateSeedPoints } from "../../generators/lib/seedPoints.js";

function override(overrides) {
   return { kind: "override", overrides };
}

const RULES = {
   recursive: (nodeType, params, node) => {
      // depth: 0 runs Subdivide zero times — recursive.js's own base case, a
      // plain filled square before any subdivision has happened. Rendered as
      // "baseShape" (a bordered square), not "override" — depth: 0 is a
      // solid colour1 fill with no distinguishing marks of its own, which
      // would otherwise look pixel-identical to Workspace's blank canvas.
      if (nodeType === "baseGeometry") return { kind: "baseShape" };
      if (nodeType === "subdivide") return override({ depth: node?.occurrence ?? params.depth });
      return null;
   },
   recursiveNoise: (nodeType, params, node) => {
      if (nodeType === "baseGeometry") return { kind: "baseShape" };
      // A level's noise warp has no visible effect in isolation — it only
      // changes anything once *that same level's* subdivide test runs on
      // the warped point (recursiveNoise.js), so simply re-running the
      // generator up to this level (like Subdivide(i) does) looks pixel-
      // identical to whatever the previous step already showed. Instead,
      // Noise(i) diffs "this level's cumulative pattern, this level's own
      // amplitudeN as configured" against "the same, but with amplitudeN
      // (only this level — every other level's own amplitude is untouched)
      // forced to 0", and highlights every pixel that flips — so what this
      // node's own independent control is doing becomes visible on its own,
      // separate from every other level's.
      if (nodeType === "noise") {
         const occurrence = node?.occurrence ?? 1;
         return { kind: "noiseDiff", overrides: { depth: occurrence }, zeroParam: `amplitude${occurrence}` };
      }
      if (nodeType === "subdivide") {
         return override({ depth: node?.occurrence ?? params.depth });
      }
      return null;
   },
   escher: (nodeType) => (nodeType === "baseGeometry" ? override({ bumpAmp: 0 }) : null),
   grid: (nodeType) => (nodeType === "latticeIndex" ? override({ tones: "2" }) : null),
   islamic: (nodeType) => {
      if (nodeType === "grid") return override({ scale: 0.03 });
      if (nodeType === "constructionCircle" || nodeType === "radialDivisions") return override({ frequency: 1 });
      return null;
   },
   voronoi: (nodeType) => (nodeType === "seedPoints" ? { kind: "seedPoints" } : null),
   voronoiIslamic: (nodeType) => (nodeType === "seedPoints" ? { kind: "seedPoints" } : null),
   // Hybrid v2: same Seed Points node/role as voronoiIslamic above (see
   // workflows.js's STEP_DEFS) — same preview.
   voronoiIslamicV2: (nodeType) => (nodeType === "seedPoints" ? { kind: "seedPoints" } : null),
   wave: (nodeType, params) =>
      nodeType === "distanceField" && params.mode === "rings" ? { kind: "rawDistance" } : null,
};

// `node` is the selected ReactFlow node (has `.occurrence` — see
// workflows.js's buildWorkflow) — optional, only read by the two repeated-
// step generators above.
export function resolvePreview(generatorName, nodeType, params, node) {
   // Workspace is every generator's opening node (see workflows.js's
   // STEP_DEFS) — nothing has run yet at that stage, so its preview is
   // always a blank canvas rather than falling through to the pattern's
   // final output like an unhandled nodeType otherwise would.
   if (nodeType === "workspace") return { kind: "blank" };
   return RULES[generatorName]?.(nodeType, params, node) ?? null;
}

// ── Raster preview renderers (per-pixel) ────────────────────────────────

export function seedPointsRasterValue(x, y, params, dotRadius = 5) {
   const points = generateSeedPoints(params.numCells ?? 20, params.seed ?? 1337);
   const rSq = dotRadius * dotRadius;
   for (let i = 0; i < points.length; i += 2) {
      const dx = x - points[i], dy = y - points[i + 1];
      if (dx * dx + dy * dy <= rSq) return -1;
   }
   return 1;
}

// ── SVG preview renderers (whole-image) ─────────────────────────────────

export function seedPointsSvg(width, height, params, dotRadius = 5) {
   const points = generateSeedPoints(params.numCells ?? 20, params.seed ?? 1337);
   const circles = [];
   for (let i = 0; i < points.length; i += 2) {
      circles.push(`<circle cx="${points[i]}" cy="${points[i + 1]}" r="${dotRadius}" fill="#000"/>`);
   }
   return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#fff"/>${circles.join("")}</svg>`;
}

export function blankSvg(width, height, params = {}) {
   const fill = params.colour1 ?? "#ffffff";
   return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${fill}"/></svg>`;
}

// A solid-colour marker sized well under the full canvas and centred on it —
// deliberately *not* full-bleed, so it reads as a preview swatch of the
// shape the pattern spawns from rather than looking like it's claiming the
// same extent the real render will fill. Small enough that if the pattern's
// initial shape ever changes (a different generator, a different base
// polygon), the marker is unmistakably "just a preview", not the pattern.
const BASE_SHAPE_FRACTION = 0.4;

function baseShapeRect(width, height) {
   const size = Math.min(width, height) * BASE_SHAPE_FRACTION;
   return { x: (width - size) / 2, y: (height - size) / 2, size };
}

export function baseShapeSvg(width, height, params = {}) {
   const bg = params.colour1 ?? "#ffffff";
   const mark = params.colour2 ?? "#000000";
   const { x, y, size } = baseShapeRect(width, height);
   return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      `<rect width="${width}" height="${height}" fill="${bg}"/>` +
      `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${mark}"/></svg>`
   );
}

// Raster counterpart: -1 (mapColour's dark/colour2 value) inside the centred
// marker, 1 (light/colour1) everywhere else — same two-tone convention as
// every other raster preview here (seedPointsRasterValue etc).
export function baseShapeRasterValue(x, y, width, height) {
   const rect = baseShapeRect(width, height);
   const inside = x >= rect.x && x < rect.x + rect.size && y >= rect.y && y < rect.y + rect.size;
   return inside ? -1 : 1;
}

// The colour a "noiseDiff" preview (recursiveNoise's Noise nodes) paints a
// pixel whose in/out status differs between noise on and noise off at that
// level — deliberately not colour1/colour2, so it reads as a highlight laid
// over the pattern rather than a third structural tone.
export const NOISE_DIFF_HIGHLIGHT = { r: 255, g: 136, b: 0, a: 255 };

export function rawDistanceSvg(width, height) {
   // Concentric rings shaded directly by radius — the same Distance Field
   // value wave.js's own rings mode feeds into sineWave, shown here
   // *before* that periodic transform is applied.
   const cx = width / 2, cy = height / 2;
   const maxR = Math.ceil(Math.hypot(cx, cy));
   const parts = [];
   for (let r = maxR; r >= 0; r--) {
      const c = Math.round((1 - r / maxR) * 255);
      const hex = c.toString(16).padStart(2, "0");
      parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#${hex}${hex}${hex}"/>`);
   }
   return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" overflow="hidden">${parts.join("")}</svg>`;
}
