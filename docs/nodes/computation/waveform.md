# Waveform

## Summary

Turns a scalar value (a distance, a coordinate) into a periodic value by applying a sine function.

---

## Purpose

Many patterns are built by first computing some non-repeating scalar value at
a point — a distance from a centre, a raw coordinate — and then folding that
value through a periodic function to produce repeating rings, stripes or line
work. The Waveform node is that fold, extracted as its own reusable stage
rather than left as an inline calculation.

---

## Computational Thinking Concepts

- Transformation
- Parameterisation
- Pattern Formation

---

## Mathematical Principle

`sin(value * frequency + phase)` maps any real input to a smooth, periodic
output in `[-1, 1]`. Increasing `frequency` makes the pattern repeat more
often over the same input range; `phase` shifts where the wave crosses zero.

---

## Inputs

A scalar field (e.g. a coordinate, or a Distance Field's output).

---

## Outputs

A periodic scalar field in `[-1, 1]`.

---

## Parameters

### Frequency

Controls how quickly the waveform repeats.

### Phase

Shifts the waveform's starting point.

---

## Visualisation

The flat input gradient resolves into evenly spaced bands or rings as the
waveform is applied.

---

## Try Changing...

Increase frequency to see more, tighter bands; compare feeding it a raw
coordinate (stripes) versus a Distance Field output (rings).

---

## Used By

- Wave / Concentric Rings (`wave.js`, both modes)

Islamic Geometric Patterns (`islamic.js`) used this node before its
2026-08-20 rebuild (see `docs/generators/ISLAMIC_PATTERN_CONSTRUCTION.md`) unified
its two former modes into one construction that bands signed distance
directly via Colour Mapping, with no Waveform step.

---

## Related Nodes

- Distance Field
- Colour Mapping
