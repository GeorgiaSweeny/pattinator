/*
========================================
MAIN APPLICATION SHELL
========================================
* Top-level layout: generator selection, documentation panel, pattern canvas,
* node workflow graph, and the menu bar (tutorial, evaluation, node library).
* Owns the selected pattern/params/node state that drives the other panels.
*/

import { useEffect, useMemo, useRef, useState } from "react";
import { ReactFlow, Background, Controls, MarkerType } from "@xyflow/react";
import { CATEGORY_COLOURS } from "./nodeTypes/WorkflowNode.jsx";
import "@xyflow/react/dist/style.css";
import { REGISTRY } from "../../patternRegistry.js";
import { CANVAS } from "../../config.js";
import { buildWorkflow } from "./workflows.js";
import WorkflowNode from "./nodeTypes/WorkflowNode.jsx";
import PatternCanvas from "./PatternCanvas.jsx";
import DocumentationPanel from "./DocumentationPanel.jsx";
import PatternDocumentation from "./PatternDocumentation.jsx";
import NodeLibraryOverlay from "./NodeLibraryOverlay.jsx";
import { exportSvg, exportPng, capturePngDataUrl } from "./export.js";
import EvaluationOverlay from "./evaluation/EvaluationOverlay.jsx";
import Onboarding, { hasSeenOnboarding, markOnboardingSeen } from "./Onboarding.jsx";
import Welcome from "./Welcome.jsx";
import GalleryOverlay from "./gallery/GalleryOverlay.jsx";
import { addMyGalleryItem } from "./gallery/myGalleryStorage.js";
import "./App.css";

const nodeTypes = { workflow: WorkflowNode };
const CANVAS_LABEL = `${CANVAS.WIDTH} × ${CANVAS.HEIGHT} px`;
const GITHUB_REPO_URL = "https://github.com/GeorgiaSweeny/algorithmic-pattern-generator";

// Human-readable labels for CATEGORY_COLOURS's keys, in pipeline order —
// the legend under the workflow graph.
const CATEGORY_LABELS = {
   environment: "Environment",
   initialisation: "Initialisation",
   computation: "Computation",
   pattern: "Pattern",
   presentation: "Presentation",
   output: "Output",
};

function defaultParams(entry) {
   return Object.fromEntries(entry.params.map((p) => [p.param, p.value]));
}

// Groups REGISTRY by its existing `category` field, in first-seen order,
// so Generator Selection reads as tiers rather than one flat list.
function groupByCategory(entries) {
   const groups = new Map();
   for (const entry of entries) {
      if (!groups.has(entry.category)) groups.set(entry.category, []);
      groups.get(entry.category).push(entry);
   }
   return groups;
}
const REGISTRY_BY_CATEGORY = groupByCategory(REGISTRY);

// Layout: Generator Selection + always-final-output preview (left column),
// Documentation Panel (middle), Pattern Canvas + workflow graph (right).
// Node selection is single-node-at-a-time — selecting a node highlights it,
// shows its params inline, and drives what the canvas renders (see
// stagePreview.js and PatternCanvas.jsx). See docs/design/UI_DESIGN.md for the
// full layout rationale.
export default function App() {
   const [selectedId, setSelectedId] = useState(REGISTRY[0].id);
   const selectedEntry = REGISTRY.find((e) => e.id === selectedId);
   const [paramValues, setParamValues] = useState(() => defaultParams(selectedEntry));
   // 0 = the pattern's first node, so Documentation Panel always has a
   // concrete stage by default. -1 (pattern overview) is reachable via Prev.
   // Resets to 0 whenever the pattern selection changes, not just on load.
   const [selectedIndex, setSelectedIndex] = useState(0);
   // 1 = fits the panel at the pattern's actual pixel size, no scrolling.
   // Zooming past that is explicit; scrolling only appears then.
   const [canvasZoom, setCanvasZoom] = useState(1);
   const CANVAS_ZOOM_MIN = 0.5;
   const CANVAS_ZOOM_MAX = 3;
   const [showTest1, setShowTest1] = useState(false);
   const [showTest2, setShowTest2] = useState(false);
   const [showEvaluationMenu, setShowEvaluationMenu] = useState(false);
   const evaluationMenuRef = useRef(null);
   const [showNodeLibrary, setShowNodeLibrary] = useState(false);
   const [showGallery, setShowGallery] = useState(false);
   // Brief "Added ✓" confirmation on the render node's Add to Gallery
   // button, reset after a short delay — no toast system needed for this.
   const [justAddedToGallery, setJustAddedToGallery] = useState(false);
   // Set right before setSelectedId when loading a gallery item, so the
   // paramValues-reset useEffect below (keyed on selectedId) skips its
   // normal defaults reset instead of clobbering the loaded params.
   const skipNextParamResetRef = useRef(false);
   // Welcome and Onboarding are one combined first-visit flow gated by the
   // same "seen" flag: Welcome's "Take the tour" hands off into Onboarding,
   // "Skip" dismisses both. "Tutorial" re-opens the same flow.
   const [showWelcome, setShowWelcome] = useState(() => !hasSeenOnboarding());
   const [showOnboarding, setShowOnboarding] = useState(false);
   // Starts collapsed; expanding this and showing Pattern Documentation are
   // mutually exclusive in the left column.
   const [generatorPanelExpanded, setGeneratorPanelExpanded] = useState(false);

   // Evaluation dropdown: close on outside click.
   useEffect(() => {
      if (!showEvaluationMenu) return;
      function handleClickOutside(e) {
         if (evaluationMenuRef.current && !evaluationMenuRef.current.contains(e.target)) {
            setShowEvaluationMenu(false);
         }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
   }, [showEvaluationMenu]);

   // Reset to the new pattern's defaults, first node selected, and default
   // canvas zoom whenever the selection changes.
   useEffect(() => {
      if (skipNextParamResetRef.current) {
         skipNextParamResetRef.current = false;
         return;
      }
      setParamValues(defaultParams(selectedEntry));
      setSelectedIndex(0);
      setCanvasZoom(1);
   }, [selectedId]);

   // Uniform load path for both gallery tiers: Featured items carry
   // {overrides} (a partial diff, matching quizPatterns.js's convention),
   // My Gallery items carry {params} (a full snapshot captured at Add to
   // Gallery time) — either way the result is merged onto the entry's
   // defaults so a stale/partial record still produces a valid pattern.
   function handleLoadGalleryItem(item) {
      const entry = REGISTRY.find((e) => e.id === item.entryId);
      if (!entry) return;
      const merged = { ...defaultParams(entry), ...(item.overrides ?? item.params ?? {}) };
      skipNextParamResetRef.current = true;
      setSelectedId(item.entryId);
      setParamValues(merged);
      setSelectedIndex(0);
      setCanvasZoom(1);
      setShowGallery(false);
   }

   async function handleAddToGallery() {
      const thumbnailDataUrl = await capturePngDataUrl(selectedEntry, paramValues);
      addMyGalleryItem({
         title: `${selectedEntry.name} — ${new Date().toLocaleTimeString()}`,
         entryId: selectedId,
         params: paramValues,
         thumbnailDataUrl,
      });
      setJustAddedToGallery(true);
      setTimeout(() => setJustAddedToGallery(false), 1500);
   }

   // Depends on paramValues too: some params reshape the graph itself (e.g.
   // recursive's depth changes how many Subdivide nodes appear).
   const { nodes: rawNodes, edges } = useMemo(
      () => buildWorkflow(selectedId, paramValues),
      [selectedId, paramValues]
   );

   const nodes = useMemo(
      () =>
         rawNodes.map((node, index) => ({
            ...node,
            data: {
               ...node.data,
               params: node.data.params.map((p) => ({
                  ...p,
                  value: paramValues[p.param] ?? p.value,
                  ...(p.onValue ? { onValue: p.onValue(paramValues) } : {}),
               })),
               onParamChange: (key, value) => setParamValues((prev) => ({ ...prev, [key]: value })),
               selected: index === selectedIndex,
               exportActions:
                  node.data.nodeType === "render"
                     ? [
                          { label: "Export SVG", onClick: () => exportSvg(selectedEntry, paramValues) },
                          { label: "Export PNG", onClick: () => exportPng(selectedEntry, paramValues) },
                          {
                             label: justAddedToGallery ? "Added ✓" : "Add to Gallery",
                             onClick: handleAddToGallery,
                          },
                       ]
                     : undefined,
            },
         })),
      [rawNodes, paramValues, selectedIndex, selectedEntry, justAddedToGallery]
   );

   // Directional arrows show data flow source -> target; the edge feeding
   // the currently selected node is animated as a second visual cue.
   const styledEdges = useMemo(
      () =>
         edges.map((edge, i) => ({
            ...edge,
            markerEnd: { type: MarkerType.ArrowClosed },
            animated: i === selectedIndex - 1,
         })),
      [edges, selectedIndex]
   );

   const selectedNode = nodes[selectedIndex] ?? null;
   const isRenderStep = selectedNode?.data.nodeType === "render";
   // No selection and the final render step both show the pattern's actual
   // final output.
   const showingFinalRender = isRenderStep || !selectedNode;

   function selectByNodeId(nodeId) {
      const idx = nodes.findIndex((n) => n.id === nodeId);
      if (idx !== -1) setSelectedIndex(idx);
   }

   return (
      <div className="app">
         <header className="menu-bar">
            <span className="menu-bar-title">Pattinator</span>
            <div className="menu-bar-actions">
               <button
                  className="btn menu-bar-node-library menu-bar-doc-library"
                  onClick={() => setShowNodeLibrary(true)}
               >
                  Documentation Library
               </button>
               <button className="btn menu-bar-node-library menu-bar-gallery" onClick={() => setShowGallery(true)}>
                  Gallery
               </button>
               <button className="btn menu-bar-node-library" onClick={() => setShowWelcome(true)}>
                  Tutorial
               </button>
               <div className="menu-bar-dropdown" ref={evaluationMenuRef}>
                  <button
                     className="btn menu-bar-evaluation"
                     onClick={() => setShowEvaluationMenu((open) => !open)}
                     aria-haspopup="true"
                     aria-expanded={showEvaluationMenu}
                  >
                     Evaluation
                  </button>
                  {showEvaluationMenu && (
                     <div className="menu-bar-dropdown-panel" role="menu">
                        <button
                           className="menu-bar-dropdown-item"
                           role="menuitem"
                           onClick={() => {
                              setShowTest1(true);
                              setShowEvaluationMenu(false);
                           }}
                        >
                           Test 1
                        </button>
                        <button
                           className="menu-bar-dropdown-item"
                           role="menuitem"
                           onClick={() => {
                              setShowTest2(true);
                              setShowEvaluationMenu(false);
                           }}
                        >
                           Test 2
                        </button>
                        <a
                           className="menu-bar-dropdown-item"
                           role="menuitem"
                           href={`${import.meta.env.BASE_URL}evaluation/study-results.html`}
                           target="_blank"
                           rel="noreferrer"
                           onClick={() => setShowEvaluationMenu(false)}
                        >
                           Study 1 Results
                        </a>
                        <a
                           className="menu-bar-dropdown-item"
                           role="menuitem"
                           href={`${import.meta.env.BASE_URL}evaluation/study2-results.html`}
                           target="_blank"
                           rel="noreferrer"
                           onClick={() => setShowEvaluationMenu(false)}
                        >
                           Study 2 Results
                        </a>
                     </div>
                  )}
               </div>
               <a
                  className="menu-bar-github"
                  href={GITHUB_REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="View source on GitHub"
                  title="View source on GitHub"
               >
                  <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true">
                     <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38
                        0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
                        -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07
                        -1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6
                        7.6 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82
                        1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2
                        0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                  </svg>
               </a>
            </div>
         </header>

         {showNodeLibrary && <NodeLibraryOverlay onClose={() => setShowNodeLibrary(false)} />}
         {showGallery && (
            <GalleryOverlay onClose={() => setShowGallery(false)} onLoad={handleLoadGalleryItem} />
         )}
         {showTest1 && <EvaluationOverlay study={1} onClose={() => setShowTest1(false)} />}
         {showTest2 && <EvaluationOverlay study={2} onClose={() => setShowTest2(false)} />}
         {showWelcome && (
            <Welcome
               onStartTour={() => {
                  setShowWelcome(false);
                  setShowOnboarding(true);
               }}
               onSkip={() => {
                  setShowWelcome(false);
                  markOnboardingSeen();
               }}
            />
         )}
         {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}

         <div className="app-layout">
            <aside className="left-column">
               <section
                  className={`layout-panel generator-selection${generatorPanelExpanded ? "" : " generator-selection-collapsed"}`}
               >
                  <h2 className="panel-title">Generator Selection</h2>
                  {generatorPanelExpanded ? (
                     <>
                        {[...REGISTRY_BY_CATEGORY.entries()].map(([category, entries]) => (
                           <div className="pattern-group" key={category}>
                              <h3 className="pattern-group-title">{category}</h3>
                              <ul className="pattern-list">
                                 {entries.map((entry) => (
                                    <li key={entry.id}>
                                       <button
                                          className={entry.id === selectedId ? "selected" : ""}
                                          onClick={() => {
                                             setSelectedId(entry.id);
                                             setGeneratorPanelExpanded(false);
                                          }}
                                       >
                                          <span className="pattern-name">{entry.name}</span>
                                       </button>
                                    </li>
                                 ))}
                              </ul>
                           </div>
                        ))}
                     </>
                  ) : (
                     <div className="generator-selection-collapsed-row">
                        <span className="pattern-name">{selectedEntry.name}</span>
                        <button className="btn" onClick={() => setGeneratorPanelExpanded(true)}>
                           Change Pattern
                        </button>
                     </div>
                  )}
               </section>

               {/* Also serves as the final-render preview (Visual Example
                   already shows it — see PatternDocumentation.jsx). */}
               <PatternDocumentation
                  entry={selectedEntry}
                  generator={selectedEntry.generator}
                  params={paramValues}
                  minimised={generatorPanelExpanded}
               />
            </aside>

            <DocumentationPanel selectedNode={selectedNode} generator={selectedEntry.generator} />

            <section className="layout-panel canvas-panel">
               {/* Title, size, "Showing" status, and zoom controls share one
                   sticky row: left group wraps, zoom controls stay pinned right. */}
               <div className="canvas-header-sticky">
                  <div className="canvas-header-row">
                     <div className="canvas-header-left">
                        <h2 className="panel-title">Canvas</h2>
                        <span className="canvas-size-inline">{CANVAS_LABEL}</span>
                        {/* States which stage is displayed, since the canvas
                            image changes both from param edits and node
                            selection — styled subtly, below the panel title. */}
                        <span className="canvas-showing-label">
                           Showing: {showingFinalRender ? "Final Render" : `${selectedNode.data.label} stage output`}
                           {!showingFinalRender && (
                              <span className="workspace-size-label"> · Workspace {CANVAS_LABEL}</span>
                           )}
                        </span>
                     </div>
                     <div className="canvas-zoom-controls">
                        <button
                           className="btn"
                           onClick={() => setCanvasZoom((z) => Math.max(CANVAS_ZOOM_MIN, z - 0.25))}
                           disabled={canvasZoom <= CANVAS_ZOOM_MIN}
                           aria-label="Zoom out"
                           title="Zoom out"
                        >
                           −
                        </button>
                        <button
                           className="btn canvas-zoom-value"
                           onClick={() => setCanvasZoom(1)}
                           title="Reset zoom to fit"
                           aria-label={`Reset zoom to fit (currently ${Math.round(canvasZoom * 100)}%)`}
                        >
                           {Math.round(canvasZoom * 100)}%
                        </button>
                        <button
                           className="btn"
                           onClick={() => setCanvasZoom((z) => Math.min(CANVAS_ZOOM_MAX, z + 0.25))}
                           disabled={canvasZoom >= CANVAS_ZOOM_MAX}
                           aria-label="Zoom in"
                           title="Zoom in"
                        >
                           +
                        </button>
                     </div>
                  </div>
               </div>
               <div className={`render-panel-body canvas-zoom-wrap${showingFinalRender ? "" : " render-panel-body-boxed"}`}>
                  <div className="canvas-zoom-scale" style={{ "--canvas-zoom": canvasZoom }}>
                     <PatternCanvas entry={selectedEntry} params={paramValues} node={selectedNode} />
                  </div>
               </div>

               <div className="algorithm-workflow">
                  {/* Pattern name already shown in Generator Selection, so only
                      node count is repeated here, inline next to the title. */}
                  <div className="workflow-header-row">
                     <h2 className="panel-title">
                        Visual Algorithm Workflow <span className="panel-title-note">(NODES)</span>
                     </h2>
                     <span className="canvas-size-inline">
                        {nodes.length} nodes ({selectedEntry.generator}.js)
                     </span>
                  </div>
                  <div className="category-legend">
                     {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <span className="category-legend-item" key={key}>
                           <span className="category-legend-swatch" style={{ background: CATEGORY_COLOURS[key] }} />
                           {label}
                        </span>
                     ))}
                  </div>
                  <ReactFlow
                     key={selectedId}
                     nodes={nodes}
                     edges={styledEdges}
                     nodeTypes={nodeTypes}
                     fitView
                     nodesDraggable
                     nodesConnectable={false}
                     elementsSelectable={false}
                     onNodeClick={(_, node) => selectByNodeId(node.id)}
                     // fitView (above) only fits once, synchronously on init —
                     // on the very first mount the .algorithm-workflow strip's
                     // sticky/flex layout can still be settling, so ReactFlow
                     // measures a not-yet-final (sometimes zero-size) container
                     // and fits nodes outside the visible area or scales them
                     // away entirely. A warm pattern switch (remounting via
                     // `key`) settles within one frame, but a genuinely cold
                     // load (first open, a duplicated tab — CSS/fonts not
                     // necessarily applied yet when this JS runs) isn't
                     // guaranteed to, and how long it takes isn't predictable
                     // (network/CPU dependent) — a page refresh "fixes" it
                     // simply because the browser cache makes the next load
                     // warm. Rather than guess a single delay, retry fitView
                     // at several increasing intervals so it self-corrects
                     // once layout actually has settled, whenever that is.
                     onInit={(instance) => {
                        const refit = () => instance.fitView();
                        requestAnimationFrame(refit);
                        [100, 300, 800, 1500].forEach((ms) => setTimeout(refit, ms));
                     }}
                  >
                     <Background />
                     <Controls />
                  </ReactFlow>

                  {/* Sits with the graph it controls, not a full-width footer. */}
                  <div className="workflow-controls-bar">
                     <div className="status-section step-controls">
                        <button
                           className="btn"
                           disabled={selectedIndex <= -1}
                           onClick={() => setSelectedIndex((i) => Math.max(-1, i - 1))}
                        >
                           ← Prev
                        </button>
                        <button
                           className="btn"
                           disabled={selectedIndex >= nodes.length - 1}
                           onClick={() => setSelectedIndex((i) => Math.min(nodes.length - 1, i + 1))}
                        >
                           Next →
                        </button>
                        <span className="step-indicator">
                           {selectedNode
                              ? `Step ${selectedIndex + 1} of ${nodes.length} — ${selectedNode.data.label}`
                              : "Pattern overview — select a node to step through the pipeline"}
                        </span>
                     </div>
                     <div className="status-section">
                        <button
                           className="btn"
                           onClick={() => setParamValues(defaultParams(selectedEntry))}
                           title="Reset every parameter of the current pattern back to its default value"
                        >
                           Reset to Defaults
                        </button>
                     </div>
                  </div>
               </div>
            </section>
         </div>
      </div>
   );
}
