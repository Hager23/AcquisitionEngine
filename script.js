// =========================
// START: script.js
// =========================
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Footer year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile nav
  const toggle = $(".nav-toggle");
  const mobileNav = $("#mobileNav");

  const closeMobileNav = () => {
    if (!toggle || !mobileNav) return;
    toggle.setAttribute("aria-expanded", "false");
    mobileNav.hidden = true;
  };
  const openMobileNav = () => {
    if (!toggle || !mobileNav) return;
    toggle.setAttribute("aria-expanded", "true");
    mobileNav.hidden = false;
  };

  if (toggle && mobileNav) {
    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      isOpen ? closeMobileNav() : openMobileNav();
    });

    $$(".mobile-link, .mobile-nav .btn", mobileNav).forEach(a => {
      a.addEventListener("click", () => closeMobileNav());
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMobileNav();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 780) closeMobileNav();
    }, { passive: true });
  }

  // Reveal animations (FIXED: matches CSS class "is-in")
  const revealEls = $$(".reveal");
  if (!prefersReduced && "IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("is-in"));
  }

  // Points appear on scroll (engine map lists)
  (function pointsOnScroll(){
    const lists = $$("[data-points]");
    if (!lists.length) return;

    if (prefersReduced || !("IntersectionObserver" in window)) {
      lists.forEach(l => l.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.35 });

    lists.forEach(l => io.observe(l));
  })();

  // Dashboard industry switch (index)
  const segButtons = $$(".seg-btn");
  const spark = $(".spark");
  const areaPath = $(".spark-area");
  const linePath = $(".spark-line");
  const dotsGroup = $(".spark-dots");

  const DATA = {
    all:      { enquiries: 38, enquiriesDelta: "+18%", calls: 12, callsDelta: "+9%", deals: 5, dealsDelta: "—", revenue: 48200, revenueDelta: "-4%", points: [18,22,21,27,29,36,41] },
    tradies:  { enquiries: 24, enquiriesDelta: "+12%", calls: 8,  callsDelta: "+8%", deals: 3, dealsDelta: "+1", revenue: 31800, revenueDelta: "+6%", points: [10,14,13,17,19,21,24] },
    builders: { enquiries: 14, enquiriesDelta: "+9%",  calls: 5,  callsDelta: "+4%", deals: 2, dealsDelta: "—", revenue: 22400, revenueDelta: "+2%", points: [6,7,9,10,10,12,14] },
    insurance:{ enquiries: 12, enquiriesDelta: "+7%",  calls: 4,  callsDelta: "+2%", deals: 2, dealsDelta: "+1", revenue: 18800, revenueDelta: "+5%", points: [5,6,6,7,8,10,12] },
    solar:    { enquiries: 18, enquiriesDelta: "+15%", calls: 6,  callsDelta: "+5%", deals: 3, dealsDelta: "+1", revenue: 39200, revenueDelta: "+9%", points: [7,9,10,13,14,16,18] },
    agencies: { enquiries: 20, enquiriesDelta: "+11%", calls: 7,  callsDelta: "+6%", deals: 3, dealsDelta: "—", revenue: 41200, revenueDelta: "+4%", points: [8,11,12,12,14,16,20] }
  };

  // Currency formatting (NZD so no “US” vibe)
  const fmtMoney = (n) => {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency: "NZD", maximumFractionDigits: 0 }).format(n); }
    catch { return "$" + Math.round(n).toString(); }
  };

  const setKpi = (key, val) => {
    const el = document.querySelector(`[data-kpi="${key}"]`);
    if (!el) return;
    el.textContent = key === "revenue" ? fmtMoney(val) : String(val);
  };

  const setDelta = (key, txt) => {
    const el = document.querySelector(`[data-kpi-delta="${key}"]`);
    if (!el) return;
    el.textContent = txt;
    el.classList.remove("up","down","flat");
    if (txt.includes("+")) el.classList.add("up");
    else if (txt.includes("-")) el.classList.add("down");
    else el.classList.add("flat");
  };

  const ensureGrad = () => {
    if (!spark || spark.querySelector("defs")) return;
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#6A00FF"></stop>
        <stop offset="100%" stop-color="#B388FF"></stop>
      </linearGradient>
    `;
    spark.prepend(defs);
  };

  const makePath = (pts) => {
    if (!spark || !linePath || !areaPath) return;
    ensureGrad();

    const w = 300, h = 88;
    const padX = 10, padY = 14;
    const max = Math.max(...pts);
    const min = Math.min(...pts);
    const span = Math.max(1, max - min);

    const xStep = (w - padX*2) / (pts.length - 1);
    const mapX = (i) => padX + i * xStep;
    const mapY = (v) => {
      const t = (v - min) / span;
      return (h - padY) - t * (h - padY*2);
    };

    let d = `M ${mapX(0)} ${mapY(pts[0])}`;
    for (let i=1;i<pts.length;i++){
      const x = mapX(i);
      const y = mapY(pts[i]);
      const prevX = mapX(i-1);
      const prevY = mapY(pts[i-1]);
      const cx = (prevX + x) / 2;
      d += ` Q ${cx} ${prevY} ${x} ${y}`;
    }

    const dArea = `${d} L ${mapX(pts.length-1)} ${h-padY} L ${mapX(0)} ${h-padY} Z`;
    linePath.setAttribute("d", d);
    areaPath.setAttribute("d", dArea);

    if (dotsGroup) {
      dotsGroup.innerHTML = "";
      pts.forEach((v,i) => {
        const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("cx", mapX(i));
        c.setAttribute("cy", mapY(v));
        c.setAttribute("r", 4.2);
        dotsGroup.appendChild(c);
      });
    }
  };

  const applyIndustry = (industry) => {
    const d = DATA[industry] || DATA.all;
    setKpi("enquiries", d.enquiries); setDelta("enquiries", d.enquiriesDelta);
    setKpi("calls", d.calls);         setDelta("calls", d.callsDelta);
    setKpi("deals", d.deals);         setDelta("deals", d.dealsDelta);
    setKpi("revenue", d.revenue);     setDelta("revenue", d.revenueDelta);
    makePath(d.points);
  };

  if (segButtons.length) {
    applyIndustry("all");
    segButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        segButtons.forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        applyIndustry(btn.getAttribute("data-industry") || "all");
      });
    });
  }

  // Engine steps
  const steps = $$(".step");
  const cards = $$(".engine-card");
  const bar = $(".progress-bar");

  const setStep = (idx) => {
    steps.forEach(s => s.classList.remove("is-active"));
    cards.forEach(c => c.classList.remove("is-active"));
    const st = steps[idx];
    const cd = cards[idx];
    if (st) st.classList.add("is-active");
    if (cd) cd.classList.add("is-active");
    if (bar && steps.length) bar.style.setProperty("--p", `${(idx+1)/steps.length*100}%`);
  };

  if (steps.length && cards.length) {
    steps.forEach((s, i) => s.addEventListener("click", () => setStep(i)));
    setStep(0);
  }

  // Counters (count up)
  (function initCounters(){
    const nodes = Array.from(document.querySelectorAll("[data-count]"));
    if (!nodes.length) return;

    const fmt = (n) => {
      try { return new Intl.NumberFormat().format(Math.round(n)); }
      catch { return String(Math.round(n)); }
    };

    const animate = (el) => {
      const target = Number(el.getAttribute("data-count") || 0);
      if (!isFinite(target)) return;
      if (prefersReduced) { el.textContent = fmt(target); return; }

      const duration = 1100;
      const start = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(target * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window)) { nodes.forEach(animate); return; }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        animate(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.35 });

    nodes.forEach((el) => io.observe(el));
  })();

  // Safety: stop horizontal scroll
  document.documentElement.style.overflowX = "hidden";
  document.body.style.overflowX = "hidden";
})();
// =========================
// END: script.js
// =========================
