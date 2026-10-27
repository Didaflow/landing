// AI Map guided questionnaire (plain JS, no build step for the browser).
// Six questions, one per screen, then a report. Everything runs in the browser: answers stay in
// localStorage, nothing is sent anywhere. The PDF is the browser's "Save as PDF" on a print stylesheet.
// Data: ./data/{taxonomy,tasks,tools}.json. Text fields are { en, it }.
(function (root) {
  "use strict";

  var MAX_TASKS = 3;
  var PERSONAL = ["chatgpt", "claude", "gemini-notebook", "mistral-vibe", "perplexity", "deepseek"];
  var INSTITUTIONAL = ["lms", "edu", "teach"];
  var CATS = [
    { id: "lms", test: function (t) { return t.access === "lms-builtin"; } },
    { id: "edu", test: function (t) { return t.access === "closed-institutional" && t.id !== "turnitin-ai"; } },
    { id: "personal", test: function (t) { return PERSONAL.indexOf(t.id) >= 0; } },
    { id: "teach", test: function (t) { return t.access === "edu-platform" || t.id === "turnitin-ai" || t.id === "gptzero"; } },
    { id: "open", test: function (t) { return t.access === "open-weights" || t.access === "open-source-osi"; } },
    { id: "specialist", test: function () { return true; } }
  ];
  var STATUS = ["use", "avail", "no", "unknown"];
  var OPEN = ["open-weights", "open-source-osi"];

  function catOf(tool) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].test(tool)) return CATS[i].id;
    return "specialist";
  }

  // Ranking: starting score 3 (declared for the task) or 2 (general-purpose), moved by the answers.
  // `why` carries [reason key, negative?] so the page can show the reasons in either language.
  function score(tool, fit, a) {
    var st = (a.stack || {})[catOf(tool)], cat = catOf(tool);
    var s = fit === "declared" ? 3 : 2, why = [];
    var acc = tool.access, pr = tool.pricing;
    var covered = st === "use" || st === "avail";
    if (fit === "declared") why.push(["declared", 0]);
    if (st === "use") { s += 4; why.push(["catUse", 0]); }
    else if (st === "avail") { s += 3; why.push(["catAvail", 0]); }
    else if (st === "no" && INSTITUTIONAL.indexOf(cat) >= 0 && a.budget !== "inst") { s -= 3; why.push(["catNo", 1]); }
    if (a.data === "high") {
      if (OPEN.indexOf(acc) >= 0) { s += 3; why.push(["dataLocal", 0]); }
      else if (acc === "closed-institutional") { s += 2; why.push(["dataContract", 0]); }
      else if (acc === "edu-platform" || acc === "lms-builtin") { s += 1; }
      else if (acc === "closed-free" || acc === "closed-freemium") { s -= 3; why.push(["dataPersonal", 1]); }
    } else if (a.data === "mid" && (acc === "closed-free" || acc === "closed-freemium")) { s -= 1; }
    if (a.budget === "free") {
      if (pr === "free") { s += 2; why.push(["free", 0]); }
      else if (pr === "freemium") { s += 1; why.push(["freemium", 0]); }
      else if (!covered) { s -= 3; why.push(["paid", 1]); }
    } else if (a.budget === "some" && pr === "institutional" && !covered) { s -= 1; }
    if (OPEN.indexOf(acc) >= 0 && !covered) {
      if (a.tech === "yes") { s += 1; why.push(["itCan", 0]); }
      else if (a.tech === "no") { s -= 4; why.push(["itCannot", 1]); }
    }
    return { id: tool.id, tool: tool, score: s, why: why, cat: cat, fit: fit };
  }

  // For each chosen task: tools ranked by the answers, the top three, and all of them grouped by category.
  function results(a, tasks, tools) {
    var byId = {}, i;
    for (i = 0; i < tools.length; i++) byId[tools[i].id] = tools[i];
    return (a.tasks || []).map(function (id) {
      return tasks.filter(function (t) { return t.id === id; })[0];
    }).filter(Boolean).map(function (task) {
      var ranked = task.tools.map(function (x) { return byId[x.id] ? score(byId[x.id], x.fit, a) : null; })
        .filter(Boolean)
        .sort(function (x, y) { return y.score - x.score || x.tool.name.localeCompare(y.tool.name); });
      var g = {};
      ranked.forEach(function (r) { (g[r.cat] = g[r.cat] || []).push(r); });
      var groups = Object.keys(g).map(function (c) { return { cat: c, items: g[c] }; })
        .sort(function (x, y) { return y.items[0].score - x.items[0].score; });
      return { task: task, top: ranked.slice(0, 3), groups: groups, total: ranked.length };
    });
  }

  var core = { CATS: CATS, STATUS: STATUS, MAX_TASKS: MAX_TASKS, catOf: catOf, score: score, results: results };
  if (typeof module !== "undefined" && module.exports) module.exports = core;
  if (typeof document === "undefined" || !document.querySelector('[data-map="quiz"]')) return;

  // ─── Page ─────────────────────────────────────────────────────
  var LANG = document.documentElement.lang === "it" ? "it" : "en";
  var HERE = LANG === "it" ? "/it/commons/ai-map/" : "/commons/ai-map/";
  var KEY = "aimap-quiz";
  var S = {
    en: {
      title: "Your path through the AI <em>Map</em>", draft: "Draft content: the map is not yet reviewed by the scientific committee.",
      q: function (i, n) { return "Question " + i + " of " + n; }, report: "Your path", back: "← Back", next: "Next →", seeReport: "See your path →",
      cats: {
        lms: { t: "Learning platform (LMS)", s: "LMS", ex: "Moodle, Canvas, Brightspace. Many already include AI features." },
        edu: { t: "AI assistant with a university Edu licence", s: "Edu licence", ex: "ChatGPT Edu, Claude for Education, Gemini for Education, Microsoft 365 Copilot" },
        personal: { t: "AI assistant with a personal account", s: "Personal account", ex: "ChatGPT, Claude, Gemini, Le Chat, Perplexity, DeepSeek, free or paid" },
        teach: { t: "Feedback and assessment platforms", s: "Feedback and assessment", ex: "Gradescope, FeedbackFruits, Packback, Cogniti, Turnitin, GPTZero" },
        open: { t: "Open-weights models run locally", s: "Open weights", ex: "Llama, Mistral, Qwen, EuroLLM, Ollama, LM Studio" },
        specialist: { t: "Specialist AI tools", s: "Specialist", ex: "Elicit, Consensus, Grammarly, DeepL, Quizlet, Gamma, GitHub Copilot, Otter" }
      },
      status: { use: "I use it", avail: "I have it, I don’t use it", no: "I don’t have it", unknown: "Don’t know" },
      qs: {
        role: { t: "What is your role?", l: "The path changes with who uses AI and for what." },
        tasks: { t: "What do you want to use AI for?", l: function (n) { return "Choose up to " + n + ". For each you will see what research says and which tools fit your situation best."; } },
        stack: { t: "Which tools do you already use, and which do you only have available?", l: "For each category say whether you really use it day to day, whether your university offers it but you don’t use it, or whether you don’t have it. People often have tools available without knowing: then choose “Don’t know”." },
        data: { t: "What data will go into the tool?", l: "The minimum level of protection is set by the GDPR, the AI Act and university rules, not by personal preference. What changes is the data you will use." },
        budget: { t: "What can you spend?", l: "" },
        tech: { t: "Can anyone at your university install and run AI models locally?", l: "Open-weights models run on the university’s servers, but someone has to set them up and maintain them." }
      },
      data: {
        high: { t: "Personal data of students or staff", d: "Identifiable work, grades, assessments, recordings. You need a legal basis, a data processing agreement (DPA), no training on the data, servers in the EU or at the university." },
        mid: { t: "Course or unpublished material, no personal data", d: "Slides, handouts, exam papers, research drafts. At minimum they must not be used to train models." },
        low: { t: "Only public content", d: "Published articles, open texts, general questions. University usage rules still apply." }
      },
      budget: { free: { t: "Free tools only" }, some: { t: "A few personal subscriptions", d: "Individual paid plans." }, inst: { t: "University or department budget", d: "Group or university-wide licences." } },
      tech: { yes: "Yes, an IT service or research group can do it", no: "No", unknown: "I don’t know" },
      selected: function (n, m) { return n + " of " + m + " selected"; }, filled: function (n, m) { return n + " of " + m + " categories filled"; },
      summary: { role: "Role", use: "Already use", avail: "Available, not used", data: "Data", budget: "Budget", tech: "Local models" },
      reportLead: "For each activity: what research says, how to use it well, and the three tools that best fit your answers. You can go back and change an answer at any time.",
      goodPractice: "Good practice", risks: "Risks", topTools: "Best-fitting tools", noTools: "No tool in the map for this activity yet.",
      all: function (n) { return "All tools by category (" + n + ")"; },
      note: "The order of the tools depends only on your answers and the map’s data; it is not a commercial recommendation. Provider information needs re-checking.",
      why: { declared: "Presented by the provider for this use", catUse: "A category you already use", catAvail: "Already available: worth trying", catNo: "Not available at your university", dataLocal: "Data can stay at the university", dataContract: "University contract, usually no training on your data", dataPersonal: "Personal accounts: check how data are used", free: "Free", freemium: "Has a free plan", paid: "Paid", itCan: "Your IT can run it", itCannot: "Someone has to install and run it" },
      save: "Save as PDF", saveHint: "Opens the print dialog: choose “Save as PDF” as the destination.", restart: "Start again",
      contact: "Write to Didaflow", contactHint: "Opens your email program with a short draft. Nothing is sent from this page.",
      privacy: "Your answers stay in this browser. This page sends nothing and collects no data.",
      printTitle: "AI Map: your path", mailSubject: "AI Map: your path", mailIntro: "Hello, I used the AI Map questionnaire.", mailTasks: "Activities", mailTools: "Best-fitting tools", mailEnd: "I would like to talk about it.",
      loading: "Loading…", failed: "The map data could not be loaded. Reload the page to try again.",
      ev: "Evidence", checked: "Source: Didaflow AI Map (draft)"
    },
    it: {
      title: "Il tuo percorso nella <em>Mappa</em> AI", draft: "Contenuti in bozza: la mappa non è ancora rivista dal comitato scientifico.",
      q: function (i, n) { return "Domanda " + i + " di " + n; }, report: "Il tuo percorso", back: "← Indietro", next: "Avanti →", seeReport: "Vedi il percorso →",
      cats: {
        lms: { t: "Piattaforma didattica (LMS)", s: "LMS", ex: "Moodle, Canvas, Brightspace. Molte hanno già funzioni AI incluse." },
        edu: { t: "Assistente AI con licenza Edu d’ateneo", s: "Licenza Edu", ex: "ChatGPT Edu, Claude for Education, Gemini for Education, Microsoft 365 Copilot" },
        personal: { t: "Assistente AI con account personale", s: "Account personale", ex: "ChatGPT, Claude, Gemini, Le Chat, Perplexity, DeepSeek, gratis o a pagamento" },
        teach: { t: "Piattaforme per feedback e valutazione", s: "Feedback e valutazione", ex: "Gradescope, FeedbackFruits, Packback, Cogniti, Turnitin, GPTZero" },
        open: { t: "Modelli a pesi aperti in locale", s: "Pesi aperti", ex: "Llama, Mistral, Qwen, EuroLLM, Ollama, LM Studio" },
        specialist: { t: "Strumenti AI specialistici", s: "Specialistici", ex: "Elicit, Consensus, Grammarly, DeepL, Quizlet, Gamma, GitHub Copilot, Otter" }
      },
      status: { use: "Lo uso", avail: "Ce l’ho, non lo uso", no: "Non ce l’ho", unknown: "Non so" },
      qs: {
        role: { t: "Qual è il tuo ruolo?", l: "Il percorso cambia in base a chi usa l’AI e per fare che cosa." },
        tasks: { t: "Per quali attività vuoi usare l’AI?", l: function (n) { return "Scegline fino a " + n + ". Per ognuna vedrai che cosa dice la ricerca e quali strumenti sono più adatti alla tua situazione."; } },
        stack: { t: "Quali strumenti usi già, e quali hai solo a disposizione?", l: "Per ogni categoria indica se la usi davvero nel lavoro di tutti i giorni, se l’ateneo te la offre ma non la usi, o se non ce l’hai. Spesso si hanno strumenti a disposizione senza saperlo: in quel caso scegli “Non so”." },
        data: { t: "Quali dati finiranno nello strumento?", l: "Il livello minimo di tutela lo fissano GDPR, AI Act e regole d’ateneo, non una preferenza personale. Cambia invece in base ai dati che userai." },
        budget: { t: "Che spesa è possibile?", l: "" },
        tech: { t: "In ateneo qualcuno può installare e gestire modelli AI in locale?", l: "I modelli a pesi aperti girano sui server dell’ateneo, ma serve chi li configuri e li mantenga." }
      },
      data: {
        high: { t: "Dati personali di studenti o personale", d: "Elaborati identificabili, voti, valutazioni, registrazioni. Servono base giuridica, accordo sul trattamento dei dati (DPA), niente addestramento, server in UE o in ateneo." },
        mid: { t: "Materiali di corso o inediti, senza dati personali", d: "Slide, dispense, tracce d’esame, bozze di ricerca. Serve almeno che non vengano usati per addestrare i modelli." },
        low: { t: "Solo contenuti già pubblici", d: "Articoli pubblicati, testi liberi, domande generali. Valgono comunque le regole d’uso dell’ateneo." }
      },
      budget: { free: { t: "Solo strumenti gratuiti" }, some: { t: "Qualche abbonamento personale", d: "Piani a pagamento individuali." }, inst: { t: "Budget d’ateneo o di dipartimento", d: "Licenze per gruppi o per tutto l’ateneo." } },
      tech: { yes: "Sì, c’è un servizio IT o un gruppo di ricerca che può farlo", no: "No", unknown: "Non lo so" },
      selected: function (n, m) { return n + " di " + m + " selezionate"; }, filled: function (n, m) { return n + " di " + m + " categorie compilate"; },
      summary: { role: "Ruolo", use: "Usi già", avail: "Disponibili, non usati", data: "Dati", budget: "Spesa", tech: "Modelli in locale" },
      reportLead: "Per ogni attività: che cosa dice la ricerca, come usarla bene e i tre strumenti più adatti alle tue risposte. Puoi tornare indietro e cambiare una risposta in qualsiasi momento.",
      goodPractice: "Buone pratiche", risks: "Rischi", topTools: "Strumenti più adatti", noTools: "Nessuno strumento ancora nella mappa per questa attività.",
      all: function (n) { return "Tutti gli strumenti per categoria (" + n + ")"; },
      note: "L’ordine degli strumenti dipende solo dalle tue risposte e dai dati della mappa; non è una raccomandazione commerciale. Le informazioni dei fornitori sono da ricontrollare.",
      why: { declared: "Indicato dal fornitore per questo uso", catUse: "Categoria che usi già", catAvail: "Già a disposizione: da provare", catNo: "Non disponibile nel tuo ateneo", dataLocal: "I dati possono restare in ateneo", dataContract: "Contratto d’ateneo, di solito senza addestramento", dataPersonal: "Account personali: verificare l’uso dei dati", free: "Gratuito", freemium: "Ha un piano gratuito", paid: "A pagamento", itCan: "Gestibile dal vostro IT", itCannot: "Serve chi lo installi e gestisca" },
      save: "Salva come PDF", saveHint: "Apre la finestra di stampa: scegli «Salva come PDF» come destinazione.", restart: "Ricomincia",
      contact: "Scrivi a Didaflow", contactHint: "Apre il tuo programma di posta con una bozza breve. Da questa pagina non parte nulla.",
      privacy: "Le risposte restano in questo browser. La pagina non invia nulla e non raccoglie dati.",
      printTitle: "Mappa AI: il tuo percorso", mailSubject: "Mappa AI: il mio percorso", mailIntro: "Buongiorno, ho usato il questionario della Mappa AI.", mailTasks: "Attività", mailTools: "Strumenti più adatti", mailEnd: "Vorrei parlarne.",
      loading: "Caricamento…", failed: "Non è stato possibile caricare i dati della mappa. Ricarica la pagina per riprovare.",
      ev: "Evidenze", checked: "Fonte: Mappa AI di Didaflow (bozza)"
    }
  };
  var L = S[LANG];
  var T = function (o) { return o ? (o[LANG] || o.en || "") : ""; };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var app = document.querySelector('[data-map="quiz"]');
  var D = null; // { tax, tasks, tools }
  var state = { step: 0, a: { tasks: [], stack: {} } };
  var QIDS = ["role", "tasks", "stack", "data", "budget", "tech"];
  var STEPS = QIDS.length + 1; // six questions and the report

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && saved.a && typeof saved.a === "object" && !Array.isArray(saved.a)) { state.a = saved.a; state.step = Math.max(0, Math.min(saved.step | 0, STEPS - 1)); }
  } catch (e) { /* storage unavailable: the questionnaire still works for this visit */ }
  if (!Array.isArray(state.a.tasks)) state.a.tasks = [];
  if (!state.a.stack || typeof state.a.stack !== "object" || Array.isArray(state.a.stack)) state.a.stack = {};
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ step: state.step, a: state.a })); } catch (e) { /* ignore */ } }

  // Saved answers are untrusted: keep only values the questionnaire can produce, and resume at the first gap.
  function sanitise() {
    var a = state.a, roles = D.tax.roles.map(function (r) { return r.id; });
    var one = function (k, ok) { if (ok.indexOf(a[k]) < 0) delete a[k]; };
    one("role", roles); one("data", ["high", "mid", "low"]); one("budget", ["free", "some", "inst"]); one("tech", ["yes", "no", "unknown"]);
    var valid = D.tasks.filter(function (t) { return t.role === a.role; }).map(function (t) { return t.id; });
    a.tasks = (Array.isArray(a.tasks) ? a.tasks : []).filter(function (t, i, l) { return valid.indexOf(t) >= 0 && l.indexOf(t) === i; }).slice(0, MAX_TASKS);
    var st = {};
    CATS.forEach(function (c) { if (STATUS.indexOf(a.stack[c.id]) >= 0) st[c.id] = a.stack[c.id]; });
    a.stack = st;
    for (var i = 0; i < QIDS.length; i++) if (!answered(QIDS[i])) { state.step = Math.min(state.step, i); break; }
  }

  function json(n) { return fetch("/commons/ai-map/data/" + n + ".json", { cache: "no-store" }).then(function (r) { return r.json(); }); }

  function questionOptions(id) {
    if (id === "role") return D.tax.roles.map(function (r) { return { v: r.id, t: T(r), d: T(r.blurb) }; });
    if (id === "tasks") return D.tasks.filter(function (t) { return t.role === state.a.role; }).map(function (t) { return { v: t.id, t: T(t.title), d: T(t.question) }; });
    if (id === "data") return ["high", "mid", "low"].map(function (v) { return { v: v, t: L.data[v].t, d: L.data[v].d }; });
    if (id === "budget") return ["free", "some", "inst"].map(function (v) { return { v: v, t: L.budget[v].t, d: L.budget[v].d }; });
    if (id === "tech") return ["yes", "no", "unknown"].map(function (v) { return { v: v, t: L.tech[v] }; });
    return [];
  }
  function answered(id) {
    if (id === "stack") return CATS.every(function (c) { return state.a.stack[c.id]; });
    if (id === "tasks") return state.a.tasks.length > 0;
    return !!state.a[id];
  }
  function label(id) {
    var o = questionOptions(id), v = state.a[id];
    var f = function (x) { var m = o.filter(function (p) { return p.v === x; })[0]; return m ? m.t : ""; };
    return f(v) || "—";
  }
  function stackList(v) {
    var l = CATS.filter(function (c) { return state.a.stack[c.id] === v; }).map(function (c) { return L.cats[c.id].s; });
    return l.length ? l.join(", ") : "—";
  }

  function go(d) {
    state.step = Math.max(0, Math.min(STEPS - 1, state.step + d));
    save(); render(true);
    window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  function progress() {
    var cells = "";
    for (var i = 0; i < STEPS; i++) cells += '<span class="' + (i < state.step ? "done" : i === state.step ? "now" : "") + '"></span>';
    return '<div class="quiz-progress" aria-hidden="true">' + cells + "</div>" +
      '<p class="quiz-step" role="status">' + (state.step < QIDS.length ? L.q(state.step + 1, QIDS.length) : L.report) + "</p>";
  }
  function nav(nextLabel, ok) {
    return '<div class="quiz-nav"><button type="button" class="btn btn--secondary" id="q-back"' + (state.step === 0 ? " disabled" : "") + ">" + L.back + "</button>" +
      '<button type="button" class="btn btn--primary" id="q-next"' + (ok ? "" : " disabled") + ">" + nextLabel + "</button></div>";
  }
  function bindNav() {
    var b = document.getElementById("q-back"), n = document.getElementById("q-next");
    if (b) b.onclick = function () { go(-1); };
    if (n) n.onclick = function () { go(1); };
  }
  function shell(inner) {
    return '<section class="quiz">' + progress() + inner + '<p class="quiz-privacy">' + esc(L.privacy) + "</p></section>";
  }

  function renderStack(id) {
    var rows = CATS.map(function (c) {
      return '<div class="quiz-row"><div class="quiz-cat"><span class="t">' + esc(L.cats[c.id].t) + '</span><span class="d">' + esc(L.cats[c.id].ex) + "</span></div>" +
        '<div class="quiz-seg" role="group" aria-label="' + esc(L.cats[c.id].t) + '">' + STATUS.map(function (v) {
          return '<button type="button" id="st-' + c.id + "-" + v + '" aria-pressed="' + (state.a.stack[c.id] === v) + '" data-c="' + c.id + '" data-v="' + v + '">' + esc(L.status[v]) + "</button>";
        }).join("") + "</div></div>";
    }).join("");
    var n = CATS.filter(function (c) { return state.a.stack[c.id]; }).length;
    app.innerHTML = shell("<h2>" + esc(L.qs[id].t) + "</h2><p class=\"quiz-lede\">" + esc(L.qs[id].l) + "</p><div class=\"quiz-matrix\">" + rows + "</div><p class=\"quiz-hint\">" + L.filled(n, CATS.length) + "</p>" + nav(L.next, answered(id)));
    Array.prototype.forEach.call(app.querySelectorAll(".quiz-seg button"), function (b) {
      b.onclick = function () { state.a.stack[b.dataset.c] = b.dataset.v; save(); renderStack(id); var f = document.getElementById(b.id); if (f) f.focus(); };
    });
    bindNav();
  }

  function renderQuestion(id) {
    if (id === "stack") return renderStack(id);
    var opts = questionOptions(id), multi = id === "tasks";
    if (multi) state.a.tasks = state.a.tasks.filter(function (t) { return opts.some(function (o) { return o.v === t; }); });
    var sel = function (v) { return multi ? state.a.tasks.indexOf(v) >= 0 : state.a[id] === v; };
    var lede = typeof L.qs[id].l === "function" ? L.qs[id].l(MAX_TASKS) : L.qs[id].l;
    app.innerHTML = shell("<h2>" + esc(L.qs[id].t) + "</h2>" + (lede ? '<p class="quiz-lede">' + esc(lede) + "</p>" : "") +
      '<div class="quiz-options" role="group" aria-label="' + esc(L.qs[id].t) + '">' +
      opts.map(function (o, i) {
        return '<button type="button" class="quiz-opt" id="opt-' + id + "-" + i + '" data-v="' + esc(o.v) + '"' + (multi ? " data-multi" : "") + " " +
          'aria-pressed="' + sel(o.v) + '"' + '><span class="mark" aria-hidden="true"></span><span><span class="t">' +
          esc(o.t) + "</span>" + (o.d ? '<span class="d">' + esc(o.d) + "</span>" : "") + "</span></button>";
      }).join("") + "</div>" +
      (multi ? '<p class="quiz-hint">' + L.selected(state.a.tasks.length, MAX_TASKS) + "</p>" : "") +
      nav(state.step === QIDS.length - 1 ? L.seeReport : L.next, answered(id)));
    Array.prototype.forEach.call(app.querySelectorAll(".quiz-opt"), function (b) {
      b.onclick = function () {
        var v = b.dataset.v;
        if (multi) {
          var i = state.a.tasks.indexOf(v);
          if (i >= 0) state.a.tasks.splice(i, 1);
          else if (state.a.tasks.length < MAX_TASKS) state.a.tasks.push(v);
          else return;
        } else {
          if (id === "role" && state.a.role !== v) state.a.tasks = [];
          state.a[id] = v;
        }
        save(); renderQuestion(id);
        if (!multi) { setTimeout(function () { if (QIDS[state.step] === id) go(1); }, 180); }
        else { var f = app.querySelector('[data-v="' + v.replace(/"/g, "") + '"]'); if (f) f.focus(); }
      };
    });
    bindNav();
  }

  function tool(r, withWhy) {
    var t = r.tool;
    var url = /^https:\/\//.test(t.url || "") ? t.url : "";
    var pr = D.tax.pricing.filter(function (p) { return p.id === t.pricing; })[0];
    var ac = D.tax.accessModes.filter(function (p) { return p.id === t.access; })[0];
    return { name: url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(t.name) + "</a>" : esc(t.name), meta: [t.vendor, ac ? T(ac) : "", pr ? T(pr) : ""], why: r.why };
  }
  function whyHTML(why, n, skipDeclared) {
    return why.filter(function (w) { return !(skipDeclared && w[0] === "declared"); }).slice(0, n)
      .map(function (w) { return '<span class="' + (w[1] ? "neg" : "") + '">' + esc(L.why[w[0]]) + "</span>"; }).join("");
  }

  function mailto(R) {
    var lines = [L.mailIntro, ""];
    R.forEach(function (x) { lines.push("- " + T(x.task.title) + ": " + x.top.map(function (r) { return r.tool.name; }).join(", ")); });
    lines.push("", L.mailEnd);
    var body = lines.join("\n");
    return "mailto:hello@didaflow.ai?subject=" + encodeURIComponent(L.mailSubject) + "&body=" + encodeURIComponent(Array.from(body).slice(0, 1200).join(""));
  }

  function renderReport() {
    var R = results(state.a, D.tasks, D.tools);
    var ev = function (id) { var e = D.tax.evidenceLevels.filter(function (x) { return x.id === id; })[0]; return e ? T(e) : ""; };
    var rows = [["role", label("role")], ["use", stackList("use")], ["avail", stackList("avail")], ["data", label("data")], ["budget", label("budget")], ["tech", label("tech")]];
    document.title = L.printTitle + " · didaflow";
    app.innerHTML = shell('<h2 class="quiz-title">' + L.title + '</h2><p class="quiz-lede">' + esc(L.reportLead) + "</p>" +
      '<dl class="quiz-summary">' + rows.map(function (r) { return "<div><dt>" + esc(L.summary[r[0]]) + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("") + "</dl>" +
      R.map(function (x) {
        var t = x.task;
        return '<article class="quiz-task"><p><span class="quiz-pill ev-' + esc(t.evidenceLevel) + '">' + esc(L.ev + ": " + ev(t.evidenceLevel)) + "</span></p>" +
          "<h3>" + esc(T(t.title)) + "</h3><p class=\"quiz-q\">" + esc(T(t.question)) + "</p><p>" + esc(T(t.verdict)) + "</p>" +
          '<div class="quiz-cols"><div><p class="quiz-lbl">' + esc(L.goodPractice) + '</p><ul>' + (t.goodPractice || []).slice(0, 3).map(function (g) { return "<li>" + esc(T(g)) + "</li>"; }).join("") + "</ul></div>" +
          '<div><p class="quiz-lbl">' + esc(L.risks) + '</p><ul>' + (t.risks || []).slice(0, 2).map(function (g) { return "<li>" + esc(T(g.text)) + "</li>"; }).join("") + "</ul></div></div>" +
          '<p class="quiz-lbl">' + esc(L.topTools) + "</p>" +
          (x.top.length ? '<ol class="quiz-tools">' + x.top.map(function (r) {
            var v = tool(r);
            return "<li><span class=\"nm\">" + v.name + '</span><span class="meta">' + esc(v.meta.filter(Boolean).join(" · ")) + '</span><span class="why">' + whyHTML(r.why, 3, false) + "</span></li>";
          }).join("") + "</ol>" : '<p class="quiz-hint">' + esc(L.noTools) + "</p>") +
          (x.total > 3 ? '<details class="quiz-all"><summary>' + esc(L.all(x.total)) + "</summary>" + x.groups.map(function (g) {
            return '<div class="quiz-grp"><p class="quiz-lbl">' + esc(L.cats[g.cat].t) + " · " + g.items.length + "</p><ul>" + g.items.map(function (r) {
              var v = tool(r);
              return "<li>" + v.name + ' <span class="meta">' + esc(v.meta[2] || "") + '</span> <span class="why">' + whyHTML(r.why, 2, true) + "</span></li>";
            }).join("") + "</ul></div>";
          }).join("") + "</details>" : "") + "</article>";
      }).join("") +
      '<p class="quiz-note">' + esc(L.note) + " " + esc(L.draft) + '</p><p class="quiz-print-foot">' + esc(L.checked) + " · didaflow.ai" + HERE + "</p>" +
      '<div class="quiz-actions"><button type="button" class="btn btn--primary" id="q-print">' + esc(L.save) + '</button>' +
      '<a class="btn btn--secondary" id="q-mail" href="' + esc(mailto(R)) + '">' + esc(L.contact) + '</a><button type="button" class="btn btn--secondary" id="q-restart">' + esc(L.restart) + "</button></div>" +
      '<p class="quiz-hint">' + esc(L.saveHint) + " " + esc(L.contactHint) + "</p>" +
      '<div class="quiz-nav"><button type="button" class="btn btn--secondary" id="q-back">' + L.back + "</button></div>");
    bindNav();
    document.getElementById("q-print").onclick = function () { window.print(); };
    document.getElementById("q-restart").onclick = function () { state.a = { tasks: [], stack: {} }; state.step = 0; save(); render(true); };
  }

  // On a new screen the previous button is gone: move focus to the heading so keyboard and screen-reader users land at the top.
  function render(moved) {
    if (state.step < QIDS.length) { document.title = L.title.replace(/<[^>]+>/g, "") + " · didaflow"; renderQuestion(QIDS[state.step]); }
    else renderReport();
    var h = app.querySelector("h2");
    if (h) { h.setAttribute("tabindex", "-1"); if (moved) h.focus({ preventScroll: true }); }
  }

  // Closed <details> do not print: open them for the print dialog and restore them afterwards.
  var reopened = [];
  window.addEventListener("beforeprint", function () {
    reopened = Array.prototype.filter.call(document.querySelectorAll(".quiz-all"), function (d) { return !d.open; });
    reopened.forEach(function (d) { d.open = true; });
  });
  window.addEventListener("afterprint", function () { reopened.forEach(function (d) { d.open = false; }); reopened = []; });

  document.addEventListener("keydown", function (e) {
    var t = e.target || {};
    if (!D || e.altKey || e.ctrlKey || e.metaKey || !(t === document.body || (t.closest && t.closest(".quiz-nav")) || t.tagName === "H2")) return;
    if (e.key === "ArrowLeft" && state.step > 0) go(-1);
    else if (e.key === "ArrowRight" && state.step < STEPS - 1 && answered(QIDS[state.step])) go(1);
  });

  app.innerHTML = '<section class="quiz"><p class="quiz-lede">' + esc(L.loading) + "</p></section>";
  Promise.all([json("taxonomy"), json("tasks"), json("tools")]).then(function (r) {
    D = { tax: r[0], tasks: r[1].tasks, tools: r[2].tools };
    sanitise(); save();
    render();
  }).catch(function () { app.innerHTML = '<section class="quiz"><p class="quiz-lede">' + esc(L.failed) + "</p></section>"; });
})(typeof window !== "undefined" ? window : globalThis);
