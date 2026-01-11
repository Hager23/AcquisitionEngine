// =========================
// START: script.js
// =========================
(() => {
  "use strict";

  // -------- Helpers (defensive) --------
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function safeOn(el, event, handler, opts) {
    if (!el) return;
    el.addEventListener(event, handler, opts);
  }

  // -------- Year --------
  qsa("[data-year]").forEach((el) => {
    try { el.textContent = String(new Date().getFullYear()); } catch (_) {}
  });

  // -------- Mobile nav (robust, no overlay) --------
  const toggle = qs(".nav-toggle");
  const mobileNav = qs("#mobileNav");

  function setMobileOpen(open) {
    if (!toggle || !mobileNav) return;
    toggle.setAttribute("aria-expanded", String(open));
    mobileNav.hidden = !open;
  }

  safeOn(toggle, "click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    setMobileOpen(!expanded);
  });

  // Close mobile nav when clicking a link
  if (mobileNav) {
    qsa("a", mobileNav).forEach((a) => {
      safeOn(a, "click", () => setMobileOpen(false));
    });
  }

  // Close on resize back to desktop
  safeOn(window, "resize", () => {
    if (!toggle || !mobileNav) return;
    const isDesktop = window.matchMedia("(min-width: 981px)").matches;
    if (isDesktop) setMobileOpen(false);
  });

  // -------- Smooth scroll for internal anchors (defensive) --------
  qsa('a[href^="#"]').forEach((a) => {
    safeOn(a, "click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href.length < 2) return;
      const target = qs(href);
      if (!target) return;
      e.preventDefault();
      try {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        // close mobile menu if open
        setMobileOpen(false);
      } catch (_) {
        // fallback
        location.hash = href;
      }
    });
  });

  // For buttons with data-scroll-to
  qsa("[data-scroll-to]").forEach((btn) => {
    safeOn(btn, "click", () => {
      const sel = btn.getAttribute("data-scroll-to");
      if (!sel) return;
      const target = qs(sel);
      if (!target) return;
      try { target.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (_) {}
    });
  });

  // -------- Reveal on scroll --------
  const revealEls = qsa(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    // fallback: reveal immediately
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  // -------- Dashboard data + chart --------
  const DATA = {
    all: {
      kpis: { enquiries: 38, enquiriesDelta: "+18%", calls: 12, callsDelta: "+9%", deals: 5, dealsDelta: "—", revenue: 48200, revenueDelta: "-4%" },
      trend: [14, 18, 16, 22, 26, 24, 30],
    },
    tradies: {
      kpis: { enquiries: 22, enquiriesDelta: "+14%", calls: 7, callsDelta: "+6%", deals: 3, dealsDelta: "+1", revenue: 27100, revenueDelta: "+3%" },
      trend: [8, 11, 10, 13, 15, 14, 17],
    },
    builders: {
      kpis: { enquiries: 16, enquiriesDelta: "+10%", calls: 5, callsDelta: "+4%", deals: 2, dealsDelta: "—", revenue: 21200, revenueDelta: "-2%" },
      trend: [6, 7, 7, 10, 11, 10, 12],
    },
    insurance: {
      kpis: { enquiries: 12, enquiriesDelta: "+7%", calls: 4, callsDelta: "+2%", deals: 2, dealsDelta: "+1", revenue: 18800, revenueDelta: "+5%" },
      trend: [5, 6, 6, 7, 8, 9, 9],
    },
    solar: {
      kpis: { enquiries: 28, enquiriesDelta: "+20%", calls: 10, callsDelta: "+11%", deals: 4, dealsDelta: "—", revenue: 54200, revenueDelta: "+8%" },
      trend: [10, 12, 14, 15, 18, 20, 22],
    },
    agencies: {
      kpis: { enquiries: 19, enquiriesDelta: "+12%", calls: 6, callsDelta: "+5%", deals: 2, dealsDelta: "—", revenue: 33600, revenueDelta: "-1%" },
      trend: [7, 8, 9, 11, 12, 11, 13],
    },
  };

  function formatMoney(n) {
    try {
      return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
    } catch (_) {
      // fallback
      return "$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
  }

  function setDelta(el, delta) {
    if (!el) return;
    el.textContent = String(delta);
    el.classList.remove("up", "down", "neutral");

    const d = String(delta).trim();
    if (d === "—" || d === "-" || d.toLowerCase() === "na") {
      el.classList.add("neutral");
      return;
    }
    if (d.startsWith("+")) el.classList.add("up");
    else if (d.startsWith("-")) el.classList.add("down");
    else el.classList.add("neutral");
  }

  function buildSparkPath(values, w, h, pad) {
    // returns { lineD, areaD, pts } where pts are {x,y}
    const n = values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(1, max - min);

    const x0 = pad, x1 = w - pad;
    const y0 = pad, y1 = h - pad;

    const pts = values.map((v, i) => {
      const t = n === 1 ? 0 : i / (n - 1);
      const x = x0 + t * (x1 - x0);
      const yn = (v - min) / span;
      const y = y1 - yn * (y1 - y0);
      return { x, y };
    });

    // simple smooth-ish using quadratic midpoints
    let d = "";
    pts.forEach((p, i) => {
      if (i === 0) d += `M ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
      else {
        const prev = pts[i - 1];
        const mx = ((prev.x + p.x) / 2).toFixed(2);
        const my = ((prev.y + p.y) / 2).toFixed(2);
        d += ` Q ${prev.x.toFixed(2)} ${prev.y.toFixed(2)} ${mx} ${my}`;
        if (i === pts.length - 1) {
          d += ` T ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
        }
      }
    });

    const last = pts[pts.length - 1];
    const first = pts[0];
    const area = `${d} L ${last.x.toFixed(2)} ${(h - pad).toFixed(2)} L ${first.x.toFixed(2)} ${(h - pad).toFixed(2)} Z`;

    return { lineD: d, areaD: area, pts };
  }

  function renderChart(values) {
    const svg = qs(".spark");
    if (!svg) return;

    const line = qs(".spark-line", svg);
    const area = qs(".spark-area", svg);
    const pointsG = qs(".spark-points", svg);
    if (!line || !area || !pointsG) return;

    // clear points
    pointsG.innerHTML = "";

    const w = 320, h = 110, pad = 20;
    const { lineD, areaD, pts } = buildSparkPath(values, w, h, pad);

    line.setAttribute("d", lineD);
    area.setAttribute("d", areaD);

    pts.forEach((p) => {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", p.x.toFixed(2));
      c.setAttribute("cy", p.y.toFixed(2));
      c.setAttribute("r", "3.8");
      c.setAttribute("fill", "#ffffff");
      c.setAttribute("stroke", "url(#gViolet)");
      c.setAttribute("stroke-width", "2.2");
      pointsG.appendChild(c);
    });
  }

  function applySegment(key) {
    const seg = DATA[key] || DATA.all;
    // KPIs
    const elEnq = qs('[data-kpi="enquiries"]');
    const elCalls = qs('[data-kpi="calls"]');
    const elDeals = qs('[data-kpi="deals"]');
    const elRev = qs('[data-kpi="revenue"]');

    if (elEnq) elEnq.textContent = String(seg.kpis.enquiries);
    if (elCalls) elCalls.textContent = String(seg.kpis.calls);
    if (elDeals) elDeals.textContent = String(seg.kpis.deals);
    if (elRev) elRev.textContent = formatMoney(seg.kpis.revenue);

    setDelta(qs('[data-kpi-delta="enquiries"]'), seg.kpis.enquiriesDelta);
    setDelta(qs('[data-kpi-delta="calls"]'), seg.kpis.callsDelta);
    setDelta(qs('[data-kpi-delta="deals"]'), seg.kpis.dealsDelta);
    setDelta(qs('[data-kpi-delta="revenue"]'), seg.kpis.revenueDelta);

    renderChart(seg.trend);
  }

  // Segment buttons
  const segBtns = qsa(".seg-btn");
  if (segBtns.length) {
    segBtns.forEach((b) => {
      safeOn(b, "click", () => {
        const key = b.getAttribute("data-seg") || "all";
        segBtns.forEach((x) => x.classList.remove("is-active"));
        b.classList.add("is-active");
        applySegment(key);
      });
    });
    // initial render
    applySegment("all");
  }

  // -------- Engine Map tabs --------
  const stepBtns = qsa(".step");
  const stepCards = qsa("[data-step-card]");
  const bar = qs("[data-engine-bar]");

  function showStep(i) {
    if (!stepBtns.length || !stepCards.length) return;

    stepBtns.forEach((b, idx) => {
      b.classList.toggle("is-active", idx === i);
      b.setAttribute("aria-selected", idx === i ? "true" : "false");
    });

    stepCards.forEach((c) => {
      const idx = Number(c.getAttribute("data-step-card"));
      c.hidden = idx !== i;
    });

    if (bar) {
      const pct = ((i + 1) / stepBtns.length) * 100;
      bar.style.width = `${pct}%`;
    }
  }

  if (stepBtns.length && stepCards.length) {
    stepBtns.forEach((b) => {
      safeOn(b, "click", () => {
        const i = Number(b.getAttribute("data-step"));
        if (!Number.isFinite(i)) return;
        showStep(i);
      });
    });
    showStep(0);
  }

  // -------- Proof carousel subtle snap assist (mobile only) --------
  const track = qs("[data-proof-track]");
  if (track) {
    let raf = null;
    safeOn(track, "scroll", () => {
      // update dots (decor only; never critical)
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const dots = qsa(".proof-dots span");
        if (!dots.length) return;

        const items = qsa(".proof", track);
        if (!items.length) return;

        const idx = Math.round(track.scrollLeft / Math.max(1, (items[0].clientWidth + 14)));
        dots.forEach((d, i) => d.style.opacity = i === Math.min(dots.length - 1, Math.max(0, idx)) ? "0.95" : "0.40");
      });
    });
  }
})();
// =========================
// END: script.js
// =========================
