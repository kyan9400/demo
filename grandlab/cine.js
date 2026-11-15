/* Photo-real hero for Грандлаб: a cinematic "specimen window" of the salon's real photos
   (Yandex Maps card). Slow Ken-Burns drift with crossfades, story-style progress ticks,
   swipe or tap left/right to step, scroll pushes the picture in, the pointer adds a little depth.
   Pauses off-screen; with prefers-reduced-motion it is a still photo that changes only on tap. */
(function () {
  var box = document.getElementById('cine');
  if (!box) return;
  var SLIDES = [
    ['salon', 'светлый зал и стойка', '50%', '55%', '-2%', '0%'],
    ['hair-blonde-waves', 'светлые локоны', '50%', '30%', '0%', '-2%'],
    ['nails-milk', 'молочный маникюр', '45%', '45%', '1.5%', '-1%'],
    ['hair-copper', 'медно-персиковый цвет', '55%', '35%', '-1.5%', '-1.5%'],
    ['hair-blonde-soft', 'мягкие волны', '50%', '35%', '1%', '-2%']
  ];
  var N = SLIDES.length, DUR = 5200, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var inner = box.querySelector('.cine-in'), cap = document.getElementById('cineCap'), no = document.getElementById('cineNo'), bar = document.getElementById('cineBar');
  var figs = SLIDES.map(function (s, i) {
    var f = document.createElement('figure');
    f.style.setProperty('--ox', s[2]); f.style.setProperty('--oy', s[3]); f.style.setProperty('--dx', s[4]); f.style.setProperty('--dy', s[5]);
    f.innerHTML = '<img src="img/' + s[0] + '.webp" alt="' + s[1] + ' — фото салона Грандлаб" draggable="false"' + (i ? ' loading="lazy"' : ' fetchpriority="high"') + ' decoding="async">';
    inner.appendChild(f); return f;
  });
  var ticks = SLIDES.map(function (s, i) {
    var b = document.createElement('button'); b.type = 'button'; b.innerHTML = '<i></i>';
    b.setAttribute('aria-label', 'Фото ' + (i + 1) + ' из ' + N + ': ' + s[1]);
    b.addEventListener('click', function () { show(i); });
    bar.appendChild(b); return b;
  });
  box.style.setProperty('--dur', DUR / 1000 + 's');
  if (reduced) box.classList.add('still');

  var cur = -1, timer = 0, visible = true, left = DUR, started = 0;
  function show(i) {
    i = (i + N) % N;
    if (i === cur) return;
    figs.forEach(function (f, k) {
      f.classList.remove('out');
      if (k === cur) { f.classList.remove('on'); f.classList.add('out'); }
      else if (k !== i) f.classList.remove('on');
    });
    var img = figs[i].querySelector('img'); img.loading = 'eager';
    figs[i].classList.remove('on'); void figs[i].offsetWidth; figs[i].classList.add('on'); // restart the Ken-Burns drift
    ticks.forEach(function (t, k) { t.classList.toggle('done', k < i); t.classList.remove('on'); t.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    void ticks[i].offsetWidth; ticks[i].classList.add('on');
    cap.textContent = SLIDES[i][1];
    no.textContent = 'образец 0' + (i + 1) + ' / 0' + N;
    cur = i; left = DUR; schedule();
    // warm the next photo so the crossfade never shows an empty frame
    var nx = figs[(i + 1) % N].querySelector('img'); if (nx.loading === 'lazy') nx.loading = 'eager';
  }
  function schedule() {
    clearTimeout(timer);
    if (reduced || !visible || document.hidden) return;
    started = Date.now(); timer = setTimeout(function () { show(cur + 1); }, left);
  }
  function pause() { if (timer) { clearTimeout(timer); timer = 0; left = Math.max(400, left - (Date.now() - started)); } box.classList.add('paused'); }
  function resume() { box.classList.remove('paused'); schedule(); }

  box.querySelector('.cine-nav.prev').addEventListener('click', function () { show(cur - 1); });
  box.querySelector('.cine-nav.next').addEventListener('click', function () { show(cur + 1); });
  box.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });

  // horizontal swipe (vertical scroll stays native: touch-action pan-y)
  var sx = 0, sy = 0, down = false;
  box.addEventListener('pointerdown', function (e) { down = true; sx = e.clientX; sy = e.clientY; });
  box.addEventListener('pointerup', function (e) {
    if (!down) return; down = false;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) { show(cur + (dx < 0 ? 1 : -1)); suppress = true; setTimeout(function () { suppress = false; }, 50); }
  });
  var suppress = false;
  box.addEventListener('click', function (e) { if (suppress) { e.stopPropagation(); e.preventDefault(); } }, true);

  // scroll pushes the picture in; mouse adds a little parallax depth
  var sp = 0, px = 0, py = 0, raf = 0;
  function apply() {
    raf = 0;
    inner.style.transform = 'translate3d(' + (px * -14).toFixed(1) + 'px,' + (py * -10 + sp * 34).toFixed(1) + 'px,0) scale(' + (1 + sp * 0.09).toFixed(3) + ')';
  }
  function req() { if (!raf) raf = requestAnimationFrame(apply); }
  if (!reduced) {
    addEventListener('scroll', function () {
      if (!visible) return;
      var r = box.getBoundingClientRect();
      sp = Math.min(1, Math.max(0, -r.top / r.height)); req();
    }, { passive: true });
    box.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = box.getBoundingClientRect(); px = (e.clientX - r.left) / r.width - 0.5; py = (e.clientY - r.top) / r.height - 0.5; req();
    });
    box.addEventListener('pointerleave', function () { px = py = 0; req(); });
    box.addEventListener('mouseenter', pause); box.addEventListener('mouseleave', resume);
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
    visible = es[0].isIntersecting; if (visible) resume(); else pause();
  }).observe(box);
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); else resume(); });
  show(0);
})();

/* "Салон и работы": subtle pointer tilt on the main photo */
(function () {
  var f = document.querySelector('.sp-photo');
  if (!f || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  f.addEventListener('pointermove', function (e) {
    var r = f.getBoundingClientRect();
    f.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 8 + 'deg');
    f.style.setProperty('--rx', (0.5 - (e.clientY - r.top) / r.height) * 6 + 'deg');
  });
  f.addEventListener('pointerleave', function () { f.style.setProperty('--ry', '0deg'); f.style.setProperty('--rx', '0deg'); });
})();
