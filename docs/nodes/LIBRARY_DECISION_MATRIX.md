# Node Editor Library Decision Matrix

**Purpose:** To select a node-graph rendering library for a browser-based computational thinking workspace that teaches generative pattern algorithms through visual, interactive node graphs. The decision is evaluated against six explicit design criteria derived from the project requirements and research aims.

---

## Evaluation Methodology

Three candidate libraries were identified through a review of the current JavaScript ecosystem: **React Flow**, **Rete.js v2**, and **Blockly**. Each is evaluated against six criteria on a 1–5 integer scale (1 = poor fit, 5 = excellent fit). Criteria are weighted to reflect their relative importance to the project's educational and technical goals. A weighted total score is computed for each library and used to support the final selection.

**Scoring scale:**

| Score | Meaning |
|---|---|
| 5 | Fully meets the criterion with no significant limitations |
| 4 | Meets the criterion with minor limitations |
| 3 | Partially meets the criterion; workarounds required |
| 2 | Meets the criterion poorly; significant rework needed |
| 1 | Does not meet the criterion |

---

## Design Criteria and Weights

| # | Criterion | Weight | Rationale for Weight |
|---|---|---|---|
| C1 | Educational suitability | 20% | Core project aim: the tool must communicate concepts, not syntax |
| C2 | Support for computational thinking | 20% | Research aim: concepts must map to computational thinking, not programming constructs |
| C3 | Customisability | 20% | Custom node rendering and side-panel UX are central to the design |
| C4 | Implementation complexity | 15% | Practical constraint: complexity must be manageable within the project timeline |
| C5 | User experience | 15% | The workspace must be fluent and non-distracting for learners |
| C6 | Compatibility with existing React application | 10% | Technical constraint: integration cost must be low |
| | **Total** | **100%** | |

---

## Scoring Matrix

| Criterion | Weight | React Flow | Rete.js v2 | Blockly |
|---|---|---|---|---|
| C1 — Educational suitability | 20% | **4** | 3 | 2 |
| C2 — Support for computational thinking | 20% | **5** | 3 | 1 |
| C3 — Customisability | 20% | **5** | 3 | 2 |
| C4 — Implementation complexity | 15% | **4** | 2 | 3 |
| C5 — User experience | 15% | **4** | 3 | 3 |
| C6 — React compatibility | 10% | **5** | 3 | 2 |
| **Weighted total** | | **4.45 / 5** | **2.85 / 5** | **2.05 / 5** |

**Weighted total calculation:**

- React Flow: (4×0.20) + (5×0.20) + (5×0.20) + (4×0.15) + (4×0.15) + (5×0.10) = **4.45**
- Rete.js v2: (3×0.20) + (3×0.20) + (3×0.20) + (2×0.15) + (3×0.15) + (3×0.10) = **2.85**
- Blockly: (2×0.20) + (1×0.20) + (2×0.20) + (3×0.15) + (3×0.15) + (2×0.10) = **2.05**

---

## Criterion Justifications

### C1 — Educational Suitability

**React Flow: 4 / 5**
React Flow provides the substrate for a graph UI while imposing no opinion on how nodes are labelled, described, or contextualised. This makes it well suited to an educational tool where each node must communicate a concept (e.g. *Voronoi*, *Jitter*, *Symmetry*) rather than a programming operation. A custom side panel — displaying the node's conceptual role, related algorithms, and usage context — can be implemented as a standard React component responding to selection state, requiring no adaptation layer. The score is 4 rather than 5 because React Flow provides no built-in educational scaffolding; all pedagogical content must be authored by the developer.

**Rete.js v2: 3 / 5**
Rete.js is designed for general-purpose node editors and is capable of supporting an educational overlay, but its plugin-based architecture and typed port system introduce structural assumptions that must be worked around. Educational content such as concept explanations or algorithm annotations would need to be threaded through the plugin system rather than added as first-class React components.

**Blockly: 2 / 5**
Blockly was designed to teach introductory programming through a block metaphor modelled on Scratch. Its educational framing is therefore oriented toward code literacy — loops, conditionals, variables — rather than computational thinking concepts such as randomness, geometric transformation, or noise. Repurposing Blockly for this domain would require abandoning most of its design intent and rebuilding the interaction model from scratch.

---

### C2 — Support for Computational Thinking

**React Flow: 5 / 5**
React Flow places no constraints on the semantic meaning of nodes or connections. Concepts such as *Repeat Until*, *Distribution*, *Relaxation*, and *Voronoi Subdivision* can be represented as first-class nodes without mapping onto any programming construct. The execution model — how values propagate through the graph — is designed by the developer, meaning the graph can be made to embody a computational process (e.g. step-by-step geometric transformation) rather than a code execution trace.

**Rete.js v2: 3 / 5**
Rete's built-in execution engine performs a topological traversal of the graph and propagates typed data between nodes. While this is useful for general node editors, it encodes a specific computational model that mirrors dataflow programming, which is closer to functional programming than to computational thinking as a discipline. Exposing the execution process as part of the educational experience (e.g. visualising how a pattern is built step by step) would require overriding or extending the engine.

**Blockly: 1 / 5**
Blockly generates executable code in target languages (JavaScript, Python, etc.) from block arrangements that correspond directly to programming syntax. This is antithetical to the goal of teaching computational thinking independently of programming: a *Rotate* block in Blockly would necessarily call a rotation function, conflating the concept with its implementation. Blockly is therefore unsuitable for this criterion.

---

### C3 — Customisability

**React Flow: 5 / 5**
Nodes in React Flow are defined as standard React components, giving complete control over layout, typography, interactive elements (sliders, colour pickers, toggle switches), and embedded previews (e.g. a thumbnail of the geometric transformation the node applies). Edge types, handles, and the background canvas are all similarly overridable. This level of customisability is essential for a tool where the visual design of each node must reflect its conceptual role rather than a generic input/output template.

**Rete.js v2: 3 / 5**
Rete.js v2 supports custom rendering through its React plugin, but node structure is constrained by the framework's port and control abstractions. Significant deviations from the expected node shape — such as embedding a live geometric preview or a multi-section educational layout — require working outside the documented API. The plugin system adds overhead that limits the flexibility available for bespoke educational UI.

**Blockly: 2 / 5**
Blockly's block grammar is intentionally constrained to maintain visual consistency with the Scratch/block-code paradigm. While blocks can be customised within this grammar, the paradigm itself cannot be changed: blocks always snap together vertically, inputs are always typed slots, and the overall visual metaphor is fixed. This makes Blockly unsuitable for a node-graph layout where connections are drawn between ports on spatially independent nodes.

---

### C4 — Implementation Complexity

**React Flow: 4 / 5**
React Flow's API is well-documented with interactive examples covering common patterns including custom nodes, controlled flow state, and edge customisation. Because the library is React-native, developers already familiar with React encounter no new rendering paradigm. The main implementation work specific to this project — designing the graph execution model and the side-panel content system — is architectural rather than library-specific, and is manageable within the project scope.

**Rete.js v2: 2 / 5**
Rete.js v2 is a significant rewrite of v1 and, while improved, its documentation is still maturing. The plugin-based architecture (separate packages for rendering, connections, minimap, history, etc.) introduces dependency management overhead and a steeper initial learning curve. The execution engine, while powerful, requires understanding Rete's internal data model before it can be extended or overridden. This complexity represents a material risk to the project timeline.

**Blockly: 3 / 5**
Blockly is well-documented and straightforward to configure for its intended use case — a visual code editor. However, adapting it to function as a node-graph workspace would require substantial rearchitecting of its workspace model, which offsets the documentation advantage. The score reflects its lower baseline complexity for its intended use, not its suitability for this project.

---

### C5 — User Experience

**React Flow: 4 / 5**
React Flow provides smooth pan-and-zoom navigation, animated edge connections, drag-and-drop node placement, and a minimap — the standard affordances expected in a professional node-graph interface. The library is used in production tools including workflow automation and diagram editors, giving confidence that the interaction model is well-tested. The learner-facing experience can be further refined through custom node styling and progressive disclosure of node detail via the side panel.

**Rete.js v2: 3 / 5**
Rete.js v2 provides comparable core interactions (pan, zoom, drag, connect) but the default visual styling is more minimal and requires more CSS effort to produce a polished result. The interaction model is functional but the out-of-the-box experience is less refined than React Flow for an end-user-facing educational product.

**Blockly: 3 / 5**
Blockly's block-snapping interaction is highly polished for its intended paradigm and will be familiar to users with experience of Scratch or similar tools. However, the interaction model is categorically different from a node-graph workspace — there is no spatial node placement, no directional edges between ports, and no concept of a canvas. The score reflects UX quality within its intended paradigm, not fitness for this project's UX requirements.

---

### C6 — Compatibility with Existing React Application

**React Flow: 5 / 5**
React Flow is a React library distributed as an npm package and integrated via standard component composition. It requires no build configuration changes, no framework adapter, and no global state management system. It can be added to any existing React application with a single `npm install` and a component import, making integration cost negligible.

**Rete.js v2: 3 / 5**
Rete.js v2 supports React rendering through a dedicated `@rete-js/react` plugin, which introduces an additional dependency and a rendering adapter layer between Rete's internal rendering model and React's component tree. Integration is feasible but requires additional configuration and understanding of the plugin lifecycle.

**Blockly: 2 / 5**
Blockly is a standalone JavaScript library with no native React bindings. Integration into a React application requires either a community wrapper library (e.g. `@blockly/react`) or a manual integration using `useRef` and `useEffect` to mount the Blockly workspace into the DOM. This adapter pattern is brittle and increases maintenance burden.

---

## Decision

Based on the weighted scores, **React Flow** is selected as the node editor library for this project with a weighted total of **4.45 / 5**, significantly ahead of Rete.js v2 (2.85 / 5) and Blockly (2.05 / 5). React Flow is the strongest candidate across all six criteria, with perfect scores on the three highest-weighted criteria: support for computational thinking, customisability, and React compatibility. Its lower implementation complexity relative to Rete.js and its superior UX foundation further support the selection. Blockly is eliminated at the criterion level due to its fundamental paradigm mismatch with node-graph interaction and computational thinking framing.
