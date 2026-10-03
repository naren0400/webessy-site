---
name: webessy-design
description: Design system for the Webessy Studios site — type scale, spacing, colour use, liquid glass recipe, component specs, section motion, and an anti-AI-look review checklist. Use whenever building or styling any section, component, or layout on this site.
---

# Webessy design system

The hero, intro and nav are finished and frozen (the nav has three approved changes: its contrast
fix in §3, the neon edge in §6, and its look over the 04 panels in §3).
Everything here is for sections 02 to 06 and the footer. Match what already exists in
`css/site.css` — reuse its variables, section themes and `.glass` class.

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
The hero has its own title face, Bodoni Moda (`--font-hero`), for its two title cards only: the end
statement (`#statement`) — "MAKE PEOPLE / CHOOSE / YOU." in capitals filling the width, the page's
one `<h1>`, with the line under it in Bodoni's real small caps — and the welcome's giant "WEBESSY"
(`#welcome`). The old `#headline` box is gone. Never use Bodoni Moda for section headings.

## 2. Type scale

| Token | Use | Size | Font | Line height | Tracking |
|---|---|---|---|---|---|
| `--t-display` | section titles | `clamp(44px, 6.2vw, 96px)` | Fraunces 400 | 1.0 | -0.025em |
| `--t-h3` | block titles | `clamp(24px, 2.4vw, 34px)` | Fraunces 400 | 1.15 | -0.015em |
| `--t-price` | the ₹6,499 numeral | `clamp(56px, 8vw, 120px)` | Fraunces 400 | 0.95 | -0.03em |
| `--t-body` | paragraphs | `17px` (16px under 720px) | Instrument Sans 400 | 1.6 | 0 |
| `--t-small` | captions, table cells | `14px` | Instrument Sans 400 | 1.5 | 0 |
| `--t-label` | `02 / WORK` style labels | `11.5px` | JetBrains Mono 400 | 1.2 | 0.14em, uppercase |

Italic accent: at most one word per heading, in Fraunces italic. It may be orange: use
`color: var(--accent)` and the theme picks the right one — `#FF561D` on black and ultramarine,
`#E84A12` on bone (3.1:1, so only in headings 24px and up), and ink on the orange section.

Paragraph measure: max 62ch. Never justify text.

## 3. Colour — every section owns one background

The hero keeps its own palette (`--bg`, `--ink` `#ECEAFB`, `--muted`, violet, lavender, blue).
Below the hero, each section declares a theme in the HTML (`<section data-theme="bone">`) and
section CSS reads only the theme tokens.

**Palette** (in `:root`): `--bone` `#ECE7DA` · `--ink-dark` `#0C0C0A` ("ink" in the content and
rules; `--ink` is the hero's light text) · `--ultramarine` `#1B1F5E` · `--bg` `#05060F` (black) ·
`--orange` `#FF561D` · `--orange-deep` `#E84A12` · `--violet` `#5B3FD9` · `--green` `#79A643`.

| Section | `data-theme` | Background | Text |
|---|---|---|---|
| 02 Work | `bone` | bone | ink |
| 03 What we do | `ultramarine` | ultramarine | bone |
| 04 How it works | `black` | black; panels bone, orange, violet, green | panels ink, ink, bone, ink |
| 05 About | `bone` | bone | ink |
| 06 Contact | `orange` | orange | ink |
| Footer | `black` | black | bone |

**Theme tokens** — section CSS uses these, never fixed colours:

| Token | Use | black | bone | ultramarine | orange |
|---|---|---|---|---|---|
| `--page` | background | `#05060F` | `#ECE7DA` | `#1B1F5E` | `#FF561D` |
| `--fg` | text | bone | ink | bone | ink |
| `--fg-soft` | secondary text, labels | bone 62% | ink 66% | bone 66% | ink 80% |
| `--line` | hairlines, table rules | bone 14% | ink 16% | bone 16% | ink 24% |
| `--accent` | the italic accent word | `#FF561D` | `#E84A12` | `#FF561D` | ink |
| `--btn-bg` / `--btn-fg` | the main button | orange / ink | orange / ink | orange / ink | ink / bone |

**Contrast — WCAG AA for every text/background pair:** 4.5:1 for normal text, 3:1 for text 24px
and up, 3:1 for form borders and focus rings. Checked values:

| Pair | Ratio |
|---|---|
| ink on bone · ink 66% on bone | 15.9 · 5.9 |
| bone on ultramarine · bone 66% | 12.1 · 6.0 |
| bone on black · bone 62% | 16.4 · 6.5 |
| ink on orange · ink 80% | 6.2 · 4.9 |
| bone on violet · ink on green | 5.4 · 6.9 |
| `#FF561D` on ultramarine · on black | 4.7 · 6.4 |
| `#E84A12` on bone (24px and up only) | 3.1 |
| `#FF561D` on bone — **fails**, even for large text | 2.6 |
| ink on the orange button · bone on the ink button | 6.2 · 15.9 |
| bone on the 03 glass cards · bone 66% (worst spot, over the orange glow) | 9.9 · 5.3 |
| bone 66% on the front card of the 03 orbit (worst, measured across the whole turn) | 5.4 |

For any new pair, work the ratio out before shipping. Don't judge it by eye.

**The blend.** Without JavaScript each section paints its own colour, with hard edges. With it,
`js/sections.js` moves the theme onto `<html>` (each section keeps its own in `data-band`) and
fades one fixed layer (`.page-bg`) behind the page. When a section's top passes the middle of
the screen, the layer fades to that colour in 0.7s (opacity only). The text colour switches
during the fade, at the moment the new text colour reads better than the old one on the blended
background (about half-way). This keeps the worst moment of any fade at 4.0:1 or better, for a
frame or two. Switching at exactly half-way would dip to 2.3:1 between ultramarine and orange.
It's timed, not scrubbed: half-way between bone and black, ink gets 4.4:1 and bone 3.6:1. Both
fail, so the page must never be able to rest there.

**The nav** (approved change 1): over bone and orange sections its links are full-strength
`--ink`, and over bone its glass tint is .75 instead of .52. That gives 5.8:1 or better. Its neon
edge (approved change 2, §6) keeps its line there but drops the outer glow. Approved change 3:
04 is black, but while one of its panels is behind the nav, `js/sections.js` sets
`data-nav="panel"` on `<html>` and the nav takes that same look over bone. Measured from pixels:
6.7:1 over bone, 8.9 over green, 10 over orange and violet (the grey links would get 2.3 to 4.4).
Nothing else in the nav changes.

**Where each colour may appear:** orange — buttons, "unfair advantage", the accent word, the
Contact background, one 04 panel, the neon edge. Violet — one 04 panel, the glow behind glass, the
neon edge (as `#8E7CFF`). Blue — the hero and the neon edge only. Never as gradient text.

## 4. Space and layout

- Container: `max-width: 1240px`, side gutter `clamp(20px, 5vw, 64px)`
- Section padding: `clamp(96px, 14vh, 180px)` top and bottom
- Base grid: 12 columns, gap `clamp(16px, 2vw, 28px)`
- Vary composition: 02 is left-pinned/right-scrolling, 03 is a 7/5 split (on computers, a ring of
  three cards, §8), 04 is full-width stacked, 05 is a 5/7 split mirrored, 06 is a 7/5 split. No two
  neighbours use the same layout.

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

Never animate the glow. Never stack glass on glass — except in the 03 orbit (§8), where the front
card sits over the two behind. They're dimmed to 45% there, or the orange button of a card behind
would show through the front card's glass and drop its soft text to 3.6:1.

Glass takes on the colour behind it. On ultramarine (03) the dark smoked glass works with bone
text. On bone (the 05 reviews) it turns grey, and bone text on it fails AA (3.3:1). Glass on
bone gets a light tint instead: a bone-white tint inside the blur, with ink text. Work out the
pairs before shipping it.

### Neon edge

Only on the nav and the three 03 pricing cards, on top of `.glass` (which stays unchanged). Each
host gets one empty `<span class="neon" aria-hidden="true"></span>`. The CSS sits right after
`.glass` in `css/site.css`; a host sets `--neon-r` (its corner radius), `--neon-o` (glow outside)
and `--neon-i` (glow inside).

- **Look:** a 1px line of light exactly on the glass border, with a soft glow either side that
  fades quadratically. Cards: 8px out, 6px in. Nav: 5px out, 4px in.
- **Colour:** one colour around the whole edge at a time, and every edge on the page changes
  together. One round is 20s, eased: violet → electric blue → violet → orange → violet. Never blue
  straight to orange: half-way is a muddy mauve. Violet to orange passes a warm pink, which is fine.
- **The violet is `#8E7CFF`** (the hero's lavender), not `#5B3FD9`. On ultramarine the line
  colours reach `#8E7CFF` 4.6 · `#3D7BFF` 3.9 · `#FF561D` 4.7, but `#5B3FD9` only 2.25, which
  looks dim beside the others. These ratios are for even brightness; the edge isn't text.
- **How it's built:** the shape is a mask, drawn once: four radial gradients for the corners and
  four linear ones for the straight edges. Inside it are three flat colours: violet underneath,
  blue and orange above it, fading in and out. Only opacity animates, so the graphics chip mixes
  them: no repaint, no re-blur. Never animate a gradient, box-shadow, filter or border colour for
  this. They redraw every frame and stutter on phones.
- **Text stays calm:** nothing on the text glows, and the glow stays inside the card padding
  (24px or more), so it never sits under words. Text contrast doesn't change.
- **Over bone and orange** the nav's edge keeps its line and inner glow, and drops the outer glow
  (`--neon-o: 0px`): on a light background a glow looks like a smudge.
- **Reduced motion:** the colour layers stop, and the edge stays violet.

## 7. Components

**Buttons** — pill, `padding: 14px 22px`, Instrument Sans 500, 15px.
Primary: `var(--btn-bg)` fill, `var(--btn-fg)` text — orange with ink text, except on the orange
Contact section, where it's ink with bone text (an orange button would vanish there).
Secondary: transparent, 1px `var(--line)` border, text `var(--fg)`. Both: visible
`:focus-visible` outline 2px `var(--fg)` offset 3px. Only one primary button per section.

**Price card (glass)** — label, `--t-price` numeral, one line of copy, the "Every build includes"
list as plain lines separated by `--line` rules (no bullets, no icons), primary button at the bottom.
In the 03 orbit it lies sideways so it fits a laptop screen (about 450px tall instead of 830): the
price, the line and the button on the left; the label and the list on the right. The two smaller
cards take its size: label at the top, the lead line (34–48px) and their copy at the bottom.

**Comparison table** — full width, no card, no radius. Header row in `--t-label`. Rows separated
by `--line`. The "Us" row: text in `--fg`, others in `--fg-soft`. On mobile, each row becomes a
stacked block, not a horizontal scroll.

**Section 04 panels** — four solid panels on the black section: bone, orange, violet, green, in
that order. 16px radius. Text is ink on bone, orange and green, and bone on violet. Large step
numbers in Fraunces at 70% of the panel's text colour: 30% fails AA on every panel (1.7–2.0:1),
and 70% gives 3.4:1 or better. Step titles `--t-h3`; body `--t-body`. Softer body text must
still reach 4.5:1: ink 80% on orange, ink 82% on green, bone 92% on violet.

**Review cards (glass)** — quote in Fraunces italic 22px, name and business in `--t-label`.
On bone, the light glass from §6.

**Form** — labels above inputs, inputs 48px tall, 4px radius, 1px border, transparent
background, focus border `var(--fg)`. Required fields validated in JavaScript with a plain inline
message under the field. No floating labels. On the orange Contact section: text in ink, input
borders at least ink 56% (the 3:1 a form border needs on orange), and error messages in ink —
never red, which fails on orange.

## 8. Motion

- Library: GSAP 3.12.5 is in `js/`. If scroll-linked motion needs ScrollTrigger, add
  `js/ScrollTrigger.min.js` from the same GSAP version (npm package `gsap@3.12.5`, `dist/`).
- **Text reveal** — `js/reveal.js`, our own splitter. No SplitText or other paid plugins, and GSAP
  stays at 3.12.5. Mark the text in the HTML:

  | Attribute | For | Motion |
  |---|---|---|
  | `data-reveal="words"` | headings, the mono labels too | each word rises from behind its own mask, 0.06s apart |
  | `data-reveal="lines"` | paragraphs and lists (on the element, or on a block around them) | the lines rise one after another, 0.1s apart |
  | `data-reveal="chars"` | a single big statement line only | letter by letter, 0.03s apart |
  | `class="reveal"` | things that aren't text: cards, tables | 16px rise + fade |

  All of them take 0.8s, use `power3.out`, play once, and start when the element's top reaches
  85% of the screen height. Pieces start at `yPercent: 120` inside their masks. The masks' padding
  is cancelled by negative margins, so descenders and italics aren't clipped and the layout doesn't
  move. Lines are measured when the reveal starts, so they're right at any width. Letter by letter
  keeps the kerning (measured from the original text), so nothing shifts when it settles.
  Rules: text inside a card moves with its card, so don't split it. Text with a link or button
  inside isn't split; it rises and fades. Don't nest `data-reveal`. Don't style revealed text
  with selectors that depend on its child elements (like `.x > span`); use classes.
  Screen readers: while text is split, the original stays in the page, visually hidden (`.rv-sr`),
  and the animated copy is `aria-hidden` (`.rv-vis`). When the reveal ends, the original HTML is
  put back exactly as written.
- **Section colours** — see §3: a timed 0.7s opacity fade when a section's top passes the middle
  of the screen. It still runs with reduced motion, because nothing moves.
- **02 Work screenshots:** each image starts `translateX(24%) scale(0.86)` at 40% opacity and
  reaches `translateX(0) scale(1)` full opacity as it crosses the middle of the viewport. Scrubbed
  to scroll, not time-based. Left column is `position: sticky; top: 14vh`.
- **02 Work case study:** "What was built" is a build sheet, like an architect's drawing: four
  views of the Yauvana site inside a thin double-line frame with tick marks, a title block in the
  bottom-right corner, and five numbered pins. Each pin's leader line ends on a dot at the exact
  thing its note describes. Pins, lines and dots are ink with a thin bone edge, so they read on
  the dark screenshots and on the paper. No glass, no glow, square corners.
  - Computers (at least 960×600, `.is-steps`): the sheet sticks in the middle of the screen (CSS
    sticky) for 1.75 screen-heights; its width follows the screen height so it always fits. The
    pins light up one at a time (dimmed → full, the line grows from the pin, the dot lands, a ring
    marks the current pin), and only the current note shows, in the strip beside the title block.
  - Phones, tablets and shorter screens (`.is-stack`): views and notes follow each other; each view
    sticks under the nav while its note rises below it, and the next view pushes it away.
  - A step only switches classes; CSS transitions (transform and opacity) do the motion, timed,
    never scrubbed. Scrolling back undoes the steps. Tab to the live-site link and the page
    scrolls to step 5.
  - Screens under 500px tall, reduced motion and no JavaScript get the finished sheet: every pin
    drawn, every note shown.
  "What it proves": its two closing lines slide in from opposite sides, scrubbed, transform
  only — no fade, so the text never rests faint.
- **03 What we do — the orbit.** Computers only: at least 1200×650, with
  `(hover: hover) and (pointer: fine)`. The three cards share one grid cell, so they get one size,
  and sit on a ring seen from slightly above. `.plans` pins between the nav and the bottom of the
  screen for 1.75 screen-heights. The ring turns clockwise as you scroll: the front card swings
  left and back, and the next one comes in from the right.
  - Order: price → 45 days → Care, 240° in all. It holds at 0–8%, 42–58% and 92–100% of the pin,
    with eased turns between (smootherstep), so wherever you stop, one card is almost always
    square at the front. Scroll only, no snapping.
  - Place on the ring: x = −0.56·width·sin θ, y = −0.16·height·(1 − cos θ)/2,
    scale = 1 − 0.24·(1 − cos θ)/2.
  - From 60° to 120° away from the front, a card dims to 45%, and its text (`.card-body`, not the
    glass or the edge) blurs to 3px and fades to 60%.
  - The front card sits at exactly scale 1, on whole pixels, so its text is sharp. Two cards only
    cross at the sides, where they don't overlap, so swapping which one is on top never shows.
  - Measured: the front card's soft text never drops below 5.4:1 through the whole turn.
  - Tab into a card at the back and the page scrolls to where it's at the front.
  - Phones, tablets, smaller screens, reduced motion and no JavaScript: the cards stay as laid
    out (stacked on phones) and simply rise and fade in. No swipe carousel.
- **04 How it works:** the browser holds the panels (CSS sticky); `js/sections.js` picks how they
  stack and only sets scale and opacity. Each panel has its own layout inside.
  - Computers and tablets (`.is-stack`): panels stick at `max(12vh, 86px) + index * 18px`, sized
    so all four bottoms line up near the bottom of the screen (the front one 820px at most). As the
    next panel arrives, the previous scales to 0.95. It dims to 60% only once the next one covers
    all its text: dimmed, the text on orange, violet and green fails AA (2.8, 3.5, 3.1 at 60%).
  - Phones, and any screen too short for the stack (`.is-flow`): a panel is taller than the
    screen, so it scrolls up normally and stops with its bottom edge just above the WhatsApp
    button; the next one slides over it. It scales to 0.95 and never dims.
  - The panels don't fade in (a fade would show the panel underneath). Reduced motion and no
    JavaScript: the panels simply follow each other.
- **prefers-reduced-motion:** no transforms, no scrubbing; everything simply visible. Text is not
  split. Section colours still change, as a plain fade. The neon edge stays violet.
- Keep the frame rate: animate only `transform` and `opacity`. One exception: the 03 orbit blurs
  the text of the cards at the back (computers only).

## 9. Placeholders for missing assets

Where an asset does not exist yet, render a clean placeholder box at the correct aspect ratio with
a visible label, for example `[TODO: Photo of Naren]`. Currently missing: Naren's photo, real
reviews.

## 10. Review checklist — run before saying a section is done

- [ ] Every word traceable to `WEBSITE-CONTENT.md`?
- [ ] Is this section's layout different from its neighbours?
- [ ] Anything centred that doesn't need to be?
- [ ] Any glass outside nav, hero, pricing, reviews? Remove it.
- [ ] Neon edge only on the nav and the three pricing cards? Only its opacity animating? Nothing
      glowing on or under text?
- [ ] Does the section have its `data-theme`? Are all colours theme tokens, not fixed values?
- [ ] Does every text/background pair pass WCAG AA — soft text, labels, buttons, focus rings,
      form borders included? Work the ratios out; don't eyeball them.
- [ ] Violet only as a 04 panel, the glow or the neon edge? Blue only in the hero and the neon
      edge? Orange accent `#E84A12` on bone, and only at 24px and up?
- [ ] More than one italic word in a heading? More than one primary button?
- [ ] Right reveal: headings `words`, paragraphs and lists `lines`, one big statement `chars`,
      cards and tables `reveal`? Nothing split inside a card?
- [ ] Any icon grid, emoji, gradient text, or banned buzzword?
- [ ] Works at 390px and 1440px? Keyboard focus visible? Console clean?
- [ ] Reduced motion respected?
