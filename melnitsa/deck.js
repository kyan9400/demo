/* Photo-real hero for «Мельница»: a deck of engraved prints holding the bakery's real photos
   (from its Yandex Maps card). The top print flips away and tucks under the stack every few
   seconds; swipe/drag or tap to flip, arrows on the keyboard work too; scrolling fans the deck.
   Pure CSS 3D transforms — no WebGL. */
(function () {
  var deck = document.getElementById('deck');
  if (!deck) return;
  var cards = [].slice.call(deck.querySelectorAll('.pc'));
  var N = cards.length; if (N < 2) return;
  var cap = document.getElementById('deckCap');
  var nextBtn = document.getElementById('deckNext');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var order = cards.map(function (c, i) { return i; });
  var fan = 0, dragX = 0, startX = 0, down = false, moved = false, flying = false, visible = true, last = 0, raf = 0;

  function place(k, c) {
    var s = k % 2 ? 1 : -1, kk = Math.min(k, 4);
    if (k === 0) return 'translate3d(' + dragX + 'px,' + (-fan * 3) + 'px,0) rotate(' + (dragX * 0.035) + 'deg) rotateY(' + (dragX * 0.04) + 'deg)';
    var f = fan * kk;
    return 'translate3d(' + (s * kk * (7 + f * 3.2)) + 'px,' + (-kk * 7 + f * 1.2) + 'px,' + (-kk * 34) + 'px) rotate(' + (s * (kk * 2.4 + f * 1.6)) + 'deg)';
  }
  function render(skipTop) {
    order.forEach(function (ci, k) {
      var c = cards[ci];
      if (k === 0 && skipTop) return;
      c.style.transform = place(k, c);
      c.style.zIndex = 50 - k;
      c.style.opacity = k > 4 ? 0 : 1;
      c.style.filter = k ? 'brightness(' + (1 - Math.min(k, 4) * 0.06).toFixed(2) + ') sepia(' + (Math.min(k, 4) * 0.09).toFixed(2) + ')' : 'none';
      c.setAttribute('aria-hidden', k ? 'true' : 'false');
    });
    if (cap) cap.textContent = cards[order[0]].getAttribute('data-cap') || '';
  }
  function flip(dir) {
    if (flying) return;
    flying = true; last = Date.now();
    var top = cards[order[0]];
    top.classList.remove('drag');
    top.style.transition = 'transform .5s cubic-bezier(.45,0,.75,.45), opacity .5s';
    top.style.transform = 'translate3d(' + (dir * 118) + '%,-8%,80px) rotate(' + (dir * 18) + 'deg) rotateY(' + (-dir * 28) + 'deg)';
    // promote the next print right away so the caption follows the motion
    var nextCard = cards[order[1]];
    nextCard.style.zIndex = 49;
    setTimeout(function () {
      order.push(order.shift());
      top.style.zIndex = 1;
      top.style.transition = '';
      dragX = 0;
      render();
      flying = false;
    }, reduced ? 0 : 430);
  }

  deck.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.deck-next') || flying) return;
    down = true; moved = false; startX = e.clientX; dragX = 0;
    cards[order[0]].classList.add('drag'); deck.classList.add('grab');
    try { deck.setPointerCapture(e.pointerId); } catch (err) {}
  });
  deck.addEventListener('pointermove', function (e) {
    if (!down) return;
    dragX = e.clientX - startX;
    if (Math.abs(dragX) > 6) moved = true;
    cards[order[0]].style.transform = place(0);
  });
  function end(e) {
    if (!down) return;
    down = false; deck.classList.remove('grab');
    cards[order[0]].classList.remove('drag');
    if (e.type !== 'pointercancel' && (Math.abs(dragX) > 60 || !moved)) flip(dragX > 0 ? 1 : -1);
    else { dragX = 0; render(); }
  }
  deck.addEventListener('pointerup', end);
  deck.addEventListener('pointercancel', end);
  deck.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); flip(e.key === 'ArrowRight' ? -1 : 1); }
  });
  if (nextBtn) nextBtn.addEventListener('click', function () { flip(-1); });

  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      var r = deck.getBoundingClientRect();
      var p = (innerHeight * 0.55 - (r.top + r.height * 0.5)) / (innerHeight * 0.5);
      var nf = reduced ? 0 : Math.max(0, Math.min(1, p)) * 1.6;
      if (Math.abs(nf - fan) > 0.01) { fan = nf; if (!flying && !down) render(); }
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(deck);

  if (!reduced) setInterval(function () {
    if (visible && !document.hidden && !down && Date.now() - last > 3600) flip(-1);
  }, 900);
  last = Date.now();
  render(); onScroll();
})();
