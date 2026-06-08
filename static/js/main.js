/* ============================================================
   ARCANA TAROT — Main JS
   ============================================================ */

/* ---- Star field ------------------------------------------- */
(function initStars() {
  const canvas = document.getElementById('stars-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  let raf = null, running = false;

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
    if (running) raf = requestAnimationFrame(draw);
  }

  function start() { if (reduce || running) return; running = true; raf = requestAnimationFrame(draw); }
  function stop()  { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } }

  window.addEventListener('resize', () => { resize(); makeStars(110); if (reduce) draw(0); });
  resize();
  makeStars(110);
  if (reduce) draw(0); else start();   // reduced motion: one static frame, no loop

  /* Pause the starfield redraw while a card transition is in flight (the widget
     fires these) so the loop doesn't compete for the main thread, and while the
     tab is hidden. Resumes afterward. */
  document.addEventListener('arcana:transition-start', stop);
  document.addEventListener('arcana:transition-end', start);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });
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
