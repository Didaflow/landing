// Landing interactivity — vanilla, no framework, no dependencies.

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
    const it = document.documentElement.lang === "it";
    toggle.setAttribute("aria-label", open ? (it ? "Chiudi il menu" : "Close navigation menu") : (it ? "Apri il menu" : "Open navigation menu"));
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
    const sectionIds = ["platform", "practice", "team"];
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

  // Demo request: the dialog (site-chrome.js) prepares an email to hello@didaflow.ai.
  // Nothing is sent or booked here; without JS, [data-demo] links go to #contact.
  function initDemoDialog() {
    const dialog = document.getElementById("demo-dialog");
    if (!dialog || typeof dialog.showModal !== "function") return;
    const form = dialog.querySelector("form");
    const select = form.querySelector("select");
    let opener = null;

    const close = () => {
      dialog.close();
      if (opener) opener.focus();
    };

    document.querySelectorAll("[data-demo]").forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        // initHeader already closes the mobile menu; return focus to its toggle, which stays visible.
        opener = trigger.closest(".mobile-nav") ? document.querySelector("[data-menu-toggle]") : trigger;
        if (trigger.dataset.role) select.value = trigger.dataset.role;
        dialog.showModal();
      });
    });
    dialog.querySelector(".demo-dialog__close").addEventListener("click", close);
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      const outside = event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
      if (outside) close();
    });
    dialog.addEventListener("cancel", () => {
      if (opener) setTimeout(() => opener.focus(), 0);
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const d = dialog.dataset;
      const subject = `${d.subject} — ${data.get("institution")}`;
      const body = `${d.greeting}\n\n${d.institutionLabel}: ${data.get("institution")}\n${d.roleLabel}: ${data.get("role")}\n\n${d.questionLabel}:\n${data.get("question")}\n\n${d.signoff}`;
      window.location.href = `mailto:hello@didaflow.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  // Causal model (methodology, white paper): labels follow the nearest lang attribute —
  // English for en/en-*, Italian otherwise — and update if the language changes.
  const MODEL_COPY = {
    en: {
      context: "Context C", isee: "ISEE", intervention: "Intervention I", guidance: "Guidance during studies",
      satisfaction: "Satisfaction", motivation: "Motivation", performance: "Performance",
      outcome: "Outcome Y", progression: "On-time progression",
      summary: "Open a technical example of the causal model",
      caption: "Technical example supplied by Didaflow. Arrows represent proposed causal relationships, not effect estimates. The model is co-built with domain experts and educational scientists.",
      diagram: "Educational causal model. ISEE context points to intervention, satisfaction and outcome. Guidance during studies points to satisfaction, motivation and performance. Each mediator points to on-time progression."
    },
    it: {
      context: "Contesto C", isee: "ISEE", intervention: "Intervento I", guidance: "Orientamento in itinere",
      satisfaction: "Soddisfazione", motivation: "Motivazione", performance: "Performance",
      outcome: "Esito Y", progression: "Regolarità",
      summary: "Apri un esempio tecnico del modello causale",
      caption: "Esempio tecnico fornito da Didaflow. Le frecce rappresentano relazioni causali ipotizzate, non stime degli effetti. Il modello è co-costruito con esperti di dominio e ricercatori in ambito educativo.",
      diagram: "Modello causale educativo. Il contesto ISEE è collegato a intervento, soddisfazione ed esito. L’orientamento in itinere è collegato a soddisfazione, motivazione e performance. Ogni mediatore è collegato alla regolarità."
    }
  };

  function initCausalModel() {
    const nodes = document.querySelectorAll("[data-model-text], [data-model-label]");
    if (!nodes.length) return;
    const translate = () => {
      nodes.forEach((node) => {
        const scope = node.closest("[lang]") || document.documentElement;
        const copy = MODEL_COPY[scope.lang.toLowerCase().startsWith("en") ? "en" : "it"];
        if (node.dataset.modelText) node.textContent = copy[node.dataset.modelText];
        if (node.dataset.modelLabel) node.setAttribute("aria-label", copy[node.dataset.modelLabel]);
      });
    };
    translate();
    new MutationObserver(translate).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"], subtree: true });
  }

  // Stakeholder stories: the sticky question panel follows the story in the reading position.
  // Bruegel figures drift a few px with scroll (decorative only; off with reduced motion).
  function initJourney() {
    const journey = document.getElementById("role-journey");
    const stories = [...document.querySelectorAll("[data-story]")];
    const scenes = [...document.querySelectorAll("[data-stage]")];
    const figures = [...document.querySelectorAll("[data-parallax]")];
    const reveals = [...document.querySelectorAll(".reveal")];
    if (!stories.length && !figures.length && !reveals.length) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 761px)");

    if (reveals.length && "IntersectionObserver" in window) {
      document.body.classList.add("motion-enabled");
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -35px 0px" }
      );
      reveals.forEach((el) => observer.observe(el));
    }

    // Without JS only the first question is shown; with JS all scenes cross-fade.
    scenes.forEach((scene) => (scene.hidden = false));

    let active = "";
    function setStory(key) {
      if (key === active) return;
      active = key;
      if (journey) journey.dataset.active = key;
      stories.forEach((story) => story.classList.toggle("is-current", story.dataset.story === key));
      scenes.forEach((scene) => {
        const selected = scene.dataset.stage === key;
        scene.classList.toggle("is-active", selected);
        scene.setAttribute("aria-hidden", String(!selected));
      });
    }

    const isShown = (el) => el.getBoundingClientRect().height > 0;
    let scheduled = false;

    function update() {
      scheduled = false;
      const vh = window.innerHeight;
      if (journey && isShown(journey)) {
        const anchor = vh * (desktop.matches ? 0.55 : 0.5);
        let nearest = stories[0];
        let distance = Infinity;
        stories.forEach((story) => {
          const r = story.getBoundingClientRect();
          const d = Math.abs(r.top + r.height / 2 - anchor);
          if (d < distance) {
            distance = d;
            nearest = story;
          }
        });
        if (nearest) setStory(nearest.dataset.story);
      }
      figures.forEach((figure) => {
        if (!isShown(figure)) return;
        const frame = figure.closest(".scene, .journey-stage, .mobile-story-header") || figure;
        const rect = frame.getBoundingClientRect();
        const progress = Math.max(-1, Math.min(1, (vh / 2 - (rect.top + rect.height / 2)) / (vh / 2 + rect.height / 2)));
        const still = reduced.matches;
        figure.style.setProperty("--scroll-y", (still ? 0 : progress * Number(figure.dataset.parallax)).toFixed(2) + "px");
        figure.style.setProperty("--scroll-rotate", (still ? 0 : progress * 0.9).toFixed(2) + "deg");
      });
    }

    const requestUpdate = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    };
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    window.addEventListener("hashchange", requestUpdate);
    reduced.addEventListener("change", requestUpdate);
    desktop.addEventListener("change", requestUpdate);
    if (stories.length) setStory(stories[0].dataset.story);
    requestUpdate();
  }

  function init() {
    initHeader();
    initActiveNav();
    initFadeSlideIn();
    initMouseGlow();
    initDemoDialog();
    initCausalModel();
    initJourney();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
