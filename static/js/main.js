/* ============================================================
   ARCANA TAROT — Main JS
   ============================================================ */

/* ---- Star field ------------------------------------------- */
(function initStars() {
  const canvas = document.getElementById('stars-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = document.documentElement.scrollHeight;
  }

  function makeStars(n) {
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 0.75 + 0.12,
      speed: Math.random() * 0.0007 + 0.0002,
      phase: Math.random() * Math.PI * 2,
    }));
  }

  function draw(ts) {
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => {
      const a = 0.08 + 0.18 * (0.5 + 0.5 * Math.sin(ts * s.speed + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      /* Warm ivory colour matching the Art Nouveau palette */
      ctx.fillStyle = `rgba(220,205,172,${a})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); makeStars(110); });
  resize();
  makeStars(110);
  requestAnimationFrame(draw);
})();

/* ---- Floating golden motes (hero only) -------------------- */
(function initMotes() {
  const canvas = document.querySelector('.motes-canvas');
  if (!canvas) return;

  const hero = canvas.closest('.hero');
  Object.assign(canvas.style, {
    position: 'absolute', inset: '0',
    width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '2',
  });

  const ctx = canvas.getContext('2d');
  let motes = [];
  let W, H;

  function resize() {
    W = canvas.width  = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
  }

  function makeMotes(n) {
    motes = Array.from({ length: n }, () => resetMote({}, true));
  }

  function resetMote(m, scatter) {
    m.x     = Math.random() * W;
    m.y     = scatter ? Math.random() * H : H + 4;
    m.r     = Math.random() * 0.9 + 0.25;
    m.vy    = -(Math.random() * 0.18 + 0.06);   /* upward drift */
    m.vx    = (Math.random() - 0.5) * 0.08;     /* gentle sideways */
    m.a     = 0;
    m.maxA  = Math.random() * 0.14 + 0.04;
    m.life  = 0;
    m.maxLife = Math.random() * 400 + 300;
    return m;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    motes.forEach(m => {
      m.y += m.vy;
      m.x += m.vx;
      m.life++;

      /* Fade in for first 15% of life, fade out for last 20% */
      const t = m.life / m.maxLife;
      if (t < 0.15)      m.a = m.maxA * (t / 0.15);
      else if (t > 0.80) m.a = m.maxA * ((1 - t) / 0.20);
      else               m.a = m.maxA;

      if (m.life > m.maxLife || m.y < -4) resetMote(m, false);

      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212,168,80,${m.a})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); });
  resize();
  makeMotes(38);
  draw();
})();

/* ---- Mobile nav toggle ------------------------------------ */
const navToggle = document.getElementById('navToggle');
const navLinks  = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  /* Close on outside click */
  document.addEventListener('click', e => {
    if (!e.target.closest('.navbar')) navLinks.classList.remove('open');
  });
}

/* ---- Smooth scroll for in-page anchors -------------------- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

/* ---- Major Arcana journey carousel ------------------------ */
(function initJourney() {
  if (typeof ARCANA === 'undefined' || !ARCANA.length) return;

  const N = ARCANA.length;   /* 22 */

  const circPrev  = document.getElementById('jCirclePrev');
  const circCurr  = document.getElementById('jCircleCurrent');
  const circNext  = document.getElementById('jCircleNext');
  const symPrev   = document.getElementById('jSymPrev');
  const symCurr   = document.getElementById('jSymCurrent');
  const symNext   = document.getElementById('jSymNext');
  const lblPrev   = document.getElementById('jLblPrev');
  const lblCurr   = document.getElementById('jLblCurrent');
  const lblNext   = document.getElementById('jLblNext');
  const imgPrev   = document.getElementById('jImgPrev');
  const imgCurr   = document.getElementById('jImgCurrent');
  const imgNext   = document.getElementById('jImgNext');
  const videoEl   = document.getElementById('jVideo');
  const linkCurr  = document.getElementById('jLinkCurrent');
  const nameEl    = document.getElementById('hciName');
  const kwEl      = document.getElementById('hciKw');
  const descEl    = document.getElementById('hciDesc');
  const barEl     = document.getElementById('stageProgressBar');
  const journey   = document.getElementById('heroJourney');

  let current  = 0;
  let autoTimer = null, barTimer = null, fadeTimer = null;
  const INTERVAL = 5000, BAR_STEP = 50;
  let barValue = 0;

  function idx(i) { return ((i % N) + N) % N; }

  function setImg(imgEl, url) {
    if (!imgEl) return;
    imgEl.classList.remove('loaded');
    if (!url) { imgEl.src = ''; return; }
    imgEl.src = url;
    if (imgEl.complete && imgEl.naturalWidth > 0) {
      // Double-rAF ensures the browser renders opacity:0 before transitioning back in
      requestAnimationFrame(() => requestAnimationFrame(() => imgEl.classList.add('loaded')));
    } else {
      imgEl.onload = () => imgEl.classList.add('loaded');
    }
  }

  function applyCard(circEl, symEl, lblEl, imgEl, card) {
    if (!card) return;
    if (circEl) circEl.style.setProperty('--card-color', card.card_color);
    if (symEl) {
      symEl.classList.add('fading');
      const sym = card.symbol;
      setTimeout(() => { symEl.textContent = sym; symEl.classList.remove('fading'); }, 220);
    }
    if (lblEl) lblEl.textContent = card.name;
    setImg(imgEl, card.image_url || '');
  }

  function goTo(i) {
    current = idx(i);
    const p = idx(current - 1);
    const n = idx(current + 1);

    applyCard(circPrev, symPrev, lblPrev, imgPrev, ARCANA[p]);
    applyCard(circCurr, symCurr, lblCurr, imgCurr, ARCANA[current]);
    applyCard(circNext, symNext, lblNext, imgNext, ARCANA[n]);

    /* Video for current card */
    if (videoEl) {
      const vid = ARCANA[current].video_url || '';
      if (vid) {
        if (videoEl.dataset.activeSrc !== vid) {
          videoEl.dataset.activeSrc = vid;
          videoEl.src = vid;
          videoEl.load();
        }
        videoEl.classList.add('active');
        videoEl.play().catch(() => {});
      } else {
        videoEl.classList.remove('active');
        videoEl.dataset.activeSrc = '';
        videoEl.src = '';
      }
    }

    /* Central circle links to its card detail page */
    if (linkCurr) linkCurr.href = '/card/' + ARCANA[current].id;

    /* Left panel live info — fade in sync with the symbol */
    const _name = ARCANA[current].name;
    const _kw   = ARCANA[current].keywords_upright.slice(0, 3).join(' · ');
    const _desc = ARCANA[current].description || '';
    if (nameEl) nameEl.style.opacity = '0';
    if (kwEl)   kwEl.style.opacity   = '0';
    if (descEl) descEl.style.opacity = '0';
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => {
      if (nameEl) { nameEl.textContent = _name; nameEl.style.opacity = '1'; }
      if (kwEl)   { kwEl.textContent   = _kw;   kwEl.style.opacity   = '1'; }
      if (descEl) { descEl.textContent = _desc; descEl.style.opacity = '1'; }
    }, 220);

    /* Reset progress bar */
    barValue = 0;
    if (barEl) barEl.style.width = '0%';
  }

  function startBar() {
    clearInterval(barTimer);
    barValue = 0;
    if (barEl) barEl.style.width = '0%';
    barTimer = setInterval(() => {
      barValue += (BAR_STEP / INTERVAL) * 100;
      if (barEl) barEl.style.width = Math.min(barValue, 100) + '%';
    }, BAR_STEP);
  }

  function startAuto() {
    clearInterval(autoTimer);
    startBar();
    autoTimer = setInterval(() => { goTo(current + 1); startBar(); }, INTERVAL);
  }

  function stopAuto() { clearInterval(autoTimer); clearInterval(barTimer); }

  /* Side circles navigate the journey (click = make that card current) */
  if (circPrev) circPrev.addEventListener('click', e => {
    e.preventDefault(); goTo(current - 1); startAuto();
  });
  if (circNext) circNext.addEventListener('click', e => {
    e.preventDefault(); goTo(current + 1); startAuto();
  });

  /* Hover on the whole journey panel pauses rotation */
  if (journey) {
    journey.addEventListener('mouseenter', stopAuto);
    journey.addEventListener('mouseleave', startAuto);
  }

  /* Arrow keys */
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { goTo(current - 1); startAuto(); }
    if (e.key === 'ArrowRight') { goTo(current + 1); startAuto(); }
  });

  goTo(0);
  startAuto();
})();

/* ---- Floating particles inside the central journey circle - */
(function initJourneyParticles() {
  const canvas = document.getElementById('jCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let W, H, R;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    R = Math.min(W, H) / 2 - 4;
  }

  function resetParticle(p) {
    /* Start from a random point on the circle's edge */
    const angle = Math.random() * Math.PI * 2;
    const r     = R * (0.3 + Math.random() * 0.7);
    p.x     = W / 2 + r * Math.cos(angle);
    p.y     = H / 2 + r * Math.sin(angle);
    p.r     = Math.random() * 1.0 + 0.25;
    p.vy    = -(Math.random() * 0.22 + 0.06);
    p.vx    = (Math.random() - 0.5) * 0.1;
    p.life  = 0;
    p.maxLife = Math.random() * 280 + 160;
    p.maxA  = Math.random() * 0.16 + 0.05;
    p.a     = 0;
    return p;
  }

  function makeParticles(n) {
    particles = Array.from({ length: n }, () => resetParticle({}));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* Clip all drawing to the circle */
    ctx.save();
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, R, 0, Math.PI * 2);
    ctx.clip();

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life++;

      const t = p.life / p.maxLife;
      if      (t < 0.15) p.a = p.maxA * (t / 0.15);
      else if (t > 0.80) p.a = p.maxA * ((1 - t) / 0.20);
      else               p.a = p.maxA;

      /* Recycle particle when expired or drifted out */
      const dx = p.x - W / 2, dy = p.y - H / 2;
      if (p.life > p.maxLife || dx * dx + dy * dy > R * R * 1.1) {
        resetParticle(p);
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212,168,80,${p.a})`;
      ctx.fill();
    });

    ctx.restore();
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); });
  resize();
  makeParticles(30);
  draw();
})();

/* ---- Card tile entrance animation (Intersection Observer) -- */
if (typeof IntersectionObserver !== 'undefined') {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.04 });

  document.querySelectorAll('.card-tile').forEach((tile, i) => {
    tile.style.opacity = '0';
    tile.style.transform = 'translateY(14px)';
    tile.style.transition = `opacity .4s ease ${(i % 24) * 0.033}s, transform .4s ease ${(i % 24) * 0.033}s`;
    obs.observe(tile);
  });

  document.querySelectorAll('.feature-card, .suit-card').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(14px)';
    el.style.transition = `opacity .5s ease ${i * 0.09}s, transform .5s ease ${i * 0.09}s`;
    obs.observe(el);
  });
}
