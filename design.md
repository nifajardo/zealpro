# Design: Zealpro operations workspace

The shared application system. Read this before changing a screen. The owner supplied an explicit screenshot restoring the original navy, lime and white scheme. That screenshot is the current visual authority; future changes may amend this document deliberately.

## System

- Genre: modern-minimal application, with a purposeful operations tone.
- Theme: brand. Preserve the original Zealpro logo; do not recolour, redraw or distort it.
- Palette: navy navigation, bright lime selection, navy primary actions, cool grey canvas and white working panels. Preserve the supplied logo colours; cyan remains a supporting calendar/data accent.
- Axes: light / General Sans grotesk / navy action and lime state signal.
- Signature: the service ledger and selected-day dispatch, connected to captured product costs, fulfillment and payment standing.
- Use the existing nine-destination shell. Overview leads with a heading and white operations-summary row; calendar leads with period controls, contribution and the calendar/detail pair. Catalogs and financial screens remain lists and tables.

## Tokens

`public/tokens.css` is the only runtime colour and font source. Original logo colours remain separately named `--color-brand-*` for provenance.

| Role | Token |
| --- | --- |
| Canvas / working surface | `--color-paper` / `--color-surface` |
| Main text / secondary text | `--color-ink` / `--color-muted` |
| Summary field / field text | `--color-field` / `--color-field-ink` |
| Field secondary text / rules | `--color-field-muted` / `--color-field-rule` |
| Primary action / hover | `--color-navy` / `--color-navy-hover` |
| Selected destination / completed text | `--color-lime` / `--color-lime-ink` |
| Links / focus | `--color-navy` / `--color-cyan-ink` |
| Selected calendar / outside dates | `--color-cyan-tint` / `--color-calendar-outside` |
| Navigation | `--color-shell` / `--color-shell-ink` |

Keep General Sans for headings, data and controls. Headings use a fixed scale, never fluid display type. Tables and figures use tabular numerals. No tracked-capital labels, gradients, decorative imagery or invented statistics.

## Composition and controls

- The canvas is centred and capped at 1440 pixels. Navigation becomes a menu at 960 pixels.
- Desktop calendar/detail panels retain equal 720-pixel frames; narrow layouts stack naturally. Month tiles remain equal-height even when money wraps.
- Primary controls use navy with white text; secondary controls use a rule or text. Focus appears immediately, with a light ring against the navy navigation and a dark ring on light surfaces.
- Borders do not grow on focus. Dense tables scroll inside their own positioned region so offscreen accessible labels do not enlarge the document.
- Keep the full-width selected-day action, visible blank-cell boundaries and preserved calendar scroll behaviour.
- States are those the app actually supports: full, empty, validation errors and storage warnings. No fake loading or server-success states are introduced.

## Login composition

The entry screen uses a white form and company-supplied three-photo fieldwork collage in a centered split layout, with navy copy below the photograph and a restrained lime mark. On narrow screens the sign-in form precedes the collage. A one-time fade/8-pixel entrance uses a restrained stagger; reduced-motion disables it. No continuous animation. Keep the original logo, plain labels and one primary sign-in action. A public demo-role selector fills existing credentials without automatically signing in. Source provenance and verification limits are in `docs/QA_LOGIN_REFRESH.md`. This login-specific composition does not change the working-screen navigation or financial palette.

## Motion and exports

Still at rest. Existing brief control feedback remains; reduced-motion rules disable movement. No entrance animation or scroll choreography.

Runtime exports are `public/tokens.css` and `public/styles.css`. Behaviour and records stay in the existing native modules. No framework or new asset dependency is required.
