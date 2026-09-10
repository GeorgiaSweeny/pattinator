# Construction Circle

## Summary

Defines a geometric construction framework based on circular symmetry.

---

## Purpose

The Construction Circle node establishes radial structure used in geometric construction systems, particularly Islamic geometric design.

It acts as a scaffold for symmetry-based pattern generation.

---

## Computational Thinking Concepts

- Symmetry
- Spatial Reasoning
- Abstraction

---

## Mathematical Principle

Uses radial geometry to divide space evenly around a central point.

---

## Inputs

Workspace.

---

## Outputs

Circular construction guide geometry.

---

## Parameters

### Radius

Size of the construction circle, as `scale × tileSize` — `scale` is a
free, user-adjustable parameter (added 2026-08-20, registry range
`[0.2, 0.48]`, default `0.42`) in `islamic.js`/`islamic-svg.js`. Was
originally a hardcoded `0.42 × tileSize` constant with no exposed
control; turning it into a parameter was filling in what this node was
already conceptually for (define the radius), not adding a new
capability — see `docs/generators/ISLAMIC_PATTERN_CONSTRUCTION.md`'s `scale`
section. Capped below `0.5 × tileSize` so the medallion can't exceed a
square tile's own half-width and stop being a self-contained motif — a
rosette is one bounded star+petal shape, not an infinite lattice of
lines, so there's no need for the geometry to reach past its own tile,
and no neighbour-tile search anywhere in this generator.

### Centre

Origin point of the circle.

### Segments

Number of radial divisions.

---

## Visualisation

A circle appears with evenly distributed radial guides.

---

## Try Changing...

Increase segment count to observe higher symmetry order.

---

## Used By

- Islamic geometric pattern system
- Voronoi-Seeded Islamic Tiling (`voronoiIslamic.js`, added 2026-08-21) —
  same node, but its radius is scaled per-cell to each Voronoi seed's own
  nearest-neighbour distance rather than a fixed `tileSize`; see
  `docs/nodes/WORKFLOWS.md` §8

---

## Related Nodes

- Radial Divisions (also owns the `rotation` parameter — see its own doc;
  there is no separate Rotate/Mirror node in this codebase's
  `NODE_LIBRARY`, `src/app/src/workflows.js`)
