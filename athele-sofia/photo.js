/* Photo-real hero: a couture "deck" of real work from the ateliér's Yandex Maps card.
   Pinned photo cards fanned in 3D perspective: they flip through on their own, follow a drag / swipe,
   step with the arrows or keyboard, and fan out wider as you scroll. Pointer tilts the whole deck.
   Transform/opacity only, pauses off-screen, static (no auto-flip) under prefers-reduced-motion. */
(function () {
  var deck = document.getElementById('deck');
  if (!deck || !CSS.supports('transform-style', 'preserve-3d')) return;
  var inner = document.getElementById('deckIn');
  var cards = [].slice.call(inner.querySelectorAll('.dcard'));
  var capEl = document.getElementById('deckT');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var N = cards.length, pos = 0, target = 0, drag = false, lastX = 0, startX = 0, moved = 0;
  var visible = true, scrollP = 0, idleAt = performance.now(), front = -1, cw = 220, AUTO = 4200;

  function layout() {
    var w = deck.clientWidth, h = deck.clientHeight;
    cw = Math.min(w * 0.6, (h - 50) * 0.75 + 14, 340);
    deck.style.setProperty('--cw', cw.toFixed(0) + 'px');
    place();
  }
  function wrapD(d) { d = ((d % N) + N) % N; return d > N / 2 ? d - N : d; }

  function place() {
    var spread = 1 + scrollP * 0.55, ch = (cw - 14) * 4 / 3 + 38;
    var best = 0, bestA = 9;
    cards.forEach(function (c, i) {
      var d = wrapD(i - pos), a = Math.abs(d);
      var x = d * cw * 0.42 * spread, z = -a * 110, ry = -d * 16, rz = d * 5 * spread, y = a * 10;
      var op = Math.max(0, Math.min(1, 1 - (a - 1.15) / 0.6));
      c.style.transform = 'translate3d(' + (x - cw / 2).toFixed(1) + 'px,' + (y - ch / 2).toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateY(' + ry.toFixed(2) + 'deg) rotateZ(' + rz.toFixed(2) + 'deg)';
      c.style.opacity = op.toFixed(3);
      c.style.zIndex = String(100 - Math.round(a * 10));
      c.style.filter = 'brightness(' + (1 - Math.min(a, 2) * 0.22).toFixed(3) + ')';
      if (a < bestA) { bestA = a; best = i; }
    });
    if (best !== front) {
      front = best;
      cards.forEach(function (c, i) { c.setAttribute('aria-hidden', String(i !== best)); });
      capEl.textContent = cards[best].dataset.cap;
    }
  }

  function step(dir) { target = Math.round(target) + dir; idleAt = performance.now(); }
  document.getElementById('deckPrev').addEventListener('click', function () { step(-1); });
  document.getElementById('deckNext').addEventListener('click', function () { step(1); });
  deck.tabIndex = 0;
  deck.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { step(1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); }
  });

  deck.addEventListener('pointerdown', function (e) { drag = true; lastX = startX = e.clientX; moved = 0; deck.setPointerCapture(e.pointerId); deck.classList.add('grab'); });
  deck.addEventListener('pointermove', function (e) {
    if (drag) { var dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx); target -= dx / (cw * 0.55); pos = target; idleAt = performance.now(); }
    if (!reduced && e.pointerType === 'mouse') {
      var r = deck.getBoundingClientRect();
      inner.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 8).toFixed(2) + 'deg');
      inner.style.setProperty('--rx', ((0.5 - (e.clientY - r.top) / r.height) * 6).toFixed(2) + 'deg');
    }
  });
  function end(e) {
    if (!drag) return; drag = false; deck.classList.remove('grab');
    if (moved < 6 && e && e.type === 'pointerup') target = Math.round(target) + 1; // tap = next card
    else target = Math.round(target);
    idleAt = performance.now();
  }
  deck.addEventListener('pointerup', end); deck.addEventListener('pointercancel', end);
  deck.addEventListener('pointerleave', function () { inner.style.setProperty('--ry', '0deg'); inner.style.setProperty('--rx', '0deg'); });

  function onScroll() { var r = deck.getBoundingClientRect(); scrollP = reduced ? 0 : Math.min(1, Math.max(0, (innerHeight * 0.35 - r.top) / (r.height * 0.9))); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  new ResizeObserver(layout).observe(deck); layout();
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(deck);

  var lastScroll = -1;
  function tick(now) {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) { idleAt = now; return; }
    if (!reduced && !drag && now - idleAt > AUTO) { target = Math.round(target) + 1; idleAt = now; }
    var settled = Math.abs(target - pos) < 0.001;
    if (!drag && !settled) pos += (target - pos) * (reduced ? 1 : 0.11);
    if (!settled || drag || scrollP !== lastScroll) { place(); lastScroll = scrollP; }
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
