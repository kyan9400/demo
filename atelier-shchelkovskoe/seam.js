/* Photo-real hero: a real workshop photo (Yandex Maps card) in 3D, with a before/after swatch floating
   in front of it. Drag the thread (or use the arrow keys) to compare; the thread takes the colour picked
   on the spool shelf (CSS var --thread). Transform-only: the "before" layer is a clipping wrapper that
   slides one way while the image inside slides back. Pointer tilts the scene, scroll pushes the photo in. */
(function () {
  var phx = document.getElementById('phx');
  if (!phx) return;
  var main = phx.querySelector('.phx-main'), ba = document.getElementById('ba');
  var view = document.getElementById('baView'), B = document.getElementById('baB'), Bin = document.getElementById('baBin');
  var H = document.getElementById('baH'), R = document.getElementById('baR');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, val = 50, shown = 50, touched = false, visible = true;

  function paint(v) {
    var x = W * v / 100;
    B.style.transform = 'translateX(' + (x - W) + 'px)';
    Bin.style.transform = 'translateX(' + (W - x) + 'px)';
    H.style.transform = 'translateX(' + x + 'px)';
  }
  function measure() { W = view.clientWidth; paint(shown); }
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(view); measure();

  R.addEventListener('input', function () { touched = true; val = +R.value; });

  // pointer tilt (mouse only) + scroll depth
  var px = 0, py = 0, tx = 0, ty = 0, sp = 0;
  if (!reduced && matchMedia('(hover: hover)').matches) {
    phx.addEventListener('pointermove', function (e) { var r = phx.getBoundingClientRect(); px = (e.clientX - r.left) / r.width - .5; py = (e.clientY - r.top) / r.height - .5; });
    phx.addEventListener('pointerleave', function () { px = 0; py = 0; });
  }
  function onScroll() { var r = phx.getBoundingClientRect(); sp = Math.min(1, Math.max(0, -r.top / (r.height * .9))); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(phx);

  var t0 = performance.now();
  function tick(now) {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    if (!touched && !reduced) {
      // a slow "stitching" sweep until the visitor grabs the thread
      var t = (now - t0) / 1000;
      val = 50 + Math.sin(t * 0.9) * 32 * Math.min(1, t / 1.2);
      R.value = Math.round(val);
    }
    shown += (val - shown) * (touched ? .35 : 1);
    paint(shown);
    if (reduced) return;
    tx += (px - tx) * .07; ty += (py - ty) * .07;
    main.style.setProperty('--ry', (tx * 10).toFixed(2) + 'deg');
    main.style.setProperty('--rx', (-ty * 7 + sp * 6).toFixed(2) + 'deg');
    main.style.setProperty('--gx', (30 + tx * 80).toFixed(1) + '%');
    main.style.setProperty('--sp', sp.toFixed(3));
    ba.style.setProperty('--bx', (tx * 26).toFixed(1) + 'px');
    ba.style.setProperty('--by', (ty * 18 - sp * 40).toFixed(1) + 'px');
    ba.style.setProperty('--bry', (-6 + tx * 14).toFixed(2) + 'deg');
    ba.style.setProperty('--brx', (2 - ty * 10).toFixed(2) + 'deg');
  }
  requestAnimationFrame(tick);
})();

/* the real place: subtle pointer tilt on the storefront photo */
(function () {
  var f = document.querySelector('.in-photo');
  if (!f || matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover: hover)').matches) return;
  f.addEventListener('pointermove', function (e) { var r = f.getBoundingClientRect(); f.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 10 + 'deg'); f.style.setProperty('--rx', (.5 - (e.clientY - r.top) / r.height) * 8 + 'deg'); });
  f.addEventListener('pointerleave', function () { f.style.setProperty('--ry', '0deg'); f.style.setProperty('--rx', '0deg'); });
})();
