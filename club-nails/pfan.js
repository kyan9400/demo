/* Photo-real hero for Клаб Нейлс: real nail photos from the studio's Yandex Maps card, fanned out
   like polish swatches inside the Art Deco arch. Pure CSS 3D + small JS: the fan flips to the next
   work by itself, swipe/drag or tap a side card to choose, scroll opens the fan wider and tips it back.
   Static (no auto-advance) with prefers-reduced-motion. */
(function () {
  var stage = document.getElementById('pfan');
  if (!stage) return;
  var PHOTOS = [
    ['nails-sky', 'нежно-голубой квадрат', '#c9d3ea'],
    ['nails-french-glitter', 'френч с блёстками', '#f1d6d0'],
    ['nails-red', 'красный миндаль', '#8a1f2c'],
    ['nails-nude-crystals', 'нюд со стразами', '#e2b9a2'],
    ['nails-pink', 'розовый глянец', '#f08cb0'],
    ['nails-french', 'френч с кольцами', '#efe3da'],
    ['nails-coral-french', 'коралловый френч', '#ff5a3c']
  ];
  var N = PHOTOS.length, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rot = stage.querySelector('.pf-rot'), capEl = document.getElementById('pfCap'), dotsEl = document.getElementById('pfDots');
  var cards = PHOTOS.map(function (p, i) {
    var f = document.createElement('figure'); f.className = 'fcard';
    f.innerHTML = '<img src="img/' + p[0] + '.webp" alt="' + p[1] + ' — работа мастера студии" draggable="false"' + (i > 1 && i < N - 1 ? ' loading="lazy"' : '') + ' decoding="async"><span class="glare"></span>';
    rot.appendChild(f); return f;
  });
  var dots = PHOTOS.map(function (p, i) {
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Работа ' + (i + 1) + ': ' + p[1]);
    b.addEventListener('click', function () { go(i, true); });
    dotsEl.appendChild(b); return b;
  });
  stage.tabIndex = 0;

  var pos = 0, cw = 170, spread = 14, scrollP = 0, tx = 0, ty = 0, visible = true, front = -1, timer = 0;
  function wrapK(k) { k = ((k % N) + N) % N; return k > N / 2 ? k - N : k; }
  function layout() { cw = Math.round(stage.clientWidth * 0.46); stage.style.setProperty('--cw', cw + 'px'); render(); }
  function render() {
    spread = 15 + scrollP * 8;
    rot.style.transform = 'rotateX(' + (scrollP * 16 + ty * 5).toFixed(2) + 'deg) rotateY(' + (tx * 9).toFixed(2) + 'deg)';
    var best = 0, bestA = 9;
    cards.forEach(function (c, i) {
      var k = wrapK(i - pos), a = Math.abs(k);
      var lift = Math.max(0, 1 - a) * cw * 0.1;
      c.style.transform = 'rotateZ(' + (k * spread).toFixed(2) + 'deg) translateY(' + (-lift).toFixed(1) + 'px) translateZ(' + (-a * 34 + (a < 1 ? 30 : 0)).toFixed(1) + 'px) rotateY(' + (-k * 6).toFixed(2) + 'deg) scale(' + (1 + Math.max(0, 1 - a) * 0.06).toFixed(3) + ')';
      c.style.filter = 'brightness(' + (1 - Math.min(a, 3) * 0.16).toFixed(3) + ') saturate(' + (1 - Math.min(a, 3) * 0.12).toFixed(3) + ')';
      c.style.opacity = a > 2.6 ? 0 : 1;
      c.style.zIndex = 20 - Math.round(a * 4);
      if (a < bestA) { bestA = a; best = i; }
    });
    if (best !== front) {
      front = best;
      capEl.textContent = PHOTOS[best][1];
      cards.forEach(function (c, i) { c.classList.toggle('front', i === best); });
      dots.forEach(function (d, i) { d.setAttribute('aria-current', i === best ? 'true' : 'false'); });
    }
  }
  function go(i, user) {
    var k = wrapK(i - pos); pos = Math.round(pos + k); render();
    if (user) { stage.classList.add('touched'); document.documentElement.style.setProperty('--polish', PHOTOS[((pos % N) + N) % N][2]); restart(); }
  }
  function next() { if (visible && !document.hidden && !drag) { pos = Math.round(pos) + 1; render(); } }
  function restart() { clearInterval(timer); if (!reduced) timer = setInterval(next, 3400); }

  // drag / swipe (horizontal only; vertical page scroll stays native via touch-action: pan-y)
  var drag = false, startX = 0, startPos = 0, moved = 0, lastX = 0, vx = 0;
  stage.addEventListener('pointerdown', function (e) {
    drag = true; startX = lastX = e.clientX; startPos = pos; moved = 0; vx = 0;
    stage.setPointerCapture(e.pointerId); stage.classList.add('grab', 'dragging');
  });
  stage.addEventListener('pointermove', function (e) {
    if (drag) {
      moved = Math.max(moved, Math.abs(e.clientX - startX)); vx = e.clientX - lastX; lastX = e.clientX;
      pos = startPos - (e.clientX - startX) / (cw * 0.75); render(); return;
    }
    if (e.pointerType === 'mouse' && !reduced) {
      var r = stage.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5; render();
    }
  });
  function end(e) {
    if (!drag) return; drag = false; stage.classList.remove('grab', 'dragging');
    if (moved < 6) { // a tap: bring the tapped side card to the front
      var el = document.elementFromPoint(e.clientX, e.clientY), c = el && el.closest && el.closest('.fcard'), i = cards.indexOf(c);
      if (i > -1) go(i, true); else go(Math.round(pos), false);
      return;
    }
    pos = Math.round(pos - Math.max(-1, Math.min(1, vx / 12)) * 0.5); go(pos, true);
  }
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
  stage.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !drag) { tx = ty = 0; render(); } });
  stage.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(Math.round(pos) + 1, true); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(Math.round(pos) - 1, true); }
  });

  // scroll opens the fan wider and tips it back
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false; if (!visible) return;
      var r = stage.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (innerHeight * 0.35 - r.top) / (r.height * 1.1)));
      if (Math.abs(p - scrollP) > 0.004) { scrollP = reduced ? 0 : p; render(); }
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(stage);
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(stage); else addEventListener('resize', layout);
  layout(); onScroll(); restart();
})();

/* "Студия и работы": subtle pointer tilt on the main photo */
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
