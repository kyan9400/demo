/* Cinematic photo hero for «Адам»: real photos from the restaurant's Yandex Maps card.
   Slow Ken-Burns + crossfade through 4 shots, scroll pushes the photo deeper (parallax + zoom),
   pointer drifts it slightly, swipe / dots switch shots. Pauses off-screen; static with reduced motion. */
(function () {
  var hero = document.getElementById('hero'), move = document.getElementById('cineMove');
  if (!hero || !move) return;
  var figs = [].slice.call(move.querySelectorAll('.cf'));
  var CAP = {
    ru: ['мезе на большом столе', 'зал с аркой и открытой кухней', 'завтрак: шакшука и кофе', 'поднос мезе'],
    ar: ['مازة على طاولة كبيرة', 'الصالة بقوسها ومطبخها المفتوح', 'فطور: شكشوكة وقهوة', 'صينية مازة']
  };
  var DUR = 6500, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cap = document.getElementById('cineCap'), dotsBox = document.getElementById('cineDots');
  var i = 0, timer = null, visible = true;
  var L = function () { return document.documentElement.lang === 'ar' ? 'ar' : 'ru'; };
  hero.style.setProperty('--dur', DUR + 'ms');
  if (reduced) hero.classList.add('static');

  var dots = figs.map(function (f, k) {
    var b = document.createElement('button'); b.type = 'button'; b.innerHTML = '<i></i>';
    b.addEventListener('click', function () { go(k, true); });
    dotsBox.appendChild(b); return b;
  });
  function label() {
    var l = L();
    cap.textContent = CAP[l][i];
    dots.forEach(function (b, k) { b.setAttribute('aria-label', (l === 'ar' ? 'صورة ' : 'Фото ') + (k + 1) + ': ' + CAP[l][k]); b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
  }
  function go(n, user) {
    n = (n + figs.length) % figs.length;
    if (n !== i) {
      figs.forEach(function (f) { f.classList.remove('was'); });
      figs[i].classList.add('was'); figs[i].classList.remove('on');
      i = n; figs[i].classList.add('on');
      var img = figs[i].querySelector('img'); img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
    }
    dots.forEach(function (b, k) { b.classList.toggle('on', k === i); var x = b.querySelector('i'); x.style.display = 'none'; void x.offsetWidth; x.style.display = ''; });
    label(); schedule();
  }
  function schedule() {
    clearTimeout(timer);
    if (reduced || !visible || document.hidden) return;
    timer = setTimeout(function () { go(i + 1); }, DUR);
  }
  // preload the next photos once the first one is in
  addEventListener('load', function () { figs.forEach(function (f) { var im = f.querySelector('img'); im.loading = 'eager'; }); });

  // swipe on the photo
  var sx = null, sy = 0;
  hero.addEventListener('pointerdown', function (e) { if (e.target.closest('a,button,input')) return; sx = e.clientX; sy = e.clientY; });
  hero.addEventListener('pointerup', function (e) {
    if (sx === null) return; var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) { var rtl = document.documentElement.dir === 'rtl'; go(i + ((dx < 0) !== rtl ? 1 : -1), true); }
  });
  hero.addEventListener('pointercancel', function () { sx = null; });

  // scroll parallax + pointer drift (transform only)
  var px = 0, py = 0, tx = 0, ty = 0, sp = 0, raf = 0;
  function frame() {
    raf = 0;
    tx += (px - tx) * 0.08; ty += (py - ty) * 0.08;
    move.style.transform = 'translate3d(' + (tx * -14).toFixed(2) + 'px,' + (sp * 0.32 + ty * -10).toFixed(2) + 'px,0) scale(' + (1 + Math.min(sp, 700) / 700 * 0.1).toFixed(4) + ')';
    if (Math.abs(px - tx) > 0.002 || Math.abs(py - ty) > 0.002) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  if (!reduced) {
    addEventListener('scroll', function () { sp = Math.min(hero.offsetHeight, Math.max(0, scrollY - hero.offsetTop)); kick(); }, { passive: true });
    hero.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; var r = hero.getBoundingClientRect(); px = (e.clientX - r.left) / r.width - 0.5; py = (e.clientY - r.top) / r.height - 0.5; kick(); });
  }
  new IntersectionObserver(function (es) {
    visible = es[0].isIntersecting; hero.classList.toggle('paused', !visible); if (visible) { sp = Math.min(hero.offsetHeight, Math.max(0, scrollY - hero.offsetTop)); kick(); }
    figs.forEach(function (f) { var im = f.querySelector('img'); im.style.animationPlayState = visible ? '' : 'paused'; });
    schedule();
  }).observe(hero);
  document.addEventListener('visibilitychange', schedule);
  new MutationObserver(function () { label(); swapAlts(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  // bilingual alt texts for the hall section
  function swapAlts() { var l = L(); [].forEach.call(document.querySelectorAll('[data-alt-ru]'), function (im) { im.alt = im.getAttribute('data-alt-' + l); }); var st = document.getElementById('hallStrip'); if (st) st.setAttribute('aria-label', l === 'ar' ? 'صور المطعم' : 'Фото ресторана'); }
  swapAlts();

  // hall photo: subtle pointer tilt
  var hp = document.getElementById('hallPhoto');
  if (hp && !reduced) {
    hp.addEventListener('pointermove', function (e) { var r = hp.getBoundingClientRect(); hp.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 8).toFixed(2) + 'deg'); hp.style.setProperty('--rx', (((e.clientY - r.top) / r.height - 0.5) * -8).toFixed(2) + 'deg'); });
    hp.addEventListener('pointerleave', function () { hp.style.setProperty('--ry', '0deg'); hp.style.setProperty('--rx', '0deg'); });
  }
  go(0);
})();
