/* Photo-real hero: a three-leaf fitting-room mirror (трюмо) holding the atelier's real photos
   (Yandex Maps card). Pure CSS 3D: the wings are hinged to the centre leaf; scroll folds them in,
   the pointer turns the whole mirror, a glass sheen follows. Swipe / arrows step the photos along
   the leaves with a crossfade. Pauses off-screen; static under prefers-reduced-motion. */
(function () {
  var tp = document.getElementById('tp');
  if (!tp || !CSS.supports('transform-style', 'preserve-3d')) return;
  var PH = [
    ['white-dress', 'белое платье на манекене', 'Белое платье на манекене'],
    ['lace-back', 'кружево и пуговицы на спинке платья', 'Кружево и пуговицы на спинке платья'],
    ['coat', 'дублёнка с меховой отделкой', 'Дублёнка с меховой отделкой на манекене'],
    ['workshop', 'мастерская ателье', 'Мастерская: швейные машины и стеллаж с нитками']
  ];
  var N = PH.length, cur = 1, busy = false, visible = true;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stage = document.getElementById('tpStage'), rig = document.getElementById('tpRig');
  var panes = ['.tp-l', '.tp-c', '.tp-r'].map(function (q) { return rig.querySelector(q); });
  var cap = document.getElementById('tpCap');
  panes.forEach(function (p) { var im = document.createElement('img'); im.className = 'tp-im'; im.alt = ''; im.decoding = 'async'; im.draggable = false; im.setAttribute('aria-hidden', 'true'); im.src = p.querySelector('.tp-im').getAttribute('src'); p.querySelector('.tp-glass').insertBefore(im, p.querySelector('.tp-sheen')); });

  function show(to) {
    if (busy) return;
    cur = (to + N) % N; busy = true;
    var jobs = panes.map(function (p, k) {
      var d = PH[(cur - 1 + k + N) % N], ims = p.querySelectorAll('.tp-im');
      if (ims.length < 2) return Promise.resolve(function () {});
      var on = p.querySelector('.tp-im.on'), off = on === ims[0] ? ims[1] : ims[0];
      off.src = 'img/' + d[0] + '.webp'; off.alt = d[2];
      return (off.decode ? off.decode() : Promise.resolve()).catch(function () {}).then(function () {
        return function () { off.classList.add('on'); off.removeAttribute('aria-hidden'); on.classList.remove('on'); on.setAttribute('aria-hidden', 'true'); on.alt = ''; };
      });
    });
    Promise.all(jobs).then(function (fns) {
      fns.forEach(function (f, k) { setTimeout(f, reduced ? 0 : k * 90); });
      cap.textContent = PH[cur][1];
      kick = 1;
      setTimeout(function () { busy = false; }, reduced ? 0 : 750);
    });
    t0 = performance.now();
  }
  document.getElementById('tpPrev').addEventListener('click', function () { show(cur - 1); });
  document.getElementById('tpNext').addEventListener('click', function () { show(cur + 1); });

  var sx = 0, sy = 0, down = false;
  stage.addEventListener('pointerdown', function (e) { down = true; sx = e.clientX; sy = e.clientY; });
  stage.addEventListener('pointerup', function (e) {
    if (!down) return; down = false;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 34 && Math.abs(dx) > Math.abs(dy)) show(cur + (dx < 0 ? 1 : -1));
  });
  stage.addEventListener('pointercancel', function () { down = false; });

  var px = 0, py = 0, tx = 0, ty = 0, sp = 0, kick = 0, t0 = performance.now(), HOLD = 5600;
  if (!reduced && matchMedia('(hover: hover)').matches) {
    tp.addEventListener('pointermove', function (e) { var r = tp.getBoundingClientRect(); px = (e.clientX - r.left) / r.width - .5; py = (e.clientY - r.top) / r.height - .5; });
    tp.addEventListener('pointerleave', function () { px = 0; py = 0; });
  }
  function onScroll() { var r = tp.getBoundingClientRect(); sp = Math.min(1, Math.max(0, -r.top / (r.height * .85))); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(tp);

  function frame(now) {
    tx += (px - tx) * .07; ty += (py - ty) * .07;
    kick *= .93;
    var t = now / 1000;
    var breathe = reduced ? 0 : Math.sin(t * .7) * 3;
    var wing = 32 + breathe + sp * 40 + kick * 14;           // scroll folds the wings in
    rig.style.setProperty('--wing', wing.toFixed(2) + 'deg');
    rig.style.setProperty('--ry', (tx * 16).toFixed(2) + 'deg');
    rig.style.setProperty('--rx', (-ty * 6 + sp * 8).toFixed(2) + 'deg');
    rig.style.setProperty('--cz', (24 - sp * 20).toFixed(1) + 'px');
    rig.style.setProperty('--wb', (.9 - sp * .25 - kick * .1).toFixed(3));
    var sheen = (reduced ? -30 : ((t * 18) % 160) - 80) + tx * 60;
    panes.forEach(function (p, k) { p.querySelector('.tp-sheen').style.setProperty('--sx', (sheen + (k - 1) * 25).toFixed(1) + '%'); });
  }
  function tick(now) {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) { t0 = now - Math.min(now - t0, HOLD - 800); return; }
    if (reduced) return;
    frame(now);
    if (!busy && !down && now - t0 > HOLD) show(cur + 1);
  }
  frame(performance.now());
  requestAnimationFrame(tick);
})();

/* the real place: subtle pointer tilt on the reception photo */
(function () {
  var f = document.querySelector('.in-photo');
  if (!f || matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover: hover)').matches) return;
  f.addEventListener('pointermove', function (e) { var r = f.getBoundingClientRect(); f.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 10 + 'deg'); f.style.setProperty('--rx', (.5 - (e.clientY - r.top) / r.height) * 8 + 'deg'); });
  f.addEventListener('pointerleave', function () { f.style.setProperty('--ry', '0deg'); f.style.setProperty('--rx', '0deg'); });
})();
