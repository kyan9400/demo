/* Photo hero: a stack of the shop's real photos (from its Yandex Maps card) standing over the grill.
   Pure CSS 3D per card: the top photo is dealt off the stack every few seconds (or by swipe / tap / arrows)
   and tucks back underneath; scrolling fans the stack out over the flames; the pointer tilts it.
   Pauses off-screen; with prefers-reduced-motion it only changes on user input. */
(function () {
  var deck = document.getElementById('deck');
  if (!deck) return;
  var cards = [].slice.call(deck.querySelectorAll('.dcard'));
  var capEl = document.getElementById('deckCap'), nEl = document.getElementById('deckN');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var N = cards.length, top = 0, fan = 0, tx = 0, ty = 0, visible = true, busy = false, lastUser = 0, timer = 0;
  var SLOT = [0, 1, -1, 2, -2, 3, -3];

  function pose(k) {
    var w = cards[0].offsetWidth || 200, sgn = k % 2 ? 1 : -1, s = SLOT[k] || 0, f = fan;
    var x = (1 - f) * sgn * k * w * 0.035 + f * s * w * 0.36;
    var y = (1 - f) * -k * w * 0.05 + f * Math.abs(s) * w * 0.07;
    var rz = (1 - f) * sgn * (k ? 2 + k * 2.2 : 0) + f * s * 9;
    var sc = 1 - (1 - f) * k * 0.035 - f * Math.abs(s) * 0.06;
    return { x: x, y: y, rz: rz, sc: sc };
  }
  function tf(p, extra) {
    return 'perspective(900px) rotateX(' + (ty * -8).toFixed(2) + 'deg) rotateY(' + (tx * 12).toFixed(2) + 'deg) translate3d(' +
      p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,0) rotateZ(' + p.rz.toFixed(2) + 'deg) scale(' + p.sc.toFixed(3) + ')' + (extra || '');
  }
  function layout() {
    cards.forEach(function (c, i) {
      var k = (i - top + N) % N;
      if (c.dataset.out) return;
      c.style.transform = tf(pose(k));
      c.style.zIndex = N - k;
      c.style.filter = 'brightness(' + (1 - k * 0.12 * (1 - fan * 0.7)).toFixed(3) + ')';
      c.setAttribute('aria-hidden', k ? 'true' : 'false');
    });
    capEl.textContent = cards[top].dataset.cap; nEl.textContent = (top + 1) + '/' + N;
  }
  function deal(dir) {
    if (busy) return; busy = true;
    var c = cards[top], w = c.offsetWidth;
    c.classList.remove('drag');
    c.dataset.out = '1'; c.style.zIndex = N + 1;
    c.style.transform = tf({ x: dir * w * 1.05, y: -w * 0.12, rz: dir * 20, sc: 1 }, ' rotateY(' + (-dir * 18) + 'deg)');
    setTimeout(function () {
      delete c.dataset.out; top = (top + 1) % N; layout();
      setTimeout(function () { busy = false; }, 200);
    }, reduced ? 0 : 340);
  }
  function auto() {
    clearTimeout(timer);
    if (reduced) return;
    timer = setTimeout(function () {
      if (visible && !document.hidden && !drag && Date.now() - lastUser > 6000) deal(1);
      auto();
    }, 3800);
  }

  /* swipe / drag the top card, tap to deal */
  var drag = false, sx = 0, sy = 0, dx = 0, moved = false;
  deck.addEventListener('pointerdown', function (e) { drag = true; moved = false; sx = e.clientX; sy = e.clientY; dx = 0; deck.classList.add('grab'); });
  deck.addEventListener('pointermove', function (e) {
    var r = deck.getBoundingClientRect();
    if (e.pointerType === 'mouse' && !reduced) { tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5; }
    if (!drag || busy) { if (e.pointerType === 'mouse' && !reduced) layout(); return; }
    dx = e.clientX - sx; var dy = e.clientY - sy;
    if (!moved && Math.abs(dx) < 8) return;
    if (!moved && Math.abs(dy) > Math.abs(dx)) { drag = false; deck.classList.remove('grab'); return; }
    moved = true; lastUser = Date.now();
    var c = cards[top], p = pose(0); c.classList.add('drag');
    c.style.transform = tf({ x: p.x + dx, y: p.y - Math.abs(dx) * 0.08, rz: p.rz + dx * 0.06, sc: p.sc });
  });
  function end() {
    if (!drag) return; drag = false; deck.classList.remove('grab');
    var c = cards[top]; c.classList.remove('drag');
    lastUser = Date.now();
    if (moved && Math.abs(dx) > 50) deal(dx > 0 ? 1 : -1);
    else if (!moved) deal(1);
    else layout();
  }
  deck.addEventListener('pointerup', end);
  deck.addEventListener('pointercancel', function () { drag = false; deck.classList.remove('grab'); cards[top].classList.remove('drag'); layout(); });
  deck.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { tx = ty = 0; layout(); } });
  deck.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lastUser = Date.now(); deal(e.key === 'ArrowLeft' ? -1 : 1); }
  });

  /* scroll fans the stack out */
  var raf = 0;
  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      var f = reduced ? 0 : Math.min(1, Math.max(0, scrollY / (deck.offsetHeight * 0.9 + 1)));
      if (Math.abs(f - fan) > 0.01) { fan = f; layout(); }
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', layout);
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(deck);
  layout(); onScroll(); auto();
})();
