in a previous undergrad r&d project i made an islamic pattern geneteror hda in houdini. the implemention was based on parameterized shape grammers, nodes were exposed in the top level ui parametres users could manipulate, limitators and range caps put in place to ensure valid/approved values resulting in pattern rules being maintained (most of the time). The parmetres were ectioned into steps with loose descriptions so less educational but the idea was simmilar. although it was predomoinatly to help creatives be able to utilized procedural tools without needing techincal knowlege to build tool form scrathc themselves.

I actually think you've stumbled onto something that could make your dissertation much stronger.

What you've described isn't just "similar"—it's a useful design precedent that you can build on and explicitly reference in your methodology.

The difference is that your undergraduate project answered:

How can non-technical creatives use procedural tools?

Whereas this dissertation asks:

How can learners understand the computational logic behind procedural tools?

Those are related but distinct aims.

Your undergraduate workflow

Conceptually it was:

Parameterized Shape Grammar
            │
            ▼
Hidden procedural network
            │
            ▼
Exposed parameters
            │
            ▼
Validated values
            │
            ▼
Pattern output

The Houdini node graph remained hidden.

Users interacted with a curated interface.

That is actually good UX.

What your dissertation could become

Instead of hiding the grammar, reveal it.

Pattern Rule

        ▼

Visual Algorithm Node

        ▼

Parameter Controls

        ▼

Pattern Updates

        ▼

Educational Explanation

The important change is that the node itself becomes the learning object.

This aligns surprisingly well with your tutor's comment

Remember they mentioned:

"tree grammars and combinators"

Your undergraduate project already used parameterised grammars.

Now you're exposing those grammars visually.

That means your educational layer isn't something you've invented at the end—it's a visualisation of the underlying computational model.

That gives your design much stronger theoretical grounding.

I'd actually borrow from Houdini

Not its appearance.

Its philosophy.

Every node should represent one computational operation.

For example:

Repeat Pattern

Concept
Iteration

Purpose
Repeats geometry around a centre point.

Parameters

Copies
8

Angle
45°

Rather than

Repeat()

copies

angle

offset

origin

...

The educational focus is on what the operation means, not the API.

I think there's an even stronger architecture emerging

Rather than:

React Flow

↓

calls generator

Think:

Algorithm Grammar
        │
        ▼
React Flow visualises grammar
        │
        ▼
Parameter Panel edits grammar
        │
        ▼
Generator evaluates grammar
        │
        ▼
Canvas renders result

That separation is much cleaner.

The graph isn't the algorithm.

It's a representation of it.

This could also unify all four generators

Each generator becomes a grammar.

Perlin:

Noise

↓

Threshold

↓

Colour

↓

Render

Voronoi:

Points

↓

Partition

↓

Relax

↓

Render

Islamic:

Base Grid

↓

Apply Symmetry

↓

Construct Geometry

↓

Render

Escher:

Create Tile

↓

Transform

↓

Repeat

↓

Render

Notice how they're all expressing the same idea:

An algorithm is a sequence of computational transformations.

That's exactly what you're trying to teach.

One thing I would avoid

I wouldn't make the graph fully editable.

Coming from Houdini, it's tempting to think:

"Users should be able to build their own node graphs."

But for your dissertation, that shifts the focus from understanding algorithms to authoring algorithms.

Instead, I'd keep the algorithm structure fixed for each pattern generator and allow users to:

inspect each stage of the algorithm,
adjust the parameters associated with each stage,
view explanations of the computational concept behind the stage, and
immediately observe how those changes affect the generated pattern.

This supports your educational aims while keeping the implementation and evaluation manageable.

I think this could become your project's core contribution

The more we've discussed it, the less I think you're building an "algorithmic pattern generator."

You're really building an interactive visualisation of parameterised shape grammars and generative algorithms for education.

Your undergraduate project demonstrated that parameterised grammars could make procedural tools accessible to designers. This dissertation can extend that idea by making the grammars themselves visible and understandable, helping learners connect parameter changes to the underlying computational thinking concepts. That progression provides a compelling narrative in your dissertation: you're not abandoning your previous work, you're evolving it from a design tool into an educational framework.


### 4.X Design Evolution: From Procedural Tool to Educational Interface

An earlier undergraduate research and development project provides a direct design precedent for this work. That project produced an Islamic geometric pattern generator implemented as a Houdini Digital Asset (HDA), a node-based procedural tool in which parameterised shape grammars drove the generation of geometric patterns. The system exposed a curated set of high-level parameters through a structured interface, with range constraints and validation rules applied to ensure that outputs conformed to the mathematical properties of Islamic geometric construction. The interface was organised into stages with brief descriptive labels, allowing creative practitioners to generate valid patterns without requiring knowledge of the underlying procedural network.

The primary objective of that system was accessibility for creative production: non-technical users could operate a complex procedural workflow without constructing or understanding it. This was effective as a design tool, but it also identified a significant limitation. Because the node graph remained hidden and interaction was confined to parameter manipulation, users could produce outputs without developing any understanding of the computational processes responsible for them. The system answered the question of *how to use* a procedural tool, not *how that tool works*.

This limitation became the starting point for the present research. The central design shift is the move from concealing the procedural structure to making it the primary learning object. Rather than hiding the algorithm behind a parameter interface, this project exposes the algorithm itself as the interface. Each stage of the generative process is represented as a discrete visual node — corresponding to computational concepts such as symmetry, transformation, iteration, noise, and geometric subdivision — and the node graph as a whole constitutes a visual representation of the algorithm's structure.

Importantly, the graph is a *representation* of the algorithm rather than a freely editable programming environment. The algorithmic structure of each pattern generator is fixed; users interact by inspecting individual nodes, adjusting the parameters associated with each stage, and observing how those changes propagate through the generation pipeline to affect the output in real time. This design decision is deliberate. Allowing users to construct or rewire the graph would shift the focus from understanding algorithms to authoring them, which lies outside the educational scope of the project. The fixed structure ensures that interaction remains oriented toward comprehension rather than construction.

Each node is therefore designed to function as a self-contained learning object. In addition to its computational role in the generation pipeline, it carries an explanation of the underlying concept, contextualises that concept within the broader pattern type, and makes its parameters interpretable in conceptual rather than technical terms. This reflects the distinction between teaching computational thinking and teaching programming: the aim is for users to understand *what* a computational operation achieves and *why* it matters within a generative system, rather than how to implement it in code.

This approach also provides a unifying architecture across the four pattern generators included in the project. Each generator — Perlin noise, Voronoi, Islamic geometric, and Escher-style tessellation — can be expressed as a sequence of discrete computational transformations: from an initial state, through intermediate operations such as thresholding, partitioning, symmetry application, or tiling, to a rendered output. The node graph makes this sequential structure visible and consistent across all four generators, reinforcing the broader educational aim of demonstrating that diverse generative systems share common underlying computational principles.

Figure X.X illustrates this design evolution. The two pipelines are presented side by side: the undergraduate system conceals its procedural graph behind a parameter interface, whereas the dissertation tool surfaces the algorithm itself as the primary interaction object.

This progression represents a meaningful evolution from the earlier project. Where the undergraduate HDA prioritised usability for creative production by abstracting away procedural complexity, the present research inverts that priority: procedural complexity is made visible precisely because understanding it is the goal. The algorithm is no longer an implementation detail hidden beneath the interface; it is the central artefact through which learning occurs. This evolution aligns directly with the overarching research aim of supporting understanding of computational thinking through the interactive visualisation of generative algorithms.

![Figure X.X. Design evolution from a procedural design tool to an educational algorithm interface.](figures/fig-design-evolution.svg)
