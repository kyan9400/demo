/* Photo-real hero: real photos from МобиДик's Yandex Maps card floating at different depths
   in the deep-blue hero. Each layer moves at its own speed with pointer, drag/swipe, device tilt
   and scroll; layers bob gently like the whale used to. transform only, paused off-screen. */
(function () {
  var box = document.getElementById('depth');
  if (!box) return;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var layers = [].slice.call(box.querySelectorAll('.dl')).map(function (el, i) {
    return { el: el, f: parseFloat(el.getAttribute('data-f')) || 1, ph: i * 1.7 };
  });
  if (!reduced) for (var b = 0; b < 6; b++) {
    var s = document.createElement('span'); s.className = 'bubl';
    s.style.left = (8 + b * 16 + (b % 2) * 5) + '%'; s.style.animationDelay = (b * 1.15) + 's';
    s.style.width = s.style.height = (5 + (b * 3) % 8) + 'px'; box.appendChild(s);
  }
  if (reduced) return;
  var tx = 0, ty = 0, cx = 0, cy = 0, drag = false, sx = 0, sy = 0, scrollY0 = 0, visible = true, t0 = performance.now();
  box.addEventListener('pointermove', function (e) {
    var r = box.getBoundingClientRect();
    if (drag) { tx = Math.max(-1, Math.min(1, (e.clientX - sx) / (r.width * 0.4))); ty = Math.max(-1, Math.min(1, (e.clientY - sy) / (r.height * 0.6))); return; }
    if (e.pointerType === 'mouse') { tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2; }
  });
  box.addEventListener('pointerdown', function (e) { drag = true; sx = e.clientX; sy = e.clientY; box.classList.add('grab'); try { box.setPointerCapture(e.pointerId); } catch (_) {} });
  function end() { drag = false; tx = ty = 0; box.classList.remove('grab'); }
  box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
  box.addEventListener('pointerleave', function () { if (!drag) tx = ty = 0; });
  addEventListener('deviceorientation', function (e) {
    if (drag || e.gamma == null) return;
    tx = Math.max(-1, Math.min(1, e.gamma / 25)); ty = Math.max(-1, Math.min(1, ((e.beta || 45) - 45) / 25));
  }, { passive: true });
  addEventListener('scroll', function () { scrollY0 = pageYOffset; }, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(box);
  function tick(now) {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
    var t = (now - t0) / 1000, sc = Math.min(scrollY0, 900);
    layers.forEach(function (L) {
      var bob = Math.sin(t * 0.8 + L.ph) * 5 * L.f;
      var x = cx * 22 * L.f, y = cy * 14 * L.f + bob - sc * 0.12 * (L.f - 0.3);
      L.el.style.setProperty('--x', x.toFixed(1) + 'px');
      L.el.style.setProperty('--y', y.toFixed(1) + 'px');
      L.el.style.setProperty('--s', (1 + Math.min(sc, 500) / 500 * 0.06 * L.f).toFixed(3));
    });
  }
  requestAnimationFrame(tick);
})();
(function () {
  var f = document.querySelector('.pl-photo');
  if (!f || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  f.addEventListener('pointermove', function (e) { var r = f.getBoundingClientRect(); f.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 8 + 'deg'); f.style.setProperty('--rx', (0.5 - (e.clientY - r.top) / r.height) * 6 + 'deg'); });
  f.addEventListener('pointerleave', function () { f.style.setProperty('--ry', '0deg'); f.style.setProperty('--rx', '0deg'); });
})();
