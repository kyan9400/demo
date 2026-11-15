/* Photo-real hero: a depth collage of Lady Black's real photos (from the Yandex Maps card).
   Three prints at different depths drift apart with the pointer / phone tilt and slide at
   different speeds as you scroll (parallax). Tap / click a print to bring it to the front.
   Transform only, pauses off-screen, static under prefers-reduced-motion. */
(function () {
  var box = document.getElementById('depth');
  if (!box) return;
  var layers = [].slice.call(box.querySelectorAll('.layer'));
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var BASE = [[0, 0, 2.5], [0, 0, -5], [0, 0, -3]]; // resting x, y, rotation per layer
  var tx = 0, ty = 0, cx = 0, cy = 0, scrollP = 0, visible = true, top = 3;

  // tap a print -> it comes to the front (works with reduced motion too)
  layers.forEach(function (l) {
    l.style.cursor = 'pointer';
    l.addEventListener('click', function () { top += 1; l.style.zIndex = top; });
  });

  function apply() {
    layers.forEach(function (l, i) {
      var d = parseFloat(l.dataset.d) || 0.5, b = BASE[i] || [0, 0, 0];
      var x = b[0] + cx * 18 * d, y = b[1] + cy * 14 * d - scrollP * 90 * (d - 0.3);
      var r = b[2] * (1 + scrollP * 0.8) + cx * 2 * d;
      l.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + (d * 40).toFixed(0) + 'px) rotate(' + r.toFixed(2) + 'deg)';
    });
  }
  apply();
  if (reduced) return;

  box.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var r = box.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  box.addEventListener('pointerleave', function () { tx = 0; ty = 0; });
  addEventListener('deviceorientation', function (e) {
    if (e.gamma == null) return;
    tx = Math.max(-1, Math.min(1, e.gamma / 25)); ty = Math.max(-1, Math.min(1, ((e.beta || 45) - 45) / 30));
  }, { passive: true });

  function onScroll() { var r = box.getBoundingClientRect(); scrollP = Math.min(1, Math.max(0, (innerHeight * 0.3 - r.top) / r.height)); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(box);

  var t0 = performance.now(), lastS = -1;
  function tick(now) {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    // gentle idle breathing so the prints feel alive even without a mouse
    var idle = Math.sin((now - t0) / 2600) * 0.25;
    var nx = cx + ((tx || idle) - cx) * 0.08, ny = cy + ((ty || idle * 0.6) - cy) * 0.08;
    if (Math.abs(nx - cx) > 0.0005 || Math.abs(ny - cy) > 0.0005 || scrollP !== lastS) { cx = nx; cy = ny; lastS = scrollP; apply(); }
  }
  requestAnimationFrame(tick);
})();

/* studio photo: subtle pointer tilt */
(function () {
  var f = document.querySelector('.st-photo');
  if (!f || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  f.addEventListener('pointermove', function (e) {
    var r = f.getBoundingClientRect();
    f.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 10 + 'deg');
    f.style.setProperty('--rx', (0.5 - (e.clientY - r.top) / r.height) * 8 + 'deg');
  });
  f.addEventListener('pointerleave', function () { f.style.setProperty('--ry', '0deg'); f.style.setProperty('--rx', '0deg'); });
})();
