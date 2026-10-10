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
  Four approved nav changes exist, and nothing else in the nav changes:
  1. Over bone and orange sections its links show at full strength, and over bone its glass is
     darker, so the links pass AA. It lives in the "section colours" block of `css/site.css`.
  2. The neon edge (see "Neon edge" under Design rules). Over bone and orange it drops its outer
     glow; that rule is in the same "section colours" block.
  3. While one of the 04 panels is behind it, the nav takes its look over bone (change 1, and
     no outer glow). `js/sections.js` sets `data-nav="panel"` on `<html>`; the rules are in the
     same "section colours" block.
  4. (7 October 2026) Its button reads "Start your project" and looks like the page's main
     button (15px, the same orange and ink, no glow; 40px tall to fit the pill). Hovering no
     longer turns its text light (that failed AA). The rules are in the "nav" block.
  Hero end (7 October 2026, approved): the round "Explore" button is now the call to action,
  "Start your project" (`.btn .btn--primary`, opens WhatsApp). It keeps the class `.st-explore`,
  because `js/hero.js` shows it with the line under the statement and ends the thin line at it.
  `js/hero.js` itself is unchanged.
  Hero bug fixes (4 October 2026, iPhone stutter): phones (touch, under 720px wide) scroll the
  hero in 190vh instead of 312vh (`#hero` 290vh tall), and on phones and tablets the 3D 0400 is
  built and drawn once, unseen, while the page is still, so its first appearance doesn't freeze.
- **DONE (7 October 2026):** launch pages and SEO basics: Privacy, Terms, 404, favicons, link
  previews (`images/og-image.png`), canonical addresses, `robots.txt`, `sitemap.xml`. No meta
  description mentions Bengaluru (the page title may).
- **DONE (7 October 2026):** one call to action ("Start your project" everywhere), form checks
  and spam protection ("the two forms" in `js/sections.js`), Cloudflare Web Analytics on every
  page, http to https in `.htaccess`. A secrets check found nothing but the two public keys.
- **DONE (8–10 October 2026):** quality pass. Phones: no text under 14px, tap targets 44px (links
  inside sentences excepted). No line starts with a dash. The text reveal splits ahead instead of
  at load (start-up on a phone profile: seconds down to a fraction). Compression and caching in
  `.htaccess`. The unused original images were deleted (they're in git history). AVIF was tested
  and not adopted: only 16–23% smaller than our WebP for the photos and renders.
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
- `js/reviews.js` — the list the Reviews section is built from. Real reviews only; empty until the first one
- `frames/desktop/` (80 webp) and `frames/mobile/` (80 webp) — hero footage
- `fonts/` — self-hosted font files. Browsers keep them a year (`.htaccess`): a changed font needs a new file name.
- `images/` — WebP for the page (the Yauvana screenshots in `images/work/` in 720/1080/1440 sizes,
  the welcome picture), plus `og-image.png` and `logo-lockup.svg` (the source of the footer logo).
  Originals aren't kept here; git history has them. Browsers keep pictures a month.
- `privacy.html`, `terms.html` — the legal pages: bone, no JavaScript, styles in the "Launch pages"
  block of `css/site.css`. Their nav and footer are copies of `index.html`'s (the nav's links point
  to `index.html#…`), so a change to either goes in all three files. `[CONFIRM: …]` marks what Naren
  still has to decide. The privacy policy describes what the site really does: if a service, cookie,
  analytics or form is added, update it first.
- `404.html` — the server shows it for any missing address (`.htaccess`). It has `<base href="/">`,
  so its links and files work at deep addresses too.
- `.htaccess` — sends every http:// visit to https:// (301; no HSTS yet, on purpose), the 404
  page, and answers "not found" for `.md` and `.zip` files uploaded by mistake. It also compresses
  text files and sets caching: fonts a year, pictures (the frames too) a month; pages, styles and
  scripts are checked with the server on every visit, so an update shows at once.
- `robots.txt`, `sitemap.xml` — the real pages only: home, privacy, terms.
- `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` — the 0400 digits from `webessy-logo.svg` on black.
- `tools/set-domain.js` — the site's address (`https://webessy.com`) is written here, once. After
  changing it, run `node tools/set-domain.js`: it rewrites the canonical, link-preview, sitemap and
  robots addresses in every page. Don't write the domain anywhere else.

## Page structure — exactly these sections, in this order, nothing else
01 Hero (built) · 02 Work · 03 What we do · 04 How it works · 05 About · Reviews · 06 Contact · Footer

**Do not add:** stats counters, client logo strips, FAQ, feature/icon grids, blog, newsletter,
"trusted by" bars, extra CTA banners, testimonial carousels, back-to-top buttons.

- **02 Work** — asymmetric. Label + big title pinned on the left (sticky). Yauvana screenshots on
  the right slide in from the side and grow as you scroll. Then four text blocks: The problem /
  The decision / What was built / What it proves. Then one short block, "You are looking at one
  of them". Then "We are early. That is the offer." as one big line of type — no box.
- **03 What we do** (changed 3 October 2026) — four plan cards in glass, each showing only its
  name, its starting price and one "Start your project" button: Starter from ₹6,499, Business
  from ₹9,999, Advanced from ₹18,499, and Boss (no price: "Let’s talk scope and ideas directly").
  No feature lists or "what's included" details on the cards. All four have the neon edge and
  sit on a ring that holds in place (CSS sticky) and turns clockwise as you scroll, Starter →
  Business → Advanced → Boss, driven by scroll, no snapping. Since 4 October 2026 it turns at half
  the old speed, and while a finger or the mouse is on a card it waits, then catches up smoothly
  when you let go (the page keeps scrolling meanwhile). It runs on phones, tablets and
  computers (screens at least 500px tall). Reduced motion, no JavaScript and shorter screens
  keep the cards stacked — no swiping. Under the ring one line: "Special pricing for startups."
  Never the word "negotiable"; no enterprise discounts (enterprise clients go to Boss).
  Then two glass cards with the neon edge, "45 days, included" and "Care ₹699 a month", and the
  two promise lines under them. Below: "What we build" as a plain text list in 4 groups — no
  prices, no cards, no icons. Then the comparison table "What a website usually costs".
- **04 How it works** — the 8 steps grouped into 4 stacked sticky panels (2 steps each) that
  slide over each other as you scroll.
- **05 About** — photo on the left, Version B copy on the right.
- **Reviews** (no number, so Contact stays 06; added 3 October 2026) — full width: label, heading and the
  "Write a review" text link, then the reviews as light glass cards (name, business, review, optional photo;
  up to three in a row, stacked on phones, no carousel), built from the list in `js/reviews.js`. While the
  list is empty, the heading is "Be the first to write a review" and there are no cards. The link opens
  a panel with the review form (Web3Forms) and the "Send photos on WhatsApp" link. No stars, no numbers,
  no dates. Without JavaScript the section stays hidden.
- **06 Contact** — "Let's talk", the "Start your project" button, the 3-line "what happens after
  you message", the email (a text link), reply time. Small 4-field form (name, WhatsApp/phone,
  business, what you need); its Send is the quieter outlined button.
- **Footer** — Webessy Studios · Bengaluru, India · WhatsApp · Email · Privacy · Terms · © 2026.

## Design rules
- **One call to action** (7 October 2026): the main action everywhere is "Start your project",
  which opens WhatsApp. Same words and the same button (`.btn--primary`) in the nav, at the hero's
  end, on each plan card, in Contact and on the phones' floating button. Everything else is a
  text link (`.link`), never a competing button: the email, Write a review, Send photos on
  WhatsApp, the Yauvana link, Back to home on the 404. A form's own Send stays a button: primary
  in the review panel (its only action), outlined in Contact.
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
  | Reviews | bone | ink |
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
  something to refract. On bone (the review cards), glass gets a light tint with ink text:
  the dark glass turns grey on bone and fails AA. Glass never overlaps glass, except in the 03
  ring, where the front card sits over the cards behind (they're dimmed, so its text stays AA).
- **Neon edge (`.neon`) is allowed only on:** the nav and the 03 pricing cards (the four plans,
  45 days and Care). Nowhere else — not the review cards. It sits on top of `.glass`, which
  stays unchanged.
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
- **Analytics:** Cloudflare Web Analytics, its snippet exactly as given, just before `</body>` on
  every page (index, privacy, terms, 404). It sets no cookies, so there is no cookie banner. Its
  token is public by design. It only reports from the real domain: on file:// and localhost the
  console shows two Cloudflare lines (a refused report). Those are expected.
- **Forms** ("the two forms" in `js/sections.js`): required fields and formats checked with a
  plain line under the field; Web3Forms' `botcheck` honeypot; nothing sent within 3 seconds of
  the form opening (the "did not send" line shows instead); the button disabled while it sends.
  Inputs stay 16px or more (iPhones zoom in below that). Tests stub `fetch`: a real send emails Naren.
- Contact details: WhatsApp `+91 80500 82158`, link
  `https://wa.me/918050082158?text=Hi%2C%20I%20saw%20your%20site%20and%20I%27d%20like%20a%20website%20for%20my%20business`,
  email `0400webessy@gmail.com`.
- Images: always set `width`, `height`, `alt`, and `loading="lazy"` below the hero.
- Mobile first. Every section must work at 390px and 1440px wide (and at 360px and 430px:
  nothing wider than the screen, no badly broken lines). On phones no text is under 14px and
  every tap target is at least 44px tall (links inside a sentence excepted).

## Workflow
1. Before building a section: read its part of `WEBSITE-CONTENT.md`, then give me a short plan
   (structure, classes, motion, anything you need from me). **Wait for my approval.**
2. Build **one section per task.** Don't touch other sections or the frozen files.
3. After building: check it at 390px and 1440px if you can. The console must be clean.
4. Tell me in plain English what changed and which files. Suggest a commit message.
   **Don't commit or push unless I ask** — I do git myself.
