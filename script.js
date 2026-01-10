// ===============================
// START: script.js (Acquisition Engine)
// ===============================

// -------------------------------
// 0) INDUSTRY DATA (Hero Dashboard)
// -------------------------------
const INDUSTRY_DATA = {
  all: {
    kpis: { enquiries: 38, calls: 12, wins: 5, revenue: 48200 },
    trend: "M0 100 L40 80 L80 85 L120 60 L160 55 L200 70 L240 40 L280 30 L300 28",
    pipeline: { enquiries: 38, contacted: 28, booked: 12, won: 5 }
  },
  tradies: {
    kpis: { enquiries: 27, calls: 11, wins: 4, revenue: 38800 },
    trend: "M0 100 L40 90 L80 78 L120 70 L160 60 L200 55 L240 48 L280 42 L300 38",
    pipeline: { enquiries: 27, contacted: 21, booked: 11, won: 4 }
  },
  builders: {
    kpis: { enquiries: 19, calls: 8, wins: 3, revenue: 61200 },
    trend: "M0 100 L40 92 L80 88 L120 80 L160 72 L200 65 L240 52 L280 46 L300 40",
    pipeline: { enquiries: 19, contacted: 14, booked: 8, won: 3 }
  },
  insurance: {
    kpis: { enquiries: 42, calls: 16, wins: 6, revenue: 55400 },
    trend: "M0 100 L40 78 L80 74 L120 68 L160 60 L200 54 L240 44 L280 34 L300 30",
    pipeline: { enquiries: 42, contacted: 31, booked: 16, won: 6 }
  },
  solar: {
    kpis: { enquiries: 22, calls: 9, wins: 3, revenue: 72100 },
    trend: "M0 100 L40 94 L80 86 L120 78 L160 70 L200 62 L240 54 L280 46 L300 40",
    pipeline: { enquiries: 22, contacted: 17, booked: 9, won: 3 }
  }
};

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
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("show");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.15 }
  );

  revealEls.forEach((el) => revealObserver.observe(el));
}

// -------------------------------
// 3) Count-up animation
// -------------------------------
function animateCount(el, delay = 0) {
  const target = Number(el.dataset.count || 0);
  const isMoney = el.classList.contains("money");
  const duration = 1200;
  const start = performance.now() + delay;

  function tick(now) {
    if (now < start) return requestAnimationFrame(tick);
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const val = Math.round(target * eased);
    el.textContent = isMoney ? `$${val.toLocaleString()}` : val.toLocaleString();
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// -------------------------------
// 4) Hero dashboard industry switch
// -------------------------------
function updateDashboard(industryKey = "all") {
  const data = INDUSTRY_DATA[industryKey] || INDUSTRY_DATA.all;

  // KPIs
  document.querySelector('[data-kpi="enquiries"]')?.setAttribute("data-count", data.kpis.enquiries);
  document.querySelector('[data-kpi="calls"]')?.setAttribute("data-count", data.kpis.calls);
  document.querySelector('[data-kpi="wins"]')?.setAttribute("data-count", data.kpis.wins);
  document.querySelector('[data-kpi="revenue"]')?.setAttribute("data-count", data.kpis.revenue);

  document.querySelectorAll(".count[data-count]").forEach((el, i) =>
    animateCount(el, i * 120)
  );

  // Chart
  const line = document.querySelector(".chart-line");
  const area = document.querySelector(".chart-area");
  if (line && area) {
    line.setAttribute("d", data.trend);
    area.setAttribute("d", `${data.trend} L300 120 L0 120 Z`);
  }

  // Pipeline
  const pipe = data.pipeline;
  const rows = document.querySelectorAll(".funnel .frow");
  if (rows.length === 4) {
    rows[0].querySelector("strong").textContent = pipe.enquiries;
    rows[1].querySelector("strong").textContent = pipe.contacted;
    rows[2].querySelector("strong").textContent = pipe.booked;
    rows[3].querySelector("strong").textContent = pipe.won;
  }
}

// -------------------------------
// 5) Industry pills click
// -------------------------------
document.querySelectorAll("[data-industry]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-industry]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    updateDashboard(btn.dataset.industry);
  });
});

// Init default
updateDashboard("all");

// -------------------------------
// 6) Footer year
// -------------------------------
(function footerYear(){
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
})();

// -------------------------------
// 7) Cookie banner
// -------------------------------
(function cookieBanner(){
  const KEY = "ae_cookie_choice";
  const banner = document.getElementById("cookieBanner");
  if (!banner) return;

  const accept = document.getElementById("cookieAccept");
  const decline = document.getElementById("cookieDecline");

  if (!localStorage.getItem(KEY)) banner.classList.add("show");

  function close(choice){
    localStorage.setItem(KEY, choice);
    banner.classList.remove("show");
  }

  accept?.addEventListener("click", () => close("accepted"));
  decline?.addEventListener("click", () => close("declined"));
})();

// ===============================
// END: script.js
// ===============================
