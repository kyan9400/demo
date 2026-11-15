/* Photo-real hero: a 3D deck of real workshop photos from X-Repair's Yandex Maps card.
   Pure CSS 3D + small JS: the top photo is thrown to the back every few seconds,
   drag/swipe throws it yourself, scroll fans the deck out, pointer tilts it. */
(function () {
  var deck = document.getElementById('deck');
  if (!deck) return;
  var PHOTOS = [
    ['open-battery', 'вскрытый iPhone · аккумулятор'],
    ['microscope', 'пайка под микроскопом'],
    ['open-screen', 'снятый дисплей'],
    ['battery', 'аккумулятор и шлейфы'],
    ['board', 'плата · пинцет'],
    ['bench', 'рабочее место мастера'],
    ['open-hands', 'разборка в перчатках']
  ];
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var N = PHOTOS.length, order = [], cards = [];
  var tilt = document.createElement('div'); tilt.className = 'dk-tilt';
  PHOTOS.forEach(function (p, i) {
    var f = document.createElement('figure'); f.className = 'dcard';
    f.innerHTML = '<img src="img/' + p[0] + '.webp" alt="' + p[1] + ' — фото X-Repair" draggable="false" width="1200" height="800" ' + (i > 3 ? 'loading="lazy" ' : '') + 'decoding="async"><span class="crop"></span><span class="glare"></span><span class="fig">fig.0' + (i + 1) + ' · фото с Яндекс Карт</span>';
    tilt.appendChild(f); cards.push(f); order.push(i);
  });
  var ns = deck.querySelector('noscript'); if (ns) ns.remove();
  deck.appendChild(tilt);
  var capEl = document.getElementById('deckCap'), nEl = document.getElementById('deckN');

  var spread = 0, dragDX = 0, dragging = false, startX = 0, startY = 0, px = 0, py = 0, visible = true, timer = 0;

  function place() {
    order.forEach(function (ci, k) {
      var c = cards[ci], show = k < 5;
      var step = 10 + spread * 38, tx = k * step - step * 1.6, ty = -k * (14 - spread * 4), tz = -k * 70, rz = k * (2.2 + spread * 4.5), ry = -k * (2 + spread * 3);
      if (k === 0 && dragging) { tx += dragDX; rz += dragDX * 0.04; ry = dragDX * 0.05; }
      c.style.transform = 'translate(-50%,-50%) translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,' + tz + 'px) rotateY(' + ry.toFixed(2) + 'deg) rotateZ(' + rz.toFixed(2) + 'deg)';
      c.style.zIndex = 50 - k;
      c.style.opacity = show ? 1 : 0;
      c.style.filter = 'brightness(' + (1 - Math.min(k, 4) * 0.11).toFixed(2) + ') saturate(' + (1 - Math.min(k, 4) * 0.12).toFixed(2) + ')';
      c.style.setProperty('--gp', (100 - k * 18 - spread * 40) + '%');
      c.setAttribute('aria-hidden', k === 0 ? 'false' : 'true');
    });
    var top = order[0];
    if (capEl) capEl.textContent = PHOTOS[top][1];
    if (nEl) nEl.textContent = String(top + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
  }
  function next(dir) {
    var top = cards[order[0]];
    top.style.transform = 'translate(-50%,-50%) translate3d(' + (dir < 0 ? -115 : 115) + '%,-6%,40px) rotateY(' + (dir < 0 ? -24 : 24) + 'deg) rotateZ(' + (dir < 0 ? -14 : 14) + 'deg)';
    setTimeout(function () { order.push(order.shift()); place(); }, reduced ? 0 : 260);
  }
  function auto() { clearInterval(timer); if (!reduced) timer = setInterval(function () { if (visible && !dragging && !document.hidden) next(-1); }, 3800); }

  deck.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    dragging = true; startX = e.clientX; startY = e.clientY; dragDX = 0;
    cards[order[0]].classList.add('drag');
    try { deck.setPointerCapture(e.pointerId); } catch (_) {}
  });
  deck.addEventListener('pointermove', function (e) {
    var r = deck.getBoundingClientRect();
    px = (e.clientX - r.left) / r.width - 0.5; py = (e.clientY - r.top) / r.height - 0.5;
    if (!dragging) { if (e.pointerType === 'mouse') tiltIt(); return; }
    dragDX = e.clientX - startX; place();
  });
  function end() {
    if (!dragging) return;
    dragging = false; cards[order[0]].classList.remove('drag');
    if (Math.abs(dragDX) > 50) next(dragDX < 0 ? -1 : 1);
    else if (Math.abs(dragDX) < 4) next(-1); // tap = next photo
    else place();
    dragDX = 0; auto();
  }
  deck.addEventListener('pointerup', end); deck.addEventListener('pointercancel', function () { dragging = false; cards[order[0]].classList.remove('drag'); dragDX = 0; place(); });
  deck.addEventListener('pointerleave', function () { px = py = 0; tiltIt(); });
  deck.tabIndex = 0; deck.setAttribute('role', 'region');
  deck.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); next(e.key === 'ArrowLeft' ? -1 : 1); auto(); } });

  function tiltIt() {
    if (reduced) return;
    tilt.style.transform = 'rotateY(' + (px * 10).toFixed(2) + 'deg) rotateX(' + (-py * 8 + spread * 6).toFixed(2) + 'deg)';
  }
  var raf = 0;
  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      var r = deck.getBoundingClientRect();
      var s = Math.min(1, Math.max(0, (pageYOffset - 20) / (r.height * 1.4)));
      if (reduced) s = 0;
      if (Math.abs(s - spread) > 0.01) { spread = s; place(); tiltIt(); }
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(deck);
  place(); onScroll(); auto();
})();
(function () {
  var f = document.querySelector('.place-photo');
  if (!f || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  f.addEventListener('pointermove', function (e) { var r = f.getBoundingClientRect(); f.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 8 + 'deg'); f.style.setProperty('--rx', (0.5 - (e.clientY - r.top) / r.height) * 6 + 'deg'); });
  f.addEventListener('pointerleave', function () { f.style.setProperty('--ry', '0deg'); f.style.setProperty('--rx', '0deg'); });
})();
