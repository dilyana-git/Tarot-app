/* ============================================================
   ARCANA — Lore page (/lore)
   Five small controllers, all optional enhancements:
     1. scroll-reveal for sections, timeline entries and plates
     2. hero parallax
     3. chapter rail scroll-spy
     4. two roving-tabindex pickers (numerology ladder, symbol grid)
     5. plate lightbox
   Loaded in {% block scripts %}, before main.js.
   ============================================================ */
(function initLore() {
  const page = document.querySelector('.lore-hero');
  if (!page) return;   // not on the lore page

  // Arms the CSS that starts revealed content hidden. Setting it from JS means
  // a script failure leaves everything visible instead of blank.
  document.documentElement.classList.add('lore-js');

  const reduceMotion = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ── 1 · Scroll reveal ───────────────────────────────────── */
  (function initReveal() {
    const targets = document.querySelectorAll('[data-lore-reveal]');
    if (!targets.length) return;

    if (typeof IntersectionObserver === 'undefined' || reduceMotion) {
      targets.forEach(el => el.classList.add('is-revealed'));
      return;
    }

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-revealed');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    targets.forEach(el => obs.observe(el));
  })();

  /* ── 2 · Hero parallax ───────────────────────────────────── */
  (function initParallax() {
    const plate = document.querySelector('[data-lore-parallax]');
    if (!plate || reduceMotion) return;

    let ticking = false;
    function update() {
      ticking = false;
      const rect = page.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      // The plate is inset -8% at the top, so it has room to drift down.
      plate.style.transform = `translateY(${Math.min(window.scrollY * 0.22, 140)}px)`;
    }
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
  })();

  /* ── 3 · Chapter rail scroll-spy ─────────────────────────── */
  (function initRail() {
    const rail = document.getElementById('loreRail');
    if (!rail) return;
    const links = Array.from(rail.querySelectorAll('[data-rail-for]'));
    const sections = links
      .map(a => document.getElementById(a.dataset.railFor))
      .filter(Boolean);
    if (!sections.length) return;

    function mark(id) {
      links.forEach(a => a.classList.toggle('is-current', a.dataset.railFor === id));
    }

    function onScroll() {
      // The rail only exists while the reader is past the hero.
      rail.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.6);
      // Current chapter = the last one whose top has passed a third of the viewport.
      const line = window.innerHeight / 3;
      let current = sections[0];
      sections.forEach(s => {
        if (s.getBoundingClientRect().top <= line) current = s;
      });
      mark(current.id);
    }

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; onScroll(); });
    }, { passive: true });
    onScroll();
  })();

  /* ── 4 · Roving-tabindex pickers ─────────────────────────── */
  /**
   * Wire a set of tab buttons to a set of panels that cross-fade.
   * @param {string} tabSel    selector for the tab buttons (data-<key> holds the index)
   * @param {string} panelSel  selector for the panels (data-<key>-panel holds the index)
   * @param {Element} panelBox the container that gets .is-swapping during the fade
   */
  function wirePicker(tabSel, panelSel, panelBox) {
    const tabs = Array.from(document.querySelectorAll(tabSel));
    const panels = Array.from(document.querySelectorAll(panelSel));
    if (!tabs.length || !panels.length || !panelBox) return;

    const FADE = reduceMotion ? 0 : 170;
    let current = 0;
    let timer = null;

    function show(index, moveFocus) {
      if (index === current) return;
      current = index;

      tabs.forEach((t, i) => {
        const on = i === index;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        t.classList.toggle('is-active', on);
        if (on && moveFocus) t.focus();
      });
      panelBox.setAttribute('aria-labelledby', tabs[index].id);

      clearTimeout(timer);
      panelBox.classList.add('is-swapping');
      timer = setTimeout(() => {
        panels.forEach((p, i) => {
          const on = i === index;
          p.hidden = !on;
          p.classList.toggle('is-active', on);
        });
        // Next frame, so the browser paints the new panel at opacity 0 first.
        requestAnimationFrame(() => panelBox.classList.remove('is-swapping'));
      }, FADE);
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => show(i, false));
      tab.addEventListener('keydown', (e) => {
        const last = tabs.length - 1;
        let next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = i === last ? 0 : i + 1;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = i === 0 ? last : i - 1;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = last;
        if (next === null) return;
        e.preventDefault();
        show(next, true);
      });
    });
  }

  wirePicker('[data-rung]', '[data-rung-panel]', document.getElementById('ladder-panel'));
  wirePicker('[data-motif]', '[data-motif-panel]', document.getElementById('motif-panel'));

  /* ── 5 · Plate lightbox ──────────────────────────────────── */
  (function initLightbox() {
    const box = document.getElementById('loreLightbox');
    const img = document.getElementById('loreLightboxImg');
    const cap = document.getElementById('loreLightboxCap');
    const close = document.getElementById('loreLightboxClose');
    if (!box || !img || !cap || !close) return;

    let opener = null;

    function open(btn) {
      opener = btn;
      img.src = btn.dataset.full;
      img.alt = btn.dataset.alt || '';
      cap.textContent = btn.dataset.caption || '';
      box.hidden = false;
      requestAnimationFrame(() => box.classList.add('is-open'));
      close.focus();
      document.body.style.overflow = 'hidden';
    }

    function hide() {
      box.classList.remove('is-open');
      document.body.style.overflow = '';
      setTimeout(() => {
        box.hidden = true;
        img.src = '';
        if (opener) { opener.focus(); opener = null; }
      }, reduceMotion ? 0 : 280);
    }

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.lore-plate-btn');
      if (btn) { open(btn); return; }
      if (!box.hidden && (e.target === box || e.target === close)) hide();
    });

    document.addEventListener('keydown', (e) => {
      if (box.hidden) return;
      if (e.key === 'Escape') { hide(); return; }
      // Keep focus inside the dialog — close is its only control.
      if (e.key === 'Tab') { e.preventDefault(); close.focus(); }
    });
  })();
})();
