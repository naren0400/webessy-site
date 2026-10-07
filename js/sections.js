/* ==========================================================================
   SECTIONS — section colours, text reveal and motion for 02 to 06, the
   sticky "Start your project" button, the Reviews section (its cards and
   its form panel), the two forms, and the footer logo drawing itself in. The
   intro, hero and nav live in their own files and are not touched here.
   Only transform and opacity are animated, with two exceptions: the footer
   logo, which, like Ignition, also draws its outlines and wipes its letters
   in (a small area, for about 2 seconds), and the 03 ring, which on computers
   blurs the text of the cards at the back. With reduced motion nothing moves:
   text is simply visible, and the section colours still change, as a plain fade.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------------- sticky "Start your project" button (phones) ----------------
     It opens WhatsApp. Shows once the hero has scrolled away, and hides again
     from Contact to the end of the page: Contact has its own Start your project
     button, and in the footer this one would cover the logo. CSS keeps it
     hidden on wider screens. */
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

  /* ---------------- the nav over the 04 panels ----------------
     The nav takes its look from the section in the middle of the screen. 04 is
     black, but its panels are bone, orange, violet and green, and they pass
     under the nav: on phones all the time, on computers as the stack leaves.
     While any panel is behind the nav, <html> gets data-nav="panel" and the nav
     takes its look over bone (css/site.css, "section colours"), which passes AA
     on all four. Watched through a strip exactly where the nav is, so it costs
     nothing while you scroll. Needs no GSAP: it works with reduced motion too. */
  (function navOverPanels() {
    var nav = document.getElementById('nav');
    var panels = Array.prototype.slice.call(document.querySelectorAll('.how__panel'));
    if (!nav || !panels.length || !('IntersectionObserver' in window)) return;
    var behind = [], io = null, timer = 0;
    function watch() {
      if (io) io.disconnect();
      behind = panels.map(function () { return false; });
      var r = nav.getBoundingClientRect();
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { behind[panels.indexOf(e.target)] = e.isIntersecting; });
        if (behind.indexOf(true) !== -1) root.setAttribute('data-nav', 'panel');
        else root.removeAttribute('data-nav');
      }, { rootMargin: -Math.round(r.top) + 'px 0px ' + -Math.round(window.innerHeight - r.bottom) + 'px 0px' });
      panels.forEach(function (p) { io.observe(p); });
    }
    watch();
    /* the strip is measured from the bottom of the screen too, so measure it again when that moves */
    window.addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(watch, 200); });
  })();

  /* ---------------- Reviews: the cards ----------------
     Built from the list in js/reviews.js: real reviews only, each a client's own
     words with their name, their business and, if they sent one, a photo. While
     the list is empty the heading is "Be the first to write a review" and there
     are no cards; with reviews in it the heading is "In their words", and each
     review becomes a light glass card, in the list's order (css/site.css,
     "Reviews"). The section is hidden in the HTML and only shown from here, so
     without JavaScript nothing on the page says there are no reviews. Needs no
     GSAP, so with reduced motion it's all simply there. */
  (function reviews() {
    var section = document.getElementById('reviews');
    if (!section) return;
    var list = section.querySelector('.reviews__list');
    var data = Array.isArray(window.WEBESSY_REVIEWS) ? window.WEBESSY_REVIEWS : [];
    function make(tag, cls, text) {
      var el = document.createElement(tag);
      if (cls) el.className = cls;
      if (text) el.textContent = text;
      return el;
    }
    data.forEach(function (r) {
      if (!r) return;
      var quote = String(r.review || '').replace(/^[\s"“”]+|[\s"“”]+$/g, ''); /* the page adds the quote marks */
      var name = String(r.name || '').trim(), business = String(r.business || '').trim();
      if (!quote || !name) return;
      var item = make('li', 'reviews__item'), card = make('figure', 'review glass');
      if (r.photo) {
        var img = make('img', 'review__photo');
        img.setAttribute('loading', 'lazy'); /* before src, or some browsers start the download */
        img.setAttribute('decoding', 'async');
        img.width = 240; img.height = 240; /* every review photo is 240 x 240 (js/reviews.js) */
        img.alt = String(r.photoAlt || '').trim();
        img.src = String(r.photo);
        card.appendChild(img);
      }
      var said = make('blockquote', 'review__quote'), by = make('figcaption', 'review__by');
      said.appendChild(make('p', '', quote));
      by.appendChild(make('span', 'label review__name', name));
      if (business) by.appendChild(make('span', 'label', business));
      card.appendChild(said);
      card.appendChild(by);
      item.appendChild(card);
      list.appendChild(item);
    });
    var some = list.children.length > 0;
    var other = section.querySelector('[data-when="' + (some ? 'empty' : 'some') + '"]');
    other.parentNode.removeChild(other);
    if (some) list.style.setProperty('--n', Math.min(3, list.children.length)); /* as wide as its cards, three to a row at most */
    else list.parentNode.removeChild(list);
    section.hidden = false;

    /* Each card rises and fades in as its top reaches 85% of the screen, like every
       .reveal, but by a CSS transition (.is-waiting, then .is-in) rather than GSAP:
       phones run a transition off the main thread, and GSAP would rewrite a glass
       card's style on every frame of it. With reduced motion they're simply there. */
    if (!some || reduce || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting && e.boundingClientRect.top > 0) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -15% 0px' });
    Array.prototype.forEach.call(list.children, function (item) {
      item.classList.add('is-waiting');
      io.observe(item);
    });
  })();

  /* ---------------- the two forms: checks, spam and sending ----------------
     Contact and Write a review both send through Web3Forms to the studio's
     inbox, without leaving the page. Before anything goes:
     - Every field with a message line under it (aria-describedby) is
       checked: empty but required (the words are in the HTML: data-empty),
       a phone number under 10 digits (data-short), a link that isn't a web
       address or an email address that isn't one (data-bad). Fields that
       aren't required may stay empty. A link may leave out the https://:
       "yourbusiness.com" is fine, and goes as https://yourbusiness.com.
       A problem gets a plain line under its field, and the first field with
       one gets the focus. Once a field has a line, it updates as you type
       and goes when the field is right.
     - Spam. "botcheck" is Web3Forms' trap, a box people never see: if it's
       ticked, a bot filled the form in. Web3Forms refuses those too; here
       the form only pretends to send. And anything sent less than 3 seconds
       after the form opened (the page loading, or the review panel opening)
       is too quick for a person: nothing goes, and the "That did not send"
       line shows, so a real person can simply press Send again.
     - While it sends, the button is disabled and reads "Sending…", so a
       second tap can't send it twice.
     Once sent, the form makes way for "Sent."; if it can't send, the line
     offers WhatsApp instead. Without JavaScript the browser checks the
     required fields and posts the form itself. Needs no GSAP, so it works
     with reduced motion too. Returns a function that starts the 3 seconds
     again (the review panel calls it each time it opens). */
  function webForm(form, done) {
    if (!form || !done || !window.fetch || !window.FormData) return function () {};
    var fail = form.querySelector('[role="alert"]');
    var send = form.querySelector('[type="submit"]');
    var trap = form.querySelector('[name="botcheck"]');
    var fields = Array.prototype.slice.call(form.querySelectorAll('[aria-describedby]'));
    var label = send.textContent, busy = false, opened = now();
    form.noValidate = true; /* our messages from here on, not the browser's bubbles */

    function now() { return window.performance && performance.now ? performance.now() : Date.now(); }
    function problem(input) {
      var v = input.value.trim();
      if (!v) return input.required ? input.getAttribute('data-empty') : '';
      if (input.type === 'tel' && v.replace(/\D/g, '').length < 10) return input.getAttribute('data-short');
      if (input.type === 'url' && !webAddress(v)) return input.getAttribute('data-bad');
      if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return input.getAttribute('data-bad');
      return '';
    }
    function mark(input, msg) {
      document.getElementById(input.getAttribute('aria-describedby')).textContent = msg;
      if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    }
    function sent() { form.hidden = true; done.hidden = false; done.focus(); }
    fields.forEach(function (input) {
      input.addEventListener('input', function () { if (input.hasAttribute('aria-invalid')) mark(input, problem(input)); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      fail.hidden = true;
      var first = null;
      fields.forEach(function (input) {
        var msg = problem(input);
        mark(input, msg);
        if (msg && !first) first = input;
      });
      if (first) { first.focus(); return; }
      if (trap && trap.checked) { sent(); return; } /* a bot: it only looks sent */
      if (now() - opened < 3000) { fail.hidden = false; return; } /* too quick for a person */

      var body = new FormData(form);
      fields.forEach(function (input) {
        if (input.type === 'url' && input.value.trim()) body.set(input.name, webAddress(input.value.trim()));
      });
      busy = true;
      var focused = document.activeElement === send;
      send.disabled = true;
      send.textContent = send.getAttribute('data-sending');
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
      fetch(form.action, {
        method: 'POST', body: body, headers: { Accept: 'application/json' },
        signal: ctrl ? ctrl.signal : undefined
      })
        .then(function (res) {
          return res.json().then(function (data) { if (!res.ok || !data.success) throw new Error(data.message || 'not sent'); });
        })
        .then(sent, function () { fail.hidden = false; })
        .then(function () {
          clearTimeout(timer); busy = false;
          send.disabled = false;
          send.textContent = label;
          /* a button loses the focus while it's disabled: give it back if it had it */
          if (focused && !form.hidden && (!document.activeElement || document.activeElement === document.body)) send.focus();
        });
    });
    return function () { opened = now(); };
  }

  /* A link as typed, with https:// added if it was left out, or '' if it
     isn't a web address: it must be http(s), with no name or password in
     it, on a real domain (a name, a dot, an ending). */
  function webAddress(v) {
    if (typeof URL !== 'function') return v; /* a browser too old to check: let it through */
    var full = /^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : 'https://' + v, url;
    try { url = new URL(full); } catch (err) { return ''; }
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) return '';
    return /^([a-z0-9-]+\.)+([a-z]{2,}|xn--[a-z0-9-]+)$/i.test(url.hostname) ? full : '';
  }

  /* ---------------- Reviews: the panel and its form ----------------
     Write a review opens the form in a <dialog> over the page. It slides in
     (.is-open, added once it's open) and slides out before it closes. Close,
     the Escape key and, on computers, a click on the dimmed page close it, and
     the focus goes back to the link. While it's open, the page behind is
     locked. Opening puts the focus on the panel's title, not on a field, so a
     phone doesn't throw its keyboard up over the panel as it arrives.
     The form is one of "the two forms" above. Name and review are required;
     the link to their work is checked if they give one. Its 3 seconds start
     each time the panel opens. */
  (function reviewPanel() {
    var panel = document.getElementById('rpanel');
    var opener = document.querySelector('.reviews__write');
    if (!panel || !opener) return;
    var title = panel.querySelector('.rpanel__title'), box = panel.querySelector('.rpanel__box');
    var modal = typeof panel.showModal === 'function';
    var timer = 0, onEnd = null, downOutside = false;
    var restartClock = webForm(panel.querySelector('.rform'), panel.querySelector('.rform__done'));

    function open() {
      if (panel.open) return;
      restartClock();
      box.scrollTop = 0;
      /* locking hides the scrollbar where it takes space (Windows): pad the page by its width instead, so nothing moves */
      var bar = window.innerWidth - root.clientWidth;
      if (bar > 0) document.body.style.paddingRight = bar + 'px';
      root.classList.add('rpanel-lock');
      if (modal) panel.showModal(); else panel.setAttribute('open', '');
      title.focus({ preventScroll: true });
      void panel.offsetWidth; /* settle the closed position first, so the slide has somewhere to start from */
      panel.classList.add('is-open');
    }
    function stopWaiting() {
      clearTimeout(timer); timer = 0;
      if (onEnd) { panel.removeEventListener('transitionend', onEnd); onEnd = null; }
    }
    function finish() {
      stopWaiting();
      if (!panel.open) return;
      if (modal) panel.close(); /* 'close' runs closed() */
      else { panel.removeAttribute('open'); closed(); }
    }
    function shut() {
      if (!panel.open || timer) return;
      panel.classList.remove('is-open');
      if (reduce) { finish(); return; }
      onEnd = function (e) { if (e.target === panel && e.propertyName === 'transform') finish(); };
      panel.addEventListener('transitionend', onEnd);
      timer = setTimeout(finish, 700); /* in case the slide's end is never reported */
    }
    /* however it closed: by shut(), or at once (a browser may close it on a second Escape) */
    function closed() {
      stopWaiting();
      panel.classList.remove('is-open');
      root.classList.remove('rpanel-lock');
      document.body.style.paddingRight = '';
      opener.focus({ preventScroll: true });
    }

    opener.addEventListener('click', open);
    panel.querySelector('.rpanel__close').addEventListener('click', shut);
    if (modal) panel.addEventListener('close', closed);
    panel.addEventListener('cancel', function (e) { e.preventDefault(); shut(); }); /* Escape: slide out first */
    /* a click on the dimmed page, outside the panel. Both ends of the click must be out
       there, so selecting text in a field and letting go outside doesn't close it. */
    panel.addEventListener('pointerdown', function (e) { downOutside = e.target === panel; });
    panel.addEventListener('click', function (e) {
      if (e.target === panel && downOutside) shut();
      downOutside = false;
    });
  })();

  /* ---------------- 06 Contact: the form ----------------
     One of "the two forms" above. Only the name and the number are
     required. Its 3 seconds start as the page loads. */
  webForm(document.querySelector('.cform'), document.querySelector('.cform__done'));

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

  /* ---------------- measuring the page ----------------
     ScrollTrigger measures where everything is when the page is ready, when
     the intro lets go of the page (it locks it while it plays), when the
     fonts arrive (they change line heights) and when everything has loaded.
     Each time it scrolls the page to the top and back in one step. On an
     iPhone that stops a flick dead and can jump the page, and there
     "everything has loaded" comes late: it waits for the hero's 80 frames.
     So it measures at those moments only while the page is still: if you're
     scrolling, it waits until the scroll has stopped and no finger is on the
     screen. Turning the phone or resizing the window measures as before
     (ScrollTrigger already waits for the scroll to stop there). */
  ScrollTrigger.config({ autoRefreshEvents: 'visibilitychange,resize' });
  var measureDue = false;
  function measureWhenStill() {
    if (ScrollTrigger.isScrolling()) { measureDue = true; return; }
    measureDue = false;
    ScrollTrigger.refresh();
  }
  ScrollTrigger.addEventListener('scrollEnd', function () { if (measureDue) measureWhenStill(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', measureWhenStill);
  else measureWhenStill();
  window.addEventListener('load', measureWhenStill);
  document.addEventListener('intro:done', measureWhenStill);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureWhenStill);

  if (reduce) return;

  /* (The text reveal and the rise and fade for the table and the other cards
     are set up last, at the bottom of this file.) */

  /* The same rise and fade for the 03 glass cards, but by a CSS transition
     (.is-waiting, then .is-in, as each card's top reaches 85% of the screen):
     phones run a transition off the main thread, and GSAP would rewrite a
     glass card's style on every frame of it. Returns a function that undoes it. */
  function riseByClass(items) {
    if (!('IntersectionObserver' in window)) return function () {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting && e.boundingClientRect.top > 0) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -15% 0px' });
    items.forEach(function (el) { el.classList.add('is-waiting'); io.observe(el); });
    return function () {
      io.disconnect();
      items.forEach(function (el) { el.classList.remove('is-waiting', 'is-in'); });
    };
  }
  riseByClass(gsap.utils.toArray('.extras > .plan-card')); /* 45 days and Care */

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

  /* ---------------- 02 Work: What was built — the build sheet ----------------
     Five steps, one per pin. A step only switches classes: .is-on on the pins
     and notes up to it, .is-current on its own. CSS transitions do the rest
     (transform and opacity), so while you scroll nothing runs here except a
     check of which step you're on.
       .is-steps  computers, at least 960x600. The browser holds the sheet in
                  the middle of the screen (CSS sticky) for 1.75 screen-heights.
                  Step 1 starts as the sheet arrives, steps 2 to 5 are spread
                  over the held scroll, and the full sheet stays a moment at
                  the end.
       .is-stack  phones, tablets and shorter screens. Each view sticks under
                  the nav, and a step starts when its note's title reaches 72%
                  of the screen height (80% on screens under 600px tall).
     Scrolling back undoes the steps. Under 500px tall nothing runs: the sheet
     stays finished, as it is with reduced motion and without JavaScript.
     The live-site link sits in note 5: Tab to it, and the page scrolls to
     step 5 so you can see it. */
  (function buildSheet() {
    var block = document.querySelector('.work .built');
    var run = block && block.querySelector('.sheet-run');
    var sheet = run && run.querySelector('.sheet');
    if (!sheet) return;
    var pins = gsap.utils.toArray(sheet.querySelectorAll('.pin'));
    var notes = gsap.utils.toArray(sheet.querySelectorAll('.sheet__note'));
    var link = sheet.querySelector('.sheet__link a');
    var nav = document.getElementById('nav');
    var AT = [0.08, 0.3, 0.52, 0.74]; /* steps 2 to 5, as shares of the held scroll */
    var step = 0;

    function setStep(k) {
      if (k === step) return;
      step = k;
      [pins, notes].forEach(function (list) {
        list.forEach(function (el, i) {
          el.classList.toggle('is-on', i < k);
          el.classList.toggle('is-current', i === k - 1);
        });
      });
    }
    function navBottom() { return nav ? Math.round(nav.getBoundingClientRect().bottom) : 70; }

    gsap.matchMedia().add({
      steps: '(min-width: 960px) and (min-height: 600px)',
      stack: '(max-width: 959.98px) and (min-height: 500px), (min-height: 500px) and (max-height: 599.98px)'
    }, function (ctx) {
      var steps = ctx.conditions.steps;
      var marks = [], tops = [], held = 0, top = 0, st;
      /* a mode starts at its right step without playing the steps before it */
      block.classList.add('is-live', steps ? 'is-steps' : 'is-stack', 'is-setting');
      requestAnimationFrame(function () { requestAnimationFrame(function () { block.classList.remove('is-setting'); }); });

      if (steps) {
        st = ScrollTrigger.create({
          trigger: run,
          start: function () {
            /* centred between the nav and the bottom edge */
            var h = sheet.offsetHeight, nb = navBottom();
            top = Math.max(nb + 16, Math.round((window.innerHeight + nb - h) / 2));
            sheet.style.top = top + 'px';
            held = run.offsetHeight - h;
            var arrive = window.innerHeight * 0.55 - top; /* from the start until the sheet is held */
            marks = AT.map(function (f) { return arrive + held * f; });
            return 'top 55%';
          },
          end: function () { return 'bottom ' + (top + sheet.offsetHeight) + 'px'; }, /* when it's let go */
          onUpdate: update, onRefresh: update, onLeaveBack: update
        });
      } else {
        st = ScrollTrigger.create({
          trigger: run, start: 'top bottom', end: 'bottom top',
          onRefresh: function (self) {
            /* where each note's title starts (the space above it is the held scroll) */
            tops = notes.map(function (n) { return n.querySelector('.sheet__title').getBoundingClientRect().top + window.scrollY; });
            update(self);
          },
          onUpdate: update, onLeave: update, onLeaveBack: update
        });
      }

      function update(self) {
        var y = self.scroll(), k = 0;
        if (steps) {
          y -= self.start;
          if (y >= 0) k = 1;
          marks.forEach(function (m) { if (y >= m) k++; });
        } else {
          y += window.innerHeight * (window.innerHeight < 600 ? 0.8 : 0.72); /* short screens: a little sooner */
          tops.forEach(function (t) { if (y >= t) k++; });
        }
        setStep(k);
      }

      function showLink() {
        if (step >= 5) return;
        var y = steps ? st.start + marks[3] + 2 : tops[4] - window.innerHeight * 0.5;
        window.scrollTo(0, Math.ceil(y));
      }
      if (link) link.addEventListener('focus', showLink);

      return function () {
        if (link) link.removeEventListener('focus', showLink);
        block.classList.remove('is-live', 'is-steps', 'is-stack', 'is-setting');
        sheet.style.top = '';
        setStep(0);
      };
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

  /* ---------------- 03 What we do: the ring ----------------
     The four plan cards sit on a ring seen from slightly above: Starter at the
     front, Business on the right, Advanced behind, Boss on the left. On any
     screen at least 500px tall the browser holds the ring under the nav (CSS
     sticky on .plans__stage) while 4.4 screen-heights of scroll go past, and
     the ring turns clockwise as you scroll down: the front card swings left
     and back, and the next one comes in from the right. Starter, Business,
     Advanced, Boss: three quarters of a turn in all, each quarter over 1.17
     screen-heights of scroll. Tied to the scroll, with no snapping and no
     swiping, so when you stop it stops. Each card holds at the front for a
     while and the turn slows right down as it gets there, so wherever you
     stop, one card is almost always square at the front.
     While a finger or the mouse is on a card, the ring waits where it is (the
     page itself still scrolls), and when you let go it turns round to where
     the scroll has got to.
     The ring is 1.4 cards wide, so two cards only change places (which one is
     on top) where they don't overlap, and the swap never shows.
     The front card is full size with nothing on it, so its text is sharp. The
     cards behind are smaller and dimmed, and their text fades further; on
     computers it's also slightly out of focus (the glass and the neon edge stay
     crisp). Phones and tablets skip that blur, because redrawing blurred text
     on every frame is the part a phone finds hard, and fade the text right
     away instead, so no half words show at the screen edges: the cards behind
     are clear glass with their neon edge, and a card's words appear as it
     comes round to the front. The dimming also keeps the front card's text
     AA: at full strength, the orange button of a card behind would show
     through its glass. A card only starts to dim 45 degrees from the front,
     where it stops overlapping the card coming in: a dimmed card lets a
     little of what's behind it through, unblurred.
     Only transform and opacity change while you scroll, and nothing is
     measured then.
     Tab into a card that isn't at the front and the page scrolls until it is.
     Shorter screens (a phone on its side) keep the cards as laid out in the
     HTML, and they simply rise and fade in. */
  (function ring() {
    var run = document.querySelector('.plans');
    var stage = run && run.querySelector('.plans__stage');
    var list = stage && stage.querySelector('.plans__ring');
    var cards = list ? gsap.utils.toArray(list.children) : [];
    var nav = document.getElementById('nav');
    if (cards.length !== 4 || !stage || !nav) return;
    var bodies = cards.map(function (card) { return card.querySelector('.card-body'); });

    var START = [0, 270, 180, 90]; /* each card's place on the ring, degrees clockwise from the front: Starter in front, Business next (right), Advanced behind, Boss left */
    /* each quarter turn's start and end, as shares of the held scroll (4.4 screen-heights): a
       turn takes 1.17 screen-heights, and a card stays at the front for 0.29 of one between
       turns, 0.15 at the two ends */
    var TURNS = [[0.035, 0.301], [0.367, 0.633], [0.699, 0.965]];
    var HOLD = [0.0175, 0.334, 0.666, 0.9825]; /* the middle of each card's stay at the front */
    /* The ring is 1.4 cards wide (RADIUS), and straight behind, a card is 20% of its height
       higher (RISE) and 76% size. From 45 degrees round, a card dims, to 45% at the sides and
       behind, and its text fades to 60% of that; on computers the text also blurs to 3px.
       On phones and tablets the text fades out completely instead. So the orange button of
       a card behind barely shows through the front card's glass. */
    var RADIUS = 0.7, RISE = 0.2, SHRINK = 0.24, DIM = 0.55, BLUR = 3, FADE = 0.4, FADE_TOUCH = 1;
    var RING = '(min-height: 500px)', FINE = '(hover: hover) and (pointer: fine)';

    function smoother(t) { return t * t * t * (t * (t * 6 - 15) + 10); } /* eases in and out, flat at both ends */
    /* the held scroll (0 to 1) to how far the ring has turned. It holds at 0, 90, 180 and 270 degrees. */
    function turned(p) {
      for (var i = 0; i < TURNS.length; i++) {
        var a = TURNS[i][0], b = TURNS[i][1];
        if (p < a) return 90 * i;
        if (p < b) return 90 * (i + smoother((p - a) / (b - a)));
      }
      return 90 * TURNS.length;
    }

    gsap.matchMedia().add({ ring: RING, still: 'not all and ' + RING, fine: FINE }, function (ctx) {
      if (!ctx.conditions.ring) return riseByClass(cards);

      var blurText = ctx.conditions.fine, fade = blurText ? FADE : FADE_TOUCH;
      run.classList.add('is-orbit');
      var w = 0, h = 0, dpr = 1, progress = 0, turn = 0, intro = { k: 0 }; /* turn: how far the ring on screen has turned */
      var z = [-1, -1, -1, -1], softs = [-1, -1, -1, -1], moves = ['', '', '', ''], alphas = ['', '', '', ''];
      function measure() { w = cards[0].offsetWidth; h = cards[0].offsetHeight; dpr = window.devicePixelRatio || 1; }
      function snap(v) { return Math.round(v * dpr) / dpr; } /* whole screen pixels, so the front card's text is never resampled */

      /* Written straight to each card's style, and only when it changes: this runs on every
         frame of scrolling, and while a card holds at the front nothing needs redoing. */
      function render() {
        var depth = [];
        cards.forEach(function (card, i) {
          var deg = START[i] + turn, rad = deg * Math.PI / 180;
          var back = (1 - Math.cos(rad)) / 2;                     /* 0 at the front, 1 straight behind */
          var away = Math.abs((((deg % 360) + 540) % 360) - 180); /* degrees from the front, 0 to 180 */
          var soft = away <= 45 ? 0 : away >= 90 ? 1 : smoother((away - 45) / 45);
          soft = Math.round(soft * 100) / 100; /* 100 steps are plenty, and spare the text needless redraws */
          var move = 'translate(' + snap(-RADIUS * w * Math.sin(rad)) + 'px, ' +
            snap(-RISE * h * back + 16 * (1 - intro.k)) + 'px)' + /* plus the 16px rise as the ring first comes into view */
            (back < 0.001 ? '' : ' scale(' + Math.round((1 - SHRINK * back) * 1e4) / 1e4 + ')');
          var alpha = String(Math.round((1 - DIM * soft) * intro.k * 1000) / 1000);
          if (move !== moves[i]) { moves[i] = move; card.style.transform = move; }
          if (alpha !== alphas[i]) { alphas[i] = alpha; card.style.opacity = alpha; }
          if (soft !== softs[i]) {
            softs[i] = soft;
            if (blurText) bodies[i].style.filter = soft ? 'blur(' + Math.round(BLUR * soft * 10) / 10 + 'px)' : '';
            bodies[i].style.opacity = soft ? 1 - fade * soft : '';
          }
          depth.push([Math.cos(rad), i]);
        });
        depth.sort(function (a, b) { return a[0] - b[0]; }); /* furthest first */
        depth.forEach(function (d, rank) { if (z[d[1]] !== rank) { z[d[1]] = rank; cards[d[1]].style.zIndex = rank + 1; } });
      }

      var st = ScrollTrigger.create({
        trigger: run,
        /* the stage sticks when it reaches the middle of the screen under the nav (css/site.css
           works out where, from these two), and lets go when the space after it has scrolled past */
        start: function () {
          run.style.setProperty('--stick', Math.round(nav.getBoundingClientRect().bottom) + 'px');
          run.style.setProperty('--stage-h', stage.offsetHeight + 'px');
          measure();
          return 'top ' + Math.round(parseFloat(getComputedStyle(stage).top)) + 'px';
        },
        end: function () { return '+=' + (run.offsetHeight - stage.offsetHeight); },
        onUpdate: function (self) { progress = self.progress; follow(); },
        onRefresh: function (self) { progress = self.progress; follow(); }
      });
      /* the first time the ring comes into view it rises and fades in, like the other cards on the page */
      gsap.to(intro, {
        k: 1, duration: 0.8, ease: 'power3.out', onUpdate: render,
        scrollTrigger: { trigger: list, start: 'top 85%', once: true }
      });

      /* While a finger or the mouse is on a card, the ring waits where it is; the page itself
         still scrolls. Let go (or move the mouse off the cards) and it turns round to where the
         scroll has got to, easing in and out: about half a second, a little longer for a longer
         way. The mouse holds it only once it has moved on to a card, not when a card turns in
         under a mouse that's standing still. Only transform and opacity change, as always. */
      var touching = false, hovering = false, held = false, catching = false;
      var from = 0, t0 = 0, dur = 0, px = -1, py = -1;
      function follow() { if (!held && !catching) turn = turned(progress); render(); }
      function catchUp(time) {
        var k = Math.min(1, (time - t0) / dur);
        turn = from + (turned(progress) - from) * smoother(k); /* ends exactly where the scroll is, even if it moved meanwhile */
        if (k === 1) { catching = false; gsap.ticker.remove(catchUp); }
        render();
      }
      function setHold() {
        var on = touching || hovering, gap = Math.abs(turned(progress) - turn);
        if (on === held) return;
        held = on;
        if (catching) { catching = false; gsap.ticker.remove(catchUp); }
        if (!on && gap > 0.05) {
          from = turn; t0 = gsap.ticker.time; dur = 0.5 + gap / 600;
          catching = true; gsap.ticker.add(catchUp);
        }
      }
      function fingerDown() { touching = true; setHold(); }
      function fingerUp(e) { if (!e.touches.length) { touching = false; setHold(); } }
      function pointerMove(e) {
        if (e.pointerType === 'touch' || (e.clientX === px && e.clientY === py)) return;
        px = e.clientX; py = e.clientY;
        hovering = !!e.target.closest('.plan');
        setHold();
      }
      function pointerOff(e) { if (e.pointerType !== 'touch') { hovering = false; setHold(); } }
      cards.forEach(function (card) {
        card.addEventListener('touchstart', fingerDown, { passive: true });
        card.addEventListener('pointerleave', pointerOff);
      });
      stage.addEventListener('pointermove', pointerMove);
      window.addEventListener('touchend', fingerUp, { passive: true });
      window.addEventListener('touchcancel', fingerUp, { passive: true });

      function bringForward(e) {
        var i = cards.indexOf(e.currentTarget);
        /* from the keyboard, a mouse resting on a card no longer holds the ring
           (browsers too old to know :focus-visible throw here: treat it as the keyboard) */
        var keys = true;
        try { keys = e.target.matches(':focus-visible'); } catch (err) { /* keys stays true */ }
        if (keys) { hovering = false; setHold(); }
        if (Math.abs(turned(progress) - 90 * i) > 1) window.scrollTo(0, Math.round(st.start + HOLD[i] * (st.end - st.start)));
      }
      cards.forEach(function (card) { card.addEventListener('focusin', bringForward); });

      return function () {
        cards.forEach(function (card) {
          card.removeEventListener('focusin', bringForward);
          card.removeEventListener('touchstart', fingerDown);
          card.removeEventListener('pointerleave', pointerOff);
        });
        stage.removeEventListener('pointermove', pointerMove);
        window.removeEventListener('touchend', fingerUp);
        window.removeEventListener('touchcancel', fingerUp);
        gsap.ticker.remove(catchUp);
        run.classList.remove('is-orbit');
        run.style.removeProperty('--stick');
        run.style.removeProperty('--stage-h');
        cards.forEach(function (card) { card.style.transform = card.style.opacity = card.style.zIndex = ''; });
        bodies.forEach(function (body) { body.style.filter = body.style.opacity = ''; });
      };
    });
  })();

  /* ---------------- 04 How it works: the stack ----------------
     The four panels slide over each other. The browser holds them in place
     (position: sticky, in css/site.css), which stays smooth on phones. Here we
     only pick how they stack, measure where everything is (on load and resize,
     never while you scroll), and shrink and dim the panel behind.
     - The stack (computers and tablets): each panel sticks near the top, 18px
       below the one before. As the next one slides up, the one behind shrinks
       to 0.95. It dims to 60% only once the next one has covered all its text,
       when just its empty top edge still shows: dimmed text on these colours
       would fail AA.
     - Phones, and any screen too short for the stack: a panel taller than the
       screen couldn't be read if it stuck at the top, so it scrolls up normally
       and stops when its bottom edge is just above the WhatsApp button. The
       next one slides up over it and covers it completely. On the way it
       shrinks towards the middle of the screen; it doesn't dim, because by the
       time it could, it's out of sight.
     With reduced motion none of this runs: the panels simply follow each other. */
  (function howStack() {
    var stack = document.querySelector('.how__stack');
    var slots = stack ? Array.prototype.slice.call(stack.children) : [];
    if (slots.length < 2) return;
    var panels = slots.map(function (slot) { return slot.firstElementChild; });
    var SHRINK = 0.05, DIM = 0.4; /* to 0.95 size, and to 60% */
    var mode = '', parts = [], shown = [];

    function reset() {
      panels.forEach(function (p) { p.style.transform = p.style.opacity = ''; });
      shown = [];
    }

    /* The stack, if every panel's text fits in it. Phones always take the other
       way: their panels are taller than the screen, and the WhatsApp button
       sits at the bottom there. */
    function pick() {
      reset();
      stack.classList.remove('is-flow');
      stack.classList.add('is-stack');
      var fits = window.innerWidth >= 720 && panels.every(function (p) { return p.scrollHeight <= p.clientHeight + 1; });
      mode = fits ? 'stack' : 'flow';
      if (fits) return;
      stack.classList.remove('is-stack');
      stack.classList.add('is-flow');
      slots.forEach(function (slot) { slot.style.setProperty('--h', slot.offsetHeight + 'px'); });
    }

    /* How far below a panel's top its first text begins: the top of the first box that
       holds text. Every line height here leaves room for the letters inside the line,
       so no ink sits above it. */
    function textTop(panel) {
      var box = panel.getBoundingClientRect(), top = Infinity;
      var walker = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT, null);
      while (walker.nextNode()) {
        if (!walker.currentNode.nodeValue.trim()) continue;
        var el = walker.currentNode.parentElement;
        while (el !== panel && getComputedStyle(el).display === 'inline') el = el.parentElement;
        var r = el.getBoundingClientRect();
        if (r.width > 1) top = Math.min(top, r.top); /* skips the 1px hidden "1. " for screen readers */
      }
      return top - box.top;
    }

    /* For each panel but the last: the scroll positions where it starts and stops
       shrinking, and where it starts to dim. Measured from where each panel would
       sit without sticking (the stack's top plus the heights before it), because a
       panel that's stuck right now reports where it's stuck. */
    function measure() {
      reset();
      var y = stack.getBoundingClientRect().top + window.pageYOffset;
      var gap = parseFloat(getComputedStyle(slots[1]).marginTop) || 0;
      var at = [], stick = [], h = [];
      slots.forEach(function (slot) {
        at.push(y);
        h.push(slot.offsetHeight);
        stick.push(parseFloat(getComputedStyle(slot).top) || 0);
        y += slot.offsetHeight + gap;
      });
      parts = [];
      for (var i = 0; i < slots.length - 1; i++) {
        var part = { from: at[i] - stick[i], to: at[i + 1] - stick[i + 1], dim: Infinity }; /* this one stops, the next one stops */
        if (mode === 'stack') {
          /* covered once the next panel's top passes this one's first text (at 0.95 size) */
          part.dim = part.to + (stick[i + 1] - stick[i]) - 0.95 * textTop(panels[i]);
          panels[i].style.transformOrigin = '50% 0';
        } else {
          part.to = at[i + 1]; /* the next one's top reaches the top of the screen */
          panels[i].style.transformOrigin = '50% ' + Math.round((h[i] - stick[i]) / 2) + 'px'; /* the middle of what's on screen */
        }
        parts.push(part);
      }
    }

    function render(scroll) {
      parts.forEach(function (part, i) {
        var k = Math.min(1, Math.max(0, (scroll - part.from) / (part.to - part.from)));
        var d = part.dim < part.to ? Math.min(1, Math.max(0, (scroll - part.dim) / (part.to - part.dim))) : 0;
        var s = Math.round((1 - SHRINK * k) * 1e4) / 1e4, o = Math.round((1 - DIM * d) * 1e3) / 1e3;
        if (shown[i] === s + '/' + o) return;
        shown[i] = s + '/' + o;
        panels[i].style.transform = s < 1 ? 'scale(' + s + ')' : '';
        panels[i].style.opacity = o < 1 ? o : '';
      });
    }

    /* picked again at the start of every refresh, before anything on the page is measured */
    pick();
    ScrollTrigger.addEventListener('refreshInit', pick);
    ScrollTrigger.create({
      trigger: stack, start: 'top bottom', end: 'bottom top',
      onRefresh: function (self) { measure(); render(self.scroll()); },
      onUpdate: function (self) { render(self.scroll()); }
    });
  })();

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

  /* Set up last: the build sheet, the ring and the 04 stack above change how
     tall the page is, so everything below is measured after them and sits in
     the right place from the start, even while measuring the whole page waits
     for you to stop scrolling (see "measuring the page"). */

  /* ---------------- text reveal (js/reveal.js) ----------------
     Headings word by word, paragraphs line by line, big statement lines
     letter by letter — see data-reveal in the HTML. */
  if (typeof window.webessyReveal === 'function') window.webessyReveal(document);

  /* ---------------- rise and fade for things that aren't text ----------------
     The table, the About photo and the like: 16px rise and fade, once, as they
     come into view. Opacity only, never visibility: hidden, so buttons and
     links can still be reached with the Tab key and read by screen readers
     before they fade in. The 03 cards have their own (riseByClass, the ring). */
  function riseIn(el) {
    gsap.from(el, {
      y: 16, opacity: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
  }
  gsap.utils.toArray('.reveal').forEach(function (el) { if (!el.closest('.plans, .extras')) riseIn(el); });
})();
