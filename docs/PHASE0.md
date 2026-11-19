# Phase 0: move the site to Eleventy (zero visible change)

Date: 19 November 2026. Branch: `phase0/eleventy`. Nothing here changes the live site.

## Purpose
Today the nav and footer are copied by hand into index, privacy, terms and 404.
Every change means editing four files. Eleventy fixes that: one nav, one footer,
one head, shared by every page. Phase 0 only makes the move. The pages must come out
exactly as they are today. The redesign and the new pages are later phases.

## What was added
- `package.json`, `package-lock.json`: Eleventy 3 as the only dev dependency. No runtime npm.
- `eleventy.config.js`: reads `_src/`, writes `_site/`, copies css, js, fonts, images,
  frames, icons, robots, sitemap, CNAME and `.htaccess` unchanged.
- `_src/`: `index`, `privacy`, `terms`, `404` as templates, plus shared parts in
  `_src/_includes/` (`head`, `nav`, `footer`, `analytics`) and one frame, `layouts/base.njk`.
- `_src/_data/site.js`: reads the site address from `tools/set-domain.js`, so the domain still lives in one place.
- `tools/compare-sites.py`: the old-versus-new checker (see below).
- `.gitignore`: `_site/` is build output and is not committed.

## What did not change
`css/`, `js/`, `fonts/`, `images/`, `frames/`, the root `*.html` files, `.htaccess`,
`tools/build-deploy.js` and `tools/set-domain.js`. The frozen intro, hero and nav are untouched.

## How to use it
    npm install
    npm run build     # writes _site/
    npm start         # builds, serves http://localhost:8080, rebuilds on save

## Checks run (19 November 2026)
1. The built HTML of all four pages is identical, byte for byte, to the pages on `main`
   (`diff`: 0 lines for index, privacy, terms, 404).
2. Every copied file (css, js, fonts, images, frames) has the same checksum as on `main`.
3. `tools/compare-sites.py`, at 1440 and 390 wide: HTML identical on every page, full-page
   screenshots 0 different pixels on every page, privacy, terms and 404 identical in every check,
   and the missing-address page identical.
4. The tool also flags the home page for two things. Both are noise, not changes:
   - Console lines: the Three.js deprecation warning, WebGL "GPU stall" notes and the blocked
     Cloudflare beacon. They appear the same on `main`.
   - Scroll-stop screenshots and the DOM text of the animated hero. Running `main` against
     itself gives the same kind of difference, and a second run of old against new
     dropped the desktop difference from 21,670 pixels to 15. One phone stop (844px down)
     differed by about 114,000 pixels in the tool in both runs. A direct repeat of that exact
     screen, three times each on old and new, at two waits, was pixel-identical every time.
     So the cause is the tool's scroll sequence with the hero frames, not Eleventy.

## Not verified
- A real phone and Safari or Firefox. Chrome only.
- The comparison tool's phone scroll-stop flag is explained by a direct test, not by finding its root cause.
- Deploy. Nothing was uploaded and no host setting was touched.

## Risks and the deploy question
- GitHub Pages serves the repo root of `main` today. The root `*.html` files are still there and
  still what the world sees. `_src/` produces the same pages, but until the deploy switches to
  `_site/` there are two copies of each page. Do not edit the root pages and `_src/` separately.
  Edit `_src/` and rebuild.
- The switch (a GitHub Actions workflow that builds and publishes `_site/`, then the Pages
  setting changed to "GitHub Actions") is a separate, small step and needs the repository's
  Pages settings. It should happen with the redesign work, not here.
- `tools/build-deploy.js` still builds the Hostinger upload from the root files. It keeps working.
  Later it should build from `_site/`.

## Migration plan
1. Merge this PR into a branch that is not `main` (or review it and keep `main` frozen).
2. Add the Actions deploy and switch Pages to it. Check the live site against the old one.
3. Delete the root copies of the four pages. From then on only `_src/` is edited.
4. Build the redesign (palette, new nav with phone menu, new pages) on top of the shared parts.

## Expected result
The site looks and behaves exactly as today. Editing the nav or footer takes one edit, not four.
