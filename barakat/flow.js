/* Photo-real hero: a 3D "cover flow" shelf of real photos from Barakat's Yandex Maps card.
   Pure CSS 3D + small JS: the centre photo faces you, the rest stand at an angle like books on a shelf.
   Steps by itself (paused off-screen), drag/swipe to browse, tap a side photo to bring it forward,
   scroll tilts the shelf. Static with prefers-reduced-motion. */
(function () {
  var host = document.getElementById('bookWrap');
  if (!host || !CSS.supports('transform-style', 'preserve-3d')) return;
  var P = [
    ['quran-covers', 'Кораны в тиснёных переплётах', 'مصاحف بأغلفة منقوشة'],
    ['shelves', 'стеллажи с книгами', 'رفوف الكتب'],
    ['book-hajj', 'книга «Хадж»', 'كتاب «الحج»'],
    ['plates-wall', 'настенные тарелки и часы с каллиграфией', 'أطباق وساعات جدارية بالخط العربي'],
    ['bestsellers', 'полка «Бестселлеры · новинки»', 'رف «الأكثر مبيعًا · الجديد»'],
    ['book-kids', 'детская книга «Я люблю Аллаха»', 'كتاب أطفال «أحب الله»'],
    ['frames-wall', 'стена с каллиграфией в рамах', 'جدار لوحات الخط العربي'],
    ['night-sign', 'вывеска магазина вечером', 'لافتة المكتبة مساءً']
  ];
  var N = P.length, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ar = function () { return document.documentElement.lang === 'ar'; };

  var flow = document.createElement('div'); flow.className = 'cflow';
  var floor = document.createElement('div'); floor.className = 'cflow-floor';
  var cards = P.map(function (p, i) {
    var f = document.createElement('figure'); f.className = 'ccard';
    f.innerHTML = '<img src="img/' + p[0] + '.webp" alt="" draggable="false" ' + (i > 2 && i < N - 2 ? 'loading="lazy" ' : '') + 'decoding="async"><span class="glare"></span>';
    f.addEventListener('click', function () { if (!moved) target = pos + wrapD(i - pos); last = Date.now(); });
    floor.appendChild(f); return f;
  });
  flow.appendChild(floor);
  var cap = document.createElement('p'); cap.className = 'cflow-cap'; cap.innerHTML = '<span></span><small></small>';
  host.prepend(flow); host.appendChild(cap); host.classList.add('has-flow');

  function wrapD(d) { d = ((d % N) + N) % N; return d > N / 2 ? d - N : d; }
  var pos = 0, target = 0, cw = 200, drag = null, moved = false, visible = true, scrollP = 0, last = Date.now(), front = -1;
  function layout() { cw = Math.min(flow.clientWidth * 0.5, 260); flow.style.setProperty('--cw', cw + 'px'); }
  new ResizeObserver(layout).observe(flow); layout();

  function render() {
    var best = 0, bestA = 9;
    cards.forEach(function (c, i) {
      var d = wrapD(i - pos), a = Math.abs(d), s = d < 0 ? -1 : 1, near = Math.min(a, 1);
      var x = d * cw * 0.34 + s * near * cw * 0.42;
      var z = -near * cw * 0.55 - a * 18;
      var ry = -s * near * 58;
      c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,' + z.toFixed(1) + 'px) rotateY(' + ry.toFixed(2) + 'deg)';
      c.style.zIndex = 100 - Math.round(a * 10);
      c.style.opacity = a > 3.2 ? Math.max(0, 1 - (a - 3.2) * 1.4).toFixed(2) : 1;
      c.style.filter = 'brightness(' + (1 - near * 0.32 - Math.max(0, a - 1) * 0.08).toFixed(3) + ')';
      c.style.setProperty('--gx', (50 - d * 40).toFixed(0) + '%');
      if (a < bestA) { bestA = a; best = i; }
    });
    floor.style.transform = 'translateY(' + (-scrollP * 26).toFixed(1) + 'px) rotateX(' + (4 + scrollP * 10).toFixed(2) + 'deg) scale(' + (1 + scrollP * 0.05).toFixed(3) + ')';
    if (best !== front) { front = best; cards.forEach(function (c, i) { c.classList.toggle('front', i === best); }); caption(); }
  }
  function caption() {
    cap.firstChild.textContent = P[front < 0 ? 0 : front][ar() ? 2 : 1];
    cap.lastChild.textContent = ar() ? 'صور حقيقية من خرائط ياندكس · اسحب للتصفح' : 'настоящие фото с Яндекс Карт · листайте свайпом';
    cards.forEach(function (c, i) { c.querySelector('img').alt = P[i][ar() ? 2 : 1]; });
  }
  document.addEventListener('langchange', caption);

  flow.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, p: pos }; moved = false; flow.classList.add('grab'); });
  addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x; if (Math.abs(dx) > 6) moved = true;
    pos = target = drag.p - dx / (cw * 0.62);
  });
  function up() { if (!drag) return; drag = null; flow.classList.remove('grab'); target = Math.round(pos); last = Date.now(); }
  addEventListener('pointerup', up); addEventListener('pointercancel', up);

  function onScroll() { var r = host.getBoundingClientRect(); scrollP = Math.min(1, Math.max(0, (innerHeight * 0.4 - r.top) / (r.height * 0.9))); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(flow);

  render(); caption();
  if (reduced) { addEventListener('pointerup', function () { pos = target; render(); }); flow.addEventListener('click', function () { pos = target; render(); }); return; }
  (function tick() {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    if (!drag && Date.now() - last > 3400) { target += ar() ? -1 : 1; last = Date.now(); }
    if (!drag) pos += (target - pos) * 0.085;
    render();
  })();
})();
