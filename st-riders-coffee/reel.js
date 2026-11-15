/* Photo-real hero for St. Riders: a cinematic reel of the coffee shop's real photos (Yandex Maps card).
   Each frame rolls in with a slow Ken-Burns push and a light streak, a lap-timer of five "sectors" shows
   progress (tap a sector to jump, swipe the photo to change), scroll pushes the reel forward like
   accelerating, pointer adds a little parallax. Transform/opacity only; pauses off-screen; static
   (no autoplay, no motion) with prefers-reduced-motion. */
(function () {
  var reel = document.getElementById('wall');
  if (!reel) return;
  var slides = [].slice.call(reel.querySelectorAll('.slide'));
  var bars = [].slice.call(reel.querySelectorAll('.sectors button'));
  var cap = document.getElementById('reelCap'), capN = document.getElementById('reelN');
  var inner = reel.querySelector('.reel-in'), streak = reel.querySelector('.streak');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var N = slides.length, cur = -1;

  function go(i) {
    i = (i + N) % N;
    if (i === cur) return;
    cur = i;
    slides.forEach(function (s, k) {
      s.classList.toggle('on', k === i);
      if (k === i || k === (i + 1) % N) { var im = s.querySelector('img'); if (im.loading === 'lazy') im.loading = 'eager'; }
    });
    bars.forEach(function (b, k) {
      b.classList.toggle('done', k < i);
      b.classList.remove('cur');
      b.setAttribute('aria-current', k === i ? 'true' : 'false');
    });
    var b = bars[i]; void b.offsetWidth; b.classList.add('cur'); // restart the fill animation
    if (cap) cap.textContent = slides[i].getAttribute('data-cap');
    if (capN) capN.textContent = 'S' + (i + 1);
    if (streak && !reduced) { streak.classList.remove('go'); void streak.offsetWidth; streak.classList.add('go'); }
  }

  if (!reduced) reel.classList.add('auto');
  // the sector fill animation drives the autoplay (it pauses with .paused / hidden tabs automatically)
  bars.forEach(function (b, k) {
    b.addEventListener('click', function () { go(k); });
    b.querySelector('b').addEventListener('animationend', function () { if (k === cur && reel.classList.contains('auto')) go(cur + 1); });
  });

  // swipe the photo
  var sx = 0, sy = 0, down = false;
  reel.addEventListener('pointerdown', function (e) { if (e.target.closest('button')) return; down = true; sx = e.clientX; sy = e.clientY; });
  reel.addEventListener('pointerup', function (e) {
    if (!down) return; down = false;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(cur + (dx < 0 ? 1 : -1));
  });
  reel.addEventListener('pointercancel', function () { down = false; });

  if (!reduced) {
    var raf = 0, visible = true;
    function onScroll() {
      if (raf || !visible) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var r = reel.getBoundingClientRect();
        var p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
        inner.style.setProperty('--py', (p * r.height * 0.28).toFixed(1) + 'px');
        inner.style.setProperty('--sc', (1 + p * 0.12).toFixed(4));
      });
    }
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    reel.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = reel.getBoundingClientRect();
      inner.style.setProperty('--px', (((e.clientX - r.left) / r.width - 0.5) * -18).toFixed(1) + 'px');
    });
    reel.addEventListener('pointerleave', function () { inner.style.setProperty('--px', '0px'); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) onScroll(); }).observe(reel);
  }
  go(0);
})();
