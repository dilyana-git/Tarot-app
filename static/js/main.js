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

/* ---- Hero card theater carousel --------------------------- */
(function initShowcase() {
  const stage = document.getElementById('heroStage');
  if (!stage) return;

  const cards     = Array.from(stage.querySelectorAll('.showcase-card'));
  const nameEl    = document.getElementById('hciName');
  const kwEl      = document.getElementById('hciKw');
  const barEl     = document.getElementById('stageProgressBar');
  const prevBtn   = document.getElementById('stagePrev');
  const nextBtn   = document.getElementById('stageNext');
  const heroVideo = document.getElementById('heroVideo');
  const heroVideoSource = heroVideo ? heroVideo.querySelector('source') : null;
  const heroVideoWrap = document.querySelector('.hero-video-wrap');

  if (!cards.length) return;

  let current     = 0;
  let autoTimer   = null;
  let barTimer    = null;
  const INTERVAL  = 6000;   /* ms between auto-advances */
  const BAR_STEP  = 50;     /* progress bar tick interval ms */
  let barValue    = 0;

  function updateHeroVideo(cardEl) {
    if (!heroVideo || !heroVideoSource || !heroVideoWrap) return;

    const videoFile = cardEl.dataset.video;
    const posterFile = cardEl.dataset.poster;
    const base = heroVideo.dataset.mediaBase || '';

    if (videoFile) {
      heroVideoWrap.style.display = 'grid';
      heroVideo.style.opacity = '0';
      heroVideoSource.src = base + videoFile;
      heroVideo.poster = posterFile || '';
      heroVideo.load();
      heroVideo.play().catch(() => {});
      setTimeout(() => { heroVideo.style.opacity = '1'; }, 180);
    } else {
      heroVideoWrap.style.display = 'none';
    }
  }

  function goTo(index) {
    cards[current].classList.remove('active');
    current = ((index % cards.length) + cards.length) % cards.length;
    cards[current].classList.add('active');

    const c = cards[current];
    if (nameEl) nameEl.textContent = c.dataset.name   || '';
    if (kwEl)   kwEl.textContent   = c.dataset.keywords || '';
    const descEl = document.getElementById('hciDesc');
    if (descEl) descEl.textContent = c.dataset.description || '';
    updateHeroVideo(c);

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

  function stopAuto() {
    clearInterval(autoTimer);
    clearInterval(barTimer);
  }

  /* Initialise */
  goTo(0);
  startAuto();

  /* Pause on hover */
  stage.addEventListener('mouseenter', stopAuto);
  stage.addEventListener('mouseleave', startAuto);

  /* Navigation */
  if (prevBtn) prevBtn.addEventListener('click', e => {
    e.preventDefault(); goTo(current - 1); startAuto();
  });
  if (nextBtn) nextBtn.addEventListener('click', e => {
    e.preventDefault(); goTo(current + 1); startAuto();
  });

  /* Keyboard navigation when stage is focused area */
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { goTo(current - 1); startAuto(); }
    if (e.key === 'ArrowRight') { goTo(current + 1); startAuto(); }
  });
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
