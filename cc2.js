// Jarvis Command Center – Gesten & Extras (iPad). Baut auf cc.js auf (window.ccHand, window.ccFace, window.ccFx).
(function () {
  'use strict';
  var cc = document.getElementById('cc'), vc = document.getElementById('v-chat'); if (!cc || !vc) return;
  var MQ = window.matchMedia('(min-width: 900px) and (min-height: 600px) and (orientation: landscape)');
  var $ = function (id) { return document.getElementById(id); };
  var ipad = function () { return MQ.matches; };

  // ---------- Styles ----------
  var css = document.createElement('style');
  css.textContent = [
    '#cc2c{position:absolute;inset:0;width:100%;height:100%;z-index:40;pointer-events:none}',
    '#cc .cc-toast{position:absolute;left:50%;top:13%;transform:translateX(-50%) scale(.9);z-index:41;padding:9px 18px;border-radius:999px;font:700 12px ui-monospace,Menlo,monospace;letter-spacing:.14em;color:#eaf6ff;background:rgba(8,16,32,.82);border:1px solid rgba(120,200,255,.45);box-shadow:0 0 30px rgba(95,180,255,.45);opacity:0;transition:opacity .25s,transform .25s;pointer-events:none;white-space:nowrap}',
    '#cc .cc-toast.on{opacity:1;transform:translateX(-50%) scale(1)}',
    '#cc .cc-p.cc-gross{max-height:52vh;overflow:auto}',
    'body.cc-dim #cc canvas.cc-c{opacity:.28;transition:opacity 1.5s}',
    'body.cc-dim #cc .cc-p, body.cc-dim #cc .cc-bar{opacity:.35;transition:opacity 1.5s}',
    '#cc canvas.cc-c, #cc .cc-p, #cc .cc-bar{transition:opacity 1.2s}',
    'body.cc-nacht #cc canvas.cc-c{filter:brightness(.6) sepia(.55) hue-rotate(-38deg) saturate(1.4)}',
    'body.cc-nacht #cc .cc-p, body.cc-nacht #cc .cc-bar{filter:brightness(.7) sepia(.45) hue-rotate(-35deg)}',
    'body.cc-fokus #cc .cc-p:not(.cc-fokus-ja){opacity:0;pointer-events:none;transform:scale(.92)}',
    'body.cc-fokus #cc .cc-bar{opacity:.4}',
    '#cc .cc-uhrw{display:flex;align-items:center;gap:10px;margin-left:auto}',
    '#cc .cc-wetter{font:700 11px ui-monospace,Menlo,monospace;color:#bfe0ff;white-space:nowrap}',
    '#cc .cc-wetter small{color:#6f93bf;font-weight:600;margin-left:4px}',
    '#cc svg.cc-chart{width:100%;height:92px;display:block}',
    '#cc .cc-chart-s{display:flex;justify-content:space-between;font:600 9.5px ui-monospace,Menlo,monospace;color:#7d9cc4;margin-top:4px}'
  ].join('\n');
  document.head.appendChild(css);

  var ov = document.createElement('canvas'); ov.id = 'cc2c'; ov.setAttribute('aria-hidden', 'true'); cc.appendChild(ov);
  var ox = ov.getContext('2d');
  var toast = document.createElement('div'); toast.className = 'cc-toast'; toast.setAttribute('role', 'status'); cc.appendChild(toast);
  var toastT = 0;
  function zeige(t) { toast.textContent = t; toast.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove('on'); }, 1600); }
  function blip(f) { if (window.ccFx && window.ccFx.blip) window.ccFx.blip(f); }
  function sagen(text) { try { window.dispatchEvent(new CustomEvent('jarvis-sagen', { detail: text })); } catch (e) {} }
  function orbStatus() { var o = $('orb'); return o ? o.className : ''; }
  function orbAktiv() { return /listening|thinking|speaking/.test(orbStatus()); }
  function orbTipp() { var o = $('orb'); if (o) o.click(); }
  function letzteJarvis() { var l = $('log'); if (!l) return ''; var m = l.querySelectorAll('.msg.jv'); return m.length ? m[m.length - 1].textContent : ''; }

  // ---------- 18: Umsatz-Kurve statt Live-Deals (Deals bleiben im Discord) ----------
  function chartPanel() {
    var d = $('cc-deals'); if (!d) return $('cc-chart');
    var p = d.closest('.cc-p'); p.innerHTML = '<h5>UMSATZ · 30 TAGE <em id="cc-chart-sum"></em></h5><div id="cc-chart"><div class="cc-leer" style="font:500 10.5px ui-monospace,Menlo,monospace;color:#5f7fa8">lädt …</div></div>';
    return $('cc-chart');
  }
  async function chartLaden() {
    var el = chartPanel(); if (!el || !ipad()) return;
    var k = ''; try { k = localStorage.getItem('jarvis_key') || ''; } catch (e) {} if (!k) return;
    try {
      var j = await (await fetch('https://jarvis-api.dettlingluis.workers.dev/api/kaufland/verkaeufe', { headers: { 'X-Jarvis-Key': k, Authorization: 'Bearer ' + k } })).json();
      var tage = [], heute = new Date(); heute.setHours(0, 0, 0, 0);
      for (var i = 29; i >= 0; i--) { var d = new Date(heute); d.setDate(d.getDate() - i); tage.push({ k: d.toISOString().slice(0, 10), v: 0 }); }
      // Datum lokal (Berlin) statt UTC
      tage.forEach(function (t, i) { var d = new Date(heute); d.setDate(d.getDate() - (29 - i)); t.k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); });
      (j.verkaeufe || []).forEach(function (v) { var t = tage.find(function (x) { return x.k === v.datum; }); if (t) t.v += Number(v.preis_brutto) || 0; });
      var max = Math.max(50, Math.max.apply(null, tage.map(function (t) { return t.v; }))), sum = tage.reduce(function (s, t) { return s + t.v; }, 0);
      var w = 260, h = 92, bw = w / 30;
      var bars = tage.map(function (t, i) { var bh = t.v ? Math.max(3, t.v / max * (h - 14)) : 1.5; return '<rect x="' + (i * bw + 1).toFixed(1) + '" y="' + (h - bh).toFixed(1) + '" width="' + (bw - 2).toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="1.5" fill="url(#ccg)"' + (i === 29 ? ' style="filter:drop-shadow(0 0 5px #7fd0ff)"' : '') + '><title>' + t.k + ': ' + Math.round(t.v) + ' €</title></rect>'; }).join('');
      el.innerHTML = '<svg class="cc-chart" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" role="img" aria-label="Umsatz der letzten 30 Tage"><defs><linearGradient id="ccg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd8ff"/><stop offset="1" stop-color="#3d6dff" stop-opacity=".35"/></linearGradient></defs>' + bars + '</svg><div class="cc-chart-s"><span>vor 30 Tagen</span><span>heute</span></div>';
      var s = $('cc-chart-sum'); if (s) s.textContent = Math.round(sum).toLocaleString('de-DE') + ' €';
    } catch (e) { el.innerHTML = '<div class="cc-leer" style="font:500 10.5px ui-monospace,Menlo,monospace;color:#5f7fa8">Umsätze gerade nicht erreichbar.</div>'; }
  }
  setTimeout(chartLaden, 2500); setInterval(function () { if (ipad() && vc.classList.contains('on')) chartLaden(); }, 600000);

  // ---------- 19: Wetter + Uhr-Ring ----------
  (function uhrRing() {
    var u = $('cc-uhr'); if (!u) return;
    var w = document.createElement('span'); w.className = 'cc-uhrw';
    w.innerHTML = '<span class="cc-wetter" id="cc-wetter"></span><svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="12" fill="none" stroke="rgba(95,180,255,.18)" stroke-width="2.5"/><circle id="cc-sek" cx="15" cy="15" r="12" fill="none" stroke="#5fb4ff" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="75.4" stroke-dashoffset="75.4" transform="rotate(-90 15 15)" style="filter:drop-shadow(0 0 4px #5fb4ff)"/></svg>';
    u.parentNode.insertBefore(w, u); w.appendChild(u); u.style.marginLeft = '0';
    setInterval(function () { var s = new Date().getSeconds() + new Date().getMilliseconds() / 1000, c = $('cc-sek'); if (c) c.setAttribute('stroke-dashoffset', String(75.4 * (1 - s / 60))); }, 250);
  })();
  var WMO = { 0: 'klar', 1: 'heiter', 2: 'wolkig', 3: 'bedeckt', 45: 'Nebel', 48: 'Nebel', 51: 'Niesel', 53: 'Niesel', 55: 'Niesel', 61: 'Regen', 63: 'Regen', 65: 'Starkregen', 71: 'Schnee', 73: 'Schnee', 75: 'Schnee', 80: 'Schauer', 81: 'Schauer', 82: 'Schauer', 95: 'Gewitter' };
  async function wetter() {
    try { var j = await (await fetch('https://api.open-meteo.com/v1/forecast?latitude=48.95&longitude=8.84&current=temperature_2m,weather_code&timezone=Europe%2FBerlin')).json();
      var c = j.current || {}; var e = $('cc-wetter'); if (e) e.innerHTML = Math.round(c.temperature_2m) + '°<small>' + (WMO[c.weather_code] || '') + '</small>';
    } catch (e) {}
  }
  wetter(); setInterval(wetter, 1800000);

  // ---------- 20: Nachtmodus 23–6 Uhr ----------
  function nacht() { var h = new Date().getHours(); document.body.classList.toggle('cc-nacht', h >= 23 || h < 6); }
  nacht(); setInterval(nacht, 60000);

  // ---------- 21: Fokus-Modus ----------
  window.ccFokus = function (an) {
    var p = $('cc-aufg'); var pan = p && p.closest('.cc-p');
    [].forEach.call(document.querySelectorAll('#cc .cc-p'), function (x) { x.classList.toggle('cc-fokus-ja', x === pan); });
    document.body.classList.toggle('cc-fokus', !!an); zeige(an ? '◎ FOKUS-MODUS' : 'NORMALANSICHT'); blip(an ? 520 : 880);
  };

  // ---------- 16: Live-Verkauf ----------
  var verkLetzt = null;
  setInterval(function () {
    var f = $('hud-fin'); if (!f) return; var m = f.textContent.match(/(\d+)\s*VERKÄUFE HEUTE/i); if (!m) return; var n = Number(m[1]);
    if (verkLetzt !== null && n > verkLetzt && ipad()) { zeige('💰 NEUER VERKAUF'); if (window.ccFx && window.ccFx.verkauf) window.ccFx.verkauf(); kasse(); }
    verkLetzt = n;
  }, 5000);
  function kasse() { [1320, 1760, 2640].forEach(function (f, i) { setTimeout(function () { blip(f); }, i * 90); }); }

  // ---------- 13 + 15: Anwesenheit über das Gesicht ----------
  var weg = false, zuletztDa = performance.now(), begruesst = 0;
  function anwesenheit(t) {
    var fc = window.ccFace, da = fc && fc.x != null && t - fc.t < 1500;
    if (da) {
      if (weg) { weg = false; document.body.classList.remove('cc-dim'); blip(660); zurueck(t - zuletztDa); }
      zuletztDa = t;
    } else if (!weg && window.ccFace && t - zuletztDa > 60000) { weg = true; document.body.classList.add('cc-dim'); }
  }
  function zurueck(abwesend) {
    var d0 = new Date(), heute = d0.getFullYear() + '-' + (d0.getMonth() + 1) + '-' + d0.getDate(), h = d0.getHours(), gem = ''; try { gem = localStorage.getItem('cc_morgen') || ''; } catch (e) {}
    if (h >= 10 && gem !== heute && !orbAktiv()) { /* nur 1x am Tag: das erste Mal ab 10 Uhr am iPad */ try { localStorage.setItem('cc_morgen', heute); } catch (e) {} zeige('☀️ GUTEN MORGEN'); sagen('Guten Morgen, ich sitze jetzt am Schreibtisch. Gib mir ein kurzes Morgen-Briefing: Verkäufe seit gestern, Termine heute, wichtigste To-dos. Maximal 3 Sätze.'); return; }
    /* kein Willkommen-zurück mehr bei jedem Aufstehen */
  }

  // ---------- Gesten ----------
  var D = function (a, b) { return Math.hypot(a.x - b.x, a.y - b.y); };
  function analyse(lm) {
    var g = D(lm[0], lm[9]) || 0.1;
    var ext = function (tip, pip) { return D(lm[tip], lm[0]) > D(lm[pip], lm[0]) * 1.12; };
    var f = { i: ext(8, 6), m: ext(12, 10), r: ext(16, 14), p: ext(20, 18), d: D(lm[4], lm[5]) > g * 0.62 && D(lm[4], lm[0]) > D(lm[3], lm[0]) };
    var name = 'andere';
    if (f.i && f.m && f.r && f.p) name = 'offen';
    else if (!f.i && !f.m && !f.r && !f.p) name = f.d ? (lm[4].y < lm[0].y - g * 0.55 ? 'daumen_hoch' : lm[4].y > lm[0].y + g * 0.15 ? 'daumen_runter' : 'faust') : 'faust';
    else if (f.i && !f.m && !f.r && !f.p) name = 'zeige';
    else if (f.i && f.m && !f.r && !f.p) name = 'peace';
    return { name: name, g: g, x: 1 - lm[9].x, y: lm[9].y };
  }
  var verlauf = [], stabil = { name: '', seit: 0 }, cool = {}, offenSeit = 0, offenStart = null, zweiStart = null;
  function bereit(k, t, ms) { if (cool[k] && t - cool[k] < ms) return false; cool[k] = t; return true; }
  function tabWechsel(r) {
    var tabs = [].slice.call(document.querySelectorAll('nav.tabs button[data-v]')); if (!tabs.length) return;
    var on = document.querySelector('.view.on'), i = Math.max(0, tabs.findIndex(function (b) { return on && b.dataset.v === on.id; }));
    var n = tabs[(i + r + tabs.length) % tabs.length]; n.click(); zeige((r > 0 ? '→ ' : '← ') + n.textContent.trim().toUpperCase()); blip(r > 0 ? 990 : 740);
  }
  function grossesFenster() { return document.querySelector('#cc .cc-p.cc-gross'); }
  var palmProg = 0, palmPos = null, letzteT = -1;

  window.ccGesten = function (t, sichtbar) {
    anwesenheit(t);
    var H = window.ccHand; if (!H || !H.lm || t - H.t > 400) { verlauf = []; offenSeit = 0; palmProg = 0; zweiStart = null; return; }
    if (H.t === letzteT) return; letzteT = H.t;   // nur neue Kamerabilder auswerten
    var a = analyse(H.lm), greift = cc.querySelector('.cc-p.cc-greif');
    verlauf.push({ t: t, x: a.x, y: a.y, n: a.name }); verlauf = verlauf.filter(function (v) { return t - v.t < 1600; });
    if (stabil.name !== a.name) stabil = { name: a.name, seit: t };
    var lange = t - stabil.seit;

    // 9: zwei offene Hände → großes Fenster zoomen
    var gf = grossesFenster();
    if (sichtbar && H.alle && H.alle.length > 1 && gf) {
      var b = analyse(H.alle[1]);
      if (a.name === 'offen' && b.name === 'offen') { var dd = Math.hypot(a.x - b.x, a.y - b.y); if (!zweiStart) zweiStart = { d: dd, s: Number(gf.dataset.zoom || 1.75) }; var s = Math.max(1.2, Math.min(2.8, zweiStart.s * dd / zweiStart.d)); gf.dataset.zoom = s.toFixed(2); gf.style.transform = 'scale(' + s.toFixed(2) + ')'; return; }
    } else zweiStart = null;
    if (greift) return; // beim Greifen keine anderen Gesten

    // Wischen (2, 3) + Winken (7) – nur mit offener Hand
    var alt = verlauf.filter(function (v) { return t - v.t < 380 && v.n === 'offen'; });
    if (a.name === 'offen' && alt.length > 2) {
      var dx = a.x - alt[0].x, dy = a.y - alt[0].y;
      var ueberGross = gf && sichtbar;
      if (Math.abs(dx) > 0.26 && Math.abs(dy) < 0.14 && bereit('wisch', t, 1200)) { tabWechsel(dx > 0 ? 1 : -1); verlauf = []; return; }
      if (!ueberGross && Math.abs(dy) > 0.26 && Math.abs(dx) < 0.14 && bereit('wischv', t, 1200)) {
        if (dy < 0) { var fab = $('chatfab'); if (fab) { fab.click(); zeige('↑ CHAT'); blip(990); } }
        else { var x = document.querySelector('#chatpop:not([hidden]) [data-close]'); if (x) { x.click(); zeige('↓ CHAT ZU'); blip(740); } }
        verlauf = []; return;
      }
    }
    var off = verlauf.filter(function (v) { return v.n === 'offen'; });
    if (off.length > 6) { var wechsel = 0, rich = 0, amp = 0; for (var i = 2; i < off.length; i++) { var d1 = off[i].x - off[i - 1].x; if (Math.abs(d1) > 0.012) { var r = d1 > 0 ? 1 : -1; if (rich && r !== rich) wechsel++; rich = r; } } amp = Math.max.apply(null, off.map(function (v) { return v.x; })) - Math.min.apply(null, off.map(function (v) { return v.x; }));
      if (wechsel >= 3 && amp > 0.06 && amp < 0.3 && bereit('winken', t, 60000)) { zeige('👋 HEY BOSS'); blip(880); sagen('Ich winke dir gerade zu. Grüß mich kurz zurück und gib mir ein Mini-Briefing: Verkäufe heute, nächster Termin, wichtigstes To-do. Maximal 3 Sätze.'); verlauf = []; return; } }

    // 11: großes Fenster mit offener Hand scrollen (langsame Bewegung über dem Fenster)
    if (gf && sichtbar && a.name === 'offen' && alt.length > 1) { var rc = gf.getBoundingClientRect(), cr = cc.getBoundingClientRect(), px = cr.left + a.x * cr.width, py = cr.top + a.y * cr.height;
      if (px > rc.left && px < rc.right && py > rc.top && py < rc.bottom) { gf.scrollTop += (a.y - alt[alt.length - 1].y) * cr.height * 1.6; } }

    // 1: Hand flach hinhalten (ruhig, 1 Sekunde) → Jarvis hört zu
    if (false) { /* Hand flach = zuhören: entfernt (zu unzuverlässig) */
      if (!palmPos || Math.hypot(a.x - palmPos.x, a.y - palmPos.y) > 0.05) { palmPos = { x: a.x, y: a.y }; offenSeit = t; }
      palmProg = Math.min(1, (t - offenSeit) / 1000);
      if (palmProg >= 1 && bereit('zuhoeren', t, 4000)) { palmProg = 0; offenSeit = t + 99999; zeige('🎙 ICH HÖRE ZU'); blip(1200); orbTipp(); }
    } else { palmProg = 0; palmPos = null; }

    if (lange < 380) return;
    // 4: Zeigefinger hoch (psst) → still
    if (a.name === 'zeige' && /speaking|listening|thinking/.test(orbStatus()) && bereit('psst', t, 2500)) { zeige('🤫 PSST'); orbTipp(); return; }
    // 5: Peace → Ton an/aus
    if (false) { /* Peace = Ton an/aus: entfernt */ var bt = $('cc-ton'); if (bt) { bt.click(); zeige(bt.getAttribute('aria-pressed') === 'true' ? '♪ TON AN' : '♪ TON AUS'); } return; }
    // 6: Daumen hoch / runter → Ja / Nein auf Jarvis' Frage
    if ((a.name === 'daumen_hoch' || a.name === 'daumen_runter') && bereit('daumen', t, 3000)) {
      var ja = a.name === 'daumen_hoch', frage = /\?\s*$/.test(letzteJarvis().trim());
      zeige(ja ? '👍 JA' : '👎 NEIN'); blip(ja ? 1320 : 440);
      if (frage) sagen(ja ? 'Ja.' : 'Nein.');
      return;
    }
  };

  // ---------- Overlay: Fortschrittsring „Hand flach“, Fenster-Ziele beim Greifen ----------
  var oW = 0, oH = 0;
  function zeichne(t) {
    requestAnimationFrame(zeichne);
    if (!ipad() || !vc.classList.contains('on') || document.hidden) return;
    var r = ov.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1), w = Math.round(r.width * d), h = Math.round(r.height * d);
    if (w !== oW || h !== oH) { oW = ov.width = w; oH = ov.height = h; }
    ox.setTransform(d, 0, 0, d, 0, 0); ox.clearRect(0, 0, r.width, r.height);
    var H = window.ccHand; if (!H || !H.lm || t - H.t > 400) return;
    var cx = (1 - H.lm[9].x) * r.width, cy = H.lm[9].y * r.height;
    if (palmProg > 0.05) { ox.lineWidth = 3; ox.strokeStyle = 'rgba(120,220,255,.9)'; ox.shadowBlur = 12; ox.shadowColor = '#5fd0ff'; ox.beginPath(); ox.arc(cx, cy, 34, -Math.PI / 2, -Math.PI / 2 + palmProg * 6.283); ox.stroke(); ox.shadowBlur = 0;
      ox.font = '700 10px ui-monospace, Menlo, monospace'; ox.fillStyle = 'rgba(200,240,255,.9)'; ox.textAlign = 'center'; ox.fillText('ZUHÖREN', cx, cy + 52); }
    if (cc.querySelector('.cc-p.cc-greif')) { // Ablage-Zonen zeigen
      ox.setLineDash([6, 6]); ox.lineWidth = 1.5;
      ox.strokeStyle = 'rgba(120,220,255,.45)'; ox.strokeRect(r.width * 0.27, r.height * 0.12, r.width * 0.46, r.height * 0.7);
      ox.strokeStyle = 'rgba(255,200,120,.6)'; ox.beginPath(); ox.arc(r.width / 2, r.height * 0.3, r.height * 0.16, 0, 6.283); ox.stroke(); ox.setLineDash([]);
      ox.font = '700 10px ui-monospace, Menlo, monospace'; ox.textAlign = 'center'; ox.fillStyle = 'rgba(255,210,140,.9)'; ox.fillText('AUF JARVIS = ERKLÄREN', r.width / 2, r.height * 0.3 - r.height * 0.16 - 8);
      ox.fillStyle = 'rgba(160,220,255,.8)'; ox.fillText('MITTE = GROSS · RAND / WERFEN = ZURÜCK', r.width / 2, r.height * 0.82 + 16);
    }
  }
  requestAnimationFrame(zeichne);
})();
