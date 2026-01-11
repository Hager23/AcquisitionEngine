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

if (!("IntersectionObserver" in window)) {
  revealEls.forEach((el) => el.classList.add("show"));
} else {
  document.documentElement.classList.add("js");
  const revealFallback = setTimeout(() => {
    revealEls.forEach((el) => el.classList.add("show"));
  }, 1600);

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
}

function forceShowReveals() {
  revealEls.forEach((el) => el.classList.add("show"));
}

window.addEventListener("error", forceShowReveals, { once: true });
window.addEventListener("unhandledrejection", forceShowReveals, { once: true });

// … rest of script.js unchanged …
