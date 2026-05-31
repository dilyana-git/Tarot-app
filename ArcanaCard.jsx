import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from "react";

/* =========================================================================
   ARCANA — interactive card prototype  (+ mosaic-dissolve transition)
   - Move pointer / drag to TILT in 3D; gold tesserae catch a moving sweep
   - Click / Space to FLIP to the card's meaning
   - ← / → or the side cards to traverse — the card SHATTERS into its
     own tesserae, they swirl outward, and the next card reassembles
   The art is stylized placeholder so the interaction reads — in production
   you swap the SVG builders below for your real mosaic illustrations.
   ========================================================================= */

const CARDS = [
  {
    id: "world", roman: "XXI", num: "21", name: "THE WORLD",
    keywords: ["COMPLETION", "INTEGRATION", "FULFILMENT"], element: "EARTH", seed: 7,
    meaning:
      "The journey closes and completes. Integration, fulfilment, and the quiet mastery of having become whole — before the wheel turns once more and the wanderer sets out again.",
  },
  {
    id: "fool", roman: "0", num: "00", name: "THE FOOL",
    keywords: ["BEGINNINGS", "SPONTANEITY", "INNOCENCE"], element: "AIR", seed: 19,
    meaning:
      "At the threshold of a new cycle, the Fool steps into open air — a leap taken not from recklessness but from trust that the ground will rise to meet the foot.",
  },
  {
    id: "magician", roman: "I", num: "01", name: "THE MAGICIAN",
    keywords: ["WILL", "MANIFESTATION", "POWER"], element: "AIR", seed: 31,
    meaning:
      "All the elements lie ready upon the table; the will to shape them is yours. The Magician is the channel through which intention becomes form. As above, so below.",
  },
];

/* ---------- deterministic RNG + stars ---------- */
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function makeStars(seed, count) {
  const r = rng(seed); const a = [];
  for (let i = 0; i < count; i++)
    a.push({
      x: +(r() * 320).toFixed(1), y: +(r() * 470).toFixed(1),
      r: +(0.35 + r() * 1.5).toFixed(2), o: +(0.22 + r() * 0.7).toFixed(2),
    });
  return a;
}
function starsSVG(seed) {
  return makeStars(seed, 56).map((s) => {
    const halo = s.r > 1.15
      ? `<circle cx="${s.x}" cy="${s.y}" r="${(s.r * 3).toFixed(2)}" fill="#f6e4b0" opacity="${(s.o * 0.18).toFixed(3)}"/>`
      : "";
    return `${halo}<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="#f6e4b0" opacity="${s.o}"/>`;
  }).join("");
}
const gold = (id) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4e2a8"/><stop offset=".5" stop-color="#cda14e"/><stop offset="1" stop-color="#8a6a2c"/></linearGradient>`;
const SVG_OPEN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 470" preserveAspectRatio="xMidYMid slice">`;

/* ============================ CARD ART (strings) ======================== */
function foolSVG() {
  return `${SVG_OPEN}
<defs>
<linearGradient id="f-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1736"/><stop offset=".55" stop-color="#070b1c"/><stop offset="1" stop-color="#05060e"/></linearGradient>
<radialGradient id="f-dawn" cx="62%" cy="24%" r="55%"><stop offset="0" stop-color="#f6dfa0" stop-opacity=".55"/><stop offset="40%" stop-color="#c9962f" stop-opacity=".16"/><stop offset="100%" stop-color="#c9962f" stop-opacity="0"/></radialGradient>
${gold("f-gold")}
<linearGradient id="f-cloak" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7c878"/><stop offset=".45" stop-color="#7d83a6"/><stop offset="1" stop-color="#223a66"/></linearGradient>
<radialGradient id="f-vig" cx="50%" cy="44%" r="62%"><stop offset="56%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".6"/></radialGradient>
</defs>
<rect width="320" height="470" fill="url(#f-sky)"/>
<ellipse cx="200" cy="116" rx="150" ry="120" fill="url(#f-dawn)"/>
${starsSVG(19)}
<path d="M0,470 L0,402 C40,398 60,392 96,408 C130,422 150,408 196,404 C235,400 270,416 320,398 L320,470 Z" fill="url(#f-gold)"/>
<path d="M0,470 L0,432 C60,426 120,438 196,432 C250,428 290,438 320,430 L320,470 Z" fill="#000" opacity=".22"/>
<circle cx="44" cy="432" r="1.7" fill="#f6e4b0" opacity=".7"/><circle cx="78" cy="446" r="1.7" fill="#f6e4b0" opacity=".7"/><circle cx="150" cy="438" r="1.7" fill="#f6e4b0" opacity=".7"/><circle cx="214" cy="446" r="1.7" fill="#f6e4b0" opacity=".7"/><circle cx="262" cy="436" r="1.7" fill="#f6e4b0" opacity=".7"/><circle cx="300" cy="450" r="1.7" fill="#f6e4b0" opacity=".7"/>
<path d="M176,150 C168,150 162,156 160,168 C156,196 150,250 150,300 C150,330 140,352 96,372 C76,381 70,388 86,392 C120,400 168,404 196,402 C240,399 262,388 244,372 C214,348 214,330 214,300 C214,250 210,196 206,168 C204,156 198,150 190,150 Z" fill="url(#f-cloak)"/>
<path d="M206,168 C210,196 214,250 214,300 C214,330 214,350 244,372" fill="none" stroke="#f4e2a8" stroke-opacity=".5" stroke-width="1.6"/>
<ellipse cx="183" cy="139" rx="12.5" ry="14" fill="#ecc97d"/>
<path d="M171,135 C174,127 192,127 195,136 C190,132 176,132 171,135 Z" fill="#b79447"/>
<line x1="206" y1="176" x2="252" y2="118" stroke="#e8c977" stroke-width="2.6" stroke-linecap="round"/>
<circle cx="255" cy="113" r="7" fill="#d9b65f"/>
<path d="M249,108 q6,-7 12,0 q-6,5 -12,0 Z" fill="#c79f4e"/>
<path d="M104,393 C100,387 105,382 112,383 C115,378 122,378 124,383 C131,382 136,386 134,392 C140,393 138,398 132,398 L110,398 C104,398 102,395 104,393 Z" fill="#f1ece0"/>
<path d="M123,383 l5,-5 l1,7 Z" fill="#f1ece0"/>
<path d="M104,393 l-7,-1 l6,4 Z" fill="#f1ece0"/>
<circle cx="132" cy="389" r="1.3" fill="#3a3a3a"/>
<rect x="115" y="390" width="9" height="2.3" rx="1.1" fill="#9c2b2b"/>
<rect width="320" height="470" fill="url(#f-vig)"/>
</svg>`;
}

function magicianSVG() {
  const suits = `
<circle cx="122" cy="349" r="5" fill="none" stroke="#f6e4b0" stroke-width="1.3"/><path d="M122,345 L125.8,352 L117.3,347.8 L126.7,347.8 L118.2,352 Z" fill="none" stroke="#f6e4b0" stroke-width="0.9"/>
<path d="M143,345 a5,4 0 0 0 10,0 Z M148,349 v4 M145,353 h6" fill="none" stroke="#f6e4b0" stroke-width="1.3" stroke-linecap="round"/>
<path d="M176,344 v9 M172,348 h8" fill="none" stroke="#f6e4b0" stroke-width="1.3" stroke-linecap="round"/>
<line x1="198" y1="353" x2="206" y2="344" stroke="#f6e4b0" stroke-width="1.3" stroke-linecap="round"/>`;
  return `${SVG_OPEN}
<defs>
<linearGradient id="m-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1140"/><stop offset=".55" stop-color="#0a0720"/><stop offset="1" stop-color="#06040e"/></linearGradient>
<radialGradient id="m-neb" cx="50%" cy="26%" r="55%"><stop offset="0" stop-color="#7d4fd0" stop-opacity=".4"/><stop offset="100%" stop-color="#7d4fd0" stop-opacity="0"/></radialGradient>
<linearGradient id="m-robe" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7c878"/><stop offset=".45" stop-color="#7a5bb0"/><stop offset="1" stop-color="#2a1c4a"/></linearGradient>
${gold("m-gold")}
<radialGradient id="m-vig" cx="50%" cy="46%" r="62%"><stop offset="56%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".62"/></radialGradient>
</defs>
<rect width="320" height="470" fill="url(#m-sky)"/>
<ellipse cx="160" cy="120" rx="155" ry="135" fill="url(#m-neb)"/>
${starsSVG(31)}
<path d="M140,116 C140,104 152,104 160,116 C168,128 180,128 180,116 C180,104 168,104 160,116 C152,128 140,128 140,116 Z" fill="none" stroke="#f4e2a8" stroke-width="2.4" stroke-opacity=".92"/>
<line x1="205" y1="118" x2="205" y2="78" stroke="#f4e2a8" stroke-width="2.6" stroke-linecap="round"/>
<circle cx="205" cy="74" r="12" fill="#f6e4b0" opacity=".25"/>
<circle cx="205" cy="74" r="5.5" fill="#f6e4b0"/>
<path d="M176,176 C186,168 196,150 205,122 C209,124 211,126 213,124 C207,154 197,178 185,190 Z" fill="url(#m-robe)"/>
<path d="M160,150 C150,150 146,158 145,172 C141,210 132,300 120,360 C116,380 130,386 160,386 C190,386 204,380 200,360 C188,300 179,210 175,172 C174,158 170,150 160,150 Z" fill="url(#m-robe)"/>
<path d="M147,178 C140,196 130,236 120,262 C118,266 122,270 126,266 C140,238 150,206 156,186 Z" fill="url(#m-robe)"/>
<ellipse cx="160" cy="139" rx="12.5" ry="14" fill="#ecc97d"/>
<rect x="100" y="356" width="120" height="15" rx="3" fill="url(#m-gold)"/>
<rect x="100" y="356" width="120" height="15" rx="3" fill="#000" opacity=".12"/>
${suits}
<rect width="320" height="470" fill="url(#m-vig)"/>
</svg>`;
}

function worldSVG() {
  const cx = 160, cy = 236, rx = 96, ry = 150;
  let rays = "";
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    rays += `<line x1="${(cx + Math.cos(a) * 30).toFixed(1)}" y1="${(cy + Math.sin(a) * 40).toFixed(1)}" x2="${(cx + Math.cos(a) * 168).toFixed(1)}" y2="${(cy + Math.sin(a) * 220).toFixed(1)}" stroke="#f6e4b0" stroke-width="0.7" opacity=".10"/>`;
  }
  let leaves = "";
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const px = cx + Math.cos(a) * rx, py = cy + Math.sin(a) * ry, nx = Math.cos(a), ny = Math.sin(a);
    leaves += `<line x1="${(px - nx * 5).toFixed(1)}" y1="${(py - ny * 5).toFixed(1)}" x2="${(px + nx * 7).toFixed(1)}" y2="${(py + ny * 7).toFixed(1)}" stroke="#cda14e" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`;
  }
  return `${SVG_OPEN}
<defs>
<linearGradient id="w-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#08231c"/><stop offset=".55" stop-color="#061018"/><stop offset="1" stop-color="#04060c"/></linearGradient>
${gold("w-gold")}
<radialGradient id="w-burst" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f6e4b0" stop-opacity=".22"/><stop offset="100%" stop-color="#f6e4b0" stop-opacity="0"/></radialGradient>
<radialGradient id="w-vig" cx="50%" cy="48%" r="62%"><stop offset="56%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".62"/></radialGradient>
</defs>
<rect width="320" height="470" fill="url(#w-sky)"/>
${starsSVG(7)}
<ellipse cx="160" cy="236" rx="150" ry="180" fill="url(#w-burst)"/>
${rays}
<ellipse cx="160" cy="236" rx="96" ry="150" fill="none" stroke="url(#w-gold)" stroke-width="9" opacity=".92"/>
${leaves}
<path d="M148,86 l-10,12 l12,4 Z M172,86 l10,12 l-12,4 Z" fill="#cda14e" opacity=".85"/>
<path d="M148,386 l-10,-12 l12,-4 Z M172,386 l10,-12 l-12,-4 Z" fill="#cda14e" opacity=".85"/>
<ellipse cx="160" cy="158" rx="11" ry="12.5" fill="#ecc97d"/>
<path d="M160,170 C153,170 150,178 151,190 C153,214 150,240 150,262 C150,284 146,296 144,312 C143,318 149,320 152,314 C156,298 159,284 160,268 C161,284 162,300 168,316 C171,322 177,318 175,312 C171,294 169,282 169,260 C169,238 168,214 169,190 C170,178 167,170 160,170 Z" fill="url(#w-gold)"/>
<path d="M154,196 C142,192 126,182 116,170 C113,172 113,176 116,178 C128,190 142,200 152,206 Z" fill="url(#w-gold)"/>
<path d="M166,198 C178,194 192,188 202,178 C205,180 205,184 202,186 C190,196 178,204 168,208 Z" fill="url(#w-gold)"/>
<line x1="112" y1="168" x2="112" y2="152" stroke="#f6e4b0" stroke-width="2.4" stroke-linecap="round"/>
<line x1="206" y1="176" x2="210" y2="162" stroke="#f6e4b0" stroke-width="2.4" stroke-linecap="round"/>
<path d="M146,206 C156,224 168,250 176,286" fill="none" stroke="#f6e4b0" stroke-width="2" stroke-linecap="round" opacity=".55"/>
<g opacity=".85">
<path d="M40,44 l3,8 l8,1 l-6,5 l2,8 l-7,-5 l-7,5 l2,-8 l-6,-5 l8,-1 Z" fill="#cda14e"/>
<path d="M272,40 q8,4 14,0 q-7,8 -14,8 q-7,0 -14,-8 q6,4 14,0 Z" fill="#cda14e"/>
<g fill="none" stroke="#cda14e" stroke-width="2"><circle cx="46" cy="428" r="6"/><path d="M40,420 l4,4 M52,420 l-4,4"/></g>
<g fill="none" stroke="#cda14e" stroke-width="2"><circle cx="274" cy="428" r="6"/><path d="M268,427 l-4,-2 M268,431 l-4,2 M280,427 l4,-2 M280,431 l4,2"/></g>
</g>
<rect width="320" height="470" fill="url(#w-vig)"/>
</svg>`;
}

function artSVG(id) {
  if (id === "magician") return magicianSVG();
  if (id === "world") return worldSVG();
  return foolSVG();
}
const dataUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/* ---------- the mosaic edge.
   The CENTRE is a single continuous image (no tiles). Only a band of
   EDGE_RINGS rings around the perimeter is broken into tesserae that fade,
   jitter and go sparse toward the edge, so the card erodes into the cosmos
   instead of ending at a hard rectangle.
   The full grid is still computed (interior tiles kept SOLID) because the
   navigation dissolve shatters the whole card — but at rest only the band
   tiles are drawn, over a continuous core. ------------------------------- */
const COLS = 24, ROWS = 35, GAP = 0.9, EDGE_RINGS = 5;
function buildMosaic(cw, ch) {
  if (!cw || !ch) return { tiles: [], cellW: 0, cellH: 0 };
  const cellW = cw / COLS, cellH = ch / ROWS;
  const cx = cw / 2, cy = ch / 2, maxD = Math.hypot(cw, ch) / 2;
  const r = rng(2025);
  const tiles = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const ringX = Math.min(col, COLS - 1 - col), ringY = Math.min(row, ROWS - 1 - row);
      const ring = Math.min(ringX, ringY);
      // Organic dissolve: a continuous probability across the band (not clean
      // rings). Survival + opacity + jitter all driven by depth-from-edge plus
      // per-tile noise, so tesserae thin out delicately and irregularly.
      let omit = false, ho = 1, hx = 0, hy = 0, hr = 0;
      if (ring < EDGE_RINGS) {
        const t = ring / EDGE_RINGS;                 // 0 at the very edge → ~1 toward the core
        const pSurv = 0.02 + t * 1.12;               // outer: very sparse; inner: nearly full
        omit = r() > pSurv;
        ho = Math.max(0.07, Math.min(1, 0.1 + t * 0.98 + (r() - 0.5) * 0.24));
        const j = 1 - t;                             // outer fragments drift more
        hx = (r() - 0.5) * 6.5 * j; hy = (r() - 0.5) * 6.5 * j; hr = (r() - 0.5) * 18 * j;
      } else if (ring === EDGE_RINGS) {
        // quiet bridge ring: solid, tucks under the crumble and over the core edge
        ho = 1; hx = (r() - 0.5) * 0.7; hy = (r() - 0.5) * 0.7; hr = (r() - 0.5) * 1.4;
      } else {
        ho = 1; r(); r(); r(); // keep the sequence aligned for deterministic scatter
      }
      // scatter for the dissolve (direction applied at render)
      const tx = col * cellW + cellW / 2, ty = row * cellH + cellH / 2;
      const vx = tx - cx, vy = ty - cy, dist = Math.max(1, Math.hypot(vx, vy)), dn = dist / maxD;
      const ux = vx / dist, uy = vy / dist, pX = -uy, pY = ux;
      const R = 55 + dn * 80 + r() * 40, Sw = 42 + dn * 66;
      tiles.push({
        col, row, ring, omit,
        left: +(col * cellW + GAP / 2).toFixed(2), top: +(row * cellH + GAP / 2).toFixed(2),
        w: +(cellW - GAP).toFixed(2), h: +(cellH - GAP).toFixed(2),
        bgx: +(-(col * cellW + GAP / 2)).toFixed(2), bgy: +(-(row * cellH + GAP / 2)).toFixed(2),
        ho: +ho.toFixed(2), hx: +hx.toFixed(1), hy: +hy.toFixed(1), hr: +hr.toFixed(1),
        radx: +(ux * R).toFixed(1), rady: +(uy * R).toFixed(1),
        tanx: +(pX * Sw).toFixed(1), tany: +(pY * Sw).toFixed(1),
        sjx: +((r() - 0.5) * 22).toFixed(1), sjy: +((r() - 0.5) * 22).toFixed(1),
        baseRot: +(60 + dn * 130).toFixed(1), rotJit: +((r() - 0.5) * 64).toFixed(1),
        ds: +(0.3 + r() * 0.22).toFixed(2),
        do: Math.round((1 - dn) * 175), di: Math.round(dn * 205), // OUT peels edges-first; IN builds centre-first
      });
    }
  }
  return { tiles, cellW, cellH };
}

/* ---------- alchemical element glyphs ---------- */
function ElementGlyph({ kind = "AIR" }) {
  const c = { fill: "none", stroke: "currentColor", strokeWidth: 1.3, strokeLinejoin: "round" };
  if (kind === "EARTH")
    return (<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden><path d="M3 6 L21 6 L12 21 Z" {...c} /><line x1="7" y1="14.5" x2="17" y2="14.5" {...c} /></svg>);
  if (kind === "FIRE")
    return (<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden><path d="M3 19 L12 4 L21 19 Z" {...c} /></svg>);
  if (kind === "WATER")
    return (<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden><path d="M3 6 L21 6 L12 21 Z" {...c} /></svg>);
  return (<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden><path d="M3 19 L12 4 L21 19 Z" {...c} /><line x1="7" y1="13" x2="17" y2="13" {...c} /></svg>);
}

/* ================================ PAGE ================================== */
const T1 = 580, T2 = 1280, T3 = 1480; // out done / in done / overlay removed

export default function ArcanaCard() {
  const [index, setIndex] = useState(1);
  const [flipped, setFlipped] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, on: false });
  const [trans, setTrans] = useState(null); // {phase,mode,img,dir}
  const [size, setSize] = useState(() => {
    const w = Math.min(348, (typeof window !== "undefined" ? window.innerWidth : 1000) * 0.76);
    return { cw: Math.round(w), ch: Math.round(w * 470 / 320) };
  });
  const cardRef = useRef(null);
  const canvasRef = useRef(null);
  const busyRef = useRef(false);
  const timers = useRef([]);

  const card = CARDS[index];
  const n = CARDS.length;
  const prevI = (index - 1 + n) % n;
  const nextI = (index + 1) % n;
  const liveArt = useMemo(() => artSVG(card.id), [card.id]);
  const liveImg = useMemo(() => dataUrl(liveArt), [liveArt]);
  const mosaic = useMemo(() => buildMosaic(size.cw, size.ch), [size.cw, size.ch]);

  // Tesserae backgrounds read --img from CSS, so these elements are stable
  // across card changes AND tilt updates — memoized so tilt mousemoves don't
  // re-diff hundreds of tiny tiles.
  const restTiles = useMemo(() =>
    mosaic.tiles.map((t, i) => (t.omit || t.ring > EDGE_RINGS) ? null : (
      <div key={i} className="tile rest" style={{
        left: t.left + "px", top: t.top + "px", width: t.w + "px", height: t.h + "px",
        backgroundPosition: `${t.bgx}px ${t.bgy}px`,
        transform: `translate(${t.hx}px,${t.hy}px) rotate(${t.hr}deg)`,
        opacity: t.ho,
      }} />
    )), [mosaic]);

  const tMode = trans && trans.mode, tDir = trans && trans.dir;
  const overlayTiles = useMemo(() => {
    if (!tMode) return null;
    return mosaic.tiles.map((t, i) => {
      if (t.omit || t.ring > EDGE_RINGS) return null; // edge-only: centre is the core
      const dx = t.radx + tDir * t.tanx + t.sjx;
      const dy = t.rady + tDir * t.tany + t.sjy;
      const dr = tDir * t.baseRot + t.rotJit;
      return <div key={i} className={"tile " + tMode} style={{
        left: t.left + "px", top: t.top + "px", width: t.w + "px", height: t.h + "px",
        backgroundPosition: `${t.bgx}px ${t.bgy}px`,
        animationDelay: (tMode === "out" ? t.do : t.di) + "ms",
        "--hx": t.hx + "px", "--hy": t.hy + "px", "--hr": t.hr + "deg", "--ho": t.ho,
        "--dx": dx + "px", "--dy": dy + "px", "--dr": dr + "deg", "--ds": t.ds,
      }} />;
    });
  }, [mosaic, tMode, tDir]);

  /* measure the card so tesserae land on exact pixels (responsive) */
  useLayoutEffect(() => {
    const el = cardRef.current; if (!el) return;
    const apply = () => { const r = el.getBoundingClientRect(); if (r.width > 2) setSize({ cw: r.width, ch: r.height }); };
    apply();
    let ro;
    if ("ResizeObserver" in window) { ro = new ResizeObserver(apply); ro.observe(el); }
    else window.addEventListener("resize", apply);
    return () => { ro ? ro.disconnect() : window.removeEventListener("resize", apply); };
  }, []);

  /* fonts */
  useEffect(() => {
    const made = [];
    [["preconnect", "https://fonts.googleapis.com"], ["preconnect", "https://fonts.gstatic.com"]].forEach(([rel, href]) => {
      const l = document.createElement("link"); l.rel = rel; l.href = href; if (rel === "preconnect") l.crossOrigin = "";
      document.head.appendChild(l); made.push(l);
    });
    const css = document.createElement("link"); css.rel = "stylesheet";
    css.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap";
    document.head.appendChild(css); made.push(css);
    return () => made.forEach((l) => l.remove());
  }, []);

  /* background starfield */
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    let raf, w, h, dpr, stars = [], running = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const r = rng(99), count = Math.min(150, Math.round((w * h) / 9000));
      stars = Array.from({ length: count }, () => ({ x: r() * w, y: r() * h, r: 0.3 + r() * 1.4, a: 0.15 + r() * 0.55, sp: 0.4 + r() * 1.4, ph: r() * 6.28 }));
    };
    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const a = reduce ? s.a : s.a + Math.sin(t / 1000 * s.sp + s.ph) * 0.28;
        ctx.globalAlpha = Math.max(0, Math.min(1, a)); ctx.fillStyle = "#f6e4b0";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1; if (running && !reduce) raf = requestAnimationFrame(draw);
    };
    resize(); reduce ? draw(0) : (raf = requestAnimationFrame(draw));
    window.addEventListener("resize", resize);
    return () => { running = false; cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => clearTimers(), []);

  /* ---------------- the dissolve ---------------- */
  const dissolve = useCallback((target, dir) => {
    if (busyRef.current || target === index) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !size.cw) { setIndex(target); setFlipped(false); return; }

    busyRef.current = true;
    setFlipped(false);
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, on: false });
    setTrans({ phase: "out", mode: "out", img: dataUrl(artSVG(CARDS[index].id)), dir });

    clearTimers();
    timers.current.push(setTimeout(() => {
      setIndex(target);
      setTrans((p) => p && { ...p, phase: "in", mode: "in", img: dataUrl(artSVG(CARDS[target].id)) });
    }, T1));
    timers.current.push(setTimeout(() => setTrans((p) => p && { ...p, phase: "reveal" }), T2));
    timers.current.push(setTimeout(() => { setTrans(null); busyRef.current = false; }, T3));
  }, [index, size.cw]);

  /* keyboard */
  useEffect(() => {
    const onKey = (e) => {
      if (busyRef.current) return;
      if (e.key === "ArrowLeft") dissolve(prevI, -1);
      else if (e.key === "ArrowRight") dissolve(nextI, 1);
      else if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped((f) => !f); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevI, nextI, dissolve]);

  /* tilt */
  const move = (cx, cy) => {
    if (busyRef.current) return;
    const el = cardRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (cx - r.left) / r.width, py = (cy - r.top) / r.height, MAX = 15;
    setTilt({ rx: -(py - 0.5) * MAX, ry: (px - 0.5) * MAX, gx: px * 100, gy: py * 100, on: true });
  };
  const reset = () => setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, on: false });

  const busy = !!trans;
  const mag = Math.min(1, Math.hypot(tilt.rx, tilt.ry) / 15);
  const foilOp = tilt.on ? 0.28 + mag * 0.34 : 0;
  const glareOp = tilt.on ? 0.16 + mag * 0.4 : 0;
  const faceVars = { "--gx": tilt.gx + "%", "--gy": tilt.gy + "%", "--foil": foilOp, "--glare": glareOp };
  const liveOpacity = trans && trans.phase !== "reveal" ? 0 : 1;
  const cardTransform = busy
    ? "rotateX(0deg) rotateY(0deg) scale(1)"
    : `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${tilt.on ? 1.03 : 1})`;

  return (
    <div className="arcana">
      <style>{CSS}</style>
      <canvas ref={canvasRef} className="ac-stars" />
      <div className="ac-neb" style={{ transform: `translate(${tilt.ry * -1.4}px, ${tilt.rx * 1.4}px)` }} />

      <header className="ac-head">
        <div className="ac-mark"><span className="rule" /><span>ARCANA</span><span className="rule" /></div>
        <nav className="ac-nav"><a className="on">HOME</a><a>THE CARDS</a><a>READING</a></nav>
      </header>

      <main className="ac-stage">
        <button className="ac-side" disabled={busy} onClick={() => dissolve(prevI, -1)} aria-label={`Previous: ${CARDS[prevI].name}`}>
          <span className="disc"><em>{CARDS[prevI].roman}</em></span>
          <span className="lbl">← {CARDS[prevI].name.replace("THE ", "")}</span>
        </button>

        <div className="ac-zone">
          <div className="ac-eyebrow"><span className="rule" /> MAJOR ARCANA <span className="rule" /></div>
          <div className="ac-shadow" />
          <div className="ac-float" style={{ animationPlayState: tilt.on || busy ? "paused" : "running" }}>
            <div
              ref={cardRef}
              className="ac-tilt"
              tabIndex={0}
              role="button"
              aria-label={`${card.name}. Press space to reveal meaning.`}
              style={{ transform: cardTransform }}
              onMouseMove={(e) => move(e.clientX, e.clientY)}
              onMouseLeave={reset}
              onTouchMove={(e) => { const t = e.touches[0]; if (t) { e.preventDefault(); move(t.clientX, t.clientY); } }}
              onTouchEnd={reset}
              onClick={() => { if (!busy) setFlipped((f) => !f); }}
            >
              <div className={"ac-flip" + (flipped ? " is-flipped" : "")} style={{ opacity: liveOpacity }}>
                {/* FRONT — solid continuous centre, edges fragmenting into tesserae */}
                <div className="ac-face ac-front" style={{ ...faceVars, "--img": liveImg, "--cw": size.cw + "px", "--ch": size.ch + "px" }}>
                  <div className="front-light" />
                  <div
                    className="art-core"
                    style={{ clipPath: `inset(${(EDGE_RINGS * mosaic.cellH).toFixed(1)}px ${(EDGE_RINGS * mosaic.cellW).toFixed(1)}px round 18px)` }}
                  />
                  <div className="mosaic">{restTiles}</div>
                  <div className="holo" style={{ backgroundPosition: "var(--gx) var(--gy)", opacity: "var(--foil)" }} />
                  <div className="glare" style={{ background: "radial-gradient(circle at var(--gx) var(--gy), rgba(255,246,222,.95), rgba(255,246,222,0) 45%)", opacity: "var(--glare)" }} />
                  <div className="scrim-t" /><div className="scrim-b" />
                  <div className="numeral">{card.roman}</div>
                  <div className="plate">
                    <div className="name">{card.name}</div>
                    <div className="kw">{card.keywords.join(" · ")}</div>
                  </div>
                </div>
                {/* BACK */}
                <div className="ac-face ac-back" style={faceVars}>
                  <div className="back-glow" />
                  <div className="watermark">{card.roman}</div>
                  <div className="holo holo-soft" style={{ backgroundPosition: "var(--gx) var(--gy)", opacity: "calc(var(--foil) * 0.55)" }} />
                  <div className="back-body">
                    <div className="b-eyebrow">CARD {card.num}</div>
                    <div className="b-name">{card.name}</div>
                    <div className="b-div"><span /><span className="dot">✦</span><span /></div>
                    <div className="b-element">
                      <span className="glyph"><ElementGlyph kind={card.element} /></span>
                      <span className="b-el-text"><em>ELEMENT</em>{card.element}</span>
                    </div>
                    <p className="b-meaning">{card.meaning}</p>
                    <div className="b-foot">MAJOR ARCANA · {card.num} OF XXI</div>
                  </div>
                  <div className="edge" />
                </div>
              </div>

              {/* DISSOLVE — centre fades as a whole; only the edge tesserae fly */}
              {trans && (
                <div
                  className="ac-dissolve"
                  style={{ "--img": trans.img, "--cw": size.cw + "px", "--ch": size.ch + "px", opacity: trans.phase === "reveal" ? 0 : 1 }}
                >
                  <div className="ac-burst" />
                  <div
                    className={"diss-core " + trans.mode}
                    style={{ clipPath: `inset(${(EDGE_RINGS * mosaic.cellH).toFixed(1)}px ${(EDGE_RINGS * mosaic.cellW).toFixed(1)}px round 18px)` }}
                  />
                  {overlayTiles}
                </div>
              )}
            </div>
          </div>
          <div className="ac-hint">MOVE TO TILT · CLICK TO {flipped ? "RETURN" : "REVEAL"}</div>
        </div>

        <button className="ac-side" disabled={busy} onClick={() => dissolve(nextI, 1)} aria-label={`Next: ${CARDS[nextI].name}`}>
          <span className="disc"><em>{CARDS[nextI].roman}</em></span>
          <span className="lbl">{CARDS[nextI].name.replace("THE ", "")} →</span>
        </button>
      </main>

      <footer className="ac-foot">
        <div className="ac-rail">
          <span className="cap">00</span>
          <div className="track">
            <div className="fill" style={{ width: (card.num / 21) * 100 + "%" }} />
            <div className="bead" style={{ left: (card.num / 21) * 100 + "%" }} />
          </div>
          <span className="cap">XXI</span>
        </div>
        <button className="ac-cta">✦ &nbsp;BEGIN A READING</button>
      </footer>

      <div className="ac-grain" />
    </div>
  );
}

/* ================================ STYLES ================================ */
const CSS = `
.arcana{
  --bg:#06060c; --gold:#d7b45a; --gold-bright:#f4e2a8; --gold-deep:#9a7b34;
  --text:#ece3cb; --muted:#9c906f;
  --display:'Cinzel','Trajan Pro','Times New Roman',serif;
  --body:'EB Garamond','Cormorant Garamond','Georgia',serif;
  position:relative; min-height:760px; height:100%; width:100%;
  background:radial-gradient(120% 80% at 50% 12%, #11101c 0%, #08070f 45%, #050409 100%);
  color:var(--text); font-family:var(--body); overflow:hidden; isolation:isolate; box-sizing:border-box;
}
.arcana *{box-sizing:border-box;}
.ac-stars{position:absolute; inset:0; width:100%; height:100%; z-index:0; pointer-events:none;}
.ac-neb{position:absolute; left:50%; top:48%; width:760px; height:760px; transform:translate(-50%,-50%);
  z-index:0; pointer-events:none; transition:transform .25s ease-out;
  background:radial-gradient(closest-side, rgba(215,180,90,.16), rgba(215,180,90,.05) 45%, transparent 70%); filter:blur(6px);}

.ac-head{position:relative; z-index:3; display:flex; align-items:center; justify-content:space-between; padding:22px 40px 0;}
.ac-mark{display:flex; align-items:center; gap:14px; font-family:var(--display); letter-spacing:.5em; font-size:15px; color:var(--gold-bright); text-indent:.5em;}
.ac-mark .rule{width:34px; height:1px; background:linear-gradient(90deg,transparent,var(--gold),transparent);}
.ac-nav{display:flex; gap:30px; font-size:11px; letter-spacing:.34em; color:var(--muted);}
.ac-nav a{cursor:pointer; position:relative; padding-bottom:6px; transition:color .25s;}
.ac-nav a:hover{color:var(--text);}
.ac-nav a.on{color:var(--gold-bright);}
.ac-nav a.on::after{content:""; position:absolute; left:0; right:0; bottom:0; height:1px; background:linear-gradient(90deg,transparent,var(--gold),transparent);}

.ac-stage{position:relative; z-index:2; display:flex; align-items:center; justify-content:center; gap:56px; padding:30px 24px 8px; min-height:560px;}
.ac-zone{position:relative; display:flex; flex-direction:column; align-items:center; perspective:1700px;}
.ac-eyebrow{display:flex; align-items:center; gap:12px; font-size:10.5px; letter-spacing:.42em; color:var(--gold); margin-bottom:18px; text-indent:.42em;}
.ac-eyebrow .rule{width:26px; height:1px; background:linear-gradient(90deg,transparent,var(--gold-deep),transparent);}
.ac-shadow{position:absolute; bottom:46px; left:50%; transform:translateX(-50%); width:230px; height:46px; border-radius:50%; z-index:0;
  background:radial-gradient(closest-side, rgba(0,0,0,.55), transparent 75%); filter:blur(8px);}

.ac-float{transform-style:preserve-3d; animation:floaty 7s ease-in-out infinite;}
@keyframes floaty{0%,100%{transform:translateY(0);}50%{transform:translateY(-11px);}}

.ac-tilt{position:relative; width:min(348px,76vw); aspect-ratio:320/470; cursor:pointer;
  transform-style:preserve-3d; transition:transform .16s cubic-bezier(.2,.7,.2,1); will-change:transform; outline:none;}
.ac-tilt:focus-visible{box-shadow:0 0 0 2px rgba(244,226,168,.6); border-radius:14px;}

.ac-flip{position:absolute; inset:0; transform-style:preserve-3d;
  transition:transform .7s cubic-bezier(.6,.05,.2,1), opacity .18s ease; animation:deal .6s cubic-bezier(.2,.8,.2,1);}
.ac-flip.is-flipped{transform:rotateY(180deg);}
@keyframes deal{from{transform:rotateY(-24deg) scale(.9); opacity:0;}to{opacity:1;}}

.ac-face{position:absolute; inset:0; border-radius:13px; backface-visibility:hidden; -webkit-backface-visibility:hidden; isolation:isolate;}
.ac-front{background:transparent; overflow:visible; box-shadow:0 26px 55px -26px rgba(0,0,0,.72);}
.ac-back{transform:rotateY(180deg); overflow:hidden; background:radial-gradient(120% 100% at 50% 0%, #15131f, #0a0812 60%, #070510);
  box-shadow:0 30px 60px -20px rgba(0,0,0,.75), inset 0 0 0 1px rgba(215,180,90,.18);}

.mosaic{position:absolute; inset:0;}
.front-light{position:absolute; inset:-12% -9%; z-index:0; pointer-events:none; border-radius:46% / 40%;
  background:radial-gradient(ellipse at 50% 47%, rgba(255,226,150,.6), rgba(232,180,92,.26) 40%, rgba(176,128,58,.08) 62%, transparent 78%);
  filter:blur(11px); animation:lightpulse 7.5s ease-in-out infinite;}
@keyframes lightpulse{0%,100%{opacity:.78; transform:scale(1);}50%{opacity:1; transform:scale(1.045);}}
.art-core{position:absolute; inset:0; z-index:1; background-image:var(--img); background-size:var(--cw) var(--ch); background-repeat:no-repeat; background-position:0 0;}
.mosaic{z-index:2;}
.holo{position:absolute; inset:0; mix-blend-mode:color-dodge; pointer-events:none; background-size:220% 220%;
  clip-path:inset(6% 8% round 12px); -webkit-clip-path:inset(6% 8% round 12px);
  background-image:repeating-linear-gradient(108deg, rgba(255,228,168,0) 0%, rgba(255,228,168,.34) 8%, rgba(150,200,212,.16) 14%, rgba(205,170,255,.13) 20%, rgba(255,228,168,.34) 27%, rgba(255,228,168,0) 36%);}
.glare{position:absolute; inset:0; mix-blend-mode:soft-light; pointer-events:none; clip-path:inset(6% 8% round 12px); -webkit-clip-path:inset(6% 8% round 12px);}
.scrim-t{position:absolute; inset:0 0 auto 0; height:34%; pointer-events:none; background:linear-gradient(rgba(0,0,0,.5), transparent);}
.scrim-b{position:absolute; inset:auto 0 0 0; height:42%; pointer-events:none; background:linear-gradient(transparent, rgba(0,0,0,.78));}
.numeral{position:absolute; top:14px; left:0; right:0; text-align:center; z-index:5; font-family:var(--display); font-size:19px; letter-spacing:.2em; color:var(--gold-bright); text-shadow:0 1px 8px rgba(0,0,0,.6);}
.plate{position:absolute; left:0; right:0; bottom:20px; z-index:5; text-align:center;}
.plate .name{font-family:var(--display); font-weight:500; font-size:26px; letter-spacing:.12em; color:#f7eccb; text-shadow:0 2px 10px rgba(0,0,0,.7);}
.plate .kw{margin-top:7px; font-size:9px; letter-spacing:.32em; color:var(--gold); text-indent:.32em; text-shadow:0 1px 6px rgba(0,0,0,.8);}
.edge{position:absolute; inset:6px; border:1px solid rgba(215,180,90,.32); border-radius:9px; pointer-events:none; z-index:6; box-shadow:inset 0 0 0 1px rgba(0,0,0,.4), inset 0 0 36px rgba(0,0,0,.5);}

.back-glow{position:absolute; inset:0; pointer-events:none; background:radial-gradient(80% 60% at 50% 28%, rgba(215,180,90,.10), transparent 70%);}
.watermark{position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-family:var(--display); font-size:190px; color:rgba(215,180,90,.06); pointer-events:none; line-height:1;}
.holo-soft{mix-blend-mode:overlay;}
.back-body{position:absolute; inset:0; z-index:4; padding:42px 30px; display:flex; flex-direction:column; align-items:center; text-align:center;}
.b-eyebrow{font-size:10px; letter-spacing:.42em; color:var(--gold); text-indent:.42em;}
.b-name{font-family:var(--display); font-size:25px; letter-spacing:.1em; color:#f7eccb; margin-top:12px;}
.b-div{display:flex; align-items:center; gap:10px; margin:16px 0 18px; color:var(--gold-deep); width:62%;}
.b-div span{flex:1; height:1px; background:linear-gradient(90deg,transparent,var(--gold-deep),transparent);}
.b-div .dot{flex:0; color:var(--gold);}
.b-element{display:flex; align-items:center; gap:11px; color:var(--gold-bright); margin-bottom:20px;}
.b-element .glyph{display:flex; color:var(--gold);}
.b-el-text{display:flex; flex-direction:column; align-items:flex-start; line-height:1.15; font-size:14px; letter-spacing:.22em;}
.b-el-text em{font-style:normal; font-size:8.5px; letter-spacing:.34em; color:var(--muted);}
.b-meaning{font-size:15.5px; line-height:1.62; color:var(--text); max-width:240px; font-style:italic; margin:0;}
.b-foot{margin-top:auto; font-size:9px; letter-spacing:.3em; color:var(--muted); text-indent:.3em;}

/* dissolve */
.ac-dissolve{position:absolute; inset:0; z-index:8; pointer-events:none; overflow:visible; transition:opacity .18s ease;}
.diss-core{position:absolute; inset:0; z-index:1; background-image:var(--img); background-size:var(--cw) var(--ch); background-repeat:no-repeat; background-position:0 0;}
.diss-core.out{animation:coreOut 520ms ease forwards;}
.diss-core.in{animation:coreIn 600ms cubic-bezier(.2,.8,.2,1) forwards;}
@keyframes coreOut{from{opacity:1; transform:scale(1);}to{opacity:0; transform:scale(.93);}}
@keyframes coreIn{from{opacity:0; transform:scale(1.05);}to{opacity:1; transform:scale(1);}}
.ac-dissolve .tile{z-index:2;}
.ac-burst{position:absolute; inset:-22%; z-index:0; pointer-events:none; animation:burst 1280ms ease-in-out forwards;
  background:radial-gradient(closest-side, rgba(246,228,176,.6), rgba(215,180,90,.18) 45%, transparent 72%); filter:blur(8px);}
@keyframes burst{0%{opacity:0; transform:scale(.6);}35%{opacity:.8; transform:scale(1);}100%{opacity:0; transform:scale(1.28);}}
/* tesserae — shared by the resting mosaic and the dissolve. Kept delicate at
   small scale: a faint warm rim + soft seat, no heavy bevel. */
.tile{position:absolute; background-repeat:no-repeat; background-image:var(--img); background-size:var(--cw) var(--ch);
  backface-visibility:hidden; border-radius:1.5px;
  box-shadow:inset 0 0 0 .5px rgba(0,0,0,.16), inset .5px .5px .5px rgba(255,238,200,.12);}
.tile.out{animation:tileOut 400ms cubic-bezier(.5,0,.78,.25) both;}
.tile.in{animation:tileIn 480ms cubic-bezier(.16,.72,.24,1) both;}
@keyframes tileOut{
  from{transform:translate(var(--hx),var(--hy)) rotate(var(--hr)) scale(1); opacity:var(--ho);}
  to{transform:translate(var(--dx),var(--dy)) rotate(var(--dr)) scale(var(--ds)); opacity:0;}}
@keyframes tileIn{
  from{transform:translate(var(--dx),var(--dy)) rotate(var(--dr)) scale(var(--ds)); opacity:0;}
  to{transform:translate(var(--hx),var(--hy)) rotate(var(--hr)) scale(1); opacity:var(--ho);}}

.ac-side{background:none; border:none; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:14px; color:var(--muted); transition:color .3s,opacity .3s; padding:8px;}
.ac-side:hover{color:var(--text);}
.ac-side:disabled{opacity:.35; cursor:default;}
.ac-side .disc{width:72px; height:72px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid rgba(215,180,90,.28);
  background:radial-gradient(circle at 50% 35%, rgba(215,180,90,.10), rgba(8,7,14,.6)); box-shadow:0 8px 28px -12px rgba(0,0,0,.8); transition:.3s;}
.ac-side:not(:disabled):hover .disc{border-color:rgba(244,226,168,.65); box-shadow:0 0 26px -6px rgba(215,180,90,.45);}
.ac-side .disc em{font-style:normal; font-family:var(--display); font-size:17px; letter-spacing:.12em; color:var(--gold-bright);}
.ac-side .lbl{font-size:9px; letter-spacing:.28em;}
.ac-hint{margin-top:22px; font-size:9.5px; letter-spacing:.36em; color:var(--muted); text-indent:.36em;}

.ac-foot{position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; gap:22px; padding:14px 24px 34px;}
.ac-rail{display:flex; align-items:center; gap:16px; width:min(440px,82vw);}
.ac-rail .cap{font-size:10px; letter-spacing:.24em; color:var(--muted);}
.ac-rail .track{position:relative; flex:1; height:1px; background:rgba(215,180,90,.22);}
.ac-rail .fill{position:absolute; left:0; top:0; height:1px; background:linear-gradient(90deg,transparent,var(--gold)); transition:width .5s cubic-bezier(.6,.05,.2,1);}
.ac-rail .bead{position:absolute; top:50%; width:7px; height:7px; border-radius:50%; transform:translate(-50%,-50%); background:var(--gold-bright); box-shadow:0 0 12px 2px rgba(244,226,168,.55); transition:left .5s cubic-bezier(.6,.05,.2,1);}
.ac-cta{font-family:var(--display); font-size:12px; letter-spacing:.26em; color:#16120a; cursor:pointer; padding:14px 30px; border:none; text-indent:.26em;
  background:linear-gradient(180deg,#f4e2a8,#cda14e); border-radius:2px; box-shadow:0 10px 30px -10px rgba(215,180,90,.6); transition:transform .2s, box-shadow .2s;}
.ac-cta:hover{transform:translateY(-2px); box-shadow:0 16px 38px -10px rgba(215,180,90,.75);}

.ac-grain{position:absolute; inset:0; z-index:5; pointer-events:none; opacity:.05; mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}

@media (max-width:860px){
  .ac-head{padding:18px 20px 0; flex-direction:column; gap:14px;}
  .ac-stage{flex-direction:column; gap:26px; padding-top:18px;}
  .ac-side{flex-direction:row; gap:10px;}
  .ac-side .disc{width:52px; height:52px;}
  .ac-side .lbl{font-size:10px;}
}
@media (prefers-reduced-motion: reduce){
  .ac-float{animation:none;}
  .ac-flip{animation:none;}
  .ac-burst{animation:none;}
}
`;
