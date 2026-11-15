/* Photo-real hero: real photos of the ateliér's work (from the Yandex Maps card) float inside
   big soap bubbles behind the clickable service bubbles. Each photo-bubble sits at its own depth:
   it bobs gently, drifts against the pointer / phone tilt and rises at its own speed as you scroll.
   Transform only, pauses off-screen, static under prefers-reduced-motion. */
(function () {
  var box = document.getElementById('pbubs'), field = document.getElementById('field');
  if (!box || !field) return;
  var bubs = [].slice.call(box.querySelectorAll('.pbub'));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var tx = 0, ty = 0, cx = 0, cy = 0, scrollP = 0, visible = true, t0 = performance.now();

  field.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var r = field.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  field.addEventListener('pointerleave', function () { tx = 0; ty = 0; });
  addEventListener('deviceorientation', function (e) {
    if (e.gamma == null) return;
    tx = Math.max(-1, Math.min(1, e.gamma / 25)); ty = Math.max(-1, Math.min(1, ((e.beta || 45) - 45) / 30));
  }, { passive: true });

  function onScroll() { var r = field.getBoundingClientRect(); scrollP = Math.min(1, Math.max(0, -r.top / r.height)); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(field);

  function tick(now) {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
    var t = (now - t0) / 1000;
    bubs.forEach(function (b, i) {
      var d = parseFloat(b.dataset.d) || 0.6;
      var x = Math.sin(t * 0.5 + i * 2.1) * 7 - cx * 22 * d;
      var y = Math.cos(t * 0.42 + i * 1.3) * 9 - cy * 16 * d - scrollP * 120 * d;
      var s = 1 + Math.sin(t * 0.7 + i) * 0.015 + scrollP * 0.08 * d;
      b.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + s.toFixed(4) + ')';
    });
  }
  requestAnimationFrame(tick);
})();

/* place photo: subtle pointer tilt */
(function () {
  var f = document.querySelector('.pl-photo');
  if (!f || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  f.addEventListener('pointermove', function (e) {
    var r = f.getBoundingClientRect();
    f.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 10 + 'deg');
    f.style.setProperty('--rx', (0.5 - (e.clientY - r.top) / r.height) * 8 + 'deg');
  });
  f.addEventListener('pointerleave', function () { f.style.setProperty('--ry', '0deg'); f.style.setProperty('--rx', '0deg'); });
})();
