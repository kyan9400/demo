/* Photo-real hero for «Цискари» («заря» — dawn): the café's real dishes (photos from its Yandex Maps card)
   rise like sun rays from behind the Caucasus ridge and fan out. Pure CSS 3D + small JS: on load the fan rises
   like a sunrise, then turns one dish at a time; drag/swipe to turn it, tap a side card to bring it forward,
   scrolling leans the fan back and opens it wider. Pauses off-screen; static under prefers-reduced-motion. */
(function () {
  var fan = document.getElementById('fan'), tilt = document.getElementById('fanTilt'), capEl = document.getElementById('fanCap');
  if (!fan || !tilt || !CSS.supports('transform-style', 'preserve-3d')) return;
  var cards = [].slice.call(tilt.querySelectorAll('.fcard'));
  var N = cards.length, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cw = 200, R = 400, H = 400, STEP = 22;
  var pos = 0, target = 0, rise = reduced ? 1 : 0, t0 = performance.now(), scrollP = 0, px = 0, py = 0, tx = 0, ty = 0;
  var drag = false, moved = 0, lastX = 0, vel = 0, visible = true, front = -1, lastAuto = performance.now();

  function layout() {
    var W = fan.clientWidth; H = fan.clientHeight;
    cw = W < 600 ? Math.min(W * 0.5, H * 0.56) : Math.min(W * 0.4, H * 0.48, 270);
    R = cw * (W < 600 ? 2.1 : 2.5);                                  // distance from pivot (below the ridge) to the card's bottom edge
    var top = H * 0.05;
    fan.style.setProperty('--cw', cw + 'px');
    fan.style.setProperty('--ct', top + 'px');
    fan.style.setProperty('--po', (cw * 1.25 + R) + 'px');
    STEP = W < 600 ? 21 : 19;
  }
  new ResizeObserver(layout).observe(fan); layout();
  fan.classList.add('on');

  function wrapd(d) { d = ((d % N) + N) % N; return d >= N / 2 ? d - N : d; }

  fan.addEventListener('pointerdown', function (e) { drag = true; moved = 0; lastX = e.clientX; vel = 0; fan.setPointerCapture(e.pointerId); fan.classList.add('grab', 'touched'); });
  fan.addEventListener('pointermove', function (e) {
    var r = fan.getBoundingClientRect();
    if (e.pointerType === 'mouse') { tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5; }
    if (!drag) return;
    var dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
    pos -= dx / (cw * 0.95); target = pos; vel = -dx / (cw * 0.95);
  });
  function end(e) {
    if (!drag) return; drag = false; fan.classList.remove('grab'); lastAuto = performance.now();
    if (moved < 6) {                                // a tap: bring the tapped card forward
      var el = document.elementFromPoint(e.clientX, e.clientY), c = el && el.closest && el.closest('.fcard');
      var i = cards.indexOf(c); if (i >= 0) target = pos + wrapd(i - pos);
      return;
    }
    target = Math.round(pos + vel * 6);
  }
  fan.addEventListener('pointerup', end); fan.addEventListener('pointercancel', end);
  fan.addEventListener('pointerleave', function () { tx = ty = 0; });
  fan.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') target = Math.round(target) + 1; if (e.key === 'ArrowLeft') target = Math.round(target) - 1; });
  fan.tabIndex = 0;

  function onScroll() { var r = fan.getBoundingClientRect(); scrollP = Math.min(1, Math.max(0, -r.top / (r.height * 0.9))); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(fan);

  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  var last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(100, now - last); last = now;
    if (!visible || document.hidden) return;
    var k = 1 - Math.exp(-dt / 190);
    if (!reduced && rise < 1) rise = Math.min(1, (now - t0 - 150) / 1700); if (rise < 0) rise = 0;
    var r = ease(Math.max(0, rise));
    if (!reduced && !drag && rise >= 1 && now - lastAuto > 3400) { target = Math.round(target) + 1; lastAuto = now; }
    if (!drag) pos += (target - pos) * (reduced ? 1 : k);
    px += (tx - px) * k * 0.6; py += (ty - py) * k * 0.6;
    var spread = STEP * r * (1 + scrollP * 0.18);
    tilt.style.transform = 'translateY(' + ((1 - r) * H * 0.55 - scrollP * 24) + 'px) rotateX(' + (scrollP * 16 - py * 6) + 'deg) rotateY(' + (px * 10) + 'deg)';
    var best = 0, bd = 99;
    for (var i = 0; i < N; i++) {
      var d = wrapd(i - pos), ad = Math.abs(d), a = d * spread, c = cards[i];
      var near = Math.max(0, 1 - ad);                  // 1 for the front card
      var z = near * 60 - ad * 30;
      c.style.transform = 'rotate(' + a.toFixed(2) + 'deg) translateZ(' + z.toFixed(1) + 'px) scale(' + (0.9 + near * 0.12).toFixed(3) + ')';
      c.style.opacity = Math.max(0, Math.min(1, (4 - ad) / 1.2) * Math.min(1, 0.25 + r)).toFixed(3);
      c.style.filter = 'brightness(' + (1 - Math.min(ad, 3) * 0.13).toFixed(3) + ') saturate(' + (1 - Math.min(ad, 3) * 0.1).toFixed(3) + ')';
      c.style.zIndex = 100 - Math.round(ad * 10);
      c.style.setProperty('--gx', (50 - d * 30 + px * 40).toFixed(1) + '%');
      if (ad < bd) { bd = ad; best = i; }
    }
    if (best !== front) {
      front = best; cards.forEach(function (c, k) { c.classList.toggle('front', k === best); });
      var img = cards[best].querySelector('img'); if (capEl && img) capEl.textContent = img.getAttribute('data-cap');
    }
  }
  requestAnimationFrame(frame);
})();
