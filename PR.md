# Phase 0: build the site with Eleventy (no visible change)

## Purpose
Share one nav, footer and head across all pages. Today they are copied into four files.

## What changes
- Adds Eleventy (`package.json`, `eleventy.config.js`) and the templates in `_src/`.
- `npm run build` writes `_site/`. `_site/` is not committed.
- Adds `tools/compare-sites.py` and `docs/PHASE0.md`.
- Root pages, css, js, fonts, images, frames and `.htaccess` are not touched.

## Evidence it changes nothing
- Built `index`, `privacy`, `terms` and `404` are byte-identical to `main`.
- Every copied asset has the same checksum as on `main`.
- Full-page screenshots at 1440 and 390 wide: 0 different pixels on every page.
- The compare tool's remaining flags on the animated home page are run-to-run noise,
  explained in `docs/PHASE0.md`.

## Risks
- Two copies of each page exist until deploy switches to `_site/`. Edit `_src/` only.
- Tested in Chrome only.

## Not in this PR
Deployment changes, the redesign and any new page.

## How to test
    npm install && npm run build
    diff <(git show main:index.html) _site/index.html     # no output
