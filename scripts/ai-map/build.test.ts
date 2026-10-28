import { expect, test } from "bun:test";
import { buildData, P } from "./build";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

test("map data: every reference resolves, every text is bilingual", () => {
  const d = buildData();
  expect(d.errors).toEqual([]);
  expect(d.tasks.length).toBeGreaterThan(20);
  for (const role of ["student", "teacher", "design"]) expect(d.tasks.some((t: any) => t.role === role)).toBe(true);
});

test("map data: the five JSON files the map loads are committed, not ignored, and match the build", () => {
  const dir = join(import.meta.dir, "..", "..", "landing", "commons", "ai-map", "data");
  const d = buildData();
  for (const n of ["taxonomy", "tasks", "tools", "sources", "regulation"]) {
    const f = join(dir, n + ".json");
    expect(existsSync(f)).toBe(true);
    expect(JSON.parse(readFileSync(f, "utf8"))).toBeTruthy();
    // exit 1 = not ignored (--no-index also checks tracked files); the deploy ships the tag, so ignored data never reaches production
    expect(Bun.spawnSync(["git", "check-ignore", "--no-index", "-q", f]).exitCode).toBe(1);
    // and tracked by git, so it is in the tag
    expect(Bun.spawnSync(["git", "ls-files", "--error-unmatch", f]).exitCode).toBe(0);
  }
  expect(JSON.parse(readFileSync(join(dir, "tasks.json"), "utf8")).tasks.length).toBe(d.tasks.length);
});

test("map.js: the anonymous id is created only by writes, never by reading a summary", () => {
  const src = readFileSync(join(import.meta.dir, "..", "..", "landing", "commons", "ai-map", "map.js"), "utf8");
  expect(src.match(/\bclientId\(\)/g)!.length).toBe(2); // its definition and the single call in send()
  const send = src.slice(src.indexOf("function send("), src.indexOf("function track("));
  expect(send).toContain("clientId()");
  const read = src.slice(src.indexOf("function fetchSummary("), src.indexOf("function send("));
  expect(read).not.toMatch(/[^d]clientId\(\)/);
  expect(read).toContain("savedClientId()");
});

test("the quiz is the way into the AI Map; the full map and the old questionnaire addresses are where the pages say", () => {
  const root = join(import.meta.dir, "..", "..", "landing");
  const html = (p: string) => readFileSync(join(root, p, "index.html"), "utf8");
  for (const lang of ["en", "it"] as const) {
    expect(html(P.quiz[lang])).toContain('data-map="quiz"');
    expect(html(P.map[lang])).toContain('data-map="app"');
    const old = html(P.legacyQuiz[lang]);
    expect(old).toContain(`url=${P.quiz[lang]}`);
    expect(old).toContain("noindex");
    // a redirect keeps the query and the fragment, so a shared link does not lose its role and task
    expect(old).toContain("location.search + location.hash");
  }
  // quiz.js and map.js use the same explore address, in both languages
  const quiz = readFileSync(join(root, "commons", "ai-map", "quiz.js"), "utf8"), map = readFileSync(join(root, "commons", "ai-map", "map.js"), "utf8");
  for (const src of [quiz, map]) for (const p of [P.map.en, P.map.it]) expect(src).toContain(p);
  // the result links into the map with the same query the map writes
  expect(quiz).toContain('"?role=" + encodeURIComponent(state.a.role) + "&task="');
});
