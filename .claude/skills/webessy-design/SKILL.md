---
name: webessy-design
description: Design system for the Webessy Studios site — type scale, spacing, colour use, liquid glass recipe, component specs, section motion, and an anti-AI-look review checklist. Use whenever building or styling any section, component, or layout on this site.
---

# Webessy design system

The hero, intro and nav are finished and frozen. Everything here is for sections 02 to 06 and the
footer. Match what already exists in `css/site.css` — reuse its variables and `.glass` class.

## 1. Fonts

Self-hosted in `fonts/`, all SIL Open Font License:

| Role | Family | Weights | Notes |
|---|---|---|---|
| Headings | Fraunces | 400, 400 italic | variable `opsz` axis — use `font-variation-settings: "opsz" 144` on large headings |
| Body and UI | Instrument Sans | 400, 500 | |
| Labels | JetBrains Mono | 400 | small caps-style labels only |

Get the woff2 files from the `@fontsource` packages (`@fontsource-variable/fraunces`,
`@fontsource/instrument-sans`, `@fontsource/jetbrains-mono`) or a Google Fonts download, copy only
the latin subsets into `fonts/`, and write the `@font-face` rules at the top of `css/site.css` with
`font-display: swap`. Preload only the Fraunces file used above the fold.

Add a `--font-display`, `--font-body` and `--font-mono` variable and apply `--font-body` to `body`.
Also set the existing hero headline (`#headline`) to these fonts — that is a font change only, not
a layout change, and is the one allowed edit to hero styles.

## 2. Type scale

| Token | Use | Size | Font | Line height | Tracking |
|---|---|---|---|---|---|
| `--t-display` | section titles | `clamp(44px, 6.2vw, 96px)` | Fraunces 400 | 1.0 | -0.025em |
| `--t-h3` | block titles | `clamp(24px, 2.4vw, 34px)` | Fraunces 400 | 1.15 | -0.015em |
| `--t-price` | the ₹6,499 numeral | `clamp(56px, 8vw, 120px)` | Fraunces 400 | 0.95 | -0.03em |
| `--t-body` | paragraphs | `17px` (16px under 720px) | Instrument Sans 400 | 1.6 | 0 |
| `--t-small` | captions, table cells | `14px` | Instrument Sans 400 | 1.5 | 0 |
| `--t-label` | `02 / WORK` style labels | `11.5px` | JetBrains Mono 400 | 1.2 | 0.14em, uppercase |

Italic accent: at most one word per heading, in Fraunces italic. It may use `var(--orange)` only in
the section 03 price heading — everywhere else it stays `var(--ink)`.

Paragraph measure: max 62ch. Never justify text.

## 3. Colour below the hero

| Variable | Value | Use |
|---|---|---|
| `--bg` | `#05060F` | page (exists) |
| `--ink` | `#ECEAFB` | headings, body (exists) |
| `--muted` | 62% ink | secondary text (exists) |
| `--hair` | `rgba(236,234,251,.12)` | 1px dividers, table rules — add |
| `--surface` | `#0B0C18` | the few solid panels (section 04 cards) — add |
| `--orange` | `#FF561D` | buttons, "unfair advantage" only (exists) |

Violet `#5B3FD9` and blue `#3D7BFF` appear below the hero **only** inside the soft glow behind
the pricing and reviews glass. Never as text, borders or fills.

## 4. Space and layout

- Container: `max-width: 1240px`, side gutter `clamp(20px, 5vw, 64px)`
- Section padding: `clamp(96px, 14vh, 180px)` top and bottom
- Base grid: 12 columns, gap `clamp(16px, 2vw, 28px)`
- Vary composition: 02 is left-pinned/right-scrolling, 03 is a 7/5 split, 04 is full-width stacked,
  05 is a 5/7 split mirrored, 06 is a 7/5 split. No two neighbours use the same layout.

## 5. Corners — a deliberate scale, not one radius everywhere

- `0` — tables, text blocks, images inside the Work section, dividers
- `4px` — form inputs
- `16px` — glass cards and section 04 panels
- `999px` — buttons and the nav pill (exists)

## 6. Liquid glass

Use the existing `.glass` class unchanged. It is smoked glass: a dark tint inside a 22px blur,
a bright 1px top highlight, and a soft drop shadow.

Glass only reads as glass with colour behind it. For the pricing section (and the reviews row),
add one **static** glow layer behind the cards:

```css
.glow-field { position: relative; isolation: isolate; }
.glow-field::before {
  content: ""; position: absolute; inset: -10% -5%; z-index: -1; pointer-events: none;
  background:
    radial-gradient(40% 50% at 30% 40%, rgba(91, 63, 217, .30), transparent 70%),
    radial-gradient(30% 40% at 75% 65%, rgba(255, 86, 29, .16), transparent 70%);
  filter: blur(40px);
}
```

Never animate the glow. Never stack glass on glass.

## 7. Components

**Buttons** — pill, `padding: 14px 22px`, Instrument Sans 500, 15px.
Primary: `var(--orange)` fill, text `#0C0C0A`. Secondary: transparent, 1px `var(--hair)` border,
text `var(--ink)`. Both: visible `:focus-visible` outline 2px `var(--ink)` offset 3px.
Only one primary button per section.

**Price card (glass)** — label, `--t-price` numeral, one line of copy, the "Every build includes"
list as plain lines separated by `--hair` rules (no bullets, no icons), primary button at the bottom.

**Comparison table** — full width, no card, no radius. Header row in `--t-label`. Rows separated
by `--hair`. The "Us" row: text in `--ink`, others in `--muted`. On mobile, each row becomes a
stacked block, not a horizontal scroll.

**Section 04 panels** — `var(--surface)`, 16px radius, 1px `--hair` border. Large step numbers in
Fraunces at 30% opacity; step titles `--t-h3`; body `--t-body`.

**Review cards (glass)** — quote in Fraunces italic 22px, name and business in `--t-label`.

**Form** — labels above inputs, inputs 48px tall, 4px radius, 1px `--hair` border, transparent
background, focus border `var(--ink)`. Required fields validated in JavaScript with a plain inline
message under the field. No floating labels.

## 8. Motion

- Library: GSAP 3.12.5 is in `js/`. If scroll-linked motion needs ScrollTrigger, add
  `js/ScrollTrigger.min.js` from the same GSAP version (npm package `gsap@3.12.5`, `dist/`).
- **Text reveal** (all sections): 16px rise + fade, 0.8s, `power3.out`, once, when 15% visible.
- **02 Work screenshots:** each image starts `translateX(24%) scale(0.86)` at 40% opacity and
  reaches `translateX(0) scale(1)` full opacity as it crosses the middle of the viewport. Scrubbed
  to scroll, not time-based. Left column is `position: sticky; top: 14vh`.
- **04 How it works:** panels are `position: sticky` with `top: calc(12vh + index * 18px)`.
  As the next panel arrives, the previous scales to 0.95 and dims to 60% opacity.
- **prefers-reduced-motion:** no transforms, no scrubbing; everything simply visible.
- Keep the frame rate: animate only `transform` and `opacity`.

## 9. Placeholders for missing assets

Where an asset does not exist yet, render a clean placeholder box at the correct aspect ratio with
a visible label, for example `[TODO: Yauvana screenshot — desktop hero]`. Currently missing:
5 Yauvana screenshots, Naren's photo, reply time, real reviews.

## 10. Review checklist — run before saying a section is done

- [ ] Every word traceable to `WEBSITE-CONTENT.md`?
- [ ] Is this section's layout different from its neighbours?
- [ ] Anything centred that doesn't need to be?
- [ ] Any glass outside nav, hero, pricing, reviews? Remove it.
- [ ] Any violet or blue used as text, border or fill below the hero? Remove it.
- [ ] More than one italic word in a heading? More than one primary button?
- [ ] Any icon grid, emoji, gradient text, or banned buzzword?
- [ ] Works at 390px and 1440px? Keyboard focus visible? Console clean?
- [ ] Reduced motion respected?
