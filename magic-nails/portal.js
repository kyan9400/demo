/* Photo-real hero for Magic Nails: the twilight "sky disc" becomes a moon-portal of the studio's real
   work (photos from its Yandex Maps card). The round photo flips over in 3D to the next work; the other
   works orbit it as small moons on a tilted ellipse (in front of / behind the disc, lit by depth).
   Tap a moon or swipe the disc to flip; the pointer tilts the disc, scroll tips the orbit back.
   Pure CSS 3D + small JS. Pauses off-screen; with prefers-reduced-motion nothing moves by itself. */
(function () {
  var stage = document.getElementById('stage');
  if (!stage || !CSS.supports('transform-style', 'preserve-3d')) return;
  var PHOTOS = [
    ['green', 'Зелёный маникюр с тонким декором'], ['milk-almond', 'Молочный миндаль'],
    ['pink', 'Яркий розовый маникюр'], ['blue-art', 'Голубой маникюр с рисунком'],
    ['lilac', 'Лавандовый маникюр'], ['red-pedi', 'Красный педикюр']
  ];
  var N = PHOTOS.length;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function src(i) { return 'img/' + PHOTOS[i][0] + '.webp'; }

  var root = document.createElement('div'); root.className = 'portal';
  root.innerHTML =
    '<div class="p-halo"></div>' +
    '<div class="p-orbit"></div>' +
    '<div class="p-tilt"><div class="p-disc">' +
      '<div class="p-face a"><img src="' + src(0) + '" alt="" draggable="false" decoding="async"></div>' +
      '<div class="p-face b"><img src="' + src(1) + '" alt="" draggable="false" decoding="async" loading="lazy"></div>' +
    '</div><span class="p-glare"></span><span class="p-rim"></span></div>';
  stage.prepend(root);
  var orbit = root.querySelector('.p-orbit'), tiltEl = root.querySelector('.p-tilt'), disc = root.querySelector('.p-disc');
  var faces = [root.querySelector('.p-face.a img'), root.querySelector('.p-face.b img')];
  var moons = PHOTOS.map(function (p, i) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'moon'; b.tabIndex = -1;
    b.setAttribute('aria-label', p[1]);
    b.innerHTML = '<img src="' + src(i) + '" alt="" draggable="false" decoding="async"' + (i > 2 ? ' loading="lazy"' : '') + '>';
    b.addEventListener('click', function (e) { e.stopPropagation(); go(i, i > cur ? 1 : -1); restart(); });
    orbit.appendChild(b); return b;
  });
  var cap = document.createElement('p'); cap.className = 'p-cap';
  cap.innerHTML = '<small>работы студии · фото с Яндекс Карт</small><span></span>';
  stage.appendChild(cap);
  var capTxt = cap.querySelector('span');
  stage.classList.add('has-portal');

  // ---- flip ----
  var cur = 0, flips = 0, spin = 0;
  function setCap() { capTxt.textContent = PHOTOS[cur][1]; moons.forEach(function (m, i) { m.classList.toggle('on', i === cur); }); }
  function go(i, dir) {
    i = (i + N) % N; if (i === cur) return;
    var back = faces[(flips + 1) % 2];
    back.removeAttribute('loading'); back.src = src(i);
    flips++; spin += dir < 0 ? -180 : 180;
    disc.style.transform = 'rotateY(' + spin + 'deg)';
    cur = i; setCap();
    // preload the one after next
    var pre = new Image(); pre.src = src((i + 1) % N);
  }
  setCap();

  // ---- auto-advance ----
  var timer = 0, visible = true;
  function restart() { clearInterval(timer); if (!reduced) timer = setInterval(function () { if (visible && !document.hidden) go(cur + 1, 1); }, 4200); }
  restart();

  // ---- swipe on the disc / pointer tilt ----
  var down = null, px = 0, py = 0, tx = 0, ty = 0;
  tiltEl.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY }; });
  addEventListener('pointerup', function (e) {
    if (!down) return; var dx = e.clientX - down.x, dy = e.clientY - down.y; down = null;
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) { go(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); restart(); }
    else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) { go(cur + 1, 1); restart(); }
  });
  addEventListener('pointercancel', function () { down = null; });
  stage.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var r = stage.getBoundingClientRect();
    px = (e.clientX - r.left) / r.width - .5; py = (e.clientY - r.top) / r.height - .5;
  });
  stage.addEventListener('pointerleave', function () { px = py = 0; });

  // ---- scroll & visibility ----
  var scrollP = 0;
  function onScroll() { var r = stage.getBoundingClientRect(); scrollP = Math.min(1, Math.max(0, -r.top / (r.height * .9))); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(stage);

  // ---- orbit ----
  var t = 0.6, W = 0;
  function size() { W = root.clientWidth; root.style.setProperty('--w', W + 'px'); }
  new ResizeObserver(size).observe(root); size();
  function frame() {
    var rx = W * .41, ry = W * (.25 + scrollP * .06), cx = W * .5, cy = W * .5;
    var ro = (-9 + tx * 6) * Math.PI / 180, cr = Math.cos(ro), sr = Math.sin(ro);   // tilted orbit plane
    moons.forEach(function (m, i) {
      var a = t + i * Math.PI * 2 / N, s = Math.sin(a), c = Math.cos(a);
      var depth = (s + 1) / 2;                    // 0 = behind the disc, 1 = in front
      var sc = .62 + depth * .48;
      var ox = c * rx, oy = s * ry - (1 - depth) * W * .02;
      var x = cx + ox * cr - oy * sr, y = cy + ox * sr + oy * cr;
      m.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%) scale(' + sc.toFixed(3) + ')';
      m.style.zIndex = s > 0 ? 6 : 1;
      m.style.opacity = (.55 + depth * .45).toFixed(2);
      m.style.filter = 'brightness(' + (.7 + depth * .35).toFixed(2) + ')';
    });
    tx += (px - tx) * .08; ty += (py - ty) * .08;
    tiltEl.style.transform = 'rotateX(' + (-ty * 14 + scrollP * 10).toFixed(2) + 'deg) rotateY(' + (tx * 16).toFixed(2) + 'deg)';
    root.style.setProperty('--gx', (50 + tx * 90).toFixed(1) + '%');
    root.style.setProperty('--gy', (20 + ty * 70).toFixed(1) + '%');
  }
  function tick() {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    if (!reduced) t += .0032;
    frame();
  }
  if (reduced) { frame(); addEventListener('scroll', frame, { passive: true }); new ResizeObserver(frame).observe(root); }
  else tick();
})();
