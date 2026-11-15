/* Photo-real hero: a poster-print deck of the café's real photos (from its Yandex Maps card).
   Pure CSS 3D: the top print is tossed to the back every few seconds; swipe/drag throws it,
   tap flips to the next one, scrolling fans the deck out in depth, the pointer tilts it.
   Also translates the #spot (place) section and every photo caption/alt with the RU/AR toggle. */
(function () {
  var de = document.documentElement;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var L = function () { return de.lang === 'ar' ? 'ar' : 'ru'; };
  var TXT = {
    ru: { hint: '← свайп · листать фото →', credit: 'фото с Яндекс Карт', master: 'Мастер за стойкой кафе',
      spotK: 'Место · Московское шоссе, 33А', spotH: 'Вертел прямо за стойкой',
      spotT: 'Так выглядит кафе: стойка, вертел и меню над прилавком. Шаурму собирают на глазах у гостей — снимки гостей и кафе, без постановки.' },
    ar: { hint: '← اسحب · تصفّح الصور →', credit: 'صور من خرائط ياندكس', master: 'المعلّم خلف الكاونتر',
      spotK: 'المكان · طريق موسكو السريع، 33А', spotH: 'السيخ خلف الكاونتر مباشرة',
      spotT: 'هكذا يبدو المقهى: كاونتر وسيخ وقائمة فوق المنضدة. تُحضَّر الشاورما أمام الزبائن — صور الزبائن والمقهى كما هي.' }
  };
  var CAP = {
    spit: ['вертел с курицей', 'سيخ الدجاج'], roll: ['шаурма в разрезе', 'الشاورما من الداخل'],
    lavash: ['начинка на лаваше', 'الحشوة على الخبز'], plate: ['тарелка с картофелем фри', 'طبق مع بطاطا مقلية'],
    cut: ['крупным планом', 'عن قرب'], box: ['порция в контейнере', 'وجبة في علبة'],
    night: ['вход вечером', 'المدخل مساءً'], counter: ['стойка и витрина', 'الكاونتر والواجهة'],
    cook: ['сборка шаурмы', 'تحضير الشاورما'], hall: ['зал', 'الصالة'], 'grill-hand': ['у вертела', 'عند السيخ']
  };
  var cap = function (k) { return CAP[k][L() === 'ar' ? 1 : 0]; };

  /* ---------- hero deck ---------- */
  var col = document.getElementById('collage');
  var deck, cards = [], order = [], hint, label, fan = 0, tx = 0, ty = 0, busy = false, visible = true, lastTouch = 0;
  if (col && CSS.supports('transform-style', 'preserve-3d')) {
    var HERO = ['spit', 'roll', 'lavash', 'plate', 'cut', 'box'];
    deck = document.createElement('div'); deck.className = 'deck';
    var tilt = document.createElement('div'); tilt.className = 'deck-tilt';
    HERO.forEach(function (k, i) {
      var f = document.createElement('figure'); f.className = 'dk'; f.dataset.k = k;
      f.innerHTML = '<img src="img/' + k + '.webp" alt="" draggable="false" decoding="async"' + (i > 1 ? ' loading="lazy"' : '') + '>';
      tilt.appendChild(f); cards.push(f); order.push(i);
    });
    deck.appendChild(tilt); col.prepend(deck);
    label = document.createElement('p'); label.className = 'dk-label'; label.innerHTML = '<span></span><small></small>'; col.appendChild(label);
    hint = document.createElement('span'); hint.className = 'dk-hint'; col.appendChild(hint);
    col.classList.add('has-deck');

    var place = function (drag) {
      var side = de.dir === 'rtl' ? -1 : 1;
      order.forEach(function (ci, k) {
        var c = cards[ci];
        if (c.classList.contains('toss')) return;
        var s = k % 2 ? -1 : 1;
        var x = side * s * k * (5 + fan * 22), y = -k * (6 - fan * 2), z = -k * (34 + fan * 50);
        var rz = s * (k ? 2.5 + k * 1.6 + fan * 4 : 0), ry = -side * s * fan * k * 6;
        if (k === 0 && drag) { x += drag; rz += drag * 0.06; y -= Math.abs(drag) * 0.08; }
        c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateZ(' + rz.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
        c.style.zIndex = 50 - k;
        c.style.setProperty('--shade', Math.min(0.5, k * 0.1).toFixed(2));
        c.classList.toggle('top', k === 0);
        var img = c.querySelector('img'); if (k < 3 && img.loading === 'lazy') img.loading = 'eager';
      });
      tilt.style.transform = 'rotateX(' + (ty * 7).toFixed(2) + 'deg) rotateY(' + (tx * 9).toFixed(2) + 'deg)';
      var top = cards[order[0]].dataset.k;
      label.firstChild.textContent = cap(top);
    };
    var next = function (dir) {
      if (busy) return; busy = true;
      var side = de.dir === 'rtl' ? -1 : 1, c = cards[order[0]];
      dir = dir || side;
      c.classList.add('toss');
      c.style.transform = 'translate3d(' + (dir * 115) + '%,-6%,40px) rotateZ(' + (dir * 16) + 'deg) rotateY(' + (dir * -22) + 'deg)';
      setTimeout(function () {
        order.push(order.shift());
        c.classList.remove('toss'); place();
        setTimeout(function () { busy = false; }, 120);
      }, reduced ? 0 : 360);
    };

    // drag / swipe the top print; a tap flips to the next one
    var down = false, sx = 0, sy = 0, dx = 0, moved = false;
    deck.addEventListener('pointerdown', function (e) { if (busy) return; down = true; moved = false; sx = e.clientX; sy = e.clientY; dx = 0; lastTouch = Date.now(); cards[order[0]].classList.add('drag'); });
    deck.addEventListener('pointermove', function (e) {
      if (down) {
        dx = e.clientX - sx;
        if (!moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - sy)) { moved = true; try { deck.setPointerCapture(e.pointerId); } catch (er) {} }
        if (moved) place(dx);
      } else if (e.pointerType === 'mouse' && !reduced) {
        var r = deck.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - 0.5; ty = 0.5 - (e.clientY - r.top) / r.height; place();
      }
    });
    var up = function (e) {
      if (!down) return; down = false; lastTouch = Date.now();
      cards[order[0]].classList.remove('drag');
      if (moved && Math.abs(dx) > 50) next(dx > 0 ? 1 : -1);
      else if (!moved && e.type === 'pointerup') next();
      else place();
    };
    deck.addEventListener('pointerup', up); deck.addEventListener('pointercancel', up);
    deck.addEventListener('pointerleave', function () { if (!down) { tx = ty = 0; place(); } });

    var raf = 0;
    var onScroll = function () {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var r = col.getBoundingClientRect();
        fan = reduced ? 0 : Math.min(1, Math.max(0, (innerHeight * 0.5 - r.top) / (r.height * 1.1)));
        if (!busy) place();
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(col);
    if (!reduced) setInterval(function () { if (visible && !document.hidden && !down && Date.now() - lastTouch > 5000) next(); }, 3400);
    addEventListener('resize', function () { place(); });
    onScroll(); place();
  }

  /* ---------- texts that follow the language toggle ---------- */
  function applyLang() {
    var l = L(), T = TXT[l];
    if (hint) hint.textContent = T.hint;
    if (label) { label.lastChild.textContent = T.credit; label.firstChild.textContent = cap(cards[order[0]].dataset.k); }
    cards.forEach(function (c) { c.querySelector('img').alt = cap(c.dataset.k); });
    document.querySelectorAll('[data-ph]').forEach(function (el) { el.textContent = T[el.getAttribute('data-ph')]; });
    document.querySelectorAll('#spot [data-cap]').forEach(function (f) {
      var k = f.getAttribute('data-cap'), t = k === 'master' ? T.master : cap(k);
      f.querySelector('img').alt = t; var fc = f.querySelector('figcaption'); if (fc) fc.textContent = t;
    });
    if (deck) cards.length && (busy || place());
  }
  new MutationObserver(applyLang).observe(de, { attributes: true, attributeFilter: ['lang', 'dir'] });
  applyLang();

  /* pointer tilt on the main place photo */
  var mp = document.querySelector('.spot-photo');
  if (mp && !reduced) {
    mp.addEventListener('pointermove', function (e) { var r = mp.getBoundingClientRect(); mp.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 10 + 'deg'); mp.style.setProperty('--rx', (0.5 - (e.clientY - r.top) / r.height) * 8 + 'deg'); });
    mp.addEventListener('pointerleave', function () { mp.style.setProperty('--ry', '0deg'); mp.style.setProperty('--rx', '0deg'); });
  }
})();
