/* Photo-real hero: real grooming photos (from the salon's Yandex Maps card) hang on the pegboard like
   the tools used to. Each card is a damped pendulum on its own peg: scrolling, moving the mouse across
   the board or flicking a card with a finger sets them swinging; tap/Enter lifts a card toward you
   (3D translateZ), tap again to hang it back. The price tag still mirrors the breed picked below.
   Transform-only, pauses off-screen, static under prefers-reduced-motion. */
(function () {
  var pb = document.getElementById('pb');
  if (!pb) return;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els = [].slice.call(pb.querySelectorAll('.pc')).concat([pb.querySelector('.ptag')]);
  var B = els.map(function (el, i) {
    var tag = el.classList.contains('ptag');
    return { el: el, tag: tag, a: (i % 2 ? 1 : -1) * (4 + i * 1.5), w: 0, k: tag ? 18 : 26 + i * 4, c: tag ? 1.1 : 1.6, up: 0, upT: 0, ty: 0 };
  });
  var visible = true;

  function paint(b) {
    var s = 1 + b.up * .22, z = b.up * 120;
    b.el.style.setProperty('--a', b.a.toFixed(2) + 'deg');
    if (b.tag) return;
    b.el.style.setProperty('--z', z.toFixed(1) + 'px');
    b.el.style.setProperty('--s', s.toFixed(3));
    b.el.style.setProperty('--ty', (b.ty).toFixed(2) + 'deg');
    b.el.style.setProperty('--shx', (-b.a * .6).toFixed(1) + 'px');
    b.el.style.setProperty('--zi', b.up > .02 ? 9 : 1);
  }
  B.forEach(function (b) { if (reduced) b.a = b.tag ? 0 : b.a * .5; paint(b); });
  if (reduced) return;

  function push(v) { B.forEach(function (b, i) { b.w += v * (b.tag ? .7 : 1) * (1 + (i % 3) * .25); }); }

  // scroll momentum swings everything
  var lastY = scrollY;
  addEventListener('scroll', function () { var dy = scrollY - lastY; lastY = scrollY; if (visible) push(Math.max(-60, Math.min(60, dy)) * .9); }, { passive: true });

  // mouse sweeping across the board brushes the cards it passes
  var lastX = null;
  pb.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    if (lastX !== null) {
      var dx = e.clientX - lastX;
      B.forEach(function (b) {
        if (b.tag) return;
        var r = b.el.getBoundingClientRect();
        if (e.clientX > r.left - 10 && e.clientX < r.right + 10 && e.clientY > r.top - 10 && e.clientY < r.bottom + 10) b.w += dx * 6;
        b.ty += (((e.clientX - (r.left + r.width / 2)) / innerWidth) * 18 - b.ty) * .1;
      });
    }
    lastX = e.clientX;
  });
  pb.addEventListener('pointerleave', function () { lastX = null; B.forEach(function (b) { b.ty = 0; }); });

  // finger / mouse flick on a card; a tap (no movement) lifts it forward
  B.forEach(function (b) {
    if (b.tag) return;
    var sx = 0, sy = 0, lx = 0, moved = false, down = false;
    b.el.addEventListener('pointerdown', function (e) { down = true; moved = false; sx = lx = e.clientX; sy = e.clientY; });
    b.el.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - lx; lx = e.clientX;
      if (Math.abs(e.clientX - sx) > 6) moved = true;
      b.w += dx * 9;
    });
    function up(e) {
      if (!down) return; down = false;
      if (!moved && Math.abs(e.clientY - sy) < 8) toggle(b);
    }
    b.el.addEventListener('pointerup', up);
    b.el.addEventListener('pointercancel', function () { down = false; });
    b.el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(b); } });
  });
  function toggle(b) {
    var on = !b.upT;
    B.forEach(function (o) { o.upT = 0; o.el.classList.remove('up'); });
    if (on) { b.upT = 1; b.el.classList.add('up'); b.w += 40; }
  }
  document.addEventListener('pointerdown', function (e) { if (!e.target.closest || !e.target.closest('.pc')) B.forEach(function (o) { o.upT = 0; o.el.classList.remove('up'); }); });

  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(pb);

  var prev = performance.now(), idle = 0;
  function tick(now) {
    requestAnimationFrame(tick);
    var dt = Math.min(.033, (now - prev) / 1000); prev = now;
    if (!visible || document.hidden) return;
    idle += dt;
    B.forEach(function (b, i) {
      // a faint draught keeps the board alive
      var air = Math.sin(idle * (.6 + i * .17) + i * 2) * 1.6;
      var acc = -b.k * (b.a - air * (b.tag ? 1.4 : 1)) - b.c * b.w;
      b.w += acc * dt; b.a += b.w * dt;
      b.a = Math.max(-28, Math.min(28, b.a));
      b.up += (b.upT - b.up) * .14;
      if (b.up > .02 || b.upT) b.a *= 1 - .12 * b.up;
      paint(b);
    });
  }
  requestAnimationFrame(tick);
})();

/* the real place: subtle pointer tilt on the salon photo */
(function () {
  var f = document.querySelector('.sal-photo');
  if (!f || matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover: hover)').matches) return;
  f.addEventListener('pointermove', function (e) { var r = f.getBoundingClientRect(); f.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 10 + 'deg'); f.style.setProperty('--rx', (.5 - (e.clientY - r.top) / r.height) * 8 + 'deg'); });
  f.addEventListener('pointerleave', function () { f.style.setProperty('--ry', '0deg'); f.style.setProperty('--rx', '0deg'); });
})();
