/* =========================
   START: script.js
========================= */
(function () {
  "use strict";

  // ---------- Mobile nav (defensive) ----------
  const toggle = document.querySelector("[data-nav-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");

  function closeMobileNav() {
    if (!toggle || !mobileNav) return;
    mobileNav.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  }

  function openMobileNav() {
    if (!toggle || !mobileNav) return;
    mobileNav.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
  }

  if (toggle && mobileNav) {
    closeMobileNav();

    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      expanded ? closeMobileNav() : openMobileNav();
    });

    mobileNav.addEventListener("click", (e) => {
      const a = e.target && e.target.closest ? e.target.closest("a") : null;
      if (a) closeMobileNav();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMobileNav();
    });

    window.addEventListener("resize", () => {
      if (window.matchMedia("(min-width: 981px)").matches) closeMobileNav();
    });
  }

  // ---------- Footer year ----------
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // ---------- Reveal on scroll ----------
  const revealEls = Array.from(document.querySelectorAll(".reveal"));
  if (revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -12% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  // ---------- Micro tilt (subtle) ----------
  const tiltEls = Array.from(document.querySelectorAll("[data-tilt]"));
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  if (!prefersReduced && tiltEls.length) {
    tiltEls.forEach((el) => {
      let raf = 0;

      function onMove(e) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width;
          const y = (e.clientY - r.top) / r.height;
          const rx = clamp((0.5 - y) * 6, -3, 3);
          const ry = clamp((x - 0.5) * 6, -3, 3);
          el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-1px)`;
        });
      }

      function onLeave() {
        cancelAnimationFrame(raf);
        el.style.transform = "";
      }

      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
    });
  }

  // ---------- Dashboard segmentation ----------
  const data = {
    all: {
      enquiries: { v: "38", d: "+18%", cls: "up" },
      calls: { v: "12", d: "+9%", cls: "up" },
      deals: { v: "5", d: "—", cls: "neutral" },
      revenue: { v: "$48,200", d: "-4%", cls: "down" },
      line: "M20 92 C 60 70, 85 74, 110 66 C 135 58, 155 62, 180 52 C 205 42, 225 50, 250 36 C 275 22, 290 30, 300 22"
    },
    tradies: {
      enquiries: { v: "41", d: "+12%", cls: "up" },
      calls: { v: "14", d: "+7%", cls: "up" },
      deals: { v: "6", d: "+1", cls: "up" },
      revenue: { v: "$52,900", d: "+3%", cls: "up" },
      line: "M20 94 C 60 78, 92 70, 118 62 C 145 54, 165 56, 190 46 C 215 36, 235 44, 258 30 C 280 18, 292 26, 300 18"
    },
    builders: {
      enquiries: { v: "29", d: "+6%", cls: "up" },
      calls: { v: "9", d: "+4%", cls: "up" },
      deals: { v: "3", d: "—", cls: "neutral" },
      revenue: { v: "$34,700", d: "-2%", cls: "down" },
      line: "M20 96 C 58 82, 90 80, 118 70 C 145 60, 165 66, 190 58 C 215 50, 238 52, 260 46 C 282 40, 292 42, 300 38"
    },
    insurance: {
      enquiries: { v: "33", d: "+9%", cls: "up" },
      calls: { v: "11", d: "+6%", cls: "up" },
      deals: { v: "4", d: "—", cls: "neutral" },
      revenue: { v: "$44,100", d: "+1%", cls: "up" },
      line: "M20 98 C 60 84, 92 76, 118 72 C 145 68, 170 60, 196 56 C 220 52, 242 46, 262 42 C 284 38, 294 36, 300 34"
    },
    solar: {
      enquiries: { v: "46", d: "+21%", cls: "up" },
      calls: { v: "15", d: "+10%", cls: "up" },
      deals: { v: "7", d: "+2", cls: "up" },
      revenue: { v: "$61,300", d: "+6%", cls: "up" },
      line: "M20 92 C 56 78, 86 72, 112 56 C 138 40, 164 46, 188 36 C 212 26, 236 34, 258 22 C 280 10, 292 18, 300 12"
    },
    agencies: {
      enquiries: { v: "26", d: "+5%", cls: "up" },
      calls: { v: "8", d: "+2%", cls: "up" },
      deals: { v: "2", d: "—", cls: "neutral" },
      revenue: { v: "$18,800", d: "+5%", cls: "up" },
      line: "M20 98 C 58 90, 92 84, 118 74 C 145 64, 170 66, 194 56 C 218 46, 240 52, 262 44 C 284 36, 294 40, 300 34"
    }
  };

  const segBtns = Array.from(document.querySelectorAll(".seg-btn"));
  const sparkLine = document.querySelector("[data-spark-line]");

  function setDelta(el, cls) {
    if (!el) return;
    el.classList.remove("up", "down", "neutral");
    el.classList.add(cls);
  }

  function applySegment(key) {
    const d = data[key];
    if (!d) return;

    const setText = (sel, v) => {
      const el = document.querySelector(sel);
      if (el) el.textContent = v;
    };

    setText('[data-kpi="enquiries"]', d.enquiries.v);
    setText('[data-kpi="calls"]', d.calls.v);
    setText('[data-kpi="deals"]', d.deals.v);
    setText('[data-kpi="revenue"]', d.revenue.v);

    const de = document.querySelector('[data-kpi-delta="enquiries"]');
    const dc = document.querySelector('[data-kpi-delta="calls"]');
    const dd = document.querySelector('[data-kpi-delta="deals"]');
    const dr = document.querySelector('[data-kpi-delta="revenue"]');

    if (de) { de.textContent = d.enquiries.d; setDelta(de, d.enquiries.cls); }
    if (dc) { dc.textContent = d.calls.d; setDelta(dc, d.calls.cls); }
    if (dd) { dd.textContent = d.deals.d; setDelta(dd, d.deals.cls); }
    if (dr) { dr.textContent = d.revenue.d; setDelta(dr, d.revenue.cls); }

    if (sparkLine) sparkLine.setAttribute("d", d.line);
  }

  if (segBtns.length) {
    segBtns.forEach((b) => {
      b.addEventListener("click", () => {
        segBtns.forEach((x) => {
          x.classList.remove("is-active");
          x.setAttribute("aria-selected", "false");
        });
        b.classList.add("is-active");
        b.setAttribute("aria-selected", "true");
        const key = b.getAttribute("data-seg") || "all";
        applySegment(key);
      });
    });
  }

  // ---------- Engine steps ----------
  const stepBtns = Array.from(document.querySelectorAll(".step[data-step]"));
  const bar = document.querySelector("[data-engine-bar]");
  const badge = document.querySelector("[data-engine-badge]");
  const title = document.querySelector("[data-engine-title]");
  const list = document.querySelector("[data-engine-list]");

  const steps = [
    { b: "Step 01", t: "Capture", items: ["High-intent forms that reduce junk.", "Track source + service + urgency.", "Instant lead routing to the right place."] },
    { b: "Step 02", t: "Instant Response", items: ["Speed-to-lead reply templates.", "Auto-qualification questions.", "Booking link routing by service."] },
    { b: "Step 03", t: "Multi-touch Follow-up", items: ["SMS + email sequences that feel human.", "No-show reminders + reschedule loops.", "After-hours responses covered."] },
    { b: "Step 04", t: "Booking", items: ["Calendly confirmations + reminders.", "Pipeline stage updates automatically.", "Cleaner handoff to delivery."] },
    { b: "Step 05", t: "Reporting", items: ["Track reply rate + booked call rate.", "See lead source performance.", "Fix drop-offs with simple changes."] }
  ];

  function renderStep(i) {
    const s = steps[i];
    if (!s) return;
    if (badge) badge.textContent = s.b;
    if (title) title.textContent = s.t;

    if (list) {
      list.innerHTML = "";
      s.items.forEach((txt) => {
        const li = document.createElement("li");
        li.textContent = txt;
        list.appendChild(li);
      });
    }

    if (bar) bar.style.width = `${(i + 1) * 20}%`;
  }

  if (stepBtns.length) {
    stepBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        stepBtns.forEach((x) => x.classList.remove("is-active"));
        btn.classList.add("is-active");
        const idx = Number(btn.getAttribute("data-step") || "0");
        renderStep(Math.max(0, Math.min(4, idx)));
      });
    });
  }
})();
 /* =========================
    END: script.js
 ========================= */
