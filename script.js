/* =========================
   ONIX — script.js (FULL)
========================= */

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* -------------------------
     Mobile nav
  ------------------------- */
  const navToggle = $('[data-nav-toggle]');
  const navPanel = $('[data-nav-panel]');
  const navBackdrop = $('[data-nav-backdrop]');

  function openNav() {
    if (!navPanel) return;
    navPanel.classList.add('is-open');
    navBackdrop?.classList.add('is-show');
    document.documentElement.classList.add('no-scroll');
  }
  function closeNav() {
    if (!navPanel) return;
    navPanel.classList.remove('is-open');
    navBackdrop?.classList.remove('is-show');
    document.documentElement.classList.remove('no-scroll');
  }

  navToggle?.addEventListener('click', () => {
    if (navPanel?.classList.contains('is-open')) closeNav();
    else openNav();
  });
  navBackdrop?.addEventListener('click', closeNav);
  $$('[data-nav-close]').forEach((el) => el.addEventListener('click', closeNav));

  // Close on Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  /* -------------------------
     Smooth scroll for #anchors
  ------------------------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      e.preventDefault();
      closeNav();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* -------------------------
     Cookie banner (localStorage)
  ------------------------- */
  const cookie = $('[data-cookie]');
  const accept = $('[data-cookie-accept]');
  const decline = $('[data-cookie-decline]');
  const KEY = 'onix_cookie_choice';

  function hideCookie() {
    cookie?.classList.add('is-hidden');
  }
  function showCookie() {
    cookie?.classList.remove('is-hidden');
  }

  try {
    const saved = localStorage.getItem(KEY);
    if (saved) hideCookie();
    else showCookie();
  } catch {
    // if storage blocked, just show it
    showCookie();
  }

  accept?.addEventListener('click', () => {
    try { localStorage.setItem(KEY, 'accepted'); } catch {}
    hideCookie();
  });
  decline?.addEventListener('click', () => {
    try { localStorage.setItem(KEY, 'declined'); } catch {}
    hideCookie();
  });

  /* -------------------------
     Chart tabs (Enquiry Trend)
     - fixes “squished” buttons
     - works with overflow scrolling
  ------------------------- */
  const chartRoot = $('[data-chart]');
  if (chartRoot) {
    const tabs = $('[data-chart-tabs]', chartRoot);
    const rangeBtn = $('[data-chart-range]', chartRoot);
    const svgLine = $('[data-chart-line]', chartRoot);
    const svgFill = $('[data-chart-fill]', chartRoot);
    const endDot = $('[data-chart-dot]', chartRoot);

    const state = {
      category: 'All',
      range: '7 days',
    };

    // Smooth-ish demo datasets (you can swap values later)
    const data = {
      "All":      [10, 18, 16, 28, 30, 24, 38],
      "Tradies":  [ 6, 10,  9, 14, 18, 16, 22],
      "Builders": [ 3,  5,  6, 10, 12, 11, 15],
      "Insurance":[ 4,  8,  7, 12, 18, 17, 27],
      "Solar":    [ 2,  4,  6,  8, 11, 10, 13],
      "Agencies": [ 1,  3,  2,  5,  6,  7,  9],
    };

    function buildPath(values, w = 520, h = 220, pad = 18) {
      // Normalize to chart area
      const min = Math.min(...values);
      const max = Math.max(...values);
      const span = Math.max(1, max - min);

      const innerW = w - pad * 2;
      const innerH = h - pad * 2;

      const pts = values.map((v, i) => {
        const x = pad + (innerW * (i / (values.length - 1)));
        const t = (v - min) / span;
        const y = pad + (innerH * (1 - t));
        return { x, y };
      });

      const dLine = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} ` +
        pts.slice(1).map(p => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');

      const baseY = h - pad;
      const dFill = `${dLine} L ${pts[pts.length - 1].x.toFixed(2)} ${baseY.toFixed(2)} ` +
        `L ${pts[0].x.toFixed(2)} ${baseY.toFixed(2)} Z`;

      return { dLine, dFill, last: pts[pts.length - 1] };
    }

    function setActiveTab(label) {
      state.category = label;

      // Update buttons
      $$('[data-tab]', tabs).forEach((b) => {
        const isActive = b.dataset.tab === label;
        b.classList.toggle('is-active', isActive);
        b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      // Update SVG
      const values = data[label] || data["All"];
      const { dLine, dFill, last } = buildPath(values);

      // ✅ removes “black line” issue: fill path has NO stroke in CSS
      svgLine?.setAttribute('d', dLine);
      svgFill?.setAttribute('d', dFill);

      if (endDot) {
        endDot.setAttribute('cx', last.x.toFixed(2));
        endDot.setAttribute('cy', last.y.toFixed(2));
      }

      // Update label pill
      if (rangeBtn) rangeBtn.textContent = `${state.range} • ${state.category}`;
    }

    // Tabs click via delegation (works even with overflow scroll)
    tabs?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tab]');
      if (!btn) return;
      setActiveTab(btn.dataset.tab || 'All');
    });

    // Range pill cycles (demo)
    rangeBtn?.addEventListener('click', () => {
      state.range = state.range === '7 days' ? '30 days' : (state.range === '30 days' ? '90 days' : '7 days');
      if (rangeBtn) rangeBtn.textContent = `${state.range} • ${state.category}`;
    });

    // Init
    setActiveTab('All');
  }

  /* -------------------------
     “How it works” stepper (if present)
  ------------------------- */
  const stepper = $('[data-stepper]');
  if (stepper) {
    const items = $$('[data-step-item]', stepper);
    const cards = $$('[data-step-card]');

    function activate(idx) {
      items.forEach((it, i) => it.classList.toggle('is-active', i === idx));
      cards.forEach((c, i) => c.classList.toggle('is-active', i === idx));
    }

    items.forEach((it, i) => {
      it.addEventListener('click', () => activate(i));
    });

    activate(1); // default highlight step 2 like your screenshot
  }
})();
