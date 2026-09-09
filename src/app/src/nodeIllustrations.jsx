/*
========================================
NODE ILLUSTRATIONS
========================================
* Small, generic diagrams for the "Visual Example" block — one per node
* type in workflows.js's NODE_LIBRARY, illustrating what the OPERATION does
* in the abstract (dashed reference shape + solid accent result shape), not
* a render of the currently-selected pattern. Hand-drawn plain SVG, colours
* matched to App.css's palette.
*/

const STROKE = "#374151";
const STROKE_SOFT = "#9ca3af";
const ACCENT = "#2563eb";
const NOISE_BLUR_FILTER_ID = "node-illustration-noise-blur";

function range(n) {
   return Array.from({ length: n }, (_, i) => i);
}

const ILLUSTRATIONS = {
   // The algorithm's own coordinate space (dashed, larger/different) vs
   // the finite viewport the learner actually sees (solid, inset).
   workspace: () => (
      <>
         <rect x="8" y="8" width="104" height="104" fill="none" stroke={STROKE_SOFT} strokeWidth="2" strokeDasharray="5 4" />
         <rect x="34" y="34" width="52" height="52" fill="none" stroke={ACCENT} strokeWidth="2.5" />
      </>
   ),

   // One fixed value (solid dot) determining an entire reproducible
   // sequence (dashed rings radiating from it).
   seed: () => (
      <>
         <circle cx="60" cy="60" r="42" fill="none" stroke={STROKE_SOFT} strokeWidth="1.5" strokeDasharray="3 4" />
         <circle cx="60" cy="60" r="26" fill="none" stroke={STROKE_SOFT} strokeWidth="1.5" strokeDasharray="3 4" />
         <circle cx="60" cy="60" r="5" fill={ACCENT} />
      </>
   ),

   // Multiple scattered starting points (Voronoi cell centres, etc).
   seedPoints: () => (
      <>
         {[[30, 35], [70, 25], [50, 60], [90, 55], [25, 80], [65, 92], [95, 88], [45, 42]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4.5" fill={ACCENT} />
         ))}
      </>
   ),

   // The plain starting shape, before any deformation or indexing.
   baseGeometry: () => <rect x="25" y="25" width="70" height="70" fill="none" stroke={ACCENT} strokeWidth="2.5" />,

   // A regular, repeating lattice of positions.
   grid: () => (
      <>
         {range(4).map((row) =>
            range(4).map((col) => (
               <circle key={`${row}-${col}`} cx={20 + col * 27} cy={20 + row * 27} r="3" fill={STROKE} />
            ))
         )}
      </>
   ),

   // A compass-style construction: dashed reference circle, centre, and
   // one radius drawn out to a marked point on the circumference.
   constructionCircle: () => (
      <>
         <circle cx="60" cy="60" r="40" fill="none" stroke={STROKE_SOFT} strokeWidth="1.5" strokeDasharray="4 3" />
         <line x1="60" y1="60" x2="100" y2="60" stroke={ACCENT} strokeWidth="2" />
         <circle cx="60" cy="60" r="3" fill={STROKE} />
         <circle cx="100" cy="60" r="3.5" fill={ACCENT} />
      </>
   ),

   // A circle split into equal angular wedges by radial lines.
   radialDivisions: () => (
      <>
         <circle cx="60" cy="60" r="42" fill="none" stroke={STROKE} strokeWidth="2" />
         {range(8).map((i) => {
            const rad = (i * 45 * Math.PI) / 180;
            const x2 = 60 + 42 * Math.cos(rad);
            const y2 = 60 + 42 * Math.sin(rad);
            return <line key={i} x1="60" y1="60" x2={x2} y2={y2} stroke={STROKE} strokeWidth="1.5" />;
         })}
         <circle cx="60" cy="60" r="3" fill={ACCENT} />
      </>
   ),

   // Many simple, smoothly-varying samples blended together — the
   // conventional soft organic blob/cloud look of Perlin-style noise
   // (confirmed against how it's textbook-drawn: a greyscale/blurred
   // texture, not discrete bars), built from overlapping blurred circles
   // rather than sharp shapes.
   noise: () => (
      <g filter={`url(#${NOISE_BLUR_FILTER_ID})`}>
         {[[38, 42, 20], [66, 32, 24], [82, 58, 17], [48, 72, 22], [72, 84, 15], [30, 82, 14], [58, 52, 18]].map(
            ([x, y, r], i) => (
               <circle key={i} cx={x} cy={y} r={r} fill={ACCENT} opacity="0.5" />
            )
         )}
      </g>
   ),

   // Value falling off with distance from a point — concentric rings,
   // fading outward.
   distanceField: () => (
      <>
         {[16, 30, 44].map((r) => (
            <circle key={r} cx="60" cy="60" r={r} fill="none" stroke={ACCENT} strokeWidth="1.5" strokeDasharray="3 3" opacity={1 - r / 55} />
         ))}
         <circle cx="60" cy="60" r="4" fill={STROKE} />
      </>
   ),

   // Every position assigned one of a small fixed set of discrete classes.
   latticeIndex: () => {
      const palette = ["#1d4ed8", "#3b82f6", "#93c5fd", "#111827"];
      return (
         <>
            {range(4).map((row) =>
               range(4).map((col) => (
                  <rect
                     key={`${row}-${col}`}
                     x={20 + col * 20}
                     y={20 + row * 20}
                     width="18"
                     height="18"
                     fill={palette[(row + col) % palette.length]}
                  />
               ))
            )}
         </>
      );
   },

   // A smooth periodic curve.
   waveform: () => {
      const points = range(40)
         .map((i) => {
            const x = 10 + i * (100 / 39);
            const y = 60 + 30 * Math.sin((i / 39) * Math.PI * 3);
            return `${x},${y}`;
         })
         .join(" ");
      return <polyline points={points} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" />;
   },

   // The same rule applied at a smaller scale, repeatedly — a 3x3 grid
   // with its centre removed, one step of a Sierpinski-carpet-style split.
   subdivide: () => (
      <>
         <rect x="15" y="15" width="90" height="90" fill="none" stroke={STROKE_SOFT} strokeWidth="1.5" strokeDasharray="3 3" />
         {range(3).map((row) =>
            range(3).map((col) => {
               if (row === 1 && col === 1) return null;
               return (
                  <rect
                     key={`${row}-${col}`}
                     x={15 + col * 30}
                     y={15 + row * 30}
                     width="28"
                     height="28"
                     fill={ACCENT}
                     opacity="0.85"
                  />
               );
            })
         )}
      </>
   ),

   // A boundary bulging out on one side and notched in on the opposite
   // side, so it interlocks with a neighbouring copy of itself.
   edgeDeformation: () => (
      <path
         d="M30,20 L90,20 Q100,20 100,30 L100,50 Q112,60 100,70 L100,90 Q100,100 90,100
            L30,100 Q20,100 20,90 L20,60 Q8,60 20,50 L20,30 Q20,20 30,20 Z"
         fill={ACCENT}
         opacity="0.18"
         stroke={ACCENT}
         strokeWidth="2.5"
      />
   ),

   // A computed value mapped through a fixed ramp to a visible colour.
   colourMapping: () => (
      <>
         {["#ffffff", "#bfdbfe", "#60a5fa", "#2563eb", "#1e3a8a"].map((c, i) => (
            <rect key={c} x={15 + i * 18} y="45" width="16" height="30" fill={c} stroke="#e5e7eb" strokeWidth="1" />
         ))}
      </>
   ),

   // The finished, framed output — an "image" glyph rather than an
   // abstract diagram, since this stage's whole job is "here's the result."
   render: () => (
      <>
         <rect x="18" y="24" width="84" height="72" rx="4" fill="none" stroke={STROKE} strokeWidth="2.5" />
         <circle cx="40" cy="46" r="7" fill={ACCENT} />
         <path d="M18,90 L48,60 L68,78 L88,54 L102,72 L102,90 Z" fill={ACCENT} opacity="0.35" />
      </>
   ),
};

export function hasIllustration(nodeType) {
   return nodeType in ILLUSTRATIONS;
}

export default function NodeIllustration({ nodeType }) {
   const draw = ILLUSTRATIONS[nodeType];
   if (!draw) return null;
   return (
      <svg viewBox="0 0 120 120" className="node-illustration" role="img" aria-label={`Diagram of the ${nodeType} operation`}>
         {nodeType === "noise" && (
            <defs>
               <filter id={NOISE_BLUR_FILTER_ID}>
                  <feGaussianBlur stdDeviation="4" />
               </filter>
            </defs>
         )}
         {draw()}
      </svg>
   );
}
