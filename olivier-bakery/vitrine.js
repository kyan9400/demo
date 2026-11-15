/* Photo-real hero for Olivier Bakery: the powder arch becomes a shop window. Inside it the bakery's real cakes
   (photos from its Yandex Maps card) slowly cross-fade with a soft push-in; three round "medallions" with
   slices and mini desserts float in front at different depths and drift with pointer / phone tilt / scroll.
   Tap or swipe the window for the next cake. Transform/opacity only, pauses off-screen, static with
   prefers-reduced-motion. */
(function () {
  var stage = document.getElementById('hstage');
  if (!stage) return;
  var win = stage.querySelector('.awin');
  var slides = [].slice.call(stage.querySelectorAll('.aslide'));
  var dots = [].slice.call(stage.querySelectorAll('.adots i'));
  var layers = [].slice.call(stage.querySelectorAll('[data-depth]'));
  var cap = document.getElementById('archCap');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var N = slides.length, cur = -1, pend = -1, visible = true, timer = 0;

  // switch only once the next photo is ready, so the window never shows an empty frame
  function go(i) {
    i = (i + N) % N; if (i === cur) return;
    var im = slides[i].querySelector('img');
    if (cur >= 0 && !(im.complete && im.naturalWidth)) { im.loading = 'eager'; pend = i; im.addEventListener('load', function () { if (pend === i) show(i); }, { once: true }); return; }
    pend = -1; show(i);
  }
  function show(i) {
    if (i === cur) return; cur = i;
    slides.forEach(function (s, k) {
      s.classList.toggle('on', k === i);
      if (k === (i + 1) % N) { var im = s.querySelector('img'); if (im.loading === 'lazy') im.loading = 'eager'; }
    });
    dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    if (cap) cap.textContent = slides[i].getAttribute('data-cap');
  }
  function schedule() {
    clearTimeout(timer); if (reduced) return;
    timer = setTimeout(function () { if (visible && !document.hidden) go(cur + 1); schedule(); }, 4800);
  }

  // tap / swipe the window
  var sx = 0, sy = 0, down = false;
  win.addEventListener('pointerdown', function (e) { down = true; sx = e.clientX; sy = e.clientY; });
  win.addEventListener('pointerup', function (e) {
    if (!down) return; down = false;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(cur + (dx < 0 ? 1 : -1));
    else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) go(cur + 1);
    schedule();
  });
  win.addEventListener('pointercancel', function () { down = false; });
  win.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(cur + 1); schedule(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); schedule(); }
  });

  if (!reduced) {
    // depth parallax: pointer (desktop), device tilt (phones that allow it) and scroll
    var tx = 0, ty = 0, gx = 0, gy = 0, sp = 0, raf = 0;
    function apply() {
      raf = 0;
      layers.forEach(function (l) {
        var d = parseFloat(l.getAttribute('data-depth'));
        l.style.transform = 'translate3d(' + ((tx + gx) * d * 26).toFixed(1) + 'px,' + ((ty + gy) * d * 20 - sp * d * 90).toFixed(1) + 'px,0)';
      });
      win.style.setProperty('--sx', (-(tx + gx) * 30 + 50).toFixed(1) + '%');
      stage.style.setProperty('--zoom', (1 + sp * 0.12).toFixed(4));
    }
    function req() { if (!raf) raf = requestAnimationFrame(apply); }
    stage.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = stage.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5; req();
    });
    stage.addEventListener('pointerleave', function () { tx = ty = 0; req(); });
    addEventListener('deviceorientation', function (e) {
      if (e.gamma == null || (!e.gamma && !e.beta) || !visible) return;
      gx = Math.max(-1, Math.min(1, e.gamma / 30)) * 0.5; gy = Math.max(-1, Math.min(1, (e.beta - 45) / 30)) * 0.5; req();
    });
    function onScroll() {
      var r = stage.getBoundingClientRect();
      if (r.bottom < -200) return; // far below the hero: nothing to move
      sp = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height))); req();
    }
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(stage);
  stage.classList.add('live');
  go(0); schedule();
})();
