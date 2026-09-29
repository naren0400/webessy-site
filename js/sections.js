/* ==========================================================================
   SECTIONS — section colours, text reveal and motion for 02 to 06, and the
   sticky WhatsApp button. The intro, hero and nav live in their own files
   and are not touched here.
   Only transform and opacity are animated. With reduced motion nothing
   moves: text is simply visible, and the section colours still change, as a
   plain fade.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------------- sticky WhatsApp button (phones) ----------------
     Shows once the hero has scrolled away, hides again when Contact is on screen,
     where the real WhatsApp button is. CSS keeps it hidden on wider screens. */
  (function waFloat() {
    var btn = document.getElementById('waFloat');
    var hero = document.getElementById('hero');
    var contact = document.getElementById('contact');
    if (!btn || !hero || !('IntersectionObserver' in window)) return;
    var pastHero = false, atContact = false;
    function update() { btn.classList.toggle('is-on', pastHero && !atContact); }
    new IntersectionObserver(function (entries) {
      var e = entries[0];
      pastHero = !e.isIntersecting && e.boundingClientRect.top < 0;
      update();
    }).observe(hero);
    if (contact) {
      new IntersectionObserver(function (entries) {
        atContact = entries[0].isIntersecting;
        update();
      }).observe(contact);
    }
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
})();
