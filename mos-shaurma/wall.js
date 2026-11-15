/* Photo-real hero: real photos from the Yandex Maps card pasted on the concrete wall with lime tape,
   each at its own depth. The layers drift on their own, follow the pointer (or the phone's tilt),
   can be dragged sideways on a phone, and slide apart at different speeds as the page scrolls.
   The live 24-hour dial stays pinned on top as the nearest layer. Also: tilt on the #place photo. */
(function () {
  var wall = document.getElementById('pwall');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (wall && !reduced) {
    var lays = [].slice.call(wall.querySelectorAll('[data-depth]')).map(function (el) {
      return { el: el, d: parseFloat(el.dataset.depth), r: parseFloat(el.dataset.rot || 0) };
    });
    var tx = 0, ty = 0, cx = 0, cy = 0, sp = 0, pointer = false, drag = false, sx = 0, dragX = 0, visible = true, t0 = performance.now(), gyro = false;
    wall.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'mouse') { var r = wall.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2; pointer = true; }
      else if (drag) { dragX = Math.max(-1.6, Math.min(1.6, (e.clientX - sx) / wall.clientWidth * 3)); }
    });
    wall.addEventListener('pointerleave', function () { pointer = false; });
    wall.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') { drag = true; sx = e.clientX - dragX * wall.clientWidth / 3; } });
    var end = function () { drag = false; };
    wall.addEventListener('pointerup', end); wall.addEventListener('pointercancel', end);
    addEventListener('deviceorientation', function (e) {
      if (e.gamma == null || pointer || drag) return;
      gyro = true; tx = Math.max(-1, Math.min(1, e.gamma / 25)); ty = Math.max(-1, Math.min(1, ((e.beta || 45) - 45) / 25));
    });
    var onScroll = function () { var r = wall.getBoundingClientRect(); sp = Math.min(1, Math.max(0, (innerHeight * 0.4 - r.top) / r.height)); };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(wall);
    var tick = function (now) {
      requestAnimationFrame(tick);
      if (!visible || document.hidden) return;
      var t = (now - t0) / 1000, gx = tx, gy = ty;
      if (!pointer && !gyro) { gx = Math.sin(t * 0.45) * 0.55; gy = Math.cos(t * 0.33) * 0.4; }
      if (!drag) dragX *= 0.9;
      gx += dragX;
      cx += (gx - cx) * 0.07; cy += (gy - cy) * 0.07;
      lays.forEach(function (l, i) {
        var d = l.d, spread = sp * (i % 2 ? -1 : 1) * d * 14;
        var x = cx * d * 11 + spread, y = cy * d * 8 - sp * d * 46;
        l.el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' + (l.r + cx * d * 0.8).toFixed(2) + 'deg)';
      });
    };
    requestAnimationFrame(tick);
  }
  var f = document.querySelector('.place-photo');
  if (f && !reduced) {
    f.addEventListener('pointermove', function (e) { var r = f.getBoundingClientRect(); f.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 10 + 'deg'); f.style.setProperty('--rx', (0.5 - (e.clientY - r.top) / r.height) * 8 + 'deg'); });
    f.addEventListener('pointerleave', function () { f.style.setProperty('--ry', '0deg'); f.style.setProperty('--rx', '0deg'); });
  }
})();
