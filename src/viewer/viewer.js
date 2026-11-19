/**
 * Atlas viewer — the page a person walks (2026-09-26).
 *
 * Public-surface rules apply here (docs/PUBLIC_LANGUAGE.md): the page describes behaviour, never representation.
 * The data it receives is behaviour-level (positions, topics, links, related notes with a confidence), so nothing
 * about how the map was computed reaches the page.
 *
 * Identity, derived from the subject: the page is an engineer's computation pad marked up by an editor. Graphite is
 * what was recorded, the red pencil is a correction in force, the blue pencil is a suggestion (related, not linked).
 * Palette checked with the dataviz validator (--pairs all), both modes, 2026-09-26: light red #b3261e and blue
 * #1c5fa8 on #eef3ee; dark red #ec5a4d and blue #4f93e0 on #111814.
 *
 * Both strings are raw: no backticks and no template placeholders inside them.
 */
import { EXPLORE_JS } from './explore.bundle.js';
import { EXPLORE_CSS, EXPLORE_UI } from './explore-ui.js';

export const VIEWER_CSS = EXPLORE_CSS + String.raw`
:root{color-scheme:light;
--paper:#eef3ee;--panel:#e5ece6;--raise:#f7faf7;--grid:#dde7df;--grid-major:#c8d8cc;
--ink:#1d2721;--ink-2:#3f4d44;--ink-3:#566459;--rule:rgba(29,39,33,.14);--rule-strong:rgba(29,39,33,.32);
--red:#b3261e;--blue:#1c5fa8;--red-wash:rgba(179,38,30,.09);--blue-wash:rgba(28,95,168,.10);
--shadow:0 8px 24px rgba(20,34,26,.14),0 1px 3px rgba(20,34,26,.10)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;
--paper:#111814;--panel:#161f19;--raise:#1c261f;--grid:#18221b;--grid-major:#223026;
--ink:#dde7e0;--ink-2:#b0bfb5;--ink-3:#91a197;--rule:rgba(221,231,224,.12);--rule-strong:rgba(221,231,224,.28);
--red:#ec5a4d;--blue:#4f93e0;--red-wash:rgba(236,90,77,.12);--blue-wash:rgba(79,147,224,.13);
--shadow:0 8px 24px rgba(0,0,0,.45),0 1px 3px rgba(0,0,0,.4)}}
:root[data-theme="dark"]{color-scheme:dark;
--paper:#111814;--panel:#161f19;--raise:#1c261f;--grid:#18221b;--grid-major:#223026;
--ink:#dde7e0;--ink-2:#b0bfb5;--ink-3:#91a197;--rule:rgba(221,231,224,.12);--rule-strong:rgba(221,231,224,.28);
--red:#ec5a4d;--blue:#4f93e0;--red-wash:rgba(236,90,77,.12);--blue-wash:rgba(79,147,224,.13);
--shadow:0 8px 24px rgba(0,0,0,.45),0 1px 3px rgba(0,0,0,.4)}
*{box-sizing:border-box}
html,body{height:100%}
body{margin:0;background:var(--paper);color:var(--ink);font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
-webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums;overflow:hidden;
display:grid;grid-template-columns:288px minmax(0,1fr) 380px;grid-template-rows:56px minmax(0,1fr) 84px;
grid-template-areas:"bar bar bar" "rail stage panel" "rail time panel"}
::selection{background:var(--blue-wash);color:var(--ink)}
input,button{font:inherit;color:inherit;caret-color:var(--blue);accent-color:var(--blue)}
button{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
*{scrollbar-color:var(--rule-strong) transparent;scrollbar-width:thin}
:focus-visible{outline:2px solid var(--blue);outline-offset:2px;border-radius:4px}
code,kbd,.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12.5px}
kbd{border:1px solid var(--rule-strong);border-radius:4px;padding:0 5px;background:var(--raise)}
.bar{grid-area:bar;display:flex;align-items:center;gap:20px;padding:0 16px;border-bottom:1px solid var(--rule);background:var(--paper);min-width:0}
.bar h1{font-size:16px;font-weight:650;margin:0;letter-spacing:-.01em;white-space:nowrap}
.bar .count{color:var(--ink-3);font-size:13px;white-space:nowrap}
.seg{display:inline-flex;border:1px solid var(--rule-strong);border-radius:8px;overflow:hidden}
.seg button{border:0;background:transparent;padding:6px 14px;font-size:13px;cursor:pointer;color:var(--ink-2);transition:background 120ms ease-out,color 120ms ease-out}
.seg button+button{border-left:1px solid var(--rule)}
.seg button:hover{background:var(--raise);color:var(--ink)}
.seg button[aria-pressed="true"]{background:var(--ink);color:var(--paper)}
.integrity{margin-left:auto;font-size:12.5px;color:var(--ink-3);display:flex;gap:14px;align-items:center;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.integrity .bad{color:var(--red);font-weight:600}
.iconbtn{border:1px solid var(--rule-strong);background:transparent;border-radius:8px;width:34px;height:34px;display:inline-grid;place-items:center;cursor:pointer;flex:none;transition:background 120ms ease-out}
.iconbtn:hover{background:var(--raise)}
.iconbtn svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.narrow-only{display:none}
.rail{grid-area:rail;border-right:1px solid var(--rule);overflow:auto;padding:14px 14px 24px;background:var(--panel)}
.rail label.find{display:block;font-size:13px;font-weight:600;margin:0 0 6px}
.rail input[type=search]{width:100%;padding:8px 10px;border:1px solid var(--rule-strong);border-radius:8px;background:var(--raise);font-size:16px}
.rail input[type=search]::placeholder{color:var(--ink-3)}
.results{list-style:none;margin:6px 0 0;padding:0}
.results:empty{display:none}
.hint{color:var(--ink-3);font-size:12.5px;margin:6px 2px 0}
.item{display:block;width:100%;text-align:left;border:0;background:transparent;padding:7px 8px;border-radius:6px;cursor:pointer;transition:background 120ms ease-out}
.item:hover,.item[aria-selected="true"]{background:var(--raise)}
.item .t{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:13px;line-height:1.35;overflow-wrap:anywhere}
.item .m{display:flex;gap:8px;flex-wrap:wrap;color:var(--ink-3);font-size:12px;margin-top:2px}
.item .m .red{color:var(--red)}
.item .m .blue{color:var(--blue)}
details{border-top:1px solid var(--rule);margin-top:14px;padding-top:10px}
summary{cursor:pointer;font-size:13px;font-weight:600;list-style:none;display:flex;justify-content:space-between;align-items:baseline;padding:2px}
summary::-webkit-details-marker{display:none}
summary .n{color:var(--ink-3);font-weight:500}
details ol,details ul{list-style:none;margin:6px 0 0;padding:0}
.layers{display:flex;flex-direction:column;gap:6px;margin-top:8px}
.layers label{display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer}
.layers svg{width:26px;height:12px;flex:none}
.stage{grid-area:stage;position:relative;min-width:0;min-height:0;overflow:hidden}
#cv{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab}
#cv.dragging{cursor:grabbing}
#cv.onnode{cursor:pointer}
#cv3{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab}
#cv3[hidden],.labels3[hidden]{display:none}
.labels3{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:1}
.l3{position:absolute;left:0;top:0;white-space:nowrap;font-size:12px;color:var(--ink-2);text-align:center;opacity:0;transition:opacity 150ms ease-out;
text-shadow:0 0 2px var(--paper),0 0 5px var(--paper),0 0 9px var(--paper);will-change:transform}
.l3.lobe b{display:block;font-size:14px;font-weight:650;color:var(--ink)}
.l3.lobe span{font-size:12px;color:var(--ink-3)}
.l3.topic{font-weight:600}
.l3.focus{font-size:13px;color:var(--ink);margin-top:-22px}
.tip{position:absolute;pointer-events:none;max-width:340px;background:var(--raise);border:1px solid var(--rule);border-radius:8px;
box-shadow:var(--shadow);padding:8px 10px;font-size:13px;line-height:1.35;opacity:0;transform:translateY(2px);transition:opacity 100ms ease-out,transform 100ms ease-out;z-index:3}
.tip.on{opacity:1;transform:none}
.tip .t{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
.tip .m{display:flex;gap:8px;flex-wrap:wrap;color:var(--ink-3);font-size:12px;margin-top:4px}
.tip .m .red{color:var(--red)}
.legend{position:absolute;left:12px;bottom:12px;background:var(--raise);border:1px solid var(--rule);border-radius:8px;padding:8px 10px;
font-size:12px;color:var(--ink-2);display:grid;grid-template-columns:auto auto;gap:4px 8px;align-items:center;z-index:2}
.legend svg{width:22px;height:12px}
.zoom{position:absolute;right:12px;bottom:12px;display:flex;flex-direction:column;gap:6px;z-index:2}
.zoom .iconbtn{background:var(--raise)}
.localbar{position:absolute;left:50%;top:12px;transform:translateX(-50%);background:var(--raise);border:1px solid var(--rule);border-radius:8px;
padding:6px 8px 6px 12px;font-size:13px;display:none;align-items:center;gap:10px;box-shadow:var(--shadow);z-index:2;max-width:calc(100% - 24px)}
.localbar.on{display:flex}
.growbar{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);background:var(--raise);border:1px solid var(--rule);border-radius:8px;
padding:6px 8px 6px 14px;font-size:13px;display:none;align-items:center;gap:12px;box-shadow:var(--shadow);z-index:2;max-width:calc(100% - 24px)}
.growbar.on{display:flex}
.growbar span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
.iconbtn[aria-pressed="true"]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.meta .src{color:var(--ink);font-weight:600}
.localbar span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.btn{border:1px solid var(--rule-strong);background:var(--raise);border-radius:8px;padding:6px 12px;font-size:13px;cursor:pointer;transition:background 120ms ease-out;display:inline-flex;align-items:center;gap:6px}
.btn:hover{background:var(--paper)}
.listview{position:absolute;inset:0;overflow:auto;display:none;padding:0 0 24px}
.listview.on{display:block}
table{border-collapse:collapse;width:100%;font-size:13px}
th,td{text-align:left;padding:8px 12px;border-bottom:1px solid var(--rule);vertical-align:top}
th{position:sticky;top:0;background:var(--paper);font-weight:600;color:var(--ink-2);cursor:pointer;white-space:nowrap;user-select:none}
th[aria-sort] .dir{color:var(--blue)}
td.title{min-width:320px;max-width:560px;overflow-wrap:anywhere}
td.topic{max-width:190px;color:var(--ink-2)}
td.num{text-align:right;width:1%}
tbody tr{cursor:pointer;transition:background 120ms ease-out}
tbody tr:hover,tbody tr[aria-selected="true"]{background:var(--raise)}
td .red{color:var(--red)}
.time{grid-area:time;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:14px;padding:10px 16px;border-top:1px solid var(--rule);background:var(--paper)}
.scrub{position:relative;height:56px}
#spark{position:absolute;left:0;right:0;top:0;height:36px;width:100%}
#when{position:absolute;left:0;right:0;bottom:0;width:100%;margin:0}
.time output{font-size:13px;color:var(--ink-2);min-width:220px;text-align:right}
.panel{grid-area:panel;border-left:1px solid var(--rule);overflow:auto;background:var(--panel);padding:16px 18px 32px}
.panel h2{font-size:18px;line-height:1.3;margin:0 0 8px;font-weight:650;letter-spacing:-.01em;overflow-wrap:anywhere}
.panel h3{font-size:13px;font-weight:650;margin:20px 0 6px}
.panel .sub{color:var(--ink-2);font-size:13px;margin:0 0 8px}
.meta{display:flex;flex-wrap:wrap;gap:6px 12px;color:var(--ink-3);font-size:12.5px;margin-bottom:10px}
.meta button{border:0;background:none;padding:0;color:var(--blue);cursor:pointer;font-size:12.5px;text-decoration:underline;text-underline-offset:2px}
.kind{color:var(--ink-2);font-weight:600}
.kind.correction{color:var(--red)}
.ce{display:grid;grid-template-columns:auto minmax(0,1fr);gap:4px 10px;font-size:13px;background:var(--raise);border:1px solid var(--rule);border-radius:8px;padding:10px 12px;margin:10px 0}
.ce dt{color:var(--ink-3)}
.ce dd{margin:0;overflow-wrap:anywhere}
.box{border:1px solid var(--rule);border-radius:8px;padding:10px 12px;margin:10px 0;font-size:13px;background:var(--raise)}
.box.red{background:var(--red-wash);border-color:transparent}
.box .h{font-weight:650;margin-bottom:4px}
.box.red .h{color:var(--red)}
s.w{color:var(--red);text-decoration-thickness:1.5px}
.body{font-size:13.5px;line-height:1.6;overflow-wrap:anywhere;max-width:68ch}
.body p{margin:0 0 10px}
.body h4{font-size:13.5px;margin:14px 0 6px}
.body ul{margin:0 0 10px;padding-left:18px}
.body pre{background:var(--raise);border:1px solid var(--rule);border-radius:6px;padding:8px 10px;overflow:auto;font-size:12px}
.body code{background:var(--raise);border-radius:4px;padding:1px 4px}
.body pre code{background:none;padding:0}
.body a{color:var(--blue)}
.wl,.tref{border:0;background:none;padding:0;color:var(--blue);cursor:pointer;font:inherit;text-decoration:underline;text-decoration-color:var(--blue-wash);text-underline-offset:2px}
.wl:hover,.tref:hover{text-decoration-color:var(--blue)}
.unres{color:var(--ink-3);text-decoration:underline dotted}
.tags{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
.tags button{border:1px solid var(--rule);background:var(--raise);border-radius:6px;padding:1px 8px;font-size:12px;cursor:pointer;color:var(--ink-2)}
.tags button:hover{border-color:var(--rule-strong);color:var(--ink)}
.rel{display:grid;grid-template-columns:minmax(0,1fr) 64px;gap:10px;align-items:center}
.meter{height:6px;border-radius:3px;background:var(--rule);position:relative;overflow:hidden}
.meter i{position:absolute;inset:0 auto 0 0;background:var(--blue);border-radius:3px}
.meter+.v{font-size:11.5px;color:var(--ink-3);text-align:right}
.actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 4px}
.empty{color:var(--ink-2);font-size:13.5px;max-width:42ch}
.empty p{margin:0 0 10px}
.keys{display:grid;grid-template-columns:auto 1fr;gap:6px 10px;font-size:12.5px;color:var(--ink-3);margin-top:14px;align-items:center}
.keys kbd{justify-self:start}
.scrim{display:none}
@media (max-width:980px){
body{grid-template-columns:minmax(0,1fr);grid-template-rows:56px minmax(0,1fr) 84px;grid-template-areas:"bar" "stage" "time"}
.narrow-only{display:inline-grid}
.integrity{display:none}
.bar{gap:10px}
.bar .count{display:none}
.rail,.panel{position:fixed;z-index:20;top:56px;bottom:0;width:min(92vw,380px);box-shadow:var(--shadow);transition:transform 160ms ease-out}
.rail{left:0;transform:translateX(-105%)}
.panel{right:0;transform:translateX(105%)}
body.rail-open .rail{transform:none}
body.panel-open .panel{transform:none}
body.rail-open .scrim,body.panel-open .scrim{display:block;position:fixed;inset:56px 0 0 0;background:rgba(0,0,0,.18);z-index:15}
.legend{display:none}
.time output{min-width:0;font-size:12px}
}
@media (max-width:560px){.seg button{padding:6px 10px}.bar h1{max-width:34vw;overflow:hidden;text-overflow:ellipsis}}
@media (prefers-reduced-motion:reduce){*{transition-duration:0ms!important}}
@media (forced-colors:active){.seg button[aria-pressed="true"]{outline:2px solid CanvasText}}
`;

export const VIEWER_JS = String.raw`
(function () {
"use strict";
var A, notes, topics, N, ledger, unit, KEY = "atlas:memory:";
var $ = function (id) { return document.getElementById(id); };
var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
var privateStore = Object.create(null);
var privateWorkspace = !!document.getElementById("memory-files");
var store = {
  get: function (k) { if(privateWorkspace)return privateStore[k]||null;try { return localStorage.getItem(KEY + k); } catch (e) { return null; } },
  set: function (k, v) { if(privateWorkspace){privateStore[k]=v;return;}try { localStorage.setItem(KEY + k, v); } catch (e) {} }
};
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function clip(s, n) { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "\u2026" : s; }

// ---------------------------------------------------------------- structure (rebuilt by load, so a live update can swap the data in place)
var RECORDED = { thread: 1, followed: 1, link: 1 };
var CORR = { retires: 1, reasserts: 1, supersedes: 1 };
var outL, inL, degree, recNbr, recPair, flagsOf, tmin, tmax, byName, byT, i;
var titleW, textW, df, dfKeys;
var brain, SRC, fire, E, adj, acrossPair, dated = [];
function load(data) {
  A = data; notes = A.notes; topics = A.topics; N = notes.length;
  KEY = "atlas:" + (A.source && A.source.name || "memory") + ":";
  ledger = A.source && A.source.kind === "ledger";
  unit = A.decay.unit === "day" ? "day" : "row";
  outL = []; inL = []; degree = new Int32Array(N); recNbr = [];
  for (i = 0; i < N; i++) { outL.push([]); inL.push([]); recNbr.push([]); }
  A.links.forEach(function (l, k) {
    outL[l.a].push(k); inL[l.b].push(k);
    if (RECORDED[l.type]) { degree[l.a]++; degree[l.b]++; recNbr[l.a].push(l.b); recNbr[l.b].push(l.a); }
  });
  recPair = {};
  A.links.forEach(function (l) { if (RECORDED[l.type]) recPair[Math.min(l.a, l.b) + ":" + Math.max(l.a, l.b)] = 1; });
  flagsOf = []; for (i = 0; i < N; i++) flagsOf.push([]);
  A.flags.forEach(function (f) { flagsOf[f.note].push(f); });
  tmin = Infinity; tmax = -Infinity;
  notes.forEach(function (n) { if (n.time < tmin) tmin = n.time; if (n.time > tmax) tmax = n.time; });
  if (!N) { tmin = 0; tmax = 1; }
  if (tmax === tmin) tmax = tmin + 1;
  byName = {};
  notes.forEach(function (n, j) { [n.title, String(n.id).replace(/\.md$/i, "").split("/").pop()].forEach(function (k) { if (k && byName[k.toLowerCase()] == null) byName[k.toLowerCase()] = j; }); });
  byT = {}; if (ledger) notes.forEach(function (n, j) { byT[n.time] = j; });
  titleW = []; textW = []; df = {}; dfKeys = null;
  notes.forEach(function (n) {
    var tw = {}, xw = {};
    words(n.title + " " + (n.subtitle || "") + " " + (n.cause || "") + " " + (n.tags || []).join(" ")).forEach(function (w) { tw[w] = 1; });
    words(n.text).forEach(function (w) { xw[w] = 1; });
    titleW.push(tw); textW.push(xw);
    var seen = {}; Object.keys(tw).concat(Object.keys(xw)).forEach(function (w) { if (!seen[w]) { seen[w] = 1; df[w] = (df[w] || 0) + 1; } });
  });
  pos = new Float64Array(N * 2); from = new Float64Array(N * 2); target = new Float64Array(N * 2);
  vis = new Float64Array(N); visFrom = new Float64Array(N); visTo = new Float64Array(N);
  brain = A.mode === "brain"; SRC = A.sources || [];
  fire = new Float64Array(N); signals = []; weights = null;
  // every drawable edge in one list: recorded links, corrections, and the fibres between memories
  E = []; adj = []; acrossPair = {};
  for (i = 0; i < N; i++) adj.push([]);
  A.links.forEach(function (l) {
    var kind = RECORDED[l.type] ? "rec" : CORR[l.type] ? "corr" : null;
    if (kind) E.push({ a: l.a, b: l.b, kind: kind, type: l.type, bend: kind === "corr" ? 0.18 : hashBend(l.a, l.b) });
  });
  (A.across || []).forEach(function (p) { E.push({ a: p[0], b: p[1], kind: "across", z: p[2], bend: 0 }); acrossPair[p[0] + ":" + p[1]] = 1; });
  E.forEach(function (e, k) { e.k = k; adj[e.a].push(k); adj[e.b].push(k); });
  dated = notes.filter(function (n) { return n.date; }).map(function (n) { return [n.time, n.date]; }).sort(function (a, b) { return a[0] - b[0]; });
}
load(JSON.parse(document.getElementById("atlas-data").textContent));
function topicName(k) { return topics[k] ? topics[k].name.join(", ") : ""; }
function timeText(n) { return unit === "row" ? ("t" + n.time + (n.date ? ", " + n.date : "")) : n.timeLabel; }
function srcName(n) { return A.sources && A.sources[n.src] ? A.sources[n.src].name : ""; }
function kindText(n) { return n.kind === "correction" ? "Correction" : n.kind === "event" ? (ledger ? "Row" : "Note") : n.kind.charAt(0).toUpperCase() + n.kind.slice(1); }

// ---------------------------------------------------------------- search (words, weighted by rarity)
function words(s) { return (String(s || "").toLowerCase().match(/[a-z0-9][a-z0-9._-]*[a-z0-9]|[a-z0-9]/g) || []); }
function search(q) {
  q = q.trim(); if (!q) return [];
  var m = q.match(/^t(\d+)$/i);
  if (ledger && m && byT[+m[1]] != null) return [{ i: byT[+m[1]], s: 99 }];
  var qs = words(q); if (!qs.length) return [];
  if (!dfKeys) dfKeys = Object.keys(df);
  var last = qs[qs.length - 1], expand = last.length >= 2 ? dfKeys.filter(function (w) { return w.indexOf(last) === 0; }).slice(0, 40) : [last];
  var out = [];
  for (var j = 0; j < N; j++) {
    if (notes[j].time > T) continue;
    var s = 0, all = true;
    for (var k = 0; k < qs.length; k++) {
      var cands = k === qs.length - 1 ? expand : [qs[k]], best = 0;
      for (var c = 0; c < cands.length; c++) {
        var w = cands[c], idf = Math.log((N + 1) / ((df[w] || 0) + 1)) + 0.5;
        var hit = titleW[j][w] ? 3 * idf : textW[j][w] ? idf : 0;
        if (hit > best) best = hit;
      }
      if (!best) { all = false; break; }
      s += best;
    }
    if (all) out.push({ i: j, s: s + 0.3 * sal(j) });
  }
  out.sort(function (a, b) { return b.s - a.s || notes[b.i].time - notes[a.i].time; });
  return out;
}

// ---------------------------------------------------------------- state
var cv = $("cv"), ctx = cv.getContext("2d"), W = 0, H = 0, dpr = 1;
var view = store.get("view") || "map";
if (["map", "river", "list", "3d"].indexOf(view) < 0) view = "map";
var cam = { s: 1, x: 0, y: 0 };
var pos, from, target, vis, visFrom, visTo;
var anim = null, T = tmax, sel = -1, hover = -1, local = false, pulse = null, playing = null;
var layers = { recorded: store.get("l:recorded") !== "0", related: store.get("l:related") !== "0", corrections: store.get("l:corrections") !== "0" };
var matches = null, topicFocus = -1, sourceFocus = -1, pairFocus = null, C = {};

function readColors() {
  var cs = getComputedStyle(document.documentElement);
  ["paper", "panel", "raise", "grid", "grid-major", "ink", "ink-2", "ink-3", "red", "blue", "rule", "rule-strong"].forEach(function (k) { C[k] = cs.getPropertyValue("--" + k).trim(); });
}
function sal(j) {
  var n = notes[j];
  if (n.kind === "correction") return 1;
  var s = Math.pow(2, -Math.max(0, T - n.time) / A.decay.halfLife);
  if (n.pinned) s = Math.max(s, 0.5);
  return Math.max(s, 1e-6);
}
function shown(j) { return notes[j].time <= T; }
function flagOn(f) { var c = f.correction; return c == null || notes[c].time <= T; }
function flagged(j) { var fs = flagsOf[j]; for (var k = 0; k < fs.length; k++) if (flagOn(fs[k])) return fs[k]; return null; }

// ---------------------------------------------------------------- layout targets
function mapBase() { return Math.min(W, H) / 2 * 0.9; }
function computeTargets() {
  var b = mapBase(), j;
  for (j = 0; j < N; j++) {
    var n = notes[j];
    if (view === "river") {
      target[2 * j] = ((n.time - tmin) / (tmax - tmin) * 2 - 1) * (W / 2 * 0.9);
      target[2 * j + 1] = n.x * (H / 2 * 0.8);
    } else { target[2 * j] = n.x * b; target[2 * j + 1] = n.y * b; }
    visTo[j] = 1;
  }
  if (local && sel >= 0) egoTargets(b);
}
function egoSet() {
  var set = {}, ring = {};
  set[sel] = 0;
  recNbr[sel].forEach(function (j) { if (set[j] == null) { set[j] = 1; ring[j] = "r1"; } });
  Object.keys(set).forEach(function (k) { if (set[k] === 1) recNbr[k].forEach(function (j) { if (set[j] == null) { set[j] = 2; ring[j] = "r2"; } }); });
  (A.related[sel] || []).forEach(function (p) { if (set[p[0]] == null) { set[p[0]] = 3; ring[p[0]] = p[1]; } });
  outL[sel].concat(inL[sel]).forEach(function (k) { var l = A.links[k]; if (CORR[l.type]) { var o = l.a === sel ? l.b : l.a; if (set[o] == null) { set[o] = 1; ring[o] = "r1"; } } });
  return { set: set, ring: ring };
}
function egoTargets(b) {
  var e = egoSet(), cx = notes[sel].x, cy = notes[sel].y, maxZ = 1, members = [];
  (A.related[sel] || []).forEach(function (p) { if (p[1] > maxZ) maxZ = p[1]; });
  for (var j = 0; j < N; j++) {
    if (e.set[j] == null) { visTo[j] = 0; target[2 * j] = (notes[j].x - cx) * b * 3; target[2 * j + 1] = (notes[j].y - cy) * b * 3; continue; }
    visTo[j] = 1;
    if (j === sel) { target[2 * j] = 0; target[2 * j + 1] = 0; continue; }
    var ang = Math.atan2(notes[j].y - cy, notes[j].x - cx);
    if (notes[j].x === cx && notes[j].y === cy) ang = j * 2.399;
    members.push([j, ang]);
  }
  // neighbours keep their order around the note (their direction on the map) but share the circle evenly,
  // otherwise a topic's notes all sit in one narrow cone
  members.sort(function (p, q) { return p[1] - q[1]; });
  var off = members.length ? members[0][1] : 0;
  members.forEach(function (m, k) {
    var jj = m[0], ang2 = off + (k / members.length) * 6.2832;
    var r = e.ring[jj] === "r1" ? 0.36 : e.ring[jj] === "r2" ? 0.66 : 0.3 + 0.6 * (1 - Math.min(1, e.ring[jj] / maxZ));
    target[2 * jj] = Math.cos(ang2) * r * b; target[2 * jj + 1] = Math.sin(ang2) * r * b;
  });
}
function retarget(animate) {
  computeTargets();
  if (!animate || reduceMotion) { pos.set(target); vis.set(visTo); anim = null; kick(); return; }
  from.set(pos); visFrom.set(vis); anim = { t0: performance.now(), dur: 380 }; kick();
}

// ---------------------------------------------------------------- live signals, growth, lobes
var liveOn = store.get("live") === "0" ? false : store.get("live") === "1" ? true : !reduceMotion;
var signals = [], lastNow = 0, lastEl = Infinity;
var rnd = (function () { var s = 0x9e3779b9; return function () { s = (s + 0x6d2b79f5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
function hashBend(a, b) { var h = (Math.imul(a + 1, 2654435761) ^ Math.imul(b + 7, 40503)) >>> 0; return ((h % 1000) / 1000 - 0.5) * 0.22; }
function ctrlOf(e, ax, ay, bx, by) {
  var mx = (ax + bx) / 2, my = (ay + by) / 2;
  // a fibre between memories bends through the middle of the brain
  if (e.kind === "across") { var cx0 = wx(0), cy0 = wy(0); return [cx0 + (mx - cx0) * 0.45, cy0 + (my - cy0) * 0.45]; }
  var dx = bx - ax, dy = by - ay; return [mx - dy * e.bend, my + dx * e.bend];
}
function qpt(ax, ay, cx, cy, bx, by, p) { var u = 1 - p; return [u * u * ax + 2 * u * p * cx + p * p * bx, u * u * ay + 2 * u * p * cy + p * p * by]; }

// glow sprites, drawn once per theme
var SPR = {};
function withAlpha(hex, a) { var h = String(hex).replace("#", ""); if (h.length === 3) h = h.split("").map(function (x) { return x + x; }).join(""); var n = parseInt(h, 16); return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")"; }
function sprite(color, core) {
  var s = 64, c = document.createElement("canvas"); c.width = c.height = s;
  var g = c.getContext("2d"), grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, core); grd.addColorStop(0.16, color); grd.addColorStop(0.42, withAlpha(color, 0.3)); grd.addColorStop(1, withAlpha(color, 0));
  g.fillStyle = grd; g.fillRect(0, 0, s, s); return c;
}
function isDark() { var t = document.documentElement.getAttribute("data-theme"); return t ? t === "dark" : !!(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches); }
function buildSprites() {
  var dark = isDark();
  SPR.ink = sprite(C.ink, dark ? "#ffffff" : C.ink); SPR.red = sprite(C.red, dark ? "#fff0ee" : C.red); SPR.blue = sprite(C.blue, dark ? "#eef6ff" : C.blue);
  SPR.dark = dark; SPR.ok = true;
}

// growth: each memory grows in the order it connected, its notes born in the order they were written
var growth = null, growBar = $("growbar");
function planGrowth() {
  if (!brain || !N) return null;
  var born = new Float64Array(N), order = [], at = 250, lobeAt = [];
  SRC.forEach(function (s, si) {
    var ids = []; for (var j = 0; j < N; j++) if (notes[j].src === si) ids.push(j);
    ids.sort(function (p, q) { return notes[p].time - notes[q].time || p - q; });
    var dur = Math.max(900, Math.min(3600, 700 + 2 * ids.length));
    lobeAt.push(at);
    ids.forEach(function (j, k) { born[j] = at + 300 + (k / Math.max(1, ids.length)) * dur; order.push(j); });
    at += 300 + dur + 450;
  });
  order.sort(function (p, q) { return born[p] - born[q]; });
  return { t0: performance.now(), born: born, order: order, next: 0, lobeAt: lobeAt, fibreAt: at, end: at + 1700 };
}
function isBorn(j, el) { return !growth || el >= growth.born[j]; }
function edgeGrow(e, el) {
  if (!growth) return 1;
  if (e.kind === "across" && !growth.live) return Math.max(0, Math.min(1, (el - growth.fibreAt - ((e.a * 7 + e.b * 13) % 900)) / 600));
  return Math.max(0, Math.min(1, (el - Math.max(growth.born[e.a], growth.born[e.b])) / 380));
}
function endGrowth() { growth = null; lastEl = Infinity; if (growBar) growBar.classList.remove("on"); renderRail(); kick(); }
function updateGrowBar(el) {
  if (!growBar) return;
  if (growth.live) { $("growtext").textContent = growth.label; return; }
  var si = 0; for (var k = 0; k < growth.lobeAt.length; k++) if (el >= growth.lobeAt[k]) si = k;
  var txt;
  if (el >= growth.fibreAt) txt = "Linking the memories to each other: " + (A.across || []).length.toLocaleString("en-US") + " notes that say the same thing in two places";
  else { var s = SRC[si], done = 0; for (var j = 0; j < N; j++) if (notes[j].src === si && isBorn(j, el)) done++; txt = "Growing " + s.name + ": " + done.toLocaleString("en-US") + " of " + s.notes.toLocaleString("en-US"); }
  $("growtext").textContent = txt;
}

// firing: a note fires and sends signals along some of its edges; a signal arriving may fire the next note
function edgeUsable(e) {
  if (e.kind === "rec" && !layers.recorded) return false;
  if (e.kind === "corr" && !layers.corrections) return false;
  if (e.kind === "across" && !layers.related) return false;
  return live(e.a) && live(e.b) && vis[e.a] > 0.5 && vis[e.b] > 0.5 && isBorn(e.a, lastEl) && isBorn(e.b, lastEl) && edgeGrow(e, lastEl) >= 1;
}
function fireNode(j, strength, now, fan) {
  fire[j] = Math.max(fire[j], strength);
  var ks = adj[j]; if (!ks.length) return;
  for (var c = 0; c < Math.min(fan || 2, ks.length); c++) {
    if (signals.length > 300) return;
    var e = E[ks[Math.floor(rnd() * ks.length)]];
    if (!edgeUsable(e)) continue;
    var len = view === "3d" && r3d ? r3d.edgeLen(e) : Math.hypot(sx(e.a) - sx(e.b), sy(e.a) - sy(e.b));
    signals.push({ e: e, from: j, to: e.a === j ? e.b : e.a, t0: now, dur: 420 + Math.min(2600, len * 2.6), s: strength });
  }
}
var weights = null, wT = null, wN = 0;
function spontaneous(now, dt) {
  if (!weights || wT !== T) {
    weights = new Float64Array(N); var acc = 0;
    for (var j = 0; j < N; j++) { if (adj[j].length && shown(j)) acc += 0.25 + sal(j) + (notes[j].kind === "correction" ? 0.6 : 0); weights[j] = acc; }
    wT = T; wN = acc;
  }
  if (!wN) return;
  var expect = Math.max(1, Math.min(5, 2 * Math.sqrt(N / 600))) * dt / 1000;
  for (; expect > 0; expect -= 1) {
    if (rnd() >= Math.min(1, expect)) continue;
    var r = rnd() * wN, lo = 0, hi = N - 1;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (weights[mid] < r) lo = mid + 1; else hi = mid; }
    if (isBorn(lo, lastEl) && vis[lo] > 0.5) fireNode(lo, 0.55 + 0.45 * rnd(), now, rnd() < 0.5 ? 1 : 2);
  }
}
function stepLive(now) {
  var dt = lastNow ? Math.min(64, now - lastNow) : 16; lastNow = now;
  var el = growth ? now - growth.t0 : Infinity; lastEl = el;
  if (growth) {
    while (growth.next < growth.order.length && growth.born[growth.order[growth.next]] <= el) {
      var j = growth.order[growth.next++]; fire[j] = 1; if (liveOn && rnd() < 0.4) fireNode(j, 0.75, now, 1);
    }
    updateGrowBar(el);
    if (el > growth.end) endGrowth();
  }
  var decay = Math.exp(-dt / 420);
  for (var k = 0; k < N; k++) fire[k] = fire[k] > 0.004 ? fire[k] * decay : 0;
  if (view === "list") { signals.length = 0; return; }
  if (!liveOn) signals = signals.filter(function(s) { return s.evidence; });
  if (liveOn && !(ex && ex.focus) && (!growth || el > growth.fibreAt)) spontaneous(now, dt);
  for (var s = signals.length - 1; s >= 0; s--) {
    var g = signals[s];
    if (now - g.t0 < g.dur) continue;
    signals.splice(s, 1);
    fire[g.to] = Math.max(fire[g.to], g.s);
    if (!g.evidence && g.s * 0.72 > 0.3 && rnd() < 0.62) fireNode(g.to, g.s * 0.72, now, 1);
  }
}

// ---------------------------------------------------------------- frame loop
var raf = 0;
function kick() { if (!raf) raf = requestAnimationFrame(frame); }
function frame(now) {
  raf = 0;
  var more = false, j;
  if (anim) {
    var p = Math.min(1, (now - anim.t0) / anim.dur), e = 1 - Math.pow(1 - p, 3);
    for (j = 0; j < N * 2; j++) pos[j] = from[j] + (target[j] - from[j]) * e;
    for (j = 0; j < N; j++) vis[j] = visFrom[j] + (visTo[j] - visFrom[j]) * e;
    if (p >= 1) anim = null; else more = true;
  }
  if (playing) {
    var q = Math.min(1, (now - playing.t0) / Math.max(1, playing.dur)), nt = Math.round(playing.a + (tmax - playing.a) * q);
    if (nt !== T) setT(nt, true);
    if (q >= 1) stopPlay(); else more = true;
  }
  if (pulse && now - pulse.t0 < pulse.levels.length * 420 + 900) more = true;
  stepLive(now);
  if (view === "3d" && r3d) { var moving = r3d.render(now); if(moving || more || growth || signals.length || liveOn || fire.some(function(v){return v>0.004;}))kick(); return; }
  if (growth || signals.length || (liveOn && view !== "list")) more = true;
  draw(now);
  if (more) kick();
}
function sx(j) { return W / 2 + cam.x + pos[2 * j] * cam.s; }
function sy(j) { return H / 2 + cam.y + pos[2 * j + 1] * cam.s; }
function wx(x) { return W / 2 + cam.x + x * cam.s; }
function wy(y) { return H / 2 + cam.y + y * cam.s; }
function radius(j) { return Math.min(7.5, 2.2 + 0.95 * Math.sqrt(degree[j] + (notes[j].kind === "correction" ? 2 : 0))) * Math.max(1, Math.min(2.2, Math.sqrt(cam.s))); }

function drawGrid(alpha) {
  var step = 24 * cam.s;
  while (step < 14) step *= 5;
  while (step > 70) step /= 5;
  var major = step * 5, ox = ((W / 2 + cam.x) % major + major) % major, oy = ((H / 2 + cam.y) % major + major) % major, x, y, k;
  ctx.lineWidth = 1; ctx.globalAlpha = alpha;
  for (var pass = 0; pass < 2; pass++) {
    ctx.strokeStyle = pass ? C["grid-major"] : C.grid;
    ctx.beginPath();
    for (k = -5; ; k++) { x = ox + k * step; if (x > W) break; if (x < 0) continue; if ((((k % 5) + 5) % 5 === 0) !== !!pass) continue; ctx.moveTo(Math.round(x) + 0.5, 0); ctx.lineTo(Math.round(x) + 0.5, H); }
    for (k = -5; ; k++) { y = oy + k * step; if (y > H) break; if (y < 0) continue; if ((((k % 5) + 5) % 5 === 0) !== !!pass) continue; ctx.moveTo(0, Math.round(y) + 0.5); ctx.lineTo(W, Math.round(y) + 0.5); }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function focusSet() {
  if (ex && ex.focus) return ex.focus;
  var f = hover >= 0 ? hover : sel;
  if (f < 0 && topicFocus < 0 && !pairFocus && sourceFocus < 0) return null;
  var s = {};
  if (f >= 0) {
    s[f] = 1;
    recNbr[f].forEach(function (j) { s[j] = 1; });
    if (layers.related) (A.related[f] || []).forEach(function (p) { s[p[0]] = 1; });
    adj[f].forEach(function (k) { var e = E[k]; if ((e.kind === "corr" && layers.corrections) || (e.kind === "across" && layers.related)) { s[e.a] = 1; s[e.b] = 1; } });
  }
  if (topicFocus >= 0) for (var j = 0; j < N; j++) if (notes[j].topic === topicFocus) s[j] = 1;
  if (pairFocus) { s[pairFocus[0]] = 1; s[pairFocus[1]] = 1; }
  if (sourceFocus >= 0 && f < 0) for (var j = 0; j < N; j++) if (notes[j].src === sourceFocus) s[j] = 1;
  return s;
}
function arrowHead(ax, ay, bx, by, r) {
  var a = Math.atan2(by - ay, bx - ax), tx = bx - Math.cos(a) * (r + 3), ty = by - Math.sin(a) * (r + 3);
  ctx.moveTo(tx, ty); ctx.lineTo(tx - Math.cos(a - 0.45) * 7, ty - Math.sin(a - 0.45) * 7);
  ctx.moveTo(tx, ty); ctx.lineTo(tx - Math.cos(a + 0.45) * 7, ty - Math.sin(a + 0.45) * 7);
}
function live(x) { return shown(x) && vis[x] > 0.02; }
function strokeEdge(e, g, arrow) {
  var ax = sx(e.a), ay = sy(e.a), bx = sx(e.b), by = sy(e.b), c = ctrlOf(e, ax, ay, bx, by), t;
  // a growing dendrite extends from the note that was there first (the same curve, walked the other way)
  if (g < 1 && growth && growth.born[e.b] < growth.born[e.a]) { t = ax; ax = bx; bx = t; t = ay; ay = by; by = t; }
  ctx.moveTo(ax, ay);
  if (g >= 1) { ctx.quadraticCurveTo(c[0], c[1], bx, by); if (arrow && e.type === "followed") arrowHead(c[0], c[1], bx, by, radius(e.b)); return; }
  for (var s = 1; s <= 10; s++) { var p = qpt(ax, ay, c[0], c[1], bx, by, g * s / 10); ctx.lineTo(p[0], p[1]); }
}

function drawLobes(el) {
  if (!brain || local || view !== "map") return;
  var b = mapBase();
  SRC.forEach(function (s, si) {
    var t = growth ? (el - growth.lobeAt[si]) / 450 : 1; if (t <= 0) return; t = Math.min(1, t);
    var x = wx(s.lobe.x * b), y = wy(s.lobe.y * b), r = s.lobe.r * b * cam.s * 1.1 * (0.86 + 0.14 * t);
    var grd = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
    grd.addColorStop(0, withAlpha(C.ink, 0.05 * t)); grd.addColorStop(1, withAlpha(C.ink, 0.012 * t));
    ctx.globalAlpha = 1; ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    ctx.globalAlpha = 0.2 * t; ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.stroke();
  });
  ctx.globalAlpha = 1;
}

function draw(now) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1; ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  if (view === "list") return;
  var dark = isDark(), neuro = brain || liveOn;
  if (!SPR.ok || SPR.dark !== dark) buildSprites();
  drawGrid(neuro && dark ? 0.55 : 1);
  var el = lastEl, fs = focusSet(), f = hover >= 0 ? hover : sel, j, k, e;
  drawLobes(el);
  if (view === "river" && !local) drawRiverAxis();
  // edges, batched by colour and strength; resting links fade with their length on screen so the long ones across
  // the map recede into a wash instead of a mesh
  var ref = Math.min(W, H) * 0.12, batches = {};
  for (k = 0; k < E.length; k++) {
    e = E[k];
    if ((e.kind === "rec" && !layers.recorded) || (e.kind === "corr" && !layers.corrections) || (e.kind === "across" && !layers.related)) continue;
    if (!live(e.a) || !live(e.b) || !isBorn(e.a, el) || !isBorn(e.b, el)) continue;
    var g = edgeGrow(e, el); if (g <= 0) continue;
    var hot = ex && ex.edgeSet ? !!ex.edgeSet[e.a + ':' + e.b + ':' + e.type] : fs ? !!(fs[e.a] && fs[e.b] && (f < 0 || e.a === f || e.b === f)) : false, key;
    if (e.kind === "rec" && !hot) { var len = Math.hypot(sx(e.a) - sx(e.b), sy(e.a) - sy(e.b)); key = "rec-" + (len < ref ? 0 : len < 2 * ref ? 1 : len < 4 * ref ? 2 : 3); }
    else key = e.kind + (hot ? "-hot" : "");
    (batches[key] = batches[key] || []).push([e, g]);
  }
  var STY = {
    "rec-0": [C.ink, fs ? 0.06 : 0.26, 1], "rec-1": [C.ink, fs ? 0.04 : 0.15, 1], "rec-2": [C.ink, fs ? 0.03 : 0.08, 1], "rec-3": [C.ink, fs ? 0.02 : 0.04, 1],
    "rec-hot": [C.ink, 0.62, 1.1], "corr": [C.red, fs ? 0.08 : 0.42, 1.3], "corr-hot": [C.red, 0.9, 1.4],
    "across": [C.blue, fs ? 0.03 : (dark ? 0.13 : 0.1), 1], "across-hot": [C.blue, 0.8, 1.3]
  };
  Object.keys(batches).forEach(function (key) {
    var st = STY[key]; ctx.strokeStyle = st[0]; ctx.globalAlpha = st[1]; ctx.lineWidth = st[2]; ctx.beginPath();
    batches[key].forEach(function (pe) { strokeEdge(pe[0], pe[1], key === "rec-hot"); });
    ctx.stroke();
  });
  // related, not linked: blue dashes from the focus (fibres already drawn as curves are skipped)
  ctx.setLineDash([4, 4]); ctx.strokeStyle = C.blue; ctx.lineWidth = 1.3;
  if (layers.related && f >= 0 && live(f)) {
    ctx.globalAlpha = 0.8; ctx.beginPath();
    (A.related[f] || []).forEach(function (p) { var o = p[0], pk = Math.min(f, o) + ":" + Math.max(f, o); if (!live(o) || !isBorn(o, el) || recPair[pk] || acrossPair[pk]) return; ctx.moveTo(sx(f), sy(f)); ctx.lineTo(sx(o), sy(o)); });
    ctx.stroke();
  }
  if (pairFocus && live(pairFocus[0]) && live(pairFocus[1])) { ctx.globalAlpha = 0.95; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx(pairFocus[0]), sy(pairFocus[0])); ctx.lineTo(sx(pairFocus[1]), sy(pairFocus[1])); ctx.stroke(); }
  ctx.setLineDash([]);
  // neurons: a glow that swells when the note fires, then the note itself
  for (j = 0; j < N; j++) {
    if (!live(j) || !isBorn(j, el)) continue;
    var x = sx(j), y = sy(j), r = radius(j);
    if (x < -30 || y < -30 || x > W + 30 || y > H + 30) continue;
    var n = notes[j], fl = layers.corrections ? flagged(j) : null;
    var a = (0.3 + 0.7 * sal(j)) * vis[j]; if (fs && !fs[j]) a *= 0.13;
    var birth = growth ? Math.max(0, 1 - (el - growth.born[j]) / 520) : 0, fz = Math.max(fire[j], birth) * (fs && !fs[j] ? 0.2 : 1);
    // a calm baseline (crisp cores, faint glow) so the glow is spent on firing and a firing note reads at a glance;
    // at rest the 1,400-note estate lobe saturated to white and its 236 corrections speckled it red
    var isRed = n.kind === "correction" || !!fl;
    if (neuro) {
      var gs = r * (dark ? 4.6 : 3.8) * (1 + 1.7 * fz) * (isRed && fz < 0.2 ? 0.7 : 1);
      ctx.globalCompositeOperation = dark ? "lighter" : "source-over";
      ctx.globalAlpha = Math.min(1, (dark ? 0.12 : 0.07) * a * (isRed ? 0.6 : 1) + fz * (dark ? 0.85 : 0.35));
      ctx.drawImage(isRed ? SPR.red : SPR.ink, x - gs / 2, y - gs / 2, gs, gs);
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.globalAlpha = Math.min(1, (neuro && n.kind === "correction" ? a * 0.75 : a) + fz * 0.4);
    var core = neuro ? r * 0.78 : r;
    if (n.kind === "correction") {
      ctx.fillStyle = C.red; ctx.beginPath(); var d = neuro ? core * 0.9 + 0.8 : core + 1.2;
      ctx.moveTo(x, y - d); ctx.lineTo(x + d, y); ctx.lineTo(x, y + d); ctx.lineTo(x - d, y); ctx.closePath(); ctx.fill();
    } else { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(x, y, core, 0, 6.2832); ctx.fill(); }
    if (fl) { ctx.globalAlpha = Math.min(1, a + 0.3); ctx.strokeStyle = C.red; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, core + 2.6, 0, 6.2832); ctx.stroke(); }
    else if (n.pinned) { ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, core + 2.2, 0, 6.2832); ctx.stroke(); }
    if ((matches && matches[j]) || (ex && ex.diff && ex.diff.added.indexOf(j) >= 0)) { ctx.globalAlpha = 1; ctx.strokeStyle = C.blue; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, core + 3.4, 0, 6.2832); ctx.stroke(); }
    if (birth > 0) { ctx.globalAlpha = birth * 0.6; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, core + 2 + (1 - birth) * 16, 0, 6.2832); ctx.stroke(); }
  }
  // signals: a bright head and a lit stretch of dendrite behind it
  if (signals.length) {
    ctx.globalCompositeOperation = dark ? "lighter" : "source-over"; ctx.lineCap = "round";
    signals.forEach(function (sg) {
      var ed = sg.e, p = Math.min(1, (now - sg.t0) / sg.dur);
      var ax = sx(ed.a), ay = sy(ed.a), bx = sx(ed.b), by = sy(ed.b), c = ctrlOf(ed, ax, ay, bx, by), fwd = sg.from === ed.a;
      var col = ed.kind === "corr" ? C.red : ed.kind === "across" ? C.blue : C.ink, spr = ed.kind === "corr" ? SPR.red : ed.kind === "across" ? SPR.blue : SPR.ink;
      var dim = fs && !(fs[ed.a] && fs[ed.b]) ? 0.25 : 1, p0 = Math.max(0, p - 0.2);
      ctx.strokeStyle = col; ctx.lineWidth = 1.7;
      for (var st = 0; st < 6; st++) {
        var q0 = p0 + (p - p0) * st / 6, q1 = p0 + (p - p0) * (st + 1) / 6;
        var P0 = qpt(ax, ay, c[0], c[1], bx, by, fwd ? q0 : 1 - q0), P1 = qpt(ax, ay, c[0], c[1], bx, by, fwd ? q1 : 1 - q1);
        ctx.globalAlpha = (0.06 + 0.5 * (st + 1) / 6) * sg.s * dim; ctx.beginPath(); ctx.moveTo(P0[0], P0[1]); ctx.lineTo(P1[0], P1[1]); ctx.stroke();
      }
      var hd = qpt(ax, ay, c[0], c[1], bx, by, fwd ? p : 1 - p), hs = 9 + 11 * sg.s;
      ctx.globalAlpha = Math.min(1, (0.2 + 0.8 * sg.s) * dim); ctx.drawImage(spr, hd[0] - hs / 2, hd[1] - hs / 2, hs, hs);
    });
    ctx.lineCap = "butt"; ctx.globalCompositeOperation = "source-over";
  }
  ctx.globalAlpha = 1;
  if (f >= 0 && live(f)) { ctx.strokeStyle = sel === f ? C.blue : C["ink-2"]; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx(f), sy(f), radius(f) + 4.5, 0, 6.2832); ctx.stroke(); }
  if (sel >= 0 && sel !== f && live(sel)) { ctx.strokeStyle = C.blue; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx(sel), sy(sel), radius(sel) + 4.5, 0, 6.2832); ctx.stroke(); }
  if (pulse) drawPulse(now);
  drawLabels(fs);
}
function drawPulse(now) {
  var t = now - pulse.t0;
  pulse.levels.forEach(function (lv, h) {
    var p = (t - h * 420) / 700;
    if (p < 0) return;
    lv.forEach(function (j) {
      if (!shown(j) || vis[j] < 0.5) return;
      var act = pulse.act[j], x = sx(j), y = sy(j), r = radius(j);
      ctx.strokeStyle = C.blue;
      if (p < 1) { ctx.globalAlpha = (1 - p) * 0.9; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r + 4 + p * 18 * act, 0, 6.2832); ctx.stroke(); }
      ctx.globalAlpha = 0.35 + 0.6 * act; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r + 3, 0, 6.2832); ctx.stroke();
    });
  });
  ctx.globalAlpha = 1;
}
var boxes = [];
function freeBox(x, y, w, h) {
  for (var k = 0; k < boxes.length; k++) { var b = boxes[k]; if (x < b[0] + b[2] && x + w > b[0] && y < b[1] + b[3] && y + h > b[1]) return false; }
  boxes.push([x, y, w, h]); return true;
}
// the centre x that keeps a centred label of width w wholly on the canvas (at phone width a topic near the rim was cut mid-word)
function inside(x, w) { return w >= W - 4 ? W / 2 : Math.max(w / 2 + 2, Math.min(W - w / 2 - 2, x)); }
function haloText(text, x, y) {
  ctx.lineJoin = "round"; ctx.lineWidth = 4; ctx.strokeStyle = C.paper; ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
}
// where each topic's label sits in the current view: the centroid of its visible members
function topicAnchors() {
  var acc = topics.map(function () { return [0, 0, 0, []]; });
  for (var j = 0; j < N; j++) { if (!shown(j) || vis[j] < 0.5) continue; var a = acc[notes[j].topic]; if (!a) continue; a[0] += pos[2 * j]; a[1] += pos[2 * j + 1]; a[2]++; a[3].push(pos[2 * j]); }
  return acc.map(function (a) { if (!a[2]) return null; var xs = a[3].sort(function (p, q) { return p - q; }); return [view === "river" ? xs[Math.floor(xs.length / 2)] : a[0] / a[2], a[1] / a[2], a[2]]; });
}
function drawLabels(fs) {
  boxes = [];
  ctx.textBaseline = "middle"; ctx.textAlign = "center";
  if (brain && view === "map" && !local) {
    var bb = mapBase();
    SRC.forEach(function (s, si) {
      if (growth && lastEl < growth.lobeAt[si]) return;
      var x = wx(s.lobe.x * bb), top = wy(s.lobe.y * bb) - s.lobe.r * bb * cam.s * 1.1;
      ctx.font = "650 14px system-ui,-apple-system,sans-serif";
      var w = ctx.measureText(s.name).width + 10;
      x = inside(x, w);
      if (!freeBox(x - w / 2, top - 38, w, 34)) return;
      ctx.globalAlpha = 1; ctx.fillStyle = C.ink; haloText(s.name, x, top - 26);
      ctx.font = "12px system-ui,-apple-system,sans-serif"; ctx.fillStyle = C["ink-3"];
      haloText(s.notes.toLocaleString("en-US") + (s.kind === "claude-memory" || s.kind === "vault" ? " notes" : " rows") + (s.integrity && s.integrity.chained ? (s.integrity.ok ? ", chain intact" : ", chain broken") : ""), x, top - 10);
    });
  }
  if (growth && !growth.live) { ctx.globalAlpha = 1; ctx.textAlign = "left"; return; }
  if ((view === "map" || view === "river") && !local) {
    var anchors = topicAnchors(), order = topics.map(function (t, k) { return k; }).filter(function (k) { return anchors[k]; }).sort(function (p, q) { return anchors[q][2] - anchors[p][2]; });
    // at the whole-map zoom only the larger topics are named; zooming in names the rest
    var budget = cam.s < 1.6 ? 16 : cam.s < 3 ? 32 : order.length;
    order.slice(0, budget).forEach(function (k) {
      var x = wx(anchors[k][0]), y = wy(anchors[k][1]);
      if (x < 0 || y < 0 || x > W || y > H) return;
      var size = Math.round(12 + Math.min(4, anchors[k][2] / 30));
      ctx.font = "650 " + size + "px system-ui,-apple-system,sans-serif";
      var text = topicName(k), w = ctx.measureText(text).width + 8, h = size + 6;
      x = inside(x, w);
      if (!freeBox(x - w / 2, y - h / 2, w, h)) return;
      ctx.globalAlpha = fs ? (topicFocus === k ? 1 : 0.4) : 0.95;
      ctx.fillStyle = C["ink-2"]; haloText(text, x, y);
    });
  }
  if (cam.s >= 2.6 || local) {
    ctx.font = "12px system-ui,-apple-system,sans-serif"; ctx.textAlign = "left";
    var cand = [];
    for (var j = 0; j < N; j++) {
      if (!shown(j) || vis[j] < 0.5) continue;
      var x = sx(j), y = sy(j);
      if (x < 0 || y < 0 || x > W || y > H) continue;
      if (fs && !fs[j]) continue;
      cand.push([j, (j === sel ? 100 : 0) + degree[j] + sal(j)]);
    }
    cand.sort(function (p, q) { return q[1] - p[1]; });
    cand.slice(0, 80).forEach(function (c) {
      var j = c[0], x = sx(j) + radius(j) + 6, y = sy(j), text = clip(notes[j].title, 44), w = ctx.measureText(text).width + 6;
      // a label that would run off the right edge goes on the left of its point
      if (x + w > W - 2) x = Math.max(2, sx(j) - radius(j) - 6 - w + 6);
      if (!freeBox(x - 3, y - 9, w, 18)) return;
      ctx.globalAlpha = 0.95; ctx.fillStyle = C.ink; haloText(text, x, y);
    });
  }
  ctx.globalAlpha = 1; ctx.textAlign = "left";
}
function drawRiverAxis() {
  ctx.font = "12px system-ui,-apple-system,sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = C["ink-3"];
  for (var k = 0; k <= 6; k++) {
    var t = tmin + (tmax - tmin) * k / 6, x = wx(((t - tmin) / (tmax - tmin) * 2 - 1) * (W / 2 * 0.9));
    if (x < 40 || x > W - 40) continue;
    ctx.fillText(tickLabel(Math.round(t)), x, 16);
  }
}
function dateNear(t) { var best = null; for (var k = 0; k < dated.length && dated[k][0] <= t; k++) best = dated[k][1]; return best; }
function tickLabel(t) {
  if (unit === "day") return new Date(t * 86400000).toISOString().slice(0, 10);
  var d = dateNear(t); return "t" + t + (d ? ", " + d : "");
}

// ---------------------------------------------------------------- hit testing and input
function nodeAt(px, py) {
  var best = -1, bd = Infinity;
  for (var j = 0; j < N; j++) {
    if (!shown(j) || vis[j] < 0.3) continue;
    var dx = sx(j) - px, dy = sy(j) - py, d = dx * dx + dy * dy, r = radius(j) + 6;
    if (d < r * r && d < bd) { bd = d; best = j; }
  }
  return best;
}
var tip = $("tip"), drag = null, pointers = {}, pinch = null;
function showTip(j, px, py) {
  if (j < 0) { tip.classList.remove("on"); return; }
  var n = notes[j], fl = flagged(j);
  tip.innerHTML = '<div class="t">' + esc(n.title) + '</div><div class="m">' + (srcName(n) ? "<span>" + esc(srcName(n)) + "</span>" : "") + '<span class="kind' + (n.kind === "correction" ? " correction" : "") + '">' + esc(kindText(n)) + "</span><span>" + esc(timeText(n)) + "</span>" + (topics[n.topic] ? "<span>" + esc(topicName(n.topic)) + "</span>" : "") + (fl ? '<span class="red">carries a withdrawn value</span>' : "") + "</div>";
  var tw = Math.min(340, W - 16), x = Math.min(px + 14, W - tw - 8), y = py + 16;
  if (y > H - 90) y = py - 70;
  tip.style.left = Math.max(8, x) + "px"; tip.style.top = Math.max(8, y) + "px"; tip.classList.add("on");
}
function at(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
cv.addEventListener("pointerdown", function (e) {
  try { cv.setPointerCapture(e.pointerId); } catch (x) {}
  var p = at(e); pointers[e.pointerId] = p;
  var ids = Object.keys(pointers);
  if (ids.length === 2) { var a = pointers[ids[0]], b = pointers[ids[1]]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, s: cam.s }; drag = null; return; }
  drag = { x: p[0], y: p[1], node: nodeAt(p[0], p[1]), moved: 0 };
  cv.classList.add("dragging");
});
cv.addEventListener("pointermove", function (e) {
  var p = at(e);
  if (pointers[e.pointerId]) pointers[e.pointerId] = p;
  if (pinch) { var ids = Object.keys(pointers); if (ids.length === 2) { var a = pointers[ids[0]], b = pointers[ids[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]); zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, pinch.s * d / pinch.d / cam.s); } return; }
  if (drag) {
    var dx = p[0] - drag.x, dy = p[1] - drag.y; drag.x = p[0]; drag.y = p[1]; drag.moved += Math.abs(dx) + Math.abs(dy);
    if (drag.node >= 0 && drag.moved > 3) moveNode(drag.node, dx / cam.s, dy / cam.s);
    else if (drag.node < 0) { cam.x += dx; cam.y += dy; }
    showTip(-1); kick(); return;
  }
  var j = nodeAt(p[0], p[1]);
  if (j !== hover) { hover = j; kick(); }
  cv.classList.toggle("onnode", j >= 0);
  showTip(j, p[0], p[1]);
});
function endPointer(e) {
  delete pointers[e.pointerId];
  if (pinch) { if (Object.keys(pointers).length < 2) pinch = null; drag = null; return; }
  cv.classList.remove("dragging");
  if (drag && drag.moved < 5) { if (drag.node >= 0) select(drag.node, { center: false }); else if (!local) select(-1); }
  drag = null;
}
cv.addEventListener("pointerup", endPointer);
cv.addEventListener("pointercancel", endPointer);
cv.addEventListener("pointerleave", function () { if (hover >= 0) { hover = -1; kick(); } showTip(-1); });
cv.addEventListener("dblclick", function (e) { var p = at(e), j = nodeAt(p[0], p[1]); if (j >= 0) { select(j, { center: false }); setLocal(true); } });
cv.addEventListener("wheel", function (e) { e.preventDefault(); var p = at(e); zoomAt(p[0], p[1], Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015))); }, { passive: false });
function zoomAt(px, py, f) {
  var s = Math.max(0.35, Math.min(16, cam.s * f)); f = s / cam.s;
  cam.x = px - W / 2 - (px - W / 2 - cam.x) * f; cam.y = py - H / 2 - (py - H / 2 - cam.y) * f; cam.s = s; kick();
}
function moveNode(j, dx, dy) {
  // a dragged note pulls its recorded neighbours a little, so the picture stays connected
  pos[2 * j] += dx; pos[2 * j + 1] += dy; target[2 * j] += dx; target[2 * j + 1] += dy;
  recNbr[j].forEach(function (o) { pos[2 * o] += dx * 0.3; pos[2 * o + 1] += dy * 0.3; target[2 * o] += dx * 0.3; target[2 * o + 1] += dy * 0.3; });
  kick();
}
function fitTo(ids, pad) {
  if (!ids.length) return;
  var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  ids.forEach(function (j) { var x = target[2 * j], y = target[2 * j + 1]; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; });
  var w = Math.max(40, x1 - x0), h = Math.max(40, y1 - y0), s = Math.max(0.5, Math.min(8, Math.min((W - pad) / w, (H - pad) / h)));
  cam.s = s; cam.x = -(x0 + x1) / 2 * s; cam.y = -(y0 + y1) / 2 * s; kick();
}
function centerOn(j) {
  var x = sx(j), y = sy(j);
  if (x > 60 && y > 60 && x < W - 60 && y < H - 60) return;
  cam.x = -target[2 * j] * cam.s; cam.y = -target[2 * j + 1] * cam.s; kick();
}

// ---------------------------------------------------------------- selection, local view, pulse
function select(j, opt) {
  opt = opt || {};
  if (ex) ex.notice = '';
  if (ex && !opt.explore) exClear();
  sel = j; pulse = null;
  if (j < 0) { if (local) setLocal(false); renderPanel(); markList(); kick(); document.body.classList.remove("panel-open"); return; }
  if (notes[j].time > T) setT(tmax);
  if (local) retarget(true);
  if (view === "3d" && r3d) r3d.flyTo(j);
  else if (opt.center !== false && view !== "list") centerOn(j);
  renderPanel(); markList(); kick();
  if (window.innerWidth <= 980) document.body.classList.add("panel-open");
  try { history.replaceState(null, "", "#" + encodeURIComponent(notes[j].id)); } catch (e) {}
}
function setLocal(on) {
  if (on && sel < 0) return;
  if (view === "3d" && r3d) { if (on) r3d.flyTo(sel, 0.45); else r3d.reset(); return; }
  local = on;
  $("localbar").classList.toggle("on", on);
  if (on) { $("localtitle").textContent = "Local view of " + clip(notes[sel].title, 60); if (view === "list") setView("map"); cam = { s: 1, x: 0, y: 0 }; }
  retarget(true); renderPanel();
}
function startPulse() {
  if (sel < 0) return;
  var act = {}, levels = [], frontier = [sel]; act[sel] = 1;
  for (var h = 0; h < 3; h++) {
    var next = {};
    frontier.forEach(function (i0) {
      var a0 = act[i0];
      recNbr[i0].forEach(function (j) { if (act[j] == null && shown(j)) next[j] = Math.max(next[j] || 0, a0 * 0.85); });
      if (layers.related) (A.related[i0] || []).forEach(function (p) { var j = p[0]; if (act[j] == null && shown(j)) next[j] = Math.max(next[j] || 0, a0 * 0.7 * Math.min(1, p[1] / 12)); });
    });
    var ks = Object.keys(next).map(Number).filter(function (j) { return next[j] >= 0.12; }).sort(function (p, q) { return next[q] - next[p]; }).slice(0, 14);
    if (!ks.length) break;
    ks.forEach(function (j) { act[j] = next[j]; });
    levels.push(ks); frontier = ks;
  }
  pulse = { t0: performance.now(), levels: [[sel]].concat(levels), act: act };
  if (liveOn) fireNode(sel, 1, performance.now(), Math.min(8, adj[sel].length));
  renderPanel(); kick();
}

// ---------------------------------------------------------------- time
var when = $("when"), whenOut = $("whenout");
when.min = tmin; when.max = tmax; when.step = 1; when.value = tmax;
function setT(t, fromPlay) {
  T = Math.max(tmin, Math.min(tmax, t)); when.value = T;
  signals = [];
  if (ex && ex.mode === 'trace') { ex.trace = explorer.trace(A, ex.root, T); ex.edgeSet = {}; ex.trace.edges.forEach(function(k){var l=A.links[k];ex.edgeSet[l.a+':'+l.b+':'+l.type]=1;}); exFocus(ex.trace.steps.map(function(s) { return s.node; }).concat(ex.trace.corrections)); }
  if (ex && ex.mode === 'ask') { ex.answer = explorer.ask(A, ex.question, T); exFocus(ex.answer.hits.map(function(h){return h.node;})); }
  var n = 0; for (var j = 0; j < N; j++) if (notes[j].time <= T) n++;
  var label = unit === "day" ? new Date(T * 86400000).toISOString().slice(0, 10) : ("t" + T + (dateNear(T) ? ", about " + dateNear(T) : ""));
  whenOut.textContent = (T >= tmax ? "Everything, through " : "As of ") + label + " (" + n + " of " + N + ")";
  if (!fromPlay || T >= tmax) { renderRail(); renderList(); if (sel >= 0 || (ex && ex.mode)) renderPanel(); }
  kick(); drawSpark();
}
when.addEventListener("input", function () { if (playing) { playing = null; setPlayIcon(); } setT(+when.value); });
function togglePlay() {
  if (growth) endGrowth();
  if (playing) { stopPlay(); return; }
  var a0 = T >= tmax ? tmin : T;
  playing = { t0: performance.now(), a: a0, dur: 14000 * (tmax - a0) / (tmax - tmin) };
  setT(a0, true); setPlayIcon(); kick();
}
function stopPlay() { if (!playing) return; playing = null; setPlayIcon(); setT(T); }
function setPlayIcon() {
  $("play").innerHTML = playing ? '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3v10M11 3v10"/></svg>' : '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3l8 5-8 5z"/></svg>';
  $("play").setAttribute("aria-label", playing ? "Pause" : "Play the memory forward");
}
$("play").addEventListener("click", togglePlay);
var spark = $("spark"), sctx = spark.getContext("2d");
function drawSpark() {
  var w = spark.clientWidth, h = spark.clientHeight; if (!w) return;
  spark.width = Math.round(w * dpr); spark.height = Math.round(h * dpr); sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  sctx.clearRect(0, 0, w, h);
  var bins = Math.max(10, Math.min(160, Math.floor(w / 4))), cnt = [], corr = [], max = 1, b;
  for (b = 0; b < bins; b++) { cnt.push(0); corr.push(0); }
  notes.forEach(function (n) { var k = Math.min(bins - 1, Math.floor((n.time - tmin) / (tmax - tmin + 1e-9) * bins)); cnt[k]++; if (n.kind === "correction") corr[k]++; });
  cnt.forEach(function (c) { if (c > max) max = c; });
  var bw = w / bins, cut = (T - tmin) / (tmax - tmin) * w;
  for (b = 0; b < bins; b++) {
    var x = b * bw;
    if (unit === "day") {
      // a vault: how many notes each stretch of days touched
      var bh = Math.max(1, cnt[b] / max * (h - 8));
      sctx.fillStyle = C.ink; sctx.globalAlpha = x + bw <= cut + 0.5 ? 0.55 : 0.16;
      sctx.fillRect(x + 0.5, h - bh, Math.max(1, bw - 1.5), bh);
    }
    if (corr[b]) { sctx.globalAlpha = 0.9; sctx.fillStyle = C.red; sctx.fillRect(x + 0.5, 0, Math.max(1, bw - 1.5), 3); }
  }
  if (unit === "row") {
    // a ledger's rows are evenly spaced, so a count per bin is flat: draw a calendar ruler instead, one tick per day
    sctx.font = "11px system-ui,-apple-system,sans-serif"; sctx.textBaseline = "alphabetic"; sctx.textAlign = "left";
    var lastLabel = -1e9, prev = null;
    sctx.fillStyle = C.ink; sctx.globalAlpha = 0.25; sctx.fillRect(0, h - 1, w, 1);
    dated.forEach(function (d) {
      if (d[1] === prev) return; prev = d[1];
      var x = (d[0] - tmin) / (tmax - tmin) * w;
      sctx.globalAlpha = d[0] <= T ? 0.6 : 0.2; sctx.fillStyle = C.ink; sctx.fillRect(Math.round(x), h - 9, 1, 8);
      if (x - lastLabel > 84 && x < w - 60) { sctx.globalAlpha = d[0] <= T ? 0.85 : 0.4; sctx.fillStyle = C["ink-3"]; sctx.fillText(d[1].slice(5), x + 3, h - 12); lastLabel = x; }
    });
  }
  sctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- panel
function noteButton(j, extra) {
  var n = notes[j];
  return '<button class="item" data-go="' + j + '"><span class="t">' + esc(n.title) + '</span><span class="m">' + (srcName(n) ? "<span>" + esc(srcName(n)) + "</span>" : "") + "<span>" + esc(timeText(n)) + "</span>" + (extra || "") + "</span></button>";
}
function renderBody(n) {
  var src = String(n.text || "");
  if (!src.trim()) return "";
  var html = esc(src), blocks = [];
  html = html.replace(/\x60\x60\x60[^\n]*\n([\s\S]*?)\x60\x60\x60/g, function (m, code) { blocks.push("<pre><code>" + code + "</code></pre>"); return "\n\u0000" + (blocks.length - 1) + "\u0000\n"; });
  var tref = ledger ? /\bt(\d{1,6})\b/g : null;
  var inline = function (s) {
    s = s
      .replace(/\x60([^\x60\n]+)\x60/g, "<code>$1</code>")
      .replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>")
      .replace(/\[\[([^\]|#\n]+)(#[^\]|\n]*)?(\|([^\]\n]*))?\]\]/g, function (m, t, h, a, alias) {
        var k = byName[t.trim().toLowerCase()];
        return k != null ? '<button class="wl" data-go="' + k + '">' + (alias || t) + "</button>" : '<span class="unres" title="No note by this name yet">' + (alias || t) + "</span>";
      })
      .replace(/\[([^\]\n]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" rel="noopener noreferrer" target="_blank">$1</a>');
    if (tref) s = s.replace(tref, function (m, d) { var k = byT[+d]; return k != null ? '<button class="tref" data-go="' + k + '">' + m + "</button>" : m; });
    return s;
  };
  var outp = [], para = [], list = [];
  var flushP = function () { if (para.length) { outp.push("<p>" + inline(para.join(" ")) + "</p>"); para = []; } };
  var flushL = function () { if (list.length) { outp.push("<ul>" + list.map(function (li) { return "<li>" + inline(li) + "</li>"; }).join("") + "</ul>"); list = []; } };
  html.split("\n").forEach(function (ln) {
    var hm = ln.match(/^#{1,6}\s+(.*)$/), lm = ln.match(/^\s*(?:[-*]|\d+\.)\s+(.*)$/), bm = ln.match(/^\u0000(\d+)\u0000$/);
    if (bm) { flushP(); flushL(); outp.push(blocks[+bm[1]]); }
    else if (hm) { flushP(); flushL(); outp.push("<h4>" + inline(hm[1]) + "</h4>"); }
    else if (lm) { flushP(); list.push(lm[1]); }
    else if (!ln.trim()) { flushP(); flushL(); }
    else if (list.length) list[list.length - 1] += " " + ln.trim();
    else para.push(ln);
  });
  flushP(); flushL();
  return '<div class="body">' + outp.join("") + "</div>";
}
function renderPanel() {
  if (ex && exRender()) return;
  var p = $("panel");
  if (sel < 0) {
    p.innerHTML = '<div class="empty"><div class="explore-kicker">Your connected knowledge</div><h2>Follow a thought.</h2><p>Choose a memory in the library, find a note, or ask a question. Follow its evidence and see how it changed.</p><div class="actions">' + exButton('Explore memory', 'home') + '</div>' +
      '<div class="keys"><kbd>/</kbd><span>search</span><kbd>1</kbd><span>map</span><kbd>2</kbd><span>river: the map laid out along time</span><kbd>3</kbd><span>list</span><kbd>L</kbd><span>local view of the selected note</span><kbd>P</kbd><span>pulse from the selected note</span><kbd>Space</kbd><span>play the memory forward</span><kbd>Esc</kbd><span>clear</span></div></div>';
    return;
  }
  var n = notes[sel], h = [];
  if (ex && ex.notice) h.push('<p class="box" role="status">' + esc(ex.notice) + '</p>');
  h.push("<h2>" + esc(n.title) + "</h2>");
  if (n.subtitle) h.push('<p class="sub">' + esc(n.subtitle) + "</p>");
  var meta = ['<span class="kind' + (n.kind === "correction" ? " correction" : "") + '">' + esc(kindText(n)) + "</span>", "<span>" + esc(timeText(n)) + "</span>"];
  if (srcName(n)) meta.unshift('<span class="src">' + esc(srcName(n)) + "</span>");
  if (topics[n.topic]) meta.push('<button data-topic="' + n.topic + '">' + esc(topicName(n.topic)) + "</button>");
  if (n.chain) meta.push("<span>" + (n.chain === "chained" ? "hash-chained" : n.chain === "sealed-legacy" ? "sealed legacy row" : "not yet sealed") + "</span>");
  if (n.pinned) meta.push("<span>pinned</span>");
  if (!ledger) meta.push('<span class="mono">' + esc(n.id) + "</span>");
  h.push('<div class="meta">' + meta.join("") + "</div>");
  if (n.cause != null && n.effect != null) h.push('<dl class="ce"><dt>Cause</dt><dd>' + esc(n.cause) + "</dd><dt>Effect</dt><dd>" + esc(n.effect) + "</dd></dl>");
  if (n.kind === "correction" && (n.withdrawn || n.replacement)) {
    h.push('<div class="box red"><div class="h">What this correction retired</div>' +
      (n.withdrawn ? "<div>Withdrawn: " + n.withdrawn.map(function (w) { return '<s class="w">' + esc(w) + "</s>"; }).join(", ") + "</div>" : "") +
      (n.replacement && n.replacement.length ? "<div>Use instead: " + n.replacement.map(esc).join(", ") + "</div>" : "") + "</div>");
  }
  var fl = flagsOf[sel].filter(flagOn);
  if (fl.length) {
    h.push('<div class="box red"><div class="h">' + (fl.some(function (f) { return f.status === "reasserted"; }) ? "Writes back a withdrawn value" : "Carries a withdrawn value") + "</div>" +
      fl.map(function (f) { return '<div><s class="w">' + esc(f.term) + "</s> was withdrawn at " + (f.correction != null ? '<button class="tref" data-go="' + f.correction + '">t' + f.t + "</button>" : "t" + f.t) + (f.status === "reasserted" ? ", and this row was written after it" : "") + "</div>"; }).join("") + "</div>");
  }
  if (n.tags && n.tags.length) h.push('<div class="tags">' + n.tags.map(function (t) { return '<button data-q="' + esc(t) + '">' + esc(t) + "</button>"; }).join("") + "</div>");
  h.push('<div class="actions"><button class="btn" id="a-local">' + (local ? "Back to the whole map" : "Local view") + '</button><button class="btn" id="a-pulse">Pulse from here</button><button class="btn" id="a-copy">' + (ledger ? "Copy t" + n.time : "Copy [[link]]") + "</button></div>");
  h.push('<div class="actions">' + exButton('Trace evidence', 'trace') + exButton('Read source', 'source') + exButton('Copy context', 'brief') + (A.live && SRC[n.src] && /^L:/.test(SRC[n.src].id || '') ? exButton('Correct this note', 'correct') : '') + '</div>');
  if (pulse) {
    var reached = pulse.levels.slice(1), total = reached.reduce(function (s, l) { return s + l.length; }, 0);
    h.push('<div class="box"><div class="h">' + (total ? "Pulse reached " + total + " notes in " + reached.length + (reached.length === 1 ? " step" : " steps") : "Pulse reached nothing from here") + "</div>" +
      '<div class="hint">It follows recorded links and related notes outward. A brighter ring is a closer note.</div>' +
      reached.map(function (lv, k) { return "<div>Step " + (k + 1) + ": " + lv.slice(0, 6).map(function (j) { return '<button class="tref" data-go="' + j + '">' + esc(clip(notes[j].title, 38)) + "</button>"; }).join(", ") + (lv.length > 6 ? " and " + (lv.length - 6) + " more" : "") + "</div>"; }).join("") + "</div>");
  }
  h.push(renderBody(n));
  var groups = ledger ? [["What led here", []], ["What followed", []], ["Same thread", []], ["Corrections", []]] : [["Links to", []], ["Linked from", []], ["Corrections", []]];
  outL[sel].concat(inL[sel]).forEach(function (k) {
    var l = A.links[k], o = l.a === sel ? l.b : l.a, isOut = l.a === sel;
    if (!shown(o)) return;
    var extra = l.via ? "<span>via " + esc(clip(l.via, 40)) + "</span>" : "";
    if (CORR[l.type]) { groups[groups.length - 1][1].push(noteButton(o, '<span class="red">' + (l.type === "supersedes" ? (isOut ? "superseded by this" : "supersedes this") : isOut ? "retired a value in it" : "retired a value here") + "</span>")); return; }
    if (ledger) { if (l.type === "followed") groups[isOut ? 1 : 0][1].push(noteButton(o, extra)); else groups[2][1].push(noteButton(o, extra)); }
    else groups[isOut ? 0 : 1][1].push(noteButton(o, ""));
  });
  groups.forEach(function (g) { if (g[1].length) h.push("<h3>" + g[0] + " (" + g[1].length + ")</h3>" + g[1].join("")); });
  var rel = (A.related[sel] || []).filter(function (p) { return shown(p[0]) && !recPair[Math.min(sel, p[0]) + ":" + Math.max(sel, p[0])]; });
  h.push("<h3>Related, not linked (" + rel.length + ")</h3>");
  if (!rel.length) h.push('<p class="hint">Nothing unlinked comes close enough to call related.</p>');
  else {
    var mx = rel.reduce(function (m, p) { return Math.max(m, p[1]); }, 1);
    h.push('<p class="hint">Close in what they say, with no link recorded between them. The figure is how many times clearer the match is than two unrelated notes.</p>');
    rel.forEach(function (p) { h.push('<div class="rel">' + noteButton(p[0]) + '<div><div class="meter"><i style="width:' + Math.round(100 * p[1] / mx) + '%"></i></div><div class="v">' + p[1].toFixed(1) + "×</div></div></div>"); });
  }
  if (n.unresolved && n.unresolved.length) h.push("<h3>Links to notes that do not exist yet (" + n.unresolved.length + ')</h3><p class="hint">' + n.unresolved.map(esc).join(", ") + "</p>");
  p.innerHTML = h.join("");
  p.scrollTop = 0;
  $("a-local").onclick = function () { setLocal(!local); };
  $("a-pulse").onclick = startPulse;
  var bc = $("a-copy"); bc.onclick = function () { copyText(ledger ? "t" + n.time : "[[" + n.title + "]]", bc); };
}
function copyText(text, btn) {
  var label = btn.textContent, done = function () { btn.textContent = "Copied"; setTimeout(function () { btn.textContent = label; }, 1200); };
  var fallback = function () { var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e) {} ta.remove(); };
  try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
}
document.addEventListener("click", function (e) {
  var regionButton=e.target.closest('[data-region]');if(regionButton){exRegion(regionButton.getAttribute('data-region'));return;}
  var neighborhood=e.target.closest('[data-neighborhood]');if(neighborhood){exNeighborhood(neighborhood.getAttribute('data-neighborhood'));return;}
  var sourceButton = e.target.closest('[data-source]');
  if (sourceButton) { focusSource(+sourceButton.getAttribute('data-source')); return; }
  var go = e.target.closest("[data-go]");
  if (go) { e.preventDefault(); pairFocus = null; select(+go.getAttribute("data-go")); if (window.innerWidth <= 980 && go.closest(".rail")) document.body.classList.remove("rail-open"); return; }
  var tp = e.target.closest("[data-topic]");
  if (tp) { focusTopic(+tp.getAttribute("data-topic")); return; }
  var q = e.target.closest("[data-q]");
  if (q) { $("q").value = q.getAttribute("data-q"); runSearch(); if (window.innerWidth <= 980) document.body.classList.add("rail-open"); return; }
  var pr = e.target.closest("[data-pair]");
  if (pr) { var ab = pr.getAttribute("data-pair").split(","); exBridge(+ab[0], +ab[1]); return; }
});
function focusTopic(k) {
  topicFocus = topicFocus === k ? -1 : k;
  if (topicFocus >= 0) { if (view === "list") setView("map"); if (local) setLocal(false); var ids = []; for (var j = 0; j < N; j++) if (notes[j].topic === k && shown(j)) ids.push(j); fitTo(ids, 160); }
  renderRail(); renderList(); kick();
}
function focusSource(si) {
  sourceFocus = si; topicFocus = -1; select(-1); hover = -1;
  var ids = []; for(var j=0;j<N;j++) if(shown(j) && (si<0 || notes[j].src===si)) ids.push(j);
  if(view==='3d' && r3d) { if(si<0)r3d.reset();else r3d.focusGroup(ids); }
  else if(view!=='list') { if(si<0){cam={s:1,x:0,y:0};retarget(true);}else fitTo(ids,110); }
  renderRail();renderList();kick();document.body.classList.remove('rail-open');
}

// ---------------------------------------------------------------- rail
var results = $("results"), hits = [], hitSel = -1;
function runSearch() {
  var q = $("q").value;
  hits = search(q).slice(0, 40); hitSel = hits.length ? 0 : -1;
  matches = null;
  if (q.trim()) { matches = {}; hits.forEach(function (h) { matches[h.i] = 1; }); }
  results.innerHTML = hits.slice(0, 12).map(function (h, k) { return "<li>" + noteButton(h.i, topics[notes[h.i].topic] ? "<span>" + esc(topicName(notes[h.i].topic)) + "</span>" : "").replace('class="item"', 'class="item" aria-selected="' + (k === hitSel) + '"') + "</li>"; }).join("");
  $("searchhint").textContent = q.trim() ? (hits.length ? (hits.length > 12 ? "Showing 12 of " + hits.length + ". Matches are ringed in blue on the map." : "Matches are ringed in blue on the map.") : "Nothing matches that. Try a topic word" + (ledger ? " or a row number like t" + tmax + "." : ".")) : "";
  renderList(); kick();
}
$("q").addEventListener("input", runSearch);
$("q").addEventListener("keydown", function (e) {
  var n = Math.min(12, hits.length);
  if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (!n) return; hitSel = (hitSel + (e.key === "ArrowDown" ? 1 : -1) + n) % n; results.querySelectorAll(".item").forEach(function (b, k) { b.setAttribute("aria-selected", k === hitSel); }); }
  if (e.key === "Enter" && hitSel >= 0) { e.preventDefault(); select(hits[hitSel].i); }
  if (e.key === "Escape") { $("q").value = ""; runSearch(); $("q").blur(); }
});
function renderRail() {
  if($("region-list"))$("region-list").innerHTML=((A.knowledge||{}).regions||[]).map(function(r){var count=r.members.filter(shown).length;return count ? '<button class="item" data-region="'+esc(r.id)+'" aria-pressed="'+(ex.region===r.id && ex.mode==='region')+'" style="--region-color:'+r.color+'"><span class="region-dot"></span><span class="t">'+esc(r.label)+'</span><span class="m">'+count+'</span></button>' : '';}).join('');
  if ($('source-list')) {
    $('source-list').innerHTML = SRC.map(function(s,si){return '<button class="item" data-source="'+si+'" aria-pressed="'+(sourceFocus===si)+'"><span class="t">'+esc(s.name)+'</span><span class="m">'+notes.filter(function(n){return n.src===si && n.time<=T;}).length+'</span></button>';}).join('');
    var all = document.querySelector('[data-source="-1"]'); if(all)all.setAttribute('aria-pressed',sourceFocus<0);
  }
  var seen = {}, att = [];
  A.flags.forEach(function (f) { if (!flagOn(f) || !shown(f.note) || seen[f.note]) return; seen[f.note] = 1; att.push(f); });
  att.sort(function (a, b) { return (b.status === "reasserted") - (a.status === "reasserted") || notes[b.note].time - notes[a.note].time; });
  $("att-n").textContent = att.length;
  $("att").innerHTML = att.length ? att.slice(0, 60).map(function (f) { return "<li>" + noteButton(f.note, '<span class="red">' + (f.status === "reasserted" ? "wrote back " : "carries ") + "“" + esc(clip(f.term, 28)) + "”, withdrawn at t" + f.t + "</span>") + "</li>"; }).join("") : '<li class="hint">No note carries a value a correction withdrew.</li>';
  var sg = A.suggested.filter(function (s) { return shown(s[0]) && shown(s[1]); });
  $("sug-n").textContent = sg.length;
  $("sug").innerHTML = sg.length ? sg.slice(0, 40).map(function (s) { return '<li><button class="item" data-pair="' + s[0] + "," + s[1] + '"><span class="t">' + esc(clip(notes[s[0]].title, 60)) + '</span><span class="t">' + esc(clip(notes[s[1]].title, 60)) + '</span><span class="m"><span class="blue">' + s[2].toFixed(1) + "× clearer than unrelated notes</span></span></button></li>"; }).join("") : '<li class="hint">No unlinked pair is close enough to suggest.</li>';
  var tl = topics.map(function (t, k) { var c = 0; for (var j = 0; j < N; j++) if (notes[j].topic === k && shown(j)) c++; return [k, c]; }).filter(function (x) { return x[1]; });
  $("top-n").textContent = tl.length;
  $("top").innerHTML = tl.map(function (x) { return '<li><button class="item" data-topic="' + x[0] + '"' + (topicFocus === x[0] ? ' aria-selected="true"' : "") + '><span class="t">' + esc(topicName(x[0])) + '</span><span class="m"><span>' + x[1] + " notes</span></span></button></li>"; }).join("");
}
["recorded", "related", "corrections"].forEach(function (k) {
  var el = $("l-" + k); el.checked = layers[k];
  el.addEventListener("change", function () { layers[k] = el.checked; store.set("l:" + k, el.checked ? "1" : "0"); kick(); if (sel >= 0) renderPanel(); });
});

// ---------------------------------------------------------------- list view
var sortKey = store.get("sort") || "time", sortDir = store.get("dir") === "asc" ? 1 : -1;
function renderList() {
  if (view !== "list") return;
  var rows = [];
  for (var j = 0; j < N; j++) if (shown(j) && (!matches || matches[j]) && (topicFocus < 0 || notes[j].topic === topicFocus) && (sourceFocus < 0 || notes[j].src === sourceFocus)) rows.push(j);
  var val = function (j) { var n = notes[j]; return sortKey === "time" ? n.time : sortKey === "title" ? n.title.toLowerCase() : sortKey === "topic" ? topicName(n.topic) : sortKey === "links" ? degree[j] : sortKey === "related" ? (A.related[j] || []).length : sortKey === "flags" ? (flagged(j) ? 1 : 0) : sortKey === "src" ? srcName(n) : kindText(n); };
  rows.sort(function (a, b) { var x = val(a), y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * sortDir || notes[b].time - notes[a].time; });
  var cols = [["time", "When"], ["title", ledger ? "Row" : "Note"]].concat(brain ? [["src", "Memory"]] : []).concat([["topic", "Topic"], ["kind", "Kind"], ["links", "Links"], ["related", "Related"], ["flags", "Withdrawn value"]]);
  var head = "<tr>" + cols.map(function (c) { return '<th data-sort="' + c[0] + '"' + (sortKey === c[0] ? ' aria-sort="' + (sortDir > 0 ? "ascending" : "descending") + '"' : "") + ">" + c[1] + (sortKey === c[0] ? ' <span class="dir">' + (sortDir > 0 ? "up" : "down") + "</span>" : "") + "</th>"; }).join("") + "</tr>";
  var body = rows.slice(0, 1500).map(function (j) { var n = notes[j], fl = flagged(j); return '<tr data-go="' + j + '"' + (j === sel ? ' aria-selected="true"' : "") + '><td class="mono">' + esc(unit === "row" ? "t" + n.time : n.timeLabel) + '</td><td class="title">' + esc(clip(n.title, 120)) + "</td>" + (brain ? "<td class=\"topic\">" + esc(srcName(n)) + "</td>" : "") + "<td class=\"topic\">" + esc(topicName(n.topic)) + "</td><td>" + esc(kindText(n)) + "</td><td class=\"num\">" + degree[j] + "</td><td class=\"num\">" + (A.related[j] || []).length + "</td><td>" + (fl ? '<span class="red">' + esc(clip(fl.term, 24)) + "</span>" : "") + "</td></tr>"; }).join("");
  $("listview").innerHTML = '<table aria-label="All notes"><thead>' + head + "</thead><tbody>" + body + "</tbody></table>" + (rows.length > 1500 ? '<p class="hint" style="padding:0 12px">Showing 1,500 of ' + rows.length + ". Search to narrow it.</p>" : "");
}
function markList() { if (view === "list") renderList(); }
$("listview").addEventListener("click", function (e) {
  var th = e.target.closest("th[data-sort]"); if (!th) return;
  var k = th.getAttribute("data-sort"); if (k === sortKey) sortDir = -sortDir; else { sortKey = k; sortDir = k === "title" || k === "topic" ? 1 : -1; }
  store.set("sort", sortKey); store.set("dir", sortDir > 0 ? "asc" : "desc"); renderList();
});

// ---------------------------------------------------------------- views, theme, keys, resize
function setView(v) {
  if (v === "3d" && !ensure3d()) v = "map";
  view = v; store.set("view", v);
  $("cv3").hidden = v !== "3d"; $("labels3").hidden = v !== "3d";
  document.querySelectorAll(".seg button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-view") === v); });
  $("listview").classList.toggle("on", v === "list");
  cv.style.visibility = v === "list" || v === "3d" ? "hidden" : "visible";
  $("legend").style.display = v === "list" ? "none" : "";
  $("zoombox").style.display = v === "list" ? "none" : "";
  if (v === "list") { if (local) { local = false; $("localbar").classList.remove("on"); } renderList(); }
  cam = { s: 1, x: 0, y: 0 };
  retarget(true);
}
document.querySelectorAll(".seg button").forEach(function (b) { b.addEventListener("click", function () { setView(b.getAttribute("data-view")); }); });
$("theme").addEventListener("click", function () {
  var cur = document.documentElement.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  var next = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next); store.set("theme", next); readColors(); drawSpark(); kick();
});
if (window.matchMedia) try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () { readColors(); drawSpark(); kick(); }); } catch (e) {}
$("zin").addEventListener("click", function () { if (view === "3d" && r3d) r3d.zoom(1.4); else zoomAt(W / 2, H / 2, 1.4); });
$("zout").addEventListener("click", function () { if (view === "3d" && r3d) r3d.zoom(1 / 1.4); else zoomAt(W / 2, H / 2, 1 / 1.4); });
$("zfit").addEventListener("click", function () { if (view === "3d" && r3d) { r3d.reset(); return; } cam = { s: 1, x: 0, y: 0 }; if (!local) retarget(true); kick(); });
$("localexit").addEventListener("click", function () { setLocal(false); });
$("railbtn").addEventListener("click", function () { document.body.classList.toggle("rail-open"); document.body.classList.remove("panel-open"); });
$("panelbtn").addEventListener("click", function () { document.body.classList.toggle("panel-open"); document.body.classList.remove("rail-open"); });
$("scrim").addEventListener("click", function () { document.body.classList.remove("rail-open", "panel-open"); });
document.addEventListener("keydown", function (e) {
  var t = e.target, typing = (t.tagName === "INPUT" && t.type !== "range" && t.type !== "checkbox") || t.tagName === "TEXTAREA";
  if ((e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) && !typing) { e.preventDefault(); if (window.innerWidth <= 980) document.body.classList.add("rail-open"); $("q").focus(); $("q").select(); return; }
  if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'Escape' && document.body.classList.contains('presenting')) { document.body.classList.remove('presenting'); resize(); return; }
  if (e.key === 'Escape' && ex && ex.mode) { exClear(); renderPanel(); kick(); return; }
  if (e.key === 'Escape' && sourceFocus >= 0) { focusSource(-1); return; }
  if (e.key === "Escape" && growth) { endGrowth(); return; }
  if (e.key === "Escape") { if (pulse) { pulse = null; renderPanel(); kick(); } else if (local) setLocal(false); else if (topicFocus >= 0) { topicFocus = -1; renderRail(); renderList(); kick(); } else if (pairFocus) { pairFocus = null; kick(); } else select(-1); document.body.classList.remove("rail-open", "panel-open"); return; }
  if (e.key === "1") setView("map"); else if (e.key === "2") setView("river"); else if (e.key === "3") setView("list"); else if (e.key === "4") setView("3d");
  else if (e.key === "l" || e.key === "L") setLocal(!local);
  else if (e.key === "p" || e.key === "P") startPulse();
  else if (e.key === " " && t.tagName !== "BUTTON") { e.preventDefault(); togglePlay(); }
  else if (e.key === "+" || e.key === "=") zoomAt(W / 2, H / 2, 1.3);
  else if (e.key === "-") zoomAt(W / 2, H / 2, 1 / 1.3);
});
function resize() {
  if (ex && ex.mode && window.innerWidth <= 980 && !document.body.classList.contains('presenting')) document.body.classList.add('panel-open');
  var r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
  W = Math.max(1, r.width); H = Math.max(1, r.height);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  computeTargets(); if (!anim) { pos.set(target); vis.set(visTo); }
  if (r3d) r3d.resize();
  drawSpark(); kick();
}
window.addEventListener("resize", resize);

// ---------------------------------------------------------------- 3-D view (Atlas3D is bundled with three.js ahead of this script)
var r3d = null;
var host = {
  get A() { return A; }, get E() { return E; }, get N() { return N; }, get fire() { return fire; }, get signals() { return signals; }, get degree() { return degree; },
  state: function () { return { sel: sel, hover: hover, T: T, el: lastEl, growth: growth, layers: layers, matches: matches, fs: focusSet(), dark: isDark(), C: C, exploration: ex }; },
  shown: function (j) { return shown(j); }, sal: function (j) { return sal(j); }, isBorn: function (j, el) { return isBorn(j, el); },
  edgeGrow: function (e, el) { return edgeGrow(e, el); }, flagged: function (j) { return flagged(j); },
  select: function (j) { if (j >= 0) select(j, { center: false }); else if (sel >= 0) select(-1); },
  kick: kick,
  hover: function (j, x, y) { if (j !== hover) hover = j; if (j >= 0 && x != null) showTip(j, x, y); else showTip(-1); }
};
function ensure3d() {
  if (r3d) return true;
  if (!window.Atlas3D || !Atlas3D.supported()) { var b3 = document.querySelector('.seg button[data-view="3d"]'); if (b3) b3.hidden = true; return false; }
  try { r3d = Atlas3D.create({ canvas: $("cv3"), overlay: $("labels3"), host: host, reducedMotion: reduceMotion }); }
  catch (e) { r3d = null; return false; }
  return true;
}

// ---------------------------------------------------------------- live updates from the server (atlas serve)
function noteKey(n) { return (n.src == null ? "" : n.src + ":") + n.id; }
function swap(data, info) {
  if (ex && ex.mode === 'correct') { ex.pendingUpdate = [data, info]; renderHeader('New memory available; your correction draft is preserved'); return; }
  var keepEx = ex && ex.mode;
  var keepSel = sel >= 0 ? noteKey(notes[sel]) : null, atEnd = T >= tmax, old = {};
  notes.forEach(function (n) { old[noteKey(n)] = 1; });
  var view3 = r3d ? r3d.getView() : null;
  load(data);
  if (ex) { exClear(); if (keepEx === 'home') ex.mode = 'home'; }
  when.min = tmin; when.max = tmax; T = atEnd ? tmax : Math.min(T, tmax); when.value = T;
  sel = -1; hover = -1; topicFocus = -1; pairFocus = null; pulse = null;
  if (keepSel) for (var j = 0; j < N; j++) if (noteKey(notes[j]) === keepSel) { sel = j; break; }
  var fresh = []; notes.forEach(function (n, k) { if (!old[noteKey(n)]) fresh.push(k); });
  fresh.sort(function (a, b) { return notes[a].time - notes[b].time || a - b; });
  if (fresh.length && fresh.length < N) {
    var born = new Float64Array(N).fill(-1e9);
    fresh.forEach(function (k, idx) { born[k] = 250 + idx * 160; });
    var last = notes[fresh[fresh.length - 1]];
    growth = { t0: performance.now(), born: born, order: fresh.slice(), next: 0, lobeAt: SRC.map(function () { return -1e9; }), fibreAt: -1e9, end: 250 + fresh.length * 160 + 1400, live: true,
      label: (fresh.length === 1 ? "New in " : fresh.length + " new, latest in ") + (srcName(last) || "memory") + ": " + clip(last.title, 70) };
    if (growBar) growBar.classList.add("on");
  }
  weights = null; computeTargets(); pos.set(target); vis.set(visTo);
  if (r3d) { r3d.dispose(); r3d = null; if (view === "3d" && ensure3d() && view3) r3d.setView(view3); }
  runSearch(); renderRail(); renderPanel(); renderList(); drawSpark(); renderHeader(info);
  kick();
}
function renderHeader(info) {
  var c = $("count"); if (c) c.textContent = brain ? N.toLocaleString("en-US") + " notes from " + SRC.length + " memories" : N + (ledger ? " rows" : " notes") + " in " + topics.length + " topics";
  var st = $("livestatus"); if (st && info) st.textContent = info;
}
function connectLive() {
  if (!A.live || !window.EventSource) return;
  var ids = new URLSearchParams(location.search).get("ids") || "", es = new EventSource("/events"), busy = false, again = false;
  var st = function (t) { renderHeader(t); };
  es.addEventListener("hello", function (ev) { try { var d = JSON.parse(ev.data); st("Live, watching " + d.watching + " memories"); } catch (e) {} });
  es.addEventListener("update", function (ev) {
    var d = {}; try { d = JSON.parse(ev.data); } catch (e) {}
    if (busy) { again = true; return; }
    busy = true;
    (function pull() {
      fetch("/api/brain?ids=" + encodeURIComponent(ids), { credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (data) {
        swap(data, "Live, updated " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + (d.source ? " from " + d.source : ""));
      }).catch(function () { st("Live, the last update could not be read"); }).then(function () { busy = false; if (again) { again = false; busy = true; pull(); } });
    })();
  });
  es.onerror = function () { st("Reconnecting to the memory server"); };
}

function setLiveIcon() { var b = $("livebtn"); if (!b) return; b.setAttribute("aria-pressed", liveOn); b.setAttribute("aria-label", liveOn ? "Pause ambient motion" : "Play ambient motion"); if(r3d)r3d.setAutoRotate(liveOn); }
if ($("livebtn")) $("livebtn").addEventListener("click", function () { liveOn = !liveOn; store.set("live", liveOn ? "1" : "0"); setLiveIcon(); kick(); });
if ($("growskip")) $("growskip").addEventListener("click", endGrowth);

${EXPLORE_JS}
${EXPLORE_UI}

// Private hosted imports & auto-find connector
async function fillFromEntries(entries, label) {
  var status = $('workspace-status');
  if (status) status.textContent = 'Building your private workspace from ' + (label || 'memory') + '...';
  try {
    if (entries.reduce(function(s, f) { return s + f.text.length; }, 0) > 20000000) throw Error('Choose files totaling less than 20 MB.');
    await new Promise(function(resolve) { setTimeout(resolve, 30); });
    var data = AtlasImport.importMemories(entries);
    privateStore = Object.create(null);
    lastVisit = null;
    sourceFocus = -1;
    sel = -1;
    exClear();
    growth = null;
    signals = [];
    if ($('q')) $('q').value = '';
    swap(data, 'Private workspace: ' + (label || 'imported'));
    $('atlas-data').textContent = '';
    history.replaceState(null, '', location.pathname);
    var h1 = document.querySelector('.bar h1');
    if (h1) h1.textContent = 'Private workspace';
    if (status) status.textContent = data.notes.length + ' memories loaded from ' + (label || 'ledger') + '. Nothing uploaded. Reload or clear to remove.';
    if (r3d) r3d.reset();
  } catch (e) {
    if (status) status.textContent = e.message;
  }
}

if ($('memory-files')) $('memory-files').onchange = async function() {
  var input = this, files = Array.from(input.files || []);
  if (!files.length) return;
  input.disabled = true;
  try {
    var entries = await Promise.all(files.map(async function(f) { return { name: f.name, text: await f.text() }; }));
    await fillFromEntries(entries, files.map(function(f) { return f.name; }).join(', '));
  } finally {
    input.disabled = false;
    input.value = '';
  }
};

async function scanDirectoryForLedger(dirHandle) {
  try {
    var mp = await dirHandle.getDirectoryHandle('.memory-pulse');
    var fh = await mp.getFileHandle('events.jsonl');
    var f = await fh.getFile();
    return { name: dirHandle.name + '/.memory-pulse/events.jsonl', text: await f.text() };
  } catch (e) {}
  try {
    var led = await dirHandle.getDirectoryHandle('ledger');
    var fh = await led.getFileHandle('events.jsonl');
    var f = await fh.getFile();
    return { name: dirHandle.name + '/ledger/events.jsonl', text: await f.text() };
  } catch (e) {}
  try {
    var fh = await dirHandle.getFileHandle('events.jsonl');
    var f = await fh.getFile();
    return { name: dirHandle.name + '/events.jsonl', text: await f.text() };
  } catch (e) {}
  for await (var entry of dirHandle.values()) {
    if (entry.kind === 'directory' && !['node_modules', '.git', 'dist', 'build', '.wrangler'].includes(entry.name)) {
      try {
        var subMp = await entry.getDirectoryHandle('.memory-pulse');
        var fh = await subMp.getFileHandle('events.jsonl');
        var f = await fh.getFile();
        return { name: entry.name + '/.memory-pulse/events.jsonl', text: await f.text() };
      } catch (e) {}
    }
  }
  return null;
}

if ($('autofind-btn')) $('autofind-btn').onclick = async function() {
  var status = $('workspace-status');
  if (window.showDirectoryPicker) {
    try {
      var dir = await window.showDirectoryPicker({ id: 'memory-pulse-project', mode: 'read' });
      if (status) status.textContent = 'Scanning ' + dir.name + ' for memory ledger...';
      var found = await scanDirectoryForLedger(dir);
      if (found) {
        await fillFromEntries([found], found.name);
      } else {
        if (status) status.textContent = 'No .memory-pulse/events.jsonl found in ' + dir.name;
      }
    } catch (e) {
      if (e.name !== 'AbortError' && status) status.textContent = e.message;
    }
  } else if ($('memory-files')) {
    $('memory-files').click();
  }
};

if ($('clipboard-fill-btn')) $('clipboard-fill-btn').onclick = async function() {
  var status = $('workspace-status');
  try {
    if (!navigator.clipboard || !navigator.clipboard.readText) throw Error('Clipboard API not available');
    var clip = await navigator.clipboard.readText();
    if (!clip || !clip.trim()) throw Error('Clipboard is empty');
    await fillFromEntries([{ name: 'clipboard.jsonl', text: clip.trim() }], 'clipboard');
  } catch (e) {
    if (status) status.textContent = e.message;
  }
};

window.addEventListener('dragover', function(e) {
  if (e.dataTransfer && e.dataTransfer.types && (e.dataTransfer.types.includes('Files') || e.dataTransfer.types.includes('text/plain'))) {
    e.preventDefault();
  }
});

window.addEventListener('drop', async function(e) {
  if (!e.dataTransfer) return;
  e.preventDefault();
  if (e.dataTransfer.items && e.dataTransfer.items.length) {
    var items = Array.from(e.dataTransfer.items);
    for (var item of items) {
      var entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
      if (entry) {
        if (entry.isFile && (entry.name.endsWith('.jsonl') || entry.name.endsWith('.json'))) {
          var f = await new Promise(function(res) { entry.file(res); });
          await fillFromEntries([{ name: f.name, text: await f.text() }], f.name);
          return;
        } else if (entry.isDirectory) {
          var reader = entry.createReader();
          var subEntries = await new Promise(function(res) { reader.readEntries(res); });
          for (var sub of subEntries) {
            if (sub.name === '.memory-pulse' && sub.isDirectory) {
              var mpReader = sub.createReader();
              var mpFiles = await new Promise(function(res) { mpReader.readEntries(res); });
              var evFile = mpFiles.find(function(x) { return x.name === 'events.jsonl'; });
              if (evFile) {
                var f = await new Promise(function(res) { evFile.file(res); });
                await fillFromEntries([{ name: entry.name + '/.memory-pulse/events.jsonl', text: await f.text() }], entry.name);
                return;
              }
            }
            if (sub.name === 'events.jsonl' && sub.isFile) {
              var f = await new Promise(function(res) { sub.file(res); });
              await fillFromEntries([{ name: entry.name + '/events.jsonl', text: await f.text() }], entry.name);
              return;
            }
          }
        }
      }
    }
  }
  if (e.dataTransfer.files && e.dataTransfer.files.length) {
    var files = Array.from(e.dataTransfer.files).filter(function(f) { return f.name.endsWith('.jsonl') || f.name.endsWith('.json'); });
    if (files.length) {
      var entries = await Promise.all(files.map(async function(f) { return { name: f.name, text: await f.text() }; }));
      await fillFromEntries(entries, files.map(function(f) { return f.name; }).join(', '));
    }
  }
});
if($('clear-workspace'))$('clear-workspace').onclick=function(){location.replace(location.pathname);};
if($('export-workspace'))$('export-workspace').onclick=function(){
  var data=Object.assign({},A,{live:false}),blob=new Blob([JSON.stringify(data)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='memory-atlas.json';a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);
};
// ---------------------------------------------------------------- start
(function () { var t = store.get("theme"); if (t === "dark" || t === "light") document.documentElement.setAttribute("data-theme", t); else if (brain) document.documentElement.setAttribute("data-theme", "dark"); })();
readColors();
setPlayIcon();
if (brain && !store.get("view") && window.Atlas3D && Atlas3D.supported()) view = "3d";
if (view === "3d" && !ensure3d()) view = "map";
if (!(window.Atlas3D && Atlas3D.supported())) { var b3 = document.querySelector('.seg button[data-view="3d"]'); if (b3) b3.hidden = true; }
document.querySelectorAll(".seg button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-view") === view); });
$("listview").classList.toggle("on", view === "list");
cv.style.visibility = view === "list" || view === "3d" ? "hidden" : "visible";
$("cv3").hidden = view !== "3d"; $("labels3").hidden = view !== "3d";
resize();
setT(tmax);
renderPanel();
var h0 = ""; try { h0 = decodeURIComponent((location.hash || "").slice(1)); } catch (e) {}
if (h0) for (var q0 = 0; q0 < N; q0++) if (String(notes[q0].id) === h0) { select(q0); break; }
setLiveIcon();
if (brain && (A.intro || /[?&]grow=1/.test(location.search)) && !h0) { growth = planGrowth(); if (growth && growBar) growBar.classList.add("on"); kick(); }
connectLive();
window.__atlasReady = true;
})();
`;
