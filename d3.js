// Jarvis Design 3 – iPad-Layout wie im Entwurf: Leiste oben, Karten links/rechts in Spalten, Dock unten mit Mikro
(function () {
  'use strict';
  var MQ = window.matchMedia('(min-width:900px) and (min-height:600px) and (orientation:landscape)');
  var $ = function (id) { return document.getElementById(id); };
  var css = document.createElement('style');
  css.textContent = [
    'body.cc-on #cc .cc-sp{position:absolute;top:66px;bottom:150px;width:300px;display:flex;flex-direction:column;gap:12px;z-index:5;overflow:hidden;pointer-events:none}',
    'body.cc-on #cc .cc-sp.l{left:22px} body.cc-on #cc .cc-sp.r{right:22px}',
    'body.cc-on #cc .cc-sp .cc-p{position:relative !important;left:auto !important;right:auto !important;top:auto !important;width:auto !important;flex:0 0 auto;pointer-events:auto;max-height:46%;overflow:hidden}',
    'body.cc-on header{display:none !important}',
    'body.cc-on #cc .cc-bar{left:22px !important;right:22px !important;top:12px !important;display:flex;align-items:center;gap:10px}',
    'body.cc-on #cc .cc-bar .cc-uhr{margin-left:auto}',
    'body.cc-on #cc .cc-bar .voice{display:flex;gap:8px}',
    'body.cc-on #cc .cc-bar .cc-pill{display:inline-flex;align-items:center;gap:7px;padding:6px 12px;border-radius:99px;background:rgba(255,255,255,.05);border:1px solid rgba(140,190,255,.13);font:500 12px -apple-system,system-ui,sans-serif;color:#c9d7ee;white-space:nowrap}',
    'body.cc-on #cc .cc-bar .cc-pill i{width:7px;height:7px;border-radius:50%;background:#4fd8a4;box-shadow:0 0 8px #4fd8a4}',
    'body.cc-on #cc .cc-bar .cc-datum{font:500 11.5px/1.25 -apple-system,system-ui,sans-serif;color:#8094b3;text-align:right}',
    'body.cc-on #cc .cc-wetter{font:500 12px -apple-system,system-ui,sans-serif !important;color:#c9d7ee !important}',
    'body.cc-on #cc .cc-wetter small{color:#8094b3 !important;font-weight:500 !important}',
    /* Dock unten */
    'body.cc-on nav.tabs{position:fixed !important;left:50% !important;bottom:16px !important;transform:translateX(-50%);width:auto !important;margin:0 !important;padding:6px !important;gap:2px;border-radius:99px !important;border:1px solid rgba(140,190,255,.13) !important;background:rgba(14,22,38,.78) !important;z-index:30;align-items:center;box-shadow:0 20px 40px -20px rgba(0,0,0,.8) !important}',
    'body.cc-on nav.tabs button{flex:0 0 auto !important;flex-direction:row !important;gap:6px;padding:9px 14px !important;border-radius:99px !important;font:500 13px -apple-system,system-ui,sans-serif !important;color:#8395b3 !important;min-width:0 !important}',
    'body.cc-on nav.tabs button svg{width:17px !important;height:17px !important}',
    'body.cc-on nav.tabs button[aria-selected="true"]{background:rgba(124,200,255,.13) !important;color:#7cc8ff !important}',
    '#cc-mic{display:none}',
    'body.cc-on #cc-mic{display:block;width:46px;height:46px;border-radius:50%;border:0;margin:0 8px;cursor:pointer;background:radial-gradient(circle at 50% 35%,#9fd8ff,#2f7fd6 70%);box-shadow:0 0 0 5px rgba(124,200,255,.12),0 0 26px rgba(90,170,255,.5);position:relative}',
    'body.cc-on #cc-mic svg{width:20px;height:20px;fill:none;stroke:#04101f;stroke-width:2.2;stroke-linecap:round;position:absolute;left:13px;top:13px}',
    'body.cc-on #cc-mic.denkt{background:radial-gradient(circle at 50% 35%,#ffd9a8,#e07b25 70%);box-shadow:0 0 0 5px rgba(255,183,104,.14),0 0 26px rgba(255,150,60,.55)}',
    'body.cc-on #cc-mic.hoert{animation:ccmic 1.4s ease-in-out infinite}',
    '@keyframes ccmic{50%{box-shadow:0 0 0 10px rgba(124,200,255,.08),0 0 40px rgba(90,170,255,.7)}}',
    /* Status unter Jarvis, Eingabe kompakt */
    'body.cc-on #cc .cc-st{bottom:118px !important}',
    'body.cc-on #cc .cc-sub{bottom:92px !important}',
    'body.cc-on #form{left:22px !important;bottom:92px !important;width:300px !important}',
    '#cc svg text{font-family:-apple-system,system-ui,sans-serif !important;font-weight:600}',
    'body.cc-on #auftraege{right:22px !important;bottom:92px !important;width:300px !important}',
    /* Lager-Karte */
    '#cc .cc-zeile{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-top:1px solid rgba(140,190,255,.07);font:400 13px -apple-system,system-ui,sans-serif;color:#d6e2f5}',
    '#cc .cc-zeile:first-of-type{border-top:0}',
    '#cc .cc-zeile b{font-weight:600;color:#f2f7ff}',
    /* gegriffene/vergrößerte Karte schwebt frei über allem */
    'body.cc-on #cc > .cc-p.cc-los{position:absolute !important;margin:0 !important;max-height:none;z-index:25}'
  ].join('\n');
  document.head.appendChild(css);

  var spL, spR, lager, voiceHeim = null, voice = null, mic = null;
  function panelMit(txt) { var ps = document.querySelectorAll('#cc .cc-p'); for (var i = 0; i < ps.length; i++) { var h = ps[i].querySelector('h5'); if (h && h.textContent.toUpperCase().indexOf(txt) === 0) return ps[i]; } return null; }

  function aufbauen() {
    var cc = $('cc'); if (!cc) return false;
    if (!spL) {
      spL = document.createElement('div'); spL.className = 'cc-sp l';
      spR = document.createElement('div'); spR.className = 'cc-sp r';
      cc.appendChild(spL); cc.appendChild(spR);
      lager = document.createElement('div'); lager.className = 'cc-p';
      lager.innerHTML = '<h5>LAGER <em id="cc-lager-w"></em></h5><div id="cc-lager"><div class="cc-leer">lädt …</div></div>';
    }
    var ord = { l: ['MONATSZIEL', 'HEUTE ZU TUN', 'KAUFLAND'], r: ['UMSATZ', 'LIVE', 'TERMINE', '#lager', 'AKTIVIT'] };
    var frei = function (p) { return p && /cc-greif|cc-gross|cc-los/.test(p.className); };
    ord.l.forEach(function (n) { var p = panelMit(n); if (p && !frei(p) && p.parentNode !== spL) spL.appendChild(p); });
    ord.r.forEach(function (n) { var p = n === '#lager' ? lager : panelMit(n); if (p && !frei(p) && p.parentNode !== spR) spR.appendChild(p); });
    beobachten();
    // Leiste oben: Status-Pille, Datum, Standby/Stimme
    var bar = cc.querySelector('.cc-bar');
    if (bar && !$('cc-pill')) {
      var pill = document.createElement('span'); pill.className = 'cc-pill'; pill.id = 'cc-pill'; pill.innerHTML = '<i></i><span>Bereit</span>';
      var first = bar.firstElementChild; bar.insertBefore(pill, first ? first.nextSibling : null);
      var dat = document.createElement('span'); dat.className = 'cc-datum'; dat.id = 'cc-datum';
      var uhr = $('cc-uhr'); if (uhr && uhr.parentNode) uhr.parentNode.insertBefore(dat, uhr); else bar.appendChild(dat);
    }
    // Mikro-Knopf ins Dock
    var nav = document.querySelector('nav.tabs');
    if (nav && !mic) {
      mic = document.createElement('button'); mic.type = 'button'; mic.id = 'cc-mic'; mic.setAttribute('aria-label', 'Mit Jarvis sprechen');
      mic.innerHTML = '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
      mic.addEventListener('click', function (e) { e.stopPropagation(); var o = $('orb'); if (o) o.click(); });
      var btns = nav.querySelectorAll('button[data-v]'); var mitte = btns[Math.floor(btns.length / 2)] || null;
      nav.insertBefore(mic, mitte);
    }
    return true;
  }

  // Greifen/Vergrößern: Karte aus der Spalte lösen, damit sie frei schweben und in die Mitte fliegen kann
  var mo = null;
  function beobachten() {
    if (mo || !window.MutationObserver) return;
    var cc = $('cc'); if (!cc) return;
    mo = new MutationObserver(function (liste) {
      liste.forEach(function (m) {
        var p = m.target; if (!p.classList || !p.classList.contains('cc-p')) return;
        var aktiv = p.classList.contains('cc-greif') || p.classList.contains('cc-gross');
        var spalte = p.parentNode && p.parentNode.classList && p.parentNode.classList.contains('cc-sp');
        if (aktiv && spalte) {
          var r = cc.getBoundingClientRect(), er = p.getBoundingClientRect();
          p._spalte = p.parentNode; p._nach = p.nextSibling;
          p.classList.add('cc-los'); cc.appendChild(p);
          if (!p.style.left || p.style.left === 'auto') { p.style.left = (er.left - r.left) + 'px'; p.style.top = (er.top - r.top) + 'px'; }
          p.style.width = er.width + 'px';
        } else if (!aktiv && p.classList.contains('cc-los')) {
          p.classList.remove('cc-los');
          var sp = p._spalte; if (sp) { if (p._nach && p._nach.parentNode === sp) sp.insertBefore(p, p._nach); else sp.appendChild(p); }
          p.style.left = ''; p.style.top = ''; p.style.width = ''; p.style.transform = '';
        }
      });
    });
    mo.observe(cc, { subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  // Standby-/Stimm-Knöpfe: auf dem iPad in die obere Leiste, sonst zurück in den Kopf
  function knoepfe() {
    voice = voice || document.querySelector('header .voice');
    if (!voice) return;
    if (!voiceHeim) voiceHeim = voice.parentNode;
    var bar = document.querySelector('#cc .cc-bar');
    var dt = $('cc-datum');
    if (MQ.matches && bar) { if (voice.parentNode !== (dt ? dt.parentNode : bar)) { if (dt) dt.parentNode.insertBefore(voice, dt); else bar.appendChild(voice); } }
    else if (voice.parentNode !== voiceHeim) voiceHeim.appendChild(voice);
  }

  function tick() {
    var d = new Date(), dat = $('cc-datum');
    if (dat) { var t = d.toLocaleDateString('de-DE', { weekday: 'long' }) + '<br>' + d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' }); if (dat.innerHTML !== t) dat.innerHTML = t; }
    var o = $('orb'), cl = o ? o.className : '', pill = $('cc-pill');
    var denkt = /thinking/.test(cl), spricht = /speaking/.test(cl), hoert = /listening/.test(cl);
    if (pill) { var txt = denkt ? 'Denkt nach' : spricht ? 'Spricht' : hoert ? 'Hört zu' : 'Bereit', col = denkt ? '#ffb768' : spricht ? '#7cc8ff' : '#4fd8a4'; var s = pill.querySelector('span'), i = pill.querySelector('i'); if (s.textContent !== txt) { s.textContent = txt; i.style.background = col; i.style.boxShadow = '0 0 8px ' + col; } }
    if (mic) { mic.classList.toggle('denkt', denkt); mic.classList.toggle('hoert', hoert); }
    // Lager-Karte aus der Gewinn-Leiste
    var f = $('hud-fin'), ziel = $('cc-lager');
    if (f && ziel) {
      var paare = []; [].forEach.call(f.querySelectorAll('div'), function (x) { var a = x.querySelector(':scope > span'), b = x.querySelector(':scope > b'); if (a && b) paare.push([a.textContent.trim(), b.textContent.replace(/ /g, ' ').trim()]); });
      var w = paare.filter(function (p) { return /^lager/i.test(p[0]); })[0], rest = paare.filter(function (p) { return !/^lager|^gewinn/i.test(p[0]) && p[1]; });
      var h = (w ? '<div class="cc-zeile">Warenwert<b>' + w[1] + '</b></div>' : '') + rest.slice(0, 3).map(function (p) { return '<div class="cc-zeile">' + p[0].charAt(0) + p[0].slice(1).toLowerCase() + '<b>' + p[1] + '</b></div>'; }).join('');
      var lagerN = document.querySelector('#hud-tools button[data-w="lager"] sup, #hud-tools [data-w="lager"] sup');
      if (lagerN && lagerN.textContent) h += '<div class="cc-zeile">Offene Lager-Aufgaben<b>' + lagerN.textContent + '</b></div>';
      if (h && ziel.innerHTML !== h) ziel.innerHTML = h;
      var we = $('cc-lager-w'); if (we && w && we.textContent !== w[1]) we.textContent = w[1];
    }
  }

  function start() {
    if (!aufbauen()) { setTimeout(start, 400); return; }
    knoepfe();
    setInterval(tick, 500); tick();
    setInterval(aufbauen, 3000); // falls cc2 Karten später ersetzt
    if (MQ.addEventListener) MQ.addEventListener('change', knoepfe); else MQ.addListener(knoepfe);
    window.addEventListener('resize', knoepfe);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else setTimeout(start, 0);
})();
