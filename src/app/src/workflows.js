/*
========================================
NODE WORKFLOW DEFINITIONS
========================================
* Builds the ReactFlow {nodes, edges} graph for each pattern: NODE_LIBRARY
* (node types + categories), STEP_DEFS (node sequence per generator),
* PARAM_NODE_MAP (which node a param belongs to), and buildWorkflow itself.
*/

import { REGISTRY } from "../../patternRegistry.js";

// One entry per node type documented in docs/nodes/. `category` drives the
// colour a WorkflowNode renders with (see nodeTypes/WorkflowNode.jsx).
export const NODE_LIBRARY = {
   workspace: { title: "Workspace", category: "environment" },
   seed: { title: "Seed", category: "initialisation" },
   seedPoints: { title: "Seed Points", category: "initialisation" },
   baseGeometry: { title: "Base Geometry", category: "initialisation" },
   grid: { title: "Grid", category: "initialisation" },
   constructionCircle: { title: "Construction Circle", category: "initialisation" },
   radialDivisions: { title: "Radial Divisions", category: "pattern" },
   noise: { title: "Noise", category: "computation" },
   distanceField: { title: "Distance Field", category: "computation" },
   latticeIndex: { title: "Lattice Index", category: "computation" },
   waveform: { title: "Waveform", category: "computation" },
   subdivide: { title: "Subdivide", category: "pattern" },
   edgeDeformation: { title: "Edge Deformation", category: "pattern" },
   colourMapping: { title: "Colour Mapping", category: "presentation" },
   render: { title: "Render", category: "output" },
};

// Node sequence per generator, matching docs/nodes/WORKFLOWS.md exactly.
// `params` is the fixed-default dict built from the selected registry entry.
const STEP_DEFS = {
   noise: () => ["workspace", "seed", "noise", "colourMapping", "render"],
   voronoi: () => ["workspace", "seed", "seedPoints", "distanceField", "colourMapping", "render"],
   escher: () => ["workspace", "baseGeometry", "edgeDeformation", "colourMapping", "render"],
   grid: () => ["workspace", "baseGeometry", "latticeIndex", "colourMapping", "render"],
   wave: (params) =>
      params.mode === "rings"
         ? ["workspace", "distanceField", "waveform", "colourMapping", "render"]
         : ["workspace", "waveform", "colourMapping", "render"],
   recursive: (params) => [
      "workspace",
      "baseGeometry",
      ...Array(Math.max(1, Math.round(params.depth ?? 4))).fill("subdivide"),
      "colourMapping",
      "render",
   ],
   islamic: () => [
      "workspace", "grid", "constructionCircle", "radialDivisions",
      "distanceField", "colourMapping", "render",
   ],
   // Hybrid: Voronoi's opening nodes (Seed, Seed Points) feed into islamic.js's
   // tail (Construction Circle onward) — Grid is dropped since cell
   // membership comes from Distance Field's nearestPoint search instead.
   voronoiIslamic: () => [
      "workspace", "seed", "seedPoints", "constructionCircle", "radialDivisions",
      "distanceField", "colourMapping", "render",
   ],
   // Hybrid v2: same shape as voronoiIslamic above (Seed Points takes over
   // Grid's own job), but nothing downstream of cell lookup changes at all
   // — see voronoiIslamicV2.js's own header.
   voronoiIslamicV2: () => [
      "workspace", "seed", "seedPoints", "constructionCircle", "radialDivisions",
      "distanceField", "colourMapping", "render",
   ],
   // Hybrid: each level's Noise sample warps that level's point before
   // Subdivide runs, so shown as a Noise/Subdivide pair repeated `depth`
   // times, rather than recursive.js's bare Subdivide chain.
   recursiveNoise: (params) => [
      "workspace",
      "baseGeometry",
      ...Array.from({ length: Math.max(1, Math.round(params.depth ?? 4)) }, () => ["noise", "subdivide"]).flat(),
      "colourMapping",
      "render",
   ],
};

// Maps a registry param key to the node type it belongs to. Cross-checked
// against each generator's source (src/generators/*.js).
const PARAM_NODE_MAP = {
   noise: (key) => (key === "seed" ? "seed" : /^colour\d$/.test(key) ? "colourMapping" : "noise"),
   voronoi: (key) =>
      key === "seed" ? "seed"
      : key === "tones" || /^colour\d$/.test(key) ? "colourMapping"
      : "seedPoints",
   escher: (key) =>
      key === "bumpType" || key === "bumpAmp"
         ? "edgeDeformation"
         : key === "tones" || /^colour\d$/.test(key)
         ? "colourMapping"
         : "baseGeometry",
   grid: (key) => (key === "tones" || /^colour\d$/.test(key) ? "colourMapping" : "baseGeometry"),
   wave: (key) => (/^colour\d$/.test(key) ? "colourMapping" : "waveform"),
   recursive: (key) => (/^colour\d$/.test(key) ? "colourMapping" : "subdivide"),
   islamic: (key) => {
      if (key === "segments" || key === "rotation") return "radialDivisions";
      if (key === "frequency" || key === "tones" || key === "lineWidth" || /^colour\d$/.test(key)) {
         return "colourMapping";
      }
      if (key === "scale") return "constructionCircle";
      return "grid"; // tileSize, tileShape
   },
   recursiveNoise: (key) =>
      key === "depth" ? "subdivide" : /^colour\d$/.test(key) ? "colourMapping" : "noise", // amplitude, seed
   voronoiIslamic: (key) => {
      if (key === "seed") return "seed";
      if (key === "numCells") return "seedPoints";
      if (key === "segments" || key === "rotation" || key === "variation") return "radialDivisions";
      if (key === "scale") return "constructionCircle";
      return "colourMapping"; // frequency, lineWidth, tones
   },
   voronoiIslamicV2: (key) => {
      if (key === "seed") return "seed";
      if (key === "numCells") return "seedPoints";
      if (key === "segments" || key === "rotation" || key === "randomRotation") return "radialDivisions";
      // tileSize keeps islamic.js's own role here — the medallion's radius
      // reference (tileSize * scale), not any seed-placement concern — so
      // it belongs with scale, not with Seed Points.
      if (key === "scale" || key === "tileSize") return "constructionCircle";
      return "colourMapping"; // frequency, lineWidth, tones, colourN
   },
};

/**
 * Builds a ReactFlow-shaped {nodes, edges} graph for one patternRegistry.js
 * entry, following the linear sequence documented in docs/nodes/WORKFLOWS.md.
 * Pure and deterministic: same (registryId, liveParams) always produces the
 * same graph. `liveParams` overrides the registry's static defaults — needed
 * because some params change the graph's own shape (e.g. recursive's `depth`
 * controls how many Subdivide nodes appear, wave's `mode` toggles Distance
 * Field in/out), so the graph must react to the same live state the canvas
 * render does (docs/design/UI_DESIGN.md's Synchronised Interaction section).
 */
export function buildWorkflow(registryId, liveParams = {}) {
   const entry = REGISTRY.find((e) => e.id === registryId);
   if (!entry) throw new Error(`Unknown pattern id: ${registryId}`);

   const params = {
      ...Object.fromEntries(entry.params.map((p) => [p.param, p.value])),
      ...liveParams,
   };
   const steps = STEP_DEFS[entry.generator](params);
   const mapParam = PARAM_NODE_MAP[entry.generator];

   const typeTotals = {};
   for (const type of steps) typeTotals[type] = (typeTotals[type] ?? 0) + 1;

   const typeSeen = {};
   const nodes = steps.map((type, index) => {
      typeSeen[type] = (typeSeen[type] ?? 0) + 1;
      const repeats = typeTotals[type];
      const isFirstOfType = typeSeen[type] === 1;
      const matchesType = (p) => mapParam(p.param, params) === type && (!p.visibleIf || p.visibleIf(params));
      // `occurrenceOnly: n` is the opposite of `firstOccurrenceOnly`: a
      // genuinely independent per-repeat control (e.g. recursiveNoise's
      // amplitude1..amplitude6, one per Noise node) that belongs to exactly
      // one occurrence and nowhere else — no explanatory note needed on the
      // others, since editing it there simply isn't possible (it's not
      // their param at all), unlike a firstOccurrenceOnly value shared
      // across every repeat.
      const nodeParams = entry.params.filter(
         (p) =>
            matchesType(p) &&
            (!p.firstOccurrenceOnly || isFirstOfType) &&
            (p.occurrenceOnly === undefined || p.occurrenceOnly === typeSeen[type])
      );
      // A `firstOccurrenceOnly` param that matched but got filtered out here
      // (not the first occurrence) is surfaced as an explanatory note
      // instead of silently having fewer controls than the first node.
      const suppressedParam = !isFirstOfType
         ? entry.params.find((p) => p.firstOccurrenceOnly && matchesType(p))
         : undefined;
      return {
         id: `${type}-${index}`,
         type: "workflow",
         position: { x: index * 220, y: 120 },
         data: {
            nodeType: type,
            label: NODE_LIBRARY[type].title + (repeats > 1 ? ` (${typeSeen[type]}/${repeats})` : ""),
            params: nodeParams,
            structuralNote: suppressedParam
               ? `${suppressedParam.archetype ?? suppressedParam.param} is set on the first ` +
                 `${NODE_LIBRARY[type].title} node — it's one shared value across every ` +
                 `repeat, so editing it here would change every occurrence, not just this step.`
               : undefined,
            // occurrence/totalOccurrences: same typeSeen/repeats counters as
            // the "(1/2)" label, exposed as data — stagePreview.js's
            // recursive/recursiveNoise preview needs to know which repeated
            // Subdivide step this is.
            occurrence: typeSeen[type],
            totalOccurrences: repeats,
            // Stated in words, not only implied by the graph edge. Every
            // node but the first has exactly one predecessor, since `steps`
            // is a linear sequence, not a general graph.
            dependsOnLabel: index > 0 ? NODE_LIBRARY[steps[index - 1]].title : undefined,
         },
      };
   });

   const edges = nodes.slice(1).map((node, i) => ({
      id: `e-${nodes[i].id}-${node.id}`,
      source: nodes[i].id,
      target: node.id,
   }));

   return { nodes, edges };
}
