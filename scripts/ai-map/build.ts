// Builds Didaflow Commons: the AI Map data and the HTML pages, EN and IT.
//   content/ai-map/research/*.json + taxonomy.json + extra-tasks.json  →  landing/commons/ai-map/data/*.json
//   content/ai-map/pages/*.html                                          →  landing/commons/** and landing/it/commons/**
// Checks every reference (sources, tasks, tools, rules) and fails with a list of problems.
// Run: bun run build:map
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");
const CONTENT = join(ROOT, "content", "ai-map");
const LANDING = join(ROOT, "landing");
const OUT = join(LANDING, "commons", "ai-map", "data");

export function buildData() {
  const R = (n: string) => { const f = join(CONTENT, "research", n + ".json"); return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null; };
  const tax = JSON.parse(readFileSync(join(CONTENT, "taxonomy.json"), "utf8"));
  const errors: string[] = [], warnings: string[] = [];

  // Sources: union of every file, first definition wins, conflicts reported.
  const sources = new Map<string, any>();
  const addSources = (list: any[] = [], from: string) => {
    for (const s of list) {
      if (!s?.id) continue;
      const prev = sources.get(s.id);
      if (prev && (prev.doi || prev.url) !== (s.doi || s.url)) warnings.push(`source id clash ${s.id} (${from})`);
      if (!prev) sources.set(s.id, s);
    }
  };

  const tasks: any[] = [];
  for (const r of ["student", "teacher", "design"]) {
    const f = R(r); if (!f) { warnings.push(`research/${r}.json missing`); continue; }
    addSources(f.sources, r);
    for (const t of f.tasks) tasks.push({ ...t, role: r, dates: { literatureSearch: "2026-10-22", editorialReview: null } });
  }
  // Editor-added tasks (outside the research files).
  const extra = JSON.parse(readFileSync(join(CONTENT, "extra-tasks.json"), "utf8"));
  for (const t of extra.tasks) tasks.push({ ...t, dates: { literatureSearch: null, editorialReview: null } });
  const toolsFile = R("tools"); const tools = toolsFile?.tools ?? [];
  addSources(toolsFile?.sources, "tools");
  if (toolsFile?.landscape?.accessModes) tax.accessModes = toolsFile.landscape.accessModes.map((m: any) => ({ id: m.id, en: m.title.en, it: m.title.it, text: m.text, examples: m.examples }));
  const reg = R("regulation") ?? { rules: [], taskFlags: [], sources: [] };
  addSources(reg.sources, "regulation");

  // Tools for each task: declared by the provider, or of a kind used for the task in the studies.
  for (const t of tasks) {
    t.tools = [];
    for (const x of tools) {
      if ((x.tasks || []).includes(t.id)) t.tools.push({ id: x.id, fit: "declared" });
      else if ((x.types || []).some((ty: string) => (t.toolTypes || []).includes(ty))) t.tools.push({ id: x.id, fit: "kind" });
    }
  }

  // ─── Integrity ───────────────────────────────────────────
  const taskIds = new Set(tasks.map((t) => t.id));
  const levels = new Set(tax.evidenceLevels.map((l: any) => l.id));
  const outcomes = new Set(tax.outcomes.map((o: any) => o.id));
  const types = new Set(tax.toolTypes.map((x: any) => x.id));
  const bi = (v: any, w: string) => { if (!v || typeof v !== "object" || !v.en || !v.it) errors.push(`${w}: needs en and it`); };
  const cites = (ids: any, w: string) => (ids || []).forEach((id: string) => sources.has(id) || errors.push(`${w}: unknown source ${id}`));
  if (taskIds.size !== tasks.length) errors.push("duplicate task ids");
  for (const t of tasks) {
    const w = `task ${t.id}`;
    ["title", "question", "verdict"].forEach((k) => bi(t[k], `${w}.${k}`));
    if (!levels.has(t.evidenceLevel)) errors.push(`${w}: evidence level ${t.evidenceLevel}`);
    (t.outcomesMeasured || []).forEach((o: string) => outcomes.has(o) || warnings.push(`${w}: unknown outcome ${o}`));
    (t.findings || []).forEach((f: any, i: number) => { cites([f.source], `${w}.findings[${i}]`); bi(f.finding, `${w}.findings[${i}]`); });
    [...(t.benefits || []), ...(t.risks || []), ...(t.noAI || [])].forEach((c: any, i: number) => cites(c.sources, `${w} claim ${i}`));
    (t.benefits || []).concat(t.risks || []).filter((c: any) => c.kind === "research").forEach((c: any) => { if (!c.sources?.length) errors.push(`${w}: research claim without source`); });
    (t.toolTypes || []).forEach((x: string) => types.has(x) || warnings.push(`${w}: unknown tool type ${x}`));
  }
  for (const x of tools) {
    const w = `tool ${x.id}`;
    cites(x.sources, w);
    (x.tasks || []).forEach((id: string) => taskIds.has(id) || warnings.push(`${w}: unknown task ${id}`));
    (x.types || []).forEach((ty: string) => types.has(ty) || warnings.push(`${w}: unknown type ${ty}`));
  }
  for (const r of reg.rules) cites(r.sources, `rule ${r.id}`);
  for (const f of reg.taskFlags) (f.rules || []).forEach((id: string) => reg.rules.some((r: any) => r.id === id) || errors.push(`flag ${f.task}: unknown rule ${id}`));
  for (const s of sources.values()) if (!s.doi && !s.url) errors.push(`source ${s.id}: no DOI or URL`);
  for (const t of tasks) if (!t.tools.length) warnings.push(`task ${t.id}: no tool linked`);

  return { tax, tasks, tools, sources: [...sources.values()], reg, errors, warnings };
}

// ─── Pages ────────────────────────────────────────────────────
type Lang = "en" | "it";
export const P = {
  hub: { en: "/commons/", it: "/it/commons/" },
  // The quiz is the way in; the full map lives one level down.
  quiz: { en: "/commons/ai-map/", it: "/it/commons/ai-map/" },
  map: { en: "/commons/ai-map/explore/", it: "/it/commons/ai-map/esplora/" },
  method: { en: "/commons/ai-map/method/", it: "/it/commons/ai-map/method/" },
  // Old questionnaire addresses: small pages that send people to the new entry.
  legacyQuiz: { en: "/commons/ai-map/questionnaire/", it: "/it/commons/ai-map/questionario/" },
};
const T = {
  en: { quiz: "AI Map: your path", quizDesc: "Answer six questions, one at a time, and see which AI tools fit your tasks, with the evidence and the rules. Everything stays in your browser.", redirect: "This page has moved to", hub: "Commons", hubDesc: "Open tools by Didaflow for the education community.", map: "AI Map", mapDesc: "Which AI tools fit which tasks in higher education: evidence, rules and experience.", method: "How the AI Map works" },
  it: { quiz: "Mappa AI: il tuo percorso", quizDesc: "Rispondi a sei domande, una alla volta, e vedi quali strumenti AI sono adatti alle tue attività, con evidenze e regole. Tutto resta nel tuo browser.", redirect: "Questa pagina si è spostata su", hub: "Commons", hubDesc: "Strumenti aperti di Didaflow per la comunità educativa.", map: "Mappa AI", mapDesc: "Quali strumenti AI per quali compiti nell’istruzione superiore: evidenze, regole ed esperienze.", method: "Come funziona la Mappa AI" },
};

function page(lang: Lang, o: { path: Record<Lang, string>; title: string; desc: string; kind: string; body?: string; v: string }) {
  return `<!DOCTYPE html>
<html lang="${lang}" data-theme="auto">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${o.desc}" />
  <meta name="robots" content="noindex" />
  <meta name="theme-color" content="#FCFAF7" />
  <link rel="canonical" href="https://didaflow.ai${o.path[lang]}" />
  <link rel="alternate" hreflang="en" href="https://didaflow.ai${o.path.en}" />
  <link rel="alternate" hreflang="it" href="https://didaflow.ai${o.path.it}" />
  <link rel="alternate" hreflang="x-default" href="https://didaflow.ai${o.path.en}" />
  <link rel="icon" href="/_assets/static/favicon.svg" type="image/svg+xml" />
  <link rel="icon" href="/_assets/static/favicon.ico" />
  <link rel="stylesheet" href="/_assets/css/fonts-didaflow.css" />
  <link rel="stylesheet" href="/_assets/css/tokens.css" />
  <link rel="stylesheet" href="/_assets/css/primitives.css" />
  <link rel="stylesheet" href="/assets/css/didaflow-tokens.css" />
  <link rel="stylesheet" href="/assets/css/landing-tokens.css" />
  <link rel="stylesheet" href="/assets/css/site.css" />
  <link rel="stylesheet" href="/assets/css/editorial.css" />
  <link rel="stylesheet" href="/commons/commons.css?v=${o.v}" />
  <title>${o.title} · didaflow</title>
</head>
<body class="page-editorial commons">
  <a href="#main" class="skip-link">${lang === "it" ? "Vai al contenuto" : "Skip to content"}</a>
  <script src="/assets/js/site-chrome.js"></script>
  <script>document.currentScript.insertAdjacentHTML("beforebegin", DidaflowChrome.header());</script>
  <main id="main" data-map="${o.kind}">${o.body ?? ""}</main>
  <script>document.currentScript.insertAdjacentHTML("beforebegin", DidaflowChrome.footer());</script>
  <script src="/scripts/main.js" defer></script>
  <script src="/commons/ai-map/${o.kind === "quiz" ? "quiz" : "map"}.js?v=${o.v}" defer></script>
</body>
</html>
`;
}

// A static redirect: meta refresh and a script for browsers, a plain link for everyone else. Never indexed.
function redirect(lang: Lang, to: string) {
  return `<!DOCTYPE html>
<html lang="${lang}" data-theme="auto">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <meta http-equiv="refresh" content="0; url=${to}" />
  <link rel="canonical" href="https://didaflow.ai${to}" />
  <title>${T[lang].quiz} · didaflow</title>
</head>
<body>
  <p>${T[lang].redirect} <a href="${to}">${to}</a></p>
  <script>location.replace(${JSON.stringify(to)} + location.hash);</script>
</body>
</html>
`;
}

export function buildPages(v: string) {
  const out = (path: string, html: string) => {
    const f = join(LANDING, path, "index.html");
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, html);
  };
  const body = (name: string, lang: Lang) => readFileSync(join(CONTENT, "pages", `${name}.${lang}.html`), "utf8");
  for (const lang of ["en", "it"] as Lang[]) {
    out(P.hub[lang], page(lang, { path: P.hub, title: T[lang].hub, desc: T[lang].hubDesc, kind: "hub", body: body("hub", lang), v }));
    out(P.map[lang], page(lang, { path: P.map, title: T[lang].map, desc: T[lang].mapDesc, kind: "app", v }));
    out(P.method[lang], page(lang, { path: P.method, title: T[lang].method, desc: T[lang].mapDesc, kind: "method", body: body("method", lang), v }));
    out(P.quiz[lang], page(lang, { path: P.quiz, title: T[lang].quiz, desc: T[lang].quizDesc, kind: "quiz", v }));
    out(P.legacyQuiz[lang], redirect(lang, P.quiz[lang]));
  }
}

if (import.meta.main) {
  const d = buildData();
  console.log(`${d.tasks.length} tasks · ${d.tools.length} tools · ${d.sources.length} sources · ${d.reg.rules.length} rules`);
  if (d.warnings.length) console.log("warnings:\n  " + d.warnings.join("\n  "));
  if (d.errors.length) { console.error("errors:\n  " + d.errors.join("\n  ")); process.exit(1); }
  mkdirSync(OUT, { recursive: true });
  const write = (n: string, v: any) => writeFileSync(join(OUT, n + ".json"), JSON.stringify(v, null, 1) + "\n");
  write("taxonomy", d.tax);
  write("tasks", { tasks: d.tasks });
  write("tools", { tools: d.tools });
  write("sources", { sources: d.sources });
  write("regulation", { rules: d.reg.rules, taskFlags: d.reg.taskFlags });
  buildPages(Date.now().toString(36));
  console.log("ok: data and pages written to landing/commons");
}
