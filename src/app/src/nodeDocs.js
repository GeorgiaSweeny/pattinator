/*
========================================
NODE DOCUMENTATION
========================================
* Documentation Panel content, one entry per NODE_LIBRARY type (workflows.js)
* plus per-generator overview text (GENERATOR_DOCS) and per-param
* descriptions (PARAM_DOCS/PARAM_DOC_OVERRIDES). `objective` is a one-line
* "why am I looking at this stage" statement, distinct from `purpose` (the
* stage's role within the algorithm).
*/

export const NODE_DOCS = {
   workspace: {
      explanation: "Defines the computational space in which the algorithm operates.",
      purpose:
         "The workspace is not the same as the canvas the learner sees on screen. The workspace is the algorithm's own coordinate space — the \"world\" that seed points, transformations and calculations exist within. The canvas is simply the window through which that world is viewed, much like a camera looking into a scene.",
      objective: "Understand that an algorithm's own coordinate space is distinct from the pixels you eventually see.",
      concepts: ["Abstraction", "Problem Definition", "Spatial Reasoning"],
   },
   seed: {
      explanation: "Initialises the pseudo-random number generator used by stochastic algorithms.",
      purpose:
         "Although the generated values appear random, using the same seed always produces the same sequence. This demonstrates that many procedural systems are deterministic despite appearing unpredictable.",
      objective: "Recognise that \"random-looking\" and \"unpredictable\" aren't the same thing.",
      concepts: ["Randomness", "Determinism", "Reproducibility"],
   },
   seedPoints: {
      explanation:
         "Generates a set of spatial points used as the basis for procedural structures such as Voronoi diagrams.",
      purpose:
         "Creates a distributed set of positions within the workspace. These points act as anchors for further computation such as partitioning, distance calculation, or region generation.",
      objective: "See how a scattering of points, on its own, becomes the seed for later geometric structure.",
      concepts: ["Randomness", "Sampling", "Spatial Reasoning"],
   },
   baseGeometry: {
      explanation: "Creates the initial geometric structure from which the algorithm begins.",
      purpose:
         "Defines the starting shape or structure that later operations transform into more complex patterns. Different algorithms use different forms of base geometry — an Escher tessellation begins with a single square tile, a grid tessellation begins with one of several tile shapes, an Islamic geometric pattern begins with a construction circle.",
      objective: "Identify the simple starting shape every later stage of this algorithm builds on top of.",
      concepts: ["Initialisation", "Abstraction"],
   },
   grid: {
      explanation: "Creates a regular arrangement of positions for subsequent computations.",
      purpose:
         "Divides the workspace into evenly spaced cells. Many procedural algorithms use grids as an organisational structure for placing geometry or sampling values.",
      objective: "See how a regular grid gives every later stage a consistent \"which cell am I in\" answer.",
      concepts: ["Spatial Reasoning", "Pattern Recognition", "Abstraction"],
   },
   constructionCircle: {
      explanation: "Defines a geometric construction framework based on circular symmetry.",
      purpose:
         "Establishes radial structure used in geometric construction systems, particularly Islamic geometric design. It acts as a scaffold for symmetry-based pattern generation.",
      objective: "Understand why a circle, not a square, is the natural scaffold for radially symmetric patterns.",
      concepts: ["Symmetry", "Spatial Reasoning", "Abstraction"],
   },
   radialDivisions: {
      explanation: "Divides a circular structure into equal angular segments.",
      purpose: "Transforms circular symmetry into discrete structural guides used for pattern construction.",
      objective: "See how one number (segment count) controls a pattern's entire rotational symmetry.",
      concepts: ["Symmetry", "Iteration", "Pattern Formation"],
   },
   noise: {
      explanation: "Generates smooth, continuous random values across space.",
      purpose:
         "Produces controlled randomness. Unlike purely random values, neighbouring positions produce similar outputs, allowing natural-looking patterns to emerge.",
      objective: "Distinguish \"random\" from \"smoothly varying random\" and see why the difference matters visually.",
      concepts: ["Randomness", "Emergence", "Parameterisation"],
   },
   distanceField: {
      explanation:
         "Computes a scalar field representing the distance from each point in space to a set of geometric features.",
      purpose:
         "Transforms discrete geometric structures into continuous spatial data. Used to generate smooth transitions between regions and forms the basis of many advanced procedural techniques.",
      objective: "See how measuring distance to a few points turns them into a pattern covering the whole plane.",
      concepts: ["Spatial Reasoning", "Abstraction", "Continuous Representation"],
   },
   latticeIndex: {
      explanation:
         "Assigns a discrete colour-class index to a position within a regular, infinitely repeating tiling.",
      purpose:
         "A tiling of the plane has no finite set of \"seed\" points to search, so each tiling shape has its own closed-form coordinate arithmetic that maps any position directly to which tile it falls in, and which colour class that tile belongs to — a proper colouring of the tiling's adjacency graph, not an arbitrary banding.",
      objective: "Understand why keeping neighbouring tiles differently coloured is itself a small computational problem.",
      concepts: ["Spatial Reasoning", "Pattern Recognition", "Abstraction"],
   },
   waveform: {
      explanation: "Turns a scalar value (a distance, a coordinate) into a periodic value by applying a sine function.",
      purpose:
         "Many patterns are built by first computing some non-repeating scalar value at a point, then folding that value through a periodic function to produce repeating rings, stripes or line work — extracted here as its own reusable stage rather than left as an inline calculation.",
      objective: "See how a single repeating function turns an ever-increasing number into a bounded, cyclic pattern.",
      concepts: ["Transformation", "Parameterisation", "Pattern Formation"],
   },
   subdivide: {
      explanation:
         "Divides a region into a smaller grid of cells and recurses into one, building self-similar structure one level at a time.",
      purpose:
         "Applies the same grid-division rule repeatedly, feeding each level's output back in as the next level's input. This recursive reapplication is what produces fractal, self-similar structures such as the Sierpinski carpet — each level looks like the level above it, just at a smaller scale.",
      objective: "Watch the same simple rule, reapplied, build up visible detail one level at a time.",
      concepts: ["Decomposition", "Iteration", "Recursion", "Pattern Recognition"],
   },
   edgeDeformation: {
      explanation: "Modifies geometry boundaries to create interlocking or organic patterns.",
      purpose: "Adjusts tile or shape boundaries to enable seamless tiling or stylised pattern behaviour.",
      objective: "See how deforming one tile's edge in a matched way is what lets its neighbour still fit perfectly.",
      concepts: ["Transformation", "Pattern Formation", "Constraint Satisfaction"],
   },
   colourMapping: {
      explanation: "Converts computational values into colours.",
      purpose:
         "Transforms numerical outputs into meaningful visual representations. Rather than changing the underlying computation, this stage controls how data is communicated visually.",
      objective: "Separate \"what was computed\" from \"how it's shown\" — the same numbers could be coloured many ways.",
      concepts: ["Representation", "Abstraction"],
   },
   render: {
      explanation: "Converts the computational representation into the final visual output.",
      purpose:
         "The final stage of every algorithm. It transforms the computed geometry or scalar values into an image that can be viewed, explored and exported. Separating rendering from computation reinforces that generating data and displaying it are distinct computational processes.",
      objective: "Recognise the finished image as the last step of a pipeline, not the whole algorithm itself.",
      concepts: ["Representation", "Visualisation", "Abstraction"],
   },
};

// Pattern-level overview text, one entry per `generator` id (fifteen
// registry entries collapse to ten generator values — wave/noise/grid/
// recursive each cover multiple modes/shapes with one shared write-up).
export const GENERATOR_DOCS = {
   wave: {
      explanation:
         "Folds a straight measurement — position or distance — through a repeating sine curve to produce stripes or rings.",
      purpose:
         "Shows how a value that increases forever (a coordinate, a distance) can be turned into one that cycles smoothly and predictably, just by passing it through a periodic function. This is the simplest generator in the spectrum: one measurement, one fold, one output.",
      objective: "See how one fold — a sine curve — produces two very different-looking patterns depending only on what's measured.",
      concepts: ["Transformation", "Parameterisation", "Rule-based generation"],
   },
   noise: {
      explanation:
         "Builds an organic, cloud-like texture out of smoothly blended randomness, layered at increasing detail and decreasing strength.",
      purpose:
         "Demonstrates that \"random\" and \"smoothly varying random\" are genuinely different things, and that the second is what makes procedural textures look natural rather than like static.",
      objective: "Distinguish \"random\" from \"smoothly varying random\" and see why the difference matters visually.",
      concepts: ["Randomness", "Emergence", "Parameterisation"],
   },
   grid: {
      explanation:
         "Repeats one simple shape across the whole canvas with no gaps or overlaps, the same idea behind bathroom tiles or a chessboard.",
      purpose:
         "Shows the simplest possible version of \"which repeating cell is this point in?\" — a question that comes up again in more complex forms elsewhere in this project (Voronoi's nearest-seed search, Islamic geometry's radial cells).",
      objective: "See how a point's position alone, with no search involved, can decide which repeating cell it belongs to.",
      concepts: ["Rule-based generation", "Parameterisation", "Spatial Reasoning"],
   },
   escher: {
      explanation:
         "Deforms a regular tiling's straight edges into a matching wavy or jagged boundary, so neighbouring tiles interlock like jigsaw pieces.",
      purpose:
         "Shows how a small, local change — bending one tile's edges — can turn a plain repeating grid into the interlocking figurative tessellations popularised by M.C. Escher, without designing a whole new tiling from scratch.",
      objective: "See how mirroring one edge deformation across a tile keeps every tile interlocking with no gaps.",
      concepts: ["Transformation", "Rule-based generation", "Symmetry"],
   },
   voronoi: {
      explanation: "Scatters seed points across the canvas, then colours every other point according to whichever seed is nearest.",
      purpose:
         "Shows how a handful of scattered points can partition an entire plane into regions purely by asking \"which point is closest?\" — cell boundaries are never drawn directly, they emerge from the nearest-point rule itself.",
      objective: "See a mosaic of cells emerge from nothing but a \"which point is nearest?\" rule.",
      concepts: ["Spatial Reasoning", "Emergence", "Abstraction"],
   },
   islamic: {
      explanation: "Builds a star medallion by placing points evenly around a circle and connecting each one to another a fixed number of steps away.",
      purpose:
         "Demonstrates that an elaborate, richly decorative pattern can come from a small, fully deterministic geometric rule applied repeatedly — the same family of construction found throughout historic Islamic architecture and art.",
      objective: "See how a fixed \"connect every second point\" rule produces an elaborate star at any number of points.",
      concepts: ["Rule-based generation", "Symmetry", "Procedural Modelling"],
   },
   recursive: {
      explanation:
         "Builds a fractal by splitting a shape into smaller pieces, then applying that exact same rule to each piece again, at a smaller and smaller scale.",
      purpose:
         "Shows self-similarity directly: a structure built from one simple rule, repeated at every scale, that looks statistically like itself when you zoom into any smaller region of it.",
      objective: "See the same simple rule, applied repeatedly at smaller scales, build a structure that looks like itself at every zoom level.",
      concepts: ["Iteration", "Emergence", "Rule-based generation"],
   },
   voronoiIslamic: {
      explanation: "Places an Islamic star medallion inside each cell of an irregular Voronoi mosaic, instead of a regular grid.",
      purpose:
         "Directly tests whether a construction built for a regular, evenly-spaced arrangement of cells still works once the cells themselves stop being regular at all, by swapping the cell source and keeping the star construction unmodified.",
      objective: "See one construction (a star inside a cell) survive a change from regular to irregular cells, with only one new piece of geometry needed.",
      concepts: ["Composition", "Spatial Reasoning", "Emergence"],
   },
   voronoiIslamicV2: {
      explanation: "Places an Islamic star medallion inside each cell of an irregular Voronoi mosaic, using exactly Islamic Rosette's own fixed medallion size rather than adapting it to each cell.",
      purpose:
         "Asks a narrower version of the same question as the original Voronoi-Seeded Islamic Tiling: what does the combination look like if nothing at all downstream of cell placement is adapted — medallions from densely-packed cells are left free to overlap, and gaps are left free to open up in sparse regions, as an honest consequence rather than something smoothed over.",
      objective: "See what happens when a construction built for evenly-spaced cells is dropped unmodified into irregular ones, with no compensating geometry added.",
      concepts: ["Composition", "Spatial Reasoning", "Decomposition"],
   },
   recursiveNoise: {
      explanation: "Perturbs a Sierpinski fractal's construction with Perlin noise, nudging each level's split point by a smooth random offset.",
      purpose:
         "Tests whether a rule-based recursive construction and a noise generator's own randomness can be combined directly, with the randomness woven into every step of the recursion rather than only applied after the fact.",
      objective: "See a rule-based fractal and organic randomness combine, and where their combination is provably identical to the fractal alone.",
      concepts: ["Composition", "Randomness", "Iteration"],
   },
};

// What each registry param does to the rendered pattern, keyed by param
// name — the same name means the same thing for almost every pattern that
// uses it, so one description per name covers every pattern that declares
// it. PARAM_DOC_OVERRIDES below covers the few names that diverge by
// generator (`mode`, `scale`).
const PARAM_DOCS = {
   scale: "Zooms the underlying field in or out — larger values sample it more coarsely, producing bigger, smoother features; smaller values sample it more finely, producing smaller, busier detail.",
   octaves: "How many layered noise samples (each at double the frequency and half the strength of the last) are summed together. 1 gives smooth blobs; higher values add progressively finer detail on top, the same way musical overtones add texture to a fundamental note.",
   lacunarity: "How much the frequency multiplies between successive octaves. Higher values make each added octave's detail noticeably finer-grained than the one before, rather than closely spaced.",
   persistence: "How much each successive octave's contribution shrinks. Higher values let finer octaves stay closer in strength to coarser ones, producing rougher, more textured output; lower values let the coarsest octave dominate, producing smoother output.",
   seed: "Initialises the random number generator. The same seed always reproduces the exact same layout — change it to get a different-looking result with everything else held constant, or use \"Randomize Seed\" to jump to a new one.",
   numCells: "How many seed points are scattered across the canvas. More cells means more, smaller regions; fewer cells means larger, fewer regions.",
   tones: "How many distinct colour classes the pattern is divided into (2-5). Each declared tone gets its own independently editable colour slot below.",
   colour1: "The lightest/background colour slot. Always present, regardless of how many tones are declared.",
   colour2: "The second colour slot — the only other one used when tones = 2 (the default), where it's the pattern's dark/primary colour.",
   colour3: "A third colour slot, only shown and used once tones is set to 3 or more.",
   colour4: "A fourth colour slot, only shown and used once tones is set to 4 or more.",
   colour5: "A fifth colour slot, only shown and used once tones is set to 5.",
   frequency: "How tightly the pattern repeats. Higher values pack more repetitions (stripes, rings, or echo lines) into the same space; lower values stretch each repetition out further.",
   lineWidth: "How thick the traced lines are, as a fraction of the medallion's own radius — independent of frequency, so changing ring spacing doesn't also change line thickness.",
   subdivisions: "How many cells each recursive step divides its region into along each axis (e.g. 3 = a 3x3 grid per level). Higher values create a finer-grained, busier self-similar structure at every recursion depth.",
   depth: "How many times the recursive rule is reapplied to its own output. Each extra level adds one more, smaller-scale layer of self-similar detail — 0 shows the base shape untouched.",
   amplitude1: "How strongly level 1's coordinates are pushed off their exact fractal-lattice position by Perlin noise before subdividing, independent of every other level's own amplitude. 0 reproduces the plain fractal's first level exactly; higher values distort it into an increasingly organic, less regular shape.",
   amplitude2: "Level 2's own independent warp strength, only shown and used once depth is set to 2 or more — has no effect on any other level.",
   amplitude3: "Level 3's own independent warp strength, only shown and used once depth is set to 3 or more — has no effect on any other level.",
   amplitude4: "Level 4's own independent warp strength, only shown and used once depth is set to 4 or more — has no effect on any other level.",
   amplitude5: "Level 5's own independent warp strength, only shown and used once depth is set to 5 or more — has no effect on any other level.",
   amplitude6: "Level 6's own independent warp strength, only shown and used once depth is set to 6 — has no effect on any other level.",
   scale1: "Level 1's own independent noise texture coarseness — larger values sample it more coarsely (bigger, smoother warp features), smaller values more finely (busier warp detail). Independent of every other level's own scale.",
   scale2: "Level 2's own independent noise texture coarseness, only shown and used once depth is set to 2 or more — has no effect on any other level.",
   scale3: "Level 3's own independent noise texture coarseness, only shown and used once depth is set to 3 or more — has no effect on any other level.",
   scale4: "Level 4's own independent noise texture coarseness, only shown and used once depth is set to 4 or more — has no effect on any other level.",
   scale5: "Level 5's own independent noise texture coarseness, only shown and used once depth is set to 5 or more — has no effect on any other level.",
   scale6: "Level 6's own independent noise texture coarseness, only shown and used once depth is set to 6 — has no effect on any other level.",
   octaves1: "Level 1's own independent noise detail — how many layered noise samples are summed for that level's warp. Independent of every other level's own octaves.",
   octaves2: "Level 2's own independent noise detail, only shown and used once depth is set to 2 or more — has no effect on any other level.",
   octaves3: "Level 3's own independent noise detail, only shown and used once depth is set to 3 or more — has no effect on any other level.",
   octaves4: "Level 4's own independent noise detail, only shown and used once depth is set to 4 or more — has no effect on any other level.",
   octaves5: "Level 5's own independent noise detail, only shown and used once depth is set to 5 or more — has no effect on any other level.",
   octaves6: "Level 6's own independent noise detail, only shown and used once depth is set to 6 — has no effect on any other level.",
   rotation: "Turns the medallion about its own centre, snapped to the finest increment that preserves its vertical symmetry. At its default (0) the medallion sits in its original orientation.",
   randomRotation: "Off: every medallion shares the same rotation (Rotation, above, still applies normally). On: each medallion gets its own independently random rotation instead — and if Rotation's own Flipped is also on, that flip is applied on top of each medallion's own random rotation, not replaced by it.",
   segments: "How many-fold rotational symmetry the construction has — e.g. 8 gives an 8-pointed star. Also controls how many radial construction points the downstream geometry is built from.",
   tileSize: "The size, in pixels, of one repeating tile of the pattern. Larger tiles mean fewer, bigger repetitions across the canvas; smaller tiles mean more, smaller repetitions.",
   tileShape: "Which lattice the pattern's tiles are arranged on (square or hexagon) — changes where each tile's centre falls, without changing the motif drawn at each one.",
   shape: "Which of the five regular tilings (square, triangle, hexagon, brick, diamond) covers the plane. Each shape has its own tile geometry and its own colouring rule for keeping adjacent tiles visually distinct.",
   baseShape: "The base polygon each tessellated tile is built from (square or hexagon) before its edges are deformed.",
   bumpType: "The waveform used to deform each tile's edges (wave = smooth sine curve, zigzag = sharp angular teeth, notch = a squared-off step). Opposite tile edges always deform as exact mirror images, so tiles still interlock with no gaps.",
   bumpAmp: "How far each tile's edges bulge away from a straight line. 0 would leave perfectly straight-edged tiles (a plain grid); higher values make the interlocking deformation more pronounced.",
   variation: "How much each cell's own star shape and orientation is independently randomised, rather than staying identical across every cell. 0 keeps every medallion structurally uniform (only cell placement is stochastic); higher values let each cell's point-count and rotation vary too, for a more organic, less repetitive result.",
};

// Per-(generator, param) overrides for the handful of shared names whose
// meaning genuinely diverges by generator, keyed "generator:param". Falls
// back to PARAM_DOCS[param] when no override exists for the current
// generator.
const PARAM_DOC_OVERRIDES = {
   "islamic:scale": "Resizes the medallion within its own tile, as a fraction of the tile's size — capped below half the tile's width so it always stays a self-contained motif with no overlap into neighbouring tiles.",
   "voronoiIslamic:scale": "Resizes each cell's medallion, as a fraction of that specific cell's own distance to its nearest neighbouring seed — so every medallion stays sized appropriately to its own irregular cell rather than one fixed size for every cell.",
   "voronoiIslamicV2:scale": "Exactly Islamic Rosette's own Scale: every medallion uses the same fixed radius (Tile Size × Scale) regardless of its own cell's size, unlike the original Voronoi-Seeded Islamic Tiling's per-cell scaling — so medallions can overlap in dense regions or leave gaps in sparse ones.",
   "noise:mode": "Fixed per pattern: \"standard\" produces smooth rolling hills; \"ridge\" folds the same field through 1 - 2|value| to turn its zero-crossings into sharp connected ridgelines instead.",
   "wave:mode": "Fixed per pattern: \"wave\" applies the sine function directly to the vertical position (horizontal stripes); \"rings\" applies it to distance from the canvas centre instead (concentric rings).",
   "recursive:mode": "Fixed per pattern: \"sierpinski\" excludes each level's centre cell, carving self-similar holes (a carpet); \"grid\" keeps every cell but colours it by accumulated parity across all levels, producing a self-similar checkerboard with no holes.",
};

// Resolves the description to show for one param on one generator —
// looks up the override first, falls back to the generic by-name entry.
export function paramDoc(generator, paramName) {
   return PARAM_DOC_OVERRIDES[`${generator}:${paramName}`] ?? PARAM_DOCS[paramName];
}
