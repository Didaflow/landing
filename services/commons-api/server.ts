// Production entry point for the Commons API. Caddy forwards /api/commons/* here.
//   COMMONS_API_PORT   default 8787 (listens on 127.0.0.1 only)
//   COMMONS_DB         default ./data/commons.db
//   COMMONS_DATA_DIR   default <repo>/landing/commons/ai-map/data
//   COMMONS_ADMIN_TOKEN  required for /api/commons/admin/* (moderation, CSV export)
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

const server = Bun.serve({
  hostname: "127.0.0.1",
  port: Number(Bun.env.COMMONS_API_PORT ?? 8787),
  async fetch(req, srv) {
    // Caddy sets X-Forwarded-For; the address is only used, salted and hashed, for the rate limit.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || srv.requestIP(req)?.address || "";
    return (await handle(req, ip)) ?? new Response("Not found", { status: 404 });
  },
});
console.log(`commons-api → http://127.0.0.1:${server.port} · db ${dbPath}`);
