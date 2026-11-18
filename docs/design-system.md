# Design system on the landing

The landing follows the Didaflow design system (`didaflow-design` v0.7.0, light and dark theme).

- `shared/design/` is a copy of `didaflow-design` at the tag in `DESIGN_VERSION` (v0.7.0). The system roles are the
  `--df-*` variables (`shared/design/css/tokens.css`). The local token file of 27 Oct is gone.
- **Satoshi is not in this repo.** The font file (ITF Free Font License) is supplied by the deploy on altair into
  `shared/design/fonts/satoshi/Satoshi-Variable.woff2`; that folder is in `.gitignore` and `scripts/design.sh`
  does not copy it. Without the file the headings fall back to Inter. To see Satoshi locally, copy the file there from
  the private `didaflow-design` clone (`fonts/satoshi/`).
- `landing/assets/css/landing-tokens.css`: the bridge from the names the landing reads (`--ink`, `--ground`,
  `--space-*`, `--type-*`…) to the `--df-*` roles (v0.7.0 keeps the old names with their old values, so the bridge is
  needed), the old landing names mapped onto the tokens, and the *proposed* tokens the system does not have yet (dark
  band, hero title). Every page sets `data-theme="auto"` on `<html>`
  (follows the device; `dark` / `light` force a theme).
- Site CSS holds no colour literals: only variables. `tests/test_design_tokens.py` checks AA contrast of the
  token pairs in both themes and fails on any `#hex` or `rgb()` in `site.css`, `editorial.css`, `chapters.css`
  and `commons.css`.
- Text uses `accent-strong`, never `accent`; touch targets are 44 px; focus is a 2 px `accent-strong` outline.
