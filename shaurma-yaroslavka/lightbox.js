/* Photo hero: a neon light-box with the shop's real photos (from its Yandex Maps card).
   Pure CSS 3D: crossfades with a slow Ken-Burns push, the box tilts toward the pointer (or idly sways),
   the photo inside drifts against the tilt for depth, scrolling leans the box back. Swipe or dots to switch.
   Pauses off-screen; static with prefers-reduced-motion. */
(function () {
  var box = document.getElementById('lbox');
  if (!box) return;
  var tilt = box.querySelector('.lb-tilt'), frame = box.querySelector('.lb-frame');
  var slides = [].slice.call(box.querySelectorAll('.lb-slide'));
  var capEl = document.getElementById('lbCap'), dotsEl = document.getElementById('lbDots');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var N = slides.length, cur = 0, timer = 0, visible = true, DELAY = 5200;

  var dots = slides.map(function (s, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.setAttribute('aria-label', 'Фото ' + (i + 1) + ': ' + s.dataset.cap);
    if (i === 0) b.setAttribute('aria-current', 'true');
    b.addEventListener('click', function () { go(i, true); });
    dotsEl.appendChild(b); return b;
  });

  function go(i, user) {
    i = (i + N) % N; if (i === cur) return;
    slides[cur].classList.remove('on'); slides[i].classList.add('on');
    dots[cur].removeAttribute('aria-current'); dots[i].setAttribute('aria-current', 'true');
    cur = i; capEl.textContent = slides[i].dataset.cap;
    if (user) schedule();
  }
  function schedule() { clearTimeout(timer); if (!reduced && visible && !document.hidden) timer = setTimeout(function () { go(cur + 1); schedule(); }, DELAY); }

  /* swipe */
  var sx = 0, sy = 0, down = false;
  box.addEventListener('pointerdown', function (e) { down = true; sx = e.clientX; sy = e.clientY; box.classList.add('grab'); });
  function up(e) {
    if (!down) return; down = false; box.classList.remove('grab');
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) go(cur + (dx < 0 ? 1 : -1), true);
    else if (Math.abs(dx) < 6 && Math.abs(dy) < 6 && e.pointerType === 'mouse') go(cur + 1, true);
  }
  box.addEventListener('pointerup', up); box.addEventListener('pointercancel', function () { down = false; box.classList.remove('grab'); });
  box.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') go(cur + 1, true); if (e.key === 'ArrowLeft') go(cur - 1, true); });

  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; schedule(); }).observe(box);
  document.addEventListener('visibilitychange', schedule);
  schedule();
  if (reduced) return;

  /* tilt: pointer target + idle sway + scroll lean, eased each frame */
  var tx = 0, ty = 0, px = 0, py = 0, hover = false, scrollP = 0, t0 = performance.now();
  box.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var r = box.getBoundingClientRect(); hover = true;
    tx = ((e.clientX - r.left) / r.width - 0.5); ty = ((e.clientY - r.top) / r.height - 0.5);
  });
  box.addEventListener('pointerleave', function () { hover = false; });
  function onScroll() { var r = box.getBoundingClientRect(); scrollP = Math.min(1, Math.max(0, -r.top / (r.height * 0.9))); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  function tick(now) {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    var t = (now - t0) / 1000;
    var gx = hover ? tx : Math.sin(t * 0.45) * 0.32, gy = hover ? ty : Math.cos(t * 0.33) * 0.22;
    px += (gx - px) * 0.08; py += (gy - py) * 0.08;
    var ry = px * 14, rx = -py * 10 + scrollP * 16;
    tilt.style.setProperty('--ry', ry.toFixed(2) + 'deg');
    tilt.style.setProperty('--rx', rx.toFixed(2) + 'deg');
    tilt.style.setProperty('--tz', (-scrollP * 90).toFixed(1) + 'px');
    frame.style.setProperty('--gx', (50 + px * 90).toFixed(1) + '%');
    frame.style.setProperty('--gy', (py * 80).toFixed(1) + '%');
    var img = slides[cur].firstElementChild;
    img.style.setProperty('--px', (-px * 18).toFixed(1) + 'px');
    img.style.setProperty('--py', (-py * 14 + scrollP * 30).toFixed(1) + 'px');
  }
  requestAnimationFrame(tick);
})();
