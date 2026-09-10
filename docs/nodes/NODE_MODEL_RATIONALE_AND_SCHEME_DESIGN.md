# Node Model Rationale and Schema Design

## Overview

This document records the conceptual evolution of the Algorithmic Pattern Explorer from a visual node-based interface into a structured educational knowledge model.

It explains the rationale behind the final node metadata schema and how it supports the project’s aim of teaching computational thinking through interactive procedural systems.

The model defines nodes not as UI components or code representations, but as **educational computational primitives** that encode reusable concepts across multiple generative algorithms.

---

# 1. Conceptual Shift

## 1.1 From Algorithm Representation to Knowledge Representation

Initially, the system represented procedural algorithms as visual node graphs.

In this model:

* Nodes mapped closely to implementation steps
* Each algorithm was treated as an isolated system
* Structure primarily reflected procedural logic

However, this approach limited the educational scope because:

* Concepts were not explicitly reusable across algorithms
* Learning remained tied to individual generative systems
* Computational thinking concepts were implicit rather than explicit

---

## 1.2 Emergence of a Concept-Based Model

The revised model reframes nodes as:

> reusable computational thinking primitives

Instead of representing *how an algorithm is implemented*, nodes represent:

* what computational idea is being used
* what concept is being taught
* how that concept appears across different systems

For example:

* Rotate → transformation, symmetry, parameterisation
* Noise → randomness, continuous representation, emergence
* Seed → determinism, reproducibility, randomness

This shift enables learners to recognise **transferable computational concepts across multiple algorithms**.

---

## 1.3 Key Design Insight

> Algorithms are not the core learning object. Computational concepts are.

Algorithms become **compositions of shared conceptual building blocks**.

This allows the system to function as an educational framework rather than a visualisation tool.

---

# 2. Motivation for a Structured Schema

Transitioning from markdown-based documentation to a structured schema enables:

## 2.1 Computational Treatment of Learning Content

Nodes become machine-readable objects that can be:

* filtered by difficulty
* sequenced into learning pathways
* analysed for conceptual coverage
* reused across multiple algorithms
* dynamically rendered in UI systems

---

## 2.2 Separation of Concerns

The schema cleanly separates:

* computational meaning (concepts)
* educational difficulty (tier)
* structural role (category)
* behavioural description (parameters)
* visual interpretation (visualisation)

This avoids conflating implementation details with educational intent.

---

## 2.3 Extensibility

The model supports future expansion without structural redesign:

* new nodes can be added independently
* new algorithms reuse existing nodes
* new learning pathways can be generated dynamically
* database integration is straightforward

---

# 3. Node Metadata Model

Each node is defined as a structured object with the following components:

## 3.1 Identity Layer

* id
* title
* summary

Defines the node as a unique educational concept.

---

## 3.2 Educational Classification Layer

* category
* tier (core / intermediate / advanced)
* difficulty (1–5)

This layer enables progressive learning design.

### Tier Definitions

* **Core**: Foundational computational concepts (e.g. Rotate, Repeat, Seed)
* **Intermediate**: Structured computational processes (e.g. Noise, Grid, Colour Mapping)
* **Advanced**: Mathematical or spatial systems (e.g. Distance Field, Partition)

---

## 3.3 Computational Thinking Layer

Each node explicitly encodes the computational thinking concepts it teaches.

Examples include:

* abstraction
* transformation
* randomness
* symmetry
* decomposition
* emergence
* spatial reasoning

This enables cross-algorithm conceptual analysis.

---

## 3.4 Structural Interface Layer

* inputs
* outputs
* parameters

This defines how the node behaves within a computational pipeline without exposing implementation details.

---

## 3.5 Representation Layer

* visualisation type (static / animated / interactive)
* mathematical principle (optional)
* examples (optional)

This connects abstract concepts to visual learning.

---

## 3.6 Relational Layer

* usedBy (algorithms using the node)
* relatedNodes (conceptually similar nodes)

This creates a graph of conceptual relationships across the system.

---

# 4. Educational Rationale

## 4.1 Progressive Learning via Tiering

The tier system enables structured introduction of complexity:

### Core Level

Focuses on:

* spatial transformation
* repetition
* basic randomness
* coordinate systems

### Intermediate Level

Introduces:

* noise functions
* structured grids
* visual mapping of data

### Advanced Level

Introduces:

* spatial partitioning
* distance fields
* procedural geometry systems

---

## 4.2 Concept Reinforcement Across Algorithms

Because nodes are reusable, learners encounter the same concept in different contexts:

* Rotate in Escher systems
* Rotate in Islamic symmetry systems
* Rotate in future fractal systems

This reinforces:

> transfer of computational thinking across domains

---

## 4.3 Algorithm Decomposition as Learning Strategy

By decomposing algorithms into nodes:

* learners see how complexity is constructed from simple operations
* hidden procedural logic becomes explicit
* each stage can be inspected independently

This supports:

* algorithm tracing
* step-by-step reasoning
* mental model building

---

# 5. Evaluation Opportunities Enabled by the Model

The schema enables structured evaluation of learning outcomes.

## 5.1 Concept Acquisition

* Do learners recognise computational thinking concepts across different nodes?

## 5.2 Transfer Learning

* Can learners identify shared operations across different algorithms?

## 5.3 Progressive Understanding

* Does tier-based sequencing improve comprehension?

## 5.4 Parameter Exploration

* Does interaction with node parameters improve understanding of algorithmic behaviour?

## 5.5 Decomposition Understanding

* Do learners better understand algorithms when they are presented as compositional structures?

---

# 6. Implications for System Architecture

This model directly informs implementation:

## 6.1 Database Design

Nodes become structured records suitable for:

* relational databases (Postgres)
* document stores (MongoDB / Firestore)
* graph databases (Neo4j-style conceptual mapping)

---

## 6.2 UI Architecture

The React system can:

* dynamically render nodes from schema
* filter by tier or category
* construct learning pathways
* highlight conceptual relationships

---

## 6.3 Curriculum Generation

The system can automatically generate:

* beginner learning paths
* concept-specific explorations
* algorithm comparison exercises

---

# 7. Summary

The node model transforms the Algorithmic Pattern Explorer from a procedural visualisation tool into a structured educational system for computational thinking.

This shift introduces:

* explicit representation of computational concepts
* reusable educational primitives across algorithms
* progressive learning through tiered complexity
* machine-readable structure for curriculum generation

The result is a system where **algorithms become a medium for teaching computational thinking, rather than the end goal itself.**
