/* Photo-real hero: a premiere deck of the salon's real "stars" (pet photos from its Yandex Maps card).
   Cards are fanned in 3D like a hand of posters. The top card flies off and slides to the back every few seconds;
   drag/swipe throws it by hand (tap = next); the pointer tilts the whole deck; scroll fans the cards wider and
   tips the deck back. Pure CSS 3D transforms, pauses off-screen, static under prefers-reduced-motion. */
(function () {
  var deck = document.getElementById('deck'), d3 = document.getElementById('deck3d');
  if (!deck || !d3 || !CSS.supports('transform-style', 'preserve-3d')) return;
  var PH = [
    ['maltese', 'белый пёс на жёлтом диване', 'Белый пёс сидит на жёлтом бархатном диване'],
    ['poodle-book', 'кудрявый пёс в очках', 'Кудрявый рыжий пёс в очках и свитере лежит над раскрытой книгой'],
    ['cat', 'пушистая кошка', 'Пушистая серая кошка на жёлтом диване'],
    ['pekingese', 'пекинес', 'Пушистый пекинес лежит на жёлтом диване'],
    ['yorkies', 'два йорка', 'Два йоркширских терьера с длинной шерстью'],
    ['cane-corso', 'чёрный кане-корсо', 'Большой чёрный пёс сидит на мраморном полу салона'],
    ['poodle-chair', 'рыжий пудель на стуле', 'Рыжий пудель с аккуратной стрижкой сидит на бархатном стуле']
  ];
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var N = PH.length;
  var first = d3.querySelector('.pcard');
  var cards = [first];
  for (var i = 1; i < N; i++) {
    var f = document.createElement('figure'); f.className = 'pcard';
    f.innerHTML = '<img src="img/' + PH[i][0] + '.webp" alt="' + PH[i][2] + '" loading="' + (i < 3 ? 'eager' : 'lazy') + '" decoding="async"><figcaption><small>в главной роли</small><span>' + PH[i][1] + '</span></figcaption>';
    d3.appendChild(f); cards.push(f);
  }
  cards.forEach(function (c) { var s = document.createElement('i'); s.className = 'shine'; c.appendChild(s); });
  var order = cards.map(function (_, i) { return i; }); // order[0] = top card
  var spread = 1, dragX = 0, drag = false, startX = 0, startT = 0, busy = false, visible = true, idle = 0;

  function place() {
    order.forEach(function (ci, k) {
      var c = cards[ci];
      if (k === 0 && drag) {
        c.style.transform = 'translate3d(' + dragX + 'px,' + (-Math.abs(dragX) * 0.06) + 'px,40px) rotateZ(' + (dragX * 0.05) + 'deg)';
      } else {
        var side = k % 2 ? -1 : 1, step = Math.ceil(k / 2), vis = k < 5;
        var x = k ? side * step * 12 * spread : 0, r = k ? side * step * 5.5 * spread : 0, z = -k * 55;
        c.style.transform = 'translate3d(' + x + '%,' + (k * 1.5) + '%,' + z + 'px) rotateZ(' + r + 'deg)';
        c.style.filter = 'brightness(' + (1 - Math.min(k, 4) * 0.13).toFixed(2) + ')';
        c.style.opacity = vis ? 1 : 0;
      }
      c.style.zIndex = 100 - k;
      c.classList.toggle('top', k === 0);
      c.setAttribute('aria-hidden', k === 0 ? 'false' : 'true');
    });
  }
  function next(dir) {
    if (busy) return; busy = true; idle = 0;
    var top = cards[order[0]];
    top.classList.remove('drag');
    top.style.transform = 'translate3d(' + (dir * 120) + '%,-6%,60px) rotateZ(' + (dir * 18) + 'deg)';
    setTimeout(function () { order.push(order.shift()); place(); busy = false; }, reduced ? 0 : 330);
  }

  deck.addEventListener('pointerdown', function (e) {
    if (busy) return; drag = true; startX = e.clientX; startT = performance.now(); dragX = 0;
    deck.setPointerCapture(e.pointerId); deck.classList.add('grab'); cards[order[0]].classList.add('drag');
  });
  deck.addEventListener('pointermove', function (e) {
    var r = deck.getBoundingClientRect();
    if (e.pointerType === 'mouse' && !reduced) { tx = ((e.clientX - r.left) / r.width - .5) * 2; ty = ((e.clientY - r.top) / r.height - .5) * 2; }
    if (!drag) return; dragX = e.clientX - startX; place();
  });
  function end() {
    if (!drag) return; drag = false; deck.classList.remove('grab');
    var top = cards[order[0]]; top.classList.remove('drag');
    var v = dragX / Math.max(1, performance.now() - startT);
    if (Math.abs(dragX) > 70 || Math.abs(v) > 0.5) next(dragX < 0 ? -1 : 1);
    else if (Math.abs(dragX) < 6) next(1);
    else place();
    dragX = 0; idle = 0;
  }
  deck.addEventListener('pointerup', end); deck.addEventListener('pointercancel', end);
  deck.addEventListener('pointerleave', function () { tx = 0; ty = 0; });
  deck.tabIndex = 0;
  deck.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(e.key === 'ArrowLeft' ? -1 : 1); } });

  var scrollP = 0, tx = 0, ty = 0, px = 0, py = 0, lastSpread = -1;
  function onScroll() { var r = deck.getBoundingClientRect(); scrollP = Math.min(1, Math.max(0, (innerHeight * 0.35 - r.top) / (r.height * 1.1))); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(deck);

  place();
  if (reduced) return;
  var last = performance.now();
  (function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(64, now - last); last = now;
    if (!visible || document.hidden) return;
    if (!drag && !busy) { idle += dt; if (idle > 3600) next(1); }
    px += (tx - px) * 0.08; py += (ty - py) * 0.08;
    d3.style.transform = 'rotateX(' + (-py * 6 + scrollP * 16).toFixed(2) + 'deg) rotateY(' + (px * 10).toFixed(2) + 'deg)';
    spread = 1 + scrollP * 0.9;
    if (Math.abs(spread - lastSpread) > 0.01 && !drag && !busy) { lastSpread = spread; place(); }
  })(last);
})();
