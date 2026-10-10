/* ==========================================================================
   REVEAL — scroll text reveal with our own small splitter (no paid plugins).
   Mark text in the HTML with one attribute:
     data-reveal="words"  headings: each word rises from behind its own mask
     data-reveal="lines"  paragraphs and lists: the lines rise one after another
     data-reveal="chars"  one big statement line only: letter by letter
   On a block (a div or a list) the attribute covers every paragraph or item
   inside it, in reading order.

   Screen readers: while text is split, the original stays in the page,
   hidden from sight, and the animated copy is aria-hidden. When the reveal
   ends, the original HTML is put back exactly as it was.
   Text with a link or button inside isn't split: it rises and fades instead.

   Needs GSAP 3.12.5 and ScrollTrigger. With reduced motion it does nothing,
   so all text is simply visible. Start it with webessyReveal(document).
   ========================================================================== */
(function () {
  'use strict';

  var START = 'top 85%'; /* when the element's top reaches 85% of the screen height */
  var DURATION = 0.8, EASE = 'power3.out';
  var STAGGER = { words: 0.06, lines: 0.1, chars: 0.03 };
  var BLOCKS = 'p, li, h1, h2, h3, h4, h5, h6, dt, dd, blockquote, figcaption';
  var INTERACTIVE = 'a, button, input, select, textarea, [tabindex]';
  var SPACE = /^[ \t\n\r\f]+$/; /* only real spaces split words; a no-break space stays inside its word */
  var started = typeof WeakSet === 'function' ? new WeakSet() : null;

  function toArray(list) { return Array.prototype.slice.call(list); }
  function span(cls) { var s = document.createElement('span'); s.className = cls; return s; }
  /* letters for the letter-by-letter mode. ff, fi, fl stay together so the
     font's ligatures still form, split or not. */
  function letters(text) { return text.match(/ffi|ffl|ff|fi|fl|[\s\S]/gu) || []; }

  /* one masked piece: the mask clips, the inner span moves */
  function piece(text) {
    var mask = span('rv-m'), inner = span('rv-i');
    inner.textContent = text;
    mask.appendChild(inner);
    return mask;
  }

  /* Turn every text node into masked words, or masked letters grouped by word.
     Spaces stay plain text, so lines wrap exactly where they did before. Where
     a word runs on across a tag (<em>early</em>.) a word joiner keeps the two
     parts on the same line. */
  function wrapText(root, mode) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    var midWord = false; /* did the text so far stop in the middle of a word? */
    nodes.forEach(function (node) {
      var parts = node.nodeValue.split(/([ \t\n\r\f]+)/).filter(Boolean);
      var frag = document.createDocumentFragment();
      parts.forEach(function (part, i) {
        if (SPACE.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        if (i === 0 && midWord) frag.appendChild(document.createTextNode('⁠'));
        if (mode !== 'chars') { frag.appendChild(piece(part)); return; }
        var word = span('rv-w');
        letters(part).forEach(function (ch) { word.appendChild(piece(ch)); });
        frag.appendChild(word);
      });
      if (parts.length) midWord = !SPACE.test(parts[parts.length - 1]);
      node.parentNode.replaceChild(frag, node);
    });
  }

  /* Keep the original for screen readers, and add an aria-hidden split copy. */
  function split(block, mode) {
    var original = span('rv-sr');
    while (block.firstChild) original.appendChild(block.firstChild);
    var copy = original.cloneNode(true);
    copy.className = 'rv-vis';
    copy.setAttribute('aria-hidden', 'true');
    toArray(copy.querySelectorAll('[id]')).forEach(function (n) { n.removeAttribute('id'); });
    wrapText(copy, mode);
    block.appendChild(original);
    block.appendChild(copy);
    return { block: block, original: original, copy: copy };
  }

  /* Put the original HTML back once the text has settled. */
  function restore(s) {
    var nodes = toArray(s.original.childNodes);
    s.block.textContent = '';
    nodes.forEach(function (n) { s.block.appendChild(n); });
  }

  /* Letters in separate boxes lose their kerning. Measure where each letter
     sits in the original and nudge the boxes to match, so nothing shifts when
     the original comes back. */
  function keepKerning(s) {
    var want = [], range = document.createRange();
    var walker = document.createTreeWalker(s.original, NodeFilter.SHOW_TEXT, null);
    while (walker.nextNode()) {
      var node = walker.currentNode, at = 0;
      letters(node.nodeValue).forEach(function (ch) {
        if (!SPACE.test(ch)) {
          range.setStart(node, at);
          range.setEnd(node, at + ch.length);
          want.push(range.getBoundingClientRect().left);
        }
        at += ch.length;
      });
    }
    var masks = toArray(s.copy.querySelectorAll('.rv-m'));
    if (masks.length !== want.length) return;
    var have = masks.map(function (m) { return m.getBoundingClientRect().left; });
    var fixes = [];
    for (var i = 0; i < masks.length - 1; i++) {
      if (masks[i].parentNode !== masks[i + 1].parentNode) continue; /* a space or a tag sits between them */
      var gap = (want[i + 1] - want[i]) - (have[i + 1] - have[i]);
      if (Math.abs(gap) > 0.05) fixes.push([masks[i], gap]);
    }
    fixes.forEach(function (f) {
      f[0].style.marginRight = (parseFloat(getComputedStyle(f[0]).marginRight) + f[1]) + 'px';
    });
  }

  /* group the pieces into the lines they sit on right now */
  function byLine(pieces) {
    var lines = [], top = null;
    pieces.forEach(function (p) {
      var y = p.parentNode.getBoundingClientRect().top;
      if (top === null || Math.abs(y - top) > 2) { lines.push([]); top = y; }
      lines[lines.length - 1].push(p);
    });
    return lines;
  }

  function play(splits, mode) {
    if (mode === 'chars') splits.forEach(keepKerning);
    var pieces = [];
    splits.forEach(function (s) { pieces = pieces.concat(toArray(s.copy.querySelectorAll('.rv-i'))); });
    if (!pieces.length) { splits.forEach(restore); return; }
    var tl = gsap.timeline({ onComplete: function () { splits.forEach(restore); } });
    if (mode === 'lines') {
      byLine(pieces).forEach(function (line, i) {
        tl.to(line, { yPercent: 0, duration: DURATION, ease: EASE }, i * STAGGER.lines);
      });
    } else {
      tl.to(pieces, { yPercent: 0, duration: DURATION, ease: EASE, stagger: STAGGER[mode] }, 0);
    }
  }

  function riseAndFade(el) {
    gsap.from(el, {
      y: 16, opacity: 0, duration: DURATION, ease: EASE,
      scrollTrigger: { trigger: el, start: START, once: true }
    });
  }

  /* An element to reveal. Its text is split later (splitAhead), not while the page loads. */
  function prepare(el) {
    var mode = el.getAttribute('data-reveal');
    if (!STAGGER.hasOwnProperty(mode)) return null;
    if (started) { if (started.has(el)) return null; started.add(el); }
    if (el.parentElement && el.parentElement.closest('[data-reveal]')) return null; /* the outer one covers it */
    if (el.querySelector(INTERACTIVE)) return { el: el, rise: true };
    return { el: el, mode: mode, splits: null };
  }

  /* Split the text, once, and hide the pieces below their masks. Done a screen or more before
     the element comes into view: split, the text is thousands of small boxes, and every layout
     of the page gets slower with them (all split at once, a phone profile spent 1.4 to 3.6s
     on it while the page loaded). */
  function splitAhead(r) {
    if (r.splits) return;
    /* the text blocks to split: the paragraphs or items inside, or the element itself */
    var blocks = toArray(r.el.querySelectorAll(BLOCKS)).filter(function (b) { return !b.querySelector(BLOCKS); });
    if (!blocks.length) blocks = [r.el];
    r.splits = blocks.map(function (b) { return split(b, r.mode); });
    var pieces = r.el.querySelectorAll('.rv-i');
    if (pieces.length) gsap.set(pieces, { yPercent: 120 }); /* start hidden below their masks */
  }

  /* Two triggers: one splits the text when the element is one and a half screens below the
     screen, the other plays the reveal when its top reaches 85% of the screen. ScrollTrigger
     runs them before the browser paints, so after a jump down the page (a nav link) the text
     is hidden before it is ever drawn. */
  function watch(r) {
    if (r.rise) { riseAndFade(r.el); return; }
    if (!r.splits) {
      ScrollTrigger.create({
        trigger: r.el, once: true,
        start: function () { return 'top bottom+=' + Math.round(window.innerHeight * 1.5); },
        onEnter: function () { splitAhead(r); }
      });
    }
    ScrollTrigger.create({
      trigger: r.el, start: START, once: true,
      onEnter: function () {
        splitAhead(r); /* already done, unless the page was never still long enough */
        /* line breaks and letter widths need the real fonts */
        var go = function () { play(r.splits, r.mode); };
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
      }
    });
  }

  window.webessyReveal = function (scope) {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.registerPlugin(ScrollTrigger);
    var ready = toArray((scope || document).querySelectorAll('[data-reveal]')).map(prepare).filter(Boolean);

    /* Split now whatever is on the screen or within one and a half screens below it: one
       measurement, taken before anything changes. Then the triggers, which measure the page,
       so it doesn't change between them. */
    var reach = window.innerHeight * 2.5;
    var tops = ready.map(function (r) { return r.rise ? 0 : r.el.getBoundingClientRect().top; });
    ready.forEach(function (r, i) { if (!r.rise && tops[i] < reach) splitAhead(r); });
    ready.forEach(watch);
  };
})();
