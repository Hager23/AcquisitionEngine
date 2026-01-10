/* =========================
   ONIX site script (FULL)
   - Mobile nav
   - Count-up animation
   - Reveal animations (optional)
   - Industry dropdown: updates KPIs + funnel + chart
========================= */

(function year() {
  const y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());
})();

/* -------------------------
   Mobile Nav
------------------------- */
(function mobileNav() {
  const btn = document.getElementById("navToggle");
  const nav = document.getElementById("siteNav");
  if (!btn || !nav) return;

  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });

  nav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 900px)").matches) {
        nav.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  });
})();

/* -------------------------
   Count Up (numbers)
------------------------- */
function animateNumber(el, to, opts = {}) {
  const duration = opts.duration ?? 700;
  const isMoney = opts.money ?? false;
  const start = Number(el.dataset._n || "0");
  const startTime = performance.now();

  function fmt(n) {
    if (isMoney) {
      // $48,200 formatting
      return `$${Math.round(n).toLocaleString()}`;
    }
    return `${Math.round(n).toLocaleString()}`;
  }

  function tick(now) {
    const t = Math.min(1, (now - startTime) / duration);
    const v = start + (to - start) * (t * (2 - t)); // easeOutQuad
    el.textContent = fmt(v);
    if (t < 1) requestAnimationFrame(tick);
    else el.dataset._n = String(to);
  }

  requestAnimationFrame(tick);
}

/* -------------------------
   Industry data (REALISTIC VARIATION)
   You can tune these numbers later.
------------------------- */
const INDUSTRIES = {
  tradies: {
    label: "Tradies / Home Improvement",
    conversion: "18–28%",
    kpis: { enquiries: 38, booked: 12, won: 5, revenue: 48200 },
    funnel: { enquiries: 38, contacted: 28, booked: 12, won: 5 },
    chart: "M0 98 L40 82 L80 86 L120 64 L160 58 L200 70 L240 50 L280 36 L300 32"
  },
  solar: {
    label: "Solar",
    conversion: "22–35%",
    kpis: { enquiries: 44, booked: 14, won: 6, revenue: 73500 },
    funnel: { enquiries: 44, contacted: 35, booked: 14, won: 6 },
    chart: "M0 100 L40 88 L80 74 L120 66 L160 54 L200 52 L240 40 L280 30 L300 26"
  },
  agencies: {
    label: "Agencies",
    conversion: "10–18%",
    kpis: { enquiries: 26, booked: 6, won: 2, revenue: 12400 },
    funnel: { enquiries: 26, contacted: 18, booked: 6, won: 2 },
    chart: "M0 98 L40 92 L80 90 L120 84 L160 78 L200 72 L240 70 L280 64 L300 60"
  },
  local: {
    label: "Local Services",
    conversion: "15–25%",
    kpis: { enquiries: 33, booked: 9, won: 3, revenue: 21900 },
    funnel: { enquiries: 33, contacted: 24, booked: 9, won: 3 },
    chart: "M0 100 L40 90 L80 84 L120 72 L160 66 L200 60 L240 54 L280 44 L300 40"
  },
  realestate: {
    label: "Real Estate",
    conversion: "8–14%",
    kpis: { enquiries: 21, booked: 5, won: 1, revenue: 41000 },
    funnel: { enquiries: 21, contacted: 14, booked: 5, won: 1 },
    chart: "M0 100 L40 96 L80 92 L120 88 L160 82 L200 76 L240 70 L280 66 L300 62"
  },
  insurance: {
    label: "Insurance",
    conversion: "12–20%",
    kpis: { enquiries: 29, booked: 7, won: 2, revenue: 17800 },
    funnel: { enquiries: 29, contacted: 21, booked: 7, won: 2 },
    chart: "M0 100 L40 94 L80 90 L120 82 L160 76 L200 72 L240 64 L280 58 L300 54"
  },
  mortgage: {
    label: "Mortgages",
    conversion: "9–16%",
    kpis: { enquiries: 24, booked: 6, won: 1, revenue: 56000 },
    funnel: { enquiries: 24, contacted: 16, booked: 6, won: 1 },
    chart: "M0 100 L40 94 L80 92 L120 86 L160 80 L200 76 L240 70 L280 66 L300 62"
  },
  medical: {
    label: "Medical",
    conversion: "18–30%",
    kpis: { enquiries: 41, booked: 13, won: 4, revenue: 30500 },
    funnel: { enquiries: 41, contacted: 31, booked: 13, won: 4 },
    chart: "M0 100 L40 90 L80 80 L120 70 L160 60 L200 54 L240 46 L280 36 L300 30"
  }
};

/* -------------------------
   Apply industry to UI
------------------------- */
function setChartPath(d) {
  const line = document.getElementById("chartLinePath");
  const area = document.getElementById("chartAreaPath");
  const mask = document.getElementById("chartMaskPath");
  const shimmer = document.getElementById("chartShimmerPath");
  const dot = document.querySelector(".chart-dot");

  if (!line || !area || !mask || !shimmer) return;

  line.setAttribute("d", d);
  shimmer.setAttribute("d", d);
  mask.setAttribute("d", d);
  area.setAttribute("d", `${d} L300 120 L0 120 Z`);

  // Move dot to last point
  if (dot) {
    const parts = d.trim().split(" ");
    const last = parts.slice(-2); // ["300","32"]
    const x = Number(last[0]);
    const y = Number(last[1]);
    if (!Number.isNaN(x) && !Number.isNaN(y)) {
      dot.setAttribute("cx", String(x));
      dot.setAttribute("cy", String(y));
    }
  }
}

function applyIndustry(key) {
  const data = INDUSTRIES[key] || INDUSTRIES.tradies;

  // Conversion chip + text
  const chip = document.getElementById("nicheRateChip");
  const text = document.getElementById("nicheRateText");
  if (chip) chip.textContent = data.conversion;
  if (text) text.textContent = `Average conversion rate: ${data.conversion}`;

  // KPI values
  const kpiEnquiries = document.querySelector('[data-kpi="enquiries"]');
  const kpiBooked = document.querySelector('[data-kpi="booked"]');
  const kpiWon = document.querySelector('[data-kpi="won"]');
  const kpiRevenue = document.querySelector('[data-kpi="revenue"]');

  if (kpiEnquiries) animateNumber(kpiEnquiries, data.kpis.enquiries);
  if (kpiBooked) animateNumber(kpiBooked, data.kpis.booked);
  if (kpiWon) animateNumber(kpiWon, data.kpis.won);
  if (kpiRevenue) animateNumber(kpiRevenue, data.kpis.revenue, { money: true });

  // Funnel numbers
  const fEnquiries = document.querySelector('[data-funnel="enquiries"]');
  const fContacted = document.querySelector('[data-funnel="contacted"]');
  const fBooked = document.querySelector('[data-funnel="booked"]');
  const fWon = document.querySelector('[data-funnel="won"]');

  if (fEnquiries) fEnquiries.textContent = String(data.funnel.enquiries);
  if (fContacted) fContacted.textContent = String(data.funnel.contacted);
  if (fBooked) fBooked.textContent = String(data.funnel.booked);
  if (fWon) fWon.textContent = String(data.funnel.won);

  // Funnel bar widths (relative to enquiries)
  const denom = Math.max(1, data.funnel.enquiries);
  const bars = {
    enquiries: 100,
    contacted: Math.round((data.funnel.contacted / denom) * 100),
    booked: Math.round((data.funnel.booked / denom) * 100),
    won: Math.round((data.funnel.won / denom) * 100),
  };

  document.querySelectorAll("[data-bar]").forEach((el) => {
    const k = el.getAttribute("data-bar");
    const w = bars[k] ?? 0;
    el.style.setProperty("--w", `${w}%`);
  });

  // Chart
  setChartPath(data.chart);
}

/* -------------------------
   Hook up niche selector
------------------------- */
(function industrySelector() {
  const select = document.getElementById("nicheSelect");
  if (!select) return;

  select.addEventListener("change", (e) => {
    applyIndustry(e.target.value);
  });

  // initial
  applyIndustry(select.value || "tradies");
})();
