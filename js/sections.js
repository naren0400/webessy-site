/* ==========================================================================
   SECTIONS — section colours, text reveal and motion for 02 to 06, the
   sticky WhatsApp button, the contact form, and the footer logo drawing
   itself in. The intro, hero and nav live in their own files and are not
   touched here.
   Only transform and opacity are animated, except in the footer logo, which,
   like Ignition, also draws its outlines and wipes its letters in (a small
   area, for about 2 seconds). With reduced motion nothing moves: text is
   simply visible, and the section colours still change, as a plain fade.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------------- sticky WhatsApp button (phones) ----------------
     Shows once the hero has scrolled away, and hides again from Contact to the
     end of the page: Contact has the real WhatsApp link, and in the footer the
     button would cover the logo. CSS keeps it hidden on wider screens. */
  (function waFloat() {
    var btn = document.getElementById('waFloat');
    var hero = document.getElementById('hero');
    var contact = document.getElementById('contact');
    if (!btn || !hero || !('IntersectionObserver' in window)) return;
    var pastHero = false, fromContact = false;
    function update() { btn.classList.toggle('is-on', pastHero && !fromContact); }
    new IntersectionObserver(function (entries) {
      var e = entries[0];
      pastHero = !e.isIntersecting && e.boundingClientRect.top < 0;
      update();
    }).observe(hero);
    if (contact) {
      new IntersectionObserver(function (entries) {
        var e = entries[0];
        fromContact = e.isIntersecting || e.boundingClientRect.top < 0; /* on screen, or already above it */
        update();
      }).observe(contact);
    }
  })();

  /* ---------------- 06 Contact: the form ----------------
     Sends through Web3Forms to the studio's inbox without leaving the page.
     Only the name and the number are required. A problem gets a plain line
     under its field (the words are in the HTML: data-empty, data-short) and
     the first field with one gets the focus. Once sent, the form makes way
     for "Sent."; if it can't send, a line offers WhatsApp instead. Without
     JavaScript the browser checks the two required fields and posts the
     form itself. Needs no GSAP, so it works with reduced motion too. */
  (function contactForm() {
    var form = document.querySelector('.cform');
    if (!form || !window.fetch || !window.FormData) return;
    var done = document.querySelector('.cform__done');
    var fail = form.querySelector('.cform__fail');
    var send = form.querySelector('.cform__send');
    var label = send.textContent, busy = false;
    var required = Array.prototype.slice.call(form.querySelectorAll('[required]'));
    form.noValidate = true; /* our messages from here on, not the browser's bubbles */

    function problem(input) {
      var v = input.value.trim();
      if (!v) return input.getAttribute('data-empty');
      if (input.type === 'tel' && v.replace(/\D/g, '').length < 10) return input.getAttribute('data-short');
      return '';
    }
    function mark(input, msg) {
      document.getElementById(input.getAttribute('aria-describedby')).textContent = msg;
      if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    }
    /* once a field has a message, it updates as you type and goes when the field is fixed */
    required.forEach(function (input) {
      input.addEventListener('input', function () { if (input.hasAttribute('aria-invalid')) mark(input, problem(input)); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      var first = null;
      required.forEach(function (input) {
        var msg = problem(input);
        mark(input, msg);
        if (msg && !first) first = input;
      });
      if (first) { first.focus(); return; }

      busy = true;
      fail.hidden = true;
      send.textContent = send.getAttribute('data-sending');
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
      fetch(form.action, {
        method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' },
        signal: ctrl ? ctrl.signal : undefined
      })
        .then(function (res) {
          return res.json().then(function (data) { if (!res.ok || !data.success) throw new Error(data.message || 'not sent'); });
        })
        .then(function () {
          form.hidden = true;
          done.hidden = false;
          done.focus();
        }, function () {
          fail.hidden = false;
        })
        .then(function () { clearTimeout(timer); busy = false; send.textContent = label; });
    });
  })();

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------------- section colours ----------------
     Each section names its colour in the HTML (data-theme). From here one
     fixed layer behind the page takes over. When a section's top passes the
     middle of the screen, the layer fades to that section's colour, and all
     section text switches colour during the fade, at the moment the new text
     colour reads better than the old one (about half way). Scrolling back
     reverses it. Above the first section (the hero) the page is black.
     The fade is timed, not tied to every pixel of scroll: half way between
     bone and black, neither text colour passes AA, so the page must never be
     able to rest there. Only opacity animates. */
  (function sectionColours() {
    var bands = gsap.utils.toArray('main > section[data-theme], body > footer[data-theme]');
    if (!bands.length || !('IntersectionObserver' in window)) return;

    var FADE = 0.7;
    function parse(c) {
      c = c.trim();
      if (c.charAt(0) === '#') return [1, 3, 5].map(function (i) { return parseInt(c.slice(i, i + 2), 16); });
      return c.match(/[\d.]+/g).slice(0, 3).map(Number);
    }
    function luminance(rgb) {
      var v = rgb.map(function (c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
      return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
    }
    function contrast(a, b) { var x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
    function mix(a, b, t) { return a.map(function (v, i) { return v + (b[i] - v) * t; }); }

    /* each theme's background and text colour, read from the CSS */
    var rootStyle = getComputedStyle(root);
    var themes = { black: { bg: parse(rootStyle.getPropertyValue('--bg')), fg: parse(rootStyle.getPropertyValue('--fg')) } };
    bands.forEach(function (band) {
      var name = band.getAttribute('data-theme'), s = getComputedStyle(band);
      themes[name] = { bg: parse(s.backgroundColor), fg: parse(s.color) };
      band.setAttribute('data-band', name); /* the section keeps its colour here; its tokens now come from <html> */
      band.removeAttribute('data-theme');
    });

    var layer = document.createElement('div'), base = document.createElement('div'), next = document.createElement('div');
    layer.className = 'page-bg';
    layer.setAttribute('aria-hidden', 'true');
    layer.appendChild(base);
    layer.appendChild(next);
    document.body.insertBefore(layer, document.body.firstChild);
    root.classList.add('theme-live');

    var current = null, text = null, shown = null, fade = null; /* shown: the colour on screen right now */
    function paint(el, rgb) { el.style.backgroundColor = 'rgb(' + rgb.map(Math.round).join(',') + ')'; }
    function setText(name) { text = name; root.setAttribute('data-theme', name); }
    function show(name, instant) {
      if (name === current || !themes[name]) return;
      current = name;
      if (fade) { fade.kill(); fade = null; }
      var from = shown, to = themes[name].bg;
      if (instant || !from) {
        shown = to; paint(base, to); gsap.set(next, { opacity: 0 }); setText(name);
        return;
      }
      paint(base, from); paint(next, to); gsap.set(next, { opacity: 0 });
      fade = gsap.to(next, {
        opacity: 1, duration: FADE, ease: 'power1.inOut',
        onUpdate: function () {
          shown = mix(from, to, Number(gsap.getProperty(next, 'opacity')));
          if (text !== name && contrast(themes[name].fg, shown) >= contrast(themes[text].fg, shown)) setText(name);
        },
        onComplete: function () {
          shown = to; paint(base, to); gsap.set(next, { opacity: 0 }); setText(name);
          fade = null;
        }
      });
    }

    /* the section under the middle of the screen, or null in the hero */
    function atMiddle() {
      var mid = window.innerHeight / 2;
      for (var i = 0; i < bands.length; i++) {
        var r = bands[i].getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) return bands[i];
      }
      return null;
    }
    var middle = atMiddle();
    show(middle ? middle.getAttribute('data-band') : 'black', true); /* first paint: no fade */

    /* watch a hairline across the middle of the screen */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) middle = e.target;
        else if (middle === e.target) middle = null;
      });
      show(middle ? middle.getAttribute('data-band') : 'black');
    }, { rootMargin: '-50% 0px -50% 0px' });
    bands.forEach(function (band) { io.observe(band); });
  })();

  /* Positions are measured while the intro still locks the page, and fonts
     change line heights when they arrive, so measure again at both moments. */
  document.addEventListener('intro:done', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });

  if (reduce) return;

  /* ---------------- text reveal (js/reveal.js) ----------------
     Headings word by word, paragraphs line by line, big statement lines
     letter by letter — see data-reveal in the HTML. */
  if (typeof window.webessyReveal === 'function') window.webessyReveal(document);

  /* ---------------- rise and fade for things that aren't text ----------------
     Glass cards and the table: 16px rise and fade, once, as they come into view.
     Opacity only, never visibility: hidden, so buttons and links can still be
     reached with the Tab key and read by screen readers before they fade in. */
  gsap.utils.toArray('.reveal').forEach(function (el) {
    gsap.from(el, {
      y: 16, opacity: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
  });

  /* ---------------- 02 Work screenshots ----------------
     Each one slides in from the right and grows to full size as it reaches
     the middle of the screen. Tied to scroll position, not time. */
  gsap.matchMedia().add({ wide: '(min-width: 960px)', narrow: '(max-width: 959.98px)' }, function (ctx) {
    var shift = ctx.conditions.wide ? 24 : 10;
    gsap.utils.toArray('.work .shot').forEach(function (el) {
      gsap.fromTo(el,
        { xPercent: shift, scale: 0.86, opacity: 0.4 },
        {
          xPercent: 0, scale: 1, opacity: 1, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'center center', scrub: true }
        });
    });
  });

  /* ---------------- 02 Work: What was built ----------------
     The block pins in the middle of the screen, and the five cards slide left
     as you scroll down, until card 05 reaches the right edge. The cards move
     only with the scroll. Phones too, one card at a time. A screen under 500px
     tall (a phone on its side) can't fit a card below the nav, so there it
     stays a plain numbered list, as it is without motion. */
  (function builtCards() {
    var block = document.querySelector('.work .built');
    var track = block && block.querySelector('.built__track');
    if (!track) return;
    gsap.matchMedia().add('(min-height: 500px)', function () {
      block.classList.add('is-sideways');
      function distance() { return Math.max(0, track.scrollWidth - track.clientWidth); }
      gsap.to(track, {
        x: function () { return -distance(); }, ease: 'none',
        scrollTrigger: {
          trigger: block, start: 'center center', end: function () { return '+=' + distance(); },
          pin: true, scrub: true, anticipatePin: 1, invalidateOnRefresh: true,
          refreshPriority: 1 /* measured first, so everything further down counts the pinned length */
        }
      });
      return function () { block.classList.remove('is-sideways'); };
    });
  })();

  /* ---------------- 02 Work: What it proves ----------------
     "The estate is a concept." slides in from the left, "The craft is not."
     from the right. Tied to scroll, and in place before each line reaches
     the middle of the screen. Movement only, no fade, so the text is never faint. */
  gsap.utils.toArray('.work .proves__line').forEach(function (line, i) {
    var side = i === 0 ? -1 : 1;
    gsap.fromTo(line, { x: function () { return side * window.innerWidth * 0.3; } }, {
      x: 0, ease: 'none',
      scrollTrigger: { trigger: line, start: 'top bottom', end: 'center 65%', scrub: true, invalidateOnRefresh: true }
    });
  });

  /* ---------------- Footer: the logo draws itself in ----------------
     A short Ignition (js/intro.js), so the site ends the way it began: points
     of light trace the 0400, ink rises into the digits, a ring spreads out,
     the rule and the arrows draw, and a bar of light sweeps the name as it
     appears. About 2.2 seconds, once, when the whole logo is on screen; the
     clamp() makes sure that happens even at the very bottom of the page.
     No flash: the logo keeps its own colours throughout. The lights, the
     ring and the bar are added here and removed at the end, so what stays
     is the logo exactly as it is in the HTML. */
  (function lockupDraw() {
    var svg = document.querySelector('.foot .lockup');
    if (!svg) return;
    var NS = 'http://www.w3.org/2000/svg', BONE = '#DFD9C9'; /* the 0400's own colour, as in Ignition */
    function add(tag, attrs, parent) {
      var el = document.createElementNS(NS, tag);
      Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
      parent.appendChild(el);
      return el;
    }
    var digits = gsap.utils.toArray(svg.querySelectorAll('.lk-digit'));
    var words = gsap.utils.toArray(svg.querySelectorAll('.lk-word'));
    var rule = svg.querySelector('.lk-rule');
    var arrows = gsap.utils.toArray(svg.querySelectorAll('.lk-arrow path'));
    if (digits.length !== 4 || !words.length || !rule) return;

    /* the drawing aids: a glow, a light trace and a bright head per digit, the ring, the bar */
    var fx = add('g', {}, svg), defs = add('defs', {}, fx);
    function glowFilter(id, region) {
      var f = add('filter', Object.assign({ id: id }, region), defs);
      add('feGaussianBlur', { stdDeviation: '5', result: 'b' }, f);
      var m = add('feMerge', {}, f);
      ['b', 'b', 'SourceGraphic'].forEach(function (src) { add('feMergeNode', { in: src }, m); });
    }
    glowFilter('lockupGlow', { x: '-70%', y: '-70%', width: '240%', height: '240%' });
    glowFilter('lockupBarGlow', { x: '-1000%', y: '-20%', width: '2100%', height: '140%' }); /* the bar is thin: room for its glow */
    var traceLayer = add('g', { filter: 'url(#lockupGlow)', fill: 'none', stroke: BONE, 'stroke-width': '1.3' }, fx);
    var traces = digits.map(function (d) { return add('path', { d: d.getAttribute('d') }, traceLayer); });
    var lengths = traces.map(function (t) { return t.getTotalLength(); });
    var headLayer = add('g', { filter: 'url(#lockupGlow)' }, fx);
    var heads = traces.map(function (t) {
      var p = t.getPointAtLength(0);
      return add('circle', { r: '3.4', cx: p.x, cy: p.y, fill: '#fff', opacity: '0' }, headLayer);
    });
    var ring = add('circle', { cx: '607.5', cy: '361.7', r: '30', fill: 'none', stroke: BONE, 'stroke-opacity': '.55', 'vector-effect': 'non-scaling-stroke', opacity: '0' }, fx);
    var bar = add('rect', { x: '545.6', y: '417.5', width: '2', height: '106', fill: BONE, filter: 'url(#lockupBarGlow)', opacity: '0' }, fx);

    /* everything waits, hidden, until it plays */
    traces.forEach(function (t, i) { t.style.strokeDasharray = lengths[i]; t.style.strokeDashoffset = lengths[i]; });
    arrows.forEach(function (p) { var L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
    gsap.set(digits, { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set(words, { clipPath: 'inset(0% 100% 0% 0%)' });
    gsap.set(rule, { scaleX: 0, transformOrigin: '0% 50%' });

    /* each bright head rides the tip of its trace */
    function follow() {
      traces.forEach(function (t, i) {
        var drawn = lengths[i] - (parseFloat(t.style.strokeDashoffset) || 0);
        if (drawn > 0.5) { var p = t.getPointAtLength(drawn); heads[i].setAttribute('cx', p.x); heads[i].setAttribute('cy', p.y); }
      });
    }
    /* back to the logo as it is in the HTML: no inline styles, no transform (none of these had any) */
    function finish() {
      svg.removeChild(fx);
      digits.concat(words, arrows, [rule]).forEach(function (el) { el.removeAttribute('style'); });
      rule.removeAttribute('transform');
      rule.removeAttribute('data-svg-origin');
    }

    /* the beats of Ignition, shortened: trace, ink, ring, rule and arrows, then the name */
    var tl = gsap.timeline({ paused: true, onComplete: finish })
      .to(heads, { opacity: 1, duration: 0.15, stagger: 0.12 }, 0)
      .to(traces, { strokeDashoffset: 0, duration: 0.9, stagger: 0.12, ease: 'power2.inOut', onUpdate: follow }, 0)
      .to(heads, { opacity: 0, duration: 0.2, stagger: 0.12 }, 0.75)
      .to(digits, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, stagger: 0.12, ease: 'power2.out' }, 0.45)
      .to(traceLayer, { opacity: 0, duration: 0.3 }, 1.25)
      .set(ring, { opacity: 1 }, 1.25)
      .to(ring, { opacity: 0, scale: 10, transformOrigin: '50% 50%', duration: 0.9, ease: 'power2.out' }, 1.25)
      .to(rule, { scaleX: 1, duration: 0.5, ease: 'power3.inOut' }, 1.3)
      .to(arrows, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' }, 1.38)
      .set(bar, { opacity: 1 }, 1.45)
      .to(bar, { x: 259.6, duration: 0.6, ease: 'power2.inOut' }, 1.45) /* across WEBESSY and STUDIOS */
      .to(bar, { opacity: 0, duration: 0.2 }, 1.95)
      .to(words, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, stagger: 0.09, ease: 'power3.out' }, 1.47);

    ScrollTrigger.create({
      trigger: svg, start: 'clamp(center 75%)', once: true,
      onEnter: function () { tl.play(); }
    });
  })();
})();
