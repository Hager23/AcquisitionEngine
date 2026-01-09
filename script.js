// ===============================
// START: script.js (Onix Marketing)
// ===============================

const qs = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

// -------------------------------
// 0) Mobile hamburger menu
// -------------------------------
(function mobileNav(){
  const header = qs("#siteHeader");
  const btn = qs("#navToggle");
  const panel = qs("#mobileNav");
  if (!header || !btn || !panel) return;

  const setOpen = (open) => {
    header.classList.toggle("menu-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  btn.addEventListener("click", () => setOpen(!header.classList.contains("menu-open")));
  panel.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  window.addEventListener("resize", () => { if (window.innerWidth > 820) setOpen(false); });
})();

// -------------------------------
// 1) Smooth anchor scrolling
// -------------------------------
qsa('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const href = a.getAttribute("href");
    if (!href || href === "#" || href === "#0") return;

    const target = qs(href);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

// -------------------------------
// 2) Scroll reveal (SAFE)
// uses .show (and also adds .is-visible for compatibility)
// -------------------------------
const revealEls = qsa(".reveal");
const makeVisible = (el) => { el.classList.add("show"); el.classList.add("is-visible"); };

if (!("IntersectionObserver" in window)) {
  revealEls.forEach(makeVisible);
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;

        // stagger children if it's a container
        const kids = el.querySelectorAll(".reveal-child");
        if (kids.length) {
          kids.forEach((k, i) => {
            k.style.transitionDelay = `${i * 90}ms`;
            makeVisible(k);
          });
        }

        makeVisible(el);
        revealObserver.unobserve(el);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -12% 0px" }
  );

  revealEls.forEach((el) => revealObserver.observe(el));
}

// -------------------------------
// 3) Count-up animation (slower + stagger)
// -------------------------------
function animateCount(el, delayMs = 0) {
  const target = Number(el.getAttribute("data-count") || "0");
  const isMoney = el.classList.contains("money");
  const duration = 1500;
  const start = performance.now() + delayMs;

  function tick(now) {
    if (now < start) { requestAnimationFrame(tick); return; }
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const value = Math.round(target * eased);

    el.textContent = isMoney ? `$${value.toLocaleString()}` : value.toLocaleString();
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const countEls = qsa(".count[data-count]");
if (!("IntersectionObserver" in window)) {
  countEls.forEach((node, i) => animateCount(node, i * 110));
} else {
  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;

        const parent = e.target.closest(".dashboard-card, .outcomes, .section");
        const group = parent ? qsa(".count[data-count]", parent) : [e.target];

        group.forEach((node, i) => animateCount(node, i * 110));
        group.forEach((node) => countObserver.unobserve(node));
      });
    },
    { threshold: 0.35 }
  );

  countEls.forEach((el) => countObserver.observe(el));
}

// -------------------------------
// 4) Tooltip for KPI (data-tip)
// -------------------------------
const tip = qs("#chartTip");

function showTip(text) {
  if (!tip) return;
  tip.textContent = text || "";
  tip.classList.add("show");
  tip.setAttribute("aria-hidden", "false");
}
function moveTip(x, y) {
  if (!tip) return;
  const pad = 14;
  const maxW = 280;
  const left = Math.min(window.innerWidth - maxW, x + pad);
  const top = Math.max(10, y + pad);
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}
function hideTip() {
  if (!tip) return;
  tip.classList.remove("show");
  tip.setAttribute("aria-hidden", "true");
}

qsa("[data-tip]").forEach((node) => {
  node.addEventListener("mouseenter", () => showTip(node.getAttribute("data-tip")));
  node.addEventListener("mousemove", (e) => moveTip(e.clientX, e.clientY));
  node.addEventListener("mouseleave", hideTip);
});

// -------------------------------
// 5) Hero dashboard tilt/parallax
// -------------------------------
const heroCard = qs(".hero-dashboard");
let tiltRAF = null;

function setTilt(x, y) {
  if (!heroCard) return;
  const rect = heroCard.getBoundingClientRect();
  const px = (x - rect.left) / rect.width;
  const py = (y - rect.top) / rect.height;

  const rotateY = (px - 0.5) * 10;
  const rotateX = (0.5 - py) * 10;
  heroCard.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(18px)`;
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
// 6) Lead chart animate once + hover dot
// -------------------------------
const chart = qs(".line-chart");
const linePath = qs(".chart-line");
const dot = qs(".chart-dot");

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
    else placeDotAtEnd();
  }
  requestAnimationFrame(frame);
}

const hero = qs(".hero");
if (hero && "IntersectionObserver" in window) {
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
  chart.addEventListener("mouseleave", placeDotAtEnd);
}

// -------------------------------
// 7) Button micro-interaction
// -------------------------------
qsa(".btn-primary, .btn-secondary").forEach((btn) => {
  btn.addEventListener("mousedown", () => { btn.style.transform = "translateY(1px) scale(0.99)"; });
  const reset = () => (btn.style.transform = "");
  btn.addEventListener("mouseup", reset);
  btn.addEventListener("mouseleave", reset);
});

// -------------------------------
// 8) Background intensity on scroll
// -------------------------------
const aurora = qs(".site-aurora");
if (aurora) {
  let raf = null;
  window.addEventListener("scroll", () => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const y = window.scrollY || 0;
      const intensity = Math.min(1, y / 900);
      aurora.style.filter = `blur(${34 - intensity * 6}px) saturate(${110 + intensity * 15}%)`;
    });
  }, { passive: true });
}

// -------------------------------
// Engine map interactions
// -------------------------------
(function initEngineMap(){
  const stepsWrap = qs("#engineSteps");
  const idxButtons = qsa(".idx");
  const progressEl = qs("#railProgress");
  if (!stepsWrap || !idxButtons.length || !progressEl) return;

  const stepCards = qsa(".step-card", stepsWrap);

  idxButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const n = Number(btn.dataset.step || "0");
      const target = stepCards.find(c => Number(c.dataset.step) === n);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  function onScroll() {
    const vh = window.innerHeight || 1;
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
    const activeBtn = qs(`.idx[data-step="${activeStep}"]`);
    if (activeBtn) activeBtn.classList.add("active");

    const p = stepCards.length <= 1 ? 100 : (bestIdx / (stepCards.length - 1)) * 100;
    progressEl.style.width = `${p}%`;
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();

// -------------------------------
// Footer year (single)
// -------------------------------
(function footerYear(){
  const el = qs("#year");
  if (el) el.textContent = String(new Date().getFullYear());
})();

// -------------------------------
// Cookie banner
// -------------------------------
(function cookieBanner(){
  const KEY = "onix_cookie_choice";
  const banner = qs("#cookieBanner");
  const acceptBtn = qs("#cookieAccept");
  const declineBtn = qs("#cookieDecline");
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
})();

// ===============================
// END: script.js
// ===============================
