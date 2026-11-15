/* Replaces the Yandex map widget iframe (which shows third-party ads) with a static map image
   that links to the route in Yandex Maps. Shared by all demo pages: <script src="../map-fix.js" defer></script> */
(function () {
  var B = window.BIZ || {};
  function staticUrl(lat, lon) {
    return 'https://static-maps.yandex.ru/1.x/?l=map&lang=ru_RU&size=650,450&z=16&ll=' + lon + ',' + lat + '&pt=' + lon + ',' + lat + ',pm2rdm';
  }
  function coordsFrom(src) {
    var m = /[?&]ll=([\d.]+)%2C([\d.]+)/i.exec(src || '') || /[?&]ll=([\d.]+),([\d.]+)/i.exec(src || '');
    if (m) return [+m[2], +m[1]];
    return B.coords || null;
  }
  function swap(f) {
    if (f.__fixed) return;
    var src = f.getAttribute('src') || f.getAttribute('data-src') || '';
    if (src && !/map-widget|yandex\.ru\/map/i.test(src)) return;
    var c = coordsFrom(src);
    if (!c) return;
    f.__fixed = true;
    var a = document.createElement('a');
    a.href = B.routeUrl || ('https://yandex.ru/maps/?rtext=~' + c[0] + '%2C' + c[1] + '&rtt=auto');
    a.target = '_blank'; a.rel = 'noopener';
    a.className = f.className; a.id = f.id;
    a.setAttribute('aria-label', 'Открыть маршрут в Яндекс Картах');
    var cs = getComputedStyle(f);
    a.style.cssText = f.style.cssText + ';display:block;position:' + (cs.position === 'static' ? 'relative' : cs.position) + ';overflow:hidden;' +
      'width:' + (f.style.width || '100%') + ';height:' + (f.offsetHeight ? f.offsetHeight + 'px' : (f.style.height || '100%')) + ';border-radius:' + cs.borderRadius + ';background:#e8e6e1';
    var img = document.createElement('img');
    img.src = staticUrl(c[0], c[1]); img.alt = 'Карта: ' + (B.address || 'как добраться'); img.loading = 'lazy';
    img.style.cssText = 'display:block;width:100%;height:100%;object-fit:cover';
    img.onerror = function () { img.remove(); a.style.background = 'repeating-linear-gradient(45deg,#ece9e2 0 12px,#e4e0d7 12px 24px)'; };
    var tag = document.createElement('span');
    tag.textContent = 'Открыть в Яндекс Картах ↗';
    tag.style.cssText = 'position:absolute;right:10px;bottom:10px;background:#fff;color:#111;font:600 13px/1 system-ui,sans-serif;padding:9px 12px;border-radius:999px;box-shadow:0 2px 10px rgba(0,0,0,.18)';
    a.appendChild(img); a.appendChild(tag);
    f.replaceWith(a);
  }
  function scan() { document.querySelectorAll('iframe').forEach(swap); }
  scan();
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i];
      if (m.type === 'attributes' && m.target.tagName === 'IFRAME') swap(m.target);
      else m.addedNodes.forEach(function (n) { if (n.nodeType === 1) { if (n.tagName === 'IFRAME') swap(n); else if (n.querySelectorAll) n.querySelectorAll('iframe').forEach(swap); } });
    }
  }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'] });
})();
