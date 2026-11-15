/* Photo-real hero for «Домашняя грузинская кухня»: the kitchen's real dish photos (from its
   Yandex Maps card) lie on the blue-white supra tablecloth, shown in 3D. On load the table tilts
   up toward you and the dishes lift off the cloth; scrolling "serves" the table (it turns to face
   the viewer); the pointer / phone tilt it a little; tap a photo to lift it on top.
   Pure CSS 3D + a small rAF loop that only runs while the hero is visible. */
(function () {
  var box = document.getElementById('supra'), plane = document.getElementById('plane');
  if (!box || !plane) return;
  var dishes = [].slice.call(plane.querySelectorAll('.sdish'));
  var cap = document.getElementById('supraCap');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var topI = 0, last = Date.now();
  var base = [{ r: -7, x: 0 }, { r: 6, x: 0 }];

  function setTop(i) {
    topI = (i + dishes.length) % dishes.length;
    dishes.forEach(function (d, k) { d.classList.toggle('top', k === topI); });
    if (cap) cap.textContent = dishes[topI].getAttribute('data-cap') || '';
    last = Date.now();
  }
  dishes.forEach(function (d, k) {
    d.addEventListener('click', function () { setTop(k === topI ? k + 1 : k); });
  });
  box.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setTop(topI + 1); }
  });

  // state: tilt of the table (deg), lift of the dishes (px), pointer offsets
  var rx = 48, lift = 0, px = 0, py = 0, gx = 0, gy = 0, sp = 0, visible = true;
  function paint() {
    plane.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + (px * 5).toFixed(2) + 'deg) rotateZ(' + (-3 + px * 2).toFixed(2) + 'deg)';
    dishes.forEach(function (d, i) {
      var isTop = i === topI;
      d._z = (d._z == null ? 0 : d._z) + (((isTop ? 1.6 : 1) * lift) - (d._z || 0)) * 0.12;
      d.style.transform = 'translateZ(' + d._z.toFixed(1) + 'px) rotate(' + base[i].r + 'deg) translate(' + (px * (isTop ? 6 : 3)).toFixed(1) + 'px,' + (py * (isTop ? 5 : 2)).toFixed(1) + 'px)';
      d.style.zIndex = isTop ? 2 : 1;
    });
  }
  setTop(0);
  if (reduced) { rx = 12; lift = 24; dishes.forEach(function (d) { d._z = 24; }); paint(); return; }

  box.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var r = box.getBoundingClientRect();
    gx = ((e.clientX - r.left) / r.width - 0.5) * 2; gy = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  box.addEventListener('pointerleave', function () { gx = gy = 0; });
  addEventListener('deviceorientation', function (e) {
    if (e.gamma == null) return;
    gx = Math.max(-1, Math.min(1, e.gamma / 30)); gy = Math.max(-1, Math.min(1, (e.beta - 45) / 35));
  }, { passive: true });
  function onScroll() {
    var r = box.getBoundingClientRect();
    sp = Math.max(0, Math.min(1, (innerHeight * 0.6 - r.top) / (r.height + innerHeight * 0.2)));
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(box);

  var t0 = performance.now();
  (function loop(now) {
    requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    // entrance over ~1.4s: the table rises from 48deg to 18deg, then scroll takes it toward 4deg
    var e = Math.min(1, ((now || t0) - t0) / 1400); e = 1 - Math.pow(1 - e, 3);
    var targetRx = 48 - e * 30 - sp * 14;
    var targetLift = e * 26 + sp * 30;
    rx += (targetRx - rx) * 0.08; lift += (targetLift - lift) * 0.08;
    px += (gx - px) * 0.06; py += (gy - py) * 0.06;
    paint();
  })();
  setInterval(function () {
    if (visible && !document.hidden && Date.now() - last > 4500) setTop(topI + 1);
  }, 1000);
})();
