# Studio site — build brief

Working document. Lives in the repo. Claude Code reads this before every session.

---

## What changed from the first plan

| Original | Revised | Why |
|---|---|---|
| "Website agency" | Studio, written as "I" | One person, no clients yet. Studio scales to a team later without a rebrand. |
| Logo first, purpose unclear | Logo first, confirmed | The logo IS the hero animation. It has to exist before the hero can be designed. |
| Design direction, then content | Content, then design direction | Designing around fake text means every layout breaks when real words arrive. |
| GitHub repo at step 5 | Repo at the start, with this brief inside | Claude Code needs a fixed source of truth, not a re-explanation each session. |
| Frame hero built first | Intro animation first, frames second | The intro doubles as the loading cover for the frames. They are one system, built in order. |
| Veo frames generated early | Dummy frames first, Veo after the system works | Proves performance before spending time and credits. |
| One set of frames | Two sets: desktop and mobile | Cuts mobile weight by roughly 70%. |
| EZGif for frame export | ffmpeg | No upload limits, better quality, one command. |
| SEO at launch via Hostinger | SEO basics at launch, real SEO later | New sites do not rank for months. Early clients come from offline and outreach. |
| Portfolio treated as separate | This site IS portfolio piece #1 | A web developer's own site is real proof, not a placeholder. |

---

## Phase 0 — Decide (no code)

1. Studio name.
2. Check the domain is free. Do this before designing anything with the name on it.
3. One line on what you build and who for.
4. Rough price range. You do not have to publish it, but you need to know it.
5. Create the GitHub repo. Put this file in it.

Do not skip step 2. Designing a logo for a name you cannot own is a wasted week.

---

## Phase 1 — Logo

1. Plan concepts in chat. Three directions, not one.
2. Generate in Canva or ChatGPT.
3. **Export as SVG.** Not PNG. Not JPG.
4. Simplify the paths. Under 8 paths total. A complex logo cannot be animated cleanly.
5. Test it at 24px. If it turns to mush at nav size, it fails.

The SVG is the input to the entire hero animation. Everything downstream depends on this file being clean.

---

## Phase 2 — Content

Write before designing. All of it:

- Studio name and one-line positioning
- About: who you are, what you do, why you
- Services: what you build, how the process works, rough timeline
- Case studies: for each project — the problem, what you built, the outcome
- Contact: WhatsApp number, email
- Page titles and meta descriptions

Real words. No lorem ipsum anywhere in this project, at any stage.

---

## Phase 3 — Design direction

1. Collect references from Awwwards, Pinterest, Godly, Land-book.
2. Pull out what you actually want: type, spacing, motion feel, colour depth.
3. Lock the direction in chat.
4. Produce a mockup.
5. Write the locked direction into this file before opening Claude Code.

**Background rules (already decided):**
- Base is near-black with a slight warm tint, never `#000000`
- Faint grid at ~3% opacity
- Film grain at ~5% opacity
- Cursor-following soft light with a 0.9s ease lag; slow auto-drift when idle
- No colour-change flashes on the logo. Stay in one tone.
- Every background layer stays quieter than the project images

---

## Phase 4 — Build the site (no hero animation yet)

1. Set up Claude Code. Add skills.
2. Prompt from this brief, not from memory.
3. Mobile first. Build the phone layout, then widen.
4. Simple static hero for now. A still image or plain type.
5. All pages, all real content, all real images.
6. Wire the contact: WhatsApp button plus a form via Web3Forms.
7. Push to GitHub at the end of every session.

**Session rule: never leave the site broken overnight.** Jump around as much as you like, but every session ends with a version that runs and can be pushed.

Read every diff before approving it. Claude Code output gets reviewed, not accepted blindly.

---

## Phase 5 — Intro animation

Replaces the static hero.

1. Feed the logo SVG into the particle or line-draw animation.
2. Logo assembles in the centre.
3. Logo shrinks and travels to the nav position.
4. Headline and project cards enter **while the logo is still moving**, not after.
5. Cursor interaction on the background light.
6. Mobile: fewer particles, or skip the physics and fade in. Test on a cheap Android.

**Handoff rule: if anything leaves the centre, something must enter the centre within the same half second.** The hero is never empty.

**Scroll lock: 2.5 seconds maximum.** Any scroll or click after 1 second skips to the end state.

---

## Phase 6 — Frame sequence hero

Only start this once Phase 5 works.

1. Decide what the sequence shows.
2. Build the whole system with dummy frames from any free stock video. Test on a cheap phone.
3. If performance holds, generate the real clip in Veo. If not, rethink before spending.
4. Extract frames with ffmpeg. Zero-padded names: `frame_001.webp`.
5. Export two sets: desktop 1440px wide, mobile 720px. WebP, quality 70 to 75.
6. Preload starts on page load, in parallel with the intro.
7. Frame one doubles as a poster image. If frames are not ready when scroll unlocks, hold on the poster and swap in as they arrive.
8. Draw to canvas. Redraw only when the frame index changes, inside `requestAnimationFrame`.
9. GSAP ScrollTrigger with `scrub: true` drives the timeline.

**Targets:** 60 to 90 frames. Under 3 MB desktop, under 1.5 MB mobile. If you blow the budget, cut frames before you cut quality.

---

## Phase 7 — Review and fix

Check against this list, not vibes:

- [ ] Loads in under 3 seconds on 4G
- [ ] Works on a cheap Android phone, not just yours
- [ ] Contact form actually sends. Test it. Twice.
- [ ] WhatsApp button opens the right number
- [ ] No layout breaks between 320px and 1920px
- [ ] No lorem ipsum, no placeholder images
- [ ] Every page has a title and meta description
- [ ] Animation can be skipped
- [ ] Site still works with JavaScript slow or failing

---

## Phase 8 — Launch

1. Buy the domain.
2. Deploy. If the site is static, GitHub Pages, Netlify or Vercel will be faster and free. Hostinger shared hosting is slower for this. Domain and hosting do not have to be the same company.
3. Add analytics.
4. SEO basics: titles, meta descriptions, one page per service, fast load, sitemap.
5. Google Business Profile.

---

## Phase 9 — After launch

- Every new project goes into the portfolio as you finish it
- Real SEO work starts once 3 to 4 pieces are up
- Rewrite copy from "I" to "we" only when someone actually works with you

---

## Important notes

**Deadline: 3 weeks to live.** Not 3 weeks to perfect. Polish after it is public. A live imperfect site beats a perfect unfinished one.

**Scope creep is the named risk.** The rule is not "never add things". The rule is: nothing new starts until the current thing is built and verified. If an idea arrives mid-build, write it in a `LATER.md` file and keep going.

**Understand the code you ship.** The limit on what you can launch is not what AI can generate. It is whether you can open the file in six months and fix it. Read line by line before pasting.

**Test on the worst phone you can find.** Not your laptop. Not your phone.

**Everything above is changeable.** This is a working document, not a contract. Update it when a decision changes, and note what it replaced.

---

## Deliberately not in v1

Parked until the site is live and working:

- Logo-as-mask reveal
- MorphSVG effects
- Pricing page
- Blog
- Multi-language
