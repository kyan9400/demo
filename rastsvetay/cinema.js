/* Photo-real hero: a cinematic arch of real «Расцветай» bouquets (photos from their Yandex Maps card).
   Slow Ken-Burns crossfade like stories, tap/swipe to change, scroll zooms into the photo and lifts
   the arch, pointer tilts it in 3D, a rotating address seal shows the next bouquet. No WebGL. */
(function () {
  var art = document.getElementById('heroArt');
  if (!art) return;
  var PHOTOS = [
    ['peonies-hydrangea', 'пионы, гортензия и розы', '50% 40%'], ['sunflowers', 'подсолнухи и зелень', '50% 30%'],
    ['hydrangea-lilac', 'гортензия в сиреневой гамме', '50% 40%'], ['daisies', 'ромашки и диантус', '50% 45%'],
    ['pastel-blue', 'нежный букет в шаре', '50% 60%']
  ];
  var DUR = 5600, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches, N = PHOTOS.length;

  var cine = document.createElement('div'); cine.className = 'cine';
  var arch = document.createElement('div'); arch.className = 'cine-arch';
  var zoom = document.createElement('div'); zoom.className = 'cine-zoom';
  var slides = PHOTOS.map(function (p, i) {
    var s = document.createElement('div'); s.className = 'cine-s' + (i === 0 ? ' on' : '');
    s.style.setProperty('--kx', (i % 2 ? -3 : 3) + '%'); s.style.setProperty('--ky', (i % 3 - 1) * 2 + '%');
    s.innerHTML = '<img src="img/' + p[0] + '.webp" alt="" style="object-position:' + p[2] + '" draggable="false"' + (i ? ' loading="lazy"' : ' fetchpriority="high"') + ' decoding="async">';
    zoom.appendChild(s); return s;
  });
  arch.appendChild(zoom);
  var bars = document.createElement('div'); bars.className = 'cine-bars';
  bars.innerHTML = PHOTOS.map(function () { return '<span><i></i></span>'; }).join('');
  arch.appendChild(bars);
  var cap = document.createElement('p'); cap.className = 'cine-cap';
  cap.innerHTML = '<small>настоящие букеты · фото с Яндекс Карт</small><span></span>';
  arch.appendChild(cap);
  cine.appendChild(arch);

  var seal = document.createElement('button'); seal.type = 'button'; seal.className = 'cine-seal'; seal.setAttribute('aria-label', 'Следующий букет');
  seal.innerHTML = '<svg viewBox="0 0 120 120" aria-hidden="true"><defs><path id="sealPath" d="M60 60m-47 0a47 47 0 1 1 94 0a47 47 0 1 1 -94 0"/></defs><text><textPath href="#sealPath" textLength="292" lengthAdjust="spacing">РАСЦВЕТАЙ · САДОВАЯ-КУДРИНСКАЯ, 32А ·</textPath></text></svg><img alt="" draggable="false" loading="lazy" decoding="async">';
  cine.appendChild(seal);
  art.prepend(cine);
  art.classList.add('has-photos');

  var barI = bars.querySelectorAll('i'), capT = cap.querySelector('span'), sealImg = seal.querySelector('img');
  var cur = 0, elapsed = 0;
  function show(n) {
    cur = (n + N) % N; elapsed = 0;
    slides.forEach(function (s, i) {
      if (i === cur) { s.classList.remove('on'); void s.offsetWidth; s.classList.add('on'); } else s.classList.remove('on');
    });
    barI.forEach(function (b, i) { b.style.transform = 'scaleX(' + (i < cur ? 1 : 0) + ')'; });
    capT.textContent = PHOTOS[cur][1];
    sealImg.src = 'img/' + PHOTOS[(cur + 1) % N][0] + '.webp';
  }
  show(0);
  seal.addEventListener('click', function () { show(cur + 1); });

  var sx = null, sy = 0;
  arch.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; });
  arch.addEventListener('pointerup', function (e) {
    if (sx === null) return;
    var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(cur + (dx < 0 ? 1 : -1));
    else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) { var r = arch.getBoundingClientRect(); show(cur + (e.clientX - r.left < r.width * 0.35 ? -1 : 1)); }
  });
  arch.addEventListener('pointercancel', function () { sx = null; });

  var tx = 0, ty = 0, cx = 0, cy = 0;
  art.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var r = art.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - .5) * 2; ty = ((e.clientY - r.top) / r.height - .5) * 2;
  });
  art.addEventListener('pointerleave', function () { tx = ty = 0; });

  var scrollP = 0, visible = true;
  function onScroll() { var r = art.getBoundingClientRect(); scrollP = Math.min(1, Math.max(0, -r.top / (r.height * 0.9) + 0.15)); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; art.classList.toggle('cine-paused', !visible); }).observe(art);

  if (reduced) { art.classList.add('cine-still'); return; }
  var last = performance.now();
  function tick(t) {
    requestAnimationFrame(tick);
    var dt = t - last; last = t;
    if (!visible || document.hidden) return;
    if (sx === null) elapsed += dt;
    if (elapsed >= DUR) show(cur + 1);
    barI[cur].style.transform = 'scaleX(' + Math.min(1, elapsed / DUR).toFixed(3) + ')';
    cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
    arch.style.transform = 'translateY(' + (-scrollP * 26).toFixed(1) + 'px) rotateY(' + (cx * 7).toFixed(2) + 'deg) rotateX(' + (cy * -5).toFixed(2) + 'deg)';
    zoom.style.transform = 'scale(' + (1 + scrollP * 0.14).toFixed(3) + ') translateY(' + (scrollP * 18).toFixed(1) + 'px)';
    seal.style.transform = 'translateY(' + (scrollP * 40).toFixed(1) + 'px)';
  }
  requestAnimationFrame(tick);
})();
