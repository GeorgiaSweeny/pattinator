/*
========================================
ESCHER TYPE I (TRANSLATION) TESSELLATION
========================================
* Tiles the plane by pure X/Y translation.
* Opposite edges are congruent deformations, so tiles interlock perfectly.
*
* Reference:
*   NGV Digital Creatives: Tessellate by Code Workshop Instructions
*   Escher x Nendo: Between Two Worlds, National Gallery of Victoria, 2018–19
*   https://www.ngv.vic.gov.au/wp-content/uploads/2019/01/
*     NGV-Digital-Creatives-Tessellate-by-Code-Workshop-Instructions.pdf
*
* Composition: Base Tile (tileSize) -> Edge Deformation (bump) -> Colour Mapping.
* See docs/generators/escher.md for the construction rationale and prior art.
*
* The deformation is periodic with period S, so the right edge of any tile is
* exactly the left edge of its right neighbour (translated S in x) — tiles
* always interlock regardless of amplitude. Amplitude is clamped to 0.38*S,
* comfortably under the S/2 point where a tile would start overlapping itself.
*/
import { bump } from "./lib/edgeDeformation.js";
import { toneSet } from "./lib/colourMapping.js";

export function escher(x, y, params) {
   const { tileSize = 60, bumpAmp = 10, bumpType = "wave", tones = "2" } = params;

   const S = tileSize;
   const A = Math.min(bumpAmp, S * 0.38);
   const shades = toneSet(tones);

   const normY = (((y % S) + S) % S) / S;
   const normX = (((x % S) + S) % S) / S;

   const dx = A * bump(normY, bumpType);
   const dy = A * bump(normX, bumpType);

   const col = Math.floor((x - dx) / S);
   const row = Math.floor((y - dy) / S);

   const idx = (((col + row) % shades.length) + shades.length) % shades.length;
   return shades[idx];
}
