/*
========================================
PATTERN REGISTRY
========================================
* Semantic recipes only. Each entry declares:
*   generator  — key into GENERATORS (pure math function)
*   params[]   — parameter schema:
*       { param, archetype, value, map }        → archetype slider
*       { param, control, label, options, value } → raw control
*       { param, value }                         → fixed, no UI
*
* Generators own math. Patterns own meaning.
*
* STATIC — this object is never mutated at runtime.
* Live parameter state is owned by PatternBinder (one instance per active pattern).
-----------------------------------------
*/

// Shared tones + colour1..colour5 block for tone-indexed vector generators
// (voronoi, grid, escher, islamic) — see docs/design/PATTERN_REGISTRY_NOTES.md.
function tonesAndColourParams(defaultTones = "2") {
   return [
      { param: "tones", control: "select", label: "Tones",
        options: ["2", "3", "4", "5"], value: defaultTones },
      { param: "colour1", control: "color", label: "Colour 1", value: "#ffffff" },
      { param: "colour2", control: "color", label: "Colour 2", value: "#bfbfbf" },
      { param: "colour3", control: "color", label: "Colour 3", value: "#808080",
        visibleIf: (p) => Number(p.tones) >= 3 },
      { param: "colour4", control: "color", label: "Colour 4", value: "#404040",
        visibleIf: (p) => Number(p.tones) >= 4 },
      { param: "colour5", control: "color", label: "Colour 5", value: "#000000",
        visibleIf: (p) => Number(p.tones) >= 5 },
   ];
}

// colour1 (light, +1) + colour2 (dark, -1) for patterns with no `tones`
// concept — see docs/design/PATTERN_REGISTRY_NOTES.md.
function twoColourParams() {
   return [
      { param: "colour1", control: "color", label: "Colour 1 (light)", value: "#ffffff" },
      { param: "colour2", control: "color", label: "Colour 2 (dark)",  value: "#000000" },
   ];
}

// Ordered simplest -> most complex; Hybrid entries listed last, after both
// of their ingredient generators — see docs/design/PATTERN_REGISTRY_NOTES.md.
export const REGISTRY = [

   // ── Wave — mostly deterministic ───────────────────────────────────────────

   {
      id:           "wave-stripes",
      name:         "Wave Stripes",
      category:     "Wave",
      generator:    "wave",
      spectrum:     0.75,
      nativeFormat: "vector",
      params: [
         { param: "mode",      value: "wave" },
         { param: "frequency", archetype: "Density", value: 0.05, map: [0.005, 0.15] },
         ...twoColourParams(),
      ],
   },

   {
      id:           "concentric-rings",
      name:         "Concentric Rings",
      category:     "Wave",
      generator:    "wave",
      spectrum:     0.75,
      nativeFormat: "vector",
      params: [
         { param: "mode",      value: "rings" },
         { param: "frequency", archetype: "Density", value: 0.05, map: [0.005, 0.15] },
         ...twoColourParams(),
      ],
   },

   // ── Noise — predominantly stochastic ──────────────────────────────────────

   {
      id:           "perlin-noise",
      name:         "Perlin Noise",
      category:     "Noise",
      generator:    "noise",
      spectrum:     0.10,
      nativeFormat: "raster",
      params: [
         { param: "mode",        value: "standard" },
         { param: "scale",       archetype: "Density",    value: 0.01, map: [0.001, 0.05] },
         { param: "octaves",     archetype: "Detail",     value: 1,    map: [1, 8] },
         { param: "lacunarity",  archetype: "Complexity", value: 2.0,  map: [1.0, 4.0] },
         { param: "persistence", archetype: "Threshold",  value: 0.5,  map: [0.1, 0.9] },
         ...twoColourParams(),
         { param: "seed",        archetype: "Seed",       value: 1337 },
      ],
      actions: [{ label: "Randomize Seed", method: "randomize" }],
   },

   {
      id:           "ridge-noise",
      name:         "Ridge Noise",
      category:     "Noise",
      generator:    "noise",
      spectrum:     0.15,
      nativeFormat: "raster",
      params: [
         { param: "mode",        value: "ridge" },
         { param: "scale",       archetype: "Density",    value: 0.01, map: [0.001, 0.05] },
         { param: "octaves",     archetype: "Detail",     value: 4,    map: [1, 8] },
         { param: "lacunarity",  archetype: "Complexity", value: 2.0,  map: [1.0, 4.0] },
         { param: "persistence", archetype: "Threshold",  value: 0.5,  map: [0.1, 0.9] },
         ...twoColourParams(),
         { param: "seed",        archetype: "Seed",       value: 1337 },
      ],
      actions: [{ label: "Randomize Seed", method: "randomize" }],
   },

   // ── Tiles — highly deterministic ──────────────────────────────────────────

   {
      id:           "square-grid",
      name:         "Square Grid",
      category:     "Tiles",
      generator:    "grid",
      spectrum:     0.95,
      nativeFormat: "vector",
      params: [
         { param: "shape",    value: "square" },
         ...tonesAndColourParams(),
         { param: "tileSize", archetype: "Size", value: 40, map: [10, 120] },
      ],
   },

   {
      id:           "hex-grid",
      name:         "Hex Grid",
      category:     "Tiles",
      generator:    "grid",
      spectrum:     0.95,
      nativeFormat: "vector",
      params: [
         { param: "shape",    value: "hexagon" },
         ...tonesAndColourParams(),
         { param: "tileSize", archetype: "Size", value: 30, map: [10, 120] },
      ],
   },

   {
      id:           "triangle-grid",
      name:         "Triangle Grid",
      category:     "Tiles",
      generator:    "grid",
      spectrum:     0.95,
      nativeFormat: "vector",
      params: [
         { param: "shape",    value: "triangle" },
         ...tonesAndColourParams(),
         { param: "tileSize", archetype: "Size", value: 40, map: [10, 120] },
      ],
   },

   {
      id:           "brick-grid",
      name:         "Brick",
      category:     "Tiles",
      generator:    "grid",
      spectrum:     0.95,
      nativeFormat: "vector",
      params: [
         { param: "shape",    value: "brick" },
         ...tonesAndColourParams(),
         { param: "tileSize", archetype: "Size", value: 40, map: [10, 120] },
      ],
   },

   {
      id:           "diamond-grid",
      name:         "Diamond",
      category:     "Tiles",
      generator:    "grid",
      spectrum:     0.95,
      nativeFormat: "vector",
      params: [
         { param: "shape",    value: "diamond" },
         ...tonesAndColourParams(),
         { param: "tileSize", archetype: "Size", value: 40, map: [10, 120] },
      ],
   },

   // ── Escher Type I — translation tessellation ──────────────────────────────
   // See docs/generators/escher.md.

   {
      id:           "escher-translation",
      name:         "Translation (Type I)",
      category:     "Escher",
      generator:    "escher",
      spectrum:     0.95,
      nativeFormat: "vector",
      params: [
         { param: "baseShape", control: "select", label: "Base Polygon",
           options: ["square", "hexagon"], value: "square" },
         { param: "bumpType",  control: "select", label: "Edge Shape",
           options: ["wave", "zigzag", "notch"], value: "wave" },
         ...tonesAndColourParams(),
         { param: "tileSize",  archetype: "Size",       value: 60, map: [20, 120] },
         { param: "bumpAmp",   archetype: "Complexity", value: 3,  map: [2, 25]  },
      ],
   },

   // ── Hybrid — stochastic input, deterministic construction ─────────────────

   {
      id:           "voronoi-cells",
      name:         "Voronoi Cells",
      category:     "Voronoi",
      generator:    "voronoi",
      spectrum:     0.45,
      nativeFormat: "vector",
      params: [
         { param: "numCells", archetype: "Density", value: 20, map: [5, 80] },
         ...tonesAndColourParams(),
         { param: "seed",     archetype: "Seed",    value: 1337 },
      ],
      actions: [{ label: "Randomize Seed", method: "randomize" }],
   },

   // ── Islamic Geometric Patterns — deterministic radial symmetry ────────────
   // See docs/generators/islamic.md.

   {
      id:           "islamic-rosette",
      name:         "Islamic Rosette",
      category:     "Islamic",
      generator:    "islamic",
      spectrum:     0.95,
      nativeFormat: "vector",
      params: [
         { param: "tileShape", control: "select", label: "Tile Shape",
           options: ["square", "hexagon"], value: "square" },
         ...tonesAndColourParams(),
         { param: "tileSize",  archetype: "Size",       value: 100, map: [40, 200] },
         { param: "scale",     archetype: "Size",       value: 0.42, map: [0.2, 0.48] },
         { param: "segments",  archetype: "Complexity", value: 8,   map: [3, 16]   },
         { param: "frequency", archetype: "Detail",     value: 3,    map: [1, 6] },
         { param: "lineWidth", archetype: "Threshold",  value: 0.06, map: [0.01, 0.15] },
         // Snapped internally to 180/segments, which is exactly half the
         // shape's own 360/segments rotational period — so, regardless of
         // segments, there are only ever 2 distinct snapped appearances
         // (0 and 180/segments) — see docs/design/PATTERN_REGISTRY_NOTES.md.
         { param: "rotation",  control: "toggle", label: "Rotation",
           onLabel: "Flipped", offLabel: "Not flipped",
           onValue: (p) => 180 / Math.max(3, Math.round(p.segments ?? 8)), value: 0 },
      ],
   },

   // ── Fractal — highly deterministic ────────────────────────────────────────

   {
      id:           "sierpinski",
      name:         "Sierpinski Carpet",
      category:     "Fractal",
      generator:    "recursive",
      spectrum:     0.95,
      nativeFormat: "vector",
      params: [
         { param: "mode",         value: "sierpinski" },
         // Classic carpet uses 3, but the construction generalises to any
         // subdivisions >= 2 (see recursive.js), so it's exposed rather than fixed.
         { param: "subdivisions", archetype: "Detail", value: 3, map: [2, 6] },
         // firstOccurrenceOnly: see docs/design/PATTERN_REGISTRY_NOTES.md.
         { param: "depth",        archetype: "Complexity", value: 4, map: [1, 6], firstOccurrenceOnly: true },
         ...twoColourParams(),
      ],
   },

   {
      id:           "recursive-grid",
      name:         "Recursive Grid",
      category:     "Fractal",
      generator:    "recursive",
      spectrum:     0.90,
      nativeFormat: "vector",
      params: [
         { param: "mode",         value: "grid" },
         // firstOccurrenceOnly: see docs/design/PATTERN_REGISTRY_NOTES.md.
         { param: "depth",        archetype: "Complexity", value: 3, map: [1, 6], firstOccurrenceOnly: true },
         { param: "subdivisions", archetype: "Detail",     value: 4, map: [2, 9] },
         ...twoColourParams(),
      ],
   },

   // ── Hybrid — stochastic/deterministic composition ─────────────────────────
   // See docs/generators/recursive-noise.md.

   {
      id:           "perlin-sierpinski",
      name:         "Perlin Sierpinski",
      category:     "Hybrid",
      generator:    "recursiveNoise",
      spectrum:     0.5,
      nativeFormat: "raster",
      params: [
         // firstOccurrenceOnly: see docs/design/PATTERN_REGISTRY_NOTES.md — depth
         // and seed are single shared values, so editing them from a later
         // Noise/Subdivide node would silently rewrite the whole pattern;
         // they're shown (and only editable) on the first occurrence, with
         // an explanatory note on the rest.
         //
         // amplitudeN/scaleN/octavesN are the opposite: recursiveNoise.js
         // reads each level's own warp strength *and* texture independently
         // (N for level N - 1), so each is its own free control, pinned via
         // `occurrenceOnly` to exactly the one Noise node it belongs to —
         // the *1 params only show on Noise (1/D), *2 only on Noise (2/D),
         // and so on. `visibleIf` hides a level beyond the current `depth`
         // (same reasoning as tones-gated colour3..colour5 above), since it
         // has no Noise node to attach to at all.
         { param: "depth", archetype: "Complexity", value: 4, map: [1, 6], firstOccurrenceOnly: true },

         { param: "amplitude1", archetype: "Randomness (Level 1)", value: 0,    map: [0, 0.5],      occurrenceOnly: 1 },
         { param: "scale1",     archetype: "Density (Level 1)",    value: 0.01, map: [0.001, 0.05], occurrenceOnly: 1 },
         { param: "octaves1",   archetype: "Detail (Level 1)",     value: 2,    map: [1, 8],         occurrenceOnly: 1 },

         { param: "amplitude2", archetype: "Randomness (Level 2)", value: 0,    map: [0, 0.5],      occurrenceOnly: 2, visibleIf: (p) => Number(p.depth) >= 2 },
         { param: "scale2",     archetype: "Density (Level 2)",    value: 0.01, map: [0.001, 0.05], occurrenceOnly: 2, visibleIf: (p) => Number(p.depth) >= 2 },
         { param: "octaves2",   archetype: "Detail (Level 2)",     value: 2,    map: [1, 8],         occurrenceOnly: 2, visibleIf: (p) => Number(p.depth) >= 2 },

         { param: "amplitude3", archetype: "Randomness (Level 3)", value: 0,    map: [0, 0.5],      occurrenceOnly: 3, visibleIf: (p) => Number(p.depth) >= 3 },
         { param: "scale3",     archetype: "Density (Level 3)",    value: 0.01, map: [0.001, 0.05], occurrenceOnly: 3, visibleIf: (p) => Number(p.depth) >= 3 },
         { param: "octaves3",   archetype: "Detail (Level 3)",     value: 2,    map: [1, 8],         occurrenceOnly: 3, visibleIf: (p) => Number(p.depth) >= 3 },

         { param: "amplitude4", archetype: "Randomness (Level 4)", value: 0,    map: [0, 0.5],      occurrenceOnly: 4, visibleIf: (p) => Number(p.depth) >= 4 },
         { param: "scale4",     archetype: "Density (Level 4)",    value: 0.01, map: [0.001, 0.05], occurrenceOnly: 4, visibleIf: (p) => Number(p.depth) >= 4 },
         { param: "octaves4",   archetype: "Detail (Level 4)",     value: 2,    map: [1, 8],         occurrenceOnly: 4, visibleIf: (p) => Number(p.depth) >= 4 },

         { param: "amplitude5", archetype: "Randomness (Level 5)", value: 0,    map: [0, 0.5],      occurrenceOnly: 5, visibleIf: (p) => Number(p.depth) >= 5 },
         { param: "scale5",     archetype: "Density (Level 5)",    value: 0.01, map: [0.001, 0.05], occurrenceOnly: 5, visibleIf: (p) => Number(p.depth) >= 5 },
         { param: "octaves5",   archetype: "Detail (Level 5)",     value: 2,    map: [1, 8],         occurrenceOnly: 5, visibleIf: (p) => Number(p.depth) >= 5 },

         { param: "amplitude6", archetype: "Randomness (Level 6)", value: 0,    map: [0, 0.5],      occurrenceOnly: 6, visibleIf: (p) => Number(p.depth) >= 6 },
         { param: "scale6",     archetype: "Density (Level 6)",    value: 0.01, map: [0.001, 0.05], occurrenceOnly: 6, visibleIf: (p) => Number(p.depth) >= 6 },
         { param: "octaves6",   archetype: "Detail (Level 6)",     value: 2,    map: [1, 8],         occurrenceOnly: 6, visibleIf: (p) => Number(p.depth) >= 6 },
         ...twoColourParams(),
         { param: "seed",      archetype: "Seed",        value: 1337, firstOccurrenceOnly: true },
      ],
      actions: [{ label: "Randomize Seed", method: "randomize" }],
   },

   // ── Hybrid — Voronoi-seeded Islamic tiling ─────────────────────────────────
   // See docs/generators/voronoi-islamic.md.

   {
      id:           "voronoi-islamic",
      name:         "Voronoi Islamic",
      category:     "Hybrid",
      generator:    "voronoiIslamic",
      spectrum:     0.55,
      nativeFormat: "raster",
      params: [
         { param: "numCells",  archetype: "Density",    value: 15,   map: [5, 80]   },
         // Colour block placed right after the first param, before the rest
         // of this entry's archetype sliders — same position as every other
         // tones-based pattern (e.g. islamic-rosette above), so the Colour
         // Mapping node's control order stays consistent across patterns.
         // render.js's mapColour() now blends across however many colourN
         // stops `tones` declares, so 3-5 tones here map to real distinct
         // colours, not just a finer 2-colour gradient.
         ...tonesAndColourParams(),
         { param: "segments",  archetype: "Complexity", value: 7,    map: [3, 16]   },
         { param: "scale",     archetype: "Size",       value: 0.35, map: [0.2, 0.48] },
         { param: "frequency", archetype: "Detail",     value: 2,    map: [1, 6]    },
         { param: "lineWidth", archetype: "Threshold",  value: 0.05, map: [0.01, 0.15] },
         // Reused from islamic.js's construction, held uniform across cells
         // by default — see docs/design/PATTERN_REGISTRY_NOTES.md. Only 2 distinct
         // snapped appearances regardless of segments (see islamic-rosette's
         // own rotation param above).
         { param: "rotation",  control: "toggle", label: "Rotation",
           onLabel: "Flipped", offLabel: "Not flipped",
           onValue: (p) => 180 / Math.max(3, Math.round(p.segments ?? 8)), value: 0 },
         // Opt-in per-cell divergence from the base segments/rotation above —
         // see docs/design/PATTERN_REGISTRY_NOTES.md.
         { param: "variation", archetype: "Randomness", value: 0,   map: [0, 1] },
         { param: "seed",      archetype: "Seed",       value: 1337 },
      ],
      actions: [{ label: "Randomize Seed", method: "randomize" }],
   },

   // ── Hybrid — Voronoi-seeded Islamic tiling v2 (minimal cell-lookup swap) ──
   // See docs/generators/voronoi-islamic-v2.md and voronoiIslamicV2.js's own
   // header. Reuses islamic-rosette's own tileSize/scale/segments/frequency/
   // lineWidth/rotation params unchanged — everything downstream of cell
   // lookup is islamic.js's construction, unmodified, so its own params
   // still mean exactly what they mean there. `numCells` is a plain
   // Poisson-process scatter (voronoi.js/voronoiIslamic.js's own
   // generateSeedPoints, not any grid-constrained placement) — how many
   // medallions there are, not how big any one of them is (that's
   // tileSize, unchanged from islamic.js: tileSize * scale).

   {
      id:           "voronoi-islamic-v2",
      name:         "Voronoi Islamic (Improved)",
      category:     "Hybrid",
      generator:    "voronoiIslamicV2",
      spectrum:     0.6,
      nativeFormat: "raster",
      params: [
         { param: "numCells",  archetype: "Density",    value: 15,   map: [5, 80]   },
         ...tonesAndColourParams(),
         { param: "tileSize",  archetype: "Size",       value: 100, map: [40, 200] },
         { param: "scale",     archetype: "Size",       value: 0.42, map: [0.2, 0.48] },
         { param: "segments",  archetype: "Complexity", value: 8,   map: [3, 16]   },
         { param: "frequency", archetype: "Detail",     value: 3,    map: [1, 6] },
         { param: "lineWidth", archetype: "Threshold",  value: 0.06, map: [0.01, 0.15] },
         { param: "rotation",  control: "toggle", label: "Rotation",
           onLabel: "Flipped", offLabel: "Not flipped",
           onValue: (p) => 180 / Math.max(3, Math.round(p.segments ?? 8)), value: 0 },
         // Independent of Rotation above, not exclusive with it — see
         // voronoiIslamicV2.js's own header comment. Off: every medallion
         // shares one rotation (Rotation above still applies normally). On:
         // each cell's medallion gets its own independently random
         // rotation, with Rotation's own flip (if also on) applied on top
         // of that per-cell value rather than replaced by it.
         { param: "randomRotation", control: "toggle", label: "Random Rotation",
           onLabel: "Random", offLabel: "Uniform", onValue: () => 1, value: 0 },
         { param: "seed",      archetype: "Seed",       value: 1337 },
      ],
      actions: [{ label: "Randomize Seed", method: "randomize" }],
   },

];
