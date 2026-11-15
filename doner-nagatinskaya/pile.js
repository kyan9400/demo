/* Photo hero: real photos from the Yandex Maps card printed on paper and taped onto the kraft page,
   lying at different depths together with the receipt and the 24/7 stamp. Pointer (or phone tilt) and
   scroll move each layer at its own speed (depth parallax); tap / swipe / arrows (and a slow auto-cycle)
   send the top print to the bottom of the pile. Transform-only; pauses off-screen; static when reduced motion. */
(function () {
  var pile = document.getElementById('pile');
  if (!pile) return;
  var prints = [].slice.call(pile.querySelectorAll('.print'));
  var rc = pile.querySelector('.pile-rc'), stamp = pile.querySelector('.pile-stamp');
  var capEl = document.getElementById('pileCap'), nEl = document.getElementById('pileN');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var N = prints.length, order = prints.map(function (_, i) { return i; }), visible = true, lastUser = 0;
  prints.forEach(function (p) { var im = p.querySelector('img'); if (+im.getAttribute('width') > +im.getAttribute('height')) p.classList.add('wide'); });

  /* slot: x, y (fractions of the pile box), width (fraction), rotation, depth (parallax weight), z-index */
  var SLOTS = [
    { x: .21, y: .12, w: .52, r: -3, d: 1, z: 40 },
    { x: .01, y: .02, w: .43, r: -8, d: .55, z: 30 },
    { x: .53, y: .00, w: .45, r: 6, d: .4, z: 20 },
    { x: .48, y: .33, w: .45, r: 3, d: .25, z: 10 }
  ];
  var W = 0, H = 0;
  function measure() { W = pile.clientWidth; H = pile.clientHeight; }

  function place() {
    order.forEach(function (pi, si) {
      var p = prints[pi], s = SLOTS[si] || SLOTS[SLOTS.length - 1], wide = p.classList.contains('wide');
      var w = s.w * W * (wide ? 1.12 : 1);
      p.style.setProperty('--pw', w.toFixed(1) + 'px');
      var x = s.x * W - (wide ? w * 0.06 : 0);
      p.style.transform = 'translate(' + x.toFixed(1) + 'px,' + (s.y * H).toFixed(1) + 'px) rotate(' + s.r + 'deg)';
      p.style.zIndex = s.z;
      p.style.filter = si ? 'brightness(' + (1 - si * 0.05) + ')' : 'none';
      p.dataset.d = s.d;
      p.setAttribute('aria-hidden', si ? 'true' : 'false');
    });
    rc.style.transform = 'translate(' + (0.0 * W).toFixed(1) + 'px,' + (0.6 * H).toFixed(1) + 'px) rotate(-7deg)'; rc.style.zIndex = 50; rc.dataset.d = 1.25;
    var sw = stamp.getBoundingClientRect().width || 110;
    stamp.style.transform = 'translate(' + (W - sw - 0.01 * W).toFixed(1) + 'px,' + (0.62 * H).toFixed(1) + 'px) rotate(-14deg)'; stamp.style.zIndex = 60; stamp.dataset.d = 1.45;
    var top = prints[order[0]];
    capEl.textContent = top.dataset.cap; nEl.textContent = (order[0] + 1) + '/' + N;
  }
  function next(dir) {
    if (dir < 0) order.unshift(order.pop()); else order.push(order.shift());
    place();
  }

  /* input */
  var down = false, sx = 0, sy = 0;
  pile.addEventListener('pointerdown', function (e) { down = true; sx = e.clientX; sy = e.clientY; pile.classList.add('grab'); });
  pile.addEventListener('pointerup', function (e) {
    if (!down) return; down = false; pile.classList.remove('grab');
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { lastUser = Date.now(); next(dx < 0 ? 1 : -1); }
    else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) { lastUser = Date.now(); next(1); }
  });
  pile.addEventListener('pointercancel', function () { down = false; pile.classList.remove('grab'); });
  pile.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lastUser = Date.now(); next(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); lastUser = Date.now(); next(-1); }
  });

  new ResizeObserver(function () { measure(); place(); }).observe(pile);
  measure(); place();
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(pile);
  if (reduced) return;

  setInterval(function () { if (visible && !document.hidden && !down && Date.now() - lastUser > 7000) next(1); }, 4300);

  /* depth parallax: pointer / device tilt / idle drift + scroll, applied through the separate `translate` property */
  var tx = 0, ty = 0, px = 0, py = 0, src = 'idle', t0 = performance.now();
  addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    src = 'ptr'; tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5;
  }, { passive: true });
  addEventListener('deviceorientation', function (e) {
    if (e.gamma == null) return;
    src = 'gyro'; tx = Math.max(-1, Math.min(1, e.gamma / 30)) * 0.5; ty = Math.max(-1, Math.min(1, (e.beta - 40) / 30)) * 0.5;
  }, { passive: true });
  var layers = prints.concat([rc, stamp]);
  function tick(now) {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    var t = (now - t0) / 1000;
    var gx = src === 'idle' ? Math.sin(t * 0.4) * 0.3 : tx, gy = src === 'idle' ? Math.cos(t * 0.31) * 0.2 : ty;
    px += (gx - px) * 0.07; py += (gy - py) * 0.07;
    var sc = Math.min(scrollY, 900);
    layers.forEach(function (l) {
      var d = +l.dataset.d || 0.5;
      l.style.translate = (-px * 26 * d).toFixed(1) + 'px ' + (-py * 20 * d - sc * 0.12 * d).toFixed(1) + 'px';
    });
  }
  requestAnimationFrame(tick);
})();
