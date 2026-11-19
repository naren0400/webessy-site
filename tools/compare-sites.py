#!/usr/bin/env python3
"""Checks that two copies of the site look and behave the same.

    python3 tools/compare-sites.py --before FOLDER --after FOLDER --out FOLDER

BEFORE is the site as it is now (for example a checkout of the main branch).
AFTER is the new build (for example _site/). Each one is served on its own local port.

For every page in PAGES, at 1440x900 (computer) and 390x844 (phone, touch), it compares:

  1. the HTML the server sends, byte for byte;
  2. with reduced motion on, so nothing moves: a full-page screenshot, a screenshot of the
     screen at every scroll stop down the page, and the page as the browser holds it after
     the scripts have run (the DOM), with runs of spaces and line breaks counted as one;
  3. with normal motion: the page is loaded and scrolled top to bottom, and everything the
     console says is collected. Only the Cloudflare Web Analytics lines are expected there
     (it only reports from the real domain).

It prints a table, writes report.json and saves the screenshots to OUT as
<page>-<size>-before.png and -after.png (and -diff.png where they differ).
It ends with exit code 1 if anything differs or the console is not clean.

Math.random is given a fixed seed in both copies, so the welcome's stars and the hero's
specks land in the same places each time. Nothing else on the pages is changed.

Needs Python with playwright, Pillow and numpy, and a Chrome. The Chrome is taken from
--chrome, or the CHROME environment variable, or /usr/bin/google-chrome.
"""
import argparse
import asyncio
import functools
import http.server
import json
import os
import re
import sys
import threading
from pathlib import Path

import numpy as np
from PIL import Image
from playwright.async_api import async_playwright

PAGES = ['index.html', 'privacy.html', 'terms.html', '404.html']
# A missing address: the server answers with 404.html and status 404, as the live host does.
MISSING = 'no/such/page/'
SIZES = {
    'desktop': dict(viewport={'width': 1440, 'height': 900}),
    'mobile': dict(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True),
}
EXPECTED_CONSOLE = re.compile(r'cloudflareinsights', re.I)

SEED_RANDOM = """
(() => { let s = 0x2F6E2B1; Math.random = () => {
  s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();
"""


class Handler(http.server.SimpleHTTPRequestHandler):
    """Serves a folder. A missing address gets 404.html with status 404."""

    def log_message(self, *args):
        pass

    def send_error(self, code, message=None, explain=None):
        page = Path(self.directory) / '404.html'
        if code == 404 and page.is_file():
            body = page.read_bytes()
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            if self.command != 'HEAD':
                self.wfile.write(body)
            return
        super().send_error(code, message, explain)


def serve(folder):
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(folder)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, 'http://127.0.0.1:%d' % server.server_address[1]


def pixel_diff(a_path, b_path, diff_path):
    a, b = Image.open(a_path).convert('RGB'), Image.open(b_path).convert('RGB')
    out = {'before_size': list(a.size), 'after_size': list(b.size)}
    if a.size != b.size:
        out.update(same_size=False, different_pixels=None, max_channel_delta=None)
        return out
    d = np.abs(np.asarray(a, dtype=np.int16) - np.asarray(b, dtype=np.int16))
    changed = d.max(axis=2) > 0
    out.update(same_size=True, different_pixels=int(changed.sum()), total_pixels=int(changed.size),
               max_channel_delta=int(d.max()))
    if out['different_pixels']:
        Image.fromarray((changed * 255).astype(np.uint8)).save(diff_path)
    return out


def squash(html, origin):
    return re.sub(r'\s+', ' ', html.replace(origin, 'ORIGIN')).strip()


def watch(page, origin, lines):
    """Collect everything the console and the network complain about."""
    def note(kind, text, where=''):
        lines.append({'kind': kind, 'text': text.replace(origin, 'ORIGIN'), 'where': where.replace(origin, 'ORIGIN')})
    page.on('console', lambda m: note('console.' + m.type, m.text, (m.location or {}).get('url', '')))
    page.on('pageerror', lambda e: note('pageerror', str(e)))
    page.on('requestfailed', lambda r: note('requestfailed', r.failure or '', r.url))
    page.on('response', lambda r: r.status >= 400 and note('http ' + str(r.status), '', r.url))


def unexpected(lines, origin_path):
    """The lines that are not the expected ones: Cloudflare's, and the 404 answer for a page
    we asked for on purpose at a missing address."""
    bad = []
    for l in lines:
        if l['kind'] in ('console.log', 'console.info', 'console.debug'):
            continue
        both = l['text'] + ' ' + l['where']
        if EXPECTED_CONSOLE.search(both):
            continue
        if origin_path == MISSING and MISSING in both and '404' in (l['kind'] + l['text']):
            continue
        bad.append(l)
    return bad


async def settle(page):
    """Let the page come to rest: fonts in, every lazy picture loaded, back at the top."""
    await page.evaluate('document.fonts.ready.then(() => 1)')
    step = int(page.viewport_size['height'] * 0.8)
    y = 0
    for _ in range(400):
        height = await page.evaluate('document.documentElement.scrollHeight')
        if y >= height:
            break
        await page.evaluate('y => window.scrollTo(0, y)', y)
        await page.wait_for_timeout(120)
        y += step
    await page.wait_for_function('Array.from(document.images).every(i => i.complete)', timeout=30000)
    await page.evaluate('window.scrollTo(0, 0)')
    try:
        await page.wait_for_load_state('networkidle', timeout=15000)
    except Exception:
        pass
    await page.wait_for_timeout(1200)


async def still(browser, origin, path, size, out_png, stops_dir):
    """Reduced motion: full-page screenshot, a screenshot at every scroll stop, and the DOM."""
    ctx = await browser.new_context(reduced_motion='reduce', device_scale_factor=1, **SIZES[size])
    await ctx.add_init_script(SEED_RANDOM)
    page = await ctx.new_page()
    lines = []
    watch(page, origin, lines)
    await page.goto(origin + '/' + path, wait_until='load')
    await settle(page)
    dom = squash(await page.evaluate('document.documentElement.outerHTML'), origin)
    height = await page.evaluate('document.documentElement.scrollHeight')
    await page.screenshot(path=str(out_png), full_page=True)
    stops = []
    vh = page.viewport_size['height']
    for i, y in enumerate(range(0, max(height - vh, 0) + vh, vh)):
        await page.evaluate('y => window.scrollTo(0, y)', y)
        await page.wait_for_timeout(900)   # the section colour fade takes about 0.7 seconds
        shot = stops_dir / ('%03d.png' % i)
        await page.screenshot(path=str(shot))
        stops.append(shot)
    await ctx.close()
    return dict(dom=dom, height=height, stops=stops, lines=lines)


async def moving(browser, origin, path, size):
    """Normal motion: load, wait for the intro, scroll to the bottom, listen to the console."""
    ctx = await browser.new_context(device_scale_factor=1, **SIZES[size])
    page = await ctx.new_page()
    lines = []
    watch(page, origin, lines)
    await page.goto(origin + '/' + path, wait_until='load')
    await page.wait_for_timeout(7000 if path == 'index.html' else 1500)
    vp = page.viewport_size
    await page.mouse.move(vp['width'] / 2, vp['height'] / 2)
    for _ in range(600):
        at_end = await page.evaluate(
            '() => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2')
        if at_end:
            break
        await page.mouse.wheel(0, 300)
        await page.wait_for_timeout(60)
    reached = await page.evaluate(
        '() => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2')
    await page.wait_for_timeout(1500)
    await ctx.close()
    return dict(lines=lines, reached_bottom=bool(reached))


async def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--before', required=True)
    ap.add_argument('--after', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--chrome', default=os.environ.get('CHROME', '/usr/bin/google-chrome'))
    args = ap.parse_args()

    before, after, out = Path(args.before).resolve(), Path(args.after).resolve(), Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)
    sides = {}
    for name, folder in (('before', before), ('after', after)):
        server, origin = serve(folder)
        sides[name] = dict(folder=folder, server=server, origin=origin)

    report = {'before': str(before), 'after': str(after), 'pages': []}
    problems = 0
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(executable_path=args.chrome, args=['--no-sandbox'])
        report['browser'] = browser.version
        for path in PAGES + [MISSING]:
            label = 'missing-address' if path == MISSING else path.replace('.html', '')
            row_html = None
            if path != MISSING:
                a, b = (before / path).read_bytes(), (after / path).read_bytes()
                row_html = dict(identical=a == b, before_bytes=len(a), after_bytes=len(b))
            for size in SIZES:
                got = {}
                for name, side in sides.items():
                    png = out / ('%s-%s-%s.png' % (label, size, name))
                    stops_dir = out / 'stops' / ('%s-%s-%s' % (label, size, name))
                    stops_dir.mkdir(parents=True, exist_ok=True)
                    got[name] = await still(browser, side['origin'], path, size, png, stops_dir)
                    got[name]['png'] = png
                    got[name]['moving'] = await moving(browser, side['origin'], path, size)
                full = pixel_diff(got['before']['png'], got['after']['png'], out / ('%s-%s-diff.png' % (label, size)))
                stop_px, stop_bad = 0, len(got['before']['stops']) != len(got['after']['stops'])
                for sa, sb in zip(got['before']['stops'], got['after']['stops']):
                    d = pixel_diff(sa, sb, sb.with_name(sb.stem + '-diff.png'))
                    if not d['same_size']:
                        stop_bad = True
                    else:
                        stop_px += d['different_pixels']
                dom_same = got['before']['dom'] == got['after']['dom']
                if not dom_same:
                    for name in got:
                        (out / ('%s-%s-%s.dom.html' % (label, size, name))).write_text(got[name]['dom'], encoding='utf-8')
                row = dict(page=label, size=size, served_html=row_html, full_page=full,
                           scroll_stops=dict(count=len(got['before']['stops']), different_pixels=stop_px,
                                             mismatch=stop_bad),
                           dom_identical=dom_same, dom_chars=len(got['after']['dom']),
                           page_height=[got['before']['height'], got['after']['height']], console={})
                for name in got:
                    still_lines, moving_lines = got[name]['lines'], got[name]['moving']['lines']
                    bad = unexpected(still_lines, path) + unexpected(moving_lines, path)
                    row['console'][name] = dict(
                        reduced_motion=still_lines, normal_motion=moving_lines,
                        reached_bottom=got[name]['moving']['reached_bottom'], unexpected=bad)
                    problems += len(bad) + (0 if got[name]['moving']['reached_bottom'] else 1)
                problems += (0 if full.get('different_pixels') == 0 else 1) + (1 if stop_px or stop_bad else 0)
                problems += 0 if dom_same else 1
                if row_html and not row_html['identical']:
                    problems += 1
                report['pages'].append(row)
                print('%-16s %-8s html:%-9s full-page diff px:%-8s size:%s  stops:%d diff px:%d  DOM:%s  console unexpected: before %d, after %d' % (
                    label, size,
                    'n/a' if not row_html else ('identical' if row_html['identical'] else 'DIFFERS'),
                    full.get('different_pixels'), 'x'.join(map(str, full['after_size'])),
                    len(got['before']['stops']), stop_px, 'identical' if dom_same else 'DIFFERS',
                    len(row['console']['before']['unexpected']), len(row['console']['after']['unexpected'])), flush=True)
        await browser.close()

    for side in sides.values():
        side['server'].shutdown()
    report['problems'] = problems
    (out / 'report.json').write_text(json.dumps(report, indent=1, default=str), encoding='utf-8')
    print('\n' + ('SAME: no differences, console clean.' if not problems else '%d problem(s). See report.json.' % problems))
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
