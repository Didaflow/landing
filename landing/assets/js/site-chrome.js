// Shared header/footer markup for the landing pages — plain JS, no build step.
// Each page loads this file, then inlines <script>DidaflowChrome.header()/.footer()</script>
// exactly where the markup should render (synchronous, no fetch, no FOUC).
//
// On the home page in-page anchors are "#id"; on every other page they point
// back to the home page as "/#id". href() is the only thing that varies
// between pages — the rest of the markup must stay identical.
(function () {
  "use strict";

  var LANG = document.documentElement.lang === "it" ? "it" : "en";
  var HOME = LANG === "it" ? "/it/" : "/";
  var COMMONS = LANG === "it" ? "/it/commons/" : "/commons/";

  // Only the home page is translated; methodology, legal pages, changelog and white paper stay in English.
  var T = {
    en: {
      platform: "Platform", practice: "In practice", thinking: "Our thinking", whitepaper: "White paper",
      demo: "Book a demo", menu: "Open menu", home: "didaflow home",
      tagline: "Educational Intelligence. Bologna, Italy.",
      primary: "Primary", mobile: "Mobile",
      bottom: "Didaflow Srl · VAT 04337201208 · Bologna, Italy · &copy; 2026",
      resources: "Resources", methodology: "Methodology", cases: "Case studies", credits: "Artwork & credits",
      changelog: "Changelog", company: "Company", careers: "Careers", contactLink: "Contact",
      legal: "Legal", privacy: "Privacy policy", cookies: "Cookie policy", terms: "Terms of service",
      made: "made with", by: "by",
      dialog: {
        close: "Close demo request", eyebrow: "Let’s explore your question", title: "Meet <em>Didaflow</em>",
        intro: "Tell us a little about your institution and the decision on your mind.",
        institution: "Your institution", institutionHint: "University or business school",
        role: "Your role", roles: ["Educator", "Programme coordinator", "Institutional leader", "Student support", "Other"],
        question: "What would you like to explore?", questionHint: "A decision, a challenge, a possibility…",
        submit: "Continue by email",
        note: "Opens your email app with a prepared request. Your demo is confirmed when we reply. You can also write to",
        subject: "Didaflow demo", greeting: "Hello Didaflow,\n\nI would like to explore a demo.",
        signoff: "Best regards", myQuestion: "My question", institutionField: "Institution", roleField: "Role"
      }
    },
    it: {
      platform: "Piattaforma", practice: "In pratica", thinking: "Il nostro approccio", whitepaper: "White paper",
      demo: "Prenota una demo", menu: "Apri il menu", home: "didaflow, home",
      tagline: "Educational Intelligence. Bologna, Italia.",
      primary: "Navigazione principale", mobile: "Navigazione mobile",
      bottom: "Didaflow Srl · P. IVA 04337201208 · Bologna, Italia · &copy; 2026",
      resources: "Risorse", methodology: "Metodologia", cases: "Casi studio", credits: "Opera e crediti",
      changelog: "Changelog", company: "Azienda", careers: "Lavora con noi", contactLink: "Contatti",
      legal: "Note legali", privacy: "Privacy policy", cookies: "Cookie policy", terms: "Termini di servizio",
      made: "fatto con", by: "da",
      dialog: {
        close: "Chiudi la richiesta di demo", eyebrow: "Esploriamo la tua domanda", title: "Scopri <em>Didaflow</em>",
        intro: "Raccontaci qualcosa della tua istituzione e della decisione che hai in mente.",
        institution: "La tua istituzione", institutionHint: "Università o business school",
        role: "Il tuo ruolo", roles: ["Docente", "Coordinatore di corso di studio", "Vertice istituzionale", "Supporto agli studenti", "Altro"],
        question: "Cosa vorresti esplorare?", questionHint: "Una decisione, una sfida, una possibilità…",
        submit: "Continua via email",
        note: "Apre la tua app di posta con una richiesta già compilata. La demo è confermata quando ti rispondiamo. Puoi anche scrivere a",
        subject: "Demo Didaflow", greeting: "Buongiorno,\n\nvorrei esplorare una demo di Didaflow.",
        signoff: "Cordiali saluti", myQuestion: "La mia domanda", institutionField: "Istituzione", roleField: "Ruolo"
      }
    }
  }[LANG];

  function href(id) {
    return (location.pathname === HOME ? "" : HOME) + "#" + id;
  }

  // Link to the other language version, taken from the page's own hreflang alternates.
  function langSwitch() {
    var other = LANG === "it" ? "en" : "it";
    var link = document.querySelector('link[rel="alternate"][hreflang="' + other + '"]');
    if (!link) return "";
    var url = new URL(link.href, location.href);
    return `<a class="nav__lang" href="${url.pathname}" hreflang="${other}" lang="${other}">${other.toUpperCase()}</a>`;
  }

  function header() {
    return `<header class="site-header" data-site-header data-menu-open="false" data-scrolled="false">
    <div class="container site-header__inner">
      <a href="${HOME}" class="brand" aria-label="${T.home}">
        <img class="brand__mark" src="/_assets/static/didaflowers-mark-daisy.svg" alt="" width="32" height="32" aria-hidden="true" />
        <span class="brand__name">dida<em>flow</em></span>
      </a>
      <nav class="nav" aria-label="${T.primary}">
        <a href="${href("platform")}">${T.platform}</a>
        <a href="${href("practice")}">${T.practice}</a>
        <a href="/methodology/">${T.thinking}</a>
        <a href="${COMMONS}">Commons</a>
        ${langSwitch()}
      </nav>
      <div class="site-header__cta">
        <a class="btn btn--primary btn--sm" href="${href("contact")}" data-demo>${T.demo}</a>
      </div>
      <button class="menu-toggle" type="button" data-menu-toggle aria-label="${T.menu}" aria-controls="mobile-nav" aria-expanded="false">
        <svg class="icon-open" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
        <svg class="icon-close" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
      </button>
    </div>
    <nav class="container mobile-nav" id="mobile-nav" aria-label="${T.mobile}" role="navigation" aria-modal="false">
      <a href="${href("platform")}">${T.platform}</a>
      <a href="${href("practice")}">${T.practice}</a>
      <a href="/methodology/">${T.thinking}</a>
      <a href="${COMMONS}">Commons</a>
      ${langSwitch()}
      <a class="btn btn--primary" href="${href("contact")}" data-demo>${T.demo}</a>
    </nav>
  </header>`;
  }

  function footer() {
    return `<footer class="site-footer">
    <div class="container">
      <div class="site-footer__grid">
        <div class="site-footer__about">
          <a href="${HOME}" class="brand" aria-label="${T.home}">
            <img class="brand__mark" src="/_assets/static/didaflowers-mark-daisy.svg" alt="" width="32" height="32" aria-hidden="true" />
            <span class="brand__name">dida<em>flow</em></span>
          </a>
          <p>${T.tagline}</p>
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
            <div class="site-footer__col-title">${T.resources}</div>
            <ul>
              <li><a href="/whitepaper/">${T.whitepaper}</a></li>
              <li><a href="/methodology/">${T.methodology}</a></li>
              <li><a href="${href("practice")}">${T.cases}</a></li>
              <li><a href="${LANG === "it" ? "/it/" : "/"}changelog/">${T.changelog}</a></li>
              <li><a href="/credits/">${T.credits}</a></li>
              <li><a href="${COMMONS}">Commons</a></li>
            </ul>
          </div>
          <div>
            <div class="site-footer__col-title">${T.company}</div>
            <ul>
              <li><a href="${href("platform")}">${T.platform}</a></li>
              <li><a href="mailto:hello@didaflow.ai">${T.careers}</a></li>
              <li><a href="${href("contact")}">${T.contactLink}</a></li>
            </ul>
          </div>
          <div>
            <div class="site-footer__col-title">${T.legal}</div>
            <ul>
              <li><a href="/privacy-policy/">${T.privacy}</a></li>
              <li><a href="/cookie-policy/">${T.cookies}</a></li>
              <li><a href="/terms-of-service/">${T.terms}</a></li>
              <li><a href="/dpa/">DPA</a></li>
            </ul>
          </div>
        </nav>
      </div>
      <div class="site-footer__bottom">
        <span>${T.bottom}</span>
        <span class="site-footer__lockup" aria-label="Made with love by didaflowers">
          <img class="brand__mark" src="/_assets/static/didaflowers-mark-daisy.svg" alt="" width="32" height="32" aria-hidden="true" />
          <span class="site-footer__lockup-text">
            <span class="made">
              ${T.made}
              <svg viewBox="0 0 24 22" aria-hidden="true">
                <path d="M12 21s-7.5-4.6-9.5-10C1 6 4 2 8 2c2 0 3.5 1 4 2.5C12.5 3 14 2 16 2c4 0 7 4 5.5 9-2 5.4-9.5 10-9.5 10z" fill="#d96d60"/>
              </svg>
              ${T.by}
            </span>
            <span class="word brand__name">dida<em>flowers</em></span>
          </span>
        </span>
      </div>
    </div>
  </footer>
  ${demoDialog()}`;
  }

  // Demo request: prepares an email to hello@didaflow.ai (scripts/main.js opens it from any [data-demo]).
  // Nothing is sent or booked automatically.
  function demoDialog() {
    var D = T.dialog;
    return `<dialog class="demo-dialog" id="demo-dialog" aria-labelledby="demo-title" data-subject="${D.subject}" data-greeting="${D.greeting}" data-signoff="${D.signoff}" data-question-label="${D.myQuestion}" data-institution-label="${D.institutionField}" data-role-label="${D.roleField}">
    <button class="demo-dialog__close" type="button" aria-label="${D.close}">×</button>
    <p class="eyebrow">${D.eyebrow}</p>
    <h2 id="demo-title">${D.title}</h2>
    <p>${D.intro}</p>
    <form id="demo-form">
      <label>${D.institution}<input name="institution" autocomplete="organization" required placeholder="${D.institutionHint}" /></label>
      <label>${D.role}<select name="role">${D.roles.map((r) => `<option>${r}</option>`).join("")}</select></label>
      <label>${D.question}<textarea name="question" rows="3" required placeholder="${D.questionHint}"></textarea></label>
      <button class="btn btn--primary btn--md" type="submit">${D.submit} <span aria-hidden="true">↗</span></button>
      <p class="demo-dialog__note">${D.note} <a href="mailto:hello@didaflow.ai">hello@didaflow.ai</a>.</p>
    </form>
  </dialog>`;
  }

  window.DidaflowChrome = { header, footer };
})();
