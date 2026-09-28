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
- **TO BUILD:** sections 02 to 06 and the footer, in `index.html` and `css/site.css`.
  Put any new motion code in a new file `js/sections.js`.

## Files
- `index.html` — the page. Placeholder sections `#work`, `#services`, `#contact` exist; replace them.
- `css/site.css` — all styles. Palette variables and `.glass` already exist at the top. Reuse them.
- `js/gsap.min.js` (3.12.5), `js/three.min.js`, `js/logo3d.js`, `js/intro.js`, `js/hero.js`
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
- **Fonts:** Fraunces for headings (max one italic accent word per heading), Instrument Sans
  for body and UI, JetBrains Mono for small labels such as `02 / WORK`.
  Self-host woff2 files in `fonts/` (all three are OFL licensed). No Google Fonts `<link>`.
- **Colour:** violet and blue live in the hero only. Below the hero the page is near-black
  `var(--bg)`. The only accent below the hero is `var(--orange)`: buttons and the words
  "unfair advantage". No purple gradients. No gradient text.
- **Glass (`.glass`) is allowed only in:** nav, hero (built), pricing cards, review cards.
  Nowhere else. The pricing section gets a soft static glow behind it so the glass has
  something to refract.
- **Avoid the AI look:** don't centre every section; vary the layout from section to section;
  no emoji; no icon-card grids; no identical rounded corners on everything; no words
  "unlock", "seamless", "elevate", "empower", "leverage", "cutting-edge".
- **Motion:** subtle, scroll-driven, never decorative for its own sake.
  Always respect `prefers-reduced-motion`.

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
