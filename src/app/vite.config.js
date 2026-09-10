import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// server.fs.allow reaches back into ../generators/lib and ../patternRegistry.js
// (which this app imports directly rather than duplicating) and ../../docs/nodes
// (raw-imported by docsContent.js for the Node Library overlay, rather than
// transcribing docs/nodes/*.md into a second copy inside src/app).
//
// test.environment: "jsdom" (added 2026-08-21) — the pre-existing pure-logic
// test files (workflows.test.js, nodeDocs.test.js, stagePreview.test.js,
// evaluation/*.test.js) don't need a DOM and pass under either environment;
// jsdom is required for the new component-level tests (App.test.jsx etc.)
// that actually render React components via @testing-library/react.
// base: "/pattinator/" makes built asset URLs resolve correctly under
// GitHub Pages project-site hosting (only "build" needs this — "serve"
// must stay at "/" for the dev server).
export default defineConfig(({ command }) => ({
   base: command === "build" ? "/pattinator/" : "/",
   plugins: [react()],
   server: {
      fs: { allow: ["../.."] },
   },
   test: {
      environment: "jsdom",
      setupFiles: ["./src/test-setup.js"],
   },
}));
