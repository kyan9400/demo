/* Photo-real hero: real tattoos from the salon's Yandex Maps card, taped to the flash sheet at different depths.
   The sheet tilts with the pointer (and with the phone's gyro once the user touches it), every print sits on its own
   Z-layer so it shifts at its own speed; scrolling pulls the layers apart and drifts them at different rates.
   One print at a time is "picked" (lifted, straightened, captioned) - it cycles by itself, tap/click or swipe
   picks another. Pure CSS 3D + a small rAF loop that only runs while the hero is visible. */
(function () {
  var pin = document.getElementById('pin'), p3 = document.getElementById('pin3d'), cap = document.getElementById('pinCap');
  if (!pin || !p3 || !CSS.supports('transform-style', 'preserve-3d')) return;
  var prints = [].slice.call(p3.querySelectorAll('.tp'));
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var base = prints.map(function (p) { var cs = getComputedStyle(p); return { r: parseFloat(cs.getPropertyValue('--r')) || 0, z: parseFloat(cs.getPropertyValue('--z')) || 0 }; });
  var cur = -1, idle = 0, visible = true;

  function pick(k) {
    k = (k + prints.length) % prints.length; if (k === cur) return;
    if (cur >= 0) prints[cur].classList.remove('on');
    cur = k; idle = 0;
    var p = prints[k]; p.classList.add('on');
    if (cap) cap.innerHTML = '<b>№ ' + p.getAttribute('data-n') + '</b> <span>' + p.getAttribute('data-c') + '</span> <small>· фото с Яндекс Карт</small>';
  }
  pick(0);

  // tap picks a print; horizontal swipe picks next/previous
  var sx = 0, sy = 0, down = false;
  pin.addEventListener('pointerdown', function (e) { down = true; sx = e.clientX; sy = e.clientY; });
  pin.addEventListener('pointerup', function (e) {
    if (!down) return; down = false;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { pick(cur + (dx < 0 ? 1 : -1)); return; }
    var hit = e.target.closest && e.target.closest('.tp');
    pick(hit ? prints.indexOf(hit) : cur + 1);
  });
  pin.addEventListener('pointercancel', function () { down = false; });
  pin.tabIndex = 0; pin.setAttribute('role', 'group'); pin.setAttribute('aria-label', 'Работы салона: стрелки влево/вправо листают');
  pin.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); pick(cur + (e.key === 'ArrowRight' ? 1 : -1)); } });

  if (reduced) return;

  var tx = 0, ty = 0, px = 0, py = 0, scrollP = 0;
  pin.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var r = pin.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - .5) * 2; ty = ((e.clientY - r.top) / r.height - .5) * 2;
  });
  pin.addEventListener('pointerleave', function () { tx = 0; ty = 0; });
  // gyro: only where it needs no permission prompt (Android); iOS just gets scroll + auto motion
  if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    addEventListener('deviceorientation', function (e) {
      if (e.gamma == null) return;
      tx = Math.max(-1, Math.min(1, e.gamma / 25)); ty = Math.max(-1, Math.min(1, (e.beta - 45) / 25));
    }, { passive: true });
  }
  function onScroll() { var r = pin.getBoundingClientRect(); scrollP = Math.min(1, Math.max(0, (innerHeight * 0.3 - r.top) / (r.height))); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(pin);

  var last = performance.now(), t = 0;
  (function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(64, now - last); last = now;
    if (!visible || document.hidden) return;
    t += dt; idle += dt; if (idle > 3800) pick(cur + 1);
    px += (tx - px) * 0.07; py += (ty - py) * 0.07;
    // a slow idle sway so the depth reads even without a mouse
    var sw = Math.sin(t / 2400) * 0.35;
    p3.style.transform = 'rotateX(' + (-py * 8 + scrollP * 14).toFixed(2) + 'deg) rotateY(' + ((px + sw) * 11).toFixed(2) + 'deg)';
    prints.forEach(function (p, i) {
      var b = base[i], on = i === cur;
      var z = b.z * (1 + scrollP * 1.6) + (on ? 60 : 0), y = -scrollP * b.z * 0.9, r = on ? 0 : b.r;
      p.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotate(' + r + 'deg) scale(' + (on ? 1.06 : 1) + ')';
    });
  })(last);
})();
