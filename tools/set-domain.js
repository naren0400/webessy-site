/* The site's address, written down in one place: SITE below.

   Search engines and link previews (WhatsApp, Facebook, LinkedIn, X) need the full address
   inside each page, so it can't only live here. To change it, edit SITE, then run this from
   the project folder:

       node tools/set-domain.js

   It writes the address into every spot listed in SPOTS and says what it changed. Running it
   again changes nothing. Nothing on the site runs this file; it is only a helper for you. */

const SITE = 'https://webessy.com'; // https://, then the domain, no slash at the end

/* Where the address is used. Each entry is the text just before an address; whatever
   address follows it now is replaced, and the rest of the link (like /privacy.html) stays. */
const PAGE = [
  '<link rel="canonical" href="',
  '<meta property="og:url" content="',
  '<meta property="og:image" content="',
  '<meta name="twitter:image" content="',
];
const SPOTS = {
  'index.html': PAGE,
  'privacy.html': PAGE,
  'terms.html': PAGE,
  'sitemap.xml': ['<loc>'],
  'robots.txt': ['Sitemap: '],
};

const fs = require('fs');
const path = require('path');

if (!/^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(SITE)) {
  console.error('SITE must look like https://example.com (https, the domain, no slash at the end). Now: ' + SITE);
  process.exit(1);
}

const root = path.join(__dirname, '..');
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
let problems = 0;

for (const [file, befores] of Object.entries(SPOTS)) {
  const where = path.join(root, file);
  if (!fs.existsSync(where)) { console.log(file.padEnd(14) + 'MISSING: file not found'); problems++; continue; }
  const text = fs.readFileSync(where, 'utf8');
  let out = text, found = 0, changed = 0;
  for (const before of befores) {
    const re = new RegExp(escape(before) + '(https?://[^/"<\\s]+)', 'g');
    let hits = 0;
    out = out.replace(re, (all, origin) => { hits++; if (origin !== SITE) changed++; return before + SITE; });
    if (!hits) { console.log(file.padEnd(14) + 'MISSING: nothing after ' + before); problems++; }
    found += hits;
  }
  if (out !== text) fs.writeFileSync(where, out);
  console.log(file.padEnd(14) + found + (found === 1 ? ' address, ' : ' addresses, ') + (changed ? changed + ' changed' : 'already right'));
}

console.log(problems
  ? '\n' + problems + ' problem(s) above: a page lost one of its address tags. Check it before going live.'
  : '\nDone. Every page uses ' + SITE);
process.exitCode = problems ? 1 : 0;
