/* Photo-real hero: the 24-hour dial becomes a porthole onto the cafe's real food (photos from its Yandex Maps card).
   Six photos sit on six 4-hour sectors of the ring; a saffron arc marks the sector being shown. The dial auto-turns
   through the day, drag/swipe turns it by hand (snaps to a sector), the pointer tilts the dial in 3D while the photo
   drifts the other way (depth), and scroll tips the dial back and zooms the photo. The live Moscow-time spark (#hand)
   is still driven by the page's own clock code. */
(function () {
  var dial = document.getElementById('dial'), d3 = document.getElementById('dial3d'), port = document.getElementById('port');
  var arc = document.getElementById('slotArc'), cap = document.querySelector('#phcap span');
  if (!dial || !d3 || !port) return;
  var PH = [
    ['grill', 'шампуры на мангале', 'Шампуры на мангале, дым над углями'],
    ['shashlik', 'шашлык с луком', 'Шашлык и рёбрышки с кольцами лука'],
    ['soup', 'суп и хлеб', 'Тарелка супа и хлеб в корзинке'],
    ['doner', 'мясо с рисом и овощами', 'Мясо с рисом, помидорами и огурцами'],
    ['pide', 'пиде', 'Пиде с начинкой на блюде'],
    ['platter', 'мясное ассорти', 'Большое блюдо: шашлык, люля, овощи, соус']
  ];
  var N = PH.length, SEC = 360 / N;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var figs = [port.querySelector('.ph')];
  for (var i = 1; i < N; i++) {
    var f = document.createElement('figure'); f.className = 'ph';
    f.innerHTML = '<img src="img/' + PH[i][0] + '.webp" alt="' + PH[i][2] + '" loading="lazy" decoding="async">';
    port.appendChild(f); figs.push(f);
  }
  // preload the next photos once the page has settled so crossfades never show a blank
  addEventListener('load', function () { figs.forEach(function (f) { var im = f.querySelector('img'); im.loading = 'eager'; }); });

  function arcPath(a0, a1) { // degrees clockwise from 12 o'clock on r=158
    var r = 158, p = function (a) { var t = (a - 90) * Math.PI / 180; return (200 + Math.cos(t) * r).toFixed(1) + ' ' + (200 + Math.sin(t) * r).toFixed(1); };
    return 'M' + p(a0) + ' A' + r + ' ' + r + ' 0 0 1 ' + p(a1);
  }

  var cur = 0, angle = SEC / 2, target = angle, drag = false, lastX = 0, moved = 0, idleT = 0, visible = true;
  var tx = 0, ty = 0, px = 0, py = 0, scrollP = 0;
  function show(k) {
    k = ((k % N) + N) % N; if (k === cur) return;
    figs[cur].classList.remove('on'); figs[k].classList.add('on'); cur = k;
    if (cap) cap.textContent = PH[k][1];
  }

  dial.addEventListener('pointerdown', function (e) { drag = true; moved = 0; lastX = e.clientX; dial.setPointerCapture(e.pointerId); dial.classList.add('grab'); });
  dial.addEventListener('pointermove', function (e) {
    var r = dial.getBoundingClientRect();
    if (e.pointerType === 'mouse') { tx = ((e.clientX - r.left) / r.width - .5) * 2; ty = ((e.clientY - r.top) / r.height - .5) * 2; }
    if (!drag) return;
    var dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
    angle += dx * 0.45; target = angle;
  });
  function end() {
    if (!drag) return; drag = false; dial.classList.remove('grab');
    if (moved < 6) target = (Math.floor(angle / SEC) + 1) * SEC + SEC / 2; // a tap = next photo
    else target = Math.round((angle - SEC / 2) / SEC) * SEC + SEC / 2;
    idleT = 0;
  }
  dial.addEventListener('pointerup', end); dial.addEventListener('pointercancel', end);
  dial.addEventListener('pointerleave', function () { tx = 0; ty = 0; });
  dial.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { target += e.key === 'ArrowRight' ? SEC : -SEC; idleT = 0; } });
  dial.tabIndex = 0; dial.setAttribute('aria-label', 'Фото блюд на циферблате: стрелки влево/вправо листают');

  function onScroll() { var r = dial.getBoundingClientRect(); scrollP = Math.min(1, Math.max(0, -r.top / (r.height * 0.9))); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(dial);

  var last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(64, now - last); last = now;
    if (!visible || document.hidden) return;
    if (!drag && !reduced) { idleT += dt; if (idleT > 4200) { idleT = 0; target += SEC; } }
    if (!drag) angle += (target - angle) * (reduced ? 1 : 0.07);
    var a = ((angle % 360) + 360) % 360, k = Math.floor(a / SEC);
    show(k);
    arc.setAttribute('d', arcPath(k * SEC + 3, (k + 1) * SEC - 3));
    if (reduced) return;
    px += (tx - px) * 0.08; py += (ty - py) * 0.08;
    var rx = -py * 7 + scrollP * 22, ry = px * 9;
    d3.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) scale(' + (1 - scrollP * 0.06).toFixed(3) + ')';
    var sh = 'translate3d(' + (-px * 14).toFixed(1) + 'px,' + (-py * 14 + scrollP * 30).toFixed(1) + 'px,0) scale(' + (1 + scrollP * 0.12).toFixed(3) + ')';
    figs[cur].style.transform = sh;
    port.style.setProperty('--gx', (40 + px * 30).toFixed(1) + '%');
  }
  arc.setAttribute('d', arcPath(3, SEC - 3));
  requestAnimationFrame(frame);
})();
