import { expect, test } from "bun:test";
import { buildData } from "./build";

test("map data: every reference resolves, every text is bilingual", () => {
  const d = buildData();
  expect(d.errors).toEqual([]);
  expect(d.tasks.length).toBeGreaterThan(20);
  for (const role of ["student", "teacher", "design"]) expect(d.tasks.some((t: any) => t.role === role)).toBe(true);
});
