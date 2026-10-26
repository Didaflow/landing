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
