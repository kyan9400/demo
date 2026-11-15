/* Photo-real hero: a cinematic full-bleed film of the shop's real photos (Yandex Maps card).
   Slow Ken-Burns zoom on each shot, crossfades every few seconds, swipe/drag to change,
   scroll pushes the film down and in (parallax). Paused off-screen; static if reduced motion. */
(function () {
  var hero = document.getElementById('hero'), film = document.getElementById('film');
  if (!hero || !film) return;
  var slides = [].slice.call(film.querySelectorAll('.fs'));
  var bars = [].slice.call(document.querySelectorAll('#filmBars i'));
  var nEl = document.getElementById('filmN'), capEl = document.getElementById('filmCap');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var N = slides.length, cur = 0, DUR = 6000, timer = 0, visible = true, left = DUR, started = 0;

  function show(i) {
    cur = (i + N) % N;
    slides.forEach(function (s, k) {
      var on = k === cur;
      if (on && !s.classList.contains('on')) { var im = s.querySelector('img'); im.loading = 'eager'; im.style.animation = 'none'; void im.offsetWidth; im.style.animation = ''; }
      s.classList.toggle('on', on);
    });
    bars.forEach(function (b, k) { b.classList.toggle('done', k < cur); b.classList.remove('run'); });
    if (!reduced && bars[cur]) { void bars[cur].offsetWidth; bars[cur].style.setProperty('--dur', DUR / 1000 + 's'); bars[cur].classList.add('run'); }
    if (nEl) nEl.textContent = String(cur + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
    if (capEl) capEl.textContent = slides[cur].getAttribute('data-cap') || '';
    // warm up the next photo so the crossfade never shows an empty frame
    var nx = slides[(cur + 1) % N].querySelector('img'); if (nx) nx.loading = 'eager';
    left = DUR; schedule();
  }
  function schedule() {
    clearTimeout(timer);
    if (reduced || !visible || document.hidden) return;
    started = Date.now();
    timer = setTimeout(function () { show(cur + 1); }, left);
  }
  function pause() { clearTimeout(timer); left = Math.max(400, left - (Date.now() - started)); }

  // swipe / drag anywhere on the hero except links and buttons
  var sx = 0, sy = 0, down = false;
  hero.addEventListener('pointerdown', function (e) { if (e.target.closest('a,button')) return; down = true; sx = e.clientX; sy = e.clientY; });
  hero.addEventListener('pointerup', function (e) {
    if (!down) return; down = false;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(cur + (dx < 0 ? 1 : -1));
  });
  hero.addEventListener('pointercancel', function () { down = false; });

  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
    var v = es[0].isIntersecting; if (v === visible) return; visible = v; if (v) schedule(); else pause();
  }).observe(hero);
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); else schedule(); });

  if (!reduced) {
    var raf = 0;
    addEventListener('scroll', function () {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var y = Math.min(pageYOffset, hero.offsetHeight);
        film.style.transform = 'translate3d(0,' + (y * 0.35).toFixed(1) + 'px,0) scale(' + (1 + y / hero.offsetHeight * 0.08).toFixed(4) + ')';
      });
    }, { passive: true });
  }
  show(0);
})();
(function () {
  var f = document.querySelector('.pl-photo');
  if (!f || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  f.addEventListener('pointermove', function (e) { var r = f.getBoundingClientRect(); f.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 8 + 'deg'); f.style.setProperty('--rx', (0.5 - (e.clientY - r.top) / r.height) * 6 + 'deg'); });
  f.addEventListener('pointerleave', function () { f.style.setProperty('--ry', '0deg'); f.style.setProperty('--rx', '0deg'); });
})();
