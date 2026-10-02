# Webessy Studios — project instructions

## What this is
Marketing site for Webessy Studios (brand mark "0400"), a web studio in Bengaluru run by Naren.
Plain HTML, CSS and vanilla JavaScript. No framework, no build step, no npm at runtime.
Must work when `index.html` is opened straight from disk (file://). Hosting later: Hostinger.

Explain everything to me in simple, plain English. Short sentences.

## Sources of truth
- **Every word on the site comes from `WEBSITE-CONTENT.md`.** Never invent copy.
  If something is missing, put a visible `[TODO: ...]` placeholder and tell me.
- Section layouts: "Page structure" below.
- Detailed design specs (type scale, spacing, glass, motion, components): the `webessy-design` skill.
- `BRIEF.md` is background only.

## Status
- **DONE — FROZEN:** Ignition intro (`js/intro.js`), hero (`js/hero.js`, `js/logo3d.js`, `frames/`),
  nav. Only change these to fix a bug I report. Never refactor, restyle or "improve" them.
  Two approved nav changes exist, and nothing else in the nav changes:
  1. Over bone and orange sections its links show at full strength, and over bone its glass is
     darker, so the links pass AA. It lives in the "section colours" block of `css/site.css`.
  2. The neon edge (see "Neon edge" under Design rules). Over bone and orange it drops its outer
     glow; that rule is in the same "section colours" block.
- **TO BUILD:** sections 02 to 06 and the footer, in `index.html` and `css/site.css`.
  Put new motion code in `js/sections.js`. The text reveal lives in `js/reveal.js`.

## Files
- `index.html` — the page. Placeholder sections `#work`, `#services`, `#contact` exist; replace them.
- `css/site.css` — all styles. Palette variables, the section colour themes, `.glass` and
  `.neon` are at the top. Reuse them.
- `js/gsap.min.js` (3.12.5), `js/three.min.js`, `js/logo3d.js`, `js/intro.js`, `js/hero.js`
- `js/ScrollTrigger.min.js` (3.12.5) — scroll-linked motion
- `js/reveal.js` — the text reveal and its splitter (see Motion below)
- `js/sections.js` — section colours and all motion for sections 02 to 06
- `frames/desktop/` (80 webp) and `frames/mobile/` (80 webp) — hero footage
- `fonts/` — create it; self-hosted font files go here

## Page structure — exactly these sections, in this order, nothing else
01 Hero (built) · 02 Work · 03 What we do · 04 How it works · 05 About · 06 Contact · Footer

**Do not add:** stats counters, client logo strips, FAQ, feature/icon grids, blog, newsletter,
"trusted by" bars, extra CTA banners, testimonial carousels, back-to-top buttons.

- **02 Work** — asymmetric. Label + big title pinned on the left (sticky). Yauvana screenshots on
  the right slide in from the side and grow as you scroll. Then four text blocks: The problem /
  The decision / What was built / What it proves. Then one short block, "You are looking at one
  of them". Then "We are early. That is the offer." as one big line of type — no box.
- **03 What we do** — price card in glass: "Websites from ₹6,499", "Every build includes" list,
  quote button. Beside it two glass cards: "45 days, included" and "Care ₹699 a month".
  All three have the neon edge. On computers (screen at least 1200×650, mouse or trackpad) the
  three cards sit on a ring instead: it pins and turns clockwise as you scroll, price → 45 days →
  Care, driven by scroll only, no snapping. Phones and tablets keep the cards stacked — no swiping.
  Below: "What we build" as a plain text list in 4 groups — no prices, no cards, no icons.
  Then the comparison table "What a website usually costs".
- **04 How it works** — the 8 steps grouped into 4 stacked sticky panels (2 steps each) that
  slide over each other as you scroll.
- **05 About** — photo on the left, Version B copy on the right. Reviews row below, in glass
  cards, driven by a data array. **If the array is empty, render nothing at all.**
- **06 Contact** — "Let's talk", WhatsApp button, email, the 3-line "what happens after you
  message", reply time. Small 4-field form (name, WhatsApp/phone, business, what you need).
- **Footer** — Webessy Studios · Bengaluru, India · WhatsApp · Email · © 2026.

## Design rules
- **Fonts:** Fraunces for section headings (max one italic accent word per heading), Instrument
  Sans for body and UI, JetBrains Mono for small labels such as `02 / WORK`. Bodoni Moda is for
  the hero's big title cards only (the end statement); never use it for section headings.
  Self-host woff2 files in `fonts/` (all four are OFL licensed). No Google Fonts `<link>`.
- **Accent word:** the one italic accent word in a heading may be orange. On bone use `#E84A12`
  (`--orange-deep`) instead of `#FF561D`, and only in large headings (24px and up), because it
  only reaches 3:1 there. On the orange Contact section the accent word stays ink.
  In CSS: `color: var(--accent)` — the theme picks the right one.
- **Colour: every section owns one background colour.**

  | Section | Background | Text |
  |---|---|---|
  | 01 Hero | its own footage (unchanged) | unchanged |
  | 02 Work | bone `#ECE7DA` | ink `#0C0C0A` |
  | 03 What we do | ultramarine `#1B1F5E` | bone |
  | 04 How it works | black `#05060F`; the 4 panels bone, orange, violet `#5B3FD9`, green `#79A643` | panels: ink, ink, bone, ink |
  | 05 About | bone | ink |
  | 06 Contact | orange `#FF561D` | ink |
  | Footer | black | bone |

  Each section declares its colour in the HTML: `<section data-theme="bone">` (themes: `black`,
  `bone`, `ultramarine`, `orange`). The background blends from one colour to the next as you
  scroll: when a section's top passes the middle of the screen, a fixed layer behind the page
  fades to its colour (about 0.7 seconds). The text colour switches during the fade, at the
  moment the new text colour reads better than the old one (about half-way).
  Never tie that fade to every pixel of scroll: half-way between bone and black, neither text
  colour passes AA, so the page must never be able to rest there.
  Section CSS takes colours only from the theme tokens (`--fg`, `--fg-soft`, `--line`,
  `--accent`, `--btn-bg`, `--btn-fg`). Never fixed colours.
- **Contrast: every text/background pair must pass WCAG AA** — 4.5:1 for normal text, 3:1 for
  text 24px and up, 3:1 for form borders and focus rings. Work the number out; don't guess.
- **Orange** is for buttons, the words "unfair advantage", the italic accent word, the Contact
  background, one 04 panel and the neon edge. **Violet** is one 04 panel, the glow behind glass
  and the neon edge (as the lighter `#8E7CFF`). **Blue** stays in the hero and the neon edge.
  No purple gradients. No gradient text.
- **Glass (`.glass`) is allowed only in:** nav, hero (built), pricing cards, review cards.
  Nowhere else. The pricing section gets a soft static glow behind it so the glass has
  something to refract. On bone (the 05 reviews), glass gets a light tint with ink text:
  the dark glass turns grey on bone and fails AA. Glass never overlaps glass, except in the 03
  orbit, where the front card sits over the two behind (they're dimmed, so its text stays AA).
- **Neon edge (`.neon`) is allowed only on:** the nav and the three 03 pricing cards. Nowhere
  else — not the review cards. It sits on top of `.glass`, which stays unchanged.
  - A 1px line of light on the glass edge, with a soft glow either side (cards: 8px out, 6px in;
    nav: 5px out, 4px in).
  - One colour at a time, with every edge changing together. One round takes 20 seconds:
    violet `#8E7CFF` → blue `#3D7BFF` → violet → orange `#FF561D` → violet. Never blue straight
    to orange: half-way between them is a muddy mauve. The darker violet `#5B3FD9` is too dim on
    ultramarine (2.25:1, against 3.9 and 4.7 for the blue and orange).
  - Only the edge glows. Never text, and never under text: the glow stays inside the card padding.
    Text contrast must not change.
  - Only opacity animates (three flat colour layers inside a mask drawn once). Never animate a
    gradient, shadow, filter or border colour for it: they redraw every frame and stutter on phones.
  - Over bone and orange the nav keeps the line but drops the outer glow, which looks like a
    smudge on a light background. With reduced motion the edge stays violet.
- **Avoid the AI look:** don't centre every section; vary the layout from section to section;
  no emoji; no icon-card grids; no identical rounded corners on everything; no words
  "unlock", "seamless", "elevate", "empower", "leverage", "cutting-edge".
- **Motion:** subtle, scroll-driven, never decorative for its own sake. The neon edge's slow
  colour drift is the one exception that runs on time. Always respect `prefers-reduced-motion`.
- **Text reveal:** mark text in the HTML with `data-reveal`:
  `"words"` for headings (the mono labels too), `"lines"` for paragraphs and lists,
  `"chars"` only for a single big statement line. Things that aren't text (cards, tables) use
  `class="reveal"`: a rise and fade. Text inside a card moves with its card; don't split it.
  The splitter is our own, in `js/reveal.js`: no paid plugins (no SplitText), and GSAP stays at
  3.12.5. Screen readers must read the text normally. With reduced motion nothing is split and
  all text is simply there.

## Hard rules
- **Never read, copy from, or commit `RATES.md`.** It is private and in `.gitignore`.
- **Never remove, crop, blur or cover the "Veo" watermark** in the bottom-right of the hero
  frames. Keep that corner of the hero clear of UI.
- **Never edit, rename or re-encode anything in `frames/`.**
- **No fake content:** no invented reviews, clients, numbers or stats.
- Contact details: WhatsApp `+91 80500 82158`, link
  `https://wa.me/918050082158?text=Hi%2C%20I%20saw%20your%20site%20and%20I%27d%20like%20a%20website%20for%20my%20business`,
  email `0400webessy@gmail.com`.
- Images: always set `width`, `height`, `alt`, and `loading="lazy"` below the hero.
- Mobile first. Every section must work at 390px and 1440px wide.

## Workflow
1. Before building a section: read its part of `WEBSITE-CONTENT.md`, then give me a short plan
   (structure, classes, motion, anything you need from me). **Wait for my approval.**
2. Build **one section per task.** Don't touch other sections or the frozen files.
3. After building: check it at 390px and 1440px if you can. The console must be clean.
4. Tell me in plain English what changed and which files. Suggest a commit message.
   **Don't commit or push unless I ask** — I do git myself.
