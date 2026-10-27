# Design system on the landing

The landing follows the Didaflow design system (tokens of 27 Oct 2026, light and dark theme).

- `landing/assets/css/didaflow-tokens.css`: the system tokens, identical to `tokens.json`. Local copy until
  `didaflow-design` publishes them (then: bump `DESIGN_VERSION`, run `scripts/design.sh`, delete this file).
- `landing/assets/css/landing-tokens.css`: the old landing names mapped onto the tokens, and the *proposed* tokens
  the system does not have yet (dark band, hero title). Every page sets `data-theme="auto"` on `<html>`
  (follows the device; `dark` / `light` force a theme).
- Site CSS holds no colour literals: only variables. `tests/test_design_tokens.py` checks AA contrast of the
  token pairs in both themes and fails on any `#hex` or `rgb()` in `site.css`, `editorial.css`, `chapters.css`
  and `commons.css`.
- Text uses `accent-strong`, never `accent`; touch targets are 44 px; focus is a 2 px `accent-strong` outline.
