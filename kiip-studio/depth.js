/* Photo-real hero for Киип студия: a depth gallery of the studio's real photos (Yandex Maps card).
   One photo fills the arch niche; four more float in front of it at different depths, shaped like
   nail tips. Pointer (or phone tilt) and scroll move the layers at different speeds; tap a floating
   tip to bring that photo into the arch. Pauses off-screen; static with prefers-reduced-motion. */
(function () {
  var stage = document.getElementById('dg');
  if (!stage) return;
  var PHOTOS = [
    ['nails-green-french', 'зелёный френч'],
    ['nails-red-dots', 'дизайн с поцелуями'],
    ['polish-wall', 'стена гель-лаков'],
    ['nails-lavender', 'лавандовый дизайн'],
    ['nails-red', 'красный глянец']
  ];
  // tile slots: left/top in % of the stage, width, depth (parallax strength), tilt
  var SLOTS = [
    { l: 0, t: 9, w: 23, d: 0.9, r: -8, tm: 7.5, dl: 0 },
    { l: 78, t: 3, w: 21, d: 0.6, r: 7, tm: 6.5, dl: -2 },
    { l: 80, t: 47, w: 19, d: 1.15, r: 9, tm: 8, dl: -4 },
    { l: 3, t: 47, w: 17, d: 0.75, r: -6, tm: 7, dl: -1 }
  ];
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var arch = stage.querySelector('.arch'), main = stage.querySelector('.dg-main'), cap = document.getElementById('dgCap');
  var figs = PHOTOS.map(function (p, i) {
    var f = document.createElement('figure');
    f.innerHTML = '<img src="img/' + p[0] + '.webp" alt="' + p[1] + ' — работа студии" draggable="false" decoding="async"' + (i ? ' loading="lazy"' : '') + '>';
    main.appendChild(f); return f;
  });
  var order = [0, 1, 2, 3, 4]; // order[0] is in the arch, order[1..4] are the floating tips
  var tiles = SLOTS.map(function (s, k) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'dg-tile';
    b.style.left = s.l + '%'; b.style.top = s.t + '%'; b.style.setProperty('--w', s.w + '%');
    b.style.setProperty('--r', s.r + 'deg'); b.style.setProperty('--t', s.tm + 's'); b.style.setProperty('--d', s.dl + 's');
    b.innerHTML = '<span class="bob"><span class="tipimg"><img alt="" draggable="false" decoding="async"></span></span>';
    b.addEventListener('click', function () { swap(k + 1, true); });
    stage.appendChild(b); return b;
  });
  function paintTile(k) {
    var p = PHOTOS[order[k + 1]], b = tiles[k], img = b.querySelector('img');
    img.src = 'img/' + p[0] + '.webp'; img.alt = p[1];
    b.setAttribute('aria-label', 'Показать крупно: ' + p[1]);
  }
  function paintMain() {
    figs.forEach(function (f, i) { f.classList.toggle('on', i === order[0]); });
    cap.textContent = PHOTOS[order[0]][1];
    var img = figs[order[0]].querySelector('img'); if (img.loading === 'lazy') img.loading = 'eager';
  }
  function swap(slot, user) {
    var t = order[0]; order[0] = order[slot]; order[slot] = t;
    var img = tiles[slot - 1].querySelector('img');
    img.style.opacity = 0;
    setTimeout(function () { paintTile(slot - 1); img.style.opacity = 1; }, reduced ? 0 : 260);
    paintMain();
    if (user) restart();
  }
  tiles.forEach(function (b, k) { paintTile(k); }); paintMain();

  // gentle auto-play: every few seconds the next floating tip trades places with the arch photo
  var timer = 0, visible = true, nextSlot = 1;
  function restart() {
    clearInterval(timer); if (reduced) return;
    timer = setInterval(function () { if (visible && !document.hidden) { swap(nextSlot, false); nextSlot = nextSlot % 4 + 1; } }, 4600);
  }

  // parallax: pointer / device tilt + scroll; eased in a rAF loop that sleeps when settled
  var tx = 0, ty = 0, sp = 0, cx = 0, cy = 0, cs = 0, raf = 0;
  function loop() {
    raf = 0;
    cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08; cs += (sp - cs) * 0.15;
    tiles.forEach(function (b, k) {
      var d = SLOTS[k].d;
      b.style.transform = 'translate3d(' + (cx * d * 30).toFixed(2) + 'px,' + (cy * d * 20 - cs * d * 110).toFixed(2) + 'px,' + (d * 40).toFixed(1) + 'px) rotateY(' + (cx * 10).toFixed(2) + 'deg) rotateX(' + (-cy * 8).toFixed(2) + 'deg)';
    });
    main.style.transform = 'translate3d(' + (cx * -8).toFixed(2) + 'px,' + (cy * -6 + cs * 26).toFixed(2) + 'px,0) scale(' + (1 + cs * 0.07).toFixed(4) + ')';
    if (Math.abs(tx - cx) + Math.abs(ty - cy) + Math.abs(sp - cs) > 0.001) kick();
  }
  function kick() { if (!raf && visible) raf = requestAnimationFrame(loop); }
  if (!reduced) {
    stage.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = stage.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5; kick();
    });
    stage.addEventListener('pointerleave', function () { tx = ty = 0; kick(); });
    addEventListener('deviceorientation', function (e) {
      if (e.gamma == null) return;
      tx = Math.max(-0.5, Math.min(0.5, e.gamma / 50)); ty = Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 70)); kick();
    });
    addEventListener('scroll', function () {
      var r = stage.getBoundingClientRect(); sp = Math.min(1, Math.max(0, -r.top / r.height + 0.15)); kick();
    }, { passive: true });
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
    visible = es[0].isIntersecting; stage.classList.toggle('paused', !visible); if (visible) kick();
  }).observe(stage);
  loop(); restart();
})();

/* "Студия и работы": subtle pointer tilt on the main photo */
(function () {
  var f = document.querySelector('.room-photo');
  if (!f || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  f.addEventListener('pointermove', function (e) {
    var r = f.getBoundingClientRect();
    f.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 10 + 'deg');
    f.style.setProperty('--rx', (0.5 - (e.clientY - r.top) / r.height) * 8 + 'deg');
  });
  f.addEventListener('pointerleave', function () { f.style.setProperty('--ry', '0deg'); f.style.setProperty('--rx', '0deg'); });
})();
