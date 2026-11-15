/* Photo-real hero: a 3D ring of Natalya's real cake photos (from her Yandex Maps card).
   Pure CSS 3D (fast on any phone): auto-turns, drag/swipe to spin, scroll tilts the ring
   and pushes the front cake forward. Falls back to the SVG if 3D transforms are unsupported. */
(function () {
  var stage = document.getElementById('heroStage');
  if (!stage || !CSS.supports('transform-style', 'preserve-3d')) return;
  var PHOTOS = [
    ['cake-berry-dark', 'Торт с малиной и ежевикой'], ['cake-strawberry', 'Торт с клубникой на юбилей'],
    ['cake-cherry', 'Торт с вишней · «60»'], ['cake-flowers', 'Торт с живыми цветами'], ['cake-red', 'Красный муссовый торт'],
    ['cake-wedding', 'Свадебный торт, три яруса'], ['cake-yellow', 'Жёлтый муссовый торт'], ['cake-napoleon', 'Торт со свечами и ягодами']
  ];
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var N = PHOTOS.length, STEP = 360 / N;

  var wrap = document.createElement('div'); wrap.className = 'ring3d';
  var tilt = document.createElement('div'); tilt.className = 'ring-tilt';
  var rot = document.createElement('div'); rot.className = 'ring-rot';
  var cards = PHOTOS.map(function (p, i) {
    var c = document.createElement('figure'); c.className = 'rcard';
    c.innerHTML = '<img src="img/' + p[0] + '.webp" alt="' + p[1] + ' — работа Натальи Пахомовой" draggable="false" ' + (i > 2 && i < N - 2 ? 'loading="lazy" ' : '') + 'decoding="async"><span class="glare"></span>';
    rot.appendChild(c); return c;
  });
  tilt.appendChild(rot); wrap.appendChild(tilt); stage.prepend(wrap);
  var hint = document.createElement('span'); hint.className = 'hint3d'; hint.textContent = '↻ листайте торты · свайп'; stage.appendChild(hint);
  var oldCap = stage.querySelector('.cap'); if (oldCap) oldCap.style.display = 'none';
  var capEl = document.createElement('p'); capEl.className = 'cap ring-cap'; capEl.innerHTML = '<small>работы Натальи · фото с Яндекс Карт</small><span></span>'; stage.appendChild(capEl);
  var cap = capEl.querySelector('span');
  stage.classList.add('has-ring');

  var angle = 0, vel = reduced ? 0 : -0.06, drag = false, lastX = 0, scrollP = 0, R = 0, front = -1, visible = true;
  function layout() {
    var w = wrap.clientWidth;
    var cw = Math.min(w * 0.46, 300);
    wrap.style.setProperty('--cw', cw + 'px');
    R = Math.round(cw / 2 / Math.tan(Math.PI / N) * 1.08);
    cards.forEach(function (c, i) { c.style.transform = 'rotateY(' + (i * STEP) + 'deg) translateZ(' + R + 'px)'; });
  }
  new ResizeObserver(layout).observe(wrap); layout();

  wrap.addEventListener('pointerdown', function (e) { drag = true; lastX = e.clientX; wrap.setPointerCapture(e.pointerId); wrap.classList.add('grab'); });
  wrap.addEventListener('pointermove', function (e) { if (!drag) return; var dx = e.clientX - lastX; lastX = e.clientX; angle += dx * 0.35; vel = dx * 0.08; });
  function end() { drag = false; wrap.classList.remove('grab'); }
  wrap.addEventListener('pointerup', end); wrap.addEventListener('pointercancel', end);

  function onScroll() { var r = stage.getBoundingClientRect(); scrollP = Math.min(1, Math.max(0, (innerHeight * 0.45 - r.top) / (r.height * 0.9))); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(stage);

  function tick() {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    if (!drag) { angle += vel; vel += ((reduced ? 0 : -0.06) - vel) * 0.03; }
    // ease toward a card when nearly stopped after a drag, so one cake always faces the viewer
    var tiltX = -6 - scrollP * 16, lift = scrollP * 40, zoom = 1 + scrollP * 0.08;
    tilt.style.transform = 'translateY(' + (-lift) + 'px) rotateX(' + tiltX + 'deg) scale(' + zoom + ')';
    rot.style.transform = 'translateZ(' + (-R) + 'px) rotateY(' + angle + 'deg)';
    var best = 0, bestCos = -2;
    cards.forEach(function (c, i) {
      var a = ((i * STEP + angle) % 360 + 360) % 360, rad = a * Math.PI / 180, cos = Math.cos(rad);
      var light = 0.45 + 0.55 * Math.max(0, cos);
      c.style.filter = 'brightness(' + light.toFixed(3) + ') saturate(' + (0.7 + 0.3 * Math.max(0, cos)).toFixed(3) + ')';
      c.style.setProperty('--gx', (50 + Math.sin(rad) * 60).toFixed(1) + '%');
      c.style.zIndex = Math.round(cos * 100) + 100;
      if (cos > bestCos) { bestCos = cos; best = i; }
    });
    if (best !== front) { front = best; if (cap) cap.textContent = PHOTOS[best][1]; cards.forEach(function (c, i) { c.classList.toggle('front', i === best); }); }
  }
  tick();
})();
