/* Photo-real hero: real photos from the Yandex Maps card seen through the tiled arch window.
   The photos live inside the SVG arch clip: slow Ken-Burns drift + crossfade, window-parallax
   (the photo shifts behind the frame with pointer/scroll), swipe or tap to change.
   Pauses off-screen; static with prefers-reduced-motion. */
(function () {
  var box = document.querySelector('.archbox'), g = document.getElementById('archPh');
  if (!box || !g) return;
  var NS = 'http://www.w3.org/2000/svg';
  var P = [
    ['exterior', 'вывеска «Арабская шаурма» вечером', 'لافتة «الشاورما العربية» مساءً'],
    ['shawarma', 'шаурма в лаваше', 'شاورما في خبز رقيق'],
    ['hall', 'зал со столиками', 'الصالة والطاولات'],
    ['meat-plate', 'мясо с картофелем и луком', 'لحم مع بطاطا وبصل']
  ];
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ar = function () { return document.documentElement.lang === 'ar'; };
  var imgs = P.map(function (p, i) {
    var im = document.createElementNS(NS, 'image');
    im.setAttribute('x', '-30'); im.setAttribute('y', '-20'); im.setAttribute('width', '460'); im.setAttribute('height', '540');
    im.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    im.setAttribute('class', 'aph' + (i === 0 ? ' on' : ''));
    if (i === 0) im.setAttribute('href', 'img/' + p[0] + '.webp');
    g.appendChild(im); return im;
  });
  // lazy: the other photos load after the page is idle
  function loadRest() { imgs.forEach(function (im, i) { if (i) im.setAttribute('href', 'img/' + P[i][0] + '.webp'); }); }
  if (document.readyState === 'complete') setTimeout(loadRest, 600); else addEventListener('load', function () { setTimeout(loadRest, 600); });
  box.classList.add('has-photo');

  var cap = document.createElement('p'); cap.className = 'archcap'; cap.innerHTML = '<span></span><small></small>';
  box.appendChild(cap);
  var cur = 0, last = Date.now(), visible = true;
  function label() {
    cap.firstChild.textContent = P[cur][ar() ? 2 : 1];
    cap.lastChild.textContent = ar() ? 'صور من خرائط ياندكس · اسحب' : 'фото с Яндекс Карт · свайп';
    box.setAttribute('aria-label', P[cur][ar() ? 2 : 1]);
  }
  function go(i) {
    cur = (i + P.length) % P.length; last = Date.now();
    imgs.forEach(function (im, k) { im.classList.toggle('on', k === cur); });
    label();
  }
  document.addEventListener('langchange', label); label();
  box.setAttribute('role', 'img'); box.removeAttribute('aria-hidden');

  var sx = null, moved = false;
  box.addEventListener('pointerdown', function (e) { sx = e.clientX; moved = false; });
  box.addEventListener('pointermove', function (e) { if (sx !== null && Math.abs(e.clientX - sx) > 8) moved = true; });
  box.addEventListener('pointerup', function (e) {
    if (sx === null) return; var dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 40) go(cur + ((dx < 0) !== ar() ? 1 : -1)); else if (!moved) go(cur + 1);
  });
  box.addEventListener('pointercancel', function () { sx = null; });
  if (reduced) return;

  var px = 0, py = 0, tx = 0, ty = 0, sc = 0;
  box.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var r = box.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * -22; ty = ((e.clientY - r.top) / r.height - 0.5) * -16;
  });
  box.addEventListener('pointerleave', function () { tx = ty = 0; });
  function onScroll() { var r = box.getBoundingClientRect(); sc = Math.max(0, Math.min(1, -r.top / r.height)); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; box.classList.toggle('paused', !visible); }).observe(box);
  (function tick() {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    px += (tx - px) * 0.07; py += (ty - py) * 0.07;
    g.setAttribute('transform', 'translate(' + px.toFixed(2) + ' ' + (py + sc * 22).toFixed(2) + ')');
    if (Date.now() - last > 5200) go(cur + 1);
  })();
})();
