/* Photo-real hero for «Пекарня на Авиамоторной»: the bakery's real photos (Yandex Maps card)
   peek out of a kraft paper bag, layered in depth. On load they rise out of the bag; scrolling
   lifts them further at different speeds; pointer / phone tilt moves the layers in parallax.
   The front photo crossfades through the pies; tap or swipe for the next one.
   Pure CSS 3D + a small rAF loop that only runs while the hero is on screen. */
(function () {
  var scene = document.getElementById('bscene');
  if (!scene) return;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var layers = [].slice.call(scene.querySelectorAll('.bl')).map(function (el) {
    return { el: el, d: +el.getAttribute('data-d') || 0, r: +el.getAttribute('data-r') || 0, s: +el.getAttribute('data-s') || 0 };
  });
  var pics = [].slice.call(scene.querySelectorAll('.front img'));
  var cap = document.getElementById('bagCap');
  var cur = 0, last = Date.now();

  function show(i) {
    pics[cur].classList.remove('on');
    cur = (i + pics.length) % pics.length;
    pics[cur].classList.add('on');
    if (cap) cap.textContent = pics[cur].getAttribute('data-cap') || '';
    last = Date.now();
  }

  // swipe / tap / keys
  var sx = 0, sy = 0, down = false;
  scene.addEventListener('pointerdown', function (e) { down = true; sx = e.clientX; sy = e.clientY; });
  scene.addEventListener('pointerup', function (e) {
    if (!down) return; down = false;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(cur + (dx < 0 ? 1 : -1));
    else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) show(cur + 1);
  });
  scene.addEventListener('pointercancel', function () { down = false; });
  scene.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(cur + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); }
  });

  function paint(tx, ty, rise) {
    layers.forEach(function (L) {
      var k = (L.d + 80) / 150; // nearer layers move more
      L.el.style.transform = 'translate3d(' + (tx * k * 16).toFixed(2) + 'px,' + (ty * k * 12 - rise * L.s).toFixed(2) + 'px,' + L.d + 'px) rotate(' + L.r + 'deg)';
    });
  }
  if (reduced) { paint(0, 0, 0.5); return; }

  var tx = 0, ty = 0, gx = 0, gy = 0, rise = -0.9, riseT = 0, visible = true;
  scene.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var r = scene.getBoundingClientRect();
    gx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    gy = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  scene.addEventListener('pointerleave', function () { gx = gy = 0; });
  addEventListener('deviceorientation', function (e) {
    if (e.gamma == null) return;
    gx = Math.max(-1, Math.min(1, e.gamma / 25));
    gy = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
  }, { passive: true });
  function onScroll() {
    var r = scene.getBoundingClientRect();
    riseT = Math.max(0, Math.min(1, (innerHeight * 0.5 - r.top) / (r.height + innerHeight * 0.3)));
  }
  addEventListener('scroll', onScroll, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(scene);

  (function loop() {
    requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    tx += (gx - tx) * 0.06; ty += (gy - ty) * 0.06;
    rise += (riseT - rise) * 0.05;
    paint(tx, ty, rise);
  })();
  setInterval(function () {
    if (visible && !document.hidden && !down && Date.now() - last > 4000) show(cur + 1);
  }, 1000);
  onScroll();
})();
