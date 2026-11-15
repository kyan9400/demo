/* Photo-real hero: a 3D cover-flow wall of real dishes and tea from the café's Yandex Maps card.
   Pure CSS 3D + a little JS: drifts on its own, drag/swipe to slide, the front card is lit,
   pauses off-screen, static for prefers-reduced-motion. The sky photo zooms gently with scroll. */
(function () {
  var reel = document.getElementById('reel'), inner = document.getElementById('reelIn');
  if (!reel || !inner) return;
  var PHOTOS = [
    ['iskender', 'искендер на медном блюде'], ['doner-wrap', 'донер в лаваше'], ['tea-baklava', 'чай и пахлава'],
    ['pide', 'пиде с фаршем'], ['doner-plate', 'донер на тарелке'], ['tea-copper', 'медный чайник и чай']
  ];
  var N = PHOTOS.length, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cap = document.getElementById('reelCap');
  var cards = PHOTOS.map(function (p, i) {
    var f = document.createElement('figure'); f.className = 'rc';
    f.innerHTML = '<img src="img/' + p[0] + '.webp" alt="' + p[1] + ' — фото с Яндекс Карт" draggable="false" ' + (i > 1 && i < N - 1 ? 'loading="lazy" ' : '') + 'decoding="async">';
    inner.appendChild(f); return f;
  });
  var pos = 0, vel = 0, drag = false, lastX = 0, lastT = 0, visible = true, front = -1, idleAt = 0;
  var cw = 200;
  function measure() { cw = cards[0].offsetWidth || 200; }
  new ResizeObserver(measure).observe(reel); measure();

  function render() {
    var spacing = cw * (innerWidth < 700 ? 0.62 : 0.78), best = 0, bestD = 99;
    cards.forEach(function (c, i) {
      var d = i - pos; d = ((d % N) + N + N / 2) % N - N / 2;      // wrap to [-N/2, N/2)
      var ad = Math.abs(d), s = d < 0 ? -1 : 1;
      var x = s * (Math.min(ad, 1) * spacing * 1.15 + Math.max(0, ad - 1) * spacing * 0.8);
      var rot = -s * Math.min(ad, 1.4) * 34;
      c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,' + (-ad * 140).toFixed(1) + 'px) rotateY(' + rot.toFixed(1) + 'deg)';
      c.style.zIndex = String(100 - Math.round(ad * 10));
      c.style.opacity = ad > 2.6 ? Math.max(0, 3.2 - ad).toFixed(2) : '1';
      c.style.filter = 'brightness(' + (1 - Math.min(ad, 2.5) * 0.2).toFixed(2) + ')';
      if (ad < bestD) { bestD = ad; best = i; }
    });
    if (best !== front) {
      front = best; if (cap) cap.textContent = PHOTOS[best][1];
      cards.forEach(function (c, i) { c.classList.toggle('front', i === best); });
    }
  }

  reel.addEventListener('pointerdown', function (e) { drag = true; lastX = e.clientX; lastT = performance.now(); vel = 0; reel.setPointerCapture(e.pointerId); reel.classList.add('grab'); });
  reel.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var now = performance.now(), dx = e.clientX - lastX; lastX = e.clientX;
    var spacing = cw * (innerWidth < 700 ? 0.62 : 0.78);
    pos -= dx / spacing; vel = -dx / spacing / Math.max(8, now - lastT) * 16; lastT = now;
    render();
  });
  function end() { if (!drag) return; drag = false; reel.classList.remove('grab'); idleAt = performance.now(); }
  reel.addEventListener('pointerup', end); reel.addEventListener('pointercancel', end);

  // the sky photo drifts with scroll (parallax)
  var stage = document.getElementById('hero'), shots = stage ? stage.querySelectorAll('.shot') : [];
  function onScroll() {
    if (reduced || !stage) return;
    var r = stage.getBoundingClientRect(), p = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height)));
    for (var i = 0; i < shots.length; i++) shots[i].style.transform = 'translate3d(0,' + (p * 120).toFixed(1) + 'px,0) scale(' + (1 + p * 0.1).toFixed(3) + ')';
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(reel);

  render();
  if (reduced) return;
  (function tick(now) {
    requestAnimationFrame(tick);
    if (!visible || document.hidden || drag) return;
    if (Math.abs(vel) > 0.0005) { pos += vel; vel *= 0.93; idleAt = now; }
    else if (now - idleAt > 1800) pos += 0.0032;                         // slow drift
    else { var t = Math.round(pos); pos += (t - pos) * 0.08; }           // settle on a card
    render();
  })(performance.now());
})();
(function () {
  var f = document.querySelector('.place-photo');
  if (!f || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  f.addEventListener('pointermove', function (e) { var r = f.getBoundingClientRect(); f.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 10 + 'deg'); f.style.setProperty('--rx', (.5 - (e.clientY - r.top) / r.height) * 8 + 'deg'); });
  f.addEventListener('pointerleave', function () { f.style.setProperty('--ry', '0deg'); f.style.setProperty('--rx', '0deg'); });
})();
