// ===============================
// START: script.js (Acquisition Engine)
// ===============================

// -------------------------------
// 1) Smooth anchor scrolling
// -------------------------------
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const href = a.getAttribute("href");
    if (!href || href === "#") return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

// -------------------------------
// 2) Scroll reveal (with stagger)
// -------------------------------
document.documentElement.classList.add("js");
const revealEls = Array.from(document.querySelectorAll(".reveal"));

if (!("IntersectionObserver" in window)) {
  revealEls.forEach((el) => el.classList.add("show"));
} else {
  const revealFallback = setTimeout(() => {
    revealEls.forEach((el) => el.classList.add("show"));
  }, 1600);

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const kids = el.querySelectorAll(".reveal-child");
        if (kids.length) {
          kids.forEach((k, i) => {
            k.style.transitionDelay = `${i * 90}ms`;
            k.classList.add("show");
          });
        }

        el.classList.add("show");
        revealObserver.unobserve(el);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -12% 0px" }
  );

  revealEls.forEach((el) => revealObserver.observe(el));
}

function forceShowReveals() {
  revealEls.forEach((el) => el.classList.add("show"));
}

window.addEventListener("error", forceShowReveals, { once: true });
window.addEventListener("unhandledrejection", forceShowReveals, { once: true });

// -------------------------------
// 3) Count-up animation (slower + stagger)
// -------------------------------
function animateCount(el, delayMs = 0) {
  const target = Number(el.getAttribute("data-count") || "0");
  const isMoney = el.classList.contains("money");
  const duration = 1500;

  const start = performance.now() + delayMs;

  function tick(now) {
    if (now < start) {
      requestAnimationFrame(tick);
      return;
    }
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const value = Math.round(target * eased);

    el.textContent = isMoney ? `$${value.toLocaleString()}` : value.toLocaleString();
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const countEls = Array.from(document.querySelectorAll(".count[data-count]"));
const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;

      const parent = e.target.closest(".dashboard-card, .outcomes, .section");
      const group = parent
        ? Array.from(parent.querySelectorAll(".count[data-count]"))
        : [e.target];

      group.forEach((node, i) => animateCount(node, i * 110));
      group.forEach((node) => countObserver.unobserve(node));
    });
  },
  { threshold: 0.35 }
);

countEls.forEach((el) => countObserver.observe(el));

// -------------------------------
// 4) Tooltip for KPI (data-tip)
// -------------------------------
const tip = document.getElementById("chartTip");

function showTip(text) {
  if (!tip) return;
  tip.textContent = text || "";
  tip.classList.add("show");
  tip.setAttribute("aria-hidden", "false");
}

function moveTip(x, y) {
  if (!tip) return;
  tip.style.left = `${x + 14}px`;
  tip.style.top = `${y + 14}px`;
}

function hideTip() {
  if (!tip) return;
  tip.classList.remove("show");
  tip.setAttribute("aria-hidden", "true");
}

document.querySelectorAll("[data-tip]").forEach((node) => {
  node.addEventListener("mouseenter", () => showTip(node.getAttribute("data-tip")));
  node.addEventListener("mousemove", (e) => moveTip(e.clientX, e.clientY));
  node.addEventListener("mouseleave", hideTip);
});

// -------------------------------
// 5) Hero dashboard tilt/parallax (Stripe-ish feel)
// -------------------------------
const heroCard = document.querySelector(".hero-dashboard");
let tiltRAF = null;

function setTilt(x, y) {
  if (!heroCard) return;
  const rect = heroCard.getBoundingClientRect();
  const px = (x - rect.left) / rect.width;
  const py = (y - rect.top) / rect.height;

  const rotateY = (px - 0.5) * 10;
  const rotateX = (0.5 - py) * 10;
  const translateZ = 18;

  heroCard.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`;
}

function resetTilt() {
  if (!heroCard) return;
  heroCard.style.transform = `perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)`;
}

if (heroCard) {
  heroCard.addEventListener("mousemove", (e) => {
    if (tiltRAF) cancelAnimationFrame(tiltRAF);
    tiltRAF = requestAnimationFrame(() => setTilt(e.clientX, e.clientY));
  });

  heroCard.addEventListener("mouseleave", () => {
    if (tiltRAF) cancelAnimationFrame(tiltRAF);
    resetTilt();
  });

  if (window.matchMedia("(hover: none)").matches) {
    let t = 0;
    setInterval(() => {
      t += 0.04;
      const rx = Math.sin(t) * 1.2;
      const ry = Math.cos(t) * 1.2;
      heroCard.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(10px)`;
    }, 40);
  }
}

// -------------------------------
// 6) Lead chart: animate ONCE (no constant moving)
// -------------------------------
const chart = document.querySelector(".line-chart");
const linePath = document.getElementById("trendLine") || document.querySelector(".chart-line");
const dot = document.getElementById("trendDot") || document.querySelector(".chart-dot");
const areaPath = document.getElementById("trendArea") || document.querySelector(".chart-area");
const maskPath = document.getElementById("trendLineMask") || document.querySelector(".chart-line-mask");
const shimmerPath = document.getElementById("trendShimmer") || document.querySelector(".chart-shimmer");

function placeDotAtEnd() {
  if (!linePath || !dot || !linePath.getTotalLength) return;
  const total = linePath.getTotalLength();
  const p = linePath.getPointAtLength(total);
  dot.setAttribute("cx", p.x);
  dot.setAttribute("cy", p.y);
}

function animateDotOnce() {
  if (!linePath || !dot || !linePath.getTotalLength) return;

  const total = linePath.getTotalLength();
  const duration = 900;
  const start = performance.now();

  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const p = linePath.getPointAtLength(total * eased);

    dot.setAttribute("cx", p.x);
    dot.setAttribute("cy", p.y);

    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

const hero = document.querySelector(".hero");
if (hero) {
  const heroObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      animateDotOnce();
      heroObs.disconnect();
    });
  }, { threshold: 0.2 });

  heroObs.observe(hero);
} else {
  animateDotOnce();
}

if (chart && linePath && dot && linePath.getTotalLength) {
  const total = linePath.getTotalLength();

  chart.addEventListener("mousemove", (e) => {
    const rect = chart.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const t = x / rect.width;
    const p = linePath.getPointAtLength(total * t);
    dot.setAttribute("cx", p.x);
    dot.setAttribute("cy", p.y);
  });

  chart.addEventListener("mouseleave", () => {
    placeDotAtEnd();
  });
}

// -------------------------------
// 7) Button micro-interaction (press bounce)
// -------------------------------
document.querySelectorAll(".btn-primary, .btn-secondary").forEach((btn) => {
  btn.addEventListener("mousedown", () => {
    btn.style.transform = "translateY(1px) scale(0.99)";
  });
  btn.addEventListener("mouseup", () => {
    btn.style.transform = "";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.transform = "";
  });
});

// -------------------------------
// 8) Subtle scroll-based background intensity
// -------------------------------
const aurora = document.querySelector(".site-aurora");
if (aurora) {
  let raf = null;
  window.addEventListener("scroll", () => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const y = window.scrollY || 0;
      const intensity = Math.min(1, y / 900);
      aurora.style.filter = `blur(${34 - intensity * 6}px) saturate(${110 + intensity * 15}%)`;
    });
  });
}

// ================================
// Section 3: Engine Map interactions
// ================================
(function initEngineMap(){
  const stepsWrap = document.getElementById("engineSteps");
  const idxButtons = document.querySelectorAll(".idx");
  const progressEl = document.getElementById("railProgress");

  if (!stepsWrap || !idxButtons.length || !progressEl) return;

  const stepCards = Array.from(stepsWrap.querySelectorAll(".step-card"));

  idxButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const n = Number(btn.dataset.step || "0");
      const target = stepCards.find(c => Number(c.dataset.step) === n);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  function onScroll() {
    const vh = window.innerHeight;
    let bestIdx = 0;
    let bestDist = Infinity;

    stepCards.forEach((card, i) => {
      const r = card.getBoundingClientRect();
      const center = r.top + r.height * 0.45;
      const dist = Math.abs(center - vh * 0.42);
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    });

    idxButtons.forEach(b => b.classList.remove("active"));
    const activeStep = stepCards[bestIdx]?.dataset.step;
    const activeBtn = document.querySelector(`.idx[data-step="${activeStep}"]`);
    if (activeBtn) activeBtn.classList.add("active");

    const p = stepCards.length <= 1 ? 100 : (bestIdx / (stepCards.length - 1)) * 100;
    progressEl.style.width = `${p}%`;
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();

// ================================
// Section 4: Timeline progress fill
// ================================
(function initTimelineProgress(){
  const prog = document.getElementById("timelineProgress");
  const wrap = prog?.closest(".timeline");
  if (!prog || !wrap) return;

  function update() {
    const r = wrap.getBoundingClientRect();
    const vh = window.innerHeight || 1;

    const start = vh * 0.85;
    const end = vh * 0.25;

    const t = (start - r.top) / (start - end);
    const clamped = Math.max(0, Math.min(1, t));
    prog.style.height = `${clamped * 100}%`;

    const items = wrap.querySelectorAll(".t-item");
    const activeCount = Math.floor(clamped * items.length);
    items.forEach((it, i) => {
      const dot = it.querySelector(".t-dot");
      if (!dot) return;
      if (i <= activeCount) {
        dot.style.background = "rgba(106,0,255,0.9)";
      } else {
        dot.style.background = "rgba(106,0,255,0.35)";
      }
    });
  }

  window.addEventListener("scroll", update, { passive: true });
  update();
})();

// ================================
// Booking links: ALWAYS scroll to #book
// ================================
(function bindBookingLinks(){
  document.querySelectorAll("[data-book], .btn-primary, .btn-secondary").forEach((el) => {
    if (!el || !el.getAttribute) return;
    const href = el.getAttribute("href") || "";
    if (!href) return;

    // Only convert obvious booking CTAs (keeps other buttons intact)
    const isBook =
      el.hasAttribute("data-book") ||
      /book/i.test(el.textContent || "") ||
      href.includes("calendly.com");

    if (!isBook) return;

    el.setAttribute("href", "#book");
    el.removeAttribute("target");
    el.removeAttribute("rel");
  });
})();

// ================================
// Footer year
// ================================
(function footerYear(){
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
})();

// ================================
// Cookie banner (Accept/Decline)
// ================================
(function cookieBanner(){
  const KEY = "ae_cookie_choice";
  const banner = document.getElementById("cookieBanner");
  const acceptBtn = document.getElementById("cookieAccept");
  const declineBtn = document.getElementById("cookieDecline");

  if (!banner || !acceptBtn || !declineBtn) return;

  const existing = localStorage.getItem(KEY);
  if (!existing) {
    banner.classList.add("show");
    banner.setAttribute("aria-hidden", "false");
  }

  function close(choice){
    localStorage.setItem(KEY, choice);
    banner.classList.remove("show");
    banner.setAttribute("aria-hidden", "true");
  }

  acceptBtn.addEventListener("click", () => close("accepted"));
  declineBtn.addEventListener("click", () => close("declined"));

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && banner.classList.contains("show")) {
      close("declined");
    }
  });
})();

// ======================================================
// ✅ Industry-based “real results” dashboard switching
// (KPI + Funnel + Trend updates per industry)
// ======================================================
(function industryDashboard(){
  const segButtons = Array.from(document.querySelectorAll(".seg-btn"));
  if (!segButtons.length) return;

  const kpiEnq = document.getElementById("kpiEnquiries");
  const kpiCalls = document.getElementById("kpiCalls");
  const kpiWins = document.getElementById("kpiWins");
  const kpiRevenue = document.getElementById("kpiRevenue");

  const deltaEnq = document.getElementById("deltaEnq");
  const deltaCalls = document.getElementById("deltaCalls");
  const deltaWins = document.getElementById("deltaWins");
  const deltaRev = document.getElementById("deltaRev");

  const fEnq = document.getElementById("fEnq");
  const fCon = document.getElementById("fCon");
  const fBoo = document.getElementById("fBoo");
  const fWon = document.getElementById("fWon");

  const fillEnq = document.getElementById("fillEnq");
  const fillCon = document.getElementById("fillCon");
  const fillBoo = document.getElementById("fillBoo");
  const fillWon = document.getElementById("fillWon");

  const trendTitle = document.getElementById("trendTitle");
  const trendMeta = document.getElementById("trendMeta");
  const pipeMeta = document.getElementById("pipeMeta");

  const line = document.getElementById("trendLine");
  const area = document.getElementById("trendArea");
  const mask = document.getElementById("trendLineMask");
  const shimmer = document.getElementById("trendShimmer");
  const dot = document.getElementById("trendDot");

  const DATA = {
    all: {
      label: "Combined",
      deltas: { enq: "+18%", calls: "+9%", wins: "—", rev: "-4%" },
      kpis: { enq: 38, calls: 12, wins: 5, rev: 48200 },
      funnel: { enq: 38, con: 28, boo: 12, won: 5 },
      trend: [10, 14, 13, 18, 20, 17, 25, 28, 30]
    },
    tradies: {
      label: "Tradies",
      deltas: { enq: "+22%", calls: "+14%", wins: "+8%", rev: "+6%" },
      kpis: { enq: 44, calls: 16, wins: 6, rev: 61200 },
      funnel: { enq: 44, con: 34, boo: 16, won: 6 },
      trend: [8, 12, 14, 18, 21, 19, 26, 29, 33]
    },
    builders: {
      label: "Builders",
      deltas: { enq: "+11%", calls: "+7%", wins: "—", rev: "+3%" },
      kpis: { enq: 31, calls: 9, wins: 3, rev: 73400 },
      funnel: { enq: 31, con: 22, boo: 9, won: 3 },
      trend: [6, 9, 10, 13, 14, 12, 16, 18, 19]
    },
    insurance: {
      label: "Insurance",
      deltas: { enq: "+15%", calls: "+10%", wins: "+5%", rev: "+9%" },
      kpis: { enq: 27, calls: 11, wins: 4, rev: 38800 },
      funnel: { enq: 27, con: 21, boo: 11, won: 4 },
      trend: [5, 7, 8, 10, 11, 12, 13, 14, 16]
    },
    solar: {
      label: "Solar",
      deltas: { enq: "+19%", calls: "+12%", wins: "+6%", rev: "+8%" },
      kpis: { enq: 36, calls: 13, wins: 5, rev: 92600 },
      funnel: { enq: 36, con: 27, boo: 13, won: 5 },
      trend: [7, 9, 11, 15, 18, 16, 20, 22, 24]
    },
    agencies: {
      label: "Agencies",
      deltas: { enq: "+9%", calls: "+6%", wins: "—", rev: "+4%" },
      kpis: { enq: 22, calls: 7, wins: 2, rev: 26400 },
      funnel: { enq: 22, con: 16, boo: 7, won: 2 },
      trend: [4, 5, 6, 7, 8, 9, 10, 10, 11]
    }
  };

  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

  function toPath(values){
    const xs = [0, 40, 80, 120, 160, 200, 240, 280, 300];

    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const topY = 28;
    const botY = 100;

    function y(v){
      if (maxV === minV) return (topY + botY) / 2;
      const t = (v - minV) / (maxV - minV); // 0..1
      return botY - t * (botY - topY);
    }

    const pts = values.map((v, i) => `${xs[i]} ${y(v).toFixed(1)}`);
    const dLine = `M${pts[0]} L${pts.slice(1).join(" L")}`;
    const dArea = `${dLine} L300 120 L0 120 Z`;

    const end = pts[pts.length - 1].split(" ");
    const endX = Number(end[0]);
    const endY = Number(end[1]);

    return { dLine, dArea, endX, endY };
  }

  function restartFill(el){
    if (!el) return;
    el.style.animation = "none";
    // force reflow
    void el.offsetHeight;
    el.style.animation = "";
  }

  function setDelta(el, text, mode){
    if (!el) return;
    el.textContent = text;
    el.classList.remove("up","down","flat");
    el.classList.add(mode);
  }

  function apply(industryKey){
    const d = DATA[industryKey] || DATA.all;

    if (trendTitle) trendTitle.textContent = "Enquiry Trend";
    if (trendMeta) trendMeta.textContent = `7 days • ${d.label}`;
    if (pipeMeta) pipeMeta.textContent = `Today • ${d.label}`;

    // deltas (simple vibe control)
    if (deltaEnq) setDelta(deltaEnq, d.deltas.enq, "up");
    if (deltaCalls) setDelta(deltaCalls, d.deltas.calls, "up");
    if (deltaWins) setDelta(deltaWins, d.deltas.wins, d.deltas.wins === "—" ? "flat" : "up");
    if (deltaRev) setDelta(deltaRev, d.deltas.rev, d.deltas.rev.includes("-") ? "down" : "up");

    // KPIs (animate)
    if (kpiEnq){ kpiEnq.setAttribute("data-count", String(d.kpis.enq)); kpiEnq.textContent = "0"; animateCount(kpiEnq, 0); }
    if (kpiCalls){ kpiCalls.setAttribute("data-count", String(d.kpis.calls)); kpiCalls.textContent = "0"; animateCount(kpiCalls, 90); }
    if (kpiWins){ kpiWins.setAttribute("data-count", String(d.kpis.wins)); kpiWins.textContent = "0"; animateCount(kpiWins, 160); }
    if (kpiRevenue){ kpiRevenue.setAttribute("data-count", String(d.kpis.rev)); kpiRevenue.textContent = "$0"; animateCount(kpiRevenue, 220); }

    // Funnel numbers
    if (fEnq) fEnq.textContent = String(d.funnel.enq);
    if (fCon) fCon.textContent = String(d.funnel.con);
    if (fBoo) fBoo.textContent = String(d.funnel.boo);
    if (fWon) fWon.textContent = String(d.funnel.won);

    // Funnel bar widths relative to enquiries
    const base = Math.max(1, d.funnel.enq);
    const wEnq = 100;
    const wCon = clamp((d.funnel.con / base) * 100, 6, 100);
    const wBoo = clamp((d.funnel.boo / base) * 100, 6, 100);
    const wWon = clamp((d.funnel.won / base) * 100, 4, 100);

    if (fillEnq){ fillEnq.style.setProperty("--w", `${wEnq}%`); restartFill(fillEnq); }
    if (fillCon){ fillCon.style.setProperty("--w", `${wCon}%`); restartFill(fillCon); }
    if (fillBoo){ fillBoo.style.setProperty("--w", `${wBoo}%`); restartFill(fillBoo); }
    if (fillWon){ fillWon.style.setProperty("--w", `${wWon}%`); restartFill(fillWon); }

    // Trend chart paths
    const p = toPath(d.trend);
    if (line) line.setAttribute("d", p.dLine);
    if (area) area.setAttribute("d", p.dArea);
    if (mask) mask.setAttribute("d", p.dLine);
    if (shimmer) shimmer.setAttribute("d", p.dLine);
    if (dot){ dot.setAttribute("cx", String(p.endX)); dot.setAttribute("cy", String(p.endY)); }

    // re-run dot animation once so it feels “real”
    animateDotOnce();
  }
  // ===============================
// Industry dashboard switching + proof lightbox
// ===============================
(function industryDashboard(){
  const datasets = {
    all: {
      name: "All",
      kpis: { enq: 38, booked: 12, won: 5, rev: 48200 },
      deltas: { enq: "+18%", booked: "+9%", won: "—", rev: "-4%" },
      pipe: { enq: 38, contacted: 28, booked: 12, won: 5 },
      paths: {
        line: "M0 100 L40 80 L80 85 L120 60 L160 55 L200 70 L240 40 L280 30 L300 28",
        area: "M0 100 L40 80 L80 85 L120 60 L160 55 L200 70 L240 40 L280 30 L300 28 L300 120 L0 120 Z",
        dot: { x: 300, y: 28 }
      }
    },
    tradies: {
      name: "Tradies",
      kpis: { enq: 44, booked: 15, won: 6, rev: 51600 },
      deltas: { enq: "+22%", booked: "+12%", won: "+8%", rev: "+6%" },
      pipe: { enq: 44, contacted: 33, booked: 15, won: 6 },
      paths: {
        line: "M0 104 L40 92 L80 78 L120 72 L160 60 L200 54 L240 48 L280 36 L300 32",
        area: "M0 104 L40 92 L80 78 L120 72 L160 60 L200 54 L240 48 L280 36 L300 32 L300 120 L0 120 Z",
        dot: { x: 300, y: 32 }
      }
    },
    builders: {
      name: "Builders",
      kpis: { enq: 31, booked: 9, won: 3, rev: 38800 },
      deltas: { enq: "+10%", booked: "+6%", won: "—", rev: "+3%" },
      pipe: { enq: 31, contacted: 22, booked: 9, won: 3 },
      paths: {
        line: "M0 102 L40 96 L80 88 L120 82 L160 78 L200 70 L240 62 L280 58 L300 54",
        area: "M0 102 L40 96 L80 88 L120 82 L160 78 L200 70 L240 62 L280 58 L300 54 L300 120 L0 120 Z",
        dot: { x: 300, y: 54 }
      }
    },
    insurance: {
      name: "Insurance",
      kpis: { enq: 27, booked: 11, won: 4, rev: 38800 },
      deltas: { enq: "+15%", booked: "+10%", won: "+5%", rev: "+9%" },
      pipe: { enq: 27, contacted: 21, booked: 11, won: 4 },
      paths: {
        line: "M0 108 L40 96 L80 90 L120 78 L160 72 L200 64 L240 60 L280 56 L300 44",
        area: "M0 108 L40 96 L80 90 L120 78 L160 72 L200 64 L240 60 L280 56 L300 44 L300 120 L0 120 Z",
        dot: { x: 300, y: 44 }
      }
    },
    solar: {
      name: "Solar",
      kpis: { enq: 36, booked: 10, won: 4, rev: 44500 },
      deltas: { enq: "+14%", booked: "+7%", won: "+4%", rev: "+5%" },
      pipe: { enq: 36, contacted: 26, booked: 10, won: 4 },
      paths: {
        line: "M0 106 L40 98 L80 86 L120 74 L160 70 L200 58 L240 52 L280 46 L300 42",
        area: "M0 106 L40 98 L80 86 L120 74 L160 70 L200 58 L240 52 L280 46 L300 42 L300 120 L0 120 Z",
        dot: { x: 300, y: 42 }
      }
    },
    agencies: {
      name: "Agencies",
      kpis: { enq: 24, booked: 8, won: 2, rev: 31200 },
      deltas: { enq: "+8%", booked: "+6%", won: "—", rev: "+2%" },
      pipe: { enq: 24, contacted: 17, booked: 8, won: 2 },
      paths: {
        line: "M0 108 L40 104 L80 96 L120 90 L160 84 L200 78 L240 70 L280 66 L300 62",
        area: "M0 108 L40 104 L80 96 L120 90 L160 84 L200 78 L240 70 L280 66 L300 62 L300 120 L0 120 Z",
        dot: { x: 300, y: 62 }
      }
    }
  };

  const tabs = Array.from(document.querySelectorAll(".tab[data-industry]"));
  const chip = document.getElementById("chipWindow");
  const pipeLabel = document.getElementById("pipeLabel");

  const kpiEnq = document.getElementById("kpiEnq");
  const kpiBooked = document.getElementById("kpiBooked");
  const kpiWon = document.getElementById("kpiWon");
  const kpiRev = document.getElementById("kpiRev");

  const dEnq = document.getElementById("deltaEnq");
  const dBooked = document.getElementById("deltaBooked");
  const dWon = document.getElementById("deltaWon");
  const dRev = document.getElementById("deltaRev");

  const pipeEnq = document.getElementById("pipeEnq");
  const pipeContacted = document.getElementById("pipeContacted");
  const pipeBooked = document.getElementById("pipeBooked");
  const pipeWon = document.getElementById("pipeWon");

  const barEnq = document.getElementById("barEnq");
  const barContacted = document.getElementById("barContacted");
  const barBooked


  segButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      segButtons.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");

      const key = btn.dataset.industry || "all";
      apply(key);
    });
  });

  // default combined
  apply("all");
})();

// ===============================
// END: script.js
// ===============================

