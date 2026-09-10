import { REGISTRY } from "../../../patternRegistry.js";

/*
========================================
COMPUTATIONAL-THINKING QUIZ CONTENT
========================================
* Question bank for the evaluation instrument: single-group pre/post design,
* one bank administered twice. Covers the project's nine CT-concept
* Educational Objectives plus sequence/stage-role questions grounded in
* docs/nodes/WORKFLOWS.md. Every question has 5 options in a fixed
* distractor structure (1 correct, 1 easy-eliminate, 1 near-miss, 2 mid).
* Study 1 items are `type: "mc"` (implicit default); Study 2 adds
* image-bearing types ("cause", "predict", "concept-match", "spectrum",
* "node-select") whose images render live via quizPatterns.js + PatternCanvas
* rather than pre-rendered files. See docs/design/APP_IMPLEMENTATION_NOTES.md for
* full methodology and per-type detail.
*/

// Mirrors SpectrumBar.jsx's SPECTRUM_LABELS (values only) so a "spectrum"
// item's options can't drift from what the app's own bar shows.
export const SPECTRUM_OPTIONS = [
   "Predominantly stochastic",
   "Mostly stochastic",
   "Hybrid",
   "Mostly deterministic",
   "Highly deterministic",
];

// Bin thresholds mirror SpectrumBar.jsx's SPECTRUM_LABELS (same order as
// SPECTRUM_OPTIONS above).
const SPECTRUM_BIN_MAX = [0.2, 0.4, 0.6, 0.8, 1.01];

function spectrumCorrectIndex(spectrumValue) {
   return SPECTRUM_BIN_MAX.findIndex((max) => spectrumValue < max);
}

function spectrumValue(entryId) {
   return REGISTRY.find((e) => e.id === entryId).spectrum;
}

// Study 1's 16-item instrument. Kept as its own export (not folded into
// Study 2's below) since the two are separate instruments for separate
// cohorts — App.jsx's "Test 1" menu uses this; "Test 2" uses STUDY2_QUESTIONS.
export const STUDY1_QUESTIONS = [
   {
      id: "randomness",
      concept: "Randomness",
      prompt: "Two runs of a stochastic pattern generator use the exact same seed value. What happens?",
      options: [
         "No pattern is produced at all",
         "The identical pattern both times",
         "A completely different pattern each time",
         "A similar but not identical pattern",
         "The same pattern, but reflected horizontally",
      ],
      correctIndex: 1,
   },
   {
      id: "iteration",
      concept: "Iteration",
      prompt: "A fractal pattern like a Sierpinski carpet is built by...",
      options: [
         "Drawing the whole shape in one step",
         "Applying a different subdivision rule at each smaller scale",
         "Applying the same subdivision rule repeatedly, at a smaller scale each time",
         "Randomly placing triangles until it looks right",
         "Tracing a single continuous line without lifting the pen",
      ],
      correctIndex: 2,
   },
   {
      id: "transformation",
      concept: "Transformation",
      prompt: "In a tessellation generator, an \"edge deformation\" step...",
      options: [
         "Changes which colour a tile is filled with",
         "Modifies a tile's boundary shape so it interlocks with its neighbour",
         "Deletes a tile from the pattern",
         "Changes a tile's size while keeping its shape exactly the same",
         "Rotates the entire canvas by a fixed angle",
      ],
      correctIndex: 1,
   },
   {
      id: "symmetry",
      concept: "Symmetry",
      prompt: "A pattern with 8-fold rotational symmetry looks unchanged after being rotated by...",
      options: ["8 degrees", "45 degrees", "90 degrees", "60 degrees", "180 degrees"],
      correctIndex: 1,
   },
   {
      id: "rule-based-generation",
      concept: "Rule-based generation",
      prompt: "A procedural pattern generator produces its output by...",
      options: [
         "Displaying a pre-made image file",
         "Applying a fixed set of computational rules to compute the image",
         "Applying a set of computational rules that are chosen randomly at each run",
         "Selecting one of several pre-designed templates",
         "Letting the user draw freehand",
      ],
      correctIndex: 1,
   },
   {
      id: "parameterisation",
      concept: "Parameterisation",
      prompt: "Increasing a generator's \"frequency\" parameter typically affects...",
      options: [
         "Which colours are used",
         "How tightly the pattern repeats across the canvas",
         "Whether the pattern is symmetric at all",
         "How large the overall canvas is",
         "The exported file format",
      ],
      correctIndex: 1,
   },
   {
      id: "emergence",
      concept: "Emergence",
      prompt: "In Perlin noise, complex, organic-looking patterns emerge from...",
      options: [
         "A single random pixel value",
         "Many simple, smoothly-varying random samples combined together",
         "A single complex mathematical formula solved exactly",
         "A hand-drawn texture file",
         "A lookup table of photographs",
      ],
      correctIndex: 1,
   },
   {
      id: "procedural-modelling",
      concept: "Procedural modelling",
      prompt: "The main advantage of a procedural (rule-based) model over a single fixed image is that it can...",
      options: [
         "Only ever be viewed once",
         "Be regenerated at any size or parameter setting from the same rules",
         "Be resized without loss of quality, the same as a vector image",
         "Never be changed once created",
         "Only work for three-dimensional shapes",
      ],
      correctIndex: 1,
   },
   {
      id: "computational-creativity",
      concept: "Computational creativity",
      prompt: "A computer following fixed rules to produce a visually novel pattern is an example of...",
      options: [
         "Computational creativity",
         "Pure random chance",
         "Plagiarism",
         "Manual design",
         "An unintended bug in the program",
      ],
      correctIndex: 0,
   },
   {
      id: "stochastic-vs-deterministic",
      concept: "Randomness",
      prompt: "A generator is described as \"deterministic\" if...",
      options: [
         "It always produces a different result",
         "The same input parameters always produce exactly the same output",
         "It uses a random number generator internally",
         "It runs faster than a stochastic generator",
         "It cannot be automatically tested",
      ],
      correctIndex: 1,
   },
   {
      id: "node-concept",
      concept: "Rule-based generation",
      prompt: "In this application, a \"node\" in the algorithm workflow represents...",
      options: [
         "A single line of source code",
         "A meaningful computational stage within the algorithm",
         "A colour value",
         "A user-adjustable setting, like a slider",
         "An error message",
      ],
      correctIndex: 1,
   },
   {
      id: "hybrid-concept",
      concept: "Emergence",
      prompt: "A \"hybrid\" generator in this application combines...",
      options: [
         "Two unrelated applications",
         "A stochastic and a deterministic technique in one pipeline",
         "Two different randomness techniques in one pipeline",
         "Two different programming languages",
         "User accounts from two different systems",
      ],
      correctIndex: 1,
   },
   {
      id: "workflow-sequence",
      concept: "Sequence of operations",
      prompt: "In this application's Perlin Noise workflow, what is the correct order of stages?",
      options: [
         "Noise → Seed → Colour Mapping → Render",
         "Seed → Noise → Colour Mapping → Render",
         "Colour Mapping → Seed → Noise → Render",
         "Seed → Colour Mapping → Noise → Render",
         "Seed → Noise → Render → Colour Mapping",
      ],
      correctIndex: 1,
   },
   {
      id: "seed-stage-role",
      concept: "Stage role",
      prompt: "In the Perlin Noise workflow, what does the Seed stage actually do?",
      options: [
         "Chooses the final colour palette",
         "Initialises the pseudo-random permutation table the noise function samples from",
         "Generates the random noise values used by the pattern",
         "Smooths the finished image",
         "Counts how many octaves to render",
      ],
      correctIndex: 1,
   },
   {
      id: "lattice-index-role",
      concept: "Stage role",
      prompt: "In the Grid Tessellation workflow, the Lattice Index stage's job is to...",
      options: [
         "Assign each position a discrete colour-class index within the repeating tiling",
         "Pick which colours are used",
         "Rotate the whole canvas by a fixed angle",
         "Determine the overall size of each tile",
         "Export the final image file",
      ],
      correctIndex: 0,
   },
   {
      id: "rings-mode-stage",
      concept: "Parameterisation",
      prompt: "Switching the Wave generator from \"wave\" mode to \"rings\" mode adds which stage to its workflow?",
      options: [
         "Edge Deformation",
         "Distance Field",
         "Lattice Index",
         "Base Geometry",
         "Seed",
      ],
      correctIndex: 1,
   },
];

// Okabe & Ito's (2008) colorblind-safe palette, each pair kept at a strong
// lightness gap so images stay distinguishable under any colour vision
// deficiency. Applied identically to every image within one question, so a
// colour difference never masquerades as the actual change being tested.
const COLORWAYS = {
   amber:  { colour1: "#FDF6E3", colour2: "#E69F00" },
   teal:   { colour1: "#FDF6E3", colour2: "#009E73" },
   blue:   { colour1: "#FDF6E3", colour2: "#0072B2" },
   purple: { colour1: "#FDF6E3", colour2: "#CC79A7" },
   dark:   { colour1: "#F0E442", colour2: "#111111" },
};

// 4-tone extensions of two colourways above, for "predict" distractors that
// also change the tone count — stays inside the same Okabe-Ito set.
const FOUR_TONE_TEAL = { colour1: "#FDF6E3", colour2: "#009E73", colour3: "#E69F00", colour4: "#111111" };
const FOUR_TONE_PURPLE = { colour1: "#FDF6E3", colour2: "#CC79A7", colour3: "#0072B2", colour4: "#111111" };

// Study 2's instrument — diagnoses gaps Study 1's text-only "mc" format
// couldn't reach: compositional reasoning, visual/interactive items, and
// cross-format triangulation. See the file header for what each `type`
// renders and how it's scored.
export const STUDY2_QUESTIONS = [

   // ── "cause" — image pair, which change produced Image 2? ──────────────

   {
      id: "wave-frequency-cause",
      concept: "Parameterisation",
      type: "cause",
      entryId: "wave-stripes",
      paramsBefore: { frequency: 0.02, ...COLORWAYS.amber },
      paramsAfter: { frequency: 0.12, ...COLORWAYS.amber },
      prompt: "Image 1 and Image 2 both show Wave Stripes. Image 2's stripes repeat much more tightly across the canvas. Which parameter change most likely caused this?",
      options: [
         "Frequency was increased",
         "The colour palette was changed",
         "The canvas was resized",
         "Frequency was decreased",
         "Mode was switched from \"wave\" to \"rings\"",
      ],
      correctIndex: 0,
   },
   {
      id: "noise-mode-cause",
      concept: "Transformation",
      type: "cause",
      entryId: "perlin-noise",
      paramsBefore: { mode: "standard", ...COLORWAYS.blue },
      paramsAfter: { mode: "ridge", ...COLORWAYS.blue },
      prompt: "Image 1 and Image 2 use the same Noise generator. Image 1's values fade smoothly; Image 2 shows sharp, vein-like ridges instead. Which change most likely caused this?",
      options: [
         "The Noise mode was switched from \"standard\" to \"ridge\"",
         "A different seed was used",
         "Octaves were increased",
         "Scale was decreased",
         "Persistence was increased",
      ],
      correctIndex: 0,
   },
   {
      id: "escher-edge-deformation-cause",
      concept: "Transformation",
      type: "cause",
      entryId: "escher-translation",
      paramsBefore: { bumpAmp: 3, ...COLORWAYS.blue },
      paramsAfter: { bumpAmp: 20, ...COLORWAYS.blue },
      prompt: "Image 1 and Image 2 both show the Escher Type I tessellation. Image 2's tile edges are far more jagged and pronounced. Which change most likely caused this?",
      options: [
         "Edge Deformation amplitude was increased",
         "Base Polygon was changed",
         "Tile Size was changed",
         "Edge Deformation amplitude was decreased",
         "Edge Shape was switched from \"wave\" to \"notch\"",
      ],
      correctIndex: 0,
   },

   // ── "predict" — starting image + stated change, select the real result ─

   {
      id: "grid-hexagon-predict",
      concept: "Transformation",
      type: "predict",
      entryId: "square-grid",
      startOverrides: { ...COLORWAYS.teal },
      prompt: "Image 1 shows the starting pattern below. Given the stated change, which of the following is the correct result?",
      changeDescription: "Base Geometry changed from square to hexagon. Nothing else changed.",
      candidates: [
         { overrides: { shape: "hexagon", ...COLORWAYS.teal } },
         { overrides: { shape: "hexagon", tones: "4", ...FOUR_TONE_TEAL } },
         { overrides: { shape: "hexagon", tileSize: 80, ...COLORWAYS.teal } },
         { overrides: { shape: "triangle", ...COLORWAYS.teal } },
         { overrides: { ...COLORWAYS.teal } },
      ],
      correctIndex: 0,
   },
   {
      id: "islamic-segments-predict",
      concept: "Parameterisation",
      type: "predict",
      entryId: "islamic-rosette",
      startOverrides: { ...COLORWAYS.purple },
      prompt: "Image 1 shows the starting pattern below. Given the stated change, which of the following is the correct result?",
      changeDescription: "Segments increased from 8 to 12. Nothing else changed.",
      candidates: [
         { overrides: { segments: 12, ...COLORWAYS.purple } },
         { overrides: { segments: 12, rotation: 45, ...COLORWAYS.purple } },
         { overrides: { segments: 12, tones: "4", ...FOUR_TONE_PURPLE } },
         { overrides: { segments: 4, ...COLORWAYS.purple } },
         { overrides: { ...COLORWAYS.purple } },
      ],
      correctIndex: 0,
   },
   {
      id: "perlin-sierpinski-amplitude-predict",
      concept: "Procedural modelling",
      type: "predict",
      entryId: "perlin-sierpinski",
      // recursiveNoise.js gives every level its own independent amplitude
      // (amplitude1..amplitude6, one per Noise node) rather than one shared
      // value — this item asks about raising all of them together (a
      // uniform, pattern-wide warp increase), the closest equivalent to the
      // old single-amplitude concept, at the registry's default depth (4
      // levels, so amplitude1..amplitude4).
      startOverrides: { amplitude1: 0, amplitude2: 0, amplitude3: 0, amplitude4: 0, ...COLORWAYS.purple },
      prompt: "Image 1 shows the starting pattern below. Given the stated change, which of the following is the correct result?",
      changeDescription: "Amplitude increased from 0 to 0.4 at every level. Nothing else changed.",
      candidates: [
         { overrides: { amplitude1: 0.4, amplitude2: 0.4, amplitude3: 0.4, amplitude4: 0.4, ...COLORWAYS.purple } },
         { overrides: { depth: 6, ...COLORWAYS.purple } },
         { overrides: { scale: 0.03, ...COLORWAYS.purple } },
         { overrides: { octaves: 6, ...COLORWAYS.purple } },
         { overrides: { amplitude1: 0, amplitude2: 0, amplitude3: 0, amplitude4: 0, ...COLORWAYS.purple } },
      ],
      correctIndex: 0,
   },

   // ── "concept-match" — which pattern best demonstrates this concept? ────

   {
      id: "randomness-concept-match",
      concept: "Randomness",
      type: "concept-match",
      prompt: "Which pattern below best demonstrates Randomness?",
      candidates: [
         { entryId: "perlin-noise", overrides: { ...COLORWAYS.dark } },
         { entryId: "square-grid", overrides: { ...COLORWAYS.blue } },
         { entryId: "islamic-rosette", overrides: { ...COLORWAYS.amber } },
         { entryId: "sierpinski", overrides: { ...COLORWAYS.teal } },
      ],
      correctIndex: 0,
   },
   {
      id: "symmetry-concept-match",
      concept: "Symmetry",
      type: "concept-match",
      prompt: "Which pattern below best demonstrates rotational Symmetry?",
      candidates: [
         { entryId: "islamic-rosette", overrides: { ...COLORWAYS.purple } },
         { entryId: "perlin-noise", overrides: { ...COLORWAYS.dark } },
         { entryId: "wave-stripes", overrides: { ...COLORWAYS.amber } },
         { entryId: "voronoi-cells", overrides: { ...COLORWAYS.blue } },
      ],
      correctIndex: 0,
   },
   {
      id: "iteration-concept-match",
      concept: "Iteration",
      type: "concept-match",
      prompt: "Which pattern below best demonstrates Iteration (the same rule applied repeatedly at a smaller scale)?",
      candidates: [
         { entryId: "sierpinski", overrides: { ...COLORWAYS.teal } },
         { entryId: "hex-grid", overrides: { ...COLORWAYS.purple } },
         { entryId: "perlin-noise", overrides: { ...COLORWAYS.dark } },
         { entryId: "voronoi-cells", overrides: { ...COLORWAYS.amber } },
      ],
      correctIndex: 0,
   },

   // ── "spectrum" — where does this pattern sit, stochastic <-> deterministic?

   {
      id: "noise-spectrum",
      concept: "Randomness",
      type: "spectrum",
      entryId: "perlin-noise",
      overrides: { ...COLORWAYS.dark },
      prompt: "Where does this pattern lie on the stochastic ↔ deterministic scale?",
      options: SPECTRUM_OPTIONS,
      correctIndex: spectrumCorrectIndex(spectrumValue("perlin-noise")),
   },
   {
      id: "grid-spectrum",
      concept: "Rule-based generation",
      type: "spectrum",
      entryId: "square-grid",
      overrides: { ...COLORWAYS.blue },
      prompt: "Where does this pattern lie on the stochastic ↔ deterministic scale?",
      options: SPECTRUM_OPTIONS,
      correctIndex: spectrumCorrectIndex(spectrumValue("square-grid")),
   },
   {
      id: "voronoi-spectrum",
      concept: "Emergence",
      type: "spectrum",
      entryId: "voronoi-cells",
      overrides: { ...COLORWAYS.teal },
      prompt: "This pattern starts from randomly scattered points, then applies a fixed distance-field rule to every pixel. Where does it lie on the stochastic ↔ deterministic scale?",
      options: SPECTRUM_OPTIONS,
      correctIndex: spectrumCorrectIndex(spectrumValue("voronoi-cells")),
   },
   {
      id: "voronoi-islamic-spectrum",
      concept: "Emergence",
      type: "spectrum",
      entryId: "voronoi-islamic",
      overrides: { ...COLORWAYS.amber },
      prompt: "This pattern seeds its cell centres randomly (like Voronoi), then builds a fixed rosette construction at each one (like Islamic Geometric Patterns). Where does it lie on the stochastic ↔ deterministic scale?",
      options: SPECTRUM_OPTIONS,
      correctIndex: spectrumCorrectIndex(spectrumValue("voronoi-islamic")),
   },

   // ── "node-select" — which nodes are required to build this pattern? ────

   {
      id: "voronoi-required-nodes",
      concept: "Stage role",
      type: "node-select",
      entryId: "voronoi-cells",
      overrides: { ...COLORWAYS.purple },
      prompt: "Which of the following nodes are actually required to build this pattern? Select all that apply.",
      nodeOptions: ["Seed", "Seed Points", "Distance Field", "Colour Mapping", "Edge Deformation", "Lattice Index"],
      correctNodeSet: ["Seed", "Seed Points", "Distance Field", "Colour Mapping"],
   },
   {
      id: "grid-required-nodes",
      concept: "Stage role",
      type: "node-select",
      entryId: "triangle-grid",
      overrides: { ...COLORWAYS.dark },
      prompt: "Which of the following nodes are actually required to build this pattern? Select all that apply.",
      nodeOptions: ["Base Geometry", "Lattice Index", "Colour Mapping", "Seed", "Distance Field", "Edge Deformation"],
      correctNodeSet: ["Base Geometry", "Lattice Index", "Colour Mapping"],
   },
   {
      id: "voronoi-islamic-required-nodes",
      concept: "Stage role",
      type: "node-select",
      entryId: "voronoi-islamic",
      overrides: { ...COLORWAYS.teal },
      prompt: "Which of the following nodes are actually required to build this hybrid pattern? Select all that apply.",
      nodeOptions: [
         "Seed", "Seed Points", "Construction Circle", "Radial Divisions",
         "Distance Field", "Colour Mapping", "Edge Deformation", "Lattice Index",
      ],
      correctNodeSet: ["Seed", "Seed Points", "Construction Circle", "Radial Divisions", "Distance Field", "Colour Mapping"],
   },

   // ── "order" — put this generator's real stages in the correct sequence ─

   {
      id: "islamic-sequence-order",
      concept: "Sequence of operations",
      type: "order",
      entryId: "islamic-rosette",
      overrides: { ...COLORWAYS.amber },
      prompt: "Put this pattern's real computational stages in the order they actually run, earliest first.",
      nodeSequence: ["Colour Mapping", "Radial Divisions", "Grid", "Distance Field", "Construction Circle"],
      correctSequence: ["Grid", "Construction Circle", "Radial Divisions", "Distance Field", "Colour Mapping"],
   },
];
