/* ============================================================
   Arcana — Architectural hero INTRO orchestrator (v2).

   Pairs with arcana-hero-intro.css.

   v2 makes the ORBITAL MOTION the centerpiece:
     • Card-backs spawn on the orbit rings themselves and travel
       1.0–1.6 revolutions along elliptical paths before
       spiralling inward and dissolving at center.
     • Bright comet heads with fading trails streak along each
       of the three orbit ellipses for the full intro window.
     • The convergence emits three concentric shock rings —
       new orbital shells being born from the medallion.
     • Dust motes drift outward radially from the medallion
       so even the loose particles read as orbital.

   The cards are positioned with rAF (the orbit paths are
   ellipses, not CSS-expressible). The comets are appended into
   the existing <svg class="orbit-svg"> so they share the SVG's
   scale-to-fit coordinate system automatically.
   ============================================================ */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.addEventListener('DOMContentLoaded', start);

  let cardRAF = false;
  let cometRAF = false;
  let activeNodes = [];

  function start() {
    const heroSection = document.querySelector('.arcana-hero');
    if (!heroSection) return;

    const wrap = heroSection.querySelector('.main-card-wrap');
    const heroRight = heroSection.querySelector('.hero-right');
    if (!wrap || !heroRight) return;

    cleanupNodes();
    document.body.classList.add('intro-running');

    // ── Read medallion size for orbit radii ────────────────
    // Force a layout read so we get accurate dimensions.
    const wrapRect = wrap.getBoundingClientRect();
    const medR = wrapRect.width / 2;
    // Three orbital radii spaced outward from the medallion edge
    const ORBIT_RADII = [
      medR * 1.20,
      medR * 1.46,
      medR * 1.76,
    ];
    // Slight vertical squish so the orbits feel elliptical
    // (matches the visual character of the SVG rings).
    const ELLIPSE_SQUISH = 0.86;

    // ── 1) Orbiting card-backs ─────────────────────────────
    const N = 7;
    const baseDur = 1900;
    const startAt = performance.now() + 260;

    const cards = [];
    for (let i = 0; i < N; i++) {
      const ringR = ORBIT_RADII[i % ORBIT_RADII.length];
      const startAngle = (i / N) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const sweep = (Math.PI * 2) * (1.0 + Math.random() * 0.6);
      const dir = (i % 2 === 0) ? 1 : -1;
      const dur = baseDur + Math.random() * 220;
      const delay = i * 75;

      const el = document.createElement('div');
      el.className = 'intro-flyin';
      // Park off-screen until first frame
      el.style.transform = 'translate(-9999px,-9999px)';
      el.style.opacity = '0';
      wrap.appendChild(el);
      activeNodes.push(el);

      cards.push({
        el,
        ringR,
        startAngle, sweep, dir, dur, delay,
        rotSpin: dir * (360 + Math.random() * 400),
      });
    }

    cardRAF = true;
    function tickCards(now) {
      if (!cardRAF) return;
      const elapsed = now - startAt;
      let allDone = true;
      for (const c of cards) {
        const t = (elapsed - c.delay) / c.dur;
        if (t < 0)  { allDone = false; continue; }
        if (t >= 1) { c.el.style.opacity = '0'; continue; }
        allDone = false;

        // Ease-in-out cubic for angular travel
        const e = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
        const angle = c.startAngle + c.dir * c.sweep * e;

        // Radius collapses in the last 35% of the journey
        let r;
        if (t < 0.65) {
          r = c.ringR;
        } else {
          const k = (t - 0.65) / 0.35;
          const ke = 1 - Math.pow(1 - k, 3);
          r = c.ringR * (1 - ke);
        }

        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r * ELLIPSE_SQUISH;

        // Scale up at spawn, stay ~1.0 on the ring, shrink as it collapses
        let s;
        if (t < 0.15)       s = 0.55 + (t / 0.15) * 0.55;
        else if (t < 0.65)  s = 1.10;
        else                s = 1.10 - ((t - 0.65) / 0.35) * 0.95;

        // Opacity: fade in / out at the edges
        let op;
        if (t < 0.12)       op = t / 0.12;
        else if (t > 0.92)  op = (1 - t) / 0.08;
        else                op = 1;

        const rot = c.rotSpin * e;
        c.el.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${s})`;
        c.el.style.opacity = op.toString();
      }
      if (allDone && elapsed > 200) {
        cards.forEach(c => c.el.remove());
        cardRAF = false;
        return;
      }
      requestAnimationFrame(tickCards);
    }
    requestAnimationFrame(tickCards);

    // ── 2) Convergence flash + three ripple shells ─────────
    // The shells read as new orbital rings expanding outward.
    const flashAt = (startAt - performance.now()) + baseDur * 0.92;
    setTimeout(() => {
      const flash = document.createElement('div');
      flash.className = 'intro-flash';
      wrap.appendChild(flash);
      activeNodes.push(flash);
      setTimeout(() => flash.remove(), 1300);

      [0, 180, 360].forEach((d, idx) => {
        const ring = document.createElement('div');
        ring.className = 'intro-ring';
        ring.style.animationDelay = d + 'ms';
        if (idx === 1) ring.style.borderColor = 'rgba(232,200,136,.55)';
        if (idx === 2) ring.style.borderColor = 'rgba(196,147,58,.45)';
        wrap.appendChild(ring);
        activeNodes.push(ring);
        setTimeout(() => ring.remove(), 1700 + d);
      });
    }, Math.max(0, flashAt));

    // ── 3) Comet sparks racing along orbit rings ───────────
    spawnOrbitComets(heroSection);

    // ── 4) Dust motes — radial drift from medallion outward
    spawnDustMotes(wrap, heroRight);

    // ── 5) End of intro — release the page back to hero JS
    setTimeout(() => {
      document.body.classList.remove('intro-running');
    }, 3400);
  }

  // -----------------------------------------------------------
  // Bright comet heads with fading trails, traveling along each
  // orbit ellipse. Inserted into the existing .orbit-svg so they
  // share its viewBox + scale-to-fit positioning.
  // -----------------------------------------------------------
  function spawnOrbitComets(heroSection) {
    const svg = heroSection.querySelector('.orbit-svg');
    if (!svg) return;
    const NS = 'http://www.w3.org/2000/svg';
    const ellipses = Array.from(svg.querySelectorAll('ellipse'));
    if (!ellipses.length) return;

    const comets = [];
    ellipses.forEach((el, ringIdx) => {
      const cx = +el.getAttribute('cx');
      const cy = +el.getAttribute('cy');
      const rx = +el.getAttribute('rx');
      const ry = +el.getAttribute('ry');

      // 2 comets per ring, on opposite sides
      for (let k = 0; k < 2; k++) {
        const TRAIL_N = 10;
        const trail = [];
        for (let i = 0; i < TRAIL_N; i++) {
          const t = document.createElementNS(NS, 'circle');
          t.classList.add('intro-comet');
          t.setAttribute('r', String(Math.max(0.8, 3.6 - i * 0.28)));
          t.setAttribute('fill', '#fff5cc');
          t.style.filter = 'drop-shadow(0 0 5px rgba(232,200,136,.9))';
          svg.appendChild(t);
          trail.push(t);
          activeNodes.push(t);
        }
        const head = document.createElementNS(NS, 'circle');
        head.classList.add('intro-comet');
        head.setAttribute('r', '4.8');
        head.setAttribute('fill', '#fff8d8');
        head.style.filter = 'drop-shadow(0 0 14px rgba(255,235,180,1))';
        svg.appendChild(head);
        activeNodes.push(head);

        comets.push({
          cx, cy, rx, ry,
          phase: k * Math.PI + ringIdx * 0.7,
          speed: 0.0034 - ringIdx * 0.0007,
          dir: ringIdx % 2 === 0 ? 1 : -1,
          head, trail,
          trailLag: 0.045,
        });
      }
    });

    const startT = performance.now();
    const DURATION = 3000;
    cometRAF = true;
    function tick(now) {
      if (!cometRAF) return;
      const elapsed = now - startT;
      // Fade-in at start, fade-out at end so they bracket the intro
      const lifeT = elapsed / DURATION;
      let env;
      if (lifeT < 0.10)      env = lifeT / 0.10;
      else if (lifeT > 0.82) env = Math.max(0, (1 - lifeT) / 0.18);
      else                   env = 1;

      comets.forEach(c => {
        const a = c.phase + (elapsed * c.speed * c.dir);
        c.head.setAttribute('cx', c.cx + Math.cos(a) * c.rx);
        c.head.setAttribute('cy', c.cy + Math.sin(a) * c.ry);
        c.head.style.opacity = String(env);
        c.trail.forEach((t, i) => {
          const ai = a - c.dir * c.trailLag * (i + 1);
          t.setAttribute('cx', c.cx + Math.cos(ai) * c.rx);
          t.setAttribute('cy', c.cy + Math.sin(ai) * c.ry);
          const baseOp = (1 - (i + 1) / (c.trail.length + 1)) * 0.75;
          t.style.opacity = String(baseOp * env);
        });
      });

      if (elapsed < DURATION + 50) {
        requestAnimationFrame(tick);
      } else {
        comets.forEach(c => {
          c.head.remove();
          c.trail.forEach(t => t.remove());
        });
        cometRAF = false;
      }
    }
    requestAnimationFrame(tick);
  }

  // -----------------------------------------------------------
  // Sparse dust motes drifting radially outward from the
  // medallion. Lower count than v1 so the orbits stay readable.
  // -----------------------------------------------------------
  function spawnDustMotes(wrap, heroRight) {
    const wrapRect = wrap.getBoundingClientRect();
    const rightRect = heroRight.getBoundingClientRect();
    // Medallion center in heroRight-local coords
    const cx = wrapRect.left - rightRect.left + wrapRect.width / 2;
    const cy = wrapRect.top  - rightRect.top  + wrapRect.height / 2;

    for (let i = 0; i < 14; i++) {
      const m = document.createElement('div');
      m.className = 'intro-mote';
      const ang = Math.random() * Math.PI * 2;
      const startR = wrapRect.width * (0.25 + Math.random() * 0.30);
      const endR   = wrapRect.width * (0.85 + Math.random() * 0.5);
      const x0 = cx + Math.cos(ang) * startR;
      const y0 = cy + Math.sin(ang) * startR;
      m.style.left = x0 + 'px';
      m.style.top  = y0 + 'px';
      m.style.setProperty('--mx', (Math.cos(ang) * (endR - startR)) + 'px');
      m.style.setProperty('--my', (Math.sin(ang) * (endR - startR)) + 'px');
      m.style.setProperty('--dur',   (1800 + Math.random() * 1600) + 'ms');
      m.style.setProperty('--delay', (400  + Math.random() * 1800) + 'ms');
      const size = 2 + Math.random() * 3;
      m.style.width = m.style.height = size + 'px';
      heroRight.appendChild(m);
      activeNodes.push(m);
      setTimeout(() => { if (m.parentNode) m.remove(); }, 5000);
    }
  }

  function cleanupNodes() {
    cardRAF = false;
    cometRAF = false;
    activeNodes.forEach(n => { if (n.parentNode) n.remove(); });
    activeNodes = [];
    document.querySelectorAll('.intro-flyin, .intro-flash, .intro-ring, .intro-mote, .intro-comet')
      .forEach(n => n.remove());
  }
})();
