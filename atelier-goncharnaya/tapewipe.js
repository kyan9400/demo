/* Photo-real hero: the atelier's own photos (Yandex Maps card) in a framed board.
   A yellow measuring tape slides across the frame and "measures off" the next photo —
   the new photo is uncovered right behind the tape. Transform-only (a clipping wrapper
   slides one way, the image inside slides back), pointer tilts the board in 3D,
   scroll lays it back like a pattern on the cutting table. Swipe / ruler buttons switch photos. */
(function () {
  var tw = document.getElementById('tw');
  if (!tw) return;
  var frame = document.getElementById('twFrame'), box = document.getElementById('tw3d');
  var phs = [].slice.call(frame.querySelectorAll('.tw-ph'));
  var tape = frame.querySelector('.tw-tape');
  var btns = [].slice.call(document.querySelectorAll('#twRuler button'));
  var numEl = document.getElementById('twNum'), capEl = document.getElementById('twCap');
  var CAPS = ['мастерская', 'штопка', 'комната ателье', 'шов на джинсах'];
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var N = phs.length, cur = 0, busy = false, visible = true, HOLD = 5200, t0 = performance.now();

  function setLabel(i) {
    numEl.textContent = (i < 9 ? '0' : '') + (i + 1);
    capEl.textContent = CAPS[i];
    btns.forEach(function (b, k) { b.setAttribute('aria-current', k === i ? 'true' : 'false'); b.style.setProperty('--p', '0%'); });
  }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function go(to, dir) {
    if (busy || to === cur) return;
    to = (to + N) % N;
    if (dir === undefined) dir = to > cur ? 1 : -1;
    var next = phs[to], inner = next.querySelector('.tw-in'), img = next.querySelector('img');
    if (img.loading === 'lazy') img.loading = 'eager';
    if (reduced) { phs[cur].classList.remove('on'); next.classList.add('on'); cur = to; setLabel(cur); t0 = performance.now(); return; }
    busy = true;
    next.classList.add('nx');
    tape.classList.add('go');
    var W = frame.clientWidth, start = performance.now(), D = 1150;
    (function step(now) {
      var t = Math.min(1, (now - start) / D), e = ease(t);
      // dir 1: tape travels left -> right, uncovering the new photo behind it
      var x = dir > 0 ? e * W : (1 - e) * W;
      var off = dir > 0 ? (x - W) : x;            // wrapper offset
      next.style.transform = 'translateX(' + off + 'px)';
      inner.style.transform = 'translateX(' + (-off) + 'px)';
      tape.style.transform = 'translateX(' + x + 'px) rotate(' + (Math.sin(t * Math.PI) * 1.2) + 'deg)';
      if (t < 1) return requestAnimationFrame(step);
      phs[cur].classList.remove('on');
      next.classList.remove('nx'); next.classList.add('on');
      next.style.transform = ''; inner.style.transform = '';
      tape.classList.remove('go'); tape.style.transform = 'translateX(-40px)';
      cur = to; busy = false; t0 = performance.now();
      // warm the photo after next
      var after = phs[(cur + 1) % N].querySelector('img'); if (after.loading === 'lazy') after.loading = 'eager';
    })(start);
    setLabel(to);
  }

  btns.forEach(function (b, i) { b.addEventListener('click', function () { go(i); }); });

  // swipe / drag
  var sx = 0, sy = 0, down = false, moved = false;
  frame.addEventListener('pointerdown', function (e) { down = true; moved = false; sx = e.clientX; sy = e.clientY; tw.classList.add('grab'); });
  frame.addEventListener('pointerup', function (e) {
    if (!down) return; down = false; tw.classList.remove('grab');
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) go(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  });
  frame.addEventListener('pointercancel', function () { down = false; tw.classList.remove('grab'); });

  // 3D: pointer tilt + scroll lays the board back
  var px = 0, py = 0, tx = 0, ty = 0, sp = 0;
  if (!reduced && matchMedia('(hover: hover)').matches) {
    tw.addEventListener('pointermove', function (e) { var r = tw.getBoundingClientRect(); px = (e.clientX - r.left) / r.width - .5; py = (e.clientY - r.top) / r.height - .5; });
    tw.addEventListener('pointerleave', function () { px = 0; py = 0; });
  }
  function onScroll() { var r = tw.getBoundingClientRect(); sp = Math.min(1, Math.max(0, -r.top / (r.height * .9))); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(tw);

  function tick(now) {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) { t0 = now - Math.min(now - t0, HOLD - 600); return; }
    if (reduced) return;
    tx += (px - tx) * .08; ty += (py - ty) * .08;
    frame.style.setProperty('--ry', (tx * 9).toFixed(2) + 'deg');
    frame.style.setProperty('--rx', (-ty * 7 + sp * 22).toFixed(2) + 'deg');
    frame.style.setProperty('--ty', (sp * 30).toFixed(1) + 'px');
    frame.style.setProperty('--gx', (30 + tx * 70).toFixed(1) + '%');
    var el = now - t0;
    if (!busy) {
      var b = btns[cur]; if (b) b.style.setProperty('--p', Math.min(100, el / HOLD * 100).toFixed(1) + '%');
      if (el > HOLD && !down) go(cur + 1, 1);
    }
  }
  requestAnimationFrame(tick);
})();

/* "the way in" photo: subtle pointer tilt */
(function () {
  var f = document.querySelector('.way-photo');
  if (!f || matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover: hover)').matches) return;
  f.addEventListener('pointermove', function (e) { var r = f.getBoundingClientRect(); f.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 10 + 'deg'); f.style.setProperty('--rx', (.5 - (e.clientY - r.top) / r.height) * 8 + 'deg'); });
  f.addEventListener('pointerleave', function () { f.style.setProperty('--ry', '0deg'); f.style.setProperty('--rx', '0deg'); });
})();
