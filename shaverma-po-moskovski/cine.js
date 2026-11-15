/* Photo-real hero: a cinematic "platform screen" of the shop's real photos (from its Yandex Maps card).
   Slow Ken-Burns drift inside each shot, crossfades every few seconds like stations passing by,
   a red metro line with one station per photo (tap a station, or swipe the screen), the current
   shot glows blurred behind the whole hero, and scrolling pushes the picture in (zoom + parallax).
   Also: pointer tilt on the main photo of the #people section. */
(function () {
  var art = document.getElementById('art');
  var hero = document.getElementById('hero');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SHOTS = [
    ['master-roll', 'Мастер у стойки', 'Мастер заворачивает шаверму'],
    ['cut', 'Шаверма в разрезе', 'Шаверма в разрезе, в фольге'],
    ['spit-counter', 'Вертел и начинки', 'Вертел и лотки с начинками за стойкой'],
    ['shawarma-hand', 'Две шавермы', 'Две шавермы в лаваше'],
    ['night-sign', 'Вывеска ночью', 'Вывеска «Шаверма по-Московски» ночью']
  ];
  if (!art || !hero) return;
  var N = SHOTS.length, cur = -1, timer = 0, visible = true;

  var cine = document.createElement('div'); cine.className = 'cine';
  var frame = '<div class="cine-frame"><div class="cine-par">';
  SHOTS.forEach(function (s, i) {
    frame += '<figure class="cs" style="--kx:' + (i % 2 ? -3 : 3) + '%;--ky:' + (i % 3 ? -2 : 2) + '%"><img src="img/' + s[0] + '.webp" alt="' + s[2] + '" draggable="false" decoding="async"' + (i ? ' loading="lazy"' : ' fetchpriority="high"') + '></figure>';
  });
  frame += '</div><div class="cine-board" aria-live="polite"><small>Станция</small><b></b></div><span class="cine-cr">фото с Яндекс Карт</span></div>';
  var line = '<ol class="cine-line" aria-label="Фото">';
  SHOTS.forEach(function (s, i) { line += '<li><button type="button" aria-label="' + s[1] + '"><i></i></button></li>'; });
  cine.innerHTML = frame + line + '</ol>';
  var roll = art.querySelector('svg.roll'); if (roll) roll.remove();
  art.prepend(cine); art.classList.add('has-cine');

  var bg = document.createElement('div'); bg.className = 'hero-bg'; bg.setAttribute('aria-hidden', 'true');
  bg.innerHTML = '<i></i><i></i>'; hero.prepend(bg);
  var bgs = bg.children, bgi = 0;

  var slides = cine.querySelectorAll('.cs'), dots = cine.querySelectorAll('.cine-line li'), board = cine.querySelector('.cine-board b');
  function go(i) {
    i = (i + N) % N; if (i === cur) return; cur = i;
    slides.forEach(function (s, k) { s.classList.toggle('on', k === i); if (k === (i + 1) % N) { var im = s.querySelector('img'); if (im.loading === 'lazy') im.loading = 'eager'; } });
    dots.forEach(function (d, k) { d.classList.toggle('on', k === i); d.classList.toggle('done', k < i); });
    board.textContent = SHOTS[i][1];
    bgi = 1 - bgi; bgs[bgi].style.backgroundImage = 'url(img/' + SHOTS[i][0] + '.webp)';
    bgs[bgi].classList.add('on'); bgs[1 - bgi].classList.remove('on');
    restart();
  }
  function restart() { clearInterval(timer); if (!reduced) timer = setInterval(function () { if (visible && !document.hidden) go(cur + 1); }, 5200); }
  dots.forEach(function (d, k) { d.querySelector('button').addEventListener('click', function () { go(k); }); });

  // swipe the screen
  var fr = cine.querySelector('.cine-frame'), sx = 0, sy = 0, down = false;
  fr.addEventListener('pointerdown', function (e) { down = true; sx = e.clientX; sy = e.clientY; });
  fr.addEventListener('pointerup', function (e) {
    if (!down) return; down = false;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(cur + (dx < 0 ? 1 : -1));
  });
  fr.addEventListener('pointercancel', function () { down = false; });

  // scroll pushes the picture in
  var par = cine.querySelector('.cine-par'), raf = 0;
  function onScroll() {
    if (raf || reduced) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      var r = fr.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight * 0.55 - r.top) / (r.height + innerHeight * 0.4)));
      par.style.transform = 'translate3d(0,' + (p * 6).toFixed(2) + '%,0) scale(' + (1 + p * 0.12).toFixed(4) + ')';
      bg.style.transform = 'translate3d(0,' + (p * 60).toFixed(1) + 'px,0) scale(1.1)';
    });
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; cine.classList.toggle('paused', !visible); }).observe(fr);
  go(0);

  /* pointer tilt on the main #people photo */
  var f = document.querySelector('.ppl-photo');
  if (f && !reduced) {
    f.addEventListener('pointermove', function (e) { var r = f.getBoundingClientRect(); f.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 10 + 'deg'); f.style.setProperty('--rx', (0.5 - (e.clientY - r.top) / r.height) * 8 + 'deg'); });
    f.addEventListener('pointerleave', function () { f.style.setProperty('--ry', '0deg'); f.style.setProperty('--rx', '0deg'); });
  }
})();
