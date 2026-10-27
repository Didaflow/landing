import { describe, expect, test, beforeEach } from "bun:test";
import { join } from "node:path";
import { createApi } from "./api";

const DATA = join(import.meta.dir, "..", "..", "landing", "commons", "ai-map", "data");
const BASE = "http://x/api/commons";
let api: ReturnType<typeof createApi>;
beforeEach(() => { api = createApi({ dbPath: ":memory:", dataDir: DATA, adminToken: "secret" }); });

const post = (path: string, body: unknown, headers: Record<string, string> = {}, ip = "1.1.1.1") =>
  api(new Request(BASE + path, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) }), ip);
const get = (path: string, headers: Record<string, string> = {}) => api(new Request(BASE + path, { headers }), "1.1.1.1");
const client = (n: number) => ({ "x-commons-client": "client-" + String(n).padStart(12, "0") });
const experience = { task: "t-feedback", tool: "feedbackfruits-acai", role: "teacher", stars: 4, how: "protocol", seen: ["time", "errors", "nonsense"], consent: true };

describe("practice vs evidence", () => {
  test("aggregate stays hidden below ten answers, and one answer per browser", async () => {
    for (let i = 0; i < 9; i++) await post("/check", { task: "t-feedback", role: "teacher", value: "yes" }, client(i));
    await post("/check", { task: "t-feedback", role: "teacher", value: "no" }, client(0)); // changes its answer, does not add one
    let s = await (await get("/summary?task=t-feedback", client(0)))!.json();
    expect(s.checks).toEqual({ n: 9, shown: false });
    expect(s.mine.check).toBe("no");
    await post("/check", { task: "t-feedback", role: "student", value: "partly" }, client(99));
    s = await (await get("/summary?task=t-feedback"))!.json();
    expect(s.checks).toMatchObject({ n: 10, shown: true, yes: 8, partly: 1, no: 1 });
  });
  test("'not tried' never counts", async () => {
    await post("/check", { task: "t-feedback", role: "teacher", value: "untried" }, client(1));
    const s = await (await get("/summary?task=t-feedback"))!.json();
    expect(s.checks.n).toBe(0);
  });
  test("rejects unknown tasks, values and missing client", async () => {
    expect((await post("/check", { task: "nope", role: "teacher", value: "yes" }, client(1)))!.status).toBe(400);
    expect((await post("/check", { task: "t-feedback", role: "teacher", value: "maybe" }, client(1)))!.status).toBe(400);
    expect((await post("/check", { task: "t-feedback", role: "teacher", value: "yes" }))!.status).toBe(400);
  });
});

describe("experiences", () => {
  test("needs consent and valid stars; unknown observations are dropped", async () => {
    expect((await post("/posts", { ...experience, consent: false }))!.status).toBe(400);
    expect((await post("/posts", { ...experience, stars: 7 }))!.status).toBe(400);
    const r = await post("/posts", experience);
    expect(r!.status).toBe(201);
    const s = await (await get("/summary?task=t-feedback&tool=feedbackfruits-acai"))!.json();
    expect(s.posts[0].seen).toEqual(["time", "errors"]);
    expect(s.rating).toEqual({ n: 1, avg: 4 });
    expect(s.seen).toEqual({ time: 1, errors: 1 });
    expect(JSON.stringify(s)).not.toContain("edit_hash");
  });
  test("task summary carries ratings per tool for the comparison", async () => {
    await post("/posts", experience);
    const s = await (await get("/summary?task=t-feedback"))!.json();
    expect(s.ratings["feedbackfruits-acai"]).toEqual({ n: 1, avg: 4 });
  });
  test("only the author can add how it went", async () => {
    const { id, editToken } = await (await post("/posts", experience))!.json();
    expect((await post(`/posts/${id}/updates`, { text: "Later" }, { "x-edit-token": "wrong" }))!.status).toBe(403);
    expect((await post(`/posts/${id}/updates`, { text: "Later" }, { "x-edit-token": editToken }))!.status).toBe(201);
    const s = await (await get("/summary?task=t-feedback&tool=feedbackfruits-acai"))!.json();
    expect(s.posts[0].updates[0].text).toBe("Later");
  });
  test("a browser flags a contribution once; flags never hide it, they queue it for the moderator", async () => {
    const { id } = await (await post("/posts", experience))!.json();
    for (let i = 0; i < 5; i++) await post(`/posts/${id}/flag`, {}, client(1));
    await post(`/posts/${id}/flag`, {}, client(2));
    let s = await (await get("/summary?task=t-feedback&tool=feedbackfruits-acai"))!.json();
    expect(s.posts.length).toBe(1);
    const o = await (await get("/admin/overview", { authorization: "Bearer secret" }))!.json();
    expect(o.posts[0]).toMatchObject({ id, flags: 2, status: "visible" });
    expect((await post(`/posts/${id}/flag`, {}))!.status).toBe(400); // no browser id, no flag
  });
  test("the moderator hides a flagged post and restoring it clears the flags", async () => {
    const { id } = await (await post("/posts", experience))!.json();
    await post(`/posts/${id}/flag`, {}, client(1));
    await post(`/admin/posts/${id}`, { status: "hidden" }, { authorization: "Bearer secret" });
    let s = await (await get("/summary?task=t-feedback&tool=feedbackfruits-acai"))!.json();
    expect(s.posts.length).toBe(0);
    await post(`/admin/posts/${id}`, { status: "visible" }, { authorization: "Bearer secret" });
    s = await (await get("/summary?task=t-feedback&tool=feedbackfruits-acai"))!.json();
    expect(s.posts.length).toBe(1);
    const o = await (await get("/admin/overview", { authorization: "Bearer secret" }))!.json();
    expect(o.posts[0].flags).toBe(0);
  });
  test("updates can be flagged and hidden by the moderator, and appear in the queue", async () => {
    const { id, editToken } = await (await post("/posts", experience))!.json();
    await post(`/posts/${id}/updates`, { text: "Spam" }, { "x-edit-token": editToken });
    const o1 = await (await get("/admin/overview", { authorization: "Bearer secret" }))!.json();
    const u = o1.updates[0];
    await post(`/updates/${u.id}/flag`, {}, client(3));
    await post(`/admin/updates/${u.id}`, { status: "hidden" }, { authorization: "Bearer secret" });
    const s = await (await get("/summary?task=t-feedback&tool=feedbackfruits-acai"))!.json();
    expect(s.posts[0].updates.length).toBe(0);
  });
  test("honeypot submissions are accepted silently and not stored", async () => {
    await post("/posts", { ...experience, website: "http://spam" });
    const s = await (await get("/summary?task=t-feedback&tool=feedbackfruits-acai"))!.json();
    expect(s.posts.length).toBe(0);
  });
});

describe("reports, usage and limits", () => {
  test("reports and events are stored; events only as daily counters", async () => {
    expect((await post("/reports", { kind: "study", what: "A study", link: "10.1/x", task: "t-feedback" }))!.status).toBe(201);
    await post("/events", { kind: "task", role: "teacher", task: "t-feedback" });
    await post("/events", { kind: "task", role: "teacher", task: "t-feedback" });
    const o = await (await get("/admin/overview", { authorization: "Bearer secret" }))!.json();
    expect(o.reports[0].what).toBe("A study");
    expect(o.usage[0]).toMatchObject({ kind: "task", task: "t-feedback", n: 2 });
  });
  test("admin needs the token", async () => {
    expect((await get("/admin/overview"))!.status).toBe(401);
    expect((await get("/admin/overview", { authorization: "Bearer nope!" }))!.status).toBe(401);
  });
  test("writes are rate limited per address", async () => {
    const limited = createApi({ dbPath: ":memory:", dataDir: DATA, writeLimit: 2 });
    const send = () => limited(new Request(BASE + "/events", { method: "POST", body: JSON.stringify({ kind: "role", role: "student" }) }), "9.9.9.9");
    expect((await send())!.status).toBe(200);
    expect((await send())!.status).toBe(200);
    expect((await send())!.status).toBe(429);
  });
  test("CSV export never includes hashes", async () => {
    await post("/posts", experience);
    const r = await get("/admin/export/posts.csv", { authorization: "Bearer secret" });
    const text = await r!.text();
    expect(text.split("\n")[0]).not.toContain("edit_hash");
    expect(text).toContain("feedbackfruits-acai");
  });
  test("CSV export neutralises spreadsheet formulas in user text", async () => {
    await post("/posts", { ...experience, text: '=HYPERLINK("http://x","ok")', name: "+cmd" });
    const text = await (await get("/admin/export/posts.csv", { authorization: "Bearer secret" }))!.text();
    expect(text).toContain(`"'=HYPERLINK(""http://x"",""ok"")"`);
    expect(text).toContain("'+cmd");
  });
  test("a carriage return does not let a formula through the CSV export", async () => {
    await post("/posts", { ...experience, text: "ok\r=1+1" });
    const text = await (await get("/admin/export/posts.csv", { authorization: "Bearer secret" }))!.text();
    expect(text).toContain(`"ok\r=1+1"`);
  });
  test("flags on a numeric id count once, whatever its spelling", async () => {
    const { id, editToken } = await (await post("/posts", experience))!.json();
    await post(`/posts/${id}/updates`, { text: "Later" }, { "x-edit-token": editToken });
    const o = await (await get("/admin/overview", { authorization: "Bearer secret" }))!.json();
    const u = o.updates[0].id;
    for (const spelling of [String(u), "0" + u, "00" + u]) await post(`/updates/${spelling}/flag`, {}, client(4));
    const o2 = await (await get("/admin/overview", { authorization: "Bearer secret" }))!.json();
    expect(o2.updates[0].flags).toBe(1);
    // Exponent spellings would reach the same row in SQLite but not in the flags table: they are refused.
    expect((await post(`/updates/${u}e0/flag`, {}, client(5)))!.status).toBe(404);
    expect((await post(`/updates/${u}E0/flag`, {}, client(5)))!.status).toBe(404);
  });
  test("oversized bodies are refused before they are read", async () => {
    const r = await api(new Request(BASE + "/events", { method: "POST", headers: { "content-length": "100000" }, body: "{}" }), "1.1.1.1");
    expect(r!.status).toBe(413);
  });
});

describe("retention and deletion", () => {
  let clock = new Date("2026-01-15T10:00:00Z");
  const auth = { authorization: "Bearer secret" };
  const counts = async () => (await (await get("/admin/overview", auth))!.json()).counts;
  beforeEach(() => {
    clock = new Date("2026-01-15T10:00:00Z");
    api = createApi({ dbPath: ":memory:", dataDir: DATA, adminToken: "secret", now: () => clock });
  });
  const fill = async (n: number) => {
    const { id, editToken } = await (await post("/posts", experience))!.json();
    await post(`/posts/${id}/updates`, { text: "later" }, { "x-edit-token": editToken });
    await post(`/posts/${id}/replies`, { text: "reply" });
    await post(`/posts/${id}/flag`, {}, client(n));
    await post("/check", { task: "t-feedback", role: "teacher", value: "yes" }, client(n));
    await post("/useful", { task: "t-feedback", tool: "feedbackfruits-acai", role: "teacher", value: "yes" }, client(n));
    await post("/reports", { kind: "tool", what: "missing tool" });
    await post("/events", { kind: "role", role: "teacher" });
    return id;
  };

  test("purge deletes everything older than the period, with what hangs off it, and keeps the anonymous counters", async () => {
    await fill(1);
    clock = new Date("2027-12-15T10:00:00Z"); // 23 months later: nothing is due
    expect(await api.purge(24)).toMatchObject({ posts: 0, checks: 0, useful: 0, reports: 0 });
    expect(await counts()).toMatchObject({ checks: 1, useful: 1, posts: 1, replies: 1 });
    clock = new Date("2028-01-16T10:00:00Z"); // past 24 months
    expect(api.purge(24)).toMatchObject({ posts: 1, checks: 1, useful: 1, reports: 1 });
    expect(await counts()).toMatchObject({ checks: 0, useful: 0, posts: 0, replies: 0, reportsOpen: 0 });
    const flags = await (await get("/admin/export/flags.csv", auth))!.text();
    expect(flags).toBe("");
    const events = await (await get("/admin/export/events.csv", auth))!.text();
    expect(events).toContain("role");
  });
  test("an answer counts from its last change, newer contributions stay", async () => {
    await fill(1);
    clock = new Date("2027-06-01T10:00:00Z");
    await post("/check", { task: "t-feedback", role: "teacher", value: "no" }, client(1)); // changes the answer
    await fill(2);
    clock = new Date("2028-01-16T10:00:00Z");
    const out = api.purge(24);
    expect(out.posts).toBe(1); // only the first post is past the period
    expect(out.checks).toBe(0); // the answer was changed in June 2027
    const c = await counts();
    expect(c.posts).toBe(1);
    expect(c.checks).toBe(2);
  });
  test("month arithmetic stays on the calendar: 31 March minus one month is 28 February", async () => {
    clock = new Date("2026-02-28T10:00:00Z");
    await post("/reports", { kind: "tool", what: "end of february" });
    clock = new Date("2026-03-01T12:00:00Z");
    await post("/reports", { kind: "tool", what: "first of march" });
    clock = new Date("2026-03-31T12:00:00Z");
    expect(api.purge(1)).toMatchObject({ reports: 1 }); // cut-off is 28 Feb 12:00: the 10:00 report goes, 1 March stays
    expect((await counts()).reportsOpen).toBe(1);
  });
  test("flags of replies and updates go with them and never touch another kind with the same number", async () => {
    const a = await (await post("/posts", experience))!.json();
    await post(`/posts/${a.id}/updates`, { text: "u" }, { "x-edit-token": a.editToken });
    await post(`/posts/${a.id}/replies`, { text: "r" });
    await post("/updates/1/flag", {}, client(1));
    await post("/replies/1/flag", {}, client(2));
    clock = new Date("2026-06-01T10:00:00Z");
    const b = await (await post("/posts", experience))!.json();
    await post(`/posts/${b.id}/replies`, { text: "r2" }); // reply 2, newer
    await post("/replies/2/flag", {}, client(3));
    clock = new Date("2028-02-01T10:00:00Z"); // only the January 2026 items are past 24 months
    api.purge(24);
    const csv = await (await get("/admin/export/flags.csv", auth))!.text();
    expect(csv.trim().split("\n").length).toBe(2); // header + the flag on reply 2
    expect(csv).toContain("replies,2");
    expect((await counts()).replies).toBe(1);
  });
  test("the period is a whole number of months, at least one", () => {
    for (const bad of [0, -1, 1.5, NaN]) expect(() => api.purge(bad)).toThrow();
  });
  test("the moderator deletes a post for good, with its replies, updates and flags", async () => {
    const id = await fill(1);
    expect((await api(new Request(BASE + `/admin/posts/${id}`, { method: "DELETE" }), "1.1.1.1"))!.status).toBe(401);
    expect((await api(new Request(BASE + `/admin/posts/${id}`, { method: "DELETE", headers: auth }), "1.1.1.1"))!.status).toBe(200);
    expect(await counts()).toMatchObject({ posts: 0, replies: 0 });
    expect(await (await get("/admin/export/updates.csv", auth))!.text()).toBe("");
    expect(await (await get("/admin/export/flags.csv", auth))!.text()).toBe("");
    expect((await api(new Request(BASE + `/admin/posts/${id}`, { method: "DELETE", headers: auth }), "1.1.1.1"))!.status).toBe(404);
  });
  test("the moderator deletes a single reply, update or report", async () => {
    const id = await fill(1);
    const o = await (await get("/admin/overview", auth))!.json();
    for (const [k, row] of [["replies", o.replies[0]], ["updates", o.updates[0]], ["reports", o.reports[0]]] as const) {
      expect((await api(new Request(BASE + `/admin/${k}/${row.id}`, { method: "DELETE", headers: auth }), "1.1.1.1"))!.status).toBe(200);
    }
    const o2 = await (await get("/admin/overview", auth))!.json();
    expect([o2.replies.length, o2.updates.length, o2.reports.length]).toEqual([0, 0, 0]);
    expect(o2.posts.length).toBe(1);
    expect((await api(new Request(BASE + `/admin/replies/1e0`, { method: "DELETE", headers: auth }), "1.1.1.1"))!.status).toBe(404);
    void id;
  });
});
