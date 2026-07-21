# Didaflow — Design System

Single source of truth for design decisions on the didaflow.ai marketing site. Sibling to `README.md` (project conventions).

**Status:** living document. Expect updates as the site grows and as we discover gaps.

**Where the tokens live:**
- `shared/design/design-tokens.css` — single CSS source of truth. Caddy serves it at `/_assets/design-tokens.css`; every page links to it. Editing it propagates to the whole site on next refresh.
- `shared/design/content-primitives.css` — typographic/editorial primitives (`df-prose`, `.eyebrow`, `.callout`). Imported by `design-tokens.css`.

---

## The two voices

The system is built around two paired, role-separated voices. **They are not mixed in the same element.**

### Warm voice — Coral

| Token | Value | Used for |
|---|---|---|
| `--accent` / `--accent-hex` | `#d96d60` | Brand, primary CTAs, hover, logo, insight callouts |
| `--accent-strong` | `#b5504a` | Pressed / hover-deep |
| `--accent-light` | `#f6e6e3` | Coral wash background |
| `--accent-tint` | `rgba(217,109,96,0.10)` | Subtle coral background (eyebrow pill, icon tile) |

**Use coral when something is an action, a brand surface, or wants warmth.** Never use coral for a number, a status, a confidence interval, or anything else where the meaning is "this is data".

### Measured voice — Ink

| Token | Value | Used for |
|---|---|---|
| `--ink` | `#1f3a5f` | Inchiostro — institutional blue; numerics, KPIs, data viz primary series, inline editorial links |
| `--ink-strong` / `--ink-deep` | `#142844` | Headings on ink, pressed state |
| `--ink-tint` | `#e6ecf3` | Institutional badge background |
| `--ink-soft` | `rgba(31,58,95,0.10)` | Translucent fill for chips/bands |
| `--shadow-ink` | `0 10px 25px -5px rgba(31,58,95,0.18)` | Institutional card lift |

**Use ink for numbers, institutional metadata, and data provenance.** Inline links in editorial body are ink-strong with a thin underline; institutional badges (accreditation bodies, GDPR, audit, anno accademico) are `.badge-institution`.

### Why this matters

A confidence band styled in coral reads as a *decorative ribbon*. The same band in ink-soft reads as *data with a known precision*. Trust calibration is not optional — it's the reason for the role separation. When in doubt: **action = coral, dato = ink.**

---

## Typography — dual-voice pairing

Two families, two roles. Same scope rule as colors: not mixed in the same element.

### Satoshi — structure

Default everywhere. Headings, UI chrome, buttons, numerics. Hierarchy comes from **weight + size + tracking**, never from family swap.

```css
--font-sans: Satoshi, ui-sans-serif, system-ui, -apple-system, ...;
--font-display: Satoshi, ...;  /* alias used by h1-h4 */
```

Weight scale: 400 / 500 / 600 / 700. Tracking scale: `--tracking-tight -0.025em` for headings, `--tracking-tighter -0.03em` for hero, `--tracking-wide 0.06em` for eyebrows/labels.

### Fraunces (Reckless stand-in) — editorial voice

Reserved for *body that gets read*: lede paragraphs, long-form copy, blockquotes, callouts. **Operational/app surfaces never opt in.**

```css
--font-serif: Fraunces, "Reckless", Georgia, "Times New Roman", serif;
```

**Opt-in pattern:** add `data-surface` to `<body>`. Without `data-surface`, the page stays full Satoshi.

```html
<body data-surface="paper">  <!-- landing pages -->
  <p>This paragraph is set in Fraunces.</p>
</body>

<body>  <!-- no data-surface: stays Satoshi for operational density -->
  <p>This paragraph stays in Satoshi.</p>
</body>
```

When `data-surface` is set, `p` / `li` / `.hero__lede` / `blockquote` / `.callout` swap to serif. Inline `em` in body → italic + `--ink` color (the "authority of blue"). Inline `strong` stays foreground (not coral) for elegance. Inline `a` → ink-strong with thin underline.

`body[data-surface="paper"]` adds a subtle radial-dot background; `body[data-surface="grid"]` adds a 48px hairline grid. No `data-surface` value = clean off-white.

### About Reckless

The dual-voice was designed assuming **Reckless Neue** as the real serif. Fraunces is a free Google Font stand-in with very similar proportions and contrast. We're staying on Fraunces — Reckless licensing is gated on demonstrated UX uplift, not chosen on aesthetic preference. When/if that proof arrives, the swap is one line in `design-tokens.css`:

```css
--font-serif: "Reckless Neue", Fraunces, Georgia, serif;
```

No other file changes.

### Type scale

| Token | rem | px | Used for |
|---|---|---|---|
| `--text-xs` | 0.75 | 12 | eyebrow, badge, micro-label |
| `--text-sm` | 0.8125 | 13 | tooltip, chip, metadata |
| `--text-base` | 0.9375 | 15 | dense app body |
| `--text-md` | 1 | 16 | landing body, button |
| `--text-lg` | 1.125 | 18 | landing lede, button-lg |
| `--text-xl` | 1.5 | 24 | sub-display |
| `--text-2xl` | 1.875 | 30 | section h2 |
| `--text-3xl` | 2.25 | 36 | data stat value |
| `--text-4xl` | 3 | 48 | landing display |
| `--display-hero` | clamp(2.5rem, 5.5vw, 4.25rem) | — | hero h1 |
| `--display-1` | clamp(2rem, 5vw, 3.25rem) | — | h1 |
| `--display-2` | clamp(1.4rem, 3vw, 1.75rem) | — | h2 |
| `--display-3` | 1.15rem | — | h3 |

---

## Brand color palette

| Token | Value | Role |
|---|---|---|
| `--background` | `#fcfaf7` | Warm off-white page |
| `--surface` | `#f4f1ed` | Inset surface (input bg, chip bg) |
| `--bg-secondary` | rgb(246 230 227) | Coral wash backdrop |
| `--foreground` | `#1a1412` | Warm near-black text |
| `--muted` / `--fg-muted` | `#595552` | Secondary text |
| `--fg-subtle` | `#77716d` | Tertiary text |
| `--border` | `#e3e0dc` | Hairline border |
| `--card-bg` | `#ffffff` | Card surface |
| `--card-border` | `rgba(0,0,0,0.06)` | Card hairline |
| `--hairline` | `rgba(26,20,18,0.06)` | Inset divider |

### Semantic / semaphore

| Token | Value | Meaning |
|---|---|---|
| `--success` / `--semaphore-good` | `#2d9a54` | OK, green-positive |
| `--warning` / `--semaphore-caution` | `#c07005` | Caution, amber |
| `--danger` / `--semaphore-alert` | `#c93b3b` | Error, red-alert |
| `--chart-good` / `--chart-caution` / `--chart-alert` | `#22c55e` / `#f59e0b` / `#ef4444` | Brighter variants for data viz |

### Data viz — single series

The viz palette is **one primary series in ink + one highlight in coral**. No rainbow. No multi-hue category palette by default — if a chart needs more series, derive ink/coral tints with opacity, not new hues.

| Token | Value | Role |
|---|---|---|
| `--viz-primary` | `var(--ink)` | Main line / bar series |
| `--viz-highlight` | `var(--accent)` | Annotation, current value, callout |
| `--viz-baseline` | `rgba(31,58,95,0.32)` | Secondary / historical |
| `--viz-grid` | `rgba(26,20,18,0.06)` | Hairline grid |

---

## Spacing scale

Base unit: 4px.

| Token | px |
|---|---|
| `--space-1` | 4 |
| `--space-2` | 8 |
| `--space-3` | 12 |
| `--space-4` | 16 |
| `--space-5` | 20 |
| `--space-6` | 24 |
| `--space-7` | 28 |
| `--space-8` | 32 |
| `--space-10` | 40 |
| `--space-12` | 48 |
| `--space-16` | 64 |
| `--space-20` | 80 |
| `--space-24` | 96 |

## Radii

| Token | px | Used for |
|---|---|---|
| `--radius-sm` | 4 | chip, small input |
| `--radius-md` | 8 | button, tooltip, card-sm |
| `--radius-lg` | 12 | btn-lg, card-md |
| `--radius-xl` | 16 | hero card |
| `--radius-2xl` | 24 | hero shell, CTA block |
| `--radius-pill` | 9999 | eyebrow pill, badge |

## Shadows

| Token | Used for |
|---|---|
| `--shadow-sm` | Subtle lift on small elements |
| `--shadow-md` | Tooltip, popover |
| `--shadow-lg` | Coral-tinted card hover |
| `--shadow-xl` | Hero visual |
| `--shadow-glow` | Coral glow accent |
| `--shadow-ink` | Institutional card lift (charts, reports) |

## Motion

| Token | Value |
|---|---|
| `--ease-out` | `cubic-bezier(0.25, 1, 0.5, 1)` |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `--duration-fast` | 150ms |
| `--duration-base` | 200ms |
| `--duration-slow` | 300ms |

Honor `prefers-reduced-motion`: durations collapse to `0.01ms` system-wide.

---

## Helper classes (do not reinvent)

These are in `design-tokens.css`. Use them before writing new CSS.

### Voices and badges

- `.eyebrow` — coral uppercase micro-label
- `.eyebrow--ink` — ink variant
- `.eyebrow-pill` — coral pill version
- `.eyebrow-pill--ink` — ink pill version
- `.badge-institution` — the canonical institutional metadata pill (accreditation bodies, GDPR, audit, anno accademico) — ink-tint background, ink-deep text, uppercase
- `.numeric` — Satoshi tabular-nums
- `.numeric--data` — institutional blue numeric (KPIs, chart values, stat displays)
- `.callout` — coral-left-border insight blockquote (serif when on `data-surface`)
- `.callout--ink` — ink variant for data evidence / audit / institutional voice

### Buttons

- `.btn .btn--sm` / `.btn--md` / `.btn--lg` — size scale
- `.btn--primary` — coral filled CTA
- `.btn--secondary` — neutral outlined
- `.btn--ink` — institutional outlined (export, share, cite, audit)
- `.btn--ink-solid` — institutional filled

### Surfaces

- `.card` / `.card--hover` — base card
- `.icon-tile--sm` / `--md` / `--lg` — coral icon tile
- `.icon-tile--ink` — ink variant
- `.skip-link` — keyboard skip-to-content (a11y)

---

## Editorial / content primitives (`df-prose`, `.eyebrow`, `.callout`)

`content-primitives.css` covers long-form copy and editorial layouts. Used by landing pages, generated reports, AI markdown output.

Key classes:
- `.df-prose` — paragraph + heading rhythm for long-form copy
- `.df-prose h1/h2/h3` — Satoshi headings even inside `data-surface` body
- `.callout` / `.callout--ink` — see above
- `.eyebrow` / `.eyebrow--ink` — see above

---

## Palette presets (theming hooks)

The base system ships with optional `[data-palette]` overrides for one-off pages and alternate registers:

- `:root[data-palette="ink"]` — swaps the brand tokens to the institutional navy (`--ink`) for surfaces that want an executive, measured register. Only the `--brand-*` tokens diverge; surfaces, spacing, typography all stay shared.
- `:root[data-palette="aurora"]` — purple accent (presentation/talks)
- `:root[data-palette="forest"]` — green accent (sustainability angles)

And one `[data-vibe]` mode:

- `:root[data-vibe="editorial"]` — display headings adopt serif (research-journal feel)
- `:root[data-vibe="energetic"]` — tighter tracking + faster transitions (talks, hero pages)

These are escape hatches. **Default is no preset.**

---

## Z-index scale

| Token | Value |
|---|---|
| `--z-base` | 1 |
| `--z-sticky` | 10 |
| `--z-overlay` | 100 |
| `--z-modal` | 1000 |
| `--z-toast` | 10000 |

---

## Accessibility baseline

- **Contrast:** all tokens validated at WCAG 2.1 AA (4.5:1 text, 3:1 UI). Don't regress.
- **Focus ring:** `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }`. Universal — do not override per-component unless the offset/inset needs adjustment.
- **Touch targets:** minimum 44×44px on tap.
- **Motion:** all transitions wrapped by `prefers-reduced-motion: reduce` → 0.01ms.
- **Skip link:** `.skip-link` is in the system; every shell layout should include one before main content.
- **Language:** end-user copy is Italian or English depending on the surface. Code, comments, and PR text are English.

---

## Don't list

Patterns that violate the system or read as AI slop. Reject in PR.

1. Cards in the hero of a landing page. Hero = brand, headline, lede, CTAs, one visual. Cards live below.
2. 3-column "feature grid" with icon-in-colored-circle + bold title + 2-line description. The single most recognizable AI layout.
3. Purple / violet / indigo accent colors anywhere. Coral and ink only.
4. Numerics in coral. Numbers are ink. Coral is action.
5. Institutional metadata in coral. Accreditation, audit, and academic-year badges are ink — they're institutional.
6. Decorative shadow on confidence bands, chips, or status pills. Flat fills only.
7. Striped patterns, gradients on chips, or "fade-out" decoration on data viz. Solid, calm, legible.
8. Heuristic-vs-literature distinguished only by emoji or icon. Color + width must carry the signal.
9. Carousels on landing. Linear scroll respects intent; carousels punish hesitation.
10. Inline color hex codes in component CSS. Use tokens. Always.
11. `font-family: system-ui` or `-apple-system` as the primary display font. Pick Satoshi or Fraunces — never default-stack.
12. Mixing voices in a single element (a coral background with ink text inside, or a `.btn--ink` with `--accent` icon). One voice per element.
13. `backdrop-filter: blur(...)` as decoration on static panels, modals, cards, or pills. Glassmorphism is allowed **only** on surfaces that sit sticky/fixed over scrolling content — page headers, mobile drawers, app shell top bars. On every other surface, use opaque tinted backgrounds with `box-shadow` for elevation.
14. Side-stripe borders (`border-left: ≥2px` colored) as the **signal vector** on data surfaces — status indicators, KPI panels, alerts. Status must carry via background tint **plus** full-frame border tint **plus** an inline label/chip/numeric — multi-channel, never single-channel. The 3px coral side-stripe on the **editorial** primitives (`.callout`, `.df-prose blockquote`) is permitted as a typographic quotation marker — it is decorative brand identity, not status signal, and the quotation context is the carrier. Data ≠ editorial; do not transfer the editorial idiom to data cards.

---

## Change protocol

When updating the design system:
1. Edit `DESIGN.md` first (this file) with the rationale.
2. Update `shared/design/design-tokens.css` to match.
3. Cascade to the pages in the same commit.

Don't change tokens silently. Every breaking change to a token name or value goes through this document.
