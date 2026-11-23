/* =====================================================================
   ChronoXStar - MODUL KEAMANAN (security.js)
   Dimuat paling awal. Jika file ini hilang atau diblokir, aplikasi
   MENOLAK berjalan (app.js memeriksanya).

   Isi:
   1. Anti-clickjacking        : halaman tidak boleh dibuka di iframe situs lain
   2. Layar diagnosa           : error/file hilang tampil jelas, bukan layar putih
   3. Penyaring HTML global    : semua innerHTML / insertAdjacentHTML dibersihkan
                                 (script, onerror=, javascript:, iframe, dll dibuang)
   4. Pemeriksa kunci Supabase : menolak secret key / service_role di sisi web
   5. Pembatas percobaan       : kunci sementara setelah salah berulang
      Pemantau idle            : sesi admin otomatis keluar bila tidak aktif
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- 1. Anti-clickjacking ---------- */
  if (top !== self) {
    try { top.location = self.location; } catch (e) { document.documentElement.remove(); return; }
  }

  /* ---------- 2. Layar diagnosa ---------- */
  function show(m) {
    var n = document.getElementById('nojs');
    if (n) { var s = n.querySelector('span'); if (s) s.textContent = m; return; }
    var d = document.getElementById('cxerr');
    if (!d) {
      d = document.createElement('div'); d.id = 'cxerr';
      d.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:2147483001;background:#400;color:#fff;font:12px system-ui;padding:10px;border-radius:10px';
      document.body.appendChild(d);
    }
    d.textContent = 'Kesalahan: ' + m;
    clearTimeout(d._t); d._t = setTimeout(function () { d.remove(); }, 12000);
  }
  addEventListener('error', function (e) {
    if (e.message && !/ResizeObserver|Script error/.test(e.message))
      show(e.message + (e.filename ? ' (' + e.filename.split('/').pop() + ':' + e.lineno + ')' : ''));
  });
  addEventListener('unhandledrejection', function (e) { var r = e.reason; show(String(r && r.message || r)); });
  setTimeout(async function () {
    var n = document.getElementById('nojs'); if (!n) return; var out = [];
    for (var f of ['app.js', 'app.css', 'config.js']) {
      try { var r = await fetch(f, { method: 'HEAD', cache: 'no-store' }); out.push(f + ': ' + (r.ok ? 'ada' : 'HILANG (' + r.status + ')')); }
      catch (e) { out.push(f + ': gagal dicek'); }
    }
    n.querySelector('small').textContent = out.join(' | ') + '. Perbaiki lalu muat ulang halaman.';
  }, 6000);

  /* ---------- 3. Penyaring HTML global ---------- */
  var TAGS = new Set('a b br button circle code datalist div em g h1 h2 h3 i img input label li line ol optgroup option p path polygon pre rect s select small span strong svg textarea u ul'.split(' '));
  var ATTR = new Set('class id style href src alt title target rel dir lang role tabindex type value placeholder maxlength minlength min max step inputmode autocomplete for rows cols hidden disabled selected checked readonly required accept list multiple viewbox d cx cy r x y rx ry x1 y1 x2 y2 width height fill stroke stroke-width stroke-linecap stroke-linejoin points xmlns'.split(' '));
  var INTYPE = /^(text|password|file|range|email|number|hidden|checkbox|search|tel)$/i;
  var IMGDATA = /^data:image\/(png|jpeg|gif|webp|svg\+xml)[;,]/i;
  function urlOk(tag, k, v) {
    var u = v.replace(/[\u0000-\u0020]/g, '');
    if (/^https:\/\//i.test(u)) return true;
    if (tag === 'img' && k === 'src' && IMGDATA.test(u)) return true;
    return u === '' || u[0] === '#' || (!/^\/\//.test(u) && !/^[a-z][a-z0-9+.\-]*:/i.test(u));
  }
  function clean(html) {
    var d = new DOMParser().parseFromString('<!doctype html><body>' + html, 'text/html');
    (function walk(n) {
      for (var c of Array.from(n.children)) {
        var t = c.localName;
        if (!TAGS.has(t)) { c.remove(); continue; }
        for (var a of Array.from(c.attributes)) {
          var k = a.name.toLowerCase(), v = a.value, ok = ATTR.has(k) || /^(data|aria)-/.test(k);
          if (ok && (k === 'href' || k === 'src')) ok = urlOk(t, k, v);
          if (ok && k === 'type') ok = INTYPE.test(v);
          if (ok && k === 'target') ok = /^_(blank|self)$/.test(v);
          if (ok && k === 'style') ok = !/url\s*\(|expression|@import|javascript:|behavior|position\s*:|z-index/i.test(v);
          if (ok && k === 'id') ok = !/^(__proto__|constructor|prototype|location|document|window|top|self)$/i.test(v);
          if (!ok) c.removeAttribute(a.name);
        }
        if (t === 'a' && c.getAttribute('target') === '_blank') c.setAttribute('rel', 'noopener noreferrer');
        walk(c);
      }
    })(d.body);
    return d.body.innerHTML;
  }
  var IH = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML'), IAH = Element.prototype.insertAdjacentHTML;
  function trusted(el) { return !!(el.closest && el.closest('[data-trust]')); }
  Object.defineProperty(Element.prototype, 'innerHTML', {
    get: IH.get, enumerable: IH.enumerable, configurable: false,
    set: function (v) { IH.set.call(this, (typeof v === 'string' && v && !trusted(this)) ? clean(v) : v); }
  });
  Element.prototype.insertAdjacentHTML = function (p, h) {
    return IAH.call(this, p, (typeof h === 'string' && h && !trusted(this)) ? clean(h) : h);
  };

  /* ---------- 4. Pemeriksa kunci Supabase ---------- */
  function keyCheck(url, key) {
    if (!url || !key) return 'URL atau kunci Supabase kosong di config.js.';
    if (!/^https:\/\/[a-z0-9\-]+\.supabase\.co\/?$/.test(url)) return 'URL Supabase di config.js tidak valid.';
    if (/^sb_secret_/.test(key)) return 'KUNCI BERBAHAYA: itu SECRET key. Di web hanya boleh kunci publishable (sb_publishable_...). Aplikasi dihentikan.';
    if (/^eyJ/.test(key)) {
      try {
        var p = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (p.role && p.role !== 'anon') return 'KUNCI BERBAHAYA: role "' + p.role + '" tidak boleh dipakai di web. Aplikasi dihentikan.';
      } catch (e) { /* bukan JWT biasa */ }
    }
    return '';
  }

  /* ---------- 5. Pembatas percobaan + pemantau idle ---------- */
  function limiter(max, lockMs) {
    var n = 0, until = 0;
    return {
      ok: function () { return Date.now() >= until; },
      wait: function () { return Math.max(0, Math.ceil((until - Date.now()) / 1000)); },
      fail: function () { if (++n >= max) { until = Date.now() + lockMs; n = 0; } },
      reset: function () { n = 0; }
    };
  }
  function idle(ms, cb) {
    var t, ev = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    function bump() { clearTimeout(t); t = setTimeout(cb, ms); }
    ev.forEach(function (e) { addEventListener(e, bump, { passive: true, capture: true }); });
    bump();
    return function () { clearTimeout(t); ev.forEach(function (e) { removeEventListener(e, bump, true); }); };
  }

  Object.defineProperty(window, 'CXSEC', {
    value: Object.freeze({ sanitize: clean, keyCheck: keyCheck, limiter: limiter, idle: idle }),
    writable: false, configurable: false
  });
})();
