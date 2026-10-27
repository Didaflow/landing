import { expect, test } from "bun:test";
import { buildData } from "./build";
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
