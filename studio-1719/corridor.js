/* Photo-real hero for Студия_1719: a gallery corridor. The studio's real works (photos from its Yandex
   Maps card) hang in white mats along a museum wall seen in perspective, each with a mono label.
   The wall drifts past slowly; drag/swipe to walk along it, scroll walks too and turns the wall toward
   you. Frames further down the corridor are dimmer, spotlights sit above each work.
   Pure CSS 3D + small JS. Pauses off-screen; with prefers-reduced-motion it only moves when dragged. */
(function () {
  var host = document.getElementById('corridor');
  if (!host || !CSS.supports('transform-style', 'preserve-3d')) return;
  var WORKS = [
    ['lavender-chrome', 'лавандовый перламутр'], ['pink-almond', 'розовый миндаль'], ['red-vogue', 'красный глянец'],
    ['blue-art', 'голубой с рисунком'], ['lilac-stiletto', 'сиреневый стилет'], ['black-art', 'чёрный с рисунком'],
    ['burgundy', 'бордо'], ['blue-glass', 'голубое стекло']
  ];
  var N = WORKS.length;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var html = '<div class="c-wall"><div class="c-track">';
  for (var k = 0; k < 2; k++) WORKS.forEach(function (w, i) {
    html += '<figure class="fr"><div class="mat"><img src="img/' + w[0] + '.webp" alt="" draggable="false" decoding="async"' +
      (k || i > 3 ? ' loading="lazy"' : '') + '></div><figcaption><b>№ ' + (i < 9 ? '0' : '') + (i + 1) + '</b>' + w[1] + '</figcaption></figure>';
  });
  html += '</div></div><div class="c-floor"></div>';
  host.insertAdjacentHTML('beforeend', html);
  host.classList.add('on');
  var wall = host.querySelector('.c-wall'), track = host.querySelector('.c-track');
  var frames = [].slice.call(track.children);

  var setW = 0, pitch = 0, viewW = 0;
  function measure() {
    pitch = frames[1].offsetLeft - frames[0].offsetLeft;
    setW = pitch * N; viewW = host.clientWidth;
  }
  new ResizeObserver(measure).observe(host); measure();

  var off = 0, vel = 0, drift = reduced ? 0 : -0.35, drag = false, lastX = 0, visible = true, scrollP = 0, lastY = scrollY;
  host.addEventListener('pointerdown', function (e) { drag = true; lastX = e.clientX; vel = 0; host.setPointerCapture(e.pointerId); host.classList.add('grab'); });
  host.addEventListener('pointermove', function (e) { if (!drag) return; var dx = e.clientX - lastX; lastX = e.clientX; off += dx * 1.4; vel = dx * 1.4; if (reduced) frame(); });
  function end() { drag = false; host.classList.remove('grab'); }
  host.addEventListener('pointerup', end); host.addEventListener('pointercancel', end);

  function onScroll() {
    var r = host.getBoundingClientRect();
    scrollP = Math.min(1, Math.max(0, -r.top / (r.height * 1.2)));
    var dy = scrollY - lastY; lastY = scrollY;
    if (visible && Math.abs(dy) < 300) off -= dy * 0.6;            // scrolling walks along the wall
    if (reduced) frame();
  }
  addEventListener('scroll', onScroll, { passive: true });
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(host);

  function frame() {
    if (setW) { while (off > 0) off -= setW; while (off <= -setW) off += setW; }
    var narrow = viewW < 600;
    var ang = (narrow ? 34 : 27) - scrollP * 12;
    wall.style.transform = 'rotateY(' + ang.toFixed(2) + 'deg)';
    track.style.transform = 'translate3d(' + off.toFixed(1) + 'px,0,0)';
    // light: frames further along the wall (larger x) get dimmer
    for (var i = 0; i < frames.length; i++) {
      var x = i * pitch + off;                        // position along the wall
      var f = frames[i];
      if (x < -pitch * 1.2 || x > viewW * 2.6) { if (f._v !== 0) { f.style.visibility = 'hidden'; f._v = 0; } continue; }
      if (f._v !== 1) { f.style.visibility = ''; f._v = 1; }
      var d = Math.max(0, x) / (viewW * 2.2);
      f.style.filter = 'brightness(' + (1.04 - d * 0.42).toFixed(3) + ')';
    }
  }
  function tick() {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    if (!drag) { off += vel; vel += (drift - vel) * 0.04; }
    frame();
  }
  if (reduced) { frame(); new ResizeObserver(frame).observe(host); } else tick();
})();
