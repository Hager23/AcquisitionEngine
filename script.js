/* =========================================================
   Onix site script
   - ✅ FIX #1 mobile menu toggle with:
     #navToggle toggles .open on #siteNav
     updates aria-expanded
     closes on nav link click + outside click + Escape
   - reveal animations (kept minimal + safe)
   - optional cookie banner (safe, no-op if elements missing)
========================================================= */

(() => {
  // Mark JS-enabled for reveal animations
  document.documentElement.classList.add("js");

  // ----------------------------
  // ✅ FIX #1 — Mobile nav
  // ----------------------------
  const nav = document.getElementById("siteNav");
  const toggle = document.getElementById("navToggle");

  if (nav && toggle) {
    const closeNav = () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    };

    const openNav = () => {
      nav.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
    };

    const isOpen = () => nav.classList.contains("open");

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isOpen()) closeNav();
      else openNav();
    });

    // Close when any nav link is clicked
    nav.addEventListener("click", (e) => {
      const target = e.target;
      if (target && target.closest && target.closest("a")) {
        // Only close for mobile-sized layouts (match CSS breakpoint)
        if (window.matchMedia("(max-width: 900px)").matches) closeNav();
      }
    });

    // Close on outside click (only if open)
    document.addEventListener("click", (e) => {
      if (!isOpen()) return;
      const t = e.target;
      const clickedInsideNav = nav.contains(t);
      const clickedToggle = toggle.contains(t);
      if (!clickedInsideNav && !clickedToggle) closeNav();
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) closeNav();
    });

    // If user resizes to desktop, ensure nav is not stuck with open state
    window.addEventListener("resize", () => {
      if (!window.matchMedia("(max-width: 900px)").matches) {
        // On desktop, keep inline and "closed" state for aria
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      }
    });
  }

  // ----------------------------
  // Reveal animations
  // ----------------------------
  const revealEls = Array.from(document.querySelectorAll(".reveal"));
  if (revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
            io.unobserve(entry.target);
          }
        }
      },
      { root: null, threshold: 0.12 }
    );

    revealEls.forEach((el) => io.observe(el));
  }

  // ----------------------------
  // Cookie banner (safe)
  // ----------------------------
  const cookieEl = document.getElementById("cookie");
  const btnAccept = document.getElementById("cookieAccept");
  const btnReject = document.getElementById("cookieReject");

  const COOKIE_KEY = "onix_cookie_choice";

  const hideCookie = () => {
    if (!cookieEl) return;
    cookieEl.classList.remove("show");
  };

  const showCookie = () => {
    if (!cookieEl) return;
    cookieEl.classList.add("show");
  };

  try {
    const choice = localStorage.getItem(COOKIE_KEY);
    if (!choice) showCookie();
  } catch (_) {
    // ignore storage errors
  }

  if (btnAccept) {
    btnAccept.addEventListener("click", () => {
      try { localStorage.setItem(COOKIE_KEY, "accept"); } catch (_) {}
      hideCookie();
    });
  }

  if (btnReject) {
    btnReject.addEventListener("click", () => {
      try { localStorage.setItem(COOKIE_KEY, "reject"); } catch (_) {}
      hideCookie();
    });
  }
})();
