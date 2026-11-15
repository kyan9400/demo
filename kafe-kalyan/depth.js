/* Depth-parallax photo hero for «Кальян»: four real photos from the lounge's Yandex Maps card
   hang at different depths in one CSS-3D scene. Pointer / phone tilt / drag turn the scene so the
   layers slide past each other; scroll tips it back; swipe or tap shuffles which photo is in front.
   Pure CSS 3D + small JS (transform/opacity only). Pauses off-screen; static with reduced motion. */
(function () {
  var box = document.getElementById('depth'), scene = document.getElementById('dpScene');
  if (!box || !scene) return;
  var cards = [].slice.call(scene.querySelectorAll('.dp'));
  var CAP = {
    ru: ['кальян на арбузе', 'мезе в пиалах', 'лимонад с лаймом', 'кальяны на фруктах'],
    ar: ['شيشة على بطيخ', 'مازة في أطباق صغيرة', 'ليموناضة بالليم', 'شيشة على الفواكه']
  };
  var N = cards.length, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var slot = cards.map(function (c, k) { return (k + N - 1) % N; }); // card 0 starts in front (slot N-1)
  var cap = document.getElementById('dpCap');
  var L = function () { return document.documentElement.lang === 'ar' ? 'ar' : 'ru'; };
  var front = 0, timer = null, visible = true;

  function apply() {
    cards.forEach(function (c, k) {
      c.setAttribute('data-s', slot[k]);
      if (slot[k] === N - 1) front = k;
      var im = c.querySelector('img');
      if (im.loading === 'lazy' && slot[k] >= N - 2) im.loading = 'eager';
    });
    label();
  }
  function label() {
    var l = L(); cap.textContent = CAP[l][front];
    cards.forEach(function (c, k) {
      var im = c.querySelector('img'); im.alt = CAP[l][k] + (l === 'ar' ? ' — صورة من مقهى «كاليان»' : ' — фото из кафе «Кальян»');
    });
    box.setAttribute('aria-label', l === 'ar' ? 'صور حقيقية من المقهى · اسحب للتبديل' : 'Настоящие фото кафе · свайп — следующее');
  }
  function shift(d) { slot = slot.map(function (s) { return (s + d + N) % N; }); apply(); schedule(); }
  function bring(k) { var steps = (N - 1 - slot[k] + N) % N; if (steps) shift(steps); }
  function schedule() {
    clearTimeout(timer);
    if (reduced || !visible || document.hidden) return;
    timer = setTimeout(function () { shift(1); }, 4800);
  }
  box.setAttribute('role', 'group');
  apply();

  /* input: pointer / drag / swipe / tap / gyro / scroll */
  var tx = 0, ty = 0, cx = 0, cy = 0, drag = 0, dragV = 0, down = null, sp = 0, t0 = performance.now(), gyro = false;
  box.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY, t: Date.now(), k: e.target.closest('.dp') }; box.classList.add('grab'); });
  box.addEventListener('pointermove', function (e) {
    var r = box.getBoundingClientRect();
    if (e.pointerType === 'mouse' && !gyro) { tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5; }
    if (down) { drag = Math.max(-1, Math.min(1, (e.clientX - down.x) / r.width * 1.6)); }
  });
  function up(e) {
    box.classList.remove('grab');
    if (!down) return;
    var dx = e.clientX - down.x, dy = e.clientY - down.y, rtl = document.documentElement.dir === 'rtl';
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) shift((dx < 0) !== rtl ? 1 : -1);
    else if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && down.k) { var k = cards.indexOf(down.k); if (k === front) shift(1); else bring(k); }
    down = null; drag = 0;
  }
  box.addEventListener('pointerup', up);
  box.addEventListener('pointercancel', function () { down = null; drag = 0; box.classList.remove('grab'); });
  box.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { tx = 0; ty = 0; } });
  addEventListener('deviceorientation', function (e) {
    if (e.gamma == null) return; gyro = true;
    tx = Math.max(-0.5, Math.min(0.5, e.gamma / 50)); ty = Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 60));
  }, { passive: true });
  function onScroll() { var r = box.getBoundingClientRect(); sp = Math.max(-1, Math.min(1, (innerHeight * 0.5 - (r.top + r.height / 2)) / innerHeight)); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  function tick(now) {
    requestAnimationFrame(tick);
    if (!visible || document.hidden || reduced) return;
    var idle = (now - t0) / 1000;
    var gx = tx + drag * 0.9 + (gyro ? 0 : Math.sin(idle * 0.45) * 0.16);
    var gy = ty + (gyro ? 0 : Math.cos(idle * 0.37) * 0.08);
    cx += (gx - cx) * 0.07; cy += (gy - cy) * 0.07;
    scene.style.transform = 'translate3d(0,' + (sp * -24).toFixed(1) + 'px,0) rotateY(' + (cx * 22).toFixed(2) + 'deg) rotateX(' + (-cy * 14 + sp * 10).toFixed(2) + 'deg)';
    cards.forEach(function (c, k) {
      var d = (slot[k] + 1) / N; // deeper cards move their image less
      c.style.setProperty('--px', (cx * -14 * d).toFixed(1) + 'px');
      c.style.setProperty('--py', (cy * -10 * d + sp * 12 * d).toFixed(1) + 'px');
    });
  }
  requestAnimationFrame(tick);

  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; schedule(); }).observe(box);
  document.addEventListener('visibilitychange', schedule);
  schedule();

  /* language: captions + alt texts of the place section */
  function swapAlts() { var l = L(); [].forEach.call(document.querySelectorAll('[data-alt-ru]'), function (im) { im.alt = im.getAttribute('data-alt-' + l); }); var st = document.getElementById('plStrip'); if (st) st.setAttribute('aria-label', l === 'ar' ? 'صور المقهى' : 'Фото заведения'); }
  new MutationObserver(function () { label(); swapAlts(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  swapAlts();

  /* place photo: subtle pointer tilt */
  var pp = document.getElementById('plPhoto');
  if (pp && !reduced) {
    pp.addEventListener('pointermove', function (e) { var r = pp.getBoundingClientRect(); pp.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 8).toFixed(2) + 'deg'); pp.style.setProperty('--rx', (((e.clientY - r.top) / r.height - 0.5) * -8).toFixed(2) + 'deg'); });
    pp.addEventListener('pointerleave', function () { pp.style.setProperty('--ry', '0deg'); pp.style.setProperty('--rx', '0deg'); });
  }
})();
