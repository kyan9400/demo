/* Photo accent for the hero: a small "shop window" of real photos from the Yandex Maps card.
   Slow Ken-Burns drift + crossfade, scroll parallax and a gentle 3D tilt toward the pointer.
   Swipe or tap the dots to change the photo. Pauses off-screen; static with prefers-reduced-motion. */
(function () {
  var host = document.getElementById('peek');
  if (!host) return;
  var P = [
    ['steps', 'вход: вывеска «Халяль», жёлтые ступени, дом 23', 'المدخل: لافتة «حلال» ودرج أصفر، المبنى 23'],
    ['lepeshka', 'лепёшка', 'خبز الطاجين المستدير'],
    ['facade', 'вывеска «Халяль» на фасаде', 'لافتة «حلال» على الواجهة']
  ];
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ar = function () { return document.documentElement.lang === 'ar'; };
  var frame = host.querySelector('.peek-frame');
  var slides = P.map(function (p, i) {
    var s = document.createElement('div'); s.className = 'peek-slide' + (i === 0 ? ' on' : '');
    s.innerHTML = '<img src="img/' + p[0] + '.webp" alt="" draggable="false" ' + (i ? 'loading="lazy" ' : '') + 'decoding="async">';
    frame.appendChild(s); return s;
  });
  var dots = document.createElement('div'); dots.className = 'peek-dots';
  P.forEach(function (_, i) {
    var b = document.createElement('button'); b.type = 'button';
    b.addEventListener('click', function () { go(i); });
    dots.appendChild(b);
  });
  host.appendChild(dots);
  var cap = host.querySelector('.peek-cap span'), cur = 0, last = Date.now(), visible = true;
  function label() {
    cap.textContent = P[cur][ar() ? 2 : 1];
    slides.forEach(function (s, i) { s.firstChild.alt = P[i][ar() ? 2 : 1]; });
    Array.prototype.forEach.call(dots.children, function (b, i) {
      b.setAttribute('aria-label', (ar() ? 'الصورة ' : 'Фото ') + (i + 1)); b.setAttribute('aria-current', i === cur ? 'true' : 'false');
    });
  }
  function go(i) {
    cur = (i + P.length) % P.length; last = Date.now();
    slides.forEach(function (s, k) { s.classList.toggle('on', k === cur); });
    label();
  }
  document.addEventListener('langchange', label); label();

  var sx = null;
  frame.addEventListener('pointerdown', function (e) { sx = e.clientX; });
  frame.addEventListener('pointerup', function (e) {
    if (sx === null) return; var dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 40) go(cur + ((dx < 0) !== ar() ? 1 : -1));
  });
  frame.addEventListener('pointercancel', function () { sx = null; });
  if (reduced) return;

  var rx = 0, ry = 0, trx = 0, try_ = 0, par = 0;
  host.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var r = host.getBoundingClientRect();
    try_ = ((e.clientX - r.left) / r.width - 0.5) * 10; trx = (0.5 - (e.clientY - r.top) / r.height) * 8;
  });
  host.addEventListener('pointerleave', function () { trx = try_ = 0; });
  function onScroll() { var r = host.getBoundingClientRect(); par = Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / innerHeight)); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; host.classList.toggle('paused', !visible); }).observe(host);
  (function tick() {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    rx += (trx - rx) * 0.08; ry += (try_ - ry) * 0.08;
    frame.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
    frame.style.setProperty('--par', (par * 18).toFixed(1) + 'px');
    if (Date.now() - last > 4800) go(cur + 1);
  })();
})();
