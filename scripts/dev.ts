// Static dev server for the landing site.
// Serves landing/ at / and shared/design/ at /_assets/ — mirrors the Caddy prod map.
//   bun run dev   →   http://localhost:8765

import { existsSync, mkdirSync, statSync } from "node:fs";
import { join, normalize, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const LANDING = join(ROOT, "landing");
const ASSETS = join(ROOT, "shared", "design");
const PORT = Number(Bun.env.PORT ?? 8765);

// The Commons API runs in-process in development, with its own local database (data/ is git-ignored).
import { createApi } from "../services/commons-api/api";
mkdirSync(join(ROOT, "data"), { recursive: true });
const commons = createApi({
  dbPath: join(ROOT, "data", "commons-dev.db"),
  dataDir: join(LANDING, "commons", "ai-map", "data"),
  adminToken: Bun.env.COMMONS_ADMIN_TOKEN ?? "dev",
});

/** Resolve a request path to a file on disk, or null if it escapes the root. */
function resolveFile(root: string, pathname: string): string | null {
  const candidate = join(root, normalize(pathname));
  if (!candidate.startsWith(root)) return null; // path traversal
  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    const index = join(candidate, "index.html");
    return existsSync(index) ? index : null;
  }
  return existsSync(candidate) ? candidate : null;
}

Bun.serve({
  port: PORT,
  async fetch(req, srv) {
    const api = await commons(req, srv.requestIP(req)?.address ?? "");
    if (api) return api;
    const pathname = decodeURIComponent(new URL(req.url).pathname);

    const onAssets = pathname.startsWith("/_assets/");
    const root = onAssets ? ASSETS : LANDING;
    const rel = onAssets ? pathname.slice("/_assets".length) : pathname;

    const file = resolveFile(root, rel);
    if (!file) return new Response("Not found", { status: 404 });

    return new Response(Bun.file(file)); // Bun infers Content-Type from the extension
  },
});

console.log(`landing → http://localhost:${PORT}  (Commons API at /api/commons, admin token "dev")`);
