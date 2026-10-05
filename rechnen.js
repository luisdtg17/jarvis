// Jarvis: Rechenkern für die App (gleiche Logik wie die n8n-Knoten). Automatisch gebündelt.
const N = (() => {
// AUTOMATISCH ERZEUGT aus den n8n-Code-Knoten (Jarvis Sprach-App / Prüf-Helfer). Nicht von Hand ändern – gen_nodes.py neu laufen lassen.
// Jede Funktion bekommt $ (Zugriff auf andere „Knoten“) und $input (Vorgänger) wie in n8n.

function dBelege($, $input) {
const rows = $input.all().map(i => i.json).filter(b => b && b.artikel);
const tag = rows.reduce((m, b) => String(b.datum || '') > m ? String(b.datum || '') : m, '');
const out = rows.filter(b => String(b.datum || '') === tag);
return out.length ? out.map(json => ({ json })) : [{ json: {} }];
}

function dashboardBauen($, $input) {
const get = n => { try { return $(n).all().map(i => i.json); } catch (e) { return []; } };
const TZ = 'Europe/Berlin';
const tag = d => new Date(d).toLocaleDateString('sv-SE', { timeZone: TZ });
const jetzt = Date.now();
const heute = tag(jetzt);
const r2 = x => Math.round(x * 100) / 100;
const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);

// Lager (neXus) – auch für EK-Zuordnung
const lager = get('D Lager').filter(p => p.artikel);
const imLager = lager.filter(p => p.status === 'IM_LAGER');
const ekAcc = {};
for (const p of lager) {
  if (!p.ean || !(Number(p.ek_brutto) > 0)) continue;
  const a = ekAcc[p.ean] || (ekAcc[p.ean] = { s: 0, n: 0 });
  const n = Number(p.anzahl) || 1; a.s += Number(p.ek_brutto) * n; a.n += n;
}
// EK-Suche: neXus-Lager + Excel-Katalog per EAN, sonst per Artikelname
const EKX = (() => {
  const nE = e => String(e || '').replace(/^0+/, '').trim();
  const STOP = new Set(['der','die','das','mit','und','für','fuer','von','neueste','generation','gen','smarter','neu','new','the','and','for','edition','set','2025','2026','deutsch','schwarz','weiß','weiss','blau','mehrfarbig']);
  const toks = s => String(s || '').toLowerCase().replace(/[^a-z0-9äöüß]+/g, ' ').split(' ').filter(w => w.length >= 3 && !STOP.has(w));
  const acc = {}, kat = [];
  const add = (ean, ek, n) => { if (!ean || !(ek > 0)) return; const a = acc[ean] || (acc[ean] = { s: 0, n: 0 }); a.s += ek * n; a.n += n; };
  let lag = [], xl = [];
  try { lag = $('D Lager').all().map(i => i.json); } catch (e) {}
  try { xl = $('D Excel').all().map(i => i.json).filter(r => r.typ === 'ek'); } catch (e) {}
  for (const p of lag) { add(nE(p.ean), Number(p.ek_brutto), Number(p.anzahl) || 1); if (Number(p.ek_brutto) > 0) kat.push({ t: toks(p.artikel), ek: Number(p.ek_brutto) }); }
  const lagHas = new Set(Object.keys(acc));
  for (const r of xl) { const e = nE(r.ean); if (e && !lagHas.has(e)) add(e, Number(r.ek_brutto), Number(r.anzahl) || 1); if (Number(r.ek_brutto) > 0) kat.push({ t: toks(r.artikel), ek: Number(r.ek_brutto) }); }
  const byTitle = title => {
    const tt = new Set(toks(title)); let best = null, bs = 0;
    for (const k of kat) { if (k.t.length < 2) continue; const m = k.t.filter(w => tt.has(w)).length; const s = m / k.t.length; if (m >= 2 && s >= 0.75 && s > bs) { bs = s; best = k; } }
    return best ? best.ek : null;
  };
  return (ean, title) => { const a = acc[nE(ean)]; if (a) return a.s / a.n; return title ? byTitle(title) : null; };
})();
const ekVon = (ean, t) => EKX(ean, t);

// Kaufland-Verkäufe
const orders = get('D Verkäufe').filter(o => o.order_unit_id && !/cancel|storn|return/i.test(String(o.status || '')));
const tage = {};
for (let i = 29; i >= 0; i--) tage[tag(jetzt - i * 86400000)] = { umsatz: 0, netto: 0, stueck: 0, gewinn: 0 };
const kMonate = {};
const gMonate = {};
let ohneEk30 = 0;
for (const o of orders) {
  if (!o.order_created_at) continue;
  const d = tag(o.order_created_at), q = Number(o.quantity) || 1;
  const brutto = (Number(o.unit_price) || 0) * q, netto = Number(o.revenue_net) || 0;
  const auszahlung = Number(o.revenue_gross) || brutto * 0.85;
  const ek = ekVon(o.ean, o.product_title);
  const gewinn = ek != null ? (auszahlung - ek * q) / 1.19 : null;
  if (tage[d]) { tage[d].umsatz += brutto; tage[d].netto += netto; tage[d].stueck += q; if (gewinn != null) tage[d].gewinn += gewinn; else ohneEk30 += q; }
  const m = d.slice(0, 7); kMonate[m] = (kMonate[m] || 0) + brutto;
  const g = gMonate[m] || (gMonate[m] = { umsatz: 0, gewinn: 0, mit_ek: 0, ohne_ek: 0 });
  g.umsatz += brutto;
  if (gewinn != null) { g.gewinn += gewinn; g.mit_ek += q; } else g.ohne_ek += q;
}
const tageListe = Object.entries(tage).map(([d, v]) => ({ datum: d, umsatz: r2(v.umsatz), netto: r2(v.netto), stueck: v.stueck, gewinn: r2(v.gewinn) }));
const last7 = tageListe.slice(-7);
const letzte = orders.slice().sort((a, b) => String(b.order_created_at).localeCompare(String(a.order_created_at))).slice(0, 8)
  .map(o => ({ artikel: String(o.product_title || '').slice(0, 60), preis: r2((Number(o.unit_price) || 0) * (Number(o.quantity) || 1)), datum: o.order_created_at, status: o.status }));
const gewinnMonate = Object.keys(gMonate).sort().slice(-6).map(m => ({ monat: m, umsatz: r2(gMonate[m].umsatz), gewinn: r2(gMonate[m].gewinn), mit_ek: gMonate[m].mit_ek, ohne_ek: gMonate[m].ohne_ek }));

// Lexware-Rechnungen (alle Kanäle)
const lexRaw = get('D Lexware')[0] || {};
const lex = (lexRaw.content || []).filter(v => v.voucherStatus !== 'voided' && v.voucherStatus !== 'draft');
const lMonate = {};
for (let i = 11; i >= 0; i--) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); lMonate[d.toISOString().slice(0, 7)] = 0; }
for (const v of lex) { const m = String(v.voucherDate || '').slice(0, 7); if (m in lMonate) lMonate[m] += Number(v.totalAmount) || 0; }
const offen = lex.filter(v => v.voucherStatus === 'open' || v.voucherStatus === 'overdue');

// Aufgaben
const aufgaben = get('D Aufgaben').filter(a => a.titel && a.erledigt !== true)
  .sort((a, b) => String(a.faellig || '9999').localeCompare(String(b.faellig || '9999')))
  .map(a => ({ id: a.id, titel: a.titel, faellig: a.faellig ? tag(a.faellig) : '', kategorie: a.kategorie || '', ueberfaellig: !!a.faellig && tag(a.faellig) < heute }));

// Termine
const termine = get('D Termine').filter(t => t.start).map(t => ({ titel: t.summary || '(ohne Titel)', start: t.start.dateTime || t.start.date, ganztags: !t.start.dateTime, ende: t.end ? (t.end.dateTime || t.end.date) : '', ort: t.location || '' }));

// Lager-Übersicht
const lagerTop = imLager.map(p => ({ artikel: String(p.artikel || '').slice(0, 50), anzahl: p.anzahl || 1, wert: r2((p.anzahl || 1) * (p.ek_brutto || 0)) }))
  .sort((a, b) => b.wert - a.wert).slice(0, 6);

// Ladenhüter: am längsten im Lager
const lh = imLager.filter(p => /^\d{4}-\d{2}-\d{2}/.test(String(p.bestelldatum || '')))
  .map(p => ({ artikel: String(p.artikel).slice(0, 50), anzahl: p.anzahl || 1, tage: Math.floor((jetzt - new Date(String(p.bestelldatum).slice(0, 10) + 'T12:00:00Z').getTime()) / 86400000), kapital: r2((p.anzahl || 1) * (p.ek_brutto || 0)) }))
  .sort((a, b) => b.tage - a.tage || b.kapital - a.kapital);
const alt = lh.filter(p => p.tage >= 30);
const ladenhueter = { anzahl: alt.length, kapital: r2(sum(alt, p => p.kapital)), liste: lh.slice(0, 8) };

// Kaufland-Preischeck
const ang = (get('D Angebote')[0] || {}).angebote || [];
const rang = { 'VERLUST': 0, 'zu knapp': 1, 'knapp': 2, 'viel Luft, Marktpreis pruefen': 3, 'ok': 4, 'EK unbekannt': 5 };
const aktiv = ang.filter(a => (a.bestand || 0) > 0);
const preischeck = {
  anzahl: aktiv.length,
  ohne_ek: aktiv.filter(a => a.bewertung === 'EK unbekannt').length,
  liste: aktiv.filter(a => a.bewertung !== 'EK unbekannt').sort((a, b) => (rang[a.bewertung] - rang[b.bewertung]) || (a.marge_prozent - b.marge_prozent))
    .map(a => ({ artikel: String(a.artikel || '').slice(0, 48), preis: a.preis_brutto, ek: a.ek_brutto, gewinn: a.gewinn_stueck, marge: a.marge_prozent, bewertung: a.bewertung, vorschlag: a.preis_fuer_15_prozent_marge, bestand: a.bestand }))
};

// Preisverlauf (Markt-Schnappschüsse, 7 Tage)
const mv = get('D Markt Verlauf').filter(r => r.artikel && r.tag);
const vg = {};
for (const r of mv) {
  const k = String(r.artikel).slice(0, 60);
  (vg[k] || (vg[k] = [])).push({ t: r.tag + ' ' + (r.zeit || ''), eigen: Number(r.eigen) || null, konk: r.konkurrent != null && r.konkurrent !== '' ? Number(r.konkurrent) : null, v: r.verkaeufer || '' });
}
const verlauf = Object.entries(vg).map(([artikel, p]) => {
  p.sort((a, b) => a.t.localeCompare(b.t));
  const pts = p.slice(-21), l = pts[pts.length - 1];
  return { artikel: artikel.slice(0, 48), punkte: pts.map(x => [x.t, x.eigen, x.konk]), eigen: l.eigen, konk: l.konk, verkaeufer: l.v, diff: (l.eigen != null && l.konk != null) ? r2(l.eigen - l.konk) : null };
}).filter(x => x.punkte.length).sort((a, b) => (b.diff ?? -999) - (a.diff ?? -999)).slice(0, 20);

// Fehlende Belege (22:30-Check) + neXus-Markierungen
const belege = get('D Belege').filter(b => b.artikel && b.erledigt !== true).map(b => ({ id: b.id, artikel: String(b.artikel).slice(0, 60), problem: b.problem || '', datum: b.datum || '' }));
for (const p of lager) {
  if (Number(p.ohne_ek_rechnung) > 0) belege.push({ id: null, artikel: String(p.artikel).slice(0, 60), problem: 'EK-Rechnung fehlt in neXus (' + p.ohne_ek_rechnung + ' Stk)', datum: '' });
}
const ohneListing = lager.filter(p => Number(p.ohne_listing) > 0).map(p => ({ artikel: String(p.artikel).slice(0, 50), anzahl: Number(p.ohne_listing) }));

// Wetter / Posteingang
const w = get('D Wetter')[0] || {};
const inbox = get('D Posteingang')[0] || {};

return [{ json: {
  stand: new Date().toISOString(),
  verkauf: {
    heute: tage[heute] ? { umsatz: r2(tage[heute].umsatz), stueck: tage[heute].stueck, gewinn: r2(tage[heute].gewinn) } : { umsatz: 0, stueck: 0, gewinn: 0 },
    woche: { umsatz: r2(sum(last7, x => x.umsatz)), stueck: sum(last7, x => x.stueck), gewinn: r2(sum(last7, x => x.gewinn)) },
    monat: { umsatz: r2(kMonate[heute.slice(0, 7)] || 0) },
    tage: tageListe, letzte, ohne_ek_30: ohneEk30
  },
  gewinn: { monate: gewinnMonate },
  lexware: { monate: Object.entries(lMonate).map(([m, v]) => ({ monat: m, umsatz: r2(v) })), offen_anzahl: offen.length, offen_summe: r2(sum(offen, v => Number(v.openAmount ?? v.totalAmount) || 0)) },
  aufgaben, termine, preischeck, ladenhueter, verlauf, belege, ohne_listing: ohneListing,
  lager: { stueck: sum(imLager, p => p.anzahl || 1), wert: r2(sum(imLager, p => (p.anzahl || 1) * (p.ek_brutto || 0))), bestellt: sum(lager.filter(p => p.status === 'BESTELLT'), p => p.anzahl || 1), top: lagerTop, stand: lager[0] ? lager[0].stand : null },
  wetter: w.current ? { temp: w.current.temperature_2m, gefuehlt: w.current.apparent_temperature, code: w.current.weather_code, wind: w.current.wind_speed_10m, tage: (w.daily && w.daily.time || []).map((d, i) => ({ datum: d, max: w.daily.temperature_2m_max[i], min: w.daily.temperature_2m_min[i], regen: w.daily.precipitation_probability_max[i], code: w.daily.weather_code[i] })) } : null,
  mails: { ungelesen: inbox.messagesUnread ?? null, gesamt: inbox.messagesTotal ?? null }
} }];


}

function dashboardErgaenzen($, $input) {
// Ergänzt das Dashboard: Gewinn je Verkauf inkl. eigener Versandkosten aus neXus + eigene Buchungen + Bestell-Pipeline + Lagerliste + Monatsabschluss mit Kontenverteilung.
const get = n => { try { return $(n).all().map(i => i.json); } catch (e) { return []; } };
const d = $input.first().json;
const r2 = x => Math.round(x * 100) / 100;
const TZ = 'Europe/Berlin';
const tag = x => new Date(x).toLocaleDateString('sv-SE', { timeZone: TZ });

// Gewinnverteilung (Stand Sept. 2026): 30 % Steuer, dann Fixkosten, Rest 20/15/10/25
const STEUER = 0.30;
const FIXKOSTEN = [{ name: 'Kindergeld an Papa', betrag: 150 }, { name: 'Ersatz Unterhalt', betrag: 225 }];
const VERTEILUNG = [
  { konto: 'Revolut', zweck: 'Business / Einkauf', teil: 20 },
  { konto: 'Trade Republic', zweck: 'Altersvorsorge (ETFs)', teil: 15 },
  { konto: 'BestSign', zweck: 'Traumkonto', teil: 10 },
  { konto: 'VR-Bank', zweck: 'Privat', teil: 25 }
];

// EK aus Lager (Fallback)
const ekAcc = {};
for (const p of get('D Lager')) {
  if (!p.ean || !(Number(p.ek_brutto) > 0)) continue;
  const a = ekAcc[p.ean] || (ekAcc[p.ean] = { s: 0, n: 0 });
  const n = Number(p.anzahl) || 1; a.s += Number(p.ek_brutto) * n; a.n += n;
}
// EK-Suche: neXus-Lager + Excel-Katalog per EAN, sonst per Artikelname
const EKX = (() => {
  const nE = e => String(e || '').replace(/^0+/, '').trim();
  const STOP = new Set(['der','die','das','mit','und','für','fuer','von','neueste','generation','gen','smarter','neu','new','the','and','for','edition','set','2025','2026','deutsch','schwarz','weiß','weiss','blau','mehrfarbig']);
  const syn = s => String(s || '').toLowerCase().replace(/doorbell/g, ' klingel ').replace(/videotür/g, ' video tür ').replace(/türklingel/g, ' tür klingel ').replace(/cameras?\b/g, 'kamera').replace(/\bcam\b/g, 'kamera');
  const toks = s => syn(s).replace(/[^a-z0-9äöüß]+/g, ' ').split(' ').filter(w => w.length >= 3 && !STOP.has(w));
  const acc = {}, kat = [];
  const add = (ean, ek, n) => { if (!ean || !(ek > 0)) return; const a = acc[ean] || (acc[ean] = { s: 0, n: 0 }); a.s += ek * n; a.n += n; };
  let lag = [], xl = [];
  try { lag = $('D Lager').all().map(i => i.json); } catch (e) {}
  try { xl = $('D Excel').all().map(i => i.json).filter(r => r.typ === 'ek'); } catch (e) {}
  // 1. hochgeladene Excel (noch nicht verkaufte Artikel) – hat Vorrang
  let up = []; try { up = $('D Abschluss').all().map(i => i.json).filter(r => r.typ === 'ek' && Number(r.anzahl) > 0 && Number(r.ek_netto) > 0); } catch (e) {}
  for (const r of up) { const ekb = Number(r.ek_netto) / Number(r.anzahl) * 1.19; add(nE(r.ean), ekb, Number(r.anzahl)); kat.push({ t: toks(r.artikel), ek: ekb, xl: true }); }
  const upHas = new Set(Object.keys(acc));
  for (const p of lag) { if (!upHas.has(nE(p.ean))) add(nE(p.ean), Number(p.ek_brutto), Number(p.anzahl) || 1); if (Number(p.ek_brutto) > 0) kat.push({ t: toks(p.artikel), ek: Number(p.ek_brutto) }); }
  const lagHas = new Set(Object.keys(acc));
  for (const r of xl) { const e = nE(r.ean); if (e && !lagHas.has(e)) add(e, Number(r.ek_brutto), Number(r.anzahl) || 1); if (Number(r.ek_brutto) > 0) kat.push({ t: toks(r.artikel), ek: Number(r.ek_brutto) }); }
  const byTitle = title => {
    const tt = new Set(toks(title)); let best = null, bs = 0;
    for (const k of kat) { if (k.t.length < 2) continue; const m = k.t.filter(w => tt.has(w)).length; const s = m / k.t.length + (k.xl ? 0.001 : 0); if (m >= 2 && s >= 0.75 && s > bs) { bs = s; best = k; } }
    return best;
  };
  const f = (ean, title) => { const a = acc[nE(ean)]; if (a) return a.s / a.n; const b = title ? byTitle(title) : null; return b ? b.ek : null; };
  f.excel = (ean, title) => { const e = nE(ean); if (e && upHas.has(e)) return acc[e].s / acc[e].n; const b = title ? byTitle(title) : null; return b && b.xl ? b.ek : null; };
  f.toks = toks;
  return f;
})();
const ekLager = (ean, t) => EKX(ean, t);

const nx = get('D neXus Verkäufe').filter(v => v.artikel && v.vk_am);
const used = new Set();
const findNx = o => {
  let i = nx.findIndex((v, k) => !used.has(k) && v.vk_bestellnummer && String(v.vk_bestellnummer).includes(String(o.order_id)));
  if (i < 0) i = nx.findIndex((v, k) => !used.has(k) && v.ean && v.ean === o.ean && tag(v.vk_am) === tag(o.order_created_at));
  if (i < 0) return null;
  used.add(i); return nx[i];
};

const sales = [];
const orders = get('D Verkäufe').filter(o => o.order_unit_id && o.order_created_at && !/cancel|storn|return/i.test(String(o.status || '')));
for (const o of orders) {
  const q = Number(o.quantity) || 1;
  const m = findNx(o);
  const brutto = (Number(o.unit_price) || 0) * q;
  const auszNetto = (Number(o.revenue_gross) || brutto * 0.85) / 1.19;
  const ekXl = EKX.excel(o.ean, o.product_title);
  const ekB = ekXl != null ? ekXl : (m && m.ek_brutto != null ? m.ek_brutto : ekLager(o.ean, o.product_title));
  const ekN = ekXl != null ? ekXl / 1.19 : (m && m.ek_netto != null ? m.ek_netto : (ekB != null ? ekB / 1.19 : null));
  const versand = m ? (Number(m.versandkosten) || 0) : 0;
  const sonst = m ? (Number(m.sonstige_kosten) || 0) : 0;
  const gewinn = ekN == null ? null : auszNetto - ekN * q - versand / 1.19 - sonst / 1.19;
  sales.push({ tag: tag(o.order_created_at), plattform: 'Kaufland', artikel: String(o.product_title || '').split(',')[0].slice(0, 50), umsatz: brutto, gewinn, versand_bekannt: !!m, versand, status: o.status, order_id: o.order_id });
}
nx.forEach((v, k) => {
  if (used.has(k)) return;
  const vkN = v.vk_netto != null ? v.vk_netto : (Number(v.vk_brutto) || 0) / 1.19;
  const ekN = v.ek_netto != null ? v.ek_netto : (v.ek_brutto != null ? v.ek_brutto / 1.19 : null);
  const gewinn = ekN == null ? null : vkN - ekN - (Number(v.gebuehren) || 0) / 1.19 - (Number(v.versandkosten) || 0) / 1.19 - (Number(v.sonstige_kosten) || 0) / 1.19;
  sales.push({ tag: tag(v.vk_am), plattform: v.vk_plattform || 'neXus', artikel: String(v.artikel).slice(0, 50), umsatz: Number(v.vk_brutto) || 0, gewinn, versand_bekannt: true, versand: Number(v.versandkosten) || 0 });
});

// Eigene Buchungen (von Jarvis eingetragen: eBay, Vinted, privat …, Ausgaben)
const eigene = get('D Eigene Buchungen').filter(b => b && b.typ && b.datum);
for (const b of eigene) {
  const q = Number(b.menge) || 1, p = Number(b.preis_brutto) || 0;
  const t = String(b.datum).slice(0, 10);
  if (/verkauf/i.test(b.typ)) {
    const ek = Number(b.ek_brutto) || 0;
    const gewinn = (p * q - (Number(b.gebuehren) || 0) - (Number(b.versand) || 0)) / 1.19 - (ek * q) / 1.19;
    sales.push({ tag: t, plattform: b.plattform || 'Eigene', artikel: String(b.artikel || '').slice(0, 50), umsatz: p * q, gewinn: ek > 0 ? gewinn : null, versand_bekannt: true, versand: Number(b.versand) || 0, eigen: true });
  } else if (/ausgabe/i.test(b.typ)) {
    sales.push({ tag: t, plattform: 'Ausgabe', artikel: String(b.artikel || '').slice(0, 50), umsatz: 0, gewinn: -(p * q) / 1.19, versand_bekannt: true, versand: 0, ausgabe: true });
  }
}

// Gewinn pro Monat – Excel-Upload hat Vorrang
const XLV = get('D Abschluss').filter(r => r.typ === 'verkauf' && /^\d{4}-\d{2}$/.test(String(r.monat || '')));
const xlMon = {};
for (const r of XLV) {
  const x = xlMon[r.monat] || (xlMon[r.monat] = { gewinn: 0, umsatz: 0, stueck: 0, ohne: 0, pool: [] });
  x.gewinn += Number(r.gewinn) || 0; x.umsatz += (Number(r.umsatz_netto) || 0) * 1.19; x.stueck += Number(r.anzahl) || 0; x.ohne += Number(r.ohne_gewinn) || 0;
  x.pool.push({ t: EKX.toks(r.artikel), n: Number(r.anzahl) || 0 });
}
const monJetzt = tag(Date.now()).slice(0, 7);
const inExcel = s => {
  const x = xlMon[s.tag.slice(0, 7)]; if (!x || s.ausgabe) return false;
  if (s.tag.slice(0, 7) < monJetzt) return true; // abgeschlossener Monat: nur Excel zählt
  const tt = new Set(EKX.toks(s.artikel));
  for (const p of x.pool) { if (p.n <= 0 || !p.t.length) continue; const m = p.t.filter(w => tt.has(w)).length; if (m >= Math.min(2, p.t.length) && m / Math.min(p.t.length, tt.size || 1) >= 0.6) { p.n--; return true; } }
  return false;
};
const mon = {};
for (const s of sales) {
  if (inExcel(s)) { s.in_excel = true; continue; }
  const m = s.tag.slice(0, 7);
  const x = mon[m] || (mon[m] = { umsatz: 0, gewinn: 0, mit_ek: 0, ohne_ek: 0, verkaeufe: 0, versand_fehlt: 0 });
  x.umsatz += s.umsatz; if (!s.ausgabe) x.verkaeufe++;
  if (s.gewinn != null) { x.gewinn += s.gewinn; if (!s.ausgabe) x.mit_ek++; } else x.ohne_ek++;
  if (s.plattform === 'Kaufland' && !s.versand_bekannt) x.versand_fehlt++;
}
for (const m in xlMon) {
  const x = mon[m] || (mon[m] = { umsatz: 0, gewinn: 0, mit_ek: 0, ohne_ek: 0, verkaeufe: 0, versand_fehlt: 0 });
  const e = xlMon[m];
  x.live = x.verkaeufe; x.aus_excel = e.stueck;
  x.gewinn += e.gewinn; x.umsatz += e.umsatz; x.verkaeufe += e.stueck; x.mit_ek += e.stueck - e.ohne; x.ohne_ek += e.ohne;
}
const monate = Object.keys(mon).sort().slice(-6).map(m => ({ monat: m, umsatz: r2(mon[m].umsatz), gewinn: r2(mon[m].gewinn), mit_ek: mon[m].mit_ek, ohne_ek: mon[m].ohne_ek }));
d.gewinn = { monate, quelle: (nx.length ? 'Kaufland + neXus (inkl. eigener Versandkosten)' : 'Kaufland') + (eigene.length ? ' + eigene Buchungen' : '') };
d.eigene = eigene.slice().sort((a, b) => String(b.datum).localeCompare(String(a.datum))).slice(0, 10).map(b => ({ id: b.id, typ: b.typ, datum: b.datum, plattform: b.plattform, artikel: b.artikel, preis: Number(b.preis_brutto) || 0, menge: Number(b.menge) || 1 }));
const heuteT = tag(Date.now()), monatT = heuteT.slice(0, 7);
const eigUms = f => sales.filter(s => s.eigen && f(s.tag)).reduce((a, s) => a + s.umsatz, 0);
if (d.verkauf) {
  if (d.verkauf.heute) d.verkauf.heute.umsatz = r2((d.verkauf.heute.umsatz || 0) + eigUms(t => t === heuteT));
  if (d.verkauf.monat) d.verkauf.monat.umsatz = r2((d.verkauf.monat.umsatz || 0) + eigUms(t => t.startsWith(monatT)));
  if (d.verkauf.woche) d.verkauf.woche.umsatz = r2((d.verkauf.woche.umsatz || 0) + eigUms(t => t >= tag(Date.now() - 6 * 86400000)));
}

// Bestell-Pipeline (Kaufland, ab 01.10.2026, max. 14 Tage)
const entw = {}; for (const r of get('D Entwürfe')) if (r.order_id) entw[String(r.order_id)] = r.invoice_id;
const lexSt = {}; for (const v of ((get('D Lexware')[0] || {}).content || [])) lexSt[v.id] = v.voucherStatus;
const grenzeP = Math.max(Date.now() - 14 * 86400000, new Date('2026-10-01T00:00:00+02:00').getTime());
const og = {};
for (const o of get('D Verkäufe')) {
  if (!o.order_id || !o.order_unit_id || !o.order_created_at) continue;
  if (new Date(o.order_created_at).getTime() < grenzeP) continue;
  (og[o.order_id] || (og[o.order_id] = [])).push(o);
}
const sbo = {}; for (const s of sales) if (s.order_id) (sbo[s.order_id] || (sbo[s.order_id] = [])).push(s);
const pipe = Object.entries(og).map(([id, us]) => {
  const st = us.map(u => String(u.status || ''));
  const storno = st.every(x => /cancel|storn|return/i.test(x));
  const bezahlt = !st.some(x => x === 'open');
  const versendet = st.every(x => x === 'sent' || x === 'received');
  const ss = sbo[id] || [];
  const inv = entw[id], ls = inv ? lexSt[inv] : null;
  const rechnung = inv ? (ls === 'voided' ? 'fehlt' : (ls && ls !== 'draft' ? 'ok' : 'entwurf')) : (bezahlt ? 'fehlt' : 'warten');
  const alter = Date.now() - new Date(us[0].order_created_at).getTime();
  const nexus = ss.length > 0 && ss.every(x => x.versand_bekannt);
  const gewOk = ss.length > 0 && ss.every(x => x.gewinn != null);
  const X = '-';
  return {
    order_id: id, datum: us[0].order_created_at, storno,
    artikel: String(us[0].product_title || '').split(',')[0].slice(0, 45) + (us.length > 1 ? ' +' + (us.length - 1) : ''),
    betrag: r2(us.reduce((a, u) => a + (Number(u.unit_price) || 0) * (Number(u.quantity) || 1), 0)),
    gewinn: gewOk ? r2(ss.reduce((a, x) => a + x.gewinn, 0)) : null,
    s: storno ? { bezahlt: 'storno', rechnung: X, label: X, versand: X, nexus: X, gewinn: X } : {
      bezahlt: bezahlt ? 'ok' : 'warten',
      rechnung,
      label: versendet ? 'ok' : (bezahlt ? 'spaeter' : 'warten'),
      versand: versendet ? 'ok' : (bezahlt ? (alter > 86400000 ? 'fehlt' : 'offen') : 'warten'),
      nexus: nexus ? 'ok' : (versendet ? 'fehlt' : 'offen'),
      gewinn: gewOk ? 'ok' : 'offen'
    }
  };
}).sort((a, b) => String(b.datum).localeCompare(String(a.datum)));
const aktivP = pipe.filter(p => !p.storno);
const zaehl = k => aktivP.filter(p => p.s[k] === 'ok').length;
d.pipeline = { anzahl: aktivP.length, zaehler: { bezahlt: zaehl('bezahlt'), rechnung: zaehl('rechnung'), label: zaehl('label'), versand: zaehl('versand'), nexus: zaehl('nexus'), gewinn: zaehl('gewinn') },
  probleme: aktivP.filter(p => Object.values(p.s).includes('fehlt')).length, liste: pipe.slice(0, 20) };

// Lager komplett (für den Lager-Tab), verknüpft mit Kaufland-Angeboten
const nE = e => String(e || '').replace(/^0+/, '');
const ang = {}; for (const a of ((get('D Angebote')[0] || {}).angebote || [])) { if (!a.ean) continue; const k = nE(a.ean); const x = ang[k] || (ang[k] = { preis: a.preis_brutto, bestand: 0, marge: a.marge_prozent, bewertung: a.bewertung }); x.bestand += Number(a.bestand) || 0; if (a.preis_brutto < x.preis) x.preis = a.preis_brutto; }
d.lager = d.lager || {};
d.lager.liste = get('D Lager').filter(p => p.artikel).map(p => {
  const n = Number(p.anzahl) || 1, ek = Number(p.ek_brutto) || null, a = p.ean ? ang[nE(p.ean)] : null;
  const bd = /^\d{4}-\d{2}-\d{2}/.test(String(p.bestelldatum || '')) ? String(p.bestelldatum).slice(0, 10) : '';
  return { artikel: String(p.artikel).slice(0, 70), ean: p.ean || '', status: p.status || '', anzahl: n, ek, wert: ek ? r2(ek * n) : 0, haendler: p.haendler || '',
    tage: bd ? Math.floor((Date.now() - new Date(bd + 'T12:00:00Z').getTime()) / 86400000) : null,
    ohne_rechnung: Number(p.ohne_ek_rechnung) || 0, ohne_listing: Number(p.ohne_listing) || 0,
    kl_preis: a ? a.preis : null, kl_bestand: a ? a.bestand : null, kl_marge: a && a.marge != null ? a.marge : null, kl_bewertung: a ? a.bewertung : null };
}).sort((a, b) => (a.status === b.status ? b.wert - a.wert : (a.status === 'IM_LAGER' ? -1 : 1)));

// Monatsabschluss
const abschluss = m => {
  const x = mon[m] || { umsatz: 0, gewinn: 0, mit_ek: 0, ohne_ek: 0, verkaeufe: 0, versand_fehlt: 0 };
  const g = Math.max(0, x.gewinn);
  const steuer = g * STEUER;
  const fix = FIXKOSTEN.reduce((a, f) => a + f.betrag, 0);
  const rest = g - steuer - fix;
  const summeTeile = VERTEILUNG.reduce((a, v) => a + v.teil, 0);
  const konten = [{ konto: 'Fyrst', zweck: 'Steuer-Rücklage (30 %)', betrag: r2(steuer) }]
    .concat(FIXKOSTEN.map(f => ({ konto: 'Fixkosten', zweck: f.name, betrag: f.betrag })))
    .concat(VERTEILUNG.map(v => ({ konto: v.konto, zweck: v.zweck + ' (' + v.teil + '/' + summeTeile + ' vom Rest)', betrag: rest > 0 ? r2(rest * v.teil / summeTeile) : 0 })));
  return { monat: m, gewinn: r2(x.gewinn), umsatz: r2(x.umsatz), verkaeufe: x.verkaeufe, ohne_ek: x.ohne_ek, versand_fehlt: x.versand_fehlt, aus_excel: x.aus_excel || 0, live: x.aus_excel ? (x.live || 0) : x.verkaeufe,
    rest: r2(rest), reicht_nicht: rest < 0, konten };
};
const jetzt = tag(Date.now()).slice(0, 7);
const vd = new Date(); vd.setDate(1); vd.setMonth(vd.getMonth() - 1);
const vormonat = tag(vd).slice(0, 7);
d.monatsabschluss = { aktuell: abschluss(jetzt), vormonat: abschluss(vormonat) };
d.versand_fehlt = sales.filter(s => s.plattform === 'Kaufland' && !s.versand_bekannt && ['sent', 'received'].includes(String(s.status)) && s.tag >= tag(Date.now() - 14 * 86400000)).map(s => ({ artikel: s.artikel, tag: s.tag, order_id: s.order_id })).slice(0, 10);
return [{ json: d }];


}

function lagerAnreichern($, $input) {
const d = $input.first().json;
const r2 = x => Math.round(x * 100) / 100;
const nE = e => String(e || '').replace(/^0+/, '');
const rows = $('D Lager').all().map(i => i.json).filter(p => p.artikel);
const key = p => [String(p.artikel).slice(0, 70), p.ean || '', p.status || ''].join('|');
const extra = {};
for (const p of rows) { const k = key(p); (extra[k] = extra[k] || []).push(p); }
// Kaufland-Angebote je EAN
let ang = [];
try { ang = (($('D Angebote').first().json || {}).angebote) || []; } catch (e) { ang = []; }
const angE = {};
for (const a of ang) { const es = new Set([nE(a.ean)].concat((a.eans || []).map(nE)).filter(Boolean)); for (const e of es) (angE[e] = angE[e] || []).push(a); }
// Marktverlauf (7 Tage Snapshots) je Kaufland-Titel
let mv = [];
try { mv = $('D Markt Verlauf').all().map(i => i.json).filter(r => r.artikel); } catch (e) { mv = []; }
const mvT = {};
for (const r of mv) { const k = String(r.artikel).slice(0, 70); (mvT[k] = mvT[k] || []).push(r); }
for (const k in mvT) mvT[k].sort((a, b) => (a.tag + a.zeit).localeCompare(b.tag + b.zeit));
const gewinnBei = (preis, ek) => (ek == null || preis == null) ? null : r2(preis * 0.88 / 1.19 - ek / 1.19);
const liste = (d.lager && d.lager.liste) || [];
for (const x of liste) {
  const arr = extra[key(x)] || [];
  const p = arr.find(q => Number(q.ek_brutto) === Number(x.ek)) || arr[0] || {};
  x.artikel = String(p.artikel || x.artikel).slice(0, 90);
  x.bild = p.bild_url || '';
  x.kat = p.kategorie || 'Sonstiges';
  x.ekn = Number(p.ek_netto) || (x.ek ? r2(x.ek / 1.19) : null);
  x.wert_netto = x.ekn ? r2(x.ekn * x.anzahl) : 0;
  x.bd = /^\d{4}-\d{2}-\d{2}/.test(String(p.bestelldatum || '')) ? String(p.bestelldatum).slice(0, 10) : '';
  x.ld = String(p.lieferdatum || '').slice(0, 10);
  // Markt
  const as = x.ean ? (angE[nE(x.ean)] || []) : [];
  if (as.length) {
    const a = as.slice().sort((u, v) => (u.preis_brutto || 0) - (v.preis_brutto || 0))[0];
    const hAll = mvT[String(a.artikel || '').slice(0, 70)] || [];
    const hEig = hAll.filter(r => Math.abs(Number(r.eigen) - Number(a.preis_brutto)) < 0.02);
    const hist = hEig.length ? hEig : hAll;
    const lastR = hist.length ? hist[hist.length - 1] : null;
    x.kl_titel = a.artikel || '';
    x.kl_preis = a.preis_brutto; x.kl_bestand = as.reduce((t, u) => t + (Number(u.bestand) || 0), 0); if (a.marge_prozent != null) x.kl_marge = a.marge_prozent;
    x.kl_konk = lastR && lastR.konkurrent != null ? Number(lastR.konkurrent) : null;
    x.kl_verkaeufer = lastR ? (lastR.verkaeufer || '') : '';
    x.kl_check = lastR ? (lastR.tag + ' ' + lastR.zeit) : '';
    x.kl_gewinn = gewinnBei(a.preis_brutto, x.ek);
    x.kl_verlauf = hist.slice(-21).map(r => [String(r.tag).slice(5) + ' ' + r.zeit, r.eigen, r.konkurrent]);
    if (x.kl_konk != null && a.preis_brutto != null) {
      const luft = r2(x.kl_konk - a.preis_brutto);
      x.kl_luft = luft;
      if (luft >= 1) { x.kl_ziel = r2(x.kl_konk - 0.1); x.kl_gewinn_ziel = gewinnBei(x.kl_ziel, x.ek); }
    }
  }
}
liste.sort((a, b) => String(b.ld || b.bd).localeCompare(String(a.ld || a.bd)));
// Letzte Verkäufe: war es zu günstig?
const letzte = (d.verkauf && d.verkauf.letzte) || [];
const titles = Object.keys(mvT);
for (const s of letzte) {
  const t = String(s.artikel || '');
  const k = titles.find(z => z.startsWith(t.slice(0, 40)) && mvT[z].some(r => Math.abs(Number(r.eigen) - Number(s.preis)) < 0.02)) || titles.find(z => z.startsWith(t.slice(0, 40)));
  if (!k) continue;
  const when = new Date(s.datum).toLocaleString('sv-SE', { timeZone: 'Europe/Berlin' }).slice(0, 16);
  const rowsK = mvT[k].filter(r => Math.abs(Number(r.eigen) - Number(s.preis)) < 0.02);
  const before = (rowsK.length ? rowsK : mvT[k]).filter(r => (r.tag + ' ' + r.zeit) <= when);
  const r = before.length ? before[before.length - 1] : null;
  if (!r || r.konkurrent == null) continue;
  s.konk_damals = Number(r.konkurrent);
  s.zu_guenstig = r2(Number(r.konkurrent) - Number(s.preis));
}

// ---------- Rückgabefristen, Verlust-Warnung ----------
const getS = n => { try { return $(n).all().map(i => i.json); } catch (e) { return []; } };
const tagB = x => new Date(x).toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
const heute = tagB(Date.now());
const xl = getS('D Excel');
const rbl = xl.filter(r => r.typ === 'rueckgabe' && /^\d{4}-\d{2}-\d{2}$/.test(String(r.retoure_bis || '')));
const low = s => String(s || '').toLowerCase();
const plusTage = (d, n) => { const t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const diffTage = d => Math.round((new Date(d + 'T12:00:00Z') - new Date(heute + 'T12:00:00Z')) / 86400000);
for (const x of liste) {
  if (x.status !== 'IM_LAGER') continue;
  const r = rbl.find(q => (q.ean && x.ean && nE(q.ean) === nE(x.ean)) || (low(q.artikel).slice(0, 14) && low(x.artikel).includes(low(q.artikel).trim().slice(0, 14))));
  if (r) { x.rueckgabe_bis = r.retoure_bis; x.rueckgabe_geschaetzt = false; }
  else if (/amazon/i.test(x.haendler || '') && /^\d{4}-\d{2}-\d{2}$/.test(x.ld || '')) { x.rueckgabe_bis = plusTage(x.ld, 30); x.rueckgabe_geschaetzt = true; }
  if (x.rueckgabe_bis) x.rueckgabe_tage = diffTage(x.rueckgabe_bis);
  if (x.kl_gewinn != null && x.kl_gewinn < 0) x.verlust = true;
}

// ---------- Geld-Überblick + USt-Schätzung ----------
const sumF = (a, f) => a.reduce((s, x) => s + (f(x) || 0), 0);
const orders = getS('D Verkäufe').filter(o => o.order_unit_id && !/cancel|storn|return/i.test(String(o.status || '')));
const offenK = orders.filter(o => String(o.status) !== 'received');
const ustRaw = getS('D USt').flatMap(p => p.content || []);
const ustRange = (von, bis, label) => {
  const alle = ustRaw.filter(v => { const m = String(v.voucherDate || '').slice(0, 7); return m >= von && m <= bis && v.voucherStatus !== 'voided' && v.voucherStatus !== 'draft'; });
  const sonder = alle.filter(v => /finanzamt/i.test(v.contactName || ''));
  const vs = alle.filter(v => !/finanzamt/i.test(v.contactName || ''));
  const g = t => sumF(vs.filter(v => t.includes(v.voucherType)), v => Number(v.totalAmount));
  const umsatz = g(['invoice', 'salesinvoice']) - g(['creditnote', 'salescreditnote']);
  const einkauf = g(['purchaseinvoice']) - g(['purchasecreditnote']);
  const ust = umsatz * 19 / 119, vst = einkauf * 19 / 119;
  return { monat: von, bis, label, umsatz_brutto: r2(umsatz), einkauf_brutto: r2(einkauf), ust: r2(ust), vorsteuer: r2(vst), zahllast: r2(ust - vst), belege_verkauf: vs.filter(v => ['invoice', 'salesinvoice'].includes(v.voucherType)).length, belege_einkauf: vs.filter(v => v.voucherType === 'purchaseinvoice').length, sonderposten: sonder.map(v => (v.voucherNumber || 'Finanzamt') + ' ' + r2(Number(v.totalAmount) || 0) + ' €') };
};
// Voranmeldung quartalsweise
const jahr = Number(heute.slice(0, 4)), mon = Number(heute.slice(5, 7));
const qNow = Math.floor((mon - 1) / 3) + 1;
const qInfo = (y, q) => ({ von: y + '-' + String(q * 3 - 2).padStart(2, '0'), bis: y + '-' + String(q * 3).padStart(2, '0'), label: 'Q' + q + ' ' + y });
const qa = qInfo(jahr, qNow);
const qv = qNow === 1 ? qInfo(jahr - 1, 4) : qInfo(jahr, qNow - 1);
const frist = qa.von + '-10';
// Excel-Abschluss (aus hochgeladener Excel)
const abRows = getS('D Abschluss').filter(r => r.typ);
const abschluss = abRows.length ? {
  stand: abRows.reduce((m, r) => (String(r.stand || '') > m ? String(r.stand) : m), ''),
  v: abRows.filter(r => r.typ === 'verkauf').map(r => [r.monat, r.artikel, Number(r.anzahl) || 0, r2(Number(r.umsatz_netto) || 0), r2(Number(r.ek_netto) || 0), r2(Number(r.gebuehren) || 0), r2(Number(r.gewinn) || 0), r.plattform || '', Number(r.ohne_gewinn) || 0]),
  k: abRows.filter(r => r.typ === 'kosten').map(r => [r.monat, r.artikel, r2(Number(r.gewinn) || 0)])
} : null;
d.abschluss = abschluss;
const imL = liste.filter(p => p.status === 'IM_LAGER'), best = liste.filter(p => p.status === 'BESTELLT');
const ma = (d.monatsabschluss && d.monatsabschluss.aktuell) || {};
d.geld = {
  lager_ek: r2(sumF(imL, p => p.wert)), lager_stueck: sumF(imL, p => p.anzahl),
  bestellt_ek: r2(sumF(best, p => p.wert)),
  kaufland_offen: r2(sumF(offenK, o => Number(o.revenue_gross) || (Number(o.unit_price) || 0) * 0.88)), kaufland_offen_anzahl: offenK.length,
  ruecklage_monat: r2((ma.konten || []).filter(k => k.konto === 'Fyrst').reduce((a, k) => a + k.betrag, 0)),
  ust: ustRaw.length ? { vormonat: ustRange(qv.von, qv.bis, qv.label), aktuell: ustRange(qa.von, heute.slice(0, 7), qa.label), frist, quartal: true } : null
};
// Kompakt-Ausgabe für Claude (Werkzeug geschaeftsdaten)
let kompakt = '';
try { kompakt = String((($('Dashboard-Abruf').first().json || {}).body || {}).kompakt || '').toLowerCase(); } catch (e) {}
if (kompakt) {
  const v = d.verkauf || {};
  const ueb = {
    stand: d.stand,
    verkauf: { heute: v.heute, woche: v.woche, monat: v.monat, letzte: (v.letzte || []).slice(0, 10).map(o => ({ artikel: o.artikel, preis: o.preis, datum: o.datum, konk_damals: o.konk_damals })) },
    gewinn_monat_geschaetzt: d.monatsabschluss && d.monatsabschluss.aktuell ? { monat: d.monatsabschluss.aktuell.monat, gewinn: d.monatsabschluss.aktuell.gewinn, umsatz: d.monatsabschluss.aktuell.umsatz, verkaeufe: d.monatsabschluss.aktuell.verkaeufe, aus_excel: d.monatsabschluss.aktuell.aus_excel, ohne_ek: d.monatsabschluss.aktuell.ohne_ek } : null,
    gewinn_vormonat: d.monatsabschluss && d.monatsabschluss.vormonat ? { monat: d.monatsabschluss.vormonat.monat, gewinn: d.monatsabschluss.vormonat.gewinn, umsatz: d.monatsabschluss.vormonat.umsatz } : null,
    geld: d.geld,
    pipeline: d.pipeline ? { anzahl: d.pipeline.anzahl, probleme: d.pipeline.probleme, liste: (d.pipeline.liste || []).slice(0, 10).map(p => ({ artikel: p.artikel, datum: p.datum, betrag: p.betrag, gewinn: p.gewinn, status: p.s })) } : null,
    preischeck: ((d.preischeck || {}).liste || []).filter(x => x.bewertung !== 'ok').slice(0, 15),
    fehlende_belege: (d.belege || []).slice(0, 15),
    aufgaben: (d.aufgaben || []).slice(0, 15),
    termine: (d.termine || []).slice(0, 10)
  };
  const lag = liste.map(x => ({ artikel: x.artikel, ean: x.ean, kategorie: x.kat, status: x.status, anzahl: x.anzahl, ek_brutto: x.ek, wert: x.wert, tage_im_lager: x.tage, haendler: x.haendler, kaufland_preis: x.kl_preis, konkurrenz: x.kl_konk, luft: x.kl_luft, gewinn_pro_stk: x.kl_gewinn, rueckgabe_bis: x.rueckgabe_bis, verlust: x.verlust || false }));
  const res = kompakt.startsWith('lager') ? { stand: d.stand, lager: lag }
    : kompakt.startsWith('abschluss') ? { stand: d.stand, erklaerung: 'v = [monat, artikel, anzahl, umsatz_netto, ek_netto, gebuehren+versand, gewinn, plattform, ohne_gewinn]; k = [monat oder monatlich, kosten_posten, betrag_netto]', abschluss: d.abschluss }
    : kompakt.startsWith('alles') ? { ...ueb, lager: lag, abschluss: d.abschluss }
    : ueb;
  return [{ json: res }];
}
return [{ json: d }];

}

function angeboteKompakt($, $input) {
if (($('Prüf-Anfrage').first().json.body || {}).aktion === 'kaufland_get') return [{ json: { roh: $('Kaufland-Angebote holen').first().json } }];
const r = $('Kaufland-Angebote holen').first().json;
const lager = $('Lager lesen').all().map(i => i.json);
const n = e => String(e || '').replace(/^0+/, '');
const r2 = x => Math.round(x * 100) / 100;
const ek = {};
for (const p of lager) {
  if (!p.ean || p.ek_brutto == null) continue;
  const a = ek[n(p.ean)] || (ek[n(p.ean)] = { st: 0, sum: 0 });
  const q = Number(p.anzahl) || 1; a.st += q; a.sum += q * Number(p.ek_brutto);
}
const list = (r.data || []).map(u => {
  const p = u.product || (Array.isArray(u.products) ? u.products[0] : u.products) || {};
  const eans = Array.isArray(p.eans) ? p.eans : [];
  let e = null; for (const x of eans) { if (ek[n(x)]) { e = ek[n(x)]; break; } }
  const preis = typeof u.price === 'number' ? u.price / 100 : null;
  const o = { angebot_id: u.id_unit, id_product: u.id_product || p.id_product, artikel: String(p.title || '').slice(0, 70), ean: eans[0] || '', eans: eans.map(n), preis_brutto: preis,
    mindestpreis: typeof u.minimum_price === 'number' ? u.minimum_price / 100 : null,
    listenpreis: typeof u.listing_price === 'number' ? u.listing_price / 100 : null,
    bestand: u.amount, live: u.is_live, versand: typeof u.shipping_rate === 'number' ? u.shipping_rate / 100 : null };
  if (e && preis != null) {
    const ekb = e.sum / e.st, ekn = ekb / 1.19, ausz = preis * 0.88 / 1.19, g = ausz - ekn;
    o.ek_brutto = r2(ekb); o.auszahlung_netto_geschaetzt = r2(ausz); o.gewinn_stueck = r2(g);
    o.marge_prozent = Math.round(g / ekn * 100);
    o.bewertung = g < 0 ? 'VERLUST' : g < 3 ? 'zu knapp' : o.marge_prozent < 10 ? 'knapp' : o.marge_prozent > 40 ? 'viel Luft, Marktpreis pruefen' : 'ok';
    o.preis_fuer_15_prozent_marge = r2(ekn * 1.15 * 1.19 / 0.88);
  } else o.bewertung = 'EK unbekannt';
  return o;
});
return [{ json: { anzahl: list.length, gesamt: (r.pagination && r.pagination.total) || list.length, hinweis: 'Kaufland-Gebuehr pauschal 12 % geschaetzt, EK aus neXus', angebote: list } }];

}

function marktAuswerten($, $input) {
const items = $input.all();
const base = $('Markt-URLs').all();
const r2 = x => Math.round(x * 100) / 100;
const out = items.map((it, i) => {
  const a = base[i] ? base[i].json : {};
  const units = ((it.json && it.json.data) || {}).units || [];
  const fremd = units.filter(u => u.id_unit !== a.angebot_id && (u.condition || 'NEW') === 'NEW');
  const preise = fremd.map(u => ((u.price || 0) + (u.shipping_rate || 0)) / 100).sort((x, y) => x - y);
  const min = preise.length ? preise[0] : null;
  const eigen = a.preis_brutto;
  const grenze = a.preis_fuer_15_prozent_marge || null;
  let empfehlung, vorschlag = null;
  if (min == null) { empfehlung = 'keine Konkurrenz auf Kaufland'; }
  else if (eigen > min + 0.01) {
    const ziel = r2(min - 0.1);
    if (grenze && ziel < grenze) { empfehlung = 'Konkurrenz billiger als deine 15-%-Grenze – halten oder anderswo verkaufen'; vorschlag = grenze; }
    else { empfehlung = 'zu teuer – senken'; vorschlag = ziel; }
  } else if (min > eigen * 1.05) { empfehlung = 'du bist günstigster – Luft nach oben'; vorschlag = r2(min - 0.1); }
  else { empfehlung = 'passt (günstigster)'; }
  return { artikel: a.artikel, preis: eigen, ek: a.ek_brutto ?? null, marge: a.marge_prozent ?? null, gewinn: a.gewinn_stueck ?? null, bestand: a.bestand,
    guenstigster_konkurrent: min, konkurrenten: preise.length, platz: min == null ? 1 : preise.filter(p => p < eigen).length + 1,
    verkaeufer_guenstigster: min == null ? null : ((fremd.find(u => ((u.price || 0) + (u.shipping_rate || 0)) / 100 === min) || {}).seller || {}).pseudonym || null,
    empfehlung, vorschlag };
});
const rang = e => /zu teuer/.test(e) ? 0 : /Grenze/.test(e) ? 1 : /Luft/.test(e) ? 2 : /keine/.test(e) ? 3 : 4;
out.sort((x, y) => rang(x.empfehlung) - rang(y.empfehlung));
return [{ json: { stand: new Date().toISOString(), hinweis: 'Konkurrenzpreise live von Kaufland (inkl. Versand), Gebuehr 12 % geschaetzt, EK aus neXus', anzahl: out.length, markt: out } }];
}

function verkaeufeKompakt($, $input) {
const tage = Number($('Prüf-Anfrage').first().json.body.tage || 60);
const grenze = Date.now() - tage * 86400000;
const list = $input.all().map(i => i.json).filter(o => o.order_unit_id).filter(o => !o.order_created_at || new Date(o.order_created_at).getTime() >= grenze).map(o => ({ plattform: o.marketplace || 'kaufland', bestellung: o.order_id, einheit: o.order_unit_id, artikel: o.product_title, ean: o.ean, preis_brutto: o.unit_price, status: o.status, datum: String(o.order_created_at || '').slice(0, 10) }));
return [{ json: { anzahl: list.length, verkaeufe: list } }];
}

return { dBelege, dashboardBauen, dashboardErgaenzen, lagerAnreichern, angeboteKompakt, marktAuswerten, verkaeufeKompakt };
})();
// Gemeinsam für Worker UND App: führt die übernommenen n8n-Code-Knoten aus.


// n8n-„Knoten“-Nachbildung für die übernommenen Code-Knoten
export
function knoten(daten) {
  const $ = name => {
    if (!(name in daten)) throw new Error('Knoten fehlt: ' + name);
    const list = [].concat(daten[name] ?? []);
    return { all: () => list.map(json => ({ json })), first: () => ({ json: list[0] ?? {} }), item: { json: list[0] ?? {} } };
  };
  const input = list => ({ all: () => [].concat(list ?? []).map(json => ({ json })), first: () => ({ json: [].concat(list ?? [])[0] ?? {} }) });
  const run = (fn, vorher) => { const r = fn($, input(vorher)) || []; return r.map(x => x.json); };
  return { run };
}

// Rechnet die Übersicht aus den Rohdaten (gleiche Funktion läuft auch in der App, damit der Worker kaum CPU braucht)
export function berechnen(roh) {
  roh = { ...roh };
  const k = knoten(roh);
  roh['D Belege'] = k.run(N.dBelege, roh['D Belege roh'] || []);
  const k2 = knoten(roh);
  const a = k2.run(N.dashboardBauen, roh['D Abschluss'] || []);
  const b = k2.run(N.dashboardErgaenzen, a);
  const c = k2.run(N.lagerAnreichern, b);
  const d = c[0] || {};
  d.quelle = 'backend';
  d.lexjahr = roh['L Jahr'] || null;
  return d;
}
