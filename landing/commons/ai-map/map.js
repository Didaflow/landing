// AI Map (plain JS, no build step for the browser).
// One page, four steps: role → task → compare tools → analysis of one tool for that task.
// State lives in the URL (?role=&task=&tool=), so every analysis has a stable, shareable link.
// Data: ./data/*.json, generated from research files by tools/build-data.ts. Text fields are { en, it }.
(function () {
  "use strict";

  var LANG = document.documentElement.lang === "it" ? "it" : "en";
  var HERE = LANG === "it" ? "/it/commons/ai-map/esplora/" : "/commons/ai-map/explore/";
  var OTHER = LANG === "it" ? "/commons/ai-map/explore/" : "/it/commons/ai-map/esplora/";
  var BASE = LANG === "it" ? "/it/commons/ai-map/" : "/commons/ai-map/"; // the quiz, and the how-it-works page
  var HUB = LANG === "it" ? "/it/commons/" : "/commons/";

  var S = {
    en: {
      hub: "Commons", title: "AI <em>Map</em>",
      lead: "Choose who you are and what you want to do. Compare the AI tools that fit, see what research says, what the rules allow, and how to try it responsibly.",
      method: "How the map works", guided: "Guided quiz", scope: "Higher education · Updated monthly",
      s1: "Who are you?", s2: "What do you want to do?", s3: "Evidence and tools", s4: "Analysis",
      you: "You are", task: "Your task", tool: "Tool", change: "Change",
      tasksN: function (n) { return n + " tasks"; },
      lockedRole: "Choose who you are first.", lockedTask: "Choose a task first.", lockedTool: "Open a tool from the comparison.",
      evidence: "Evidence", legal: "Rules",
      measured: "What studies measured", measuredNote: "Filled = measured in at least one study we cite. Doing a task better with AI is not the same as learning.",
      readEvidence: function (n) { return "Read the evidence (" + n + (n === 1 ? " study)" : " studies)"); },
      goodPractice: "How to try it responsibly", gaps: "What we do not know yet", noAI: "Without AI",
      compare: "Compare tools", all: "All", toolCol: "Tool", typeCol: "Kind", accessCol: "Access", dataCol: "Your data", eduCol: "For education", communityCol: "Community",
      open: "Open analysis →", noTools: "No tool in the map is declared for this task yet.",
      compareNote: "Facts declared by providers, checked on the date shown in each analysis. Listing a tool is not a recommendation.",
      notAllowed: "Not allowed for this task",
      noRatings: "No ratings yet",
      ratings: function (n) { return n === 1 ? "1 rating" : n + " ratings"; },
      nav: ["At a glance", "Using it for this task", "Evidence", "Benefits and risks", "Rules", "Community", "Sources"],
      share: "Copy link to this analysis", copied: "Link copied",
      checked: "Checked", notDeclared: "Not declared",
      facts: { application: "Application", model: "Model", access: "Access", pricing: "Pricing", weights: "Weights", licence: "Licence", execution: "Where it runs", dataLocation: "Where your data go", dpa: "Data processing agreement", training: "Use of your data for training", minAge: "Minimum age", citations: "Shows its sources", eduFeatures: "Education features" },
      productNote: "Studies rarely test a specific product. Unless a finding names this tool, it concerns tools of this kind.",
      benefits: "Possible benefits", risks: "Possible risks", conditions: "What changes the judgement",
      rulesNone: "We found no rule that specifically restricts this use. General data-protection rules still apply.",
      seekAdvice: "This is a plain-language summary, not legal advice. Institutions should check with their legal office.",
      community: "What people who use it say",
      communityNote: "Experiences of people who tried this tool for this task. They are not research and never change the evidence level.",
      rate: "Your rating for this task", experience: "Your experience", expHint: "What did you do, in which course, and what happened?",
      yourRole: "You are", yourName: "Name (optional)", post: "Post", reply: "Reply", report: "Report",
      noPosts: "No experiences yet. Be the first to share one.",
      replyPh: "Your reply", thanks: "Thank you. Your contribution is visible below.",
      sourcesT: "Sources", dates: { product: "Product checked", literature: "Literature searched", review: "Editorial review" },
      draft: "<strong>Draft, not yet reviewed by the scientific committee.</strong> Content prepared for the prototype from the sources listed below.",
      read: { full: "full text read", abstract: "abstract only", page: "official page read", excerpt: "excerpt only, to re-check" },
      srcKind: { "peer-reviewed": "Peer-reviewed", review: "Review or meta-analysis", preprint: "Preprint, not peer-reviewed", grey: "Report", "vendor-doc": "Provider documentation", standard: "Standard", law: "Law", guidance: "Official guidance", conceptual: "Conceptual paper" },
      kinds: { vendor: "Provider", research: "Research", interpretation: "Didaflow reading", experience: "Experience", law: "Law" },
      backTools: "← Back to the comparison",
      fitDeclared: "Declared for this task", fitKind: "General-purpose",
      fitKindShort: "the kind of tool used in the studies, not presented for this task",
      showGeneral: function (n) { return "Show " + n + " general-purpose tools"; },
      seeRules: function (n) { return "See the " + n + " rules and policies"; },
      fitDeclaredLong: "The provider presents this tool for this kind of task.",
      fitKindLong: "The provider does not present it for this task. It is listed because it is the kind of tool used for this task in the studies we cite.",
      howStudy: "How the study was done",
      fb: {
        checkQ: "Does your experience match what the research says?",
        check: { yes: "It matches", partly: "Partly", no: "It doesn’t", untried: "I haven’t tried it" },
        checkThanks: function (role) { return "Thank you. Your answer counts as " + role + ". You can change it at any time."; },
        practiceT: "What people who use it say",
        practiceFew: function (n) { return "We show the answers once there are at least 10. So far: " + n + "."; },
        practiceN: function (n, role) { return n + " answers from " + role; },
        practiceNote: "Experience, not research: it never changes the evidence level. When practice and evidence disagree, the scientific committee reviews the entry.",
        allRoles: "everyone",
        usefulQ: "Was this analysis useful?", usefulYes: "Yes", usefulNo: "Not really",
        usefulWhy: "What made the difference?",
        reasons: { changed: "It changed my mind", confirmed: "It confirmed what I thought", missingTool: "A tool is missing", tooTechnical: "Too technical", unclear: "Not clear what to do" },
        usefulThanks: "Thank you. This helps us decide what to improve.",
        report: { tool: "A tool is missing for this task? Tell us", task: "A task is missing? Tell us", study: "Know a study we missed? Tell us" },
        reportWhat: "What is missing", reportLink: "Link or DOI (optional)", reportSend: "Send",
        reportThanks: "Thank you. We review every report in the monthly update.",
        level: "Level", levels: { bachelor: "Bachelor’s", master: "Master’s", phd: "Doctoral", exec: "Executive / professional", other: "Other" },
        field: "Field", fields: { stem: "Science and engineering", business: "Economics and management", humanities: "Humanities and social sciences", health: "Medicine and health", law: "Law", other: "Other" },
        size: "Group size", sizes: { s: "Fewer than 30", m: "30–100", l: "More than 100", self: "Just me" },
        how: "How did you use it?", hows: { protocol: "As suggested here", partly: "Partly as suggested", own: "My own way" },
        seen: "What did you observe?", seens: { learning: "Better learning", time: "Time saved", engagement: "More engagement", none: "No clear effect", integrity: "Integrity problems", errors: "Tool errors" },
        free: "Anything else? (optional)", freeHint: "What worked, what didn’t, what you would do differently.",
        consent: "I publish under CC BY 4.0 and I have not included personal data about other people.",
        update: "Add how it went", updateT: "Update", updatePh: "How did it go in the end?", yours: "Your post",
        keep: "This post is linked to this browser, so you can come back and add how it went. No email or account needed.",
        error: "We could not send it. Please try again in a moment.", unavailable: "Contributions are not available right now.", loading: "Loading…",
        flag: "Report", flagged: "Reported. Thank you."
      },
      studyF: { design: "Design", sample: "Sample", context: "Context", comparison: "Compared with", outcome: "What was measured", duration: "Duration", result: "Result", uncertainty: "Limits and uncertainty", funding: "Funding", system: "AI system" }
    },
    it: {
      hub: "Commons", title: "Mappa <em>AI</em>",
      lead: "Scegli chi sei e che cosa vuoi fare. Confronta gli strumenti AI pertinenti, guarda che cosa dice la ricerca, che cosa consentono le regole e come provarli in modo consapevole.",
      method: "Come funziona la mappa", guided: "Quiz guidato", scope: "Istruzione superiore · Aggiornata ogni mese",
      s1: "Chi sei?", s2: "Che cosa vuoi fare?", s3: "Evidenze e strumenti", s4: "Analisi",
      you: "Sei", task: "Il tuo compito", tool: "Strumento", change: "Cambia",
      tasksN: function (n) { return n + " compiti"; },
      lockedRole: "Prima scegli chi sei.", lockedTask: "Prima scegli un compito.", lockedTool: "Apri uno strumento dal confronto.",
      evidence: "Evidenze", legal: "Regole",
      measured: "Che cosa hanno misurato gli studi", measuredNote: "Pieno = misurato in almeno uno studio citato. Svolgere meglio un compito con l’AI non equivale ad apprendere.",
      readEvidence: function (n) { return "Leggi le evidenze (" + n + (n === 1 ? " studio)" : " studi)"); },
      goodPractice: "Come provarlo in modo consapevole", gaps: "Che cosa non sappiamo ancora", noAI: "Senza AI",
      compare: "Confronta gli strumenti", all: "Tutti", toolCol: "Strumento", typeCol: "Tipo", accessCol: "Accesso", dataCol: "I tuoi dati", eduCol: "Per l’educazione", communityCol: "Community",
      open: "Apri l’analisi →", noTools: "Nessuno strumento della mappa è ancora dichiarato per questo compito.",
      compareNote: "Dati dichiarati dai fornitori, controllati alla data indicata in ogni analisi. Elencare uno strumento non significa raccomandarlo.",
      notAllowed: "Non consentito per questo compito",
      noRatings: "Ancora nessuna valutazione",
      ratings: function (n) { return n === 1 ? "1 valutazione" : n + " valutazioni"; },
      nav: ["In sintesi", "Usarlo per questo compito", "Evidenze", "Benefici e rischi", "Regole", "Community", "Fonti"],
      share: "Copia il link a questa analisi", copied: "Link copiato",
      checked: "Verificato il", notDeclared: "Non dichiarato",
      facts: { application: "Applicazione", model: "Modello", access: "Accesso", pricing: "Prezzo", weights: "Pesi", licence: "Licenza", execution: "Dove gira", dataLocation: "Dove vanno i tuoi dati", dpa: "Accordo sul trattamento dei dati", training: "Uso dei tuoi dati per l’addestramento", minAge: "Età minima", citations: "Mostra le fonti", eduFeatures: "Funzioni per l’educazione" },
      productNote: "Gli studi raramente provano un prodotto specifico. Se un risultato non nomina questo strumento, riguarda strumenti di questo tipo.",
      benefits: "Benefici possibili", risks: "Rischi possibili", conditions: "Che cosa cambia il giudizio",
      rulesNone: "Non abbiamo trovato regole che limitino specificamente questo utilizzo. Restano valide le norme generali sulla protezione dei dati.",
      seekAdvice: "È una sintesi in linguaggio semplice, non un parere legale. Le istituzioni dovrebbero verificare con il proprio ufficio legale.",
      community: "Che cosa dice chi lo usa",
      communityNote: "Esperienze di chi ha provato questo strumento per questo compito. Non sono ricerca e non cambiano mai il livello delle evidenze.",
      rate: "La tua valutazione per questo compito", experience: "La tua esperienza", expHint: "Che cosa hai fatto, in quale corso, e che cosa è successo?",
      yourRole: "Sei", yourName: "Nome (facoltativo)", post: "Pubblica", reply: "Rispondi", report: "Segnala",
      noPosts: "Ancora nessuna esperienza. Condividi la prima.",
      replyPh: "La tua risposta", thanks: "Grazie. Il tuo contributo è visibile qui sotto.",
      sourcesT: "Fonti", dates: { product: "Prodotto verificato", literature: "Ricerca bibliografica", review: "Revisione editoriale" },
      draft: "<strong>Bozza, non ancora revisionata dal comitato scientifico.</strong> Contenuto preparato per il prototipo a partire dalle fonti elencate in fondo.",
      read: { full: "testo completo letto", abstract: "solo abstract", page: "pagina ufficiale letta", excerpt: "solo estratto, da ricontrollare" },
      srcKind: { "peer-reviewed": "Revisione paritaria", review: "Rassegna o meta-analisi", preprint: "Preprint, senza revisione paritaria", grey: "Rapporto", "vendor-doc": "Documentazione del fornitore", standard: "Standard", law: "Norma", guidance: "Linee guida ufficiali", conceptual: "Articolo concettuale" },
      kinds: { vendor: "Fornitore", research: "Ricerca", interpretation: "Lettura Didaflow", experience: "Esperienza", law: "Norma" },
      backTools: "← Torna al confronto",
      fitDeclared: "Dichiarato per questo compito", fitKind: "Generalista",
      fitKindShort: "il tipo di strumento usato negli studi, non presentato per questo compito",
      showGeneral: function (n) { return "Mostra " + n + " strumenti generalisti"; },
      seeRules: function (n) { return "Vedi le " + n + " norme e policy"; },
      fitDeclaredLong: "Il fornitore presenta questo strumento per questo tipo di compito.",
      fitKindLong: "Il fornitore non lo presenta per questo compito. È elencato perché è il tipo di strumento usato per questo compito negli studi che citiamo.",
      howStudy: "Come è stato condotto lo studio",
      fb: {
        checkQ: "La tua esperienza conferma quello che dice la ricerca?",
        check: { yes: "Lo conferma", partly: "In parte", no: "No", untried: "Non l’ho provato" },
        checkThanks: function (role) { return "Grazie. La tua risposta conta come " + role + ". Puoi cambiarla quando vuoi."; },
        practiceT: "Che cosa dice chi lo usa",
        practiceFew: function (n) { return "Mostriamo le risposte quando sono almeno 10. Finora: " + n + "."; },
        practiceN: function (n, role) { return n + " risposte da " + role; },
        practiceNote: "Esperienza, non ricerca: non cambia mai il livello delle evidenze. Quando pratica ed evidenze non concordano, la scheda passa al comitato scientifico.",
        allRoles: "tutti i ruoli",
        usefulQ: "Questa analisi ti è stata utile?", usefulYes: "Sì", usefulNo: "Non molto",
        usefulWhy: "Che cosa ha fatto la differenza?",
        reasons: { changed: "Mi ha fatto cambiare idea", confirmed: "Ha confermato ciò che pensavo", missingTool: "Manca uno strumento", tooTechnical: "Troppo tecnica", unclear: "Non è chiaro che cosa fare" },
        usefulThanks: "Grazie. Ci aiuta a decidere che cosa migliorare.",
        report: { tool: "Manca uno strumento per questo compito? Segnalalo", task: "Manca un compito? Segnalalo", study: "Conosci uno studio che manca? Segnalalo" },
        reportWhat: "Che cosa manca", reportLink: "Link o DOI (facoltativo)", reportSend: "Invia",
        reportThanks: "Grazie. Esaminiamo ogni segnalazione nell’aggiornamento mensile.",
        level: "Livello", levels: { bachelor: "Triennale", master: "Magistrale", phd: "Dottorato", exec: "Executive / professionale", other: "Altro" },
        field: "Area", fields: { stem: "Scienze e ingegneria", business: "Economia e management", humanities: "Scienze umane e sociali", health: "Medicina e salute", law: "Giurisprudenza", other: "Altro" },
        size: "Dimensione del gruppo", sizes: { s: "Meno di 30", m: "30–100", l: "Più di 100", self: "Solo io" },
        how: "Come l’hai usato?", hows: { protocol: "Come suggerito qui", partly: "In parte come suggerito", own: "A modo mio" },
        seen: "Che cosa hai osservato?", seens: { learning: "Apprendimento migliore", time: "Tempo risparmiato", engagement: "Più coinvolgimento", none: "Nessun effetto chiaro", integrity: "Problemi di integrità", errors: "Errori dello strumento" },
        free: "Altro da aggiungere? (facoltativo)", freeHint: "Che cosa ha funzionato, che cosa no, che cosa faresti diversamente.",
        consent: "Pubblico con licenza CC BY 4.0 e non ho inserito dati personali di altre persone.",
        update: "Racconta com’è andata", updateT: "Aggiornamento", updatePh: "Com’è andata alla fine?", yours: "Il tuo contributo",
        keep: "Questo contributo resta collegato a questo browser: puoi tornare ad aggiungere com’è andata. Non servono email né account.",
        error: "Non siamo riusciti a inviarlo. Riprova tra poco.", unavailable: "I contributi non sono disponibili in questo momento.", loading: "Caricamento…",
        flag: "Segnala", flagged: "Segnalato. Grazie."
      },
      studyF: { design: "Disegno", sample: "Campione", context: "Contesto", comparison: "Confronto", outcome: "Che cosa è stato misurato", duration: "Durata", result: "Risultato", uncertainty: "Limiti e incertezza", funding: "Finanziamento", system: "Sistema AI" }
    }
  }[LANG];

  // ─── Helpers ───────────────────────────────────────────────
  function t(v) { if (v == null) return ""; if (typeof v === "string") return v; return v[LANG] != null ? v[LANG] : (v.en || ""); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function byId(l) { var m = {}; (l || []).forEach(function (x) { m[x.id] = x; }); return m; }
  function fmtDate(d) { if (!d) return "—"; try { return new Date(d + "T12:00:00").toLocaleDateString(LANG === "it" ? "it-IT" : "en-GB", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return d; } }
  function json(n) { return fetch("/commons/ai-map/data/" + n + ".json", { cache: "no-store" }).then(function (r) { return r.json(); }); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var D = {};
  function load() {
    return Promise.all(["taxonomy", "tasks", "tools", "sources", "regulation"].map(json)).then(function (r) {
      D.tax = r[0]; D.roles = byId(r[0].roles); D.levels = byId(r[0].evidenceLevels); D.outcomes = r[0].outcomes; D.access = byId(r[0].accessModes); D.types = byId(r[0].toolTypes);
      D.tasks = r[1].tasks; D.task = byId(r[1].tasks);
      D.tools = byId(r[2].tools); D.toolList = r[2].tools;
      D.src = byId(r[3].sources);
      D.rules = byId(r[4].rules); D.flags = {}; (r[4].taskFlags || []).forEach(function (f) { D.flags[f.task] = f; });
    });
  }

  // ─── State ─────────────────────────────────────────────────
  var st = { role: "", task: "", tool: "" };
  function readURL() {
    var p = new URLSearchParams(location.search);
    st.role = D.roles[p.get("role")] ? p.get("role") : "";
    st.task = st.role && D.task[p.get("task")] && D.task[p.get("task")].role === st.role ? p.get("task") : "";
    st.tool = st.task && D.tools[p.get("tool")] ? p.get("tool") : "";
  }
  function query(s) {
    var p = new URLSearchParams();
    if (s.role) p.set("role", s.role);
    if (s.task) p.set("task", s.task);
    if (s.tool) p.set("tool", s.tool);
    var q = p.toString(); return q ? "?" + q : "";
  }
  function go(next, focusId) {
    st = next;
    history.pushState(null, "", location.pathname + query(st));
    render(focusId);
  }
  window.addEventListener("popstate", function () { readURL(); render(); });

  // ─── Small renderers ───────────────────────────────────────
  var EV_SHAPES = {
    none: '<circle cx="7" cy="7" r="5.5"/>',
    indirect: '<circle cx="7" cy="7" r="5.5" stroke-dasharray="2.4 2.2"/>',
    limited: '<circle cx="7" cy="7" r="5.5"/><path class="fill" d="M7 1.5a5.5 5.5 0 0 1 0 11z"/>',
    mixed: '<circle cx="7" cy="7" r="5.5"/><path class="fill" d="M7 1.5a5.5 5.5 0 0 1 5.5 5.5H7z"/><path class="fill" d="M7 12.5A5.5 5.5 0 0 1 1.5 7H7z"/>',
    consistent: '<circle class="fill" cx="7" cy="7" r="5.5"/>',
    "not-reviewed": '<circle cx="7" cy="7" r="5.5" stroke-dasharray="0.6 2.4" stroke-linecap="round"/>'
  };
  function evMark(l) { return '<svg viewBox="0 0 14 14" aria-hidden="true">' + (EV_SHAPES[l] || EV_SHAPES.none) + "</svg>"; }
  function ev(l) { return '<span class="ev">' + evMark(l) + "<span>" + t(D.levels[l]) + "</span></span>"; }
  function flag(taskId) {
    var f = D.flags[taskId];
    if (!f || f.level === "none") return "";
    return '<span class="flag flag--' + f.level + '">' + t(D.tax.legalLevels.filter(function (x) { return x.id === f.level; })[0]) + "</span>";
  }
  function kind(k) { return '<span class="kind kind--' + k + '">' + S.kinds[k] + "</span>"; }
  var srcOrder = [];
  function cite(ids) {
    if (!ids || !ids.length) return "";
    return ' <span class="refs">[' + ids.filter(function (id) { return D.src[id]; }).map(function (id) {
      if (srcOrder.indexOf(id) < 0) srcOrder.push(id);
      return '<a href="#src-' + id + '">' + (srcOrder.indexOf(id) + 1) + "</a>";
    }).join(", ") + "]</span>";
  }
  function claim(c) { return kind(c.kind || "research") + t(c.text) + cite(c.sources); }
  function val(v) { return v == null || t(v) === "" ? '<span class="undeclared">' + S.notDeclared + "</span>" : t(v); }
  function stars(avg) {
    var out = ""; for (var i = 1; i <= 5; i++) out += i <= Math.round(avg) ? "★" : '<span class="off">★</span>';
    return '<span class="stars" aria-label="' + avg.toFixed(1) + ' / 5">' + out + "</span>";
  }
  // Tools for a task: declared by the provider first, then tools of the kind studied for the task.
  function toolsFor(taskId) {
    var links = (D.task[taskId].tools || []).slice().sort(function (a, b) { return a.fit === b.fit ? 0 : a.fit === "declared" ? -1 : 1; });
    return links.map(function (l) { var x = D.tools[l.id]; return x ? Object.assign({ fit: l.fit }, x) : null; }).filter(Boolean);
  }
  function fitTag(fit) { return '<span class="fit fit--' + fit + '">' + (fit === "declared" ? S.fitDeclared : S.fitKind) + "</span>"; }
  function toolBlocked(tool, taskId) {
    // A rule marks a tool type as prohibited for a task.
    return Object.keys(D.rules).some(function (id) {
      var r = D.rules[id];
      return r.status === "prohibited" && (r.tasks || []).indexOf(taskId) > -1 && (r.toolTypes || []).some(function (ty) { return (tool.types || []).indexOf(ty) > -1; });
    });
  }

  // ─── Community: contributions go to the Commons API (/api/commons) ───
  var API = "/api/commons";
  // An anonymous id for this browser, so a person can change their own answer. Stored server-side only as a hash.
  function clientId() {
    var c = store("commons.client");
    if (!c) { c = (window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2) + "-x"); store("commons.client", c); }
    return c;
  }
  // Edit tokens for the posts written in this browser: { postId: token }.
  function ownTokens() { try { return JSON.parse(store("commons.own") || "{}"); } catch (e) { return {}; } }
  var SUM = {};
  function sumKey(task, tool) { return task + "|" + (tool || ""); }
  function summaryFor(task, tool) { var v = SUM[sumKey(task, tool)]; return v && typeof v === "object" ? v : null; }
  function summaryState(task, tool) { var v = SUM[sumKey(task, tool)]; return typeof v === "string" ? v : v ? "ready" : "none"; }
  function fetchSummary(task, tool, force) {
    var k = sumKey(task, tool);
    if (!force && SUM[k]) return;
    if (!SUM[k]) SUM[k] = "loading";
    fetch(API + "/summary?task=" + encodeURIComponent(task) + (tool ? "&tool=" + encodeURIComponent(tool) : ""), { headers: { "x-commons-client": clientId() } })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r); })
      .then(function (d) { SUM[k] = d; rerender(); }, function () { if (typeof SUM[k] !== "object") { SUM[k] = "error"; rerender(); } });
  }
  function send(path, body, headers) {
    return fetch(API + path, { method: "POST", headers: Object.assign({ "content-type": "application/json", "x-commons-client": clientId() }, headers || {}), body: JSON.stringify(body) })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); });
  }
  // Cookieless usage counters: what was opened, never who opened it.
  function track(kind, extra) {
    try { fetch(API + "/events", { method: "POST", keepalive: true, headers: { "content-type": "application/json" }, body: JSON.stringify(Object.assign({ kind: kind }, extra || {})) }).catch(function () {}); } catch (e) {}
  }
  function ratingOf(tool, task) { var s = summaryFor(task, null); return (s && s.ratings && s.ratings[tool]) || { n: 0, avg: 0 }; }
  function rerender() { var y = scrollY; var a = document.activeElement && document.activeElement.dataset ? Object.assign({}, document.activeElement.dataset) : null; render(); scrollTo(0, y); if (a) { var k = Object.keys(a)[0]; if (k) { var el = main.querySelector("[data-" + k.replace(/[A-Z]/g, function (c) { return "-" + c.toLowerCase(); }) + '="' + a[k] + '"]'); if (el) el.focus({ preventScroll: true }); } } }

  // ─── Page ──────────────────────────────────────────────────
  var main;
  function render(focusId) {
    srcOrder = [];
    var role = D.roles[st.role], task = D.task[st.task], tool = D.tools[st.tool];
    if (task) fetchSummary(task.id, null);
    if (task && tool) fetchSummary(task.id, tool.id);
    var h = '<div class="wrap"><header class="map-top"><div><a class="crumb-hub" href="' + HUB + '">← ' + S.hub + "</a><h1>" + S.title + '</h1><p class="lead">' + S.lead + '</p></div><div class="map-top__links"><span class="muted">' + S.scope + '</span><a class="u" href="' + BASE + '">' + S.guided + '</a><a class="u" href="' + BASE + 'method/">' + S.method + "</a></div></header>";
    h += '<div class="steps">';

    // Step 1 — role
    if (!role) {
      h += step(1, "s-role", S.s1, null, '<div class="roles">' + D.tax.roles.map(function (r) {
        var n = D.tasks.filter(function (x) { return x.role === r.id; }).length;
        return '<button type="button" class="pick" data-role="' + r.id + '"><b>' + t(r) + "</b><span>" + t(r.blurb) + '</span><span class="count">' + S.tasksN(n) + "</span></button>";
      }).join("") + "</div>");
    } else {
      h += step(1, "s-role", S.s1, { label: S.you, value: t(role), change: "role" });
    }

    // Step 2 — task
    if (!role) h += lockedStep(2, S.s2, S.lockedRole);
    else if (!task) {
      var list = D.tasks.filter(function (x) { return x.role === st.role; });
      h += step(2, "s-task", S.s2, null, '<p class="role-intro">' + t(role.intro) + '</p><ul class="tasks">' + list.map(function (x) {
        return '<li><button type="button" class="task" data-task="' + x.id + '"><span class="task__q">' + t(x.question) + "<small>" + t(x.title) + '</small></span><span class="task__meta">' + ev(x.evidenceLevel) + flag(x.id) + '</span><span class="task__arrow" aria-hidden="true">→</span></button></li>';
      }).join("") + "</ul>" + reportBlock("task"));
    } else {
      h += step(2, "s-task", S.s2, { label: S.task, value: t(task.question), change: "task" });
    }

    // Step 3 — evidence + comparison
    if (!task) h += lockedStep(3, S.s3, S.lockedTask);
    else h += step(3, "s-tools", S.s3, null, taskOverview(task) + comparison(task));

    // Step 4 — analysis
    if (!tool) h += lockedStep(4, S.s4, S.lockedTool);
    else h += step(4, "s-analysis", S.s4, null, analysis(task, tool));

    h += "</div></div>";
    main.innerHTML = h;
    document.title = (tool ? tool.name + " · " : "") + (task ? t(task.title) + " · " : "") + (LANG === "it" ? "Mappa AI" : "AI Map") + " · didaflow";
    // v0.3: the step the reader is working on sits on its own band.
    var open = main.querySelectorAll(".step:not(.step--locked)");
    if (open.length) open[open.length - 1].classList.add("step--active");
    syncLang();
    wireAnalysis();
    if (focusId) {
      var el = document.getElementById(focusId);
      if (el) { el.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" }); var hd = el.querySelector("h2"); if (hd) { hd.tabIndex = -1; hd.focus({ preventScroll: true }); } }
    } else if (location.hash) { var target = document.getElementById(location.hash.slice(1)); if (target) target.scrollIntoView(); }
  }

  function step(n, id, title, done, body) {
    var cls = "step" + (done ? " step--done" : "");
    var head = '<div class="step__head">';
    if (done) head += '<h2 class="step__choice"><small>' + done.label + "</small>" + done.value + '</h2><button type="button" class="change" data-change="' + done.change + '" aria-label="' + S.change + ": " + esc(title) + '">' + S.change + "</button>";
    else head += '<h2 class="step__title">' + title + "</h2><span></span>";
    head += "</div>";
    return '<section class="' + cls + '" id="' + id + '" aria-label="' + esc(title) + '">' + head + (body ? '<div class="step__body">' + body + "</div>" : "") + "</section>";
  }
  function lockedStep(n, title, note) {
    return '<section class="step step--locked" aria-label="' + esc(title) + '"><div class="step__head"><h2 class="step__title">' + title + '</h2><span class="muted" style="font-size:13px">' + note + "</span></div></section>";
  }

  function legalBox(taskId) {
    var f = D.flags[taskId];
    if (!f || f.level === "none") return "";
    var rules = (f.rules || []).map(function (id) { return D.rules[id]; }).filter(Boolean);
    return '<div class="legal legal--' + f.level + '" role="note"><span class="flag flag--' + f.level + '">' + t(D.tax.legalLevels.filter(function (x) { return x.id === f.level; })[0]) + "</span><div><p>" + t(f.summary) + "</p>" +
      (rules.length ? '<details class="legal__rules"><summary>' + S.seeRules(rules.length) + "</summary><ul>" + rules.map(function (r) { return "<li><strong>" + esc(r.instrument + " " + r.ref) + "</strong> — " + t(r.title) + cite(r.sources) + "</li>"; }).join("") + "</ul></details>" : "") + "</div></div>";
  }

  function outcomesStrip(task) {
    var on = task.outcomesMeasured || [];
    return '<div class="outcomes"><h4>' + S.measured + '</h4><ul class="outcome-list">' + D.outcomes.map(function (o) {
      return '<li class="' + (on.indexOf(o.id) > -1 ? "on" : "") + '">' + t(o) + "</li>";
    }).join("") + "</ul><p>" + S.measuredNote + "</p></div>";
  }

  function taskOverview(task) {
    var h = legalBox(task.id);
    h += '<div class="overview"><div class="verdict-box"><h3>' + evMark(task.evidenceLevel) + t(D.levels[task.evidenceLevel]) + "</h3><p>" + t(task.verdict) + "</p></div>" + outcomesStrip(task) + "</div>";
    if (task.evidenceLevel !== "not-reviewed") h += practiceCheck(task);
    if (task.findings && task.findings.length) h += '<details class="more"><summary>' + S.readEvidence(task.findings.length) + "</summary><div>" + findings(task) + "</div></details>";
    if (task.goodPractice && task.goodPractice.length) h += '<details class="more"><summary>' + S.goodPractice + '</summary><div><ul class="checklist">' + task.goodPractice.map(function (g) { return "<li>" + t(g) + "</li>"; }).join("") + "</ul></div></details>";
    if (task.noAI && task.noAI.length) h += '<details class="more"><summary>' + S.noAI + "</summary><div>" + task.noAI.map(function (n) { return "<p><strong>" + t(n.title) + ".</strong> " + t(n.text) + cite(n.sources) + "</p>"; }).join("") + "</div></details>";
    if (task.gaps && task.gaps.length) h += '<details class="more"><summary>' + S.gaps + "</summary><div><ul>" + task.gaps.map(function (g) { return "<li>" + t(g) + "</li>"; }).join("") + "</ul></div></details>";
    return h;
  }
  function findings(task) {
    return task.findings.map(function (f) {
      var s = D.src[f.source] || {};
      return '<div class="finding"><p>' + kind("research") + t(f.finding) + cite([f.source]) + "</p>" + (f.relevance ? '<p class="rel">' + t(f.relevance) + "</p>" : "") +
        '<p class="rel">' + esc(s.short || "") + (s.kind ? " · " + (S.srcKind[s.kind] || s.kind) : "") + (s.read ? " · " + S.read[s.read] : "") + "</p>" + studyDetails(s) + "</div>";
    }).join("");
  }

  function studyDetails(s) {
    var d = s.study; if (!d) return "";
    var keys = ["design", "sample", "context", "comparison", "outcome", "duration", "result", "uncertainty", "funding", "system"];
    var rows = keys.filter(function (k) { return d[k] != null && t(d[k]) !== ""; });
    if (!rows.length) return "";
    return '<details class="study"><summary>' + S.howStudy + '</summary><dl class="facts">' + rows.map(function (k) { return '<div class="' + (k === "result" || k === "uncertainty" ? "wide" : "") + '"><dt>' + S.studyF[k] + "</dt><dd>" + esc(t(d[k])) + "</dd></div>"; }).join("") + "</dl></details>";
  }

  function reportBlock(kind) {
    return '<details class="report"><summary>' + S.fb.report[kind] + '</summary><form class="form form--compact" data-report="' + kind + '"><label>' + S.fb.reportWhat + '<textarea name="what" required maxlength="600" rows="2"></textarea></label><label>' + S.fb.reportLink + '<input name="link" maxlength="300" inputmode="url"></label><input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><div><button type="submit" class="button">' + S.fb.reportSend + '</button></div><output aria-live="polite"></output></form></details>';
  }

  // Level 1: does practice match the evidence? One click, anonymous, role already known.
  function practiceCheck(task) {
    var s = summaryFor(task.id, null), state = summaryState(task.id, null);
    var me = s && s.mine ? s.mine.check : null;
    var h = '<div class="practice"><p class="practice__q">' + S.fb.checkQ + '</p><div class="practice__opts" role="group" aria-label="' + esc(S.fb.checkQ) + '">' +
      ["yes", "partly", "no", "untried"].map(function (k) { return '<button type="button" class="filter" data-check="' + k + '" aria-pressed="' + (me === k) + '"' + (state === "error" ? " disabled" : "") + ">" + S.fb.check[k] + "</button>"; }).join("") + "</div>";
    if (me) h += '<p class="practice__thanks">' + S.fb.checkThanks(t(D.roles[st.role]).toLowerCase()) + "</p>";
    h += '<p class="practice__thanks" data-check-error aria-live="polite"></p>';
    h += '<div class="practice__agg"><h4>' + S.fb.practiceT + "</h4>";
    if (state === "error") h += '<p class="muted">' + S.fb.unavailable + "</p>";
    else if (!s) h += '<p class="muted">' + S.fb.loading + "</p>";
    else if (!s.checks.shown) h += '<p class="muted">' + S.fb.practiceFew(s.checks.n) + "</p>";
    else {
      var c = s.checks;
      h += '<div class="bar" aria-hidden="true">' + ["yes", "partly", "no"].map(function (k) { return '<span class="bar--' + k + '" style="flex:' + c[k] + '"></span>'; }).join("") + "</div>";
      h += "<ul>" + ["yes", "partly", "no"].map(function (k) { return "<li>" + S.fb.check[k] + ": <b>" + Math.round(100 * c[k] / c.n) + "%</b></li>"; }).join("") + '</ul><p class="muted">' + S.fb.practiceN(c.n, S.fb.allRoles) + "</p>";
    }
    return h + '<p class="practice__note">' + kind("experience") + S.fb.practiceNote + "</p></div></div>";
  }

  // Level 2b: was this analysis useful? Yes / not really, then one optional reason.
  function usefulBlock(task, tool) {
    var s = summaryFor(task.id, tool.id);
    var me = s && s.mine ? s.mine.useful : null;
    var h = '<div class="useful"><p class="practice__q">' + S.fb.usefulQ + '</p><div class="practice__opts" role="group">' +
      '<button type="button" class="filter" data-useful="yes" aria-pressed="' + (me && me.value === "yes") + '">' + S.fb.usefulYes + '</button><button type="button" class="filter" data-useful="no" aria-pressed="' + (me && me.value === "no") + '">' + S.fb.usefulNo + "</button></div>";
    if (me) h += '<p class="practice__q" style="margin-top:14px">' + S.fb.usefulWhy + '</p><div class="practice__opts" role="group">' + Object.keys(S.fb.reasons).map(function (k) { return '<button type="button" class="filter" data-reason="' + k + '" aria-pressed="' + (me.reason === k) + '">' + S.fb.reasons[k] + "</button>"; }).join("") + '</div><p class="practice__thanks">' + S.fb.usefulThanks + "</p>";
    return h + "</div>";
  }

  var accessFilter = "", showGeneral = false;
  function comparison(task) {
    var list = toolsFor(task.id);
    var modes = []; list.forEach(function (x) { if (modes.indexOf(x.access) < 0) modes.push(x.access); });
    var shown = list.filter(function (x) { return !accessFilter || x.access === accessFilter; });
    var h = '<div class="compare-head"><h3>' + S.compare + " (" + list.length + ")</h3>";
    if (modes.length > 1) h += '<div class="filters" role="group" aria-label="' + S.accessCol + '"><button type="button" class="filter" data-access="" aria-pressed="' + !accessFilter + '">' + S.all + "</button>" + modes.map(function (m) { return '<button type="button" class="filter" data-access="' + m + '" aria-pressed="' + (accessFilter === m) + '">' + t(D.access[m]) + "</button>"; }).join("") + "</div>";
    h += "</div>";
    if (!list.length) return h + '<p class="muted">' + S.noTools + "</p>";
    var declared = shown.filter(function (x) { return x.fit === "declared"; }), general = shown.filter(function (x) { return x.fit !== "declared"; });
    // v0.3: one card per tool, stacked in two columns; label/value pairs read top to bottom.
    function row(x) {
      var r = ratingOf(x.id, task.id), blocked = toolBlocked(x, task.id);
      var f = x.facts || {};
      function pair(label, v) { return "<div><dt>" + label + "</dt><dd>" + v + "</dd></div>"; }
      return '<article class="tool-card" data-tool="' + x.id + '"' + (st.tool === x.id ? ' aria-current="true"' : "") + ">" +
        '<header><button type="button" data-tool="' + x.id + '">' + esc(x.name) + "</button><small>" + esc(x.vendor) + "</small>" +
        (blocked ? '<span class="flag flag--prohibited">' + S.notAllowed + "</span>" : "") + "</header>" +
        '<dl class="tool-card__facts">' +
        pair(S.typeCol, (x.types || []).slice(0, 2).map(function (ty) { return D.types[ty] ? t(D.types[ty]) : ty; }).join(", ")) +
        pair(S.accessCol, D.access[x.access] ? t(D.access[x.access]) : "—") +
        pair(S.dataCol, f.dataLocation && t(f.dataLocation) ? esc(firstClause(t(f.dataLocation))) : val(null)) +
        pair(S.eduCol, f.eduFeatures && t(f.eduFeatures) ? esc(firstClause(t(f.eduFeatures))) : "—") +
        pair(S.communityCol, r.n ? stars(r.avg) + ' <span class="muted">' + r.n + "</span>" : '<span class="muted">' + S.noRatings + "</span>") +
        '</dl><span class="tool-card__open" aria-hidden="true">' + S.open + "</span></article>";
    }
    if (declared.length) h += '<h4 class="tool-group">' + S.fitDeclared + " <span>" + declared.length + '</span></h4><div class="tool-grid">' + declared.map(row).join("") + "</div>";
    if (general.length) {
      var openGen = showGeneral || !declared.length || general.some(function (x) { return x.id === st.tool; });
      h += '<h4 class="tool-group">' + S.fitKind + " <span>" + general.length + '</span> <small>' + S.fitKindShort + "</small></h4>";
      h += openGen ? '<div class="tool-grid">' + general.map(row).join("") + "</div>" : '<p><button type="button" class="change" data-show-general>' + S.showGeneral(general.length) + "</button></p>";
    }
    return h + '<p class="compare-note">' + S.compareNote + "</p>" + reportBlock("tool");
  }
  function firstClause(s) { var m = s.split(/[:.;(]/)[0]; return m.length > 60 ? m.slice(0, 57) + "…" : m; }

  function analysis(task, tool) {
    var id = function (i) { return "a" + i; };
    var f = tool.facts || {};
    var link = location.origin + HERE + query({ role: st.role, task: st.task, tool: st.tool });
    var h = '<p><button type="button" class="change" data-change="tool">' + S.backTools + "</button></p>";
    h += '<div class="tool-title"><h2 tabindex="-1">' + esc(tool.name) + '</h2><span class="muted">' + esc(tool.vendor) + " · " + t(task.title) + "</span></div>";
    h += '<div class="share"><button type="button" class="text-link" data-share="' + link + '">' + S.share + ' <span aria-hidden="true">⧉</span></button><output aria-live="polite"></output><span>' + S.checked + " " + fmtDate(tool.checked) + "</span></div>";
    h += '<div class="draft-note">' + S.draft + "</div>";
    var fit = ((task.tools || []).filter(function (l) { return l.id === tool.id; })[0] || {}).fit;
    if (fit) h += '<p class="fit-line">' + fitTag(fit) + " " + (fit === "declared" ? S.fitDeclaredLong : S.fitKindLong) + "</p>";
    h += '<div class="analysis"><nav class="analysis__nav" aria-label="' + S.s4 + '">' + S.nav.map(function (x, i) { return '<a href="#' + id(i + 1) + '">' + x + "</a>"; }).join("") + '</nav><div class="analysis__body">';

    // 1 At a glance
    h += '<section id="a1"><h3>' + S.nav[0] + "</h3><p>" + kind("vendor") + (LANG === "it" ? "Dati dichiarati dal fornitore." : "Facts declared by the provider.") + cite(tool.sources) + '</p><dl class="facts">' +
      [["application"], ["model", 1], ["access"], ["pricing"], ["weights"], ["licence"], ["execution"], ["dataLocation"], ["dpa"], ["minAge"], ["training", 1], ["citations"], ["eduFeatures", 1]].map(function (k) {
        var v = k[0] === "access" ? (D.access[tool.access] ? t(D.access[tool.access]) : null) : k[0] === "pricing" ? (tool.pricing ? t(D.tax.pricing.filter(function (p) { return p.id === tool.pricing; })[0]) : null) : f[k[0]];
        return "<div" + (k[1] ? ' class="wide"' : "") + "><dt>" + S.facts[k[0]] + "</dt><dd>" + val(v) + "</dd></div>";
      }).join("") + "</dl>";
    if (toolBlocked(tool, task.id)) h += '<div class="legal legal--prohibited"><span class="flag flag--prohibited">' + S.notAllowed + "</span><p>" + t(D.flags[task.id] && D.flags[task.id].summary) + "</p></div>";
    h += "</section>";

    // 2 Using it for this task
    h += '<section id="a2"><h3>' + S.nav[1] + "</h3>" + (task.description ? "<p>" + t(task.description) + "</p>" : "") +
      (task.goodPractice && task.goodPractice.length ? "<h4>" + S.goodPractice + '</h4><ul class="checklist">' + task.goodPractice.map(function (g) { return "<li>" + t(g) + "</li>"; }).join("") + "</ul>" : "") +
      (task.noAI && task.noAI.length ? '<div class="noai"><h4>' + S.noAI + "</h4>" + task.noAI.map(function (n) { return "<p><strong>" + t(n.title) + ".</strong> " + t(n.text) + cite(n.sources) + "</p>"; }).join("") + "</div>" : "") + "</section>";

    // 3 Evidence
    h += '<section id="a3"><h3>' + S.nav[2] + '</h3><div class="verdict-box" style="margin-bottom:18px"><h3>' + evMark(task.evidenceLevel) + t(D.levels[task.evidenceLevel]) + "</h3><p>" + t(task.verdict) + "</p></div>" +
      '<p class="muted" style="font-size:13.5px">' + S.productNote + "</p>" + outcomesStrip(task) + (task.findings && task.findings.length ? findings(task) : "") +
      (task.gaps && task.gaps.length ? "<h4>" + S.gaps + "</h4><ul>" + task.gaps.map(function (g) { return "<li>" + t(g) + "</li>"; }).join("") + "</ul>" : "") + "</section>";

    // 4 Benefits and risks
    h += '<section id="a4"><h3>' + S.nav[3] + '</h3><div class="balance"><div><h4>' + S.benefits + "</h4><ul>" + (task.benefits || []).map(function (c) { return "<li>" + claim(c) + "</li>"; }).join("") + "</ul></div><div><h4>" + S.risks + "</h4><ul>" + (task.risks || []).map(function (c) { return "<li>" + claim(c) + "</li>"; }).join("") + "</ul></div></div>" +
      (task.conditions && task.conditions.length ? "<h4>" + S.conditions + "</h4><ul>" + task.conditions.map(function (c) { return "<li>" + t(c) + "</li>"; }).join("") + "</ul>" : "") + "</section>";

    // 5 Rules
    var fl = D.flags[task.id];
    h += '<section id="a5"><h3>' + S.nav[4] + "</h3>" + (fl && fl.level !== "none" ? legalBox(task.id) : "<p>" + S.rulesNone + "</p>") +
      ((fl && fl.rules || []).map(function (rid) { var r = D.rules[rid]; return r ? "<h4>" + kind("law") + esc(r.instrument + " " + r.ref) + "</h4><p>" + t(r.plain) + cite(r.sources) + "</p>" + (r.exceptions ? '<p class="muted" style="font-size:13.5px">' + t(r.exceptions) + "</p>" : "") : ""; }).join("")) +
      '<p class="muted" style="font-size:13px">' + S.seekAdvice + "</p></section>";

    // 6 Community
    h += '<section id="a6"><h3>' + S.community + '</h3><p class="community-note">' + kind("experience") + S.communityNote + "</p>" + communityBlock(task, tool) + "</section>";
    h += '<section id="a6b" class="useful-wrap">' + usefulBlock(task, tool) + "</section>";

    // 7 Sources
    var dates = task.dates || {};
    h += '<section id="a7"><h3>' + S.sourcesT + '</h3><dl class="dates"><div><dt>' + S.dates.product + "</dt><dd>" + fmtDate(tool.checked) + "</dd></div><div><dt>" + S.dates.literature + "</dt><dd>" + fmtDate(dates.literatureSearch) + "</dd></div><div><dt>" + S.dates.review + "</dt><dd>" + (dates.editorialReview ? fmtDate(dates.editorialReview) : "—") + '</dd></div></dl><ol class="sources">' +
      srcOrder.map(function (sid) {
        var s = D.src[sid]; if (!s) return "";
        var link = s.doi ? '<a href="https://doi.org/' + s.doi + '" rel="noopener" target="_blank">doi:' + esc(s.doi) + "</a>" : (s.url ? '<a href="' + esc(s.url) + '" rel="noopener" target="_blank">' + esc(s.url.replace(/^https?:\/\//, "").slice(0, 70)) + "</a>" : "");
        return '<li id="src-' + sid + '">' + s.citation + " " + link + '<span class="note">' + (S.srcKind[s.kind] || s.kind) + (s.read ? " · " + S.read[s.read] : "") + (s.accessed ? " · " + fmtDate(s.accessed) : "") + "</span></li>";
      }).join("") + "</ol>" + reportBlock("study") + "</section>";

    h += "</div></div>";
    return h;
  }

  function radios(name, label, opts, required) {
    return '<fieldset class="choice"><legend>' + label + '</legend><div class="choice__opts">' + Object.keys(opts).map(function (k) {
      return '<label><input type="radio" name="' + name + '" value="' + k + '"' + (required ? " required" : "") + "><span>" + opts[k] + "</span></label>";
    }).join("") + "</div></fieldset>";
  }
  function checks(name, label, opts) {
    return '<fieldset class="choice"><legend>' + label + '</legend><div class="choice__opts">' + Object.keys(opts).map(function (k) {
      return '<label><input type="checkbox" name="' + name + '" value="' + k + '"><span>' + opts[k] + "</span></label>";
    }).join("") + "</div></fieldset>";
  }
  function communityBlock(task, tool) {
    var s = summaryFor(task.id, tool.id), state = summaryState(task.id, tool.id);
    if (state === "error") return '<p class="muted">' + S.fb.unavailable + "</p>";
    if (!s) return '<p class="muted">' + S.fb.loading + "</p>";
    var all = s.posts || [];
    var own = ownTokens();
    var r = s.rating;
    var h = '<div class="rating-sum">' + (r.n ? stars(r.avg) + " <strong>" + r.avg.toFixed(1) + "</strong> <span class=\"muted\">" + S.ratings(r.n) + "</span>" : '<span class="muted">' + S.noRatings + "</span>") + "</div>";
    // What people observed, aggregated across posts.
    if (all.length) {
      var counts = s.seen || {};
      var keys = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
      if (keys.length) h += '<ul class="seen-sum">' + keys.map(function (k) { return "<li>" + S.fb.seens[k] + " <b>" + counts[k] + "</b></li>"; }).join("") + "</ul>";
    }
    h += '<details class="post-form"' + (all.length ? "" : " open") + '><summary>' + S.experience + '</summary><form class="form" data-post>' +
      '<fieldset><legend>' + S.rate + '</legend><div class="star-input">' + [5, 4, 3, 2, 1].map(function (n) {
        return '<input type="radio" name="stars" id="star' + n + '" value="' + n + '" required><label for="star' + n + '" aria-label="' + n + ' / 5">★</label>';
      }).join("") + "</div></fieldset>" +
      "<label>" + S.yourRole + '<select name="role">' + D.tax.roles.map(function (x) { return '<option value="' + x.id + '"' + (x.id === st.role ? " selected" : "") + ">" + t(x) + "</option>"; }).join("") + "</select></label>" +
      '<div class="form-row"><label>' + S.fb.level + '<select name="level">' + Object.keys(S.fb.levels).map(function (k) { return '<option value="' + k + '">' + S.fb.levels[k] + "</option>"; }).join("") + "</select></label>" +
      "<label>" + S.fb.field + '<select name="field">' + Object.keys(S.fb.fields).map(function (k) { return '<option value="' + k + '">' + S.fb.fields[k] + "</option>"; }).join("") + "</select></label>" +
      "<label>" + S.fb.size + '<select name="size">' + Object.keys(S.fb.sizes).map(function (k) { return '<option value="' + k + '">' + S.fb.sizes[k] + "</option>"; }).join("") + "</select></label></div>" +
      radios("how", S.fb.how, S.fb.hows, true) + checks("seen", S.fb.seen, S.fb.seens) +
      "<label>" + S.fb.free + ' <span class="hint">' + S.fb.freeHint + '</span><textarea name="text" maxlength="1500" rows="3"></textarea></label>' +
      "<label>" + S.yourName + '<input name="name" maxlength="60" autocomplete="nickname"></label>' +
      '<label class="consent"><input type="checkbox" name="consent" required> <span>' + S.fb.consent + "</span></label>" +
      '<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<div><button type="submit" class="button">' + S.post + ' <span aria-hidden="true">→</span></button></div><p class="hint">' + S.fb.keep + '</p><output aria-live="polite"></output></form></details>';
    h += all.length ? all.map(function (p) {
      var isMine = !!own[p.id];
      var ctx = [S.fb.levels[p.level], S.fb.fields[p.field], S.fb.sizes[p.size]].filter(Boolean).join(" · ");
      return '<article class="post' + (isMine ? " post--mine" : "") + '" data-id="' + p.id + '"><header><b>' + esc(p.name || (LANG === "it" ? "Anonimo" : "Anonymous")) + "</b><span>" + t(D.roles[p.role]) + "</span><span>" + fmtDate(String(p.created).slice(0, 10)) + "</span>" + (p.stars ? stars(p.stars) : "") + (isMine ? '<span class="mine-tag">' + S.fb.yours + "</span>" : "") + "</header>" +
        (ctx ? '<p class="post__ctx">' + esc(ctx) + (p.how ? " · " + S.fb.hows[p.how] : "") + "</p>" : "") +
        ((p.seen || []).length ? '<ul class="post__seen">' + p.seen.map(function (k) { return "<li>" + S.fb.seens[k] + "</li>"; }).join("") + "</ul>" : "") +
        (p.text ? "<p>" + esc(p.text) + "</p>" : "") +
        (p.updates || []).map(function (u) { return '<div class="post__update"><span>' + S.fb.updateT + " · " + fmtDate(String(u.created).slice(0, 10)) + "</span><p>" + esc(u.text) + "</p></div>"; }).join("") +
        '<div class="post-actions">' + (isMine ? '<button type="button" class="change" data-update="' + p.id + '">' + S.fb.update + "</button>" : "") + '<button type="button" class="change" data-reply="' + p.id + '">' + S.reply + '</button><button type="button" class="change muted" data-flag="posts:' + p.id + '">' + S.fb.flag + "</button></div>" +
        ((p.replies || []).length ? '<div class="replies">' + p.replies.map(function (rp) { return '<div class="post"><header><b>' + esc(rp.name || (LANG === "it" ? "Anonimo" : "Anonymous")) + "</b><span>" + fmtDate(String(rp.created).slice(0, 10)) + '</span><button type="button" class="change muted" data-flag="replies:' + rp.id + '">' + S.fb.flag + "</button></header><p>" + esc(rp.text) + "</p></div>"; }).join("") + "</div>" : "") + "</article>";
    }).join("") : '<p class="muted">' + S.noPosts + "</p>";
    return h;
  }

  function wireAnalysis() {
    var links = main.querySelectorAll(".analysis__nav a");
    if (!links.length) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) links.forEach(function (a) { a.setAttribute("aria-current", a.getAttribute("href") === "#" + x.target.id ? "true" : "false"); }); });
    }, { rootMargin: "-25% 0px -65% 0px" });
    main.querySelectorAll(".analysis__body > section").forEach(function (s) { io.observe(s); });
  }

  function syncLang() {
    document.querySelectorAll(".nav__lang").forEach(function (a) { a.href = OTHER + location.search; });
  }

  // ─── Events ────────────────────────────────────────────────
  function onClick(e) {
    var b;
    if ((b = e.target.closest("[data-role]"))) { track("role", { role: b.dataset.role }); return go({ role: b.dataset.role, task: "", tool: "" }, "s-task"); }
    if ((b = e.target.closest("[data-task]"))) { accessFilter = ""; showGeneral = false; track("task", { role: st.role, task: b.dataset.task }); return go({ role: st.role, task: b.dataset.task, tool: "" }, "s-tools"); }
    if ((b = e.target.closest("[data-change]"))) {
      var c = b.dataset.change;
      if (c === "role") return go({ role: "", task: "", tool: "" }, "s-role");
      if (c === "task") return go({ role: st.role, task: "", tool: "" }, "s-task");
      if (c === "tool") return go({ role: st.role, task: st.task, tool: "" }, "s-tools");
    }
    if ((b = e.target.closest("[data-show-general]"))) { showGeneral = true; render(); return; }
    if ((b = e.target.closest("[data-access]"))) { accessFilter = b.dataset.access; render(); var f = $('[data-access="' + accessFilter + '"]'); if (f) f.focus(); return; }
    if ((b = e.target.closest("article[data-tool], button[data-tool]"))) { track("tool", { role: st.role, task: st.task, tool: b.dataset.tool }); return go({ role: st.role, task: st.task, tool: b.dataset.tool }, "s-analysis"); }
    if ((b = e.target.closest("[data-share]"))) {
      var out = b.nextElementSibling;
      track("share", { role: st.role, task: st.task, tool: st.tool });
      (navigator.clipboard ? navigator.clipboard.writeText(b.dataset.share) : Promise.reject()).then(function () { out.textContent = S.copied; }, function () { out.textContent = b.dataset.share; });
      return;
    }
    if ((b = e.target.closest("[data-check]"))) {
      var value = b.dataset.check, k1 = sumKey(st.task, null);
      send("/check", { task: st.task, role: st.role, value: value }).then(function (d) {
        SUM[k1] = Object.assign({}, summaryFor(st.task, null) || {}, d); rerender();
      }, function () { var o = $("[data-check-error]"); if (o) o.textContent = S.fb.error; });
      return;
    }
    if ((b = e.target.closest("[data-useful], [data-reason]"))) {
      var payload = { task: st.task, tool: st.tool, role: st.role };
      if (b.dataset.useful) payload.value = b.dataset.useful; else payload.reason = b.dataset.reason;
      send("/useful", payload).then(function () {
        var s2 = summaryFor(st.task, st.tool); if (s2) { s2.mine = s2.mine || {}; s2.mine.useful = Object.assign({}, s2.mine.useful || {}, payload.value ? { value: payload.value } : { reason: payload.reason }); }
        rerender();
      }, function () {});
      return;
    }
    if ((b = e.target.closest("[data-flag]"))) {
      var parts = b.dataset.flag.split(":");
      send("/" + parts[0] + "/" + parts[1] + "/flag", {}).then(function () { b.textContent = S.fb.flagged; b.disabled = true; }, function () {});
      return;
    }
    if ((b = e.target.closest("[data-update]"))) {
      var pa = b.closest(".post");
      if (pa.querySelector("form")) return;
      pa.insertAdjacentHTML("beforeend", '<form class="form" data-updateto="' + b.dataset.update + '" style="margin:10px 0 0"><label>' + S.fb.updatePh + '<textarea name="text" required maxlength="800"></textarea></label><div><button type="submit" class="button">' + S.fb.updateT + "</button></div></form>");
      pa.querySelector("form textarea").focus(); return;
    }
    if ((b = e.target.closest("[data-reply]"))) {
      var art = b.closest(".post");
      if (art.querySelector("form")) return;
      art.insertAdjacentHTML("beforeend", '<form class="form" data-replyto="' + b.dataset.reply + '" style="margin:10px 0 0"><label>' + S.replyPh + '<textarea name="text" required maxlength="800"></textarea></label><label>' + S.yourName + '<input name="name" maxlength="60"></label><div><button type="submit" class="button">' + S.reply + "</button></div></form>");
      art.querySelector("form textarea").focus();
    }
  }
  function onSubmit(e) {
    var f = e.target;
    var fail = function () { var o = f.querySelector("output"); if (o) o.textContent = S.fb.error; };
    var btn = f.querySelector('[type="submit"]');
    if (!f.matches("[data-post], [data-updateto], [data-report], [data-replyto]")) return;
    e.preventDefault();
    if (btn) btn.disabled = true;
    var done = function () { if (btn) btn.disabled = false; };
    var fd = new FormData(f);
    if (f.matches("[data-post]")) {
      send("/posts", { task: st.task, tool: st.tool, role: fd.get("role"), stars: Number(fd.get("stars")), level: fd.get("level"), field: fd.get("field"), size: fd.get("size"), how: fd.get("how"), seen: fd.getAll("seen"), text: String(fd.get("text") || ""), name: String(fd.get("name") || ""), consent: fd.get("consent") === "on", website: fd.get("website") || "" })
        .then(function (d) {
          if (d.id) { var own = ownTokens(); own[d.id] = d.editToken; store("commons.own", JSON.stringify(own)); }
          fetchSummary(st.task, st.tool, true); fetchSummary(st.task, null, true);
        }, function () { done(); fail(); });
    } else if (f.matches("[data-updateto]")) {
      var id = f.dataset.updateto;
      send("/posts/" + id + "/updates", { text: String(fd.get("text")) }, { "x-edit-token": ownTokens()[id] || "" }).then(function () { fetchSummary(st.task, st.tool, true); }, function () { done(); fail(); });
    } else if (f.matches("[data-replyto]")) {
      send("/posts/" + f.dataset.replyto + "/replies", { text: String(fd.get("text")), name: String(fd.get("name") || "") }).then(function () { fetchSummary(st.task, st.tool, true); }, function () { done(); fail(); });
    } else if (f.matches("[data-report]")) {
      send("/reports", { kind: f.dataset.report, role: st.role, task: st.task, tool: st.tool, what: String(fd.get("what")), link: String(fd.get("link") || ""), website: fd.get("website") || "" })
        .then(function () { done(); f.reset(); f.querySelector("output").textContent = S.fb.reportThanks; }, function () { done(); fail(); });
    }
  }

  // ─── Boot ──────────────────────────────────────────────────
  main = $("main[data-map]");
  if (!main) return;
  if (main.dataset.map !== "app") return;
  load().then(function () {
    readURL(); render();
    main.addEventListener("click", onClick);
    main.addEventListener("submit", onSubmit);
  }).catch(function (e) { main.innerHTML = '<p class="wrap" style="padding:40px 0">Could not load the map data. ' + esc(e.message) + "</p>"; });
})();
