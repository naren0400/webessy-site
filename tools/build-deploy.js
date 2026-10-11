/* Builds the upload: deploy/, a clean copy of the live site, and deploy.zip with the same files.
   Run it from the project folder after every change, before you upload:

       node tools/build-deploy.js

   It starts from the pages in PAGES and collects every file they use (styles, scripts, fonts,
   pictures in every size, icons, other pages they link to), then every file those use in turn,
   and copies exactly those, unchanged. The few files no page names are listed in EXTRAS. Nothing
   else goes in: not the notes (.md), the zips, the old prototype, the logo sources, tools/ or .git/.

   Each run deletes the old deploy/ and deploy.zip first. So never edit files inside deploy/:
   edit the originals, then run this again.

   deploy.zip has index.html and .htaccess at the top, with no folder around them. On Hostinger,
   upload it to public_html, extract it there, then delete the zip.

   It stops, says why, and leaves no deploy/ and no zip if:
   - a page (or its CSS) names a file that doesn't exist, or spells it with other capitals
     (Hostinger's server treats Photo.webp and photo.webp as two different files);
   - a file that matches NEVER would be copied;
   - a page or the CSS loads something from a website that isn't in ALLOWED_HOSTS.

   Nothing on the site runs this file; it is only a helper for you. */

// The pages the site is built from. Any other page they link to comes along too.
const PAGES = ['index.html', 'privacy.html', 'terms.html', '404.html'];

// Files no page names, but the live site needs. * stands for any name inside that folder.
const EXTRAS = [
  '.htaccess',             // server rules: https, the 404 page, compression, caching
  'robots.txt',            // for search engines
  'sitemap.xml',           // for search engines
  'images/og-image.png',   // link previews (the pages name it by its full web address)
  'frames/desktop/*.webp', // the hero footage: js/hero.js loads the frames by number,
  'frames/mobile/*.webp',  //   so no page names them one by one
  'fonts/OFL-*.txt',       // the font licences: the OFL asks that they travel with the fonts
];

// Never online, whatever links to it. The build stops if one of these would be copied.
const NEVER = [
  /\.(md|zip)$/i,                                   // the working notes (RATES.md and the rest), zips
  /^(ignition\.html|hero-preview\.png)$/i,          // the old prototype and a preview picture
  /^(\.git|\.claude|tools|node_modules|deploy)\//i, // git, Claude, these helpers, the output itself
  /(^|\/)(desktop\.ini|thumbs\.db|\.ds_store)$/i,   // folder settings Windows and Macs leave behind
];

// The only other websites a page may load files from or send a form to. A new one (a font
// service, a video, a map) also needs a line in privacy.html before it goes in here.
const ALLOWED_HOSTS = ['static.cloudflareinsights.com', 'api.web3forms.com', 'wa.me'];

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.join(__dirname, '..');
const OUT = path.join(root, 'deploy');
const ZIP = path.join(root, 'deploy.zip');
const abs = (file) => path.join(root, ...file.split('/'));
const read = (file) => fs.readFileSync(abs(file), 'utf8');

// The site's address, from tools/set-domain.js. Links to it (like the link-preview picture)
// count as links to our own files.
let SITE = null;
try { SITE = (fs.readFileSync(path.join(__dirname, 'set-domain.js'), 'utf8').match(/const SITE = '([^']+)'/) || [])[1] || null; }
catch (e) { /* no set-domain.js: full addresses are then treated as other websites */ }

const files = new Map();      // file -> the file that first named it
const queue = [];
const problems = new Set();   // reasons to stop
const notes = new Set();      // worth a look, but not a reason to stop
const pageSites = new Set();  // the address in each page's canonical link

/* ---- Does a file exist, with exactly these capitals? ---- */

const listings = new Map();
function namesIn(dir) {
  if (!listings.has(dir)) {
    let names = null;
    try { names = fs.readdirSync(dir ? abs(dir) : root); } catch (e) { /* not a folder */ }
    listings.set(dir, names);
  }
  return listings.get(dir);
}
// 'file', 'folder', 'case' (it exists with other capitals) or null
function lookup(file) {
  let dir = '';
  for (const part of file.split('/')) {
    const names = namesIn(dir);
    if (!names) return null;
    if (!names.includes(part)) return names.some((n) => n.toLowerCase() === part.toLowerCase()) ? 'case' : null;
    dir = dir ? dir + '/' + part : part;
  }
  return fs.statSync(abs(file)).isDirectory() ? 'folder' : 'file';
}

/* ---- What a reference points at ---- */

// { file } for one of our files, { host } for another website, null for #top, mailto: and such.
function resolve(ref, baseDir) {
  ref = ref.trim().replace(/&amp;/g, '&');
  if (!ref || ref[0] === '#' || /^(mailto|tel|sms|data|javascript|blob|about):/i.test(ref)) return null;
  if (/^(https?:)?\/\//i.test(ref)) {
    let url;
    try { url = new URL(ref, 'https://localhost/'); } catch (e) { return null; }
    if (!SITE || url.origin !== SITE) return { host: url.hostname };
    ref = url.pathname;
  } else if (/^[a-z][a-z0-9+.-]*:/i.test(ref)) return null;
  let p = ref.split(/[?#]/)[0];   // css/site.css?v=2 is css/site.css
  try { p = decodeURIComponent(p); } catch (e) { /* keep it as written */ }
  p = path.posix.normalize(p.startsWith('/') ? p.slice(1) : path.posix.join(baseDir, p));
  if (p === '.' || p === './') p = '';
  if (p === '..' || p.startsWith('../')) return { outside: true };
  if (p === '' || p.endsWith('/')) p += 'index.html';
  return { file: p };
}

// kind: 'load' (the browser fetches it, or a form sends to it), 'link' (a page or file people or
// search engines open), 'hint' (a path written in a script; it may be built on the fly).
function use(ref, baseDir, from, kind) {
  const r = resolve(ref, baseDir);
  if (!r) return;
  if (r.host) {
    if (kind === 'load' && !ALLOWED_HOSTS.includes(r.host.toLowerCase())) {
      problems.add(from + ' loads ' + ref + ' from ' + r.host + ', which is not in ALLOWED_HOSTS.');
    }
    return;
  }
  if (r.outside) { problems.add(from + ' names ' + ref + ', which is outside the project folder.'); return; }
  let file = r.file, found = lookup(file);
  if (found === 'folder') { file += '/index.html'; found = lookup(file); }
  if (found === 'case') { problems.add(from + ' names ' + file + ', but the real name has other capitals. Hostinger would not find it.'); return; }
  if (found !== 'file') {
    if (kind === 'hint') notes.add(from + ' mentions ' + file + ', which does not exist. If the page uses it, add the file.');
    else problems.add(from + ' names ' + file + ', which does not exist.');
    return;
  }
  add(file, from);
}

function add(file, from) {
  if (files.has(file)) return;
  if (NEVER.some((re) => re.test(file))) { problems.add(from + ' names ' + file + ', which must never go online (NEVER).'); return; }
  files.set(file, from);
  queue.push(file);
}

/* ---- Reading pages, styles and scripts ---- */

const ATTRS = `((?:[^>"']|"[^"]*"|'[^']*')*)`;   // a tag's attributes, even with > inside quotes
const LOADING_RELS = /\b(stylesheet|icon|apple-touch-icon|mask-icon|manifest|preload|modulepreload|prefetch|preconnect|dns-prefetch)\b/;

function scanHtml(file) {
  const dir = path.posix.dirname(file) === '.' ? '' : path.posix.dirname(file);
  let html = read(file).replace(/<!--[\s\S]*?-->/g, '');   // comments aren't links
  let base = dir;
  const b = new RegExp('<base\\b' + ATTRS + '>', 'i').exec(html);
  const baseHref = b && /\bhref\s*=\s*["']([^"']*)["']/i.exec(b[1]);
  if (baseHref && baseHref[1].startsWith('/') && !baseHref[1].startsWith('//')) {
    base = baseHref[1].slice(1).replace(/[^/]*$/, '').replace(/\/$/, '');
  }
  // Inline scripts and styles: read them, then set them aside so their text isn't taken for tags.
  html = html.replace(new RegExp('<script\\b' + ATTRS + '>([\\s\\S]*?)</script\\s*>', 'gi'), (all, attrs, code) => { scanJs(code, file, base); return '<script' + attrs + '>'; });
  html = html.replace(new RegExp('<style\\b' + ATTRS + '>([\\s\\S]*?)</style\\s*>', 'gi'), (all, attrs, css) => { scanCss(css, base, file); return '<style' + attrs + '>'; });

  for (const [, name, attrText] of html.matchAll(new RegExp('<([a-z][\\w:-]*)' + ATTRS + '>', 'gi'))) {
    const tag = name.toLowerCase(), a = {};
    for (const m of attrText.matchAll(/([^\s"'>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
      a[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
    }
    if (a.src !== undefined) use(a.src, base, file, 'load');
    if (a.srcset) for (const c of a.srcset.split(',')) use(c.trim().split(/\s+/)[0], base, file, 'load');
    if (a.poster) use(a.poster, base, file, 'load');
    if (tag === 'object' && a.data) use(a.data, base, file, 'load');
    if (tag === 'form' && a.action) use(a.action, base, file, 'load');
    const href = a.href ?? a['xlink:href'];
    if (href !== undefined && tag !== 'base') {
      const rel = (a.rel || '').toLowerCase();
      const loads = tag === 'link' ? LOADING_RELS.test(rel) : tag !== 'a' && tag !== 'area';
      use(href, base, file, loads ? 'load' : 'link');
      if (tag === 'link' && /\bcanonical\b/.test(rel) && /^https?:\/\//i.test(href)) pageSites.add(new URL(href).origin);
    }
    if (tag === 'meta' && a.content && /^(https?:\/\/|\/)/i.test(a.content.trim())) use(a.content, base, file, 'link');
    for (const v of Object.values(a)) if (v.includes('url(')) scanCss(v, base, file);   // style="", SVG fills
  }
}

function scanCss(css, dir, from) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of css.matchAll(/@import\s+(?:url\(\s*)?(["']?)([^"')\s;]+)\1/gi)) use(m[2], dir, from, 'load');
  for (const m of css.matchAll(/url\(\s*(["']?)([^"')]*?)\1\s*\)/gi)) use(m[2], dir, from, 'load');
}

// Paths in a script are read from the page that runs it (our pages sit in the top folder).
const LOOKS_LIKE_A_FILE = /^(?![a-z][a-z0-9+.-]*:|\/\/)[\w\-.\/~%]*[\w\-~%]\.(html?|css|m?js|json|webp|avif|png|jpe?g|gif|svg|ico|woff2?|ttf|otf|mp4|webm|mp3|ogg|wav|glb|gltf|bin|txt|xml|pdf|vtt)([?#]\S*)?$/i;
function scanJs(code, from, base) {
  for (const s of jsStrings(code)) if (LOOKS_LIKE_A_FILE.test(s)) use(s, base || '', from, 'hint');
}

// Every quoted string in a script, skipping comments (so an example inside a comment doesn't count).
function jsStrings(code) {
  const out = [], n = code.length;
  let i = 0, prev = '';   // prev: the last word or symbol, to tell a /regex/ from a division
  const regexCanStart = () => prev === '' || /^[(,=:[!&|?{};+\-*%<>~^]$/.test(prev) ||
    /^(return|typeof|case|do|else|in|of|new|delete|void|throw|instanceof|yield|await)$/.test(prev);
  function quoted(q) {
    let s = '';
    for (i++; i < n && code[i] !== q && code[i] !== '\n'; i++) {
      if (code[i] === '\\') { s += code[i + 1] || ''; i++; } else s += code[i];
    }
    i++;
    return s;
  }
  function template() {
    let s = '', plain = true;
    for (i++; i < n && code[i] !== '`'; ) {
      if (code[i] === '\\') { s += code[i + 1] || ''; i += 2; }
      else if (code[i] === '$' && code[i + 1] === '{') { i += 2; plain = false; const p = prev; prev = ''; walk(true); prev = p; }
      else s += code[i++];
    }
    i++;
    if (plain) out.push(s);
  }
  function regex() {
    let inClass = false;
    for (i++; i < n && code[i] !== '\n'; i++) {
      if (code[i] === '\\') i++;
      else if (inClass) { if (code[i] === ']') inClass = false; }
      else if (code[i] === '[') inClass = true;
      else if (code[i] === '/') { i++; while (i < n && /[a-z]/i.test(code[i])) i++; return; }
    }
  }
  function walk(untilBrace) {
    let depth = 0;
    while (i < n) {
      const c = code[i], d = code[i + 1];
      if (c === '/' && d === '/') { i = code.indexOf('\n', i); if (i < 0) i = n; }
      else if (c === '/' && d === '*') { i = code.indexOf('*/', i + 2); i = i < 0 ? n : i + 2; }
      else if (c === '"' || c === "'") { out.push(quoted(c)); prev = 'x'; }
      else if (c === '`') { template(); prev = 'x'; }
      else if (c === '/') { if (regexCanStart()) { regex(); prev = 'x'; } else { prev = '/'; i++; } }
      else if (/[\w$]/.test(c)) { const w = /^[\w$]+/.exec(code.slice(i, i + 64))[0]; prev = w; i += w.length; }
      else {
        if (c === '{') depth++;
        else if (c === '}') { if (untilBrace && depth === 0) { i++; return; } depth--; }
        if (!/\s/.test(c)) prev = c;
        i++;
      }
    }
  }
  walk(false);
  return out;
}

// sitemap.xml, robots.txt, .htaccess: their own addresses must point at real pages.
function scanOther(file) {
  const text = read(file);
  if (file === '.htaccess') for (const m of text.matchAll(/^\s*ErrorDocument\s+\d+\s+(\/\S*)/gim)) use(m[1], '', file, 'link');
  else for (const m of text.matchAll(/https?:\/\/[^\s<>"']+/g)) use(m[0], '', file, 'link');
}

/* ---- The zip ---- */

const crc32 = zlib.crc32 || ((table) => (buf) => {   // zlib.crc32 is built in from Node 22
  let c = -1;
  for (const byte of buf) c = table[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
})(Array.from({ length: 256 }, (x, n) => { for (let k = 0; k < 8; k++) n = n & 1 ? 0xEDB88320 ^ (n >>> 1) : n >>> 1; return n >>> 0; }));

// entries: [{ name: 'css/site.css' or 'css/', data, mtime }]. Names use forward slashes, as the
// zip format asks; Windows' own zip command writes backslashes, which a Linux server can
// unpack as files with a \ in their names. Permissions are stored for Linux: files 644, folders 755.
function writeZip(entries, out) {
  const parts = [], central = [];
  let offset = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name, 'utf8'), dir = e.name.endsWith('/');
    const data = dir ? Buffer.alloc(0) : e.data;
    const packed = data.length ? zlib.deflateRawSync(data, { level: 9 }) : data;
    const deflate = packed.length < data.length;
    const body = deflate ? packed : data;
    const d = e.mtime, year = Math.max(d.getFullYear(), 1980);
    const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    const date = ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    const flags = /[^\x20-\x7e]/.test(e.name) ? 0x800 : 0;   // 0x800: the name is UTF-8
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(flags, 6);
    local.writeUInt16LE(deflate ? 8 : 0, 8); local.writeUInt16LE(time, 10); local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(body.length, 18); local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26); local.writeUInt16LE(0, 28);
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(0x0314, 4); cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(flags, 8); cen.writeUInt16LE(deflate ? 8 : 0, 10); cen.writeUInt16LE(time, 12);
    cen.writeUInt16LE(date, 14); cen.writeUInt32LE(crc, 16); cen.writeUInt32LE(body.length, 20);
    cen.writeUInt32LE(data.length, 24); cen.writeUInt16LE(name.length, 28);
    cen.writeUInt32LE((((dir ? 0o40755 : 0o100644) << 16) | (dir ? 0x10 : 0)) >>> 0, 38);
    cen.writeUInt32LE(offset, 42);
    parts.push(local, name, body);
    central.push(cen, name);
    offset += local.length + name.length + body.length;
  }
  const size = central.reduce((s, b) => s + b.length, 0);
  if (entries.length > 65000 || offset + size > 0xFFFFFFFF) throw new Error('too big for a simple zip');
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(size, 12); end.writeUInt32LE(offset, 16);
  fs.writeFileSync(out, Buffer.concat([...parts, ...central, end]));
}

/* ---- Build ---- */

const size = (b) => (b >= 1048576 ? (b / 1048576).toFixed(2) + ' MB' : (b / 1024).toFixed(1) + ' KB');
const topFirst = (a, b) => (a.includes('/') - b.includes('/')) || (a < b ? -1 : a > b ? 1 : 0);

function main() {
  // 1. Start clean, so an old upload can never be mistaken for a new one.
  try {
    fs.rmSync(OUT, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    fs.rmSync(ZIP, { force: true, maxRetries: 5, retryDelay: 200 });
  } catch (e) {
    console.error('Could not delete the old deploy/ or deploy.zip (' + e.code + '). Close anything that has them open, then run this again.');
    return 1;
  }

  // 2. Collect: the pages, the extras, then everything they use, and everything that uses.
  for (const page of PAGES) use(page, '', 'PAGES', 'link');
  for (const extra of EXTRAS) {
    let matches = [extra];
    if (extra.includes('*')) {
      const dir = path.posix.dirname(extra) === '.' ? '' : path.posix.dirname(extra);
      const re = new RegExp('^' + path.posix.basename(extra).split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*') + '$');
      matches = (namesIn(dir) || []).filter((n) => re.test(n)).map((n) => (dir ? dir + '/' : '') + n);
      if (!matches.length) problems.add('EXTRAS: nothing matches ' + extra + '.');
    }
    for (const file of matches) {
      const found = lookup(file);
      if (found === 'file') add(file, 'EXTRAS');
      else if (!extra.includes('*')) problems.add('EXTRAS: ' + file + (found === 'case' ? ' has other capitals on disk.' : ' does not exist.'));
    }
  }
  while (queue.length) {
    const file = queue.shift(), ext = path.posix.extname(file).toLowerCase();
    if (ext === '.html' || ext === '.htm') scanHtml(file);
    else if (ext === '.css') scanCss(read(file), path.posix.dirname(file) === '.' ? '' : path.posix.dirname(file), file);
    else if (ext === '.js' || ext === '.mjs') scanJs(read(file), file, '');
    else if (file === '.htaccess' || ext === '.xml' || file === 'robots.txt') scanOther(file);
  }
  for (const site of pageSites) {
    if (SITE && site !== SITE) notes.add('The pages use ' + site + ', but tools/set-domain.js says ' + SITE + '. Run node tools/set-domain.js first.');
  }

  console.log('Site address in the pages: ' + ([...pageSites].join(', ') || '(none found)'));
  if (problems.size) {
    console.log('\nSTOPPED. Nothing was built: there is no deploy/ folder and no deploy.zip.');
    for (const p of problems) console.log('  - ' + p);
    for (const n of notes) console.log('  - (note) ' + n);
    console.log('\nFix the above, then run it again.');
    return 1;
  }

  // 3. Copy each file, unchanged, keeping its date.
  const list = [...files.keys()].sort(topFirst);
  const entries = [], folders = new Set();
  let total = 0;
  for (const file of list) {
    const dst = path.join(OUT, ...file.split('/')), st = fs.statSync(abs(file));
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(abs(file), dst);
    fs.utimesSync(dst, st.atime, st.mtime);
    total += st.size;
  }

  // 4. Zip what is now in deploy/, folders before their files.
  (function walk(dir) {
    for (const ent of fs.readdirSync(path.join(OUT, ...dir.split('/').filter(Boolean)), { withFileTypes: true })
      .map((e) => ({ name: (dir ? dir + '/' : '') + e.name, folder: e.isDirectory() }))
      .sort((a, b) => topFirst(a.name + (a.folder ? '/' : ''), b.name + (b.folder ? '/' : '')))) {
      if (NEVER.some((re) => re.test(ent.name + (ent.folder ? '/' : '')))) throw new Error('refusing to zip ' + ent.name);
      const full = path.join(OUT, ...ent.name.split('/'));
      if (ent.folder) {
        if (!folders.has(ent.name)) { folders.add(ent.name); entries.push({ name: ent.name + '/', mtime: fs.statSync(full).mtime }); }
        walk(ent.name);
      } else entries.push({ name: ent.name, data: fs.readFileSync(full), mtime: fs.statSync(full).mtime });
    }
  })('');
  writeZip(entries, ZIP);

  // 5. Report.
  const byFolder = {};
  for (const file of list) { const top = file.includes('/') ? file.split('/')[0] : 'top level'; byFolder[top] = (byFolder[top] || 0) + 1; }
  console.log('\ndeploy/ is ready: ' + list.length + ' files, ' + size(total));
  console.log('  ' + Object.entries(byFolder).map(([k, v]) => k + ' ' + v).join(' · '));
  console.log('deploy.zip is ready: ' + size(fs.statSync(ZIP).size));
  console.log('\nThe 10 largest files:');
  for (const file of list.map((f) => [f, fs.statSync(abs(f)).size]).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.log('  ' + size(file[1]).padStart(9) + '  ' + file[0]);
  }
  if (notes.size) { console.log('\nWorth a look:'); for (const n of notes) console.log('  - ' + n); }
  console.log('\nUpload deploy.zip to public_html on Hostinger, extract it there, then delete the zip.');
  return 0;
}

process.exitCode = main();
