# App implementation notes

Design rationale for a few `src/app/src/**` implementation details that are
too long to live as inline comments, and have no other doc home. Referenced
from short pointer comments in the code.

## Evaluation overlay: why no score is shown until download

`EvaluationOverlay.jsx` is a *research instrument* for the dissertation's
secondary research question (does the demonstration layer measurably help),
not a learner-facing gamified assessment — the latter is explicitly out of
scope (see `PROJECT_SPECIFICATION.md`: "assessment, grading or progress
tracking"). The distinction is who it's for: this screen exists to collect
data for the study runner, not to score or gate the learner's own use of the
explorer.

It builds the instrument and local data capture only — not the study itself.
Running a real pre/post comparison with real participants, and writing up
the results, is separate work that happens after this instrument exists and
works.

Deliberately no score is shown after either quiz pass — not even "you got N
right." Telling a participant their pre-quiz score would let them infer
which answers were wrong and go looking for the right ones before the
post-quiz, or re-pick answers on the post-quiz just to see the number move,
contaminating the within-subject comparison this instrument exists to
measure. Scores only surface in the downloaded JSON, for the study runner,
after the whole session is over.

`download()` in `EvaluationOverlay.jsx` mirrors `export.js`'s Blob-download
pattern rather than a second implementation of the same few lines.

## Quiz content: methodology and item types

`quizContent.js` is the instrument for this project's lightweight
evaluation deliverable — the instrument, not a completed study.

**Methodology.** A single question bank, administered twice (once before
exploring the app, once after) — a single-group pre/post design, the
standard, simplest valid design for measuring a within-subject learning
gain on one instrument, rather than two separately-authored equivalent
forms (which would need their own difficulty-equivalence justification this
project has no capacity to establish).

**Concept coverage.** Questions cover the nine computational-thinking
concepts named as this project's Educational Objectives (Randomness,
Iteration, Transformation, Symmetry, Rule-based generation,
Parameterisation, Emergence, Procedural modelling, Computational
creativity), plus two bonus questions on the app's own vocabulary (node =
computational stage; hybrid = stochastic + deterministic composition) — a
secondary "did the interface's terminology land" read, not part of the
CT-concept score. Four further questions (concept tags "Sequence of
operations" and "Stage role") cover two Success Criteria the nine named
concepts don't test on their own: understanding the sequence of operations
within an algorithm, and explaining the role of individual stages. These
are grounded in `docs/nodes/WORKFLOWS.md`'s verified stage sequences, not
invented workflows.

**Distractor design.** Every question has exactly 5 options, built to one
fixed structure: 1 correct, 1 clearly-wrong option an average person can
eliminate immediately, 1 "near-miss" a plausible misconception would pick
(the option doing the real discriminating work), and 2 mid-plausibility
options that are neither a giveaway nor a trap. Chance alone is 20% (vs 25%
at 4 options), and the near-miss keeps a confident-but-wrong guesser from
coasting on elimination.

### Study 2 additions — image-bearing item types

Study 1 items are all `type: "mc"` (the implicit default, omitted on every
existing entry so Study 1's data format needs no migration). Every Study 2
item sets an explicit `type` and adds fields `QuizForm`
(`EvaluationOverlay.jsx`) reads to render an image alongside or instead of
plain text. Images are never pre-rendered files: `entryId` + `overrides`
(or `startOverrides`/`paramsBefore`/`paramsAfter`/each candidate's own
`overrides`) name a real `patternRegistry.js` entry and a partial params
override, resolved live by `quizPatterns.js` and rendered by the app's own
`PatternCanvas` (`QuizPatternImage.jsx`).

- **"cause"** — two renders of the same generator (`paramsBefore`/
  `paramsAfter`), one real parameter changed between them; text options
  name the possible causes. Same 1-correct-plus-distractors shape as
  `type: "mc"`, scored identically (a single `correctIndex`).
- **"predict"** — one starting render (`startOverrides`) plus a stated
  change (`changeDescription`), then `candidates[]` — each a real render of
  a different, plausible parameter change — select the one matching the
  stated change. Scored the same way: `correctIndex` into `candidates`.
- **"concept-match"** — `candidates[]` drawn from *different* generators;
  pick which pattern best demonstrates the named concept (`concept`/
  `prompt`). Same single-`correctIndex` scoring.
- **"spectrum"** — one render; place it on the stochastic <-> deterministic
  scale already surfaced elsewhere in the app (`SpectrumBar.jsx`'s
  `SPECTRUM_LABELS`, reused here verbatim as `SPECTRUM_OPTIONS` so the
  quiz's five bins are the exact same categories the app itself shows, not
  a second taxonomy) — `correctIndex` is that entry's own
  `patternRegistry.js` `spectrum` value binned the same way
  `describeSpectrum()` does.
- **"node-select"** — one target render plus `nodeOptions[]` (a mix of real
  nodes from that generator's own workflow and plausible intruders from a
  *different* generator's workflow); multi-select which nodes are required.
  Scored differently from every type above — see `evaluationStorage.js`'s
  `recordQuizPass()` for the exact-match + partial-credit path
  `correctNodeSet` drives.
