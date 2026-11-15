/* Photo-real hero: a deck of the café's real photos (from its Yandex Maps card), stacked in perspective
   like the kraft boxes it serves food in. Swipe / drag the top card away or tap it to deal the next one;
   it auto-deals while visible, scroll fans the deck out, pointer tilts it. Pure CSS 3D + small JS. */
(function () {
  var deck = document.getElementById('deck');
  if (!deck) return;
  var cards = [].slice.call(deck.querySelectorAll('.dcard'));
  var N = cards.length, order = cards.map(function (_, i) { return i; }); // order[k] = card index at depth k
  var cap = document.getElementById('deckCap'), num = document.getElementById('deckNum');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visible = true, busy = false, timer = 0, hover = false;

  function paint() {
    order.forEach(function (ci, k) {
      var c = cards[ci];
      c.style.setProperty('--k', k);
      c.style.setProperty('--dir', k % 2 ? 1 : -1);
      c.style.zIndex = N - k;
      c.classList.toggle('top', k === 0);
      c.setAttribute('aria-hidden', k === 0 ? 'false' : 'true');
    });
    var top = cards[order[0]];
    if (cap) cap.textContent = top.getAttribute('data-cap');
    if (num) num.textContent = (order[0] + 1) + ' / ' + N;
    // make sure the next couple of cards are loading
    for (var k = 1; k < 3; k++) { var im = cards[order[k]].querySelector('img'); if (im.loading === 'lazy') im.loading = 'eager'; }
  }

  function deal(dir) {
    if (busy) return; busy = true;
    var c = cards[order[0]];
    c.style.setProperty('--fx', dir < 0 ? -1 : 1);
    c.classList.remove('drag'); c.style.removeProperty('--dx'); c.style.removeProperty('--dr');
    c.classList.add('fly');
    setTimeout(function () {
      order.push(order.shift());
      c.classList.remove('fly');
      paint();
      setTimeout(function () { busy = false; }, reduced ? 0 : 260);
    }, reduced ? 0 : 340);
  }

  function schedule() {
    clearTimeout(timer);
    if (reduced) return;
    timer = setTimeout(function () { if (visible && !hover && !document.hidden && !dragging) deal(1); schedule(); }, 3800);
  }

  // drag / swipe the top card
  var dragging = false, sx = 0, sy = 0, dx = 0, moved = false;
  deck.addEventListener('pointerdown', function (e) {
    if (busy) return;
    dragging = true; moved = false; sx = e.clientX; sy = e.clientY; dx = 0;
    try { deck.setPointerCapture(e.pointerId); } catch (_) {}
  });
  deck.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    dx = e.clientX - sx;
    if (!moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(e.clientY - sy)) { moved = true; cards[order[0]].classList.add('drag'); }
    if (moved) { var t = cards[order[0]]; t.style.setProperty('--dx', dx + 'px'); t.style.setProperty('--dr', (dx * 0.05).toFixed(2) + 'deg'); }
  });
  function release() {
    if (!dragging) return; dragging = false;
    var c = cards[order[0]];
    if (moved && Math.abs(dx) > Math.min(90, deck.clientWidth * 0.18)) deal(dx < 0 ? -1 : 1);
    else if (!moved) deal(1);
    else { c.classList.remove('drag'); c.style.removeProperty('--dx'); c.style.removeProperty('--dr'); }
    schedule();
  }
  deck.addEventListener('pointerup', release);
  deck.addEventListener('pointercancel', function () { dragging = false; var c = cards[order[0]]; c.classList.remove('drag'); c.style.removeProperty('--dx'); c.style.removeProperty('--dr'); });
  deck.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); deal(1); schedule(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); deal(-1); schedule(); }
  });

  // pointer tilt (desktop) + scroll fan
  if (!reduced) {
    deck.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; });
    deck.addEventListener('pointerleave', function () { hover = false; deck.style.setProperty('--ty', '0deg'); deck.style.setProperty('--tx', '0deg'); });
    deck.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || dragging) return;
      var r = deck.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      deck.style.setProperty('--ty', (px * 14).toFixed(2) + 'deg');
      deck.style.setProperty('--tx', (-py * 10).toFixed(2) + 'deg');
      deck.style.setProperty('--gx', ((px + 0.5) * 100).toFixed(1) + '%');
    });
    var raf = 0;
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var r = deck.getBoundingClientRect();
        var p = Math.min(1, Math.max(0, (innerHeight * 0.35 - r.top) / (r.height * 0.9)));
        deck.style.setProperty('--s', (0.55 + p * 0.75).toFixed(3));
      });
    }
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(deck);
  deck.classList.add('live');
  paint(); schedule();
})();
