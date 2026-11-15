/* Photo-real hero for «Тим»: the café's real dishes (studio shots from its Yandex Maps card) laid one by one
   into the well of a Rishtan lagan, with four more plates floating around it at different depths.
   Pointer / phone tilt and scroll move the plates in depth (parallax); tap a plate to put it on the lagan;
   every few seconds the next dish is served. Pure CSS 3D + small JS, pauses off-screen,
   static under prefers-reduced-motion. */
(function () {
  var box = document.getElementById('plateHero'), tilt = document.getElementById('lgTilt'), well = document.getElementById('lgWell'), tag = document.getElementById('dishTag');
  if (!box || !tilt || !well) return;
  var imgs = [].slice.call(well.querySelectorAll('img')), N = imgs.length;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur = 0, visible = true, last = performance.now(), nextAt = last + 5200, spin = 0;
  var DEPTH = [0.9, 1.35, 1.2, 0.75], PHASE = [0, 1.7, 3.1, 4.4];

  function srcOf(i) { return imgs[i].getAttribute('src') || imgs[i].dataset.src; }
  function load(i) { var im = imgs[i]; if (im.dataset.src) { im.src = im.dataset.src; im.removeAttribute('data-src'); } }

  var sats = [0, 1, 2, 3].map(function (k) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'lg-sat'; b.dataset.k = k;
    b.innerHTML = '<img alt="" decoding="async" draggable="false">';
    b.addEventListener('click', function () { serve(+b.dataset.i); nextAt = performance.now() + 7000; });
    tilt.appendChild(b); return b;
  });
  function fillSats(anim) {
    sats.forEach(function (b, k) {
      var i = (cur + 1 + k) % N; b.dataset.i = i;
      b.setAttribute('aria-label', 'Положить на ляган: ' + imgs[i].dataset.cap);
      var im = b.querySelector('img');
      if (!anim) { im.src = srcOf(i); return; }
      b.classList.add('swap'); setTimeout(function () { im.src = srcOf(i); b.classList.remove('swap'); }, 260 + k * 60);
    });
  }
  function serve(i) {
    if (i === cur) return; load(i);
    imgs[cur].classList.remove('on'); imgs[i].classList.add('on');
    imgs[i].style.setProperty('--rot', (spin - 24) + 'deg');      // lands with a small turn, then settles
    cur = i;
    if (tag) tag.innerHTML = '<b>' + imgs[i].dataset.cap + '</b>фото «Тим» с Яндекс Карт';
    fillSats(true);
  }
  function loadAll() { for (var i = 1; i < N; i++) load(i); fillSats(false); box.classList.add('on'); }
  if (imgs[0].complete) loadAll(); else imgs[0].addEventListener('load', loadAll);

  // tilt input: mouse over the hero, phone orientation, scroll position
  var tx = 0, ty = 0, px = 0, py = 0, sp = 0;
  var hero = document.getElementById('hero') || box;
  hero.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; var r = box.getBoundingClientRect(); tx = Math.max(-1, Math.min(1, (e.clientX - r.left) / r.width * 2 - 1)); ty = Math.max(-1, Math.min(1, (e.clientY - r.top) / r.height * 2 - 1)); });
  hero.addEventListener('pointerleave', function () { tx = ty = 0; });
  addEventListener('deviceorientation', function (e) { if (e.gamma == null) return; tx = Math.max(-1, Math.min(1, e.gamma / 25)); ty = Math.max(-1, Math.min(1, (e.beta - 45) / 25)); }, { passive: true });
  function onScroll() { var r = box.getBoundingClientRect(); sp = Math.max(-1, Math.min(1, (innerHeight / 2 - (r.top + r.height / 2)) / innerHeight)); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(box);

  if (reduced) { return; }
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(100, now - last); last = now;
    if (!visible || document.hidden) { nextAt += dt; return; }
    var k = 1 - Math.exp(-dt / 220);
    px += (tx - px) * k; py += (ty - py) * k;
    if (now > nextAt) { serve((cur + 1) % N); nextAt = now + 5200; }
    spin += dt * 0.004;                                            // the dish turns slowly, like on a lagan
    var on = imgs[cur], r0 = parseFloat(on.style.getPropertyValue('--rot')) || 0;
    on.style.setProperty('--rot', (r0 + (spin - r0) * k * 0.5).toFixed(2) + 'deg');
    tilt.style.transform = 'rotateX(' + (-py * 9 + sp * 10).toFixed(2) + 'deg) rotateY(' + (px * 11).toFixed(2) + 'deg)';
    var t = now / 1000;
    sats.forEach(function (b, i) {
      var d = DEPTH[i], bob = Math.sin(t * 0.9 + PHASE[i]) * 6;
      b.style.transform = 'translate3d(' + (px * 16 * d).toFixed(1) + 'px,' + (py * 12 * d + bob - sp * 50 * d).toFixed(1) + 'px,' + (40 + d * 50).toFixed(0) + 'px) rotate(' + (Math.sin(t * 0.4 + PHASE[i]) * 6).toFixed(2) + 'deg)';
    });
  }
  requestAnimationFrame(frame);
})();
