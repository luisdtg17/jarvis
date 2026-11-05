// Jarvis Command Center – iPad-Ansicht (Querformat). Eigenständig: liest die Werte aus der App, zeichnet Jarvis als Licht-Hologramm.
(function () {
  'use strict';
  var vc = document.getElementById('v-chat'); if (!vc) return;
  var MQ = window.matchMedia('(min-width: 900px) and (orientation: landscape)');
  var API = 'https://jarvis-api.dettlingluis.workers.dev';
  function key() { try { return localStorage.getItem('jarvis_key') || ''; } catch (e) { return ''; } }
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Styles ----------
  var css = document.createElement('style');
  css.textContent = [
    '#cc{position:absolute;inset:0;z-index:2;display:none;pointer-events:none;overflow:hidden}',
    'body.cc-on #cc{display:block}',
    '#cc canvas.cc-c{position:absolute;inset:0;width:100%;height:100%}',
    '#cc .cc-p{pointer-events:auto;position:absolute;z-index:3;border-radius:16px;padding:11px 13px;background:linear-gradient(155deg,rgba(60,110,210,.13),rgba(6,11,24,.72));border:1px solid rgba(110,170,255,.16);box-shadow:0 0 30px -12px rgba(80,150,255,.45),0 1px 0 rgba(255,255,255,.05) inset;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}',
    '#cc h5{margin:0 0 8px;font:700 9.5px ui-monospace,Menlo,monospace;letter-spacing:.16em;color:#7fb2ea;display:flex;justify-content:space-between;gap:8px}',
    '#cc h5 em{font-style:normal;color:#45d6a0}',
    '#cc .cc-bar{position:absolute;left:14px;right:14px;top:6px;height:34px;display:flex;align-items:center;gap:18px;border-bottom:1px solid rgba(95,180,255,.16);font:600 10px ui-monospace,Menlo,monospace;letter-spacing:.06em;color:#6f93bf;white-space:nowrap;overflow:hidden;z-index:3;pointer-events:auto}',
    '#cc .cc-bar b{color:#eaf4ff;margin-left:6px}',
    '#cc .cc-bar .cc-uhr{margin-left:auto;font:700 17px ui-monospace,Menlo,monospace;color:#fff;text-shadow:0 0 14px rgba(95,180,255,.6)}',
    '#cc .cc-bar button{font:700 10px ui-monospace,Menlo,monospace;letter-spacing:.08em;color:#9fd0ff;background:rgba(95,180,255,.08);border:1px solid rgba(95,180,255,.3);border-radius:8px;padding:4px 8px}',
    '#cc .cc-bar button[aria-pressed=true]{background:#5fb4ff;color:#03101f;box-shadow:0 0 12px #5fb4ff}',
    '#cc .cc-li{display:flex;justify-content:space-between;gap:8px;font:500 10.5px/1.35 ui-monospace,Menlo,monospace;color:#a9c4e6;padding:5px 0;border-top:1px solid rgba(110,170,255,.07)}',
    '#cc .cc-li:first-of-type{border-top:0}',
    '#cc .cc-li span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '#cc .cc-li b{color:#45d6a0;flex:none}#cc .cc-li i{font-style:normal;color:#f6c26b;flex:none}',
    '#cc .cc-leer{font:500 10.5px ui-monospace,Menlo,monospace;color:#5f7fa8}',
    '#cc .cc-v{font:700 22px ui-monospace,Menlo,monospace;color:#f2f8ff}',
    '#cc .cc-s{font-size:10.5px;color:#7d9cc4}',
    '#cc .cc-sub{position:absolute;left:50%;transform:translateX(-50%);bottom:18px;z-index:3;max-width:56%;text-align:center;font-size:15px;line-height:1.35;color:#eef6ff;text-shadow:0 0 14px rgba(0,0,0,.95),0 0 4px rgba(0,0,0,.9)}',
    '#cc .cc-st{position:absolute;left:50%;transform:translateX(-50%);bottom:64px;z-index:3;font:700 10px ui-monospace,Menlo,monospace;letter-spacing:.3em;color:#7fd0ff;white-space:nowrap}',
    '#cc .cc-st i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#45d6a0;box-shadow:0 0 10px #45d6a0;margin-right:8px}',
    'body.cc-on #v-chat > #jvbg, body.cc-on #v-chat > .hud-cn, body.cc-on #v-chat .hud-top, body.cc-on #hud-fin, body.cc-on #hud-tools, body.cc-on #status, body.cc-on #log, body.cc-on #jv-boot { display:none !important }',
    'body.cc-on #stage{position:absolute !important;left:50%;top:9%;transform:translateX(-50%);z-index:4;padding:0}',
    'body.cc-on #orb{width:30vw !important;height:52vh !important;margin:0 !important;border-radius:40% !important;animation:none !important;background:transparent !important;border:0 !important;box-shadow:none !important}',
    'body.cc-on #orb canvas{opacity:0 !important}',
    'body.cc-on #form{position:absolute;left:14px;bottom:10px;width:270px;z-index:6;margin:0}',
    'body.cc-on #auftraege{position:absolute;right:14px;bottom:10px;width:270px;z-index:6}'
  ].join('\n');
  document.head.appendChild(css);

  // ---------- Aufbau ----------
  var cc = document.createElement('div'); cc.id = 'cc'; cc.setAttribute('aria-hidden', 'false');
  cc.innerHTML = '<canvas class="cc-c" aria-hidden="true"></canvas>' +
    '<div class="cc-bar"><span style="font:800 12px ui-monospace,Menlo,monospace;letter-spacing:.3em;color:#cfe5ff">JARVIS // COMMAND CENTER</span><span id="cc-kpi"></span><button type="button" id="cc-hand" aria-pressed="false">✋ HAND</button><button type="button" id="cc-ton" aria-pressed="true">♪ TON</button><span class="cc-uhr" id="cc-uhr">--:--:--</span></div>' +
    '<div class="cc-p" style="left:14px;top:52px;width:23%"><h5>HEUTE ZU TUN <em id="cc-n-aufg"></em></h5><div id="cc-aufg"></div></div>' +
    '<div class="cc-p" style="left:14px;top:41%;width:23%"><h5>KAUFLAND PREIS-CHECK</h5><div id="cc-pc"></div></div>' +
    '<div class="cc-p" style="left:14px;top:70%;width:23%"><h5>TERMINE</h5><div id="cc-term"></div></div>' +
    '<div class="cc-p" style="right:14px;top:52px;width:23%"><h5>MONATSZIEL <em>10.000 €</em></h5><div style="display:flex;align-items:center;gap:12px"><svg width="96" height="96" viewBox="0 0 104 104" aria-hidden="true"><circle cx="52" cy="52" r="48" fill="none" stroke="rgba(95,180,255,.3)" stroke-dasharray="1.5 5"/><circle cx="52" cy="52" r="38" fill="none" stroke="rgba(95,180,255,.13)" stroke-width="9"/><circle id="cc-ring" cx="52" cy="52" r="38" fill="none" stroke="#5fb4ff" stroke-width="9" stroke-linecap="round" stroke-dasharray="239" stroke-dashoffset="239" transform="rotate(-90 52 52)" style="filter:drop-shadow(0 0 7px #5fb4ff);transition:stroke-dashoffset 1.2s"/><text id="cc-proz" x="52" y="57" text-anchor="middle" font-family="ui-monospace,Menlo" font-weight="800" font-size="19" fill="#fff">0%</text></svg><div><div class="cc-v" id="cc-gew">–</div><div class="cc-s" id="cc-gew-s"></div></div></div></div>' +
    '<div class="cc-p" style="right:14px;top:31%;width:23%"><h5>AKTIVITÄTS-PROTOKOLL</h5><div id="cc-log"></div></div>' +
    '<div class="cc-p" style="right:14px;top:66%;width:23%"><h5>LIVE-DEALS <em>SCANNER</em></h5><div id="cc-deals"></div></div>' +
    '<div class="cc-st" id="cc-st"><i></i>STATUS: BEREIT</div><div class="cc-sub" id="cc-sub"></div>';
  vc.insertBefore(cc, vc.firstChild);
  var cv = cc.querySelector('canvas'), ctx = cv.getContext('2d');
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  function aktiv() { return MQ.matches && vc.classList.contains('on'); }
  function umschalten() { document.body.classList.toggle('cc-on', MQ.matches); }
  umschalten(); if (MQ.addEventListener) MQ.addEventListener('change', umschalten); else MQ.addListener(umschalten);
  window.addEventListener('resize', umschalten);

  // ---------- Daten aus der App + Backend ----------
  function zeilen(id) { var e = $(id); return e ? e.innerText.split('\n').map(function (s) { return s.trim(); }).filter(Boolean) : []; }
  function nachLabel(arr, label) { var i = arr.findIndex(function (s) { return s.toUpperCase().indexOf(label) === 0; }); return i >= 0 ? arr[i + 1] || '' : ''; }
  function euro(s) { var m = String(s || '').replace(/\./g, '').replace(',', '.').match(/-?\d+(\.\d+)?/); return m ? Number(m[0]) : 0; }
  function paare(id) { var e = $(id), o = {}; if (!e) return o; [].forEach.call(e.querySelectorAll('div'), function (d) { var s = d.querySelector(':scope > span'), b = d.querySelector(':scope > b'); if (s && b) o[s.textContent.trim().toUpperCase()] = b.textContent.replace(/\u00a0/g, ' ').trim(); }); return o; }
  function datenApp() {
    var l = paare('hud-l'), f = paare('hud-fin'), fk = Object.keys(f);
    var gk = fk.find(function (k) { return /^GEWINN/.test(k); }), uk = fk.find(function (k) { return /^UST/.test(k); });
    var gew = gk ? f[gk] : '', lager = f['LAGER'] || '', ust = uk || 'UST', ustW = uk ? f[uk] : '';
    var vm = ($('hud-fin') ? $('hud-fin').textContent : '').match(/(\d+)\s*VERKÄUFE HEUTE/i), verk = vm ? vm[1] : '';
    $('cc-kpi').innerHTML = [['HEUTE', l['HEUTE']], ['7 TAGE', l['7 TAGE']], ['GEWINN MONAT', gew], ['LAGER', lager], [ust, ustW], ['VERKÄUFE HEUTE', verk], ['TO-DO', l['TO-DO']]]
      .filter(function (k) { return k[1]; }).map(function (k) { return '<span style="margin-right:16px">' + esc(k[0]) + '<b>' + esc(k[1]) + '</b></span>'; }).join('');
    var g = euro(gew), p = Math.max(0, Math.min(1, g / 10000));
    $('cc-ring').setAttribute('stroke-dashoffset', String(239 * (1 - p))); $('cc-proz').textContent = Math.round(p * 100) + '%';
    $('cc-gew').textContent = gew || '–';
    var tag = new Date().getDate(), tage = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - tag;
    $('cc-gew-s').innerHTML = 'noch ' + tage + ' Tage<br>Ø ' + Math.max(0, Math.round((10000 - g) / Math.max(1, tage))).toLocaleString('de-DE') + ' €/Tag nötig';
    function liste(id, ziel, max) { var e = $(id); var lis = e ? [].slice.call(e.querySelectorAll('li')) : [];
      $(ziel).innerHTML = lis.length ? lis.slice(0, max).map(function (li) { var t = li.children.length ? [].map.call(li.children, function (c) { return c.textContent.trim(); }).filter(Boolean) : [li.textContent.trim()]; return '<div class="cc-li"><span>' + esc(t[0]) + '</span>' + (t[1] ? '<i>' + esc(t[1].slice(0, 18)) + '</i>' : '') + '</div>'; }).join('') : '<div class="cc-leer">' + esc(e ? e.textContent.trim().slice(0, 80) || '—' : '—') + '</div>';
      return lis.length; }
    var n = liste('aufgaben', 'cc-aufg', 5); $('cc-n-aufg').textContent = n ? n + ' OFFEN' : '';
    liste('preischeck', 'cc-pc', 4);
    var b = $('briefing'); $('cc-term').innerHTML = '<div class="cc-leer" style="color:#a9c4e6">' + esc(b ? b.textContent.trim().slice(0, 160) : '—') + '</div>';
  }
  function zeitKurz(z) { var d = new Date(z); return isNaN(d) ? '' : d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }); }
  async function datenBackend() {
    var k = key(); if (!k) return;
    var h = { headers: { 'X-Jarvis-Key': k, Authorization: 'Bearer ' + k } };
    try { var m = await (await fetch(API + '/api/meldungen', h)).json();
      $('cc-log').innerHTML = (m.meldungen || []).slice(0, 7).map(function (x) { return '<div class="cc-li"><span><b style="margin-right:6px">' + esc(zeitKurz(x.zeit)) + '</b>' + esc(String(x.titel || '').slice(0, 60)) + '</span></div>'; }).join('') || '<div class="cc-leer">Noch nichts heute.</div>';
    } catch (e) { $('cc-log').innerHTML = '<div class="cc-leer">Protokoll gerade nicht erreichbar.</div>'; }
    try { var d = await (await fetch(API + '/api/deals', h)).json();
      var top = (d.deals || []).filter(function (x) { return Number(x.gewinn) > 0; }).sort(function (a, b) { return (b.gemeldet ? 1 : 0) - (a.gemeldet ? 1 : 0) || b.gewinn - a.gewinn; }).slice(0, 5);
      $('cc-deals').innerHTML = top.map(function (x) { return '<div class="cc-li"><span>' + esc(String(x.titel || '').replace(/^\d+°\s*-\s*/, '').slice(0, 42)) + '</span><i>+' + Math.round(x.gewinn) + ' €</i></div>'; }).join('') || '<div class="cc-leer">Gerade keine Deals mit Gewinn.</div>';
    } catch (e) { $('cc-deals').innerHTML = '<div class="cc-leer">Deals gerade nicht erreichbar.</div>'; }
  }
  setInterval(function () { if (aktiv()) datenApp(); }, 4000);
  setInterval(function () { if (aktiv()) datenBackend(); }, 90000);
  setTimeout(function () { datenApp(); datenBackend(); }, 1500);
  setInterval(function () { var u = $('cc-uhr'); if (u) u.textContent = new Date().toLocaleTimeString('de-DE'); }, 1000);

  // Untertitel: letzte Nachricht im Chat
  var logEl = $('log');
  function untertitel() { if (!logEl) return; var m = logEl.querySelectorAll('.msg.jv, .msg.me'); var l = m[m.length - 1]; $('cc-sub').textContent = l ? (l.classList.contains('me') ? '„' + l.textContent.slice(0, 140) + '“' : l.textContent.slice(0, 220)) : ''; }
  if (logEl && window.MutationObserver) new MutationObserver(untertitel).observe(logEl, { childList: true, subtree: true, characterData: true });
  untertitel();

  // ---------- Ton (Web Audio, selbst erzeugt) ----------
  var AC = null, ton = true, hum = null, humG = null, naechsterBlip = 0;
  function audio() { if (AC) return AC; try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} return AC; }
  document.addEventListener('pointerdown', function () { var a = audio(); if (a && a.state === 'suspended') a.resume(); }, { passive: true });
  $('cc-ton').addEventListener('click', function () { ton = !ton; this.setAttribute('aria-pressed', ton ? 'true' : 'false'); });
  function tonFrame(t, denkt) {
    var a = AC; if (!a || a.state !== 'running') return;
    if (!hum) { hum = a.createOscillator(); humG = a.createGain(); var f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300; hum.type = 'sawtooth'; hum.frequency.value = 55; humG.gain.value = 0; hum.connect(f); f.connect(humG); humG.connect(a.destination); hum.start(); }
    humG.gain.setTargetAtTime(ton && denkt ? 0.018 : 0, a.currentTime, 0.25);
    if (ton && denkt && t > naechsterBlip) {
      naechsterBlip = t + 70 + Math.random() * 220;
      var o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = 900 + Math.random() * 2200;
      g.gain.setValueAtTime(0.0001, a.currentTime); g.gain.exponentialRampToValueAtTime(0.025, a.currentTime + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.07);
      o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.09);
    }
  }

  // ---------- Hand / Finger ----------
  var zeiger = { x: 0, y: 0, s: 0, ziel: 0 };          // s = Stärke 0..1 (wie nah)
  cc.addEventListener('pointerdown', function () {}, { passive: true });
  vc.addEventListener('pointermove', function (e) { if (!aktiv()) return; var r = cv.getBoundingClientRect(); zeiger.x = e.clientX - r.left; zeiger.y = e.clientY - r.top; zeiger.ziel = 1; zeiger.zeit = performance.now(); }, { passive: true });
  vc.addEventListener('pointerdown', function (e) { if (!aktiv()) return; var r = cv.getBoundingClientRect(); zeiger.x = e.clientX - r.left; zeiger.y = e.clientY - r.top; zeiger.ziel = 1; zeiger.zeit = performance.now(); }, { passive: true });
  var handAn = false, handLm = null, handVideo = null;
  function handPref() { try { return localStorage.getItem('cc_hand') !== 'aus'; } catch (e) { return true; } }
  var handLaedt = false;
  $('cc-hand').addEventListener('click', function () {
    if (handAn) { try { localStorage.setItem('cc_hand', 'aus'); } catch (e) {} handAn = false; this.setAttribute('aria-pressed', 'false'); if (handVideo && handVideo.srcObject) handVideo.srcObject.getTracks().forEach(function (t) { t.stop(); }); return; }
    try { localStorage.setItem('cc_hand', 'an'); } catch (e) {} handStart();
  });
  // Hand-Erkennung startet automatisch (immer an), sobald die iPad-Ansicht offen ist – braucht iOS eine Berührung, startet sie beim ersten Antippen
  function handAuto() { if (!handAn && !handLaedt && handPref() && aktiv()) handStart(); }
  setTimeout(handAuto, 2500); setInterval(handAuto, 15000);
  document.addEventListener('pointerdown', function () { if (!handAn && handPref() && aktiv()) handStart(); }, { passive: true });
  async function handStart() {
    if (handLaedt || handAn) return; handLaedt = true;
    var btn = $('cc-hand');
    btn.textContent = '✋ LÄDT …';
    try {
      if (!handLm) { var vis = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
      var fs = await vis.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
      handLm = await vis.HandLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task', delegate: 'GPU' }, runningMode: 'VIDEO', numHands: 1 }); }
      handVideo = document.createElement('video'); handVideo.playsInline = true; handVideo.muted = true;
      handVideo.srcObject = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 }, audio: false });
      await handVideo.play();
      handAn = true; btn.setAttribute('aria-pressed', 'true'); btn.textContent = '✋ HAND';
    } catch (e) { btn.textContent = '✋ HAND'; btn.setAttribute('aria-pressed', 'false'); if (window.jvLog) window.jvLog('Hand-Erkennung: ' + (e && e.message)); }
    handLaedt = false;
  }
  function alertKurz(t) { var s = $('cc-sub'); if (s) s.textContent = t; }
  var letzteHand = 0;
  function handFrame(t) {
    if (!handAn || !handLm || !handVideo || handVideo.readyState < 2 || t - letzteHand < 66) return; letzteHand = t;
    try {
      var r = handLm.detectForVideo(handVideo, t), lm = r && r.landmarks && r.landmarks[0];
      if (lm) { var spitze = lm[8], gross = Math.hypot(lm[0].x - lm[9].x, lm[0].y - lm[9].y);
        zeiger.x = (1 - spitze.x) * W; zeiger.y = spitze.y * H; zeiger.ziel = Math.max(0.3, Math.min(1, (gross - 0.06) / 0.18)); zeiger.zeit = t; }
    } catch (e) {}
  }

  // ---------- Jarvis zeichnen ----------
  var W = 0, H = 0, DPR = 1, rs = 7, rnd = function () { rs = (rs * 16807) % 2147483647; return (rs - 1) / 2147483646; };
  var bloom = document.createElement('canvas'), bctx = bloom.getContext('2d');
  var bergeLayer = document.createElement('canvas'), gctx = bergeLayer.getContext('2d');
  var G = null;                                       // Geometrie
  function geometrie() {
    var cx = W / 2, hy = H * 0.3, hrx = H * 0.083, hry = H * 0.108, sh = H * 0.52;
    function hw(y) {
      if (y < hy + hry * 0.92) { var t = (y - hy) / hry, w = hrx * Math.sqrt(Math.max(0, 1 - t * t)); if (t > 0.25) w *= 1 - 0.3 * (t - 0.25) / 0.75; if (t > -0.1 && t < 0.25) w *= 1 + 0.03 * Math.sin((t + 0.1) / 0.35 * Math.PI); return w; }
      var nt = hy + hry * 0.92;
      if (y < sh) { var q = (y - nt) / (sh - nt); return hrx * 0.5 + hrx * 0.22 * q + H * 0.21 * Math.pow(Math.max(0, q - 0.35) / 0.65, 1.25); }
      var q2 = (y - sh) / (H * 0.2); return hrx * 0.72 + H * 0.21 + H * 0.035 * Math.sin(Math.min(1, q2 * 1.6) * Math.PI) * (q2 < 0.62 ? 1 : 0) - H * 0.05 * Math.max(0, q2 - 0.62);
    }
    var lines = []; for (var y = hy - hry + 2; y < H * 0.86; y += Math.max(2.6, H * 0.0042)) lines.push(y);
    var aura = []; for (var i = 0; i < 1700; i++) { var a = rnd() * 6.283, r = 1 + Math.pow(rnd(), 2.3) * 1.0; aura.push({ a: a, r: r, sp: (rnd() - 0.5) * 0.0004, ph: rnd() * 6.28, b: rnd() }); }
    var flow = []; for (var f = 0; f < 420; f++) flow.push({ li: Math.floor(rnd() * lines.length), u: rnd(), sp: 0.0001 + rnd() * 0.00025, dir: rnd() < 0.5 ? 1 : -1 });
    var Z = [['KAUFLAND', '#ff5a7a', -0.95], ['LEXWARE', '#b36bff', -0.45], ['NEXUS · LAGER', '#45d6a0', 0.85], ['DEALS', '#ffb44a', 2.35], ['GEDÄCHTNIS', '#5fd0ff', 3.2], ['SPRACHE', '#ff7ad9', -2.35]];
    var cl = Z.map(function (z, zi) { var d = H * (0.2 + (zi % 2) * 0.05), zx = Math.max(W * 0.31, Math.min(W * 0.69, cx + Math.cos(z[2]) * d * 1.35)), zy = Math.max(H * 0.13, Math.min(H * 0.62, hy - H * 0.02 + Math.sin(z[2]) * d));
      var nodes = []; for (var n = 0; n < 30; n++) nodes.push({ x: zx + (rnd() - 0.5) * H * 0.14, y: zy + (rnd() - 0.5) * H * 0.1, f: 0 });
      var edges = []; nodes.forEach(function (n, i) { for (var k = 1; k <= 3; k++) { var j = (i + k * 7) % nodes.length; edges.push([i, j]); } });
      var fib = []; for (var q = 0; q < 18; q++) fib.push({ sx: (rnd() - 0.5) * hrx * 1.1, sy: (rnd() - 0.5) * hry * 0.8, mx: (rnd() - 0.5) * H * 0.18, my: (rnd() - 0.5) * H * 0.18, tx: (rnd() - 0.5) * H * 0.1, ty: (rnd() - 0.5) * H * 0.07, u: rnd() });
      return { name: z[0], col: z[1], x: zx, y: zy, nodes: nodes, edges: edges, fib: fib, a: 0, ph: zi * 0.9 }; });
    G = { cx: cx, hy: hy, hrx: hrx, hry: hry, sh: sh, hw: hw, lines: lines, aura: aura, flow: flow, cl: cl, venen: [], venT: 0 };
    // Berge einmal vorzeichnen
    bergeLayer.width = cv.width; bergeLayer.height = cv.height; gctx.setTransform(DPR, 0, 0, DPR, 0, 0); gctx.clearRect(0, 0, W, H);
    gctx.globalCompositeOperation = 'lighter';
    for (var st = 0; st < 260; st++) { gctx.fillStyle = 'rgba(160,200,255,' + (rnd() * 0.45).toFixed(2) + ')'; gctx.fillRect(rnd() * W, rnd() * H * 0.7, 1, 1); }
    [-1, 1].forEach(function (seite) {
      for (var k = 0; k < 16000; k++) { var u = rnd(), xx = seite < 0 ? u * W * 0.36 : W - u * W * 0.36;
        var ridge = H * 0.58 + H * 0.14 * u - H * 0.24 * Math.pow(Math.sin(u * Math.PI * 1.2 + 0.4 + seite * 0.3), 2) * (0.55 + 0.45 * Math.sin(u * 13 + seite)) - H * 0.035 * Math.sin(u * 37 + seite);
        var yy = ridge + Math.pow(rnd(), 1.7) * H * 0.32, al = 0.08 + 0.8 * Math.exp(-(yy - ridge) / (H * 0.045));
        gctx.fillStyle = 'rgba(' + (80 + rnd() * 70 | 0) + ',' + (155 + rnd() * 70 | 0) + ',255,' + Math.min(0.9, al).toFixed(3) + ')'; gctx.fillRect(xx + (rnd() - 0.5) * 4, yy, 1.3, 1.3); }
    });
  }
  function groesse() {
    var r = cv.getBoundingClientRect(); var w = Math.round(r.width), h = Math.round(r.height); if (!w || !h) return false;
    var d = Math.min(1.5, window.devicePixelRatio || 1);
    if (w !== W || h !== H || d !== DPR) { W = w; H = h; DPR = d; cv.width = Math.round(w * d); cv.height = Math.round(h * d); bloom.width = Math.round(w / 4); bloom.height = Math.round(h / 4); geometrie(); }
    return true;
  }
  var glow = 0.3, denkA = 0, sprech = 0, turn = 0, last = 0;
  function venen() { G.venen = []; for (var v = 0; v < 6; v++) { var p = [], yy = G.hy + G.hry * 0.95, xx = G.cx + (v - 2.5) * G.hrx * 0.08; for (var s = 0; s < 16; s++) { p.push([xx, yy]); yy += H * 0.012; xx += (v - 2.5) * H * 0.0016 + (rnd() - 0.5) * H * 0.012; } G.venen.push(p); } }
  // goldene Adern in den Bergen (animiert flackernd)
  var adern = []; function adernNeu() { adern = []; [-1, 1].forEach(function (sd) { for (var v = 0; v < 6; v++) { var y0 = H * (0.68 + v * 0.035) + rnd() * H * 0.02, pts = []; for (var t = 0; t <= 50; t++) { var u = t / 50; pts.push([sd < 0 ? u * W * 0.34 : W - u * W * 0.34, y0 - Math.sin(u * Math.PI) * H * 0.07 * (v % 2 ? 1 : 0.5) + Math.sin(u * 17 + v) * H * 0.008 + (rnd() - 0.5) * H * 0.006]); } adern.push({ p: pts, a: 0.3 + rnd() * 0.4, ph: rnd() * 6 }); } }); }

  function frame(t) {
    requestAnimationFrame(frame);
    if (!aktiv() || document.hidden) return;
    if (t - last < 33) return; var dt = Math.min(100, t - last); last = t;
    if (!groesse()) return; if (!adern.length) adernNeu();
    handFrame(t);
    var orb = $('orb'), st = orb ? orb.className : '', denkt = /thinking/.test(st), spricht = /speaking/.test(st), hoert = /listening/.test(st);
    var stEl = $('cc-st'); if (stEl) { var txt = denkt ? 'ANALYSIERT · KOMBINIERT DATEN' : spricht ? 'SPRICHT' : hoert ? 'HÖRT ZU' : /standby/.test(st) ? 'STANDBY · SAG „JARVIS“' : 'BEREIT'; var col = denkt ? '#f6c26b' : spricht ? '#7fd0ff' : '#45d6a0'; var html = '<i style="background:' + col + ';box-shadow:0 0 10px ' + col + '"></i>STATUS: ' + txt; if (stEl.innerHTML !== html) stEl.innerHTML = html; }
    tonFrame(t, denkt);
    glow += ((denkt ? 1 : spricht ? 0.85 : hoert ? 0.65 : 0.45) - glow) * 0.06;
    denkA += ((denkt ? 1 : 0) - denkA) * (denkt ? 0.05 : 0.03);
    var sz = spricht ? Math.max(0, Math.sin(t / 90) * 0.6 + Math.sin(t / 41) * 0.4) : 0; sprech += (sz - sprech) * 0.3;
    if (zeiger.zeit && t - zeiger.zeit > 1200) zeiger.ziel = 0; zeiger.s += (zeiger.ziel - zeiger.s) * 0.08;
    var zielTurn = zeiger.s > 0.05 ? Math.max(-1, Math.min(1, (zeiger.x - G.cx) / (W * 0.3))) * zeiger.s : (reduce ? 0 : Math.sin(t / 5200) * 0.25);
    turn += (zielTurn - turn) * 0.05;

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
    var bg = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, W * 0.6); bg.addColorStop(0, 'rgba(18,46,115,' + (0.45 + 0.15 * glow) + ')'); bg.addColorStop(1, 'rgba(3,5,11,0)'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(bergeLayer, 0, 0); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    // Adern
    adern.forEach(function (a) { ctx.strokeStyle = 'rgba(255,185,85,' + (a.a * (0.6 + 0.4 * Math.sin(t / 700 + a.ph))).toFixed(3) + ')'; ctx.lineWidth = 1.1; ctx.beginPath(); a.p.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.stroke(); });

    var cx = G.cx, hy = G.hy, hrx = G.hrx, hry = G.hry, atem = reduce ? 0 : Math.sin(t / 1600) * 0.012;
    var kopfX = cx + turn * hrx * 0.22;
    // Aura-Partikel um den Kopf (weichen dem Finger aus)
    for (var i = 0; i < G.aura.length; i++) {
      var p = G.aura[i]; if (!reduce) p.a += p.sp * dt;
      var rr = p.r + Math.sin(t / 900 + p.ph) * 0.03 + glow * 0.05;
      var px = kopfX + Math.cos(p.a) * hrx * rr * 1.08, py = hy - hry * 0.08 + Math.sin(p.a) * hry * rr * 1.05;
      if (py > hy + hry * 0.6) continue;
      if (zeiger.s > 0.02) { var dx = px - zeiger.x, dy = py - zeiger.y, d2 = dx * dx + dy * dy, R = H * 0.18; if (d2 < R * R) { var k = (1 - Math.sqrt(d2) / R) * zeiger.s * H * 0.05; var dd = Math.sqrt(d2) || 1; px += dx / dd * k; py += dy / dd * k; } }
      var al = (2.05 - rr) * (0.28 + 0.3 * glow) * (0.6 + 0.4 * Math.sin(t / 400 + p.ph * 3));
      ctx.fillStyle = 'rgba(' + (110 + p.b * 80 | 0) + ',' + (185 + p.b * 55 | 0) + ',255,' + Math.max(0, al).toFixed(3) + ')';
      ctx.fillRect(px, py, 1.3, 1.3);
    }
    // Gesichts-Glut
    var fx = cx + turn * hrx * 0.42, fy = hy + hry * 0.08, fr = hrx * (0.95 + 0.08 * glow + 0.1 * sprech);
    var fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr * 1.25); fg.addColorStop(0, 'rgba(255,205,110,' + (0.42 + 0.22 * glow + 0.18 * sprech) + ')'); fg.addColorStop(0.35, 'rgba(255,140,40,' + (0.26 + 0.16 * glow) + ')'); fg.addColorStop(1, 'rgba(255,100,20,0)');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.ellipse(fx, fy, fr, fr * 1.15, 0, 0, 6.283); ctx.fill();
    // Kontur-Linien
    var L = G.lines;
    for (var li = 0; li < L.length; li++) {
      var y = L[li], w = G.hw(y) * (1 + atem); if (w < 1.5) continue;
      var inKopf = y < hy + hry * 0.92, brust = y > G.sh, fade = y > H * 0.66 ? Math.max(0, 1 - (y - H * 0.66) / (H * 0.2)) : 1;
      var sx = inKopf ? kopfX : cx + turn * hrx * 0.08 * Math.max(0, 1 - (y - hy) / (H * 0.3));
      var nah = zeiger.s > 0.02 ? Math.max(0, 1 - Math.abs(y - zeiger.y) / (H * 0.12)) * zeiger.s : 0;
      ctx.beginPath();
      for (var k3 = 0; k3 <= 44; k3++) { var f = k3 / 44 * 2 - 1, X = sx + f * w;
        var bow = inKopf ? hry * 0.06 * (1 - f * f) * (1 - turn * f * 0.6) : brust ? -H * 0.022 * (1 - f * f) * Math.min(1, (y - G.sh) / (H * 0.07)) : H * 0.002 * (1 - f * f);
        var wav = Math.sin(f * 9 + y * 0.08 + t / 650) * (0.6 + sprech * (inKopf ? 2.2 : 0.5));
        var Y = y + bow + wav; if (nah) { var dxz = X - zeiger.x; Y += Math.exp(-dxz * dxz / (H * H * 0.004)) * nah * H * 0.012 * Math.sign(y - zeiger.y || 1); }
        if (k3) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
      var gr = ctx.createLinearGradient(sx - w, 0, sx + w, 0), kante = 0.95 * fade, mitte;
      if (inKopf && y > hy - hry * 0.6 && y < hy + hry * 0.8) mitte = 'rgba(255,170,75,' + ((0.5 + 0.2 * glow) * fade) + ')'; else mitte = 'rgba(70,150,255,' + (0.14 * fade) + ')';
      gr.addColorStop(0, 'rgba(150,220,255,' + kante + ')'); gr.addColorStop(0.16, 'rgba(90,170,255,' + (0.42 * fade) + ')'); gr.addColorStop(0.5 + turn * 0.12, mitte); gr.addColorStop(0.84, 'rgba(90,170,255,' + (0.42 * fade) + ')'); gr.addColorStop(1, 'rgba(150,220,255,' + kante + ')');
      ctx.strokeStyle = gr; ctx.lineWidth = 1; ctx.stroke();
    }
    // Licht-Teilchen fließen über die Linien
    for (var fl = 0; fl < G.flow.length; fl++) { var q = G.flow[fl]; if (!reduce) q.u += q.sp * dt * (1 + glow); if (q.u > 1) q.u -= 1;
      var yq = L[q.li], wq = G.hw(yq); if (wq < 2) continue; var ff = (q.dir > 0 ? q.u : 1 - q.u) * 2 - 1, inK = yq < hy + hry * 0.92, sxq = inK ? kopfX : cx;
      var fade2 = yq > H * 0.66 ? Math.max(0, 1 - (yq - H * 0.66) / (H * 0.2)) : 1;
      ctx.fillStyle = 'rgba(210,240,255,' + ((0.35 + 0.5 * Math.pow(Math.abs(ff), 2)) * fade2).toFixed(3) + ')'; ctx.fillRect(sxq + ff * wq, yq + (inK ? hry * 0.06 * (1 - ff * ff) : 0), 1.8, 1.8); }
    // Brustbögen + Energie-Kern
    for (var b2 = 0; b2 < 9; b2++) [-1, 1].forEach(function (sd) { ctx.strokeStyle = 'rgba(110,190,255,' + ((0.42 - b2 * 0.04) * (0.8 + 0.2 * glow)).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(cx + sd * H * 0.115, H * 0.64, H * (0.05 + b2 * 0.016), H * (0.037 + b2 * 0.011), 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); });
    var kr = H * (0.03 + 0.006 * Math.sin(t / 500)) * (1 + glow * 0.4), core = ctx.createRadialGradient(cx, H * 0.61, 0, cx, H * 0.61, kr * 2.2); core.addColorStop(0, 'rgba(200,240,255,.95)'); core.addColorStop(0.35, 'rgba(95,180,255,.5)'); core.addColorStop(1, 'rgba(60,140,255,0)');
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(cx, H * 0.61, kr * 2.2, 0, 6.283); ctx.fill();
    // Energie-Adern im Hals
    if (!G.venen.length || t - G.venT > 140) { G.venT = t; venen(); }
    ctx.strokeStyle = 'rgba(255,195,100,' + (0.5 + 0.4 * glow) + ')'; ctx.lineWidth = 1.2;
    G.venen.forEach(function (v) { ctx.beginPath(); v.forEach(function (p, i) { var x2 = p[0] + turn * hrx * 0.1; if (i) ctx.lineTo(x2, p[1]); else ctx.moveTo(x2, p[1]); }); ctx.stroke(); });

    // Arbeits-Modus: Neuronen-Netze aus dem Gehirn
    if (denkA > 0.02) {
      var bx = kopfX, by = hy - hry * 0.15;
      G.cl.forEach(function (c, ci) {
        var ein = Math.max(0, Math.min(1, denkA * 1.6 - ci * 0.09)); c.a = ein; if (ein <= 0) return;
        ctx.globalAlpha = ein;
        c.fib.forEach(function (fi) { if (!reduce) fi.u = (fi.u + dt * 0.0006) % 1;
          var ax = bx + fi.sx, ay = by + fi.sy, mx = (ax + c.x) / 2 + fi.mx, my = (ay + c.y) / 2 + fi.my, ex = c.x + fi.tx, ey = c.y + fi.ty;
          ctx.strokeStyle = c.col; ctx.globalAlpha = ein * 0.28; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke();
          var u = fi.u, iu = 1 - u, qx = iu * iu * ax + 2 * iu * u * mx + u * u * ex, qy = iu * iu * ay + 2 * iu * u * my + u * u * ey;
          ctx.globalAlpha = ein; ctx.fillStyle = '#fff'; ctx.fillRect(qx - 1, qy - 1, 2.4, 2.4); });
        ctx.globalAlpha = ein * 0.5; ctx.strokeStyle = c.col; ctx.lineWidth = 0.8;
        c.edges.forEach(function (e) { var A = c.nodes[e[0]], B = c.nodes[e[1]]; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); });
        ctx.globalAlpha = ein;
        c.nodes.forEach(function (n, i) { if (!reduce && Math.random() < 0.02 * denkA) n.f = 1; n.f *= 0.9; ctx.fillStyle = n.f > 0.3 ? '#fff' : c.col; var rN = (1.4 + n.f * 2.6); ctx.beginPath(); ctx.arc(n.x, n.y, rN, 0, 6.283); ctx.fill(); });
        ctx.globalAlpha = 1;
      });
      var bk = ctx.createRadialGradient(bx, by, 0, bx, by, H * 0.09); bk.addColorStop(0, 'rgba(255,240,210,' + (0.45 * denkA) + ')'); bk.addColorStop(0.3, 'rgba(255,180,80,' + (0.3 * denkA) + ')'); bk.addColorStop(1, 'rgba(255,140,40,0)');
      ctx.fillStyle = bk; ctx.beginPath(); ctx.arc(bx, by, H * 0.09, 0, 6.283); ctx.fill();
    }
    // Finger-Licht
    if (zeiger.s > 0.03) { var zg = ctx.createRadialGradient(zeiger.x, zeiger.y, 0, zeiger.x, zeiger.y, H * 0.06); zg.addColorStop(0, 'rgba(180,230,255,' + (0.45 * zeiger.s) + ')'); zg.addColorStop(1, 'rgba(95,180,255,0)'); ctx.fillStyle = zg; ctx.beginPath(); ctx.arc(zeiger.x, zeiger.y, H * 0.06, 0, 6.283); ctx.fill(); }

    // Bloom: verkleinert + weich drübergelegt
    ctx.globalCompositeOperation = 'source-over';
    bctx.clearRect(0, 0, bloom.width, bloom.height);
    try { bctx.filter = 'blur(3px)'; } catch (e) {}
    bctx.drawImage(cv, 0, 0, bloom.width, bloom.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.42 + 0.12 * glow;
    ctx.drawImage(bloom, 0, 0, cv.width, cv.height);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

    // Etiketten (nach dem Bloom, gestochen scharf)
    if (denkA > 0.02) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.font = '700 ' + Math.round(H * 0.012 + 3) + 'px ui-monospace, Menlo, monospace';
      G.cl.forEach(function (c) { if (c.a <= 0) return; ctx.globalAlpha = c.a; var tw = ctx.measureText(c.name).width + 14, lx = c.x - tw / 2, ly = c.y - H * 0.075;
        ctx.fillStyle = 'rgba(4,8,18,.85)'; ctx.fillRect(lx, ly, tw, H * 0.022 + 3); ctx.strokeStyle = c.col; ctx.lineWidth = 1; ctx.strokeRect(lx, ly, tw, H * 0.022 + 3);
        ctx.fillStyle = '#eaf4ff'; ctx.fillText(c.name, lx + 7, ly + H * 0.016 + 2); });
      ctx.globalAlpha = 1; }
  }
  requestAnimationFrame(frame);
})();
