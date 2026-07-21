// Landing interactivity — vanilla, no React. ~70 lines.

(function () {
  "use strict";

  const SCROLL_THRESHOLD = 8;

  function initHeader() {
    const header = document.querySelector("[data-site-header]");
    if (!header) return;

    const onScroll = () => {
      header.setAttribute("data-scrolled", String(window.scrollY > SCROLL_THRESHOLD));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const toggle = header.querySelector("[data-menu-toggle]");
    if (toggle) {
      toggle.addEventListener("click", () => {
        const isOpen = header.getAttribute("data-menu-open") === "true";
        setMenuOpen(header, toggle, !isOpen);
      });
      header.querySelectorAll(".mobile-nav a").forEach((link) => {
        link.addEventListener("click", () => {
          setMenuOpen(header, toggle, false);
        });
      });
      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        if (header.getAttribute("data-menu-open") !== "true") return;
        setMenuOpen(header, toggle, false);
        toggle.focus();
      });
    }
  }

  function setMenuOpen(header, toggle, open) {
    const mobileNav = header.querySelector(".mobile-nav");
    header.setAttribute("data-menu-open", String(open));
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    document.body.style.overflow = open ? "hidden" : "";

    if (mobileNav) {
      mobileNav.setAttribute("role", open ? "dialog" : "navigation");
      mobileNav.setAttribute("aria-modal", open ? "true" : "false");
    }

    if (open) {
      const firstLink = header.querySelector(".mobile-nav a");
      window.setTimeout(() => firstLink && firstLink.focus(), 0);
    }
  }

  function initActiveNav() {
    const sectionIds = ["platform", "how", "outcomes", "about"];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!sections.length) return;

    const links = new Map();
    document.querySelectorAll('.nav a, .mobile-nav a').forEach((link) => {
      const href = link.getAttribute("href") || "";
      const id = href.startsWith("#") ? href.slice(1) : null;
      if (id && sectionIds.includes(id)) links.set(id, [...(links.get(id) || []), link]);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (!visible[0]) return;
        const activeId = visible[0].target.id;
        links.forEach((linkList, id) => {
          linkList.forEach((link) => {
            if (id === activeId) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    sections.forEach((section) => observer.observe(section));
  }

  function initMouseGlow() {
    const glow = document.querySelector("[data-mouse-glow]");
    if (!glow) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let raf = null;
    let idle = null;
    let mx = 0;
    let my = 0;
    let gx = 0;
    let gy = 0;

    const tick = () => {
      const dx = mx - gx;
      const dy = my - gy;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        raf = null;
        return;
      }
      gx += dx * 0.1;
      gy += dy * 0.1;
      glow.style.transform = `translate(${gx - 160}px, ${gy - 160}px)`;
      raf = requestAnimationFrame(tick);
    };

    const onMove = (event) => {
      mx = event.clientX;
      my = event.clientY;
      glow.setAttribute("data-active", "true");
      if (!raf) raf = requestAnimationFrame(tick);
      clearTimeout(idle);
      idle = setTimeout(() => {
        if (raf) cancelAnimationFrame(raf);
        raf = null;
      }, 150);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
  }

  function initFadeSlideIn() {
    const targets = document.querySelectorAll(".fade-slide-in-on-view");
    if (!targets.length) return;

    if (typeof IntersectionObserver === "undefined") {
      targets.forEach((el) => el.classList.add("fade-slide-in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("fade-slide-in");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );
    targets.forEach((el) => observer.observe(el));
  }

  function init() {
    initHeader();
    initActiveNav();
    initFadeSlideIn();
    initMouseGlow();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
