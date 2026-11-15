/* Photo accent for the hero: a small 3D deck of real photos from the shop's Yandex Maps card.
   Cards are fanned in perspective; the deck spreads as you scroll, tilts toward the pointer,
   flips to the next photo by itself (paused off-screen), on tap, or on a sideways swipe. */
(function () {
  var host = document.getElementById('hero');
  if (!host || !CSS.supports('transform-style', 'preserve-3d')) return;
  var P = [
    ['shopfront', 'витрина на Манежной', 'واجهة المحل في ساحة مانيجنايا'],
    ['coffee-sand', 'латунная жаровня с песком для кофе', 'موقد نحاسي بالرمل لتحضير القهوة'],
    ['pastry', 'зелёная сладость с фисташкой', 'حلوى خضراء بالفستق'],
    ['shop', 'полки с кофе и сладостями', 'رفوف القهوة والحلويات']
  ];
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isAr = function () { return document.documentElement.lang === 'ar'; };
  var box = document.createElement('div'); box.className = 'pdeck';
  var stage = document.createElement('div'); stage.className = 'pdeck-stage';
  var tilt = document.createElement('div'); tilt.className = 'pdeck-tilt';
  var cards = P.map(function (p, i) {
    var f = document.createElement('figure'); f.className = 'pcard';
    f.innerHTML = '<img src="img/' + p[0] + '.webp" alt="" draggable="false" ' + (i > 1 ? 'loading="lazy" ' : '') + 'decoding="async"><span class="glare"></span>';
    tilt.appendChild(f); return f;
  });
  var cap = document.createElement('p'); cap.className = 'pdeck-cap'; cap.innerHTML = '<span></span><small></small>';
  stage.appendChild(tilt); box.appendChild(stage); box.appendChild(cap);
  var txt = host.querySelector('.hero-txt'), art = document.getElementById('art');
  var mq = matchMedia('(min-width:900px)');
  function place() { if (mq.matches) art.appendChild(box); else txt.parentNode.insertBefore(box, txt); }
  place(); (mq.addEventListener ? mq.addEventListener('change', place) : mq.addListener(place));

  var order = P.map(function (_, i) { return i; }); // order[0] = front
  var spread = 0, rx = 0, ry = 0, trx = 0, try_ = 0, visible = true, dragX = null, dx = 0, flying = false;
  function poseOf(k, s) {
    // k = depth (0 front). s = spread 0..1
    var X = [0, 46, -44, 10][k] * (0.55 + s * 0.75), Y = [0, -6, -4, -14][k], Z = [0, -60, -110, -170][k];
    var RZ = [-2, 8, -9, 3][k] * (0.6 + s * 0.6), RY = [0, -16, 14, 0][k] * s;
    return 'translate3d(' + X + '%,' + Y + '%,' + Z + 'px) rotateZ(' + RZ + 'deg) rotateY(' + RY + 'deg)';
  }
  function render() {
    order.forEach(function (ci, k) {
      var c = cards[ci];
      if (k === 0 && dragX !== null) c.style.transform = 'translate3d(' + dx + 'px,0,20px) rotateZ(' + (dx * 0.05) + 'deg)';
      else if (!(flying && k === order.length - 1 && c.classList.contains('fly'))) c.style.transform = poseOf(k, spread);
      c.style.zIndex = 10 - k;
      c.style.filter = 'brightness(' + (1 - k * 0.12).toFixed(2) + ') saturate(' + (1 - k * 0.12).toFixed(2) + ')';
      c.classList.toggle('front', k === 0);
    });
    tilt.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
  }
  function caption() {
    var p = P[order[0]];
    cap.firstChild.textContent = isAr() ? p[2] : p[1];
    cap.lastChild.textContent = isAr() ? 'صور من خرائط ياندكس' : 'фото с Яндекс Карт';
    cards.forEach(function (c, i) { c.querySelector('img').alt = isAr() ? P[i][2] : P[i][1]; });
  }
  function next(dir) {
    if (flying) return;
    flying = true;
    var ci = order[0], c = cards[ci];
    c.classList.add('fly');
    c.style.transform = 'translate3d(' + (dir || 1) * 120 + '%,-6%,40px) rotateZ(' + (dir || 1) * 16 + 'deg) rotateY(' + (dir || 1) * -20 + 'deg)';
    setTimeout(function () {
      order.push(order.shift()); c.classList.remove('fly'); flying = false; render(); caption();
    }, 380);
  }
  // pointer: drag to throw the front card, tap for next
  var downAt = 0, moved = false;
  stage.addEventListener('pointerdown', function (e) { dragX = e.clientX; dx = 0; moved = false; downAt = Date.now(); stage.setPointerCapture(e.pointerId); box.classList.add('grab'); });
  stage.addEventListener('pointermove', function (e) {
    if (dragX === null) { if (e.pointerType === 'mouse') { var r = stage.getBoundingClientRect(); try_ = ((e.clientX - r.left) / r.width - 0.5) * 16; trx = (0.5 - (e.clientY - r.top) / r.height) * 12; } return; }
    dx = e.clientX - dragX; if (Math.abs(dx) > 6) moved = true; render();
  });
  function up() {
    if (dragX === null) return;
    var d = dx; dragX = null; dx = 0; box.classList.remove('grab');
    if (Math.abs(d) > 50) next(d > 0 ? 1 : -1); else if (!moved) next(isAr() ? -1 : 1); else render();
    last = Date.now();
  }
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  stage.addEventListener('pointerleave', function () { trx = try_ = 0; });

  function onScroll() { var r = box.getBoundingClientRect(); spread = 0.35 + 0.65 * Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / (innerHeight * 0.6))); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(box);
  document.addEventListener('langchange', caption);
  // keep the fan legible even before the user scrolls
  var last = Date.now();
  function tick() {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    rx += (trx - rx) * 0.08; ry += (try_ - ry) * 0.08;
    if (dragX === null && !flying) render();
    if (!reduced && dragX === null && Date.now() - last > 3800) { last = Date.now(); next(isAr() ? -1 : 1); }
  }
  render(); caption(); box.classList.add('on');
  if (reduced) { render(); return; }
  tick();
})();
