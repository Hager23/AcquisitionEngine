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
const revealEls = Array.from(document.querySelectorAll(".reveal"));

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
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
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

      // stagger counts inside a section/card
      const parent = e.target.closest(".dashboard-card, .outcomes, .section");
      const group = parent
        ? Array.from(parent.querySelectorAll(".count[data-count]"))
        : [e.target];

      group.forEach((node, i) => animateCount(node, i * 110));

      // unobserve all in that group
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
  const px = (x - rect.left) / rect.width;   // 0..1
  const py = (y - rect.top) / rect.height;   // 0..1

  const rotateY = (px - 0.5) * 10; // -5..5 deg
  const rotateX = (0.5 - py) * 10; // -5..5 deg
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

  // subtle “breathing” at rest on touch devices
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
//    Optional: move dot ONLY while hovering the chart
// -------------------------------
const chart = document.querySelector(".line-chart");
const linePath = document.querySelector(".chart-line");
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
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
    const p = linePath.getPointAtLength(total * eased);

    dot.setAttribute("cx", p.x);
    dot.setAttribute("cy", p.y);

    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Run ONCE when hero becomes visible
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
  // fallback
  animateDotOnce();
}

// Optional hover interaction: dot follows your mouse (feels “real” without constant motion)
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
//    (makes site feel more “alive”)
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

  // click index -> scroll to step
  idxButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const n = Number(btn.dataset.step || "0");
      const target = stepCards.find(c => Number(c.dataset.step) === n);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  // highlight active index + progress based on nearest card
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

    // progress (0..100)
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

    // progress only while timeline is in view
    const start = vh * 0.85;
    const end = vh * 0.25;

    const t = (start - r.top) / (start - end);
    const clamped = Math.max(0, Math.min(1, t));
    prog.style.height = `${clamped * 100}%`;

    // make dots “activate” as progress rises
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
  const KEY = "ae_cookie_choice"; // "accepted" | "declined"
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

  // Optional: ESC to dismiss (defaults to decline)
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && banner.classList.contains("show")) {
      close("declined");
    }
  });
})();



// ===============================
// END: script.js
// ===============================
