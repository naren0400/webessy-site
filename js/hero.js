/* ==========================================================================
   HERO — Veo frames scrubbed by scroll, then the chrome 0400 inside the window
   Scroll map (p = 0 at the top of the hero, 1 at the end of it):
     0.00 - 0.62  frames 1 → 80 (pull back from the light to the portal)
     0.54 - 0.74  chrome 0400 revealed by light, glass pane frosts behind it
     0.60 - 0.78  slow push in towards the window
     0.86 - 0.94  headline card rises
   ========================================================================== */
(function () {
  'use strict';

  var DEBUG = false; /* shows the scroll readout bottom-left. Set false before launch. */

  var $ = function (id) { return document.getElementById(id); };
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function sm(a, b, x) { var t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  var D2R = Math.PI / 180;

  var hero = $('hero'), fcv = $('frames'), gcv = $('chrome'), pane = $('glassPane'),
      card = $('headline'), hint = $('scrollHint'), hud = $('hud');
  if (!hero || !fcv) { console.error('[hero] page structure missing'); return; }
  var fctx = fcv.getContext('2d');
  if (hud) hud.style.display = DEBUG ? '' : 'none';

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

  /* ---------------- frames ---------------- */
  var FRAME_COUNT = 80;
  var SETS = {
    desktop: { name: 'desktop', dir: 'frames/desktop/', win: { x0: .371, x1: .624, y0: .051, y1: .853 }, logoY: .42 },
    mobile:  { name: 'mobile',  dir: 'frames/mobile/',  win: { x0: .221, x1: .764, y0: .227, y1: .790 }, logoY: .48 }
  };
  var set = null, imgs = [], ok = [], okCount = 0, fw = 0, fh = 0;

  function pickSet() { return window.innerHeight > window.innerWidth ? SETS.mobile : SETS.desktop; }
  function pad(n) { return ('00' + n).slice(-3); }

  function loadFrames() {
    set = pickSet(); imgs = []; ok = []; okCount = 0;
    var queue = []; for (var i = 0; i < FRAME_COUNT; i++) queue.push(i);
    var active = 0, MAX = 6, mySet = set;
    function next() {
      while (active < MAX && queue.length) (function (i) {
        active++;
        var im = new Image();
        im.decoding = 'async';
        im.onload = function () {
          if (mySet !== set) return;
          ok[i] = true; okCount++; active--;
          if (!fw) { fw = im.naturalWidth; fh = im.naturalHeight; }
          dirty = true; next();
        };
        im.onerror = function () { active--; console.warn('[hero] frame failed to load: ' + (i + 1)); next(); };
        im.src = mySet.dir + 'frame_' + pad(i + 1) + '.webp';
        imgs[i] = im;
      })(queue.shift());
    }
    fw = 0; fh = 0; next();
  }
  function bestFrame(i) {
    for (var d = 0; d < FRAME_COUNT; d++) {
      if (i - d >= 0 && ok[i - d]) return i - d;
      if (i + d < FRAME_COUNT && ok[i + d]) return i + d;
    }
    return -1;
  }

  /* ---------------- layout ---------------- */
  var W = 1, H = 1, DPR = 1, dirty = true, map = null;
  function layout() {
    W = Math.max(1, window.innerWidth); H = Math.max(1, window.innerHeight);
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    fcv.width = Math.round(W * DPR); fcv.height = Math.round(H * DPR);
    if (pickSet() !== set) loadFrames();
    if (chrome) chrome.resize();
    dirty = true; readScroll();
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

  /* ---------------- scroll → scene ---------------- */
  function params(p) {
    return {
      frame: Math.round(cl(p / 0.62) * (FRAME_COUNT - 1)),
      zoom: 1 + 0.15 * sm(0.60, 0.78, p),
      chromeIn: sm(0.54, 0.60, p),
      env: 0.02 + 0.98 * sm(0.54, 0.70, p),
      sweep: 40 * D2R * (1 - sm(0.54, 0.74, p)),
      yaw: lerp(-20, -8, sm(0.56, 0.74, p)) * D2R,
      pitch: lerp(6, -3, sm(0.56, 0.74, p)) * D2R,
      pane: sm(0.55, 0.65, p),
      card: sm(0.86, 0.94, p),
      hint: 1 - sm(0.005, 0.03, p)
    };
  }
  function phaseName(p) {
    if (p < 0.62) return 'frames ' + (Math.round(cl(p / 0.62) * 79) + 1) + ' / 80';
    if (p < 0.74) return '0400 revealed by light';
    if (p < 0.86) return 'hero frame';
    return 'headline';
  }

  var pT = 0, pS = 0;
  function readScroll() {
    var span = hero.offsetHeight - window.innerHeight;
    pT = span > 0 ? cl(-hero.getBoundingClientRect().top / span) : 0;
  }

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
  function startChrome() {
    if (chrome || !gcv) return;
    loadScript('js/three.min.js')
      .then(function () { return loadScript('js/logo3d.js'); })
      .then(function () { chrome = makeChrome(); chrome.resize(); dirty = true; })
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

    var mobile = window.innerWidth < 760;
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
    }
    buildEnv(null);
    var img = new Image();
    img.onload = function () {
      var tx = new THREE.Texture(img); tx.colorSpace = THREE.SRGBColorSpace; tx.needsUpdate = true;
      try { buildEnv(tx); } catch (e) { console.warn('[hero] frame reflections skipped: ' + e.message); }
    };
    img.src = window.LOGO_ENV_FRAME;

    var rig = new THREE.Group(), pivot = new THREE.Group();
    var camera = new THREE.PerspectiveCamera(28, 1, 0.1, 500);
    rig.add(camera); pivot.add(built.group); rig.add(pivot); scene.add(rig);

    var tmx = 0, tmy = 0, mx = 0, my = 0, t = 0;
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      tmx = (e.clientX / window.innerWidth - 0.5) * 2; tmy = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    return {
      resize: function () {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.5 : 2));
        renderer.setSize(W, H, false);
        camera.aspect = W / H; camera.updateProjectionMatrix();
      },
      render: function (P, m, dt) {
        t += dt;
        mx += (tmx - mx) * Math.min(1, dt * 3); my += (tmy - my) * Math.min(1, dt * 3);
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
      }
    };
  }

  /* ---------------- main loop ---------------- */
  var last = performance.now(), lastFrame = -1, lastZoom = -1, hudLast = '', cardSide = null;
  function tick(now) {
    var dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000)); last = now;
    pS += (pT - pS) * Math.min(1, dt * 7);
    if (Math.abs(pT - pS) < 0.0003) pS = pT;
    var visible = hero.getBoundingClientRect().bottom > 0;
    try {
      if (visible) {
        var P = params(pS);
        map = computeMap(P.zoom);
        var fi = bestFrame(P.frame);
        if (map && fi >= 0 && (dirty || fi !== lastFrame || P.zoom !== lastZoom)) {
          fctx.setTransform(1, 0, 0, 1, 0, 0);
          fctx.fillStyle = '#05060F'; fctx.fillRect(0, 0, fcv.width, fcv.height);
          var z = P.zoom;
          fctx.setTransform(DPR * z, 0, 0, DPR * z, DPR * map.F.x * (1 - z), DPR * map.F.y * (1 - z));
          fctx.drawImage(imgs[fi], map.dx, map.dy, fw * map.c, fh * map.c);
          lastFrame = fi; lastZoom = z; dirty = false;
        }
        if (map) {
          /* glass pane: a frosted plate floating in the window, behind the logo */
          var iw = map.innerW(), c = map.pt((set.win.x0 + set.win.x1) / 2, set.logoY);
          var pw = iw * 0.92, ph = pw * 0.50;
          pane.style.width = pw + 'px'; pane.style.height = ph + 'px';
          pane.style.transform = 'translate(' + (c.x - pw / 2).toFixed(1) + 'px,' + (c.y - ph / 2).toFixed(1) + 'px)';
          pane.style.borderRadius = (pw * 0.10).toFixed(1) + 'px';
          pane.style.opacity = P.pane.toFixed(3);
        }
        if (chrome && map && P.chromeIn > 0.001) {
          gcv.style.opacity = P.chromeIn.toFixed(3);
          chrome.render(P, map, dt);
        } else if (gcv) gcv.style.opacity = '0';
        /* headline: beside the window on wide screens, below it on narrow ones */
        var side = false, left = 0, avail = 0, edge = null;
        if (map && W / H > 1.15) {
          edge = map.pt(set.win.x1, set.logoY);
          left = edge.x + W * 0.045; avail = W - left - W * 0.05;
          side = avail >= 300;
        }
        if (side !== cardSide) {
          card.classList.toggle('side', side); cardSide = side;
          card.style.bottom = side ? 'auto' : ''; card.style.width = side ? '' : '';
        }
        if (side) {
          card.style.left = left.toFixed(1) + 'px'; card.style.top = edge.y.toFixed(1) + 'px';
          card.style.width = Math.min(430, avail).toFixed(0) + 'px';
          card.style.transform = 'translate(' + (-(1 - P.card) * 26).toFixed(1) + 'px,-50%)';
        } else {
          card.style.left = '50%'; card.style.top = '';
          card.style.transform = 'translate(-50%,' + ((1 - P.card) * 24).toFixed(1) + 'px)';
        }
        card.style.opacity = P.card.toFixed(3);
        card.style.pointerEvents = P.card > 0.5 ? 'auto' : 'none';
        hint.style.opacity = (window.__introDone ? P.hint : 0).toFixed(3);
      }
      if (DEBUG && hud) {
        var s = Math.round(pS * 100) + '% · ' + phaseName(pS) + ' · ' + (set ? set.name : '') + ' ' + okCount + '/80 loaded';
        if (s !== hudLast) { hud.textContent = s; hudLast = s; }
      }
    } catch (err) {
      console.error('[hero] ' + err.message);
    }
    requestAnimationFrame(tick);
  }

  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('resize', layout);
  layout();
  pS = pT;
  requestAnimationFrame(tick);
})();
