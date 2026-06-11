/*! ARCANA — interactive Major Arcana card (framework-free)
 *  Drop-in for any page (Flask/Jinja, plain HTML, etc). Pairs with
 *  arcana-card.css. No dependencies, no build step.
 *
 *  Usage A (auto-init):
 *    <div data-arcana-card data-start="1">
 *      <script type="application/json"> [ ...cards... ] </script>
 *    </div>
 *  Usage B (manual):
 *    ArcanaCards.mount(document.querySelector('#hero'), { cards: [...], start: 1 });
 *
 *  Card shape: { id, roman, num, name, element, keywords:[...], meaning, image }
 *    - image: URL to the card art (recommended aspect 320:470). If omitted, a
 *      built-in placeholder illustration is generated for that card id.
 *    - The foil / tilt / edge-dissolve / light effects are art-agnostic: they
 *      operate on whatever `image` you supply.
 */
(function (global) {
  "use strict";

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
// MARGIN_RINGS: the outermost rings are a transparent margin AROUND the art.
// The art core is inset by this many cells on every side, so the full picture
// stays intact; the dissolve band lives in the margin and the art's edge, never
// eating into the centre. EDGE_RINGS is how deep (past the margin) the crumble
// reaches back toward the solid core.
// PERFORMANCE: EDGE_RINGS is the crumble band DEPTH in cells. The band renders
// to a cached offscreen bitmap (renderBand), so the tile count costs raster
// time at idle/prime, not per frame — but keep growth in check: COLS×ROWS
// scales the render quadratically. The grid is deliberately FINE so the edge
// crumbles into small, numerous fragments; MARGIN/EDGE ring counts are scaled
// with it to keep the same physical margin and band depth.
const COLS = 145, ROWS = 213, GAP = 0.25, MARGIN_RINGS = 12, EDGE_RINGS = 32;
// Background tone the eroding edge fragments bleed toward (matches the page's
// deep ink radial), so the rim dissolves into the scene's colour.
const BLEED_BG = "#08070f";
// Coherent value-noise (shared by the rest-state band AND the dissolve
// transition grid): a smooth, clumpy field in [0,1] for organic variation.
function hash2(ix, iy) {
  let h = (ix * 374761393 + iy * 668265263) >>> 0;
  h = (h ^ (h >>> 13)) * 1274126177 >>> 0;
  return (h >>> 0) / 4294967296;
}
function vnoise(x, y) {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const n00 = hash2(x0, y0), n10 = hash2(x0 + 1, y0);
  const n01 = hash2(x0, y0 + 1), n11 = hash2(x0 + 1, y0 + 1);
  const nx0 = n00 + (n10 - n00) * sx, nx1 = n01 + (n11 - n01) * sx;
  return nx0 + (nx1 - nx0) * sy;
}
function buildMosaic(cw, ch) {
  if (!cw || !ch) return { tiles: [], cellW: 0, cellH: 0, marginX: 0, marginY: 0, artW: 0, artH: 0 };
  const cellW = cw / COLS, cellH = ch / ROWS;
  // The inset rect that holds the full art. Margins are PROPORTIONAL: marginY is
  // scaled by the box aspect so the art rect keeps the card's aspect ratio (no
  // squish). The drawn-tile band below uses per-axis fractional depth so the
  // crumble reaches the art edge on every side despite the differing margins.
  const marginX = MARGIN_RINGS * cellW, marginY = marginX * (ch / cw);
  const artW = cw - 2 * marginX, artH = ch - 2 * marginY;
  // band reaches from the card edge to EDGE_RINGS past the margin, as fractions
  const bandFracX = (marginX + EDGE_RINGS * cellW) / (cw / 2);
  const bandFracY = (marginY + EDGE_RINGS * cellH) / (ch / 2);
  const cx = cw / 2, cy = ch / 2, maxD = Math.hypot(cw, ch) / 2;
  const r = rng(2025);

  // patchy density field over the grid (two noise octaves): dense patches and
  // thin ragged gaps so the band erodes organically instead of uniformly
  function densityNoise(col, row) {
    return 0.65 * vnoise(col / 7.5, row / 7.5) + 0.35 * vnoise(col / 2.6, row / 2.6);
  }
  const tiles = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      // Fractional depth from the nearest edge on each axis (0 at edge → 1 at
      // centre), then a band-normalised depth `t` (0 at the very card edge → 1 at
      // the inner edge of the crumble band). Using fractions keeps the band the
      // same VISUAL width on every side despite the proportional margins.
      const fx = Math.min(col + 0.5, COLS - 0.5 - col) / (COLS / 2);
      const fy = Math.min(row + 0.5, ROWS - 0.5 - row) / (ROWS / 2);
      const tX = fx / bandFracX, tY = fy / bandFracY;
      const tRaw = Math.min(tX, tY);                 // smooth band coordinate

      // ORGANIC, NOT A BORDER: a coherent noise field warps the band so its inner
      // edge is RAGGED — in some patches the crumble bites deep into the art, in
      // others it stops short — and survival/opacity clump irregularly. `n` is the
      // patch value; `t` is the noise-warped band depth.
      const n = densityNoise(col, row);              // 0..1 clumpy field
      const warp = (n - 0.5) * 0.95;                 // ± shifts the band edge in/out (raised for a more ragged, dramatic crumble)
      const t = tRaw - warp;                         // warped depth; >1 ⇒ solid core
      const inBand = t < 1, inBridge = t >= 1 && t < 1.1;
      const tC = Math.max(0, Math.min(1, t));        // clamped band depth
      // DISORDER IS EARNED BY DEPTH: tiles over the still-solid core must be
      // pixel-aligned, full-size and opaque — indistinguishable continuations
      // of the artwork — or they read as a SEPARATE LAYER floating on the
      // image. Rotation, jitter, gaps and mottling ramp in (smoothstepped)
      // only as the core fades away beneath, so the picture itself appears to
      // loosen, granulate and crumble the further out it goes.
      const dis = 1 - tC;
      const disT = dis * dis * (3 - 2 * dis);        // smoothstep: calm inside, wild at the rim
      let omit = false, ho = 1, hx = 0, hy = 0, hr = 0, ringBand = inBand || inBridge;
      if (inBand) {
        // Survival blends band-depth with the noise patch: dense clumps (high n)
        // stay packed, thin patches (low n) shed many tiles → ragged, varied edge
        // that erodes organically instead of fading like a clean frame. The base
        // is raised so the finer grid keeps a DENSE, populous rim.
        const pSurv = Math.min(1, 0.58 + Math.pow(Math.max(0, t), 0.8) * 1.0 + (n - 0.5) * 0.55);
        omit = r() > pSurv;
        // Opacity mottling (depth + patch + per-tile noise) fades to NONE on the
        // solid side — inner tiles are fully opaque image, not a darkened sheet.
        const hoRaw = Math.max(0.08, Math.min(1, 0.2 + Math.pow(Math.max(0, t), 0.8) * 0.72 + (n - 0.5) * 0.4 + (r() - 0.5) * 0.22));
        ho = 1 - (1 - hoRaw) * disT;
        // Drift and rotation grow with disorder only — no baseline tilt over the
        // intact image; outer fragments tumble freely as the core lets go.
        hx = (r() - 0.5) * 8 * disT; hy = (r() - 0.5) * 8 * disT;
        hr = ((r() - 0.5) * 14 + (r() - 0.5) * 34) * disT;
      } else if (inBridge) {
        // bridge: noise-thinned seam-fillers tucked under the crumble — perfectly
        // aligned and opaque (any gap shows the identical solid core beneath)
        omit = r() > 0.7 + (n - 0.5) * 0.4;
      } else {
        r(); r(); r(); // keep the sequence aligned for deterministic scatter
      }
      // scatter for the dissolve (direction applied at render)
      const tx = col * cellW + cellW / 2, ty = row * cellH + cellH / 2;
      const vx = tx - cx, vy = ty - cy, dist = Math.max(1, Math.hypot(vx, vy)), dn = dist / maxD;
      const ux = vx / dist, uy = vy / dist, pX = -uy, pY = ux;
      const R = 55 + dn * 80 + r() * 40, Sw = 42 + dn * 66;
      // VARIABLE TILE SIZE: chips fill their cell EXACTLY on the solid side (a
      // seamless continuation of the image) and crumble into small, varied
      // fragments toward the rim — size randomness, like every other disorder,
      // is scaled by disT so it only appears where the core has faded. The chip
      // is shrunk centred within its cell; bg-position shifts by the same inset
      // so the art slice it shows stays correctly aligned.
      const sizeScale = Math.max(0.16, Math.min(1.4, (0.24 + tC * 0.76) + (r() - 0.5) * 0.55 * disT));
      const baseW = cellW - GAP, baseH = cellH - GAP;
      // ── ORGANIC #2: NON-SQUARE chips. Vary width and height INDEPENDENTLY so
      // rim tesserae read as hand-cut chips; aligned inner tiles stay square so
      // they tile the image invisibly.
      const arW = 1 + (r() - 0.5) * 0.9 * disT;   // up to ±45% width at the rim
      const arH = 1 + (r() - 0.5) * 0.9 * disT;   // up to ±45% height at the rim
      const tileW = baseW * sizeScale * arW, tileH = baseH * sizeScale * arH;
      const insetX = (baseW - tileW) / 2, insetY = (baseH - tileH) / 2;
      // ── ORGANIC #1: BREAK THE SQUARE LATTICE with 2D positional jitter only.
      // A brick (row) offset was tried but it's DIRECTIONAL — it only shifts rows
      // horizontally, which combs the horizontal edges and made the BOTTOM read
      // unnatural. Pure per-cell jitter is symmetric on all four edges, so the
      // dissolve looks the same top, bottom, left and right. The jitter is applied
      // to tileLeft/tileTop AND bg-position derives from them, so the image slice
      // stays aligned to where the chip sits — no smearing.
      const jAmt = 0.55 * disT;              // zero over the intact image → rim max
      const jx = (r() - 0.5) * cellW * jAmt;
      const jy = (r() - 0.5) * cellH * jAmt;
      const tileLeft = col * cellW + GAP / 2 + insetX + jx;
      const tileTop = row * cellH + GAP / 2 + insetY + jy;
      tiles.push({
        col, row, band: ringBand, omit,
        left: +tileLeft.toFixed(2), top: +tileTop.toFixed(2),
        w: +tileW.toFixed(2), h: +tileH.toFixed(2),
        // Background maps to the INSET art rect (artW×artH at +marginX,+marginY),
        // so tiles in the margin carry the art's edge slices dissolving outward
        // into empty space — the full picture stays whole inside the margin. The
        // bg-position subtracts the tile's own left/top so the art lines up with
        // where the chip sits (including the size-inset shift).
        bgx: +(marginX - tileLeft).toFixed(2), bgy: +(marginY - tileTop).toFixed(2),
        ho: +ho.toFixed(2), hx: +hx.toFixed(1), hy: +hy.toFixed(1), hr: +hr.toFixed(1),
        // clamped band depth (0 = card rim → 1 = inner band): used to pick the
        // idle "shedding" rim tiles and scale their drift
        bandT: +tC.toFixed(3),
        // ORGANIC #6: edge colour BLEED — the outermost fragments (t→0) get tinted
        // toward the dark background so they dissolve into the scene's colour, not
        // just fade alpha. 0 at the inner band → up to ~0.6 at the very rim.
        bleed: +(Math.max(0, 0.6 * (1 - Math.min(1, Math.max(0, t)) / 0.6))).toFixed(2),
        radx: +(ux * R).toFixed(1), rady: +(uy * R).toFixed(1),
        tanx: +(pX * Sw).toFixed(1), tany: +(pY * Sw).toFixed(1),
        sjx: +((r() - 0.5) * 22).toFixed(1), sjy: +((r() - 0.5) * 22).toFixed(1),
        baseRot: +(60 + dn * 130).toFixed(1), rotJit: +((r() - 0.5) * 64).toFixed(1),
        ds: +(0.3 + r() * 0.22).toFixed(2),
        // Dissolve timing: a radial bias (edges-first out / centre-first in) is
        // BLENDED with the tile's own ring-depth and a random jitter, so tesserae
        // at different depths break away at scattered, staggered moments — an
        // organic crumble, not a clean concentric wave. Stagger is kept TIGHT so
        // the whole transition stays snappy (OUT max ≈110ms, IN max ≈120ms).
        do: Math.round((1 - dn) * 35 + (1 - Math.min(1, t)) * 25 + r() * 50),
        di: Math.round(dn * 40 + Math.min(1, t) * 28 + r() * 55),
        // per-tile light: each tessera carries its own catch-light point,
        // brightness and twinkle phase so the band glints irregularly.
        lx: Math.round(20 + r() * 60),                 // highlight x within the tile (%)
        ly: Math.round(18 + r() * 54),                 // highlight y within the tile (%)
        lb: +(0.7 + r() * 0.85).toFixed(2),            // per-tile brightness multiplier
        // DIRECTIONAL twinkle: the glint phase is driven by band-depth so the
        // sparkle reads as a WAVE travelling outward (inner band glints first,
        // the edge releases last) — the card appears to dissolve from the core
        // out toward the crumbling rim, not random flickers. `t` is 1 at the
        // inner band → 0 at the very edge. A small random jitter keeps it organic.
        // The 5s cycle is mapped: phase = depth*0.7 + jitter, in seconds (negative
        // delay = earlier start, so high-t inner tiles lead the wave).
        lt: +(-(((Math.min(1, Math.max(0, t)) * 0.7) + r() * 0.3) * 5).toFixed(2)),
        // NON-UNIFORM sparkle size, kept DELICATE: fine points that grow only a
        // little toward the inner band, with per-tile variance so no two match.
        // depthFactor ≈ 0.08 at the rim → ~0.14 toward the inner band.
        sp: +(Math.min(tileW, tileH)
              * (0.08 + Math.min(1, Math.max(0, t)) * 0.06)
              * (0.7 + r() * 0.6)).toFixed(1),
        // Sparkles ONLY on the eroding EDGE fragments — never toward the inner
        // band / centre. `t` is ~1 at the inner band and ~0 at the very rim, so we
        // gate twinkles to the outer portion and ramp the probability up as t→0.
        // Higher volume now: wider gate (t < 0.65) and a larger multiplier.
        tw: (Math.min(1, Math.max(0, t)) < 0.65) &&
            (r() < (0.65 - Math.min(1, Math.max(0, t))) * 1.3),
      });
    }
  }
  return { tiles, cellW, cellH, marginX, marginY, artW, artH };
}

  /* ---------- element glyph (card back), as an SVG string ---------- */
  function elementGlyphSVG(kind) {
    var st = 'fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"';
    if (kind === "EARTH") return '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 6 L21 6 L12 21 Z" ' + st + '/><line x1="7" y1="14.5" x2="17" y2="14.5" ' + st + '/></svg>';
    if (kind === "FIRE")  return '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 19 L12 4 L21 19 Z" ' + st + '/></svg>';
    if (kind === "WATER") return '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 6 L21 6 L12 21 Z" ' + st + '/></svg>';
    return '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 19 L12 4 L21 19 Z" ' + st + '/><line x1="7" y1="13" x2="17" y2="13" ' + st + '/></svg>';
  }

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function imgFor(card) { return card.image ? 'url("' + card.image + '")' : dataUrl(artSVG(card.id || "fool")); }


  var SCAFFOLD =
    '<canvas class="ac-stars"></canvas>' +
    '<div class="ac-neb"></div>' +
    '<header class="ac-head"><div class="ac-mark"><span class="rule"></span><span>ARCANA</span><span class="rule"></span></div>' +
    '<nav class="ac-nav"><a class="on">HOME</a><a>THE CARDS</a><a>READING</a></nav></header>' +
    '<main class="ac-stage">' +
      '<button class="ac-side" data-dir="-1" type="button"><span class="disc"><em></em></span><span class="lbl"></span></button>' +
      '<div class="ac-zone">' +
        '<div class="ac-eyebrow"><span class="rule"></span> MAJOR ARCANA <span class="rule"></span></div>' +
        '<div class="ac-shadow"></div>' +
        '<div class="ac-float">' +
          '<div class="ac-tilt" tabindex="0" role="button">' +
            '<div class="ac-flip">' +
              '<div class="ac-face ac-front">' +
                '<div class="front-light"></div>' +
                '<div class="art-core"></div>' +
                '<div class="mosaic"><canvas class="mosaic-canvas"></canvas></div>' +
                '<div class="holo" style="background-position:var(--gx) var(--gy);opacity:var(--foil)"></div>' +
                '<div class="glare" style="background:radial-gradient(circle at var(--gx) var(--gy), rgba(255,246,222,.95), rgba(255,246,222,0) 45%);opacity:var(--glare)"></div>' +
                '<div class="scrim-t"></div><div class="scrim-b"></div>' +
                '<div class="numeral"></div>' +
                '<div class="plate"><div class="name"></div><div class="kw"></div></div>' +
              '</div>' +
              '<div class="ac-face ac-back">' +
                '<div class="back-glow"></div>' +
                '<div class="watermark"></div>' +
                '<div class="holo holo-soft" style="background-position:var(--gx) var(--gy);opacity:calc(var(--foil) * 0.55)"></div>' +
                '<div class="back-body"></div>' +
                '<div class="edge"></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="ac-hint"></div>' +
      '</div>' +
      '<button class="ac-side" data-dir="1" type="button"><span class="disc"><em></em></span><span class="lbl"></span></button>' +
    '</main>' +
    '<footer class="ac-foot"><div class="ac-rail"><span class="cap">00</span><div class="track"><div class="fill"></div><div class="bead"></div></div><span class="cap">XXI</span></div>' +
    '<button class="ac-cta" type="button">\u2726 &nbsp;BEGIN A READING</button></footer>' +
    '<div class="ac-grain"></div>';

  // Minimal scaffold: JUST the tiling card (front + back), with the soft neb glow
  // behind it. No header / nav / footer / side-arrows / eyebrow / hint / shadow /
  // starfield — for embedding the mosaic card inside another layout (e.g. the home
  // page's orbit rings). The host drives navigation and shows its own card text.
  var BARE_SCAFFOLD =
    '<div class="ac-neb"></div>' +
    '<main class="ac-stage ac-bare">' +
      '<div class="ac-zone">' +
        '<div class="ac-float">' +
          '<div class="ac-tilt" tabindex="0" role="button">' +
            '<div class="ac-flip">' +
              '<div class="ac-face ac-front">' +
                '<div class="front-light"></div>' +
                '<div class="art-core"></div>' +
                '<div class="mosaic"><canvas class="mosaic-canvas"></canvas></div>' +
                '<div class="holo" style="background-position:var(--gx) var(--gy);opacity:var(--foil)"></div>' +
                '<div class="glare" style="background:radial-gradient(circle at var(--gx) var(--gy), rgba(255,246,222,.95), rgba(255,246,222,0) 45%);opacity:var(--glare)"></div>' +
                '<div class="scrim-t"></div><div class="scrim-b"></div>' +
                '<div class="numeral"></div>' +
                '<div class="plate"><div class="name"></div><div class="kw"></div></div>' +
              '</div>' +
              '<div class="ac-face ac-back">' +
                '<div class="back-glow"></div>' +
                '<div class="watermark"></div>' +
                '<div class="holo holo-soft" style="background-position:var(--gx) var(--gy);opacity:calc(var(--foil) * 0.55)"></div>' +
                '<div class="back-body"></div>' +
                '<div class="edge"></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</main>';

  function mount(container, opts) {
    opts = opts || {};
    var bare = !!opts.bare;
    var cards = (opts.cards && opts.cards.length) ? opts.cards : CARDS;
    var index = (opts.start != null && opts.start >= 0 && opts.start < cards.length) ? opts.start
      : Math.min(1, cards.length - 1);

    var flipped = false, busy = false;
    var tilt = { rx: 0, ry: 0, gx: 50, gy: 50, on: false };
    var initW = Math.min(440, ((global.innerWidth || 1000) * 0.84));
    var size = { cw: Math.round(initW), ch: Math.round(initW * 470 / 320) };
    var mosaicData = buildMosaic(size.cw, size.ch);
    var reduce = !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var timers = [];

    container.classList.add("arcana");
    if (bare) container.classList.add("arcana-bare");
    container.innerHTML = bare ? BARE_SCAFFOLD : SCAFFOLD;

    var canvas = container.querySelector(".ac-stars");
    var neb = container.querySelector(".ac-neb");
    var floatEl = container.querySelector(".ac-float");
    var tiltEl = container.querySelector(".ac-tilt");
    var flipEl = container.querySelector(".ac-flip");
    var frontEl = container.querySelector(".ac-front");
    var coreEl = container.querySelector(".art-core");
    var mosaicEl = container.querySelector(".mosaic");
    var mosaicCanvas = container.querySelector(".mosaic-canvas");
    var numEl = container.querySelector(".numeral");
    var nameEl = container.querySelector(".plate .name");
    var kwEl = container.querySelector(".plate .kw");
    var watermark = container.querySelector(".watermark");
    var backBody = container.querySelector(".back-body");
    var hintEl = container.querySelector(".ac-hint");
    var railFill = container.querySelector(".ac-rail .fill");
    var railBead = container.querySelector(".ac-rail .bead");
    var prevBtn = container.querySelector('.ac-side[data-dir="-1"]');
    var nextBtn = container.querySelector('.ac-side[data-dir="1"]');
    var prevEm = prevBtn && prevBtn.querySelector("em"), prevLbl = prevBtn && prevBtn.querySelector(".lbl");
    var nextEm = nextBtn && nextBtn.querySelector("em"), nextLbl = nextBtn && nextBtn.querySelector(".lbl");
    // host hook: called after each card change so an embedding page can update its
    // own numerals, labels, progress, etc.
    var onCard = typeof opts.onCard === "function" ? opts.onCard : null;

    function prevI() { return (index - 1 + cards.length) % cards.length; }
    function nextI() { return (index + 1) % cards.length; }
    function setV(node, k, v) { node.style.setProperty(k, v); }

    // A feathered mask that softens the (already inset) art's own outer edge so
    // the crumble tiles blend seamlessly into it — no hard rectangle. Two crossed
    // linear-gradient masks (vertical × horizontal) are intersected so all four
    // edges AND corners feather; intermediate stops make it a true gradual fade.
    // Depth is the crumble overlap (EDGE_RINGS) since the margin now provides the
    // open space; vertical gets a little extra as that boundary reads most.
    function applyCoreMask(node) {
      // A GRADUAL feather so the core melts into the eroding tiles over a wide
      // zone — not a sharp core edge with a separate ring of tiles (which reads as
      // a frame). The fade runs roughly twice the band depth and uses soft
      // intermediate stops so the transition from solid image → tesserae is
      // continuous and organic. The band tiles overlap this faded zone, becoming a
      // seamless continuation of the picture as it breaks apart.
      var artH = mosaicData.artH || size.ch, artW = mosaicData.artW || size.cw;
      var depthY = (EDGE_RINGS * (mosaicData.cellH || 0)) / artH * 100;
      var depthX = (EDGE_RINGS * (mosaicData.cellW || 0)) / artW * 100;
      // Fade depth ≈ the band depth so the core's soft edge sits exactly where the
      // tiles erode — they interlock instead of leaving a gap or a hard ring.
      var fY = Math.max(6, depthY * 1.15), fX = Math.max(6, depthX * 1.15);
      function ramp(dir, f) {
        var p1 = (f * 0.25).toFixed(1) + "%", p2 = (f * 0.55).toFixed(1) + "%", p3 = f.toFixed(1) + "%";
        return "linear-gradient(to " + dir + "," +
          "transparent 0," +
          "rgba(0,0,0,.15) " + p1 + "," +
          "rgba(0,0,0,.55) " + p2 + "," +
          "#000 " + p3 + "," +
          "#000 calc(100% - " + p3 + ")," +
          "rgba(0,0,0,.55) calc(100% - " + p2 + ")," +
          "rgba(0,0,0,.15) calc(100% - " + p1 + ")," +
          "transparent 100%)";
      }
      var m = ramp("bottom", fY) + "," + ramp("right", fX);
      node.style.webkitMask = m; node.style.mask = m;
      node.style.webkitMaskComposite = "source-in"; node.style.maskComposite = "intersect";
    }

    function applySize() {
      // --cw/--ch are the ART rect size (inset by the margin); tiles and core
      // share them so a tile's slice always lines up with the core image.
      setV(frontEl, "--cw", (mosaicData.artW || size.cw) + "px");
      setV(frontEl, "--ch", (mosaicData.artH || size.ch) + "px");
      setV(frontEl, "--mx", (mosaicData.marginX || 0) + "px");
      setV(frontEl, "--my", (mosaicData.marginY || 0) + "px");
      applyCoreMask(coreEl);
    }

    // ── CANVAS MOSAIC ────────────────────────────────────────────────────────
    // The band tesserae are rendered onto ONE <canvas> instead of thousands of
    // DOM <div>s. This removes the DOM-node ceiling that caused the jank: there is
    // a single element to lay out and paint, and the static mosaic is drawn once
    // per card. The twinkle is a lightweight rAF loop that re-blits only the small
    // glint squares over the (cached) static frame — pausable during transitions.
    var bandList = [];        // the drawable band tiles for the current size
    var twinkleList = [];     // sparkle subset only (cheap per-frame loop)
    var shedList = [];        // rim tiles drawn DYNAMICALLY: the idle dissolve
    var staticBitmap = null;  // offscreen canvas holding the static mosaic frame
    var curArtImg = null;     // decoded art for the current card (shed slices)
    var twRaf = null, twRunning = false;

    // Decoded-image cache keyed by image URL (covers real art AND the generated
    // SVG placeholders). Returns a Promise<HTMLImageElement>. Independent of the
    // navigation preloadCard cache so the mosaic can always draw, even at first
    // paint before neighbours are warmed.
    var mosaicImgCache = {};
    function getDecodedImg(url) {
      if (!url) return Promise.resolve(null);
      if (mosaicImgCache[url]) return mosaicImgCache[url];
      var im = new Image();
      // Keep the canvas readable (getImageData for sparkle colours). Same-origin
      // /static images don't taint, but this also covers any CORS-served art.
      if (/^https?:/i.test(url) && url.indexOf(location.origin) !== 0) {
        im.crossOrigin = "anonymous";
      }
      im.src = url;
      var p = (im.decode ? im.decode().catch(function () {}) : new Promise(function (res) {
        im.onload = res; im.onerror = res;
      })).then(function () { return im.width ? im : null; });
      mosaicImgCache[url] = p;
      return p;
    }
    function cardImgUrl(card) {
      // imgFor() returns css url(...) — for real art OR the generated placeholder.
      var raw = imgFor(card);
      var m = /url\(["']?([^"')]+)["']?\)/.exec(raw);
      return m ? m[1] : raw;
    }
    function currentImg() { return getDecodedImg(cardImgUrl(cards[index])); }

    function sizeCanvas() {
      if (!mosaicCanvas) return 1;
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      mosaicCanvas.width = Math.round(size.cw * dpr);
      mosaicCanvas.height = Math.round(size.ch * dpr);
      mosaicCanvas.style.width = size.cw + "px";
      mosaicCanvas.style.height = size.ch + "px";
      return dpr;
    }

    // Collect the band tiles once per (size) build. `twinkleList` is the small
    // sparkle subset so the per-frame loop iterates ~hundreds, not ~thousands.
    // A sparse, evenly-spread subset of RIM tiles becomes `shedList`: excluded
    // from the static frame and drawn dynamically instead. Each slot spends
    // most of its cycle dormant, then detaches for a 2–4s flight — drifting
    // outward with a slight rise and gentle turbulence, shrinking and fading
    // to nothing — so at any moment only a few dozen particles are airborne:
    // quiet erosion, not a snowstorm. Selection uses existing per-tile randoms
    // (rotJit) so the rng sequence stays untouched.
    // SHED_MAX × the ~0.3–0.45 airborne duty cycle ≈ 50–75 concurrent chips.
    var SHED_MAX = 170;
    function buildRest() {
      bandList = [];
      twinkleList = [];
      shedList = [];
      var all = mosaicData.tiles, cand = [], i, t;
      if (!reduce) {
        for (i = 0; i < all.length; i++) {
          t = all[i];
          t.isShed = false;
          if (t.omit || !t.band) continue;
          if (t.bandT < 0.55 && Math.abs(t.rotJit) < 20) cand.push(t);
        }
        // stride-pick so the shed tiles spread around the whole rim instead of
        // exhausting the cap in the first rows
        var stride = Math.max(1, Math.floor(cand.length / SHED_MAX));
        for (i = 0; i < cand.length && shedList.length < SHED_MAX; i += stride) {
          t = cand[i];
          t.isShed = true;
          // outward drift direction + reach (rim tiles travel a touch farther),
          // with a slight upward bias; all flight parameters derive from the
          // tile's existing per-tile randoms so the rng sequence stays aligned
          var cxp = t.left + t.hx + t.w / 2, cyp = t.top + t.hy + t.h / 2;
          var vx = cxp - size.cw / 2, vy = cyp - size.ch / 2;
          var d = Math.max(1, Math.hypot(vx, vy));
          var ux = vx / d, uy = vy / d;
          var reach = 12 + (1 - t.bandT) * 26;
          t.shDx = ux * reach;
          t.shDy = uy * reach - (5 + (t.ly % 8));                 // slight rise
          t.shPx = -uy; t.shPy = ux;                              // turbulence axis
          t.shPhase = -t.lt / 5;                                  // 0..1 stagger
          t.shPeriod = 6000 + ((t.ds - 0.3) / 0.22) * 4000;       // 6–10s cycle
          t.shLife = 0.30 + ((t.lb - 0.7) / 0.85) * 0.15;         // airborne 2–4s
          t.shWobA = 1.5 + (t.lx % 8) * 0.3;                      // wobble px
          t.shWobF = 1 + (t.ly % 3) * 0.5;                        // wobble cycles
          t.shWobP = (t.lx + t.ly) * 0.13;                        // wobble phase
          shedList.push(t);
        }
      }
      for (i = 0; i < all.length; i++) {
        t = all[i];
        if (t.omit || !t.band || t.isShed) continue;
        bandList.push(t);
        if (t.tw) twinkleList.push(t);
      }
      drawMosaic();
    }

    // Paint one band tessera (a slice of `img`) onto `octx` at its rest slot.
    function paintBandTile(octx, img, t, sx, sy, mx, my) {
      // source slice in the decoded image (tile maps to art rect at mx,my)
      var srcX = (t.left + t.hx - mx) * sx, srcY = (t.top + t.hy - my) * sy;
      var srcW = t.w * sx, srcH = t.h * sy;
      if (srcW <= 0 || srcH <= 0) return;
      octx.save();
      octx.globalAlpha = t.ho;
      // tiny rotation about tile centre
      var cxp = t.left + t.hx + t.w / 2, cyp = t.top + t.hy + t.h / 2;
      octx.translate(cxp, cyp); octx.rotate(t.hr * Math.PI / 180);
      octx.drawImage(img,
        Math.max(0, srcX), Math.max(0, srcY), srcW, srcH,
        -t.w / 2, -t.h / 2, t.w, t.h);
      // ORGANIC #6: bleed the outermost fragments toward the background colour
      // so they dissolve into the scene rather than ending as crisp chips.
      if (t.bleed > 0.02) {
        octx.globalAlpha = t.ho * t.bleed;
        octx.fillStyle = BLEED_BG;
        octx.fillRect(-t.w / 2, -t.h / 2, t.w, t.h);
      }
      octx.restore();
    }

    // Paint all band tesserae for `img` into an offscreen bitmap — the resting
    // mosaic frame (the dynamic shed chips stay out; they're drawn per-frame).
    // EXPENSIVE: thousands of queued draws ≈ hundreds of ms of raster, so the
    // results are cached per image+size and the neighbours are pre-rendered
    // during idle (primeBand) — a nav swap then reuses a ready bitmap.
    var bandCache = {};            // url -> {w, h, bmp}
    var BAND_CACHE_MAX = 5;
    function renderBand(img, dpr) {
      var off = document.createElement("canvas");
      off.width = mosaicCanvas.width; off.height = mosaicCanvas.height;
      var octx = off.getContext("2d");
      octx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var aw = mosaicData.artW, ah = mosaicData.artH, mx = mosaicData.marginX, my = mosaicData.marginY;
      var sx = img.width / aw, sy = img.height / ah;   // art-rect → source px scale
      for (var i = 0; i < bandList.length; i++) paintBandTile(octx, img, bandList[i], sx, sy, mx, my);
      return off;
    }
    function cachedBand(url, img, dpr) {
      var hit = bandCache[url];
      if (hit && hit.w === mosaicCanvas.width && hit.h === mosaicCanvas.height) return hit.bmp;
      var bmp = renderBand(img, dpr);
      // Canvas raster is lazy: force it NOW (at render/prime time) with a tiny
      // readback, so the ~15k-draw bill is never deferred into the animation.
      try { bmp.getContext("2d").getImageData(0, 0, 1, 1); } catch (e) {}
      var keys = Object.keys(bandCache);
      if (keys.length >= BAND_CACHE_MAX) delete bandCache[keys[0]];
      bandCache[url] = { w: mosaicCanvas.width, h: mosaicCanvas.height, bmp: bmp };
      return bmp;
    }
    // Pre-render a card's band bitmap during idle so a nav swap only assembles
    // ready bitmaps.
    function primeBand(i) {
      var url = cardImgUrl(cards[i]);
      if (!url) return;
      var hit = bandCache[url];
      if (hit && hit.w === mosaicCanvas.width && hit.h === mosaicCanvas.height) return;
      getDecodedImg(url).then(function (img) {
        if (!img || !img.width) return;
        cachedBand(url, img, mosaicCanvas.width / Math.max(1, size.cw));
      });
    }

    // Render the static mosaic frame for the CURRENT card and blit it to the
    // visible canvas. Called on size/card change.
    function drawMosaic() {
      if (!mosaicCanvas) return;
      var dpr = sizeCanvas();
      var ctx = mosaicCanvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size.cw, size.ch);

      var imgP = currentImg();
      if (!imgP) { staticBitmap = null; return; }   // not decoded yet — draw on settle
      imgP.then(function (img) {
        if (!img || !img.width) return;
        curArtImg = img;                       // shed chips slice from this
        staticBitmap = cachedBand(cardImgUrl(cards[index]), img, dpr);
        // Sample sparkle colours straight from the SOURCE image at each tile's
        // position — independent of the rendered tile's alpha/bleed — so the glint
        // is the true local art colour on every card, including narrow-aspect art
        // (the rendered-bitmap read picked up the dark bleed/transparent gaps and
        // produced wrong colours, worst on the most-stretched images).
        sampleSparkColors(img);
        blitFrame(0); startTwinkle();
      });
    }

    // Read each twinkle tile's colour from a small downscaled copy of the SOURCE
    // image, mapped through the SAME art-rect→image stretch the tiles use, then
    // brighten by hue. Margin/rim tiles (outside the art rect) clamp to the nearest
    // edge pixel so they take the art's border colour rather than a gap/black.
    function sampleSparkColors(img) {
      if (!twinkleList.length) return;
      try {
        var SW = 120, SH = Math.max(1, Math.round(SW * (img.height / img.width)));
        var sc = document.createElement("canvas");
        sc.width = SW; sc.height = SH;
        var sctx = sc.getContext("2d");
        sctx.drawImage(img, 0, 0, SW, SH);
        var data = sctx.getImageData(0, 0, SW, SH).data;
        var aw = mosaicData.artW || size.cw, ah = mosaicData.artH || size.ch;
        var mx = mosaicData.marginX || 0, my = mosaicData.marginY || 0;
        for (var i = 0; i < twinkleList.length; i++) {
          var t = twinkleList[i];
          // tile centre in ART-RECT space (0..1), then to the downscaled image.
          var fx = (t.left + t.hx + t.w / 2 - mx) / aw;
          var fy = (t.top + t.hy + t.h / 2 - my) / ah;
          fx = Math.max(0, Math.min(1, fx));     // clamp rim tiles to the edge
          fy = Math.max(0, Math.min(1, fy));
          var sxp = Math.max(0, Math.min(SW - 1, Math.round(fx * (SW - 1))));
          var syp = Math.max(0, Math.min(SH - 1, Math.round(fy * (SH - 1))));
          var o = (syp * SW + sxp) * 4;
          var R = data[o], G = data[o + 1], B = data[o + 2];
          var mx2 = Math.max(R, G, B);
          // Near-black pixel carries no usable hue → warm gold glint.
          if (mx2 < 10) { t.sparkColor = "#e8c878"; continue; }
          // GLINT BRIGHTNESS by HUE: scale all channels by a common gain so the
          // brightest channel reaches a high TARGET (≈215). This keeps the sampled
          // hue/saturation but guarantees the glint is luminous even on very dark
          // art (e.g. the High Priestess, whose pixels are mostly near-black blue —
          // the old gain cap of 1.9 left them muddy and dim).
          var TARGET = 215;
          var gain = TARGET / mx2;
          R = Math.min(255, Math.round(R * gain));
          G = Math.min(255, Math.round(G * gain));
          B = Math.min(255, Math.round(B * gain));
          t.sparkColor = "rgb(" + R + "," + G + "," + B + ")";
        }
      } catch (e) {
        // tainted canvas — leave sparkColor unset so blitFrame uses the gold fallback
      }
    }

    // Blit the cached static frame, then draw the active glints for time `ts`.
    function blitFrame(ts) {
      if (!mosaicCanvas || !staticBitmap) return;
      var ctx = mosaicCanvas.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, mosaicCanvas.width, mosaicCanvas.height);
      ctx.drawImage(staticBitmap, 0, 0);
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // ── IDLE DISSOLVE: the shed rim chips. Each slot is dormant for most of
      // its cycle, then its tessera detaches from the artwork's perimeter and
      // takes a slow 2–4s flight: drifting outward with a slight rise and a
      // gentle perpendicular wobble (no straight lines), SHRINKING and fading
      // to nothing. The chip is a slice of the art itself, so every particle
      // carries the true local colour of the pixels it detached from — no
      // fixed tint, no glint dot. Sparse by design: ~50–75 airborne at once,
      // quiet erosion rather than a snowstorm. Runs inside the loop that
      // already drives the twinkle; cost is negligible.
      if (shedList.length && curArtImg) {
        var aw = mosaicData.artW, ah = mosaicData.artH;
        var mx = mosaicData.marginX, my = mosaicData.marginY;
        var ssx = curArtImg.width / aw, ssy = curArtImg.height / ah;
        for (var k = 0; k < shedList.length; k++) {
          var st = shedList[k];
          var ph = ((ts / st.shPeriod) + st.shPhase) % 1;
          if (ph >= st.shLife) continue;        // dormant — slot sits empty
          var lp = ph / st.shLife;              // 0..1 over the particle's life
          // envelope: quick detach fade-in, then a long fade to nothing
          var a = st.ho * Math.min(1, lp / 0.12) *
                  (lp > 0.35 ? Math.max(0, 1 - (lp - 0.35) / 0.62) : 1);
          if (a <= 0.01) continue;
          var srcX = (st.left + st.hx - mx) * ssx, srcY = (st.top + st.hy - my) * ssy;
          var srcW = st.w * ssx, srcH = st.h * ssy;
          if (srcW <= 0 || srcH <= 0) continue;
          // ease-out drift away from the rim + gentle turbulence across it
          var mv = 1 - (1 - lp) * (1 - lp);
          var wob = Math.sin(lp * st.shWobF * 6.2832 + st.shWobP) * st.shWobA * lp;
          ctx.translate(st.left + st.hx + st.w / 2 + st.shDx * mv + st.shPx * wob,
                        st.top + st.hy + st.h / 2 + st.shDy * mv + st.shPy * wob);
          ctx.rotate((st.hr + st.rotJit * lp) * Math.PI / 180);
          // the freed tessera shrinks away as it dies
          var sc = 1.6 * (1 - 0.72 * lp);
          ctx.globalAlpha = a;
          ctx.drawImage(curArtImg,
            Math.max(0, srcX), Math.max(0, srcY), srcW, srcH,
            -st.w * sc / 2, -st.h * sc / 2, st.w * sc, st.h * sc);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        ctx.globalAlpha = 1;
      }
      // sparkle overlay — only the .tw subset, opacity driven by a 5s cycle
      var CYCLE = 5000;
      // The whole TILE shimmers in its own image colour: a `lighten` blend lifts
      // each twinkling tessera with its sampled (brightened) hue over the cycle,
      // so the chip itself sparkles rather than a single dot on it. A small bright
      // glint point is added at the peak for a sharp catch-light.
      ctx.save();
      ctx.globalCompositeOperation = "lighten";
      for (var i = 0; i < twinkleList.length; i++) {
        var t = twinkleList[i];
        // phase: peak at 85% of cycle, dark elsewhere (matches old keyframe)
        var ph = (((ts / CYCLE) + (-t.lt / 5)) % 1 + 1) % 1;
        var a = ph > 0.70 ? (1 - Math.abs(ph - 0.85) / 0.15) : 0;
        if (a <= 0) continue;
        a = Math.max(0, Math.min(1, a)) * t.lb;
        var col = t.sparkColor || "#fff4c4";
        var cxp = t.left + t.hx + t.w / 2, cyp = t.top + t.hy + t.h / 2;
        ctx.translate(cxp, cyp); ctx.rotate(t.hr * Math.PI / 180);
        // 1) DELICATE colour shimmer — a soft, partial glow over the centre of the
        // tile (not the whole chip) at low alpha, so the sparkle is gentle.
        ctx.globalAlpha = a * 0.35;
        ctx.fillStyle = col;
        var gw = t.w * 0.55, gh = t.h * 0.55;
        ctx.fillRect(-gw / 2, -gh / 2, gw, gh);
        // 2) fine catch-light glint at the tile's highlight point
        ctx.globalAlpha = a * 0.85;
        var sp = t.sp;
        var gx = (t.lx / 100 - 0.5) * t.w, gy = (t.ly / 100 - 0.5) * t.h;
        ctx.fillRect(gx - sp / 2, gy - sp / 2, sp, sp);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);   // reset for next tile
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    function twinkleFrame(ts) {
      blitFrame(ts);
      if (twRunning) twRaf = requestAnimationFrame(twinkleFrame);
    }
    function startTwinkle() {
      if (twRunning || reduce) return;
      twRunning = true; twRaf = requestAnimationFrame(twinkleFrame);
    }
    function stopTwinkle() {
      twRunning = false;
      if (twRaf) { cancelAnimationFrame(twRaf); twRaf = null; }
    }

    function setCard(i) {
      index = i;
      var c = cards[index];
      if (numEl) numEl.textContent = c.roman;
      if (nameEl) nameEl.textContent = c.name;
      if (kwEl) kwEl.textContent = (c.keywords || []).join(" \u00b7 ");
      if (watermark) watermark.textContent = c.roman;
      if (backBody) backBody.innerHTML =
        '<div class="b-eyebrow">CARD ' + esc(c.num) + '</div>' +
        '<div class="b-name">' + esc(c.name) + '</div>' +
        '<div class="b-div"><span></span><span class="dot">\u2726</span><span></span></div>' +
        '<div class="b-element"><span class="glyph">' + elementGlyphSVG(c.element) +
          '</span><span class="b-el-text"><em>ELEMENT</em>' + esc(c.element) + '</span></div>' +
        '<p class="b-meaning">' + esc(c.meaning) + '</p>' +
        '<div class="b-foot">MAJOR ARCANA \u00b7 ' + esc(c.num) + ' OF XXI</div>';
      setV(frontEl, "--img", imgFor(c));
      frontEl.classList.toggle("has-image", !!c.image);
      var f = (parseInt(c.num, 10) / 21) * 100;
      if (railFill) railFill.style.width = f + "%";
      if (railBead) railBead.style.left = f + "%";
      var p = cards[prevI()], nx = cards[nextI()];
      if (prevEm) prevEm.textContent = p.roman;
      if (prevLbl) prevLbl.textContent = "\u2190 " + p.name.replace("THE ", "");
      if (nextEm) nextEm.textContent = nx.roman;
      if (nextLbl) nextLbl.textContent = nx.name.replace("THE ", "") + " \u2192";
      if (onCard) onCard(c, index, { prev: p, next: nx });
      drawMosaic();                    // re-render the canvas mosaic for the new card
    }

    function applyTilt() {
      var t = tilt, mag = Math.min(1, Math.sqrt(t.rx * t.rx + t.ry * t.ry) / 15);
      // Gentler foil/glare so the sheen glides instead of flashing on hover.
      // In bare mode (home title card) the hover lighting is dropped entirely —
      // the card keeps its tilt motion but no sheen sweep.
      var foil = (!bare && t.on) ? 0.12 + mag * 0.16 : 0;
      var glare = (!bare && t.on) ? 0.08 + mag * 0.18 : 0;
      tiltEl.style.transform = busy
        ? "rotateX(0deg) rotateY(0deg) scale(1)"
        : "rotateX(" + t.rx + "deg) rotateY(" + t.ry + "deg) scale(" + (t.on ? 1.03 : 1) + ")";
      setV(flipEl, "--gx", t.gx + "%"); setV(flipEl, "--gy", t.gy + "%");
      setV(flipEl, "--foil", foil); setV(flipEl, "--glare", glare);
      if (neb) neb.style.transform = "translate(" + (t.ry * -1.4) + "px," + (t.rx * 1.4) + "px)";
      if (floatEl) floatEl.style.animationPlayState = (t.on || busy) ? "paused" : "running";
    }
    function onMove(cx, cy) {
      if (busy) return;
      var r = tiltEl.getBoundingClientRect();
      var px = (cx - r.left) / r.width, py = (cy - r.top) / r.height, MAX = 15;
      tilt.rx = -(py - 0.5) * MAX; tilt.ry = (px - 0.5) * MAX;
      tilt.gx = px * 100; tilt.gy = py * 100; tilt.on = true;
      applyTilt();
    }
    function resetTilt() { tilt.rx = 0; tilt.ry = 0; tilt.gx = 50; tilt.gy = 50; tilt.on = false; applyTilt(); }

    function updateFlip() { flipEl.classList.toggle("is-flipped", flipped); }
    function updateHint() { if (hintEl) hintEl.textContent = "MOVE TO TILT \u00b7 CLICK TO " + (flipped ? "RETURN" : "REVEAL"); }
    function toggleFlip() { if (busy) return; flipped = !flipped; updateFlip(); updateHint(); }
    function setDisabled() { if (prevBtn) prevBtn.disabled = busy; if (nextBtn) nextBtn.disabled = busy; }
    function clearTimers() { for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]); timers = []; }

    // Decode each card's image ONCE and keep the decoded bitmap warm in cache, so
    // a swap paints the picture in a single frame instead of streaming it in
    // top-to-bottom. Returns a promise that resolves when the image is ready.
    var imgCache = {};
    function preloadCard(i) {
      var card = cards[i]; if (!card || !card.image) return Promise.resolve();
      if (imgCache[card.image]) return imgCache[card.image];
      var im = new Image();
      im.src = card.image;
      var p = (im.decode ? im.decode().catch(function () {}) : new Promise(function (res) {
        im.onload = res; im.onerror = res;
      })).then(function () { return im; });
      imgCache[card.image] = p;
      return p;
    }

    // Pause/resume all the idle sparkle animations during a transition. The
    // twinkles run perpetually and compete for the main thread exactly when we
    // need it for the image swap, so we freeze them while busy and resume after
    // the new card has settled. A class toggle (animation-play-state) is the
    // cheapest possible switch — no per-tile work. The hero page can listen for
    // the dispatched events to pause its own background sparkle field too.
    function setAnimPaused(paused) {
      container.classList.toggle("anim-paused", paused);
      if (paused) stopTwinkle(); else startTwinkle();
      try {
        container.dispatchEvent(new CustomEvent(
          paused ? "arcana:transition-start" : "arcana:transition-end",
          { bubbles: true }
        ));
      } catch (e) { /* CustomEvent unsupported — non-fatal */ }
    }

    // Navigation swap: a plain opacity cross-fade. The card fades out, the next
    // card's art + mosaic swap in beneath the fade, then it fades back up.
    // (A tessera-dissolve transition was tried here and removed: the dissolve
    // belongs to the card's RESTING state, not to navigation.)
    // Assumes `busy` is already set by dissolve().
    function fadeSwap(target) {
      var FADE = 200;
      flipEl.style.transition = "opacity " + FADE + "ms ease";
      flipEl.style.opacity = "0";
      var finished = false;
      function finish() {
        if (finished) return;
        finished = true;
        setCard(target);                              // swap the card art + mosaic beneath the fade
        flipEl.style.opacity = "1";
        preloadCard(nextI()); preloadCard(prevI());   // warm the neighbours
        timers.push(setTimeout(function () {
          flipEl.style.transition = "";
          container.classList.remove("is-shifting");
          busy = false; setDisabled(); applyTilt();
          setAnimPaused(false);                       // resume idle twinkle once settled
          // pre-render the new neighbours' band bitmaps off the critical path
          timers.push(setTimeout(function () { primeBand(nextI()); primeBand(prevI()); }, 300));
        }, FADE + 20));
      }
      // Swap only once BOTH the fade-out has played AND the target art is decoded,
      // so the new card appears whole in one frame instead of streaming in.
      var ready = preloadCard(target);
      var faded = new Promise(function (res) { timers.push(setTimeout(res, FADE)); });
      Promise.all([ready, faded]).then(finish);
      // Safety net: never strand `busy` if a decode stalls or rejects.
      timers.push(setTimeout(finish, FADE + 500));
    }

    function dissolve(target, dir) {
      if (busy || target === index) return;
      if (reduce || !size.cw) { setCard(target); flipped = false; updateFlip(); updateHint(); return; }
      busy = true; flipped = false; updateFlip(); setDisabled();
      clearTimers();
      setAnimPaused(true);                    // freeze idle twinkle for the swap
      container.classList.add("is-shifting"); // fades the card's own text plates (CSS)
      fadeSwap(target);
    }

    function initStars() {
      if (!canvas || !canvas.getContext) return;
      var ctx = canvas.getContext("2d");
      var w, h, dpr, stars = [], raf, running = true;
      function resize() {
        dpr = Math.min(global.devicePixelRatio || 1, 2);
        w = canvas.clientWidth; h = canvas.clientHeight;
        canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var r = rng(99), count = Math.min(150, Math.round((w * h) / 9000));
        stars = [];
        for (var i = 0; i < count; i++) stars.push({ x: r() * w, y: r() * h, r: 0.3 + r() * 1.4, a: 0.15 + r() * 0.55, sp: 0.4 + r() * 1.4, ph: r() * 6.28 });
      }
      function draw(ts) {
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < stars.length; i++) {
          var s = stars[i];
          var a = reduce ? s.a : s.a + Math.sin(ts / 1000 * s.sp + s.ph) * 0.28;
          ctx.globalAlpha = Math.max(0, Math.min(1, a)); ctx.fillStyle = "#f6e4b0";
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
        }
        ctx.globalAlpha = 1; if (running && !reduce) raf = requestAnimationFrame(draw);
      }
      resize(); reduce ? draw(0) : (raf = requestAnimationFrame(draw));
      global.addEventListener("resize", resize);
    }

    function observeSize() {
      // Rebuilding the mosaic means recreating ~thousands of DOM tiles, so it must
      // NOT run on every intermediate pixel of a resize/scroll (that janks the UI).
      // Only rebuild once the size has SETTLED (debounced) and changed meaningfully.
      var rebuildTimer = null;
      function apply() {
        var r = tiltEl.getBoundingClientRect();
        // 4px threshold ignores sub-pixel / tiny fluctuations entirely.
        if (r.width > 2 && (Math.abs(r.width - size.cw) > 4 || Math.abs(r.height - size.ch) > 4)) {
          if (rebuildTimer) clearTimeout(rebuildTimer);
          rebuildTimer = setTimeout(function () {
            var rr = tiltEl.getBoundingClientRect();
            if (rr.width < 2) return;
            size.cw = rr.width; size.ch = rr.height;
            mosaicData = buildMosaic(size.cw, size.ch);
            applySize(); buildRest();
          }, 160);
        }
      }
      // initial build runs immediately (no debounce) so first paint is correct
      var r0 = tiltEl.getBoundingClientRect();
      if (r0.width > 2) { size.cw = r0.width; size.ch = r0.height; mosaicData = buildMosaic(size.cw, size.ch); applySize(); buildRest(); }
      if ("ResizeObserver" in global) { new ResizeObserver(apply).observe(tiltEl); }
      else global.addEventListener("resize", apply);
    }

    // wire events
    tiltEl.addEventListener("mousemove", function (e) { onMove(e.clientX, e.clientY); });
    tiltEl.addEventListener("mouseleave", resetTilt);
    tiltEl.addEventListener("touchmove", function (e) { var t = e.touches[0]; if (t) { e.preventDefault(); onMove(t.clientX, t.clientY); } }, { passive: false });
    tiltEl.addEventListener("touchend", resetTilt);
    tiltEl.addEventListener("click", toggleFlip);
    tiltEl.addEventListener("keydown", function (e) {
      if (busy) return;
      if (e.key === "ArrowLeft") dissolve(prevI(), -1);
      else if (e.key === "ArrowRight") dissolve(nextI(), 1);
      else if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggleFlip(); }
    });
    if (prevBtn) prevBtn.addEventListener("click", function () { dissolve(prevI(), -1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { dissolve(nextI(), 1); });

    // first paint
    setCard(index); applySize(); buildRest(); applyTilt(); updateHint();
    initStars(); observeSize();

    // Warm the DECODED-image cache for the immediate neighbours (separate from the
    // nav preload cache) so the very first stardust dissolve has its chips ready,
    // then pre-render their band bitmaps once the first paint has settled.
    (function () {
      var nc = cards[nextI()], pc = cards[prevI()];
      if (nc && nc.image) getDecodedImg(nc.image);
      if (pc && pc.image) getDecodedImg(pc.image);
      timers.push(setTimeout(function () { primeBand(nextI()); primeBand(prevI()); }, 700));
    })();

    // Warm the cache: decode the immediate neighbours now (so the first nav is
    // instant), then lazily decode the rest of the deck in the background.
    preloadCard(index); preloadCard(nextI()); preloadCard(prevI());
    if (global.requestIdleCallback) {
      global.requestIdleCallback(function () {
        for (var k = 0; k < cards.length; k++) preloadCard(k);
      });
    } else {
      setTimeout(function () { for (var k = 0; k < cards.length; k++) preloadCard(k); }, 800);
    }

    return {
      next: function () { dissolve(nextI(), 1); },
      prev: function () { dissolve(prevI(), -1); },
      flip: toggleFlip,
      go: function (i) { if (i !== index) dissolve(i, i > index ? 1 : -1); }
    };
  }

  function autoInit() {
    var nodes = document.querySelectorAll("[data-arcana-card]");
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i], cards;
      var dataEl = node.querySelector('script[type="application/json"]');
      if (dataEl) { try { cards = JSON.parse(dataEl.textContent); } catch (e) {} }
      else if (node.getAttribute("data-cards")) { try { cards = JSON.parse(node.getAttribute("data-cards")); } catch (e) {} }
      var startAttr = node.getAttribute("data-start");
      mount(node, { cards: cards, start: startAttr != null ? parseInt(startAttr, 10) : undefined });
    }
  }
  if (typeof document !== "undefined") {
    if (document.readyState !== "loading") autoInit();
    else document.addEventListener("DOMContentLoaded", autoInit);
  }

  global.ArcanaCards = { mount: mount, defaultCards: CARDS, buildMosaic: buildMosaic };

})(typeof window !== "undefined" ? window : this);
