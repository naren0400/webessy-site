/* ==========================================================================
   SECTIONS — motion for 02 to 06 and the sticky WhatsApp button.
   The intro, hero and nav live in their own files and are not touched here.
   Only transform and opacity are animated. With reduced motion nothing moves:
   every element is simply visible.
   ========================================================================== */
(function () {
  'use strict';

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

  if (reduce || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------------- text reveal (all sections) ----------------
     16px rise and fade, once, as the element comes into view.
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

  /* Positions are measured while the intro still locks the page, and fonts
     change line heights when they arrive, so measure again at both moments. */
  document.addEventListener('intro:done', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
