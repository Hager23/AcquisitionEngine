// ===============================
// script.js (Onix Marketing)
// ===============================

// -------------------------------
// 0) Mobile nav toggle (hamburger)
// -------------------------------
(function mobileNav(){
  const toggle = document.getElementById("navToggle");
  const mobile = document.getElementById("mobileNav");
  if (!toggle || !mobile) return;

  function close() {
    mobile.classList.remove("show");
    mobile.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
  }

  function open() {
    mobile.classList.add("show");
    mobile.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
  }

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    expanded ? close() : open();
  });

  // close menu when clicking a link
  mobile.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => close());
  });

  // ESC closes
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
})();

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
// 2) Scroll reveal
// -------------------------------
const revealEls = Array.from(document.querySelectorAll(".reveal"));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("show");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.14, rootMargin: "0px 0px -12% 0px" }
);

revealEls.forEach((el) => revealObserver.observe(el));

// -------------------------------
// 3) Count-up animation
// -------------------------------
function animateCount(el, delayMs = 0) {
  const target = Number(el.getAttribute("data-count") || "0");
  const isMoney = el.classList.contains("money");
  const duration = 1500;
  const start = performance.now() + delayMs;

  function tick(now) {
    if (now < start) return requestAnimationFrame(tick);
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
      const parent = e.target.closest(".dashboard-card, .outcomes, .section") || document;
      const group = Array.from(parent.querySelectorAll(".count[data-count]"));
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
// 5) Hero dashboard tilt
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

  heroCard.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(12px)`;
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
}

// -------------------------------
// 6) Lead chart: dot animates once
// -------------------------------
const chart = document.querySelector(".line-chart");
const linePath = document.querySelector(".chart-line");
const dot = document.querySelector(".chart-dot");

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
}

// -------------------------------
// 7) Subtle scroll-based background intensity
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

// -------------------------------
// 8) Engine Map interactions
// -------------------------------
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

// -------------------------------
// 9) Bind booking links to Calendly
// -------------------------------
(function bindBookingLinks(){
  const url = window.BOOKING_URL;
  if (!url) return;

  document.querySelectorAll("[data-book]").forEach((btn) => {
    btn.setAttribute("href", url);
    btn.setAttribute("target", "_blank");
    btn.setAttribute("rel", "noopener noreferrer");
  });
})();

// -------------------------------
// 10) Footer year
// -------------------------------
(function footerYear(){
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
})();

// -------------------------------
// 11) Cookie banner
// -------------------------------
(function cookieBanner(){
  const KEY = "onix_cookie_choice";
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
    if (e.key === "Escape" && banner.classList.contains("show")) close("declined");
  });
})();

// -------------------------------
// 12) Hero chart niche -> conversion rate
// -------------------------------
(function nicheConversion(){
  const select = document.getElementById("nicheSelect");
  const out = document.getElementById("convRate");
  if (!select || !out) return;

  const rates = {
    tradies: "18%–32%",
    solar: "12%–24%",
    agencies: "10%–18%",
    home: "14%–26%",
    local: "16%–28%",
    realestate: "8%–16%",
    insurance: "7%–14%"
  };

  function setRate() {
    out.textContent = rates[select.value] || "—";
  }

  select.addEventListener("change", setRate);
  setRate();
})();
