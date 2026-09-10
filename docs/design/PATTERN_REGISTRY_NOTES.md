# Pattern Registry — Implementation Notes

Implementation-level rationale for `src/patternRegistry.js` that has no home in
`docs/generators/*.md` (those cover generator concepts/maths, not registry
plumbing). See `patternRegistry.js`'s own header for the entry shape.

## `tonesAndColourParams()`

Shared `tones` + `colour1`..`colour5` param block for every vector generator
whose renderer reads discrete tone-indexed colours via
`lib/colourMapping.js`'s `toneSet`/`svgFillsFor` (voronoi, grid, escher,
islamic). `colourN` only shows once `tones` declares that many; defaults are
a monotonic white-to-black ramp so every tones count still renders greyscale
until a user picks otherwise. Centralised here so every such pattern exposes
the same six-param block instead of each entry hand-copying (and drifting
from) it.

## `twoColourParams()`

`colour1` (light, value = +1) + `colour2` (dark, value = -1) for patterns
whose output is inherently two-valued or a continuous gradient rather than a
declared `tones` count: raster patterns with no SVG renderer (read by
`render.js`'s `mapColour`), and vector patterns with no `tones` concept
(Wave Stripes, Concentric Rings — continuous sine; Sierpinski Carpet,
Recursive Grid — binary filled/empty), read directly by their own SVG
renderer.

## Category ordering

`REGISTRY` is ordered simplest -> most complex: from the fewest/most-familiar
workflow stages (Wave) up through recursion (Fractal). The two Hybrid entries
are deliberately listed last, after every single-concept pattern, since each
only makes sense once its own two ingredient generators are already
understood on their own. `App.jsx`'s `groupByCategory` renders Generator
Selection in this exact array order, so keep it in sync with
`docs/nodes/WORKFLOWS.md`'s section order.

## `rotation` toggle vs. `snapRotation`

Islamic-family `rotation` params are snapped internally to `180/segments`
(`islamic.js`'s `snapRotation`), which is exactly half the shape's own
`360/segments` rotational period. That means, regardless of `segments`,
there are only ever 2 distinct snapped appearances — 0 and `180/segments`
("tip-up" vs. "waist-up"/flipped) — so the param is declared with
`control: "toggle"` and an `onValue: (params) => 180 / segments` function
(resolved against the live params in `App.jsx`) rather than an
`archetype`/`map` slider, which previously stayed a plain 0-360 range to
dodge a `segments`-dependent max but still misrepresented the param as
continuously controllable.

## `depth` and `firstOccurrenceOnly`

Recursive generators' node graphs repeat one Subdivide node per depth level
(`workflows.js`'s `STEP_DEFS`), so `depth` would otherwise show as an
editable slider on every one of them — editing it from any single node would
change the whole repeat count, reading as broken rather than a real
per-node control. `firstOccurrenceOnly: true` shows the slider only on the
first occurrence; later ones get an explanatory note instead
(`WorkflowNode.jsx`).

## Voronoi Islamic's `rotation` / `variation`

`rotation` is reused unchanged from `islamic.js`'s own construction — same
snapping and toggle convention as Islamic Rosette's own `rotation`.
`variation` is opt-in (default 0 = exact uniform-construction baseline); above
0, each cell's own segments/rotation independently diverge from the shared
base values, for a less repetitive result (`voronoiIslamic.js`'s
`cellVariation`). It reuses the "Randomness" archetype rather than
introducing a new one.
