# landing

The [didaflow.ai](https://didaflow.ai) marketing site. Vanilla HTML, CSS and
JavaScript — no framework, no build step, no dependencies.

```
landing/          the pages: home, changelog, and the four legal pages
landing/scripts/  main.js
shared/design/    design tokens, content primitives, brand assets → served at /_assets/
scripts/dev.ts    static dev server (Bun), mirrors the production route map
DESIGN.md         the design system
```

## Develop

```sh
bun run dev       # http://localhost:8765
```

Serves `landing/` at `/` and `shared/design/` at `/_assets/` — the same mapping
production uses, so what you see locally is what ships.

## Deploy

`Caddyfile` is the production config: the site is served as static files, with
the design system mounted at `/_assets/`. Nothing is compiled, so deploying is
copying `landing/` and `shared/` to the server and reloading Caddy.

Validate before reloading — the config is live:

```sh
caddy validate --config Caddyfile
```

## License

Content and brand assets © Didaflow S.r.l. Published for transparency, not for reuse.
