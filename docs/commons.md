# Commons and the AI Map

`/commons/` is Didaflow’s page of open tools for the education community. The first tool is the
**AI Map** (`/commons/ai-map/`, Italian at `/it/commons/ai-map/`): which AI tools fit which tasks in
higher education, with the evidence, the rules and what people who use them say.

## Files

```
content/ai-map/                 sources of the map (not served)
  research/student.json         tasks, evidence, risks, good practice, sources (one file per role)
  research/teacher.json
  research/design.json
  research/tools.json           tools: provider-declared facts, access mode, dated sources
  research/regulation.json      AI Act, GDPR, Italian law, vendor policies → flags per task
  research/BRIEF.md             rules for research and evidence (what counts, what to record)
  taxonomy.json                 roles, outcomes, evidence levels, legal levels, tool types
  extra-tasks.json              tasks added by the editors (e.g. proctoring, for its legal status)
  pages/{hub,method}.{en,it}.html   bodies of the hub and "How the map works"
scripts/ai-map/build.ts         builds data + pages, checks every reference
landing/commons/                generated pages, commons.css, ai-map/map.js, ai-map/data/*.json
landing/commons/admin/          moderation page (noindex, needs the admin token)
services/commons-api/           contributions API (Bun + SQLite)
```

Generated files in `landing/commons/` are committed, so the site stays static: deploying is still
copying `landing/` and `shared/`. After changing anything in `content/ai-map/`, run:

```sh
bun run build:map     # fails, with a list, if a source, task, tool or rule reference does not resolve
bun test              # API tests and data integrity
```

## Content model

The unit is **a tool used for a task**, never a tool on its own.

- **Task**: role (`student`, `teacher`, `design`), question, evidence level (`not-reviewed`, `none`,
  `indirect`, `limited`, `mixed`, `consistent`), verdict, outcomes measured, findings with sources,
  benefits and risks (each labelled research / interpretation / vendor), conditions, good practice,
  non-AI alternatives, open gaps, dates (literature search, editorial review).
- **Tool**: provider-declared facts (model, weights, licence, where it runs, where data go, DPA,
  training on your data, minimum age, citations, education features), access mode, pricing tier,
  check date, sources. `read: "excerpt"` marks facts to re-check on the provider’s page.
- **Link task ↔ tool**: *declared* (the provider presents it for that task) or *general-purpose*
  (a tool of the kind studied for that task). The build computes it.
- **Source**: citation, DOI or URL, kind (peer-reviewed, review, preprint, report, law, guidance,
  provider documentation), what was read (full text, abstract, page, excerpt), study details.
- **Rule**: instrument and article, status (prohibited, high-risk, transparency, obligation…), date
  of application, plain-language summary, exceptions, tasks and tool types concerned.

All human-readable text is `{ "en": …, "it": … }`.

### Draft and review

Every entry is a draft until the scientific committee reviews it: `dates.editorialReview` is `null`
and each analysis shows “Draft, not yet reviewed by the scientific committee”. The pages are
`noindex`. To publish an entry as reviewed, set `dates.editorialReview` (and, when it exists, the
reviewer) in the research file, rebuild, and remove `noindex` once enough entries are reviewed.

## Contributions (Commons API)

What people can do on the map, with no account, no email and no cookies:

| Where | What | Shown publicly |
|---|---|---|
| Under each task | “Does your experience match the research?” yes / partly / no / not tried | Shares, only from 10 answers; never changes the evidence level |
| Each analysis | Structured experience: stars, role, level, field, group size, how used, what observed, text, name (optional), CC BY consent | Yes, with replies; rating on the comparison cards |
| Each analysis | “Add how it went” on one’s own experience (edit key kept in the browser) | Yes, dated |
| Each analysis | “Was this analysis useful?” + reason | No (moderation page only) |
| Tasks, tools, sources | “Something missing? Tell us” + optional DOI | No (moderation page only) |
| Everywhere | Usage counters: role, task, tool opened, link shared | No (daily totals only) |

Privacy by design: the browser keeps a random id (stored server-side only as a hash) and the edit
keys of its own posts; IP addresses are used only for the rate limit, hashed with a daily key kept in
memory and never written to the database; honeypot field against bots; a browser can flag a
contribution once, which only queues it for a moderator: nothing is hidden automatically. See `landing/privacy-policy/` (section “Commons and the
AI Map”).

### Guided path (questionnaire)

`/commons/ai-map/questionnaire/` (Italian: `/it/commons/ai-map/questionario/`, `noindex`, not in the sitemap). Six
questions, one per screen (role, up to three activities, tools used or available by category, data, budget, local models),
then a report: evidence, good practice and risks per activity, the three best-fitting tools with the reasons for their
order, and all tools by category. It runs entirely in the browser (`ai-map/quiz.js`, data from `ai-map/data/*.json`):
answers stay in the browser's `localStorage`, nothing is sent and nothing is collected. The PDF is the browser's
"Save as PDF" on the print stylesheet (`@media print` in `commons.css`); contact is a prefilled `mailto:` link.
The scoring is in `quiz.js` and tested in `scripts/ai-map/quiz.test.ts`.

### Moderation and analysis

`/commons/admin/` (token from `COMMONS_ADMIN_TOKEN`; in development the token is `dev`):
counts, **tasks where practice and evidence disagree** (to bring to the committee), experiences and
replies to hide or restore, reports to close, last 30 days of usage, CSV export of every table.

### Monthly cycle

1. Export or read the moderation page: reports (missing studies, tools, tasks), disagreement, usage.
2. Propose readings: new studies from the reports and from the sources in `research/BRIEF.md`.
3. The committee decides what to integrate; edit `content/ai-map/`, run `bun run build:map`.
4. Note the month’s changes (or that nothing relevant changed) for the monthly notes.

## Running it

Development: `bun run dev` serves the site and the API together on http://localhost:8765, with a
local database in `data/commons-dev.db` (git-ignored).

Production: the API is a separate process next to Caddy.

```sh
COMMONS_DB=/var/lib/didaflow/commons.db \
COMMONS_ADMIN_TOKEN=<long random string> \
COMMONS_API_PORT=8787 \
bun run services/commons-api/server.ts
```

A systemd unit, for example:

```ini
[Unit]
Description=Didaflow Commons API
After=network.target

[Service]
WorkingDirectory=/srv/didaflow/landing
Environment=COMMONS_DB=/var/lib/didaflow/commons.db
Environment=COMMONS_API_PORT=8787
EnvironmentFile=/etc/didaflow/commons.env
ExecStart=/usr/local/bin/bun run services/commons-api/server.ts
Restart=on-failure
User=didaflow

[Install]
WantedBy=multi-user.target
```

`commons.env` holds `COMMONS_ADMIN_TOKEN`. It may also set `COMMONS_RETENTION_MONTHS` (whole months, default 24): the API
deletes contributions older than that at start and every six hours (answers count from their last change; the anonymous
usage counters stay). The privacy policy states the same figure, so change both together. The moderation page can also
delete an experience (with its replies and updates), a reply, an update or a report for good, for a person’s request:
“Elimina” removes the row, unlike “Nascondi”. Backups of the SQLite file keep deleted rows until they rotate: keep that
period short. The Caddyfile forwards `/api/commons/*` to
`127.0.0.1:8787`; validate it with `caddy validate --config Caddyfile` before reloading. Back up the
SQLite file with the server’s usual backups (`sqlite3 commons.db ".backup …"` for a consistent copy).
When the map data change, restart the API so it reloads the valid task and tool ids.

## Open editorial questions

- Who sits on the scientific committee, and who signs each review.
- Tool facts marked `excerpt` (OpenAI, Turnitin, Packback blocked automated reading) need a manual check.
- Several studies were read at abstract level only; the committee may want full-text reviews first.
- Italian texts generated during research need an editorial pass (some say “IA” instead of “AI”).
- Proposed merges and additions from the research (see the research summaries): e.g. “use AI feedback
  on your own draft”, “reading summaries”, “redesign assessment for the AI era”.
