/* =============================================================
   Vermögen – persönliche Vermögensaufstellung (PWA)
   Alle Daten bleiben lokal auf dem Gerät (localStorage).
   ============================================================= */
'use strict';

const APP_VERSION = '1.0.0';
const STORE_KEY = 'vermoegen.v1';
const OPEN_KEY = 'vermoegen.open';

/* Kategorienfarben (geprüfte Palette) – [hell, auf dunklem Block] */
const PALETTE = [
  ['#2a78d6', '#3987e5'], ['#eb6834', '#e0703f'], ['#1baf7a', '#1fb883'], ['#eda100', '#f0aa14'],
  ['#e87ba4', '#e07aa2'], ['#008300', '#2e9e3a'], ['#4a3aa7', '#9085e9'], ['#e34948', '#e66767']
];
const onDark = hex => (PALETTE.find(p => p[0] === hex) || [hex, hex])[1];

const MONTHS = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const MSHORT = ['Jän', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

const ICON = {
  chevL: '<svg viewBox="0 0 24 24"><polyline points="15 5 8 12 15 19"/></svg>',
  chevR: '<svg viewBox="0 0 24 24"><polyline points="9 5 16 12 9 19"/></svg>',
  chev: '<svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24"><path d="M17.9 17.9A10.1 10.1 0 0 1 12 19c-7 0-11-7-11-7a18.5 18.5 0 0 1 5.1-5.9M9.9 5.2A9.1 9.1 0 0 1 12 5c7 0 11 7 11 7a18.5 18.5 0 0 1-2.2 3.2M14.1 14.1a3 3 0 1 1-4.2-4.2"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  close: '<svg viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>',
  grip: '<svg viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>',
  go: '<svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>',
  save: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  load: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  table: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="9" y1="4" x2="9" y2="20"/></svg>',
  flask: '<svg viewBox="0 0 24 24"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
  tree: '<svg viewBox="0 0 24 24"><line x1="9" y1="6" x2="21" y2="6"/><line x1="13" y1="12" x2="21" y2="12"/><line x1="13" y1="18" x2="21" y2="18"/><polyline points="4 4 4 18 9 18"/><line x1="4" y1="12" x2="9" y2="12"/></svg>'
};

/* ---------------- Hilfsfunktionen ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let uidCounter = 0;
const uid = () => 'n' + Date.now().toString(36) + (uidCounter++).toString(36) + Math.random().toString(36).slice(2, 6);

let HIDE = false; // Beträge verbergen (wird je Ansicht gesetzt)
const fmtInt = n => Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
function eur(n, sign = false) {
  if (n == null || Number.isNaN(n)) return '–';
  if (HIDE) return '••••• €';
  const r = Math.round(n);
  const s = r < 0 ? '−' : sign ? (r > 0 ? '+' : '±') : '';
  return s + fmtInt(r) + ' €';
}
function pct(n, sign = false) {
  if (n == null || !isFinite(n)) return '';
  const r = Math.round(n * 10) / 10;
  const s = r < 0 ? '−' : sign && r > 0 ? '+' : '';
  return s + Math.abs(r).toFixed(1).replace('.', ',') + ' %';
}
const cls = d => d == null ? 'zero' : Math.round(d) > 0 ? 'pos' : Math.round(d) < 0 ? 'neg' : 'zero';
function fmtInput(n) {
  if (n == null || n === '' || Number.isNaN(+n)) return '';
  const c = Math.round(Math.abs(+n) * 100);
  const int = Math.floor(c / 100), dec = c % 100;
  return (+n < 0 ? '-' : '') + fmtInt(int) + (dec ? ',' + String(dec).padStart(2, '0') : '');
}
function parseNum(s) {
  if (s == null) return null;
  s = String(s).trim().replace(/[\s€]/g, '').replace(/[−–]/g, '-');
  if (s === '') return null;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const v = Number(s);
  return isFinite(v) ? Math.round(v * 100) / 100 : NaN;
}
function fmtAxis(v, step) {
  const a = Math.abs(v);
  if (a >= 1e6) return (v / 1e6).toFixed(a % 1e6 === 0 ? 0 : 1).replace('.', ',') + ' Mio';
  if (a >= 1000) return (v / 1000).toFixed(a % 1000 === 0 ? 0 : 1).replace('.', ',') + 'k';
  return String(Math.round(v));
}
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------------- Monate ---------------- */
const keyOf = (y, m) => y + '-' + String(m).padStart(2, '0');
const parseKey = k => { const [y, m] = k.split('-').map(Number); return { y, m }; };
const curKey = () => { const d = new Date(); return keyOf(d.getFullYear(), d.getMonth() + 1); };
function addMonths(k, n) { let { y, m } = parseKey(k); m += n; while (m > 12) { m -= 12; y++; } while (m < 1) { m += 12; y--; } return keyOf(y, m); }
const monthDiff = (a, b) => { const A = parseKey(a), B = parseKey(b); return (B.y - A.y) * 12 + (B.m - A.m); };
const monthLabel = k => { const { y, m } = parseKey(k); return MONTHS[m - 1] + ' ' + y; };
const monthShort = k => { const { y, m } = parseKey(k); return MSHORT[m - 1] + ' ' + String(y).slice(2); };
function isForecastNow(k) {
  const { y, m } = parseKey(k);
  const last = new Date(y, m, 0); const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate()) < last;
}
const monthKeys = () => Object.keys(db.months).sort();
const prevKey = m => { let p = null; for (const k of monthKeys()) { if (k < m) p = k; else break; } return p; };
const nextKey = m => monthKeys().find(k => k > m) || null;
const titleOf = k => (db.months[k] && db.months[k].forecast ? 'Prognose ' : '') + monthLabel(k);
const titleHTML = (k, fc) => (fc ? '<small>Prognose</small>' : '') + monthLabel(k);
function colLabels(c, m) {
  if (!c) return ['–', MONTHS[parseKey(m).m - 1]];
  if (parseKey(c).y === parseKey(m).y) return [MONTHS[parseKey(c).m - 1], MONTHS[parseKey(m).m - 1]];
  return [monthShort(c), monthShort(m)];
}

/* ---------------- Daten ---------------- */
let db;
function defaultNodes() {
  const nodes = [];
  const add = (name, parent, extra = {}) => {
    const n = { id: uid(), name, parent, order: nodes.filter(x => x.parent === parent).length, archived: false, liability: false, ...extra };
    nodes.push(n); return n.id;
  };
  const cash = add('Cash', null, { color: PALETTE[0][0] });
  ['Gehaltskonto', 'Bargeld', 'Tagesgeld / Bundesschatzkonto', 'Verrechnungskonto Flatex'].forEach(n => add(n, cash));
  const etf = add('ETF-Depot', null, { color: PALETTE[1][0] }); add('ETF 1', etf);
  const im = add('Immobilie', null, { color: PALETTE[2][0] }); add('Grundstück', im); add('Kredit', im, { liability: true });
  const kr = add('Kryptowährungen', null, { color: PALETTE[3][0] });
  const bp = add('Bitpanda', kr); ['Bitcoin', 'Ethereum', 'Sonstige'].forEach(n => add(n, bp)); add('Metamask', kr);
  const p2p = add('P2P-Kredite', null, { color: PALETTE[4][0] }); add('Bondora Go & Grow', p2p); add('Mintos', p2p);
  const ab = add('Abfertigung neu', null, { color: PALETTE[5][0] }); add('Vorsorgekasse 1', ab); add('Vorsorgekasse 2', ab);
  const so = add('Sonstiges', null, { color: PALETTE[6][0] });
  ['PC', 'PS5', 'Lego', 'Livingpackets', 'Poker-Bankroll'].forEach(n => add(n, so));
  return nodes;
}
const freshDB = () => ({ v: 1, nodes: defaultNodes(), months: {}, settings: { hide: false, lastBackup: null } });
const validDB = d => d && Array.isArray(d.nodes) && d.months && typeof d.months === 'object' && d.nodes.every(n => n && n.id && typeof n.name === 'string');
function load() {
  try {
    const s = localStorage.getItem(STORE_KEY);
    if (s) { const d = JSON.parse(s); if (validDB(d)) { d.settings = d.settings || {}; return d; } }
  } catch (e) { /* ignorieren */ }
  return freshDB();
}
function persist() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); return true; }
  catch (e) { toast('Speichern fehlgeschlagen'); return false; }
}

/* Baum-Index & Werte */
const IDX = { map: new Map(), kids: new Map() };
let VC = new Map();
function reindex() {
  VC = new Map();
  IDX.map = new Map(db.nodes.map(n => [n.id, n]));
  IDX.kids = new Map();
  for (const n of db.nodes) {
    const k = n.parent || '';
    if (!IDX.kids.has(k)) IDX.kids.set(k, []);
    IDX.kids.get(k).push(n);
  }
  for (const a of IDX.kids.values()) a.sort((x, y) => x.order - y.order);
}
const kids = id => IDX.kids.get(id || '') || [];
const nodeDepth = n => { let d = 0; while (n && n.parent) { n = IDX.map.get(n.parent); d++; } return d; };
const nodeHeight = n => { const k = kids(n.id); return k.length ? 1 + Math.max(...k.map(nodeHeight)) : 0; };
const topOf = n => { while (n.parent && IDX.map.get(n.parent)) n = IDX.map.get(n.parent); return n; };
const colorOf = n => topOf(n).color || PALETTE[0][0];
const archivedDeep = n => { while (n) { if (n.archived) return true; n = n.parent ? IDX.map.get(n.parent) : null; } return false; };
const descendants = id => kids(id).flatMap(k => [k.id, ...descendants(k.id)]);

function val(id, m) {
  const key = id + '|' + m;
  if (VC.has(key)) return VC.get(key);
  const e = db.months[m]; let r = null;
  if (e) {
    const k = kids(id);
    if (k.length) {
      let s = 0, any = false;
      for (const c of k) { const v = val(c.id, m); if (v != null) { s += v; any = true; } }
      if (any) r = s;
    }
    if (r == null) {
      const raw = e.values[id];
      if (raw != null && raw !== '' && isFinite(raw)) { const n = IDX.map.get(id); r = n && n.liability ? -Math.abs(raw) : +raw; }
    }
  }
  VC.set(key, r); return r;
}
function total(m) {
  let s = 0, any = false;
  for (const n of kids(null)) { const v = val(n.id, m); if (v != null) { s += v; any = true; } }
  return any ? s : null;
}
const visibleIn = (n, m, c) => !archivedDeep(n) || val(n.id, m) != null || (c && val(n.id, c) != null);

/* ---------------- Zustand der Oberfläche ---------------- */
const ui = { view: '', month: null, open: new Set(), range: '1J', filter: 'all', entryDirty: false };
function saveOpen() { try { localStorage.setItem(OPEN_KEY, JSON.stringify([...ui.open])); } catch (e) { } }

/* ---------------- Router ---------------- */
function setTab(name) {
  $$('#tabbar a').forEach(a => a.classList.toggle('on', a.dataset.tab === name));
}
function route() {
  if (sheetOpen) removeSheet();
  const h = location.hash.replace(/^#\/?/, '');
  const [p, a] = h.split('/');
  reindex();
  document.body.classList.toggle('no-tabs', p === 'erfassen');
  ui.view = p || 'uebersicht';
  HIDE = !!db.settings.hide && p !== 'erfassen';
  setTab(ui.view);
  if (p === 'entwicklung') renderTrend();
  else if (p === 'erfassen') renderEntry(a);
  else if (p === 'einstellungen' && a === 'kategorien') renderCats();
  else if (p === 'einstellungen') renderSettings();
  else renderOverview();
  window.scrollTo(0, 0);
}
function go(hash, replace = true) {
  if (replace) { history.replaceState(null, '', hash); route(); }
  else location.hash = hash;
}

/* ---------------- Bottom-Sheet ---------------- */
let sheetOpen = false;
function openSheet(html) {
  const root = $('#sheet-root');
  if (!sheetOpen) {
    root.innerHTML = '<div class="backdrop"></div><div class="sheet"></div>';
    $('.backdrop', root).onclick = closeSheet;
    history.pushState({ sheet: 1 }, '');
    sheetOpen = true;
  }
  const sh = $('.sheet', root);
  sh.innerHTML = '<div class="grab"></div>' + html;
  sh.scrollTop = 0;
  return sh;
}
function removeSheet() { $('#sheet-root').innerHTML = ''; sheetOpen = false; }
function closeSheet() { if (sheetOpen) { removeSheet(); history.back(); } }
window.addEventListener('popstate', () => { if (sheetOpen) removeSheet(); });

/* =============================================================
   Seite: Vermögen (Übersicht)
   ============================================================= */
function defaultOverviewMonth() {
  const ks = monthKeys(); if (!ks.length) return null;
  const past = ks.filter(k => k <= curKey());
  return past.length ? past[past.length - 1] : ks[0];
}
function donutSVG(items, size) {
  const sw = 20, r = size / 2 - sw / 2 - 2, C = 2 * Math.PI * r, cx = size / 2;
  const sum = items.reduce((a, i) => a + i.v, 0);
  let s = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">`;
  if (sum <= 0) return s + `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="${sw}"/></svg>`;
  let off = 0;
  const gap = items.filter(i => i.v > 0).length > 1 ? 2.5 : 0;
  for (const i of items) {
    if (i.v <= 0) continue;
    const len = i.v / sum * C;
    s += `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${i.color}" stroke-width="${sw}" stroke-dasharray="${Math.max(len - gap, 0.01)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 ${cx} ${cx})"/>`;
    off += len;
  }
  return s + '</svg>';
}
function overviewRows(list, lvl, m, c) {
  return list.map(nd => {
    const k = kids(nd.id).filter(x => visibleIn(x, m, c));
    const has = k.length > 0, open = has && ui.open.has(nd.id);
    const vm = val(nd.id, m), vc = c ? val(nd.id, c) : null;
    const d = vm != null && vc != null ? vm - vc : null;
    return `<div class="trow l${lvl}${has ? ' kids' : ''}${open ? ' open' : ''}" data-id="${nd.id}" style="--rc:${colorOf(nd)}">
      <div class="c${vc == null ? ' none' : ''}">${c ? eur(vc) : ''}</div>
      <div class="m"><span class="chev">${has ? ICON.chev : ''}</span><span class="name">${esc(nd.name)}</span>
      <span class="amt${vm == null ? ' none' : ''}">${eur(vm)}${d != null && !HIDE ? `<small class="${cls(d)}">${eur(d, true)}</small>` : ''}</span></div></div>`
      + (open ? overviewRows(k, lvl + 1, m, c) : '');
  }).join('');
}
function renderOverview(anim) {
  const v = $('#view');
  if (!ui.month || !db.months[ui.month]) ui.month = defaultOverviewMonth();
  if (!ui.month) {
    v.innerHTML = `<div class="titlebar"><h1>Vermögen</h1></div>
      <div class="hero empty"><p>Noch keine Werte erfasst</p><a class="btn light" href="#/erfassen">Ersten Monat erfassen</a></div>`;
    return;
  }
  const m = ui.month, c = prevKey(m), n = nextKey(m);
  const t = total(m), tc = c ? total(c) : null;
  const d = t != null && tc != null ? t - tc : null;
  const tops = kids(null).filter(x => visibleIn(x, m, c));
  const items = tops.map(x => ({ name: x.name, v: Math.max(0, val(x.id, m) || 0), color: onDark(x.color || PALETTE[0][0]) }));
  const posSum = items.reduce((a, i) => a + i.v, 0);
  const [lc, lm] = colLabels(c, m);

  v.innerHTML = `
    <div class="titlebar">
      <button class="iconbtn" id="older" ${c ? '' : 'disabled'} aria-label="Früherer Monat">${ICON.chevL}</button>
      <h1>${titleHTML(m, db.months[m].forecast)}</h1>
      <button class="iconbtn" id="newer" ${n ? '' : 'disabled'} aria-label="Späterer Monat">${ICON.chevR}</button>
    </div>
    <div id="swipe" class="${anim || ''}">
      <section class="hero">
        <div class="hero-top">
          <div class="hero-total">${eur(t)}</div>
          <a class="iconbtn" href="#/erfassen/${m}" aria-label="Bearbeiten">${ICON.edit}</a>
          <button class="iconbtn" id="hide" aria-label="Beträge verbergen">${HIDE ? ICON.eyeOff : ICON.eye}</button>
        </div>
        ${d != null ? `<div class="pill"><span class="${d >= 0 ? 'up' : 'down'}">${eur(d, true)}</span>${tc ? `<span>${pct(d / Math.abs(tc) * 100, true)}</span>` : ''}</div>` : ''}
        <div class="alloc">
          ${donutSVG(items, 128)}
          <div class="legend">${items.map(i => `<div><i style="background:${i.color}"></i><span>${esc(i.name)}</span><b>${pct(posSum ? i.v / posSum * 100 : 0)}</b></div>`).join('')}</div>
        </div>
      </section>
      <section class="card tlist${c ? '' : ' nocmp'}">
        <div class="thead"><div class="c">${lc}</div><div class="m">${lm}</div></div>
        ${overviewRows(tops, 0, m, c)}
      </section>
    </div>`;

  $('#older').onclick = () => goMonth(-1);
  $('#newer').onclick = () => goMonth(1);
  $('#hide').onclick = () => { db.settings.hide = !db.settings.hide; persist(); HIDE = db.settings.hide; renderOverview(); };
  $$('.trow.kids', v).forEach(r => r.onclick = () => {
    const id = r.dataset.id;
    ui.open.has(id) ? ui.open.delete(id) : ui.open.add(id);
    saveOpen(); renderOverview();
  });
}
function goMonth(dir) {
  if (!ui.month) return;
  const k = dir < 0 ? prevKey(ui.month) : nextKey(ui.month);
  if (!k) return;
  ui.month = k;
  renderOverview(dir < 0 ? 'slide-l' : 'slide-r');
}
/* Wischen: nach rechts = früherer Monat, nach links = späterer Monat */
(function swipe() {
  let sx = 0, sy = 0, st = 0, active = false;
  const view = $('#view');
  view.addEventListener('touchstart', e => {
    active = ui.view === 'uebersicht' && e.touches.length === 1;
    if (!active) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now();
  }, { passive: true });
  view.addEventListener('touchend', e => {
    if (!active || ui.view !== 'uebersicht') return;
    const tch = e.changedTouches[0], dx = tch.clientX - sx, dy = tch.clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - st < 800) goMonth(dx > 0 ? -1 : 1);
  }, { passive: true });
})();

/* =============================================================
   Seite: Erfassen
   ============================================================= */
function entryRows(list, lvl, c, src) {
  return list.filter(n => !n.archived).map(nd => {
    const k = kids(nd.id).filter(x => !x.archived);
    const color = colorOf(nd), vc = c ? val(nd.id, c) : null;
    const cmp = `<div class="c${vc == null ? ' none' : ''}">${c ? eur(vc) : ''}</div>`;
    if (k.length) {
      return `<div class="trow l${lvl} open" style="--rc:${color}">${cmp}
        <div class="m"><span class="name">${esc(nd.name)}</span><span class="sum" data-sum="${nd.id}"></span></div></div>`
        + entryRows(k, lvl + 1, c, src);
    }
    const raw = src && db.months[src] ? db.months[src].values[nd.id] : null;
    const shown = raw == null ? '' : fmtInput(nd.liability ? Math.abs(raw) : raw);
    return `<div class="trow l${lvl} input" style="--rc:${color}">${cmp}
      <div class="m"><span class="name">${esc(nd.name)}</span>
      <span class="inp">${nd.liability ? '<span>−</span>' : ''}<input class="val" type="text" inputmode="decimal" enterkeyhint="next" autocomplete="off" data-id="${nd.id}" value="${shown}" aria-label="${esc(nd.name)}"></span></div></div>`;
  }).join('');
}
function defaultEntryKey() {
  // In den ersten Tagen eines Monats: noch offenen Vormonat vorschlagen
  const now = new Date(), prev = addMonths(curKey(), -1), e = db.months[prev];
  if (now.getDate() <= 10 && (!e || e.forecast)) return prev;
  return curKey();
}
function renderEntry(m) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(m || '')) m = defaultEntryKey();
  const v = $('#view');
  const e = db.months[m];
  const src = e ? m : prevKey(m);
  const c = prevKey(m);
  const tc = c ? total(c) : null;
  const [lc, lm] = colLabels(c, m);
  ui.entryDirty = false;

  v.innerHTML = `
    <div class="titlebar">
      <button class="iconbtn" id="close" aria-label="Schließen">${ICON.close}</button>
      <button class="iconbtn" id="mprev" aria-label="Voriger Monat">${ICON.chevL}</button>
      <h1>${titleHTML(m, isForecastNow(m))}</h1>
      <button class="iconbtn" id="mnext" aria-label="Nächster Monat">${ICON.chevR}</button>
      <span style="width:40px"></span>
    </div>
    <div class="sumbar"><b id="sumTotal">–</b><small id="sumDelta"></small></div>
    <section class="card tlist${c ? '' : ' nocmp'}">
      <div class="thead"><div class="c">${lc}</div><div class="m">${lm}</div></div>
      ${entryRows(kids(null), 0, c, src)}
    </section>
    ${e ? '<button class="linkdanger" id="del">Eintrag löschen</button>' : ''}
    <div class="savebar"><button class="btn" id="save">Speichern</button></div>`;

  const inputs = $$('input.val', v);
  const extra = () => { // Werte archivierter Positionen bleiben erhalten
    if (!e) return 0;
    let s = 0;
    for (const [id, raw] of Object.entries(e.values)) {
      const n = IDX.map.get(id);
      if (n && archivedDeep(n) && !kids(id).length) s += n.liability ? -Math.abs(raw) : +raw;
    }
    return s;
  };
  const extraSum = extra();
  function recalc() {
    const vals = new Map();
    inputs.forEach(i => {
      const x = parseNum(i.value);
      i.style.borderColor = Number.isNaN(x) ? 'var(--neg)' : '';
      const n = IDX.map.get(i.dataset.id);
      if (x != null && !Number.isNaN(x)) vals.set(n.id, n.liability ? -Math.abs(x) : x);
    });
    const sumOf = id => {
      const k = kids(id).filter(x => !x.archived);
      if (!k.length) return vals.has(id) ? vals.get(id) : null;
      let s = 0, any = false;
      k.forEach(x => { const y = sumOf(x.id); if (y != null) { s += y; any = true; } });
      return any ? s : null;
    };
    $$('[data-sum]', v).forEach(el => { el.textContent = eur(sumOf(el.dataset.sum)); });
    let t = extraSum, any = extraSum !== 0;
    kids(null).filter(x => !x.archived).forEach(x => { const y = sumOf(x.id); if (y != null) { t += y; any = true; } });
    $('#sumTotal').textContent = any ? eur(t) : '–';
    const dd = any && tc != null ? t - tc : null;
    $('#sumDelta').innerHTML = dd != null ? `${eur(dd, true)}${tc ? ' · ' + pct(dd / Math.abs(tc) * 100, true) : ''}` : '';
  }
  inputs.forEach((inp, i) => {
    inp.addEventListener('focus', () => setTimeout(() => inp.select(), 0));
    inp.addEventListener('input', () => { ui.entryDirty = true; recalc(); });
    inp.addEventListener('blur', () => { const x = parseNum(inp.value); if (x != null && !Number.isNaN(x)) inp.value = fmtInput(x); });
    inp.addEventListener('keydown', ev => {
      if (ev.key === 'Enter') { ev.preventDefault(); inputs[i + 1] ? inputs[i + 1].focus() : inp.blur(); }
    });
  });
  recalc();

  const leave = () => !ui.entryDirty || confirm('Änderungen verwerfen?');
  $('#close').onclick = () => { if (leave()) go('#/'); };
  $('#mprev').onclick = () => { if (leave()) go('#/erfassen/' + addMonths(m, -1)); };
  $('#mnext').onclick = () => { if (leave()) go('#/erfassen/' + addMonths(m, 1)); };
  if (e) $('#del').onclick = () => {
    if (!confirm(`${titleOf(m)} löschen?`)) return;
    delete db.months[m]; persist();
    if (ui.month === m) ui.month = null;
    toast('Eintrag gelöscht'); go('#/');
  };
  $('#save').onclick = () => {
    const values = {};
    if (e) for (const [id, raw] of Object.entries(e.values)) {
      const n = IDX.map.get(id);
      if (n && archivedDeep(n)) values[id] = raw;
    }
    for (const inp of inputs) {
      const x = parseNum(inp.value);
      if (Number.isNaN(x)) { toast('Ungültige Zahl'); inp.focus(); return; }
      if (x != null) { const n = IDX.map.get(inp.dataset.id); values[inp.dataset.id] = n.liability ? Math.abs(x) : x; }
    }
    if (!Object.keys(values).length) { toast('Bitte mindestens einen Wert eintragen'); return; }
    const fc = isForecastNow(m);
    db.months[m] = { forecast: fc, values, saved: new Date().toISOString() };
    if (!persist()) return;
    ui.month = m; ui.entryDirty = false;
    toast(fc ? 'Prognose gespeichert' : 'Gespeichert');
    go('#/');
  };
}

/* =============================================================
   Seite: Entwicklung
   ============================================================= */
function niceScale(min, max, count = 4) {
  if (min === max) { const p = Math.abs(min) * 0.1 || 1; min -= p; max += p; }
  const rough = (max - min) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const nrm = rough / mag;
  const step = (nrm <= 1 ? 1 : nrm <= 2 ? 2 : nrm <= 2.5 ? 2.5 : nrm <= 5 ? 5 : 10) * mag;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const ticks = []; for (let x = lo; x <= hi + step / 2; x += step) ticks.push(Math.round(x * 100) / 100);
  return { lo, hi, ticks, step };
}
const RANGES = { '6M': 6, '1J': 12, '3J': 36, 'Alles': Infinity };

function renderTrend() {
  const v = $('#view');
  tipHiders = [];
  const ks = monthKeys();
  if (!ks.length) {
    v.innerHTML = `<div class="titlebar"><h1 class="left">Entwicklung</h1></div>
      <div class="hero empty"><p>Noch keine Werte erfasst</p><a class="btn light" href="#/erfassen">Ersten Monat erfassen</a></div>`;
    return;
  }
  const finals = ks.filter(k => !db.months[k].forecast);
  const end = finals.length ? finals[finals.length - 1] : ks[ks.length - 1];
  const N = RANGES[ui.range];
  const start = isFinite(N) ? addMonths(end, -N) : ks[0];
  const keys = ks.filter(k => k >= start);

  const tops = kids(null).filter(x => !x.archived || keys.some(k => val(x.id, k) != null));
  if (ui.filter !== 'all' && !tops.some(x => x.id === ui.filter)) ui.filter = 'all';
  const sel = ui.filter === 'all' ? null : IDX.map.get(ui.filter);
  const get = k => sel ? val(sel.id, k) : total(k);
  const pts = keys.map(k => ({ k, v: get(k), fc: !!db.months[k].forecast })).filter(p => p.v != null);

  const fin = pts.filter(p => !p.fc);
  let change = '';
  if (fin.length >= 2) {
    const a = fin[0].v, b = fin[fin.length - 1].v;
    change = `<span class="${cls(b - a)}">${eur(b - a, true)}</span>${a ? ' · ' + pct((b - a) / Math.abs(a) * 100, true) : ''}`;
  }
  const stackNodes = (sel ? kids(sel.id) : tops).filter(x => !x.archived || keys.some(k => val(x.id, k) != null));
  const showStack = stackNodes.length >= 2 && pts.length >= 2;
  const hasFc = pts.some(p => p.fc);

  v.innerHTML = `
    <div class="titlebar"><h1 class="left">Entwicklung</h1></div>
    <div class="seg">${Object.keys(RANGES).map(r => `<button data-r="${r}" class="${r === ui.range ? 'on' : ''}">${r === '6M' ? '6 M' : r === '1J' ? '1 J' : r === '3J' ? '3 J' : r}</button>`).join('')}</div>
    <div class="chips">
      <button data-f="all" class="${!sel ? 'on' : ''}">Gesamt</button>
      ${tops.map(x => `<button data-f="${x.id}" class="${sel && sel.id === x.id ? 'on' : ''}"><i style="background:${x.color}"></i>${esc(x.name)}</button>`).join('')}
    </div>
    <section class="card pad">
      <h2>${sel ? esc(sel.name) : 'Nettovermögen'}<small>${change}</small></h2>
      <div class="chart" id="line"></div>
      ${hasFc ? '<div class="keys"><span><i class="solid"></i>Monatsende</span><span><i class="dash"></i>Prognose</span></div>' : ''}
    </section>
    ${showStack ? `<section class="card pad">
      <h2>Zusammensetzung</h2>
      <div class="chart" id="stack"></div>
      <div class="keys">${stackNodes.map(x => `<span><i style="background:${sel ? shade(colorOf(sel), stackNodes.indexOf(x), stackNodes.length) : x.color}"></i>${esc(x.name)}</span>`).join('')}</div>
    </section>` : ''}
    <section class="card">
      ${pts.slice().reverse().map((p, i, arr) => {
        const prev = arr[i + 1]; const dd = prev ? p.v - prev.v : null;
        return `<div class="mrow" data-k="${p.k}"><div class="lbl">${monthLabel(p.k)}${p.fc ? '<span class="tag">Prognose</span>' : ''}</div>
          <div class="amt">${eur(p.v)}${dd != null && !HIDE ? `<small class="${cls(dd)}">${eur(dd, true)}</small>` : ''}</div></div>`;
      }).join('')}
    </section>`;

  $$('.seg button', v).forEach(b => b.onclick = () => { ui.range = b.dataset.r; renderTrend(); });
  $$('.chips button', v).forEach(b => b.onclick = () => { ui.filter = b.dataset.f; const sx = $('.chips').scrollLeft; renderTrend(); $('.chips').scrollLeft = sx; });
  $$('.mrow', v).forEach(r => r.onclick = () => { ui.month = r.dataset.k; go('#/', false); });

  drawLine($('#line'), pts);
  if (showStack) {
    const series = stackNodes.map((x, i) => ({
      name: x.name,
      color: sel ? shade(colorOf(sel), i, stackNodes.length) : x.color,
      vals: pts.map(p => Math.max(0, val(x.id, p.k) || 0))
    }));
    drawStack($('#stack'), pts, series);
  }
}
/* Abstufungen einer Kategoriefarbe für Unterpositionen */
function shade(hex, i, n) {
  if (n <= 1) return hex;
  const t = i / (n - 1); // 0 … 1
  const mix = -0.35 + t * 0.8; // dunkler → heller
  const h = hex.replace('#', ''); const rgb = [0, 2, 4].map(o => parseInt(h.substr(o, 2), 16));
  const out = rgb.map(c => Math.round(mix < 0 ? c * (1 + mix) : c + (255 - c) * mix));
  return '#' + out.map(c => c.toString(16).padStart(2, '0')).join('');
}

function chartFrame(el, pts, H) {
  const W = Math.max(260, el.clientWidth);
  const pad = { l: HIDE ? 10 : 46, r: 12, t: 12, b: 28 };
  const span = Math.max(1, monthDiff(pts[0].k, pts[pts.length - 1].k));
  const X = k => pad.l + (pts.length === 1 ? (W - pad.l - pad.r) / 2 : monthDiff(pts[0].k, k) / span * (W - pad.l - pad.r));
  return { W, H, pad, X };
}
function xLabels(f, pts) {
  const maxL = Math.max(2, Math.floor((f.W - f.pad.l - f.pad.r) / 64));
  const stepI = Math.max(1, Math.ceil(pts.length / maxL));
  let s = '';
  const idx = [];
  for (let i = pts.length - 1; i >= 0; i -= stepI) idx.push(i);
  idx.forEach(i => {
    const x = f.X(pts[i].k);
    const anchor = x > f.W - 30 ? 'end' : x < f.pad.l + 20 && f.pad.l < 20 ? 'start' : 'middle';
    s += `<text x="${anchor === 'end' ? f.W - 2 : x}" y="${f.H - 8}" text-anchor="${anchor}">${monthShort(pts[i].k)}</text>`;
  });
  return s;
}
function yGrid(f, sc, Y) {
  return sc.ticks.map(t => `<line x1="${f.pad.l}" x2="${f.W - f.pad.r}" y1="${Y(t)}" y2="${Y(t)}" stroke="#EDEFF2"/>`
    + (HIDE ? '' : `<text x="${f.pad.l - 8}" y="${Y(t) + 4}" text-anchor="end">${fmtAxis(t, sc.step)}</text>`)).join('');
}
let tipHiders = [];
document.addEventListener('pointerdown', ev => tipHiders.forEach(fn => fn(ev)));
function attachTip(el, f, pts, render) {
  const tip = document.createElement('div'); tip.className = 'tip'; tip.style.display = 'none'; el.appendChild(tip);
  const cross = el.querySelector('.cross');
  const show = ev => {
    const r = el.getBoundingClientRect();
    const x = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
    let best = 0, bd = Infinity;
    pts.forEach((p, i) => { const d = Math.abs(f.X(p.k) - x); if (d < bd) { bd = d; best = i; } });
    const p = pts[best], px = f.X(p.k);
    cross.setAttribute('x1', px); cross.setAttribute('x2', px); cross.style.display = '';
    tip.innerHTML = render(best); tip.style.display = '';
    const tw = tip.offsetWidth;
    tip.style.left = Math.min(Math.max(0, px - tw / 2), r.width - tw) + 'px';
    const dot = el.querySelector('.hover-dot');
    if (dot && p.y != null) { dot.setAttribute('cx', px); dot.setAttribute('cy', p.y); dot.style.display = ''; }
  };
  const hide = () => { tip.style.display = 'none'; cross.style.display = 'none'; const dot = el.querySelector('.hover-dot'); if (dot) dot.style.display = 'none'; };
  el.addEventListener('pointerdown', show);
  el.addEventListener('pointermove', ev => { if (ev.pointerType === 'mouse' || ev.buttons) show(ev); });
  el.addEventListener('pointerleave', ev => { if (ev.pointerType === 'mouse') hide(); });
  tipHiders.push(ev => { if (!el.contains(ev.target)) hide(); });
}
function drawLine(el, pts) {
  if (!pts.length) { el.innerHTML = '<p style="color:var(--ink-3);padding:20px 0;text-align:center">Keine Werte im Zeitraum</p>'; return; }
  const f = chartFrame(el, pts, 210);
  const vals = pts.map(p => p.v);
  const sc = niceScale(Math.min(...vals), Math.max(...vals), 4);
  const Y = y => f.pad.t + (1 - (y - sc.lo) / (sc.hi - sc.lo)) * (f.H - f.pad.t - f.pad.b);
  pts.forEach(p => { p.x = f.X(p.k); p.y = Y(p.v); });
  let lastFin = -1; pts.forEach((p, i) => { if (!p.fc) lastFin = i; });
  const solid = lastFin >= 0 ? pts.slice(0, lastFin + 1) : [];
  const dashed = lastFin >= 0 ? pts.slice(lastFin) : pts;
  const P = a => a.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const base = f.H - f.pad.b;
  let s = `<svg width="${f.W}" height="${f.H}" viewBox="0 0 ${f.W} ${f.H}">
    <defs><linearGradient id="lgA" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#1E3A8A" stop-opacity=".16"/><stop offset="1" stop-color="#1E3A8A" stop-opacity="0"/></linearGradient></defs>
    ${yGrid(f, sc, Y)}`;
  if (solid.length > 1) s += `<polygon points="${solid[0].x},${base} ${P(solid)} ${solid[solid.length - 1].x},${base}" fill="url(#lgA)"/>
    <polyline points="${P(solid)}" fill="none" stroke="#1E3A8A" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
  if (dashed.length > 1) s += `<polyline points="${P(dashed)}" fill="none" stroke="#1E3A8A" stroke-width="2" stroke-dasharray="5 4" stroke-linejoin="round"/>`;
  pts.forEach((p, i) => {
    if (p.fc) s += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#fff" stroke="#1E3A8A" stroke-width="2"/>`;
    else if (i === lastFin || pts.length === 1) s += `<circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#1E3A8A" stroke="#fff" stroke-width="2"/>`;
  });
  s += xLabels(f, pts);
  s += `<line class="cross" y1="${f.pad.t}" y2="${base}" stroke="#94A3B8" stroke-width="1" style="display:none"/>
    <circle class="hover-dot" r="5" fill="#1E3A8A" stroke="#fff" stroke-width="2" style="display:none"/></svg>`;
  el.innerHTML = s;
  attachTip(el, f, pts, i => `<b>${eur(pts[i].v)}</b>${monthLabel(pts[i].k)}${pts[i].fc ? ' · Prognose' : ''}`);
}
function drawStack(el, pts, series) {
  const f = chartFrame(el, pts, 220);
  const tot = pts.map((_, i) => series.reduce((a, s) => a + s.vals[i], 0));
  const sc = niceScale(0, Math.max(...tot, 1), 4);
  const Y = y => f.pad.t + (1 - (y - sc.lo) / (sc.hi - sc.lo)) * (f.H - f.pad.t - f.pad.b);
  const base = f.H - f.pad.b;
  let s = `<svg width="${f.W}" height="${f.H}" viewBox="0 0 ${f.W} ${f.H}">${yGrid(f, sc, Y)}`;
  const acc = pts.map(() => 0);
  series.forEach(se => {
    const lo = acc.slice();
    se.vals.forEach((x, i) => acc[i] += x);
    const up = pts.map((p, i) => `${f.X(p.k).toFixed(1)},${Y(acc[i]).toFixed(1)}`);
    const dn = pts.map((p, i) => `${f.X(p.k).toFixed(1)},${Y(lo[i]).toFixed(1)}`).reverse();
    s += `<polygon points="${up.join(' ')} ${dn.join(' ')}" fill="${se.color}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>`;
  });
  let lastFin = -1; pts.forEach((p, i) => { if (!p.fc) lastFin = i; });
  if (lastFin >= 0 && lastFin < pts.length - 1) {
    const x0 = f.X(pts[lastFin].k);
    s += `<rect x="${x0}" y="${f.pad.t - 2}" width="${f.W - f.pad.r - x0 + 2}" height="${base - f.pad.t + 2}" fill="#fff" opacity=".55"/>
      <line x1="${x0}" x2="${x0}" y1="${f.pad.t}" y2="${base}" stroke="#1E3A8A" stroke-width="1.5" stroke-dasharray="4 3"/>`;
  }
  s += xLabels(f, pts) + `<line class="cross" y1="${f.pad.t}" y2="${base}" stroke="#0F172A" stroke-width="1" style="display:none"/></svg>`;
  el.innerHTML = s;
  attachTip(el, f, pts.map(p => ({ k: p.k })), i => `<b>${eur(tot[i])}</b>${monthLabel(pts[i].k)}${pts[i].fc ? ' · Prognose' : ''}`
    + series.slice().reverse().map(se => `<div><i style="background:${se.color}"></i><span>${esc(se.name)}</span>${eur(se.vals[i])}</div>`).join(''));
}
let resizeT;
window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { if (ui.view === 'entwicklung') renderTrend(); }, 200); });

/* =============================================================
   Seite: Einstellungen
   ============================================================= */
function renderSettings() {
  const v = $('#view');
  const cnt = db.nodes.filter(n => !n.parent && !n.archived).length;
  const lb = db.settings.lastBackup ? new Date(db.settings.lastBackup).toLocaleDateString('de-AT') : 'noch nie';
  v.innerHTML = `
    <div class="titlebar"><h1 class="left">Einstellungen</h1></div>
    <section class="card">
      <a class="item" href="#/einstellungen/kategorien">${ICON.tree}<span class="grow">Kategorien</span><span class="sub">${cnt}</span>${ICON.go}</a>
    </section>
    <div class="group-title">Datensicherung</div>
    <section class="card">
      <button class="item" id="bk">${ICON.save}<span class="grow">Backup speichern</span><span class="sub">${lb}</span></button>
      <button class="item" id="rs">${ICON.load}<span class="grow">Backup laden</span></button>
      <button class="item" id="csv">${ICON.table}<span class="grow">Export für Excel</span></button>
    </section>
    <div class="group-title">Daten</div>
    <section class="card">
      <button class="item" id="demo">${ICON.flask}<span class="grow">Testdaten laden</span></button>
      <button class="item danger" id="wipe">${ICON.trash}<span class="grow">Alle Daten löschen</span></button>
    </section>
    <input type="file" id="file" accept=".json,application/json" hidden>
    <p class="version">Vermögen · Version ${APP_VERSION}</p>`;

  $('#bk').onclick = () => {
    const d = new Date();
    db.settings.lastBackup = d.toISOString(); persist();
    download(`vermoegen-backup-${d.toISOString().slice(0, 10)}.json`, JSON.stringify(db, null, 1), 'application/json');
    toast('Backup gespeichert'); renderSettings();
  };
  $('#rs').onclick = () => $('#file').click();
  $('#file').onchange = ev => {
    const file = ev.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (!validDB(d)) throw new Error('format');
        const n = Object.keys(d.months).length;
        if (!confirm(`Backup mit ${n} Monaten laden? Die aktuellen Daten werden ersetzt.`)) return;
        d.settings = d.settings || {}; db = d; persist(); reindex(); ui.month = null;
        toast('Backup geladen'); renderSettings();
      } catch (e) { toast('Datei ist kein gültiges Backup'); }
    };
    r.readAsText(file);
    ev.target.value = '';
  };
  $('#csv').onclick = exportCSV;
  $('#demo').onclick = () => {
    if (!confirm('Testdaten laden? Alle bisherigen Werte und Kategorien werden ersetzt.')) return;
    db = demoDB(); persist(); reindex(); ui.month = null; ui.open.clear(); saveOpen();
    toast('Testdaten geladen');
    go('#/', false);
  };
  $('#wipe').onclick = () => {
    if (!confirm('Wirklich alle Daten löschen? Das kann nicht rückgängig gemacht werden.')) return;
    db = freshDB(); persist(); reindex(); ui.month = null; ui.open.clear(); saveOpen();
    toast('Alle Daten gelöscht'); renderSettings();
  };
}
function download(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
}
function exportCSV() {
  reindex();
  const ks = monthKeys();
  const q = s => /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  const num = x => x == null ? '' : (Math.round(x * 100) / 100).toFixed(2).replace('.', ',');
  const lines = [['Kategorie', ...ks.map(k => monthLabel(k) + (db.months[k].forecast ? ' (Prognose)' : ''))].map(q).join(';')];
  const walk = (list, lvl) => list.forEach(n => {
    lines.push([q('   '.repeat(lvl) + n.name), ...ks.map(k => num(val(n.id, k)))].join(';'));
    walk(kids(n.id), lvl + 1);
  });
  walk(kids(null), 0);
  lines.push(['Gesamtvermögen', ...ks.map(k => num(total(k)))].join(';'));
  download(`vermoegen-${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + lines.join('\r\n'), 'text/csv;charset=utf-8');
  toast('Export erstellt');
}
function demoDB() {
  const d = freshDB();
  const byName = {}; d.nodes.forEach(n => { byName[n.name + (n.parent ? '' : '#top')] = n; });
  const leaf = name => d.nodes.find(n => n.name === name && !d.nodes.some(c => c.parent === n.id));
  const N = 24, last = addMonths(curKey(), -1);
  const wave = (i, a, ph = 0) => 1 + a * Math.sin(i * 0.9 + ph);
  const gen = {
    'Gehaltskonto': i => 1900 + 700 * Math.abs(Math.sin(i * 1.3)),
    'Bargeld': i => 180 + 120 * Math.abs(Math.sin(i * 2.1)),
    'Tagesgeld / Bundesschatzkonto': i => 8500 + 250 * i,
    'Verrechnungskonto Flatex': i => 400 + 40 * (i % 6),
    'ETF 1': i => (24000 + 700 * i) * wave(i, 0.035, 1),
    'Grundstück': () => 145000,
    'Kredit': i => 93000 - 380 * i,
    'Bitcoin': i => (3800 + 120 * i) * wave(i, 0.18, 2),
    'Ethereum': i => (1500 + 30 * i) * wave(i, 0.22, 3),
    'Sonstige': i => 450 * wave(i, 0.25, 4),
    'Metamask': i => (1200 + 15 * i) * wave(i, 0.22, 3),
    'Bondora Go & Grow': i => 1800 + 40 * i,
    'Mintos': i => Math.max(500, 1500 - 45 * i),
    'Vorsorgekasse 1': i => 4300 + 45 * i,
    'Vorsorgekasse 2': i => 1900 + 18 * i,
    'PC': () => 900, 'PS5': () => 350, 'Lego': i => 900 + 12 * i, 'Livingpackets': () => 800,
    'Poker-Bankroll': i => 700 * wave(i, 0.15, 5)
  };
  const mk = (k, i, fc) => {
    const values = {};
    for (const [name, fn] of Object.entries(gen)) { const n = leaf(name); if (n) values[n.id] = Math.round(fn(i) * 100) / 100; }
    d.months[k] = { forecast: fc, values, saved: new Date().toISOString() };
  };
  for (let i = 0; i < N; i++) mk(addMonths(last, -(N - 1 - i)), i, false);
  mk(curKey(), N, true); mk(addMonths(curKey(), 1), N + 1, true);
  return d;
}

/* ---------------- Kategorien verwalten ---------------- */
function nextColor() {
  const used = new Set(db.nodes.filter(n => !n.parent && !n.archived).map(n => n.color));
  const free = PALETTE.find(p => !used.has(p[0]));
  return free ? free[0] : PALETTE[db.nodes.filter(n => !n.parent).length % PALETTE.length][0];
}
function treeHTML(list, lvl) {
  return `<div class="${lvl ? 'tkids' : 'tree'}">` + list.map(n => `
    <div class="tnode${n.archived ? ' arch' : ''}" data-id="${n.id}">
      <div class="ncrow">
        <span class="handle" aria-label="Ziehen zum Sortieren">${ICON.grip}</span>
        ${lvl === 0 ? `<span class="strip" style="background:${n.color}"></span>` : ''}
        <button class="nm l${lvl}" data-edit="${n.id}">${esc(n.name)}</button>
        ${n.liability ? '<span class="badge">Schuld</span>' : ''}
        ${n.archived ? '<span class="badge">Archiviert</span>' : ''}
        <button class="edit" data-edit="${n.id}" aria-label="Bearbeiten">${ICON.edit}</button>
      </div>
      ${kids(n.id).length ? treeHTML(kids(n.id), lvl + 1) : ''}
    </div>`).join('') + '</div>';
}
function renderCats() {
  const v = $('#view');
  v.innerHTML = `
    <div class="titlebar">
      <button class="iconbtn" id="back" aria-label="Zurück">${ICON.chevL}</button>
      <h1 class="left">Kategorien</h1>
    </div>
    <section class="card">${treeHTML(kids(null), 0)}</section>
    <button class="btn ghost block" id="addTop">+ Kategorie hinzufügen</button>`;
  $('#back').onclick = () => go('#/einstellungen');
  $('#addTop').onclick = () => editNode(null, null);
  $$('[data-edit]', v).forEach(b => b.onclick = () => editNode(b.dataset.edit));
  $$('.handle', v).forEach(h => h.addEventListener('pointerdown', startDrag));
}
function startDrag(ev) {
  ev.preventDefault();
  const handle = ev.currentTarget;
  const block = handle.closest('.tnode');
  const sibs = [...block.parentElement.children].filter(x => x.classList.contains('tnode'));
  if (sibs.length < 2) return;
  const idx = sibs.indexOf(block);
  const rects = sibs.map(s => s.getBoundingClientRect());
  const h = rects[idx].height;
  const startY = ev.clientY;
  let target = idx;
  handle.setPointerCapture(ev.pointerId);
  block.classList.add('dragging');
  sibs.forEach(s => { if (s !== block) s.classList.add('shift'); });
  const move = e => {
    const dy = e.clientY - startY;
    block.style.transform = `translateY(${dy}px)`;
    const center = rects[idx].top + h / 2 + dy;
    target = idx;
    sibs.forEach((s, i) => {
      const mid = rects[i].top + rects[i].height / 2;
      if (i < idx && center < mid) target = Math.min(target, i);
      if (i > idx && center > mid) target = Math.max(target, i);
    });
    sibs.forEach((s, i) => {
      if (s === block) return;
      let shift = 0;
      if (idx < target && i > idx && i <= target) shift = -h;
      if (idx > target && i < idx && i >= target) shift = h;
      s.style.transform = shift ? `translateY(${shift}px)` : '';
    });
  };
  const up = () => {
    handle.removeEventListener('pointermove', move);
    handle.removeEventListener('pointerup', up);
    handle.removeEventListener('pointercancel', up);
    const ids = sibs.map(s => s.dataset.id);
    const [moved] = ids.splice(idx, 1); ids.splice(target, 0, moved);
    ids.forEach((id, i) => { IDX.map.get(id).order = i; });
    if (target !== idx) persist();
    reindex(); renderCats();
  };
  handle.addEventListener('pointermove', move);
  handle.addEventListener('pointerup', up);
  handle.addEventListener('pointercancel', up);
}
function editNode(id, parentForNew) {
  reindex();
  const isNew = !id;
  const orig = isNew ? null : IDX.map.get(id);
  if (!isNew && !orig) return;
  const n = isNew
    ? { id: uid(), name: '', parent: parentForNew || null, order: kids(parentForNew).length, archived: false, liability: false }
    : { ...orig };
  const hasKids = !isNew && kids(id).length > 0;
  const blocked = new Set(isNew ? [] : [id, ...descendants(id)]);
  const h = isNew ? 0 : nodeHeight(orig);
  const parents = [];
  const walk = (list, lvl) => list.forEach(p => {
    if (blocked.has(p.id)) return;
    if (lvl + 1 + h <= 2) parents.push({ id: p.id, label: '    '.repeat(lvl) + p.name });
    walk(kids(p.id), lvl + 1);
  });
  walk(kids(null), 0);
  let color = n.color || nextColor();
  const depthNow = () => { const p = sheet.querySelector('#fParent').value; return p ? nodeDepth(IDX.map.get(p)) + 1 : 0; };

  const sheet = openSheet(`
    <h3>${isNew ? (n.parent ? 'Neue Unterposition' : 'Neue Kategorie') : 'Bearbeiten'}</h3>
    <div class="field"><label for="fName">Name</label><input type="text" id="fName" value="${esc(n.name)}" autocomplete="off"></div>
    <div class="field"><label for="fParent">Gehört zu</label>
      <select id="fParent"><option value="">— Hauptkategorie —</option>${parents.map(p => `<option value="${p.id}" ${p.id === n.parent ? 'selected' : ''}>${esc(p.label)}</option>`).join('')}</select></div>
    <div class="field" id="fColorWrap"><label>Farbe</label>
      <div class="swatches">${PALETTE.map(p => `<button type="button" data-c="${p[0]}" style="background:${p[0]}" class="${p[0] === color ? 'on' : ''}" aria-label="Farbe"></button>`).join('')}</div></div>
    ${hasKids ? '' : `<label class="switch"><span>Wird abgezogen (Schuld)</span><input type="checkbox" id="fLiab" ${n.liability ? 'checked' : ''}></label>`}
    <div class="sheet-actions">
      <div class="row2"><button class="btn ghost" id="fCancel">Abbrechen</button><button class="btn" id="fSave">Speichern</button></div>
      ${!isNew && nodeDepth(orig) < 2 ? '<button class="btn ghost" id="fSub">+ Unterposition hinzufügen</button>' : ''}
      ${!isNew ? `<div class="row2"><button class="btn ghost" id="fArch">${orig.archived ? 'Reaktivieren' : 'Archivieren'}</button><button class="btn danger" id="fDel">Löschen</button></div>` : ''}
    </div>`);

  const syncColor = () => { $('#fColorWrap', sheet).style.display = depthNow() === 0 ? '' : 'none'; };
  syncColor();
  $('#fParent', sheet).onchange = syncColor;
  $$('.swatches button', sheet).forEach(b => b.onclick = () => {
    color = b.dataset.c; $$('.swatches button', sheet).forEach(x => x.classList.toggle('on', x === b));
  });
  if (isNew) setTimeout(() => $('#fName', sheet).focus(), 250);
  $('#fCancel', sheet).onclick = closeSheet;
  $('#fSave', sheet).onclick = () => {
    const name = $('#fName', sheet).value.trim();
    if (!name) { toast('Bitte einen Namen eingeben'); $('#fName', sheet).focus(); return; }
    const parent = $('#fParent', sheet).value || null;
    const target = isNew ? n : IDX.map.get(id);
    if (isNew) db.nodes.push(target);
    if (target.parent !== parent || isNew) { target.parent = parent; target.order = kids(parent).filter(x => x.id !== target.id).length; }
    target.name = name;
    if (!parent) target.color = color; else delete target.color;
    const lb = $('#fLiab', sheet); if (lb) target.liability = lb.checked;
    persist(); reindex(); closeSheet(); renderCats();
    toast('Gespeichert');
  };
  const sub = $('#fSub', sheet);
  if (sub) sub.onclick = () => editNode(null, id);
  const arch = $('#fArch', sheet);
  if (arch) arch.onclick = () => {
    orig.archived = !orig.archived; persist(); reindex(); closeSheet(); renderCats();
    toast(orig.archived ? 'Archiviert' : 'Reaktiviert');
  };
  const del = $('#fDel', sheet);
  if (del) del.onclick = () => {
    const ids = [id, ...descendants(id)];
    const usedIn = Object.values(db.months).filter(e => ids.some(x => e.values[x] != null)).length;
    const msg = usedIn
      ? `„${orig.name}“ löschen? Die Werte aus ${usedIn} ${usedIn === 1 ? 'Monat' : 'Monaten'} gehen verloren. Archivieren behält den Verlauf.`
      : `„${orig.name}“ löschen?`;
    if (!confirm(msg)) return;
    db.nodes = db.nodes.filter(x => !ids.includes(x.id));
    for (const [k, e] of Object.entries(db.months)) {
      ids.forEach(x => delete e.values[x]);
      if (!Object.keys(e.values).length) delete db.months[k];
    }
    ids.forEach(x => ui.open.delete(x)); saveOpen();
    persist(); reindex(); closeSheet(); renderCats();
    toast('Gelöscht');
  };
}

/* =============================================================
   Start
   ============================================================= */
db = load();
try { ui.open = new Set(JSON.parse(localStorage.getItem(OPEN_KEY) || '[]')); } catch (e) { }
reindex();
window.addEventListener('hashchange', route);
route();

if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').catch(() => { });
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded) return;
    reloaded = true; location.reload();
  });
}
