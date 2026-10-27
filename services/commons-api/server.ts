// Production entry point for the Commons API. Caddy forwards /api/commons/* here.
//   COMMONS_API_PORT   default 8787 (listens on 127.0.0.1 only)
//   COMMONS_DB         default ./data/commons.db
//   COMMONS_DATA_DIR   default <repo>/landing/commons/ai-map/data
//   COMMONS_ADMIN_TOKEN  required for /api/commons/admin/* (moderation, deletion, CSV export)
//   COMMONS_RETENTION_MONTHS  how long contributions are kept, whole months, default 24 (the privacy policy states the same figure)
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createApi } from "./api";

const dbPath = resolve(Bun.env.COMMONS_DB ?? "./data/commons.db");
mkdirSync(dirname(dbPath), { recursive: true });
const handle = createApi({
  dbPath,
  dataDir: Bun.env.COMMONS_DATA_DIR ?? join(import.meta.dir, "..", "..", "landing", "commons", "ai-map", "data"),
  adminToken: Bun.env.COMMONS_ADMIN_TOKEN,
});

// Contributions older than the retention period are deleted at start and then every six hours.
const retention = Number(Bun.env.COMMONS_RETENTION_MONTHS ?? 24);
if (!Number.isInteger(retention) || retention < 1) throw new Error("COMMONS_RETENTION_MONTHS must be a whole number of months, at least 1");
const purge = () => { try { const n = handle.purge(retention); console.log("commons-api purge", JSON.stringify(n)); } catch (e) { console.error("commons-api purge failed", e); } };
purge();
setInterval(purge, 6 * 60 * 60 * 1000);

const server = Bun.serve({
  hostname: "127.0.0.1",
  port: Number(Bun.env.COMMONS_API_PORT ?? 8787),
  // Largest body the server reads at all, chunked or not. Every message here is a few hundred bytes.
  maxRequestBodySize: 16 * 1024,
  async fetch(req, srv) {
    // Caddy sets X-Forwarded-For; the address is only used, salted and hashed, for the rate limit.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || srv.requestIP(req)?.address || "";
    return (await handle(req, ip)) ?? new Response("Not found", { status: 404 });
  },
});
console.log(`commons-api → http://127.0.0.1:${server.port} · db ${dbPath}`);
