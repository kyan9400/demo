/* Photo-deck hero for «Вино и хинкали»: six real photos from the restaurant's Yandex Maps card,
   stacked like a fanned deck of cards in CSS 3D. It fans open on load, the front card is flicked
   to the back every few seconds (or by swipe / drag / tap), the pointer tilts the deck and
   scrolling folds the fan shut. Transform-only, pauses off-screen, static with reduced motion. */
(function () {
  var deck = document.getElementById('deck'), tilt = document.getElementById('deckTilt');
  if (!deck || !tilt || !CSS.supports('transform-style', 'preserve-3d')) return;
  var cards = [].slice.call(tilt.querySelectorAll('.dk'));
  var CAP = ['хинкали на блюде', 'разноцветные хинкали', 'хачапури по-аджарски', 'стол на компанию', 'пхали с гранатом', 'хинкали крупным планом'];
  var N = cards.length, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var order = cards.map(function (c, i) { return i; }); // order[p] = card index at position p (0 = front)
  var cap = document.getElementById('deckCap');
  var fan = reduced ? 1 : 0, fanTarget = 1, fold = 0, busy = false, timer = null, visible = true;
  var dragX = 0, dragging = false, sx = 0, sy = 0, moved = false;

  function place(p) {
    var side = p % 2 ? 1 : -1, k = Math.ceil(p / 2), f = fan * (1 - fold * 0.75);
    var ang = side * k * 7.5 * f, tx = side * k * 9 * f, ty = k * 1.5 + fold * p * -1.5, z = -p * 38;
    return 'translate3d(' + tx.toFixed(2) + '%,' + ty.toFixed(2) + '%,' + z + 'px) rotate(' + ang.toFixed(2) + 'deg)';
  }
  function layout() {
    order.forEach(function (ci, p) {
      var c = cards[ci];
      c.style.zIndex = 50 - p;
      c.classList.toggle('front', p === 0);
      c.style.filter = p ? 'brightness(' + (1 - p * 0.06).toFixed(2) + ') saturate(' + (1 - p * 0.05).toFixed(2) + ')' : '';
      if (p === 0 && dragging) c.style.transform = 'translate3d(' + dragX + 'px,' + (-Math.abs(dragX) * 0.06) + 'px,20px) rotate(' + (dragX * 0.05) + 'deg)';
      else c.style.transform = place(p);
      var im = c.querySelector('img'); if (p < 3 && im.loading === 'lazy') im.loading = 'eager';
    });
    cap.textContent = CAP[order[0]];
  }
  // flick the front card away (dir = -1 left / 1 right), then tuck it at the back of the deck
  function next(dir) {
    if (busy) return; busy = true;
    var c = cards[order[0]];
    c.classList.remove('drag');
    c.style.transform = 'translate3d(' + (dir * 70) + '%,-8%,60px) rotate(' + (dir * 14) + 'deg)';
    setTimeout(function () {
      order.push(order.shift());
      c.style.zIndex = 0; layout();
      setTimeout(function () { busy = false; }, 300);
    }, reduced ? 0 : 380);
    schedule();
  }
  function prev() { if (busy) return; order.unshift(order.pop()); layout(); schedule(); }
  function schedule() {
    clearTimeout(timer);
    if (reduced || !visible || document.hidden) return;
    timer = setTimeout(function () { next(-1); }, 4600);
  }

  deck.addEventListener('pointerdown', function (e) { if (busy) return; dragging = true; moved = false; sx = e.clientX; sy = e.clientY; dragX = 0; deck.classList.add('grab'); cards[order[0]].classList.add('drag'); });
  deck.addEventListener('pointermove', function (e) {
    var r = deck.getBoundingClientRect();
    if (e.pointerType === 'mouse') { tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5; kick(); }
    if (!dragging) return;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (!moved && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { end(null); return; } // vertical: let the page scroll
    if (Math.abs(dx) > 4) moved = true;
    dragX = dx; layout();
  });
  function end(e) {
    if (!dragging) return;
    dragging = false; deck.classList.remove('grab'); cards[order[0]].classList.remove('drag');
    if (e && Math.abs(dragX) > 50) { if (dragX < 0) next(-1); else next(1); }
    else if (e && !moved) next(-1); // tap = next photo
    else layout();
    dragX = 0;
  }
  deck.addEventListener('pointerup', end);
  deck.addEventListener('pointercancel', function () { end(null); });
  deck.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { tx = 0; ty = 0; kick(); } });
  deck.tabIndex = 0;
  deck.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { next(-1); e.preventDefault(); } else if (e.key === 'ArrowLeft') { prev(); e.preventDefault(); } });

  // pointer tilt + scroll fold (eased)
  var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  function frame() {
    raf = 0;
    cx += (tx - cx) * 0.1; cy += (ty - cy) * 0.1;
    if (!reduced && fan < fanTarget) fan = Math.min(fanTarget, fan + 0.03);
    tilt.style.transform = 'rotateY(' + (cx * 14).toFixed(2) + 'deg) rotateX(' + (-cy * 10 + fold * 18).toFixed(2) + 'deg) translateY(' + (fold * -6).toFixed(1) + '%)';
    if (!dragging && !busy) layout();
    if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002 || fan < fanTarget) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && visible && !reduced) raf = requestAnimationFrame(frame); }
  function onScroll() { var r = deck.getBoundingClientRect(); fold = Math.max(0, Math.min(1, -r.top / (r.height * 0.9))); kick(); }
  addEventListener('scroll', onScroll, { passive: true });
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) { onScroll(); kick(); } schedule(); }).observe(deck);
  document.addEventListener('visibilitychange', schedule);

  layout(); kick(); schedule();

  // place section: subtle pointer tilt on the hall photo
  var pp = document.getElementById('plPhoto');
  if (pp && !reduced) {
    pp.addEventListener('pointermove', function (e) { var r = pp.getBoundingClientRect(); pp.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 8).toFixed(2) + 'deg'); pp.style.setProperty('--rx', (((e.clientY - r.top) / r.height - 0.5) * -8).toFixed(2) + 'deg'); });
    pp.addEventListener('pointerleave', function () { pp.style.setProperty('--ry', '0deg'); pp.style.setProperty('--rx', '0deg'); });
  }
})();
