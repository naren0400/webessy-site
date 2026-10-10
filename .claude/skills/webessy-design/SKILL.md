---
name: webessy-design
description: Design system for the Webessy Studios site — type scale, spacing, colour use, liquid glass recipe, component specs, section motion, and an anti-AI-look review checklist. Use whenever building or styling any section, component, or layout on this site.
---

# Webessy design system

The hero, intro and nav are finished and frozen (the nav has four approved changes: its contrast
fix in §3, the neon edge in §6, its look over the 04 panels in §3, and its "Start your project"
button in §7; the hero's end has the same button since 7 October 2026, also in §7).
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
| `--t-price` | the plan prices (₹6,499 …) | `clamp(56px, 8vw, 120px)`, at most 26cqi of the card | Fraunces 400 | 0.95 | -0.03em |
| `--t-body` | paragraphs | `17px` (16px under 720px) | Instrument Sans 400 | 1.6 | 0 |
| `--t-small` | captions, table cells | `14px` | Instrument Sans 400 | 1.5 | 0 |
| `--t-label` | `02 / WORK` style labels | `11.5px` (14px under 720px) | JetBrains Mono 400 | 1.2 | 0.14em, uppercase |

**Phones (under 720px): no text under 14px** (quality pass, 8 October 2026). That's why
`--t-label` is 14px there; the build sheet's small mono (pin numbers, the title block, the
Yauvana link) is 14px on phones too. Anything new follows the same rule.

**Line breaks.** Every " — " in the HTML has a no-break space before it (`&nbsp;—`), so no line
starts with a dash, and a number keeps its unit (`45&nbsp;days`). Paragraphs use
`text-wrap: pretty` (no single word alone on the last line), short display lines `balance`.
The reveal splits only at real spaces, so both survive it.

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
| Reviews (no number) | `bone` | bone | ink |
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
| 03 ring, readable cards (worst, measured across the whole turn): plan names · `#FF561D` "from" (24px+) · prices · Boss line · startups line | 10.0 · 4.2 · 10.9 · 10.9 · 11.8 |
| 45 days and Care cards (own glow): soft label · soft text · lead line · promise lines (bone 66%) | 5.5 · 5.7 · 10.5 · 6.0 |

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
- Vary composition: 02 is left-pinned/right-scrolling, 03 is a centred ring of four plan cards
  (§8) and then a 7/5 split (45 days, Care), 04 is full-width stacked, 05 is a 5/7 split mirrored, Reviews is full width
  (the heading with its Write a review link at the end of the line, then a row of cards), 06 is a 7/5 split.
  No two neighbours use the same layout.

## 5. Corners — a deliberate scale, not one radius everywhere

- `0` — tables, text blocks, images inside the Work section, dividers
- `4px` — form inputs
- `16px` — glass cards and section 04 panels
- `999px` — buttons and the nav pill (exists)

## 6. Liquid glass

Use the existing `.glass` class unchanged. It is smoked glass: a dark tint inside a 22px blur,
a bright 1px top highlight, and a soft drop shadow.

Glass only reads as glass with colour behind it. For the pricing section, add one **static** glow
layer behind the cards: one behind the ring (on `.plans__stage`), one behind 45 days and Care
(on `.extras`). The review cards have their own, below.

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

Never animate the glow. Never stack glass on glass — except in the 03 ring (§8), where the front
card sits over the cards behind. They're dimmed to 45% there, or the orange button of a card behind
would show through the front card's glass and drop its soft text to 3.6:1. A dimmed glass card
also lets a little of what's behind it through unblurred, so a card only dims once it's 45° from
the front, where it no longer overlaps the card coming in.

Glass takes on the colour behind it. On ultramarine (03) the dark smoked glass works with bone
text. On bone (the review cards) it turns grey, and bone text on it fails AA (3.3:1). Glass on
bone gets a light tint instead: a bone-white tint inside the blur, with ink text. Work out the
pairs before shipping it.

The review cards don't use `.glow-field`. Each card has its own still glow
(`.reviews__item::before`), exactly under the card with the same corners: it only shows through
the glass, never spills on to the bone or on to the next card, and works for any number of cards.
Soft gradients, no blur filter (a filter on every card is more for a phone to draw). Measured from
pixels: ink on the light glass 15.3:1 or more, the business line (ink 66%) 5.8:1 at worst; with
Contact's orange behind the last cards (the text turns orange's ink and ink 80%), 6.1:1 or more.

### Neon edge

Only on the nav and the 03 pricing cards (the four plans, 45 days and Care), on top of `.glass`
(which stays unchanged). Each
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

**One call to action** (7 October 2026) — "Start your project", which opens WhatsApp, is the
only primary button: the same words and the same button in the nav, at the hero's end (the old
Explore button's place, `.st-explore`, which hero.js ends its line at), on each plan card, in
Contact (under the copy, the three steps right under it) and floating on phones. Every other
action is a text link (`.link`): the email, Write a review, Send photos on WhatsApp, the Yauvana
link, Back to home on the 404. A form's own Send stays a button: primary in the review panel
(its only action), secondary in Contact, so it doesn't compete there.

**Buttons** — pill, `padding: 14px 22px`, Instrument Sans 500, 15px.
Primary: `var(--btn-bg)` fill, `var(--btn-fg)` text — orange with ink text, except on the orange
Contact section, where it's ink with bone text (an orange button would vanish there). The nav's
is always orange (its glass stays dark), 40px tall to sit 8px inside the pill.
Secondary: transparent, 1px `var(--line)` border, text `var(--fg)`; Contact's Send takes the
fields' ink 56% border (3.05:1 on orange). Both: visible `:focus-visible` outline 2px `var(--fg)`
offset 3px. While a form sends, its button is disabled (`cursor: progress`, no hover).

**Text links** (`.link`) — Instrument Sans 500, 15px, `var(--fg)`, underlined 1px (2px on
hover), offset 4px; 12px of padding cancelled by the margin, so they're at least 44px tall to
tap without taking room. Works on a `<button>` too.

**Tap targets: at least 44px** on phones. Standalone links that aren't `.link` (the footer row,
the email in Contact, the Yauvana link, the forms' "Message on WhatsApp") get the same padding
cancelled by a negative margin, worked out from their line height (`calc((45px - 1.5em) / 2)`;
45, not 44, so rounding never leaves 43.98). A small circle (pin 5) gets a 44px `::before`.
Links inside a sentence (the legal pages) are the one exception, as WCAG allows. The nav's
button is 40px (approved, frozen).

**Plan cards (glass)** — four: Starter, Business, Advanced, Boss. Each shows only its name, its
starting price and one button; never a feature list or "what's included". The heading reads as
one line ("Starter from ₹6,499"): the name as a `--t-label` label in `--fg` at the top, then at
the bottom "*from*" (Fraunces italic at `--t-h3`, `var(--accent)`: the heading's one accent word)
and the price at `--t-price`, capped at 26cqi so the widest, ₹18,499 (3.5em), fits; every card's
price is the same size. Boss has "Let’s talk scope and ideas directly" (Fraunces, 28–38px) where
the price would be. One primary button per card, on one line ("Start your project" on every
card since 7 October 2026), pointing to its heading (`aria-describedby`) so a screen reader names
the plan: four orange buttons in this section, approved 3 October 2026, because the ring shows one
card at full strength at a time. Without the ring: stacked on phones, two by two from 720px,
four in a row from 1280px (with a little less padding there). Under them, one line in Fraunces
at `--t-h3`: "Special pricing for startups." Never the word "negotiable"; no enterprise
discounts (enterprise clients go to Boss).

**45 days and Care (glass)** — label at the top, the lead line, their copy. Under the plans,
over their own glow: stacked on phones, side by side from 720px, a 7/5 split from 960px, each
promise line lined up under its card.

**Comparison table** — full width, no card, no radius. Header row in `--t-label`. Rows separated
by `--line`. The "Us" row: text in `--fg`, others in `--fg-soft`. On mobile, each row becomes a
stacked block, not a horizontal scroll.

**Section 04 panels** — four solid panels on the black section: bone, orange, violet, green, in
that order. 16px radius. Text is ink on bone, orange and green, and bone on violet. Large step
numbers in Fraunces at 70% of the panel's text colour: 30% fails AA on every panel (1.7–2.0:1),
and 70% gives 3.4:1 or better. Step titles `--t-h3`; body `--t-body`. Softer body text must
still reach 4.5:1: ink 80% on orange, ink 82% on green, bone 92% on violet.

**Review cards (glass)** — in the Reviews section, built from `js/reviews.js`. An optional photo
first: a square, 72px (80px on computers), square corners, from a 240 × 240 file. Then the review
in Fraunces italic 22px (the page adds the curly quotes), and the name and business in
`--t-label` at the bottom. On bone, the light glass from §6. Up to three in a row (each 340px or
wider; the row is only as wide as its cards), stacked on phones. No carousel, no neon edge.

**Review panel** — a `<dialog>` the "Write a review" link opens. Solid black
(`data-theme="black"` on the dialog), not glass, and nothing behind it is blurred: one flat dim
layer. Phones: full screen, slides up. From 720px: 560px wide on the right, full height, slides
in from the right. The title in Fraunces at `--t-h3`, a Close button (ghost), the form, then a
hairline and "Send photos on WhatsApp" (a text link). Opening puts the focus on the title, so a
phone keeps its keyboard down. The page behind is locked; where that takes a scrollbar away, the
page is padded by its width (never `scrollbar-gutter`: on the page it changes what vw measures,
and every heading sized in vw shrinks a little). Close, Escape and a click on the dim layer close
it, and the focus goes back to the link.

**Form** — labels above inputs, inputs 48px tall, 4px radius, 1px border, transparent
background, focus border `var(--fg)`; text 16px, or iPhones zoom in. Checked in JavaScript
("the two forms" in `js/sections.js`): required fields, a phone number of 10 digits or more, a
link that is a web address (the https:// may be left out), an email address that looks like one.
A plain message under the field, from the field's `data-empty`, `data-short` or `data-bad`.
Spam: Web3Forms' `botcheck` honeypot (ticked: it only pretends to send), and nothing goes within
3 seconds of the form opening (the "did not send" line shows). No floating labels. On the
orange Contact section: text in ink, input borders at least ink 56% (the 3:1 a form border needs
on orange), and error messages in ink — never red, which fails on orange.

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
  Splitting happens ahead, not at load (8 October 2026): a second trigger splits an element's
  text when it is 1.5 screens below the screen (and at load, whatever is already that close).
  Split all at once, the text was thousands of extra boxes, and a phone profile spent 1.4–3.6s
  laying the page out while it loaded; now 20–200ms. ScrollTrigger runs before the browser
  paints, so even after a jump from the nav no text shows before it's hidden (tested at 390 and
  1440: 0 of 55).
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
- **03 What we do — the ring** (four plan cards since 3 October 2026). Every screen at least
  500px tall: phones, tablets and computers. The four cards share one grid cell, so they get one
  size (`--card-w`: 82vw up to 330px on phones, 52vw up to 420px from 720px, 400–460px from
  1200px; nearly square), and sit on a ring seen from slightly above. The browser holds the
  stage (`.plans__stage`: the ring and the startups line) by CSS sticky, never a JS pin, which
  jumps on iPhones as it locks: it holds in the middle of the screen under the nav, above the
  WhatsApp button on phones, while 4.4 screen-heights of space after it scroll past (`::after`;
  2.6 until 4 October 2026, when the turns were slowed to half speed).
  The ring turns clockwise as you scroll: the front card swings left and back, and the next one
  comes in from the right.
  - Order: Starter → Business → Advanced → Boss, 270° in all. It holds at 0–3.5%, 30–37%,
    63–70% and 96.5–100% of the held scroll, with eased turns between (smootherstep, each quarter
    turn over 1.17 screen-heights), so wherever you stop, one card is almost always square at the
    front. Scroll only, no snapping, no swiping.
  - Hold (approved 4 October 2026): while a finger or the mouse is on a card, the ring waits
    where it is; the page itself still scrolls. On release it turns round to where the scroll has
    got to (smootherstep, 0.5s plus 0.1s per 60°), landing exactly on the scroll's position even
    if it moved meanwhile. The mouse holds it only after a real move on to a card, never when a
    card turns in under a still pointer (or a resting mouse would freeze the ring). Keyboard focus
    (`:focus-visible`) lets go of a mouse hold, so Tab still brings a card to the front.
  - Place on the ring: x = −0.7·width·sin θ, y = −0.2·height·(1 − cos θ)/2,
    scale = 1 − 0.24·(1 − cos θ)/2. With four cards the ring must be at least 1.36 cards wide:
    two cards change places (which one is on top) when they're equally far round, and at 0.56
    they'd still overlap in the middle then, so the swap would show.
  - From 45° to 90° away from the front, a card dims to 45% and its text (`.card-body`, not the
    glass or the edge) fades to 60% of that; on computers (`(hover: hover) and (pointer: fine)`)
    the text also blurs to 3px. Phones and tablets don't blur (re-blurring text every frame is
    what a phone finds hard); their text fades out completely instead, so no half words show at
    the screen edges. Not before 45°: a dimmed glass card lets what's behind it through unblurred,
    and before then it overlaps the card coming in.
  - The front card sits at exactly scale 1, on whole pixels, so its text is sharp. The cards have
    `will-change: transform`, and their `.card-body` `will-change: opacity`: without it, fading
    the text makes Chrome rebuild its layers on every frame (1.4ms a frame on a phone, against
    0.02ms). Styles are written straight to the cards, only when they change.
  - Measured from pixels across the whole turn: see §3.
  - Tab into a card that isn't at the front and the page scrolls to where it is.
  - Smoothness, measured on a 4× slower phone profile (390×844, DPR 3, touch drags), per 1000px
    scrolled: 330–358 tasks over 16.7ms and 281–307 dropped frames, against Contact 351 / 228 and
    04 379–398 / 431–525 in the same session. Most of the cost is the browser re-checking the page
    for every element moved from JS (any moving box costs about 2ms a frame here); the glass blur
    and the neon edge make no difference.
  - Shorter screens (a phone on its side): the cards stay as laid out (two by two) and rise and
    fade in by a CSS transition. Reduced motion and no JavaScript: simply there.
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
- **Reviews:** nothing is tied to scroll. The label and the heading rise word by word; the link
  and each card rise and fade once. The cards do it by a CSS transition (`.is-waiting`, then
  `.is-in`, from an IntersectionObserver at 85%), not GSAP: phones run a transition off the main
  thread, and GSAP rewrites a glass card's style on every frame. Measured on a 4× slower phone
  profile, dropped frames per 1000px scrolled: about 290 with GSAP, 230 with the transition, 190
  for Contact. The panel slides in (0.5s, transform only, while the dim layer fades) and slides
  out before it closes. Reduced motion: the cards are simply there, and the panel appears and goes
  at once.
- **prefers-reduced-motion:** no transforms, no scrubbing; everything simply visible. Text is not
  split. Section colours still change, as a plain fade. The neon edge stays violet.
- Keep the frame rate: animate only `transform` and `opacity`. One exception: the 03 ring blurs
  the text of the cards at the back (computers only).
- **Measuring the page** (4 October 2026, the iPhone stutter): `ScrollTrigger.refresh()` scrolls
  the page to the top and back in one step, which stops an iPhone flick dead and can jump the
  page. Never call it directly: call `measureWhenStill()` in `js/sections.js`, which waits until
  the scroll has stopped and no finger is on the screen. ScrollTrigger's own refresh on "load"
  and "DOMContentLoaded" is switched off for the same reason ("load" comes late on iPhones: it
  waits for the hero's 80 frames). So that every trigger is in the right place before the first
  full measure, set up anything that changes the page's height (like the build sheet, the ring
  and the 04 stack) before the text reveal and `riseIn`, which run last, at the bottom of
  `js/sections.js`.

## 9. Placeholders for missing assets

Where an asset does not exist yet, render a clean placeholder box at the correct aspect ratio with
a visible label, for example `[TODO: Photo of Naren]`. Currently missing: Naren's photo, real
reviews (until the first one, the Reviews section shows its empty state, "Be the first to write
a review").

## 10. Review checklist — run before saying a section is done

- [ ] Every word traceable to `WEBSITE-CONTENT.md`?
- [ ] Is this section's layout different from its neighbours?
- [ ] Anything centred that doesn't need to be?
- [ ] Any glass outside nav, hero, pricing, reviews? Remove it.
- [ ] Neon edge only on the nav and the 03 pricing cards? Only its opacity animating? Nothing
      glowing on or under text?
- [ ] Does the section have its `data-theme`? Are all colours theme tokens, not fixed values?
- [ ] Does every text/background pair pass WCAG AA — soft text, labels, buttons, focus rings,
      form borders included? Work the ratios out; don't eyeball them.
- [ ] Violet only as a 04 panel, the glow or the neon edge? Blue only in the hero and the neon
      edge? Orange accent `#E84A12` on bone, and only at 24px and up?
- [ ] More than one italic word in a heading? A primary button that isn't "Start your project"
      (a form's own Send aside)? A secondary action shaped like a button instead of a text link?
- [ ] Right reveal: headings `words`, paragraphs and lists `lines`, one big statement `chars`,
      cards and tables `reveal`? Nothing split inside a card?
- [ ] Any icon grid, emoji, gradient text, or banned buzzword?
- [ ] Works at 390px and 1440px? Keyboard focus visible? Console clean?
- [ ] Reduced motion respected?
