import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { readFileSync } from "node:fs";

const quiz = require("../../landing/commons/ai-map/quiz.js");
const DATA = join(import.meta.dir, "..", "..", "landing", "commons", "ai-map", "data");
const read = (n: string) => JSON.parse(readFileSync(join(DATA, n + ".json"), "utf8"));
const tasks = read("tasks").tasks, tools = read("tools").tools, tax = read("taxonomy");
const byId = Object.fromEntries(tools.map((t: any) => [t.id, t]));
const base = { role: "student", tasks: ["s-understand"], stack: {}, data: "low", budget: "inst", tech: "unknown" };

describe("questionnaire: categories and data", () => {
  test("every tool falls in exactly one category and the named tools exist", () => {
    for (const id of ["chatgpt", "claude", "gemini-notebook", "mistral-vibe", "perplexity", "deepseek", "turnitin-ai", "gptzero"]) expect(byId[id]).toBeDefined();
    for (const t of tools) expect(quiz.CATS.map((c: any) => c.id)).toContain(quiz.catOf(t));
    expect(quiz.catOf(byId["turnitin-ai"])).toBe("teach");
    expect(quiz.catOf(byId["chatgpt"])).toBe("personal");
  });
  test("roles and options come from the taxonomy; every chosen task has tools", () => {
    expect(tax.roles.map((r: any) => r.id)).toEqual(["student", "teacher", "design"]);
    for (const r of tax.roles) expect(tasks.filter((t: any) => t.role === r.id).length).toBeGreaterThan(0);
  });
});

describe("questionnaire: ranking", () => {
  const rank = (a: any) => quiz.results(a, tasks, tools)[0];
  test("starts at 3 for declared and 2 for general-purpose tools, before any answer moves it", () => {
    // Institutional budget, public data and an unknown IT situation leave a closed institutional tool untouched.
    const t = byId["chatgpt-edu"];
    expect(quiz.score(t, "declared", base).score).toBe(3);
    expect(quiz.score(t, "kind", base).score).toBe(2);
  });
  test("a category you use adds 4, one you have adds 3, one you lack subtracts 3 unless the budget is institutional", () => {
    const t = byId["chatgpt-edu"];
    const s = (stack: any, budget = "inst") => quiz.score(t, "declared", { ...base, budget, stack }).score;
    const plain = s({});
    expect(s({ edu: "use" })).toBe(plain + 4);
    expect(s({ edu: "avail" })).toBe(plain + 3);
    expect(s({ edu: "unknown" })).toBe(plain);
    expect(s({ edu: "no" }, "inst")).toBe(plain);
    expect(s({ edu: "no" }, "some") - s({}, "some")).toBe(-3);
  });
  test("personal data favours open weights and institutional contracts over personal accounts", () => {
    const open = tools.find((t: any) => t.access === "open-weights"), personal = byId["chatgpt"], inst = byId["chatgpt-edu"];
    const s = (t: any, data: string) => quiz.score(t, "declared", { ...base, data, budget: "inst" }).score;
    expect(s(open, "high") - s(open, "low")).toBe(3);
    expect(s(inst, "high") - s(inst, "low")).toBe(2);
    expect(s(personal, "high") - s(personal, "low")).toBe(-3);
    expect(s(personal, "mid") - s(personal, "low")).toBe(-1);
  });
  test("free budget favours free tools and penalises paid ones that are not available", () => {
    const paid = tools.find((t: any) => t.pricing === "paid"), free = tools.find((t: any) => t.pricing === "free");
    const s = (t: any, budget: string, stack: any = {}) => quiz.score(t, "declared", { ...base, budget, stack }).score;
    expect(s(free, "free") - s(free, "inst")).toBe(2);
    expect(s(paid, "free") - s(paid, "inst")).toBe(-3);
    expect(s(paid, "free", { [quiz.catOf(paid)]: "use" }) - s(paid, "inst", { [quiz.catOf(paid)]: "use" })).toBe(0);
  });
  test("open-weights tools: +1 with IT support, -4 without", () => {
    const open = tools.find((t: any) => t.access === "open-weights");
    const s = (tech: string) => quiz.score(open, "declared", { ...base, tech }).score;
    expect(s("yes") - s("unknown")).toBe(1);
    expect(s("no") - s("unknown")).toBe(-4);
  });
  test("results give at most three top tools, all tools grouped by category, and reasons for each", () => {
    for (const r of quiz.results({ ...base, tasks: tasks.filter((t: any) => t.role === "teacher").slice(0, 3).map((t: any) => t.id) }, tasks, tools)) {
      expect(r.top.length).toBeLessThanOrEqual(3);
      expect(r.groups.flatMap((g: any) => g.items).length).toBe(r.total);
      for (const t of r.top) expect(t.why.every((w: any) => Array.isArray(w) && typeof w[0] === "string")).toBe(true);
    }
  });
  test("unknown task ids are ignored", () => {
    expect(quiz.results({ ...base, tasks: ["nope"] }, tasks, tools)).toEqual([]);
  });
});
