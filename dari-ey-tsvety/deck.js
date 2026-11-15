/* Photo-real hero: a deck of atlas plates, each one a real bouquet from the shop's Yandex Maps card.
   Swipe / drag the top plate away (or tap) to turn the page, scroll fans the deck open,
   the pointer tilts it like a sheet of paper in the hand. Pure CSS 3D + small JS, no WebGL. */
(function () {
  var plate = document.getElementById('plate');
  if (!plate || !window.CSS || !CSS.supports('transform-style', 'preserve-3d')) return;
  var PHOTOS = [
    ['peonies-vase', 'пионы в вазе'], ['proteas', 'протеи'], ['orchid-basket', 'корзина с орхидеями'],
    ['roses-peonies', 'розы и пионы'], ['pink-ranunculus', 'розовый букет'], ['sunflowers', 'подсолнухи в корзине']
  ];
  var ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  var BASE_R = [0, -4.5, 3.8, -2.2, 5.2, -5.6];
  var FAN = [0, -15, 15, -29, 29, 0];
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var N = PHOTOS.length, order = PHOTOS.map(function (_, i) { return i; });

  var wrap = document.createElement('div'); wrap.className = 'deck-wrap';
  var deck = document.createElement('div'); deck.className = 'deck';
  var tilt = document.createElement('div'); tilt.className = 'deck-tilt';
  var cards = PHOTOS.map(function (p, i) {
    var f = document.createElement('figure'); f.className = 'dk';
    f.innerHTML = '<div class="dk-in"><img src="img/' + p[0] + '.webp" alt="' + p[1] + ' — фото магазина с Яндекс Карт" draggable="false"' + (i > 1 ? ' loading="lazy"' : '') + ' decoding="async"><span class="dk-n">Табл. ' + ROMAN[i] + '</span></div><figcaption><i>' + p[1] + '</i><span>фото с Яндекс Карт</span></figcaption>';
    tilt.appendChild(f);
    return { el: f, x: 0, y: 0, r: BASE_R[i] || 0, z: -i * 40, s: 1 };
  });
  deck.appendChild(tilt); wrap.appendChild(deck);
  var foot = document.createElement('p'); foot.className = 'deck-foot';
  foot.innerHTML = '<span>Настоящие букеты магазина</span><button type="button" class="deck-next" aria-label="Следующий букет">листать →</button>';
  wrap.appendChild(foot);
  plate.parentNode.insertBefore(wrap, plate);
  document.getElementById('hero').classList.add('has-deck');

  var W = 300, dragX = 0, dragging = false, fly = null, scrollP = 0, visible = true, lastAuto = performance.now();
  function layout() { W = deck.clientWidth; }
  new ResizeObserver(layout).observe(deck); layout();

  function advance(dir) {
    if (fly) return;
    fly = { card: order[0], dir: dir || -1, t: performance.now() };
    lastAuto = performance.now();
    if (reduced) { order.push(order.shift()); fly = null; render(true); }
  }
  foot.querySelector('.deck-next').addEventListener('click', function () { advance(-1); });

  var sx = null, sy = 0, moved = false;
  deck.addEventListener('pointerdown', function (e) { if (fly) return; sx = e.clientX; sy = e.clientY; moved = false; dragging = true; });
  deck.addEventListener('pointermove', function (e) {
    if (sx === null) return;
    var dx = e.clientX - sx;
    if (!moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - sy)) { moved = true; try { deck.setPointerCapture(e.pointerId); } catch (_) {} }
    if (moved) dragX = dx;
  });
  function up() {
    if (sx === null) return;
    sx = null; dragging = false;
    if (moved && Math.abs(dragX) > W * 0.22) advance(dragX < 0 ? -1 : 1);
    else if (!moved) advance(-1);
    dragX = 0;
  }
  deck.addEventListener('pointerup', up);
  deck.addEventListener('pointercancel', function () { sx = null; dragging = false; dragX = 0; });

  var tx = 0, ty = 0, cx = 0, cy = 0;
  deck.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var r = deck.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - .5) * 2; ty = ((e.clientY - r.top) / r.height - .5) * 2;
  });
  deck.addEventListener('pointerleave', function () { tx = ty = 0; });

  function onScroll() { scrollP = Math.min(1, Math.max(0, scrollY / (wrap.offsetHeight * 0.9 || 500))); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(wrap);

  function render(snap) {
    var now = performance.now();
    if (fly && now - fly.t > 420) { order.push(order.shift()); fly = null; }
    var fan = reduced ? 0 : scrollP;
    order.forEach(function (ci, k) {
      var c = cards[ci], tx_ = 0, ty_ = k * 9, tr = BASE_R[k] + (FAN[k] || 0) * fan, tz = -k * 40, ts = 1 - k * 0.025;
      tx_ += (FAN[k] || 0) * fan * W * 0.012; ty_ += Math.abs(FAN[k] || 0) * fan * 0.6;
      if (k === 0 && dragging) { tx_ = dragX; tr = dragX * 0.06; tz = 20; }
      if (fly && fly.card === ci) { tx_ = fly.dir * W * 1.25; tr = fly.dir * 22; ty_ = -20; tz = 30; }
      var e = snap ? 1 : (k === 0 && dragging ? 0.5 : 0.14);
      c.x += (tx_ - c.x) * e; c.y += (ty_ - c.y) * e; c.r += (tr - c.r) * e; c.z += (tz - c.z) * e; c.s += (ts - c.s) * e;
      c.el.style.transform = 'translate3d(' + c.x.toFixed(1) + 'px,' + c.y.toFixed(1) + 'px,' + c.z.toFixed(1) + 'px) rotate(' + c.r.toFixed(2) + 'deg) scale(' + c.s.toFixed(3) + ')';
      c.el.style.zIndex = (fly && fly.card === ci) ? 50 : N - k;
      c.el.style.setProperty('--sh', (1 - k * 0.12).toFixed(2));
      c.el.classList.toggle('top', k === 0);
    });
    cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
    tilt.style.transform = 'rotateX(' + (cy * -6 + fan * 6).toFixed(2) + 'deg) rotateY(' + (cx * 8).toFixed(2) + 'deg)';
  }
  render(true);
  if (reduced) return;
  function tick(t) {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    if (!dragging && !fly && t - lastAuto > 5200) advance(-1);
    render(false);
  }
  requestAnimationFrame(tick);
})();
