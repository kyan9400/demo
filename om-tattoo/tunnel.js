/* Photo-real hero for «Ом тату»: a depth tunnel of the studio's real work (photos from its Yandex Maps
   card). The tattoos hang one behind another in the dark; every few seconds the camera moves forward
   through the front photo and the next one comes into focus. Swipe/drag or tap to fly to the next work,
   scroll pushes the camera in, the pointer shifts the vanishing point. The line mandala stays behind
   as a faint backdrop. Pure CSS 3D + small JS. Pauses off-screen; static with prefers-reduced-motion. */
(function () {
  var box = document.getElementById('mbox');
  if (!box || !CSS.supports('transform-style', 'preserve-3d')) return;
  var WORKS = [
    ['mandala', 'мандала, графика'], ['floral', 'цветы на предплечье'], ['butterfly', 'бабочка на плече'],
    ['sleeve', 'орнамент, рукав'], ['horse', 'цветная работа'], ['lilies', 'лилии, тонкие линии'], ['forearm', 'предплечье, графика']
  ];
  var N = WORKS.length;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var t = document.createElement('div'); t.className = 'tunnel';
  var html = '<div class="t-space">';
  WORKS.forEach(function (w, i) {
    html += '<figure class="tcard"><img src="img/' + w[0] + '.webp" alt="" draggable="false" decoding="async"' + (i > 1 ? ' loading="lazy"' : '') + '></figure>';
  });
  html += '</div><span class="t-vig"></span>';
  t.innerHTML = html;
  box.appendChild(t);
  var info = document.createElement('p'); info.className = 't-cap';
  info.innerHTML = '<span class="t-n"></span><span class="t-t"></span><small>работы студии · фото с Яндекс Карт</small>';
  box.appendChild(info);
  box.classList.add('has-tunnel');
  var space = t.querySelector('.t-space'), cards = [].slice.call(space.children);
  var nEl = info.querySelector('.t-n'), tEl = info.querySelector('.t-t');

  var pos = 0, target = 0, visible = true, scrollP = 0, px = 0, py = 0, sx = 0, sy = 0, D = 300, front = -1;
  function size() { D = Math.max(220, t.clientWidth * 0.85); }
  new ResizeObserver(size).observe(t); size();

  function next(d) { target = Math.round(target) + d; restart(); }
  var timer = 0;
  function restart() { clearInterval(timer); if (!reduced) timer = setInterval(function () { if (visible && !document.hidden) target = Math.round(target) + 1; }, 3800); }
  restart();

  var down = null;
  t.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY }; });
  t.addEventListener('pointerup', function (e) {
    if (!down) return; var dx = e.clientX - down.x, dy = e.clientY - down.y; down = null;
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) next(dx < 0 ? 1 : -1);
    else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) next(1);
  });
  t.addEventListener('pointercancel', function () { down = null; });
  box.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var r = box.getBoundingClientRect(); px = (e.clientX - r.left) / r.width - .5; py = (e.clientY - r.top) / r.height - .5;
  });
  box.addEventListener('pointerleave', function () { px = py = 0; });

  function onScroll() { var r = box.getBoundingClientRect(); scrollP = Math.min(1, Math.max(0, -r.top / (r.height * .9))); if (reduced) frame(); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(box);

  function frame() {
    sx += (px - sx) * .07; sy += (py - sy) * .07;
    t.style.perspectiveOrigin = (50 + sx * 40).toFixed(1) + '% ' + (42 + sy * 30).toFixed(1) + '%';
    var p = pos + scrollP * .45;
    var best = 0, bestR = 9;
    cards.forEach(function (c, i) {
      var rel = ((i - p) % N + N) % N;
      if (rel > N - .8) rel -= N;                                  // the one flying past the camera
      if (rel < -.8 || rel > 3.4) { if (c._v !== 0) { c.style.visibility = 'hidden'; c._v = 0; } return; }
      if (c._v !== 1) { c.style.visibility = ''; c._v = 1; }
      var side = (i % 2 ? 1 : -1);
      var z = -rel * D, x = rel > 0 ? side * Math.min(rel, 1.6) * D * .34 : 0, y = rel > 0 ? -rel * D * .1 : 0;
      var rot = rel > 0 ? side * rel * 4 : 0;
      var op = rel >= 0 ? Math.max(0, 1 - rel * .24) : Math.max(0, 1 + rel * 3.4);
      c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateZ(' + rot.toFixed(2) + 'deg)';
      c.style.opacity = op.toFixed(3);
      c.style.zIndex = 100 - Math.round(rel * 10);
      c.style.filter = 'brightness(' + Math.max(.35, 1 - Math.max(0, rel) * .22).toFixed(3) + ')';
      if (Math.abs(rel) < bestR) { bestR = Math.abs(rel); best = i; }
    });
    if (best !== front) { front = best; nEl.textContent = (best < 9 ? '0' : '') + (best + 1) + ' / ' + (N < 10 ? '0' : '') + N; tEl.textContent = WORKS[best][1]; }
  }
  function tick() {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    pos += (target - pos) * .055;
    frame();
  }
  if (reduced) {
    frame();
    // no animation: jump straight to the chosen work
    var _next = next; next = function (d) { _next(d); pos = target; frame(); };
    new ResizeObserver(frame).observe(t);
  } else tick();
})();
