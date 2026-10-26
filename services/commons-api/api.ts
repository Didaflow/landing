// Commons API: contributions to the AI Map, stored in one SQLite file on Didaflow's server.
// No accounts, no email, no cookies, no IP addresses stored. Bun only (bun:sqlite), no dependencies.
//
//   GET  /api/commons/summary?task=&tool=        what people say (aggregates + visible posts)
//   POST /api/commons/check                       does practice match the evidence? (one per browser and task)
//   POST /api/commons/useful                      was this analysis useful? + reason
//   POST /api/commons/posts                       structured experience → { id, editToken }
//   POST /api/commons/posts/:id/updates           "how it went" (needs the edit token)
//   POST /api/commons/posts/:id/replies           reply
//   POST /api/commons/{posts|replies|updates}/:id/flag  report a contribution (once per browser; the moderator decides)
//   POST /api/commons/reports                     something missing (task, tool, study)
//   POST /api/commons/events                      cookieless usage counters (daily aggregates only)
//   /api/commons/admin/*                          moderation and CSV export (Bearer token)
import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const CHECK = ["yes", "partly", "no", "untried"];
const USEFUL = ["yes", "no"];
const REASONS = ["changed", "confirmed", "missingTool", "tooTechnical", "unclear"];
const LEVELS = ["bachelor", "master", "phd", "exec", "other"];
const FIELDS = ["stem", "business", "humanities", "health", "law", "other"];
const SIZES = ["s", "m", "l", "self"];
const HOWS = ["protocol", "partly", "own"];
const SEEN = ["learning", "time", "engagement", "none", "integrity", "errors"];
const REPORT_KINDS = ["task", "tool", "study"];
const EVENT_KINDS = ["role", "task", "tool", "useful-open", "share"];
const SHOW_CHECKS_FROM = 10;
// Caps on public reads: a summary never returns more than this, so the page size stays bounded as contributions grow.
const MAX_POSTS = 200, MAX_UPDATES = 20, MAX_REPLIES = 50;
const MAX_BODY = 16 * 1024;

export type ApiOptions = { dbPath: string; dataDir: string; adminToken?: string; writeLimit?: number; now?: () => Date };

export function createApi(opts: ApiOptions) {
  const db = new Database(opts.dbPath, { create: true });
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS checks (task TEXT NOT NULL, role TEXT NOT NULL, value TEXT NOT NULL, client TEXT NOT NULL, created TEXT NOT NULL, updated TEXT NOT NULL, UNIQUE (task, client));
    CREATE TABLE IF NOT EXISTS useful (task TEXT NOT NULL, tool TEXT NOT NULL, role TEXT NOT NULL, value TEXT, reason TEXT, client TEXT NOT NULL, created TEXT NOT NULL, UNIQUE (task, tool, client));
    CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, task TEXT NOT NULL, tool TEXT NOT NULL, role TEXT NOT NULL, stars INTEGER NOT NULL, level TEXT, field TEXT, size TEXT, how TEXT, seen TEXT NOT NULL, text TEXT, name TEXT, created TEXT NOT NULL, edit_hash TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'visible', flags INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS updates (id INTEGER PRIMARY KEY, post_id TEXT NOT NULL REFERENCES posts(id), text TEXT NOT NULL, created TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'visible', flags INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS flags (kind TEXT NOT NULL, id TEXT NOT NULL, client TEXT NOT NULL, created TEXT NOT NULL, PRIMARY KEY (kind, id, client));
    CREATE TABLE IF NOT EXISTS replies (id INTEGER PRIMARY KEY, post_id TEXT NOT NULL REFERENCES posts(id), text TEXT NOT NULL, name TEXT, created TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'visible', flags INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY, kind TEXT NOT NULL, role TEXT, task TEXT, tool TEXT, what TEXT NOT NULL, link TEXT, created TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open');
    CREATE TABLE IF NOT EXISTS events (day TEXT NOT NULL, kind TEXT NOT NULL, role TEXT NOT NULL DEFAULT '', task TEXT NOT NULL DEFAULT '', tool TEXT NOT NULL DEFAULT '', n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, kind, role, task, tool));
  `);

  // Valid ids come from the published map data, so nobody can write about tasks or tools that do not exist.
  const json = (n: string) => JSON.parse(readFileSync(join(opts.dataDir, n + ".json"), "utf8"));
  const roles = new Set<string>(json("taxonomy").roles.map((r: any) => r.id));
  const tasks = new Set<string>(json("tasks").tasks.map((t: any) => t.id));
  const tools = new Set<string>(json("tools").tools.map((t: any) => t.id));

  const now = () => (opts.now ? opts.now() : new Date());
  const today = () => now().toISOString().slice(0, 10);
  const sha = (s: string) => createHash("sha256").update(s).digest("hex");

  // Rate limit on writes. The key is a hash of the address with a salt that changes every day and is never stored.
  const limit = opts.writeLimit ?? 30;
  let salt = randomBytes(16).toString("hex"), saltDay = today();
  const hits = new Map<string, number[]>();
  function allowed(ip: string) {
    if (saltDay !== today()) { salt = randomBytes(16).toString("hex"); saltDay = today(); hits.clear(); }
    const k = sha(salt + ip), t = now().getTime();
    const list = (hits.get(k) || []).filter((x) => t - x < 10 * 60 * 1000);
    if (list.length >= limit) return false;
    list.push(t); hits.set(k, list);
    return true;
  }

  const ok = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
  const bad = (msg: string, status = 400) => ok({ error: msg }, status);
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const one = (v: unknown, list: string[]) => (typeof v === "string" && list.includes(v) ? v : null);
  // An anonymous id generated by the browser; stored only as a hash, used so a person can change their own answer.
  const client = (req: Request) => { const c = req.headers.get("x-commons-client") || ""; return /^[a-zA-Z0-9-]{16,64}$/.test(c) ? sha("client:" + c) : null; };

  function summary(task: string, tool: string | null, me: string | null) {
    const c = db.query("SELECT value, COUNT(*) n FROM checks WHERE task = ? AND value != 'untried' GROUP BY value").all(task) as { value: string; n: number }[];
    const n = c.reduce((a, b) => a + b.n, 0);
    const checks: any = { n, shown: n >= SHOW_CHECKS_FROM };
    if (checks.shown) for (const k of ["yes", "partly", "no"]) checks[k] = c.find((x) => x.value === k)?.n ?? 0;
    const mine: any = {};
    if (me) {
      mine.check = (db.query("SELECT value FROM checks WHERE task = ? AND client = ?").get(task, me) as any)?.value ?? null;
      if (tool) { const u = db.query("SELECT value, reason FROM useful WHERE task = ? AND tool = ? AND client = ?").get(task, tool, me) as any; mine.useful = u ?? null; }
    }
    if (!tool) {
      // Ratings for every tool in this task, for the comparison cards.
      const ratings: Record<string, { n: number; avg: number }> = {};
      for (const r of db.query("SELECT tool, COUNT(*) n, AVG(stars) avg FROM posts WHERE task = ? AND status = 'visible' GROUP BY tool").all(task) as any[]) ratings[r.tool] = { n: r.n, avg: r.avg };
      return { checks, mine, ratings };
    }
    const posts = db.query(`SELECT id, role, stars, level, field, size, how, seen, text, name, created FROM posts WHERE task = ? AND tool = ? AND status = 'visible' ORDER BY created DESC, rowid DESC LIMIT ${MAX_POSTS}`).all(task, tool) as any[];
    const ups = db.query(`SELECT id, text, created FROM updates WHERE post_id = ? AND status = 'visible' ORDER BY id LIMIT ${MAX_UPDATES}`);
    const reps = db.query(`SELECT id, text, name, created FROM replies WHERE post_id = ? AND status = 'visible' ORDER BY id LIMIT ${MAX_REPLIES}`);
    const seen: Record<string, number> = {};
    for (const p of posts) {
      p.seen = JSON.parse(p.seen);
      p.seen.forEach((k: string) => (seen[k] = (seen[k] || 0) + 1));
      p.updates = ups.all(p.id);
      p.replies = reps.all(p.id);
    }
    const rating = posts.length ? { n: posts.length, avg: posts.reduce((a, p) => a + p.stars, 0) / posts.length } : { n: 0, avg: 0 };
    return { checks, mine, rating, seen, posts };
  }

  async function body(req: Request) { try { return (await req.json()) as any; } catch { return null; } }

  function admin(req: Request) {
    if (!opts.adminToken) return false;
    const got = Buffer.from((req.headers.get("authorization") || "").replace(/^Bearer\s+/i, ""));
    const want = Buffer.from(opts.adminToken);
    return got.length === want.length && timingSafeEqual(got, want);
  }
  function csv(rows: any[]) {
    if (!rows.length) return "";
    const cols = Object.keys(rows[0]).filter((c) => c !== "edit_hash" && c !== "client");
    // Text that starts like a formula would run in a spreadsheet: prefix it so the moderator sees it as plain text.
    const cell = (v: any) => {
      let s = v == null ? "" : String(v);
      if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    return [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n") + "\n";
  }

  return async function handle(req: Request, ip = ""): Promise<Response | null> {
    const url = new URL(req.url);
    if (!url.pathname.startsWith("/api/commons/")) return null;
    const path = url.pathname.slice("/api/commons".length);
    const at = now().toISOString();

    // ─── Moderation ───
    if (path.startsWith("/admin/")) {
      if (!admin(req)) return bad("unauthorized", 401);
      if (req.method === "GET" && path === "/admin/overview") {
        return ok({
          counts: {
            checks: (db.query("SELECT COUNT(*) n FROM checks").get() as any).n,
            useful: (db.query("SELECT COUNT(*) n FROM useful").get() as any).n,
            posts: (db.query("SELECT COUNT(*) n FROM posts").get() as any).n,
            replies: (db.query("SELECT COUNT(*) n FROM replies").get() as any).n,
            reportsOpen: (db.query("SELECT COUNT(*) n FROM reports WHERE status = 'open'").get() as any).n,
          },
          // Moderation queue first: the most flagged contributions come first, then the newest.
          posts: db.query("SELECT id, task, tool, role, stars, text, name, created, status, flags FROM posts ORDER BY flags DESC, created DESC LIMIT 200").all(),
          replies: db.query("SELECT id, post_id, text, name, created, status, flags FROM replies ORDER BY flags DESC, id DESC LIMIT 200").all(),
          updates: db.query("SELECT id, post_id, text, created, status, flags FROM updates ORDER BY flags DESC, id DESC LIMIT 200").all(),
          reports: db.query("SELECT * FROM reports ORDER BY id DESC LIMIT 200").all(),
          disagreement: db.query("SELECT task, SUM(value = 'yes') yes, SUM(value = 'partly') partly, SUM(value = 'no') no, COUNT(*) n FROM checks WHERE value != 'untried' GROUP BY task HAVING n >= ? ORDER BY (1.0 * SUM(value = 'no') / COUNT(*)) DESC").all(SHOW_CHECKS_FROM),
          usage: db.query("SELECT kind, role, task, tool, SUM(n) n FROM events WHERE day >= date('now', '-30 day') GROUP BY kind, role, task, tool ORDER BY n DESC LIMIT 100").all(),
        });
      }
      let m = path.match(/^\/admin\/(posts|replies|updates)\/([\w-]+)$/);
      if (req.method === "POST" && m) {
        const b = await body(req); const status = one(b?.status, ["visible", "hidden"]);
        if (!status) return bad("status");
        db.query(`UPDATE ${m[1]} SET status = ? WHERE id = ?`).run(status, m[2]);
        // Restoring a contribution means the moderator has reviewed its flags: clear them.
        if (status === "visible") {
          db.query("DELETE FROM flags WHERE kind = ? AND id = ?").run(m[1], m[2]);
          db.query(`UPDATE ${m[1]} SET flags = 0 WHERE id = ?`).run(m[2]);
        }
        return ok({ ok: true });
      }
      m = path.match(/^\/admin\/reports\/(\d+)$/);
      if (req.method === "POST" && m) {
        const b = await body(req); const status = one(b?.status, ["open", "done"]);
        if (!status) return bad("status");
        db.query("UPDATE reports SET status = ? WHERE id = ?").run(status, Number(m[1]));
        return ok({ ok: true });
      }
      m = path.match(/^\/admin\/export\/(checks|useful|posts|updates|replies|reports|events|flags)\.csv$/);
      if (req.method === "GET" && m) return new Response(csv(db.query(`SELECT * FROM ${m[1]}`).all()), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="commons-${m[1]}-${today()}.csv"` } });
      return bad("not found", 404);
    }

    // ─── Public reads ───
    if (req.method === "GET" && path === "/summary") {
      const task = url.searchParams.get("task") || "", tool = url.searchParams.get("tool");
      if (!tasks.has(task) || (tool && !tools.has(tool))) return bad("unknown task or tool", 404);
      return ok(summary(task, tool, client(req)));
    }

    // ─── Writes ───
    if (req.method !== "POST") return bad("not found", 404);
    if (!allowed(ip)) return bad("too many requests, try again later", 429);
    if (Number(req.headers.get("content-length") || 0) > MAX_BODY) return bad("payload too large", 413);
    const b = await body(req);
    if (!b || typeof b !== "object") return bad("invalid body");
    if (b.website) return ok({ ok: true }); // honeypot field: bots fill it, people never see it

    if (path === "/events") {
      const kind = one(b.kind, EVENT_KINDS);
      const role = b.role ? one(b.role, [...roles]) : "", task = b.task ? (tasks.has(b.task) ? b.task : null) : "", tool = b.tool ? (tools.has(b.tool) ? b.tool : null) : "";
      if (!kind || role === null || task === null || tool === null) return bad("invalid event");
      db.query("INSERT INTO events (day, kind, role, task, tool, n) VALUES (?, ?, ?, ?, ?, 1) ON CONFLICT (day, kind, role, task, tool) DO UPDATE SET n = n + 1").run(today(), kind, role, task, tool);
      return ok({ ok: true });
    }
    if (path === "/check") {
      const me = client(req), value = one(b.value, CHECK), role = one(b.role, [...roles]);
      if (!me || !value || !role || !tasks.has(b.task)) return bad("invalid answer");
      db.query("INSERT INTO checks (task, role, value, client, created, updated) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (task, client) DO UPDATE SET value = excluded.value, role = excluded.role, updated = excluded.updated").run(b.task, role, value, me, at, at);
      return ok(summary(b.task, null, me));
    }
    if (path === "/useful") {
      const me = client(req), role = one(b.role, [...roles]);
      const value = b.value == null ? null : one(b.value, USEFUL), reason = b.reason == null ? null : one(b.reason, REASONS);
      if (!me || !role || !tasks.has(b.task) || !tools.has(b.tool) || (b.value != null && !value) || (b.reason != null && !reason)) return bad("invalid answer");
      db.query("INSERT INTO useful (task, tool, role, value, reason, client, created) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (task, tool, client) DO UPDATE SET value = COALESCE(excluded.value, value), reason = COALESCE(excluded.reason, reason)").run(b.task, b.tool, role, value, reason, me, at);
      return ok({ ok: true });
    }
    if (path === "/posts") {
      const role = one(b.role, [...roles]), stars = Number(b.stars), how = one(b.how, HOWS);
      const seen = Array.isArray(b.seen) ? [...new Set(b.seen.filter((x: unknown) => typeof x === "string" && SEEN.includes(x as string)))] : [];
      if (!tasks.has(b.task) || !tools.has(b.tool) || !role || !(stars >= 1 && stars <= 5 && Number.isInteger(stars)) || !how || b.consent !== true) return bad("invalid experience");
      const id = randomBytes(9).toString("base64url"), token = randomBytes(24).toString("base64url");
      db.query("INSERT INTO posts (id, task, tool, role, stars, level, field, size, how, seen, text, name, created, edit_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(id, b.task, b.tool, role, stars, one(b.level, LEVELS), one(b.field, FIELDS), one(b.size, SIZES), how, JSON.stringify(seen), str(b.text, 1500), str(b.name, 60), at, sha("edit:" + token));
      return ok({ id, editToken: token }, 201);
    }
    let m = path.match(/^\/posts\/([\w-]+)\/updates$/);
    if (m) {
      const post = db.query("SELECT edit_hash FROM posts WHERE id = ?").get(m[1]) as any;
      const token = req.headers.get("x-edit-token") || "";
      if (!post || post.edit_hash !== sha("edit:" + token)) return bad("not allowed", 403);
      const text = str(b.text, 800); if (!text) return bad("empty");
      db.query("INSERT INTO updates (post_id, text, created) VALUES (?, ?, ?)").run(m[1], text, at);
      return ok({ ok: true }, 201);
    }
    m = path.match(/^\/posts\/([\w-]+)\/replies$/);
    if (m) {
      if (!db.query("SELECT 1 FROM posts WHERE id = ? AND status = 'visible'").get(m[1])) return bad("not found", 404);
      const text = str(b.text, 800); if (!text) return bad("empty");
      db.query("INSERT INTO replies (post_id, text, name, created) VALUES (?, ?, ?, ?)").run(m[1], text, str(b.name, 60), at);
      return ok({ ok: true }, 201);
    }
    // A flag is counted once per browser and only queues the contribution for the moderator: nothing is hidden automatically.
    m = path.match(/^\/(posts|replies|updates)\/([\w-]+)\/flag$/);
    if (m) {
      const me = client(req);
      if (!me) return bad("invalid answer");
      if (!db.query(`SELECT 1 FROM ${m[1]} WHERE id = ?`).get(m[2])) return bad("not found", 404);
      if (db.query("INSERT OR IGNORE INTO flags (kind, id, client, created) VALUES (?, ?, ?, ?)").run(m[1], m[2], me, at).changes)
        db.query(`UPDATE ${m[1]} SET flags = flags + 1 WHERE id = ?`).run(m[2]);
      return ok({ ok: true });
    }
    if (path === "/reports") {
      const kind = one(b.kind, REPORT_KINDS), what = str(b.what, 600);
      if (!kind || !what) return bad("invalid report");
      db.query("INSERT INTO reports (kind, role, task, tool, what, link, created) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(kind, one(b.role, [...roles]), tasks.has(b.task) ? b.task : null, tools.has(b.tool) ? b.tool : null, what, str(b.link, 300), at);
      return ok({ ok: true }, 201);
    }
    return bad("not found", 404);
  };
}
