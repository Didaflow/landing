// Shared header/footer markup for the landing pages — plain JS, no build step.
// Each page loads this file, then inlines <script>DidaflowChrome.header()/.footer()</script>
// exactly where the markup should render (synchronous, no fetch, no FOUC).
//
// On the home page in-page anchors are "#id"; on every other page they point
// back to the home page as "/#id". href() is the only thing that varies
// between pages — the rest of the markup must stay identical.
(function () {
  "use strict";

  function href(id) {
    return (location.pathname === "/" ? "#" : "/#") + id;
  }

  function header() {
    return `<header class="site-header" data-site-header data-menu-open="false" data-scrolled="false">
    <div class="container site-header__inner">
      <a href="/" class="brand" aria-label="didaflow home">
        <img class="brand__mark" src="/_assets/static/didaflowers-mark-daisy.svg" alt="" width="32" height="32" aria-hidden="true" />
        <span class="brand__name">dida<em>flow</em></span>
      </a>
      <nav class="nav" aria-label="Primary">
        <a href="${href("about")}">About</a>
        <a href="${href("outcomes")}">Outcomes</a>
        <a href="${href("how")}">How it works</a>
        <a href="/whitepaper/">White paper</a>
      </nav>
      <div class="site-header__cta">
        <a class="btn btn--primary btn--sm" href="${href("contact")}">Get in touch</a>
      </div>
      <button class="menu-toggle" type="button" data-menu-toggle aria-label="Open menu" aria-controls="mobile-nav" aria-expanded="false">
        <svg class="icon-open" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
        <svg class="icon-close" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
      </button>
    </div>
    <nav class="container mobile-nav" id="mobile-nav" aria-label="Mobile" role="navigation" aria-modal="false">
      <a href="${href("about")}">About</a>
      <a href="${href("outcomes")}">Outcomes</a>
      <a href="${href("how")}">How it works</a>
      <a href="/whitepaper/">White paper</a>
      <a class="btn btn--primary" href="${href("contact")}">Get in touch</a>
    </nav>
  </header>`;
  }

  function footer() {
    return `<footer class="site-footer">
    <div class="container">
      <div class="site-footer__grid">
        <div class="site-footer__about">
          <a href="/" class="brand" aria-label="didaflow home">
            <img class="brand__mark" src="/_assets/static/didaflowers-mark-daisy.svg" alt="" width="32" height="32" aria-hidden="true" />
            <span class="brand__name">dida<em>flow</em></span>
          </a>
          <p>Academic intelligence powered by AI to support institutional decision making in education.</p>
          <div class="site-footer__socials">
            <a href="https://www.linkedin.com/company/didaflow" target="_blank" rel="noopener noreferrer" aria-label="didaflow on LinkedIn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>
            </a>
            <a href="mailto:hello@didaflow.ai" aria-label="Email didaflow">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
            </a>
          </div>
        </div>
        <nav class="site-footer__nav" aria-label="Footer">
          <div>
            <div class="site-footer__col-title">Resources</div>
            <ul>
              <li><a href="/whitepaper/">White paper</a></li>
              <li><a href="${href("how")}">Methodology</a></li>
              <li><a href="${href("outcomes")}">ANVUR mapping</a></li>
              <li><a href="${href("about")}">Case studies</a></li>
              <li><a href="/changelog/">Changelog</a></li>
            </ul>
          </div>
          <div>
            <div class="site-footer__col-title">Company</div>
            <ul>
              <li><a href="${href("about")}">About</a></li>
              <li><a href="${href("about")}">Research team</a></li>
              <li><a href="mailto:hello@didaflow.ai">Careers</a></li>
              <li><a href="${href("contact")}">Contact</a></li>
            </ul>
          </div>
          <div>
            <div class="site-footer__col-title">Legal</div>
            <ul>
              <li><a href="/privacy-policy/">Privacy policy</a></li>
              <li><a href="/cookie-policy/">Cookie policy</a></li>
              <li><a href="/terms-of-service/">Terms of service</a></li>
              <li><a href="/dpa/">DPA</a></li>
            </ul>
          </div>
        </nav>
      </div>
      <div class="site-footer__bottom">
        <span>Didaflow Srl · VAT 04337201208 · Bologna, Italy · &copy; 2026</span>
        <span class="site-footer__lockup" aria-label="Made with love by didaflowers">
          <img src="/_assets/static/didaflowers-mark-daisy-static.svg" alt="" width="48" height="48" />
          <span class="site-footer__lockup-text">
            <span class="made">
              made with
              <svg viewBox="0 0 24 22" aria-hidden="true">
                <path d="M12 21s-7.5-4.6-9.5-10C1 6 4 2 8 2c2 0 3.5 1 4 2.5C12.5 3 14 2 16 2c4 0 7 4 5.5 9-2 5.4-9.5 10-9.5 10z" fill="#d96d60"/>
              </svg>
              by
            </span>
            <span class="word">dida<span class="flowers">flowers</span></span>
          </span>
        </span>
      </div>
    </div>
  </footer>`;
  }

  window.DidaflowChrome = { header, footer };
})();
