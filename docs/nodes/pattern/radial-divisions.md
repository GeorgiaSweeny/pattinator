# Radial Divisions

## Summary

Divides a circular structure into equal angular segments.

---

## Purpose

This node transforms circular symmetry into discrete structural guides used for pattern construction.

---

## Computational Thinking Concepts

- Symmetry
- Iteration
- Pattern Formation

---

## Mathematical Principle

Angles are divided evenly using 360° / n segmentation.

---

## Inputs

Construction circle.

---

## Outputs

Radial guide geometry.

---

## Parameters

### Segment Count

Number of radial divisions (`islamic.js`'s `segments`, registry range
3-16 — the *n* in *n*-fold symmetry).

### Rotation

Starting angle offset (`islamic.js`'s `rotation`, added 2026-08-21,
registry range 0-360 degrees, default 0). Snapped internally to the
nearest multiple of `180 / segments`, not applied raw — `islamic.js`'s
`snapRotation(rotationDeg, segments)`. `360 / segments` was considered
first and rejected: this shape has exact *n*-fold rotational symmetry,
so any multiple of `360 / n` maps the point set onto itself exactly,
making a control snapped to it a visible no-op. `180 / n` is the finest
increment that both changes the rendered shape and always lands back on
one of the shape's own reflection axes — alternating between a tip-up
and a waist-up reading of the same star at each step (e.g. `segments =
4`: diamond and square are the two positions). See
`docs/generators/ISLAMIC_PATTERN_CONSTRUCTION.md`'s `rotation` section for the full
reasoning, including the request's original, more literal phrasing
("360/n-fold degrees") and why that was checked mathematically and
flagged back before implementing anything.

---

## Visualisation

Radial lines animate outward from centre.

---

## Try Changing...

Increase segments to produce denser symmetry patterns. Nudge rotation by
one step to flip the medallion between its tip-up and waist-up
orientations.

---

## Used By

- Islamic geometric system

---

## Related Nodes

- Construction Circle
