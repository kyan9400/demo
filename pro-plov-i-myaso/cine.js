/* Photo-real hero for «Про Плов и Мясо»: a cinematic full-bleed of the café's own dishes (photos from its
   Yandex Maps card). Slow Ken Burns on each photo, crossfade every few seconds, story-style ticks to jump,
   swipe left/right on phones, scroll pushes the photo in and down (parallax), the mouse nudges it.
   Pauses off-screen / in a hidden tab; under prefers-reduced-motion it stays on one still photo. */
(function () {
  var box = document.getElementById('hcine'), move = document.getElementById('hcMove'), hero = document.getElementById('hero');
  if (!box || !move || !hero) return;
  var slides = [].slice.call(move.querySelectorAll('.hc-s')), cap = document.getElementById('hcCap'), ticks = document.getElementById('hcTicks');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches, DUR = 6000;
  var cur = 0, timer = 0, left = DUR, started = 0, visible = true;
  if (reduced) box.classList.add('still');
  box.style.setProperty('--dur', DUR + 'ms');

  function load(i) { var im = slides[i]; if (im && im.dataset.src) { im.src = im.dataset.src; im.removeAttribute('data-src'); } }
  // fetch the rest only after the first photo is in, so the hero paints fast
  function loadRest() { slides.forEach(function (_, i) { load(i); }); }
  if (slides[0].complete) setTimeout(loadRest, 300); else slides[0].addEventListener('load', function () { setTimeout(loadRest, 300); });

  ticks.innerHTML = slides.map(function (im, i) { return '<button type="button" aria-label="Фото ' + (i + 1) + ': ' + im.dataset.cap + '"><i></i></button>'; }).join('');
  var tb = [].slice.call(ticks.children);
  tb.forEach(function (b, i) { b.addEventListener('click', function () { go(i); }); });

  function paintTicks() {
    tb.forEach(function (b, i) {
      b.classList.toggle('done', i < cur); b.classList.remove('cur');
      if (i === cur) { void b.offsetWidth; b.classList.add('cur'); }
      b.setAttribute('aria-current', i === cur ? 'true' : 'false');
    });
  }
  function go(i) {
    i = (i + slides.length) % slides.length; load(i);
    slides[cur].classList.remove('on');
    var im = slides[i]; im.classList.remove('on'); void im.offsetWidth; im.classList.add('on');
    cur = i; if (cap) cap.textContent = im.dataset.cap; paintTicks(); schedule(DUR);
  }
  function schedule(ms) {
    clearTimeout(timer); if (reduced) return;
    left = ms; started = Date.now();
    if (visible && !document.hidden) timer = setTimeout(function () { go(cur + 1); }, ms);
  }
  function pause() { if (reduced || !timer) return; clearTimeout(timer); timer = 0; left = Math.max(400, left - (Date.now() - started)); setPlay('paused'); }
  function resume() { if (reduced || timer) return; setPlay('running'); schedule(left); }
  function setPlay(v) { box.classList.toggle('hold', v === 'paused'); }

  new IntersectionObserver(function (es) {
    visible = es[0].isIntersecting;
    if (visible) resume(); else pause();
  }).observe(box);
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); else if (visible) resume(); });

  // swipe anywhere on the hero photo/text (not on links/buttons)
  var sx = 0, sy = 0, down = false;
  hero.addEventListener('pointerdown', function (e) { if (e.target.closest('a,button,input')) return; down = true; sx = e.clientX; sy = e.clientY; });
  hero.addEventListener('pointerup', function (e) {
    if (!down) return; down = false;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) go(cur + (dx < 0 ? 1 : -1));
  });
  hero.addEventListener('pointercancel', function () { down = false; });

  // scroll + pointer parallax on the wrapper (transform only)
  var sp = 0, mx = 0, my = 0, tmx = 0, tmy = 0, raf = 0;
  function apply() {
    raf = 0; mx += (tmx - mx) * 0.12; my += (tmy - my) * 0.12;
    move.style.transform = 'translate3d(' + (mx * -14).toFixed(2) + 'px,' + (sp * 70 + my * -10).toFixed(2) + 'px,0) scale(' + (1 + sp * 0.1).toFixed(4) + ')';
    if (Math.abs(tmx - mx) > 0.002 || Math.abs(tmy - my) > 0.002) raf = requestAnimationFrame(apply);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(apply); }
  if (!reduced) {
    addEventListener('scroll', function () { var r = hero.getBoundingClientRect(); sp = Math.min(1, Math.max(0, -r.top / r.height)); if (visible) kick(); }, { passive: true });
    hero.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; tmx = e.clientX / innerWidth - 0.5; tmy = e.clientY / innerHeight - 0.5; kick(); });
  }
  paintTicks(); schedule(DUR);
})();
