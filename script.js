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
// 6) Lead chart: dot hover (kept)
// -------------------------------
const chart = document.querySelector(".line-chart");
const linePath = document.querySelector(".chart-line");
const areaPath = document.querySelector(".chart-area");
const dot = document.querySelector(".chart-dot");

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
// ✅ 6B) Industry chart controller (NEW)
// -------------------------------
(function industryChartController(){
  const tabs = document.getElementById("industryTabs");
  const labelEl = document.getElementById("chartIndustryLabel");
  const chipEl = document.getElementById("chartRangeChip");

  // KPI targets (these will update data-count and re-animate)
  const kpiNew = document.querySelector('.kpi .value.count[data-count="38"]') || document.querySelectorAll(".kpi .value.count")[0];
  const kpiCalls = document.querySelectorAll(".kpi .value.count")[1];
  const kpiWon  = document.querySelectorAll(".kpi .value.count")[2];
  const kpiRev  = document.querySelector(".kpi .value.money.count");

  // Funnel strong numbers (in order: Enquiries, Contacted, Booked, Won)
  const funnelNums = Array.from(document.querySelectorAll(".funnel .frow strong"));

  if (!tabs || !linePath || !areaPath || !dot) return;

  // SVG path sets (feel “real” per industry)
  const data = {
    all: {
      name: "All",
      line: "M0 100 L40 84 L80 86 L120 64 L160 58 L200 72 L240 44 L280 32 L300 30",
      area: "M0 100 L40 84 L80 86 L120 64 L160 58 L200 72 L240 44 L280 32 L300 30 L300 120 L0 120 Z",
      kpi: { enquiries: 38, calls: 12, won: 5, revenue: 48200 },
      funnel: { enquiries: 38, contacted: 28, booked: 12, won: 5 }
    },
    tradies: {
      name: "Tradies",
      line: "M0 102 L40 92 L80 82 L120 74 L160 60 L200 56 L240 44 L280 34 L300 28",
      area: "M0 102 L40 92 L80 82 L120 74 L160 60 L200 56 L240 44 L280 34 L300 28 L300 120 L0 120 Z",
      kpi: { enquiries: 31, calls: 13, won: 6, revenue: 55600 },
      funnel: { enquiries: 31, contacted: 24, booked: 13, won: 6 }
    },
    builders: {
      name: "Builders",
      line: "M0 104 L40 96 L80 94 L120 76 L160 66 L200 58 L240 54 L280 40 L300 36",
      area: "M0 104 L40 96 L80 94 L120 76 L160 66 L200 58 L240 54 L280 40 L300 36 L300 120 L0 120 Z",
      kpi: { enquiries: 22, calls: 9, won: 3, revenue: 38800 },
      funnel: { enquiries: 22, contacted: 17, booked: 9, won: 3 }
    },
    insurance: {
      name: "Insurance",
      line: "M0 108 L40 102 L80 92 L120 86 L160 70 L200 62 L240 52 L280 46 L300 38",
      area: "M0 108 L40 102 L80 92 L120 86 L160 70 L200 62 L240 52 L280 46 L300 38 L300 120 L0 120 Z",
      kpi: { enquiries: 27, calls: 11, won: 4, revenue: 38800 },
      funnel: { enquiries: 27, contacted: 21, booked: 11, won: 4 }
    },
    solar: {
      name: "Solar",
      line: "M0 106 L40 98 L80 86 L120 78 L160 72 L200 60 L240 46 L280 42 L300 34",
      area: "M0 106 L40 98 L80 86 L120 78 L160 72 L200 60 L240 46 L280 42 L300 34 L300 120 L0 120 Z",
      kpi: { enquiries: 26, calls: 10, won: 4, revenue: 46200 },
      funnel: { enquiries: 26, contacted: 20, booked: 10, won: 4 }
    },
    agencies: {
      name: "Agencies",
      line: "M0 110 L40 104 L80 96 L120 84 L160 78 L200 66 L240 58 L280 50 L300 44",
      area: "M0 110 L40 104 L80 96 L120 84 L160 78 L200 66 L240 58 L280 50 L300 44 L300 120 L0 120 Z",
      kpi: { enquiries: 18, calls: 7, won: 2, revenue: 24600 },
      funnel: { enquiries: 18, contacted: 14, booked: 7, won: 2 }
    }
  };

  function setCounts(k, delay = 0){
    if (!kpiNew || !kpiCalls || !kpiWon || !kpiRev) return;

    kpiNew.setAttribute("data-count", String(k.enquiries));
    kpiCalls.setAttribute("data-count", String(k.calls));
    kpiWon.setAttribute("data-count", String(k.won));
    kpiRev.setAttribute("data-count", String(k.revenue));

    // reset text to 0 then animate
    [kpiNew, kpiCalls, kpiWon].forEach(el => el.textContent = "0");
    kpiRev.textContent = "$0";

    // animate them
    setTimeout(() => {
      animateCount(kpiNew, 0);
      animateCount(kpiCalls, 110);
      animateCount(kpiWon, 220);
      animateCount(kpiRev, 330);
    }, delay);
  }

  function setFunnel(f){
    if (!funnelNums.length) return;
    const vals = [f.enquiries, f.contacted, f.booked, f.won];
    funnelNums.forEach((n, i) => {
      n.textContent = String(vals[i] ?? "");
    });
  }

  function setChartPaths(d){
    linePath.setAttribute("d", d.line);
    areaPath.setAttribute("d", d.area);

    // restart line animation
    linePath.style.animation = "none";
    // force reflow
    void linePath.getBoundingClientRect();
    linePath.style.animation = "";

    // move dot to end after change
    setTimeout(() => {
      placeDotAtEnd();
      animateDotOnce();
    }, 40);
  }

  function setActive(industry){
    const d = data[industry] || data.all;

    // active button UI
    tabs.querySelectorAll(".seg-btn").forEach(btn => {
      const isActive = btn.dataset.industry === industry;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    if (labelEl) labelEl.textContent = d.name;
    if (chipEl) chipEl.textContent = `7 days • ${d.name}`;

    setChartPaths(d);
    setCounts(d.kpi, 50);
    setFunnel(d.funnel);
  }

  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".seg-btn");
    if (!btn) return;
    setActive(btn.dataset.industry);
  });

  // default state
  setActive("all");
})();

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
// Booking link: bind all CTAs
// ================================
(function bindBookingLinks(){
  const url = window.BOOKING_URL;
  if (!url) return;

  document.querySelectorAll("[data-book]").forEach((btn) => {
    btn.setAttribute("href", url);
    btn.setAttribute("target", "_blank");
    btn.setAttribute("rel", "noopener noreferrer");
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
    // ================================
// Industry filter for hero dashboard
// (Updates KPI + chart + pipeline + label)
// ================================
(function initIndustryFilters(){
  const controls = document.getElementById("industryControls");
  const rangeLabel = document.getElementById("chartRangeLabel");

  const kpiEnq = document.querySelector('.kpi[data-tip*="New enquiries"] .value');
  const kpiBooked = document.querySelector('.kpi[data-tip*="Qualified calls"] .value');
  const kpiWon = document.querySelector('.kpi[data-tip*="Deals marked"] .value');
  const kpiRev = document.querySelector('.kpi[data-tip*="Revenue influenced"] .value');

  // funnel numbers
  const funnelRows = Array.from(document.querySelectorAll(".funnel .frow"));
  const funnelMap = {}; // label -> strong element
  funnelRows.forEach(row => {
    const label = row.querySelector("span")?.textContent?.trim()?.toLowerCase();
    const strong = row.querySelector("strong");
    if (label && strong) funnelMap[label] = strong;
  });

  // SVG paths
  const line = document.querySelector(".chart-line");
  const area = document.querySelector(".chart-area");
  const mask = document.querySelector(".chart-line-mask");

  // If any missing, bail safely
  if (!controls || !rangeLabel || !line || !area || !mask) return;

  // ✅ Data presets (feel “real”)
  // You can adjust numbers any time.
  const DATA = {
    all: {
      label: "All",
      kpis: { enquiries: 38, booked: 12, won: 5, revenue: 48200 },
      pipeline: { enquiries: 38, contacted: 28, booked: 12, won: 5 },
      path: "M0 96 L40 80 L80 84 L120 60 L160 56 L200 70 L240 40 L280 30 L300 28"
    },
    tradies: {
      label: "Tradies",
      kpis: { enquiries: 27, booked: 11, won: 4, revenue: 38800 },
      pipeline: { enquiries: 27, contacted: 21, booked: 11, won: 4 },
      path: "M0 100 L40 86 L80 90 L120 66 L160 62 L200 78 L240 46 L280 34 L300 30"
    },
    builders: {
      label: "Builders",
      kpis: { enquiries: 22, booked: 8, won: 3, revenue: 52100 },
      pipeline: { enquiries: 22, contacted: 16, booked: 8, won: 3 },
      path: "M0 102 L40 92 L80 82 L120 70 L160 58 L200 62 L240 50 L280 38 L300 34"
    },
    insurance: {
      label: "Insurance",
      kpis: { enquiries: 19, booked: 7, won: 2, revenue: 29800 },
      pipeline: { enquiries: 19, contacted: 14, booked: 7, won: 2 },
      path: "M0 104 L40 96 L80 88 L120 72 L160 68 L200 80 L240 54 L280 42 L300 36"
    },
    solar: {
      label: "Solar",
      kpis: { enquiries: 31, booked: 10, won: 4, revenue: 76400 },
      pipeline: { enquiries: 31, contacted: 23, booked: 10, won: 4 },
      path: "M0 98 L40 84 L80 76 L120 60 L160 54 L200 60 L240 44 L280 32 L300 26"
    },
    agencies: {
      label: "Agencies",
      kpis: { enquiries: 16, booked: 6, won: 2, revenue: 21400 },
      pipeline: { enquiries: 16, contacted: 12, booked: 6, won: 2 },
      path: "M0 106 L40 98 L80 92 L120 86 L160 78 L200 74 L240 62 L280 52 L300 48"
    }
  };

  function formatMoney(n){
    return "$" + Number(n || 0).toLocaleString();
  }

  function setCounts(ind){
    // update label
    rangeLabel.textContent = `7 days • ${DATA[ind].label}`;

    // update KPIs (keep your count animation? we just set directly)
    if (kpiEnq) kpiEnq.textContent = DATA[ind].kpis.enquiries.toLocaleString();
    if (kpiBooked) kpiBooked.textContent = DATA[ind].kpis.booked.toLocaleString();
    if (kpiWon) kpiWon.textContent = DATA[ind].kpis.won.toLocaleString();
    if (kpiRev) kpiRev.textContent = formatMoney(DATA[ind].kpis.revenue);

    // update funnel numbers
    if (funnelMap.enquiries) funnelMap.enquiries.textContent = DATA[ind].pipeline.enquiries.toLocaleString();
    if (funnelMap.contacted) funnelMap.contacted.textContent = DATA[ind].pipeline.contacted.toLocaleString();
    if (funnelMap.booked) funnelMap.booked.textContent = DATA[ind].pipeline.booked.toLocaleString();
    if (funnelMap.won) funnelMap.won.textContent = DATA[ind].pipeline.won.toLocaleString();
  }

  function setPath(ind){
    const d = DATA[ind].path;
    // line
    line.setAttribute("d", d);
    // mask
    mask.setAttribute("d", d);

    // area from line -> bottom fill
    // We reuse the same points and close the path at the bottom
    const areaD = `${d} L300 120 L0 120 Z`;
    area.setAttribute("d", areaD);

    // reset line draw animation so it feels responsive
    line.style.animation = "none";
    // force reflow
    void line.getBoundingClientRect();
    line.style.animation = "";
  }

  function activate(btn){
    controls.querySelectorAll(".seg").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  }

  controls.addEventListener("click", (e) => {
    const btn = e.target.closest(".seg");
    if (!btn) return;

    const ind = btn.dataset.industry || "all";
    if (!DATA[ind]) return;

    activate(btn);
    setCounts(ind);
    setPath(ind);
  });

  // initial state
  setCounts("all");
  setPath("all");
})();

  });
})();

// ===============================
// END: script.js
// ===============================

