/* Photo-real hero: "the workshop window" — real photos of Gera's workshop from the Yandex Maps card.
   Cinematic crossfade with a slow Ken-Burns drift, scroll pushes the photo in (parallax zoom),
   swipe / drag or the tape-dots change the photo, pointer gives a subtle 3D tilt.
   Transform/opacity only, pauses off-screen, static under prefers-reduced-motion. */
(function () {
  var win = document.getElementById('win');
  if (!win) return;
  var inner = win.querySelector('.win-in');
  var imgs = [].slice.call(inner.querySelectorAll('img'));
  var capEl = document.getElementById('winT'), dotsEl = document.getElementById('winDots');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var N = imgs.length, cur = 0, shownAt = performance.now(), DUR = 6200, visible = true, scrollP = 0;
  // each photo drifts in its own direction (Ken Burns)
  var PAN = [[-1.5, -1], [2, 0.5], [-1, 1.5], [1.5, -1.2], [-2, 0.8]];
  var started = imgs.map(function (_, i) { return i === 0 ? shownAt : 0; });

  function load(i) { var im = imgs[i]; if (im && im.dataset.src) { im.src = im.dataset.src; im.removeAttribute('data-src'); } }
  load(1);

  var dots = imgs.map(function (im, i) {
    var b = document.createElement('button'); b.type = 'button';
    b.setAttribute('aria-label', 'Фото ' + (i + 1) + ': ' + im.dataset.cap);
    b.setAttribute('aria-pressed', String(i === 0));
    b.addEventListener('click', function () { win.classList.add('touched'); go(i); });
    dotsEl.appendChild(b); return b;
  });

  function go(i) {
    i = (i + N) % N; if (i === cur) return;
    load(i); load((i + 1) % N);
    imgs[cur].classList.remove('on');
    imgs[i].classList.add('on');
    cur = i; shownAt = performance.now(); started[i] = shownAt;
    dots.forEach(function (d, k) { d.setAttribute('aria-pressed', String(k === i)); });
    capEl.style.opacity = 0;
    setTimeout(function () { capEl.textContent = imgs[cur].dataset.cap; capEl.style.opacity = 1; }, 220);
  }

  // swipe / drag (horizontal only; vertical scrolling stays native via touch-action: pan-y)
  var sx = null, sy = 0;
  win.addEventListener('pointerdown', function (e) { if (e.target.closest('button')) return; sx = e.clientX; sy = e.clientY; });
  win.addEventListener('pointerup', function (e) {
    if (sx === null) return;
    var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) { win.classList.add('touched'); go(cur + (dx < 0 ? 1 : -1)); }
  });
  win.addEventListener('pointercancel', function () { sx = null; });

  // subtle tilt with a mouse
  if (!reduced && matchMedia('(hover: hover)').matches) {
    win.addEventListener('pointermove', function (e) {
      var r = win.getBoundingClientRect();
      win.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 7).toFixed(2) + 'deg');
      win.style.setProperty('--rx', ((0.5 - (e.clientY - r.top) / r.height) * 5).toFixed(2) + 'deg');
    });
    win.addEventListener('pointerleave', function () { win.style.setProperty('--ry', '0deg'); win.style.setProperty('--rx', '0deg'); });
  }

  if (reduced) return; // static photos, manual switching only

  function onScroll() { var r = win.getBoundingClientRect(); scrollP = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height))); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(win);

  function tick(now) {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) { shownAt += 16; return; }
    if (now - shownAt > DUR) go(cur + 1);
    inner.style.transform = 'translateY(' + (scrollP * 26).toFixed(1) + 'px) scale(' + (1 + scrollP * 0.12).toFixed(4) + ')';
    // Ken Burns on the current photo and the one fading out
    for (var i = 0; i < N; i++) {
      if (!started[i]) continue;
      var t = Math.min(1, (now - started[i]) / (DUR + 1600));
      if (t >= 1 && i !== cur) { started[i] = 0; continue; }
      var p = PAN[i % PAN.length], s = 1.04 + t * 0.1;
      imgs[i].style.transform = 'translate(' + (p[0] * t).toFixed(2) + '%,' + (p[1] * t).toFixed(2) + '%) scale(' + s.toFixed(4) + ')';
    }
  }
  requestAnimationFrame(tick);
})();

/* workshop photo: subtle pointer tilt */
(function () {
  var f = document.querySelector('.shop-photo');
  if (!f || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  f.addEventListener('pointermove', function (e) {
    var r = f.getBoundingClientRect();
    f.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 10 + 'deg');
    f.style.setProperty('--rx', (0.5 - (e.clientY - r.top) / r.height) * 8 + 'deg');
  });
  f.addEventListener('pointerleave', function () { f.style.setProperty('--ry', '0deg'); f.style.setProperty('--rx', '0deg'); });
})();
