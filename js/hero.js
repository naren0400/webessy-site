/* ==========================================================================
   HERO — the welcome, then Veo frames scrubbed by scroll, the chrome 0400
   inside the window, then the statement "Make people choose you."
   Scroll map, in vh of scrolling. The hero scrolls 312vh: its 412vh height
   (css/site.css) minus the 100vh stage. Change the two together. Phones
   scroll it in 190vh (290vh tall): the same map, as shares of the scroll.
       0 -  14   the welcome's words rise and fade, line by line
       3 -  24   the welcome's picture dissolves into frame 1, pushing in a little
      20 - 180   frames 1 → 80 (pull back from the light to the portal)
     162 - 224   chrome 0400 revealed by light, glass pane frosts behind it
     180 - 224   slow push in towards the window
     240 - 262   the room dims
     242 - 270   the 0400 steps back: the push-in eases out and it fades
     257 - 289   the statement rises, line by line
     262 - 302   a thin line draws itself through the statement
     282 - 296   the small-caps line and the Explore button
   The 0400 is below half strength before the statement passes half: the two
   never overlap at full strength.

   Phones and tablets (touch screens) take a lighter path:
     - The hero measures its own box, not the window, so Safari's toolbar
       sliding in and out no longer rebuilds the canvases mid-scroll.
     - The frame canvas is redrawn only when the frame changes; the push-in
       is a GPU transform of the canvas, not a redraw every frame.
     - Frames are decoded (unpacked into pixels) ahead of the scroll, and a
       frame is never drawn before it is decoded.
     - No live blur in the hero (see #hero.lite in css/site.css).
     - The 3D canvas covers only a box around the 0400, at 1.5x, and is
       redrawn only when the scroll moves it (no idle sway).
     - The 3D 0400 is built, and drawn once unseen (which prepares its
       shaders), while the page is still, so neither holds up a scroll.
     - The welcome's slow drift and its stars are CSS animations, which run
       off the main thread. Its stars are drawn once per screen size.

   The welcome appears as the intro's 0400 lands in the nav (html.nav-done,
   css/site.css). On desktop its picture and stars drift against the cursor
   (the nearer stars further) and the letters of "Webessy" lean towards it.
   ========================================================================== */
(function () {
  'use strict';

  var DEBUG = /[?&]debug\b/.test(location.search); /* add ?debug to the address for the readout bottom-left */

  var $ = function (id) { return document.getElementById(id); };
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function sm(a, b, x) { var t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mq(q) { return !!(window.matchMedia && window.matchMedia(q).matches); }
  var D2R = Math.PI / 180;

  var hero = $('hero'), stage = $('heroStage'), fcv = $('frames'), gcv = $('chrome'), pane = $('glassPane'),
      dim = $('heroDim'), mark = $('heroMark'), st = $('statement'), welcome = $('welcome'), hud = $('hud');
  if (!hero || !stage || !fcv) { console.error('[hero] page structure missing'); return; }
  var fctx = fcv.getContext('2d');
  if (hud && DEBUG) hud.style.display = 'block';

  var LITE = mq('(hover: none) and (pointer: coarse)');                 /* phones and tablets */
  var REDUCE = mq('(prefers-reduced-motion: reduce)');
  var CURSOR = !LITE && !REDUCE && mq('(hover: hover) and (pointer: fine)');
  hero.classList.toggle('lite', LITE);

  /* write a style only when it changes */
  function css(el, prop, v) {
    if (!el) return;
    var c = el.__hero || (el.__hero = {});
    if (c[prop] !== v) { c[prop] = v; el.style[prop] = v; }
  }

  /* Safety net: never leave the page scroll-locked if the intro breaks.
     It only steps in when the intro has genuinely stopped, not when it is slow. */
  var safety = setInterval(function () {
    if (window.__introDone) { clearInterval(safety); return; }
    var alive = typeof window.__introAlive === 'function' && window.__introAlive();
    if (!alive && performance.now() > 6000) {
      clearInterval(safety);
      document.documentElement.classList.remove('intro-lock');
      document.documentElement.classList.add('nav-in', 'nav-done');
      var el = $('intro'); if (el) el.style.display = 'none';
      window.__introDone = true;
      document.dispatchEvent(new CustomEvent('intro:done'));
      console.warn('[hero] intro stopped responding, released the page');
    }
  }, 1000);

  /* ---------------- frames ----------------
     All 80 frames download early, the last one second (the hero rests on it).
     A frame is drawn only once it is decoded, and frames are decoded ahead of
     the scroll, off the main thread where the browser allows it:
       Safari and every iPhone browser: img.decode()
       Chrome, Edge, Firefox (http/https): fetch + createImageBitmap(blob)
     (Measured in Chrome: img.decode() doesn't help its canvas, and
     createImageBitmap(img) blocks the page for 13-24 ms a frame.)
     Opened from disk (file://) fetch is blocked, so Chrome falls back to plain
     images and decodes as it draws. That only affects local previews. */
  var FRAME_COUNT = 80;
  var SETS = {
    desktop: { name: 'desktop', dir: 'frames/desktop/', win: { x0: .371, x1: .624, y0: .051, y1: .853 }, logoY: .42 },
    mobile:  { name: 'mobile',  dir: 'frames/mobile/',  win: { x0: .221, x1: .764, y0: .227, y1: .790 }, logoY: .48 }
  };
  var WEBKIT = /Apple/.test(navigator.vendor || '');
  var BITMAPS = !WEBKIT && location.protocol !== 'file:' && typeof fetch === 'function' && typeof createImageBitmap === 'function';
  var AHEAD = LITE ? 12 : 16, BEHIND = LITE ? 3 : 5, DECODING = 3;
  var set = null, gen = 0, store = [], fw = 0, fh = 0, loadedCount = 0, shown = -1, dir = 1;

  function pickSet() { return H > W ? SETS.mobile : SETS.desktop; }
  function pad(n) { return ('00' + n).slice(-3); }

  function loadFrames() {
    store.forEach(release);
    set = pickSet(); gen++; store = []; loadedCount = 0; shown = -1; fw = 0; fh = 0;
    var myGen = gen, viaFetch = BITMAPS, active = 0, MAX = 6, i;
    var order = [0, FRAME_COUNT - 1];
    for (i = 1; i < FRAME_COUNT - 1; i++) order.push(i);
    for (i = 0; i < FRAME_COUNT; i++) store.push({ img: null, blob: null, src: null, busy: false, failed: false });
    function finished(ok, i) {
      if (myGen !== gen) return;
      active--;
      if (ok) { loadedCount++; wake(); } else console.warn('[hero] frame failed to load: ' + (i + 1));
      next();
    }
    function asImage(i, url) {
      var im = new Image();
      im.decoding = 'async';
      im.onload = function () { if (myGen === gen) store[i].img = im; finished(true, i); };
      im.onerror = function () { finished(false, i); };
      im.src = url;
    }
    function next() {
      while (active < MAX && order.length) (function (i) {
        active++;
        var url = set.dir + 'frame_' + pad(i + 1) + '.webp';
        if (!viaFetch) { asImage(i, url); return; }
        fetch(url).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.blob(); })
          .then(function (b) { if (myGen !== gen) return; store[i].blob = b; finished(true, i); },
                function () { if (myGen !== gen) return; viaFetch = false; asImage(i, url); });
      })(order.shift());
    }
    next();
  }

  /* forget a decoded frame (bitmaps are freed; a decoded <img> is left to the browser) */
  function release(s) {
    if (s && s.src && s.src !== s.img && s.src.close) s.src.close();
    if (s) s.src = null;
  }
  function decode(i) {
    var s = store[i], myGen = gen;
    s.busy = true;
    var job = s.blob ? createImageBitmap(s.blob) : s.img.decode().then(function () { return s.img; });
    job.then(function (src) {
      if (myGen !== gen) { if (src !== s.img && src.close) src.close(); return; }
      s.busy = false; s.src = src;
      if (!fw) { fw = src.naturalWidth || src.width; fh = src.naturalHeight || src.height; layoutMaps(); }
      wake();
    }, function () {
      if (myGen !== gen) return;
      s.busy = false;
      if (s.img) s.src = s.img; /* decode() refused: draw it anyway rather than stall */
      else s.failed = true;
      wake();
    });
  }
  /* Keep a window of decoded frames around the wanted one, most of it ahead in
     the direction of travel. Frames well outside it are freed. */
  function schedule(want, visible) {
    var lo = dir > 0 ? want - BEHIND : want - AHEAD, hi = dir > 0 ? want + AHEAD : want + BEHIND;
    var busy = 0, i, s;
    for (i = 0; i < FRAME_COUNT; i++) {
      s = store[i];
      if (s.busy) busy++;
      if (s.src && i !== shown && (!visible || i < lo - 2 || i > hi + 2)) release(s);
    }
    if (!visible) return;
    for (var k = 0; k <= AHEAD && busy < DECODING; k++) {
      for (var side = 0; side < 2 && busy < DECODING; side++) {
        if (side === 1 && (k === 0 || k > BEHIND)) continue;
        i = want + (side ? -k : k) * dir;
        s = store[i];
        if (!s || s.src || s.busy || s.failed || !(s.blob || s.img)) continue;
        decode(i); busy++;
      }
    }
  }
  /* the frame to draw: the wanted one if it's decoded, otherwise the nearest
     decoded frame between it and the one on screen (never past it, never back) */
  function pick(want) {
    if (store[want] && store[want].src) return want;
    if (shown < 0 || !store[shown] || !store[shown].src) {
      for (var d = 1; d < FRAME_COUNT; d++) {
        if (want - d >= 0 && store[want - d].src) return want - d;
        if (want + d < FRAME_COUNT && store[want + d].src) return want + d;
      }
      return -1;
    }
    var step = want > shown ? -1 : 1;
    for (var i = want + step; i !== shown; i += step) if (store[i].src) return i;
    return shown;
  }

  /* ---------------- layout ----------------
     Everything is measured from the stage (100svh), not the window: on iPhone
     the window grows and shrinks as Safari's toolbar slides, the stage doesn't. */
  var W = 0, H = 0, DPR = 1, frameDirty = true, map1 = null, F = { x: 0, y: 0 }, cbox = null;
  var ZMAX = 1.15, heroTop = 0, heroH = 1, span = 1;

  function measureSpan() {
    heroTop = hero.getBoundingClientRect().top + (window.pageYOffset || 0);
    heroH = hero.offsetHeight;
    span = Math.max(1, heroH - stage.offsetHeight);
  }
  function layout() {
    measureSpan();
    var w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight);
    if (w !== W || h !== H) {
      W = w; H = h;
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      fcv.width = Math.round(W * DPR); fcv.height = Math.round(H * DPR);
      frameDirty = true;
      if (pickSet() !== set) loadFrames();
      layoutMaps();
      measureStatement();
      drawStars();
      measureWelcome();
    }
    readScroll(); wake();
  }
  /* cover-fit the frame, then push in by z around the logo point */
  function computeMap(z) {
    if (!fw) return null;
    var c = Math.max(W / fw, H / fh), dx = (W - fw * c) / 2, dy = (H - fh * c) / 2;
    var wcx = (set.win.x0 + set.win.x1) / 2;
    var F = { x: dx + wcx * fw * c, y: dy + set.logoY * fh * c };
    return { c: c, dx: dx, dy: dy, F: F, z: z,
      pt: function (fx, fy) {
        var px = dx + fx * fw * c, py = dy + fy * fh * c;
        return { x: F.x + z * (px - F.x), y: F.y + z * (py - F.y) };
      },
      /* width of the window's inside, in screen pixels */
      innerW: function () { return (set.win.x1 - set.win.x0) * 0.88 * fw * c * z; } };
  }
  function layoutMaps() {
    map1 = computeMap(1);
    if (!map1) return;
    F = map1.F;
    /* the 3D canvas: a box around the 0400 at its largest, with room to turn */
    var logo = computeMap(ZMAX).innerW() * 0.80;
    var bw = Math.ceil(Math.min(W, logo * 1.3)), bh = Math.ceil(Math.min(H, logo * 0.8));
    cbox = { x: Math.round(F.x - bw / 2), y: Math.round(F.y - bh / 2), w: bw, h: bh };
    if (mark) mark.style.transformOrigin = F.x.toFixed(1) + 'px ' + F.y.toFixed(1) + 'px';
    frameDirty = true;
    if (chrome) chrome.resize();
  }

  /* ---------------- scroll → scene ---------------- */
  var SPAN_VH = 312;
  var T = {
    wKicker: [0.5, 9], wTitle: [1, 11], wSub: [2, 12.5], wCue: [0, 5], wPic: [3, 24], wPush: [0, 24],
    frames: [20, 180], chrome: [162, 180], pane: [166, 196], env: [162, 212], sweep: [162, 224],
    turn: [169, 224], pushIn: [180, 224], dim: [240, 262], back: [242, 270],
    line1: [257, 277], line2: [263, 283], line3: [269, 289], draw: [262, 302], foot: [282, 296]
  };
  function at(name, p) { var r = T[name]; return sm(r[0] / SPAN_VH, r[1] / SPAN_VH, p); }
  function frameAt(p) { return cl((p * SPAN_VH - T.frames[0]) / (T.frames[1] - T.frames[0])) * (FRAME_COUNT - 1); }
  function params(p) {
    var back = at('back', p);
    return {
      /* the welcome's lines in page order: kicker, title, small line, scroll cue */
      wRows: [at('wKicker', p), at('wTitle', p), at('wSub', p), at('wCue', p)],
      wPic: at('wPic', p),
      wPush: at('wPush', p),
      frame: frameAt(p),
      zoom: 1 + (ZMAX - 1) * at('pushIn', p) * (1 - back),
      chromeIn: at('chrome', p),
      env: 0.02 + 0.98 * at('env', p),
      sweep: 40 * D2R * (1 - at('sweep', p)),
      yaw: lerp(-20, -8, at('turn', p)) * D2R,
      pitch: lerp(6, -3, at('turn', p)) * D2R,
      pane: at('pane', p),
      dim: at('dim', p),
      back: back,
      lines: [at('line1', p), at('line2', p), at('line3', p)],
      draw: at('draw', p),
      foot: at('foot', p)
    };
  }
  function phaseName(p) {
    var v = p * SPAN_VH;
    if (v < T.wPic[1]) return 'welcome';
    if (v < T.frames[1]) return 'frames ' + (Math.round(frameAt(p)) + 1) + ' / 80';
    if (v < T.pushIn[1]) return '0400 revealed by light';
    if (v < T.dim[0]) return 'hero frame';
    if (v < T.line1[0]) return 'room dims, 0400 steps back';
    return 'statement';
  }

  var pT = 0, pS = 0, fS = 0;
  function readScroll() { pT = cl(((window.pageYOffset || 0) - heroTop) / span); }

  /* ---------------- chrome 0400 (loaded after the intro) ---------------- */
  var chrome = null;

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.onload = res;
      s.onerror = function () { rej(new Error('could not load ' + src)); };
      document.head.appendChild(s);
    });
  }
  /* Phones and tablets: building the 0400 and drawing it the first time hold
     the page up for a moment (its shaders are prepared then), long enough to
     see on a phone. So both happen while the page is still: no scrolling for
     0.3s and no finger on the screen, once the first frame has arrived (the
     0400's place comes from it). If you keep scrolling, they happen a little
     before the 0400 comes in. */
  var lastScroll = 0, touching = false;
  if (LITE) ['touchstart', 'touchend', 'touchcancel'].forEach(function (type) {
    window.addEventListener(type, function (e) { touching = e.touches.length > 0; }, { passive: true });
  });
  function whenStill() {
    return new Promise(function (go) {
      (function check() {
        if (pT * SPAN_VH > T.chrome[0] - 60 || (map1 && !touching && performance.now() - lastScroll > 300)) go();
        else setTimeout(check, 100);
      })();
    });
  }
  function startChrome() {
    if (chrome || !gcv) return;
    loadScript('js/three.min.js')
      .then(function () { return loadScript('js/logo3d.js'); })
      .then(function () { return LITE ? whenStill() : null; })
      .then(function () {
        chrome = makeChrome(); chrome.resize();
        if (LITE && map1) chrome.render(params(pS), computeMap(1), 0); /* unseen: the canvas is still transparent */
        wake();
      })
      .catch(function (e) { console.warn('[hero] chrome 0400 unavailable: ' + e.message); if (gcv) gcv.style.display = 'none'; });
  }
  if (window.__introDone) startChrome(); else document.addEventListener('intro:done', startChrome, { once: true });

  function makeChrome() {
    var THREE = window.THREE;
    var renderer = new THREE.WebGLRenderer({ canvas: gcv, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    gcv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); gcv.style.display = 'none'; });

    var mobile = LITE || W < 760;
    var scene = new THREE.Scene();
    var mat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 1, roughness: 0.11,
      clearcoat: 1, clearcoatRoughness: 0.05,
      iridescence: 0.7, iridescenceIOR: 1.33, iridescenceThicknessRange: [180, 480],
      envMapIntensity: 0.02
    });
    var built = buildLogo(window.LOGO_DIGITS, mat, { depth: 26, bt: 5, bs: 2.6, seg: mobile ? 4 : 8 });

    /* Studio lights, recoloured to the portal: cool white, violet, blue.
       The last video frame hangs behind the logo so its back edges pick up the scene. */
    var envVersion = 0;
    function gradientTex() {
      var c = document.createElement('canvas'); c.width = 256; c.height = 256;
      var g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.40, '#eceeff');
      gr.addColorStop(0.62, '#34365a'); gr.addColorStop(1, '#04050c');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      var bg = g.createLinearGradient(59, 0, 95, 0);
      bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(0.5, 'rgba(0,0,0,0.9)'); bg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = bg; g.fillRect(59, 0, 36, 256);
      return new THREE.CanvasTexture(c);
    }
    function buildEnv(frameTex) {
      var env = new THREE.Scene();
      env.add(new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(0.008, 0.009, 0.02), side: THREE.BackSide })));
      function panel(w, h, rgb, k, pos, map) {
        var m = new THREE.MeshBasicMaterial({ color: new THREE.Color(rgb[0] * k, rgb[1] * k, rgb[2] * k), side: THREE.DoubleSide, map: map || null });
        var p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
        p.position.set(pos[0], pos[1], pos[2]); p.lookAt(0, 0, 0); env.add(p);
      }
      panel(64, 46, [0.93, 0.95, 1.0], 0.55, [0, 4, 36], gradientTex()); /* soft card behind the camera */
      panel(20, 10, [0.93, 0.95, 1.0], 6.0, [-18, 20, 10]);             /* key, top left */
      panel(5, 34, [0.55, 0.40, 1.0], 9.0, [20, 2, 16]);                 /* violet strip: the coloured rim */
      panel(24, 3, [1, 1, 1], 4.0, [0, 22, -12]);                        /* rim, top back */
      panel(2, 20, [0.35, 0.55, 1.0], 2.0, [-22, 2, -6]);                /* blue strip, back left */
      panel(1.3, 44, [0.96, 0.97, 1.0], 5.5, [-11, 4, 35]);              /* narrow strip: the sweep */
      if (frameTex) panel(64, 36, [1, 1, 1], 1.4, [0, 2, -38], frameTex);/* the portal itself */
      var pm = new THREE.PMREMGenerator(renderer);
      scene.environment = pm.fromScene(env, 0.02).texture;
      pm.dispose();
      envVersion++;
    }
    buildEnv(null);
    var img = new Image();
    img.onload = function () {
      var tx = new THREE.Texture(img); tx.colorSpace = THREE.SRGBColorSpace; tx.needsUpdate = true;
      try { buildEnv(tx); } catch (e) { console.warn('[hero] frame reflections skipped: ' + e.message); }
      wake();
    };
    img.src = window.LOGO_ENV_FRAME;

    var rig = new THREE.Group(), pivot = new THREE.Group();
    var camera = new THREE.PerspectiveCamera(28, 1, 0.1, 500);
    rig.add(camera); pivot.add(built.group); rig.add(pivot); scene.add(rig);

    var tmx = 0, tmy = 0, mx = 0, my = 0, t = 0, lastSig = '';
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      tmx = (e.clientX / window.innerWidth - 0.5) * 2; tmy = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    return {
      /* The canvas covers only cbox, a box around the 0400. setViewOffset renders
         exactly that part of the full-screen view, so the picture is the same. */
      resize: function () {
        if (!cbox) return;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, LITE || W < 760 ? 1.5 : 2));
        renderer.setSize(cbox.w, cbox.h, false);
        gcv.style.width = cbox.w + 'px'; gcv.style.height = cbox.h + 'px';
        gcv.style.transform = 'translate(' + cbox.x + 'px,' + cbox.y + 'px)';
        camera.aspect = W / H;
        camera.setViewOffset(W, H, cbox.x, cbox.y, cbox.w, cbox.h);
        lastSig = '';
      },
      /* returns true when it drew. Phones redraw only when the scroll moved it;
         desktop also has a slow idle sway and follows the cursor, so it draws every frame. */
      render: function (P, m, dt) {
        if (!cbox) return false;
        if (!LITE) {
          t += dt;
          mx += (tmx - mx) * Math.min(1, dt * 3); my += (tmy - my) * Math.min(1, dt * 3);
        } else {
          var sig = [P.sweep, P.yaw, P.pitch, P.env, m.z].map(function (v) { return v.toFixed(4); }).join() + '|' + envVersion;
          if (sig === lastSig) return false;
          lastSig = sig;
        }
        var tan = Math.tan(camera.fov * D2R / 2);
        var logoPx = m.innerW() * 0.80;                        /* logo = 80% of the window's inside */
        var dist = (10 * W) / (logoPx * 2 * tan * camera.aspect);
        camera.position.set(0, 0, dist);
        var vw = 2 * dist * tan * camera.aspect, vh = 2 * dist * tan;
        var c = m.pt((set.win.x0 + set.win.x1) / 2, set.logoY);
        pivot.position.set((c.x / W - 0.5) * vw, -(c.y / H - 0.5) * vh, 0);
        rig.rotation.y = P.sweep + Math.sin(t * 0.25) * 0.03 + Math.sin(t * 0.11) * 0.015;
        pivot.rotation.set(P.pitch + my * 0.05, P.yaw + mx * 0.08, 0);
        mat.envMapIntensity = P.env;
        renderer.render(scene, camera);
        return true;
      }
    };
  }

  /* ---------------- the statement ----------------
     "Make people choose you." rises over the dimmed scene line by line, a thin
     line draws itself through it and comes to rest at the Explore button, and
     on desktop the letters lean away from the cursor. */
  var title = st && st.querySelector('.st-title');
  var lines = st ? Array.prototype.slice.call(st.querySelectorAll('.st-line')) : [];
  var words = lines.map(function (l) { return l.querySelector('.st-in'); });
  var foot = st && st.querySelector('.st-foot');
  var sub = st && st.querySelector('.st-sub');
  var explore = st && st.querySelector('.st-explore');
  var svg = $('statementPath'), path = svg && svg.querySelector('path'), tip = svg && svg.querySelector('circle');
  var stReady = false, split = false, pathLen = 0, letters = [];
  var cursor = { on: false, x: 0, y: 0 };

  /* Desktop: each letter gets its own span so it can lean, and is nudged back
     to where the font's kerning had put it. Used by the statement and the
     welcome's "Webessy". */
  function splitChars(el, cls, into) {
    var node = el.firstChild, text = node.nodeValue, range = document.createRange(), was = [], spans = [], k;
    for (k = 0; k < text.length; k++) { range.setStart(node, k); range.setEnd(node, k + 1); was.push(range.getBoundingClientRect().left); }
    el.textContent = '';
    for (k = 0; k < text.length; k++) {
      var ch = text.charAt(k);
      if (ch === ' ') { el.appendChild(document.createTextNode(' ')); spans.push(null); continue; }
      var s = document.createElement('span');
      s.className = cls; s.textContent = ch;
      el.appendChild(s); spans.push(s);
    }
    var fs = parseFloat(getComputedStyle(el).fontSize) || 1;
    for (k = 0; k < spans.length - 1; k++) {
      if (!spans[k] || !spans[k + 1]) continue;
      var gap = (was[k + 1] - was[k]) - (spans[k + 1].getBoundingClientRect().left - spans[k].getBoundingClientRect().left);
      if (Math.abs(gap) > 0.05) spans[k].style.marginRight = (gap / fs).toFixed(4) + 'em';
    }
    spans.forEach(function (s) { if (s) into.push({ el: s, cx: 0, cy: 0, fs: fs, x: 0, y: 0, r: 0 }); });
  }
  /* Screen readers get the sentence from a hidden copy (the visible lines are aria-hidden). */
  function splitLetters() {
    if (split || !title || words.length !== 3) return;
    split = true;
    var sr = document.createElement('span');
    sr.className = 'rv-sr';
    sr.textContent = title.textContent.replace(/\s+/g, ' ').trim();
    title.insertBefore(sr, title.firstChild);
    lines.forEach(function (l) { l.setAttribute('aria-hidden', 'true'); });
    words.forEach(function (el) { splitChars(el, 'st-ch', letters); });
  }

  /* Measure where the words sit (with the rise and lean switched off; the next
     frame puts them back), then build the line through them. */
  function measureStatement() {
    if (!st || !stReady || !W || words.length !== 3) return;
    words.concat(foot).forEach(function (el) { el.style.transform = 'none'; el.__hero = null; });
    letters.forEach(function (L) { L.el.style.transform = 'none'; L.el.__hero = null; });
    var s = stage.getBoundingClientRect();
    function box(el) {
      var b = el.getBoundingClientRect();
      return { l: b.left - s.left, t: b.top - s.top, r: b.right - s.left, b: b.bottom - s.top, w: b.width, h: b.height };
    }
    var rows = words.map(function (el) {
      var b = box(el), cs = getComputedStyle(el), fs = parseFloat(cs.fontSize), lh = parseFloat(cs.lineHeight) || fs * 0.92;
      /* Bodoni Moda: ascent 1.125em, descent .4em, capitals .75em tall */
      var base = b.t + (lh - 1.525 * fs) / 2 + 1.125 * fs;
      return { l: b.l, r: b.r, base: base, cap: base - 0.75 * fs, fs: fs };
    });
    letters.forEach(function (L) {
      var b = box(L.el);
      L.cx = (b.l + b.r) / 2; L.cy = (b.t + b.b) / 2;
      L.fs = parseFloat(getComputedStyle(L.el).fontSize) || L.fs;
    });
    buildPath(rows, box(sub), box(explore));
  }

  /* a smooth curve through the points (Catmull-Rom, written as cubic Béziers) */
  function spline(pts) {
    var f = function (v) { return v.toFixed(1); };
    var d = 'M' + f(pts[0].x) + ',' + f(pts[0].y);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += 'C' + f(p1.x + (p2.x - p0.x) / 6) + ',' + f(p1.y + (p2.y - p0.y) / 6) + ' ' +
                 f(p2.x - (p3.x - p1.x) / 6) + ',' + f(p2.y - (p3.y - p1.y) / 6) + ' ' + f(p2.x) + ',' + f(p2.y);
    }
    return d;
  }
  function buildPath(rows, sb, bb) {
    if (!path) return;
    var a = rows[0], b = rows[1], c = rows[2];
    var gA = (a.base + b.cap) / 2, gB = (b.base + c.cap) / 2, gC = (c.base + Math.min(sb.t, bb.t)) / 2;
    var bx = (bb.l + bb.r) / 2, by = (bb.t + bb.b) / 2, br = bb.w / 2;
    var pts;
    if (b.r < W * 0.84) {
      /* wide screens: lines 2 and 3 stop short. The line glides through the gap
         under line 1, turns down in the space beside line 2, loops once, and
         sweeps down and left to the button. */
      var gap = b.cap - a.base;
      var lr = Math.max(16, Math.min((W - b.r) * 0.14, (c.cap - a.base) * 0.22));
      var lx = Math.min(b.r + (W - b.r) * 0.5, W - lr * 3), ly = b.cap + (b.base - b.cap) * 0.58;
      var k = function (n, i) { var t = n * Math.PI / 4; return { x: lx + lr * Math.cos(t) * (i || 1), y: ly + lr * Math.sin(t) * (i || 1) }; };
      pts = [
        { x: -W * 0.03, y: gA + gap * 0.05 },
        { x: a.l + (a.r - a.l) * 0.3, y: gA + gap * 0.24 },
        { x: a.l + (a.r - a.l) * 0.62, y: gA - gap * 0.2 },
        { x: b.r + (lx - b.r) * 0.4, y: gA + gap * 0.1 },
        { x: lx + lr * 1.25, y: ly - lr * 1.7 },
        k(0), k(1), k(2), k(3), k(4), k(5), k(6), /* once round, clockwise: east, south, west, north */
        { x: lx + lr * 1.15, y: ly + lr * 0.2 },  /* crossing itself just outside where the loop began */
        { x: lx + lr * 0.8, y: ly + lr * 2.4 },
        /* always come at the button from its right, never through it */
        { x: Math.max(bb.r + br * 1.8, c.r + (lx - c.r) * 0.42), y: Math.min(gC - (gC - c.base) * 0.3, by - br * 0.8) },
        { x: bb.r + br * 1.2, y: by - br * 0.1 },
        { x: bb.r + 1, y: by }
      ];
    } else {
      /* narrow screens: every line fills the width. The line runs between
         lines 2 and 3, turns down the right margin past the full stop, and
         comes round the small-caps line to the button. */
      var mR = W - Math.max(8, (W - c.r) * 0.45);
      pts = [
        { x: -W * 0.04, y: gB },
        { x: W * 0.3, y: gB + 2 },
        { x: W * 0.62, y: gB - 2 },
        { x: mR - (W - mR) * 1.5, y: gB + 1 },
        { x: mR, y: gB + (c.base - gB) * 0.4 },
        { x: mR, y: c.base + (gC - c.base) * 0.4 },
        { x: Math.max(sb.r + 20, W * 0.74), y: (gC + sb.b) / 2 + 6 },
        { x: Math.max(sb.r + 6, W * 0.62), y: sb.b + (by - sb.b) * 0.75 },
        { x: bb.r + br * 0.8, y: by - br * 0.04 },
        { x: bb.r + 1, y: by }
      ];
    }
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    path.setAttribute('d', spline(pts));
    pathLen = path.getTotalLength();
    path.style.strokeDasharray = pathLen.toFixed(1) + ' ' + (pathLen + 10).toFixed(1);
    path.__hero = null;
  }

  /* desktop: letters near the cursor move a little and turn a few degrees.
     The statement's lean away from it; the welcome's lean towards it, slower,
     from their baseline (css/site.css), over a wider reach. */
  var AWAY = { k: 9, reach: 1.15, min: 150, amp: 0.045, deg: 3, dir: 1 };
  var TOWARD = { k: 6, reach: 2.4, min: 320, amp: 0.02, deg: 5, dir: -1 };
  function lean(list, o, dt) {
    var k = 1 - Math.exp(-o.k * dt), moving = false;
    var stageTop = Math.min(0, heroTop + heroH - H - (window.pageYOffset || 0));
    var px = cursor.x, py = cursor.y - stageTop;
    for (var i = 0; i < list.length; i++) {
      var L = list[i], tx = 0, ty = 0, tr = 0;
      if (cursor.on) {
        var dx = L.cx - px, dy = L.cy - py, d = Math.sqrt(dx * dx + dy * dy) || 1, R = Math.max(o.min, L.fs * o.reach);
        if (d < R) {
          var f = 1 - d / R; f *= f; var amp = L.fs * o.amp * f;
          tx = o.dir * dx / d * amp; ty = o.dir * dy / d * amp; tr = o.dir * dx / d * o.deg * f;
        }
      }
      L.x += (tx - L.x) * k; L.y += (ty - L.y) * k; L.r += (tr - L.r) * k;
      if (Math.abs(tx - L.x) + Math.abs(ty - L.y) + Math.abs(tr - L.r) > 0.02) moving = true;
      else { L.x = tx; L.y = ty; L.r = tr; }
      css(L.el, 'transform', 'translate(' + L.x.toFixed(2) + 'px,' + L.y.toFixed(2) + 'px) rotate(' + L.r.toFixed(2) + 'deg)');
    }
    return moving;
  }

  /* the statement for this frame; returns true while letters are still moving */
  function statementFrame(P, dt) {
    if (!st) return false;
    var on = P.lines[0] > 0.001;
    css(st, 'visibility', on ? 'visible' : 'hidden');
    css(st, 'opacity', on ? '1' : '0');
    for (var i = 0; i < lines.length; i++) {
      var q = P.lines[i];
      css(lines[i], 'opacity', cl(q * 1.5).toFixed(3));
      css(words[i], 'transform', REDUCE ? 'none' : 'translate3d(0,' + ((1 - q) * 110).toFixed(2) + '%,0)');
    }
    css(foot, 'opacity', P.foot.toFixed(3));
    css(foot, 'transform', REDUCE ? 'none' : 'translate3d(0,' + ((1 - P.foot) * 14).toFixed(1) + 'px,0)');
    css(explore, 'visibility', on && P.foot > 0.02 ? 'visible' : 'hidden'); /* not focusable until it shows */
    if (path && pathLen) {
      /* with reduced motion the line is simply there, fading in with the words */
      var dr = REDUCE ? (on ? 1 : 0) : P.draw;
      css(svg, 'visibility', on && dr > 0.0005 ? 'visible' : 'hidden');
      if (REDUCE) css(svg, 'opacity', cl(P.lines[0] * 1.5).toFixed(3));
      css(path, 'strokeDashoffset', (pathLen * (1 - dr)).toFixed(1));
      var tipOn = !REDUCE && dr > 0.002 && dr < 0.998;
      if (tipOn) {
        var q2 = path.getPointAtLength(pathLen * dr);
        css(tip, 'transform', 'translate(' + (q2.x + 10).toFixed(1) + 'px,' + (q2.y + 10).toFixed(1) + 'px)');
      }
      css(tip, 'opacity', tipOn ? cl(Math.min(dr, 1 - dr) * 30).toFixed(3) : '0');
    }
    return CURSOR && on && letters.length ? lean(letters, AWAY, dt) : false;
  }

  /* ---------------- the welcome ----------------
     The first screen after the intro (css/site.css has the layout and the
     entrance). Here: its stars, the cursor depth on desktop, and the exit as
     you scroll. */
  var wImg = welcome && welcome.querySelector('.wl-pic img');
  var wScene = welcome && welcome.querySelector('.wl-scene');
  var wStars = welcome && welcome.querySelector('.wl-stars');
  var wLayers = welcome ? Array.prototype.slice.call(welcome.querySelectorAll('.wl-layer')) : [];
  var wRows = welcome ? ['.wl-kicker', '.wl-title', '.wl-sub', '.wl-cue'].map(function (s) { return welcome.querySelector(s); }) : [];
  var wTitle = wRows[1], wTitleIn = wTitle && wTitle.querySelector('.wl-in');
  var wLetters = [], wOff = false, wd = { x: 0, y: 0 };
  var DEPTH = [1.9, 3.1]; /* how far each star layer moves against the cursor, against the picture's 1 */
  if (welcome) welcome.classList.add('wl-wait'); /* the words wait for Bodoni Moda (see whenFontsReady) */

  /* Fine stars, drawn once per screen size: many faint far ones, fewer and
     brighter near ones. They thin out above the horizon and none sit over
     the planet, so none reach the bottom-right corner either. */
  function drawStars() {
    wLayers.forEach(function (layer, li) {
      var cv = layer.querySelector('canvas');
      var lw = layer.offsetWidth, lh = layer.offsetHeight;
      if (!cv || !lw || !lh) return;
      var s = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4e6 / (lw * lh))); /* at most 4M pixels a layer */
      cv.width = Math.round(lw * s); cv.height = Math.round(lh * s);
      var g = cv.getContext('2d');
      g.setTransform(s, 0, 0, s, 0, 0);
      g.clearRect(0, 0, lw, lh);
      var near = li === 1, top = (lh - H) / 2;
      var n = Math.round(lw * lh / (near ? 9000 : 1900));
      var tints = ['255,255,255', '220,214,255', '206,222,255'];
      for (var i = 0; i < n; i++) {
        var x = Math.random() * lw, y = Math.random() * lh;
        var fade = 1 - sm(0.5, 0.78, (y - top) / H);
        if (fade < 0.01) continue;
        var r = near ? 0.5 + Math.random() * 0.55 : 0.3 + Math.random() * 0.35;
        var a = (near ? 0.45 + Math.random() * 0.5 : 0.15 + Math.random() * 0.45) * fade;
        var c = tints[(Math.random() * 3) | 0];
        if (near && Math.random() < 0.12) { /* a soft halo round a few of the near ones */
          var halo = g.createRadialGradient(x, y, 0, x, y, r * 5);
          halo.addColorStop(0, 'rgba(' + c + ',' + (a * 0.32).toFixed(3) + ')');
          halo.addColorStop(1, 'rgba(' + c + ',0)');
          g.fillStyle = halo;
          g.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
        }
        g.fillStyle = 'rgba(' + c + ',' + a.toFixed(3) + ')';
        g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
      }
    });
  }

  /* desktop: "Webessy" gets a span per letter, so the letters can lean */
  function splitWelcome() {
    if (!wTitleIn || wLetters.length) return;
    var sr = document.createElement('span');
    sr.className = 'rv-sr';
    sr.textContent = wTitleIn.textContent.trim();
    wTitle.insertBefore(sr, wTitleIn);
    wTitleIn.setAttribute('aria-hidden', 'true');
    splitChars(wTitleIn, 'wl-ch', wLetters);
  }
  /* where each letter sits on the stage, from the layout (offsets ignore the
     entrance and exit transforms, so this works at any moment) */
  function measureWelcome() {
    for (var i = 0; i < wLetters.length; i++) {
      var L = wLetters[i], x = L.el.offsetWidth / 2, y = L.el.offsetHeight / 2, n = L.el;
      while (n && n !== stage) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      L.cx = x; L.cy = y;
      L.fs = parseFloat(getComputedStyle(L.el).fontSize) || L.fs;
    }
  }

  /* the welcome for this frame; returns true while something is still settling */
  function welcomeFrame(P, dt, visible) {
    if (!welcome) return false;
    var off = !visible || P.wPic > 0.999;
    css(welcome, 'visibility', off ? 'hidden' : 'visible');
    if (off !== wOff) { wOff = off; welcome.classList.toggle('wl-off', off); } /* pauses its CSS animations */
    if (off) return false;
    /* the words rise and fade, the earlier lines first */
    for (var i = 0; i < wRows.length; i++) {
      var q = P.wRows[i];
      css(wRows[i], 'opacity', (1 - q).toFixed(3));
      css(wRows[i], 'transform', REDUCE ? 'none' : 'translate3d(0,' + (-q * H * 0.09).toFixed(1) + 'px,0)');
    }
    /* the picture and its stars dissolve into frame 1, pushing in a little */
    var o = (1 - P.wPic).toFixed(3);
    css(wImg, 'opacity', o);
    css(wStars, 'opacity', o);
    css(wScene, 'transform', REDUCE ? 'none' : 'scale(' + (1 + 0.06 * P.wPush).toFixed(4) + ')');
    if (!CURSOR) return false;
    /* desktop: the picture drifts against the cursor, the stars further, and
       the letters lean towards it */
    var tx = 0, ty = 0;
    if (cursor.on) { tx = cl(cursor.x / W) * 2 - 1; ty = cl(cursor.y / H) * 2 - 1; }
    var k = 1 - Math.exp(-2.4 * dt), moving = false;
    wd.x += (tx - wd.x) * k; wd.y += (ty - wd.y) * k;
    if (Math.abs(tx - wd.x) + Math.abs(ty - wd.y) > 0.0008) moving = true;
    else { wd.x = tx; wd.y = ty; }
    var ax = -wd.x * W * 0.012, ay = -wd.y * H * 0.012;
    css(wImg, 'transform', 'translate3d(' + ax.toFixed(2) + 'px,' + ay.toFixed(2) + 'px,0)');
    for (var j = 0; j < wLayers.length; j++) {
      css(wLayers[j], 'transform', 'translate3d(' + (ax * DEPTH[j]).toFixed(2) + 'px,' + (ay * DEPTH[j]).toFixed(2) + 'px,0)');
    }
    if (wLetters.length && lean(wLetters, TOWARD, dt)) moving = true;
    return moving;
  }

  if (CURSOR) {
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      cursor.on = true; cursor.x = e.clientX; cursor.y = e.clientY; wake();
    }, { passive: true });
    document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) { cursor.on = false; wake(); } });
  }

  /* Explore: the link goes to #work as it is; this only makes that scroll smooth */
  if (explore) explore.addEventListener('click', function (e) {
    if (REDUCE || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var root = document.documentElement, done = false;
    function off() { if (done) return; done = true; root.classList.remove('smooth-scroll'); window.removeEventListener('scrollend', off); }
    root.classList.add('smooth-scroll');
    window.addEventListener('scrollend', off);
    setTimeout(off, 1500);
  });

  /* the fill-the-width sizes, the kerning and the line all need the real font */
  function whenFontsReady(fn) {
    if (!document.fonts || !document.fonts.load) { fn(); return; }
    document.fonts.load('400 100px "Bodoni Moda"').then(function () { return document.fonts.ready; }).then(fn, fn);
  }
  /* the welcome's words rise in with the real font, or after 1.5 s without it */
  function welcomeGo() { if (welcome) welcome.classList.remove('wl-wait'); }
  setTimeout(welcomeGo, 1500);
  whenFontsReady(function () {
    stReady = true;
    if (CURSOR) { splitLetters(); splitWelcome(); }
    measureStatement();
    measureWelcome();
    welcomeGo();
    wake();
  });

  /* ---------------- main loop ----------------
     Runs only while something is changing: scrolling, frames arriving, letters
     settling, the welcome following the cursor, or (desktop) the 0400's idle
     sway. At rest a phone does nothing (the welcome's drift is CSS). */
  var raf = 0, last = 0, resting = true, lastWant = 0, draws = 0, renders = 0, hudLast = '';
  function wake() { if (!raf) raf = requestAnimationFrame(tick); }

  function drawScene(P, want, dt) {
    if (!fw || !map1) return;
    /* the frame canvas: redrawn only when the frame changes */
    var fi = pick(want);
    if (fi >= 0 && (frameDirty || fi !== shown)) {
      fctx.setTransform(1, 0, 0, 1, 0, 0);
      fctx.fillStyle = '#05060F'; fctx.fillRect(0, 0, fcv.width, fcv.height);
      fctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      fctx.drawImage(store[fi].src, map1.dx, map1.dy, fw * map1.c, fh * map1.c);
      shown = fi; frameDirty = false; draws++;
    }
    /* the push-in: a GPU transform of the canvas around the logo point */
    var z = P.zoom;
    css(fcv, 'transform', 'translate(' + (F.x * (1 - z)).toFixed(2) + 'px,' + (F.y * (1 - z)).toFixed(2) + 'px) scale(' + z.toFixed(5) + ')');
    var map = computeMap(z);
    /* glass pane: a frosted plate floating in the window, behind the logo */
    var pw = map.innerW() * 0.92, ph = pw * 0.50, pc = map.pt((set.win.x0 + set.win.x1) / 2, set.logoY);
    var paneOp = P.pane * (1 - 0.9 * P.back);
    css(pane, 'width', pw.toFixed(1) + 'px'); css(pane, 'height', ph.toFixed(1) + 'px');
    css(pane, 'transform', 'translate(' + (pc.x - pw / 2).toFixed(1) + 'px,' + (pc.y - ph / 2).toFixed(1) + 'px)');
    css(pane, 'borderRadius', (pw * 0.10).toFixed(1) + 'px');
    css(pane, 'opacity', paneOp.toFixed(3));
    css(pane, 'visibility', paneOp > 0.001 ? 'visible' : 'hidden'); /* hidden = no blur to compute */
    /* the room dims, then the 0400 steps back */
    css(dim, 'opacity', P.dim.toFixed(3));
    css(mark, 'transform', REDUCE ? 'none' : 'scale(' + (1 - 0.2 * P.back).toFixed(4) + ')');
    if (chrome && P.chromeIn > 0.001) {
      css(gcv, 'opacity', (P.chromeIn * (1 - 0.9 * P.back)).toFixed(3));
      if (chrome.render(P, map, dt)) renders++;
    } else css(gcv, 'opacity', '0');
  }

  function tick(now) {
    raf = 0;
    var dt = resting ? 1 / 60 : Math.min(0.05, Math.max(0.001, (now - last) / 1000)); /* after a rest, count from one frame */
    last = now; resting = false;
    pS += (pT - pS) * (1 - Math.exp(-7 * dt));
    if (Math.abs(pT - pS) < 0.0003) pS = pT;
    var again = pS !== pT;
    var visible = (window.pageYOffset || 0) - heroTop < heroH;
    try {
      var P = params(pS);
      /* the frames chase the scroll, but never faster than 120 a second, so a
         hard flick plays through the footage instead of skipping frames */
      var step = 120 * dt, d = P.frame - fS;
      if (Math.abs(d) <= step) fS = P.frame; else { fS += d > 0 ? step : -step; again = true; }
      var want = Math.round(fS);
      if (want !== lastWant) { dir = want > lastWant ? 1 : -1; lastWant = want; }
      if (set) schedule(want, visible);
      if (welcomeFrame(P, dt, visible)) again = true;
      if (visible) {
        drawScene(P, want, dt);
        if (statementFrame(P, dt)) again = true;
        if (chrome && !LITE && P.chromeIn > 0.001) again = true; /* desktop: the 0400's idle sway */
      }
      if (DEBUG && hud) {
        var dec = 0;
        for (var k = 0; k < store.length; k++) if (store[k].src) dec++;
        var s = Math.round(pS * 100) + '% · ' + phaseName(pS) + ' · ' + (set ? set.name : '') + ' ' + loadedCount + '/80 loaded · ' +
          dec + ' decoded (' + (store[0] && store[0].blob ? 'bitmaps' : 'images') + ') · ' + draws + ' draws · ' + renders + ' 3D' + (LITE ? ' · lite' : '');
        if (s !== hudLast) { hud.textContent = s; hudLast = s; }
      }
    } catch (err) {
      console.error('[hero] ' + err.message);
    }
    if (again) wake(); else resting = true;
  }

  window.addEventListener('scroll', function () { lastScroll = performance.now(); readScroll(); wake(); }, { passive: true });
  window.addEventListener('resize', layout);
  document.addEventListener('intro:done', function () { measureSpan(); readScroll(); wake(); });
  layout();
  pS = pT; fS = params(pS).frame; lastWant = Math.round(fS);
  wake();
})();
