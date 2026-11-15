/* Photo-real hero: real DDflowers24 bouquets (photos from their Yandex Maps card) floating at
   different depths inside the night greenhouse. Pointer / gyro tilts the whole space, scroll pulls
   the layers apart, swipe or tap sends the front bouquet to the back. Pure CSS 3D, no WebGL. */
(function () {
  var stage = document.getElementById('heroArt');
  if (!stage || !window.CSS || !CSS.supports('transform-style', 'preserve-3d')) return;
  var PHOTOS = [
    ['hatbox-roses', 'шляпная коробка с розами'], ['peony-magenta', 'малиновые пионы и розы'],
    ['white-bouquet', 'белый букет'], ['lilac-roses', 'сиреневые розы'],
    ['hydrangea-mix', 'гортензия и розы'], ['pink-peonies', 'розовые пионы']
  ];
  // slot: x, y (in card widths from centre), z (px), scale
  var SLOTS = [
    [-0.12, 0.02, 90, 1], [0.62, -0.42, -60, .72], [-0.78, 0.34, -110, .7],
    [0.7, 0.5, -170, .62], [-0.62, -0.56, -230, .58], [0.08, -0.7, -320, .5]
  ];
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var N = PHOTOS.length, order = PHOTOS.map(function (_, i) { return i; });

  var scene = document.createElement('div'); scene.className = 'dpt';
  var cam = document.createElement('div'); cam.className = 'dpt-cam';
  var cards = PHOTOS.map(function (p, i) {
    var f = document.createElement('figure'); f.className = 'dcard';
    f.innerHTML = '<img src="img/' + p[0] + '.webp" alt="" draggable="false"' + (i > 1 ? ' loading="lazy"' : '') + ' decoding="async"><span class="glare"></span>';
    cam.appendChild(f); return f;
  });
  scene.appendChild(cam); stage.prepend(scene);
  var cap = document.createElement('p'); cap.className = 'dpt-cap';
  cap.innerHTML = '<small>настоящие букеты · фото с Яндекс Карт</small><span></span>';
  stage.appendChild(cap);
  var capT = cap.querySelector('span');
  var hint = document.createElement('span'); hint.className = 'dpt-hint'; hint.textContent = '← свайп · следующий букет →'; stage.appendChild(hint);
  stage.classList.add('has-photos');

  var cw = 200;
  function place() {
    order.forEach(function (ci, slot) {
      var s = SLOTS[slot], c = cards[ci];
      c.style.transform = 'translate3d(' + (s[0] * cw).toFixed(1) + 'px,' + (s[1] * cw).toFixed(1) + 'px,' + s[2] + 'px) scale(' + s[3] + ')';
      c.style.zIndex = 10 - slot;
      c.style.setProperty('--dim', slot === 0 ? 1 : (0.78 - slot * 0.07).toFixed(2));
      c.classList.toggle('front', slot === 0);
    });
    capT.textContent = PHOTOS[order[0]][1];
  }
  function layout() {
    var w = stage.clientWidth, h = stage.clientHeight;
    cw = Math.min(w * 0.46, h * 0.56, 300);
    stage.style.setProperty('--cw', cw + 'px');
    place();
  }
  new ResizeObserver(layout).observe(stage); layout();

  function next(dir) {
    if (dir > 0) order.push(order.shift()); else order.unshift(order.pop());
    place(); lastAuto = performance.now();
  }

  // swipe / tap
  var sx = null, sy = 0, moved = false;
  scene.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; moved = false; });
  scene.addEventListener('pointermove', function (e) { if (sx !== null && Math.abs(e.clientX - sx) > 8) moved = true; });
  scene.addEventListener('pointerup', function (e) {
    if (sx === null) return;
    var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) next(dx < 0 ? 1 : -1);
    else if (!moved) next(1);
  });
  scene.addEventListener('pointercancel', function () { sx = null; });

  // pointer + gyro tilt
  var tx = 0, ty = 0, cx = 0, cy = 0;
  stage.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var r = stage.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - .5) * 2; ty = ((e.clientY - r.top) / r.height - .5) * 2;
  });
  stage.addEventListener('pointerleave', function () { tx = ty = 0; });
  addEventListener('deviceorientation', function (e) {
    if (e.gamma == null) return;
    tx = Math.max(-1, Math.min(1, e.gamma / 25)); ty = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
  });

  var scrollP = 0, visible = true, lastAuto = performance.now();
  function onScroll() { var r = stage.getBoundingClientRect(); scrollP = Math.min(1, Math.max(0, (innerHeight * 0.5 - r.top) / r.height)); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(stage);

  if (reduced) { cam.style.transform = 'rotateX(4deg)'; return; }
  function tick(t) {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
    var drift = Math.sin(t / 2600) * 3;
    // scroll: the space tips back and the layers spread in depth
    cam.style.transform = 'translateY(' + (-scrollP * 30).toFixed(1) + 'px) translateZ(' + (scrollP * 60).toFixed(1) + 'px) rotateX(' + (4 + cy * -7 + scrollP * 14).toFixed(2) + 'deg) rotateY(' + (cx * 11 + drift).toFixed(2) + 'deg)';
    stage.style.setProperty('--gx', (50 + cx * 40).toFixed(1) + '%');
    if (t - lastAuto > 4800 && sx === null) next(1);
  }
  requestAnimationFrame(tick);
})();
